function Dashboard({ setActivePage, attempts }) {
  const totalAttempts = attempts.length;

  const successfulRuns = attempts.filter(
    (attempt) => attempt.status === "Success"
  ).length;

  const errorsFixed = attempts.filter(
    (attempt) =>
      attempt.status === "CompilationError" ||
      attempt.status === "RuntimeError"
  ).length;

  let currentFocus = "Java Basics";

  if (errorsFixed > successfulRuns) {
    currentFocus = "Debugging Practice";
  } else if (successfulRuns > 0) {
    currentFocus = "Code Execution";
  }

  return (
    <section className="page">
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Your coding journey at a glance.</p>
      </div>

      <div className="card-grid">
        <div className="card stat-card">
          <h3>Total Attempts</h3>
          <p>{totalAttempts}</p>
        </div>

        <div className="card stat-card">
          <h3>Successful Runs</h3>
          <p>{successfulRuns}</p>
        </div>

        <div className="card stat-card">
          <h3>Errors Fixed</h3>
          <p>{errorsFixed}</p>
        </div>

        <div className="card stat-card">
          <h3>Current Focus</h3>
          <p>{currentFocus}</p>
        </div>
      </div>

      <div className="card hero-card">
        <h3>Start Practicing</h3>
        <p>
          Write Java code, run it, and get beginner-friendly explanations for
          errors.
        </p>
        <button
          className="primary-btn"
          onClick={() => setActivePage("Practice")}
        >
          Go to Practice
        </button>
      </div>
    </section>
  );
}

export default Dashboard;
