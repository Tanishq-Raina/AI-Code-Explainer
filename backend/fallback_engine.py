"""
fallback_engine.py
------------------
Multi-level fallback orchestration for safe hint responses.

Pipeline (strict order):
1. Validate initial LLM response
2. Retry LLM with strict prompt + validate
3. Template-based fallback
4. Generic safe fallback
"""

from __future__ import annotations

import re

import requests

import llm
from hallucination_guard import validate_and_filter_response


ERROR_TEMPLATES = {
    "cannot find symbol": {
        "problem_summary": "Java cannot recognize a name used in your code.",
        "why": "A variable, method, or class name is missing, misspelled, or out of scope.",
        "hint_1": "Check the exact spelling and capitalization of the unknown symbol.",
        "hint_2": "Make sure it is declared before use and visible in the same scope.",
        "learning_tip": "Review Java variable scope and identifier naming rules.",
    },
    "incompatible types": {
        "problem_summary": "Two values with different data types are being mixed incorrectly.",
        "why": "Java is strongly typed, so assignment and operations require compatible types.",
        "hint_1": "Check the variable type on the left side and the value type on the right side.",
        "hint_2": "Use explicit conversion only when it is logically safe.",
        "learning_tip": "Study primitive types and type casting in Java.",
    },
    "nullpointerexception": {
        "problem_summary": "A null reference is being used like a real object.",
        "why": "Calling a method or accessing a field on null throws NullPointerException.",
        "hint_1": "Identify which variable may still be null before that line runs.",
        "hint_2": "Initialize the object earlier or add a null check before use.",
        "learning_tip": "Learn Java object initialization and defensive null checks.",
    },
    "arrayindexoutofboundsexception": {
        "problem_summary": "Your array index is outside the valid range.",
        "why": "Java arrays are zero-based, so valid indexes are from 0 to length - 1.",
        "hint_1": "Print or inspect the index value right before array access.",
        "hint_2": "Ensure loop bounds and index math stay below array length.",
        "learning_tip": "Practice writing loops with correct boundary conditions.",
    },
}


def normalize_error_message(error_message: str) -> str:
    """Normalize raw error text for robust template matching."""
    text = (error_message or "").lower()
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _shape_response(response: dict, hint_level: int) -> dict:
    """Ensure a stable output schema and apply hint level filtering."""
    hint_level = max(1, min(3, int(hint_level or 1)))
    base = {
        "problem_summary": str(response.get("problem_summary", "")).strip(),
        "why": str(response.get("why", "")).strip(),
        "hint_1": str(response.get("hint_1", "")).strip(),
        "learning_tip": str(response.get("learning_tip", "")).strip(),
    }

    hint_2 = str(response.get("hint_2", "")).strip()
    hint_3 = str(response.get("hint_3", "")).strip()

    if hint_level >= 2 and hint_2:
        base["hint_2"] = hint_2
    if hint_level >= 3 and hint_3:
        base["hint_3"] = hint_3

    return base


def retry_llm_with_strict_prompt(code: str, execution_result: dict) -> dict | None:
    """
    Retry LLM with strict constraints to reduce hallucinations.

    Strict rules:
    - Use only compiler/runtime error context.
    - Provide only 1-2 hints.
    - No code blocks.
    - Very short explanation.
    - Beginner-friendly tone.
    """
    if not llm.LLM_ENABLED:
        return None

    error_message = execution_result.get("error_message") or "No error message provided."
    status = execution_result.get("status", "Unknown")

    system_prompt = (
        "You are a Java tutor focused on safe minimal hints. "
        "Return ONLY JSON with keys: problem_summary, why, hint_1, hint_2, learning_tip. "
        "Use beginner-friendly language. Keep why to one short sentence. "
        "Do not provide full solutions. Do not use markdown or code fences."
    )

    user_prompt = (
        "Use ONLY this execution information and ignore everything else.\n"
        f"Status: {status}\n"
        f"Compiler/Runtime error: {error_message}\n\n"
        "Rules:\n"
        "1) Give only 1 or 2 hints.\n"
        "2) Keep each hint very short.\n"
        "3) No code blocks.\n"
        "4) Explain simply for a beginner."
    )

    try:
        return llm._call_llm(system_prompt=system_prompt, user_prompt=user_prompt)
    except (requests.exceptions.RequestException, KeyError, TypeError, ValueError):
        return None


def match_error_template(error_message: str) -> dict | None:
    """Return a template response for a known Java error message."""
    normalized = normalize_error_message(error_message)

    for key, template in ERROR_TEMPLATES.items():
        if key in normalized:
            return dict(template)

    return None


def process_with_fallback(code: str, execution_result: dict, hint_level: int, llm_output: dict) -> dict:
    """
    Process LLM output through strict fallback pipeline and return safe response.
    """
    # 1) Validate the externally-generated LLM response.
    validated = validate_and_filter_response(llm_output, execution_result)
    if validated:
        return _shape_response(validated, hint_level)

    # 2) Retry with strict prompt, then validate again.
    retry_output = retry_llm_with_strict_prompt(code, execution_result)
    validated_retry = validate_and_filter_response(retry_output, execution_result) if retry_output else None
    if validated_retry:
        return _shape_response(validated_retry, hint_level)

    # 3) Template-based fallback using known Java error patterns.
    template = match_error_template(execution_result.get("error_message") or "")
    if template:
        return _shape_response(template, hint_level)

    # 4) Generic safe fallback as a final guardrail.
    return _shape_response(
        {
            "problem_summary": "There is an issue in your code.",
            "why": str(execution_result.get("error_message") or "Unknown error."),
            "hint_1": "Carefully read the error message and identify the problematic line.",
            "learning_tip": "Focus on understanding the concept behind the error.",
        },
        hint_level,
    )
