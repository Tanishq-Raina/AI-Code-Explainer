"""
encouragement_engine.py
-----------------------
Generates personalised motivational messages based on a student's
hint-usage patterns across topics.

Scoring model
~~~~~~~~~~~~~
Each submission earns a performance score:
    score = (3 - hints_used) × difficulty_multiplier

Difficulty multipliers:
    Easy   → 1.0
    Medium → 1.5
    Hard   → 2.0

Status classification (per topic):
    - Split submissions into "recent" (last 5) and "older" (everything before).
    - strong:    recent avg score ≥ 70% of max possible
    - improving: recent avg is ≥ 30% higher than older avg (relative)
    - weak:      recent avg score < 30% of max possible
    - neutral:   not enough data (fewer than 3 submissions)

Public API
----------
  generate_encouragement(user_id, topic) -> dict
  generate_all_encouragements(user_id)   -> list[dict]
"""

import random
from database import get_submissions_by_topic

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

MAX_HINTS = 3
MIN_SUBMISSIONS = 3       # minimum attempts before we classify
RECENT_WINDOW = 5         # how many recent submissions to consider

# Thresholds (as fractions of max possible weighted score)
STRONG_THRESHOLD = 0.70
WEAK_THRESHOLD = 0.30
IMPROVING_LIFT = 0.30     # recent must be ≥ 30% better than older

DIFFICULTY_MULTIPLIER = {
    "Easy":   1.0,
    "Medium": 1.5,
    "Hard":   2.0,
}

# ---------------------------------------------------------------------------
# Message templates
# ---------------------------------------------------------------------------

_IMPROVING_TEMPLATES = [
    "You've improved significantly in {topic} compared to your earlier attempts. Keep it up!",
    "Great progress! You're using fewer hints on {topic} problems now.",
    "Your hard work on {topic} is paying off — you needed more hints before, now you're solving with less!",
    "Nice work! You used to find {topic} tricky, but your recent code shows real growth.",
    "You're on a roll with {topic}! Your consistent effort is clearly making a difference.",
    "Excellent improvement in {topic}! You're building a solid foundation.",
    "Your understanding of {topic} is improving — keep practising and you'll master it soon!",
]

_STRONG_TEMPLATES = [
    "You've mastered {topic}! Solving problems with minimal hints consistently.",
    "Outstanding work on {topic} — you barely need hints anymore.",
    "{topic} is clearly one of your strengths now. Well done!",
    "You're crushing {topic}! Consistently solving without relying on hints.",
]

_WEAK_TEMPLATES = [
    "Keep going with {topic} — every attempt teaches you something new.",
    "Don't give up on {topic}. Try breaking the problem into smaller steps.",
    "Struggling with {topic} is completely normal. Use the hints to learn, not just to pass!",
    "{topic} takes practice. Focus on understanding why each hint helps.",
]


def _pick(templates: list, topic: str) -> str:
    """Return a random message from the template list, filling in {topic}."""
    return random.choice(templates).format(topic=topic)


# ---------------------------------------------------------------------------
# Scoring logic
# ---------------------------------------------------------------------------

def _compute_score(submission: dict) -> float:
    """
    Compute the performance score for a single submission.
    Only resolved submissions earn points; failed ones score 0.
    """
    if not submission.get("resolved"):
        return 0.0

    hints_used = max(0, min(MAX_HINTS, int(submission.get("hints_used", 0) or 0)))
    difficulty = submission.get("difficulty", "Easy")
    multiplier = DIFFICULTY_MULTIPLIER.get(difficulty, 1.0)

    return (MAX_HINTS - hints_used) * multiplier


def _max_possible_score(submission: dict) -> float:
    """Max score this submission could have earned (0 hints, resolved)."""
    difficulty = submission.get("difficulty", "Easy")
    multiplier = DIFFICULTY_MULTIPLIER.get(difficulty, 1.0)
    return MAX_HINTS * multiplier


def _avg_score(submissions: list) -> float:
    """Average performance score for a list of submissions."""
    if not submissions:
        return 0.0
    return sum(_compute_score(s) for s in submissions) / len(submissions)


