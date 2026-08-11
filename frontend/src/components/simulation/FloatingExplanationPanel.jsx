import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { buildComplexityBuilderSteps } from "../../simulator/complexityBuilder";

function formatExpression(expression = "") {
  return expression
    .replace(/\s*\^\s*(\d+)/g, (_, power) => `^${power}`)
    .split(/(\^\d+|×|\*)/g)
    .filter(Boolean);
}

function MathExpression({ expression, emphasizeMultiply = false }) {
  const tokens = formatExpression(expression);

  return (
    <span className="inline-flex flex-wrap items-center justify-center gap-0.5">
      {tokens.map((token, index) => {
        if (token === "×" || token === "*") {
          return (
            <motion.span
              key={`${token}-${index}`}
              animate={emphasizeMultiply ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={emphasizeMultiply ? { duration: 1.2, repeat: Infinity } : { duration: 0.2 }}
              className="mx-1 inline-flex min-w-7 items-center justify-center rounded-full bg-amber-500/15 px-2 py-1 text-amber-300 shadow-[0_0_0_1px_rgba(245,158,11,0.15)]"
            >
              ×
            </motion.span>
          );
        }

        const exponentMatch = token.match(/^\^(\d+)$/);
        if (exponentMatch) {
          return (
            <sup key={`${token}-${index}`} className="-translate-y-1 text-[0.68em] leading-none">
              {exponentMatch[1]}
            </sup>
          );
        }

        return (
          <span key={`${token}-${index}`} className="whitespace-pre">
            {token}
          </span>
        );
      })}
    </span>
  );
}

function useTypedText(text, triggerKey) {
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    let timerId = null;
    let index = 0;
    setDisplayText("");

    if (!text) return undefined;

    const animate = () => {
      index += 1;
      setDisplayText(text.slice(0, index));
      if (index < text.length) {
        timerId = window.setTimeout(animate, index < 18 ? 22 : 16);
      }
    };

    timerId = window.setTimeout(animate, 80);

    return () => {
      if (timerId) window.clearTimeout(timerId);
    };
  }, [text, triggerKey]);

  return displayText;
}

function getLoopMessage(activeEvent) {
  if (!activeEvent) return "Run the simulation to see the explanation update here.";

  if (activeEvent.event === "enter_loop") {
    if (activeEvent.depth === 1) return "This loop runs n times.";
    if (activeEvent.depth === 2) return "This runs n times for each outer iteration.";
    return "Each nested loop multiplies the total work again.";
  }

  if (activeEvent.event === "show_loop_box") {
    return "This box represents one full sweep of the loop body.";
  }

  if (activeEvent.event === "calculate_loop_cost") {
    return "Now we multiply the work inside the loop by the number of iterations.";
  }

  if (activeEvent.event === "calculate_condition_cost") {
    return "For a branch, we keep the more expensive path.";
  }

  if (activeEvent.event === "show_calculation") {
    return "Now we combine everything into one final Big-O answer.";
  }

  return activeEvent.description || "The simulator is stepping through the next operation.";
}

function buildEquationStages(activeEvent, finalComplexity, builderSteps) {
  const sourceSteps = Array.isArray(builderSteps) && builderSteps.length
    ? builderSteps
    : buildComplexityBuilderSteps({ activeEvent, finalComplexity });

  return sourceSteps.map((step, index) => ({
    ...step,
    label:
      step.action === "show"
        ? index === 0
          ? "Show the term"
          : "Seed the expression"
        : step.action === "multiply"
          ? "Multiply blocks"
          : step.action === "merge"
            ? "Merge terms"
            : step.action === "simplify"
              ? "Simplify"
              : "Final Big-O",
  }));
}

