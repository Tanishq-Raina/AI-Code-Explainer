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

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createMemoryState() {
  return {
    stack: [],
    heap: [],
    nextHeapId: 1,
  };
}

function cloneMemory(memory) {
  return {
    stack: deepClone(memory.stack),
    heap: deepClone(memory.heap),
    nextHeapId: memory.nextHeapId,
  };
}

function createFrame(functionName, lineNumber) {
  const displayName = functionName === "global" ? "global" : `${functionName}()`;
  return {
    function: displayName,
    name: displayName,
    lineNumber: lineNumber || null,
    variables: {},
  };
}

function getCurrentFrame(memory) {
  return memory.stack[memory.stack.length - 1] || null;
}

function getHeapItemByRef(memory, refId) {
  return memory.heap.find((item) => item.id === refId) || null;
}

function previewValue(node, context) {
  if (!node || typeof node !== "object") return undefined;

  if (node.type === "Literal") return node.value;

  if (node.type === "Identifier") {
    for (let index = context.memory.stack.length - 1; index >= 0; index -= 1) {
      const frame = context.memory.stack[index];
      if (!frame?.variables || !(node.name in frame.variables)) continue;
      const value = frame.variables[node.name];
      if (value && typeof value === "object" && value.ref) {
        const heapItem = getHeapItemByRef(context.memory, value.ref);
        return heapItem ? deepClone(heapItem.value) : undefined;
      }
      return value;
    }
    return undefined;
  }

  if (node.type === "ArrayExpression") {
    return (node.elements || []).map((element) => previewValue(element, context));
  }

  if (node.type === "ObjectExpression") {
    const result = {};
    for (const prop of node.properties || []) {
      const key = prop?.key?.name || prop?.key || "value";
      result[key] = previewValue(prop?.value, context);
    }
    return result;
  }

  return undefined;
}

function storeHeapValue(node, variableName, context, lineNumber) {
  const currentFrame = getCurrentFrame(context.memory);
  const preview = previewValue(node, context);

  if (node?.type === "ArrayExpression") {
    const arrayContribution = inferArrayContribution(node);
    const existingRef = currentFrame?.variables?.[variableName]?.ref;
    const heapItem = existingRef ? getHeapItemByRef(context.memory, existingRef) : null;

    if (heapItem) {
      heapItem.name = variableName;
      heapItem.shape = arrayContribution === "n^2" ? "2d-array" : "array";
      heapItem.size = arrayContribution || heapItem.size;
      heapItem.value = preview;
      heapItem.lineNumber = lineNumber || heapItem.lineNumber || null;
      return { ref: heapItem.id };
    }

    const id = `arr_${context.memory.nextHeapId++}`;
    context.memory.heap.push({
      id,
      name: variableName,
      type: "array",
      shape: arrayContribution === "n^2" ? "2d-array" : "array",
      size: arrayContribution || (Array.isArray(preview) ? preview.length : 0),
      value: preview,
      lineNumber: lineNumber || null,
    });
    return { ref: id };
  }

  if (node?.type === "ArrayCreationExpression") {
    const dimensions = Array.isArray(node.dimensions) ? node.dimensions : [];
    const sizeExpression = dimensions
      .map((dimension) => (typeof dimension === "string" ? dimension : dimension?.snippet || dimension?.name || ""))
      .filter(Boolean)
      .join(" x ") || "1";
    const existingRef = currentFrame?.variables?.[variableName]?.ref;
    const heapItem = existingRef ? getHeapItemByRef(context.memory, existingRef) : null;
    const shape = dimensions.length > 1 ? `${dimensions.length}d-array` : "array";

    if (heapItem) {
      heapItem.name = variableName;
      heapItem.type = "array";
      heapItem.shape = shape;
      heapItem.size = sizeExpression;
      heapItem.sizeExpression = sizeExpression;
      heapItem.dimensions = dimensions;
      heapItem.value = preview;
      heapItem.lineNumber = lineNumber || heapItem.lineNumber || null;
      return { ref: heapItem.id };
    }

    const id = `arr_${context.memory.nextHeapId++}`;
    context.memory.heap.push({
      id,
      name: variableName,
      type: "array",
      shape,
      size: sizeExpression,
      sizeExpression,
      dimensions,
      value: preview,
      lineNumber: lineNumber || null,
    });
    return { ref: id };
  }

  if (node?.type === "ObjectExpression") {
    const existingRef = currentFrame?.variables?.[variableName]?.ref;
    const heapItem = existingRef ? getHeapItemByRef(context.memory, existingRef) : null;

    if (heapItem) {
      heapItem.name = variableName;
      heapItem.type = "object";
      heapItem.shape = "object";
      heapItem.size = preview && typeof preview === "object" ? Object.keys(preview).length : heapItem.size;
      heapItem.value = preview || {};
      heapItem.lineNumber = lineNumber || heapItem.lineNumber || null;
      return { ref: heapItem.id };
    }

    const id = `obj_${context.memory.nextHeapId++}`;
    context.memory.heap.push({
      id,
      name: variableName,
      type: "object",
      shape: "object",
      size: preview && typeof preview === "object" ? Object.keys(preview).length : 0,
      value: preview || {},
      lineNumber: lineNumber || null,
    });
    return { ref: id };
  }

  if (node?.type === "ObjectCreationExpression") {
    const existingRef = currentFrame?.variables?.[variableName]?.ref;
    const heapItem = existingRef ? getHeapItemByRef(context.memory, existingRef) : null;
    const sizeExpression = Array.isArray(node.arguments) && node.arguments.length ? String(node.arguments.length) : "1";

    if (heapItem) {
      heapItem.name = variableName;
      heapItem.type = "object";
      heapItem.shape = "object";
      heapItem.size = sizeExpression;
      heapItem.value = preview || {};
      heapItem.lineNumber = lineNumber || heapItem.lineNumber || null;
      return { ref: heapItem.id };
    }

    const id = `obj_${context.memory.nextHeapId++}`;
    context.memory.heap.push({
      id,
      name: variableName,
      type: "object",
      shape: "object",
      size: sizeExpression,
      value: preview || {},
      lineNumber: lineNumber || null,
    });
    return { ref: id };
  }

  return preview;
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
  if (!elements.length) return "1";
  if (hasNestedArray) return "n^2";
  return "1";
}

