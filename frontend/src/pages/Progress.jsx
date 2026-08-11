import { useMemo } from "react";
import { useLearningSummary } from "../hooks/useLearningSummary";
import { deriveInsight } from "../utils/insight";
import { problemsByTopic, TOPIC_ORDER } from "../data/problems";

// ─── Helpers ─────────────────────────────────────────────────

// A catalog topic is "mastered" when the user has solved every
// problem in that topic at least once. The backend returns the
// set of solved problem_ids per topic; we intersect against the
// current catalog so mastery stays honest as problems are added
// or removed.
function countMasteredTopics(summary) {
  const solvedByTopic = summary?.mastered_problem_ids_by_topic ?? {};
  const grouped = problemsByTopic();
  let mastered = 0;
  for (const topic of TOPIC_ORDER) {
    const catalogIds = (grouped[topic] ?? []).map((p) => p.id);
    if (catalogIds.length === 0) continue;
    const solvedIds = new Set(solvedByTopic[topic] ?? []);
    if (catalogIds.every((id) => solvedIds.has(id))) {
      mastered += 1;
    }
  }
  return mastered;
}

// Merge backend topic_performance (only topics with attempts) with
// the canonical TOPIC_ORDER so the Progress page always shows every
// catalog topic, even for a brand-new user with zero submissions.
function buildTopicPerformance(summary) {
  const byTopic = new Map();
  for (const tp of summary?.topic_performance ?? []) {
    byTopic.set(tp.topic, tp);
  }
  return TOPIC_ORDER.map(
    (topic) =>
      byTopic.get(topic) ?? {
        topic,
        attempts: 0,
        successes: 0,
        accuracy: 0,
      }
  );
}

// Status badge styling helper for encouragement cards
function statusBadgeClass(status) {
  if (status === "strong") return "badge--easy";
  if (status === "improving") return "badge--medium";
  return "badge--hard";
}

function statusLabel(status) {
  if (status === "strong") return "Strong";
  if (status === "improving") return "Improving";
  return "Needs Work";
}

function pct(value) {
  return `${Math.round(value * 100)}%`;
}

function progressFillClass(accuracy) {
  if (accuracy >= 0.75) return "progress__fill--success";
  if (accuracy >= 0.5) return "progress__fill--warning";
  return "progress__fill--danger";
}

function formatRelativeTime(isoString) {
  if (!isoString) return "";
  const then = new Date(isoString);
  const now = Date.now();
  const diff = now - then.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString();
}

