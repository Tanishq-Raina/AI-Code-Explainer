import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function evaluateSpace(complexityType, n) {
  if (complexityType === "n") return n;
  if (complexityType === "n^2") return n * n;
  if (complexityType === "log n") return Math.max(1, Number(Math.log2(n).toFixed(2)));
  return 1;
}

function formatLabel(complexityType) {
  if (complexityType === "n") return "Linear growth O(n)";
  if (complexityType === "n^2") return "Quadratic growth O(n^2)";
  if (complexityType === "log n") return "Log growth O(log n)";
  return "Constant growth O(1)";
}

function SpaceGrowthChart({ complexityType = "1", currentIndex = -1, totalSteps = 0, className = "" }) {
  const fullData = useMemo(() => {
    const points = [];
    for (let n = 1; n <= 10; n += 1) {
      points.push({ n, space: evaluateSpace(complexityType, n) });
    }
    return points;
  }, [complexityType]);

  const visibleCount = useMemo(() => {
    if (totalSteps <= 0 || currentIndex < 0) return 1;
    const ratio = Math.min(1, (currentIndex + 1) / Math.max(1, totalSteps));
    return Math.max(1, Math.ceil(ratio * fullData.length));
  }, [currentIndex, totalSteps, fullData.length]);

  const visibleData = fullData.slice(0, visibleCount);

  return (
    <section className={`rounded-2xl border border-cyan-500/40 bg-slate-950/90 p-3.5 ${className}`}>
      <div className="mb-2.5 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
        Space Growth
      </div>
      <div className="mb-1 text-[10px] font-medium text-slate-400">
        X-axis: input size (n), Y-axis: space used
      </div>
      <div className="mb-2 text-xs font-semibold text-slate-300">
        Current shape: {complexityType === "1" ? "Flat line (constant space)" : formatLabel(complexityType)}
      </div>
      <div className="mb-3 text-[10px] text-slate-500">
        Drawing progress: {visibleCount}/{fullData.length} points
      </div>

      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={visibleData} margin={{ top: 8, right: 10, bottom: 2, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.28)" />
            <XAxis
              dataKey="n"
              stroke="rgba(148, 163, 184, 0.85)"
              tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
              label={{ value: "Input size (n)", position: "insideBottom", offset: -2, fill: "#cbd5e1", fontSize: 10 }}
            />
            <YAxis
              stroke="rgba(148, 163, 184, 0.85)"
              tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
              label={{ value: "Space used", angle: -90, position: "insideLeft", fill: "#cbd5e1", fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                border: "1.5px solid rgba(34, 211, 238, 0.4)",
                background: "rgba(15, 23, 42, 0.96)",
                borderRadius: 10,
                color: "#e2e8f0",
              }}
              formatter={(value) => [value, "Space"]}
              labelFormatter={(value) => `n = ${value}`}
            />
            <Line
              type="monotone"
              dataKey="space"
              stroke="#06b6d4"
              strokeWidth={2.8}
              dot={{ r: 3.5, fill: "#06b6d4" }}
              activeDot={{ r: 5.5 }}
              animationDuration={520}
              animationEasing="ease-in-out"
              isAnimationActive
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default SpaceGrowthChart;
