import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from fallback_engine import (  # noqa: E402
    match_error_template,
    normalize_error_message,
    process_with_fallback,
)


VALID_LLM_OUTPUT = {
    "problem_summary": "The compiler cannot resolve a name.",
    "why": "A referenced identifier is not declared in the current scope.",
    "hint_1": "Check spelling and declaration order.",
    "hint_2": "Verify the symbol exists in this method or class.",
    "learning_tip": "Review Java variable scope rules.",
}


def test_normalize_error_message_collapses_space_and_lowercases():
    raw = "  Cannot   Find   Symbol\n  in Main.java "
    assert normalize_error_message(raw) == "cannot find symbol in main.java"


def test_match_error_template_for_known_error():
    template = match_error_template("Main.java:4: error: cannot find symbol")
    assert template is not None
    assert "problem_summary" in template
    assert "hint_1" in template


def test_pipeline_returns_initial_llm_when_valid(monkeypatch):
    execution_result = {"status": "CompilationError", "error_message": "cannot find symbol"}

    called = {"retry": 0}

    def _retry(*args, **kwargs):
        called["retry"] += 1
        return None

    monkeypatch.setattr("fallback_engine.retry_llm_with_strict_prompt", _retry)

    result = process_with_fallback(
        code="class Main {}",
        execution_result=execution_result,
        hint_level=2,
        llm_output=VALID_LLM_OUTPUT,
    )

    assert result["problem_summary"] == VALID_LLM_OUTPUT["problem_summary"]
    assert called["retry"] == 0


def test_pipeline_uses_retry_when_initial_invalid(monkeypatch):
    execution_result = {"status": "CompilationError", "error_message": "cannot find symbol"}

    retry_output = {
        "problem_summary": "A symbol is not recognized.",
        "why": "The referenced name is missing or misspelled.",
        "hint_1": "Check name spelling and case.",
        "learning_tip": "Learn Java identifier naming and scope.",
    }

    monkeypatch.setattr("fallback_engine.retry_llm_with_strict_prompt", lambda *_: retry_output)

    result = process_with_fallback(
        code="class Main {}",
        execution_result=execution_result,
        hint_level=1,
        llm_output={"bad": "shape"},
    )

    assert result["problem_summary"] == retry_output["problem_summary"]
    assert "hint_1" in result


def test_pipeline_uses_template_when_retry_invalid(monkeypatch):
    execution_result = {
        "status": "RuntimeError",
        "error_message": "java.lang.NullPointerException at Main.main(Main.java:6)",
    }

    monkeypatch.setattr("fallback_engine.retry_llm_with_strict_prompt", lambda *_: None)

    result = process_with_fallback(
        code="class Main {}",
        execution_result=execution_result,
        hint_level=2,
        llm_output={"bad": "shape"},
    )

    assert "null" in result["problem_summary"].lower() or "reference" in result["why"].lower()
    assert "learning_tip" in result


def test_pipeline_uses_generic_fallback_when_no_template(monkeypatch):
    execution_result = {
        "status": "RuntimeError",
        "error_message": "mysterious custom failure from sandbox",
    }

    monkeypatch.setattr("fallback_engine.retry_llm_with_strict_prompt", lambda *_: None)

    result = process_with_fallback(
        code="class Main {}",
        execution_result=execution_result,
        hint_level=3,
        llm_output={"bad": "shape"},
    )

    assert result["problem_summary"] == "There is an issue in your code."
    assert result["why"] == execution_result["error_message"]
    assert "hint_1" in result
    assert "learning_tip" in result


def test_pipeline_shapes_by_hint_level(monkeypatch):
    execution_result = {"status": "CompilationError", "error_message": "incompatible types"}

    monkeypatch.setattr("fallback_engine.retry_llm_with_strict_prompt", lambda *_: None)

    result_level_1 = process_with_fallback(
        code="class Main {}",
        execution_result=execution_result,
        hint_level=1,
        llm_output={"bad": "shape"},
    )
    result_level_3 = process_with_fallback(
        code="class Main {}",
        execution_result=execution_result,
        hint_level=3,
        llm_output={"bad": "shape"},
    )

    assert "hint_2" not in result_level_1
    assert "hint_2" in result_level_3
