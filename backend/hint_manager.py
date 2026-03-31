"""
hint_manager.py
---------------
Progressive Hint Escalation System for the Adaptive AI-Based Java Programming Tutor.

Responsibilities
~~~~~~~~~~~~~~~~
* Track how many hints a user has requested for a specific submission.
* Control which hint level to return (1 → 2 → 3) across subsequent requests.
* Prevent infinite escalation — level is capped at MAX_HINT_LEVEL (3).
* Reset hint state when the user submits new code, the error changes, or the
  issue is resolved.
* Persist hint state to MongoDB so the system survives server restarts.

Architecture rules
~~~~~~~~~~~~~~~~~~
* No LLM calls here.  Hint content is generated elsewhere (llm.py).
* No Flask imports.  This module is persistence + business-logic only.
* All MongoDB access is isolated inside this module.  Callers never touch
  pymongo directly.
* A separate ``hint_state`` collection is used so hint escalation records
  are independent of submission logs.

Collection schema (hint_state)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
{
    "_id":        ObjectId,       # auto-generated
    "user_id":    str,            # submitting user
    "code_hash":  str,            # SHA-256 of submitted code (hex digest)
    "error_type": str,            # execution status at time of last hint
    "hint_level": int,            # current escalation level (1 | 2 | 3)
    "resolved":   bool,           # True when the issue was fixed
    "timestamp":  datetime (UTC)  # last-updated time
}

Unique index: (user_id, code_hash) — one document per user × code version.

Public API
~~~~~~~~~~
get_current_hint_level(user_id, code, error_type) → int
    Read-only.  Returns the hint level that should be shown for this request
    WITHOUT advancing the counter.

update_hint_level(user_id, code, error_type) → int
    Write.  Advances the hint level for subsequent requests and returns the
    level that should be used for the CURRENT request.

reset_hint_level(user_id, code) → None
    Write.  Marks the submission resolved and resets the counter to 1.
"""

import hashlib
import logging
import os
from datetime import datetime, timezone
from typing import Optional

from pymongo import ASCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration  (override via environment variables)
# ---------------------------------------------------------------------------

MONGO_URI:       str = os.getenv("MONGO_URI",       "mongodb://localhost:27017")
MONGO_DB_NAME:   str = os.getenv("MONGO_DB_NAME",   "java_tutor")
HINT_STATE_COLL: str = os.getenv("HINT_STATE_COLL", "hint_state")

# Maximum hint level — raising this constant is the only change needed to
# add more hint tiers in future.
MAX_HINT_LEVEL: int = 3

# ---------------------------------------------------------------------------
# Lazy singleton client
# ---------------------------------------------------------------------------

_client: Optional[MongoClient] = None


def _get_collection() -> Collection:
    """
    Return the hint_state collection, creating the MongoClient on first call.

    Also ensures a compound unique index on (user_id, code_hash) exists so
    that concurrent requests for the same user+code pair cannot create
    duplicate documents.
    """
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URI)
        _client[MONGO_DB_NAME][HINT_STATE_COLL].create_index(
            [("user_id", ASCENDING), ("code_hash", ASCENDING)],
            unique=True,
            name="user_code_unique",
        )
        logger.info(
            "hint_state collection ready → %s / %s", MONGO_URI, MONGO_DB_NAME
        )
    return _client[MONGO_DB_NAME][HINT_STATE_COLL]


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _hash_code(code: str) -> str:
    """
    Return the SHA-256 hex digest of the submitted Java source code.

    Hashing lets us compare code identity without storing raw source in the
    hint_state collection (saves space and avoids duplication with the
    submissions collection).
    """
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


def _now() -> datetime:
    """Return the current UTC datetime (isolated for easy mocking in tests)."""
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_current_hint_level(user_id: str, code: str, error_type: str) -> int:
    """
    Return the current hint level for this (user, code, error) combination.

    This is a **read-only** operation — it never modifies the database.

    Escalation logic
    ~~~~~~~~~~~~~~~~
    * Document not found → first time → return 1.
    * Document found, error_type changed → error regressed → return 1.
    * Document found, same error_type → return stored hint_level.

    Parameters
    ----------
    user_id : str
        Identifier for the submitting user.
    code : str
        Raw Java source code.  Hashed internally before any DB lookup.
    error_type : str
        Execution status string from java_engine (e.g. "CompilationError",
        "RuntimeError", "Timeout").

    Returns
    -------
    int
        Hint level in the range [1, MAX_HINT_LEVEL].  Always returns 1 on
        any database error so the user still receives a helpful response.
    """
    code_hash = _hash_code(code)

    try:
        coll = _get_collection()
        doc = coll.find_one(
            {"user_id": user_id, "code_hash": code_hash},
            projection={"hint_level": 1, "error_type": 1, "_id": 0},
        )

        if doc is None:
            logger.debug(
                "get_current_hint_level: no record for user=%s code_hash=%s → level 1",
                user_id, code_hash[:8],
            )
            return 1

        if doc.get("error_type") != error_type:
            logger.debug(
                "get_current_hint_level: error changed for user=%s "
                "(was '%s', now '%s') → level 1",
                user_id, doc.get("error_type"), error_type,
            )
            return 1

        level = int(doc.get("hint_level", 1))
        logger.debug(
            "get_current_hint_level: user=%s level=%d", user_id, level
        )
        return level

    except PyMongoError as exc:
        logger.error(
            "get_current_hint_level DB error for user=%s: %s", user_id, exc
        )
        return 1  # safe fallback — never deny the user a hint over a DB issue


