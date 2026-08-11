import { useState } from "react";
import { submitCode } from "../../api/client";

const NON_RUNNABLE_MODULE_MESSAGE =
  "This example demonstrates module syntax and is not directly executable as a single Main.java program.";
const NON_RUNNABLE_SNIPPET_MESSAGE =
  "This example is descriptive and does not include a runnable main method, so the Study runner is showing it as a reference snippet.";

function unpackExecution(res) {
  const payload = res?.data ?? res ?? {};
  const exec = payload?.execution ?? payload?.execution_result ?? payload ?? {};

  return {
    status: exec?.status || payload?.status || (res?.success ? "Success" : "Error"),
    output: exec?.output ?? payload?.output ?? "",
    errorMessage:
      exec?.error_message ??
      payload?.error_message ??
      exec?.stderr ??
      payload?.stderr ??
      "",
    errorLine: exec?.line_number ?? null,
  };
}

function escapeForJavaString(text) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "")
    .replace(/\n/g, "\\n");
}

function buildModuleWrapper(originalCode) {
  return `public class Main {
    public static void main(String[] args) {
        System.out.println("${escapeForJavaString(NON_RUNNABLE_MODULE_MESSAGE)}");
    }
}

/*
${originalCode}
*/`;
}

function buildReferenceWrapper(originalCode) {
  return `public class Main {
    public static void main(String[] args) {
        System.out.println("${escapeForJavaString(NON_RUNNABLE_SNIPPET_MESSAGE)}");
    }
}

/*
${originalCode}
*/`;
}

function renamePublicTopLevelTypeToMain(source) {
  const match = source.match(
    /\bpublic\s+(class|interface|enum|record)\s+([A-Za-z_$][\w$]*)\b/
  );

  if (!match) {
    return source;
  }

  const [, type, name] = match;
  if (name === "Main") {
    return source;
  }

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const namePattern = new RegExp(`\\b${escapedName}\\b`, "g");

  return source
    .replace(
      /\bpublic\s+(class|interface|enum|record)\s+([A-Za-z_$][\w$]*)\b/,
      `public ${type} Main`
    )
    .replace(namePattern, "Main");
}

function normalizeStudyCode(code) {
  let source = String(code || "").trim();
  if (!source) return "";

  if (/^\s*module\s+/m.test(source)) {
    return buildModuleWrapper(source);
  }

  if (/^\s*package\s+[a-zA-Z0-9_.]+\s*;/m.test(source)) {
    source = source.replace(/^\s*package\s+[a-zA-Z0-9_.]+\s*;\s*/m, "");
  }

  if (!/\bpublic\s+static\s+void\s+main\s*\(/.test(source)) {
    return buildReferenceWrapper(source);
  }

  return renamePublicTopLevelTypeToMain(source);
}

function getDisplayState(status, output, errorMessage) {
  const isError =
    status === "CompilationError" ||
    status === "RuntimeError" ||
    status === "Timeout" ||
    status === "Error" ||
    status === "Backend connection failed";

  if (isError) {
    return {
      kind: "error",
      label: "Error",
      body: errorMessage || output || "The code could not be executed.",
    };
  }

  return {
    kind: "output",
    label: "Output",
    body: output || "Program ran successfully with no output.",
  };
}

function StudyCodeBlock({ code }) {
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState("Idle");
  const [output, setOutput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errorLine, setErrorLine] = useState(null);

  const handleRun = async () => {
    try {
      setIsRunning(true);
      setStatus("Running...");
      setOutput("");
      setErrorMessage("");
      setErrorLine(null);

      const response = await submitCode({
        user_id: "study_user",
        code: normalizeStudyCode(code),
        submission_type: "run",
      });

      const execution = unpackExecution(response);
      setStatus(execution.status);
      setOutput(execution.output || "");
      setErrorMessage(execution.errorMessage || "");
      setErrorLine(execution.errorLine);
    } catch (error) {
      console.error("Study code execution failed:", error);
      setStatus("Backend connection failed");
      setOutput("");
      setErrorMessage("Check if backend is running on port 5000.");
      setErrorLine(null);
    } finally {
      setIsRunning(false);
    }
  };

  const showResult = status !== "Idle";
  const result = getDisplayState(status, output, errorMessage);

  return (
    <div className="study-code-block">
      <div className="study-code-block__toolbar">
        <button
          type="button"
          className="btn btn--ghost btn--sm study-code-block__run"
          onClick={handleRun}
          disabled={isRunning}
        >
          {isRunning ? "Running..." : "Run"}
        </button>
      </div>

      <pre className="study-code">
        <code>{code}</code>
      </pre>

      {showResult ? (
        <div
          className={`study-code-result study-code-result--${result.kind}${
            isRunning ? " study-code-result--loading" : ""
          }`}
        >
          <div className="study-code-result__header">
            <span>{result.label}</span>
            <span className="study-code-result__status">{status}</span>
          </div>
          {errorLine ? (
            <div className="study-code-result__line">Line {errorLine}</div>
          ) : null}
          <pre className="study-code-result__body">
            {isRunning ? "Compiling and running this example..." : result.body}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

export default StudyCodeBlock;
