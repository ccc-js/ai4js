var ai4js = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // src/gym/spaces.ts
  var Discrete, Box;
  var init_spaces = __esm({
    "src/gym/spaces.ts"() {
      Discrete = class {
        constructor(n) {
          this.n = n;
        }
        sample() {
          return Math.floor(Math.random() * this.n);
        }
        contains(x) {
          return Number.isInteger(x) && x >= 0 && x < this.n;
        }
      };
      Box = class {
        constructor(low, high, shape) {
          this.low = low;
          this.high = high;
          if (shape) {
            this.shape = shape;
          } else {
            this.shape = [low.length];
          }
        }
        sample() {
          const result = [];
          for (let i = 0; i < this.shape[0]; i++) {
            result.push(this.low[i] + Math.random() * (this.high[i] - this.low[i]));
          }
          return result;
        }
        contains(x) {
          if (x.length !== this.shape[0]) return false;
          for (let i = 0; i < x.length; i++) {
            if (x[i] < this.low[i] || x[i] > this.high[i]) return false;
          }
          return true;
        }
      };
    }
  });

  // src/gym/frozen_lake.ts
  var MAP_8X8, FrozenLake;
  var init_frozen_lake = __esm({
    "src/gym/frozen_lake.ts"() {
      init_spaces();
      MAP_8X8 = [
        "SFFFFFFF",
        "FHHFFFHF",
        "FFFHFFHF",
        "FFFHFFFF",
        "HF FFFFH",
        "FFFFFFFH",
        "FHHFFFHF",
        "FFFFFFFG"
      ];
      FrozenLake = class {
        constructor(config = {}) {
          this.state = 0;
          this.steps = 0;
          this.map = config.map || MAP_8X8;
          this.size = config.size || this.map.length;
          this.max_steps = config.max_steps || 100;
          this.reward_success = config.reward_success ?? 1;
          this.reward_fail = config.reward_fail ?? 0;
          this.reward_step = config.reward_step ?? 0;
          this.slip_prob = config.slip_prob ?? 1 / 3;
          this.is_slippery = config.is_slippery ?? true;
          this.observation_space = new Discrete(this.size * this.size);
          this.action_space = new Discrete(4);
        }
        reset() {
          this.state = 0;
          this.steps = 0;
          return [this.state];
        }
        step(action) {
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
            case 0:
              if (row > 0) new_state = this.state - this.size;
              break;
            case 1:
              if (row < this.size - 1) new_state = this.state + this.size;
              break;
            case 2:
              if (col > 0) new_state = this.state - 1;
              break;
            case 3:
              if (col < this.size - 1) new_state = this.state + 1;
              break;
          }
          const cell = this.getCell(new_state);
          let reward = this.reward_step;
          let done = false;
          let info = {};
          if (cell === "G") {
            reward = this.reward_success;
            done = true;
            info = { success: true };
          } else if (cell === "H") {
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
        getCell(state) {
          const row = Math.floor(state / this.size);
          const col = state % this.size;
          return this.map[row][col];
        }
        getPerpendicularActions(action) {
          if (action === 0 || action === 1) return [2, 3];
          return [0, 1];
        }
        render() {
          for (let r = 0; r < this.size; r++) {
            let row = "";
            for (let c = 0; c < this.size; c++) {
              const s = r * this.size + c;
              if (s === this.state) {
                row += "\u25CF";
              } else {
                row += this.map[r][c];
              }
              row += " ";
            }
            console.log(row);
          }
          console.log("");
        }
        close() {
        }
      };
    }
  });

  // src/gym/cartpole.ts
  var CartPole;
  var init_cartpole = __esm({
    "src/gym/cartpole.ts"() {
      init_spaces();
      CartPole = class {
        constructor(config = {}) {
          this.x = 0;
          this.x_dot = 0;
          this.theta = 0;
          this.theta_dot = 0;
          this.steps = 0;
          this.gravity = config.gravity ?? 9.8;
          this.mass_cart = config.mass_cart ?? 1;
          this.mass_pole = config.mass_pole ?? 0.1;
          this.length = config.length ?? 0.5;
          this.force_mag = config.force_mag ?? 10;
          this.theta_threshold = config.theta_threshold ?? Math.PI / 12;
          this.x_threshold = config.x_threshold ?? 2.4;
          this.max_steps = config.max_steps ?? 500;
          this.observation_space = new Box(
            [-2.4, -3.5, -0.21, -3.5],
            [2.4, 3.5, 0.21, 3.5]
          );
          this.action_space = new Discrete(2);
        }
        reset() {
          this.x = (Math.random() - 0.5) * 0.1;
          this.x_dot = (Math.random() - 0.5) * 0.1;
          this.theta = (Math.random() - 0.5) * 0.1;
          this.theta_dot = (Math.random() - 0.5) * 0.1;
          this.steps = 0;
          return this.getObservation();
        }
        step(action) {
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
          const thetaAcc = (this.gravity * sinTheta - cosTheta * temp) / (this.length * (4 / 3 - this.mass_pole * cosTheta ** 2 / total_mass));
          const xAcc = temp - pole_mass_length * thetaAcc * cosTheta / total_mass;
          const dt = 0.02;
          this.x += dt * this.x_dot;
          this.x_dot += dt * xAcc;
          this.theta += dt * this.theta_dot;
          this.theta_dot += dt * thetaAcc;
          this.steps++;
          const done = this.x < -this.x_threshold || this.x > this.x_threshold || this.theta < -this.theta_threshold || this.theta > this.theta_threshold;
          const reward = done ? 0 : 1;
          const info = {};
          if (done && this.steps >= this.max_steps) {
            info["truncated"] = true;
          }
          return {
            observation: this.getObservation(),
            reward,
            done,
            info
          };
        }
        getObservation() {
          return [this.x, this.x_dot, this.theta, this.theta_dot];
        }
        render() {
          const scale = 20;
          const cartX = Math.round((this.x + 3) * scale);
          const cartStr = "\u2501".repeat(Math.max(0, cartX)) + "\u25A0" + "\u2501".repeat(Math.max(0, 60 - cartX));
          console.log(cartStr);
          console.log(`Angle: ${(this.theta * 180 / Math.PI).toFixed(1)}\xB0`);
          console.log("");
        }
        close() {
        }
      };
    }
  });

  // src/gym/index.ts
  var gym_exports = {};
  __export(gym_exports, {
    Box: () => Box,
    CartPole: () => CartPole,
    Discrete: () => Discrete,
    FrozenLake: () => FrozenLake
  });
  var init_gym = __esm({
    "src/gym/index.ts"() {
      init_spaces();
      init_frozen_lake();
      init_cartpole();
    }
  });

  // src/game/engine.ts
  function createGame(config) {
    return new Game(config);
  }
  var GameEntity, Sprite, Camera, Game;
  var init_engine = __esm({
    "src/game/engine.ts"() {
      GameEntity = class {
        constructor(name = "Entity") {
          this.position = { x: 0, y: 0 };
          this.scale = { x: 1, y: 1 };
          this.rotation = 0;
          this.visible = true;
          this.children = [];
          this.parent = null;
          this.name = name;
        }
        addChild(child) {
          child.parent = this;
          this.children.push(child);
        }
        removeChild(child) {
          const idx = this.children.indexOf(child);
          if (idx !== -1) {
            this.children.splice(idx, 1);
            child.parent = null;
          }
        }
        setPosition(x, y) {
          this.position.x = x;
          this.position.y = y;
          return this;
        }
        setScale(x, y = x) {
          this.scale.x = x;
          this.scale.y = y;
          return this;
        }
        setRotation(angle) {
          this.rotation = angle;
          return this;
        }
      };
      Sprite = class extends GameEntity {
        constructor(name = "Sprite") {
          super(name);
          this.color = { r: 1, g: 1, b: 1, a: 1 };
          this.width = 1;
          this.height = 1;
          this.opacity = 1;
        }
        setColor(r, g, b, a = 1) {
          this.color = { r, g, b, a };
          return this;
        }
        setSize(width, height) {
          this.width = width;
          this.height = height;
          return this;
        }
      };
      Camera = class extends GameEntity {
        constructor(name = "Camera") {
          super(name);
          this.fov = 60;
          this.nearClip = 0.1;
          this.farClip = 1e3;
          this.orthoHeight = 10;
        }
      };
      Game = class {
        constructor(config) {
          this.entities = [];
          this.running = false;
          this.lastTime = 0;
          this.updateCallbacks = [];
          this.renderCallbacks = [];
          this.loop = () => {
            if (!this.running) return;
            const now = performance.now();
            const dt = (now - this.lastTime) / 1e3;
            this.lastTime = now;
            this.update(dt);
            this.render();
            requestAnimationFrame(this.loop);
          };
          if (typeof config.canvas === "string") {
            const el = document.querySelector(config.canvas);
            if (!el) throw new Error(`Canvas not found: ${config.canvas}`);
            this.canvas = el;
          } else {
            this.canvas = config.canvas;
          }
          const ctx = this.canvas.getContext("2d");
          if (!ctx) throw new Error("Could not get 2D context");
          this.ctx = ctx;
          this.width = config.width;
          this.height = config.height;
          this.canvas.width = this.width;
          this.canvas.height = this.height;
          this.backgroundColor = config.backgroundColor || { r: 0.1, g: 0.1, b: 0.1 };
          this.camera = new Camera("MainCamera");
          this.camera.position = { x: this.width / 2, y: this.height / 2 };
        }
        addEntity(entity) {
          this.entities.push(entity);
        }
        removeEntity(entity) {
          const idx = this.entities.indexOf(entity);
          if (idx !== -1) this.entities.splice(idx, 1);
        }
        getCamera() {
          return this.camera;
        }
        onUpdate(callback) {
          this.updateCallbacks.push(callback);
        }
        onRender(callback) {
          this.renderCallbacks.push(callback);
        }
        getContext() {
          return this.ctx;
        }
        getCanvas() {
          return this.canvas;
        }
        start() {
          this.running = true;
          this.lastTime = performance.now();
          this.loop();
        }
        stop() {
          this.running = false;
        }
        update(dt) {
          for (const cb of this.updateCallbacks) {
            cb(dt);
          }
        }
        render() {
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
        renderEntity(entity) {
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
        clear() {
          this.entities = [];
        }
        screenToWorld(screenPos) {
          return {
            x: screenPos.x,
            y: this.height - screenPos.y
          };
        }
        worldToScreen(worldPos) {
          return {
            x: worldPos.x,
            y: this.height - worldPos.y
          };
        }
      };
    }
  });

  // src/game/frozen_lake_renderer.ts
  function createFrozenLakeRenderer(config) {
    return new FrozenLakeRenderer(config);
  }
  var DEFAULT_CONFIG, MAP_8X82, FrozenLakeRenderer;
  var init_frozen_lake_renderer = __esm({
    "src/game/frozen_lake_renderer.ts"() {
      init_engine();
      DEFAULT_CONFIG = {
        gridSize: 8,
        cellSize: 50,
        agentColor: "#ff6b6b",
        goalColor: "#51cf66",
        holeColor: "#495057",
        iceColor: "#e9ecef",
        startColor: "#ffd43b"
      };
      MAP_8X82 = [
        "SFFFFFFF",
        "FHHFFFHF",
        "FFFHFFHF",
        "FFFHFFFF",
        "HFF FFFH",
        "FFFFFFFH",
        "FHHFFFHF",
        "FFFFFFFG"
      ];
      FrozenLakeRenderer = class {
        constructor(config = {}) {
          this.sprites = /* @__PURE__ */ new Map();
          this.offsetX = 0;
          this.offsetY = 0;
          this.config = { ...DEFAULT_CONFIG, ...config };
          this.cellSize = this.config.cellSize;
        }
        init(game) {
          this.game = game;
          const totalWidth = this.config.gridSize * this.cellSize;
          const totalHeight = this.config.gridSize * this.cellSize;
          this.offsetX = (game.getCanvas().width - totalWidth) / 2;
          this.offsetY = (game.getCanvas().height - totalHeight) / 2;
          game.onRender(() => this.drawGrid());
        }
        createGridEntity(row, col, type) {
          const sprite = new Sprite(`cell_${row}_${col}`);
          sprite.setPosition(
            this.offsetX + col * this.cellSize + this.cellSize / 2,
            this.offsetY + row * this.cellSize + this.cellSize / 2
          );
          sprite.setSize(this.cellSize - 4, this.cellSize - 4);
          switch (type) {
            case "S":
              sprite.setColor(255, 212, 59);
              break;
            case "G":
              sprite.setColor(81, 207, 102);
              break;
            case "H":
              sprite.setColor(73, 80, 87);
              break;
            default:
              sprite.setColor(233, 236, 239);
          }
          return sprite;
        }
        drawGrid() {
          const ctx = this.game.getContext();
          for (let r = 0; r < this.config.gridSize; r++) {
            for (let c = 0; c < this.config.gridSize; c++) {
              const x = this.offsetX + c * this.cellSize;
              const y = this.offsetY + r * this.cellSize;
              const cellType = MAP_8X82[r][c];
              let color;
              switch (cellType) {
                case "S":
                  color = "#ffd43b";
                  break;
                case "G":
                  color = "#51cf66";
                  break;
                case "H":
                  color = "#495057";
                  break;
                default:
                  color = "#e9ecef";
              }
              ctx.fillStyle = color;
              ctx.fillRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
              if (cellType === "F") {
                ctx.fillStyle = "#dee2e6";
                ctx.beginPath();
                ctx.arc(x + this.cellSize / 2, y + this.cellSize / 2, 3, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
        }
        render(state, action) {
          const stateIdx = state.observation[0];
          const row = Math.floor(stateIdx / this.config.gridSize);
          const col = stateIdx % this.config.gridSize;
          if (this.agent) {
            this.game.removeEntity(this.agent);
          }
          this.agent = new Sprite("agent");
          this.agent.setPosition(
            this.offsetX + col * this.cellSize + this.cellSize / 2,
            this.offsetY + row * this.cellSize + this.cellSize / 2
          );
          this.agent.setSize(this.cellSize * 0.6, this.cellSize * 0.6);
          this.agent.setColor(255, 107, 107);
          const ctx = this.game.getContext();
          const x = this.offsetX + col * this.cellSize + this.cellSize / 2;
          const y = this.offsetY + row * this.cellSize + this.cellSize / 2;
          ctx.fillStyle = "#ff6b6b";
          ctx.beginPath();
          ctx.arc(x, y, this.cellSize * 0.3, 0, Math.PI * 2);
          ctx.fill();
          if (action !== void 0) {
            const actionNames = ["\u2191", "\u2193", "\u2190", "\u2192"];
            ctx.fillStyle = "#495057";
            ctx.font = "12px monospace";
            ctx.textAlign = "center";
            ctx.fillText(actionNames[action], x, y + this.cellSize * 0.5);
          }
          if (state.done) {
            ctx.fillStyle = state.info["success"] ? "#51cf66" : "#495057";
            ctx.font = "bold 16px sans-serif";
            ctx.fillText(
              state.info["success"] ? "WIN!" : "FALL!",
              this.game.getCanvas().width / 2,
              this.game.getCanvas().height - 20
            );
          }
        }
        close() {
        }
      };
    }
  });

  // src/game/cartpole_renderer.ts
  function createCartPoleRenderer(config) {
    return new CartPoleRenderer(config);
  }
  var DEFAULT_CONFIG2, CartPoleRenderer;
  var init_cartpole_renderer = __esm({
    "src/game/cartpole_renderer.ts"() {
      DEFAULT_CONFIG2 = {
        trackLength: 400,
        cartWidth: 80,
        cartHeight: 30,
        poleLength: 100,
        backgroundColor: "#1a1a2e",
        trackColor: "#4a4a6a",
        cartColor: "#e94560",
        poleColor: "#16213e"
      };
      CartPoleRenderer = class {
        constructor(config = {}) {
          this.cartX = 0;
          this.cartTheta = 0;
          this.canvasWidth = 0;
          this.canvasHeight = 0;
          this.scale = 0;
          this.config = { ...DEFAULT_CONFIG2, ...config };
        }
        init(game) {
          this.game = game;
          this.canvasWidth = game.getCanvas().width;
          this.canvasHeight = game.getCanvas().height;
          this.scale = this.canvasWidth / (this.config.trackLength * 2.5);
        }
        render(state, action) {
          const [x, x_dot, theta, theta_dot] = state.observation;
          this.cartX = x * this.scale;
          this.cartTheta = theta;
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
            ctx.strokeStyle = "#6c6c8a";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(markerX, trackY - 5);
            ctx.lineTo(markerX, trackY + 5);
            ctx.stroke();
          }
          const cartScreenX = centerX + this.cartX;
          const poleEndX = cartScreenX + Math.sin(this.cartTheta) * this.config.poleLength;
          const poleEndY = cartY - Math.cos(this.cartTheta) * this.config.poleLength;
          ctx.strokeStyle = this.config.poleColor;
          ctx.lineWidth = 8;
          ctx.lineCap = "round";
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
          gradient.addColorStop(0, "#ff6b6b");
          gradient.addColorStop(1, "#ee5a5a");
          ctx.fillStyle = gradient;
          ctx.fillRect(
            cartScreenX - this.config.cartWidth / 2,
            cartY - this.config.cartHeight / 2,
            this.config.cartWidth,
            this.config.cartHeight
          );
          ctx.strokeStyle = "#aa3a3a";
          ctx.lineWidth = 2;
          ctx.strokeRect(
            cartScreenX - this.config.cartWidth / 2,
            cartY - this.config.cartHeight / 2,
            this.config.cartWidth,
            this.config.cartHeight
          );
          const wheelRadius = 8;
          ctx.fillStyle = "#2a2a4a";
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
          const thetaDeg = (this.cartTheta * 180 / Math.PI).toFixed(1);
          const xPos = x.toFixed(2);
          ctx.fillStyle = "#ffffff";
          ctx.font = "14px monospace";
          ctx.textAlign = "left";
          ctx.fillText(`\u03B8: ${thetaDeg}\xB0`, 20, 30);
          ctx.fillText(`x: ${xPos}`, 20, 50);
          ctx.fillText(`\u03B8\u0307: ${theta_dot.toFixed(2)}`, 20, 70);
          ctx.fillText(`\u1E8B: ${x_dot.toFixed(2)}`, 20, 90);
          if (action !== void 0) {
            ctx.fillStyle = "#ffd43b";
            ctx.font = "bold 18px sans-serif";
            ctx.textAlign = "right";
            ctx.fillText(`Action: ${action === 0 ? "\u2190 LEFT" : "RIGHT \u2192"}`, this.canvasWidth - 20, 30);
          }
          if (state.done) {
            ctx.fillStyle = state.info["truncated"] ? "#ffd43b" : "#ff6b6b";
            ctx.font = "bold 24px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(
              state.info["truncated"] ? "TIME UP!" : "FELL!",
              this.canvasWidth / 2,
              this.canvasHeight - 30
            );
          }
          const thetaLimit = (15 * Math.PI / 180).toFixed(1);
          const xLimit = 2.4;
          ctx.fillStyle = "#6c757d";
          ctx.font = "12px monospace";
          ctx.textAlign = "right";
          ctx.fillText(`\u03B8 limit: \xB1${thetaLimit} rad`, this.canvasWidth - 20, 50);
          ctx.fillText(`x limit: \xB1${xLimit}`, this.canvasWidth - 20, 70);
        }
        close() {
        }
      };
    }
  });

  // src/game/index.ts
  var game_exports = {};
  __export(game_exports, {
    Camera: () => Camera,
    CartPoleRenderer: () => CartPoleRenderer,
    FrozenLakeRenderer: () => FrozenLakeRenderer,
    Game: () => Game,
    GameEntity: () => GameEntity,
    Sprite: () => Sprite,
    createCartPoleRenderer: () => createCartPoleRenderer,
    createFrozenLakeRenderer: () => createFrozenLakeRenderer,
    createGame: () => createGame
  });
  var init_game = __esm({
    "src/game/index.ts"() {
      init_engine();
      init_frozen_lake_renderer();
      init_cartpole_renderer();
    }
  });

  // bundle_entry.ts
  var require_bundle_entry = __commonJS({
    "bundle_entry.ts"() {
      init_gym();
      init_game();
      window.ai4js = { gym: gym_exports, game: game_exports };
    }
  });
  return require_bundle_entry();
})();
