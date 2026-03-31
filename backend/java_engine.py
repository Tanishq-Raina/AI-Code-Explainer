"""
java_engine.py
--------------
Secure Java compilation and execution engine for the AI-Based Java Programming Tutor.

Architecture
~~~~~~~~~~~~
The module is split into four clearly separated layers:

    ┌─────────────────────────────────┐
    │  execute_java_code()  (public)  │  ← single entry point for callers
    └────────────┬────────────────────┘
                 │
        ┌────────▼─────────┐
        │   _compile()     │  writes Main.java, runs javac, returns _CompileResult
        └────────┬─────────┘
                 │  only reached on successful compile
        ┌────────▼─────────┐
        │   _run()         │  launches JVM via Popen, enforces timeout, kills tree
        └────────┬─────────┘
                 │
        ┌────────▼─────────┐
        │  _parse_*()      │  regex helpers – javac errors, runtime stack traces
        └──────────────────┘

Temp files live in:  <os tmpdir>/java_exec/<uuid>/
They are always deleted in a ``finally`` block.
"""

import os
import re
import shutil
import subprocess
import sys
import tempfile
import uuid
from dataclasses import dataclass
from typing import Optional


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

TEMP_BASE_DIR:    str = os.path.join(tempfile.gettempdir(), "java_exec")

# Time limits
COMPILE_TIMEOUT:  int = 10   # seconds – javac on any realistic file is well under 10 s
EXECUTE_TIMEOUT:  int = 5    # seconds – kills infinite loops / blocking stdin reads

# The one class name the engine supports.  The caller must match this.
MAIN_CLASS:       str = "Main"
SOURCE_FILE:      str = f"{MAIN_CLASS}.java"


# ---------------------------------------------------------------------------
# Internal data containers
# ---------------------------------------------------------------------------

@dataclass
class _CompileResult:
    """Outcome of the javac step."""
    success:  bool
    stderr:   str = ""
    stdout:   str = ""


@dataclass
class _RunResult:
    """Outcome of the java execution step."""
    timed_out:   bool = False
    returncode:  int  = 0
    stdout:      str  = ""
    stderr:      str  = ""


# ---------------------------------------------------------------------------
# Regex helpers
# ---------------------------------------------------------------------------

# javac reports errors as:  Main.java:<line>: error: <message>
_JAVAC_LINE_RE = re.compile(
    r"\bMain\.java:(\d+):",
    re.MULTILINE,
)

# First line of a JVM stack trace (two forms):
#   Exception in thread "main" java.lang.ArithmeticException: / by zero
#   Exception in thread "main" java.lang.StackOverflowError
_RUNTIME_EXC_RE = re.compile(
    r'^Exception in thread "[^"]+" '   # thread header
    r'([\w.$]+'                        # fully-qualified exception class
    r'(?:Exception|Error)'             # must contain Exception or Error
    r'[\w.$]*)'                        # optional inner-class suffix
    r'(?::[^\n]*)?$',                  # optional ": message" on the same line
    re.MULTILINE,
)

# Stack frame referencing a line inside Main.java:
#   at Main.someMethod(Main.java:42)
_RUNTIME_LINE_RE = re.compile(
    r"\bat\s+Main\.\w+\(Main\.java:(\d+)\)",
    re.MULTILINE,
)


def _parse_compile_error(stderr: str) -> Optional[int]:
    """
    Return the *first* line number reported by javac, or ``None``.

    Surfacing only the first error guides the student to fix issues one at a
    time rather than overwhelming them with cascading diagnostics.
    """
    match = _JAVAC_LINE_RE.search(stderr)
    return int(match.group(1)) if match else None


def _parse_runtime_exception(stderr: str) -> tuple[Optional[str], Optional[int]]:
    """
    Extract the simple exception class name and the line number in Main.java
    from a JVM stack trace.

    Returns
    -------
    (exception_type, line_number)
        Either value may be ``None`` when the pattern is not matched.

    Examples
    --------
    Input::

        Exception in thread "main" java.lang.ArithmeticException: / by zero
            at Main.main(Main.java:4)

    Output::

        ("ArithmeticException", 4)
    """
    exception_type: Optional[str] = None
    line_number:    Optional[int] = None

    exc_match = _RUNTIME_EXC_RE.search(stderr)
    if exc_match:
        # Drop the package prefix; keep only the simple class name.
        full_name      = exc_match.group(1).strip()
        exception_type = full_name.rsplit(".", 1)[-1]

    line_match = _RUNTIME_LINE_RE.search(stderr)
    if line_match:
        line_number = int(line_match.group(1))

    return exception_type, line_number


