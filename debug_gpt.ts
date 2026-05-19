import { GPT, Adam, setSeed, Tensor } from './src/nn/index.js';
import ndarray from 'ndarray';

setSeed(42);
const uchars = ['小', '貓', '坐', '在', '桌', '上'].sort();
const BOS = uchars.length;
const vocab_size = uchars.length + 1;

console.log('vocab_size:', vocab_size, 'BOS:', BOS);

const model = new GPT(vocab_size, 16, 1, 16, 4);
const optimizer = new Adam(model.parameters(), 0.01);

console.log('Initial lm_head weight sample:', model.lm_head.weight.data.data.slice(0, 5));
console.log('Initial wte weight sample:', model.wte.weight.data.data.slice(0, 5));

const xData = [BOS, uchars.indexOf('小'), uchars.indexOf('貓')];
const yData = [uchars.indexOf('貓'), uchars.indexOf('坐'), BOS];

const x = new Tensor(ndarray(new Float32Array(xData), [1, 3]), [], true);
const y = new Tensor(ndarray(new Float32Array(yData), [1, 3]), [], false);

console.log('x shape:', x.data.shape);
console.log('y shape:', y.data.shape);

const [logits, _] = model.__call__(x, null);
console.log('Logits shape:', logits.data.shape);
console.log('Logits sample:', logits.data.data.slice(0, 10));
console.log('Logits min/max:', Math.min(...logits.data.data), Math.max(...logits.data.data));
console.log('Any NaN in logits:', logits.data.data.some(v => isNaN(v)));
console.log('Any Infinity in logits:', logits.data.data.some(v => !isFinite(v)));

const loss = logits.cross_entropy(y);
console.log('Loss:', loss.data.data[0]);
console.log('Loss is NaN:', isNaN(loss.data.data[0]));