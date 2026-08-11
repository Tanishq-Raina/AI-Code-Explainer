import axios from "axios";

// ============================================================
// Codexa AI — API client
// ============================================================
// The backend exposes endpoints under http://localhost:5000/api
// and returns an envelope of the form:
//   { success: boolean, data: {...}, error: {...} | null }
//
// The helpers below unwrap `.data.data` so callers receive the
// raw payload directly.
// ============================================================

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 45_000,
});

function unwrap(response) {
  const body = response?.data ?? {};
  if (body && typeof body === "object" && "data" in body) return body.data;
  return body;
}

// ─── Code execution ────────────────────────────────────────────
export const submitCode = async (payload) => {
  const response = await API.post("/submit-code", payload);
  return response.data;
};

export const requestHint = async (payload) => {
  const response = await API.post("/request-hint", payload);
  return unwrap(response);
};

export const parseCodeToStructuredAst = async (payload) => {
  const response = await API.post("/parse-ast", payload);
  return unwrap(response);
};

// ─── Learning analytics ────────────────────────────────────────
export const getLearningSummary = async (userId) => {
  const response = await API.get(`/learning-summary/${userId}`);
  return unwrap(response);
};

export const getStudyTopicContent = async (chapterId, section) => {
  const response = await API.get(`/study/topic/${chapterId}`, {
    params: section ? { section } : undefined,
  });
  return unwrap(response);
};

export const submitFeedback = async (payload) => {
  const response = await API.post("/feedback", payload);
  return unwrap(response);
};

// ─── Health ────────────────────────────────────────────────────
export const checkHealth = async () => {
  const response = await API.get("/health");
  return response.data;
};

export default API;
