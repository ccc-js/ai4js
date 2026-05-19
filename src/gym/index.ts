export { Discrete, Box, type Space } from './spaces.js';
export type { Env, StepResult } from './env.js';
export { FrozenLake, type FrozenLakeConfig } from './frozen_lake.js';
export { CartPole, type CartPoleConfig } from './cartpole.js';
export { GymReplay, createEpisodeRecord, recordStep, type EpisodeRecord } from './replay.js';