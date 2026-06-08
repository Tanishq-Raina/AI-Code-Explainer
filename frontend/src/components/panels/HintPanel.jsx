import { useState, useEffect } from "react";
import { submitFeedback } from "../../api/client";

const MAX_HINT_LEVEL = 3;

function HintPanel({ hints, status, submissionId, onClose, onHintLevelChange }) {
  const [hintLevel, setHintLevel] = useState(1);
  // Local feedback state — mirrors the backend `user_feedback` field.
  // Values: "not_given" | "correct" | "incorrect"
  const [feedback, setFeedback] = useState("not_given");
  const [feedbackBusy, setFeedbackBusy] = useState(false);

  // Reset hint level + feedback when new hints arrive (new submission)
  useEffect(() => {
    setHintLevel(1);
    setFeedback("not_given");
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

  // Send the rating to /api/feedback. Clicking the same button again
  // toggles back to "not_given" (un-rates), so the UI matches the
  // three valid states the backend persists.
  const sendFeedback = async (rating) => {
    if (!submissionId || feedbackBusy) return;

    const nextFeedback = feedback === rating ? "not_given" : rating;
    const previousFeedback = feedback;

    // Optimistic update — flip the icon immediately so the click feels snappy.
    setFeedback(nextFeedback);
    setFeedbackBusy(true);

    try {
      await submitFeedback({
        submission_id: submissionId,
        user_feedback: nextFeedback,
        // Keep the existing hallucination_flag — feedback only updates the
        // user-facing rating, not the automated detection signal.
        hallucination_flag: false,
      });
    } catch (err) {
      console.error("Failed to record feedback:", err);
      // Roll back on failure so the UI doesn't lie about saved state.
      setFeedback(previousFeedback);
    } finally {
      setFeedbackBusy(false);
    }
  };

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
  const canRate = Boolean(hints && submissionId);

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

            {canRate && (
              <div className="hint-feedback">
                <span className="hint-feedback__label">Was this hint helpful?</span>
                <div className="hint-feedback__buttons">
                  <button
                    type="button"
                    className={`hint-feedback__btn ${feedback === "correct" ? "is-active hint-feedback__btn--up" : ""}`}
                    onClick={() => sendFeedback("correct")}
                    disabled={feedbackBusy}
                    aria-label="Helpful"
                    title="Helpful"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill={feedback === "correct" ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3z" />
                      <path d="M7 10l5-7a2 2 0 0 1 2 2v4h5a2 2 0 0 1 2 2l-2 7a2 2 0 0 1-2 2H7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={`hint-feedback__btn ${feedback === "incorrect" ? "is-active hint-feedback__btn--down" : ""}`}
                    onClick={() => sendFeedback("incorrect")}
                    disabled={feedbackBusy}
                    aria-label="Not helpful"
                    title="Not helpful"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill={feedback === "incorrect" ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17 14V3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-3z" />
                      <path d="M17 14l-5 7a2 2 0 0 1-2-2v-4H5a2 2 0 0 1-2-2l2-7a2 2 0 0 1 2-2h10" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default HintPanel;
