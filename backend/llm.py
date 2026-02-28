"""
llm.py
------
LLM (Large Language Model) integration layer for the AI-Based Java Tutor.

Current state
~~~~~~~~~~~~~
This module is a **stub**.  ``generate_hint()`` returns ``None`` so that the
rest of the backend works end-to-end without a running LLM.

Activation
~~~~~~~~~~
When LM Studio (or any OpenAI-compatible endpoint) is running:

1. Set the environment variable:

       LLM_BASE_URL=http://localhost:1234/v1

2. Replace the body of ``generate_hint()`` with the real implementation.
   The function signature and return type must remain unchanged so routes.py
   needs zero modification.

Suggested real implementation (OpenAI-compatible SDK)::

    from openai import OpenAI

    _client = OpenAI(base_url=LLM_BASE_URL, api_key="lm-studio")

    def generate_hint(code: str, result: dict) -> str | None:
        prompt = _build_prompt(code, result)
        resp = _client.chat.completions.create(
            model="qwen-coder",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=512,
        )
        return resp.choices[0].message.content.strip()
"""

import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

# Base URL for the LM Studio (or any OpenAI-compatible) local endpoint.
LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "http://localhost:1234/v1")

# Set to True once the LLM endpoint is wired in.
LLM_ENABLED: bool = os.getenv("LLM_ENABLED", "false").lower() == "true"


# ---------------------------------------------------------------------------
# Prompt builder (private helper)
# ---------------------------------------------------------------------------

def _build_prompt(code: str, result: dict) -> str:
    """
    Compose a tutor-style prompt from the submitted code and execution result.

    The prompt instructs the model to act as a Java tutor and provide a
    short, student-friendly hint without giving away the full solution.
    """
    status        = result.get("status", "Unknown")
    error_message = result.get("error_message", "")
    line_number   = result.get("line_number")
    exc_type      = result.get("exception_type")

    location = f" at line {line_number}" if line_number else ""
    exc_info = f" ({exc_type})" if exc_type else ""

    return (
        f"You are a helpful Java programming tutor.\n\n"
        f"A student submitted the following Java code:\n\n"
        f"```java\n{code}\n```\n\n"
        f"Execution result: {status}{exc_info}{location}.\n"
        f"Error message: {error_message}\n\n"
        f"Give the student a short, encouraging hint (2-3 sentences) that "
        f"helps them understand and fix the problem without revealing the "
        f"complete solution."
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def generate_hint(code: str, result: dict) -> Optional[str]:
    """
    Generate a natural-language hint for a failed Java submission.

    This is the **only function routes.py calls**.  Swapping out the
    underlying LLM requires only changes inside this module.

    Parameters
    ----------
    code : str
        The Java source code that was submitted.
    result : dict
        The execution result dict from ``execute_java_code()``.

    Returns
    -------
    str or None
        A hint string when the LLM is enabled and available, ``None``
        otherwise.  Routes treat ``None`` as "no hint available" and
        omit the field from the response rather than surfacing an error.
    """
    if not LLM_ENABLED:
        logger.debug("LLM disabled (LLM_ENABLED=false) – skipping hint generation")
        return None

    # ── Real implementation goes here ────────────────────────────────────
    # Uncomment and adapt once LM Studio is running:
    #
    # try:
    #     from openai import OpenAI
    #     client = OpenAI(base_url=LLM_BASE_URL, api_key="lm-studio")
    #     prompt = _build_prompt(code, result)
    #     response = client.chat.completions.create(
    #         model="qwen-coder",
    #         messages=[{"role": "user", "content": prompt}],
    #         temperature=0.3,
    #         max_tokens=512,
    #     )
    #     return response.choices[0].message.content.strip()
    # except Exception as exc:
    #     logger.error("LLM hint generation failed: %s", exc)
    #     return None

    return None  # stub – remove once real implementation is in place
