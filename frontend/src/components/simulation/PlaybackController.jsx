function PlaybackController({
  isPlaying,
  onTogglePlay,
  onStepForward,
  onStepBackward,
  onSpeedChange,
  onReadPauseChange,
  onLeadDelayChange,
  speed,
  speedOptions,
  readPauseMs,
  leadDelayMs,
  soundEnabled,
  onToggleSound,
  canStepBackward,
  canStepForward,
  historyLength,
  currentStepLabel,
  currentStepNumber,
  totalSteps,
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-cyan-500/20 bg-slate-900/80 px-3 py-1.5 shadow-panel">
      <div className="flex min-w-max items-center gap-2.5">
        <div className="mr-1 rounded-md border border-slate-700 bg-slate-950/80 px-2.5 py-1.5 text-xs font-semibold text-slate-300">
          Step {currentStepNumber}/{Math.max(1, totalSteps)}
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-950/60 p-1">
          <button
            className="rounded-md border border-cyan-400/40 bg-cyan-500/15 px-4 py-2 text-sm font-semibold leading-none text-cyan-100 transition hover:bg-cyan-500/25"
            onClick={onTogglePlay}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>

          <button
            className="rounded-md border border-slate-600 px-4 py-2 text-sm font-medium leading-none text-slate-100 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={onStepBackward}
            disabled={!canStepBackward}
          >
            Step Backward
          </button>

          <button
            className="rounded-md border border-cyan-400/50 bg-cyan-500/90 px-4 py-2 text-sm font-semibold leading-none text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={onStepForward}
            disabled={!canStepForward}
          >
            Step Forward
          </button>
        </div>

        <label className="ml-1 flex items-center gap-2 text-xs font-medium text-slate-300">
          Read
          <select
            className="rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-xs text-slate-200"
            value={readPauseMs}
            onChange={(event) => onReadPauseChange(Number(event.target.value))}
          >
            <option value={500}>500 ms</option>
            <option value={700}>700 ms</option>
            <option value={900}>900 ms</option>
            <option value={1200}>1200 ms</option>
          </select>
        </label>

        <label className="ml-1 flex items-center gap-2 text-xs font-medium text-slate-300">
          Lead
          <input
            className="w-24 accent-cyan-400"
            type="range"
            min={400}
            max={1200}
            step={50}
            list="simulation-speeds"
            value={leadDelayMs}
            onChange={(event) => onLeadDelayChange(Number(event.target.value))}
          />
          <span className="w-12 text-right text-slate-100">{leadDelayMs}ms</span>
        </label>

        <label className="ml-1 flex items-center gap-2 text-xs font-medium text-slate-300">
          Speed
          <input
            className="w-20 accent-cyan-400"
            type="range"
            min={0.5}
            max={3}
            step={0.5}
            list="simulation-speeds"
            value={speed}
            onChange={(event) => onSpeedChange(Number(event.target.value))}
          />
          <span className="w-8 text-right text-slate-100">{speed}x</span>
          <datalist id="simulation-speeds">
            {speedOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </label>

        <button
          className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
            soundEnabled
              ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/20"
              : "border-slate-600 text-slate-300 hover:bg-slate-800"
          }`}
          onClick={onToggleSound}
          type="button"
        >
          Tick {soundEnabled ? "On" : "Off"}
        </button>

        <div className="ml-auto hidden flex-col items-end gap-1 xl:flex">
          <div className="rounded-md border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-300">
            {currentStepLabel}
          </div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            History: {historyLength} states
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlaybackController;
