"""
encouragement_engine.py
-----------------------
Generates personalised motivational messages when a student shows
measurable improvement on a topic they previously struggled with.

Public API
----------
  generate_encouragement(user_id, topic) -> dict
"""

import random
from database import get_topic_stat

# ---------------------------------------------------------------------------
# Message templates
# ---------------------------------------------------------------------------
# Each template may contain {topic} which is filled at render time.

_IMPROVING_TEMPLATES = [
    "You've improved significantly in {topic} compared to your earlier attempts. Keep it up!",
    "Great progress! Your recent submissions show a much better understanding of {topic}.",
    "Your hard work on {topic} is paying off — your last few attempts went well!",
    "Nice work! You used to find {topic} tricky, but your recent code shows real growth.",
    "You're on a roll with {topic}! Your consistent effort is clearly making a difference.",
    "Excellent improvement in {topic}! You're building a solid foundation.",
    "Your understanding of {topic} is improving — keep practising and you'll master it soon!",
]

_STRONG_TEMPLATES = [
    "You've mastered {topic}! Your submissions in this area are consistently excellent.",
    "Outstanding work on {topic} — your success rate speaks for itself.",
    "{topic} is clearly one of your strengths now. Well done!",
]

_NO_CHANGE_TEMPLATES = [
    "Keep going with {topic} — every mistake is a step toward understanding.",
    "Don't give up on {topic}. Review your recent errors and try a slightly different approach.",
    "Struggling with {topic} is completely normal at this stage. You're making progress!",
]


def _pick(templates: list, topic: str) -> str:
    """Return a random message from the template list, filling in {topic}."""
    return random.choice(templates).format(topic=topic.replace("_", " "))


# ---------------------------------------------------------------------------
# Public function
# ---------------------------------------------------------------------------

def generate_encouragement(user_id: str, topic: str) -> dict:
    """
    Decide whether to show a motivational message for a given topic and,
    if so, return a suitable message.

    Logic:
      - 'improving' status → always show an encouraging message
      - 'strong'    status → show a congratulatory message
      - 'weak'      status → show a supportive "keep going" message
      - No data yet        → show nothing (show_message = False)

    Args:
        user_id: String identifier of the student.
        topic:   The learning topic to evaluate (e.g. 'arrays').

    Returns:
        {
          "show_message": True,
          "message": "Your understanding of arrays is improving!"
        }
        or
        {
          "show_message": False,
          "message": ""
        }
    """
    stat = get_topic_stat(user_id, topic)

    # Edge case: no data for this user / topic yet
    if stat is None:
        return {"show_message": False, "message": ""}

    status = stat.get("status", "weak")

    if status == "improving":
        msg = _pick(_IMPROVING_TEMPLATES, topic)
        return {"show_message": True, "message": msg}

    if status == "strong":
        msg = _pick(_STRONG_TEMPLATES, topic)
        return {"show_message": True, "message": msg}

    if status == "weak":
        # Show a gentle supportive nudge rather than silence
        msg = _pick(_NO_CHANGE_TEMPLATES, topic)
        return {"show_message": True, "message": msg}

    # status == 'neutral' (not enough data)
    return {"show_message": False, "message": ""}
