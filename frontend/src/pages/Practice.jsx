import { useState } from "react";
import CodeEditor from "../components/editor/CodeEditor";
import ActionBar from "../components/editor/ActionBar";
import StatusCard from "../components/panels/StatusCard";
import OutputPanel from "../components/panels/OutputPanel";
import HintPanel from "../components/panels/HintPanel";
import { starterCode } from "../data/starterCode";
import { submitCode } from "../api/client";

function Practice({ attempts, setAttempts }) {
  const [code, setCode] = useState(starterCode);
  const [status, setStatus] = useState("Idle");
  const [output, setOutput] = useState("");
  const [hint, setHint] = useState("");

  const handleRun = async () => {
    try {
      setStatus("Running...");
      setOutput("");
      setHint("");

      const res = await submitCode({
        user_id: "demo_user",
        code: code,
      });

      console.log("Backend response:", res);

    const payload = res?.data || res || {};
    const exec = payload?.execution_result || payload?.execution || payload || {};

      const finalStatus =
        payload?.status || exec?.status || (res?.success ? "Success" : "Error");

      const finalOutput =
        payload?.output ||
        exec?.output ||
        payload?.error_message ||
        exec?.error_message ||
        payload?.stderr ||
        exec?.stderr ||
        "No output returned.";

      const finalHint = payload?.hint || exec?.hint || "";

      setStatus(finalStatus);
      setOutput(finalOutput);
      setHint(finalHint);

      // Save attempt
      const newAttempt = {
        id: Date.now(),
        code: code,
        status: finalStatus,
        output: finalOutput,
        hint: finalHint,
        timestamp: new Date().toLocaleString(),
      };

      setAttempts((prev) => [newAttempt, ...prev]);
    } catch (err) {
      console.error(err);
      setStatus("Backend connection failed");
      setOutput("Check if backend is running on port 5000");
      setHint("");
    }
  };

  const handleReset = () => {
    setCode(starterCode);
    setStatus("Idle");
    setOutput("");
    setHint("");
  };

  return (
    <section className="page">
      <div className="page-header">
        <h2>Practice Workspace</h2>
        <p>Write code, run it, and learn with AI guidance.</p>
      </div>

      <div className="practice-layout">
        <div className="card practice-editor">
          <h3>Code Editor</h3>
          <CodeEditor code={code} setCode={setCode} />
          <ActionBar onRun={handleRun} onReset={handleReset} />
        </div>

        <div className="practice-right">
          <StatusCard status={status} />
          <OutputPanel output={output} />
          <HintPanel hint={hint} />
        </div>
      </div>
    </section>
  );
}

export default Practice;
