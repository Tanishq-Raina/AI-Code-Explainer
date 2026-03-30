"""
database.py
-----------
MongoDB connection and collection accessors for the AI Java Tutor.

Collections:
  - users          : registered student profiles
  - submissions    : every Java code submission + error details
  - topic_stats    : per-user, per-topic learning performance counters
"""

from pymongo import MongoClient, ASCENDING, DESCENDING
from datetime import datetime

# ---------------------------------------------------------------------------
# Connection
# ---------------------------------------------------------------------------

MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "java_tutor"

_client = None
_db = None


def get_db():
    """Return a cached database handle, creating the connection if needed."""
    global _client, _db
    if _db is None:
        _client = MongoClient(MONGO_URI)
        _db = _client[DB_NAME]
        _ensure_indexes(_db)
    return _db


def _ensure_indexes(db):
    """Create indexes once so queries stay fast even at scale."""
    # submissions: look up by user, sort by time
    db.submissions.create_index([("user_id", ASCENDING), ("timestamp", DESCENDING)])
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
    from bson import ObjectId
    try:
        return users_col().find_one({"_id": ObjectId(user_id)})
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Submission helpers
# ---------------------------------------------------------------------------

def insert_submission(doc: dict) -> str:
    """
    Insert a raw submission document into the submissions collection.
    Returns the generated string _id.

    Expected keys: user_id, code, detected_topic, error_type,
                   error_message, hints_used, resolved, timestamp
    """
    result = submissions_col().insert_one(doc)
    return str(result.inserted_id)


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
