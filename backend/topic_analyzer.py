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

from database import get_all_topic_stats, count_submissions_for_user

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

    total = count_submissions_for_user(user_id)

    return {
        "weak_topics":       weak,
        "improving_topics":  improving,
        "strong_topics":     strong,
        "total_submissions": total,
    }
