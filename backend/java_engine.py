"""
java_engine.py
--------------
Secure Java compilation and execution engine for the AI-Based Java Programming Tutor.

Workflow:
    1. Write the submitted source code to a temp file (Main.java).
    2. Compile with `javac` and capture all compiler diagnostics.
    3. If compilation succeeds, run with `java` under a strict timeout.
    4. Parse compiler / runtime output into a structured result dict.
    5. Always clean up temp files, regardless of outcome.
"""

import os
import re
import shutil
import subprocess
import sys
import tempfile
import uuid

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Base directory for all temporary Java sandboxes.
# Using a subfolder of the OS temp dir keeps things tidy and avoids name clashes.
TEMP_BASE_DIR = os.path.join(tempfile.gettempdir(), "java_exec")

# Hard limits
COMPILE_TIMEOUT = 10   # seconds – javac should never need more than this
EXECUTE_TIMEOUT = 5    # seconds – kills infinite loops / blocking reads


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _ensure_temp_dir(path: str) -> None:
    """Create *path* (and all parents) if it does not already exist."""
    os.makedirs(path, exist_ok=True)


def _cleanup(directory: str) -> None:
    """
    Recursively remove the sandbox directory that held .java / .class files.
    Silently ignores errors so a cleanup failure never masks the real result.
    """
    try:
        shutil.rmtree(directory, ignore_errors=True)
    except Exception:
        pass


def _extract_compile_line_number(stderr: str) -> int | None:
    """
    Parse the first line number reported by javac.

    javac error format:  Main.java:<line>: error: <message>
    Returns the integer line number, or None if it cannot be found.
    """
    match = re.search(r"Main\.java:(\d+):", stderr)
    if match:
        return int(match.group(1))
    return None


def _extract_runtime_info(stderr: str) -> tuple[str | None, int | None]:
    """
    Extract the exception type and line number from a Java runtime stack trace.

    Stack trace format (first line):
        Exception in thread "main" java.lang.ArithmeticException: / by zero
    Frame line format (anywhere in trace):
        at Main.main(Main.java:<line>)

    Returns:
        (exception_type, line_number) – either value may be None.
    """
    exception_type: str | None = None
    line_number: int | None = None

    # Match the leading exception class name
    exc_match = re.search(
        r"Exception in thread \"[^\"]+\"\s+([\w.$]+(?:Exception|Error)[^\n:]*)",
        stderr
    )
    if exc_match:
        # Keep only the simple class name (last segment after the last dot)
        full_name = exc_match.group(1).strip()
        exception_type = full_name.split(".")[-1]

    # Find the line in Main that threw the exception
    line_match = re.search(r"at Main\.(?:\w+)\(Main\.java:(\d+)\)", stderr)
    if line_match:
        line_number = int(line_match.group(1))

    return exception_type, line_number


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def execute_java_code(code: str) -> dict:
    """
    Compile and execute a Java source string safely.

    The caller must ensure the public class is named ``Main``.

    Parameters
    ----------
    code : str
        Raw Java source code for a class named ``Main``.

    Returns
    -------
    dict
        One of four structured result shapes depending on outcome:

        * ``{"status": "Success",          "output": str,  "error_message": None}``
        * ``{"status": "CompilationError", "output": None, "error_message": str,  "line_number": int|None}``
        * ``{"status": "RuntimeError",     "output": str,  "error_message": str,  "exception_type": str|None, "line_number": int|None}``
        * ``{"status": "Timeout",          "output": None, "error_message": "Execution time exceeded limit"}``
    """

    # Each execution gets its own isolated sandbox directory.
    sandbox = os.path.join(TEMP_BASE_DIR, uuid.uuid4().hex)

    try:
        # ------------------------------------------------------------------
        # 1. Prepare sandbox and write source file
        # ------------------------------------------------------------------
        _ensure_temp_dir(sandbox)
        source_path = os.path.join(sandbox, "Main.java")

        with open(source_path, "w", encoding="utf-8") as fh:
            fh.write(code)

        # ------------------------------------------------------------------
        # 2. Compile
        # ------------------------------------------------------------------
        compile_result = subprocess.run(
            ["javac", source_path],
            capture_output=True,
            text=True,
            timeout=COMPILE_TIMEOUT,
            cwd=sandbox,          # class files land in the same sandbox dir
        )

        if compile_result.returncode != 0:
            # javac exits with non-zero on any error
            stderr = compile_result.stderr or compile_result.stdout
            return {
                "status": "CompilationError",
                "error_message": stderr.strip(),
                "line_number": _extract_compile_line_number(stderr),
                "output": None,
            }

        # ------------------------------------------------------------------
        # 3. Execute
        # ------------------------------------------------------------------
        # Use Popen instead of subprocess.run so we can forcibly terminate the
        # entire process tree on timeout.  On Windows, subprocess.run() re-calls
        # communicate() after TimeoutExpired without killing the child first,
        # which causes an indefinite hang when the Java program is still running.
        process = subprocess.Popen(
            ["java", "-cp", sandbox, "Main"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            cwd=sandbox,
        )

        try:
            stdout, stderr = process.communicate(timeout=EXECUTE_TIMEOUT)
        except subprocess.TimeoutExpired:
            # ── Kill the entire JVM process tree ──────────────────────────
            # On Windows, process.kill() only terminates the top-level process;
            # child threads / processes may keep the pipes open and cause a
            # second communicate() to hang.  taskkill /F /T forces the whole tree.
            if sys.platform == "win32":
                subprocess.run(
                    ["taskkill", "/F", "/T", "/PID", str(process.pid)],
                    capture_output=True,
                )
            else:
                process.kill()

            # Drain any buffered pipe data (non-blocking after the kill)
            try:
                process.communicate(timeout=3)
            except Exception:
                pass

            return {
                "status": "Timeout",
                "error_message": "Execution time exceeded limit",
                "output": None,
            }

        stdout = stdout or ""
        stderr = stderr or ""

        # A non-zero exit code almost always means an unhandled exception
        if process.returncode != 0 or stderr.strip():
            exception_type, line_number = _extract_runtime_info(stderr)
            # Use the first meaningful line of stderr as the error message
            first_line = stderr.strip().splitlines()[0] if stderr.strip() else "Runtime error"
            return {
                "status": "RuntimeError",
                "error_message": first_line,
                "exception_type": exception_type,
                "line_number": line_number,
                "output": stdout.strip() if stdout.strip() else None,
            }

        # ------------------------------------------------------------------
        # 4. Success
        # ------------------------------------------------------------------
        return {
            "status": "Success",
            "error_message": None,
            "output": stdout.strip(),
        }

    except subprocess.TimeoutExpired:
        # Compilation itself timed out (pathological input)
        return {
            "status": "Timeout",
            "error_message": "Execution time exceeded limit",
            "output": None,
        }

    except FileNotFoundError as exc:
        # javac / java not found on PATH
        return {
            "status": "RuntimeError",
            "error_message": f"Java toolchain not found on PATH: {exc}",
            "exception_type": "EnvironmentError",
            "line_number": None,
            "output": None,
        }

    except Exception as exc:  # noqa: BLE001  (broad catch is intentional here)
        # Catch-all: never let an internal error surface as an unhandled exception
        return {
            "status": "RuntimeError",
            "error_message": f"Internal engine error: {exc}",
            "exception_type": type(exc).__name__,
            "line_number": None,
            "output": None,
        }

    finally:
        # Always remove sandbox files, regardless of success or failure
        _cleanup(sandbox)
