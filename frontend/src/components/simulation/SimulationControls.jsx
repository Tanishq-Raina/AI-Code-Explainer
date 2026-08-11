function SimulationControls({
  onRun,
  onPrev,
  onNext,
  canPrev,
  canNext,
  stepLabel,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-700/70 bg-slate-900/70 p-3">
      <button
        className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400"
        onClick={onRun}
      >
        Run Simulation
      </button>

      <button
        className="rounded-md border border-slate-600 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        onClick={onPrev}
        disabled={!canPrev}
      >
        Step Backward
      </button>

      <button
        className="rounded-md border border-slate-600 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        onClick={onNext}
        disabled={!canNext}
      >
        Step Forward
      </button>

      <div className="ml-auto rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
        {stepLabel}
      </div>
    </div>
  );
}

export default SimulationControls;
