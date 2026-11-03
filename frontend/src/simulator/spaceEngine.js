function normalizeProgram(parsedRepresentation) {
  if (!parsedRepresentation) return { type: "Program", body: [] };
  if (parsedRepresentation.type === "Program" && Array.isArray(parsedRepresentation.body)) {
    return parsedRepresentation;
  }
  if (Array.isArray(parsedRepresentation.body)) {
    return { type: "Program", body: parsedRepresentation.body };
  }
  return { type: "Program", body: [] };
}

function createMemoryState() {
  return {
    stack: [],
    heap: [],
  };
}

function cloneMemory(memory) {
  return {
    stack: memory.stack.map((item) => ({ ...item })),
    heap: memory.heap.map((item) => ({ ...item })),
  };
}

function expressionHasCall(expr) {
  if (!expr || typeof expr !== "object") return false;
  if (expr.type === "CallExpression") return true;

  for (const key of Object.keys(expr)) {
    const value = expr[key];
    if (Array.isArray(value)) {
      if (value.some((child) => expressionHasCall(child))) return true;
    } else if (value && typeof value === "object") {
      if (expressionHasCall(value)) return true;
    }
  }

  return false;
}

function collectCalls(node, calls = []) {
  if (!node || typeof node !== "object") return calls;
  if (node.type === "CallExpression") {
    const calleeName = node.callee?.name || node.name || "function";
    calls.push({ name: calleeName, lineNumber: node.lineNumber || null });
  }

  for (const key of Object.keys(node)) {
    const value = node[key];
    if (Array.isArray(value)) {
      value.forEach((child) => collectCalls(child, calls));
    } else if (value && typeof value === "object") {
      collectCalls(value, calls);
    }
  }

  return calls;
}

function inferArrayContribution(valueNode) {
  if (!valueNode || valueNode.type !== "ArrayExpression") return null;

  // Prefer the explicit `dimensions` field set by the AST adapter.
  // dimensions: 1 -> O(n), 2 -> O(n^2), 3+ -> O(n^k)
  if (typeof valueNode.dimensions === "number" && valueNode.dimensions > 0) {
    if (valueNode.dimensions === 1) return "n";
    if (valueNode.dimensions === 2) return "n^2";
    if (valueNode.dimensions >= 3) return "n^" + valueNode.dimensions;
  }

  // Fallback to scanning elements for nested ArrayExpression nodes (legacy path).
  const elements = valueNode.elements || [];
  const hasNestedArray = elements.some((el) => el?.type === "ArrayExpression");
  if (hasNestedArray) return "n^2";
  return "n";
}

function contributionRank(term) {
  // Higher rank = higher space cost. Handle arbitrary n^k.
  if (/^n\^(\d+)$/.test(term)) {
    const exp = parseInt(term.match(/^n\^(\d+)$/)[1], 10);
    return 3 + exp; // n^2=5, n^3=6, n^4=7, etc.
  }
  if (term === "n^2") return 5;
  if (term === "n") return 3;
  if (term === "stack") return 3; // stack recursion is O(n) level
  if (term === "log_stack") return 2; // O(log n) recursion
  return 1;
}

function dominantContribution(contributions) {
  if (!contributions.length) return "1";
  return contributions.reduce((best, current) =>
    contributionRank(current) > contributionRank(best) ? current : best,
  "1");
}

function contributionToBigO(contribution) {
  if (contribution === "log_stack") return "O(log n)";
  if (contribution === "stack") return "O(n)";
  if (contribution === "n^2") return "O(n^2)";
  if (contribution === "n") return "O(n)";
  // Handle n^k for k >= 3
  const nkMatch = contribution.match(/^n\^(\d+)$/);
  if (nkMatch) return `O(n^${nkMatch[1]})`;
  return "O(1)";
}

function combineTerms(terms = []) {
  if (!terms.length) return "O(1)";
  return terms.join(" + ");
}

