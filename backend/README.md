# AI-Based Java Tutor — Backend

Flask REST API that compiles and executes Java code submissions, persists
results to MongoDB, and optionally generates LLM-powered hints.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Prerequisites](#prerequisites)
3. [Environment Variables](#environment-variables)
4. [Running the Server](#running-the-server)
5. [API Reference](#api-reference)
   - [GET /api/health](#get-apihealth)
   - [POST /api/submit-code](#post-apisubmit-code)
6. [Response Envelope](#response-envelope)
7. [Execution Status Codes](#execution-status-codes)
8. [Error Codes](#error-codes)
9. [HTTP Status Code Mapping](#http-status-code-mapping)
10. [Enabling LLM Hints](#enabling-llm-hints)
11. [Running Tests](#running-tests)

---

## Project Structure

```
backend/
├── app.py          # Flask application factory + global error handlers
├── routes.py       # API Blueprint (all route handlers)
├── java_engine.py  # Secure Java compile-and-execute engine
├── db.py           # MongoDB persistence layer
├── response.py     # Unified JSON envelope builders: ok() / fail()
└── llm.py          # LLM hint generation layer (stub until activated)
```

---

## Prerequisites

| Requirement | Minimum version | Notes |
|---|---|---|
| Python | 3.10+ | Tested on 3.13.5 |
| Java JDK | 11+ | `javac` and `java` must be on `PATH` |
| MongoDB | 6.0+ | Local instance on `localhost:27017` (default) |
| pip packages | — | `flask`, `pymongo` (see below) |

Install Python dependencies into the virtual environment:

```powershell
# From the project root
.\.venv\Scripts\pip.exe install flask pymongo
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
| `SUBMISSIONS_COLL` | `submissions` | Collection where submissions are stored |
| `LLM_ENABLED` | `false` | Set to `true` to activate LLM hint generation |
| `LLM_BASE_URL` | `http://localhost:1234/v1` | OpenAI-compatible LLM endpoint (e.g. LM Studio) |

Set variables in PowerShell before starting the server:

```powershell
$env:FLASK_ENV   = "development"
$env:MONGO_URI   = "mongodb://localhost:27017"
$env:LLM_ENABLED = "false"
```

---

## Running the Server

### Development (Flask built-in server)

```powershell
# From the project root — activate the venv first
& "d:\6th sem\Mini project Software\AI-Code-Explainer\.venv\Scripts\Activate.ps1"

cd backend
python app.py
```

The server starts at **http://localhost:5000**.

### Production (Gunicorn)

```bash
gunicorn "app:create_app()" --bind 0.0.0.0:5000 --workers 4
```

> **Note:** Gunicorn is not available on Windows. Use
> [Waitress](https://docs.pylonsproject.org/projects/waitress/) as an
> alternative on Windows:
> ```powershell
> pip install waitress
> waitress-serve --port=5000 "app:create_app()"
> ```

---

## API Reference

All routes are prefixed with `/api`.

---

### GET /api/health

Liveness probe. Use this to verify the server is running.

**Request**

```
GET /api/health
```

No request body or query parameters required.

**Success Response — 200 OK**

```json
{
  "success": true,
  "data": {
    "status": "Backend Running"
  },
  "error": null
}
```

**Example (PowerShell)**

```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/health -Method GET
```

**Example (curl — bash/WSL)**

```bash
curl http://localhost:5000/api/health
```

---

### POST /api/submit-code

Accept a Java code snippet, compile and execute it in a sandboxed subprocess,
optionally generate an LLM hint on failure, persist the result to MongoDB,
and return the structured result.

**Request**

```
POST /api/submit-code
Content-Type: application/json
```

| Field | Type | Required | Description |
|---|---|---|---|
| `user_id` | string | Yes | Identifier for the submitting user. Must not be blank. |
| `code` | string | Yes | Full Java source code. Must contain a `Main` class with a `main` method. Must not be blank. |

**Request Body Example**

```json
{
  "user_id": "alice",
  "code": "public class Main { public static void main(String[] args) { System.out.println(\"Hello!\"); } }"
}
```

**Success Response — 200 OK** *(code compiled and ran without errors)*

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

**Success Response — 200 OK** *(compilation error — server succeeded, code has a bug)*

```json
{
  "success": true,
  "data": {
    "user_id": "alice",
    "execution": {
      "status": "CompilationError",
      "error_message": "Main.java:1: error: ';' expected",
      "line_number": 1,
      "output": null
    },
    "hint": "It looks like you are missing a semicolon on line 1."
  },
  "error": null
}
```

**Success Response — 200 OK** *(runtime exception)*

```json
{
  "success": true,
  "data": {
    "user_id": "alice",
    "execution": {
      "status": "RuntimeError",
      "error_message": "Exception in thread \"main\" java.lang.ArithmeticException: / by zero",
      "exception_type": "ArithmeticException",
      "line_number": 3,
      "output": null
    },
    "hint": null
  },
  "error": null
}
```

**Timeout Response — 408 Request Timeout** *(execution exceeded 5-second limit)*

```json
{
  "success": true,
  "data": {
    "user_id": "alice",
    "execution": {
      "status": "Timeout",
      "error_message": "Execution time exceeded limit",
      "output": null
    },
    "hint": null
  },
  "error": null
}
```

**Validation Error Response — 400 Bad Request**

```json
{
  "success": false,
  "data": null,
  "error": {
    "message": "Field 'code' is required and must not be empty.",
    "code": "MISSING_FIELD",
    "details": {
      "field": "code"
    }
  }
}
```

**Example (PowerShell)**

```powershell
$body = @{
    user_id = "alice"
    code    = 'public class Main { public static void main(String[] args) { System.out.println("Hello!"); } }'
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri         http://localhost:5000/api/submit-code `
    -Method      POST `
    -ContentType "application/json" `
    -Body        $body
```

**Example (curl — bash/WSL)**

```bash
curl -X POST http://localhost:5000/api/submit-code \
     -H "Content-Type: application/json" \
     -d '{"user_id":"alice","code":"public class Main { public static void main(String[] a) { System.out.println(42); } }"}'
```

---

## Response Envelope

Every response from this API — including framework error pages (404, 405) —
uses the same JSON envelope:

```json
{
  "success": true | false,
  "data":    { ... } | null,
  "error":   null    | { "message": "...", "code": "...", "details": { ... } }
}
```

| Field | When populated | Description |
|---|---|---|
| `success` | Always | `true` if the request was processed without a server error |
| `data` | `success = true` | The response payload |
| `error` | `success = false` | Error details object |
| `error.message` | `success = false` | Human-readable description of the error |
| `error.code` | `success = false` | Machine-readable error code string (see [Error Codes](#error-codes)) |
| `error.details` | `success = false` | Optional extra context (e.g. which field failed validation) |

---

## Execution Status Codes

These values appear inside `data.execution.status` on successful `/submit-code` responses.

| Status | HTTP Code | Description |
|---|---|---|
| `Success` | 200 | Code compiled and ran to completion without errors |
| `CompilationError` | 200 | `javac` rejected the code; `error_message` and `line_number` are populated |
| `RuntimeError` | 200 | Code compiled but threw an uncaught exception at runtime; `exception_type` and `line_number` are populated |
| `Timeout` | 408 | Execution exceeded the 5-second limit; process tree was killed |

---

## Error Codes

These values appear in `error.code` when `success` is `false`.

| Code | Typical HTTP Status | When returned |
|---|---|---|
| `MISSING_FIELD` | 400 | A required field (`user_id` or `code`) was absent or blank |
| `INVALID_INPUT` | 400 | Request body is missing, not valid JSON, or structurally wrong |
| `EXECUTION_FAILED` | 500 | The Java engine raised an unexpected internal exception |
| `INTERNAL_ERROR` | 500 | An unhandled server error occurred (catch-all) |
| `NOT_FOUND` | 404 | The requested endpoint does not exist |
| `METHOD_NOT_ALLOWED` | 405 | HTTP method is not supported on this endpoint |
| `TIMEOUT` | 408 | Reserved for timeout-related error responses (see also `Timeout` execution status) |

---

## HTTP Status Code Mapping

| Scenario | HTTP Status |
|---|---|
| Successful request (any execution outcome except Timeout) | 200 |
| Java code execution timed out | 408 |
| Missing / blank required field | 400 |
| Non-JSON or empty body | 400 |
| Endpoint does not exist | 404 |
| Wrong HTTP method on a valid endpoint | 405 |
| Internal server error (engine crash, unhandled exception) | 500 |

---

## Enabling LLM Hints

By default `LLM_ENABLED=false` and `hint` is always `null`. To activate hint
generation using an OpenAI-compatible local model (e.g. **LM Studio** with
Qwen Coder 30B):

1. Start LM Studio and load a code-capable model.
2. Enable the local server in LM Studio (default: `http://localhost:1234/v1`).
3. Set environment variables before starting the backend:

```powershell
$env:LLM_ENABLED  = "true"
$env:LLM_BASE_URL = "http://localhost:1234/v1"
```

4. Uncomment the real implementation in [llm.py](llm.py) and install the
   `openai` package:

```powershell
.\.venv\Scripts\pip.exe install openai
```

Hints are generated **only** for non-`Success` execution outcomes
(`CompilationError`, `RuntimeError`, `Timeout`). A hint failure is
**non-fatal** — the API still returns the execution result even if the LLM
call errors out.

---

## Running Tests

The test suite mocks the Java engine, MongoDB, and LLM so no external
services are required.

```powershell
# From the project root
C:/Users/tanis/AppData/Local/Programs/Python/Python313/python.exe -m pytest test_flask_backend.py -v
```

Expected result: **49 tests pass**.

To also run the Java engine unit tests:

```powershell
C:/Users/tanis/AppData/Local/Programs/Python/Python313/python.exe -m pytest test_java_engine.py -v
```

Expected result: **7 tests pass**.

Run both suites together:

```powershell
C:/Users/tanis/AppData/Local/Programs/Python/Python313/python.exe -m pytest test_flask_backend.py test_java_engine.py -v
```
