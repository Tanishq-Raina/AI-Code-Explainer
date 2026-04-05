function Progress({ attempts }) {
  const total = attempts.length;

  const successCount = attempts.filter((a) => a.status === "Success").length;

  const errorCount = attempts.filter(
    (a) => a.status === "CompilationError" || a.status === "RuntimeError"
  ).length;

  const successRate =
    total > 0 ? ((successCount / total) * 100).toFixed(1) : 0;

  const compilationErrors = attempts.filter(
    (a) => a.status === "CompilationError"
  ).length;

  const runtimeErrors = attempts.filter(
    (a) => a.status === "RuntimeError"
  ).length;

  let frequentError = "No major errors yet";

  if (compilationErrors > runtimeErrors && compilationErrors > 0) {
    frequentError = "Compilation Errors";
  } else if (runtimeErrors > compilationErrors && runtimeErrors > 0) {
    frequentError = "Runtime Errors";
  } else if (runtimeErrors > 0 || compilationErrors > 0) {
    frequentError = "Compilation and Runtime Errors equally";
  }

  let insight = "";

  if (total === 0) {
    insight = "Start practicing to see insights.";
  } else if (successRate >= 80) {
    insight =
      "Great job! You are performing very well. Try more complex problems.";
  } else if (successRate >= 50) {
    insight =
      "Good progress. Focus on fixing small errors to improve further.";
  } else {
    insight =
      "You are facing difficulties. Review basic concepts and practice more.";
  }

  return (
    <section className="page">
      <div className="page-header">
        <h2>Progress</h2>
        <p>Track your coding performance and improvement.</p>
      </div>

      {total === 0 ? (
        <div className="card">
          <h3>No data yet</h3>
          <p>Run some code to see your progress here.</p>
        </div>
      ) : (
        <div className="progress-grid">
          <div className="card progress-card">
            <h3>Total Attempts</h3>
            <p>{total}</p>
          </div>

          <div className="card progress-card">
            <h3>Successful Runs</h3>
            <p>{successCount}</p>
          </div>

          <div className="card progress-card">
            <h3>Errors</h3>
            <p>{errorCount}</p>
          </div>

          <div className="card progress-card">
            <h3>Success Rate</h3>
            <p>{successRate}%</p>
          </div>

          <div className="card progress-card">
            <h3>Frequent Error Type</h3>
            <p>{frequentError}</p>
          </div>
        </div>
      )}

      <div className="card insight-card">
        <h3>AI Insight</h3>
        <p>{insight}</p>
      </div>
    </section>
  );
}

export default Progress;
