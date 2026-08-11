import { buildTimeComplexityTimeline } from "./timeComplexityVisualizer";

function linePrefix(lineNumber) {
  return lineNumber ? `Line ${lineNumber}: ` : "";
}

function statementDetailByType(statementType) {
  switch (statementType) {
    case "VariableDeclaration":
      return "A variable is created here. Creating a single variable is a constant-time action, so this contributes O(1).";
    case "Assignment":
      return "A value is assigned to a variable. A single assignment is constant time, so this contributes O(1).";
    case "ExpressionStatement":
      return "A direct expression runs once at this point. If it has no loop around it, its local cost is O(1).";
    case "UpdateExpression":
      return "A counter/value update (like i++ or i--) happens once per visit. Each update itself is O(1).";
    case "ReturnStatement":
      return "The function returns a value and exits this frame. Returning once is a constant-time step, O(1).";
    default:
      return "This is a single basic statement. On its own, it contributes constant work, O(1).";
  }
}

function getTimeLineExplanation({ lineNumber, event }) {
  const prefix = linePrefix(lineNumber);
  if (event?.bubble) return `${prefix}${event.bubble}`;

  if (event?.event === "show_calculation") {
    const formula = event?.formula ? `Using ${event.formula}, ` : "";
    return `${formula}the dominant growth term is ${event?.result || "1"}, so final time complexity is O(${event?.result || "1"}).`;
  }

  if (event?.event === "enter_function") {
    return `${prefix}Control moves into this function. We now analyze the cost of all lines inside it before returning to the caller.`;
  }

  if (event?.event === "return_function") {
    return `${prefix}This function has finished. Control returns to the caller, and execution continues from the next statement there.`;
  }

  if (event?.event === "recursive_call") {
    return `${prefix}A recursive call is detected. Repeated recursive levels can increase total time depending on recursion depth and work per call.`;
  }

  if (event?.event === "enter_loop") {
    const iterations = event?.iterations || "n";
    return `${prefix}A loop begins here. The loop control is checked repeatedly, and the body runs about ${iterations} times. The total loop cost depends on: iterations × body cost.`;
  }

  if (event?.event === "calculate_loop_cost") {
    const formula = event?.formula ? `Formula: ${event.formula}. ` : "";
    const result = event?.result ? `This simplifies to ${event.result}.` : "";
    return `${prefix}${formula}${result}This shows how repeated body work accumulates inside the loop.`;
  }

  if (event?.event === "enter_condition") {
    return `${prefix}A condition is evaluated. In complexity analysis, we usually track the heavier branch (worst-case path).`;
  }

  if (event?.event === "calculate_condition_cost") {
    const formula = event?.formula ? `Formula: ${event.formula}. ` : "";
    const result = event?.result ? `Dominant branch cost: ${event.result}.` : "";
    return `${prefix}${formula}${result}Only one branch runs at runtime, but Big-O keeps the dominant possible branch.`;
  }

  if (event?.event === "show_statement") {
    return `${prefix}${statementDetailByType(event?.title)}`;
  }

  if (event?.description) {
    return `${prefix}${event.description}`;
  }

  if (event?.title) {
    return `${prefix}Now processing: ${event.title}. This step contributes to the final time complexity summary.`;
  }

  if (!lineNumber) return "Press Play and follow the highlighted line.";

  return `${prefix}This line performs a basic operation. If it is not repeated by a loop/recursion, its local cost is O(1).`;
}

function runTimeComplexityEngine(parsedRepresentation) {
  return buildTimeComplexityTimeline(parsedRepresentation);
}

export { runTimeComplexityEngine, getTimeLineExplanation };
