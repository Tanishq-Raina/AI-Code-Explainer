Simulation Engine (AST-driven)

Purpose
- Simulate execution line by line from a normalized AST.
- Emit deterministic step snapshots for visualization and complexity analysis.
- Do not run real user code.

Entry point
- simulateExecution(ast, options) from ./index.js
- buildTimeComplexityTimeline(parsedRepresentation) from ./index.js

Input AST contract
- Program: { type: "Program", body: Node[] }
- FunctionDeclaration: { type, name, params: string[], lineNumber, body: Node[] }
- VariableDeclaration: { type, name, lineNumber, value: Expression }
- Assignment: { type, name, lineNumber, value: Expression }
- IfStatement: { type, lineNumber, test: Expression, consequent: Node[], alternate: Node[] }
- ForStatement: { type, lineNumber, init: Node, test: Expression, update: Node, body: Node[] }
- WhileStatement: { type, lineNumber, test: Expression, body: Node[] }
- UpdateExpression: { type, operator: "++" | "--", name, lineNumber }
- ReturnStatement: { type, lineNumber, argument: Expression }
- ExpressionStatement: { type, lineNumber, expression: Expression }
- CallExpression statement form: { type: "CallExpression", name or callee.name, lineNumber, arguments }

Expression support
- Literal
- Identifier
- BinaryExpression (+, -, *, /, %, <, <=, >, >=, ==, ===, !=, !==, &&, ||)
- UnaryExpression (!, -, +)
- ArrayExpression
- ObjectExpression
- CallExpression

Output
- returns { steps, summary }
- step shape:
  {
    lineNumber,
    operation,
    variables,
    memory: {
      stack,
      heap,
      usage
    },
    operationCount,
    ...extra
  }

Memory shape details
- stack frame:
  {
    function,
    name,
    lineNumber,
    variables,
    rawVariables,
    bytes
  }
- heap item:
  {
    id,
    type,
    size,
    value,
    lineNumber,
    bytes
  }
- usage:
  {
    stackVariables,
    heapObjects,
    arrayCells,
    totalMemoryUnits,
    stackBytes,
    heapBytes,
    totalBytes
  }

Notes
- Function calls push/pop stack frames.
- Arrays/objects are stored in simulated heap by reference id.
- Scalars are stored directly in stack frame variables.
- Approximate byte estimation is included for each stack frame and heap item.
- Loops are protected by loopLimit (default 10000) to prevent runaway simulation.

Time complexity visualization module
- Input can be Program AST or parsed loop representation with nested bodies.
- Output includes:
  - steps: sequential animation timeline events
  - finalComplexity: dominant Big-O term
  - metadata: summary fields for UI labels
- Timeline event shape:
  {
    stepId,
    lineNumber,
    event,
    loopType,
    depth,
    iterations,
    label,
    description,
    formula,
    result,
    animation: { type, duration },
    visual: { level, color, highlight, blockType }
  }
- Supported event types include:
  - enter_loop
  - show_loop_box
  - calculate_loop_cost
  - enter_condition
  - show_condition_box
  - calculate_condition_cost
  - show_statement
  - show_calculation
- Helpers:
  - getNextStep(steps, currentId)
  - getPreviousStep(steps, currentId)
