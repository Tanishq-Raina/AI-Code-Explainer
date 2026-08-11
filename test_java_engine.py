"""
Manual test cases for java_engine.execute_java_code()
Run with:  python test_java_engine.py
"""
import json
from backend.java_engine import execute_java_code

# ANSI colours for readability
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
RESET  = "\033[0m"

STATUS_COLOUR = {
    "Success":          GREEN,
    "CompilationError": RED,
    "RuntimeError":     RED,
    "Timeout":          YELLOW,
}

def run_test(label: str, code: str, expected_status: str) -> None:
    print(f"\n{'='*60}")
    print(f"TEST : {label}")
    print(f"{'='*60}")
    result = execute_java_code(code)
    status = result.get("status", "Unknown")
    colour = STATUS_COLOUR.get(status, RESET)
    passed = "✓ PASS" if status == expected_status else "✗ FAIL"
    print(f"Status   : {colour}{status}{RESET}  {passed}")
    print(f"Expected : {expected_status}")
    print(f"Result   :\n{json.dumps(result, indent=2)}")


# ------------------------------------------------------------------
# CASE 1 – Successful execution
# ------------------------------------------------------------------
run_test(
    label="Success – Hello World",
    expected_status="Success",
    code="""
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
"""
)

# ------------------------------------------------------------------
# CASE 2 – Compilation error (missing semicolon)
# ------------------------------------------------------------------
run_test(
    label="CompilationError – Missing semicolon",
    expected_status="CompilationError",
    code="""
public class Main {
    public static void main(String[] args) {
        System.out.println("Oops")   // <-- no semicolon
    }
}
"""
)

# ------------------------------------------------------------------
# CASE 3 – Runtime exception (divide by zero)
# ------------------------------------------------------------------
run_test(
    label="RuntimeError – Divide by zero",
    expected_status="RuntimeError",
    code="""
public class Main {
    public static void main(String[] args) {
        int x = 10 / 0;
    }
}
"""
)

# ------------------------------------------------------------------
# CASE 4 – Runtime exception with partial output
# ------------------------------------------------------------------
run_test(
    label="RuntimeError – Partial output before crash",
    expected_status="RuntimeError",
    code="""
public class Main {
    public static void main(String[] args) {
        System.out.println("Line 1");
        System.out.println("Line 2");
        int[] arr = new int[3];
        System.out.println(arr[10]);  // ArrayIndexOutOfBoundsException
    }
}
"""
)

# ------------------------------------------------------------------
# CASE 5 – Timeout (infinite loop)
# ------------------------------------------------------------------
run_test(
    label="Timeout – Infinite loop",
    expected_status="Timeout",
    code="""
public class Main {
    public static void main(String[] args) {
        while (true) {}
    }
}
"""
)

# ------------------------------------------------------------------
# CASE 6 – NullPointerException
# ------------------------------------------------------------------
run_test(
    label="RuntimeError – NullPointerException",
    expected_status="RuntimeError",
    code="""
public class Main {
    public static void main(String[] args) {
        String s = null;
        System.out.println(s.length());
    }
}
"""
)

# ------------------------------------------------------------------
# CASE 7 – StackOverflow (recursive)
# ------------------------------------------------------------------
run_test(
    label="RuntimeError – StackOverflowError",
    expected_status="RuntimeError",
    code="""
public class Main {
    static void recurse() { recurse(); }
    public static void main(String[] args) {
        recurse();
    }
}
"""
)

print(f"\n{'='*60}")
print("All tests completed.")
print(f"{'='*60}\n")