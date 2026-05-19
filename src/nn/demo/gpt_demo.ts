import { Tensor } from '../tensor.js';
import { Adam } from '../nn.js';
import { GPT } from '../gpt.js';
import ndarray from 'ndarray';
import { GPT_CONFIG } from './gpt_config.js';

export interface TrainGPTOptions {
  name: string;
  docs: string[];
  steps: number;
  saveSnapshot?: (id: string, step: number, data: string) => Promise<void>;
  onProgress?: (step: number, loss: number) => void;
}

const DEFAULT_DOCS = [
  '小貓坐在桌上', '小狗跑在路上', '小鳥飛在天上', '小魚游在水中',
  '大貓坐在地上', '大狗跑在地上', '大鳥飛在山上', '小貓吃了魚',
  '小狗吃了肉', '小鳥吃了蟲', '小魚吃了草', '大貓吃了魚',
  '大狗吃了肉', '大鳥吃了蟲', '我看到一隻小貓', '我看到一隻小狗',
  '我看到一隻小鳥', '我看到一隻小魚', '你看到一隻大貓', '你看到一隻大狗',
  '你看到一隻大鳥', '他看到一隻大魚', '我喜歡小貓', '我喜歡小狗',
  '我喜歡小鳥', '你喜歡大貓', '你喜歡大狗', '他喜歡小魚',
  '她喜歡大鳥', '天上有白雲', '天上有太陽', '天上有月亮',
  '天上有星星', '山上有大樹', '山上有小花', '山上有小草',
  '水中有小魚', '水中有大魚', '地上有小貓', '地上有大狗',
  '今天天氣好', '今天太陽大', '今天風很大', '今天雨很大',
  '小貓很可愛', '小狗很可愛', '小鳥很可愛', '大貓很漂亮',
  '大狗很漂亮', '大鳥很漂亮', '我去學校上課', '你去學校上課',
  '他去學校上課', '她去學校上課', '我在家裡吃飯', '你在家裡吃飯',
  '他在家裡看書', '她在家裡看書', '我和你是好朋友', '你和他是好朋友',
  '他和她是好朋友', '我們都是好朋友', '早上太陽出來了', '中午太陽很大',
  '下午風很大', '晚上月亮出來了', '晚上星星很多', '小花很漂亮',
  '小草很多', '大樹很高', '白雲很白', '太陽很大',
  '月亮很亮', '星星很小', '我愛吃飯', '你愛看書',
  '他愛跑步', '她愛唱歌', '我會寫字', '你會看書',
  '他會跑步', '她會唱歌', '我想吃魚', '你想吃肉',
  '他想看書', '她想唱歌', '一隻小貓在桌上', '一隻小狗在地上',
  '一隻小鳥在天上', '一隻小魚在水中', '兩隻小貓在地上', '兩隻小狗在路上',
  '三隻小鳥在天上', '很多小魚在水中', '春天小花很多', '夏天太陽很大',
  '秋天風很大', '冬天雨很大', '春天很美', '夏天很熱',
  '秋天很涼', '冬天很冷', '我在春天看花', '你在夏天游水',
  '他在秋天看書', '她在冬天唱歌', '小貓和小狗是好朋友', '小鳥和小魚是好朋友',
  '大貓和大狗是好朋友', '我和小貓是好朋友', '你和小狗是好朋友', '他喜歡在山上跑步',
  '她喜歡在水中游水', '我喜歡在家裡看書', '你喜歡在學校上課', '天上的白雲很漂亮',
  '山上的大樹很高', '水中的小魚很可愛', '地上的小花很美', '早上我去學校上課',
  '中午我在學校吃飯', '下午我在家裡看書', '晚上我在家裡吃飯', '早上你去學校上課',
  '中午你在學校吃飯', '下午你在家裡看書', '晚上你在家裡吃飯', '小貓在家裡',
  '小狗在路上', '小鳥在山上', '小魚在水中', '大樹在山上',
  '小花在地上', '太陽在天上', '月亮在天上', '星星在天上',
  '白雲在天上', '我很開心', '你很開心', '他很開心',
  '她很開心', '我們很開心', '大家都很開心', '今天很開心',
  '我今天很開心', '你今天很開心', '他今天很開心'
];

