function evalBinary(op, left, right) {
  switch (op) {
    case "+":
      return left + right;
    case "-":
      return left - right;
    case "*":
      return left * right;
    case "/":
      return left / right;
    case "//":
      if (right === 0) return Infinity;
      return Math.trunc(left / right);
    case "%":
      return left % right;
    case "<":
      return left < right;
    case "<=":
      return left <= right;
    case ">":
      return left > right;
    case ">=":
      return left >= right;
    case "==":
      return left == right;
    case "===":
      return left === right;
    case "!=":
      return left != right;
    case "!==":
      return left !== right;
    case "&&":
      return Boolean(left && right);
    case "||":
      return Boolean(left || right);
    default:
      throw new Error(`Unsupported binary operator: ${op}`);
  }
}

export function evaluateExpression(node, ctx, simulateCall) {
  if (node === null || node === undefined) return undefined;

  switch (node.type) {
    case "Literal":
      return node.value;

    case "Identifier":
      return ctx.memory.dereference(ctx.resolveVariable(node.name));

    case "ArrayExpression":
      return (node.elements || []).map((el) => evaluateExpression(el, ctx, simulateCall));

    case "ObjectExpression": {
      const out = {};
      for (const prop of node.properties || []) {
        out[prop.key] = evaluateExpression(prop.value, ctx, simulateCall);
      }
      return out;
    }

    case "BinaryExpression": {
      const left = evaluateExpression(node.left, ctx, simulateCall);
      const right = evaluateExpression(node.right, ctx, simulateCall);
      return evalBinary(node.operator, left, right);
    }

    case "UnaryExpression": {
      const value = evaluateExpression(node.argument, ctx, simulateCall);
      if (node.operator === "!") return !value;
      if (node.operator === "-") return -value;
      if (node.operator === "+") return +value;
      throw new Error(`Unsupported unary operator: ${node.operator}`);
    }

    case "CallExpression":
      return simulateCall(node);

    default:
      throw new Error(`Unsupported expression type: ${node.type}`);
  }
}
