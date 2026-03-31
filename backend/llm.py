"""
llm.py
------
LLM integration layer for the Adaptive AI-Based Java Programming Tutor.

Responsibilities
~~~~~~~~~~~~~~~~
* Build structured system and user prompts for Qwen Coder 30B.
* Call the LM Studio local API (OpenAI-compatible chat completions endpoint).
* Parse the model's plain-text response into a structured Python dictionary.
* Enforce the no-full-solution teaching policy at the prompt level.
* Support progressive hint levels (1 → 2 → 3) so the UI can reveal hints
  incrementally without calling the model multiple times.

Public API
~~~~~~~~~~
``generate_hints(code, execution_result, hint_level)``
    Main entry point.  Returns a structured dict or an error dict.

``generate_hint(code, result)``
    Backward-compatible shim used by routes.py.  Delegates to
    ``generate_hints()`` and collapses the result to a single string.

Architecture rules
~~~~~~~~~~~~~~~~~~
* No Flask imports.
* No database imports.
* Only LLM communication logic lives here.
* Prompts are built in dedicated private helpers (_build_system_prompt,
  _build_user_prompt) so they can be unit-tested in isolation.
* Response parsing is in _parse_llm_response so swapping output formats
  requires changing only that one function.
"""

import json
import logging
import os
from typing import Optional

import requests

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration  (override via environment variables)
# ---------------------------------------------------------------------------

# Full chat-completions endpoint for LM Studio
LLM_API_URL: str = os.getenv(
    "LLM_BASE_URL", "http://localhost:1234/v1"
).rstrip("/") + "/chat/completions"

# Model name that LM Studio exposes in its local server
LLM_MODEL: str = os.getenv("LLM_MODEL", "qwen-coder-30b")

# Set LLM_ENABLED=true to activate; any other value keeps it disabled.
LLM_ENABLED: bool = os.getenv("LLM_ENABLED", "false").lower() == "true"

# Seconds to wait for LM Studio to respond before timing out
LLM_TIMEOUT: int = int(os.getenv("LLM_TIMEOUT", "30"))

# Generation parameters
_TEMPERATURE: float = 0.3
_MAX_TOKENS:  int   = 1200


# ---------------------------------------------------------------------------
# Prompt builders  (private helpers)
# ---------------------------------------------------------------------------

def _build_system_prompt() -> str:
    """
    Return the system prompt that defines the model's teaching persona.

    Policy rules enforced here:
    - Act as a Java teaching assistant, NOT a code-writing service.
    - Never output a full corrected program.
    - Never rewrite the student's entire solution.
    - Limit inline code examples to at most 2 lines.
    - Use beginner-friendly language.
    - Focus on conceptual understanding over copy-paste fixes.
    """
    return (
        "You are a friendly and patient Java programming tutor helping beginner students.\n\n"

        "YOUR ROLE:\n"
        "- Guide students to understand their mistakes through explanation and hints.\n"
        "- Encourage independent thinking and learning.\n"
        "- Use simple, beginner-friendly language.\n\n"

        "STRICT RULES — YOU MUST FOLLOW THESE:\n"
        "1. NEVER provide the full corrected program.\n"
        "2. NEVER rewrite the student's entire solution.\n"
        "3. If you include a code snippet, it MUST be 2 lines or fewer.\n"
        "4. Focus on explaining WHY the error occurs, not just WHAT to fix.\n"
        "5. Keep each hint short, clear, and actionable.\n\n"

        "OUTPUT FORMAT — respond with ONLY a valid JSON object, no extra text:\n"
        "{\n"
        '  "problem_summary": "One sentence describing the error.",\n'
        '  "why": "2-3 sentences explaining why this error occurs conceptually.",\n'
        '  "hint_1": "Gentlest hint — point to the area of the problem.",\n'
        '  "hint_2": "Stronger hint — describe what needs to change without showing code.",\n'
        '  "hint_3": "Most direct hint — may include up to 2 lines of illustrative code.",\n'
        '  "learning_tip": "A related Java concept or best practice the student should read about."\n'
        "}\n\n"

        "If the code is correct (status: Success), still respond with the JSON structure "
        "but set all fields to empty strings."
    )


