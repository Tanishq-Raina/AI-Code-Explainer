export class OperationCounter {
  constructor() {
    this.total = 0;
    this.breakdown = {
      assignment: 0,
      condition: 0,
      loop: 0,
      call: 0,
      return: 0,
      declaration: 0,
      expression: 0,
      update: 0,
    };
  }

  bump(kind) {
    this.total += 1;
    if (!(kind in this.breakdown)) {
      this.breakdown[kind] = 0;
    }
    this.breakdown[kind] += 1;
    return this.total;
  }

  snapshot() {
    return {
      total: this.total,
      breakdown: { ...this.breakdown },
    };
  }
}
