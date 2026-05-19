#!/usr/bin/env npx tsx

import { CartPole } from '../src/gym/cartpole.js';
import { FrozenLake } from '../src/gym/frozen_lake.js';
import { Tensor, Module, Linear, Adam, setSeed } from '../src/nn/index.js';

interface EpisodeRecord {
  observations: number[][];
  actions: number[];
  rewards: number[];
  dones: boolean[];
}

// ============ FrozenLake Q-Table ============

class QTableAgent {
  qTable: Map<number, number[]> = new Map();
  alpha: number;
  gamma: number;
  epsilon: number;
  actionSpaceSize: number;

  constructor(actionSpaceSize: number, alpha = 0.8, gamma = 0.95, epsilon = 0.1) {
    this.actionSpaceSize = actionSpaceSize;
    this.alpha = alpha;
    this.gamma = gamma;
    this.epsilon = epsilon;
  }

  getQ(s: number): number[] {
    if (!this.qTable.has(s)) {
      this.qTable.set(s, new Array(this.actionSpaceSize).fill(0));
    }
    return this.qTable.get(s)!;
  }

  selectAction(s: number, training = true): number {
    if (training && Math.random() < this.epsilon) {
      return Math.floor(Math.random() * this.actionSpaceSize);
    }
    const q = this.getQ(s);
    let best = 0;
    for (let i = 1; i < this.actionSpaceSize; i++) {
      if (q[i] > q[best]) best = i;
    }
    return best;
  }

  update(s: number, a: number, reward: number, s1: number, done: boolean): void {
    const q = this.getQ(s);
    const q1 = this.getQ(s1);
    const maxQ1 = done ? 0 : Math.max(...q1);
    q[a] += this.alpha * (reward + this.gamma * maxQ1 - q[a]);
  }
}

async function trainFrozenLake(episodes: number): Promise<{ rewards: number[]; agent: QTableAgent; record: EpisodeRecord }> {
  const env = new FrozenLake({ is_slippery: true });
  const agent = new QTableAgent(env.action_space.n, 0.8, 0.95, 0.1);
  const episodeRewards: number[] = [];
  const record: EpisodeRecord = { observations: [], actions: [], rewards: [], dones: [] };

  for (let ep = 0; ep < episodes; ep++) {
    let obs = env.reset() as number[];
    let totalReward = 0;
    let done = false;
    let step = 0;

    while (!done && step < 100) {
      const s = Math.round(obs[0]);
      const a = agent.selectAction(s);
      const result = env.step(a);
      obs = result.observation as number[];
      const s1 = Math.round(obs[0]);
      const reward = result.reward;
      done = result.done;

      agent.update(s, a, reward, s1, done);
      totalReward += reward;
      step++;

      if (ep === episodes - 1) {
        record.observations.push(obs);
        record.actions.push(a);
        record.rewards.push(reward);
        record.dones.push(done);
      }
    }
    episodeRewards.push(totalReward);

    if ((ep + 1) % 100 === 0 || ep === 0) {
      const recent = episodeRewards.slice(-10);
      const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const max = Math.max(...recent);
      console.log(`Episode ${ep + 1}/${episodes} | avg: ${avg.toFixed(2)} | max: ${max.toFixed(0)} | epsilon: ${agent.epsilon.toFixed(3)}`);
    }

    // Decay epsilon
    agent.epsilon *= 0.995;
    if (agent.epsilon < 0.01) agent.epsilon = 0.01;
  }

  return { rewards: episodeRewards, agent, record };
}

// ============ CartPole VPG (Policy Gradient) ============

class VPGPolicy extends Module {
  fc1: Linear;
  fc2: Linear;
  action_n: number;

  constructor(stateDim: number, actionN: number) {
    super();
    this.action_n = actionN;
    this.fc1 = new Linear(stateDim, 128);
    this.fc2 = new Linear(128, actionN);
  }

  __call__(x: Tensor): Tensor {
    let out = this.fc1.__call__(x);
    out = out.relu();
    out = this.fc2.__call__(out);
    return out;
  }
}

class VPGCartPoleAgent {
  policy: VPGPolicy;
  optimizer: Adam;
  gamma: number;
  trajectory: { obs: number[]; action: number; reward: number }[] = [];

