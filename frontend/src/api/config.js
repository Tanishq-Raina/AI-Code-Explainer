const env = import.meta.env ?? {};

export const TUTOR_API_URL = (env.VITE_TUTOR_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
export const VIDEO_API_URL = (env.VITE_VIDEO_API_URL || "/render-api").replace(/\/$/, "");
// Allow one local generation and the backend's one strict retry (600s each).
const configuredTimeout = Number(env.VITE_HINT_TIMEOUT_MS);
export const HINT_TIMEOUT_MS = Number.isFinite(configuredTimeout) && configuredTimeout > 0
  ? configuredTimeout : 1_260_000;

export function requestErrorMessage(error) {
  if (error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT") {
    return "Feedback took too long. The server may still be processing this attempt. Please wait before trying again.";
  }
  return error?.response?.data?.error?.message
    || error?.response?.data?.message
    || "Could not reach the tutor. Check that the tutor service is running, then try again.";
}