def update_hint_level(user_id: str, code: str, error_type: str) -> int:
    """
    Advance the hint level for this submission and return the level to use
    for the **current** request.

    This is a **write** operation.  Call it once per hint request, just
    before passing the returned level to ``generate_hints()``.

    Escalation logic
    ~~~~~~~~~~~~~~~~
    * No record → create at level 1; return 1.
    * Record exists, error_type changed → reset to level 1; return 1.
    * Record exists, same error_type, level < MAX → increment; return new level.
    * Record exists, same error_type, level == MAX → stay at MAX; return MAX.

    Parameters
    ----------
    user_id : str
        Identifier for the submitting user.
    code : str
        Raw Java source code.  Hashed internally.
    error_type : str
        Execution status string from java_engine.

    Returns
    -------
    int
        The hint level that should be passed to ``generate_hints()``.
        Always returns 1 on any database error.
    """
    code_hash = _hash_code(code)

    try:
        coll = _get_collection()
        doc = coll.find_one(
            {"user_id": user_id, "code_hash": code_hash},
            projection={"hint_level": 1, "error_type": 1, "_id": 0},
        )

        if doc is None:
            # ── First submission ──────────────────────────────────────────
            new_level = 1
            coll.insert_one({
                "user_id":    user_id,
                "code_hash":  code_hash,
                "error_type": error_type,
                "hint_level": new_level,
                "resolved":   False,
                "timestamp":  _now(),
            })
            logger.info(
                "update_hint_level: new record for user=%s error=%s → level %d",
                user_id, error_type, new_level,
            )
            return new_level

        if doc.get("error_type") != error_type:
            # ── Error changed → reset ─────────────────────────────────────
            new_level = 1
            coll.update_one(
                {"user_id": user_id, "code_hash": code_hash},
                {"$set": {
                    "error_type": error_type,
                    "hint_level": new_level,
                    "resolved":   False,
                    "timestamp":  _now(),
                }},
            )
            logger.info(
                "update_hint_level: error changed for user=%s "
                "(was '%s', now '%s') → reset to level %d",
                user_id, doc.get("error_type"), error_type, new_level,
            )
            return new_level

        # ── Same error → increment (capped at MAX_HINT_LEVEL) ────────────
        current_level = int(doc.get("hint_level", 1))
        new_level = min(current_level + 1, MAX_HINT_LEVEL)
        coll.update_one(
            {"user_id": user_id, "code_hash": code_hash},
            {"$set": {
                "hint_level": new_level,
                "timestamp":  _now(),
            }},
        )
        logger.info(
            "update_hint_level: user=%s same error → %d → %d",
            user_id, current_level, new_level,
        )
        return new_level

    except PyMongoError as exc:
        logger.error(
            "update_hint_level DB error for user=%s: %s", user_id, exc
        )
        return 1  # safe fallback


def reset_hint_level(user_id: str, code: str) -> None:
    """
    Mark the submission as resolved and reset the hint counter to 1.

    Call this when:
    * The user's code executes successfully (status == "Success").
    * The route decides the session is complete.

    After a reset the next hint request for this code will start at level 1
    again, which is the intended behaviour if the user later re-introduces
    a bug.

    Parameters
    ----------
    user_id : str
        Identifier for the submitting user.
    code : str
        Raw Java source code.  Hashed internally.

    Returns
    -------
    None
        Silently absorbs database errors — a failed reset must never block
        the route from returning a successful response.
    """
    code_hash = _hash_code(code)

    try:
        coll = _get_collection()
        result = coll.update_one(
            {"user_id": user_id, "code_hash": code_hash},
            {"$set": {
                "hint_level": 1,
                "resolved":   True,
                "timestamp":  _now(),
            }},
        )
        if result.matched_count == 0:
            logger.debug(
                "reset_hint_level: no record to reset for user=%s code_hash=%s",
                user_id, code_hash[:8],
            )
        else:
            logger.info(
                "reset_hint_level: resolved for user=%s code_hash=%s",
                user_id, code_hash[:8],
            )

    except PyMongoError as exc:
        logger.error(
            "reset_hint_level DB error for user=%s: %s", user_id, exc
        )
