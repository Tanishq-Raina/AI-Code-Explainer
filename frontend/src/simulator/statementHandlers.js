import { evaluateExpression } from "./expressionEvaluator.js";

function asStoredValue(value, ctx, lineNumber) {
  if (Array.isArray(value)) {
    return ctx.memory.allocArray(value, lineNumber);
  }
  if (value && typeof value === "object") {
    return ctx.memory.allocObject(value, lineNumber);
  }
  return value;
}

export function createStatementHandlers(runtime) {
  const { ctx, counter, emitStep, executeBlock, simulateCall, loopLimit } = runtime;

  function handleVariableDeclaration(node) {
    const rawValue = evaluateExpression(node.value, ctx, simulateCall);
    const stored = asStoredValue(rawValue, ctx, node.lineNumber);
    ctx.setVariable(node.name, stored);
    counter.bump("declaration");
    emitStep(node.lineNumber, "declaration");
  }

  function handleAssignment(node) {
    const rawValue = evaluateExpression(node.value, ctx, simulateCall);
    const current = ctx.resolveVariable(node.name);

    if (current && typeof current === "object" && "ref" in current && Array.isArray(rawValue)) {
      ctx.memory.updateRef(current.ref, rawValue);
      ctx.setVariable(node.name, current);
    } else if (
      current &&
      typeof current === "object" &&
      "ref" in current &&
      rawValue &&
      typeof rawValue === "object"
    ) {
      ctx.memory.updateRef(current.ref, rawValue);
      ctx.setVariable(node.name, current);
    } else {
      ctx.setVariable(node.name, asStoredValue(rawValue, ctx, node.lineNumber));
    }

    counter.bump("assignment");
    emitStep(node.lineNumber, "assignment");
  }

  function handleIfStatement(node) {
    const test = evaluateExpression(node.test, ctx, simulateCall);
    counter.bump("condition");
    emitStep(node.lineNumber, "condition", { branch: test ? "if" : "else" });

    if (test) {
      executeBlock(node.consequent || []);
    } else {
      executeBlock(node.alternate || []);
    }
  }

  function handleForStatement(node) {
    if (node.init) {
      executeStatement(node.init);
    }

    let iteration = 0;
    while (true) {
      if (iteration > loopLimit) {
        throw new Error(`Loop exceeded limit ${loopLimit} at line ${node.lineNumber}.`);
      }

      const condition = node.test ? evaluateExpression(node.test, ctx, simulateCall) : true;
      counter.bump("condition");
      emitStep(node.lineNumber, "condition", { loopType: "for", iteration });

      if (!condition) break;

      counter.bump("loop");
      emitStep(node.lineNumber, "loop", { loopType: "for", iteration });

      executeBlock(node.body || []);

      if (node.update) {
        executeStatement(node.update);
      }

      iteration += 1;
    }
  }

  function handleWhileStatement(node) {
    let iteration = 0;

    while (true) {
      if (iteration > loopLimit) {
        throw new Error(`Loop exceeded limit ${loopLimit} at line ${node.lineNumber}.`);
      }

      const condition = evaluateExpression(node.test, ctx, simulateCall);
      counter.bump("condition");
      emitStep(node.lineNumber, "condition", { loopType: "while", iteration });

      if (!condition) break;

      counter.bump("loop");
      emitStep(node.lineNumber, "loop", { loopType: "while", iteration });
      executeBlock(node.body || []);
      iteration += 1;
    }
  }

  function handleExpressionStatement(node) {
    evaluateExpression(node.expression, ctx, simulateCall);
    counter.bump("expression");
    emitStep(node.lineNumber, "expression");
  }

  function handleReturnStatement(node) {
    const value = evaluateExpression(node.argument, ctx, simulateCall);
    counter.bump("return");
    emitStep(node.lineNumber, "return", { returnValue: value });
    return { didReturn: true, returnValue: value };
  }

  function executeStatement(node) {
    switch (node.type) {
      case "VariableDeclaration":
        handleVariableDeclaration(node);
        return { didReturn: false };

      case "Assignment":
        handleAssignment(node);
        return { didReturn: false };

      case "UpdateExpression": {
        const current = Number(ctx.memory.dereference(ctx.resolveVariable(node.name)) || 0);
        const nextValue = node.operator === "++" ? current + 1 : current - 1;
        ctx.setVariable(node.name, nextValue);
        counter.bump("update");
        emitStep(node.lineNumber, "update", { variable: node.name, value: nextValue });
        return { didReturn: false };
      }

      case "IfStatement":
        handleIfStatement(node);
        return { didReturn: false };

      case "ForStatement":
        handleForStatement(node);
        return { didReturn: false };

      case "WhileStatement":
        handleWhileStatement(node);
        return { didReturn: false };

      case "ExpressionStatement":
        handleExpressionStatement(node);
        return { didReturn: false };

      case "CallExpression":
        simulateCall(node);
        counter.bump("call");
        emitStep(node.lineNumber, "call");
        return { didReturn: false };

      case "ReturnStatement":
        return handleReturnStatement(node);

      default:
        throw new Error(`Unsupported statement type: ${node.type}`);
    }
  }

  return {
    executeStatement,
  };
}
