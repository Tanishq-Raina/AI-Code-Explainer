function StackPanel({ stack }) {
  const frames = [...(stack || [])].reverse();
  const runningFrame = frames[0] || null;
  const isFrameObject = Boolean(runningFrame && typeof runningFrame === "object" && "variables" in runningFrame);
  const variableRows = isFrameObject
    ? Object.entries(runningFrame?.variables || {})
    : (stack || []).map((entry) => [entry?.name || "value", entry?.value]);

  return (
    <section className="rounded-2xl border border-cyan-500/40 bg-slate-950/90 p-3.5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
          Call Stack
        </h3>
        <span className="text-[9px] font-medium text-slate-500">Top to Bottom</span>
      </div>

      <div className="mb-2 text-[11px] font-medium text-slate-400">
        Think of this as a pile of function cards. The top card is running now.
      </div>

      <div className="mb-2.5 mt-2.5 flex justify-between text-[10px] font-semibold text-emerald-400">
        <span>Top: running now</span>
        <span>Bottom: started first</span>
      </div>

      {runningFrame ? (
        <div className="rounded-xl border border-cyan-400/30 bg-slate-900/80 p-3.5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-3xl font-bold leading-none text-cyan-200">{runningFrame.function || "main()"}</span>
            <span className="text-[11px] font-semibold text-slate-500">LINE {runningFrame.lineNumber || 1}</span>
          </div>

          <div className="space-y-2 text-xs">
            {variableRows.length === 0 && (
              <div className="rounded border border-slate-600 bg-slate-950/70 px-2.5 py-1.5 text-slate-500">No locals</div>
            )}

            {variableRows.map(([name, value]) => (
              <div key={name} className="flex items-center justify-between rounded border border-slate-600/80 bg-slate-950/75 px-2.5 py-1.5 text-slate-200">
                <span className="font-semibold text-cyan-300">{name}</span>
                <span className="text-slate-400">{String(value ?? "-")}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-700 bg-slate-950/75 p-3.5 text-xs font-medium text-slate-500">
          No active frames.
        </div>
      )}
    </section>
  );
}

export default StackPanel;
