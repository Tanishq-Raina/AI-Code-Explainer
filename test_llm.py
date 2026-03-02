"""
test_llm.py
-----------
Comprehensive test suite for backend/llm.py.

Coverage
~~~~~~~~
Group A – _build_system_prompt()        : teaching policy, output format rules
Group B – _build_user_prompt()          : all context fields, missing-field safety
Group C – _parse_llm_response()         : clean JSON, fenced JSON, garbage fallback
Group D – _filter_by_hint_level()       : hint levels 1 / 2 / 3, clamping
Group E – generate_hints() disabled     : LLM_ENABLED=false path
Group F – generate_hints() happy path   : mocked HTTP success, all hint levels
Group G – generate_hints() error paths  : ConnectionError, Timeout, HTTPError,
                                          bad response shape, generic exception
Group H – generate_hint() shim          : collapse to string, LLMError → None,
                                          routes.py integration contract

All tests use unittest.mock to isolate every external dependency
(requests.post, os.getenv / module variables).  No network calls are made.
No Flask, no MongoDB, no Java runtime needed.
"""

import sys
import os
import json
import pytest
from unittest.mock import patch, MagicMock

# ---------------------------------------------------------------------------
# Import the module under test
# ---------------------------------------------------------------------------
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

import llm  # noqa: E402
from llm import (
    _build_system_prompt,
    _build_user_prompt,
    _parse_llm_response,
    _filter_by_hint_level,
    generate_hints,
    generate_hint,
)

# ---------------------------------------------------------------------------
# Shared fixtures / constants
# ---------------------------------------------------------------------------

SAMPLE_CODE = (
    'public class Main {\n'
    '    public static void main(String[] args) {\n'
    '        int x = 5 / 0;\n'
    '    }\n'
    '}'
)

COMPILE_ERROR_RESULT = {
    "status":        "CompilationError",
    "error_message": "Main.java:3: error: ';' expected",
    "line_number":   3,
}

RUNTIME_ERROR_RESULT = {
    "status":         "RuntimeError",
    "error_message":  "java.lang.ArithmeticException: / by zero",
    "exception_type": "ArithmeticException",
    "line_number":    3,
}

TIMEOUT_RESULT = {
    "status":        "Timeout",
    "error_message": "Execution time exceeded limit",
}

SUCCESS_RESULT = {
    "status":        "Success",
    "error_message": None,
    "output":        "Hello!",
}

# A well-formed hint dict as the LLM would return it
FULL_HINTS = {
    "problem_summary": "You divided by zero.",
    "why":             "Division by zero is undefined in Java.",
    "hint_1":          "Look at line 3.",
    "hint_2":          "Check the denominator before dividing.",
    "hint_3":          "Use an if-statement to guard against zero.",
    "learning_tip":    "Read about ArithmeticException in Java docs.",
}

# Helper: build a mock requests.Response that returns a given hints dict
def _mock_response(hints_dict: dict) -> MagicMock:
    body = {
        "choices": [
            {"message": {"content": json.dumps(hints_dict)}}
        ]
    }
    mock_resp = MagicMock()
    mock_resp.json.return_value = body
    mock_resp.raise_for_status.return_value = None
    return mock_resp


# ===========================================================================
# Group A – _build_system_prompt()
# ===========================================================================

class TestBuildSystemPrompt:
    def setup_method(self):
        self.prompt = _build_system_prompt()

    def test_returns_string(self):
        assert isinstance(self.prompt, str)

    def test_not_empty(self):
        assert len(self.prompt) > 100

    def test_bans_full_solution(self):
        assert "NEVER provide the full corrected program" in self.prompt

    def test_bans_full_rewrite(self):
        assert "NEVER rewrite" in self.prompt

    def test_limits_code_snippet_to_two_lines(self):
        assert "2 lines" in self.prompt

    def test_encourages_why_explanation(self):
        assert "WHY" in self.prompt.upper()

    def test_demands_json_output_only(self):
        assert "JSON" in self.prompt

    def test_includes_all_required_json_keys(self):
        for key in ("problem_summary", "why", "hint_1", "hint_2", "hint_3", "learning_tip"):
            assert key in self.prompt

    def test_mentions_beginner(self):
        assert "beginner" in self.prompt.lower()


# ===========================================================================
# Group B – _build_user_prompt()
# ===========================================================================

