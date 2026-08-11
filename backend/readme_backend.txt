================================================================================
        BACKEND ARCHITECTURE AND IMPLEMENTATION DOCUMENTATION
        Adaptive AI-Based Java Programming Tutor
================================================================================

Project Title   : Adaptive AI-Based Java Programming Tutor
Component       : Backend Server (REST API)
Framework       : Flask (Python 3.10+)
Database        : MongoDB (Atlas / Local)
LLM Integration : Qwen3 Coder 480B-A35B via RouteLLM API (OpenAI-compatible)
Last Updated    : May 2026

================================================================================
1. INTRODUCTION AND SYSTEM OVERVIEW
================================================================================

The backend server forms the core intelligence layer of the Adaptive AI-Based
Java Programming Tutor — an educational platform designed to help beginner
students learn Java programming through guided, progressive hints rather than
direct solutions. The system compiles and executes student-submitted Java code
in a secure sandbox, analyses errors using both deterministic pattern matching
and Large Language Model (LLM) inference, and delivers pedagogically structured
feedback that adapts to each student's learning trajectory.

The backend is implemented as a stateless Flask REST API that communicates with:
  - A React/Vite frontend via JSON over HTTP
  - A MongoDB database for persistence and analytics
  - An open-source LLM (qwen/qwen3-coder-480b-a35b-instruct) via RouteLLM API

Key design principles:
  (a) Never provide full solutions — guide students toward understanding
  (b) Guarantee safe responses even when the LLM hallucinates or is unavailable
  (c) Track learning progression per-student, per-topic over time
  (d) Maintain strict separation of concerns across modules

================================================================================
2. SYSTEM ARCHITECTURE
================================================================================

2.1 High-Level Architecture Diagram
------------------------------------

  +-------------------+       +-------------------+       +------------------+
  |   React Frontend  | <---> |   Flask Backend   | <---> |     MongoDB      |
  |   (Vite, port     |  HTTP |   (Port 5000)     |       |   (Atlas Cloud)  |
  |    5173)           |  JSON |                   |       |                  |
  +-------------------+       +--------+----------+       +------------------+
                                       |
                                       | HTTP (OpenAI-compatible)
                                       v
                              +-------------------+
                              |    RouteLLM API   |
                              | (Qwen3 Coder 480B |
                              |  -A35B-Instruct)  |
                              +-------------------+

2.2 Internal Module Architecture
---------------------------------

  +------------------------------------------------------------------+
  |                        app.py (Application Factory)               |
  |  - Flask app creation, CORS, Blueprint registration              |
  |  - Global error handlers (400, 404, 405, 500)                    |
  +------------------------------------------------------------------+
                                    |
                                    v
  +------------------------------------------------------------------+
  |                     routes.py (API Blueprint)                     |
  |  - /api/health, /api/submit-code, /api/request-hint              |
  |  - /api/learning-summary/<user>, /api/parse-ast                  |
  |  - /api/study/topic/<chapter_id>, /api/feedback                  |
  +------------------------------------------------------------------+
         |              |              |              |
         v              v              v              v
  +-----------+  +------------+  +-----------+  +----------------+
  |java_engine|  |   llm.py   |  |database.py|  |submission_svc  |
  |  .py      |  |            |  |           |  |  .py           |
  +-----------+  +-----+------+  +-----------+  +----------------+
                       |
              +--------+--------+
              |                  |
              v                  v
  +-------------------+  +-------------------+
  |hallucination_guard|  | fallback_engine   |
  |       .py         |  |       .py         |
  +-------------------+  +-------------------+

  Supporting modules:
  +----------------+  +----------------+  +------------------+
  | hint_manager   |  |topic_analyzer  |  |encouragement_eng |
  |     .py        |  |     .py        |  |     .py          |
  +----------------+  +----------------+  +------------------+
  +----------------+  +----------------+  +------------------+
  |  ast_parser    |  | study_prompts  |  |   response.py    |
  |     .py        |  |     .py        |  |                  |
  +----------------+  +----------------+  +------------------+

2.3 Request Processing Pipeline
--------------------------------

For the primary /api/submit-code endpoint, the processing pipeline is:

  1. VALIDATE   : Parse JSON body, check required fields (user_id, code)
  2. EXECUTE    : Compile and run Java code in isolated sandbox
  3. HINT       : Generate progressive hints via LLM + fallback pipeline
  4. DETECT     : Identify learning topic from error patterns
  5. ESCALATE   : Manage hint level state (read/write to hint_state)
  6. PERSIST    : Save submission record + update topic statistics
  7. ENCOURAGE  : Generate motivational message based on learning trend
  8. RESPOND    : Return unified JSON envelope to frontend


================================================================================
3. MODULE DESCRIPTIONS
================================================================================

3.1 app.py — Application Factory
----------------------------------
Purpose: Flask application factory using the create_app() pattern.

Responsibilities:
  - Loads environment variables from .env before any module reads os.getenv
  - Creates the Flask application instance
  - Configures CORS for the Vite development server (localhost:5173)
  - Registers the API Blueprint at the /api URL prefix
  - Attaches global error handlers (400, 404, 405, 500) that produce
    consistent JSON responses using the response.py envelope
  - Configures logging (DEBUG in development, INFO in production)

