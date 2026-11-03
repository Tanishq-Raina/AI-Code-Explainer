import { useState, useRef, useEffect, useCallback } from "react";
import CodeEditor from "../components/editor/CodeEditor";
import VideoPlayer from "../components/VideoPlayer";
import { executeCode } from "../api/client";
import { createVideoJob, watchVideoJob } from "../api/videoClient.js";
import { requestErrorMessage } from "../api/config.js";

const SAVED_JOB_KEY = "codexa.activeVideoJob";
function saveJob(id) {
  try {
    if (id) sessionStorage.setItem(SAVED_JOB_KEY, id);
    else sessionStorage.removeItem(SAVED_JOB_KEY);
  } catch { /* Tracking still works when browser storage is unavailable. */ }
}

const DEFAULT_CODE = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`;

const QUALITY_OPTIONS = [
  { value: "low", label: "Low (480p)" },
  { value: "medium", label: "Medium (720p)" },
  { value: "high", label: "High (1080p)" },
  { value: "production", label: "Production (1440p)" },
];

// Extract the main class name from Java source code.
// Priority: the top-level class containing "public static void main".
// Inner/nested classes (preceded by static, private, protected) are ignored.
function extractClassName(source) {
  // Match only top-level class declarations (start of line, not preceded by static/private/protected)
  const topLevelClasses = [...source.matchAll(/^(?:public\s+|abstract\s+)*class\s+(\w+)\s*(?:extends\s+\w+\s*)?(?:implements\s+[\w,\s]+\s*)?\{/gm)];

  if (topLevelClasses.length === 0) {
    // Fallback: any class declaration
    const anyClass = source.match(/(?:public\s+)?class\s+(\w+)/);
    return anyClass ? anyClass[1] : null;
  }

  // Single top-level class — that's our answer
  if (topLevelClasses.length === 1) {
    return topLevelClasses[0][1];
  }

  // Multiple top-level classes: find the one containing main()
  for (let i = 0; i < topLevelClasses.length; i++) {
    const startIdx = topLevelClasses[i].index;
    const endIdx = i + 1 < topLevelClasses.length ? topLevelClasses[i + 1].index : source.length;
    const region = source.slice(startIdx, endIdx);
    if (/public\s+static\s+void\s+main\s*\(\s*String/.test(region)) {
      return topLevelClasses[i][1];
    }
  }

  // No main found — prefer the public class
  const publicMatch = source.match(/public\s+class\s+(\w+)/);
  if (publicMatch) return publicMatch[1];

  // Last resort: first top-level class
  return topLevelClasses[0][1];
}

// Rename the class that contains the main method (or the public class) in the source code.
function renameMainClass(source, newName) {
  const mainClassName = extractClassName(source);
  if (!mainClassName) return source;
  // Replace the class declaration for the identified main class
  const regex = new RegExp(`((?:public\\s+)?class\\s+)${mainClassName}\\b`);
  return source.replace(regex, `$1${newName}`);
}

function VideoGeneration() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [fileName, setFileName] = useState("Main.java");
  // When true, the user has manually edited the filename — auto-detection is paused
  const [fileNameManual, setFileNameManual] = useState(false);
  const [quality, setQuality] = useState("low");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [runSuccess, setRunSuccess] = useState(false);
  const [errorLine, setErrorLine] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Video generation state
  const [jobId, setJobId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoError, setVideoError] = useState(null);

  const stopPollingRef = useRef(null);
  const submittingRef = useRef(false);
  const [submissionUncertain, setSubmissionUncertain] = useState(false);

  const pollJobStatus = useCallback((id) => {
    stopPollingRef.current?.();
    setJobId(id);
    setIsGenerating(true);
    setVideoError(null);
    stopPollingRef.current = watchVideoJob(id, {
      onProgress: (job) => {
        setProgress(Math.min(99, Math.max(0, Number(job.progress) || 0)));
        setStage(job.stage || job.status || "queued");
      },
      onComplete: (url) => {
        setIsGenerating(false);
        setProgress(100);
        setVideoUrl(url);
        saveJob(null);
      },
      onFailure: (message) => {
        setIsGenerating(false);
        setVideoError(message);
        saveJob(null);
      },
      onConnectionIssue: () => setStage("Connection interrupted. Reconnecting to your existing video job..."),
    });
  }, []);

  useEffect(() => {
    let saved;
    try { saved = sessionStorage.getItem(SAVED_JOB_KEY); } catch { /* No storage. */ }
    if (saved) pollJobStatus(saved);
    return () => stopPollingRef.current?.();
  }, [pollJobStatus]);

  const handleRun = async () => {
    try {
      setIsRunning(true);
      setOutput("");
      setErrorLine(null);
      setErrorMessage("");
      setRunSuccess(false);

      const response = await executeCode({ code });

      const payload = response?.data ?? response ?? {};
      const exec = payload?.execution ?? {};

      const status = exec?.status || payload?.status || "Error";
      const execOutput = exec?.output ?? "";
      const execError = exec?.error_message ?? exec?.stderr ?? "";

      let combinedOutput;
      if (execOutput && execError) {
        combinedOutput = execOutput + "\n\n" + execError;
      } else {
        combinedOutput = execOutput || execError || "No output returned.";
      }

      setOutput(combinedOutput);

      if (status === "Success") {
        setRunSuccess(true);
        setErrorLine(null);
        setErrorMessage("");
      } else {
        setRunSuccess(false);
        setErrorLine(exec?.line_number ?? null);
        setErrorMessage(execError || combinedOutput);
      }
    } catch (err) {
      console.error(err);
      setOutput(requestErrorMessage(err));
      setRunSuccess(false);
    } finally {
      setIsRunning(false);
    }
  };

  const handleGenerate = async () => {
    if (!runSuccess || isGenerating || submissionUncertain || submittingRef.current) return;
    submittingRef.current = true;
    try {
      setIsGenerating(true);
      setProgress(0);
      setStage("queued");
      setVideoUrl(null);
      setVideoError(null);
      const id = await createVideoJob(code, fileName, quality);
      saveJob(id);
      pollJobStatus(id);
    } catch (err) {
      setIsGenerating(false);
      if (!err?.response || err.response.status >= 500) {
        setSubmissionUncertain(true);
        setVideoError("The video request could not be confirmed. It may still be running. Check the video service before submitting again; this request will not be retried automatically.");
      } else {
        setVideoError(err?.response?.data?.error?.message || err.message || "Failed to start video generation.");
      }
    } finally {
      submittingRef.current = false;
    }
  };

  const canGenerate = runSuccess && !isRunning && !isGenerating && !submissionUncertain;

  return (
    <section className="workspace-page">
      <div className="page-header">
        <h1>
          Video <span className="gradient-text">Generation</span>
        </h1>
        <p>Write Java code and generate animated execution videos</p>
      </div>

      <div className="video-gen-layout">
        {/* Left column: Editor + Output */}
        <div className="video-gen-left">
          {/* File name tab + controls */}
          <div className="video-gen-toolbar card">
            <div className="video-gen-file-tab">
              <span className="video-gen-file-icon">📄</span>
              <input
                type="text"
                className="video-gen-filename-input"
                disabled={isRunning || isGenerating}
                value={fileName}
                onChange={(e) => {
                  const newFileName = e.target.value;
                  setFileName(newFileName);
                  setFileNameManual(true);
                  setRunSuccess(false);

                  // Rename the main class in code to match the user-specified filename
                  const baseName = newFileName.replace(/\.java$/i, "");
                  if (baseName && /^\w+$/.test(baseName)) {
                    const currentClass = extractClassName(code);
                    if (currentClass && currentClass !== baseName) {
                      setCode(renameMainClass(code, baseName));
                    }
                  }
                }}
                spellCheck={false}
              />
            </div>

            <div className="video-gen-actions">
              <button
                className="btn btn--ghost btn--sm"
                onClick={handleRun}
                disabled={isRunning || isGenerating}
              >
                {isRunning ? (
                  <>
                    <span className="spinner" /> Running...
                  </>
                ) : (
                  <>▶ Run</>
                )}
              </button>
            </div>
          </div>

          {/* Code Editor */}
          <div className="card video-gen-editor">
            <CodeEditor
              code={code}
              setCode={(val) => {
                setCode(val);
                setRunSuccess(false);

                // Auto-sync filename with the main class name in code
                // (only when the user hasn't manually overridden the filename)
                if (!fileNameManual) {
                  const className = extractClassName(val);
                  if (className) {
                    const expectedFile = `${className}.java`;
                    if (expectedFile !== fileName) {
                      setFileName(expectedFile);
                    }
                  }
                }
              }}
              errorLine={errorLine}
              errorMessage={errorMessage}
              readOnly={isRunning || isGenerating}
              editorHeight={380}
            />
          </div>

          {/* Output Panel */}
          <div className="card video-gen-output">
            <div className="video-gen-output-header">
              <span className="card-label">Output</span>
              {runSuccess && (
                <span className="video-gen-status video-gen-status--success">
                  ✓ Compiled &amp; ran successfully
                </span>
              )}
            </div>
            <pre className="video-gen-output-content">
              {output || "Run your code to see output here..."}
            </pre>
          </div>
        </div>

        {/* Right column: Video Player */}
        <div className="video-gen-right">
          {/* Quality + Generate controls */}
          <div className="card video-gen-controls">
            <div className="video-gen-quality-row">
              <label className="video-gen-quality-label">Quality</label>
              <select
                className="video-gen-quality-select"
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                disabled={isGenerating}
              >
                {QUALITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="btn btn--primary video-gen-generate-btn"
              onClick={handleGenerate}
              disabled={!canGenerate}
              title={
                !runSuccess
                  ? "Run your code successfully before generating"
                  : isGenerating
                    ? "Generation in progress..."
                    : "Generate video"
              }
            >
              {isGenerating ? (
                <>
                  <span className="spinner" /> Generating...
                </>
              ) : (
                <>🎬 Generate Video</>
              )}
            </button>

            {!runSuccess && !isGenerating && (
              <p className="video-gen-hint">
                Run your code successfully before generating a video.
              </p>
            )}
          </div>

          {/* Video Player Area */}
          <div className="card video-gen-player-card">
            {videoUrl ? (
              <div className="video-gen-player-wrapper">
                <VideoPlayer key={videoUrl} src={videoUrl} />
              </div>
            ) : isGenerating ? (
              <div className="video-gen-progress-section">
                <div className="video-gen-progress-icon">🎞️</div>
                <h3>Generating your video...</h3>
                <p>Longer programs can take several minutes. You can reload this page to reconnect.</p>
                {jobId && <p className="video-gen-hint">Job: {jobId}</p>}
                <p className="video-gen-stage">
                  Stage: <span>{stage || "queued"}</span>
                </p>
                <div className="progress video-gen-progress-bar">
                  <div
                    className="progress__fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="video-gen-progress-pct">{progress}%</span>
              </div>
            ) : videoError ? (
              <div className="video-gen-error-section">
                <div className="video-gen-error-icon">⚠️</div>
                <h3>Generation Failed</h3>
                <p className="video-gen-error-msg">{videoError}</p>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => {
                    setVideoError(null);
                    setProgress(0);
                  }}
                >
                  Dismiss
                </button>
              </div>
            ) : (
              <div className="video-gen-placeholder">
                <div className="video-gen-placeholder-icon">🎬</div>
                <h3>Video Preview</h3>
                <p>
                  Your generated animation will appear here. Write some Java
                  code, run it, then hit Generate.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default VideoGeneration;
