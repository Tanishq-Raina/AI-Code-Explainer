"""
database.py
-----------
MongoDB connection and collection accessors for the AI Java Tutor.

Collections:
  - users          : registered student profiles
  - submissions    : every Java code submission + error details
  - topic_stats    : per-user, per-topic learning performance counters
  - hint_state     : progressive hint escalation state per (user, code)
"""

import os

import certifi
from dotenv import load_dotenv
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import PyMongoError
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId

# ---------------------------------------------------------------------------
# Connection
# ---------------------------------------------------------------------------

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "ai_java_tutor"

_client = None
_db = None


def get_db():
    """Return a cached database handle, creating the connection if needed."""
    global _client, _db
    if _db is None:
        if not MONGO_URI:
            message = "MongoDB connection failed: MONGO_URI environment variable is not set."
            print(message)
            raise RuntimeError(message)

        try:
            # tlsCAFile=certifi.where() is required on Windows so MongoDB Atlas
            # TLS handshakes succeed against the bundled CA store.
            _client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
            _client.admin.command("ping")
            _db = _client[DB_NAME]
            _ensure_indexes(_db)
        except PyMongoError as exc:
            message = f"MongoDB connection failed: {exc}"
            print(message)
            raise RuntimeError(message) from exc
    return _db


def _ensure_indexes(db):
    """Create indexes once so queries stay fast even at scale."""
    # submissions: look up by user, sort by time
    db.submissions.create_index([("user_id", ASCENDING), ("timestamp", DESCENDING)])
    # submissions: fast hallucination analytics queries
    db.submissions.create_index([("user_id", ASCENDING), ("hallucination_flag", ASCENDING)])
    db.submissions.create_index([("user_id", ASCENDING), ("user_feedback", ASCENDING)])
    # topic_stats: unique per (user, topic) pair
    db.topic_stats.create_index(
        [("user_id", ASCENDING), ("topic", ASCENDING)], unique=True
    )
    # hint_state: unique per (user, code_hash) for progressive hint escalation
    db.hint_state.create_index(
        [("user_id", ASCENDING), ("code_hash", ASCENDING)],
        unique=True,
        name="user_code_unique",
    )
    # study_content: unique chapter cache for generated study summaries
    db.study_content.create_index(
        [("chapter_id", ASCENDING)], unique=True,
        name="chapter_id_unique",
    )


# ---------------------------------------------------------------------------
# Collection helpers
# ---------------------------------------------------------------------------

def users_col():
    """Return the `users` collection."""
    return get_db().users


def submissions_col():
    """Return the `submissions` collection."""
    return get_db().submissions


def topic_stats_col():
    """Return the `topic_stats` collection."""
    return get_db().topic_stats


def hint_state_col():
    """Return the `hint_state` collection."""
    return get_db().hint_state


def study_content_col():
    """Return the `study_content` collection."""
    return get_db().study_content


# ---------------------------------------------------------------------------
# User helpers
# ---------------------------------------------------------------------------

def create_user(name: str) -> str:
    """
    Insert a new user document and return the generated string _id.

    Schema:
      { name, created_at }
    """
    result = users_col().insert_one({
        "name": name,
        "created_at": datetime.utcnow()
    })
    return str(result.inserted_id)


def get_user(user_id: str):
    """
    Fetch a user document by string user_id.
    Returns the document dict, or None if not found.
    """
    try:
        return users_col().find_one({"_id": ObjectId(user_id)})
    except Exception:
        return None


def get_study_content(chapter_id: str):
    """
    Return cached study content for a given chapter_id.
    """
    if not chapter_id:
        return None
    return study_content_col().find_one({"chapter_id": chapter_id}, {"_id": 0})


def save_study_content(chapter_id: str, content: dict):
    """
    Cache generated study content for a chapter.
    """
    if not chapter_id or not isinstance(content, dict):
        return None

    payload = {
        "chapter_id": chapter_id,
        "title": content.get("title"),
        "sections": content.get("sections", []),
        "generated_at": datetime.utcnow(),
    }
    study_content_col().update_one(
        {"chapter_id": chapter_id},
        {"$set": payload},
        upsert=True,
    )
    return payload