def _build_user_prompt(code: str, execution_result: dict) -> str:
    """
    Return the user prompt built from the submitted code and execution result.

    Includes all diagnostic fields available so the model has full context:
    execution status, error message, line number, and exception type.
    """
    status        = execution_result.get("status", "Unknown")
    error_message = execution_result.get("error_message") or "None"
    line_number   = execution_result.get("line_number")
    exc_type      = execution_result.get("exception_type")

    # Build a human-readable location string
    location_parts = []
    if line_number:
        location_parts.append(f"Line number: {line_number}")
    if exc_type:
        location_parts.append(f"Exception type: {exc_type}")
    location_info = "\n  ".join(location_parts) if location_parts else "Not available"

    return (
        f"A student submitted the following Java code:\n\n"
        f"```java\n{code}\n```\n\n"
        f"Execution Result:\n"
        f"  Status:        {status}\n"
        f"  Error message: {error_message}\n"
        f"  {location_info}\n\n"
        f"Please analyse the code and the error, then respond with the JSON hint "
        f"structure as defined in your instructions."
    )


# ---------------------------------------------------------------------------
# Response parser  (private helper)
# ---------------------------------------------------------------------------

def _parse_llm_response(raw_text: str) -> dict:
    """
    Extract the structured hint dictionary from the model's reply.

    The model is instructed to return a JSON object.  This function tries
    to parse that JSON first.  If the model wrapped the JSON in a markdown
    code fence or added surrounding text, we locate and extract the JSON
    object manually before parsing.

    Returns a valid hint dict on success, or a fallback dict on failure.
    """
    # First attempt: direct JSON parse (ideal case — model followed instructions)
    try:
        return json.loads(raw_text.strip())
    except json.JSONDecodeError:
        pass

    # Second attempt: find the first '{' ... last '}' block and parse that
    try:
        start = raw_text.index("{")
        end   = raw_text.rindex("}") + 1
        return json.loads(raw_text[start:end])
    except (ValueError, json.JSONDecodeError):
        pass

    # Fallback: parsing completely failed — return a safe generic response
    logger.warning("LLM response could not be parsed as JSON. Raw: %s", raw_text[:200])
    return {
        "problem_summary": "An error was detected in your code.",
        "why":             "The model could not produce a structured explanation. Try reviewing the error message directly.",
        "hint_1":          "Read the error message carefully — it usually tells you the line and type of problem.",
        "hint_2":          "Search for the error type in the Java documentation or a beginner tutorial site.",
        "hint_3":          "Try commenting out sections of code to narrow down where the problem is.",
        "learning_tip":    "Practice reading Java stack traces — they are your most powerful debugging tool.",
    }


def _filter_by_hint_level(hints: dict, hint_level: int) -> dict:
    """
    Remove hints that exceed the requested hint level.

    hint_level 1 → problem_summary + why + hint_1 + learning_tip  (gentlest)
    hint_level 2 → adds hint_2
    hint_level 3 → adds hint_3  (most direct; may contain a short code example)

    problem_summary, why, and learning_tip are always included — they
    provide context without giving away the solution.
    """
    # Fields that are always returned regardless of hint level
    result = {
        "problem_summary": hints.get("problem_summary", ""),
        "why":             hints.get("why", ""),
        "learning_tip":    hints.get("learning_tip", ""),
    }

    # Progressively unlock hints based on requested level
    if hint_level >= 1:
        result["hint_1"] = hints.get("hint_1", "")
    if hint_level >= 2:
        result["hint_2"] = hints.get("hint_2", "")
    if hint_level >= 3:
        result["hint_3"] = hints.get("hint_3", "")

    return result


# ---------------------------------------------------------------------------
# Core LLM call  (private)
# ---------------------------------------------------------------------------

