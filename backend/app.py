"""
app.py
------
Flask application factory for the AI-Based Java Programming Tutor backend.

Usage
~~~~~
Development::

    set FLASK_ENV=development
    python app.py

Production (gunicorn example)::

    gunicorn "app:create_app()" --bind 0.0.0.0:5000 --workers 4

Environment variables
~~~~~~~~~~~~~~~~~~~~~
FLASK_ENV       – "development" (default) or "production"
FLASK_PORT      – port to listen on (default 5000)
MONGO_URI       – MongoDB connection string (default mongodb://localhost:27017)
MONGO_DB_NAME   – database name (default java_tutor)
LLM_ENABLED     – "true" to activate LLM hint generation (default false)
LLM_BASE_URL    – OpenAI-compatible endpoint (default http://localhost:1234/v1)

Architecture
~~~~~~~~~~~~
``create_app()`` is the sole entry point.  It:

1. Registers the ``api_bp`` Blueprint (all routes live in ``routes.py``).
2. Attaches global error handlers that use the unified JSON envelope from
   ``response.py`` so every response – including Flask’s own 404/405 pages –
   is consistent JSON.
"""

import logging
import os

from flask import Flask

from response import ErrorCode, fail
from routes import api_bp


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.DEBUG if os.getenv("FLASK_ENV") == "development" else logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------

def create_app() -> Flask:
    """
    Build and return a configured Flask application instance.

    The factory pattern keeps this module side-effect-free at import time,
    which is required for:
    * WSGI servers (gunicorn, uwsgi) that import before forking.
    * The test suite, which calls ``create_app().test_client()`` directly.
    """
    app = Flask(__name__)

    # ── Blueprint ─────────────────────────────────────────────────────────
    # Mounting under /api keeps all versioning changes to this one line.
    app.register_blueprint(api_bp, url_prefix="/api")

    # ── Global error handlers ─────────────────────────────────────────────
    # All handlers use ``fail()`` from response.py so every HTTP response,
    # including framework-generated errors, shares the same JSON envelope.

    @app.errorhandler(400)
    def bad_request(exc):
        return fail(
            message="Bad request.",
            code=ErrorCode.INVALID_INPUT,
            details={"detail": str(exc)},
            http_status=400,
        )

    @app.errorhandler(404)
    def not_found(exc):
        return fail(
            message="Endpoint not found.",
            code=ErrorCode.NOT_FOUND,
            http_status=404,
        )

    @app.errorhandler(405)
    def method_not_allowed(exc):
        return fail(
            message="Method not allowed.",
            code=ErrorCode.METHOD_NOT_ALLOWED,
            http_status=405,
        )

    @app.errorhandler(500)
    def internal_error(exc):
        logger.exception("Unhandled server error")
        return fail(
            message="Internal server error.",
            code=ErrorCode.INTERNAL_ERROR,
            details={"detail": str(exc)},
            http_status=500,
        )

    logger.info("Flask app created – blueprint registered at /api")
    return app


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5000))
    debug = os.getenv("FLASK_ENV", "development") == "development"

    application = create_app()

    logger.info("Starting Flask dev server on port %d  (debug=%s)", port, debug)
    application.run(host="0.0.0.0", port=port, debug=debug)
