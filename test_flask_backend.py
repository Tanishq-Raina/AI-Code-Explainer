"""
test_flask_backend.py
---------------------
Comprehensive test suite for the Flask backend of the AI-Based Java Tutor.

Coverage
~~~~~~~~
Group A – GET /api/health
Group B – POST /api/submit-code  input validation
Group C – POST /api/submit-code  execution outcomes (mocked engine)
Group D – POST /api/submit-code  HTTP status code mapping
Group E – POST /api/submit-code  MongoDB logging (mocked db)
Group F – Global error handlers (404, 405)
Group G – JSON response envelope shape

All tests use Flask's built-in test client.
``execute_java_code``, ``log_submission``, and ``generate_hint`` are mocked so
the suite requires neither a running JVM, MongoDB, nor an LLM.

Response envelope (all routes)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Every response uses the unified shape from response.py::

    {"success": bool, "data": {} | null, "error": {} | null}
"""

import sys
import os
import pytest
from unittest.mock import patch, MagicMock

# ---------------------------------------------------------------------------
# Make the backend package importable from the repo root
# ---------------------------------------------------------------------------
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from app import create_app  # noqa: E402  (must come after sys.path tweak)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def client():
    """Return a Flask test client with testing mode enabled."""
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# Canonical mock return values for each engine status
SUCCESS_RESULT = {
    "status": "Success",
    "error_message": None,
    "output": "Hello, World!",
}

COMPILE_ERROR_RESULT = {
    "status": "CompilationError",
    "error_message": "Main.java:3: error: ';' expected",
    "line_number": 3,
    "output": None,
}

RUNTIME_ERROR_RESULT = {
    "status": "RuntimeError",
    "error_message": 'Exception in thread "main" java.lang.ArithmeticException: / by zero',
    "exception_type": "ArithmeticException",
    "line_number": 4,
    "output": None,
}

TIMEOUT_RESULT = {
    "status": "Timeout",
    "error_message": "Execution time exceeded limit",
    "output": None,
}

VALID_PAYLOAD = {
    "user_id": "test_user",
    "code": "public class Main { public static void main(String[] a) { System.out.println(1); } }",
}

ENGINE_PATH = "routes.execute_java_code"
DB_PATH     = "routes.log_submission"
LLM_PATH    = "routes.generate_hint"       # always mocked to None in tests


# ===========================================================================
# Group A – Health endpoint
# ===========================================================================

class TestHealth:
    def test_returns_200(self, client):
        r = client.get("/api/health")
        assert r.status_code == 200

    def test_returns_json(self, client):
        r = client.get("/api/health")
        assert r.content_type == "application/json"

    def test_body_envelope_success_true(self, client):
        r = client.get("/api/health")
        assert r.get_json()["success"] is True

    def test_body_data_content(self, client):
        r = client.get("/api/health")
        assert r.get_json()["data"]["status"] == "Backend Running"

    def test_body_error_is_null(self, client):
        r = client.get("/api/health")
        assert r.get_json()["error"] is None

    def test_post_not_allowed(self, client):
        r = client.post("/api/health")
        assert r.status_code == 405


# ===========================================================================
# Group B – Input validation
# ===========================================================================

class TestInputValidation:
    def test_empty_body_returns_400(self, client):
        r = client.post("/api/submit-code", data="", content_type="application/json")
        assert r.status_code == 400

    def test_non_json_body_returns_400(self, client):
        r = client.post("/api/submit-code", data="not-json", content_type="text/plain")
        assert r.status_code == 400

    def test_missing_code_field_returns_400(self, client):
        r = client.post("/api/submit-code", json={"user_id": "alice"})
        assert r.status_code == 400
        assert "code" in r.get_json()["error"]["message"].lower()

    def test_missing_user_id_field_returns_400(self, client):
        r = client.post("/api/submit-code", json={"code": "public class Main{}"})
        assert r.status_code == 400
        assert "user_id" in r.get_json()["error"]["message"].lower()

    def test_empty_code_string_returns_400(self, client):
        r = client.post("/api/submit-code", json={"user_id": "alice", "code": ""})
        assert r.status_code == 400

    def test_whitespace_code_returns_400(self, client):
        r = client.post("/api/submit-code", json={"user_id": "alice", "code": "   "})
        assert r.status_code == 400

    def test_whitespace_user_id_returns_400(self, client):
        r = client.post("/api/submit-code", json={"user_id": "   ", "code": "public class Main{}"})
        assert r.status_code == 400

    def test_empty_json_object_returns_400(self, client):
        r = client.post("/api/submit-code", json={})
        assert r.status_code == 400

    def test_error_response_is_json_with_envelope(self, client):
        r = client.post("/api/submit-code", json={})
        body = r.get_json()
        assert r.content_type == "application/json"
        assert body["success"] is False
        assert body["data"] is None
        assert body["error"] is not None
        assert "message" in body["error"]
        assert "code" in body["error"]

    def test_missing_field_error_contains_details(self, client):
        r = client.post("/api/submit-code", json={"user_id": "alice"})
        body = r.get_json()
        assert body["error"].get("details", {}).get("field") == "code"


