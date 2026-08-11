"""
submission_service.py
---------------------
High-level service for recording Java code submissions and maintaining
per-user, per-topic learning statistics in MongoDB.

Public API
----------
  detect_topic_from_error(error_message) -> str
  save_submission(user_id, code, topic, error_type,
                  error_message, hints_used, resolved) -> str
"""

from datetime import datetime
from database import insert_submission, upsert_topic_stat, get_topic_stat

# ---------------------------------------------------------------------------
# Topic detection
# ---------------------------------------------------------------------------

# Maps substrings that appear in Java error messages to learning topics.
# Checked in order — put more specific patterns before broader ones.
_ERROR_TOPIC_MAP = [
    # Arrays
    ("ArrayIndexOutOfBoundsException",  "arrays"),
    ("NegativeArraySizeException",       "arrays"),
    ("array",                            "arrays"),

    # Null / object handling
    ("NullPointerException",             "object_handling"),
    ("cannot dereference",               "object_handling"),

    # Type / casting
    ("ClassCastException",               "type_casting"),
    ("incompatible types",               "type_casting"),

    # Loops
    ("for loop",                         "loops"),
    ("while loop",                       "loops"),

    # Methods / return
    ("missing return statement",         "methods"),
    ("return type",                      "methods"),
    ("method",                           "methods"),

    # Variables / scope / symbols
    ("cannot find symbol",               "variables"),
    ("variable",                         "variables"),
    ("undefined",                        "variables"),

    # Conditions / logic
    ("if statement",                     "conditions"),
    ("boolean",                          "conditions"),

    # OOP
    ("cannot instantiate",               "oop"),
    ("abstract class",                   "oop"),
    ("interface",                        "oop"),
    ("extends",                          "oop"),

    # Exceptions (general)
    ("Exception",                        "exceptions"),
    ("throws",                           "exceptions"),
    ("catch",                            "exceptions"),

    # Syntax
    ("';' expected",                     "syntax"),
    ("illegal start of expression",      "syntax"),
    ("reached end of file",              "syntax"),
]

_DEFAULT_TOPIC = "general"


def detect_topic_from_error(error_message: str) -> str:
    """
    Map a Java compiler / runtime error message to a learning topic.

    Iterates _ERROR_TOPIC_MAP and returns the first matching topic.
    Falls back to 'general' when no pattern matches.

    Args:
        error_message: Raw stderr / exception text from the Java engine.

    Returns:
        A lowercase topic string, e.g. 'arrays', 'variables', 'loops'.
    """
    if not error_message:
        return _DEFAULT_TOPIC

    lowered = error_message.lower()
    for pattern, topic in _ERROR_TOPIC_MAP:
        if pattern.lower() in lowered:
            return topic

    return _DEFAULT_TOPIC


# ---------------------------------------------------------------------------
# Submission saving
# ---------------------------------------------------------------------------

