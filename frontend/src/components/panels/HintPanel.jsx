import { useState, useEffect } from "react";

const MAX_HINT_LEVEL = 3;

function HintPanel({ hints, status, onClose, onHintLevelChange }) {
  const [hintLevel, setHintLevel] = useState(1);

  // Reset hint level when new hints arrive
  useEffect(() => {
    setHintLevel(1);
  }, [hints]);

  // Notify the parent every time the visible hint level changes so
  // Practice can track the highest level the user has actually seen
  // — that number feeds the hint-weighted success rate.
  useEffect(() => {
    if (hints && onHintLevelChange) {
      onHintLevelChange(hintLevel);
    }
  }, [hintLevel, hints, onHintLevelChange]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const visibleHints = [];
  if (hints) {
    for (let i = 1; i <= hintLevel; i++) {
      const key = `hint_${i}`;
      if (hints[key]) {
        visibleHints.push({ level: i, text: hints[key] });
      }
    }
  }

  const canEscalate = hints && hintLevel < MAX_HINT_LEVEL && hints[`hint_${hintLevel + 1}`];

  return (
    <div className="hint-modal-overlay" onClick={onClose}>
      <div className="hint-modal" onClick={(e) => e.stopPropagation()}>
        <div className="hint-modal-header">
          <h3>AI Hint</h3>
          <div className="hint-modal-header-right">
            {hints && <span className="hint-level-badge">Level {hintLevel} / {MAX_HINT_LEVEL}</span>}
            <button className="hint-modal-close" onClick={onClose}>&times;</button>
          </div>
        </div>

        {!hints ? (
          <div className="hint-box">No hints available. Run your code first.</div>
        ) : (
          <div className="hint-modal-body">
            {hints.problem_summary && (
              <div className="hint-section hint-summary">
                <strong>Problem:</strong> {hints.problem_summary}
              </div>
            )}

            {hints.why && (
              <div className="hint-section hint-why">
                <strong>Why it happens:</strong> {hints.why}
              </div>
            )}

            <div className="hint-box">
              {visibleHints.map(({ level, text }) => (
                <div key={level} className={`hint-item hint-level-${level}`}>
                  <span className="hint-label">Hint {level}:</span> {text}
                </div>
              ))}
            </div>

            {hints.learning_tip && (
              <div className="hint-section hint-tip">
                <strong>Learning tip:</strong> {hints.learning_tip}
              </div>
            )}

            {canEscalate && (
              <button
                className="toolbar-btn hint-next-btn"
                onClick={() => setHintLevel((prev) => Math.min(prev + 1, MAX_HINT_LEVEL))}
              >
                Need more help? Show Hint {hintLevel + 1}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default HintPanel;
