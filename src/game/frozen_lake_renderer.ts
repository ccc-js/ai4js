import { Game, Sprite } from './engine.js';
import type { Renderer, EnvState } from './renderer.js';

export interface FrozenLakeRendererConfig {
  gridSize?: number;
  cellSize?: number;
  agentColor?: string;
  goalColor?: string;
  holeColor?: string;
  iceColor?: string;
  startColor?: string;
}

const DEFAULT_CONFIG: Required<FrozenLakeRendererConfig> = {
  gridSize: 8,
  cellSize: 50,
  agentColor: '#ff6b6b',
  goalColor: '#51cf66',
  holeColor: '#495057',
  iceColor: '#e9ecef',
  startColor: '#ffd43b',
};

const MAP_8X8 = [
  'SFFFFFFF',
  'FHHFFFHF',
  'FFFHFFHF',
  'FFFHFFFF',
  'HFF FFFH',
  'FFFFFFFH',
  'FHHFFFHF',
  'FFFFFFFG',
];

export class FrozenLakeRenderer implements Renderer {
  private config: Required<FrozenLakeRendererConfig>;
  private game!: Game;
  private agent?: Sprite;
  private cellSize: number;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private currentState?: EnvState;
  private currentAction?: number;

  constructor(config: FrozenLakeRendererConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cellSize = this.config.cellSize;
  }

  init(game: Game): void {
    this.game = game;
    const totalWidth = this.config.gridSize * this.cellSize;
    const totalHeight = this.config.gridSize * this.cellSize;

    this.offsetX = (game.getCanvas().width - totalWidth) / 2;
    this.offsetY = (game.getCanvas().height - totalHeight) / 2;

    game.onRender(() => {
      this.drawGrid();
      this.drawState();
    });
  }

  private createGridEntity(row: number, col: number, type: string): Sprite {
    const sprite = new Sprite(`cell_${row}_${col}`);
    sprite.setPosition(
      this.offsetX + col * this.cellSize + this.cellSize / 2,
      this.offsetY + row * this.cellSize + this.cellSize / 2
    );
    sprite.setSize(this.cellSize - 4, this.cellSize - 4);

    switch (type) {
      case 'S':
        sprite.setColor(255, 212, 59);
        break;
      case 'G':
        sprite.setColor(81, 207, 102);
        break;
      case 'H':
        sprite.setColor(73, 80, 87);
        break;
      default:
        sprite.setColor(233, 236, 239);
    }

    return sprite;
  }

  private drawGrid(): void {
    const ctx = this.game.getContext();

    for (let r = 0; r < this.config.gridSize; r++) {
      for (let c = 0; c < this.config.gridSize; c++) {
        const x = this.offsetX + c * this.cellSize;
        const y = this.offsetY + r * this.cellSize;

        const cellType = MAP_8X8[r][c];
        let color: string;

        switch (cellType) {
          case 'S':
            color = '#ffd43b';
            break;
          case 'G':
            color = '#51cf66';
            break;
          case 'H':
            color = '#495057';
            break;
          default:
            color = '#e9ecef';
        }

        ctx.fillStyle = color;
        ctx.fillRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);

        if (cellType === 'F') {
          ctx.fillStyle = '#dee2e6';
          ctx.beginPath();
          ctx.arc(x + this.cellSize / 2, y + this.cellSize / 2, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
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
    const stateIdx = state.observation[0];
    const row = Math.floor(stateIdx / this.config.gridSize);
    const col = stateIdx % this.config.gridSize;

    if (this.agent) {
      this.game.removeEntity(this.agent);
    }

    this.agent = new Sprite('agent');
    this.agent.setPosition(
      this.offsetX + col * this.cellSize + this.cellSize / 2,
      this.offsetY + row * this.cellSize + this.cellSize / 2
    );
    this.agent.setSize(this.cellSize * 0.6, this.cellSize * 0.6);
    this.agent.setColor(255, 107, 107);

    const ctx = this.game.getContext();
    const x = this.offsetX + col * this.cellSize + this.cellSize / 2;
    const y = this.offsetY + row * this.cellSize + this.cellSize / 2;

    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(x, y, this.cellSize * 0.3, 0, Math.PI * 2);
    ctx.fill();

    if (this.currentAction !== undefined) {
      const actionNames = ['↑', '↓', '←', '→'];
      ctx.fillStyle = '#495057';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(actionNames[this.currentAction], x, y + this.cellSize * 0.5);
    }

    if (state.done) {
      ctx.fillStyle = state.info['success'] ? '#51cf66' : '#495057';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(
        state.info['success'] ? 'WIN!' : 'FALL!',
        this.game.getCanvas().width / 2,
        this.game.getCanvas().height - 20
      );
    }
  }

  close(): void {
    this.currentState = undefined;
    this.currentAction = undefined;
  }
}

export function createFrozenLakeRenderer(
  config?: FrozenLakeRendererConfig
): Renderer {
  return new FrozenLakeRenderer(config);
}