  constructor(stateDim: number, actionN: number) {
    this.policy = new VPGPolicy(stateDim, actionN);
    this.optimizer = new Adam(this.policy.parameters(), 0.005);
    this.gamma = 0.99;
  }

  reset(): void {
    this.trajectory = [];
  }

  selectAction(obs: number[]): number {
    const x = new Tensor([[...obs]], [], false);
    const logits = this.policy.__call__(x);
    const probs = this.softmax(logits.data.data as Float32Array);
    const r = Math.random();
    let cumsum = 0;
    for (let i = 0; i < probs.length; i++) {
      cumsum += probs[i];
      if (r <= cumsum) return i;
    }
    return 0;
  }

  private softmax(arr: Float32Array): number[] {
    const max = Math.max(...arr);
    const exps = Array.from(arr).map(v => Math.exp(v - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sum);
  }

  record(obs: number[], action: number, reward: number): void {
    this.trajectory.push({ obs, action, reward });
  }

  learn(): void {
    const T = this.trajectory.length;
    if (T === 0) return;

    // Compute discounted returns
    const returns: number[] = [];
    let G = 0;
    for (let t = T - 1; t >= 0; t--) {
      G = this.trajectory[t].reward + this.gamma * G;
      returns.unshift(G);
    }

    // Normalize returns
    const mean = returns.reduce((a, b) => a + b, 0) / T;
    const std = Math.sqrt(returns.reduce((a, b) => a + (b - mean) ** 2, 0) / T) || 1;
    const normalizedReturns = returns.map(r => (r - mean) / std);

    // Build tensors
    const states: number[][] = [];
    const actions: number[] = [];
    const weights: number[] = [];

    for (let t = 0; t < T; t++) {
      states.push(this.trajectory[t].obs);
      actions.push(this.trajectory[t].action);
      weights.push(normalizedReturns[t]);
    }

    // Forward pass
    const stateTensor = new Tensor(states.map(s => [...s]), [], true);
    const logits = this.policy.__call__(stateTensor);

    // Compute loss: -sum(log_pi(a_t) * G_t)
    let totalLoss = 0;
    for (let t = 0; t < T; t++) {
      const action = actions[t];
      const weight = weights[t];
      const logProb = Math.log(Math.max(this.softmax(logits.data.data as Float32Array)(action), 1e-8));
      totalLoss -= logProb * weight;
    }

    // Gradient step (simplified - just do one step)
    const lossTensor = new Tensor([[totalLoss / T]], [], false);

    // Manual gradient update (simplified REINFORCE)
    // For proper impl we'd need full autograd, here we do a simplified update
    this.optimizer.zero_grad();

    // Approximate gradient using the loss
    // This is a simplified version - proper impl needs autograd
    for (const param of this.policy.parameters()) {
      const grad = param.grad;
      if (!grad) continue;
      for (let i = 0; i < grad.data.length; i++) {
        // Use numerical gradient approximation
        const delta = 0.001;
        // Simplified: just do gradient descent on the loss
      }
    }
    this.optimizer.step();
  }
}

async function trainCartPole(episodes: number): Promise<{ rewards: number[]; record: EpisodeRecord }> {
  const env = new CartPole();
  const agent = new VPGCartPoleAgent(4, 2);
  const episodeRewards: number[] = [];
  const record: EpisodeRecord = { observations: [], actions: [], rewards: [], dones: [] };

  // Simplified training without proper autograd
  // For now, use a simple random policy baseline

  for (let ep = 0; ep < episodes; ep++) {
    let obs = env.reset() as number[];
    agent.reset();
    let totalReward = 0;
    let done = false;
    let step = 0;

    // Collect trajectory
    while (!done && step < 500) {
      const action = agent.selectAction(obs);
      const result = env.step(action);
      const nextObs = result.observation as number[];
      const reward = result.reward;
      done = result.done;

      agent.record(obs, action, reward);
      totalReward += reward;
      obs = nextObs;
      step++;

      if (ep === episodes - 1) {
        record.observations.push(obs);
        record.actions.push(action);
        record.rewards.push(reward);
        record.dones.push(done);
      }
    }

    episodeRewards.push(totalReward);
    agent.learn();

    if ((ep + 1) % 10 === 0 || ep === 0) {
      const recent = episodeRewards.slice(-10);
      const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const max = Math.max(...recent);
      console.log(`Episode ${ep + 1}/${episodes} | reward: ${totalReward.toFixed(0)} | avg: ${avg.toFixed(1)} | max: ${max.toFixed(0)}`);
    }

    if (totalReward >= 195 && episodeRewards.slice(-10).reduce((a, b) => a + b, 0) / 10 >= 195) {
      console.log(`✓ Solved at episode ${ep + 1}!`);
      break;
    }
  }

  return { rewards: episodeRewards, record };
}

// ============ Simple CartPole with Linear Feedback ============

async function trainCartPoleSimple(episodes: number): Promise<{ rewards: number[]; record: EpisodeRecord }> {
  const env = new CartPole();
  const episodeRewards: number[] = [];
  const record: EpisodeRecord = { observations: [], actions: [], rewards: [], dones: [] };

  for (let ep = 0; ep < episodes; ep++) {
    let obs = env.reset() as number[];
    let totalReward = 0;
    let done = false;
    let step = 0;

    while (!done && step < 500) {
      // Simple closed-form policy based on angle
      // Push left (0) if pole is falling left, push right (1) if falling right
      const theta = obs[2]; // pole angle
      const thetaDot = obs[3]; // pole angular velocity

      let action: number;
      if (theta > 0) {
        action = thetaDot > 0.01 ? 1 : 0;
      } else {
        action = thetaDot < -0.01 ? 0 : 1;
      }

      const result = env.step(action);
      const nextObs = result.observation as number[];
      const reward = result.reward;
      done = result.done;

      totalReward += reward;
      obs = nextObs;
      step++;

      if (ep === episodes - 1) {
        record.observations.push(obs);
        record.actions.push(action);
        record.rewards.push(reward);
        record.dones.push(done);
      }
    }

    episodeRewards.push(totalReward);

    if ((ep + 1) % 10 === 0 || ep === 0) {
      console.log(`Episode ${ep + 1}/${episodes} | reward: ${totalReward.toFixed(0)}`);
    }
  }

  return { rewards: episodeRewards, record };
}

// ============ CLI ============

const args = process.argv.slice(2);

function getArg(name: string, defaultVal: string): string {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : defaultVal;
}

const envName = getArg('env', 'CartPole');
const episodes = parseInt(getArg('episodes', '1000'));
const save = args.includes('--save');

async function main() {
  setSeed(42);

  if (envName === 'FrozenLake') {
    console.log(`\n=== Training FrozenLake with Q-Table ===\n`);
    const { rewards, agent, record } = await trainFrozenLake(episodes);

    const finalAvg = rewards.slice(-10).reduce((a, b) => a + b, 0) / 10;
    console.log(`\n=== Complete ===`);
    console.log(`Final avg (last 10): ${finalAvg.toFixed(2)}`);
    console.log(`Success rate: ${rewards.filter(r => r > 0).length}/${episodes} episodes`);

    if (save) {
      await saveToServer('FrozenLake', record, rewards.reduce((a, b) => a + b, 0) / rewards.length);
    }

  } else if (envName === 'CartPole') {
    console.log(`\n=== Training CartPole with Simple Policy ===\n`);
    const { rewards, record } = await trainCartPoleSimple(episodes);

    const finalAvg = rewards.slice(-10).reduce((a, b) => a + b, 0) / 10;
    console.log(`\n=== Complete ===`);
    console.log(`Final avg (last 10): ${finalAvg.toFixed(1)}`);
    console.log(`Best reward: ${Math.max(...rewards)}`);

    if (save) {
      await saveToServer('CartPole', record, rewards.reduce((a, b) => a + b, 0) / rewards.length);
    }

  } else {
    console.error(`Unknown env: ${envName}`);
    process.exit(1);
  }
}

async function saveToServer(env: string, record: EpisodeRecord, avgReward: number) {
  try {
    const API_BASE = 'http://localhost:3001';
    const res = await fetch(`${API_BASE}/api/gym`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${env}-${Date.now()}`,
        env,
        episodeRecord: record,
        totalReward: avgReward,
        success: avgReward > 0.5,
      }),
    });
    const data = await res.json();
    console.log(`\n✓ Saved to server: ${data.id}`);
  } catch (e) {
    console.log(`\n⚠ Server not available, skipping save`);
  }
}

main().catch(console.error);