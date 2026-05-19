import { Tensor, Linear, Module, Adam, setSeed } from '../index.js';
import { trainingToJSON } from '../io.js';

export class LinearRegModel extends Module {
  linear: Linear;
  constructor() {
    super();
    this.linear = new Linear(1, 1, true);
  }
  __call__(x: Tensor): Tensor {
    return this.linear.__call__(x);
  }
}

export interface TrainLinearOptions {
  name: string;
  saveSnapshot?: (id: string, step: number, data: string) => Promise<void>;
  onProgress?: (step: number, w: number, b: number) => void;
}

export async function trainLinearRegression(options: TrainLinearOptions): Promise<{ w: number; b: number }> {
  const { name, saveSnapshot, onProgress } = options;

  setSeed(42);
  const model = new LinearRegModel();
  const optimizer = new Adam(model.parameters(), 0.1);

  const nSamples = 30;
  const xData: number[] = [];
  const yData: number[] = [];

  for (let i = 0; i < nSamples; i++) {
    const x = Math.random() * 5;
    xData.push(x);
    yData.push(2 * x + 1 + (Math.random() - 0.5) * 2);
  }

  const totalSteps = 50;
  let lastSaveStep = 0;

  for (let step = 0; step < totalSteps; step++) {
    for (let i = 0; i < nSamples; i++) {
      optimizer.zero_grad();
      const pred = model.__call__(new Tensor([[xData[i]]], [], true));
      const target = new Tensor([[yData[i]]], [], false);
      const loss = pred.add(target.mul(-1)).mul(pred.add(target.mul(-1)));
      loss.backward();
      optimizer.step();
    }

    const w = model.linear.weight.data.data[0];
    const b = model.linear.bias!.data.data[0];

    if (onProgress) onProgress(step, w, b);

    if (saveSnapshot && step > 0 && step % 10 === 0 && step !== lastSaveStep) {
      const config = { in_features: 1, out_features: 1, bias: true };
      const data = trainingToJSON(model, optimizer, config, { name, steps: step });
      const id = `${name}-${step}`;
      await saveSnapshot(id, step, data);
      lastSaveStep = step;
    }
  }

  return { w: model.linear.weight.data.data[0], b: model.linear.bias!.data.data[0] };
}