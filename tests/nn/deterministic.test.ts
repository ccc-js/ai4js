import { train_model } from '../../src/nn/chargpt.js';
import { GPT } from '../../src/nn/gpt.js';
import { Adam, setSeed } from '../../src/nn/nn.js';
import { saveModelToFile, loadModelFromFile } from '../../src/nn/io.js';
import { Tensor } from '../../src/nn/tensor.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import ndarray from 'ndarray';

const DATA_PATH = path.join(__dirname, '..', '..', 'data', 'input.txt');

function loadDocs(): string[] {
  if (fs.existsSync(DATA_PATH)) {
    const content = fs.readFileSync(DATA_PATH, 'utf-8');
    return content.split('\n').filter((line) => line.trim());
  }
  return ['alice', 'bob', 'charlie'];
}

function runInference(model: GPT, input: number[]): number[] {
  const x = new Tensor(
    ndarray(new Float32Array(input), [1, input.length]),
    [],
    false
  );
  const [logits] = model.__call__(x, null);
  const lastIdx = input.length - 1;
  const vocabSize = logits.data.shape[2];
  return Array.from(
    logits.data.data.slice(lastIdx * vocabSize, (lastIdx + 1) * vocabSize)
  );
}

describe('model save/load determinism', () => {
  test('inference output is identical after saving and loading GPT model', async () => {
    const docs = loadDocs();
    const uchars = [...new Set(docs.join(''))].sort();
    const BOS = uchars.length;
    const vocab_size = uchars.length + 1;
    const block_size = 16;
    const config = {
      vocab_size,
      block_size,
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
    train_model(model1, optimizer1, docs, uchars, BOS, block_size, 20);

    const testChar = docs[0][0];
    const testCharIdx = uchars.indexOf(testChar);
    const testInput = [BOS, testCharIdx];
    const output1 = runInference(model1, testInput);

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai4js-model-'));
    const modelPath = path.join(tempDir, 'chargpt-test.json');

    try {
      await saveModelToFile(model1, modelPath, config, { vocab: uchars, BOS });
      const model2 = await loadModelFromFile<GPT>(modelPath);
      const output2 = runInference(model2, testInput);

      expect(output2).toHaveLength(output1.length);
      for (let i = 0; i < output1.length; i++) {
        expect(output2[i]).toBeCloseTo(output1[i], 10);
      }
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
