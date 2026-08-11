function buildVisualElements(item) {
  if (Array.isArray(item?.value)) {
    return item.value.map((value, index) => ({ label: String(value), key: `${item.id || item.name}-${index}` }));
  }

  if (item?.shape === "2d-array") {
    return [
      { label: "[ ]", key: `${item.name}-0` },
      { label: "[ ]", key: `${item.name}-1` },
      { label: "[ ]", key: `${item.name}-2` },
      { label: "...", key: `${item.name}-3` },
    ];
  }

  if (item?.shape === "array" || item?.size === "n") {
    return [
      { label: "[ ]", key: `${item.name || item.id}-0` },
      { label: "[ ]", key: `${item.name || item.id}-1` },
      { label: "[ ]", key: `${item.name || item.id}-2` },
      { label: "...", key: `${item.name || item.id}-3` },
    ];
  }

  return [];
}

function getUsageText(heap = [], complexityContribution = "1") {
  const hasTwoD = heap.some((item) => item?.shape === "2d-array" || item?.size === "n^2");
  const hasArray = heap.some(
    (item) => item?.shape === "array" || item?.size === "n" || Array.isArray(item?.value),
  );

  if (hasTwoD || complexityContribution === "n^2") return "Uses space proportional to n^2";
  if (hasArray || complexityContribution === "n") return "Uses space proportional to n";
  return "Uses constant extra space";
}

function getArrayLabel(item) {
  if (item?.shape === "2d-array" || item?.size === "n^2") return "Array of size n^2";
  if (item?.shape === "array" || item?.size === "n") return "Array of size n";
  if (Array.isArray(item?.value)) return `Array of size ${item.value.length}`;
  return "Stored value";
}

function HeapPanel({ heap, complexityContribution, activeEvent, contributionItems = [], combinedExpression = "", compact = false }) {
  const heapItems = heap || [];
  const usageText = getUsageText(heapItems, complexityContribution);
  const showContributionFlow = [
    "space_highlight_contributions",
    "space_combine_contributions",
    "space_simplify_contributions",
    "space_summary",
  ].includes(activeEvent?.event);

  if (compact) {
    return (
      <section className="rounded-2xl border border-cyan-500/30 bg-slate-950/85 p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
          Heap View
        </div>

        {heapItems.length === 0 ? (
          <div className="text-sm text-slate-400">No dynamic structures yet.</div>
        ) : (
          <div className="space-y-2">
            {heapItems.map((item, index) => (
              <div
                key={item.id || item.name || `heap-item-${index}`}
                className="rounded-lg border border-cyan-400/25 bg-slate-900/70 px-3 py-2 text-sm text-slate-200"
              >
                <div className="font-medium text-cyan-100">{item.name || item.id || "memory item"}</div>
                <div className="text-xs text-slate-400">{getArrayLabel(item)}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-emerald-500/30 bg-slate-900/80 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
          Memory View
        </h3>
        <div className="text-xs text-emerald-200">{usageText}</div>
      </div>

      <div className="space-y-3">
        {showContributionFlow && (
          <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
              Final Space Animation
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {contributionItems.map((item) => (
                <span
                  key={item.key}
                  className="rounded-full border border-cyan-300/35 bg-slate-950/70 px-2 py-1 text-cyan-100"
                >
                  {item.label}{" -> "}{item.complexity}
                </span>
              ))}
            </div>

            {(activeEvent?.event === "space_combine_contributions" ||
              activeEvent?.event === "space_simplify_contributions" ||
              activeEvent?.event === "space_summary") && (
              <div className="mt-3 rounded-md border border-cyan-300/25 bg-slate-950/70 px-3 py-2 text-sm text-slate-100">
                {combinedExpression || "O(1)"}
              </div>
            )}

            {(activeEvent?.event === "space_simplify_contributions" || activeEvent?.event === "space_summary") && (
              <div className="mt-2 text-sm font-semibold text-cyan-100">
                {activeEvent?.event === "space_summary"
                  ? activeEvent?.bubble || "Overall Space Complexity: O(1)"
                  : `Simplified: ${activeEvent?.bubble || "O(1)"}`}
              </div>
            )}
          </div>
        )}

        {heapItems.length === 0 && (
          <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-3 text-sm text-slate-400">
            No growing memory structure yet.
          </div>
        )}

        {heapItems.map((item, index) => {
          const elements = buildVisualElements(item);

          return (
          <div
            key={item.id || item.name || `heap-item-${index}`}
            className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-emerald-200">{item.name || item.id || "Memory item"}</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-emerald-200">
                {getArrayLabel(item)}
              </span>
            </div>

            {elements.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {elements.map((element) => (
                  <span
                    key={element.key}
                    className="inline-flex min-w-8 items-center justify-center rounded-md border border-emerald-300/40 bg-slate-950/80 px-2 py-1 text-xs text-slate-100"
                  >
                    {element.label}
                  </span>
                ))}
              </div>
            ) : (
              <div className="mt-2 rounded bg-slate-950/70 px-2 py-1 text-xs text-slate-300">
                Uses space proportional to 1
              </div>
            )}

            {(item?.shape === "array" || item?.size === "n" || Array.isArray(item?.value)) && (
              <p className="mt-2 text-xs text-emerald-200">Uses space proportional to n</p>
            )}
            {(item?.shape === "2d-array" || item?.size === "n^2") && (
              <p className="mt-2 text-xs text-emerald-200">Uses space proportional to n^2</p>
            )}
          </div>
        );})}
      </div>
    </section>
  );
}

export default HeapPanel;