# ---------------------------------------------------------------------------
# Submission helpers
# ---------------------------------------------------------------------------

def insert_submission(doc: dict) -> str:
    """
    Insert a submission document into the submissions collection.
    Returns the generated string _id.

    Expected keys: user_id, code, detected_topic, error_type,
                   error_message, hints_used, resolved,
                   llm_response, hallucination_flag, confidence_score,
                   user_feedback, timestamp
    """
    payload = dict(doc or {})

    if "timestamp" not in payload:
        payload["timestamp"] = datetime.utcnow()

    payload["llm_response"] = str(payload.get("llm_response") or "")

    raw_flag = payload.get("hallucination_flag", False)
    payload["hallucination_flag"] = bool(raw_flag)

    raw_confidence = payload.get("confidence_score")
    try:
        confidence_score = float(raw_confidence)
    except (TypeError, ValueError):
        confidence_score = None

    if confidence_score is not None:
        confidence_score = max(0.0, min(1.0, confidence_score))
    payload["confidence_score"] = confidence_score

    feedback = str(payload.get("user_feedback") or "not_given").lower()
    if feedback not in {"correct", "incorrect", "not_given"}:
        feedback = "not_given"
    payload["user_feedback"] = feedback

    result = submissions_col().insert_one(payload)
    return str(result.inserted_id)


def log_llm_feedback(submission_id: str, hallucination_flag: bool, user_feedback: str) -> bool:
    """
    Update LLM quality feedback on an existing submission.

    Returns True when a matching document is updated, otherwise False.
    """
    feedback = str(user_feedback or "not_given").lower()
    if feedback not in {"correct", "incorrect", "not_given"}:
        feedback = "not_given"

    try:
        object_id = ObjectId(submission_id)
    except (InvalidId, TypeError, ValueError):
        return False

    result = submissions_col().update_one(
        {"_id": object_id},
        {
            "$set": {
                "hallucination_flag": bool(hallucination_flag),
                "user_feedback": feedback,
                "updated_at": datetime.utcnow(),
            }
        },
    )
    return result.matched_count > 0


def get_hallucination_stats(user_id: str) -> dict:
    """
    Return hallucination analytics for a user.

    Output:
      {
        total_responses: int,
        hallucinated: int,
        accuracy: float
      }
    """
    query = {"user_id": user_id}

    total_responses = submissions_col().count_documents(query)
    hallucinated = submissions_col().count_documents(
        {"user_id": user_id, "hallucination_flag": True}
    )
    correct_responses = submissions_col().count_documents(
        {"user_id": user_id, "user_feedback": "correct"}
    )

    accuracy = (correct_responses / total_responses) if total_responses > 0 else 0.0

    return {
        "total_responses": total_responses,
        "hallucinated": hallucinated,
        "accuracy": accuracy,
    }


def get_submissions_for_user(user_id: str, limit: int = 100) -> list:
    """
    Return the most recent `limit` submissions for a given user,
    newest first.
    """
    cursor = (
        submissions_col()
        .find({"user_id": user_id})
        .sort("timestamp", DESCENDING)
        .limit(limit)
    )
    return list(cursor)


def count_submissions_for_user(user_id: str) -> int:
    """Return total number of submissions made by a user."""
    return submissions_col().count_documents({"user_id": user_id})


