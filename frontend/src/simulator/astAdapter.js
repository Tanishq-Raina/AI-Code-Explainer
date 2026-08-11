function findNodes(root, predicate, result = []) {
  if (!root || typeof root !== "object") return result;
  if (predicate(root)) result.push(root);
  const children = Array.isArray(root.children) ? root.children : [];
  for (const child of children) {
    findNodes(child, predicate, result);
  }
  return result;
}

function firstChild(node, type) {
  const children = Array.isArray(node?.children) ? node.children : [];
  return children.find((child) => child?.type === type) || null;
}

function cleanName(name) {
  return String(name || "").replace(/[^A-Za-z0-9_$]/g, "").trim();
}

function extractCallExpressions(snippet, lineNumber) {
  const text = String(snippet || "");
  const calls = [];
  const callRegex = /([A-Za-z_][A-Za-z0-9_$]*)\s*\(/g;
  const keywords = new Set([
    "if",
    "for",
    "while",
    "switch",
    "catch",
    "return",
    "new",
    "throw",
    "try",
    "super",
  ]);

  let match;
  while ((match = callRegex.exec(text)) !== null) {
    const name = cleanName(match[1]);
    if (!name || keywords.has(name)) continue;
    calls.push({
      type: "CallExpression",
      lineNumber,
      callee: { name },
      arguments: [],
    });
  }

  return calls;
}

function expressionFromSnippet(snippet, lineNumber) {
  const text = String(snippet || "").trim();
  if (!text) return null;

  const calls = extractCallExpressions(text, lineNumber);
  if (calls.length === 1) return calls[0];
  if (calls.length > 1) {
    return {
      type: "CompositeExpression",
      items: calls,
    };
  }

  if (/^\d+$/.test(text)) {
    return { type: "Literal", value: Number(text) };
  }

  if (/^".*"$/.test(text) || /^'.*'$/.test(text)) {
    return { type: "Literal", value: text.slice(1, -1) };
  }

  if (/^[A-Za-z_][A-Za-z0-9_$]*$/.test(text)) {
    return { type: "Identifier", name: text };
  }

  // Parse binary expressions: "a * 2", "n / 2", "i + 1", "x - 1", etc.
  const binMatch = text.match(
    /^([A-Za-z_][A-Za-z0-9_$]*)\s*([+\-*/%])\s*(\d+|[A-Za-z_][A-Za-z0-9_$]*)$/
  );
  if (binMatch) {
    const leftName = binMatch[1];
    const op = binMatch[2];
    const rightRaw = binMatch[3];
    const rightIsNum = /^\d+$/.test(rightRaw);
    return {
      type: "BinaryExpression",
      operator: op,
      left: { type: "Identifier", name: leftName },
      right: rightIsNum
        ? { type: "Literal", value: Number(rightRaw) }
        : { type: "Identifier", name: rightRaw },
    };
  }

  // Parse reversed binary: "2 * n", "1 + i"
  const binMatchReversed = text.match(
    /^(\d+)\s*([+\-*/%])\s*([A-Za-z_][A-Za-z0-9_$]*)$/
  );
  if (binMatchReversed) {
    const leftVal = Number(binMatchReversed[1]);
    const op = binMatchReversed[2];
    const rightName = binMatchReversed[3];
    return {
      type: "BinaryExpression",
      operator: op,
      left: { type: "Literal", value: leftVal },
      right: { type: "Identifier", name: rightName },
    };
  }

  // Parse parenthesized binary divided/multiplied: "(a + b) / 2", "(x + y) * 3"
  const parenBinMatch = text.match(
    /^\(([^)]+)\)\s*([+\-*/%])\s*(\d+|[A-Za-z_][A-Za-z0-9_$]*)$/
  );
  if (parenBinMatch) {
    const innerExpr = parenBinMatch[1].trim();
    const op = parenBinMatch[2];
    const rightRaw = parenBinMatch[3];
    const rightIsNum = /^\d+$/.test(rightRaw);
    return {
      type: "BinaryExpression",
      operator: op,
      left: expressionFromSnippet(innerExpr, lineNumber) || { type: "Identifier", name: innerExpr },
      right: rightIsNum
        ? { type: "Literal", value: Number(rightRaw) }
        : { type: "Identifier", name: rightRaw },
    };
  }

  // Parse comparison expressions: "i < n", "low <= high"
  const cmpMatch = text.match(
    /^([A-Za-z_][A-Za-z0-9_$]*)\s*(<=?|>=?|==|!=)\s*(\d+|[A-Za-z_][A-Za-z0-9_$.]*(?:\.\w+)*)$/
  );
  if (cmpMatch) {
    const leftName = cmpMatch[1];
    const op = cmpMatch[2];
    const rightRaw = cmpMatch[3];
    const rightIsNum = /^\d+$/.test(rightRaw);
    return {
      type: "BinaryExpression",
      operator: op,
      left: { type: "Identifier", name: leftName },
      right: rightIsNum
        ? { type: "Literal", value: Number(rightRaw) }
        : { type: "Identifier", name: rightRaw },
    };
  }

  return null;
}

