"""
test_hint_manager.py
--------------------
Unit tests for backend/hint_manager.py — the Progressive Hint Escalation System.

All MongoDB calls are mocked so these tests run without a real database.

Test groups
~~~~~~~~~~~
A – TestHashCode                  (4)   _hash_code helper
B – TestGetCurrentHintLevelNew    (4)   first-time lookups → level 1
C – TestGetCurrentHintLevelKnown  (5)   stored document scenarios
D – TestUpdateHintLevelNew        (5)   first submission creates record
E – TestUpdateHintLevelSameError  (6)   escalation and cap
F – TestUpdateHintLevelErrorChange(4)   error type reset
G – TestResetHintLevel            (6)   resolve + counter reset
H – TestDatabaseErrors            (7)   PyMongoError handling
"""

import hashlib
import sys
import types
import unittest
from datetime import datetime, timezone
from unittest.mock import MagicMock, call, patch

# ---------------------------------------------------------------------------
# Ensure backend/ is on the path so hint_manager can be imported
# ---------------------------------------------------------------------------
sys.path.insert(0, "backend")

import hint_manager
from hint_manager import (
    MAX_HINT_LEVEL,
    _hash_code,
    get_current_hint_level,
    reset_hint_level,
    update_hint_level,
)

# ---------------------------------------------------------------------------
# Helpers shared across tests
# ---------------------------------------------------------------------------

SAMPLE_CODE = """\
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello");
    }
}"""

SAMPLE_HASH = hashlib.sha256(SAMPLE_CODE.encode("utf-8")).hexdigest()

FIXED_NOW = datetime(2026, 3, 2, 12, 0, 0, tzinfo=timezone.utc)


def _mock_coll():
    """Return a fresh MagicMock that mimics a pymongo Collection."""
    return MagicMock()


# ---------------------------------------------------------------------------
# A – TestHashCode
# ---------------------------------------------------------------------------

class TestHashCode(unittest.TestCase):
    """_hash_code() must return a consistent, correct SHA-256 hex digest."""

    def test_returns_string(self):
        result = _hash_code(SAMPLE_CODE)
        self.assertIsInstance(result, str)

    def test_returns_64_char_hex(self):
        result = _hash_code(SAMPLE_CODE)
        self.assertEqual(len(result), 64)
        int(result, 16)  # raises ValueError if not valid hex

    def test_hash_is_deterministic(self):
        self.assertEqual(_hash_code(SAMPLE_CODE), _hash_code(SAMPLE_CODE))

    def test_different_code_different_hash(self):
        other = SAMPLE_CODE.replace("Hello", "World")
        self.assertNotEqual(_hash_code(SAMPLE_CODE), _hash_code(other))


# ---------------------------------------------------------------------------
# B – TestGetCurrentHintLevelNew
# ---------------------------------------------------------------------------

class TestGetCurrentHintLevelNew(unittest.TestCase):
    """get_current_hint_level → level 1 when no record exists."""

    def _run(self, find_one_return):
        coll = _mock_coll()
        coll.find_one.return_value = find_one_return
        with patch.object(hint_manager, "_get_collection", return_value=coll):
            return get_current_hint_level("alice", SAMPLE_CODE, "CompilationError")

    def test_returns_1_when_no_document(self):
        self.assertEqual(self._run(None), 1)

    def test_returns_int(self):
        self.assertIsInstance(self._run(None), int)

    def test_does_not_modify_db(self):
        coll = _mock_coll()
        coll.find_one.return_value = None
        with patch.object(hint_manager, "_get_collection", return_value=coll):
            get_current_hint_level("alice", SAMPLE_CODE, "CompilationError")
        coll.insert_one.assert_not_called()
        coll.update_one.assert_not_called()

    def test_queries_correct_user_and_hash(self):
        coll = _mock_coll()
        coll.find_one.return_value = None
        with patch.object(hint_manager, "_get_collection", return_value=coll):
            get_current_hint_level("alice", SAMPLE_CODE, "CompilationError")
        query = coll.find_one.call_args[0][0]
        self.assertEqual(query["user_id"], "alice")
        self.assertEqual(query["code_hash"], SAMPLE_HASH)


# ---------------------------------------------------------------------------
# C – TestGetCurrentHintLevelKnown
# ---------------------------------------------------------------------------

class TestGetCurrentHintLevelKnown(unittest.TestCase):
    """get_current_hint_level when a document already exists."""

    def _run(self, doc, error_type="CompilationError"):
        coll = _mock_coll()
        coll.find_one.return_value = doc
        with patch.object(hint_manager, "_get_collection", return_value=coll):
            return get_current_hint_level("alice", SAMPLE_CODE, error_type)

    def test_returns_stored_level(self):
        doc = {"hint_level": 2, "error_type": "CompilationError"}
        self.assertEqual(self._run(doc), 2)

    def test_returns_max_level_unchanged(self):
        doc = {"hint_level": MAX_HINT_LEVEL, "error_type": "CompilationError"}
        self.assertEqual(self._run(doc), MAX_HINT_LEVEL)

    def test_returns_1_when_error_type_changed(self):
        doc = {"hint_level": 3, "error_type": "RuntimeError"}
        result = self._run(doc, error_type="CompilationError")
        self.assertEqual(result, 1)

    def test_same_error_type_returns_stored_level(self):
        doc = {"hint_level": 2, "error_type": "RuntimeError"}
        self.assertEqual(self._run(doc, error_type="RuntimeError"), 2)

    def test_missing_hint_level_defaults_to_1(self):
        doc = {"error_type": "CompilationError"}  # no hint_level key
        self.assertEqual(self._run(doc), 1)


