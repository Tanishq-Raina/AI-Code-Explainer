function ActionBar({ onRun, onReset }) {
  return (
    <div className="action-bar">
      <button className="primary-btn" onClick={onRun}>
        Run Code
      </button>

      <button className="secondary-btn" onClick={onReset}>
        Reset Code
      </button>
    </div>
  );
}

export default ActionBar;