function parseBodyNode(node, language) {
  if (!node) return [];
  if (node.type === "block") {
    const children = Array.isArray(node.children) ? node.children : [];
    return children.flatMap((child) => parseStatementNode(child, language));
  }
  return parseStatementNode(node, language);
}

function parseIfStatement(node, language) {
  const children = Array.isArray(node.children) ? node.children : [];
  const elseClause = children.find((child) => child.type === "else_clause") || null;

  const conditionNode =
    children.find((child) => child.type === "parenthesized_expression") ||
    children.find((child) => child.type === "comparison_operator") ||
    null;

  const possibleBodies = children.filter((child) =>
    [
      "block",
      "expression_statement",
      "if_statement",
      "for_statement",
      "while_statement",
      "return_statement",
      "assignment",
      "augmented_assignment",
      "local_variable_declaration",
    ].includes(child.type),
  );

  let consequentNode = possibleBodies[0] || null;
  if (!consequentNode && elseClause) {
    const index = children.indexOf(elseClause);
    consequentNode = children[index - 1] || null;
  }

  const alternateNode = elseClause
    ? (elseClause.children || []).find((child) => child.type !== "else") || null
    : null;

  return {
    type: "IfStatement",
    lineNumber: node.line || null,
    test: expressionFromSnippet(conditionNode?.snippet || "", node.line || null),
    consequent: parseBodyNode(consequentNode, language),
    alternate: parseBodyNode(alternateNode, language),
  };
}

function parseForStatement(node, language) {
  const children = Array.isArray(node.children) ? node.children : [];
  const bodyNode = [...children]
    .reverse()
    .find((child) => ["block", "expression_statement", "if_statement", "for_statement", "while_statement", "return_statement"].includes(child.type));

  // For while loops, the condition is typically inside a parenthesized_expression
  // For for loops, it can be a binary_expression directly
  let conditionNode = children.find((child) =>
    ["binary_expression", "comparison_operator"].includes(child.type),
  );

  // If not found directly, look inside parenthesized_expression
  if (!conditionNode) {
    const parenNode = children.find((child) => child.type === "parenthesized_expression");
    if (parenNode) {
      const parenChildren = Array.isArray(parenNode.children) ? parenNode.children : [];
      conditionNode = parenChildren.find((child) =>
        ["binary_expression", "comparison_operator"].includes(child.type),
      );
      // If still not found, use the parenthesized_expression snippet itself
      if (!conditionNode) {
        conditionNode = parenNode;
      }
    }
  }

  // Extract the condition snippet, stripping outer parentheses if present
  let conditionSnippet = conditionNode?.snippet || "";
  if (conditionSnippet.startsWith("(") && conditionSnippet.endsWith(")")) {
    conditionSnippet = conditionSnippet.slice(1, -1).trim();
  }

  const snippet = String(node.snippet || "");
  let update = null;

  // Only extract update expressions for for-loops (not while loops).
  // While loops have their iteration logic in the body, which inferLoopFactor reads.
  const isWhile = node.type === "while_statement";

  if (!isWhile) {
    const updateVarMatch = snippet.match(/;\s*([A-Za-z_][A-Za-z0-9_$]*)\s*(\+\+|--)/);
    if (updateVarMatch) {
      update = {
        type: "UpdateExpression",
        operator: updateVarMatch[2],
        name: updateVarMatch[1],
        lineNumber: node.line || null,
      };
    } else {
      // Detect compound assignment updates: j *= 2, j /= 2
      const compoundMatch = snippet.match(/;\s*([A-Za-z_][A-Za-z0-9_$]*)\s*(\*=|\/=)\s*(\d+)/);
      if (compoundMatch) {
        update = {
          type: "Assignment",
          operator: compoundMatch[2],
          name: compoundMatch[1],
          lineNumber: node.line || null,
          value: {
            type: "BinaryExpression",
            operator: compoundMatch[2] === "*=" ? "*" : "/",
            left: { type: "Identifier", name: compoundMatch[1] },
            right: { type: "Literal", value: Number(compoundMatch[3]) },
          },
        };
      } else {
        // Detect assignment updates: j = j * 2, j = j / 2
        const assignUpdateMatch = snippet.match(
          /;\s*([A-Za-z_][A-Za-z0-9_$]*)\s*=\s*([A-Za-z_][A-Za-z0-9_$]*)\s*([+\-*/])\s*(\d+)/
        );
        if (assignUpdateMatch) {
          const lhs = assignUpdateMatch[1];
          const rhsVar = assignUpdateMatch[2];
          const op = assignUpdateMatch[3];
          const rhsNum = Number(assignUpdateMatch[4]);
          update = {
            type: "Assignment",
            name: lhs,
            lineNumber: node.line || null,
            value: {
              type: "BinaryExpression",
              operator: op,
              left: { type: "Identifier", name: rhsVar },
              right: { type: "Literal", value: rhsNum },
            },
          };
        } else if (snippet.includes("++")) {
          update = { type: "UpdateExpression", operator: "++", name: "loopVar", lineNumber: node.line || null };
        } else if (snippet.includes("--")) {
          update = { type: "UpdateExpression", operator: "--", name: "loopVar", lineNumber: node.line || null };
        }
      }
    }
  }

  return {
    type: node.type === "while_statement" ? "WhileStatement" : "ForStatement",
    lineNumber: node.line || null,
    test: expressionFromSnippet(conditionSnippet, node.line || null),
    update,
    body: parseBodyNode(bodyNode, language),
  };
}

