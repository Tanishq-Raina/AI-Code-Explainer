# AI-Based Java Tutor — Backend

Flask REST API for an **Adaptive AI-Based Java Programming Tutor**.

The backend:
- Compiles and executes Java code submissions in a sandboxed subprocess.
- Persists execution results to MongoDB.
- Generates structured, progressive LLM hints via a local LM Studio endpoint.
- Tracks per-user hint escalation (level 1 → 2 → 3) across submissions.

---

## Table of Contents

1. [Codebase Overview](#codebase-overview)
2. [Module Descriptions](#module-descriptions)
3. [Prerequisites](#prerequisites)
4. [Environment Variables](#environment-variables)
5. [Running the Server](#running-the-server)
6. [API Reference](#api-reference)
   - [GET /api/health](#get-apihealth)
   - [POST /api/submit-code](#post-apisubmit-code)
7. [Response Envelope](#response-envelope)
8. [Execution Status Codes](#execution-status-codes)
9. [Error Codes](#error-codes)
10. [HTTP Status Code Mapping](#http-status-code-mapping)
11. [LLM Hint Generation](#llm-hint-generation)
12. [Progressive Hint Escalation System](#progressive-hint-escalation-system)
13. [MongoDB Collections](#mongodb-collections)
14. [Running Tests](#running-tests)
15. [Wiring hint_manager into routes.py](#wiring-hint_manager-into-routespy)
16. [Development Environment](#development-environment)
17. [Known Constraints and Rules](#known-constraints-and-rules)
18. [Next Steps](#next-steps)

---

## Codebase Overview

```
project root/
├── backend/
│   ├── app.py              # Flask application factory + global error handlers
│   ├── routes.py           # API Blueprint (all route handlers)
│   ├── java_engine.py      # Secure Java compile-and-execute engine
│   ├── db.py               # MongoDB persistence layer (submissions collection)
│   ├── response.py         # Unified JSON envelope builders: ok() / fail()
│   ├── llm.py              # LLM hint generation via LM Studio (fully implemented)
│   ├── hint_manager.py     # Progressive hint escalation tracker (hint_state collection)
│   └── README.md           # This file
│
├── test_flask_backend.py   # 49 unit tests for routes + app
├── test_llm.py             # 65 unit tests for llm.py
├── test_hint_manager.py    # 41 unit tests for hint_manager.py
├── live_llm_test.py        # Live 5-test integration test against LM Studio
│
├── master_prompt.txt       # Project specification / AI context document
├── .gitignore
└── .venv/                  # Python virtual environment
```

---

## Module Descriptions

### `app.py`
Flask application factory using the `create_app()` pattern. Registers `api_bp`
(from `routes.py`) at prefix `/api`. Attaches global error handlers for
400 / 404 / 405 / 500 that all use `fail()` from `response.py`, ensuring every
HTTP response — including Flask-generated error pages — uses the same JSON
envelope. Entry point when running directly: `python app.py`.

### `routes.py`
Flask Blueprint with all route handlers. Imports `generate_hint` from `llm.py`
and `log_submission` from `db.py`. Route logic follows the strict pipeline:
**validate → execute → hint → log → respond**. No pymongo, no subprocess, no
OpenAI imports live here.

Current routes:
- `GET  /api/health`      — liveness probe
- `POST /api/submit-code` — main code submission endpoint

### `java_engine.py`
Secure Java execution engine. For each submission:
1. Creates a temporary sandbox directory under `%TEMP%/java_exec/<uuid>/`.
2. Writes `Main.java`, compiles with `javac`, runs with `java`.
3. Enforces a 5-second execution timeout; kills the entire process tree on
   Windows using `taskkill /F /T /PID`.
4. Returns a structured dict: `{"status": ..., "output": ..., "error_message": ...,
   "line_number": ..., "exception_type": ...}`.
5. Cleans up the sandbox directory after every run.

**Do NOT modify this file.** All 7 unit tests pass and the engine is stable.

### `db.py`
MongoDB persistence layer for submission logs. Maintains a lazy-initialized
module-level `MongoClient` singleton. Exposes one public function:
`log_submission(user_id, code, result)`. Absorbs `PyMongoError` — a DB failure
must never cause the API to return an error to the client.

Collection: `submissions`. Schema:
```
user_id, code, status, output, error, submitted_at (UTC),
line_number (optional), exception_type (optional)
```

### `response.py`
Zero-dependency envelope builder. No Flask routes, no DB imports — safe to
import anywhere. Provides:
- `ErrorCode` — string constants: `MISSING_FIELD`, `INVALID_INPUT`,
  `EXECUTION_FAILED`, `INTERNAL_ERROR`, `NOT_FOUND`, `METHOD_NOT_ALLOWED`, `TIMEOUT`
- `ok(data, http_status=200)` → `{"success": True, "data": data, "error": None}`
- `fail(message, code, details, http_status=400)` → `{"success": False, "data": None, "error": {...}}`

### `llm.py`
**Fully implemented** LLM integration layer. Communicates with a local LM Studio
server (OpenAI-compatible chat completions endpoint) to generate structured,
progressive hints.

Key implementation details:
- Uses `requests.post()` directly — no `openai` SDK dependency.
- `_build_system_prompt()` — defines teaching persona, enforces no-full-solution
  policy, bans code snippets > 2 lines, demands JSON-only output with 6 keys.
- `_build_user_prompt(code, execution_result)` — embeds code + status +
  error_message + line_number + exception_type.
- `_call_llm(system_prompt, user_prompt)` — POST to `LLM_API_URL`,
  temperature=0.3, max_tokens=1200, raises `HTTPError` on 4xx/5xx.
- `_parse_llm_response(raw_text)` — tries direct JSON parse → extracts `{...}`
  block → safe fallback dict.
- `_filter_by_hint_level(hints, hint_level)` — always returns
  `problem_summary + why + learning_tip`; adds `hint_1` (level ≥ 1),
  `hint_2` (level ≥ 2), `hint_3` (level ≥ 3).
- `generate_hints(code, execution_result, hint_level=1)` — **main public API**,
  returns structured dict or `{"status": "LLMError", "message": "..."}`.
- `generate_hint(code, result)` — **backward-compatible shim** for `routes.py`;
  calls `generate_hints()` at hint_level=3, collapses dict to formatted string
  or `None`.

Config (env vars): `LLM_ENABLED`, `LLM_BASE_URL`, `LLM_MODEL`, `LLM_TIMEOUT`.

### `hint_manager.py`
**Progressive Hint Escalation System.** Tracks how many hints a user has
requested for a specific submission and controls which hint level (1 → 2 → 3)
to provide. Stores state in a separate `hint_state` MongoDB collection with a
compound unique index on `(user_id, code_hash)`.

**Does NOT call the LLM. Does NOT generate hints. Has no Flask imports.**
Only manages escalation state.

Public API:
```python
get_current_hint_level(user_id: str, code: str, error_type: str) -> int
    # Read-only. Returns current hint level without advancing counter.

update_hint_level(user_id: str, code: str, error_type: str) -> int
    # Write. Advances counter and returns level to use for current request.

reset_hint_level(user_id: str, code: str) -> None
    # Marks submission resolved, resets counter to 1.
```

Escalation rules:
1. First time user encounters error → create record, return level 1
2. Same code + same error, called again → increment level
3. Maximum level = 3 (capped, never exceeds `MAX_HINT_LEVEL = 3`)
4. Error type changes → reset to level 1
5. `status == "Success"` → call `reset_hint_level()` from route

---

## Prerequisites

| Requirement | Minimum version | Notes |
|---|---|---|
| Python | 3.10+ | Tested on 3.13.5 |
| Java JDK | 11+ | `javac` and `java` must be on `PATH` |
| MongoDB | 6.0+ | Local instance on `localhost:27017` (default) |
| LM Studio | any | Required only when `LLM_ENABLED=true` |
| pip packages | — | `flask`, `pymongo`, `requests` |

Install Python dependencies:

```powershell
# From the project root — activate venv first
& "d:\6th sem\Mini project Software\AI-Code-Explainer\.venv\Scripts\Activate.ps1"
pip install flask pymongo requests
```

---

## Environment Variables

All variables are optional. The defaults work for a local development setup.

| Variable | Default | Description |
|---|---|---|
| `FLASK_ENV` | `development` | Set to `production` to reduce log verbosity |
| `FLASK_PORT` | `5000` | Port the development server binds to |
| `MONGO_URI` | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGO_DB_NAME` | `java_tutor` | Database name |
| `SUBMISSIONS_COLL` | `submissions` | Collection for execution logs |
| `HINT_STATE_COLL` | `hint_state` | Collection for hint escalation state |
| `LLM_ENABLED` | `false` | Set to `true` to activate LLM hint generation |
| `LLM_BASE_URL` | `http://localhost:1234/v1` | OpenAI-compatible LLM endpoint |
| `LLM_MODEL` | `qwen/qwen3-coder-30b` | Model name as shown in LM Studio |
| `LLM_TIMEOUT` | `120` | Seconds before LLM request times out |

Set variables in PowerShell before starting the server:

```powershell
$env:FLASK_ENV    = "development"
$env:MONGO_URI    = "mongodb://localhost:27017"
$env:LLM_ENABLED  = "true"
$env:LLM_BASE_URL = "http://localhost:1234/v1"
```

---

## Running the Server

### Always use the full Python path

```powershell
# Correct — uses the venv Python with all installed packages
C:/Users/tanis/AppData/Local/Programs/Python/Python313/python.exe app.py

# Also correct from within an activated venv
python app.py
```

Bare `python` or `python3` may pick up the system Python without the required
packages installed.

### Development

```powershell
& "d:\6th sem\Mini project Software\AI-Code-Explainer\.venv\Scripts\Activate.ps1"
cd "D:\6th sem\Mini project Software\AI-Code-Explainer\backend"
python app.py
```

Server starts at **http://localhost:5000**.

### Production (Windows — Waitress)

```powershell
pip install waitress
waitress-serve --port=5000 "app:create_app()"
```

### Production (Linux/Mac — Gunicorn)

```bash
gunicorn "app:create_app()" --bind 0.0.0.0:5000 --workers 4
```

---

## API Reference

All routes are prefixed with `/api`.

---

### GET /api/health

Liveness probe.

**Request**
```
GET /api/health
```

**Response — 200 OK**
```json
{
  "success": true,
  "data": { "status": "Backend Running" },
  "error": null
}
```

**Example (PowerShell)**
```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/health -Method GET
```

---

### POST /api/submit-code

Compile and execute Java code, optionally generate a hint, log to MongoDB,
return structured result.

**Request**
```
POST /api/submit-code
Content-Type: application/json
```

| Field | Type | Required | Description |
|---|---|---|---|
| `user_id` | string | Yes | Submitting user identifier. Must not be blank. |
| `code` | string | Yes | Full Java source. Must contain `class Main` with `main` method. Must not be blank. |

**Request Body**
```json
{
  "user_id": "alice",
  "code": "public class Main { public static void main(String[] args) { System.out.println(\"Hello!\"); } }"
}
```

**Response shapes**

*Success — 200 OK*
```json
{
  "success": true,
  "data": {
    "user_id": "alice",
    "execution": {
      "status": "Success",
      "output": "Hello!",
      "error_message": null
    },
    "hint": null
  },
  "error": null
}
```

*CompilationError — 200 OK*
```json
{
  "success": true,
  "data": {
    "user_id": "alice",
    "execution": {
      "status": "CompilationError",
      "error_message": "Main.java:3: error: ';' expected",
      "line_number": 3,
      "output": null
    },
    "hint": "Problem: The code is missing a semicolon.\n\nWhy it happens: ...\n\nHint 1: ..."
  },
  "error": null
}
```

*RuntimeError — 200 OK*
```json
{
  "success": true,
  "data": {
    "user_id": "alice",
    "execution": {
      "status": "RuntimeError",
      "error_message": "Exception in thread \"main\" java.lang.ArithmeticException: / by zero",
      "exception_type": "ArithmeticException",
      "line_number": 5,
      "output": null
    },
    "hint": "Problem: ...\n\nWhy it happens: ...\n\nHint 1: ..."
  },
  "error": null
}
```

*Timeout — 408 Request Timeout*
```json
{
  "success": true,
  "data": {
    "user_id": "alice",
    "execution": {
      "status": "Timeout",
      "error_message": "Execution time exceeded the 5-second limit",
      "output": null
    },
    "hint": null
  },
  "error": null
}
```

*Validation error — 400 Bad Request*
```json
{
  "success": false,
  "data": null,
  "error": {
    "message": "Field 'code' is required and must not be empty.",
    "code": "MISSING_FIELD",
    "details": { "field": "code" }
  }
}
```

**Example (PowerShell)**
```powershell
$body = @{
    user_id = "alice"
    code    = 'public class Main { public static void main(String[] args) { System.out.println("Hello"); } }'
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri         http://localhost:5000/api/submit-code `
    -Method      POST `
    -ContentType "application/json" `
    -Body        $body
```

**Example (curl)**
```bash
curl -X POST http://localhost:5000/api/submit-code \
     -H "Content-Type: application/json" \
     -d '{"user_id":"alice","code":"public class Main { public static void main(String[] a) { System.out.println(42); } }"}'
```

---

## Response Envelope

Every response from this API — including framework 404/405 errors — uses the
same JSON envelope defined in `response.py`:

```json
{
  "success": true | false,
  "data":    { ... } | null,
  "error":   null   | { "message": "...", "code": "...", "details": { ... } }
}
```

| Field | When populated | Description |
|---|---|---|
| `success` | Always | `true` if request was processed without a server error |
| `data` | `success = true` | Response payload |
| `error` | `success = false` | Error details object |
| `error.message` | `success = false` | Human-readable error description |
| `error.code` | `success = false` | Machine-readable error code (see below) |
| `error.details` | `success = false` | Optional extra context (e.g. field name) |

---

## Execution Status Codes

Appear in `data.execution.status` on successful `/submit-code` responses.

| Status | HTTP Code | Description |
|---|---|---|
| `Success` | 200 | Code compiled and ran without errors |
| `CompilationError` | 200 | `javac` rejected the code; `error_message` and `line_number` populated |
| `RuntimeError` | 200 | Code compiled but threw an uncaught exception; `exception_type` and `line_number` populated |
| `Timeout` | 408 | Execution exceeded 5-second limit; process tree killed |

---

## Error Codes

Appear in `error.code` when `success` is `false`.

| Code | HTTP | When returned |
|---|---|---|
| `MISSING_FIELD` | 400 | Required field (`user_id` or `code`) is absent or blank |
| `INVALID_INPUT` | 400 | Body missing, not valid JSON, or structurally wrong |
| `EXECUTION_FAILED` | 500 | Java engine raised an unexpected internal exception |
| `INTERNAL_ERROR` | 500 | Unhandled server error (catch-all) |
| `NOT_FOUND` | 404 | Endpoint does not exist |
| `METHOD_NOT_ALLOWED` | 405 | HTTP method not supported on this endpoint |
| `TIMEOUT` | 408 | Reserved for timeout error responses |

---

## HTTP Status Code Mapping

| Scenario | HTTP Status |
|---|---|
| Any execution outcome except Timeout | 200 |
| Java execution timed out | 408 |
| Missing / blank required field | 400 |
| Non-JSON or empty body | 400 |
| Endpoint does not exist | 404 |
| Wrong HTTP method | 405 |
| Internal server error | 500 |

---

## LLM Hint Generation

### How it works

When `LLM_ENABLED=true` and execution status is not `"Success"`, `routes.py`
calls `generate_hint(code, result)` from `llm.py`. This function:

1. Builds a system prompt defining the teaching persona (no full solutions,
   code snippets ≤ 2 lines, JSON-only output with 6 required keys).
2. Builds a user prompt embedding the code + full execution context.
3. POSTs to LM Studio's chat completions endpoint via `requests`.
4. Parses the JSON response into a structured dict.
5. Filters to the requested hint level (1/2/3).
6. Collapses the dict to a formatted multi-section string for the route.

The `hint` field in the API response is always `null` when:
- `LLM_ENABLED=false` (default)
- Execution status was `"Success"`
- LLM is unreachable or times out (non-fatal; execution result is still returned)

### Structured hint format (from `generate_hints()`)

```python
{
    "problem_summary": "One sentence describing the error.",
    "why":             "2-3 sentences explaining why the error occurs.",
    "hint_1":          "Gentlest hint — points to the area of the problem.",
    "hint_2":          "Stronger hint — describes what needs to change.",  # level >= 2
    "hint_3":          "Most direct hint — may include up to 2 lines of code.",  # level >= 3
    "learning_tip":    "Related Java concept the student should read about."
}
```

### Enabling

1. Start LM Studio and load a code-capable model.
2. Enable the LM Studio local server (default: `http://localhost:1234`).
3. Set environment variables and restart the Flask server:

```powershell
$env:LLM_ENABLED  = "true"
$env:LLM_BASE_URL = "http://localhost:1234/v1"
$env:LLM_MODEL    = "qwen/qwen3-coder-30b"
```

### Live integration test

```powershell
cd "D:\6th sem\Mini project Software\AI-Code-Explainer"
C:/Users/tanis/AppData/Local/Programs/Python/Python313/python.exe live_llm_test.py
```

Tests 5 scenarios against the real model (CompilationError, ArithmeticException,
NullPointerException, Timeout, ArrayIndexOutOfBoundsException). All 5 pass,
avg ~12s per test with `qwen/qwen3-coder-30b`.

---

## Progressive Hint Escalation System

### Overview

`hint_manager.py` tracks how many hints a user has requested for a specific
code submission and controls which hint level (1 → 2 → 3) to provide. It is
**not yet wired into `routes.py`** — see [Wiring guide](#wiring-hint_manager-into-routespy).

### Escalation sequence

```
User submits buggy code (new)  → update_hint_level() → returns 1
User clicks "get another hint" → update_hint_level() → returns 2
User clicks "get another hint" → update_hint_level() → returns 3
User clicks "get another hint" → update_hint_level() → returns 3  (capped)
User fixes code, resubmits     → reset_hint_level()  → level reset to 1
User introduces a new bug      → update_hint_level() → error changed → returns 1
```

### `hint_state` collection schema

```
{
    "_id":        ObjectId,
    "user_id":    str,       # submitting user
    "code_hash":  str,       # SHA-256 of the submitted code (64-char hex)
    "error_type": str,       # execution status at time of last hint
    "hint_level": int,       # current level (1 | 2 | 3)
    "resolved":   bool,      # True after successful submission
    "timestamp":  datetime   # UTC, last-updated time
}
```

Unique index: `(user_id, code_hash)`.

### Public API

```python
from hint_manager import get_current_hint_level, update_hint_level, reset_hint_level

# Read current level (does not advance counter)
level = get_current_hint_level(user_id, code, error_type)

# Advance counter and get level for the current request
level = update_hint_level(user_id, code, error_type)

# Mark resolved (call when status == "Success")
reset_hint_level(user_id, code)
```

---

## MongoDB Collections

### `submissions` (managed by `db.py`)

| Field | Type | Always present |
|---|---|---|
| `user_id` | string | Yes |
| `code` | string | Yes |
| `status` | string | Yes |
| `output` | string | Only on `Success` |
| `error` | string | Only on error statuses |
| `submitted_at` | datetime (UTC) | Yes |
| `line_number` | int | `CompilationError` / `RuntimeError` only |
| `exception_type` | string | `RuntimeError` only |

### `hint_state` (managed by `hint_manager.py`)

| Field | Type | Description |
|---|---|---|
| `user_id` | string | Submitting user |
| `code_hash` | string | SHA-256 of code (64-char hex) |
| `error_type` | string | Last known execution status |
| `hint_level` | int | Current level (1—3) |
| `resolved` | bool | True if issue was fixed |
| `timestamp` | datetime (UTC) | Last update time |

---

## Running Tests

All tests use mocks — no running Flask server, MongoDB, Java, or LLM required.

### Run the full suite

```powershell
cd "D:\6th sem\Mini project Software\AI-Code-Explainer"
C:/Users/tanis/AppData/Local/Programs/Python/Python313/python.exe -m pytest test_flask_backend.py test_llm.py test_hint_manager.py -v
```

Expected: **155 tests pass** (49 + 65 + 41).

### Individual suites

```powershell
# Flask routes and app — 49 tests
C:/Users/tanis/AppData/Local/Programs/Python/Python313/python.exe -m pytest test_flask_backend.py -v

# LLM module — 65 tests
C:/Users/tanis/AppData/Local/Programs/Python/Python313/python.exe -m pytest test_llm.py -v

# Hint escalation manager — 41 tests
C:/Users/tanis/AppData/Local/Programs/Python/Python313/python.exe -m pytest test_hint_manager.py -v
```

### Test groups

**`test_flask_backend.py`** (49 tests)
- `TestHealth` (6) — GET /api/health envelope and methods
- `TestInputValidation` (10) — missing/blank/invalid fields
- `TestExecutionOutcomes` (13) — all four statuses, hint propagation
- `TestHttpStatusCodes` (4) — 200 / 408 mapping
- `TestMongoLogging` (6) — log_submission calls and fault tolerance
- `TestGlobalErrorHandlers` (3) — 404 / 405 as JSON
- `TestResponseEnvelope` (7) — envelope shape on success and failure

**`test_llm.py`** (65 tests)
- `TestBuildSystemPrompt` (9) — teaching policy rules in prompt
- `TestBuildUserPrompt` (9) — code + execution context embedding
- `TestParseLlmResponse` (7) — JSON parse, markdown fence extraction, fallback
- `TestFilterByHintLevel` (11) — progressive unlock logic
- `TestGenerateHintsDisabled` (4) — LLM_ENABLED=false path
- `TestGenerateHintsHappyPath` (9) — successful LLM call + filtering
- `TestGenerateHintsErrors` (7) — ConnectionError, Timeout, HTTPError, etc.
- `TestGenerateHintShim` (9) — backward-compat shim string formatting

**`test_hint_manager.py`** (41 tests)
- `TestHashCode` (4) — SHA-256 correctness
- `TestGetCurrentHintLevelNew` (4) — no-record path → level 1
- `TestGetCurrentHintLevelKnown` (5) — stored doc scenarios
- `TestUpdateHintLevelNew` (5) — first-submission insert
- `TestUpdateHintLevelSameError` (6) — increment + cap at MAX
- `TestUpdateHintLevelErrorChange` (4) — error type reset
- `TestResetHintLevel` (6) — resolved flag + counter reset
- `TestDatabaseErrors` (7) — PyMongoError fault tolerance

---

## Wiring hint_manager into routes.py

**This is the next development step.** `hint_manager.py` is fully built and
tested but not yet connected to `routes.py`. The current route calls
`generate_hint(code, result)` without going through escalation.

### What to change in `routes.py`

**Step 1 — Add imports at the top of `routes.py`:**

```python
from hint_manager import reset_hint_level, update_hint_level
```

**Step 2 — Replace the LLM hint block inside `submit_code()`.** Find this
section (currently around line 175 of `routes.py`):

```python
hint: Optional[str] = None
if result["status"] != "Success":
    try:
        hint = generate_hint(code=code, result=result)
    except Exception as exc:
        logger.error("generate_hint raised unexpectedly: %s", exc)
```

Replace with:

```python
hint: Optional[str] = None
if result["status"] == "Success":
    # Issue resolved — reset escalation counter so next bug starts at level 1
    try:
        reset_hint_level(user_id=user_id, code=code)
    except Exception as exc:
        logger.error("reset_hint_level raised unexpectedly: %s", exc)
else:
    # Advance escalation counter, then generate hint at the new level
    try:
        hint_level = update_hint_level(
            user_id=user_id,
            code=code,
            error_type=result["status"],
        )
        hint = generate_hint(code=code, result=result)
    except Exception as exc:
        logger.error("hint generation raised unexpectedly: %s", exc)
```

**Step 3 — Optionally expose `hint_level` in the response** so the frontend
can show "Hint 1 of 3", "Hint 2 of 3", etc. Inside the `data` dict at the
bottom of `submit_code()`:

```python
data = {
    "user_id":    user_id,
    "execution":  result,
    "hint":       hint,
    "hint_level": hint_level if result["status"] != "Success" else None,
}
```

### Tests to add after wiring

Add a `TestHintEscalation` group to `test_flask_backend.py` covering:
- First request → `update_hint_level` called once, returns 1
- Second request same error → `update_hint_level` returns 2
- `Success` result → `reset_hint_level` called, `update_hint_level` not called
- `hint_manager` DB error does not affect HTTP response code or shape

---

## Development Environment

| Item | Value |
|---|---|
| OS | Windows 11 |
| Python executable | `C:/Users/tanis/AppData/Local/Programs/Python/Python313/python.exe` |
| Virtual env | `D:\6th sem\Mini project Software\AI-Code-Explainer\.venv` |
| Python version | 3.13.5 |
| Flask | 3.1.3 |
| pymongo | 4.16.0 |
| pytest | 8.4.1 |
| requests | installed in venv |
| MongoDB | localhost:27017, database: `java_tutor` |
| LM Studio | http://localhost:1234/v1, model: `qwen/qwen3-coder-30b` |

---

## Known Constraints and Rules

1. **`java_engine.py` must not be modified.** It is stable and all 7 tests pass.
2. **No pymongo imports in `routes.py`.** All DB access goes through `db.py`
   or `hint_manager.py`.
3. **No Flask imports in `llm.py` or `hint_manager.py`.** These are
   pure-logic / persistence modules.
4. **No LLM calls in `hint_manager.py`.** It only manages escalation state.
5. **All `PyMongoError` exceptions must be caught** in `db.py` and
   `hint_manager.py` — a DB failure must never return an error to the client.
6. **All LLM errors must be non-fatal** in `llm.py` — the API still returns
   the execution result even when the LLM is unreachable.
7. Every HTTP response (including 404/405) must use the `ok()` / `fail()`
   envelope from `response.py`.
8. The `hint` field in the API response is always a **plain string or `null`**
   (never a raw dict) — the `generate_hint()` shim handles collapse.
9. `LLM_ENABLED` defaults to `false` — enabling requires an explicit env var.
   The server must work correctly during development without LM Studio running.
10. The `live_llm_test.py` file lives at the project root (not inside `backend/`)
    because it patches `llm.LLM_ENABLED` directly as a module attribute.
11. Always run Python via the full path
    `C:/Users/tanis/AppData/Local/Programs/Python/Python313/python.exe` outside
    an activated venv to avoid picking up the wrong interpreter.

---

## Next Steps

Priority order for continued development:

1. **Wire `hint_manager` into `routes.py`** (see [wiring guide](#wiring-hint_manager-into-routespy)).
   Update `test_flask_backend.py` with `TestHintEscalation` group.
2. **Expose `hint_level` in the API response** — add `data.hint_level` so the
   frontend can display "Hint 1 of 3", "Hint 2 of 3", etc.
3. **Build the frontend** — React or plain HTML/JS that calls `/api/submit-code`
   and renders execution results + hints with a "Get another hint" button.
4. **Add `GET /api/hint-status/{user_id}`** — lets the frontend query current
   hint level without requiring a new code submission.
5. **Add authentication** — replace bare `user_id` string with JWT or session
   tokens so hint state cannot be spoofed.
6. **Add rate limiting** — prevent hint-farming via rapid identical submissions.