Design Rationale:
  The factory pattern (create_app()) keeps the module side-effect-free at
  import time, which is required for WSGI servers (Gunicorn, Waitress) that
  import before forking, and for the test suite which calls
  create_app().test_client() directly.

3.2 routes.py — API Route Handlers
------------------------------------
Purpose: Flask Blueprint containing all HTTP endpoint definitions.

Endpoints Implemented:
  - GET  /api/health                  : Liveness probe
  - POST /api/submit-code             : Code submission, execution, and hints
  - POST /api/request-hint            : Explicit hint escalation
  - GET  /api/learning-summary/<user> : Learning analytics summary
  - POST /api/parse-ast               : AST parsing for simulation engine
  - GET  /api/study/topic/<chapter>   : Study content retrieval
  - POST /api/feedback                : User feedback on hint quality

Design Principles:
  - Handlers are thin: validate -> execute -> hint -> log -> respond
  - No direct pymongo, subprocess, or OpenAI imports in this module
  - All persistence delegated to submission_service and database modules
  - All hint generation delegated to llm.py and fallback_engine.py
  - Non-critical auxiliary calls (MongoDB analytics) are wrapped in
    _safe_call() to prevent failures from breaking the primary response

3.3 java_engine.py — Secure Java Execution Engine
---------------------------------------------------
Purpose: Compile and execute student-submitted Java code in an isolated
sandbox environment with strict security and timeout constraints.

Architecture (4 layers):
  Layer 1: execute_java_code() — single public entry point
  Layer 2: _compile()          — writes Main.java, runs javac
  Layer 3: _run()              — launches JVM, enforces timeout
  Layer 4: _parse_*()          — regex helpers for error extraction

Security Measures:
  - Each submission gets a UUID-named temporary directory
  - Classpath restricted to sandbox directory only
  - Working directory set to sandbox (no access to system files)
  - Hard 5-second wall-clock timeout on execution
  - Entire process tree killed on timeout (taskkill /F /T on Windows,
    SIGKILL to process group on POSIX)
  - Sandbox directory always cleaned up in a finally block

Execution Statuses Returned:
  - "Success"          : Code compiled and ran without errors
  - "CompilationError" : javac rejected the code (with line number)
  - "RuntimeError"     : Uncaught exception at runtime (with exception type)
  - "Timeout"          : Execution exceeded 5-second limit

Error Parsing:
  - Compilation errors: Regex extracts first line number from javac output
  - Runtime errors: Regex extracts exception class name and line number
    from JVM stack trace

3.4 llm.py — LLM Integration Layer
-------------------------------------
Purpose: Interface with an open-source Large Language Model
(qwen/qwen3-coder-480b-a35b-instruct) via the RouteLLM API to generate
structured, progressive hints for student code errors.

Model Configuration:
  - Endpoint: RouteLLM API (OpenAI-compatible chat completions)
  - Model: qwen/qwen3-coder-480b-a35b-instruct (configurable via LLM_MODEL)
  - Temperature: 0.3 (low for consistent, focused responses)
  - Max tokens: 1200
  - Timeout: 30 seconds (configurable)

Prompt Engineering:
  System Prompt enforces:
    (1) Teaching assistant persona (not a code-writing service)
    (2) Never output full corrected programs
    (3) Never rewrite the student's entire solution
    (4) Code snippets limited to 2 lines maximum
    (5) Beginner-friendly language
    (6) JSON-only output with 6 defined keys

  User Prompt includes:
    - Full Java source code
    - Execution status, error message, line number, exception type
    - Optional question context (title, topic, description, expected output)

Progressive Hint Levels:
  Level 1 (Gentlest) : problem_summary + why + hint_1 + learning_tip
  Level 2 (Moderate) : Adds hint_2 (describes what needs to change)
  Level 3 (Direct)   : Adds hint_3 (may include up to 2 lines of code)

Response Parsing Strategy:
  1. Attempt direct JSON.loads() on raw text
  2. If fails, locate first '{' to last '}' and parse that substring
  3. If all parsing fails, return a safe generic fallback dictionary

Public API:
  generate_hints(code, execution_result, hint_level, question_context)
    -> Returns structured hint dict or {"status": "LLMError", "message": ...}

  generate_study_content(chapter_id, chapter_title, section_headings)
    -> Returns structured study material for the Learn module

3.5 hallucination_guard.py — LLM Response Validation
------------------------------------------------------
Purpose: Safety layer that validates LLM-generated hint responses before
they reach the student, rejecting malformed or pedagogically harmful output.

