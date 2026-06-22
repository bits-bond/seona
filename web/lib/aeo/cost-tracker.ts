export class CostTracker {
  private spent = 0;
  private readonly cap: number;

  constructor(maxSpendUsd: number) {
    this.cap = maxSpendUsd;
  }

  add(usd: number): void {
    this.spent += usd;
  }

  get totalUsd(): number {
    return this.spent;
  }

  get capUsd(): number {
    return this.cap;
  }

  exceeded(): boolean {
    return this.spent >= this.cap;
  }

  remaining(): number {
    return Math.max(0, this.cap - this.spent);
  }

  formatStatus(): string {
    return `$${this.spent.toFixed(4)} / $${this.cap.toFixed(2)} (${((this.spent / this.cap) * 100).toFixed(1)}%)`;
  }
}
