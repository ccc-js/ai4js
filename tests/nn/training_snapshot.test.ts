import { train_model } from '../../src/nn/chargpt.js';
import { GPT } from '../../src/nn/gpt.js';
import {
  trainingToJSON,
  trainingFromJSON,
  type TrainingSnapshot,
  loadAdam,
} from '../../src/nn/io.js';
import { Adam, setSeed } from '../../src/nn/nn.js';
import * as fs from 'fs';
import * as path from 'path';

const DATA_PATH = path.join(__dirname, '..', '..', 'data', 'input.txt');

function loadDocs(): string[] {
  if (fs.existsSync(DATA_PATH)) {
    const content = fs.readFileSync(DATA_PATH, 'utf-8');
    return content.split('\n').filter((line) => line.trim());
  }
  return ['alice', 'bob', 'charlie'];
}

describe('training snapshot', () => {
  test('preserves metadata on both training and nested model snapshots', () => {
    const model = new GPT(10, 16, 1, 16, 4);
    const optimizer = new Adam(model.parameters(), 0.01);
    const config = {
      vocab_size: 10,
      block_size: 16,
      n_layer: 1,
      n_embd: 16,
      n_head: 4,
    };
    const metadata = {
      BOS: 9,
      vocab: ['a', 'b', 'c'],
      description: 'snapshot metadata test',
    };

    const snapshot = JSON.parse(
      trainingToJSON(model, optimizer, config, metadata)
    ) as TrainingSnapshot;

    expect(snapshot.metadata.BOS).toBe(metadata.BOS);
    expect(snapshot.metadata.vocab).toEqual(metadata.vocab);
    expect(snapshot.model.metadata.BOS).toBe(metadata.BOS);
    expect(snapshot.model.metadata.vocab).toEqual(metadata.vocab);
    expect(snapshot.model.metadata.description).toBe(metadata.description);
  });

  test('restores full Adam state including initial_lr', () => {
    const docs = loadDocs();
    const uchars = [...new Set(docs.join(''))].sort();
    const BOS = uchars.length;
    const config = {
      vocab_size: uchars.length + 1,
      block_size: 16,
      n_layer: 1,
      n_embd: 16,
      n_head: 4,
    };

    setSeed(12345);
    const model1 = new GPT(
      config.vocab_size,
      config.block_size,
      config.n_layer,
      config.n_embd,
      config.n_head
    );
    const optimizer1 = new Adam(model1.parameters(), 0.01);
    train_model(model1, optimizer1, docs, uchars, BOS, config.block_size, 20);

    const restored = trainingFromJSON(
      trainingToJSON(model1, optimizer1, config, { BOS })
    );

    const model2 = restored.model as GPT;
    const optimizer2 = new Adam(model2.parameters(), 999);
    loadAdam(optimizer2, {
      lr: restored.optimizer.lr,
      initial_lr: restored.optimizer.initial_lr,
      beta1: restored.optimizer.beta1,
      beta2: restored.optimizer.beta2,
      eps: restored.optimizer.eps,
      t: restored.optimizer.t,
      m: restored.optimizer.m.map(arr => Array.from(arr)),
      v: restored.optimizer.v.map(arr => Array.from(arr)),
    });

    expect(optimizer2.lr).toBeCloseTo(optimizer1.lr, 10);
    expect(optimizer2.initial_lr).toBeCloseTo(optimizer1.initial_lr, 10);
    expect(optimizer2.beta1).toBeCloseTo(optimizer1.beta1, 10);
    expect(optimizer2.beta2).toBeCloseTo(optimizer1.beta2, 10);
    expect(optimizer2.eps).toBeCloseTo(optimizer1.eps, 10);
    expect(optimizer2.t).toBe(optimizer1.t);
    expect(optimizer2.m).toHaveLength(optimizer1.m.length);
    expect(optimizer2.v).toHaveLength(optimizer1.v.length);

    for (let i = 0; i < optimizer1.m.length; i++) {
      expect(Array.from(optimizer2.m[i])).toEqual(Array.from(optimizer1.m[i]));
      expect(Array.from(optimizer2.v[i])).toEqual(Array.from(optimizer1.v[i]));
    }
  });
});