function normalizeDimensionTerm(term) {
  const text = String(term || "").trim().replace(/^\(+|\)+$/g, "");
  if (!text) return "1";
  if (/^\d+$/.test(text)) return "1";

  const strippedTrailingConstant = text.replace(/\s*[+\-]\s*\d+$/, "");
  if (strippedTrailingConstant !== text) {
    return normalizeDimensionTerm(strippedTrailingConstant);
  }

  return text.replace(/\s+/g, "");
}

function simplifyProductTerm(term) {
  const normalized = String(term || "").trim();
  if (!normalized || normalized === "1") return "1";

  const factors = normalized.split(/\s*\*\s*/).filter(Boolean);
  const nonConstantFactors = factors.filter((factor) => factor !== "1");
  if (!nonConstantFactors.length) return "1";
  if (nonConstantFactors.length !== factors.length) {
    return simplifyProductTerm(nonConstantFactors.join(" * "));
  }
  if (nonConstantFactors.length > 1 && nonConstantFactors.every((factor) => factor === nonConstantFactors[0])) {
    return `${nonConstantFactors[0]}^${nonConstantFactors.length}`;
  }

  return nonConstantFactors.join(" * ");
}

function inferSpaceContribution(valueNode) {
  if (!valueNode || typeof valueNode !== "object") {
    return { term: "1", kind: "scalar", sizeLabel: "1" };
  }

  if (valueNode.type === "ArrayExpression") {
    const arrayContribution = inferArrayContribution(valueNode) || "1";
    return {
      term: arrayContribution,
      kind: "array",
      sizeLabel: arrayContribution === "n^2" ? "n^2" : arrayContribution === "n" ? "n" : "1",
    };
  }

  if (valueNode.type === "ArrayCreationExpression") {
    const dimensions = Array.isArray(valueNode.dimensions) ? valueNode.dimensions : [];
    const dimensionTerms = dimensions
      .map((dimension) => {
        if (typeof dimension === "string") return normalizeDimensionTerm(dimension);
        if (dimension && typeof dimension === "object") {
          if (dimension.type === "Literal" && Number.isFinite(Number(dimension.value))) return "1";
          if (dimension.type === "Identifier") return normalizeDimensionTerm(dimension.name);
          if (dimension.type === "MemberExpression") {
            return normalizeDimensionTerm(`${dimension.object?.name || ""}.${dimension.property?.name || ""}`);
          }
          return normalizeDimensionTerm(dimension.snippet || dimension.name || "");
        }
        return "1";
      })
      .filter((term) => term && term !== "1");

    if (!dimensionTerms.length) {
      return { term: "1", kind: "array", sizeLabel: "1" };
    }

    const term = dimensionTerms.length === 1
      ? dimensionTerms[0]
      : simplifyProductTerm(dimensionTerms.join(" * "));

    return {
      term,
      kind: "array",
      sizeLabel: dimensionTerms.join(" x "),
    };
  }

  if (valueNode.type === "ObjectExpression" || valueNode.type === "ObjectCreationExpression") {
    return { term: "1", kind: "object", sizeLabel: "1" };
  }

  return { term: "1", kind: "scalar", sizeLabel: "1" };
}

