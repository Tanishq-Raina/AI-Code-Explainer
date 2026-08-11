import { useMemo, useState } from "react";

function StudyQuiz({ quiz }) {
  const [isOpen, setIsOpen] = useState(false);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const totalQuestions = quiz.length;

  const score = useMemo(() => {
    if (!submitted) return 0;
    return quiz.reduce(
      (total, question, index) =>
        answers[index] === question.correctIndex ? total + 1 : total,
      0
    );
  }, [answers, quiz, submitted]);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === totalQuestions;

  const handleSelect = (questionIndex, optionIndex) => {
    if (submitted) return;
    setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }));
  };

  const handleSubmit = () => {
    if (!allAnswered) return;
    setSubmitted(true);
  };

  const handleRetake = () => {
    setAnswers({});
    setSubmitted(false);
  };

  if (!quiz?.length) return null;

  return (
    <div className="card study-quiz-card">
      <div className="study-quiz-card__header">
        <div>
          <span className="card-label">Concept Check</span>
          <h3>Test your understanding</h3>
          <p>Answer {totalQuestions} application-based MCQs for this concept.</p>
        </div>

        <button
          type="button"
          className="btn btn--primary"
          onClick={() => setIsOpen((value) => !value)}
        >
          Take Test
        </button>
      </div>

      {isOpen ? (
        <div className="study-quiz">
          <div className="study-quiz__meta">
            <span>{answeredCount}/{totalQuestions} answered</span>
            {submitted ? <span>Score: {score}/{totalQuestions}</span> : null}
          </div>

          <div className="study-quiz__questions">
            {quiz.map((item, questionIndex) => {
              const selected = answers[questionIndex];
              const isCorrect = selected === item.correctIndex;

              return (
                <div key={item.question} className="study-quiz__question">
                  <div className="study-quiz__question-title">
                    <span>{questionIndex + 1}</span>
                    <h4>{item.question}</h4>
                  </div>

                  <div className="study-quiz__options">
                    {item.options.map((option, optionIndex) => {
                      const isSelected = selected === optionIndex;
                      const isAnswer = item.correctIndex === optionIndex;
                      const resultClass = submitted
                        ? isAnswer
                          ? "correct"
                          : isSelected
                            ? "incorrect"
                            : ""
                        : "";

                      return (
                        <button
                          key={option}
                          type="button"
                          className={`study-quiz__option ${isSelected ? "selected" : ""} ${resultClass}`}
                          onClick={() => handleSelect(questionIndex, optionIndex)}
                          disabled={submitted}
                        >
                          <span className="study-quiz__option-letter">
                            {String.fromCharCode(65 + optionIndex)}
                          </span>
                          <span>{option}</span>
                        </button>
                      );
                    })}
                  </div>

                  {submitted ? (
                    <div
                      className={`study-quiz__feedback ${
                        isCorrect ? "study-quiz__feedback--correct" : "study-quiz__feedback--incorrect"
                      }`}
                    >
                      {isCorrect
                        ? "Correct answer."
                        : `Incorrect. Correct option: ${item.options[item.correctIndex]}`}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="study-quiz__actions">
            {submitted ? (
              <button type="button" className="btn btn--ghost" onClick={handleRetake}>
                Retake Test
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleSubmit}
                disabled={!allAnswered}
              >
                Check Answers
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default StudyQuiz;
