import { useEffect, useMemo, useState } from "react";
import StudyQuiz from "../components/study/StudyQuiz";
import StudyCodeBlock from "../components/study/StudyCodeBlock";
import { problems } from "../data/problems";
import { studyQuizzes } from "../data/studyQuizzes";
import { studyTopics } from "../data/studyTopics";
import { useStudyContent } from "../hooks/useStudyContent";

const STORAGE_KEYS = {
  lastChapter: "study_last_chapter",
  visitedChapters: "study_visited_chapters",
  part1Open: "study_part1_open",
  part2Open: "study_part2_open",
};

const PRACTICE_TOPIC_MAP = {
  Introduction: "Java Basics",
  "Variables & Data Types": "Java Basics",
  Operators: "Java Basics",
  "Control Flow": "Conditions",
  "Classes & Objects": "Java Basics",
  Methods: "Java Basics",
  Inheritance: "Java Basics",
  Interfaces: "Java Basics",
  "Exception Handling": "Java Basics",
  Multithreading: "Loops",
  Enums: "Java Basics",
  "I/O": "Java Basics",
  Generics: "Arrays",
  Lambdas: "Loops",
  Modules: "Java Basics",
  "Modern Java": "Java Basics",
  Strings: "Java Basics",
  "java.lang": "Java Basics",
  Collections: "Arrays",
  Utilities: "Java Basics",
  NIO: "Java Basics",
  Networking: "Java Basics",
  Events: "Java Basics",
  AWT: "Java Basics",
  Images: "Java Basics",
  Concurrency: "Loops",
  Streams: "Arrays",
  "Regular Expressions": "Java Basics",
};

function parseStoredArray(key) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function parseStoredBoolean(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) === true;
  } catch {
    return fallback;
  }
}

function getPracticeProblem(topic) {
  const practiceTopic = PRACTICE_TOPIC_MAP[topic];
  if (!practiceTopic) return null;
  return problems.find((problem) => problem.topic === practiceTopic) || null;
}