def get_recent_submissions_for_user(user_id: str, limit: int = 8) -> list:
    """
    Return the newest `limit` submit-type submissions for a user,
    projected into the shape the Progress page's "Recent Activity"
    feed expects:

      {
        "id":            str  (MongoDB _id),
        "problem_id":    int | None,
        "problem_title": str,
        "status":        "Success" | <error_type>,
        "topic":         str  (catalog topic, falls back to detected),
        "timestamp":     str  (ISO-8601)
      }

    Runs are excluded — the feed is a log of real attempts, not every
    click of the editor's Run button.
    """
    cursor = (
        submissions_col()
        .find(
            {
                "user_id": user_id,
                "$or": [
                    {"submission_type": "submit"},
                    {"submission_type": {"$exists": False}},
                ],
            }
        )
        .sort("timestamp", DESCENDING)
        .limit(limit)
    )

    feed = []
    for doc in cursor:
        resolved = bool(doc.get("resolved"))
        error_type = doc.get("error_type") or "Error"
        ts = doc.get("timestamp")
        feed.append({
            "id":            str(doc.get("_id")),
            "problem_id":    doc.get("problem_id"),
            "problem_title": doc.get("problem_title") or "Untitled problem",
            "status":        "Success" if resolved else error_type,
            "topic":         doc.get("problem_topic")
                              or doc.get("detected_topic")
                              or "general",
            "timestamp":     ts.isoformat() if ts else None,
        })
    return feed


def get_submit_attempts_for_user(user_id: str) -> list:
    """
    Return the minimal fields needed to compute hint-weighted mastery
    metrics: only documents where submission_type == 'submit'.

    Older docs written before the submission_type field existed are
    treated as submits (the field is absent → missing == 'submit').
    """
    cursor = submissions_col().find(
        {
            "user_id": user_id,
            "$or": [
                {"submission_type": "submit"},
                {"submission_type": {"$exists": False}},
            ],
        },
        {"resolved": 1, "hints_used": 1, "detected_topic": 1, "error_type": 1},
    )
    return list(cursor)


def get_active_dates_for_user(user_id: str) -> list:
    """
    Return the sorted list of YYYY-MM-DD strings on which the user
    made at least one submission. Used by the streak calculator and
    the activity calendar card on the Dashboard.
    """
    pipeline = [
        {"$match": {"user_id": user_id}},
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date":   "$timestamp",
                    }
                }
            }
        },
        {"$sort": {"_id": 1}},
    ]
    return [doc["_id"] for doc in submissions_col().aggregate(pipeline)]


def get_topic_performance_for_user(user_id: str) -> list:
    """
    Aggregate per-catalog-topic submit attempts for a user.

    Groups by `problem_topic` (the frontend's canonical topic name, e.g.
    'Java Basics', 'Loops'), NOT the error-derived `detected_topic`.
    This keeps the Dashboard topic cards aligned with the problem
    catalog, while leaving room for the error-level mastery signal.

    Only submission_type == 'submit' (or legacy docs without the field)
    are counted, so accidental Run clicks don't skew accuracy.

    Returns a list of:
      {"topic": str, "attempts": int, "successes": int, "accuracy": float}
    """
    pipeline = [
        {
            "$match": {
                "user_id": user_id,
                "$or": [
                    {"submission_type": "submit"},
                    {"submission_type": {"$exists": False}},
                ],
                "problem_topic": {"$nin": [None, ""]},
            }
        },
        {
            "$group": {
                "_id": "$problem_topic",
                "attempts":  {"$sum": 1},
                "successes": {"$sum": {"$cond": ["$resolved", 1, 0]}},
            }
        },
    ]

    out = []
    for doc in submissions_col().aggregate(pipeline):
        attempts = doc["attempts"]
        successes = doc["successes"]
        out.append({
            "topic":     doc["_id"],
            "attempts":  attempts,
            "successes": successes,
            "accuracy":  (successes / attempts) if attempts else 0.0,
        })
    return out