# ---------------------------------------------------------------------------
# Sandbox utilities
# ---------------------------------------------------------------------------

def _create_sandbox() -> str:
    """
    Create and return a fresh, isolated sandbox directory.

    Each call to ``execute_java_code`` gets its own UUID-named directory so
    concurrent requests never share or overwrite each other's files.
    """
    path = os.path.join(TEMP_BASE_DIR, uuid.uuid4().hex)
    os.makedirs(path, exist_ok=True)
    return path


def _cleanup(directory: str) -> None:
    """
    Remove the sandbox directory tree silently.

    Errors are suppressed so a failed cleanup never masks the execution result
    returned to the caller.
    """
    try:
        shutil.rmtree(directory, ignore_errors=True)
    except Exception:
        pass


def _kill_process_tree(pid: int) -> None:
    """
    Terminate a process and **all its children**.

    On Windows, ``process.kill()`` only signals the top-level process.  The
    JVM may keep stdout/stderr pipes open via worker threads, causing any
    subsequent ``communicate()`` to hang indefinitely.  ``taskkill /F /T``
    forcibly terminates the entire process tree.

    On POSIX, SIGKILL is sent to the process group created by
    ``start_new_session=True`` so all child processes are killed together.
    """
    if sys.platform == "win32":
        subprocess.run(
            ["taskkill", "/F", "/T", "/PID", str(pid)],
            check=False,
            capture_output=True,
        )
    else:
        try:
            import signal
            os.killpg(os.getpgid(pid), signal.SIGKILL)
        except Exception:
            pass  # best-effort fallback


# ---------------------------------------------------------------------------
# Compilation layer
# ---------------------------------------------------------------------------

def _compile(source_path: str, sandbox: str) -> _CompileResult:
    """
    Invoke ``javac`` to compile *source_path*.

    The ``-d`` flag directs generated ``.class`` files into *sandbox*,
    keeping them isolated from any other sandbox running concurrently.

    Parameters
    ----------
    source_path : str
        Absolute path to the ``Main.java`` file inside *sandbox*.
    sandbox : str
        Absolute path to the sandbox directory used as the class output dir.

    Returns
    -------
    _CompileResult
        ``success=True`` only when javac exits with return code 0.
    """
    result = subprocess.run(
        ["javac", "-d", sandbox, source_path],
        check=False,           # we inspect returncode manually
        capture_output=True,   # stdout and stderr captured separately
        text=True,
        timeout=COMPILE_TIMEOUT,
        cwd=sandbox,
    )
    return _CompileResult(
        success=result.returncode == 0,
        stderr=result.stderr or "",
        stdout=result.stdout or "",
    )


# ---------------------------------------------------------------------------
# Execution layer
# ---------------------------------------------------------------------------

