function History({ attempts }) {
  return (
    <section className="page">
      <div className="page-header">
        <h2>History</h2>
        <p>Review your recent coding attempts and results.</p>
      </div>

      {attempts.length === 0 ? (
        <div className="card">
          <h3>No attempts yet</h3>
          <p>Run some code in the Practice page to see your history here.</p>
        </div>
      ) : (
        <div className="history-list">
          {attempts.map((attempt) => (
            <div key={attempt.id} className="card history-card">
              <div className="history-header">
                <div>
                  <h3>{attempt.status}</h3>
                  <p className="history-time">{attempt.timestamp}</p>
                </div>
                <span
                  className={`mini-status ${
                    attempt.status === "Success"
                      ? "mini-success"
                      : attempt.status === "CompilationError" ||
                        attempt.status === "RuntimeError"
                      ? "mini-error"
                      : "mini-idle"
                  }`}
                >
                  {attempt.status}
                </span>
              </div>

              <div className="history-section">
                <h4>Code</h4>
                <pre className="history-code">{attempt.code}</pre>
              </div>

              <div className="history-section">
                <h4>Output / Error</h4>
                <div className="history-output">{attempt.output}</div>
              </div>

              <div className="history-section">
                <h4>Hint</h4>
                <div className="history-hint">
                  {attempt.hint || "No hint available."}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default History;
