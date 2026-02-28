"""
db.py
-----
MongoDB integration layer for the AI-Based Java Programming Tutor.

Responsibilities
~~~~~~~~~~~~~~~~
* Maintain a single MongoClient instance (lazy-initialised on first use).
* Expose ``log_submission()`` as the only public function routes need to call.
* Keep all database details (URI, DB name, collection name) in one place.

Routes must NEVER import ``pymongo`` directly – all DB access goes through
this module so the persistence layer can be swapped or mocked without
touching route code.
"""

import logging
import os
from datetime import datetime, timezone
from typing import Optional

from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration  (override via environment variables in production)
# ---------------------------------------------------------------------------

MONGO_URI:        str = os.getenv("MONGO_URI",        "mongodb://localhost:27017")
MONGO_DB_NAME:    str = os.getenv("MONGO_DB_NAME",    "java_tutor")
SUBMISSIONS_COLL: str = os.getenv("SUBMISSIONS_COLL", "submissions")

# ---------------------------------------------------------------------------
# Lazy singleton client
# ---------------------------------------------------------------------------

_client: Optional[MongoClient] = None


def _get_collection() -> Collection:
    """
    Return the submissions collection, creating the MongoClient on first call.

    Using a module-level singleton avoids opening a new connection for every
    request while still being compatible with Flask's process model.
    """
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URI)
        logger.info("MongoDB connection established → %s / %s", MONGO_URI, MONGO_DB_NAME)
    return _client[MONGO_DB_NAME][SUBMISSIONS_COLL]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def log_submission(user_id: str, code: str, result: dict) -> Optional[str]:
    """
    Persist a code submission and its execution result to MongoDB.

    Parameters
    ----------
    user_id : str
        Identifier for the submitting user.
    code : str
        The raw Java source code that was submitted.
    result : dict
        The structured dict returned by ``execute_java_code()``.

    Returns
    -------
    str or None
        The ``inserted_id`` (as a string) on success, or ``None`` if the
        insert failed.  The caller may log the ID but should not depend on it.
    """
    document = {
        "user_id":    user_id,
        "code":       code,
        "status":     result.get("status"),
        "output":     result.get("output"),
        "error":      result.get("error_message"),
        "submitted_at": datetime.now(timezone.utc),
        # Store extra diagnostic fields only when present so the document
        # stays compact for successful runs.
        **({"line_number":    result["line_number"]}    if result.get("line_number")    else {}),
        **({"exception_type": result["exception_type"]} if result.get("exception_type") else {}),
    }

    try:
        collection = _get_collection()
        insert_result = collection.insert_one(document)
        inserted_id = str(insert_result.inserted_id)
        logger.debug("Submission logged → _id=%s  user=%s  status=%s",
                     inserted_id, user_id, result.get("status"))
        return inserted_id

    except PyMongoError as exc:
        # Log but do NOT re-raise: a DB logging failure must never cause the
        # API to return an error to the client.
        logger.error("Failed to log submission for user=%s: %s", user_id, exc)
        return None
