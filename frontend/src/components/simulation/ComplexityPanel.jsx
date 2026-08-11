function toFriendlyEventLabel(eventName) {
  switch (eventName) {
    case "enter_loop":
      return "We start a loop";
    case "show_loop_box":
      return "Loop is running";
    case "calculate_loop_cost":
      return "Loop work";
    case "enter_condition":
      return "We check a condition";
    case "show_condition_box":
      return "Condition branch";
    case "calculate_condition_cost":
      return "Condition work";
    case "show_statement":
      return "Single line action";
    case "show_calculation":
      return "Final answer";
    default:
      return eventName?.replaceAll("_", " ") || "event";
  }
}

function ComplexityPanel({ complexity, activeOrder }) {
  const steps = complexity?.steps || [];

  return (
    <section className="rounded-xl border border-sky-500/30 bg-slate-900/80 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-sky-300">
          Time Complexity
        </h3>
        <span className="rounded-md bg-sky-500/20 px-2 py-1 text-xs font-semibold text-sky-200">
          {complexity?.finalComplexity || "-"}
        </span>
      </div>

      <div className="space-y-2">
        {steps.map((step) => {
          const isActive = step.stepId <= activeOrder;
          const eventLabel = toFriendlyEventLabel(step.event);

          return (
            <div
              key={step.stepId}
              className={`rounded-lg border p-3 transition ${
                isActive
                  ? "border-sky-400/50 bg-sky-500/10"
                  : "border-slate-700 bg-slate-950/70"
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-100">
                  {step.title || step.label || eventLabel}
                </span>
                <span className="text-xs text-slate-400">step {step.stepId}</span>
              </div>

              {step.description && (
                <p className="text-xs text-slate-300">{step.description}</p>
              )}

              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {step.lineNumber && (
                  <span className="rounded bg-slate-800 px-2 py-1 text-cyan-300">
                    line {step.lineNumber}
                  </span>
                )}
                {step.loopType && (
                  <span className="rounded bg-slate-800 px-2 py-1 text-emerald-300">
                    {step.loopType}
                  </span>
                )}
                {step.iterations && (
                  <span className="rounded bg-slate-800 px-2 py-1 text-emerald-300">
                    This runs {step.iterations} times
                  </span>
                )}
                {step.label && (
                  <span className="rounded bg-slate-800 px-2 py-1 text-amber-300">
                    {step.label}
                  </span>
                )}
                {step.formula && (
                  <span className="rounded bg-slate-800 px-2 py-1 text-amber-300">
                    formula: {step.formula}
                  </span>
                )}
                {step.result && (
                  <span className="rounded bg-slate-800 px-2 py-1 text-cyan-300">
                    result: {step.result}
                  </span>
                )}
                {step.animation?.type && (
                  <span className="rounded bg-slate-800 px-2 py-1 text-fuchsia-300">
                    anim: {step.animation.type}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ComplexityPanel;
