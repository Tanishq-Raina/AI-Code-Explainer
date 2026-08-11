// ============================================================
// Codexa AI — insight accessor
// ============================================================
// The backend generates a structured insight per learning-summary
// request (see topic_analyzer._build_insight). This module normalizes
// it into the shape the Progress banner expects so the UI never has
// to reason about missing fields.
// ============================================================

const EMPTY_INSIGHT = {
  headline:    "Write your first line of Java",
  detail:      "Run or submit any problem to unlock personalized insights.",
  focus_topic: null,
  focus_error: null,
  severity:    "none",
};

export function deriveInsight(summary) {
  const raw = summary?.insight;
  if (raw && typeof raw === "object") {
    return {
      headline:    raw.headline    ?? EMPTY_INSIGHT.headline,
      detail:      raw.detail      ?? EMPTY_INSIGHT.detail,
      focus_topic: raw.focus_topic ?? null,
      focus_error: raw.focus_error ?? null,
      severity:    raw.severity    ?? "low",
    };
  }
  return EMPTY_INSIGHT;
}