function Study({ setActivePage }) {
  const defaultChapter = studyTopics[0]?.id ?? "ch01";
  const [activeChapterId, setActiveChapterId] = useState(() => {
    if (typeof window === "undefined") return defaultChapter;
    return window.localStorage.getItem(STORAGE_KEYS.lastChapter) || defaultChapter;
  });
  const [visitedChapters, setVisitedChapters] = useState(() => {
    if (typeof window === "undefined") return [];
    return parseStoredArray(STORAGE_KEYS.visitedChapters);
  });
  const [part1Open, setPart1Open] = useState(() => {
    if (typeof window === "undefined") return true;
    return parseStoredBoolean(STORAGE_KEYS.part1Open, true);
  });
  const [part2Open, setPart2Open] = useState(() => {
    if (typeof window === "undefined") return true;
    return parseStoredBoolean(STORAGE_KEYS.part2Open, true);
  });

  const activeChapter = useMemo(
    () => studyTopics.find((topic) => topic.id === activeChapterId) || studyTopics[0],
    [activeChapterId]
  );

  const { content, status, reload } = useStudyContent(activeChapter.id);

  useEffect(() => {
    if (!activeChapter?.id) return;

    const visitedSet = new Set(visitedChapters);
    const alreadyVisited = visitedSet.has(activeChapter.id);
    if (!alreadyVisited) {
      visitedSet.add(activeChapter.id);
      const stored = Array.from(visitedSet);
      setVisitedChapters(stored);
      window.localStorage.setItem(STORAGE_KEYS.visitedChapters, JSON.stringify(stored));
    }

    window.localStorage.setItem(STORAGE_KEYS.lastChapter, activeChapter.id);
  }, [activeChapter, visitedChapters]);

  const part1Topics = studyTopics.filter((topic) => topic.part === 1);
  const part2Topics = studyTopics.filter((topic) => topic.part === 2);

  const practiceProblem = getPracticeProblem(activeChapter.topic);
  const activeQuiz = studyQuizzes[activeChapter.id] || [];
  const activeSectionCount = content?.sections?.length || activeChapter.sections.length;
  const visitedCount = visitedChapters.length;
  const visitedPercent = Math.round((visitedCount / studyTopics.length) * 100);

  const selectedIndex = studyTopics.findIndex((topic) => topic.id === activeChapter.id);
  const previousChapter = selectedIndex > 0 ? studyTopics[selectedIndex - 1] : null;
  const nextChapter = selectedIndex < studyTopics.length - 1 ? studyTopics[selectedIndex + 1] : null;

  const togglePart = (partNumber) => {
    if (partNumber === 1) {
      const next = !part1Open;
      setPart1Open(next);
      window.localStorage.setItem(STORAGE_KEYS.part1Open, JSON.stringify(next));
      return;
    }
    const next = !part2Open;
    setPart2Open(next);
    window.localStorage.setItem(STORAGE_KEYS.part2Open, JSON.stringify(next));
  };

  const handlePracticeClick = () => {
    if (!practiceProblem) return;
    setActivePage("Simulator");
  };

  const handleChapterClick = (chapterId) => {
    setActiveChapterId(chapterId);
  };

  return (
    <section className="page study-page">
      <aside className="study-nav">
        <div className="study-nav__header">
          <span className="study-nav__kicker">Study Path</span>
          <h3>Java Chapters</h3>
          <div className="study-nav__progress">
            <div className="study-nav__progress-row">
              <span>{visitedCount}/{studyTopics.length} visited</span>
              <span>{visitedPercent}%</span>
            </div>
            <div className="progress">
              <div className="progress__fill" style={{ width: `${visitedPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="study-nav__part" onClick={() => togglePart(1)}>
          <span>Part I</span>
          <span>{part1Open ? "▾" : "▸"}</span>
        </div>
        {part1Open && (
          <div className="study-nav__list">
            {part1Topics.map((topic) => {
              const isActive = topic.id === activeChapter.id;
              return (
                <button
                  key={topic.id}
                  type="button"
                  className={`study-nav__item ${isActive ? "active" : ""}`}
                  onClick={() => handleChapterClick(topic.id)}
                >
                  <span>
                    {topic.chapter.toString().padStart(2, "0")} · {topic.shortTitle}
                  </span>
                  {visitedChapters.includes(topic.id) ? (
                    <span className="study-nav__visited">✓</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}

        <div className="study-nav__part" onClick={() => togglePart(2)}>
          <span>Part II</span>
          <span>{part2Open ? "▾" : "▸"}</span>
        </div>
        {part2Open && (
          <div className="study-nav__list">
            {part2Topics.map((topic) => {
              const isActive = topic.id === activeChapter.id;
              return (
                <button
                  key={topic.id}
                  type="button"
                  className={`study-nav__item ${isActive ? "active" : ""}`}
                  onClick={() => handleChapterClick(topic.id)}
                >
                  <span>
                    {topic.chapter.toString().padStart(2, "0")} · {topic.shortTitle}
                  </span>
                  {visitedChapters.includes(topic.id) ? (
                    <span className="study-nav__visited">✓</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </aside>

      <div className="study-content">
        <div className="study-content__header">
          <div>
            <span className="eyebrow">Java Study</span>
            <h2>{activeChapter.title}</h2>
            <p className="study-content__tagline">
              Explore structured chapter summaries, code examples, and sequential navigation.
            </p>
            <div className="study-content__meta">
              <span>Chapter {activeChapter.chapter.toString().padStart(2, "0")}</span>
              <span>{activeChapter.topic}</span>
              <span>{activeSectionCount} sections</span>
              <span>Page {activeChapter.bookPage}</span>
            </div>
          </div>

          {practiceProblem ? (
            <button className="btn btn--primary" onClick={handlePracticeClick}>
              Practice this Topic
            </button>
          ) : null}
        </div>

        {status === "loading" && (
          <div className="fetch-state fetch-state--loading">
            <div className="fetch-state__spinner" />
            <div className="fetch-state__title">Loading chapter content…</div>
            <div className="fetch-state__text">
              Retrieving the study material from the backend.
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="fetch-state fetch-state--error">
            <div className="fetch-state__title">Unable to load chapter content.</div>
            <div className="fetch-state__text">
              There was a problem fetching the study content. Please try again.
            </div>
            <button className="fetch-state__retry" onClick={reload}>
              Retry
            </button>
          </div>
        )}

        {status === "ready" && content && (
          <div key={activeChapter.id} className="study-content__body">
            {content.sections.map((section, index) => (
              <div key={section.heading} className="card study-section-card">
                <div className="study-section-card__top">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{section.heading}</h3>
                </div>
                <p>{section.content}</p>
                {section.code_example ? (
                  <StudyCodeBlock code={section.code_example} />
                ) : null}
              </div>
            ))}

            <StudyQuiz key={activeChapter.id} quiz={activeQuiz} />

            <div className="study-nav-actions">
              <button
                className="btn btn--ghost"
                onClick={() => previousChapter && setActiveChapterId(previousChapter.id)}
                disabled={!previousChapter}
              >
                ◀ Previous
              </button>
              <button
                className="btn btn--primary"
                onClick={() => nextChapter && setActiveChapterId(nextChapter.id)}
                disabled={!nextChapter}
              >
                Next ▶
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default Study;