function createStepFactory(steps, memory) {
  let stepId = 1;

  return function emitStep({ lineNumber, event, narration, bubble, complexityContribution = "1", title }) {
    const step = {
      stepId,
      order: stepId,
      lineNumber: lineNumber || null,
      event,
      title: title || narration,
      description: narration,
      narration,
      bubble,
      memory: cloneMemory(memory),
      complexityContribution,
      animation: {
        type: "highlight_line",
        duration: 500,
      },
    };

    steps.push(step);
    stepId += 1;
    return step;
  };
}

function getFunctionMap(program) {
  const fnMap = new Map();
  for (const node of program?.body || []) {
    if (node?.type === "FunctionDeclaration" && node?.name) {
      fnMap.set(node.name, node);
    }
  }
  return fnMap;
}

function getEntryFunctionName(program, fnMap) {
  if (fnMap.has("main")) return "main";

  for (const node of program?.body || []) {
    if (node?.type === "FunctionDeclaration" && node?.name) {
      return node.name;
    }
  }

  return null;
}

function processCallTargets(node, context) {
  if (!node || typeof node !== "object") return;

  const calls = collectCalls(node);
  for (const call of calls) {
    const fnName = call.name;
    if (!fnName || !context.functionMap.has(fnName)) continue;
    executeFunction(fnName, call.lineNumber || node.lineNumber, context);
  }
}

/**
 * Detect if a function body contains a divide-by-2 pattern, indicating
 * a divide-and-conquer algorithm with O(log n) recursion depth.
 * Also detects divide-and-conquer double-recursion where only one branch executes
 * per call or where a partition split is used.
 */
function _functionHasDividePattern(fnNode) {
  const body = fnNode?.body || [];
  // Check for explicit /2 midpoint calculation
  if (_searchForDividePattern(body)) return true;

  // Check for double self-recursion in an if-else pattern or with a partition.
  // KEY DISTINCTION:
  //  - Binary search: 2 recursive calls in SEPARATE if/else branches → only 1 runs → O(log n)
  //  - Quick sort: 2 calls but with a partition midpoint → O(log n) depth
  //  - Tree traversal: 2 calls both execute unconditionally → O(n) depth
  const fnName = fnNode?.name;
  if (fnName) {
    // Check if recursive calls are in separate if/else branches (only one executes)
    if (_hasConditionalSelfRecursion(body, fnName)) return true;

    // Check for partition-style: calls a helper function then two self-calls
    // (quicksort pattern — the partition effectively halves)
    const selfCalls = _countSelfCalls(body, fnName);
    const hasPartition = _hasHelperCallBeforeSelfCalls(body, fnName);
    if (selfCalls >= 2 && hasPartition) return true;
  }

  return false;
}

/**
 * Check if recursive calls are in separate branches of if/else,
 * meaning only one recursive call executes per invocation.
 */
function _hasConditionalSelfRecursion(body, fnName) {
  for (const node of body) {
    if (!node || node.type !== "IfStatement") continue;

    const conseqCalls = _countSelfCalls(node.consequent || [], fnName);
    const altCalls = _countSelfCalls(node.alternate || [], fnName);

    // Both branches have self-calls → binary search pattern: only one runs
    if (conseqCalls >= 1 && altCalls >= 1) return true;
  }
  return false;
}

/**
 * Check if there's a non-recursive helper call (like partition) before self-calls.
 * This indicates a partition-based divide-and-conquer.
 */
function _hasHelperCallBeforeSelfCalls(body, fnName) {
  // Flatten: if the body is a single IfStatement, look inside its consequent
  let statements = body;
  if (body.length === 1 && body[0]?.type === "IfStatement") {
    statements = body[0].consequent || [];
  }

  let foundHelperCall = false;

  for (const node of statements) {
    if (!node) continue;

    // Look for helper function calls (not self-calls) in variable declarations
    if (node.type === "VariableDeclaration" && node.value?.type === "CallExpression") {
      if (node.value.callee?.name !== fnName) {
        foundHelperCall = true;
      }
    }
    // Look for helper calls in expression statements
    if (node.type === "ExpressionStatement" && node.expression?.type === "CallExpression") {
      if (node.expression.callee?.name !== fnName) {
        foundHelperCall = true;
      }
    }
  }

  if (!foundHelperCall) return false;

  // Now check if there are 2+ self-calls after the helper
  const selfCalls = _countSelfCalls(statements, fnName);
  return selfCalls >= 2;
}

