import { ExecutionContext } from "./executionContext.js";
import { evaluateExpression } from "./expressionEvaluator.js";
import { OperationCounter } from "./operationCounter.js";
import { createStatementHandlers } from "./statementHandlers.js";

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildStep(ctx, counter, lineNumber, operation, extra = {}) {
  const stack = ctx.stackSnapshot();
  const heap = ctx.memory.snapshot();
  const variables = ctx.resolvedVariablesSnapshot();

  return {
    lineNumber,
    operation,
    variables,
    memory: {
      stack,
      heap,
      usage: ctx.memory.usage(stack),
    },
    operationCount: counter.snapshot().total,
    ...extra,
  };
}

export function simulateExecution(ast, options = {}) {
  if (!ast || ast.type !== "Program" || !Array.isArray(ast.body)) {
    throw new Error("Input AST must be a Program node with a body array.");
  }

  const loopLimit = options.loopLimit ?? 10_000;
  const entryFunction = options.entryFunction || "main";

  const ctx = new ExecutionContext();
  const counter = new OperationCounter();
  const steps = [];

  const emitStep = (lineNumber, operation, extra = {}) => {
    steps.push(buildStep(ctx, counter, lineNumber, operation, extra));
  };

  ctx.registerFunctions(ast);

  let handlers;

  function executeBlock(body = []) {
    for (const stmt of body) {
      const result = handlers.executeStatement(stmt);
      if (result?.didReturn) return result;
    }
    return { didReturn: false, returnValue: undefined };
  }

  function simulateCall(callNode) {
    const fnName = callNode.callee?.name || callNode.name;
    const fnNode = ctx.functions.get(fnName);
    if (!fnNode) {
      throw new Error(`Function '${fnName}' is not declared in AST.`);
    }

    const args = (callNode.arguments || []).map((argNode) =>
      evaluateExpression(argNode, ctx, simulateCall),
    );

    const params = {};
    for (let i = 0; i < (fnNode.params || []).length; i += 1) {
      const param = fnNode.params[i];
      params[param] = args[i];
    }

    counter.bump("call");
    ctx.pushFrame(fnName, fnNode.lineNumber, params);
    emitStep(callNode.lineNumber || fnNode.lineNumber, "call", { function: fnName });

    const result = executeBlock(fnNode.body || []);

    counter.bump("return");
    emitStep(callNode.lineNumber || fnNode.lineNumber, "return", {
      function: fnName,
      returnValue: result.returnValue,
    });
    ctx.popFrame();

    return result.returnValue;
  }

  handlers = createStatementHandlers({
    ctx,
    counter,
    emitStep,
    executeBlock,
    simulateCall,
    loopLimit,
  });

  if (ctx.functions.has(entryFunction)) {
    simulateCall({
      type: "CallExpression",
      lineNumber: 1,
      callee: { name: entryFunction },
      arguments: [],
    });
  } else {
    ctx.pushFrame("global", 1, {});
    executeBlock(ast.body.filter((node) => node.type !== "FunctionDeclaration"));
    ctx.popFrame();
  }

  const operationStats = counter.snapshot();
  const maxMemoryUnits = steps.reduce(
    (acc, step) => Math.max(acc, step.memory.usage.totalMemoryUnits),
    0,
  );
  const maxMemoryBytes = steps.reduce(
    (acc, step) => Math.max(acc, step.memory.usage.totalBytes || 0),
    0,
  );

  return {
    steps: deepClone(steps),
    summary: {
      totalOperations: operationStats.total,
      operationBreakdown: operationStats.breakdown,
      maxMemoryUnits,
      maxMemoryBytes,
      totalSteps: steps.length,
    },
  };
}
