"""
confidence_scorer.py
--------------------
Self-assessed quality score for LLM-generated hint responses.

This module computes a continuous-valued ``confidence_score`` in the range
[0.0, 1.0] for every hint payload produced by the fallback pipeline. It is
the system's *automated* trust signal, complementing the *human* trust
signal stored in ``user_feedback``.

Scoring model
~~~~~~~~~~~~~
1. Pick a base score from the fallback tier that produced the response.
2. Apply additive modifiers based on per-response signals (length sanity,
   field completeness, error-context match, question-context grounding).
3. If the hallucination guard flagged the response, cap the score at the
   ``HALLUCINATION_CAP`` constant regardless of tier.
4. Clamp the final value to [0.0, 1.0].

The function is a pure transformation over data the route layer already has
in scope — no extra LLM calls, no database queries.

Architecture rules
~~~~~~~~~~~~~~~~~~
* No Flask imports.
* No database imports.
* No LLM imports.
* Constants live at the top of the file so they can be tuned without
  touching logic.
"""

from __future__ import annotations

import logging
import re
from typing import Optional

from fallback_engine import (
    TIER_GENERIC,
    TIER_INITIAL_LLM,
    TIER_STRICT_RETRY,
    TIER_TEMPLATE,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Tunable constants
# ---------------------------------------------------------------------------

# Base score per fallback tier. Reflects how much the system had to fall
# back from the ideal "LLM produced clean output" path.
TIER_BASE_SCORES: dict[str, float] = {
    TIER_INITIAL_LLM:  0.90,  # Best case — model followed instructions cleanly.
    TIER_STRICT_RETRY: 0.70,  # Model needed a stricter prompt.
    TIER_TEMPLATE:     0.60,  # Deterministic but generic — no code context.
    TIER_GENERIC:      0.20,  # System knows almost nothing about the error.
}

# When the LLM is disabled / unavailable but a template still matched.
# Uses TIER_TEMPLATE base; no separate score needed because the tier itself
# already encodes that the LLM did not contribute.

# Hallucination guard already detected something wrong — cap aggressively
# regardless of tier-level base score. Anything above this cap would let
# modifiers mask a known-bad response.
HALLUCINATION_CAP: float = 0.30

# Modifier weights — small, additive adjustments on top of the base.
MOD_ERROR_CONTEXT_MATCH: float = 0.05      # response references the specific error
MOD_ERROR_CONTEXT_MISS: float = -0.05      # response is vague about the error
MOD_OPTIONAL_HINT_PRESENT: float = 0.03    # each of hint_2 / hint_3 in raw output
MOD_OPTIONAL_HINT_CAP: float = 0.05        # max bonus from optional hints combined
MOD_LENGTH_BAD: float = -0.05              # any hint outside sane length bounds
MOD_FIELD_MISSING: float = -0.05           # each missing/empty required field
MOD_QUESTION_CONTEXT: float = 0.05         # request included problem grounding

# Hint length bounds — outside these we flag the response as suspiciously
# terse or verbose.
HINT_MIN_CHARS: int = 20
HINT_MAX_CHARS: int = 300

# Required fields that should always be populated in a real hint response.
REQUIRED_FIELDS: tuple[str, ...] = ("problem_summary", "why", "hint_1", "learning_tip")

# Regex for any digits — used as a coarse "did the response mention the line
# number?" signal.
_DIGIT_RE = re.compile(r"\d+")


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _normalize_text(value) -> str:
    """Return a stripped string, treating None / non-strings as empty."""
    if not isinstance(value, str):
        return ""
    return value.strip()


def _has_error_context_match(hints: dict, execution_result: dict) -> Optional[bool]:
    """
    Decide whether the response actually grounds itself in the specific error.

    Returns:
      True  — the response mentions the exception type or line number
      False — there is concrete error context but the response ignores it
      None  — there is no concrete error context to compare against
              (don't apply the modifier in that case)
    """
    exception_type = _normalize_text(execution_result.get("exception_type"))
    line_number = execution_result.get("line_number")
    error_message = _normalize_text(execution_result.get("error_message"))

    # Concatenate every text field the response provides into one search blob.
    response_blob = " ".join(
        _normalize_text(hints.get(key))
        for key in ("problem_summary", "why", "hint_1", "hint_2", "hint_3", "learning_tip")
    ).lower()

    if not response_blob:
        return None

    # We only care about *concrete* error signals. A bare "Unknown error"
    # message is not concrete enough to penalise the response over.
    has_concrete_signal = bool(
        exception_type
        or (isinstance(line_number, int) and line_number > 0)
        or (error_message and error_message.lower() not in {"unknown error.", "unknown error", "none"})
    )
    if not has_concrete_signal:
        return None

    if exception_type and exception_type.lower() in response_blob:
        return True

    if isinstance(line_number, int) and line_number > 0:
        # Look for the line number as a standalone token in the response.
        if any(int(token) == line_number for token in _DIGIT_RE.findall(response_blob)):
            return True

    # Fall back to a coarse keyword overlap check against the error message.
    if error_message:
        # Pick reasonably distinctive words from the error (4+ chars, alphabetic)
        # and see whether any appear in the response.
        keywords = {
            word.lower()
            for word in re.findall(r"[A-Za-z]{4,}", error_message)
            if word.lower() not in {"java", "lang", "error", "main"}
        }
        if keywords and any(keyword in response_blob for keyword in keywords):
            return True

    return False


def _length_modifier(hints: dict) -> float:
    """
    Penalise responses with any hint suspiciously short or long.

    Applies the penalty once even if multiple hints are bad — the goal is to
    flag the response, not stack penalties.
    """
    for key in ("hint_1", "hint_2", "hint_3"):
        text = _normalize_text(hints.get(key))
        if not text:
            continue
        if len(text) < HINT_MIN_CHARS or len(text) > HINT_MAX_CHARS:
            return MOD_LENGTH_BAD
    return 0.0


def _missing_field_modifier(hints: dict) -> float:
    """Each empty required field contributes one ``MOD_FIELD_MISSING`` penalty."""
    penalty = 0.0
    for key in REQUIRED_FIELDS:
        if not _normalize_text(hints.get(key)):
            penalty += MOD_FIELD_MISSING
    return penalty


def _optional_hint_bonus(raw_llm_output: Optional[dict]) -> float:
    """
    Reward the LLM for producing a complete hint set.

    We check the *raw* LLM output (before level-based filtering) so the
    bonus reflects what the model actually generated, not what was shown
    to the student.
    """
    if not isinstance(raw_llm_output, dict):
        return 0.0

    bonus = 0.0
    for key in ("hint_2", "hint_3"):
        if _normalize_text(raw_llm_output.get(key)):
            bonus += MOD_OPTIONAL_HINT_PRESENT

    return min(bonus, MOD_OPTIONAL_HINT_CAP)


def _question_context_modifier(question_context: Optional[dict]) -> float:
    """Bonus when the request included problem-description grounding."""
    if not isinstance(question_context, dict):
        return 0.0

    grounded = any(
        _normalize_text(question_context.get(field))
        for field in ("title", "topic", "description", "expected_output")
    )
    return MOD_QUESTION_CONTEXT if grounded else 0.0


def _clamp(value: float) -> float:
    """Clamp to [0.0, 1.0]. Defensive — ``insert_submission`` also clamps."""
    return max(0.0, min(1.0, value))


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def score_hint_response(
    hints: Optional[dict],
    raw_llm_output: Optional[dict],
    execution_result: dict,
    tier: Optional[str],
    hallucination_flag: bool,
    question_context: Optional[dict] = None,
) -> Optional[float]:
    """
    Compute the confidence score for a hint response.

    Parameters
    ----------
    hints : dict | None
        Final, level-filtered hint dict shown to the student.
        ``None`` means hint generation was skipped or crashed.
    raw_llm_output : dict | None
        The unfiltered LLM response (or {} if the LLM was unavailable).
        Used to detect whether the model produced optional hints (hint_2, hint_3)
        regardless of the requested hint level.
    execution_result : dict
        The Java engine's result dict — provides exception_type, line_number,
        and error_message used for grounding checks.
    tier : str | None
        The fallback tier label from ``fallback_engine`` (initial_llm /
        strict_retry / template / generic). ``None`` means no fallback ran.
    hallucination_flag : bool
        True if the hallucination guard rejected the raw LLM output. Caps
        the final score at ``HALLUCINATION_CAP``.
    question_context : dict | None
        Optional problem context (title, description, expected_output)
        passed by the frontend.

    Returns
    -------
    float | None
        Score in the closed interval [0.0, 1.0], or ``None`` when no hint
        was generated at all (clean Success runs). Returns ``0.0`` when
        the pipeline ran but failed to produce anything usable.
    """
    # Clean Success case — no hint, no score. ``None`` distinguishes this
    # from "we tried and got 0.0" in downstream analytics.
    if hints is None:
        return None

    # Tier missing means the pipeline never assigned one (e.g. an exception
    # crashed it before fallback completed). Treat as worst case.
    if not tier or tier not in TIER_BASE_SCORES:
        logger.debug("score_hint_response: unknown tier '%s' → score 0.0", tier)
        return 0.0

    base = TIER_BASE_SCORES[tier]

    # Aggregate modifiers from each independent signal.
    score = base
    score += _length_modifier(hints)
    score += _missing_field_modifier(hints)
    score += _optional_hint_bonus(raw_llm_output)
    score += _question_context_modifier(question_context)

    error_match = _has_error_context_match(hints, execution_result)
    if error_match is True:
        score += MOD_ERROR_CONTEXT_MATCH
    elif error_match is False:
        score += MOD_ERROR_CONTEXT_MISS
    # If error_match is None we have nothing concrete to compare; don't
    # adjust the score either way.

    # Hallucination cap — applied AFTER modifiers so a flagged response
    # cannot recover above the cap regardless of how many bonuses stack.
    if hallucination_flag:
        score = min(score, HALLUCINATION_CAP)

    final = _clamp(score)
    logger.debug(
        "score_hint_response: tier=%s base=%.2f hallucination=%s → final=%.3f",
        tier, base, hallucination_flag, final,
    )
    return final