def _run(sandbox: str) -> _RunResult:
    """
    Execute the compiled ``Main`` class inside *sandbox*.

    Security constraints applied here
    ----------------------------------
    * ``-cp sandbox`` — classpath is restricted to the sandbox directory; no
      system classes or project dependencies are accessible.
    * ``cwd=sandbox`` — working directory is the sandbox, so relative file I/O
      stays within it.
    * Hard wall-clock timeout — the JVM process tree is killed if the program
      has not exited within ``EXECUTE_TIMEOUT`` seconds.

    Returns
    -------
    _RunResult
        Contains ``timed_out``, ``returncode``, ``stdout``, and ``stderr``.
    """
    popen_kwargs: dict = dict(
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        cwd=sandbox,
    )

    # On POSIX, spawn a new session so we can SIGKILL the entire process group.
    if sys.platform != "win32":
        popen_kwargs["start_new_session"] = True

    process = subprocess.Popen(
        ["java", "-cp", sandbox, MAIN_CLASS],
        **popen_kwargs,
    )

    try:
        stdout, stderr = process.communicate(timeout=EXECUTE_TIMEOUT)
        return _RunResult(
            timed_out=False,
            returncode=process.returncode,
            stdout=stdout or "",
            stderr=stderr or "",
        )

    except subprocess.TimeoutExpired:
        # Kill the entire JVM tree before draining pipes to avoid a hang.
        _kill_process_tree(process.pid)
        try:
            process.communicate(timeout=3)   # drain now-safe pipes
        except Exception:
            pass
        return _RunResult(timed_out=True)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def execute_java_code(code: str) -> dict:
    """
    Compile and execute a snippet of Java source code safely.

    The submitted code **must** declare exactly one public class named
    ``Main`` with a standard ``public static void main(String[] args)``
    entry point.

    Parameters
    ----------
    code : str
        Raw Java source code (UTF-8 text).

    Returns
    -------
    dict
        Exactly one of the four structured shapes below.

    Possible return shapes
    ~~~~~~~~~~~~~~~~~~~~~~
    **Success** ::

        {"status": "Success", "error_message": None, "output": "<stdout>"}

    **CompilationError** ::

        {"status": "CompilationError", "error_message": "<javac stderr>",
         "line_number": <int>|None, "output": None}

    **RuntimeError** ::

        {"status": "RuntimeError", "error_message": "<first stderr line>",
         "exception_type": "<ClassName>"|None, "line_number": <int>|None,
         "output": "<partial stdout>"|None}

    **Timeout** ::

        {"status": "Timeout", "error_message": "Execution time exceeded limit",
         "output": None}
    """
    sandbox = _create_sandbox()

    try:
        # ------------------------------------------------------------------
        # 1. Write source file into the isolated sandbox
        # ------------------------------------------------------------------
        source_path = os.path.join(sandbox, SOURCE_FILE)
        with open(source_path, "w", encoding="utf-8") as fh:
            fh.write(code)

        # ------------------------------------------------------------------
        # 2. Compile
        #    Execution is unconditionally blocked until this succeeds.
        # ------------------------------------------------------------------
        compile_result = _compile(source_path, sandbox)

        if not compile_result.success:
            # Merge stderr + stdout in case javac splits its output.
            raw_error = (compile_result.stderr or compile_result.stdout).strip()
            return {
                "status":        "CompilationError",
                "error_message": raw_error,
                "line_number":   _parse_compile_error(raw_error),
                "output":        None,
            }

        # ------------------------------------------------------------------
        # 3. Execute  (only reached after a clean compile)
        # ------------------------------------------------------------------
        run_result = _run(sandbox)

        if run_result.timed_out:
            return {
                "status":        "Timeout",
                "error_message": "Execution time exceeded limit",
                "output":        None,
            }

        stdout = run_result.stdout.strip()
        stderr = run_result.stderr.strip()

        # A non-zero exit code, or any text on stderr, signals a runtime fault.
        if run_result.returncode != 0 or stderr:
            exception_type, line_number = _parse_runtime_exception(stderr)
            first_line = stderr.splitlines()[0] if stderr else "Runtime error"
            return {
                "status":         "RuntimeError",
                "error_message":  first_line,
                "exception_type": exception_type,
                "line_number":    line_number,
                "output":         stdout if stdout else None,
            }

        # ------------------------------------------------------------------
        # 4. Clean success
        # ------------------------------------------------------------------
        return {
            "status":        "Success",
            "error_message": None,
            "output":        stdout,
        }

    except subprocess.TimeoutExpired:
        # javac itself timed out – extremely unusual, handled gracefully.
        return {
            "status":        "Timeout",
            "error_message": "Execution time exceeded limit",
            "output":        None,
        }

    except FileNotFoundError as exc:
        # javac or java binary not found on PATH.
        return {
            "status":         "RuntimeError",
            "error_message":  f"Java toolchain not found on PATH: {exc}",
            "exception_type": "EnvironmentError",
            "line_number":    None,
            "output":         None,
        }

    except Exception as exc:  # noqa: BLE001
        # Catch-all safety net – internal errors must never crash the server.
        return {
            "status":         "RuntimeError",
            "error_message":  f"Internal engine error: {exc}",
            "exception_type": type(exc).__name__,
            "line_number":    None,
            "output":         None,
        }

    finally:
        # Always remove sandbox files – success, failure, or unhandled exception.
        _cleanup(sandbox)

