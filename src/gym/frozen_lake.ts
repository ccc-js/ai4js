import { Discrete, Box } from './spaces.js';
import type { Env, StepResult } from './env.js';

const MAP_8X8 = [
  'SFFFFFFF',
  'FHHFFFHF',
  'FFFHFFHF',
  'FFFHFFFF',
  'HF FFFFH',
  'FFFFFFFH',
  'FHHFFFHF',
  'FFFFFFFG',
];

export interface FrozenLakeConfig {
  map?: string[];
  size?: number;
  max_steps?: number;
  reward_success?: number;
  reward_fail?: number;
  reward_step?: number;
  slip_prob?: number;
  is_slippery?: boolean;
}

export class FrozenLake implements Env {
  observation_space: Discrete;
  action_space: Discrete;
  private map: string[];
  private size: number;
  private max_steps: number;
  private reward_success: number;
  private reward_fail: number;
  private reward_step: number;
  private slip_prob: number;
  private is_slippery: boolean;

  private state: number = 0;
  private steps: number = 0;

  constructor(config: FrozenLakeConfig = {}) {
    this.map = config.map || MAP_8X8;
    this.size = config.size || this.map.length;
    this.max_steps = config.max_steps || 100;
    this.reward_success = config.reward_success ?? 1.0;
    this.reward_fail = config.reward_fail ?? 0.0;
    this.reward_step = config.reward_step ?? 0.0;
    this.slip_prob = config.slip_prob ?? (1 / 3);
    this.is_slippery = config.is_slippery ?? true;

    this.observation_space = new Discrete(this.size * this.size);
    this.action_space = new Discrete(4);
  }

  reset(): number[] {
    this.state = 0;
    this.steps = 0;
    return [this.state];
  }

  step(action: number | number[]): StepResult {
    const act = Array.isArray(action) ? action[0] : action;
    if (!this.action_space.contains(act)) {
      throw new Error(`Invalid action: ${act}`);
    }

    this.steps++;
    let new_state = this.state;
    const row = Math.floor(this.state / this.size);
    const col = this.state % this.size;

    if (this.is_slippery && Math.random() < this.slip_prob) {
      const perpendiculars = this.getPerpendicularActions(act);
      action = perpendiculars[Math.floor(Math.random() * perpendiculars.length)];
    }

    switch (action) {
      case 0: if (row > 0) new_state = this.state - this.size; break;
      case 1: if (row < this.size - 1) new_state = this.state + this.size; break;
      case 2: if (col > 0) new_state = this.state - 1; break;
      case 3: if (col < this.size - 1) new_state = this.state + 1; break;
    }

    const cell = this.getCell(new_state);
    let reward = this.reward_step;
    let done = false;
    let info: Record<string, unknown> = {};

    if (cell === 'G') {
      reward = this.reward_success;
      done = true;
      info = { success: true };
    } else if (cell === 'H') {
      reward = this.reward_fail;
      done = true;
      info = { success: false };
    }

    if (this.steps >= this.max_steps) {
      done = true;
      info = { ...info, truncated: true };
    }

    this.state = new_state;
    return { observation: [this.state], reward, done, info };
  }

  private getCell(state: number): string {
    const row = Math.floor(state / this.size);
    const col = state % this.size;
    return this.map[row][col];
  }

  private getPerpendicularActions(action: number): number[] {
    if (action === 0 || action === 1) return [2, 3];
    return [0, 1];
  }

  render(): void {
    for (let r = 0; r < this.size; r++) {
      let row = '';
      for (let c = 0; c < this.size; c++) {
        const s = r * this.size + c;
        if (s === this.state) {
          row += '●';
        } else {
          row += this.map[r][c];
        }
        row += ' ';
      }
      console.log(row);
    }
    console.log('');
  }

  close(): void {}
}