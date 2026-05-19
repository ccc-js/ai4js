import type { Space } from './spaces.js';

export interface StepResult {
  observation: number[];
  reward: number;
  done: boolean;
  info: Record<string, unknown>;
}

export interface Env {
  observation_space: Space;
  action_space: Space;
  reset(): number[];
  step(action: number | number[]): StepResult;
  render?(): void;
  close?(): void;
}