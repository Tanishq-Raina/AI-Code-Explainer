"""
app.py
------
Flask application entry point for the AI Java Tutor backend.

Registered endpoints
--------------------
  POST /api/submit               - Record a Java submission
  GET  /api/user-progress/<id>   - Learning analytics dashboard for a student
  GET  /api/encouragement/<id>   - Motivational message for the latest topic
  POST /api/users                - Create a new student profile
"""

from flask import Flask, request, jsonify
from database import create_user, get_user
from submission_service import detect_topic_from_error, save_submission
from topic_analyzer import get_learning_summary
from encouragement_engine import generate_encouragement

app = Flask(__name__)

# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health():
    """Quick liveness probe."""
    return jsonify({"status": "ok"}), 200


# ---------------------------------------------------------------------------
# User management
# ---------------------------------------------------------------------------

@app.route("/api/users", methods=["POST"])
def create_student():
    """
    Create a new student profile.

    Request body (JSON):
      { "name": "Alice" }

    Response:
      { "user_id": "<mongo_id>", "name": "Alice" }
    """
    body = request.get_json(silent=True) or {}
    name = body.get("name", "").strip()

    if not name:
        return jsonify({"error": "name is required"}), 400

    user_id = create_user(name)
    return jsonify({"user_id": user_id, "name": name}), 201


# ---------------------------------------------------------------------------
# Submission endpoint
# ---------------------------------------------------------------------------

@app.route("/api/submit", methods=["POST"])
def submit_code():
    """
    Record a Java code submission and update topic statistics.

    This endpoint is called after the Java engine has compiled / run the
    student's code and the LLM has generated hints.

    Request body (JSON):
      {
        "user_id":      "...",
        "code":         "public class Main { ... }",
        "error_type":   "NullPointerException",
        "error_message":"...",
        "hints_used":   2,
        "resolved":     false
      }

    The topic is auto-detected from the error message if not supplied.

    Response:
      { "submission_id": "...", "detected_topic": "object_handling" }
    """
    body = request.get_json(silent=True) or {}

    user_id       = body.get("user_id", "").strip()
    code          = body.get("code", "")
    error_type    = body.get("error_type", "")
    error_message = body.get("error_message", "")
    hints_used    = int(body.get("hints_used", 0))
    resolved      = bool(body.get("resolved", False))

    # Caller may supply a topic; otherwise auto-detect from the error text
    topic = body.get("topic") or detect_topic_from_error(error_message)

    if not user_id:
        return jsonify({"error": "user_id is required"}), 400

    submission_id = save_submission(
        user_id=user_id,
        code=code,
        topic=topic,
        error_type=error_type,
        error_message=error_message,
        hints_used=hints_used,
        resolved=resolved,
    )

    return jsonify({
        "submission_id":  submission_id,
        "detected_topic": topic,
    }), 201


# ---------------------------------------------------------------------------
# Learning analytics dashboard
# ---------------------------------------------------------------------------

@app.route("/api/user-progress/<user_id>", methods=["GET"])
def user_progress(user_id: str):
    """
    Return a full learning analytics summary for a student.

    Path parameter:
      user_id  - MongoDB student _id string

    Response:
      {
        "weak_topics":       ["loops"],
        "improving_topics":  ["arrays"],
        "strong_topics":     ["variables"],
        "total_submissions": 24
      }

    Returns 404 if the user does not exist.
    Returns an empty summary (no error) for users with zero submissions.
    """
    user = get_user(user_id)
    if user is None:
        return jsonify({"error": "user not found"}), 404

    summary = get_learning_summary(user_id)
    return jsonify(summary), 200


# ---------------------------------------------------------------------------
# Encouragement endpoint
# ---------------------------------------------------------------------------

@app.route("/api/encouragement/<user_id>", methods=["GET"])
def encouragement(user_id: str):
    """
    Return a motivational message for a specific topic.

    Query parameter:
      topic  - the learning topic to evaluate (e.g. ?topic=arrays)

    Response:
      {
        "show_message": true,
        "message": "Your understanding of arrays is improving!"
      }
    """
    topic = request.args.get("topic", "").strip()
    if not topic:
        return jsonify({"error": "topic query parameter is required"}), 400

    result = generate_encouragement(user_id, topic)
    return jsonify(result), 200


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    app.run(debug=True, port=5000)