# ===========================================================================
# Group C – Execution outcomes
# ===========================================================================

class TestExecutionOutcomes:
    @patch(LLM_PATH, return_value=None)
    @patch(DB_PATH,  return_value="mock_id")
    @patch(ENGINE_PATH, return_value=SUCCESS_RESULT)
    def test_success_status_in_response(self, mock_engine, mock_db, mock_llm, client):
        r = client.post("/api/submit-code", json=VALID_PAYLOAD)
        assert r.get_json()["data"]["execution"]["status"] == "Success"

    @patch(LLM_PATH, return_value=None)
    @patch(DB_PATH,  return_value="mock_id")
    @patch(ENGINE_PATH, return_value=SUCCESS_RESULT)
    def test_success_output_in_response(self, mock_engine, mock_db, mock_llm, client):
        r = client.post("/api/submit-code", json=VALID_PAYLOAD)
        assert r.get_json()["data"]["execution"]["output"] == "Hello, World!"

    @patch(LLM_PATH, return_value=None)
    @patch(DB_PATH,  return_value="mock_id")
    @patch(ENGINE_PATH, return_value=SUCCESS_RESULT)
    def test_success_hint_is_null(self, mock_engine, mock_db, mock_llm, client):
        r = client.post("/api/submit-code", json=VALID_PAYLOAD)
        assert r.get_json()["data"]["hint"] is None

    @patch(LLM_PATH, return_value=None)
    @patch(DB_PATH,  return_value="mock_id")
    @patch(ENGINE_PATH, return_value=COMPILE_ERROR_RESULT)
    def test_compile_error_status_in_response(self, mock_engine, mock_db, mock_llm, client):
        r = client.post("/api/submit-code", json=VALID_PAYLOAD)
        assert r.get_json()["data"]["execution"]["status"] == "CompilationError"

    @patch(LLM_PATH, return_value=None)
    @patch(DB_PATH,  return_value="mock_id")
    @patch(ENGINE_PATH, return_value=COMPILE_ERROR_RESULT)
    def test_compile_error_line_number_present(self, mock_engine, mock_db, mock_llm, client):
        r = client.post("/api/submit-code", json=VALID_PAYLOAD)
        assert r.get_json()["data"]["execution"]["line_number"] == 3

    @patch(LLM_PATH, return_value=None)
    @patch(DB_PATH,  return_value="mock_id")
    @patch(ENGINE_PATH, return_value=RUNTIME_ERROR_RESULT)
    def test_runtime_error_status_in_response(self, mock_engine, mock_db, mock_llm, client):
        r = client.post("/api/submit-code", json=VALID_PAYLOAD)
        assert r.get_json()["data"]["execution"]["status"] == "RuntimeError"

    @patch(LLM_PATH, return_value=None)
    @patch(DB_PATH,  return_value="mock_id")
    @patch(ENGINE_PATH, return_value=RUNTIME_ERROR_RESULT)
    def test_runtime_error_exception_type_present(self, mock_engine, mock_db, mock_llm, client):
        r = client.post("/api/submit-code", json=VALID_PAYLOAD)
        assert r.get_json()["data"]["execution"]["exception_type"] == "ArithmeticException"

    @patch(LLM_PATH, return_value=None)
    @patch(DB_PATH,  return_value="mock_id")
    @patch(ENGINE_PATH, return_value=TIMEOUT_RESULT)
    def test_timeout_status_in_response(self, mock_engine, mock_db, mock_llm, client):
        r = client.post("/api/submit-code", json=VALID_PAYLOAD)
        assert r.get_json()["data"]["execution"]["status"] == "Timeout"

    @patch(LLM_PATH, return_value=None)
    @patch(DB_PATH,  return_value="mock_id")
    @patch(ENGINE_PATH, return_value=SUCCESS_RESULT)
    def test_response_contains_user_id(self, mock_engine, mock_db, mock_llm, client):
        r = client.post("/api/submit-code", json=VALID_PAYLOAD)
        assert r.get_json()["data"]["user_id"] == "test_user"

    @patch(LLM_PATH, return_value=None)
    @patch(DB_PATH,  return_value="mock_id")
    @patch(ENGINE_PATH, return_value=SUCCESS_RESULT)
    def test_response_always_json(self, mock_engine, mock_db, mock_llm, client):
        r = client.post("/api/submit-code", json=VALID_PAYLOAD)
        assert r.content_type == "application/json"

    @patch(LLM_PATH, return_value="Try using a semicolon.")
    @patch(DB_PATH,  return_value="mock_id")
    @patch(ENGINE_PATH, return_value=COMPILE_ERROR_RESULT)
    def test_llm_hint_propagated_when_non_success(self, mock_engine, mock_db, mock_llm, client):
        r = client.post("/api/submit-code", json=VALID_PAYLOAD)
        assert r.get_json()["data"]["hint"] == "Try using a semicolon."

    @patch(LLM_PATH, return_value="A hint.")
    @patch(DB_PATH,  return_value="mock_id")
    @patch(ENGINE_PATH, return_value=SUCCESS_RESULT)
    def test_llm_not_called_on_success(self, mock_engine, mock_db, mock_llm, client):
        """generate_hint must NOT be called when execution succeeds."""
        client.post("/api/submit-code", json=VALID_PAYLOAD)
        mock_llm.assert_not_called()

    @patch(LLM_PATH, return_value=None)
    @patch(DB_PATH,  return_value="mock_id")
    @patch(ENGINE_PATH, side_effect=RuntimeError("unexpected engine crash"))
    def test_engine_exception_returns_500(self, mock_engine, mock_db, mock_llm, client):
        r = client.post("/api/submit-code", json=VALID_PAYLOAD)
        assert r.status_code == 500
        assert r.get_json()["success"] is False
        assert r.get_json()["error"] is not None


