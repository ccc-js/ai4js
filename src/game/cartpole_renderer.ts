import type { Game } from './engine.js';
import type { Renderer, EnvState } from './renderer.js';

export interface CartPoleRendererConfig {
  trackLength?: number;
  cartWidth?: number;
  cartHeight?: number;
  poleLength?: number;
  backgroundColor?: string;
  trackColor?: string;
  cartColor?: string;
  poleColor?: string;
}

const DEFAULT_CONFIG: Required<CartPoleRendererConfig> = {
  trackLength: 400,
  cartWidth: 80,
  cartHeight: 30,
  poleLength: 100,
  backgroundColor: '#1a1a2e',
  trackColor: '#4a4a6a',
  cartColor: '#e94560',
  poleColor: '#16213e',
};

export class CartPoleRenderer implements Renderer {
  private config: Required<CartPoleRendererConfig>;
  private game!: Game;
  private canvasWidth: number = 0;
  private canvasHeight: number = 0;
  private scale: number = 0;
  private currentState?: EnvState;
  private currentAction?: number;

  constructor(config: CartPoleRendererConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  init(game: Game): void {
    this.game = game;
    this.canvasWidth = game.getCanvas().width;
    this.canvasHeight = game.getCanvas().height;
    this.scale = this.canvasWidth / (this.config.trackLength * 2.5);
    game.onRender(() => this.drawState());
  }

  render(state: EnvState, action?: number): void {
    this.currentState = state;
    this.currentAction = action;
  }

  private drawState(): void {
    if (!this.currentState) {
      return;
    }

    const state = this.currentState;
    const [x, x_dot, theta, theta_dot] = state.observation;
    const cartX = x * this.scale;
    const cartTheta = theta;

    const ctx = this.game.getContext();
    const centerX = this.canvasWidth / 2;
    const trackY = this.canvasHeight * 0.65;
    const cartY = trackY - this.config.cartHeight / 2;

    ctx.fillStyle = this.config.backgroundColor;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    ctx.strokeStyle = this.config.trackColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX - this.config.trackLength * this.scale, trackY);
    ctx.lineTo(centerX + this.config.trackLength * this.scale, trackY);
    ctx.stroke();

    for (let i = -4; i <= 4; i++) {
      const markerX = centerX + i * 50 * this.scale;
      ctx.strokeStyle = '#6c6c8a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(markerX, trackY - 5);
      ctx.lineTo(markerX, trackY + 5);
      ctx.stroke();
    }

    const cartScreenX = centerX + cartX;
    const poleEndX = cartScreenX + Math.sin(cartTheta) * this.config.poleLength;
    const poleEndY = cartY - Math.cos(cartTheta) * this.config.poleLength;

    ctx.strokeStyle = this.config.poleColor;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cartScreenX, cartY);
    ctx.lineTo(poleEndX, poleEndY);
    ctx.stroke();

    const gradient = ctx.createLinearGradient(
      cartScreenX - this.config.cartWidth / 2,
      cartY - this.config.cartHeight / 2,
      cartScreenX + this.config.cartWidth / 2,
      cartY - this.config.cartHeight / 2
    );
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(1, '#ee5a5a');
    ctx.fillStyle = gradient;
    ctx.fillRect(
      cartScreenX - this.config.cartWidth / 2,
      cartY - this.config.cartHeight / 2,
      this.config.cartWidth,
      this.config.cartHeight
    );

    ctx.strokeStyle = '#aa3a3a';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      cartScreenX - this.config.cartWidth / 2,
      cartY - this.config.cartHeight / 2,
      this.config.cartWidth,
      this.config.cartHeight
    );

    const wheelRadius = 8;
    ctx.fillStyle = '#2a2a4a';
    ctx.beginPath();
    ctx.arc(
      cartScreenX - this.config.cartWidth / 2 + 10,
      cartY + this.config.cartHeight / 2,
      wheelRadius,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.beginPath();
    ctx.arc(
      cartScreenX + this.config.cartWidth / 2 - 10,
      cartY + this.config.cartHeight / 2,
      wheelRadius,
      0,
      Math.PI * 2
    );
    ctx.fill();

    const thetaDeg = (cartTheta * 180 / Math.PI).toFixed(1);
    const xPos = x.toFixed(2);

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`θ: ${thetaDeg}°`, 20, 30);
    ctx.fillText(`x: ${xPos}`, 20, 50);
    ctx.fillText(`θ̇: ${theta_dot.toFixed(2)}`, 20, 70);
    ctx.fillText(`ẋ: ${x_dot.toFixed(2)}`, 20, 90);

    if (this.currentAction !== undefined) {
      ctx.fillStyle = '#ffd43b';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`Action: ${this.currentAction === 0 ? '← LEFT' : 'RIGHT →'}`, this.canvasWidth - 20, 30);
    }

    if (state.done) {
      ctx.fillStyle = state.info['truncated'] ? '#ffd43b' : '#ff6b6b';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        state.info['truncated'] ? 'TIME UP!' : 'FELL!',
        this.canvasWidth / 2,
        this.canvasHeight - 30
      );
    }

    const thetaLimit = (15 * Math.PI / 180).toFixed(1);
    const xLimit = 2.4;
    ctx.fillStyle = '#6c757d';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`θ limit: ±${thetaLimit} rad`, this.canvasWidth - 20, 50);
    ctx.fillText(`x limit: ±${xLimit}`, this.canvasWidth - 20, 70);
  }

  close(): void {
    this.currentState = undefined;
    this.currentAction = undefined;
  }
}

export function createCartPoleRenderer(
  config?: CartPoleRendererConfig
): Renderer {
  return new CartPoleRenderer(config);
}