function contributionRank(term) {
  const normalized = String(term || "1");
  if (normalized === "stack") return 2;
  if (!normalized || normalized === "1") return 1;
  const powerMatch = normalized.match(/\^(\d+)$/);
  if (powerMatch) return Number(powerMatch[1]) + 2;
  if (normalized.includes("*")) {
    return normalized.split(/\s*\*\s*/).filter((factor) => factor && factor !== "1").length + 2;
  }
  return 3;
}

function formatSpaceBigO(term) {
  const normalized = String(term || "1").trim();
  if (normalized === "stack") return "O(n)";
  if (!normalized || normalized === "1") return "O(1)";

  const factors = normalized.split(/\s*\*\s*/).filter(Boolean);
  const nonConstantFactors = factors.filter((factor) => factor !== "1");
  if (!nonConstantFactors.length) return "O(1)";
  if (nonConstantFactors.length > 1 && nonConstantFactors.every((factor) => factor === nonConstantFactors[0])) {
    return `O(${nonConstantFactors[0]}^${nonConstantFactors.length})`;
  }

  return `O(${nonConstantFactors.join(" * ") || normalized})`;
}

function dominantContribution(contributions) {
  if (!contributions.length) return "1";
  return contributions.reduce((best, current) =>
    contributionRank(current) > contributionRank(best) ? current : best,
  "1");
}