# ---------------------------------------------------------------------------
# D – TestUpdateHintLevelNew
# ---------------------------------------------------------------------------

class TestUpdateHintLevelNew(unittest.TestCase):
    """update_hint_level creates a new record and returns 1 on first call."""

    def setUp(self):
        self.coll = _mock_coll()
        self.coll.find_one.return_value = None  # no existing record
        self._patch = patch.object(hint_manager, "_get_collection", return_value=self.coll)
        self._now_patch = patch.object(hint_manager, "_now", return_value=FIXED_NOW)
        self._patch.start()
        self._now_patch.start()

    def tearDown(self):
        self._patch.stop()
        self._now_patch.stop()

    def test_returns_1(self):
        result = update_hint_level("alice", SAMPLE_CODE, "CompilationError")
        self.assertEqual(result, 1)

    def test_calls_insert_once(self):
        update_hint_level("alice", SAMPLE_CODE, "CompilationError")
        self.coll.insert_one.assert_called_once()

    def test_inserted_document_has_correct_user_id(self):
        update_hint_level("alice", SAMPLE_CODE, "CompilationError")
        doc = self.coll.insert_one.call_args[0][0]
        self.assertEqual(doc["user_id"], "alice")

    def test_inserted_document_has_correct_hash(self):
        update_hint_level("alice", SAMPLE_CODE, "CompilationError")
        doc = self.coll.insert_one.call_args[0][0]
        self.assertEqual(doc["code_hash"], SAMPLE_HASH)

    def test_inserted_document_not_resolved(self):
        update_hint_level("alice", SAMPLE_CODE, "CompilationError")
        doc = self.coll.insert_one.call_args[0][0]
        self.assertFalse(doc["resolved"])


# ---------------------------------------------------------------------------
# E – TestUpdateHintLevelSameError
# ---------------------------------------------------------------------------

class TestUpdateHintLevelSameError(unittest.TestCase):
    """Escalation: same error_type increments level up to MAX."""

    def _run(self, current_level):
        coll = _mock_coll()
        coll.find_one.return_value = {
            "hint_level": current_level,
            "error_type": "RuntimeError",
        }
        with patch.object(hint_manager, "_get_collection", return_value=coll), \
             patch.object(hint_manager, "_now", return_value=FIXED_NOW):
            return update_hint_level("alice", SAMPLE_CODE, "RuntimeError"), coll

    def test_level_1_increments_to_2(self):
        result, _ = self._run(1)
        self.assertEqual(result, 2)

    def test_level_2_increments_to_3(self):
        result, _ = self._run(2)
        self.assertEqual(result, 3)

    def test_level_3_stays_at_3(self):
        result, _ = self._run(3)
        self.assertEqual(result, MAX_HINT_LEVEL)

    def test_level_above_max_capped(self):
        # Defensive: stored value somehow exceeds MAX
        result, _ = self._run(99)
        self.assertEqual(result, MAX_HINT_LEVEL)

    def test_calls_update_not_insert(self):
        _, coll = self._run(1)
        coll.update_one.assert_called_once()
        coll.insert_one.assert_not_called()

    def test_update_sets_correct_level(self):
        _, coll = self._run(1)
        update_doc = coll.update_one.call_args[0][1]
        self.assertEqual(update_doc["$set"]["hint_level"], 2)


# ---------------------------------------------------------------------------
# F – TestUpdateHintLevelErrorChange
# ---------------------------------------------------------------------------

class TestUpdateHintLevelErrorChange(unittest.TestCase):
    """When error_type changes, level must be reset to 1."""

    def setUp(self):
        self.coll = _mock_coll()
        self.coll.find_one.return_value = {
            "hint_level": 3,
            "error_type": "CompilationError",  # old error
        }
        self._patch = patch.object(hint_manager, "_get_collection", return_value=self.coll)
        self._now_patch = patch.object(hint_manager, "_now", return_value=FIXED_NOW)
        self._patch.start()
        self._now_patch.start()

    def tearDown(self):
        self._patch.stop()
        self._now_patch.stop()

    def test_returns_1(self):
        result = update_hint_level("alice", SAMPLE_CODE, "RuntimeError")
        self.assertEqual(result, 1)

    def test_calls_update_not_insert(self):
        update_hint_level("alice", SAMPLE_CODE, "RuntimeError")
        self.coll.update_one.assert_called_once()
        self.coll.insert_one.assert_not_called()

    def test_update_sets_hint_level_1(self):
        update_hint_level("alice", SAMPLE_CODE, "RuntimeError")
        update_doc = self.coll.update_one.call_args[0][1]
        self.assertEqual(update_doc["$set"]["hint_level"], 1)

    def test_update_sets_new_error_type(self):
        update_hint_level("alice", SAMPLE_CODE, "RuntimeError")
        update_doc = self.coll.update_one.call_args[0][1]
        self.assertEqual(update_doc["$set"]["error_type"], "RuntimeError")


