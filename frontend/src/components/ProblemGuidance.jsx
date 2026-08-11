function ProblemGuidance({ problem }) {
  if (!problem) {
    return (
      <div className="problem-guidance">
        <h2>Problem</h2>
        <div className="empty-state">
          <div className="empty-state__icon">?</div>
          <div className="empty-state__text">No problem selected.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="problem-guidance">
      <h2>Problem · Guidance</h2>

      <div className="problem-header">
        <h3>
          {String(problem.id).padStart(2, "0")}. {problem.title}
        </h3>
        <div className="problem-meta-row">
          <span className={`badge badge--${problem.difficulty.toLowerCase()}`}>
            {problem.difficulty}
          </span>
          <span className="badge badge--cyan">{problem.topic}</span>
          {problem.topics
            .filter((t) => t !== problem.topic)
            .map((tag) => (
              <span key={tag} className="badge badge--purple">
                {tag}
              </span>
            ))}
        </div>
      </div>

      <div className="problem-section-block">
        <p>{problem.description}</p>
        {problem.note1 && <p>{problem.note1}</p>}
        {problem.note2 && <p>{problem.note2}</p>}
      </div>

      <div className="problem-section-block">
        <h4>Examples</h4>
        {problem.examples.map((example, index) => (
          <div key={index} className="example-card">
            <p>
              <strong>{example.label}</strong>
            </p>
            <p>
              <strong>Input:</strong> {example.input}
            </p>
            <p>
              <strong>Output:</strong> {example.output}
            </p>
            {example.explanation && (
              <p>
                <strong>Explanation:</strong> {example.explanation}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="problem-section-block">
        <h4>Constraints</h4>
        <ul>
          {problem.constraints.map((constraint, index) => (
            <li key={index}>{constraint}</li>
          ))}
        </ul>
      </div>

      <div className="problem-section-block">
        <h4>Beginner Tips</h4>
        <ul>
          {problem.beginnerTips.map((tip, index) => (
            <li key={index}>{tip}</li>
          ))}
        </ul>
      </div>

      <div className="problem-section-block">
        <h4>Follow-up</h4>
        <p>{problem.followUp}</p>
      </div>
    </div>
  );
}

export default ProblemGuidance;
