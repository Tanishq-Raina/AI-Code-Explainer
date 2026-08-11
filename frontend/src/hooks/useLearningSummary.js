import { useCallback, useEffect, useState } from "react";
import { getLearningSummary } from "../api/client";

// ============================================================
// useLearningSummary(userId)
// ============================================================
// Fetches GET /api/learning-summary/:userId and exposes a tiny
// state machine + retry handle. Shared by Dashboard and Progress
// so both pages treat loading / error / ready the same way.
//
// Returns:
//   summary : object | null   — last successful payload
//   status  : 'loading' | 'ready' | 'error'
//   reload  : () => void      — re-trigger the fetch
//
// Stale-response guard: each fetch runs inside an effect keyed on
// a monotonic request id. Unmounting or calling reload() bumps the
// id, so in-flight responses from a previous request are dropped
// via the `cancelled` closure instead of racing setState.
// ============================================================
export function useLearningSummary(userId) {
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState("loading");
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    if (!userId) return undefined;

    let cancelled = false;
    setStatus("loading");

    getLearningSummary(userId)
      .then((data) => {
        if (cancelled) return;
        setSummary(data ?? {});
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load learning summary:", err);
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [userId, requestId]);

  const reload = useCallback(() => setRequestId((n) => n + 1), []);

  return { summary, status, reload };
}
