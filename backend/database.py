"""
database.py
-----------
MongoDB connection and collection accessors for the AI Java Tutor.

Collections:
  - users          : registered student profiles
  - submissions    : every Java code submission + error details
  - topic_stats    : per-user, per-topic learning performance counters
"""

import os

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
            _client = MongoClient(MONGO_URI)
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


# ---------------------------------------------------------------------------
# Topic-stats helpers
# ---------------------------------------------------------------------------

def get_topic_stat(user_id: str, topic: str) -> dict:
    """
    Fetch the topic_stats document for (user_id, topic).
    Returns None if no record exists yet.
    """
    return topic_stats_col().find_one({"user_id": user_id, "topic": topic})


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
