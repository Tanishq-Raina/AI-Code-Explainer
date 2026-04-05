function HintPanel({ hint }) {
  return (
    <div className="card">
      <h3>AI Hint</h3>
      <div className="hint-box">
        {hint || "Beginner-friendly hints will appear here."}
      </div>
    </div>
  );
}

export default HintPanel;