def _avg_max(submissions: list) -> float:
    """Average max possible score for a list of submissions."""
    if not submissions:
        return 1.0  # avoid division by zero
    return sum(_max_possible_score(s) for s in submissions) / len(submissions)


def _classify_topic(submissions: list) -> str:
    """
    Classify a topic based on the user's submission history.

    Returns: 'strong', 'improving', 'weak', or 'neutral'
    """
    if len(submissions) < MIN_SUBMISSIONS:
        return "neutral"

    recent = submissions[-RECENT_WINDOW:]
    older = submissions[:-RECENT_WINDOW] if len(submissions) > RECENT_WINDOW else []

    recent_avg = _avg_score(recent)
    recent_max = _avg_max(recent)
    recent_ratio = recent_avg / recent_max if recent_max > 0 else 0.0

    # Strong: recent performance is high
    if recent_ratio >= STRONG_THRESHOLD:
        return "strong"

    # Improving: recent is meaningfully better than older
    if older:
        older_avg = _avg_score(older)
        older_max = _avg_max(older)
        older_ratio = older_avg / older_max if older_max > 0 else 0.0

        if older_ratio > 0:
            lift = (recent_ratio - older_ratio) / older_ratio
        else:
            # Was at zero before, any positive recent score = improvement
            lift = 1.0 if recent_ratio > 0 else 0.0

        if lift >= IMPROVING_LIFT and recent_ratio > WEAK_THRESHOLD:
            return "improving"

    # Weak: recent performance is low
    if recent_ratio < WEAK_THRESHOLD:
        return "weak"

    # Not enough signal to label definitively
    return "neutral"


# ---------------------------------------------------------------------------
# Public functions
# ---------------------------------------------------------------------------

def generate_encouragement(user_id: str, topic: str) -> dict:
    """
    Generate an encouragement message for a specific topic.

    This is kept for backward compatibility with the submit-code route.
    It looks up the user's submissions for the given topic and returns
    a message based on their hint-usage trend.

    Args:
        user_id: String identifier of the student.
        topic:   The problem_topic to evaluate (e.g. 'Loops').

    Returns:
        {"show_message": bool, "message": str}
    """
    all_topics = get_submissions_by_topic(user_id)
    submissions = all_topics.get(topic, [])

    if len(submissions) < MIN_SUBMISSIONS:
        return {"show_message": False, "message": ""}

    status = _classify_topic(submissions)

    if status == "improving":
        return {"show_message": True, "message": _pick(_IMPROVING_TEMPLATES, topic)}
    if status == "strong":
        return {"show_message": True, "message": _pick(_STRONG_TEMPLATES, topic)}
    if status == "weak":
        return {"show_message": True, "message": _pick(_WEAK_TEMPLATES, topic)}

    return {"show_message": False, "message": ""}


def generate_all_encouragements(user_id: str) -> list:
    """
    Generate encouragement messages for ALL topics the user has attempted.

    Returns a list of dicts sorted by priority (improving first, then weak,
    then strong), each containing:
        {
          "topic":   "Loops",
          "status":  "improving",
          "message": "Great progress! You're using fewer hints on Loops problems now."
        }

    Topics with 'neutral' status (not enough data) are excluded.
    """
    all_topics = get_submissions_by_topic(user_id)

    results = []
    for topic, submissions in all_topics.items():
        if len(submissions) < MIN_SUBMISSIONS:
            continue

        status = _classify_topic(submissions)
        if status == "neutral":
            continue

        if status == "improving":
            msg = _pick(_IMPROVING_TEMPLATES, topic)
        elif status == "strong":
            msg = _pick(_STRONG_TEMPLATES, topic)
        else:
            msg = _pick(_WEAK_TEMPLATES, topic)

        results.append({
            "topic":   topic,
            "status":  status,
            "message": msg,
        })

    # Priority: improving → weak → strong
    priority = {"improving": 0, "weak": 1, "strong": 2}
    results.sort(key=lambda r: priority.get(r["status"], 3))

    return results