function _countSelfCalls(nodes, fnName) {
  let count = 0;
  for (const node of nodes) {
    if (!node || typeof node !== "object") continue;
    count += _countCallsInNode(node, fnName);
  }
  return count;
}

function _countCallsInNode(node, fnName) {
  if (!node || typeof node !== "object") return 0;
  let count = 0;

  // Direct call expression
  if (node.type === "CallExpression" && (node.callee?.name === fnName || node.name === fnName)) {
    return 1;
  }

  // Return statement with call
  if (node.type === "ReturnStatement" && node.argument) {
    count += _countCallsInNode(node.argument, fnName);
  }

  // Expression statement
  if (node.type === "ExpressionStatement" && node.expression) {
    count += _countCallsInNode(node.expression, fnName);
  }

  // If statement branches
  if (node.type === "IfStatement") {
    for (const child of node.consequent || []) {
      count += _countCallsInNode(child, fnName);
    }
    for (const child of node.alternate || []) {
      count += _countCallsInNode(child, fnName);
    }
  }

  // Variable declaration with call
  if (node.type === "VariableDeclaration" && node.value) {
    count += _countCallsInNode(node.value, fnName);
  }

  // Assignment with call
  if (node.type === "Assignment" && node.value) {
    count += _countCallsInNode(node.value, fnName);
  }

  return count;
}

function _searchForDividePattern(nodes) {
  for (const node of nodes) {
    if (!node || typeof node !== "object") continue;

    // Check VariableDeclaration: int mid = (low + high) / 2;
    if (node.type === "VariableDeclaration") {
      if (_hasDivideByTwo(node.value)) return true;
    }

    // Check Assignment: mid = (low + high) / 2;
    if (node.type === "Assignment") {
      if (_hasDivideByTwo(node.value)) return true;
    }

    // Recurse into if-blocks, loops
    if (node.type === "IfStatement") {
      if (_searchForDividePattern(node.consequent || [])) return true;
      if (_searchForDividePattern(node.alternate || [])) return true;
    }
    if (node.type === "ForStatement" || node.type === "WhileStatement") {
      if (_searchForDividePattern(node.body || [])) return true;
    }
  }
  return false;
}

function _hasDivideByTwo(expr) {
  if (!expr || typeof expr !== "object") return false;
  if (expr.type === "BinaryExpression" && expr.operator === "/") {
    const rightVal = expr.right?.type === "Literal" ? Number(expr.right.value) : NaN;
    if (rightVal === 2) return true;
  }
  // Recurse into sub-expressions
  for (const key of Object.keys(expr)) {
    const val = expr[key];
    if (val && typeof val === "object" && !Array.isArray(val)) {
      if (_hasDivideByTwo(val)) return true;
    }
    if (Array.isArray(val)) {
      for (const item of val) {
        if (_hasDivideByTwo(item)) return true;
      }
    }
  }
  return false;
}