class TestBuildUserPrompt:
    def test_contains_code(self):
        prompt = _build_user_prompt(SAMPLE_CODE, RUNTIME_ERROR_RESULT)
        assert "int x = 5 / 0" in prompt

    def test_contains_status(self):
        prompt = _build_user_prompt(SAMPLE_CODE, RUNTIME_ERROR_RESULT)
        assert "RuntimeError" in prompt

    def test_contains_error_message(self):
        prompt = _build_user_prompt(SAMPLE_CODE, RUNTIME_ERROR_RESULT)
        assert "ArithmeticException" in prompt

    def test_contains_line_number(self):
        prompt = _build_user_prompt(SAMPLE_CODE, RUNTIME_ERROR_RESULT)
        assert "3" in prompt

    def test_contains_exception_type(self):
        prompt = _build_user_prompt(SAMPLE_CODE, RUNTIME_ERROR_RESULT)
        assert "ArithmeticException" in prompt

    def test_compile_error_no_exception_type(self):
        # CompilationError has no exception_type — should not crash
        prompt = _build_user_prompt(SAMPLE_CODE, COMPILE_ERROR_RESULT)
        assert "CompilationError" in prompt

    def test_no_line_number_uses_not_available(self):
        result = {"status": "Timeout", "error_message": "timed out"}
        prompt = _build_user_prompt(SAMPLE_CODE, result)
        assert "Not available" in prompt

    def test_none_error_message_handled(self):
        result = {"status": "Success", "error_message": None}
        prompt = _build_user_prompt(SAMPLE_CODE, result)
        # Should show "None" as the literal string, not crash
        assert "None" in prompt

    def test_returns_string(self):
        assert isinstance(_build_user_prompt(SAMPLE_CODE, RUNTIME_ERROR_RESULT), str)


# ===========================================================================
# Group C – _parse_llm_response()
# ===========================================================================

class TestParseLlmResponse:
    def test_parses_clean_json(self):
        raw = json.dumps(FULL_HINTS)
        result = _parse_llm_response(raw)
        assert result["problem_summary"] == FULL_HINTS["problem_summary"]

    def test_parses_json_with_leading_trailing_whitespace(self):
        raw = "   \n" + json.dumps(FULL_HINTS) + "\n  "
        result = _parse_llm_response(raw)
        assert result["hint_1"] == FULL_HINTS["hint_1"]

    def test_parses_json_wrapped_in_markdown_fence(self):
        raw = "```json\n" + json.dumps(FULL_HINTS) + "\n```"
        result = _parse_llm_response(raw)
        assert result["why"] == FULL_HINTS["why"]

    def test_parses_json_with_surrounding_text(self):
        raw = "Here is the analysis:\n" + json.dumps(FULL_HINTS) + "\nHope that helps!"
        result = _parse_llm_response(raw)
        assert result["hint_2"] == FULL_HINTS["hint_2"]

    def test_returns_fallback_on_complete_garbage(self):
        result = _parse_llm_response("Sorry, I cannot assist with that.")
        # Fallback must contain all required keys
        for key in ("problem_summary", "why", "hint_1", "hint_2", "hint_3", "learning_tip"):
            assert key in result

    def test_fallback_values_are_non_empty_strings(self):
        result = _parse_llm_response("not json at all !!!")
        for key in ("problem_summary", "why", "hint_1"):
            assert isinstance(result[key], str)
            assert len(result[key]) > 0

    def test_returns_dict(self):
        result = _parse_llm_response(json.dumps(FULL_HINTS))
        assert isinstance(result, dict)


# ===========================================================================
# Group D – _filter_by_hint_level()
# ===========================================================================