Validation Rules Enforced:
  (1) Input must be a dictionary
  (2) Required keys must exist: problem_summary, why, hint_1, learning_tip
  (3) Required fields must be non-empty strings
  (4) Optional keys (hint_2, hint_3) must be strings if present
  (5) No markdown code fences (```) allowed in any field
  (6) Must not resemble a full solution (detects patterns like
      "public static void main", "class main", "import java.",
      "here is the full", "complete solution")
  (7) Whitespace is normalized (multiple spaces/newlines collapsed)

Return Behavior:
  - Returns cleaned, validated dict on success
  - Returns None on any validation failure (triggers fallback pipeline)

Design Rationale:
  LLMs can hallucinate, produce malformed JSON, or violate the no-solution
  policy despite prompt instructions. This module acts as a deterministic
  safety net that catches these failures before they reach the student.

3.6 fallback_engine.py — Multi-Level Fallback Pipeline
-------------------------------------------------------
Purpose: Orchestrate a strict 4-step fallback pipeline that guarantees
a safe, helpful, educational hint response in ALL circumstances — even
when the LLM is unavailable, hallucinates, or produces invalid output.

Pipeline Steps (executed in strict order):

  Step 1: VALIDATE INITIAL LLM RESPONSE
    - Pass LLM output through hallucination_guard.validate_and_filter_response()
    - If valid -> return shaped response (pipeline complete)
    - If invalid -> proceed to Step 2

  Step 2: RETRY LLM WITH STRICT PROMPT
    - Re-query the LLM with a more constrained prompt:
      * Use ONLY execution error context (ignore student code)
      * Provide only 1-2 hints
      * No code blocks allowed
      * Very short explanations
    - Validate retry output through hallucination guard
    - If valid -> return shaped response (pipeline complete)
    - If invalid or LLM unavailable -> proceed to Step 3

  Step 3: TEMPLATE-BASED FALLBACK
    - Match normalized error message against known Java error patterns:
      * "cannot find symbol"                -> Variable/method scope guidance
      * "incompatible types"                -> Type system explanation
      * "nullpointerexception"              -> Null reference guidance
      * "arrayindexoutofboundsexception"    -> Array bounds explanation
    - If match found -> return shaped template (pipeline complete)
    - If no match -> proceed to Step 4

  Step 4: GENERIC SAFE FALLBACK (Final Guardrail)
    - Return hardcoded safe response:
      * problem_summary: "There is an issue in your code."
      * why: [raw error message from execution]
      * hint_1: "Carefully read the error message and identify the
                 problematic line."
      * learning_tip: "Focus on understanding the concept behind the error."

Response Shaping:
  All responses pass through _shape_response(dict, hint_level) which:
  - Ensures stable output schema (all required fields present)
  - Applies hint-level filtering (1=gentlest, 2=moderate, 3=direct)
  - Enforces string types and whitespace normalization

3.7 hint_manager.py — Progressive Hint Escalation System
----------------------------------------------------------
Purpose: Track and control the progressive revelation of hints for each
student's submission, managing escalation state across multiple requests.

State Management:
  - Persists to MongoDB hint_state collection
  - Unique compound index on (user_id, code_hash)
  - Code identity determined by SHA-256 hash (not raw source storage)

Escalation Rules:
  - First encounter with an error     -> Level 1
  - Same code + same error, next hint -> Level 2
  - Same code + same error, next hint -> Level 3 (maximum, capped)
  - Error type changes                -> Reset to Level 1
  - Code executes successfully        -> Reset to Level 1

Public API:
  get_current_hint_level(user_id, code, error_type) -> int
    Read-only. Returns current level without advancing counter.

  update_hint_level(user_id, code, error_type) -> int
    Write. Advances counter and returns level for current request.

  reset_hint_level(user_id, code) -> None
    Marks submission resolved, resets counter to 1.

Fault Tolerance:
  All database errors are caught and logged. On any failure, the system
  returns level 1 as a safe default — a database issue must never prevent
  the student from receiving a hint.

3.8 submission_service.py — Submission Persistence and Topic Analytics
-----------------------------------------------------------------------
Purpose: High-level service that records rich submission events and
maintains per-user, per-topic learning statistics in MongoDB.

Topic Detection:
  Maps Java compiler/runtime error messages to learning topics using a
  prioritized pattern-matching table:
    - ArrayIndexOutOfBoundsException  -> "arrays"
    - NullPointerException            -> "object_handling"
    - ClassCastException              -> "type_casting"
    - missing return statement        -> "methods"
    - cannot find symbol              -> "variables"
    - if statement / boolean          -> "conditions"
    - cannot instantiate / abstract   -> "oop"
    - Exception / throws / catch      -> "exceptions"
    - ';' expected / illegal start    -> "syntax"
    - Default                         -> "general"

Submission Recording:
  Each submission document includes:
    - user_id, code, detected_topic, error_type, error_message
    - hints_used, resolved, wrong_output
    - llm_response, hallucination_flag, confidence_score, user_feedback
    - submission_type ("run" | "submit")
    - problem_id, problem_title, problem_topic, problem_difficulty
    - timestamp

Topic Status Classification:
  After each submit-type submission, the system recalculates the topic
  status label using these rules (in priority order):
    STRONG    : successful_attempts >= 8 AND error_rate < 30%
    IMPROVING : was "weak" AND last 3 recent_attempts are all True
    WEAK      : total_errors >= 5 AND successful_attempts < 3
    Default   : keep existing status

3.9 topic_analyzer.py — Learning Analytics Engine
---------------------------------------------------
Purpose: Analyse per-user topic statistics and produce comprehensive
learning summaries for the Dashboard and Progress pages.

Key Capabilities:
  - Classify topics as weak / improving / strong / neutral
  - Compute hint-weighted success rate (penalizes hint-heavy wins)
  - Calculate activity streaks (current and longest)
  - Aggregate per-catalog-topic performance metrics
  - Generate structured "Codexa Insight" recommendations
  - Compile error breakdown by exception type
  - Track solved problems per topic for mastery calculation

Hint-Weighted Success Rate:
  A successful submission earns credit inversely proportional to hints used:
    0 hints -> 1.0 (full credit)
    1 hint  -> 0.7
    2 hints -> 0.4
    3 hints -> 0.1
    4+ hints-> 0.0

  success_rate = average weighted credit across all submit-type attempts

Codexa Insight Engine:
  Generates a single structured recommendation per request, prioritized:
    1. Dominant error type (student keeps hitting the same wall)
    2. Weak detected topic (concept area needs attention)
    3. Positive reinforcement (high success rate)
    4. Neutral onboarding message (insufficient data)

3.10 encouragement_engine.py — Motivational Message Generator
---------------------------------------------------------------
Purpose: Generate personalised motivational messages based on a student's
hint-usage patterns across topics, encouraging continued engagement.

Scoring Model:
  Each submission earns a performance score:
    score = (3 - hints_used) x difficulty_multiplier

  Difficulty multipliers:
    Easy   -> 1.0
    Medium -> 1.5
    Hard   -> 2.0

Topic Classification (per topic):
  - Split submissions into "recent" (last 5) and "older" (everything before)
  - STRONG    : recent avg score >= 70% of max possible
  - IMPROVING : recent avg is >= 30% higher than older avg (relative lift)
  - WEAK      : recent avg score < 30% of max possible
  - NEUTRAL   : fewer than 3 submissions (insufficient data)

Message Templates:
  Each status maps to a pool of randomized, topic-specific messages:
  - Improving: "Great progress! You're using fewer hints on {topic}..."
  - Strong: "You've mastered {topic}! Solving with minimal hints..."
  - Weak: "Keep going with {topic} — every attempt teaches you something..."

3.11 ast_parser.py — Language-Aware AST Parsing
-------------------------------------------------
Purpose: Parse Java and Python source code into a normalized, structured
AST representation for the frontend's code simulation and complexity
analysis features.

Technology: tree-sitter grammars (tree_sitter_java, tree_sitter_python)

Extracted Constructs:
  - Functions (method declarations, constructors, function definitions)
  - Loops (for, enhanced for, while, do-while)
  - Conditions (if, switch, conditional expressions)
  - Variables (declarators, assignments, parameters)

Output Structure:
  {
    "language": "java" | "python",
    "has_errors": bool,
    "parse_errors": [...],
    "summary": {
      "functions_count": int,
      "loops_count": int,
      "conditions_count": int,
      "variables_count": int
    },
    "features": {
      "functions": [...],
      "loops": [...],
      "conditions": [...],
      "variables": [...]
    },
    "ast": { ... }  // Serialized tree up to depth 80
  }

Design Rationale:
  The output is intentionally language-agnostic so the frontend simulation
  engine can consume one consistent shape regardless of source language.

3.12 database.py — MongoDB Persistence Layer
----------------------------------------------
Purpose: Centralised MongoDB connection management and collection accessors
for all backend modules.

Connection Management:
  - Lazy-initialized singleton MongoClient
  - TLS certificate verification via certifi (required for MongoDB Atlas
    on Windows)
  - Automatic index creation on first connection

Collections Managed:
  - users          : Registered student profiles
  - submissions    : Every code submission with full diagnostic metadata
  - topic_stats    : Per-user, per-topic learning performance counters
  - hint_state     : Progressive hint escalation state per (user, code)
  - study_content  : Cached LLM-generated study material

Indexes Created:
  - submissions: (user_id, timestamp DESC) for fast user history queries
  - submissions: (user_id, hallucination_flag) for analytics
  - submissions: (user_id, user_feedback) for feedback analytics
  - topic_stats: (user_id, topic) UNIQUE for atomic upserts
  - hint_state: (user_id, code_hash) UNIQUE for escalation state
  - study_content: (chapter_id) UNIQUE for chapter cache

Aggregation Pipelines:
  - Active dates per user (for streak calculation)
  - Topic performance aggregation (attempts, successes, accuracy)
  - Solved problem IDs by topic (for mastery tracking)
  - Error counts by type (for error breakdown chart)
  - Submissions grouped by topic (for encouragement engine)

3.13 response.py — Unified JSON Response Envelope
---------------------------------------------------
Purpose: Centralised response builder ensuring every HTTP response from
the API uses an identical JSON structure.

Envelope Schema:
  {
    "success": true | false,
    "data":    { ... } | null,
    "error":   null | { "message": "...", "code": "...", "details": {...} }
  }

Rules:
  - success=True  -> data is populated, error is null
  - success=False -> error is populated, data is null
  - No route or error handler constructs raw jsonify() calls

Error Codes (machine-readable, stable for client switching):
  - MISSING_FIELD      : Required field absent or blank
  - INVALID_INPUT      : Body missing, not valid JSON, or structurally wrong
  - EXECUTION_FAILED   : Java engine raised unexpected internal exception
  - INTERNAL_ERROR     : Unhandled server error (catch-all)
  - NOT_FOUND          : Endpoint or resource does not exist
  - METHOD_NOT_ALLOWED : HTTP method not supported on endpoint
  - TIMEOUT            : Execution time exceeded limit

3.14 study_prompts.py and study_curated_content.py — Study Material
--------------------------------------------------------------------
Purpose: Define chapter structures, LLM prompts, and curated fallback
content for the platform's "Learn" module (31 chapters covering Java
from history through advanced topics).

Content Strategy:
  - Chapters 1-3: Fallback content defined in study_prompts.py
  - Chapters 4-31: Curated static content in study_curated_content.py
  - LLM generation available as an alternative when enabled
  - Cached in MongoDB study_content collection after first generation

Each chapter contains:
  - chapter_id, title
  - sections[] with heading, content (prose), and code_example (valid Java)


================================================================================
4. API REFERENCE
================================================================================

All routes are prefixed with /api. Every response uses the unified JSON
envelope defined in response.py.

4.1 GET /api/health
--------------------
Purpose: Liveness probe for monitoring and load balancers.
Response: {"success": true, "data": {"status": "Backend Running"}, "error": null}
HTTP Status: 200

4.2 POST /api/submit-code
---------------------------
Purpose: Accept Java code, compile and execute it, generate progressive
hints on error, persist a rich submission record, and return the full
diagnostic payload.

Request Body:
  {
    "user_id":            string (required),
    "code":               string (required, Java source),
    "submission_type":    "run" | "submit" (optional, default "submit"),
    "problem_id":         int (optional),
    "problem_title":      string (optional),
    "problem_topic":      string (optional),
    "problem_difficulty": "Easy" | "Medium" | "Hard" (optional),
    "expected_output":    string (optional, for output validation),
    "question_context":   object (optional, for LLM grounding),
    "hints_used":         int (optional, from frontend HintPanel)
  }

Response Data (on error):
  {
    "user_id":        "alice",
    "submission_id":  "654abc...",
    "execution":      { "status": "RuntimeError", "error_message": "...", ... },
    "hints":          { "problem_summary": "...", "hint_1": "...", ... },
    "detected_topic": "arrays",
    "hint_level":     1,
    "encouragement":  { "show_message": true, "message": "Keep going..." }
  }

Output Mismatch Detection:
  When expected_output is provided and the program runs successfully but
  produces different output, the system:
  - Marks resolved=False (honest success rate)
  - Generates logic-focused hints via synthetic "WrongOutput" context
  - Does NOT alter the execution block (frontend shows actual output)

4.3 POST /api/request-hint
----------------------------
Purpose: Explicitly advance the hint escalation level for a (user, code,
error) combination and return the hint at the new level.

Request Body:
  {
    "user_id":          string (required),
    "code":             string (required),
    "error_type":       string (optional, default "RuntimeError"),
    "error_message":    string (optional),
    "question_context": object (optional)
  }

Response Data:
  {
    "hint_level": 2,
    "max_level":  3,
    "hint":       { "problem_summary": "...", "hint_1": "...", "hint_2": "..." }
  }

4.4 GET /api/learning-summary/<user_id>
-----------------------------------------
Purpose: Return a comprehensive structured summary of the user's learning
state across all topics.

Response Data:
  {
    "user_id":                       "alice",
    "weak_topics":                   ["loops"],
    "improving_topics":              ["arrays"],
    "strong_topics":                 ["variables"],
    "total_submissions":             24,
    "successful_submissions":        18,
    "success_rate":                  0.7234,
    "topic_performance":             [...],
    "streak":                        {"current": 5, "longest": 12, "active_dates": [...]},
    "recent_submissions":            [...],
    "encouragements":                [...],
    "error_breakdown":               [{"type": "NullPointerException", "count": 7}, ...],
    "mastered_problem_ids_by_topic": {"Loops": [1, 2, 3], ...},
    "insight":                       {"headline": "...", "detail": "...", ...}
  }

4.5 POST /api/parse-ast
-------------------------
Purpose: Parse Java or Python source code and return a structured AST
payload with extracted loops, conditions, functions, and variables for
the frontend simulation engine.

Request Body:
  {
    "language": "java" | "python" (required),
    "code":     string (required)
  }

4.6 GET /api/study/topic/<chapter_id>
--------------------------------------
Purpose: Retrieve structured study content for a specific chapter.
Serves curated static content for chapters 4-31, or LLM-generated
content (with MongoDB caching) for chapters 1-3.

Optional Query Parameter: ?section=<heading> (filter to single section)

4.7 POST /api/feedback
------------------------
Purpose: Record user feedback on the helpfulness of a previous
submission's LLM-generated hint. Used for hallucination analytics.

Request Body:
  {
    "submission_id":      string (required),
    "hallucination_flag": boolean (optional),
    "user_feedback":      "correct" | "incorrect" | "not_given"
  }

================================================================================
5. DATABASE SCHEMA
================================================================================

Database Name: ai_java_tutor

5.1 submissions Collection
----------------------------
Stores every code submission with full diagnostic and quality metadata.

Schema:
  {
    "_id":                ObjectId (auto-generated),
    "user_id":            string,
    "code":               string (full Java source),
    "detected_topic":     string (error-derived topic),
    "error_type":         string (exception class or status),
    "error_message":      string (full error text),
    "hints_used":         int (hint levels consumed),
    "resolved":           boolean (true if code ran successfully),
    "wrong_output":       boolean (true if output mismatch),
    "llm_response":       string (JSON of hints shown to student),
    "hallucination_flag": boolean (true if LLM output failed validation),
    "confidence_score":   float [0,1] or null,
    "user_feedback":      "correct" | "incorrect" | "not_given",
    "submission_type":    "run" | "submit",
    "problem_id":         int or null,
    "problem_title":      string or null,
    "problem_topic":      string (catalog topic name),
    "problem_difficulty": "Easy" | "Medium" | "Hard" or null,
    "timestamp":          datetime (UTC)
  }

Indexes:
  - (user_id ASC, timestamp DESC)
  - (user_id ASC, hallucination_flag ASC)
  - (user_id ASC, user_feedback ASC)

5.2 topic_stats Collection
-----------------------------
Per-user, per-topic learning performance counters.

Schema:
  {
    "_id":                 ObjectId,
    "user_id":             string,
    "topic":               string (error-derived topic),
    "total_errors":        int,
    "successful_attempts": int,
    "recent_attempts":     [boolean] (rolling window of last 10),
    "status":              "weak" | "improving" | "strong"
  }

Index: (user_id ASC, topic ASC) UNIQUE

5.3 hint_state Collection
---------------------------
Progressive hint escalation state per (user, code version).

Schema:
  {
    "_id":        ObjectId,
    "user_id":    string,
    "code_hash":  string (SHA-256 hex digest, 64 chars),
    "error_type": string (execution status at time of last hint),
    "hint_level": int (1 | 2 | 3),
    "resolved":   boolean,
    "timestamp":  datetime (UTC)
  }

Index: (user_id ASC, code_hash ASC) UNIQUE

5.4 study_content Collection
------------------------------
Cached study material for the Learn module.

Schema:
  {
    "_id":          ObjectId,
    "chapter_id":   string (e.g. "ch04"),
    "title":        string,
    "sections":     [{heading, content, code_example}],
    "generated_at": datetime (UTC)
  }

Index: (chapter_id ASC) UNIQUE

5.5 users Collection
---------------------
Registered student profiles.

Schema:
  {
    "_id":        ObjectId,
    "name":       string,
    "created_at": datetime (UTC)
  }

================================================================================
6. LLM INTEGRATION AND HINT GENERATION
================================================================================

6.1 Model Selection and Rationale
-----------------------------------
The system uses qwen/qwen3-coder-480b-a35b-instruct, an open-source
code-specialised large language model, accessed via the RouteLLM API.
This choice provides:
  - Strong code understanding and error analysis capabilities
  - Access to a large-scale model (480B total, 35B active parameters)
  - Low latency via RouteLLM's optimised inference infrastructure
  - Full control over model behaviour via prompt engineering
  - Open-source model with transparent capabilities and limitations

6.2 Prompt Engineering Strategy
---------------------------------
The system employs a dual-prompt architecture:

System Prompt (defines persona and constraints):
  - Role: Friendly, patient Java programming tutor
  - Policy: NEVER provide full corrected programs
  - Policy: NEVER rewrite the student's entire solution
  - Policy: Code snippets limited to 2 lines maximum
  - Policy: Focus on WHY errors occur, not just WHAT to fix
  - Format: JSON-only output with 6 defined keys

User Prompt (provides context for each submission):
  - Full Java source code
  - Execution status (Success/CompilationError/RuntimeError/Timeout)
  - Error message (full compiler or runtime output)
  - Line number (when available)
  - Exception type (when available)
  - Question context (title, topic, description, expected output)

6.3 Progressive Hint Revelation
---------------------------------
Hints are generated at all three levels simultaneously but revealed
progressively to the student:

  Level 1 (Gentlest):
    - problem_summary: One sentence describing the error
    - why: 2-3 sentences explaining why the error occurs conceptually
    - hint_1: Points to the area of the problem
    - learning_tip: Related Java concept to study

  Level 2 (Moderate):
    - All of Level 1, plus:
    - hint_2: Describes what needs to change without showing code

  Level 3 (Most Direct):
    - All of Level 2, plus:
    - hint_3: May include up to 2 lines of illustrative code

6.4 Safety Pipeline (Hallucination Mitigation)
------------------------------------------------
The system implements a multi-layered safety approach:

  Layer 1 - Prompt Constraints:
    System prompt explicitly forbids full solutions and limits code output.

  Layer 2 - Hallucination Guard:
    Deterministic validation of LLM output structure and content.
    Rejects responses containing code fences, full solutions, or
    missing required fields.

  Layer 3 - Fallback Pipeline:
    4-step cascade ensuring a safe response is always delivered:
    Validate -> Retry with strict prompt -> Template match -> Generic safe

  Layer 4 - User Feedback Loop:
    Students can mark hints as "correct" or "incorrect", feeding back
    into hallucination analytics for system improvement.

================================================================================
7. LEARNING ANALYTICS AND ADAPTIVE FEATURES
================================================================================

7.1 Topic Detection from Errors
---------------------------------
The system automatically categorises student errors into learning topics
using pattern matching against Java compiler and runtime error messages.
This enables per-topic tracking without requiring manual annotation.

Supported Topics:
  arrays, object_handling, type_casting, loops, methods, variables,
  conditions, oop, exceptions, syntax, general

7.2 Hint-Weighted Success Rate
--------------------------------
Traditional success rate (solved/total) does not capture learning quality.
The system implements a hint-weighted metric that penalises heavy hint
usage:

  weight(hints_used) = max(0, 1.0 - 0.3 * hints_used)

  Interpretation:
    - Solving without hints: full credit (1.0)
    - Solving with 1 hint: 70% credit
    - Solving with 2 hints: 40% credit
    - Solving with 3 hints: 10% credit
    - Solving with 4+ hints: 0% credit

  success_rate = sum(weight * resolved) / total_submit_attempts

7.3 Activity Streak Tracking
------------------------------
The system tracks consecutive days of activity:
  - Current streak: consecutive days ending today or yesterday
  - Longest streak: longest consecutive run in history
  - Active dates: deduplicated list of all activity days

Rules:
  - Two same-day submissions don't double-count
  - Monday's streak survives until Tuesday night (grace period)

7.4 Encouragement Engine
--------------------------
Generates personalised motivational messages based on hint-usage trends:

  Performance Score = (3 - hints_used) x difficulty_multiplier
  
  Classification uses recent (last 5) vs older submissions:
    Strong    : recent avg >= 70% of max possible
    Improving : recent avg >= 30% better than older avg
    Weak      : recent avg < 30% of max possible

  Messages are randomized from topic-specific template pools to avoid
  repetition and maintain engagement.

7.5 Codexa Insight Engine
---------------------------
Generates a single structured recommendation per learning summary request:

  Priority 1: Dominant error type (>= 3 occurrences or >= 50% of errors)
    -> Specific advice for that error category

  Priority 2: Weak topic detected
    -> Topic-specific study recommendation

  Priority 3: High success rate (>= 80%)
    -> Positive reinforcement, suggest harder problems

  Priority 4: Insufficient data
    -> Neutral encouragement to keep practicing

================================================================================
8. SECURITY CONSIDERATIONS
================================================================================

8.1 Code Execution Sandboxing
  - Each submission runs in an isolated UUID-named temporary directory
  - Classpath restricted to sandbox only (no system library access)
  - Hard 5-second timeout with full process tree termination
  - Sandbox always cleaned up regardless of execution outcome
  - No network access from executed student code

8.2 Input Validation
  - All request bodies validated for required fields before processing
  - User IDs and code fields must be non-empty strings
  - Submission types restricted to known values ("run", "submit")
  - User feedback restricted to known values ("correct", "incorrect", "not_given")

8.3 LLM Output Sanitisation
  - Hallucination guard rejects responses with code fences
  - Full-solution detection prevents policy violations
  - Fallback pipeline ensures safe output even on LLM failure
  - No raw LLM output ever reaches the student without validation

8.4 Database Security
  - MongoDB connection uses TLS with certificate verification (certifi)
  - Environment variables used for connection strings (never hardcoded)
  - ObjectId validation before database queries
  - PyMongoError caught and logged (never exposed to client)

================================================================================
9. CONFIGURATION AND ENVIRONMENT
================================================================================

9.1 Environment Variables
---------------------------
Variable          | Default                      | Description
------------------|------------------------------|----------------------------------
FLASK_ENV         | development                  | "development" or "production"
FLASK_PORT        | 5000                         | Server port
MONGO_URI         | (from .env)                  | MongoDB connection string
LLM_ENABLED       | false                        | Enable LLM hint generation
LLM_BASE_URL      | (from .env)                  | RouteLLM API endpoint
LLM_MODEL         | qwen/qwen3-coder-480b-a35b-instruct | Model identifier
LLM_TIMEOUT       | 30                           | LLM request timeout (seconds)
ROUTELLM_API_KEY  | (from .env)                  | RouteLLM API key for authentication

9.2 Prerequisites
-------------------
Requirement    | Minimum Version | Notes
---------------|-----------------|--------------------------------------
Python         | 3.10+           | Tested on 3.13
Java JDK       | 11+             | javac and java must be on PATH
MongoDB        | 6.0+            | Local or Atlas cloud
RouteLLM API   | —               | API key required when LLM_ENABLED=true
Node.js        | 18+             | For frontend only

9.3 Python Dependencies
-------------------------
  - flask           : Web framework
  - flask-cors      : Cross-Origin Resource Sharing
  - pymongo         : MongoDB driver
  - requests        : HTTP client for LLM API
  - python-dotenv   : Environment variable loading
  - certifi         : TLS certificate bundle
  - tree-sitter     : AST parsing framework
  - tree-sitter-java: Java grammar for tree-sitter
  - tree-sitter-python: Python grammar for tree-sitter

================================================================================
10. TESTING AND EVALUATION
================================================================================

10.1 Unit Test Suites
  - test_flask_backend.py  : 49 tests for routes and app factory
  - test_llm.py            : 65 tests for LLM integration layer
  - test_hint_manager.py   : 41 tests for hint escalation system
  - test_fallback_engine.py: 7 tests for fallback pipeline
  - Total: 162+ automated unit tests (all mocked, no external deps)

10.2 Integration Tests
  - live_llm_test.py: 5 scenarios against real RouteLLM API
    (CompilationError, ArithmeticException, NullPointerException,
     Timeout, ArrayIndexOutOfBoundsException)
  - Average response time: ~12 seconds per hint with Qwen3 Coder 480B

10.3 Evaluation Scripts (in /evaluation directory)
  - hallucination_guard_eval.py : Measures guard accuracy
  - hint_accuracy_eval.py       : Evaluates hint relevance
  - time_complexity_eval.py     : Validates complexity analysis
  - Results stored as JSON for reproducibility

================================================================================
11. DESIGN DECISIONS AND RATIONALE
================================================================================

11.1 Why Flask (not FastAPI/Django)?
  - Lightweight and minimal for a REST API with no ORM needs
  - Factory pattern supports clean testing and WSGI deployment
  - Blueprint system provides clean route organisation
  - Sufficient for the synchronous request-response pattern used

11.2 Why Open-Source LLM via RouteLLM (not Proprietary Cloud API)?
  - Open-source model ensures transparency and reproducibility
  - RouteLLM provides optimised inference without self-hosting overhead
  - Full control over model selection and prompt tuning
  - Cost-effective compared to proprietary API providers
  - Reproducible results for academic evaluation

11.3 Why MongoDB (not SQL)?
  - Flexible schema accommodates evolving submission metadata
  - Native JSON document storage matches API response shapes
  - Aggregation pipeline supports complex analytics queries
  - Atlas cloud deployment simplifies production hosting

11.4 Why Progressive Hints (not Immediate Solutions)?
  - Pedagogical research supports scaffolded learning
  - Students develop problem-solving skills through guided discovery
  - Hint-weighted metrics incentivise independent thinking
  - Escalation system respects student autonomy (they choose when to ask)

11.5 Why Multi-Level Fallback (not LLM-Only)?
  - LLMs can hallucinate, especially on edge-case errors
  - Template fallbacks provide guaranteed-correct guidance for common errors
  - Generic fallback ensures the system NEVER returns an empty response
  - Layered approach maximises quality while guaranteeing safety

================================================================================
12. FILE LISTING AND RESPONSIBILITIES SUMMARY
================================================================================

File                        | Lines | Primary Responsibility
----------------------------|-------|-----------------------------------------------
app.py                      | ~110  | Flask factory, CORS, error handlers
routes.py                   | ~500  | All API endpoint handlers
java_engine.py              | ~280  | Secure Java compilation and execution
llm.py                      | ~350  | LLM communication and prompt engineering
hallucination_guard.py      | ~75   | LLM output validation and filtering
fallback_engine.py          | ~160  | 4-step fallback pipeline orchestration
hint_manager.py             | ~220  | Progressive hint escalation state
submission_service.py       | ~200  | Submission persistence + topic stats
topic_analyzer.py           | ~350  | Learning analytics and insight engine
encouragement_engine.py     | ~200  | Motivational message generation
ast_parser.py               | ~200  | Tree-sitter AST parsing (Java/Python)
database.py                 | ~400  | MongoDB connection and collection helpers
response.py                 | ~80   | Unified JSON response envelope
study_prompts.py            | ~960  | Chapter definitions and fallback content
study_curated_content.py    | ~2800 | Curated study material (chapters 4-31)

Total backend codebase: approximately 6,900 lines of Python

================================================================================
13. CONCLUSION
================================================================================

The backend of the Adaptive AI-Based Java Programming Tutor implements a
robust, multi-layered architecture that combines:

  (1) Secure code execution with strict sandboxing and timeout enforcement
  (2) AI-powered hint generation with hallucination mitigation
  (3) Progressive pedagogical scaffolding through hint escalation
  (4) Comprehensive learning analytics with adaptive feedback
  (5) Deterministic fallback mechanisms guaranteeing system reliability

The system prioritises student learning over convenience — it never provides
direct solutions, instead guiding students through progressive hints that
build conceptual understanding. The multi-level fallback pipeline ensures
that even when the LLM produces incorrect output, the student always receives
safe, helpful, and educationally sound guidance.

================================================================================
END OF DOCUMENT
================================================================================