function processStatement(node, context) {
  if (!node || typeof node !== "object") return;
  const {
    emitStep,
    memory,
    contributions,
    contributionBuckets,
  } = context;

  if (node.type === "VariableDeclaration") {
    const arrayContribution = inferArrayContribution(node.value);

    // Array literals in the entry function (main) represent input data,
    // not auxiliary space. Only count 'new' allocations as extra space
    // when inside main. In helper functions, all arrays count.
    // Constant-size allocations (e.g., new int[2]) are O(1) everywhere.
    const isInputData =
      arrayContribution &&
      node.value?.allocation === "literal" &&
      context.currentFunction === "main";

    const isConstantSize =
      arrayContribution &&
      node.value?.allocation === "constant";

    if (isInputData || isConstantSize) {
      memory.stack.push({ name: node.name, value: isConstantSize ? "fixed-array" : "input" });
      contributions.push("1");
      emitStep({
        lineNumber: node.lineNumber,
        event: "space_variable",
        narration: isConstantSize
          ? "This array has a fixed constant size."
          : "Input data is provided, not extra space.",
        bubble: isConstantSize
          ? "Fixed-size array.\nConstant space only."
          : "This is input data.\nIt doesn't count as extra space.",
        complexityContribution: "1",
      });
      return;
    }

    // Handle n^k for k >= 3 (3D, 4D arrays etc.)
    if (arrayContribution && /^n\^(\d+)$/.test(arrayContribution) && arrayContribution !== "n^2") {
      const dim = arrayContribution.match(/^n\^(\d+)$/)[1];
      memory.heap.push({ name: node.name, shape: `${dim}d-array`, size: arrayContribution });
      contributions.push(arrayContribution);
      contributionBuckets.arrays2d += 1;
      emitStep({
        lineNumber: node.lineNumber,
        event: "space_array_nd",
        narration: `We create a ${dim}D array.`,
        bubble: `We create a ${dim}D array.\nSpace grows with ${arrayContribution}.`,
        complexityContribution: arrayContribution,
      });
      return;
    }

    if (arrayContribution === "n^2") {
      memory.heap.push({ name: node.name, shape: "2d-array", size: "n^2" });
      contributions.push("n^2");
      contributionBuckets.arrays2d += 1;
      emitStep({
        lineNumber: node.lineNumber,
        event: "space_array_2d",
        narration: "We create a 2D array.",
        bubble: "We create a 2D array.\nSpace grows with n^2.",
        complexityContribution: "n^2",
      });
      return;
    }

    if (arrayContribution === "n") {
      memory.heap.push({ name: node.name, shape: "array", size: "n" });
      contributions.push("n");
      contributionBuckets.arrays += 1;
      emitStep({
        lineNumber: node.lineNumber,
        event: "space_array",
        narration: "We create an array.",
        bubble: "We create an array.\nSpace grows with n.",
        complexityContribution: "n",
      });
      return;
    }

    memory.stack.push({ name: node.name, value: "value" });
    contributions.push("1");
    contributionBuckets.variables += 1;
    emitStep({
      lineNumber: node.lineNumber,
      event: "space_variable",
      narration: "We create a variable.",
      bubble: "We create a variable.\nTakes constant space.",
      complexityContribution: "1",
    });

    processCallTargets(node.value, context);
    return;
  }

  if (node.type === "FunctionDeclaration") return;

  if (node.type === "WhileStatement" || node.type === "ForStatement") {
    emitStep({
      lineNumber: node.lineNumber,
      event: "space_loop",
      narration: "The loop repeats using the same variables.",
      bubble: "Loop runs again,\nbut space stays about the same.",
      complexityContribution: "1",
    });

    (node.body || []).forEach((child) => processStatement(child, context));
    processCallTargets(node.test, context);
    processCallTargets(node.update, context);
    return;
  }

  if (node.type === "ExpressionStatement" && expressionHasCall(node.expression)) {
    processCallTargets(node.expression, context);
    return;
  }

  if (node.type === "Assignment" || node.type === "ReturnStatement" || node.type === "IfStatement") {
    contributions.push("1");
    emitStep({
      lineNumber: node.lineNumber,
      event: "space_step",
      narration: "This step reuses existing memory.",
      bubble: "No big extra space\nis added here.",
      complexityContribution: "1",
    });

    if (node.type === "IfStatement") {
      processCallTargets(node.test, context);
      (node.consequent || []).forEach((child) => processStatement(child, context));
      (node.alternate || []).forEach((child) => processStatement(child, context));
      return;
    }

    if (node.type === "Assignment") {
      processCallTargets(node.value, context);
      return;
    }

    if (node.type === "ReturnStatement") {
      processCallTargets(node.argument, context);
    }
  }
}