class TestFilterByHintLevel:
    def test_level_1_includes_hint_1(self):
        r = _filter_by_hint_level(FULL_HINTS, 1)
        assert "hint_1" in r

    def test_level_1_excludes_hint_2(self):
        r = _filter_by_hint_level(FULL_HINTS, 1)
        assert "hint_2" not in r

    def test_level_1_excludes_hint_3(self):
        r = _filter_by_hint_level(FULL_HINTS, 1)
        assert "hint_3" not in r

    def test_level_2_includes_hint_1_and_2(self):
        r = _filter_by_hint_level(FULL_HINTS, 2)
        assert "hint_1" in r
        assert "hint_2" in r

    def test_level_2_excludes_hint_3(self):
        r = _filter_by_hint_level(FULL_HINTS, 2)
        assert "hint_3" not in r

    def test_level_3_includes_all_hints(self):
        r = _filter_by_hint_level(FULL_HINTS, 3)
        assert "hint_1" in r
        assert "hint_2" in r
        assert "hint_3" in r

    def test_always_includes_problem_summary(self):
        for level in (1, 2, 3):
            assert "problem_summary" in _filter_by_hint_level(FULL_HINTS, level)

    def test_always_includes_why(self):
        for level in (1, 2, 3):
            assert "why" in _filter_by_hint_level(FULL_HINTS, level)

    def test_always_includes_learning_tip(self):
        for level in (1, 2, 3):
            assert "learning_tip" in _filter_by_hint_level(FULL_HINTS, level)

    def test_hint_values_match_source(self):
        r = _filter_by_hint_level(FULL_HINTS, 3)
        assert r["hint_1"] == FULL_HINTS["hint_1"]
        assert r["hint_2"] == FULL_HINTS["hint_2"]
        assert r["hint_3"] == FULL_HINTS["hint_3"]

    def test_missing_hint_key_returns_empty_string(self):
        partial = {"problem_summary": "x", "why": "y", "learning_tip": "z"}
        r = _filter_by_hint_level(partial, 3)
        assert r["hint_1"] == ""
        assert r["hint_2"] == ""
        assert r["hint_3"] == ""


# ===========================================================================
# Group E – generate_hints() when LLM is disabled
# ===========================================================================

class TestGenerateHintsDisabled:
    """All tests here run with LLM_ENABLED patched to False."""

    def test_returns_llm_error_dict(self):
        with patch.object(llm, "LLM_ENABLED", False):
            result = generate_hints(SAMPLE_CODE, RUNTIME_ERROR_RESULT, hint_level=1)
        assert result.get("status") == "LLMError"

    def test_error_message_mentions_not_enabled(self):
        with patch.object(llm, "LLM_ENABLED", False):
            result = generate_hints(SAMPLE_CODE, RUNTIME_ERROR_RESULT)
        assert "not enabled" in result["message"].lower()

    def test_does_not_call_requests(self):
        with patch.object(llm, "LLM_ENABLED", False), \
             patch("llm.requests.post") as mock_post:
            generate_hints(SAMPLE_CODE, RUNTIME_ERROR_RESULT)
        mock_post.assert_not_called()

    def test_all_hint_levels_return_error(self):
        with patch.object(llm, "LLM_ENABLED", False):
            for level in (1, 2, 3):
                assert generate_hints(SAMPLE_CODE, RUNTIME_ERROR_RESULT, hint_level=level)["status"] == "LLMError"


# ===========================================================================
# Group F – generate_hints() happy path  (LLM enabled, mocked HTTP)
# ===========================================================================