def get_solved_problem_ids_by_topic(user_id: str) -> dict:
    """
    Return a map of catalog topic → list of distinct problem_ids the
    user has successfully submitted at least once.

    Used by the Dashboard/Progress "Topics mastered" tile: a topic is
    considered mastered when every problem in that topic's catalog
    entry has at least one resolved submit from this user.

    Only submission_type == 'submit' (or legacy docs without the
    field) count — a run that happened to compile doesn't mark a
    problem as solved.
    """
    pipeline = [
        {
            "$match": {
                "user_id":  user_id,
                "resolved": True,
                "$or": [
                    {"submission_type": "submit"},
                    {"submission_type": {"$exists": False}},
                ],
                "problem_topic": {"$nin": [None, ""]},
                "problem_id":    {"$ne": None},
            }
        },
        {
            "$group": {
                "_id":         "$problem_topic",
                "problem_ids": {"$addToSet": "$problem_id"},
            }
        },
    ]
    return {
        doc["_id"]: sorted(doc["problem_ids"])
        for doc in submissions_col().aggregate(pipeline)
    }


def get_error_counts_for_user(user_id: str) -> list:
    """
    Aggregate non-success submissions by error_type for a given user.
    Counts both runs and submits (the Progress page wants all error
    telemetry), so failed runs still show up in the breakdown.

    Wrong-output submits are excluded: they're flagged with
    `wrong_output: true` and a dedicated `"WrongOutput"` error_type,
    and aren't concept errors — they shouldn't pollute the Error
    Breakdown chart or the insight engine's dominant-error signal.

    Returns a list of {"type": str, "count": int} sorted by count desc.
    """
    pipeline = [
        {
            "$match": {
                "user_id": user_id,
                "resolved": False,
                "wrong_output": {"$ne": True},
                "error_type": {"$nin": [None, "", "Success", "WrongOutput"]},
            }
        },
        {"$group": {"_id": "$error_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    return [
        {"type": doc["_id"], "count": doc["count"]}
        for doc in submissions_col().aggregate(pipeline)
    ]


# ---------------------------------------------------------------------------
# Topic-stats helpers
# ---------------------------------------------------------------------------

def get_topic_stat(user_id: str, topic: str) -> dict:
    """
    Fetch the topic_stats document for (user_id, topic).
    Returns None if no record exists yet.
    """
    return topic_stats_col().find_one({"user_id": user_id, "topic": topic})


def get_submissions_by_topic(user_id: str) -> dict:
    """
    Return submit-type submissions grouped by problem_topic, with only
    the fields needed for the encouragement engine: hints_used,
    problem_difficulty, resolved, and timestamp.

    Returns a dict of topic -> list of submission dicts, sorted by
    timestamp ascending (oldest first) within each topic.

    Example:
      {
        "Loops": [
          {"hints_used": 2, "difficulty": "Easy", "resolved": True, "timestamp": ...},
          {"hints_used": 0, "difficulty": "Medium", "resolved": True, "timestamp": ...},
        ],
        "Arrays": [ ... ]
      }
    """
    cursor = submissions_col().find(
        {
            "user_id": user_id,
            "$or": [
                {"submission_type": "submit"},
                {"submission_type": {"$exists": False}},
            ],
            "problem_topic": {"$nin": [None, ""]},
        },
        {
            "problem_topic": 1,
            "problem_difficulty": 1,
            "hints_used": 1,
            "resolved": 1,
            "timestamp": 1,
        },
    ).sort("timestamp", ASCENDING)

    grouped = {}
    for doc in cursor:
        topic = doc.get("problem_topic")
        if not topic:
            continue
        grouped.setdefault(topic, []).append({
            "hints_used":  doc.get("hints_used", 0),
            "difficulty":  doc.get("problem_difficulty") or "Easy",
            "resolved":    bool(doc.get("resolved")),
            "timestamp":   doc.get("timestamp"),
        })
    return grouped


def get_all_topic_stats(user_id: str) -> list:
    """Return all topic_stats documents for a user."""
    return list(topic_stats_col().find({"user_id": user_id}))


def upsert_topic_stat(user_id: str, topic: str, update_fields: dict):
    """
    Create or update the topic_stats document for (user_id, topic).

    `update_fields` is a plain dict of top-level field changes
    (caller builds the $set / $inc / $push payload).
    """
    topic_stats_col().update_one(
        {"user_id": user_id, "topic": topic},
        update_fields,
        upsert=True
    )
