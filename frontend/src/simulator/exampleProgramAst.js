export const exampleProgramAst = {
  type: "Program",
  body: [
    {
      type: "FunctionDeclaration",
      name: "main",
      params: [],
      lineNumber: 1,
      body: [
        {
          type: "VariableDeclaration",
          name: "num",
          lineNumber: 2,
          value: { type: "Literal", value: 107962 },
        },
        {
          type: "VariableDeclaration",
          name: "revNum",
          lineNumber: 3,
          value: null,
        },
        {
          type: "WhileStatement",
          lineNumber: 4,
          test: {
            type: "BinaryExpression",
            operator: "!=",
            left: { type: "Identifier", name: "num" },
            right: { type: "Literal", value: 0 },
          },
          body: [
            {
              type: "Assignment",
              lineNumber: 5,
              name: "revNum",
              value: {
                type: "BinaryExpression",
                operator: "%",
                left: { type: "Identifier", name: "num" },
                right: { type: "Literal", value: 10 },
              },
            },
            {
              type: "ExpressionStatement",
              lineNumber: 6,
              expression: { type: "Identifier", name: "revNum" },
            },
            {
              type: "Assignment",
              lineNumber: 7,
              name: "num",
              value: {
                type: "BinaryExpression",
                operator: "//",
                left: { type: "Identifier", name: "num" },
                right: { type: "Literal", value: 10 },
              },
            },
          ],
        },
        {
          type: "ReturnStatement",
          lineNumber: 9,
          argument: { type: "Identifier", name: "revNum" },
        },
      ],
    },
  ],
};
