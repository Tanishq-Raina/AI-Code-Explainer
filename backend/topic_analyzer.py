"""
topic_analyzer.py
-----------------
Analyses per-user topic statistics stored in MongoDB and classifies
each topic as weak, improving, or strong.

Public API
----------
  detect_weak_topics(user_id)      -> list[str]
  detect_improving_topics(user_id) -> list[str]
  get_learning_summary(user_id)    -> dict
"""

from datetime import date, timedelta

from database import (
    get_active_dates_for_user,
    get_all_topic_stats,
    get_error_counts_for_user,
    get_recent_submissions_for_user,
    get_solved_problem_ids_by_topic,
    get_submit_attempts_for_user,
    get_topic_performance_for_user,
)
from encouragement_engine import generate_all_encouragements

# ---------------------------------------------------------------------------
# Classification thresholds (single place to tune)
# ---------------------------------------------------------------------------

WEAK_MIN_ERRORS             = 5    # total_errors must reach this
WEAK_MAX_SUCCESSES          = 3    # successful_attempts must be below this

IMPROVING_RECENT_WINDOW     = 3    # how many recent attempts to examine
IMPROVING_REQUIRED_SUCCESS  = 3    # all of the window must be successful

STRONG_MIN_SUCCESSES        = 8    # successful_attempts must reach this
STRONG_MAX_ERROR_RATE       = 30   # error_rate (%) must stay below this

# ---------------------------------------------------------------------------
# Hint-weighted success rate
# ---------------------------------------------------------------------------
# A successful submission is rewarded less if the student needed hints
# to get there. The weight curve is:
#
#     0 hints → 1.0     (full credit)
#     1 hint  → 0.7
#     2 hints → 0.4
#     3 hints → 0.1
#     4+      → 0.0     (clamped)
#
# Failures always contribute 0. success_rate is the average weighted
# credit across all 'submit'-type attempts.

HINT_WEIGHT_STEP = 0.3


def _hint_weight(hints_used: int) -> float:
    """Credit weight for a solved submission given how many hints were used."""
    return max(0.0, 1.0 - HINT_WEIGHT_STEP * max(0, int(hints_used or 0)))


# ---------------------------------------------------------------------------
# Codexa Insight — advice tables
# ---------------------------------------------------------------------------
# The Progress page's "Codexa Insight" banner reads one structured insight
# from the backend per request. We pick a focus in priority order:
#   1. A dominant error type (the student keeps hitting the same wall)
#   2. A weak detected_topic (the analyzer has flagged a concept area)
#   3. Positive reinforcement on a high success rate
#   4. A neutral onboarding message
#
# Advice strings live here so they can be tuned without touching logic.

_ERROR_ADVICE = {
    "ArrayIndexOutOfBoundsException": {
        "headline": "You're hitting array bounds errors ({count} times)",
        "detail":   "Java arrays are zero-indexed and loops that use `<=` or `arr.length` instead of `< arr.length` will walk off the end. Revisit bounds checking and loop conditions.",
        "topic":    "arrays",
    },
    "NullPointerException": {
        "headline": "Null pointer errors keep tripping you ({count} times)",
        "detail":   "Something is being used before it's initialized. Revisit object construction, null checks, and array/string initialization.",
        "topic":    "general",
    },
    "NumberFormatException": {
        "headline": "Input parsing is failing ({count} times)",
        "detail":   "Integer.parseInt throws when the string isn't a clean integer. Revisit input validation and try/catch around parsing.",
        "topic":    "general",
    },
    "CompilationError": {
        "headline": "Syntax errors are stalling you ({count} times)",
        "detail":   "Missing semicolons, unmatched braces, or wrong method signatures. Revisit Java syntax fundamentals and read the compiler error line by line.",
        "topic":    "syntax",
    },
    "ArithmeticException": {
        "headline": "Arithmetic edge cases ({count} times)",
        "detail":   "Usually this is integer division by zero. Revisit how to guard math operations against edge inputs.",
        "topic":    "general",
    },
    "StackOverflowError": {
        "headline": "Recursion is running away ({count} times)",
        "detail":   "A recursive call is missing or never reaching its base case. Revisit recursion base cases and termination conditions.",
        "topic":    "general",
    },
    "_default": {
        "headline": "Runtime errors are slowing you down",
        "detail":   "Read the stack trace top to bottom — the first line tells you what blew up, and the line numbers tell you where.",
        "topic":    "general",
    },
}

