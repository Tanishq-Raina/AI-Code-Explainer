"""
hallucination_guard.py
----------------------
Validation layer for LLM hint responses.

This module rejects malformed or risky model output and returns only
clean, structured hint dictionaries for downstream use.
"""

from __future__ import annotations

import re
from typing import Optional


_REQUIRED_KEYS = ("problem_summary", "why", "hint_1", "learning_tip")
_OPTIONAL_KEYS = ("hint_2", "hint_3")

def _normalize_space(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _contains_code_fence(text: str) -> bool:
    return "```" in text


def _looks_like_full_solution(text: str) -> bool:
    suspicious = (
        "public static void main",
        "class main",
        "import java.",
        "here is the full",
        "complete solution",
    )
    lower = text.lower()
    return any(token in lower for token in suspicious)


def validate_and_filter_response(llm_output: dict, execution_result: dict) -> Optional[dict]:
    """
    Validate model output and return a clean hint dict or None when invalid.

    Rules enforced:
    - Must be a dict with required keys.
    - Required fields must be non-empty strings.
    - Optional hints, when present, must be strings.
    - Must not contain markdown code fences.
    - Must not look like a full-solution response.
    """
    if not isinstance(llm_output, dict):
        return None

    cleaned: dict = {}

    for key in _REQUIRED_KEYS:
        value = llm_output.get(key)
        if not isinstance(value, str):
            return None
        value = _normalize_space(value)
        if not value:
            return None
        if _contains_code_fence(value):
            return None
        cleaned[key] = value

    for key in _OPTIONAL_KEYS:
        value = llm_output.get(key)
        if value is None:
            continue
        if not isinstance(value, str):
            return None
        value = _normalize_space(value)
        if _contains_code_fence(value):
            return None
        if value:
            cleaned[key] = value

    combined_text = " ".join(cleaned.values())
    if _looks_like_full_solution(combined_text):
        return None

    return cleaned
