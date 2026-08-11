function normalizeExpression(expression = "") {
  return String(expression).replace(/^O\((.*)\)$/i, "$1").trim();
}

function splitMultiplication(expression = "") {
  const normalized = normalizeExpression(expression);
  if (!normalized) return [];

  return normalized
    .split(/\s*(?:×|\*)\s*/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

function toVisualPower(expression = "") {
  const normalized = normalizeExpression(expression);
  if (!normalized) return "";
  return normalized.replace(/\^([0-9]+)/g, (_, exponent) => `²`.repeat(Number(exponent) === 2 ? 1 : 0) || `^${exponent}`);
}

function defaultLoopTerm(activeEvent) {
  if (activeEvent?.iterations) return activeEvent.iterations;
  if (activeEvent?.depth && activeEvent.depth > 1) return "n";
  return "n";
}

function buildBigOResult(result, finalComplexity) {
  if (finalComplexity) return finalComplexity;
  const normalized = normalizeExpression(result);
  return normalized ? `O(${normalized})` : "O(n)";
}

function buildMultiplyStep(values, result) {
  return {
    action: "multiply",
    values,
    result,
  };
}

function buildComplexityBuilderSteps({ activeEvent, finalComplexity }) {
  if (!activeEvent) {
    return [
      { action: "show", values: ["n"], result: "n" },
      buildMultiplyStep(["n", "n"], "n^2"),
      { action: "simplify", values: ["n^2"], result: "n^2" },
      { action: "big_o", values: ["n^2"], result: "O(n^2)" },
    ];
  }

  if (activeEvent.event === "enter_loop") {
    const term = defaultLoopTerm(activeEvent);
    return [
      { action: "show", values: [term], result: term },
      buildMultiplyStep([term, term], `${term}^2`),
      { action: "simplify", values: [`${term}^2`], result: `${term}^2` },
      { action: "big_o", values: [`${term}^2`], result: buildBigOResult(`${term}^2`, finalComplexity) },
    ];
  }

  if (activeEvent.event === "calculate_loop_cost") {
    const values = splitMultiplication(activeEvent.formula || "n × n");
    const multiplyValues = values.length >= 2 ? [values[0], values[1]] : [defaultLoopTerm(activeEvent), defaultLoopTerm(activeEvent)];
    const multiplied = activeEvent.result || `${normalizeExpression(multiplyValues[0])}^2`;

    return [
      { action: "show", values: [multiplyValues[0]], result: multiplyValues[0] },
      buildMultiplyStep(multiplyValues, multiplied),
      { action: "merge", values: [multiplied], result: multiplied },
      { action: "simplify", values: [multiplied], result: multiplied },
      { action: "big_o", values: [multiplied], result: buildBigOResult(multiplied, finalComplexity) },
    ];
  }

  if (activeEvent.event === "show_calculation") {
    const simplified = activeEvent.result || normalizeExpression(activeEvent.formula || "n^2") || "n^2";
    const root = splitMultiplication(activeEvent.formula || "")[0] || "n";

    return [
      { action: "show", values: [root], result: root },
      buildMultiplyStep([root, root], simplified),
      { action: "merge", values: [simplified], result: simplified },
      { action: "big_o", values: [simplified], result: buildBigOResult(simplified, finalComplexity) },
    ];
  }

  const fallback = normalizeExpression(activeEvent.result || activeEvent.formula || activeEvent.iterations || "n") || "n";
  return [
    { action: "show", values: [fallback], result: fallback },
    { action: "merge", values: [fallback], result: fallback },
    { action: "big_o", values: [fallback], result: buildBigOResult(fallback, finalComplexity) },
  ];
}

function getBuilderHeadlineStep(steps = []) {
  if (!steps.length) return null;
  return steps[steps.length - 1];
}

export { buildComplexityBuilderSteps, getBuilderHeadlineStep, normalizeExpression, splitMultiplication, toVisualPower };
