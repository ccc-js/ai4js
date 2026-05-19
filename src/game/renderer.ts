import type { Game, GameEntity } from './engine.js';

export interface EnvState {
  observation: number[];
  reward: number;
  done: boolean;
  info: Record<string, unknown>;
}

export interface Renderer {
  init(game: Game): void;
  render(state: EnvState, action?: number): void;
  close(): void;
}

export interface RendererFactory {
  create(): Renderer;
}