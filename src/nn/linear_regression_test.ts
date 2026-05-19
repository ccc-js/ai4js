import { Tensor } from './tensor.js';
import { Linear, Adam, setSeed } from './nn.js';
import * as fs from 'fs';
import * as path from 'path';

const MODEL_PATH = path.join(__dirname, '..', '..', 'model', 'linear-regression.json');

function saveModel(model: Linear): object {
  return {
    weight: Array.from(model.weight.data.data),
    bias: model.bias ? Array.from(model.bias.data.data) : null,
    weightShape: model.weight.data.shape,
    biasShape: model.bias?.data?.shape || null,
  };
}

function loadModel(model: Linear, data: { weight: number[]; bias: number[] | null }) {
  model.weight.data.data.set(data.weight);
  if (model.bias && data.bias) {
    model.bias.data.data.set(data.bias);
  }
}

function main() {
  setSeed(42);

  console.log('=== Linear Regression Save/Load Test ===');

  const model = new Linear(1, 1, true);

  console.log(`\nInitial: w=${model.weight.data.data[0].toFixed(4)}, b=${model.bias!.data.data[0].toFixed(4)}`);

  // Manually set some values
  model.weight.data.data[0] = 3.14159;
  model.bias!.data.data[0] = 2.71828;
  console.log(`Set: w=${model.weight.data.data[0].toFixed(4)}, b=${model.bias!.data.data[0].toFixed(4)}`);

  console.log('\n--- Saving ---');
  const snapshot = saveModel(model);
  console.log('Saved:', JSON.stringify(snapshot));
  fs.writeFileSync(MODEL_PATH, JSON.stringify(snapshot, null, 2));

  console.log('\n--- Reset and Reload ---');
  model.weight.data.data[0] = 0;
  model.bias!.data.data[0] = 0;
  console.log(`After reset: w=${model.weight.data.data[0].toFixed(4)}, b=${model.bias!.data.data[0].toFixed(4)}`);

  const loaded = JSON.parse(fs.readFileSync(MODEL_PATH, 'utf-8'));
  loadModel(model, loaded);
  console.log(`After load: w=${model.weight.data.data[0].toFixed(4)}, b=${model.bias!.data.data[0].toFixed(4)}`);

  const wSaved = loaded.weight[0];
  const wLoaded = model.weight.data.data[0];
  const bSaved = loaded.bias![0];
  const bLoaded = model.bias!.data.data[0];

  const success = Math.abs(wSaved - wLoaded) < 1e-6 && Math.abs(bSaved - bLoaded) < 1e-6;

  if (success) {
    console.log('\n✓ Linear Regression Save/Load PASSED!');
  } else {
    console.log('\n✗ Linear Regression Save/Load FAILED!');
    console.log(`  w: saved=${wSaved}, loaded=${wLoaded}`);
    console.log(`  b: saved=${bSaved}, loaded=${bLoaded}`);
  }
}

main();