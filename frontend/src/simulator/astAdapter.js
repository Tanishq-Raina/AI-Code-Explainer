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
    snippet: node.snippet || "",
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

  const conditionNode = children.find((child) =>
    ["binary_expression", "comparison_operator", "parenthesized_expression"].includes(child.type),
  );

  const snippet = String(node.snippet || "");
  let update = null;
  const updateVarMatch = snippet.match(/;\s*([A-Za-z_][A-Za-z0-9_$]*)\s*(\+\+|--)/);
  if (updateVarMatch) {
    update = {
      type: "UpdateExpression",
      operator: updateVarMatch[2],
      name: updateVarMatch[1],
      lineNumber: node.line || null,
    };
  } else if (snippet.includes("++")) {
    update = { type: "UpdateExpression", operator: "++", name: "loopVar", lineNumber: node.line || null };
  } else if (snippet.includes("--")) {
    update = { type: "UpdateExpression", operator: "--", name: "loopVar", lineNumber: node.line || null };
  }

  return {
    type: node.type === "while_statement" ? "WhileStatement" : "ForStatement",
    lineNumber: node.line || null,
    snippet: node.snippet || "",
    test: expressionFromSnippet(conditionNode?.snippet || "", node.line || null),
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
        snippet: node.snippet || "",
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
      snippet: decl.snippet || node.snippet || "",
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
      snippet: text,
      value: expressionFromSnippet(rhs, lineNumber),
    };
  }

  return {
    type: "Assignment",
    name,
    lineNumber,
    snippet: text,
    value: expressionFromSnippet(rhs, lineNumber),
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
    snippet: node.snippet || "",
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
    snippet: fnNode.snippet || "",
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