_TOPIC_ADVICE = {
    "arrays":  "Arrays are zero-indexed, and their length is fixed at creation. Revise declaring, iterating, and bounds.",
    "loops":   "Loop control has three moving parts — init, condition, increment. Off-by-one and infinite loops are the usual culprits.",
    "syntax":  "Revisit the basics: semicolons end statements, braces delimit blocks, and every class needs a proper main signature.",
    "general": "Go back to one easy problem in your weakest area to rebuild confidence.",
    "_default":"Pick one easy problem in this topic and solve it hint-free — that rebuilds intuition fastest.",
}


def _build_insight(weak_topics, error_breakdown, total_submissions, total_submits, success_rate):
    """
    Build the single structured insight that powers the Progress page's
    Codexa Insight banner.

    Args:
      weak_topics       — detected_topic names flagged as weak
      error_breakdown   — [{type, count}] of failed attempts (runs + submits)
      total_submissions — overall submission count (runs + submits), used
                          to detect "truly empty" state
      total_submits     — submit-type count, used for positive
                          reinforcement gating
      success_rate      — hint-weighted submit success rate

    Returns a dict with:
      headline     — short one-liner for the banner title
      detail       — full sentence with the 'why' and 'what to revise'
      focus_topic  — detected_topic name driving the insight (or None)
      focus_error  — error_type name if error-driven (or None)
      severity     — "high" | "medium" | "low" | "none"
    """
    # 1. Onboarding — only when there's truly no signal anywhere.
    # A user who's clicked Run 3 times and hit the same error deserves
    # real advice, not a blank welcome message.
    if not total_submissions and not error_breakdown:
        return {
            "headline":    "Write your first line of Java",
            "detail":      "Run or submit any problem to start building your learning profile.",
            "focus_topic": None,
            "focus_error": None,
            "severity":    "none",
        }

    # 2. Error-driven — strongest signal if one error type dominates
    if error_breakdown:
        top = max(error_breakdown, key=lambda e: e["count"])
        total_errors = sum(e["count"] for e in error_breakdown)
        if top["count"] >= 3 or (total_errors and top["count"] / total_errors >= 0.5):
            advice = _ERROR_ADVICE.get(top["type"], _ERROR_ADVICE["_default"])
            return {
                "headline":    advice["headline"].format(count=top["count"]),
                "detail":      advice["detail"],
                "focus_topic": advice.get("topic"),
                "focus_error": top["type"],
                "severity":    "high",
            }

    # 3. Topic-driven — fall back to the weakest detected topic
    if weak_topics:
        topic = weak_topics[0]
        return {
            "headline":    f"Your {topic} fundamentals need attention",
            "detail":      _TOPIC_ADVICE.get(topic, _TOPIC_ADVICE["_default"]),
            "focus_topic": topic,
            "focus_error": None,
            "severity":    "medium",
        }

    # 4. Positive reinforcement — only meaningful once the student
    # has actually submitted something (runs don't feed success_rate).
    if total_submits and success_rate >= 0.8:
        return {
            "headline":    "You're on a roll",
            "detail":      "Your recent submissions have been clean. Try a harder problem to keep growing.",
            "focus_topic": None,
            "focus_error": None,
            "severity":    "low",
        }

    return {
        "headline":    "Keep practicing",
        "detail":      "Not enough error signal yet to recommend a specific concept — keep submitting and I'll learn with you.",
        "focus_topic": None,
        "focus_error": None,
        "severity":    "low",
    }


# ---------------------------------------------------------------------------
# Streak computation
# ---------------------------------------------------------------------------