function executeFunction(functionName, callLineNumber, context) {
  const fnNode = context.functionMap.get(functionName);
  if (!fnNode) return;

  const isRecursiveCall = context.callStack.includes(functionName);

  // Detect logarithmic recursion depth: if the function body contains
  // a midpoint calculation (dividing by 2), it's likely a divide-and-conquer
  // pattern (binary search, quicksort) with O(log n) stack depth.
  let recursionTerm = "stack"; // default: O(n) stack depth
  if (isRecursiveCall) {
    const hasMidpoint = _functionHasDividePattern(fnNode);
    if (hasMidpoint) {
      recursionTerm = "log_stack";
    }
  }

  context.memory.stack.push({ name: `${functionName}()`, value: "frame" });
  context.contributions.push(isRecursiveCall ? recursionTerm : "1");
  if (isRecursiveCall) {
    context.contributionBuckets.recursion += 1;
  } else {
    context.contributionBuckets.functionCalls += 1;
  }

  context.emitStep({
    lineNumber: fnNode.lineNumber || callLineNumber,
    event: isRecursiveCall ? "space_recursive_call" : "space_function_call",
    narration: isRecursiveCall
      ? `Control enters ${functionName}() again.`
      : `Control enters ${functionName}().`,
    bubble: isRecursiveCall
      ? (recursionTerm === "log_stack"
        ? `Move into ${functionName}().\nThis is recursive with halving, stack grows with log n.`
        : `Move into ${functionName}().\nThis is recursive, so stack can grow.`)
      : `Move into ${functionName}().\nA stack frame is added.`,
    complexityContribution: isRecursiveCall ? recursionTerm : "1",
  });

  if (!isRecursiveCall) {
    const nestedContext = {
      ...context,
      currentFunction: functionName,
      callStack: [...context.callStack, functionName],
    };
    (fnNode.body || []).forEach((child) => processStatement(child, nestedContext));
  }

  context.memory.stack.pop();
  context.emitStep({
    lineNumber: callLineNumber || fnNode.lineNumber,
    event: "space_function_return",
    narration: `Control returns from ${functionName}() to ${context.currentFunction || "caller"}().`,
    bubble: `Return from ${functionName}().\nContinue in ${context.currentFunction || "caller"}().`,
    complexityContribution: "1",
  });
}

