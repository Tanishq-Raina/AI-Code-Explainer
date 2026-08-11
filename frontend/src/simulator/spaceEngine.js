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

  const elements = valueNode.elements || [];
  const hasNestedArray = elements.some((el) => el?.type === "ArrayExpression");
  if (hasNestedArray) return "n^2";
  return "n";
}

function contributionRank(term) {
  if (term === "n^2") return 4;
  if (term === "n") return 3;
  if (term === "stack") return 2;
  return 1;
}

function dominantContribution(contributions) {
  if (!contributions.length) return "1";
  return contributions.reduce((best, current) =>
    contributionRank(current) > contributionRank(best) ? current : best,
  "1");
}

function contributionToBigO(contribution) {
  if (contribution === "stack") return "O(n)";
  if (contribution === "n^2") return "O(n^2)";
  if (contribution === "n") return "O(n)";
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

  context.memory.stack.push({ name: `${functionName}()`, value: "frame" });
  context.contributions.push(isRecursiveCall ? "stack" : "1");
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
      ? `Move into ${functionName}().\nThis is recursive, so stack can grow.`
      : `Move into ${functionName}().\nA stack frame is added.`,
    complexityContribution: isRecursiveCall ? "stack" : "1",
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
    contributionItems.push({
      key: "recursion",
      label: "recursive calls",
      complexity: "O(n)",
      explanation: "Recursive calls add stack layers.",
    });
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
