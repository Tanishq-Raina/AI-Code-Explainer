import { MemoryTracker } from "./memoryTracker.js";

function clonePlain(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export class ExecutionContext {
  constructor() {
    this.frames = [];
    this.functions = new Map();
    this.memory = new MemoryTracker();
  }

  registerFunctions(ast) {
    const body = ast?.body || [];
    for (const node of body) {
      if (node?.type === "FunctionDeclaration") {
        this.functions.set(node.name, node);
      }
    }
  }

  pushFrame(name, lineNumber, params = {}) {
    const frame = {
      name,
      lineNumber,
      variables: { ...params },
    };
    this.frames.push(frame);
    return frame;
  }

  popFrame() {
    return this.frames.pop();
  }

  currentFrame() {
    return this.frames[this.frames.length - 1] || null;
  }

  setVariable(name, value) {
    const frame = this.currentFrame();
    if (!frame) {
      throw new Error("No active stack frame.");
    }
    frame.variables[name] = value;
  }

  resolveVariable(name) {
    for (let i = this.frames.length - 1; i >= 0; i -= 1) {
      if (name in this.frames[i].variables) {
        return this.frames[i].variables[name];
      }
    }
    return undefined;
  }

  stackSnapshot() {
    return this.frames.map((frame) => {
      const resolvedVariables = {};
      for (const [key, value] of Object.entries(frame.variables)) {
        resolvedVariables[key] = this.memory.dereference(value);
      }

      return {
        function: frame.name,
        name: frame.name,
        lineNumber: frame.lineNumber,
        variables: resolvedVariables,
        rawVariables: clonePlain(frame.variables),
        bytes: this.memory.estimateStackFrameBytes(frame),
      };
    });
  }

  resolvedVariablesSnapshot() {
    const frame = this.currentFrame();
    if (!frame) return {};

    const result = {};
    for (const [key, value] of Object.entries(frame.variables)) {
      result[key] = this.memory.dereference(value);
    }
    return result;
  }
}