class TestGenerateHintsHappyPath:
    """Tests patch LLM_ENABLED=True and mock requests.post."""

    def test_returns_dict_with_all_base_keys(self):
        with patch.object(llm, "LLM_ENABLED", True), \
             patch("llm.requests.post", return_value=_mock_response(FULL_HINTS)):
            result = generate_hints(SAMPLE_CODE, RUNTIME_ERROR_RESULT, hint_level=3)
        for key in ("problem_summary", "why", "hint_1", "hint_2", "hint_3", "learning_tip"):
            assert key in result

    def test_hint_level_1_returns_only_hint_1(self):
        with patch.object(llm, "LLM_ENABLED", True), \
             patch("llm.requests.post", return_value=_mock_response(FULL_HINTS)):
            result = generate_hints(SAMPLE_CODE, RUNTIME_ERROR_RESULT, hint_level=1)
        assert "hint_1" in result
        assert "hint_2" not in result
        assert "hint_3" not in result

    def test_hint_level_2_returns_hint_1_and_2(self):
        with patch.object(llm, "LLM_ENABLED", True), \
             patch("llm.requests.post", return_value=_mock_response(FULL_HINTS)):
            result = generate_hints(SAMPLE_CODE, RUNTIME_ERROR_RESULT, hint_level=2)
        assert "hint_1" in result
        assert "hint_2" in result
        assert "hint_3" not in result

    def test_hint_level_3_returns_all_hints(self):
        with patch.object(llm, "LLM_ENABLED", True), \
             patch("llm.requests.post", return_value=_mock_response(FULL_HINTS)):
            result = generate_hints(SAMPLE_CODE, RUNTIME_ERROR_RESULT, hint_level=3)
        assert "hint_3" in result

    def test_hint_level_below_1_clamped_to_1(self):
        with patch.object(llm, "LLM_ENABLED", True), \
             patch("llm.requests.post", return_value=_mock_response(FULL_HINTS)):
            result = generate_hints(SAMPLE_CODE, RUNTIME_ERROR_RESULT, hint_level=0)
        assert "hint_1" in result
        assert "hint_2" not in result

    def test_hint_level_above_3_clamped_to_3(self):
        with patch.object(llm, "LLM_ENABLED", True), \
             patch("llm.requests.post", return_value=_mock_response(FULL_HINTS)):
            result = generate_hints(SAMPLE_CODE, RUNTIME_ERROR_RESULT, hint_level=99)
        assert "hint_3" in result

    def test_correct_payload_sent_to_api(self):
        with patch.object(llm, "LLM_ENABLED", True), \
             patch("llm.requests.post", return_value=_mock_response(FULL_HINTS)) as mock_post:
            generate_hints(SAMPLE_CODE, RUNTIME_ERROR_RESULT, hint_level=1)
        call_kwargs = mock_post.call_args
        payload = call_kwargs[1]["json"]          # requests.post(..., json=payload)
        assert payload["model"] == llm.LLM_MODEL
        assert payload["temperature"] == 0.3
        assert payload["max_tokens"] == 1200
        assert any(m["role"] == "system" for m in payload["messages"])
        assert any(m["role"] == "user"   for m in payload["messages"])

    def test_returns_no_llm_error_status_on_success(self):
        with patch.object(llm, "LLM_ENABLED", True), \
             patch("llm.requests.post", return_value=_mock_response(FULL_HINTS)):
            result = generate_hints(SAMPLE_CODE, RUNTIME_ERROR_RESULT, hint_level=1)
        assert result.get("status") != "LLMError"

    def test_default_hint_level_is_1(self):
        """When hint_level is not passed, default=1 → only hint_1 returned."""
        with patch.object(llm, "LLM_ENABLED", True), \
             patch("llm.requests.post", return_value=_mock_response(FULL_HINTS)):
            result = generate_hints(SAMPLE_CODE, RUNTIME_ERROR_RESULT)
        assert "hint_1" in result
        assert "hint_2" not in result


# ===========================================================================
# Group G – generate_hints() error handling
# ===========================================================================

class TestGenerateHintsErrors:
    """Every network/parsing failure must return {"status": "LLMError", ...}."""

    def test_connection_error_returns_llm_error(self):
        with patch.object(llm, "LLM_ENABLED", True), \
             patch("llm.requests.post", side_effect=requests_connection_error()):
            result = generate_hints(SAMPLE_CODE, RUNTIME_ERROR_RESULT)
        assert result["status"] == "LLMError"
        assert "unavailable" in result["message"].lower()

    def test_timeout_error_returns_llm_error(self):
        with patch.object(llm, "LLM_ENABLED", True), \
             patch("llm.requests.post", side_effect=requests_timeout_error()):
            result = generate_hints(SAMPLE_CODE, RUNTIME_ERROR_RESULT)
        assert result["status"] == "LLMError"
        assert "timed out" in result["message"].lower()

    def test_http_error_returns_llm_error(self):
        with patch.object(llm, "LLM_ENABLED", True), \
             patch("llm.requests.post", side_effect=requests_http_error(503)):
            result = generate_hints(SAMPLE_CODE, RUNTIME_ERROR_RESULT)
        assert result["status"] == "LLMError"
        assert "503" in result["message"]

    def test_missing_choices_key_returns_llm_error(self):
        """API response missing 'choices' → KeyError → LLMError."""
        bad_resp = MagicMock()
        bad_resp.json.return_value = {"id": "xyz"}   # no 'choices' key
        bad_resp.raise_for_status.return_value = None
        with patch.object(llm, "LLM_ENABLED", True), \
             patch("llm.requests.post", return_value=bad_resp):
            result = generate_hints(SAMPLE_CODE, RUNTIME_ERROR_RESULT)
        assert result["status"] == "LLMError"

    def test_empty_choices_list_returns_llm_error(self):
        """API response with empty 'choices' list → IndexError → LLMError."""
        bad_resp = MagicMock()
        bad_resp.json.return_value = {"choices": []}
        bad_resp.raise_for_status.return_value = None
        with patch.object(llm, "LLM_ENABLED", True), \
             patch("llm.requests.post", return_value=bad_resp):
            result = generate_hints(SAMPLE_CODE, RUNTIME_ERROR_RESULT)
        assert result["status"] == "LLMError"

    def test_generic_exception_returns_llm_error(self):
        with patch.object(llm, "LLM_ENABLED", True), \
             patch("llm.requests.post", side_effect=RuntimeError("unexpected")):
            result = generate_hints(SAMPLE_CODE, RUNTIME_ERROR_RESULT)
        assert result["status"] == "LLMError"

    def test_error_result_never_raises(self):
        """generate_hints must NEVER raise — always return a dict."""
        with patch.object(llm, "LLM_ENABLED", True), \
             patch("llm.requests.post", side_effect=Exception("boom")):
            result = generate_hints(SAMPLE_CODE, RUNTIME_ERROR_RESULT)
        assert isinstance(result, dict)


