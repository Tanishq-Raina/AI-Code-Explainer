import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

const LOOP_BOX_COLORS = ["blue", "green", "orange", "teal", "red", "indigo"];

const LOOP_BORDER_COLORS = {
  blue: "rgba(59, 130, 246, 0.5)",
  green: "rgba(34, 197, 94, 0.5)",
  orange: "rgba(249, 115, 22, 0.5)",
  teal: "rgba(20, 184, 166, 0.5)",
  red: "rgba(239, 68, 68, 0.5)",
  indigo: "rgba(99, 102, 241, 0.5)",
};

function getLoopBoxes(steps = []) {
  return steps.filter((step) => step.event === "show_loop_box");
}

function getActiveLoopIds(activeEvent, activeLoops = []) {
  if (Array.isArray(activeLoops) && activeLoops.length) {
    return activeLoops.map((loop) => loop.stepId);
  }

  if (!activeEvent) return [];

  if (activeEvent.event === "show_loop_box" || activeEvent.event === "enter_loop") {
    return [activeEvent.stepId];
  }

  return [];
}

function getLoopAccent(depth) {
  return LOOP_BOX_COLORS[(Math.max(depth, 1) - 1) % LOOP_BOX_COLORS.length];
}

function AnimatedLoopBoxes({ complexity, activeEvent, activeLoops }) {
  const [hoveredLoopId, setHoveredLoopId] = useState(null);
  const loopBoxes = getLoopBoxes(complexity?.steps || []);
  const activeIds = getActiveLoopIds(activeEvent, activeLoops);
  const activeDepth = activeEvent?.depth || 0;
  const explanationByStepId = useMemo(
    () =>
      new Map(
        loopBoxes.map((box) => [
          box.stepId,
          box.description || `This runs ${box.iterations || "n"} times.`,
        ]),
      ),
    [loopBoxes],
  );

  if (!loopBoxes.length) {
    return (
      <section className="rounded-xl border border-slate-700/70 bg-slate-900/80 p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-sky-300">
          Loop Visualization
        </h3>
        <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/70 p-4 text-sm text-slate-400">
          Run a simulation to view animated loop boxes.
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-700/70 bg-slate-900/80 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-sky-300">
          Loop Visualization
        </h3>
        <span className="rounded-md bg-sky-500/20 px-2 py-1 text-xs font-semibold text-sky-200">
          Animated boxes
        </span>
      </div>

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {loopBoxes.map((box) => {
            const isActive =
              activeIds.includes(box.stepId) ||
              (activeEvent?.event === "calculate_loop_cost" && activeEvent.depth === box.depth);
            const indentation = Math.max(0, (box.depth - 1) * 16);
            const label = box.label || `${box.iterations || "n"} times`;
            const accent = getLoopAccent(box.depth);
            const borderColor = isActive
              ? LOOP_BORDER_COLORS[accent] || "rgba(96, 165, 250, 0.5)"
              : "rgba(148, 163, 184, 0.14)";

            return (
              <motion.div
                key={box.stepId}
                layout
                initial={{ opacity: 0, scale: 0.94, height: 0 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  height: "auto",
                  x: indentation,
                }}
                exit={{ opacity: 0, scale: 0.96, height: 0 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <motion.div
                  onHoverStart={() => setHoveredLoopId(box.stepId)}
                  onHoverEnd={() => setHoveredLoopId(null)}
                  whileHover={{ scale: 1.012 }}
                  animate={
                    isActive
                      ? {
                          boxShadow:
                            box.depth <= activeDepth
                              ? "0 0 0 1px rgba(56, 189, 248, 0.62), 0 0 40px rgba(56, 189, 248, 0.34), inset 0 0 30px rgba(56, 189, 248, 0.06)"
                              : "0 0 0 1px rgba(56, 189, 248, 0.32), 0 0 26px rgba(56, 189, 248, 0.16)",
                          y: [0, -2, 0],
                          filter: ["brightness(1)", "brightness(1.06)", "brightness(1)"],
                        }
                      : {
                          boxShadow: "0 0 0 1px rgba(148, 163, 184, 0.14)",
                          y: 0,
                          filter: "brightness(1)",
                        }
                  }
                  transition={
                    isActive
                      ? { duration: 1.25, repeat: Infinity, ease: "easeInOut" }
                      : { duration: 0.28, ease: "easeInOut" }
                  }
                  className="rounded-2xl border bg-slate-950/80 p-4"
                  style={{ marginLeft: `${indentation}px`, borderColor }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-100">
                        {box.title || "Loop"}
                      </div>
                      <div className="text-xs text-slate-400">
                        line {box.lineNumber ?? "-"}
                      </div>
                    </div>

                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-sky-200">
                      {label}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                    <span className="rounded bg-slate-800 px-2 py-1">{box.loopType}</span>
                    {box.animation?.type && (
                      <span className="rounded bg-slate-800 px-2 py-1 text-fuchsia-300">
                        {box.animation.type}
                      </span>
                    )}
                  </div>

                  {box.description && (
                    <p className="mt-3 text-sm text-slate-300">{box.description}</p>
                  )}

                  <AnimatePresence>
                    {hoveredLoopId === box.stepId && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        className="pointer-events-none mt-3 rounded-xl border border-cyan-400/30 bg-slate-900/95 p-3 text-xs text-cyan-100 shadow-[0_8px_24px_rgba(14,116,144,0.28)]"
                      >
                        <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-cyan-300/80">
                          Loop Hint
                        </div>
                        {explanationByStepId.get(box.stepId)}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}

export default AnimatedLoopBoxes;
