"""
live_llm_test.py
----------------
Live integration test – sends real Java error scenarios to LM Studio
(Qwen Coder 30B) and prints the actual structured responses returned.

Run from the project root:
    python live_llm_test.py
"""

import sys
import os
import json
import textwrap
import time

# ── Backend on path ────────────────────────────────────────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

# ── Patch env vars before importing llm ────────────────────────────────────
os.environ["LLM_ENABLED"]  = "true"
os.environ["LLM_MODEL"]    = "qwen/qwen3-coder-30b"
os.environ["LLM_BASE_URL"] = "http://localhost:1234/v1"
os.environ["LLM_TIMEOUT"]  = "120"

import llm

# Force module-level variables to pick up env values
# (they are evaluated at import time, so we re-assign after setting env)
llm.LLM_ENABLED  = True
llm.LLM_MODEL    = "qwen/qwen3-coder-30b"
llm.LLM_TIMEOUT  = 120
llm.LLM_API_URL  = "http://localhost:1234/v1/chat/completions"

# ── Pretty printer ─────────────────────────────────────────────────────────

DIVIDER    = "=" * 70
SUBDIV     = "-" * 70
HINT_KEYS  = ("problem_summary", "why", "hint_1", "hint_2", "hint_3", "learning_tip")


def print_result(title: str, code: str, execution_result: dict, hint_level: int, response: dict):
    print(DIVIDER)
    print(f"  {title}")
    print(SUBDIV)

    # Input summary
    print("\n[INPUT]")
    print(f"  Execution status : {execution_result.get('status')}")
    print(f"  Error message    : {execution_result.get('error_message', 'N/A')}")
    if execution_result.get("line_number"):
        print(f"  Line number      : {execution_result['line_number']}")
    if execution_result.get("exception_type"):
        print(f"  Exception type   : {execution_result['exception_type']}")
    print(f"  Hint level       : {hint_level}")
    print()
    print("[CODE SUBMITTED]")
    for line in code.strip().splitlines():
        print(f"    {line}")

    # LLM response
    print()
    if response.get("status") == "LLMError":
        print("[LLM RESPONSE]  *** LLMError ***")
        print(f"  message: {response.get('message')}")
    else:
        print("[LLM RESPONSE]")
        for key in (*HINT_KEYS, ):
            if key in response:
                label  = key.replace("_", " ").upper()
                value  = response[key]
                wrapped = textwrap.fill(value, width=60, subsequent_indent="    ")
                print(f"\n  {label}:")
                print(f"    {wrapped}")
    print()


# ===========================================================================
# Test cases
# ===========================================================================

TESTS = [
    # ── Test 1: Compilation Error, level 1 ──────────────────────────────
    {
        "title": "TEST 1 — Compilation Error  (hint_level = 1)",
        "hint_level": 1,
        "code": (
            'public class Main {\n'
            '    public static void main(String[] args) {\n'
            '        System.out.println("Hello world")  // missing semicolon\n'
            '    }\n'
            '}'
        ),
        "execution_result": {
            "status":        "CompilationError",
            "error_message": "Main.java:3: error: ';' expected",
            "line_number":   3,
        },
    },

    # ── Test 2: Runtime Error, level 2 ──────────────────────────────────
    {
        "title": "TEST 2 — Runtime Error: divide by zero  (hint_level = 2)",
        "hint_level": 2,
        "code": (
            'public class Main {\n'
            '    public static void main(String[] args) {\n'
            '        int a = 10;\n'
            '        int b = 0;\n'
            '        System.out.println(a / b);\n'
            '    }\n'
            '}'
        ),
        "execution_result": {
            "status":         "RuntimeError",
            "error_message":  "Exception in thread \"main\" java.lang.ArithmeticException: / by zero",
            "exception_type": "ArithmeticException",
            "line_number":    5,
        },
    },

    # ── Test 3: NullPointerException, level 3 ───────────────────────────
    {
        "title": "TEST 3 — Runtime Error: NullPointerException  (hint_level = 3)",
        "hint_level": 3,
        "code": (
            'public class Main {\n'
            '    public static void main(String[] args) {\n'
            '        String name = null;\n'
            '        System.out.println(name.length());\n'
            '    }\n'
            '}'
        ),
        "execution_result": {
            "status":         "RuntimeError",
            "error_message":  "Exception in thread \"main\" java.lang.NullPointerException",
            "exception_type": "NullPointerException",
            "line_number":    4,
        },
    },

    # ── Test 4: Infinite loop / Timeout, level 2 ────────────────────────
    {
        "title": "TEST 4 — Timeout (infinite loop)  (hint_level = 2)",
        "hint_level": 2,
        "code": (
            'public class Main {\n'
            '    public static void main(String[] args) {\n'
            '        while (true) {\n'
            '            System.out.println("running");\n'
            '        }\n'
            '    }\n'
            '}'
        ),
        "execution_result": {
            "status":        "Timeout",
            "error_message": "Execution time exceeded the 5-second limit",
        },
    },

    # ── Test 5: ArrayIndexOutOfBounds, level 3 ───────────────────────────
    {
        "title": "TEST 5 — Runtime Error: ArrayIndexOutOfBoundsException  (hint_level = 3)",
        "hint_level": 3,
        "code": (
            'public class Main {\n'
            '    public static void main(String[] args) {\n'
            '        int[] numbers = {1, 2, 3};\n'
            '        System.out.println(numbers[5]);\n'
            '    }\n'
            '}'
        ),
        "execution_result": {
            "status":         "RuntimeError",
            "error_message":  "Exception in thread \"main\" java.lang.ArrayIndexOutOfBoundsException: Index 5 out of bounds for length 3",
            "exception_type": "ArrayIndexOutOfBoundsException",
            "line_number":    4,
        },
    },
]


# ===========================================================================
# Runner
# ===========================================================================

def main():
    print(DIVIDER)
    print("  LIVE LLM INTEGRATION TEST — Qwen Coder 30B via LM Studio")
    print(f"  Endpoint : {llm.LLM_API_URL}")
    print(f"  Model    : {llm.LLM_MODEL}")
    print(f"  Timeout  : {llm.LLM_TIMEOUT}s")
    print(DIVIDER)
    print()

    results_summary = []

    for i, test in enumerate(TESTS, 1):
        print(f"  Sending test {i}/{len(TESTS)} ... ", end="", flush=True)
        t0       = time.time()
        response = llm.generate_hints(
            code             = test["code"],
            execution_result = test["execution_result"],
            hint_level       = test["hint_level"],
        )
        elapsed = time.time() - t0
        status  = "OK" if response.get("status") != "LLMError" else "ERROR"
        print(f"{status}  ({elapsed:.1f}s)")

        print_result(
            title            = test["title"],
            code             = test["code"],
            execution_result = test["execution_result"],
            hint_level       = test["hint_level"],
            response         = response,
        )

        results_summary.append({
            "test":    test["title"],
            "status":  status,
            "elapsed": f"{elapsed:.1f}s",
        })

    # Final summary table
    print(DIVIDER)
    print("  SUMMARY")
    print(SUBDIV)
    all_ok = all(r["status"] == "OK" for r in results_summary)
    for r in results_summary:
        icon = "PASS" if r["status"] == "OK" else "FAIL"
        print(f"  [{icon}]  {r['test'][:55]:<55}  {r['elapsed']}")
    print(SUBDIV)
    print(f"  Result: {'ALL TESTS PASSED' if all_ok else 'SOME TESTS FAILED'}")
    print(DIVIDER)


if __name__ == "__main__":
    main()