# ===========================================================================
# Group D – HTTP status code mapping
# ===========================================================================

class TestHttpStatusCodes:
    @patch(LLM_PATH, return_value=None)
    @patch(DB_PATH,  return_value=None)
    @patch(ENGINE_PATH, return_value=SUCCESS_RESULT)
    def test_success_returns_200(self, mock_engine, mock_db, mock_llm, client):
        r = client.post("/api/submit-code", json=VALID_PAYLOAD)
        assert r.status_code == 200

    @patch(LLM_PATH, return_value=None)
    @patch(DB_PATH,  return_value=None)
    @patch(ENGINE_PATH, return_value=COMPILE_ERROR_RESULT)
    def test_compile_error_returns_200(self, mock_engine, mock_db, mock_llm, client):
        r = client.post("/api/submit-code", json=VALID_PAYLOAD)
        assert r.status_code == 200

    @patch(LLM_PATH, return_value=None)
    @patch(DB_PATH,  return_value=None)
    @patch(ENGINE_PATH, return_value=RUNTIME_ERROR_RESULT)
    def test_runtime_error_returns_200(self, mock_engine, mock_db, mock_llm, client):
        r = client.post("/api/submit-code", json=VALID_PAYLOAD)
        assert r.status_code == 200

    @patch(LLM_PATH, return_value=None)
    @patch(DB_PATH,  return_value=None)
    @patch(ENGINE_PATH, return_value=TIMEOUT_RESULT)
    def test_timeout_returns_408(self, mock_engine, mock_db, mock_llm, client):
        r = client.post("/api/submit-code", json=VALID_PAYLOAD)
        assert r.status_code == 408


# ===========================================================================
# Group E – MongoDB logging behaviour
# ===========================================================================

