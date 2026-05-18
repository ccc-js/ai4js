import { train_model, generate_samples } from './chargpt.js';
import { GPT } from './gpt.js';
import { Adam, setSeed } from './nn.js';
import * as fs from 'fs';
import * as path from 'path';

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
const model = new GPT(vocab_size, block_size, 1, 16, 4);
console.log(`num params: ${model.parameters().length}`);

const optimizer = new Adam(model.parameters(), 0.01);

console.log('\n--- training ---');
train_model(model, optimizer, docs, uchars, BOS, block_size, 1000);

generate_samples(model, uchars, BOS, vocab_size, block_size, 5, 0.5);

console.log('\nDone!');

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