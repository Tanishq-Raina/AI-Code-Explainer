"""
response.py
-----------
Centralised JSON response builder for the AI-Based Java Programming Tutor API.

Every HTTP response produced by this backend uses the same envelope shape:

.. code-block:: json

    {
        "success": true | false,
        "data":    { ... } | null,
        "error":   null    | { "message": "...", "code": "...", "details": { ... } }
    }

Rules
~~~~~
* ``success=True``  → ``data``  is populated, ``error``  is ``null``.
* ``success=False`` → ``error`` is populated, ``data``   is ``null``.
* Callers never construct raw ``jsonify(...)`` calls in routes or error
  handlers – they call ``ok()`` or ``fail()`` instead.

This module has **no dependencies** on Flask routes, blueprints, or the
database, so it can be imported and used anywhere in the backend.
"""

from http import HTTPStatus
from typing import Any, Optional

from flask import jsonify


# ---------------------------------------------------------------------------
# Error code constants
# Used as the ``code`` field in error envelopes – gives clients a stable
# string they can switch on without parsing the human-readable message.
# ---------------------------------------------------------------------------

class ErrorCode:
    MISSING_FIELD       = "MISSING_FIELD"
    INVALID_INPUT       = "INVALID_INPUT"
    EXECUTION_FAILED    = "EXECUTION_FAILED"
    INTERNAL_ERROR      = "INTERNAL_ERROR"
    NOT_FOUND           = "NOT_FOUND"
    METHOD_NOT_ALLOWED  = "METHOD_NOT_ALLOWED"
    TIMEOUT             = "TIMEOUT"


# ---------------------------------------------------------------------------
# Public builders
# ---------------------------------------------------------------------------

def ok(data: Any, http_status: int = HTTPStatus.OK):
    """
    Return a successful ``(Response, status_code)`` tuple.

    Parameters
    ----------
    data : Any
        Payload to place in the ``data`` field.  Must be JSON-serialisable.
    http_status : int
        HTTP status code (default 200).

    Example response body::

        {"success": true, "data": {"output": "Hello"}, "error": null}
    """
    return jsonify({
        "success": True,
        "data":    data,
        "error":   None,
    }), http_status


def fail(
    message:    str,
    code:       str  = ErrorCode.INTERNAL_ERROR,
    details:    Optional[dict] = None,
    http_status: int = HTTPStatus.BAD_REQUEST,
):
    """
    Return a failure ``(Response, status_code)`` tuple.

    Parameters
    ----------
    message : str
        Human-readable description of the error (shown to the client).
    code : str
        Machine-readable error code from ``ErrorCode`` (default INTERNAL_ERROR).
    details : dict, optional
        Extra diagnostic key/value pairs (e.g. field name, line number).
    http_status : int
        HTTP status code (default 400).

    Example response body::

        {
            "success": false,
            "data": null,
            "error": {
                "message": "Field 'code' is required.",
                "code": "MISSING_FIELD",
                "details": {"field": "code"}
            }
        }
    """
    error_payload: dict = {
        "message": message,
        "code":    code,
    }
    if details:
        error_payload["details"] = details

    return jsonify({
        "success": False,
        "data":    None,
        "error":   error_payload,
    }), http_status