function contributionToBigO(contribution) {
  return formatSpaceBigO(contribution);
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
    spaceComponents,
  } = context;
  const currentFrame = getCurrentFrame(memory);

  if (node.type === "VariableDeclaration") {
    const spaceContribution = inferSpaceContribution(node.value);
    const storedValue = storeHeapValue(node.value, node.name, context, node.lineNumber);

    if (currentFrame) {
      currentFrame.variables[node.name] = storedValue;
    }

    if (spaceContribution.kind === "array" || spaceContribution.kind === "object") {
      contributions.push(spaceContribution.term);
      contributionBuckets.arrays += 1;
      spaceComponents.push({
        key: `${node.lineNumber || "line"}-${spaceContribution.kind}-${node.name}`,
        label: node.name || spaceContribution.kind,
        complexity: contributionToBigO(spaceContribution.term),
        explanation: spaceContribution.kind === "array"
          ? `The allocation for ${node.name || "this array"} uses ${spaceContribution.sizeLabel} cells, so the space grows as ${contributionToBigO(spaceContribution.term)}.`
          : `This allocation stores ${node.name || "a value"} on the heap, which is constant extra space.`,
      });
      emitStep({
        lineNumber: node.lineNumber,
        event: spaceContribution.kind === "object"
          ? "space_step"
          : spaceContribution.term.includes("*") || /\^\d+$/.test(spaceContribution.term)
            ? "space_array_2d"
            : "space_array",
        narration: `We allocate ${node.name || "an array"}.`,
        bubble: `We allocate ${node.name || `the ${spaceContribution.kind}`}${spaceContribution.sizeLabel ? ` as ${spaceContribution.sizeLabel}` : ""}.\nThis uses ${contributionToBigO(spaceContribution.term)} space.`,
        complexityContribution: spaceContribution.term,
      });
      return;
    }

    contributions.push("1");
    contributionBuckets.variables += 1;
    spaceComponents.push({
      key: `${node.lineNumber || "line"}-variable-${node.name}`,
      label: node.name || "variable",
      complexity: "O(1)",
      explanation: `The scalar variable ${node.name || "value"} is constant-sized.`,
    });
    emitStep({
      lineNumber: node.lineNumber,
      event: "space_variable",
      narration: `We create ${node.name || "a variable"}.`,
      bubble: `We create ${node.name || "a variable"}.\nThis is constant extra space.`,
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

  if (node.type === "IfStatement") {
    contributions.push("1");
    emitStep({
      lineNumber: node.lineNumber,
      event: "space_step",
      narration: "This condition reuses existing memory.",
      bubble: "A condition is checked.\nNo growing structure is allocated by the condition itself.",
      complexityContribution: "1",
    });
      processCallTargets(node.test, context);
      (node.consequent || []).forEach((child) => processStatement(child, context));
      (node.alternate || []).forEach((child) => processStatement(child, context));
      return;
  }

  if (node.type === "Assignment") {
    const spaceContribution = inferSpaceContribution(node.value);
    const storedValue = storeHeapValue(node.value, node.name, context, node.lineNumber);
    if (currentFrame) {
      currentFrame.variables[node.name] = storedValue;
    }

    if (spaceContribution.kind === "array" || spaceContribution.kind === "object") {
      contributions.push(spaceContribution.term);
      spaceComponents.push({
        key: `${node.lineNumber || "line"}-assignment-${node.name}`,
        label: node.name || "assignment",
        complexity: contributionToBigO(spaceContribution.term),
        explanation: spaceContribution.kind === "array"
          ? `This assignment creates or updates ${node.name || "an array"} with ${spaceContribution.sizeLabel} cells, so the space grows as ${contributionToBigO(spaceContribution.term)}.`
          : `This assignment stores ${node.name || "a value"} on the heap, which is constant extra space.`,
      });
      emitStep({
        lineNumber: node.lineNumber,
        event: spaceContribution.kind === "object"
          ? "space_step"
          : spaceContribution.term.includes("*") || /\^\d+$/.test(spaceContribution.term)
            ? "space_array_2d"
            : "space_array",
        narration: `We update ${node.name || "a variable"} with allocated memory.`,
        bubble: spaceContribution.kind === "array"
          ? `This assignment allocates ${node.name || "an array"} as ${spaceContribution.sizeLabel}.\nThis adds ${contributionToBigO(spaceContribution.term)} space.`
          : `This assignment stores an object reference for ${node.name || "a value"}.\nThe object allocation is constant extra space.`,
        complexityContribution: spaceContribution.term,
      });
      processCallTargets(node.value, context);
      return;
    }

    contributions.push("1");
    emitStep({
      lineNumber: node.lineNumber,
      event: "space_step",
      narration: "This assignment reuses existing memory.",
      bubble: "This assignment changes a value.\nNo growing structure is allocated here.",
      complexityContribution: "1",
    });
    processCallTargets(node.value, context);
    return;
  }

  if (node.type === "ReturnStatement") {
    contributions.push("1");
    emitStep({
      lineNumber: node.lineNumber,
      event: "space_step",
      narration: "Returning a value reuses existing memory.",
      bubble: "The function returns a value.\nThe return statement itself uses constant extra space.",
      complexityContribution: "1",
    });
    processCallTargets(node.argument, context);
  }
}

function executeFunction(functionName, callLineNumber, context) {
  const fnNode = context.functionMap.get(functionName);
  if (!fnNode) return;

  const isRecursiveCall = context.callStack.includes(functionName);

  context.memory.stack.push(createFrame(functionName, callLineNumber || fnNode.lineNumber));
  context.contributions.push(isRecursiveCall ? "stack" : "1");
  if (isRecursiveCall) {
    context.contributionBuckets.recursion += 1;
  } else {
    context.contributionBuckets.functionCalls += 1;
  }

  if (Array.isArray(context.spaceComponents)) {
    context.spaceComponents.push({
      key: `${callLineNumber || fnNode.lineNumber || "line"}-call-${functionName}`,
      label: `${functionName}() stack frame`,
      complexity: isRecursiveCall ? "O(n)" : "O(1)",
      explanation: isRecursiveCall
        ? `Recursive call ${functionName}() can grow the call stack with depth.`
        : `The call to ${functionName}() adds one stack frame at a time.`,
    });
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
  const spaceComponents = [];
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
    spaceComponents,
    functionMap,
    callStack: [],
    currentFunction: "global",
  };

  if (!entryFunctionName) {
    memory.stack.push(createFrame("global", 1));
  }

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

  const contributionItems = spaceComponents.length > 0
    ? spaceComponents
    : [];

  const contributionTerms = contributionItems.map((item) => item.complexity.replace(/^O\((.*)\)$/, "$1"));
  const combinedExpression = combineTerms(contributionTerms.map((term) => term || "1"));
  const focusLine = steps.find((step) => step.lineNumber)?.lineNumber || 1;

  emitStep({
    lineNumber: focusLine,
    event: "space_highlight_contributions",
    narration: "We highlight all memory contributions.",
    bubble: contributionItems.length
      ? contributionItems.map((item) => `${item.label} -> ${item.complexity}`).join(" + ")
      : "Memory contributions are highlighted from the submitted code.",
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
    bubble: contributionItems.length
      ? `Overall Space Complexity: ${finalComplexity}\n${contributionItems
          .map((item) => `${item.label} -> ${item.complexity}`)
          .join(" + ")}`
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

  if (event?.event === "space_call_depth_limit") {
    return event?.bubble || "Recursion depth is capped for the preview.";
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