def save_submission(
    user_id: str,
    code: str,
    topic: str,
    error_type: str,
    error_message: str,
    hints_used: int,
    resolved: bool,
    llm_response: str = "",
    hallucination_flag: bool = False,
    confidence_score: float = None,
    user_feedback: str = "not_given",
    submission_type: str = "submit",
    problem_id: int = None,
    problem_title: str = None,
    problem_topic: str = None,
    problem_difficulty: str = None,
    wrong_output: bool = False,
) -> str:
    """
    Persist a single Java submission and (for real submits only) update the
    user's topic statistics.

    Write rules:
      - submission_type == "submit" : insert the doc AND refresh topic_stats.
      - submission_type == "run"    : insert the doc only (mastery signal is
                                      reserved for real submits).

    Args:
        user_id:       String identifier of the student.
        code:          The Java source code submitted.
        topic:         Learning topic (from detect_topic_from_error or caller).
        error_type:    Short error category, e.g. 'NullPointerException'.
        error_message: Full error text returned by the Java engine.
        hints_used:    Number of hints the student consumed this session.
        resolved:      True if the student fixed the bug in this attempt.
        llm_response:  Actual LLM response shown to the student.
        hallucination_flag: True if the response was incorrect/misleading.
        confidence_score: Confidence score in range [0, 1] from validator.
        user_feedback: One of 'correct', 'incorrect', 'not_given'.
        submission_type: "run" | "submit". Topic stats update only when
                         this is "submit".
        problem_id:    Catalog id of the problem being attempted (submit only).
        problem_title: Human-readable problem title (submit only).
        problem_topic: Canonical catalog topic (e.g. "Java Basics", "Loops").
                       This is the *frontend* topic name and is used for all
                       Dashboard / Progress aggregation. Distinct from the
                       error-derived `topic` arg, which is only used for the
                       weak/improving/strong mastery signal.
        wrong_output:  True when the program compiled and ran cleanly but
                       printed the wrong result. We still insert the doc
                       (so the Solved tile denominator counts the attempt)
                       but skip the topic_stats mastery update — wrong
                       output is a logic miss, not a concept error, and
                       shouldn't push a topic toward "weak" status.

    Returns:
        The MongoDB _id string of the newly inserted submission document.
    """
    # ------------------------------------------------------------------
    # 1. Store the submission (always — runs too, for error telemetry)
    # ------------------------------------------------------------------
    now = datetime.utcnow()
    normalized_type = submission_type if submission_type in ("run", "submit") else "submit"

    doc = {
        "user_id":         user_id,
        "code":            code,
        "detected_topic":  topic,
        "error_type":      error_type,
        "error_message":   error_message,
        "hints_used":      hints_used,
        "resolved":        resolved,
        "wrong_output":    bool(wrong_output),
        "llm_response":    llm_response,
        "hallucination_flag": hallucination_flag,
        "confidence_score": confidence_score,
        "user_feedback":   user_feedback,
        "submission_type": normalized_type,
        "problem_id":      problem_id,
        "problem_title":   problem_title,
        "problem_topic":   problem_topic,
        "problem_difficulty": problem_difficulty,
        "timestamp":       now,
    }
    submission_id = insert_submission(doc)

    # ------------------------------------------------------------------
    # 2. Mastery signal: only real submits update topic_stats, and
    #    never for wrong-output attempts (logic miss ≠ concept error).
    # ------------------------------------------------------------------
    if normalized_type != "submit" or wrong_output:
        return submission_id

    # $inc counters based on whether this attempt was successful
    inc_fields = {"total_errors": 0, "successful_attempts": 0}
    if resolved:
        inc_fields["successful_attempts"] = 1
    else:
        inc_fields["total_errors"] = 1

    # Keep a rolling window of the last 10 attempt outcomes (True/False)
    upsert_topic_stat(
        user_id, topic,
        {
            "$inc": inc_fields,
            "$push": {
                "recent_attempts": {
                    "$each":  [resolved],
                    "$slice": -10          # retain only the last 10
                }
            },
            "$setOnInsert": {              # set defaults only on first insert
                "status": "weak"
            }
        }
    )

    # Recalculate and persist the status label
    _refresh_topic_status(user_id, topic)

    return submission_id


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _refresh_topic_status(user_id: str, topic: str):
    """
    Re-evaluate the status label ('weak' | 'improving' | 'strong') for
    a given (user_id, topic) based on the latest counters and write it
    back to MongoDB.

    Rules (in priority order):
      STRONG    : successful_attempts >= 8  AND  error_rate < 30 %
      IMPROVING : (was weak before) AND last 3 recent_attempts are all True
      WEAK      : total_errors >= 5  AND  successful_attempts < 3
      default   : keep existing status (or 'weak' for new topics)
    """
    stat = get_topic_stat(user_id, topic)
    if stat is None:
        return  # nothing to update yet

    total_errors        = stat.get("total_errors", 0)
    successful_attempts = stat.get("successful_attempts", 0)
    recent_attempts     = stat.get("recent_attempts", [])
    current_status      = stat.get("status", "weak")

    total_attempts = total_errors + successful_attempts
    error_rate = (total_errors / total_attempts * 100) if total_attempts > 0 else 100

    # Evaluate new status
    if successful_attempts >= 8 and error_rate < 30:
        new_status = "strong"
    elif (
        current_status == "weak"
        and len(recent_attempts) >= 3
        and all(recent_attempts[-3:])   # last 3 were all successful
    ):
        new_status = "improving"
    elif total_errors >= 5 and successful_attempts < 3:
        new_status = "weak"
    else:
        new_status = current_status     # no change

    upsert_topic_stat(
        user_id, topic,
        {"$set": {"status": new_status}}
    )
