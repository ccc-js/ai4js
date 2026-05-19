import { train_model, generate_samples } from './chargpt.js';
import { GPT } from './gpt.js';
import { Adam, setSeed } from './nn.js';
import { saveModelToFile, loadModelFromFile } from './io.js';
import * as fs from 'fs';
import * as path from 'path';

const MODEL_DIR = path.join(__dirname, '..', '..', 'model');
const MODEL_PATH = path.join(MODEL_DIR, 'chargpt-v1.json');

async function main() {
  const inputPath = path.join(__dirname, '..', '..', 'data', 'input.txt');

  let docs: string[];
  if (fs.existsSync(inputPath)) {
    const content = fs.readFileSync(inputPath, 'utf-8');
    docs = content.split('\n').filter((line) => line.trim());
  } else {
    docs = ['alice', 'bob', 'charlie', 'david', 'emma', 'frank', 'grace', 'henry'];
  }

  setSeed(42);
  shuffleInPlace(docs, createSeededRandom(42));

  console.log(`num docs: ${docs.length}`);

  const uchars = [...new Set(docs.join(''))].sort();
  const BOS = uchars.length;
  const vocab_size = uchars.length + 1;
  console.log(`vocab size: ${vocab_size}`);

  const block_size = 16;
  const n_layer = 1;
  const n_embd = 16;
  const n_head = 4;

  let model: GPT;
  if (fs.existsSync(MODEL_PATH)) {
    console.log('Loading existing model...');
    model = await loadModelFromFile<GPT>(MODEL_PATH);
    console.log('Model loaded');
  } else {
    console.log('Creating new model...');
    model = new GPT(vocab_size, block_size, n_layer, n_embd, n_head);
  }
  console.log(`num params: ${model.parameters().length}`);

  const optimizer = new Adam(model.parameters(), 0.01);

  console.log('\n--- training ---');
  train_model(model, optimizer, docs, uchars, BOS, block_size, 100);

  console.log('\n--- saving ---');
  await saveModelToFile(model, MODEL_PATH, {
    vocab_size,
    block_size,
    n_layer,
    n_embd,
    n_head,
  }, {
    vocab: uchars,
    BOS,
    description: `Trained on ${docs.length} names`,
  });
  console.log(`Model saved to ${MODEL_PATH}`);

  generate_samples(model, uchars, BOS, vocab_size, block_size, 5, 0.5);

  console.log('\nDone!');
}

main().catch(console.error);

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function shuffleInPlace(arr: string[], random: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}