function parseVariableDeclaration(node) {
  const declarators = findNodes(node, (child) => child.type === "variable_declarator");
  if (!declarators.length) {
    const match = String(node.snippet || "").match(/([A-Za-z_][A-Za-z0-9_$]*)\s*=\s*(.+)$/);
    if (!match) return [];
    const name = cleanName(match[1]);
    const valueSnippet = match[2] || "";
    return [
      {
        type: "VariableDeclaration",
        name,
        lineNumber: node.line || null,
        value: expressionFromSnippet(valueSnippet, node.line || null),
      },
    ];
  }

  return declarators.map((decl) => {
    const match = String(decl.snippet || "").match(/^\s*([A-Za-z_][A-Za-z0-9_$]*)\s*(?:=\s*(.+))?$/);
    const name = cleanName(match?.[1] || "");
    const valueSnippet = match?.[2] || "";
    return {
      type: "VariableDeclaration",
      name,
      lineNumber: decl.line || node.line || null,
      value: expressionFromSnippet(valueSnippet, decl.line || node.line || null),
    };
  });
}

function parseAssignmentFromSnippet(snippet, lineNumber) {
  const text = String(snippet || "").trim();
  if (!text) return null;

  const updateMatch = text.match(/^([A-Za-z_][A-Za-z0-9_$]*)\s*(\+\+|--)$/);
  if (updateMatch) {
    return {
      type: "UpdateExpression",
      operator: updateMatch[2],
      name: updateMatch[1],
      lineNumber,
    };
  }

  const assignMatch = text.match(/^([A-Za-z_][A-Za-z0-9_$]*)\s*([+\-*/]?=)\s*(.+)$/);
  if (!assignMatch) return null;

  const name = cleanName(assignMatch[1]);
  const operator = assignMatch[2];
  const rhs = assignMatch[3] || "";

  if (operator === "=") {
    return {
      type: "Assignment",
      name,
      lineNumber,
      value: expressionFromSnippet(rhs, lineNumber),
    };
  }

  // Compound assignments: +=, -=, *=, /=
  // Expand "x *= 2" into Assignment with BinaryExpression { x * 2 }
  const baseOp = operator.replace("=", "");
  return {
    type: "Assignment",
    name,
    operator,
    lineNumber,
    value: {
      type: "BinaryExpression",
      operator: baseOp,
      left: { type: "Identifier", name },
      right: expressionFromSnippet(rhs, lineNumber) || { type: "Literal", value: Number(rhs) || 0 },
    },
  };
}

