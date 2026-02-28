"""
routes.py
---------
Flask Blueprint containing all API routes for the AI-Based Java Tutor.

Routes
~~~~~~
GET  /api/health        – Liveness probe.
POST /api/submit-code   – Accept Java code, execute it, optionally hint, log to DB.

Response envelope (all routes)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Every response – success or failure – uses the shape defined in ``response.py``::

    {"success": bool, "data": {} | null, "error": {} | null}

Design notes
~~~~~~~~~~~~
* Handlers are thin: validate → execute → hint → log → respond.
* No pymongo, no subprocess, no OpenAI imports here.
* LLM hint generation is injected via ``llm.generate_hint()``; enabling it
  requires only changing ``LLM_ENABLED=true`` — zero route code changes.
"""

import logging
from http import HTTPStatus
from typing import Optional

from flask import Blueprint, request

from db import log_submission
from java_engine import execute_java_code
from llm import generate_hint
from response import ErrorCode, fail, ok

logger = logging.getLogger(__name__)

# Blueprint – all routes are mounted under /api (configured in app.py).
api_bp = Blueprint("api", __name__)


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _validate_body(body: Optional[dict]) -> Optional[tuple]:
    """
    Validate the request body for ``/submit-code``.

    Returns a ``(response, status_code)`` error tuple when validation fails,
    or ``None`` when the body is valid.  The caller returns early on non-None.
    """
    if not body:
        return fail(
            message="Request body must be valid JSON.",
            code=ErrorCode.INVALID_INPUT,
            http_status=HTTPStatus.BAD_REQUEST,
        )

    if not (body.get("user_id") or "").strip():
        return fail(
            message="Field 'user_id' is required and must not be empty.",
            code=ErrorCode.MISSING_FIELD,
            details={"field": "user_id"},
            http_status=HTTPStatus.BAD_REQUEST,
        )

    if not (body.get("code") or "").strip():
        return fail(
            message="Field 'code' is required and must not be empty.",
            code=ErrorCode.MISSING_FIELD,
            details={"field": "code"},
            http_status=HTTPStatus.BAD_REQUEST,
        )

    return None  # all good


def _http_status_for(execution_status: str) -> int:
    """
    Map an engine status string to an HTTP status code.

    ================ =======  ================================================
    Execution status   Code   Rationale
    ================ =======  ================================================
    Success              200  Request and execution both succeeded.
    CompilationError     200  Server did its job; the Java code is the issue.
    RuntimeError         200  Same – diagnostic info returned to client.
    Timeout              408  Communicates the specific cause to the client.
    ================ =======  ================================================
    """
    return HTTPStatus.REQUEST_TIMEOUT if execution_status == "Timeout" else HTTPStatus.OK


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@api_bp.route("/health", methods=["GET"])
def health():
    """
    GET /api/health
    ---------------
    Liveness probe for load balancers and deployment health checks.

    Response::

        {"success": true, "data": {"status": "Backend Running"}, "error": null}
    """
    return ok({"status": "Backend Running"})


@api_bp.route("/submit-code", methods=["POST"])
def submit_code():
    """
    POST /api/submit-code
    ---------------------
    Accept a Java code snippet, compile and execute it, optionally generate
    an LLM hint, persist the result to MongoDB, and return a structured
    JSON response.

    Request body
    ~~~~~~~~~~~~
    .. code-block:: json

        {"user_id": "alice", "code": "public class Main { ... }"}

    Success response
    ~~~~~~~~~~~~~~~~
    .. code-block:: json

        {
            "success": true,
            "data": {
                "user_id": "alice",
                "execution": {"status": "Success", "output": "...", ...},
                "hint": null
            },
            "error": null
        }

    Error response (e.g. missing field)
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    .. code-block:: json

        {
            "success": false,
            "data": null,
            "error": {"message": "...", "code": "MISSING_FIELD", "details": {...}}
        }
    """
    # ------------------------------------------------------------------
    # 1. Parse and validate
    # ------------------------------------------------------------------
    body = request.get_json(silent=True)  # silent=True: bad JSON → None, not 400

    validation_error = _validate_body(body)
    if validation_error:
        return validation_error

    user_id: str = body["user_id"].strip()
    code:    str = body["code"].strip()

    # ------------------------------------------------------------------
    # 2. Execute Java code
    # ------------------------------------------------------------------
    try:
        result = execute_java_code(code)
    except Exception as exc:
        logger.exception("execute_java_code raised unexpectedly for user=%s", user_id)
        return fail(
            message="Internal error during code execution.",
            code=ErrorCode.EXECUTION_FAILED,
            details={"detail": str(exc)},
            http_status=HTTPStatus.INTERNAL_SERVER_ERROR,
        )

    # ------------------------------------------------------------------
    # 3. LLM hint generation
    #    Controlled entirely by LLM_ENABLED env var – no code change needed
    #    to activate. generate_hint() returns None when disabled.
    # ------------------------------------------------------------------
    hint: Optional[str] = None
    if result["status"] != "Success":
        try:
            hint = generate_hint(code=code, result=result)
        except Exception as exc:  # noqa: BLE001
            logger.error("generate_hint raised unexpectedly: %s", exc)

    # ------------------------------------------------------------------
    # 4. Persist to MongoDB  (non-fatal – logging failure ≠ API failure)
    # ------------------------------------------------------------------
    try:
        log_submission(user_id=user_id, code=code, result=result)
    except Exception as exc:  # noqa: BLE001
        logger.error("log_submission raised unexpectedly: %s", exc)

    # ------------------------------------------------------------------
    # 5. Build and return response
    # ------------------------------------------------------------------
    data = {
        "user_id":   user_id,
        "execution": result,
        "hint":      hint,
    }

    return ok(data, http_status=_http_status_for(result["status"]))