def _compute_streaks(active_date_strings: list) -> dict:
    """
    Turn a sorted list of YYYY-MM-DD strings into a streak summary:

      {
        "current":      <int — streak ending today (or yesterday)>,
        "longest":      <int — longest consecutive run in the history>,
        "active_dates": <list of ISO date strings, deduped + sorted>
      }

    Rules:
      * 'current' only counts if the user is active today OR yesterday,
        so Monday's streak survives until Tuesday night.
      * Two same-day submissions don't double-count — dates are deduped
        before the math runs.
    """
    if not active_date_strings:
        return {"current": 0, "longest": 0, "active_dates": []}

    days = sorted({date.fromisoformat(s) for s in active_date_strings})

    # Longest run: walk the sorted list, reset on any gap > 1.
    longest = 1
    run = 1
    for i in range(1, len(days)):
        if (days[i] - days[i - 1]) == timedelta(days=1):
            run += 1
            longest = max(longest, run)
        else:
            run = 1

    # Current run: must anchor at today or yesterday, else it's broken.
    today = date.today()
    yesterday = today - timedelta(days=1)
    last = days[-1]

    if last == today:
        anchor = today
    elif last == yesterday:
        anchor = yesterday
    else:
        return {
            "current": 0,
            "longest": longest,
            "active_dates": [d.isoformat() for d in days],
        }

    current = 0
    idx = len(days) - 1
    probe = anchor
    while idx >= 0 and days[idx] == probe:
        current += 1
        probe -= timedelta(days=1)
        idx -= 1

    return {
        "current":      current,
        "longest":      longest,
        "active_dates": [d.isoformat() for d in days],
    }


# ---------------------------------------------------------------------------
# Internal classifier
# ---------------------------------------------------------------------------

def _classify(stat: dict) -> str:
    """
    Return the status label for a single topic_stats document.

    Priority order: strong → improving → weak → neutral
    Matches the same logic used in submission_service._refresh_topic_status
    so the dashboard always reflects consistent rules.
    """
    total_errors        = stat.get("total_errors", 0)
    successful_attempts = stat.get("successful_attempts", 0)
    recent_attempts     = stat.get("recent_attempts", [])
    stored_status       = stat.get("status", "weak")

    total_attempts = total_errors + successful_attempts
    error_rate = (total_errors / total_attempts * 100) if total_attempts > 0 else 100

    if successful_attempts >= STRONG_MIN_SUCCESSES and error_rate < STRONG_MAX_ERROR_RATE:
        return "strong"

    if (
        stored_status == "weak"
        and len(recent_attempts) >= IMPROVING_RECENT_WINDOW
        and all(recent_attempts[-IMPROVING_RECENT_WINDOW:])
    ):
        return "improving"

    if total_errors >= WEAK_MIN_ERRORS and successful_attempts < WEAK_MAX_SUCCESSES:
        return "weak"

    return "neutral"   # not enough data to label definitively


# ---------------------------------------------------------------------------
# Public functions
# ---------------------------------------------------------------------------

def detect_weak_topics(user_id: str) -> list:
    """
    Return a list of topic names where the student is currently struggling.

    A topic is WEAK when:
      - total_errors  >= 5
      - successful_attempts < 3

    Args:
        user_id: String identifier of the student.

    Returns:
        List of topic strings, e.g. ['loops', 'arrays'].
        Empty list if the user has no data or no weak topics.
    """
    stats = get_all_topic_stats(user_id)
    return [s["topic"] for s in stats if _classify(s) == "weak"]


def detect_improving_topics(user_id: str) -> list:
    """
    Return a list of topic names where the student is showing improvement.

    A topic is IMPROVING when:
      - It was previously classified as 'weak'
      - The last 3 submission attempts on that topic were all successful

    Args:
        user_id: String identifier of the student.

    Returns:
        List of topic strings.  Empty list if none qualify.
    """
    stats = get_all_topic_stats(user_id)
    return [s["topic"] for s in stats if _classify(s) == "improving"]


