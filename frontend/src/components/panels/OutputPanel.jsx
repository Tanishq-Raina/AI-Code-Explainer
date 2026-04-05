function OutputPanel({ output }) {
  return (
    <div className="card">
      <h3>Output / Errors</h3>
      <div className="output-box">
        {output || "Your output and errors will appear here."}
      </div>
    </div>
  );
}

export default OutputPanel;
