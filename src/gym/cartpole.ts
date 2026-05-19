import { Discrete, Box } from './spaces.js';
import type { Env, StepResult } from './env.js';

export interface CartPoleConfig {
  max_steps?: number;
  gravity?: number;
  mass_cart?: number;
  mass_pole?: number;
  length?: number;
  force_mag?: number;
  theta_threshold?: number;
  x_threshold?: number;
}

export class CartPole implements Env {
  observation_space: Box;
  action_space: Discrete;

  private gravity: number;
  private mass_cart: number;
  private mass_pole: number;
  private length: number;
  private force_mag: number;
  private theta_threshold: number;
  private x_threshold: number;
  private max_steps: number;

  private x: number = 0;
  private x_dot: number = 0;
  private theta: number = 0;
  private theta_dot: number = 0;
  private steps: number = 0;

  constructor(config: CartPoleConfig = {}) {
    this.gravity = config.gravity ?? 9.8;
    this.mass_cart = config.mass_cart ?? 1.0;
    this.mass_pole = config.mass_pole ?? 0.1;
    this.length = config.length ?? 0.5;
    this.force_mag = config.force_mag ?? 10.0;
    this.theta_threshold = config.theta_threshold ?? Math.PI / 12;
    this.x_threshold = config.x_threshold ?? 2.4;
    this.max_steps = config.max_steps ?? 500;

    this.observation_space = new Box(
      [-2.4, -3.5, -0.21, -3.5],
      [2.4, 3.5, 0.21, 3.5]
    );
    this.action_space = new Discrete(2);
  }

  reset(): number[] {
    this.x = (Math.random() - 0.5) * 0.1;
    this.x_dot = (Math.random() - 0.5) * 0.1;
    this.theta = (Math.random() - 0.5) * 0.1;
    this.theta_dot = (Math.random() - 0.5) * 0.1;
    this.steps = 0;
    return this.getObservation();
  }

  step(action: number | number[]): StepResult {
    const act = Array.isArray(action) ? action[0] : action;
    if (!this.action_space.contains(act)) {
      throw new Error(`Invalid action: ${act}`);
    }

    const force = act === 1 ? this.force_mag : -this.force_mag;
    const total_mass = this.mass_cart + this.mass_pole;
    const pole_mass_length = this.mass_pole * this.length;

    const cosTheta = Math.cos(this.theta);
    const sinTheta = Math.sin(this.theta);

    const temp = (force + pole_mass_length * this.theta_dot ** 2 * sinTheta) / total_mass;
    const thetaAcc = (this.gravity * sinTheta - cosTheta * temp) /
      (this.length * (4.0 / 3.0 - this.mass_pole * cosTheta ** 2 / total_mass));
    const xAcc = temp - pole_mass_length * thetaAcc * cosTheta / total_mass;

    const dt = 0.02;
    this.x += dt * this.x_dot;
    this.x_dot += dt * xAcc;
    this.theta += dt * this.theta_dot;
    this.theta_dot += dt * thetaAcc;

    this.steps++;

    const done =
      this.x < -this.x_threshold ||
      this.x > this.x_threshold ||
      this.theta < -this.theta_threshold ||
      this.theta > this.theta_threshold;

    const reward = done ? 0.0 : 1.0;

    const info: Record<string, unknown> = {};
    if (done && this.steps >= this.max_steps) {
      info['truncated'] = true;
    }

    return {
      observation: this.getObservation(),
      reward,
      done,
      info,
    };
  }

  private getObservation(): number[] {
    return [this.x, this.x_dot, this.theta, this.theta_dot];
  }

  render(): void {
    const scale = 20;
    const cartX = Math.round((this.x + 3) * scale);
    const cartStr = '━'.repeat(Math.max(0, cartX)) + '■' + '━'.repeat(Math.max(0, 60 - cartX));
    console.log(cartStr);
    console.log(`Angle: ${(this.theta * 180 / Math.PI).toFixed(1)}°`);
    console.log('');
  }

  close(): void {}
}