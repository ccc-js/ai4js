import { Tensor } from './tensor.js';
import { Adam, setSeed } from './nn.js';
import * as fs from 'fs';
import * as path from 'path';

const MODEL_PATH = path.join(__dirname, '..', '..', 'model', 'simple-test.json');

class SimpleModel {
  x: Tensor;
  y: Tensor;

  constructor() {
    this.x = new Tensor({ data: new Float32Array([2.0]), shape: [1] }, [], true);
    this.y = new Tensor({ data: new Float32Array([3.0]), shape: [1] }, [], true);
  }

  parameters(): Tensor[] {
    return [this.x, this.y];
  }

  forward(): Tensor {
    return this.x.mul(this.x).add(this.y.mul(this.y));
  }

  reset() {
    this.x.data.data[0] = 2.0;
    this.y.data.data[0] = 3.0;
  }
}

function saveModel(model: SimpleModel): object {
  return {
    x: Array.from(model.x.data.data),
    y: Array.from(model.y.data.data),
  };
}

function loadModel(model: SimpleModel, data: { x: number[]; y: number[] }) {
  model.x.data.data.set(data.x);
  model.y.data.data.set(data.y);
}

async function main() {
  setSeed(42);
  const model = new SimpleModel();

  console.log('=== Simple Save/Load Test ===');
  console.log(`Initial: x=${model.x.data.data[0]}, y=${model.y.data.data[0]}`);
  console.log(`Initial loss: ${model.forward().data.data[0]}`);

  const params = model.parameters();
  const optimizer = new Adam(params, 0.1);

  console.log('\n--- Training (50 steps) ---');
  for (let i = 0; i < 50; i++) {
    optimizer.zero_grad();
    const loss = model.forward();
    loss.backward();

    const gradNorm = Math.sqrt(
      model.x.grad!.data[0] ** 2 + model.y.grad!.data[0] ** 2
    );

    optimizer.step();

    if (i % 10 === 0 || i === 49) {
      console.log(
        `step ${i + 1}: x=${model.x.data.data[0].toFixed(6)}, ` +
        `y=${model.y.data.data[0].toFixed(6)}, ` +
        `loss=${loss.data.data[0].toFixed(6)}`
      );
    }
  }

  console.log('\n--- Saving ---');
  const snapshot = saveModel(model);
  console.log('Saved:', JSON.stringify(snapshot));

  fs.writeFileSync(MODEL_PATH, JSON.stringify(snapshot, null, 2));
  console.log(`Saved to ${MODEL_PATH}`);

  console.log('\n--- Reloading and checking ---');
  const loaded = JSON.parse(fs.readFileSync(MODEL_PATH, 'utf-8'));
  console.log('Loaded:', loaded);

  model.reset();
  console.log('After reset:', { x: model.x.data.data[0], y: model.y.data.data[0] });

  loadModel(model, loaded);
  console.log('After load:', { x: model.x.data.data[0], y: model.y.data.data[0] });

  const lossAfterLoad = model.forward().data.data[0];
  console.log(`Loss after load: ${lossAfterLoad.toFixed(6)}`);

  if (
    Math.abs(model.x.data.data[0] - loaded.x[0]) < 1e-6 &&
    Math.abs(model.y.data.data[0] - loaded.y[0]) < 1e-6
  ) {
    console.log('\n✓ Save/Load test PASSED!');
  } else {
    console.log('\n✗ Save/Load test FAILED!');
  }
}

main().catch(console.error);