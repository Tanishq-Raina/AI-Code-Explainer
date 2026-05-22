const LOOP_COLORS = ["blue", "green", "orange", "teal", "red", "indigo"];

function createBaseTerm(nExp = 0, logExp = 0, constant = 1) {
  return { nExp, logExp, constant };
}

function multiplyTerms(a, b) {
  return {
    nExp: a.nExp + b.nExp,
    logExp: a.logExp + b.logExp,
    constant: a.constant * b.constant,
  };
}

function compareTerms(a, b) {
  if (a.nExp !== b.nExp) return a.nExp - b.nExp;
  if (a.logExp !== b.logExp) return a.logExp - b.logExp;
  return a.constant - b.constant;
}

function dominantTerm(terms) {
  if (!terms.length) return createBaseTerm();
  return terms.reduce((best, current) => (compareTerms(current, best) > 0 ? current : best));
}

function simplifyTerm(term) {
  const result = { ...term };
  if (result.nExp < 0) result.nExp = 0;
  if (result.logExp < 0) result.logExp = 0;
  if (result.constant < 1) result.constant = 1;
  return result;
}

function termToAsymptotic(term) {
  const normalized = simplifyTerm(term);
  if (normalized.nExp === 0 && normalized.logExp === 0) return "1";

  const parts = [];
  if (normalized.nExp > 0) {
    parts.push(normalized.nExp === 1 ? "n" : `n^${normalized.nExp}`);
  }
  if (normalized.logExp > 0) {
    parts.push(normalized.logExp === 1 ? "log n" : `(log n)^${normalized.logExp}`);
  }
  return parts.join(" * ");
}

function toBigO(term) {
  return `O(${termToAsymptotic(term)})`;
}

function formulaFromTerms(terms) {
  if (!terms.length) return "1";
  return terms.map((term) => termToAsymptotic(term)).join(" + ");
}

function normalizeInput(parsed) {
  if (!parsed) return { type: "Program", body: [] };
  if (parsed.type === "Program" && Array.isArray(parsed.body)) return parsed;
  if (Array.isArray(parsed.body)) return { type: "Program", body: parsed.body };
  if (Array.isArray(parsed.loops)) {
    return { type: "Program", body: parsed.loops.map((loop) => normalizeLoopObject(loop)) };
  }
  if (Array.isArray(parsed)) return { type: "Program", body: parsed };
  return { type: "Program", body: [] };
}

function normalizeLoopObject(loop) {
  return {
    type: loop.type || "ForStatement",
    lineNumber: loop.lineNumber || 1,
    init: loop.init,
    test: loop.test,
    update: loop.update,
    body: Array.isArray(loop.body)
      ? loop.body.map((child) => {
          if (
            child.type === "ForStatement" ||
            child.type === "WhileStatement" ||
            child.type === "IfStatement"
          ) {
            return child;
          }
          if (Array.isArray(child.loops) || child.loop || child.body) {
            return normalizeLoopObject(child.loop || child);
          }
          return child;
        })
      : [],
  };
}

