import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import CodeEditor from "../components/editor/CodeEditor";
import VideoPlayer from "../components/VideoPlayer";
import API from "../api/client";

// Render API routed through Vite proxy to avoid CORS issues
const RENDER_API = axios.create({
  baseURL: "/render-api",
  timeout: 60000,
});

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
// Priority: class containing "public static void main", then any "public class", then first class.
function extractClassName(source) {
  // Find the class that contains the main method
  // Look for class declarations and check if main() is inside them
  const classBlocks = [...source.matchAll(/(?:public\s+)?class\s+(\w+)\s*\{/g)];
  if (classBlocks.length > 0) {
    // Check each class to see if it contains the main method
    for (let i = 0; i < classBlocks.length; i++) {
      const startIdx = classBlocks[i].index;
      const nextClassIdx = i + 1 < classBlocks.length ? classBlocks[i + 1].index : source.length;
      const classBody = source.slice(startIdx, nextClassIdx);
      if (/public\s+static\s+void\s+main\s*\(\s*String/.test(classBody)) {
        return classBlocks[i][1];
      }
    }
    // No class has main — fall back to the public class
    const publicMatch = source.match(/public\s+class\s+(\w+)/);
    if (publicMatch) return publicMatch[1];
    // Last resort: first class
    return classBlocks[0][1];
  }
  return null;
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

  const pollIntervalRef = useRef(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleRun = async () => {
    try {
      setIsRunning(true);
      setOutput("");
      setErrorLine(null);
      setErrorMessage("");
      setRunSuccess(false);

      const response = await API.post("/submit-code", {
        user_id: "demo_user",
        // The backend auto-detects the main class and uses it as the filename
        code: code,
        submission_type: "run",
        problem_id: "video_gen_run",
        problem_title: "Video Generation",
        problem_topic: "general",
        hints_used: 0,
      });

      const payload = response?.data ?? {};
      const exec =
        payload?.data?.execution ??
        payload?.data?.execution_result ??
        payload?.data ??
        payload?.execution ??
        payload?.execution_result ??
        {};

      const status = exec?.status || payload?.data?.status || payload?.status || "Error";
      const execOutput = exec?.output ?? payload?.data?.output ?? "";
      const execError =
        exec?.error_message ?? payload?.data?.error_message ?? exec?.stderr ?? "";

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
      setOutput("Backend connection failed. Check if backend is running on port 5000.");
      setRunSuccess(false);
    } finally {
      setIsRunning(false);
    }
  };

  const pollJobStatus = useCallback(
    (id) => {
      pollIntervalRef.current = setInterval(async () => {
        try {
          const response = await RENDER_API.get(`/jobs/${id}`);
          const job = response?.data?.data ?? response?.data ?? {};

          const jobProgress = job.progress ?? 0;
          const jobStage = job.stage ?? "";
          const jobStatus = job.status ?? "";

          setProgress(jobProgress);
          setStage(jobStage);

          if (jobStatus === "completed" || jobStage === "completed") {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            setIsGenerating(false);
            setProgress(100);

            setVideoUrl(`http://localhost:4000/api/jobs/${id}/video`);
          } else if (jobStatus === "failed") {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            setIsGenerating(false);
            setVideoError(
              job.error?.message || job.error || "Video generation failed."
            );
          }
        } catch (err) {
          console.error("Polling error:", err);
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
          setIsGenerating(false);
          setVideoError("Lost connection while checking progress.");
        }
      }, 1500);
    },
    []
  );

  const handleGenerate = async () => {
    if (!runSuccess) return;

    try {
      setIsGenerating(true);
      setProgress(0);
      setStage("queued");
      setVideoUrl(null);
      setVideoError(null);

      // Create a file blob from the code
      const blob = new Blob([code], { type: "text/x-java" });
      const formData = new FormData();
      formData.append("file", blob, fileName);
      formData.append("quality", quality);

      const response = await RENDER_API.post("/render", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = response?.data?.data ?? response?.data ?? {};
      const id = data.job_id || data.id;

      if (!id) {
        throw new Error("No job ID returned from server.");
      }

      setJobId(id);
      pollJobStatus(id);
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
      const errMsg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to start video generation.";
      setVideoError(errMsg);
    }
  };

  const canGenerate = runSuccess && !isGenerating;

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
                disabled={isRunning}
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
                <VideoPlayer src={videoUrl} />
              </div>
            ) : isGenerating ? (
              <div className="video-gen-progress-section">
                <div className="video-gen-progress-icon">🎞️</div>
                <h3>Generating your video...</h3>
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
