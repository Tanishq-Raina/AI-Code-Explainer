let nextHeapId = 1;

function cloneValue(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(cloneValue);
  if (typeof value === "object") return { ...value };
  return value;
}

function estimateStringBytes(text) {
  return 12 + String(text).length * 2;
}

export class MemoryTracker {
  constructor() {
    this.heap = new Map();
  }

  allocArray(items, lineNumber) {
    const id = `arr_${nextHeapId++}`;
    const payload = {
      id,
      type: "array",
      value: cloneValue(items),
      size: Array.isArray(items) ? items.length : 0,
      lineNumber,
    };
    this.heap.set(id, payload);
    return { ref: id };
  }

  allocObject(obj, lineNumber) {
    const id = `obj_${nextHeapId++}`;
    const payload = {
      id,
      type: "object",
      value: cloneValue(obj),
      size: obj ? Object.keys(obj).length : 0,
      lineNumber,
    };
    this.heap.set(id, payload);
    return { ref: id };
  }

  updateRef(refId, nextValue) {
    if (!this.heap.has(refId)) return;
    const current = this.heap.get(refId);
    const updated = {
      ...current,
      value: cloneValue(nextValue),
      size: Array.isArray(nextValue)
        ? nextValue.length
        : nextValue && typeof nextValue === "object"
          ? Object.keys(nextValue).length
          : current.size,
    };
    this.heap.set(refId, updated);
  }

  dereference(value) {
    if (!value || typeof value !== "object" || !("ref" in value)) {
      return value;
    }
    const target = this.heap.get(value.ref);
    if (!target) return null;
    return cloneValue(target.value);
  }

  snapshot() {
    return Array.from(this.heap.values()).map((item) => {
      const valueClone = cloneValue(item.value);
      return {
        id: item.id,
        type: item.type,
        size: item.size,
        value: valueClone,
        lineNumber: item.lineNumber,
        bytes: this.estimateHeapItemBytes(item),
      };
    });
  }

  usage(stackFrames) {
    const stackVariables = stackFrames.reduce(
      (acc, frame) => acc + Object.keys(frame.variables).length,
      0,
    );
    const heapObjects = this.heap.size;
    const arrayCells = Array.from(this.heap.values()).reduce(
      (acc, item) => (item.type === "array" ? acc + item.size : acc),
      0,
    );
    const stackBytes = stackFrames.reduce(
      (acc, frame) => acc + (typeof frame.bytes === "number" ? frame.bytes : 0),
      0,
    );
    const heapBytes = Array.from(this.heap.values()).reduce(
      (acc, item) => acc + this.estimateHeapItemBytes(item),
      0,
    );

    return {
      stackVariables,
      heapObjects,
      arrayCells,
      totalMemoryUnits: stackVariables + heapObjects + arrayCells,
      stackBytes,
      heapBytes,
      totalBytes: stackBytes + heapBytes,
    };
  }

  estimateHeapItemBytes(item) {
    if (!item) return 0;
    const objectHeader = 24;
    if (item.type === "array") {
      return objectHeader + this.estimateValueBytes(item.value);
    }
    return objectHeader + this.estimateValueBytes(item.value);
  }

  estimateStackFrameBytes(frame) {
    if (!frame) return 0;
    const frameOverhead = 64;
    const functionNameBytes = estimateStringBytes(frame.name || "");

    const localsBytes = Object.entries(frame.variables || {}).reduce(
      (acc, [key, value]) => acc + estimateStringBytes(key) + this.estimateReferenceAwareBytes(value),
      0,
    );

    return frameOverhead + functionNameBytes + localsBytes;
  }

  estimateReferenceAwareBytes(value) {
    if (value && typeof value === "object" && "ref" in value) {
      return 8;
    }
    return this.estimateValueBytes(value);
  }

  estimateValueBytes(value, seen = new WeakSet()) {
    if (value === null || value === undefined) return 0;

    if (typeof value === "number") return 8;
    if (typeof value === "boolean") return 4;
    if (typeof value === "string") return estimateStringBytes(value);

    if (Array.isArray(value)) {
      return 24 + value.reduce((acc, item) => acc + this.estimateValueBytes(item, seen), 0);
    }

    if (typeof value === "object") {
      if (seen.has(value)) return 8;
      seen.add(value);

      return (
        24 +
        Object.entries(value).reduce(
          (acc, [key, val]) => acc + estimateStringBytes(key) + this.estimateValueBytes(val, seen),
          0,
        )
      );
    }

    return 8;
  }
}