function inferLoopFactor(loopNode) {
  const update = loopNode?.update;

  if (loopNode?.type === "WhileStatement") {
    const controlVar = loopNode?.test?.left?.type === "Identifier" ? loopNode.test.left.name : null;

    if (controlVar) {
      for (const statement of loopNode.body || []) {
        if (statement?.type !== "Assignment" || statement?.name !== controlVar) continue;

        const value = statement?.value;
        if (value?.type !== "BinaryExpression") continue;

        const leftId = value.left?.type === "Identifier" ? value.left.name : null;
        const rightConstant = value.right?.type === "Literal" ? Number(value.right.value) : NaN;
        const op = value.operator;

        const multiplicative =
          (op === "*" || op === "/" || op === "//") &&
          leftId === controlVar &&
          Number.isFinite(rightConstant) &&
          rightConstant > 1;

        if (multiplicative) {
          return { term: createBaseTerm(0, 1, 1), iterations: "log n", growth: "logarithmic" };
        }

        if (op === "+" || op === "-") {
          return { term: createBaseTerm(1, 0, 1), iterations: "n", growth: "linear" };
        }
      }
    }
  }

  if (!update) {
    return { term: createBaseTerm(1, 0, 1), iterations: "n", growth: "linear" };
  }

  if (update.type === "UpdateExpression") {
    return { term: createBaseTerm(1, 0, 1), iterations: "n", growth: "linear" };
  }

  if (update.operator === "*=" || update.operator === "/=") {
    return { term: createBaseTerm(0, 1, 1), iterations: "log n", growth: "logarithmic" };
  }

  if (update.type === "Assignment") {
    const value = update.value;
    const lhs = update.name;
    if (value?.type === "BinaryExpression") {
      const leftId = value.left?.type === "Identifier" ? value.left.name : null;
      const right = value.right;
      const rightConstant = right?.type === "Literal" ? Number(right.value) : NaN;
      const op = value.operator;

      const multiplicative =
        (op === "*" || op === "/" || op === "//") &&
        leftId &&
        lhs &&
        leftId === lhs &&
        Number.isFinite(rightConstant) &&
        rightConstant > 1;

      if (multiplicative) {
        return { term: createBaseTerm(0, 1, 1), iterations: "log n", growth: "logarithmic" };
      }

      if (op === "+" || op === "-") {
        return { term: createBaseTerm(1, 0, 1), iterations: "n", growth: "linear" };
      }
    }
  }

  return { term: createBaseTerm(1, 0, 1), iterations: "n", growth: "linear" };
}

function conditionTitle(depth, ordinal) {
  if (depth === 1 && ordinal === 1) return "Condition";
  return `Condition L${depth}.${ordinal}`;
}

function describeLoop(node, loopMeta) {
  if (loopMeta.growth === "logarithmic") {
    return "This repeats fewer and fewer times as the value grows.";
  }
  return `This runs ${loopMeta.iterations} times.`;
}

function describeCondition(node) {
  const test = node?.test;
  if (test?.type === "BinaryExpression") {
    const left = test.left?.name || "value";
    const right =
      test.right?.name ||
      (typeof test.right?.value !== "undefined" ? String(test.right.value) : "value");
    return `Evaluates ${left} ${test.operator || "?"} ${right}`;
  }
  return "Evaluates a branch before continuing";
}

function createTimelineContext() {
  return {
    stepId: 1,
    order: 1,
    loopOrdinalByDepth: {},
    conditionOrdinalByDepth: {},
    eventCounts: {},
    events: [],
  };
}

function emitEvent(context, payload) {
  const repeatKey = [payload.event, payload.lineNumber || "-", payload.title || "-", payload.snippet || "-"].join("|");
  context.eventCounts[repeatKey] = (context.eventCounts[repeatKey] || 0) + 1;
  const event = {
    stepId: context.stepId++,
    order: context.order++,
    occurrence: context.eventCounts[repeatKey],
    ...payload,
  };
  context.events.push(event);
  return event;
}

function countSelfCalls(node, functionName) {
  return collectCalls(node).filter((call) => call.name === functionName).length;
}

function summarizeRecursiveFunction(bodyTerm, selfCallCount) {
  const normalized = bodyTerm || createBaseTerm();

  if (selfCallCount >= 2) {
    if (normalized.nExp >= 2) return normalized;
    if (normalized.nExp === 1) return multiplyTerms(normalized, createBaseTerm(0, 1, 1));
    return createBaseTerm(1, 0, 1);
  }

  if (selfCallCount === 1) {
    if (normalized.nExp >= 1) return normalized;
    return createBaseTerm(0, 1, 1);
  }

  return normalized;
}