function buildSpaceComplexityTimeline(parsedRepresentation) {
  const program = normalizeProgram(parsedRepresentation);
  const steps = [];
  const memory = createMemoryState();
  const contributions = [];
  const contributionBuckets = {
    variables: 0,
    arrays: 0,
    arrays2d: 0,
    recursion: 0,
    functionCalls: 0,
  };
  const emitStep = createStepFactory(steps, memory);
  const functionMap = getFunctionMap(program);
  const entryFunctionName = getEntryFunctionName(program, functionMap);

  const baseContext = {
    emitStep,
    memory,
    contributions,
    contributionBuckets,
    functionMap,
    callStack: [],
    currentFunction: "global",
  };

  if (entryFunctionName) {
    emitStep({
      lineNumber: functionMap.get(entryFunctionName)?.lineNumber || 1,
      event: "space_entry",
      narration: `Execution starts in ${entryFunctionName}().`,
      bubble: `Start in ${entryFunctionName}().`,
      complexityContribution: "1",
    });
    executeFunction(entryFunctionName, functionMap.get(entryFunctionName)?.lineNumber || 1, {
      ...baseContext,
      currentFunction: "global",
    });
  } else {
    (program.body || [])
      .filter((node) => node?.type !== "FunctionDeclaration")
      .forEach((node) => processStatement(node, baseContext));
  }

  const dominant = dominantContribution(contributions);
  const finalComplexity = contributionToBigO(dominant);

  const contributionItems = [];
  if (contributionBuckets.variables > 0) {
    contributionItems.push({
      key: "variables",
      label: "variables",
      complexity: "O(1)",
      explanation: "Variables use constant space.",
    });
  }
  if (contributionBuckets.arrays > 0) {
    contributionItems.push({
      key: "arrays",
      label: "arrays",
      complexity: "O(n)",
      explanation: "Arrays grow with input size.",
    });
  }
  if (contributionBuckets.arrays2d > 0) {
    contributionItems.push({
      key: "arrays2d",
      label: "2D arrays",
      complexity: "O(n^2)",
      explanation: "2D arrays grow like n by n.",
    });
  }
  if (contributionBuckets.recursion > 0) {
    // Determine if the recursion detected is logarithmic or linear
    const hasLogRecursion = contributions.includes("log_stack");
    const hasLinearRecursion = contributions.includes("stack");
    if (hasLogRecursion && !hasLinearRecursion) {
      contributionItems.push({
        key: "recursion",
        label: "recursive calls",
        complexity: "O(log n)",
        explanation: "Divide-and-conquer recursion uses log n stack depth.",
      });
    } else {
      contributionItems.push({
        key: "recursion",
        label: "recursive calls",
        complexity: "O(n)",
        explanation: "Recursive calls add stack layers.",
      });
    }
  }
  if (contributionBuckets.functionCalls > 0) {
    contributionItems.push({
      key: "functionCalls",
      label: "function calls",
      complexity: "O(1)",
      explanation: "Each call adds one stack frame.",
    });
  }

  const contributionTerms = contributionItems.map((item) => item.complexity);
  const combinedExpression = combineTerms(contributionTerms);
  const focusLine = steps.find((step) => step.lineNumber)?.lineNumber || 1;

  emitStep({
    lineNumber: focusLine,
    event: "space_highlight_contributions",
    narration: "We highlight all memory contributions.",
    bubble: "Variables -> constant. Arrays -> n.",
    complexityContribution: dominant,
    title: "Highlight memory contributions",
  });

  emitStep({
    lineNumber: focusLine,
    event: "space_combine_contributions",
    narration: "Now we combine them.",
    bubble: combinedExpression,
    complexityContribution: dominant,
    title: "Combine terms",
  });

  emitStep({
    lineNumber: focusLine,
    event: "space_simplify_contributions",
    narration: "Now we keep the biggest term.",
    bubble: finalComplexity,
    complexityContribution: dominant,
    title: "Simplify",
  });

  emitStep({
    lineNumber: focusLine,
    event: "space_summary",
    narration: "This is the overall memory growth.",
    bubble:
      finalComplexity === "O(n)" && contributionBuckets.arrays > 0
        ? "Overall Space Complexity: O(n)\nBecause the array grows with input size."
        : `Overall Space Complexity: ${finalComplexity}\nThis is the final answer for space usage.`,
    complexityContribution: dominant,
    title: "Final space answer",
  });

  const byId = new Map(steps.map((step) => [step.stepId, step]));

  return {
    steps,
    finalComplexity,
    metadata: {
      totalSteps: steps.length,
      dominantTerm: dominant,
      eventCount: steps.length,
      contributionItems,
      combinedExpression,
    },
    getNextStep(currentId) {
      const sorted = [...steps].sort((a, b) => a.stepId - b.stepId);
      if (currentId == null) return sorted[0] || null;
      const index = sorted.findIndex((step) => step.stepId === currentId);
      if (index < 0 || index >= sorted.length - 1) return null;
      return sorted[index + 1];
    },
    getPreviousStep(currentId) {
      const sorted = [...steps].sort((a, b) => a.stepId - b.stepId);
      if (currentId == null) return null;
      const index = sorted.findIndex((step) => step.stepId === currentId);
      if (index <= 0) return null;
      return sorted[index - 1];
    },
    getStepById(id) {
      return byId.get(id) || null;
    },
  };
}

function getSpaceLineExplanation({ lineNumber, event }) {
  if (event?.bubble) return event.bubble;
  if (!lineNumber) return "Press Play and follow the highlighted line.";

  if (event?.event === "space_entry") {
    return "Execution starts at the entry function.";
  }

  if (event?.event === "space_function_call") {
    return "Control moves into a function and pushes a stack frame.";
  }

  if (event?.event === "space_function_return") {
    return "The function returns and its stack frame is removed.";
  }

  if (event?.event === "space_recursive_call") {
    return "Recursive calls may add stack frames as depth grows.";
  }

  if (event?.event === "space_loop") {
    return "Loops usually reuse existing variables unless new structures are created.";
  }

  if (event?.event === "space_array" || event?.event === "space_array_2d") {
    return "This step allocates array storage, so memory grows with input size.";
  }

  return "This line uses\nconstant extra space.";
}

export { buildSpaceComplexityTimeline, getSpaceLineExplanation };
