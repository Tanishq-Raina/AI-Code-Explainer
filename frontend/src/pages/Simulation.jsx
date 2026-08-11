import { useState } from "react";
import SimulationEditor from "../components/simulation/SimulationEditor";
import PlaybackController from "../components/simulation/PlaybackController";
import HeapPanel from "../components/simulation/HeapPanel";
import SpaceGrowthChart from "../components/simulation/SpaceGrowthChart";
import StackPanel from "../components/simulation/StackPanel";
import { useSimulationPlaybackController } from "../hooks/useSimulationPlaybackController";
import { runTimeComplexityEngine, getTimeLineExplanation } from "../simulator/timeEngine";
import { buildSpaceComplexityTimeline, getSpaceLineExplanation } from "../simulator/spaceEngine";
import { parseCodeToStructuredAst } from "../api/client";
import { toSimulatorProgramAst } from "../simulator/astAdapter";

const DEFAULT_SOURCE = "";

function toPlaybackStepsFromTimeline(timeline, defaultOperation = "timeline_step") {
  return (timeline?.steps || []).map((step, index) => ({
    lineNumber: step.lineNumber,
    operation: step.event || defaultOperation,
    operationCount: index + 1,
    memory: {
      stack: step.memory?.stack || [],
      heap: step.memory?.heap || [],
      usage: {
        stackBytes: 0,
        heapBytes: 0,
        totalBytes: 0,
      },
    },
  }));
}

function describeFinalTimeComplexity(finalComplexity) {
  if (!finalComplexity || finalComplexity === "-") {
    return "The final complexity is determined by the dominant operations in the executed flow.";
  }
  return `The dominant operations in this execution path determine the final result: ${finalComplexity}.`;
}