class TestMongoLogging:
    @patch(LLM_PATH, return_value=None)
    @patch(DB_PATH,  return_value="mock_id")
    @patch(ENGINE_PATH, return_value=SUCCESS_RESULT)
    def test_log_submission_called_once(self, mock_engine, mock_db, mock_llm, client):
        client.post("/api/submit-code", json=VALID_PAYLOAD)
        mock_db.assert_called_once()

    @patch(LLM_PATH, return_value=None)
    @patch(DB_PATH,  return_value="mock_id")
    @patch(ENGINE_PATH, return_value=SUCCESS_RESULT)
    def test_log_submission_receives_correct_user_id(self, mock_engine, mock_db, mock_llm, client):
        client.post("/api/submit-code", json=VALID_PAYLOAD)
        _, kwargs = mock_db.call_args
        assert kwargs["user_id"] == "test_user"

    @patch(LLM_PATH, return_value=None)
    @patch(DB_PATH,  return_value="mock_id")
    @patch(ENGINE_PATH, return_value=SUCCESS_RESULT)
    def test_log_submission_receives_correct_code(self, mock_engine, mock_db, mock_llm, client):
        client.post("/api/submit-code", json=VALID_PAYLOAD)
        _, kwargs = mock_db.call_args
        assert kwargs["code"] == VALID_PAYLOAD["code"]

    @patch(LLM_PATH, return_value=None)
    @patch(DB_PATH,  return_value="mock_id")
    @patch(ENGINE_PATH, return_value=SUCCESS_RESULT)
    def test_log_submission_receives_result_dict(self, mock_engine, mock_db, mock_llm, client):
        client.post("/api/submit-code", json=VALID_PAYLOAD)
        _, kwargs = mock_db.call_args
        assert kwargs["result"]["status"] == "Success"

    @patch(LLM_PATH, return_value=None)
    @patch(DB_PATH,  return_value=None)   # DB failure returns None
    @patch(ENGINE_PATH, return_value=SUCCESS_RESULT)
    def test_db_failure_does_not_affect_http_response(self, mock_engine, mock_db, mock_llm, client):
        """A MongoDB error must never cause a 500 to the client."""
        r = client.post("/api/submit-code", json=VALID_PAYLOAD)
        assert r.status_code == 200
        assert r.get_json()["data"]["execution"]["status"] == "Success"

    @patch(LLM_PATH, return_value=None)
    @patch(DB_PATH,  side_effect=Exception("mongo down"))
    @patch(ENGINE_PATH, return_value=SUCCESS_RESULT)
    def test_db_exception_does_not_crash_route(self, mock_engine, mock_db, mock_llm, client):
        """A raw exception from log_submission must never cause a 500 to the client."""
        r = client.post("/api/submit-code", json=VALID_PAYLOAD)
        assert r.status_code == 200
        assert r.get_json()["data"]["execution"]["status"] == "Success"


# ===========================================================================
# Group F – Global error handlers
# ===========================================================================

class TestGlobalErrorHandlers:
    def test_unknown_route_returns_404_json(self, client):
        r = client.get("/api/nonexistent")
        assert r.status_code == 404
        assert r.content_type == "application/json"
        assert r.get_json()["success"] is False
        assert r.get_json()["error"]["code"] == "NOT_FOUND"

    def test_wrong_method_on_submit_returns_405_json(self, client):
        r = client.get("/api/submit-code")
        assert r.status_code == 405
        assert r.content_type == "application/json"
        assert r.get_json()["success"] is False
        assert r.get_json()["error"]["code"] == "METHOD_NOT_ALLOWED"

    def test_wrong_method_on_health_returns_405_json(self, client):
        r = client.delete("/api/health")
        assert r.status_code == 405
        assert r.content_type == "application/json"
        assert r.get_json()["success"] is False


# ===========================================================================
# Group G – Response envelope structure
# ===========================================================================

class TestResponseEnvelope:
    """Verify the unified envelope shape on every response type."""

    def _has_envelope(self, body: dict) -> bool:
        return all(k in body for k in ("success", "data", "error"))

    def test_health_has_envelope(self, client):
        r = client.get("/api/health")
        assert self._has_envelope(r.get_json())

    @patch(LLM_PATH, return_value=None)
    @patch(DB_PATH,  return_value=None)
    @patch(ENGINE_PATH, return_value=SUCCESS_RESULT)
    def test_success_response_has_envelope(self, mock_engine, mock_db, mock_llm, client):
        r = client.post("/api/submit-code", json=VALID_PAYLOAD)
        assert self._has_envelope(r.get_json())

    def test_validation_error_has_envelope(self, client):
        r = client.post("/api/submit-code", json={})
        assert self._has_envelope(r.get_json())

    def test_404_has_envelope(self, client):
        r = client.get("/api/nonexistent")
        assert self._has_envelope(r.get_json())

    def test_405_has_envelope(self, client):
        r = client.delete("/api/health")
        assert self._has_envelope(r.get_json())

    @patch(LLM_PATH, return_value=None)
    @patch(DB_PATH,  return_value=None)
    @patch(ENGINE_PATH, return_value=SUCCESS_RESULT)
    def test_success_envelope_values(self, mock_engine, mock_db, mock_llm, client):
        """success=True → data populated, error null."""
        body = client.post("/api/submit-code", json=VALID_PAYLOAD).get_json()
        assert body["success"] is True
        assert body["data"] is not None
        assert body["error"] is None

    def test_error_envelope_values(self, client):
        """success=False → error populated, data null."""
        body = client.post("/api/submit-code", json={}).get_json()
        assert body["success"] is False
        assert body["data"] is None
        assert body["error"] is not None