// ─── Component ───────────────────────────────────────────────
function Progress({ setActivePage, setSelectedProblemId }) {
  const { summary, status, reload } = useLearningSummary("demo_user");

  const insight = useMemo(() => deriveInsight(summary), [summary]);

  // Catalog-based mastery count: full topic = all problems solved.
  const topicsMastered = useMemo(
    () => countMasteredTopics(summary),
    [summary]
  );

  // Full catalog-topic row set, even for zero-submission users.
  const topicPerformance = useMemo(
    () => buildTopicPerformance(summary),
    [summary]
  );

  // Encouragement messages from the backend (hint-usage based)
  const encouragements = summary?.encouragements ?? [];

  const maxErrorCount = useMemo(() => {
    const breakdown = summary?.error_breakdown ?? [];
    return Math.max(...breakdown.map((e) => e.count), 1);
  }, [summary]);

  const openProblem = (problemId) => {
    if (setSelectedProblemId && setActivePage) {
      setSelectedProblemId(problemId);
      setActivePage("Practice");
    }
  };

  if (status === "loading") {
    return (
      <section className="page">
        <div className="page-header">
          <span className="eyebrow">Learning analytics</span>
          <h2>Your Progress</h2>
        </div>
        <div className="fetch-state fetch-state--loading">
          <div className="fetch-state__spinner" />
          <div className="fetch-state__title">Loading your learning analytics…</div>
          <div className="fetch-state__text">
            Pulling your latest submissions from the backend.
          </div>
        </div>
      </section>
    );
  }

  if (status === "error" || !summary) {
    return (
      <section className="page">
        <div className="page-header">
          <span className="eyebrow">Learning analytics</span>
          <h2>Your Progress</h2>
        </div>
        <div className="fetch-state fetch-state--error">
          <div className="fetch-state__icon">!</div>
          <div className="fetch-state__title">Couldn't reach the backend</div>
          <div className="fetch-state__text">
            Check that the Flask server is running on port 5000, then retry.
          </div>
          <button className="fetch-state__retry" onClick={reload}>
            Retry
          </button>
        </div>
      </section>
    );
  }

  const total_submissions      = summary.total_submissions ?? 0;
  const successful_submissions = summary.successful_submissions ?? 0;
  const success_rate           = summary.success_rate ?? 0;
  const streak                 = summary.streak ?? { current: 0, longest: 0 };
  const recent_submissions     = summary.recent_submissions ?? [];
  const error_breakdown        = summary.error_breakdown ?? [];

  return (
    <section className="page">
      <div className="page-header">
        <span className="eyebrow">Learning analytics</span>
        <h2>Your Progress</h2>
        <p>A living portrait of how you learn, where you excel, and what to tackle next.</p>
      </div>

      {/* ─── AI Insight banner ─────────────────────── */}
      <div className={`insight-banner insight-banner--${insight.severity}`}>
        <div className="insight-banner__icon">✦</div>
        <div className="insight-banner__text">
          <div className="insight-banner__label">Codexa Insight</div>
          <div className="insight-banner__headline">{insight.headline}</div>
          <p className="insight-banner__body">{insight.detail}</p>
        </div>
      </div>

      {/* ─── Stat grid ─────────────────────────────── */}
      <div className="progress-grid">
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--cyan">⚡</div>
          <div className="stat-card__label">Total submissions</div>
          <div className="stat-card__value">{total_submissions}</div>
          <div className="stat-card__hint">Across all problems</div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--success">✓</div>
          <div className="stat-card__label">Solved</div>
          <div className="stat-card__value">
            {successful_submissions}
            <span className="unit">/ {total_submissions}</span>
          </div>
          <div className="stat-card__hint stat-card__trend-up">
            {pct(success_rate)} success rate
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--warning">🔥</div>
          <div className="stat-card__label">Current streak</div>
          <div className="stat-card__value">
            {streak.current}
            <span className="unit">days</span>
          </div>
          <div className="stat-card__hint">Best · {streak.longest} days</div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--purple">◈</div>
          <div className="stat-card__label">Topics mastered</div>
          <div className="stat-card__value">
            {topicsMastered}
            <span className="unit">/ {TOPIC_ORDER.length}</span>
          </div>
        </div>
      </div>

      {/* ─── Two-column layout ─────────────────────── */}
      <div className="progress-sections">
        {/* LEFT: mastery + errors */}
        <div className="progress-section-stack">
          <div className="card">
            <div className="progress-section-title">Topic Mastery</div>
            <div className="topic-mastery-list">
              {topicPerformance.map((tp) => (
                <div key={tp.topic} className="topic-mastery-item">
                  <div className="topic-mastery-header">
                    <span className="topic-mastery-name">{tp.topic}</span>
                    <div className="topic-mastery-meta">
                      <span className="topic-mastery-value">
                        {pct(tp.accuracy)}
                      </span>
                      <span>
                        {tp.successes}/{tp.attempts}
                      </span>
                    </div>
                  </div>
                  <div className="progress">
                    <div
                      className={`progress__fill ${progressFillClass(tp.accuracy)}`}
                      style={{ width: `${Math.round(tp.accuracy * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="progress-section-title">Error Breakdown</div>
            <div className="error-breakdown">
              {error_breakdown.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state__icon">✓</div>
                  <div className="empty-state__text">
                    No errors recorded yet — nice and clean.
                  </div>
                </div>
              )}
              {error_breakdown.map((err) => (
                <div key={err.type} className="error-type-row">
                  <div className="error-type-header">
                    <span className="error-type-name">{err.type}</span>
                    <span className="error-type-count">
                      {err.count} {err.count === 1 ? "time" : "times"}
                    </span>
                  </div>
                  <div className="progress">
                    <div
                      className="progress__fill progress__fill--danger"
                      style={{
                        width: `${Math.round(
                          (err.count / maxErrorCount) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: recommendations + activity */}
        <div className="progress-section-stack">
          <div className="card">
            <div className="progress-section-title">Encouragement</div>
            <div className="recommendations-list">
              {encouragements.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__icon">◇</div>
                  <div className="empty-state__text">
                    Submit a few problems to unlock personalised encouragement
                    based on your hint usage.
                  </div>
                </div>
              ) : (
                encouragements.map((enc, idx) => (
                  <div
                    key={enc.topic}
                    className="recommendation-item"
                  >
                    <span className="recommendation-number">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="recommendation-body">
                      <div className="recommendation-title">{enc.topic}</div>
                      <div className="recommendation-reason">{enc.message}</div>
                    </div>
                    <span
                      className={`badge ${statusBadgeClass(enc.status)}`}
                    >
                      {statusLabel(enc.status)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <div className="progress-section-title">Recent Activity</div>
            {recent_submissions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state__icon">◇</div>
                <div className="empty-state__text">No activity yet.</div>
              </div>
            ) : (
              <div className="activity-feed">
                {recent_submissions.map((sub) => {
                  const success = sub.status === "Success";
                  return (
                    <div key={sub.id} className="activity-item">
                      <div
                        className={`activity-icon ${
                          success
                            ? "activity-icon--success"
                            : "activity-icon--error"
                        }`}
                      >
                        {success ? "✓" : "✕"}
                      </div>
                      <div className="activity-body">
                        <div className="activity-title">
                          {sub.problem_title}
                        </div>
                        <div className="activity-meta">
                          {sub.topic} · {formatRelativeTime(sub.timestamp)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Progress;
