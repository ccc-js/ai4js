export class Discrete {
  n: number;

  constructor(n: number) {
    this.n = n;
  }

  sample(): number {
    return Math.floor(Math.random() * this.n);
  }

  contains(x: number): boolean {
    return Number.isInteger(x) && x >= 0 && x < this.n;
  }
}

export class Box {
  low: number[];
  high: number[];
  shape: number[];

  constructor(low: number[], high: number[], shape?: number[]) {
    this.low = low;
    this.high = high;
    if (shape) {
      this.shape = shape;
    } else {
      this.shape = [low.length];
    }
  }

  sample(): number[] {
    const result: number[] = [];
    for (let i = 0; i < this.shape[0]; i++) {
      result.push(this.low[i] + Math.random() * (this.high[i] - this.low[i]));
    }
    return result;
  }

  contains(x: number[]): boolean {
    if (x.length !== this.shape[0]) return false;
    for (let i = 0; i < x.length; i++) {
      if (x[i] < this.low[i] || x[i] > this.high[i]) return false;
    }
    return true;
  }
}

export type Space = Discrete | Box;