def _call_llm(system_prompt: str, user_prompt: str) -> dict:
    """
    POST a chat-completions request to LM Studio and return the parsed dict.

    Uses ``requests.post()`` directly so there is no dependency on the
    openai SDK — only the ``requests`` library is required.

    Raises
    ------
    requests.exceptions.ConnectionError
        When LM Studio is not running or the port is unreachable.
    requests.exceptions.Timeout
        When the model takes longer than LLM_TIMEOUT seconds to respond.
    requests.exceptions.HTTPError
        When LM Studio returns a non-2xx HTTP status.
    """
    payload = {
        "model":    LLM_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
        "temperature": _TEMPERATURE,
        "max_tokens":  _MAX_TOKENS,
    }

    logger.debug("Sending request to LLM at %s (model=%s)", LLM_API_URL, LLM_MODEL)

    response = requests.post(
        LLM_API_URL,
        json=payload,
        timeout=LLM_TIMEOUT,
    )
    response.raise_for_status()  # raises HTTPError for 4xx / 5xx responses

    # Extract the assistant's message from the standard OpenAI response shape
    raw_content: str = response.json()["choices"][0]["message"]["content"]
    logger.debug("LLM raw response received (%d chars)", len(raw_content))

    return _parse_llm_response(raw_content)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def generate_hints(
    code:             str,
    execution_result: dict,
    hint_level:       int = 1,
) -> dict:
    """
    Generate structured, progressive hints for a Java submission.

    Parameters
    ----------
    code : str
        The Java source code submitted by the student.
    execution_result : dict
        The execution result dict produced by ``execute_java_code()``.
        Expected keys: ``status``, ``error_message``, ``line_number``
        (optional), ``exception_type`` (optional).
    hint_level : int
        Controls how many hints are revealed:
        1 → problem_summary + why + hint_1 + learning_tip  (gentlest)
        2 → adds hint_2
        3 → adds hint_3  (most direct; may include a short code example)

    Returns
    -------
    dict
        On success::

            {
                "problem_summary": "...",
                "why":             "...",
                "hint_1":          "...",   # always present
                "hint_2":          "...",   # present when hint_level >= 2
                "hint_3":          "...",   # present when hint_level >= 3
                "learning_tip":    "..."
            }

        On LLM unavailability or error::

            {"status": "LLMError", "message": "<reason>"}
    """
    if not LLM_ENABLED:
        logger.debug("LLM disabled (LLM_ENABLED=false) — skipping hint generation")
        return {"status": "LLMError", "message": "LLM is not enabled on this server."}

    # Clamp hint_level to the valid range [1, 3]
    hint_level = max(1, min(3, hint_level))

    system_prompt = _build_system_prompt()
    user_prompt   = _build_user_prompt(code, execution_result)

    try:
        raw_hints = _call_llm(system_prompt, user_prompt)

    except requests.exceptions.ConnectionError:
        # LM Studio process is not running or is refusing connections
        logger.error("LLM connection failed — is LM Studio running at %s?", LLM_API_URL)
        return {"status": "LLMError", "message": "LLM unavailable"}

    except requests.exceptions.Timeout:
        logger.error("LLM request timed out after %ds", LLM_TIMEOUT)
        return {"status": "LLMError", "message": "LLM request timed out"}

    except requests.exceptions.HTTPError as exc:
        logger.error("LLM API returned HTTP error: %s", exc)
        return {"status": "LLMError", "message": f"LLM API error: {exc.response.status_code}"}

    except (KeyError, IndexError) as exc:
        # Unexpected shape in the API response JSON (e.g. missing "choices")
        logger.error("Unexpected LLM response structure: %s", exc)
        return {"status": "LLMError", "message": "Unexpected response from LLM"}

    except Exception as exc:  # noqa: BLE001
        logger.exception("Unexpected error during LLM call")
        return {"status": "LLMError", "message": f"Unexpected LLM error: {exc}"}

    # Filter the full hint set down to the requested level and return
    return _filter_by_hint_level(raw_hints, hint_level)


def generate_hint(code: str, result: dict) -> Optional[str]:
    """
    Backward-compatible shim for ``routes.py``.

    ``routes.py`` calls ``generate_hint(code, result)`` and expects either a
    plain string or ``None``.  This function delegates to ``generate_hints()``
    at hint_level=3 (all hints) and collapses the structured dict into a
    formatted multi-section string so the route layer needs zero changes.

    Returns ``None`` when the LLM is disabled or unavailable, preserving the
    original no-LLM behaviour.
    """
    hints = generate_hints(code=code, execution_result=result, hint_level=3)

    # LLMError dict means the model was unavailable — treat as no hint
    if hints.get("status") == "LLMError":
        logger.debug("generate_hint returning None due to LLMError: %s", hints.get("message"))
        return None

    # Collapse the structured dict into a readable multi-section string
    parts = []
    if hints.get("problem_summary"):
        parts.append(f"Problem: {hints['problem_summary']}")
    if hints.get("why"):
        parts.append(f"Why it happens: {hints['why']}")
    for level in (1, 2, 3):
        key = f"hint_{level}"
        if hints.get(key):
            parts.append(f"Hint {level}: {hints[key]}")
    if hints.get("learning_tip"):
        parts.append(f"Learning tip: {hints['learning_tip']}")

    return "\n\n".join(parts) if parts else None