# ---------------------------------------------------------------------------
# G – TestResetHintLevel
# ---------------------------------------------------------------------------

class TestResetHintLevel(unittest.TestCase):
    """reset_hint_level marks submission resolved and resets counter."""

    def setUp(self):
        self.coll = _mock_coll()
        self.coll.update_one.return_value.matched_count = 1
        self._patch = patch.object(hint_manager, "_get_collection", return_value=self.coll)
        self._now_patch = patch.object(hint_manager, "_now", return_value=FIXED_NOW)
        self._patch.start()
        self._now_patch.start()

    def tearDown(self):
        self._patch.stop()
        self._now_patch.stop()

    def test_returns_none(self):
        self.assertIsNone(reset_hint_level("alice", SAMPLE_CODE))

    def test_calls_update_once(self):
        reset_hint_level("alice", SAMPLE_CODE)
        self.coll.update_one.assert_called_once()

    def test_query_uses_correct_hash(self):
        reset_hint_level("alice", SAMPLE_CODE)
        query = self.coll.update_one.call_args[0][0]
        self.assertEqual(query["code_hash"], SAMPLE_HASH)

    def test_sets_resolved_true(self):
        reset_hint_level("alice", SAMPLE_CODE)
        update_doc = self.coll.update_one.call_args[0][1]
        self.assertTrue(update_doc["$set"]["resolved"])

    def test_resets_hint_level_to_1(self):
        reset_hint_level("alice", SAMPLE_CODE)
        update_doc = self.coll.update_one.call_args[0][1]
        self.assertEqual(update_doc["$set"]["hint_level"], 1)

    def test_no_match_does_not_raise(self):
        self.coll.update_one.return_value.matched_count = 0
        # Should log a debug message but never raise
        reset_hint_level("alice", SAMPLE_CODE)


# ---------------------------------------------------------------------------
# H – TestDatabaseErrors
# ---------------------------------------------------------------------------

class TestDatabaseErrors(unittest.TestCase):
    """All public functions must absorb PyMongoError without raising."""

    def _coll_that_raises(self, method_name: str):
        from pymongo.errors import PyMongoError
        coll = _mock_coll()
        getattr(coll, method_name).side_effect = PyMongoError("connection refused")
        return coll

    def test_get_current_hint_level_find_error_returns_1(self):
        coll = self._coll_that_raises("find_one")
        with patch.object(hint_manager, "_get_collection", return_value=coll):
            result = get_current_hint_level("alice", SAMPLE_CODE, "CompilationError")
        self.assertEqual(result, 1)

    def test_get_current_hint_level_db_error_does_not_raise(self):
        coll = self._coll_that_raises("find_one")
        with patch.object(hint_manager, "_get_collection", return_value=coll):
            # Must not propagate the exception
            get_current_hint_level("alice", SAMPLE_CODE, "RuntimeError")

    def test_update_hint_level_find_error_returns_1(self):
        coll = self._coll_that_raises("find_one")
        with patch.object(hint_manager, "_get_collection", return_value=coll):
            result = update_hint_level("alice", SAMPLE_CODE, "CompilationError")
        self.assertEqual(result, 1)

    def test_update_hint_level_insert_error_returns_1(self):
        from pymongo.errors import PyMongoError
        coll = _mock_coll()
        coll.find_one.return_value = None
        coll.insert_one.side_effect = PyMongoError("disk full")
        with patch.object(hint_manager, "_get_collection", return_value=coll):
            result = update_hint_level("alice", SAMPLE_CODE, "CompilationError")
        self.assertEqual(result, 1)

    def test_update_hint_level_update_error_returns_1(self):
        from pymongo.errors import PyMongoError
        coll = _mock_coll()
        coll.find_one.return_value = {"hint_level": 1, "error_type": "RuntimeError"}
        coll.update_one.side_effect = PyMongoError("timeout")
        with patch.object(hint_manager, "_get_collection", return_value=coll):
            result = update_hint_level("alice", SAMPLE_CODE, "RuntimeError")
        self.assertEqual(result, 1)

    def test_reset_hint_level_db_error_does_not_raise(self):
        coll = self._coll_that_raises("update_one")
        with patch.object(hint_manager, "_get_collection", return_value=coll):
            reset_hint_level("alice", SAMPLE_CODE)  # must not propagate

    def test_reset_hint_level_db_error_returns_none(self):
        coll = self._coll_that_raises("update_one")
        with patch.object(hint_manager, "_get_collection", return_value=coll):
            result = reset_hint_level("alice", SAMPLE_CODE)
        self.assertIsNone(result)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    unittest.main(verbosity=2)
