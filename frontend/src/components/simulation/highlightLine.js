const HIGHLIGHT_CLASS_MAP = {
  executing: "sim-line-highlight sim-line-highlight--executing",
  loop: "sim-line-highlight sim-line-highlight--loop",
  contribution: "sim-line-highlight sim-line-highlight--contribution",
};

export function resolveHighlightType(type) {
  if (type === "loop") return "loop";
  if (type === "contribution") return "contribution";
  return "executing";
}

export function highlightLine(lineNumber, type = "executing") {
  if (!lineNumber || lineNumber < 1) return null;

  const resolvedType = resolveHighlightType(type);

  return {
    lineNumber,
    type: resolvedType,
    className: HIGHLIGHT_CLASS_MAP[resolvedType],
  };
}

export function getHighlightClassName(type = "executing") {
  return HIGHLIGHT_CLASS_MAP[resolveHighlightType(type)];
}