function Simulation() {
  const [code, setCode] = useState(DEFAULT_SOURCE);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("time");
  const language = "Java";

  const playback = useSimulationPlaybackController();

  const currentStep = playback.currentStep;

  const complexityState = playback.complexityState;
  const activeTimelineEvent = complexityState.currentEvent;
  const complexityTimeline = complexityState.timeline;
  const totalSteps = complexityTimeline.steps.length || playback.history.length || 0;

  const editorHighlightType = (() => {
    const eventName = activeTimelineEvent?.event || "";
    if (eventName.includes("loop")) return "loop";
    if (eventName.includes("calculation") || eventName.includes("contribution")) {
      return "contribution";
    }
    return "executing";
  })();

  const bubbleMessage =
    mode === "time"
      ? getTimeLineExplanation({ lineNumber: currentStep?.lineNumber, event: activeTimelineEvent })
      : getSpaceLineExplanation({ lineNumber: currentStep?.lineNumber, event: activeTimelineEvent });
  const bubbleShowDelayMs = playback.isPlaying
    ? Math.max(500, Math.min(800, Math.round(playback.lineToBubbleDelayMs / Math.max(0.5, playback.speed))))
    : 0;
  const bubbleAutoHideMs = playback.isPlaying
    ? Math.max(500, Math.round(playback.bubbleReadPauseMs / Math.max(0.5, playback.speed)))
    : 0;
  const isFinalSpaceStep =
    mode === "space" &&
    totalSteps > 0 &&
    Boolean(activeTimelineEvent?.event === "space_summary" || playback.currentIndex >= totalSteps - 1);
  const isFinalTimeStep =
    mode === "time" &&
    totalSteps > 0 &&
    playback.currentIndex >= 0 &&
    Boolean(activeTimelineEvent?.event === "show_calculation" || playback.currentIndex >= totalSteps - 1);
  const timeFinalComplexity =
    complexityTimeline?.finalComplexity ||
    (activeTimelineEvent?.event === "show_calculation" ? `O(${activeTimelineEvent?.result || "log n"})` : "");
  const modeHeap =
    mode === "space"
      ? activeTimelineEvent?.memory?.heap || []
      : currentStep?.memory?.heap || [];
  const modeComplexityContribution = mode === "space" ? activeTimelineEvent?.complexityContribution : "1";
  const spaceComplexityType =
    mode === "space"
      ? complexityTimeline?.metadata?.dominantTerm || modeComplexityContribution || "1"
      : "1";
  const spaceStack = mode === "space" ? activeTimelineEvent?.memory?.stack || [] : [];
  const spaceFinalComplexity = complexityTimeline?.finalComplexity || "O(1)";
  const spaceContributionItems = complexityTimeline?.metadata?.contributionItems || [];
  const spaceCombinedExpression = complexityTimeline?.metadata?.combinedExpression || "";
  const showSpaceCombinedExpression =
    Boolean(spaceCombinedExpression) &&
    spaceCombinedExpression !== spaceFinalComplexity;
  const editorLanguage = language === "Java" ? "java" : "python";

  const runSimulation = async () => {
    try {
      setError("");
      const languageMap = {
        Java: "java",
        Python: "python",
      };
      const backendLanguage = languageMap[language];
      if (!backendLanguage) {
        throw new Error(`${language} is not supported for complexity simulation yet.`);
      }

      const parsedPayload = await parseCodeToStructuredAst({
        language: backendLanguage,
        code,
      });

      const parsed = toSimulatorProgramAst(parsedPayload, backendLanguage);

      if (!parsed?.body?.length) {
        throw new Error("Unable to build simulation AST from this code. Please check syntax and try again.");
      }

      if (mode === "time") {
        const nextComplexityTimeline = runTimeComplexityEngine(parsed);
        const timePlaybackSteps = toPlaybackStepsFromTimeline(nextComplexityTimeline, "time_step");
        playback.loadSimulation(timePlaybackSteps, nextComplexityTimeline);
        return;
      }

      const nextComplexityTimeline = buildSpaceComplexityTimeline(parsed);
      const spacePlaybackSteps = toPlaybackStepsFromTimeline(nextComplexityTimeline, "space_step");
      playback.loadSimulation(spacePlaybackSteps, nextComplexityTimeline);
    } catch (err) {
      setError(err?.message || "Failed to run simulation.");
    }
  };

  return (
    <section className="w-full space-y-3 rounded-2xl border border-slate-800/70 bg-slate-950/70 p-3 text-slate-100">
      <header className="rounded-xl border border-slate-800/80 bg-slate-950/80 px-3 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-300">
            Guided Walkthrough
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-slate-700 bg-slate-900/70 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("time");
                  playback.loadSimulation([], { steps: [], finalComplexity: "-" });
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  mode === "time"
                    ? "bg-cyan-500 text-slate-950"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                Time Complexity
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("space");
                  playback.loadSimulation([], { steps: [], finalComplexity: "-" });
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  mode === "space"
                    ? "bg-cyan-500 text-slate-950"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                Space Complexity
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                playback.clearAutoPlayRequest();
                runSimulation();
              }}
              className="rounded-md bg-cyan-500 px-4 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Run
            </button>
          </div>
        </div>

      </header>

      <PlaybackController
        isPlaying={playback.isPlaying}
        onTogglePlay={() => {
          if (!playback.currentStep && !playback.history.length) {
            playback.requestAutoPlay();
            runSimulation();
            return;
          }
          playback.togglePlay();
        }}
        onStepBackward={playback.stepBackward}
        onStepForward={playback.stepForward}
        onSpeedChange={playback.setSpeed}
        onReadPauseChange={(value) => playback.setBubbleReadPauseMs(value)}
        onLeadDelayChange={(value) => playback.setLineToBubbleDelayMs(value)}
        speed={playback.speed}
        speedOptions={playback.speedOptions}
        readPauseMs={playback.bubbleReadPauseMs}
        leadDelayMs={playback.lineToBubbleDelayMs}
        soundEnabled={playback.soundEnabled}
        onToggleSound={playback.toggleSoundEnabled}
        canStepBackward={playback.canStepBackward}
        canStepForward={playback.canStepForward}
        historyLength={playback.history.length}
        currentStepNumber={Math.max(0, playback.currentIndex + 1)}
        totalSteps={Math.max(1, totalSteps)}
        currentStepLabel={
          playback.currentIndex >= 0
            ? `${mode === "time" ? "Time" : "Space"} · Step ${playback.currentIndex + 1} / ${totalSteps} · Line ${currentStep?.lineNumber || "-"}${
                mode === "time" && playback.currentIndex >= totalSteps - 1
                  ? ` · Final ${complexityTimeline?.finalComplexity || "-"}`
                  : ""
              }`
            : "Run simulation to begin"
        }
      />

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="relative">
        <SimulationEditor
          code={code}
          setCode={setCode}
          language={editorLanguage}
          currentLine={playback.activeLine}
          highlightType={editorHighlightType}
          bubbleText={bubbleMessage}
          bubbleStepKey={activeTimelineEvent?.stepId || playback.currentIndex}
          bubbleShowDelayMs={bubbleShowDelayMs}
          bubbleAutoHideMs={isFinalSpaceStep ? 0 : bubbleAutoHideMs}
          bubbleRightOffsetPx={mode === "space" ? 336 : 16}
        />

        {isFinalTimeStep ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-1/2 z-30 flex justify-center px-6">
            <div className="max-w-[460px] rounded-[22px] border border-cyan-300/22 bg-slate-900/40 px-10 py-8 text-center text-slate-100 shadow-[0_18px_50px_rgba(15,23,42,0.24)] backdrop-blur-md">
              <div className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-100/80">
                Overall Time Complexity
              </div>
              <div className="mt-4 text-6xl font-semibold tracking-tight text-cyan-200">
                {timeFinalComplexity}
              </div>
              <div className="mt-4 text-[15px] font-normal leading-7 text-slate-100/90">
                {describeFinalTimeComplexity(timeFinalComplexity)}
              </div>
            </div>
          </div>
        ) : null}

        {mode === "space" ? (
          <div className="pointer-events-none absolute right-4 top-3 z-30 w-[310px] space-y-3">
            <div className="pointer-events-auto">
              <SpaceGrowthChart
                complexityType={spaceComplexityType}
                currentIndex={playback.currentIndex}
                totalSteps={totalSteps}
              />
            </div>
            <div className="pointer-events-auto">
              <StackPanel stack={spaceStack} />
            </div>
          </div>
        ) : null}

        {mode === "space" ? (
          <div className="pointer-events-none absolute bottom-3 left-3 z-30 w-[310px]">
            <div className="pointer-events-auto">
              <HeapPanel
                heap={modeHeap}
                complexityContribution={modeComplexityContribution}
                activeEvent={activeTimelineEvent}
                contributionItems={spaceContributionItems}
                combinedExpression={spaceCombinedExpression}
                compact
              />
            </div>
          </div>
        ) : null}

        {isFinalSpaceStep ? (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-6">
            <div className="w-full max-w-[520px] rounded-2xl border border-cyan-400/35 bg-slate-950/82 px-12 py-9 text-center shadow-[0_20px_60px_rgba(8,47,73,0.42)] backdrop-blur-md">
              <div className="text-sm font-semibold uppercase tracking-[0.08em] text-cyan-200">{activeTimelineEvent?.title || "Highlight memory contributions"}</div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 text-xs">
                {spaceContributionItems.map((item) => (
                  <span
                    key={item.key}
                    className="rounded-full border border-cyan-400/40 bg-slate-900/75 px-3 py-1.5 font-medium text-cyan-200"
                  >
                    {item.label} -&gt; {item.complexity}
                  </span>
                ))}
              </div>

              {showSpaceCombinedExpression ? (
                <div className="mt-5 text-4xl font-semibold text-slate-200">{spaceCombinedExpression}</div>
              ) : null}
              <div className="mt-2 text-7xl font-bold leading-none text-cyan-300">{spaceFinalComplexity}</div>

              <div className="mt-4 text-3xl font-semibold tracking-tight text-cyan-200">
                Overall Space Complexity: {spaceFinalComplexity}
              </div>

              <div className="mt-3 text-sm font-medium text-slate-300">
                Memory growth is dominated by the largest contributing structure.
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default Simulation;