function FloatingExplanationPanel({ activeEvent, finalComplexity, builderSteps }) {
  const message = useMemo(() => getLoopMessage(activeEvent), [activeEvent]);
  const stages = useMemo(
    () => buildEquationStages(activeEvent, finalComplexity, builderSteps),
    [activeEvent, finalComplexity, builderSteps],
  );
  const typedMessage = useTypedText(message, activeEvent?.stepId || "idle");
  const [visibleStages, setVisibleStages] = useState(0);

  useEffect(() => {
    setVisibleStages(0);
    if (!stages.length) return undefined;

    const timers = stages.map((_, index) =>
      window.setTimeout(() => {
        setVisibleStages(index + 1);
      }, 360 + index * 460),
    );

    return () => timers.forEach((timerId) => window.clearTimeout(timerId));
  }, [activeEvent?.stepId, stages.length]);

  const title = activeEvent?.title || "Explanation";
  const eventLabel = activeEvent?.event?.replaceAll("_", " ") || "idle";

  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeInOut" }}
      className="rounded-2xl border border-cyan-400/20 bg-slate-950/85 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl xl:sticky xl:top-4"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(8,15,29,0.98), rgba(15,23,42,0.92)), radial-gradient(circle at top right, rgba(34,211,238,0.16), transparent 40%)",
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/70">Live explanation</p>
          <h3 className="mt-1 text-base font-semibold text-slate-50">{title}</h3>
        </div>
        <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
          {eventLabel}
        </span>
      </div>

      <div className="rounded-2xl border border-slate-700/80 bg-slate-900/80 p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.8)]" />
          Step by step
        </div>
        <p className="min-h-12 text-sm leading-6 text-slate-100">{typedMessage}</p>
      </div>

      <AnimatePresence mode="wait">
        {stages.length > 0 ? (
          <motion.div
            key={activeEvent?.stepId || "equation"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="mt-4 rounded-2xl border border-amber-500/20 bg-slate-900/80 p-4"
          >
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/80">
              Equation building
            </div>
            <div className="flex flex-col gap-2">
              {stages.map((stage, index) => {
                const isVisible = index < visibleStages;
                const isFinal = index === stages.length - 1;
                return (
                  <div key={`${stage.label}-${index}`}>
                    {index > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.24, ease: "easeInOut" }}
                          className="flex justify-center py-1 text-lg font-bold text-amber-200/80"
                      >
                        →
                      </motion.div>
                    )}

                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={
                        isVisible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0.25, y: 4, scale: 0.985 }
                      }
                      transition={{ duration: 0.28, ease: "easeInOut" }}
                      className={`rounded-xl border px-3 py-3 ${
                        isVisible
                          ? "border-amber-400/30 bg-amber-500/10"
                          : "border-slate-700 bg-slate-950/50"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                        <span>{stage.label}</span>
                        <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] text-slate-300">
                          {stage.action}
                        </span>
                      </div>
                      <div className="flex items-center justify-center text-center text-lg font-semibold text-slate-50">
                        <motion.div
                          animate={stage.action === "multiply" ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                          transition={stage.action === "multiply" ? { duration: 1.15, repeat: Infinity } : { duration: 0.2 }}
                        >
                          <MathExpression
                            expression={String(stage.result || stage.values?.join(" × ") || "")}
                            emphasizeMultiply={stage.action === "multiply" && isVisible}
                          />
                        </motion.div>
                      </div>
                      {Array.isArray(stage.values) && stage.values.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300">
                          {stage.values.map((value, valueIndex) => (
                            <span
                              key={`${value}-${valueIndex}`}
                              className="rounded-full border border-slate-700 bg-slate-950/70 px-2 py-1"
                            >
                              {value}
                            </span>
                          ))}
                        </div>
                      )}
                      {isFinal && isVisible && (
                        <div className="mt-2 text-center text-xs text-cyan-200/80">
                          Final complexity summary
                        </div>
                      )}
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="equation-idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-4 text-sm text-slate-400"
          >
            The equation preview will appear when the simulator reaches a cost calculation.
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

export default FloatingExplanationPanel;
