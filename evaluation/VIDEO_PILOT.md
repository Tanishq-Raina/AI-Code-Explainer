# Video pilot collection

This is a three-program DEVELOPMENT pilot, not the final 24-category coverage
evaluation. It measures actual rendering behavior and preserves outputs for
later visual review. Rendering success does not establish visualization,
narration, detection or educational correctness.

The inspected Render API listens on container port 5000. A Docker mapping of
4000:5000 exposes it at http://localhost:4000 on the host. The tutor backend can
continue using host port 5000. This collector uses only the video API.

From the AI-Code-Explainer project folder, run this read-only health check:

```powershell
python evaluation/collect_video_pilot.py
```

Start the sequential pilot (up to two hours of polling per job per invocation):

```powershell
python evaluation/collect_video_pilot.py --run
```

Keep the terminal open and computer awake. Rerun the identical command to resume.
Closing the collector does not cancel jobs on the video server. Do not restart
the container while collecting: its default job store is in memory.

Outputs are in evaluation/runs/video-pilot:

- manifest.json freezes the exact plan, collector hash, endpoint and quality.
- events.jsonl preserves polling responses, errors and observations in UTC.
- Each case has an atomic JSON checkpoint, raw submission acknowledgement and MP4.
- Video hashes and sizes are saved. Decoding and visual correctness are not checked.

elapsed_wall_seconds includes queueing, service time, observation delay and any
collector downtime. It must not be reported as pure rendering or inference time.
Server created_at and updated_at are retained in the original status responses;
observed stage changes provide approximate timing, not exact internal stage times.

Record the ACTUAL running container image/digest, source version, model/provider,
generation settings, TTS backend, hardware and worker count before the final
benchmark. The video service's LLM can differ from the tutor's local model.
Use --metadata path/to/configuration.json to freeze nonsecret configuration in
the pilot manifest. Never include API keys or complete environment dumps.
Without it, the manifest explicitly records that configuration is unverified.
The health endpoint does not expose the model, so a health check cannot verify it.

Use a NEW --out directory if changing the plan, metadata, quality, endpoint or
collector code. Do not mix results across versions. Retain failures.

## Interrupted or uncertain submissions

The service lacks a client idempotency key and a job-list endpoint. A connection
failure after POST may still mean a render was queued. The collector saves intent
BEFORE submission and stops rather than sending a duplicate. Check
CASE.submission.json, server access logs or the existing UI to recover the UUID.
Then attach it explicitly, using the SAME settings:

```powershell
python evaluation/collect_video_pilot.py --run --attach addition JOB_UUID
```

If a submission acknowledgement was saved but the checkpoint was interrupted,
its job_id can be recovered from that acknowledgement. An uncertain job whose
UUID cannot be recovered requires manual reconciliation; do not delete its
checkpoint to force automatic resubmission. HTTP errors are preserved too.

Polling failures stop after five consecutive errors; rerunning resumes the known
job. A missing job stops the queue because the container may have restarted.
Completed downloads and known failed jobs are skipped. The collector never
deletes server jobs or their artifacts. A per-output-directory OS lock prevents
two copies from submitting the same queue concurrently.

## Review after collection

For each video, compare visible output with expected_stdout in the plan; inspect
state transitions, stack behavior and narration, and record errors separately.
Pilot expected outputs were verified by compiling and executing all three
programs with local JDK 25 on 2026-11-03. The video service itself was health
checked; no real render jobs were submitted during collector development.
Five fake-service checks passed (preflight, resume/download, uncertain POST and
manual recovery, configuration mismatch, and missing-job handling). These
three programs are existing development examples and must remain outside a new
held-out benchmark. Use pilot durations to size the final video queue.
