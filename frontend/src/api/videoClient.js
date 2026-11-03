import axios from "axios";
import { VIDEO_API_URL } from "./config.js";

export const videoAPI = axios.create({ baseURL: VIDEO_API_URL, timeout: 60_000 });
const unwrap = (response) => response?.data?.data ?? response?.data ?? {};
export const videoUrlForJob = (id) => `${VIDEO_API_URL}/jobs/${encodeURIComponent(id)}/video`;

export async function createVideoJob(code, fileName, quality) {
  const form = new FormData();
  form.append("file", new Blob([code], { type: "text/x-java" }), fileName);
  form.append("quality", quality);
  // Never retry a submission automatically: its response can be lost after acceptance.
  const job = unwrap(await videoAPI.post("/render", form));
  const id = job.job_id || job.id;
  if (!id) throw new Error("The video service did not return a job ID.");
  return id;
}

// Poll sequentially so slow requests never overlap. Transient failures keep the job.
export function watchVideoJob(id, callbacks, dependencies = {}) {
  const getJob = dependencies.getJob || (async () => unwrap(await videoAPI.get(`/jobs/${encodeURIComponent(id)}`)));
  const schedule = dependencies.schedule || setTimeout;
  const cancel = dependencies.cancel || clearTimeout;
  let stopped = false;
  let timer;
  const poll = async () => {
    try {
      const job = await getJob(id);
      if (stopped) return;
      if (job.job_id && job.job_id !== id) throw new Error("The video service returned a different job.");
      callbacks.onProgress(job);
      const status = job.status || job.stage;
      if (status === "completed") {
        stopped = true;
        callbacks.onComplete(videoUrlForJob(id));
      } else if (status === "failed" || status === "cancelled") {
        stopped = true;
        callbacks.onFailure(typeof job.error === "string" ? job.error : job.error?.message || job.error_message || "Video generation failed.");
      } else {
        timer = schedule(poll, 2500);
      }
    } catch (error) {
      if (stopped) return;
      if (error?.response?.status === 404 || !error.isAxiosError) {
        stopped = true;
        callbacks.onFailure(error?.response?.status === 404
          ? "This video job is no longer available. The video service may have restarted."
          : error.message);
      } else {
        callbacks.onConnectionIssue();
        timer = schedule(poll, 10_000);
      }
    }
  };
  void poll();
  return () => { stopped = true; if (timer !== undefined) cancel(timer); };
}
