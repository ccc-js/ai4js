import type { Env } from './env.js';

export interface EpisodeRecord {
  observations: number[][];
  actions: number[];
  rewards: number[];
  dones: boolean[];
}

export interface ReplayOptions {
  episodeRecord: EpisodeRecord;
  onStep?: (step: number, obs: number[], action: number, reward: number, done: boolean) => void;
  onDone?: (totalReward: number, success: boolean) => void;
}

export class GymReplay {
  private episodeRecord: EpisodeRecord;
  private onStep?: ReplayOptions['onStep'];
  private onDone?: ReplayOptions['onDone'];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private currentStep = 0;
  private playing = false;
  private speed = 50; // ms per step

  constructor(options: ReplayOptions) {
    this.episodeRecord = options.episodeRecord;
    this.onStep = options.onStep;
    this.onDone = options.onDone;
  }

  play(): void {
    if (this.playing) return;
    if (this.currentStep >= this.episodeRecord.observations.length) {
      this.currentStep = 0;
    }
    this.playing = true;
    this.tick();
  }

  pause(): void {
    this.playing = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  stop(): void {
    this.pause();
    this.currentStep = 0;
  }

  tick(): void {
    if (!this.playing) return;
    if (this.currentStep >= this.episodeRecord.observations.length) {
      this.finish();
      return;
    }

    const obs = this.episodeRecord.observations[this.currentStep];
    const action = this.episodeRecord.actions[this.currentStep] ?? 0;
    const reward = this.episodeRecord.rewards[this.currentStep] ?? 0;
    const done = this.episodeRecord.dones[this.currentStep] ?? false;

    if (this.onStep) {
      this.onStep(this.currentStep, obs, action, reward, done);
    }

    this.currentStep++;

    if (done || this.currentStep >= this.episodeRecord.observations.length) {
      this.finish();
      return;
    }

    this.timer = setTimeout(() => this.tick(), this.speed);
  }

  private finish(): void {
    this.playing = false;
    const totalReward = this.episodeRecord.rewards.reduce((a, b) => a + b, 0);
    const success = this.episodeRecord.dones[this.episodeRecord.dones.length - 1] === false
      ? false  // truncated (ran out of steps) - not success
      : totalReward > 0;  // got positive reward
    if (this.onDone) {
      this.onDone(totalReward, success);
    }
  }

  setSpeed(msPerStep: number): void {
    this.speed = msPerStep;
  }

  getCurrentStep(): number {
    return this.currentStep;
  }

  isPlaying(): boolean {
    return this.playing;
  }

  getTotalSteps(): number {
    return this.episodeRecord.observations.length;
  }
}

export function createEpisodeRecord(): EpisodeRecord {
  return {
    observations: [],
    actions: [],
    rewards: [],
    dones: [],
  };
}

export function recordStep(
  record: EpisodeRecord,
  obs: number[],
  action: number,
  reward: number,
  done: boolean
): void {
  record.observations.push(obs);
  record.actions.push(action);
  record.rewards.push(reward);
  record.dones.push(done);
}