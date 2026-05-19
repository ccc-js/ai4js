import { describe, test, expect } from '@jest/globals';
import { Tensor, Linear, Module, Adam, setSeed } from '../src/nn';

describe('Linear Regression Training', () => {
  test('trains to learn y = 2x + 1', () => {
    setSeed(42);

    class LinearReg extends Module {
      linear: Linear;
      constructor() {
        super();
        this.linear = new Linear(1, 1, true);
      }
      __call__(x: Tensor): Tensor {
        return this.linear.__call__(x);
      }
    }

    const model = new LinearReg();
    const optimizer = new Adam(model.parameters(), 0.1);

    for (let step = 0; step < 50; step++) {
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * 5;
        const y = 2 * x + 1;

        optimizer.zero_grad();
        const pred = model.__call__(new Tensor([[x]], [], true));
        const loss = pred.add(new Tensor([[y]], [], false).mul(-1)).mul(
          pred.add(new Tensor([[y]], [], false).mul(-1))
        );
        loss.backward();
        optimizer.step();
      }
    }

    const w = model.linear.weight.data.data[0];
    const b = model.linear.bias!.data.data[0];

    expect(w).toBeGreaterThan(1.5);
    expect(w).toBeLessThan(2.5);
    expect(b).toBeGreaterThan(0);
    expect(b).toBeLessThan(2);
  });
});