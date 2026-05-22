import { buildTimeComplexityTimeline } from "./timeComplexityVisualizer";

function linePrefix(lineNumber) {
  return lineNumber ? `Line ${lineNumber}: ` : "";
}

function statementDetailByType(statementType) {
  switch (statementType) {
    case "VariableDeclaration":
      return "A variable is created here. Creating one variable takes constant time, so this line adds O(1).";
    case "Assignment":
      return "A value is assigned to a variable. One assignment is constant time, so this line adds O(1).";
    case "ExpressionStatement":
      return "A direct expression runs once at this point. Without a surrounding loop, its cost is O(1).";
    case "UpdateExpression":
      return "A counter/value update (like i++ or i--) happens once per visit. The update itself is O(1).";
    case "ReturnStatement":
      return "The function returns a value and exits this frame. Returning once is O(1).";
    default:
      return "This is a single basic statement. On its own, it contributes constant work, O(1).";
  }
}

function formatSnippet(event) {
  return String(event?.snippet || event?.code || event?.source || "").trim();
}

function snippetPrefix(event) {
  const snippet = formatSnippet(event);
  return snippet ? `${snippet}. ` : "";
}

function getTimeLineExplanation({ lineNumber, event }) {
  const prefix = linePrefix(lineNumber);
  const repeated = (event?.occurrence || 0) > 1;
  if (event?.bubble) return `${prefix}${event.bubble}`;

  if (event?.event === "show_calculation") {
    const formula = event?.formula ? `Using ${event.formula}, ` : "";
    return `${formula}the dominant growth term is ${event?.result || "1"}, so final time complexity is O(${event?.result || "1"}).`;
  }

  if (event?.event === "enter_function") {
    return `${prefix}${snippetPrefix(event)}Control moves into this function. We now walk through its lines to account for their time cost, then return to the caller.`;
  }

  if (event?.event === "return_function") {
    return `${prefix}${snippetPrefix(event)}This function has finished. Control returns to the caller and continues with the next line after the call.`;
  }

  if (event?.event === "recursive_call") {
    return `${prefix}A recursive call is detected. Total time now depends on how many times this call repeats and how much work each call performs.`;
  }

  if (event?.event === "enter_loop") {
    const iterations = event?.iterations || "n";
    return `${prefix}A loop begins here. The body runs about ${iterations} times. Total loop cost is: iterations × body cost.`;
  }

  if (event?.event === "show_loop_box") {
    const iterations = event?.iterations || "n";
    return `${prefix}We are inside a loop that repeats about ${iterations} times. Each line inside will be multiplied by that count.`;
  }

  if (event?.event === "calculate_loop_cost") {
    const formula = event?.formula ? `Formula: ${event.formula}. ` : "";
    const result = event?.result ? `This simplifies to ${event.result}.` : "";
    return `${prefix}${formula}${result}This shows how repeated body work accumulates inside the loop.`;
  }

  if (event?.event === "enter_condition") {
    return `${prefix}A condition is evaluated. For Big-O, we track the branch that can take the most time (worst case).`;
  }

  if (event?.event === "show_condition_box") {
    return `${prefix}A branch decision happens here. Only one branch runs at runtime, but we compare them for the worst case.`;
  }

  if (event?.event === "calculate_condition_cost") {
    const formula = event?.formula ? `Formula: ${event.formula}. ` : "";
    const result = event?.result ? `Dominant branch cost: ${event.result}.` : "";
    return `${prefix}${formula}${result}Only one branch runs at runtime, but Big-O keeps the dominant possible branch.`;
  }

  if (event?.event === "show_statement") {
    if (repeated) {
      return `${prefix}This same line runs again inside the loop, so we count the repeated work only once in the explanation.`;
    }
    if (event?.description) {
      return `${prefix}${event.description}`;
    }
    return `${prefix}${statementDetailByType(event?.title)}`;
  }

  if (event?.description) {
    return `${prefix}${event.description}`;
  }

  if (event?.title) {
    return `${prefix}${snippetPrefix(event)}${event.title}. This step contributes to the overall time complexity.`;
  }

  if (!lineNumber) {
    return "We are summarizing the total time cost for the whole execution path.";
  }

  return `${prefix}This line performs a basic operation. If it is not repeated by a loop/recursion, its local cost is O(1).`;
}

function runTimeComplexityEngine(parsedRepresentation) {
  return buildTimeComplexityTimeline(parsedRepresentation);
}

export { runTimeComplexityEngine, getTimeLineExplanation };