function loopVisual(depth) {
  return {
    level: depth,
    color: LOOP_COLORS[(depth - 1) % LOOP_COLORS.length],
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

function collectCalls(node, calls = []) {
  if (!node || typeof node !== "object") return calls;

  if (node.type === "CallExpression") {
    calls.push({
      name: node.callee?.name || node.name || null,
      lineNumber: node.lineNumber || null,
    });
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

function getSnippetText(node) {
  return String(node?.snippet || node?.text || "").trim();
}

function describeStatementFromSnippet(statement) {
  const snippet = getSnippetText(statement);
  if (!snippet) {
    return "This line performs a basic operation. If it is not repeated by a loop or recursion, its local cost is O(1).";
  }

  if (/\bfor\s*\(|\bwhile\s*\(/.test(snippet)) {
    return "This line starts a loop, so the work inside it repeats and must be counted more than once.";
  }

  if (/\bif\s*\(/.test(snippet)) {
    return "This line checks a condition. Only one branch runs at runtime, so we compare the possible branch costs.";
  }

  if (/\breturn\b/.test(snippet)) {
    return "This line returns from the function. Returning once is constant time, O(1).";
  }

  if (/\b[A-Za-z_][A-Za-z0-9_$]*\s*\(.*\)/.test(snippet) && !/\bnew\b/.test(snippet)) {
    return "This line calls another function. We follow into that function and then come back to the caller.";
  }

  if (/=\s*\{.*\}/.test(snippet) || /new\s+[A-Za-z_][A-Za-z0-9_$]*\s*\[/.test(snippet)) {
    return "This line creates or initializes data. For a fixed-size value or array, that work is treated as constant time, O(1).";
  }

  if (/\b[A-Za-z_][A-Za-z0-9_$]*\s*=/.test(snippet)) {
    return "This line assigns a value. A single assignment is constant time, O(1).";
  }

  return "This line runs a basic statement. On its own, it contributes constant work, O(1).";
}

function buildLoopTimeline(node, context, depth, state) {
  context.loopOrdinalByDepth[depth] = (context.loopOrdinalByDepth[depth] || 0) + 1;
  const ordinal = context.loopOrdinalByDepth[depth];
  const loopMeta = inferLoopFactor(node);
  const label = `This runs ${loopMeta.iterations} times`;

  emitEvent(context, {
    lineNumber: node.lineNumber || null,
    event: "enter_loop",
    loopType: node.type === "WhileStatement" ? "while" : "for",
    depth,
    iterations: loopMeta.iterations,
    title: "We start a loop",
    description: describeLoop(node, loopMeta),
    visual: loopVisual(depth),
    animation: {
      type: "highlight_line",
      duration: 500,
    },
  });

  emitEvent(context, {
    lineNumber: node.lineNumber || null,
    event: "show_loop_box",
    loopType: node.type === "WhileStatement" ? "while" : "for",
    depth,
    iterations: loopMeta.iterations,
    label,
    title: `Loop ${ordinal}`,
    visual: {
      ...loopVisual(depth),
      highlight: true,
      blockType: "loop_box",
    },
    animation: {
      type: "expand_box",
    },
  });

  const nestedTerms = analyzeStatements(node.body || [], context, depth + 1, state);
  const bodyTerm = nestedTerms.length ? dominantTerm(nestedTerms) : createBaseTerm();
  const loopCost = multiplyTerms(loopMeta.term, bodyTerm);

  emitEvent(context, {
    lineNumber: node.lineNumber || null,
    event: "calculate_loop_cost",
    loopType: node.type === "WhileStatement" ? "while" : "for",
    depth,
    iterations: loopMeta.iterations,
    formula: `${loopMeta.iterations} × ${termToAsymptotic(bodyTerm)}`,
    result: termToAsymptotic(loopCost),
    title: "Loop work",
    visual: {
      ...loopVisual(depth),
      highlight: true,
      blockType: "calculation",
    },
    animation: {
      type: "fade_in_text",
      duration: 320,
    },
  });

  return loopCost;
}

function buildConditionTimeline(node, context, depth, state) {
  context.conditionOrdinalByDepth[depth] = (context.conditionOrdinalByDepth[depth] || 0) + 1;
  const ordinal = context.conditionOrdinalByDepth[depth];

  emitEvent(context, {
    lineNumber: node.lineNumber || null,
    event: "enter_condition",
    depth,
    title: conditionTitle(depth, ordinal),
    description: describeCondition(node),
    visual: {
      level: depth,
      color: "amber",
    },
    animation: {
      type: "highlight_line",
      duration: 420,
    },
  });

  emitEvent(context, {
    lineNumber: node.lineNumber || null,
    event: "show_condition_box",
    depth,
    label: "branch decision",
    title: conditionTitle(depth, ordinal),
    visual: {
      level: depth,
      color: "amber",
      highlight: true,
      blockType: "condition_box",
    },
    animation: {
      type: "expand_box",
    },
  });

  const consequentTerms = analyzeStatements(node.consequent || [], context, depth + 1, state);
  const alternateTerms = analyzeStatements(node.alternate || [], context, depth + 1, state);
  const branchTerm = dominantTerm([
    ...(consequentTerms.length ? consequentTerms : [createBaseTerm()]),
    ...(alternateTerms.length ? alternateTerms : [createBaseTerm()]),
  ]);

  emitEvent(context, {
    lineNumber: node.lineNumber || null,
    event: "calculate_condition_cost",
    depth,
    formula: `max(${formulaFromTerms(consequentTerms || [createBaseTerm()])}, ${formulaFromTerms(alternateTerms || [createBaseTerm()])})`,
    result: termToAsymptotic(branchTerm),
    title: `${conditionTitle(depth, ordinal)} Cost`,
    visual: {
      level: depth,
      color: "amber",
      highlight: true,
      blockType: "calculation",
    },
    animation: {
      type: "fade_in_text",
      duration: 300,
    },
  });

  return branchTerm;
}

function analyzeStatements(statements, context, depth, state) {
  const terms = [];

  for (const statement of statements || []) {
    if (!statement || typeof statement !== "object") continue;

    if (statement.type === "ForStatement" || statement.type === "WhileStatement") {
      terms.push(buildLoopTimeline(statement, context, depth, state));
      continue;
    }

    if (statement.type === "IfStatement") {
      terms.push(buildConditionTimeline(statement, context, depth, state));
      continue;
    }

    if (statement.type === "FunctionDeclaration") {
      continue;
    }

    const calls = collectCalls(statement);
    for (const call of calls) {
      const fnName = call.name;
      if (!fnName || !state.functionMap.has(fnName)) continue;

      const fnNode = state.functionMap.get(fnName);

      emitEvent(context, {
        lineNumber: call.lineNumber || statement.lineNumber || fnNode?.lineNumber || null,
        event: "enter_function",
        depth,
        title: `Enter ${fnName}()`,
        description: `Control moves into ${fnName}().`,
        snippet: fnName,
        visual: {
          level: depth,
          color: "cyan",
          highlight: true,
          blockType: "function_call",
        },
        animation: {
          type: "highlight_line",
          duration: 320,
        },
      });

      if (state.callStack.includes(fnName)) {
        emitEvent(context, {
          lineNumber: call.lineNumber || statement.lineNumber || null,
          event: "recursive_call",
          depth,
          title: `Recursive call to ${fnName}()`,
          description: `Recursion detected, so we count this self-call as part of the larger pattern for ${fnName}().`,
          snippet: fnName,
          visual: {
            level: depth,
            color: "cyan",
            highlight: true,
            blockType: "function_call",
          },
          animation: {
            type: "fade_in_text",
            duration: 220,
          },
        });
        terms.push(createBaseTerm(1, 0, 1));
      } else {
        const nestedState = {
          ...state,
          callStack: [...state.callStack, fnName],
          currentFunction: fnName,
        };
        const fnTerms = analyzeStatements(fnNode.body || [], context, depth + 1, nestedState);
        const functionBodyTerm = dominantTerm(fnTerms.length ? fnTerms : [createBaseTerm()]);
        const selfCallCount = countSelfCalls(fnNode.body || [], fnName);
        terms.push(summarizeRecursiveFunction(functionBodyTerm, selfCallCount));
      }

      emitEvent(context, {
        lineNumber: call.lineNumber || statement.lineNumber || fnNode?.lineNumber || null,
        event: "return_function",
        depth,
        title: `Return to ${state.currentFunction || "caller"}()`,
        description: `Control returns to ${state.currentFunction || "caller"}().`,
        snippet: state.currentFunction || "caller",
        visual: {
          level: depth,
          color: "cyan",
          highlight: true,
          blockType: "function_return",
        },
        animation: {
          type: "highlight_line",
          duration: 280,
        },
      });
    }

    emitEvent(context, {
      lineNumber: statement.lineNumber || null,
      event: "show_statement",
      depth,
      title: statement.type || "statement",
      description: describeStatementFromSnippet(statement),
      snippet: getSnippetText(statement),
      visual: {
        level: depth,
        color: "slate",
        highlight: false,
        blockType: "statement",
      },
      animation: {
        type: "highlight_line",
        duration: 240,
      },
    });

    terms.push(createBaseTerm());
  }

  return terms;
}

function buildSummaryTimeline(context, finalTerm, terms) {
  emitEvent(context, {
    lineNumber: null,
    event: "show_calculation",
    depth: 0,
    title: "Total Operations",
    formula: formulaFromTerms(terms),
    result: termToAsymptotic(finalTerm),
    description: "Combine nested and sequential contributions into a final Big-O result.",
    visual: {
      level: 0,
      highlight: true,
      color: "slate",
      blockType: "summary",
    },
    animation: {
      type: "fade_in_text",
      duration: 500,
    },
  });
}

export function buildTimeComplexityTimeline(parsedRepresentation) {
  const program = normalizeInput(parsedRepresentation);
  const context = createTimelineContext();
  const functionMap = getFunctionMap(program);
  const entryFunctionName = getEntryFunctionName(program, functionMap);

  if (entryFunctionName) {
    const entryNode = functionMap.get(entryFunctionName);
    emitEvent(context, {
      lineNumber: entryNode?.lineNumber || 1,
      event: "enter_function",
      depth: 1,
      title: `Start in ${entryFunctionName}()`,
      description: `Execution starts in ${entryFunctionName}().`,
      snippet: entryFunctionName,
      visual: {
        level: 1,
        color: "cyan",
        highlight: true,
        blockType: "function_call",
      },
      animation: {
        type: "highlight_line",
        duration: 320,
      },
    });
  }

  const terms = entryFunctionName
    ? analyzeStatements(functionMap.get(entryFunctionName)?.body || [], context, 1, {
        functionMap,
        callStack: [entryFunctionName],
        currentFunction: entryFunctionName,
      })
    : analyzeStatements(
        (program.body || []).filter((node) => node?.type !== "FunctionDeclaration"),
        context,
        1,
        {
          functionMap,
          callStack: ["<global>"],
          currentFunction: "global",
        },
      );

  if (entryFunctionName) {
    emitEvent(context, {
      lineNumber: functionMap.get(entryFunctionName)?.lineNumber || 1,
      event: "return_function",
      depth: 1,
      title: `Exit ${entryFunctionName}()`,
      description: `Execution returns after finishing ${entryFunctionName}().`,
      snippet: entryFunctionName,
      visual: {
        level: 1,
        color: "cyan",
        highlight: true,
        blockType: "function_return",
      },
      animation: {
        type: "highlight_line",
        duration: 280,
      },
    });
  }

  const effectiveTerms = terms.length ? terms : [createBaseTerm()];
  const finalTerm = dominantTerm(effectiveTerms);

  buildSummaryTimeline(context, finalTerm, effectiveTerms);

  const events = context.events;
  const byId = new Map(events.map((event) => [event.stepId, event]));

  return {
    steps: events,
    finalComplexity: toBigO(finalTerm),
    metadata: {
      totalSteps: events.length,
      dominantTerm: termToAsymptotic(finalTerm),
      eventCount: events.length,
    },
    getNextStep(currentId) {
      return getNextStep(events, currentId);
    },
    getPreviousStep(currentId) {
      return getPreviousStep(events, currentId);
    },
    getStepById(id) {
      return byId.get(id) || null;
    },
  };
}

export function getNextStep(steps, currentId) {
  const sorted = [...(steps || [])].sort((a, b) => a.stepId - b.stepId);
  if (!sorted.length) return null;

  if (currentId === null || typeof currentId === "undefined") {
    return sorted[0];
  }

  const idx = sorted.findIndex((step) => step.stepId === currentId);
  if (idx === -1 || idx >= sorted.length - 1) return null;
  return sorted[idx + 1];
}

export function getPreviousStep(steps, currentId) {
  const sorted = [...(steps || [])].sort((a, b) => a.stepId - b.stepId);
  if (!sorted.length || currentId === null || typeof currentId === "undefined") {
    return null;
  }

  const idx = sorted.findIndex((step) => step.stepId === currentId);
  if (idx <= 0) return null;
  return sorted[idx - 1];
}