# ---------------------------------------------------------------------------
# Helpers for producing requests exception instances without a real request
# ---------------------------------------------------------------------------

import requests as _requests

def requests_connection_error():
    return _requests.exceptions.ConnectionError("refused")

def requests_timeout_error():
    return _requests.exceptions.Timeout("timed out")

def requests_http_error(status_code: int):
    mock_resp = MagicMock()
    mock_resp.status_code = status_code
    exc = _requests.exceptions.HTTPError(response=mock_resp)
    return exc


# ===========================================================================
# Group H – generate_hint() backward-compat shim
# ===========================================================================

class TestGenerateHintShim:
    """generate_hint() is the function called by routes.py."""

    def test_returns_none_when_llm_disabled(self):
        with patch.object(llm, "LLM_ENABLED", False):
            assert generate_hint(SAMPLE_CODE, RUNTIME_ERROR_RESULT) is None

    def test_returns_none_on_connection_error(self):
        with patch.object(llm, "LLM_ENABLED", True), \
             patch("llm.requests.post", side_effect=requests_connection_error()):
            assert generate_hint(SAMPLE_CODE, RUNTIME_ERROR_RESULT) is None

    def test_returns_string_on_success(self):
        with patch.object(llm, "LLM_ENABLED", True), \
             patch("llm.requests.post", return_value=_mock_response(FULL_HINTS)):
            result = generate_hint(SAMPLE_CODE, RUNTIME_ERROR_RESULT)
        assert isinstance(result, str)

    def test_string_contains_problem_summary(self):
        with patch.object(llm, "LLM_ENABLED", True), \
             patch("llm.requests.post", return_value=_mock_response(FULL_HINTS)):
            result = generate_hint(SAMPLE_CODE, RUNTIME_ERROR_RESULT)
        assert "divided by zero" in result

    def test_string_contains_all_three_hints(self):
        with patch.object(llm, "LLM_ENABLED", True), \
             patch("llm.requests.post", return_value=_mock_response(FULL_HINTS)):
            result = generate_hint(SAMPLE_CODE, RUNTIME_ERROR_RESULT)
        assert "Hint 1:" in result
        assert "Hint 2:" in result
        assert "Hint 3:" in result

    def test_string_contains_learning_tip(self):
        with patch.object(llm, "LLM_ENABLED", True), \
             patch("llm.requests.post", return_value=_mock_response(FULL_HINTS)):
            result = generate_hint(SAMPLE_CODE, RUNTIME_ERROR_RESULT)
        assert "Learning tip:" in result

    def test_sections_separated_by_blank_line(self):
        with patch.object(llm, "LLM_ENABLED", True), \
             patch("llm.requests.post", return_value=_mock_response(FULL_HINTS)):
            result = generate_hint(SAMPLE_CODE, RUNTIME_ERROR_RESULT)
        assert "\n\n" in result

    def test_all_empty_hint_values_returns_none(self):
        """If model returns empty strings for everything, shim should return None."""
        empty_hints = {k: "" for k in FULL_HINTS}
        with patch.object(llm, "LLM_ENABLED", True), \
             patch("llm.requests.post", return_value=_mock_response(empty_hints)):
            result = generate_hint(SAMPLE_CODE, RUNTIME_ERROR_RESULT)
        assert result is None

    def test_return_type_is_str_or_none(self):
        """Contract: must be str | None — no other type allowed."""
        with patch.object(llm, "LLM_ENABLED", False):
            result = generate_hint(SAMPLE_CODE, RUNTIME_ERROR_RESULT)
        assert result is None or isinstance(result, str)
