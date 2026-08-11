import CalendarCard from "../components/CalendarCard";
import { problemsByTopic, TOPIC_ORDER, problems } from "../data/problems";
import { useLearningSummary } from "../hooks/useLearningSummary";

// ─── Tiny inline icons (1.6px stroke) ─────────────────────────
const Svg = ({ children }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

const IconPlay = () => (
  <Svg>
    <polygon points="6 4 20 12 6 20 6 4" />
  </Svg>
);
const IconArrow = () => (
  <Svg>
    <path d="M5 12h14" />
    <path d="M13 5l7 7-7 7" />
  </Svg>
);
const IconCheck = () => (
  <Svg>
    <polyline points="20 6 9 17 4 12" />
  </Svg>
);
const IconFlame = () => (
  <Svg>
    <path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 1-3s-3 2-3 6a6 6 0 0 0 12 0c0-5-6-11-6-11z" />
  </Svg>
);
const IconTarget = () => (
  <Svg>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1.5" />
  </Svg>
);
const IconLayers = () => (
  <Svg>
    <polygon points="12 3 22 8 12 13 2 8 12 3" />
    <polyline points="2 14 12 19 22 14" />
  </Svg>
);

// Progress ring primitive
function Ring({ value = 0, size = 56, stroke = 5, color = "var(--accent-cyan)" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg width={size} height={size} className="progress-ring">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="var(--bg-elevated-2)"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 600ms var(--ease-out)" }}
      />
    </svg>
  );
}

// Topic → brand color pair (for ring + accent)
const TOPIC_META = {
  "Java Basics": { color: "#22d3ee", glyph: "{ }" },
  Conditions: { color: "#a855f7", glyph: "if" },
  Loops: { color: "#f472b6", glyph: "↻" },
  Arrays: { color: "#fbbf24", glyph: "[ ]" },
};

function Dashboard({ setActivePage, setSelectedProblemId }) {
  const { summary, status, reload } = useLearningSummary("demo_user");

  const grouped = problemsByTopic();
  const dailyChallenge = problems[0];

  const openProblem = (problemId) => {
    setSelectedProblemId(problemId);
    setActivePage("Practice");
  };

  // While the summary is still loading we show an em-dash so the
  // user sees "fetching" instead of a flash of all-zeros. Once
  // ready (or errored — treat error as "show what we have, which
  // is nothing"), render real numbers.
  const ready = status === "ready";
  const show = (value) => (ready ? value : "—");

  const loggedDates   = summary?.streak?.active_dates ?? [];
  const streakCurrent = summary?.streak?.current ?? 0;
  const streakBest    = summary?.streak?.longest ?? 0;
  const totalSolved   = summary?.successful_submissions ?? 0;
  const totalSubs     = summary?.total_submissions ?? 0;
  const successPct    = Math.round((summary?.success_rate ?? 0) * 100);

  // A catalog topic is "mastered" when the user has solved every
  // problem in it. Same rule as the Progress page's tile.
  const solvedByTopic = summary?.mastered_problem_ids_by_topic ?? {};
  const topicsMastered = TOPIC_ORDER.reduce((count, topic) => {
    const catalogIds = (grouped[topic] ?? []).map((p) => p.id);
    if (catalogIds.length === 0) return count;
    const solvedIds = new Set(solvedByTopic[topic] ?? []);
    return catalogIds.every((id) => solvedIds.has(id)) ? count + 1 : count;
  }, 0);

  // Build topic stats from topic_performance so each topic card has a ring
  const topicStats = TOPIC_ORDER.map((topic) => {
    const perf = summary?.topic_performance?.find((p) => p.topic === topic);
    return {
      topic,
      count: grouped[topic]?.length ?? 0,
      accuracy: perf ? Math.round(perf.accuracy * 100) : 0,
      attempts: perf?.attempts ?? 0,
    };
  });

  return (
    <section className="page">
      {status === "error" && (
        <div className="fetch-banner fetch-banner--error">
          <div className="fetch-banner__icon">!</div>
          <div className="fetch-banner__body">
            <div className="fetch-banner__title">Couldn't load your stats</div>
            <div className="fetch-banner__text">
              The backend didn't respond. Your progress data isn't showing,
              but you can still practice below.
            </div>
          </div>
          <button className="fetch-banner__retry" onClick={reload}>
            Retry
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          HERO
          ══════════════════════════════════════════════════════ */}
      <div className="dashboard-hero">
        <div className="hero-orb hero-orb--1" />
        <div className="hero-orb hero-orb--2" />
        <div className="hero-orb hero-orb--3" />

        <div className="dashboard-hero__grid">
          <div className="dashboard-hero__copy">
            <span className="eyebrow">Welcome back, coder</span>
            <h1>
              Master <span className="gradient-text">Java</span>
              <br />
              one line at a time.
            </h1>
            <p>
              Codexa AI guides you with progressive hints, instant feedback,
              and personalized practice. Pick up where you left off — or jump
              into today&apos;s challenge.
            </p>
            <div className="dashboard-hero__cta-row">
              <button
                className="btn btn--primary btn--lg"
                onClick={() => openProblem(dailyChallenge.id)}
              >
                <IconPlay /> Start Coding
              </button>
              <button
                className="btn btn--ghost btn--lg"
                onClick={() => setActivePage("Progress")}
              >
                View Progress <IconArrow />
              </button>
            </div>
          </div>

          {/* Right: code terminal mockup */}
          <div className="hero-terminal">
            <div className="hero-terminal__chrome">
              <span className="hero-terminal__dot hero-terminal__dot--r" />
              <span className="hero-terminal__dot hero-terminal__dot--y" />
              <span className="hero-terminal__dot hero-terminal__dot--g" />
              <span className="hero-terminal__title">Main.java</span>
            </div>
            <pre className="hero-terminal__body">
              <code>
                <span className="hl-key">public class</span>{" "}
                <span className="hl-cls">Main</span> {"{"}
                {"\n"}
                {"  "}
                <span className="hl-key">public static void</span>{" "}
                <span className="hl-fn">main</span>(
                <span className="hl-type">String</span>[] args) {"{"}
                {"\n"}
                {"    "}System.out.
                <span className="hl-fn">println</span>(
                <span className="hl-str">&quot;Hello, Codexa!&quot;</span>
                );
                {"\n"}
                {"  "}
                {"}"}
                {"\n"}
                {"}"}
                <span className="hero-terminal__caret" />
              </code>
            </pre>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          QUICK STATS STRIP
          ══════════════════════════════════════════════════════ */}
      <div className="quick-stats">
        <div className="quick-stat">
          <div className="quick-stat__icon quick-stat__icon--cyan">
            <IconCheck />
          </div>
          <div className="quick-stat__text">
            <div className="quick-stat__label">Solved</div>
            <div className="quick-stat__value">
              {show(totalSolved)}
              <span className="unit">/ {show(totalSubs)}</span>
            </div>
          </div>
        </div>

        <div className="quick-stat">
          <div className="quick-stat__icon quick-stat__icon--warn">
            <IconFlame />
          </div>
          <div className="quick-stat__text">
            <div className="quick-stat__label">Current streak</div>
            <div className="quick-stat__value">
              {show(streakCurrent)}
              <span className="unit">days</span>
            </div>
          </div>
        </div>

        <div className="quick-stat">
          <div className="quick-stat__icon quick-stat__icon--success">
            <IconTarget />
          </div>
          <div className="quick-stat__text">
            <div className="quick-stat__label">Success rate</div>
            <div className="quick-stat__value">
              {show(successPct)}
              <span className="unit">%</span>
            </div>
          </div>
        </div>

        <div className="quick-stat">
          <div className="quick-stat__icon quick-stat__icon--purple">
            <IconLayers />
          </div>
          <div className="quick-stat__text">
            <div className="quick-stat__label">Topics mastered</div>
            <div className="quick-stat__value">
              {show(topicsMastered)}
              <span className="unit">/ 4</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          DAILY CHALLENGE + STREAK + CALENDAR
          ══════════════════════════════════════════════════════ */}
      <div className="dash-feature-row">
        <button
          className="feature-card feature-card--daily"
          onClick={() => openProblem(dailyChallenge.id)}
        >
          <div className="feature-card__aura" />
          <div className="feature-card__header">
            <span className="card-label">◆ Daily Challenge</span>
            <span className={`badge badge--${dailyChallenge.difficulty.toLowerCase()}`}>
              {dailyChallenge.difficulty}
            </span>
          </div>
          <h3 className="feature-card__title">{dailyChallenge.title}</h3>
          <p className="feature-card__desc">{dailyChallenge.description}</p>
          <div className="feature-card__footer">
            <span className="badge badge--cyan">{dailyChallenge.topic}</span>
            <span className="feature-card__cta">
              Solve now <IconArrow />
            </span>
          </div>
        </button>

        <div className="feature-card feature-card--streak">
          <div className="streak-big">
            <div className="streak-big__flame">
              <IconFlame />
            </div>
            <div className="streak-big__num">
              <div className="streak-big__value">{show(streakCurrent)}</div>
              <div className="streak-big__label">day streak</div>
            </div>
          </div>
          <div className="streak-best">
            Personal best · <strong>{show(streakBest)} days</strong>
          </div>
          <div className="motivation-box">
            <p>Consistency beats intensity. Code a little every day.</p>
          </div>
        </div>

        <CalendarCard
          title="Activity"
          subtitle="Coding consistency"
          loggedInDates={loggedDates}
        />
      </div>

      {/* ══════════════════════════════════════════════════════
          TOPIC OVERVIEW
          ══════════════════════════════════════════════════════ */}
      <div className="section-head">
        <div>
          <span className="eyebrow">Curriculum</span>
          <h2>Topics at a glance</h2>
        </div>
      </div>

      <div className="topic-cards">
        {topicStats.map((t) => {
          const meta = TOPIC_META[t.topic];
          return (
            <div key={t.topic} className="topic-card">
              <div className="topic-card__top">
                <div
                  className="topic-card__glyph"
                  style={{ color: meta.color, borderColor: meta.color }}
                >
                  {meta.glyph}
                </div>
                <Ring value={t.accuracy} color={meta.color} />
              </div>
              <div className="topic-card__name">{t.topic}</div>
              <div className="topic-card__meta">
                {t.count} problems · {t.attempts} attempts
              </div>
              <div className="progress topic-card__bar">
                <div
                  className="progress__fill"
                  style={{
                    width: `${t.accuracy}%`,
                    background: `linear-gradient(90deg, ${meta.color}, ${meta.color}cc)`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════
          PROBLEMS CATALOG
          ══════════════════════════════════════════════════════ */}
      <div className="section-head">
        <div>
          <span className="eyebrow">Practice</span>
          <h2>All problems</h2>
        </div>
        <div className="section-head__hint">
          Click any problem to open it in the editor
        </div>
      </div>

      {TOPIC_ORDER.map((topic) => {
        const meta = TOPIC_META[topic];
        return (
          <div key={topic} className="topic-group">
            <div className="topic-group-header">
              <h3 className="topic-group-title">
                <span
                  className="topic-group-dot"
                  style={{ background: meta.color, boxShadow: `0 0 12px ${meta.color}` }}
                />
                {topic}
              </h3>
              <span className="topic-group-count">
                {grouped[topic].length} problems
              </span>
            </div>
            <div className="question-list">
              {grouped[topic].map((problem) => (
                <button
                  key={problem.id}
                  className="question-item question-button"
                  onClick={() => openProblem(problem.id)}
                >
                  <span className="question-id">
                    {String(problem.id).padStart(2, "0")}
                  </span>
                  <span className="question-title">{problem.title}</span>
                  <span
                    className={`question-difficulty ${problem.difficulty.toLowerCase()}`}
                  >
                    {problem.difficulty}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}

export default Dashboard;