function parseExpressionStatement(node) {
  const lineNumber = node.line || null;
  const text = String(node.snippet || "").replace(/;\s*$/, "").trim();

  const assignmentLike = parseAssignmentFromSnippet(text, lineNumber);
  if (assignmentLike) return [assignmentLike];

  const calls = extractCallExpressions(text, lineNumber);
  if (calls.length) {
    return calls.map((call) => ({
      type: "ExpressionStatement",
      lineNumber,
      expression: call,
    }));
  }

  return [
    {
      type: "ExpressionStatement",
      lineNumber,
      expression: expressionFromSnippet(text, lineNumber),
    },
  ];
}

function parseReturnStatement(node) {
  const text = String(node.snippet || "").trim();
  const match = text.match(/^return\s*(.*?);?$/);
  const valueSnippet = match?.[1] || "";
  return {
    type: "ReturnStatement",
    lineNumber: node.line || null,
    argument: expressionFromSnippet(valueSnippet, node.line || null),
  };
}

function parseStatementNode(node, language) {
  if (!node || typeof node !== "object") return [];

  switch (node.type) {
    case "block":
      return (Array.isArray(node.children) ? node.children : []).flatMap((child) =>
        parseStatementNode(child, language),
      );

    case "local_variable_declaration":
      return parseVariableDeclaration(node);

    case "assignment": {
      const statement = parseAssignmentFromSnippet(node.snippet || "", node.line || null);
      return statement ? [statement] : [];
    }

    case "variable_declarator":
      return parseVariableDeclaration(node);

    case "expression_statement":
      return parseExpressionStatement(node);

    case "assignment_expression": {
      const statement = parseAssignmentFromSnippet(node.snippet || "", node.line || null);
      return statement ? [statement] : [];
    }

    case "augmented_assignment": {
      const statement = parseAssignmentFromSnippet(node.snippet || "", node.line || null);
      return statement ? [statement] : [];
    }

    case "update_expression": {
      const update = parseAssignmentFromSnippet(node.snippet || "", node.line || null);
      return update ? [update] : [];
    }

    case "return_statement":
      return [parseReturnStatement(node)];

    case "if_statement":
      return [parseIfStatement(node, language)];

    case "for_statement":
    case "enhanced_for_statement":
    case "while_statement":
      return [parseForStatement(node, language)];

    case "do_statement":
      return [parseForStatement(node, language)];

    default: {
      const children = Array.isArray(node.children) ? node.children : [];
      if (!children.length) return [];
      return children.flatMap((child) => parseStatementNode(child, language));
    }
  }
}

function parseParams(snippet) {
  const text = String(snippet || "");
  const match = text.match(/\((.*)\)/);
  if (!match) return [];

  return match[1]
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const pieces = part.split(/\s+/);
      return cleanName(pieces[pieces.length - 1]);
    })
    .filter(Boolean);
}

function parseFunctionNode(fnNode) {
  const idNode = firstChild(fnNode, "identifier");
  const paramsNode = firstChild(fnNode, "formal_parameters") || firstChild(fnNode, "parameters");
  const bodyNode = firstChild(fnNode, "block");

  const fallbackNameMatch = String(fnNode?.snippet || "").match(/([A-Za-z_][A-Za-z0-9_$]*)\s*\(/);
  const name = cleanName(idNode?.snippet || fallbackNameMatch?.[1] || "");
  if (!name) return null;

  return {
    type: "FunctionDeclaration",
    name,
    params: parseParams(paramsNode?.snippet || ""),
    lineNumber: fnNode.line || null,
    body: parseBodyNode(bodyNode, ""),
  };
}

function convertPythonTopLevel(root) {
  const functions = (root.children || [])
    .filter((node) => node.type === "function_definition")
    .map((node) => parseFunctionNode(node))
    .filter(Boolean);

  const topLevel = (root.children || [])
    .filter((node) => node.type !== "function_definition")
    .flatMap((node) => parseStatementNode(node, "python"));

  return [...functions, ...topLevel];
}

function convertJavaTopLevel(root) {
  const methods = findNodes(
    root,
    (node) => node.type === "method_declaration" || node.type === "constructor_declaration",
  )
    .map((node) => parseFunctionNode(node))
    .filter(Boolean);

  return methods;
}

export function toSimulatorProgramAst(parsedPayload, language) {
  const lang = String(language || "").toLowerCase();
  const root = parsedPayload?.ast;

  if (!root || typeof root !== "object") {
    return { type: "Program", body: [] };
  }

  const body = lang === "python" ? convertPythonTopLevel(root) : convertJavaTopLevel(root);
  return {
    type: "Program",
    body,
  };
}