export async function trainGPT(options: TrainGPTOptions): Promise<{ samples: string[] }> {
  const { name, docs = DEFAULT_DOCS, steps = 1000, saveSnapshot, onProgress } = options;

  const uchars = [...new Set(docs.join(''))].sort();
  const BOS = uchars.length;
  const vocab_size = uchars.length + 1;
  const block_size = GPT_CONFIG.block_size;

  const model = new GPT(
    vocab_size,
    block_size,
    GPT_CONFIG.n_layer,
    GPT_CONFIG.n_embd,
    GPT_CONFIG.n_head
  );
  const optimizer = new Adam(model.parameters(), GPT_CONFIG.lr);

  const params = model.parameters();
  const charToIdx: Record<string, number> = {};
  for (let i = 0; i < uchars.length; i++) {
    charToIdx[uchars[i]] = i;
  }

  let lastSaveStep = 0;

  for (let step = 0; step < steps; step++) {
    const doc = docs[step % docs.length];
    if (!doc || doc.length === 0) continue;

    const tokens = [BOS];
    for (const ch of doc) {
      if (charToIdx[ch] !== undefined) tokens.push(charToIdx[ch]);
    }
    tokens.push(BOS);

    const n = Math.min(block_size, tokens.length - 1);
    if (n <= 0) continue;

    const x = new Tensor(toNdarray(tokens.slice(0, n), [1, n]), [], true);
    const y = new Tensor(toNdarray(tokens.slice(1, n + 1), [1, n]), [], false);

    optimizer.zero_grad();
    const [logits, _] = model.__call__(x, null);
    const loss = logits.cross_entropy(y);
    loss.backward();

    const max_norm = 1.0;
    let total_norm = 0;
    for (const p of params) {
      let sum = 0;
      for (let i = 0; i < p.grad.data.length; i++) sum += p.grad.data[i] * p.grad.data[i];
      total_norm += sum;
    }
    total_norm = Math.sqrt(total_norm);

    if (total_norm > max_norm) {
      const clip_coef = max_norm / (total_norm + 1e-6);
      for (const p of params) {
        for (let i = 0; i < p.grad.data.length; i++) p.grad.data[i] *= clip_coef;
      }
    }

    optimizer.step();
    optimizer.lr = 0.01 * (1 - step / steps);

    if (onProgress && (step % 10 === 0 || step === steps - 1)) {
      onProgress(step, loss.data.data[0]);
    }

    if (saveSnapshot && step > 0 && step % 100 === 0 && step !== lastSaveStep) {
      const config = { vocab_size, block_size, n_layer: GPT_CONFIG.n_layer, n_embd: GPT_CONFIG.n_embd, n_head: GPT_CONFIG.n_head };
      const { trainingToJSON } = await import('../io.js');
      const data = trainingToJSON(model, optimizer, config, { name, steps: step });
      const id = `${name}-${step}`;
      await saveSnapshot(id, step, data);
      lastSaveStep = step;
    }
  }

  const samples = generateSamples(model, uchars, BOS, vocab_size, block_size);
  return { samples };
}

export function generateSamples(
  model: GPT,
  uchars: string[],
  BOS: number,
  vocab_size: number,
  block_size: number,
  num_samples = 5,
  temperature = 0.5
): string[] {
  const results: string[] = [];

  for (let sample_idx = 0; sample_idx < num_samples; sample_idx++) {
    let current_token = BOS;
    const sample: string[] = [];
    let kv_caches: [Tensor, [Tensor, Tensor]][] | null = null;

    for (let pos_id = 0; pos_id < block_size; pos_id++) {
      const x = new Tensor(toNdarray([current_token], [1, 1]), [], false);
      const [logits, kv_caches_new] = model.__call__(x, kv_caches);
      kv_caches = kv_caches_new;

      const last_logits = logits.data.data;
      const maxLogit = Math.max(...last_logits);
      let sumExp = 0;
      const exps = new Float32Array(vocab_size);
      for (let v = 0; v < vocab_size; v++) {
        exps[v] = Math.exp(last_logits[v] / temperature - maxLogit / temperature);
        sumExp += exps[v];
      }

      const probs = Array.from(exps).map(e => e / sumExp);
      let r = Math.random();
      let next_token = 0;
      let cumsum = 0;
      for (let v = 0; v < vocab_size; v++) {
        cumsum += probs[v];
        if (r <= cumsum) { next_token = v; break; }
      }

      if (next_token === BOS) break;
      sample.push(uchars[next_token]);
      current_token = next_token;
    }

    results.push(sample.join(''));
  }

  return results;
}

function toNdarray(data: number[], shape: number[]): ndarray.NdArray<ndarray.Data> {
  return ndarray(new Float32Array(data), shape);
}