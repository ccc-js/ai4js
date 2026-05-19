export interface Vector2 {
  x: number;
  y: number;
}

export interface Vector3 extends Vector2 {
  z: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface GameConfig {
  canvas: HTMLCanvasElement | string;
  width: number;
  height: number;
  backgroundColor?: Color;
  debug?: boolean;
}

export class GameEntity {
  name: string;
  position: Vector2 = { x: 0, y: 0 };
  scale: Vector2 = { x: 1, y: 1 };
  rotation: number = 0;
  visible: boolean = true;
  children: GameEntity[] = [];
  parent: GameEntity | null = null;

  constructor(name: string = 'Entity') {
    this.name = name;
  }

  addChild(child: GameEntity): void {
    child.parent = this;
    this.children.push(child);
  }

  removeChild(child: GameEntity): void {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parent = null;
    }
  }

  setPosition(x: number, y: number): this {
    this.position.x = x;
    this.position.y = y;
    return this;
  }

  setScale(x: number, y: number = x): this {
    this.scale.x = x;
    this.scale.y = y;
    return this;
  }

  setRotation(angle: number): this {
    this.rotation = angle;
    return this;
  }
}

export class Sprite extends GameEntity {
  color: Color = { r: 1, g: 1, b: 1, a: 1 };
  width: number = 1;
  height: number = 1;
  texture?: HTMLImageElement | HTMLCanvasElement;
  opacity: number = 1;

  constructor(name: string = 'Sprite') {
    super(name);
  }

  setColor(r: number, g: number, b: number, a: number = 1): this {
    this.color = { r, g, b, a };
    return this;
  }

  setSize(width: number, height: number): this {
    this.width = width;
    this.height = height;
    return this;
  }
}

export class Camera extends GameEntity {
  fov: number = 60;
  nearClip: number = 0.1;
  farClip: number = 1000;
  orthoHeight: number = 10;

  constructor(name: string = 'Camera') {
    super(name);
  }
}

export type UpdateCallback = (dt: number) => void;
export type RenderCallback = () => void;

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private backgroundColor: Color;
  private entities: GameEntity[] = [];
  private camera: Camera;
  private running: boolean = false;
  private lastTime: number = 0;
  private updateCallbacks: UpdateCallback[] = [];
  private renderCallbacks: RenderCallback[] = [];

  constructor(config: GameConfig) {
    if (typeof config.canvas === 'string') {
      const el = document.querySelector(config.canvas) as HTMLCanvasElement;
      if (!el) throw new Error(`Canvas not found: ${config.canvas}`);
      this.canvas = el;
    } else {
      this.canvas = config.canvas;
    }

    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;

    this.width = config.width;
    this.height = config.height;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.backgroundColor = config.backgroundColor || { r: 0.1, g: 0.1, b: 0.1 };
    this.camera = new Camera('MainCamera');
    this.camera.position = { x: this.width / 2, y: this.height / 2 };
  }

  addEntity(entity: GameEntity): void {
    this.entities.push(entity);
  }

  removeEntity(entity: GameEntity): void {
    const idx = this.entities.indexOf(entity);
    if (idx !== -1) this.entities.splice(idx, 1);
  }

  getCamera(): Camera {
    return this.camera;
  }

  onUpdate(callback: UpdateCallback): void {
    this.updateCallbacks.push(callback);
  }

  onRender(callback: RenderCallback): void {
    this.renderCallbacks.push(callback);
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
  }

  stop(): void {
    this.running = false;
  }

  private loop = (): void => {
    if (!this.running) return;

    const now = performance.now();
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    for (const cb of this.updateCallbacks) {
      cb(dt);
    }
  }

  private render(): void {
    const { ctx, width, height, backgroundColor } = this;
    const { r, g, b } = backgroundColor;

    ctx.fillStyle = `rgb(${Math.floor(r * 255)}, ${Math.floor(g * 255)}, ${Math.floor(b * 255)})`;
    ctx.fillRect(0, 0, width, height);

    ctx.save();

    for (const entity of this.entities) {
      this.renderEntity(entity);
    }

    ctx.restore();

    for (const cb of this.renderCallbacks) {
      cb();
    }
  }

  private renderEntity(entity: GameEntity): void {
    if (!entity.visible) return;

    const { ctx } = this;

    ctx.save();
    ctx.translate(entity.position.x, entity.position.y);
    ctx.rotate(entity.rotation);

    if (entity instanceof Sprite) {
      ctx.globalAlpha = entity.opacity;
      ctx.fillStyle = `rgb(${Math.floor(entity.color.r * 255)}, ${Math.floor(entity.color.g * 255)}, ${Math.floor(entity.color.b * 255)})`;

      if (entity.texture) {
        ctx.drawImage(
          entity.texture,
          -entity.width / 2,
          -entity.height / 2,
          entity.width,
          entity.height
        );
      } else {
        ctx.fillRect(-entity.width / 2, -entity.height / 2, entity.width, entity.height);
      }
    }

    for (const child of entity.children) {
      this.renderEntity(child);
    }

    ctx.restore();
  }

  clear(): void {
    this.entities = [];
  }

  screenToWorld(screenPos: Vector2): Vector2 {
    return {
      x: screenPos.x,
      y: this.height - screenPos.y,
    };
  }

  worldToScreen(worldPos: Vector2): Vector2 {
    return {
      x: worldPos.x,
      y: this.height - worldPos.y,
    };
  }
}

export function createGame(config: GameConfig): Game {
  return new Game(config);
}

export type { Game as GameEngine };