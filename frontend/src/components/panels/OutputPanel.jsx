function getStatusChip(status) {
  if (status === "Running...") return { cls: "running", label: "Running" };
  if (status === "Success") return { cls: "success", label: "Success" };
  if (
    status === "CompilationError" ||
    status === "RuntimeError" ||
    status === "Timeout" ||
    status === "Error" ||
    status === "Backend connection failed"
  ) {
    return { cls: "error", label: status };
  }
  return { cls: "idle", label: status || "Idle" };
}

function OutputPanel({ output, status, errorLine }) {
  const isError =
    status === "CompilationError" ||
    status === "RuntimeError" ||
    status === "Timeout" ||
    status === "Error" ||
    status === "Backend connection failed";
  const isRunning = status === "Running...";
  const chip = getStatusChip(status);

  return (
    <div className="card output-panel">
      <div className="output-panel-header">
        <h3>Console</h3>
        <span className={`status-chip status-chip--${chip.cls}`}>
          <span className="status-chip__dot" />
          {chip.label}
        </span>
      </div>

      {isError && errorLine && (
        <div className="error-line-badge">
          ✕ Error at line {errorLine}
        </div>
      )}

      <div className={`output-box${isError ? " output-error" : ""}`}>
        {isRunning ? (
          <div className="output-loading">
            <span className="spinner" />
            <span>Compiling and running your code…</span>
          </div>
        ) : (
          <pre>{output || "// Your output and errors will appear here."}</pre>
        )}
      </div>
    </div>
  );
}

export default OutputPanel;