def get_learning_summary(user_id: str) -> dict:
    """
    Build a structured summary of a student's learning state across all topics.

    Returns a dict with four keys:
      weak_topics       : topics the student is currently struggling with
      improving_topics  : topics that were weak but are now improving
      strong_topics     : topics the student has mastered
      total_submissions : total number of code submissions by the user

    Args:
        user_id: String identifier of the student.

    Returns:
        {
          "weak_topics":      ["loops"],
          "improving_topics": ["arrays"],
          "strong_topics":    ["variables"],
          "total_submissions": 24
        }
    """
    stats = get_all_topic_stats(user_id)

    weak       = []
    improving  = []
    strong     = []

    for s in stats:
        label = _classify(s)
        topic = s["topic"]
        if label == "weak":
            weak.append(topic)
        elif label == "improving":
            improving.append(topic)
        elif label == "strong":
            strong.append(topic)
        # "neutral" is omitted — not enough data to surface to the student

    # ------------------------------------------------------------------
    # Hint-weighted success rate  (submits only)
    # ------------------------------------------------------------------
    # We pull the 'submit'-type attempts once and reuse them for every
    # submit-scoped metric below:
    #   - total_submissions      : count of submit-type rows (failed + resolved)
    #   - successful_submissions : raw count of resolved submits
    #   - success_rate           : average hint-weighted credit per submit
    # Runs are excluded entirely so accidental clicks on Run never
    # inflate or deflate any of these — only deliberate submits move the
    # tiles on Dashboard / Progress.
    submit_attempts = get_submit_attempts_for_user(user_id)
    total_submits = len(submit_attempts)
    successful_submits = sum(1 for s in submit_attempts if s.get("resolved"))
    total = total_submits

    if total_submits > 0:
        weighted_credit = sum(
            _hint_weight(s.get("hints_used", 0)) if s.get("resolved") else 0.0
            for s in submit_attempts
        )
        success_rate = weighted_credit / total_submits
    else:
        success_rate = 0.0

    # ------------------------------------------------------------------
    # Per-catalog-topic performance (feeds the Dashboard topic cards
    # and the Progress page's "Topic Mastery" list)
    # ------------------------------------------------------------------
    topic_performance = get_topic_performance_for_user(user_id)

    # ------------------------------------------------------------------
    # Activity streak (feeds the Dashboard "current streak" tile + the
    # calendar card)
    # ------------------------------------------------------------------
    streak = _compute_streaks(get_active_dates_for_user(user_id))

    # ------------------------------------------------------------------
    # Recent activity feed (Progress page)
    # ------------------------------------------------------------------
    recent_submissions = get_recent_submissions_for_user(user_id, limit=8)

    # ------------------------------------------------------------------
    # Encouragements (hint-usage based motivational messages)
    # ------------------------------------------------------------------
    # Replaces the old topic-based recommendations. Each entry contains
    # a topic, status (improving/weak/strong), and a personalised message
    # derived from the user's hint-usage patterns weighted by difficulty.
    encouragements = generate_all_encouragements(user_id)

    # ------------------------------------------------------------------
    # Error breakdown
    # ------------------------------------------------------------------
    # Count all failed attempts (runs + submits) by error_type. Populates
    # the Progress page's "Error Breakdown" chart.
    error_breakdown = get_error_counts_for_user(user_id)

    # ------------------------------------------------------------------
    # Topics mastered (catalog-based)
    # ------------------------------------------------------------------
    # A catalog topic counts as "mastered" when the user has solved
    # every problem in it at least once. We return the list of distinct
    # problem_ids solved per topic so the frontend can match against
    # its own problem catalog and compute the final X/N tile value.
    mastered_problem_ids_by_topic = get_solved_problem_ids_by_topic(user_id)

    # ------------------------------------------------------------------
    # Codexa Insight (structured)
    # ------------------------------------------------------------------
    insight = _build_insight(
        weak_topics=weak,
        error_breakdown=error_breakdown,
        total_submissions=total,
        total_submits=total_submits,
        success_rate=success_rate,
    )

    return {
        "user_id":                         user_id,
        "weak_topics":                     weak,
        "improving_topics":                improving,
        "strong_topics":                   strong,
        "total_submissions":               total,
        "successful_submissions":          successful_submits,
        "success_rate":                    round(success_rate, 4),
        "topic_performance":               topic_performance,
        "streak":                          streak,
        "recent_submissions":              recent_submissions,
        "encouragements":                  encouragements,
        "error_breakdown":                 error_breakdown,
        "mastered_problem_ids_by_topic":   mastered_problem_ids_by_topic,
        "insight":                         insight,
    }
