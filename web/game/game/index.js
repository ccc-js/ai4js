"use strict";
var ai4js = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // dist/game/engine.js
  var require_engine = __commonJS({
    "dist/game/engine.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Game = exports.Camera = exports.Sprite = exports.GameEntity = void 0;
      exports.createGame = createGame;
      var GameEntity = class {
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
      exports.GameEntity = GameEntity;
      var Sprite = class extends GameEntity {
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
      exports.Sprite = Sprite;
      var Camera = class extends GameEntity {
        constructor(name = "Camera") {
          super(name);
          this.fov = 60;
          this.nearClip = 0.1;
          this.farClip = 1e3;
          this.orthoHeight = 10;
        }
      };
      exports.Camera = Camera;
      var Game = class {
        constructor(config) {
          this.entities = [];
          this.running = false;
          this.lastTime = 0;
          this.updateCallbacks = [];
          this.renderCallbacks = [];
          this.loop = () => {
            if (!this.running)
              return;
            const now = performance.now();
            const dt = (now - this.lastTime) / 1e3;
            this.lastTime = now;
            this.update(dt);
            this.render();
            requestAnimationFrame(this.loop);
          };
          if (typeof config.canvas === "string") {
            const el = document.querySelector(config.canvas);
            if (!el)
              throw new Error(`Canvas not found: ${config.canvas}`);
            this.canvas = el;
          } else {
            this.canvas = config.canvas;
          }
          const ctx = this.canvas.getContext("2d");
          if (!ctx)
            throw new Error("Could not get 2D context");
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
          if (idx !== -1)
            this.entities.splice(idx, 1);
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
          if (!entity.visible)
            return;
          const { ctx } = this;
          ctx.save();
          ctx.translate(entity.position.x, entity.position.y);
          ctx.rotate(entity.rotation);
          if (entity instanceof Sprite) {
            ctx.globalAlpha = entity.opacity;
            ctx.fillStyle = `rgb(${Math.floor(entity.color.r * 255)}, ${Math.floor(entity.color.g * 255)}, ${Math.floor(entity.color.b * 255)})`;
            if (entity.texture) {
              ctx.drawImage(entity.texture, -entity.width / 2, -entity.height / 2, entity.width, entity.height);
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
      exports.Game = Game;
      function createGame(config) {
        return new Game(config);
      }
    }
  });

  // dist/game/frozen_lake_renderer.js
  var require_frozen_lake_renderer = __commonJS({
    "dist/game/frozen_lake_renderer.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.FrozenLakeRenderer = void 0;
      exports.createFrozenLakeRenderer = createFrozenLakeRenderer;
      var engine_js_1 = require_engine();
      var DEFAULT_CONFIG = {
        gridSize: 8,
        cellSize: 50,
        agentColor: "#ff6b6b",
        goalColor: "#51cf66",
        holeColor: "#495057",
        iceColor: "#e9ecef",
        startColor: "#ffd43b"
      };
      var MAP_8X8 = [
        "SFFFFFFF",
        "FHHFFFHF",
        "FFFHFFHF",
        "FFFHFFFF",
        "HFF FFFH",
        "FFFFFFFH",
        "FHHFFFHF",
        "FFFFFFFG"
      ];
      var FrozenLakeRenderer = class {
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
          const sprite = new engine_js_1.Sprite(`cell_${row}_${col}`);
          sprite.setPosition(this.offsetX + col * this.cellSize + this.cellSize / 2, this.offsetY + row * this.cellSize + this.cellSize / 2);
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
              const cellType = MAP_8X8[r][c];
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
          this.agent = new engine_js_1.Sprite("agent");
          this.agent.setPosition(this.offsetX + col * this.cellSize + this.cellSize / 2, this.offsetY + row * this.cellSize + this.cellSize / 2);
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
            ctx.fillText(state.info["success"] ? "WIN!" : "FALL!", this.game.getCanvas().width / 2, this.game.getCanvas().height - 20);
          }
        }
        close() {
        }
      };
      exports.FrozenLakeRenderer = FrozenLakeRenderer;
      function createFrozenLakeRenderer(config) {
        return new FrozenLakeRenderer(config);
      }
    }
  });

  // dist/game/cartpole_renderer.js
  var require_cartpole_renderer = __commonJS({
    "dist/game/cartpole_renderer.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.CartPoleRenderer = void 0;
      exports.createCartPoleRenderer = createCartPoleRenderer;
      var DEFAULT_CONFIG = {
        trackLength: 400,
        cartWidth: 80,
        cartHeight: 30,
        poleLength: 100,
        backgroundColor: "#1a1a2e",
        trackColor: "#4a4a6a",
        cartColor: "#e94560",
        poleColor: "#16213e"
      };
      var CartPoleRenderer = class {
        constructor(config = {}) {
          this.cartX = 0;
          this.cartTheta = 0;
          this.canvasWidth = 0;
          this.canvasHeight = 0;
          this.scale = 0;
          this.config = { ...DEFAULT_CONFIG, ...config };
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
          const gradient = ctx.createLinearGradient(cartScreenX - this.config.cartWidth / 2, cartY - this.config.cartHeight / 2, cartScreenX + this.config.cartWidth / 2, cartY - this.config.cartHeight / 2);
          gradient.addColorStop(0, "#ff6b6b");
          gradient.addColorStop(1, "#ee5a5a");
          ctx.fillStyle = gradient;
          ctx.fillRect(cartScreenX - this.config.cartWidth / 2, cartY - this.config.cartHeight / 2, this.config.cartWidth, this.config.cartHeight);
          ctx.strokeStyle = "#aa3a3a";
          ctx.lineWidth = 2;
          ctx.strokeRect(cartScreenX - this.config.cartWidth / 2, cartY - this.config.cartHeight / 2, this.config.cartWidth, this.config.cartHeight);
          const wheelRadius = 8;
          ctx.fillStyle = "#2a2a4a";
          ctx.beginPath();
          ctx.arc(cartScreenX - this.config.cartWidth / 2 + 10, cartY + this.config.cartHeight / 2, wheelRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(cartScreenX + this.config.cartWidth / 2 - 10, cartY + this.config.cartHeight / 2, wheelRadius, 0, Math.PI * 2);
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
            ctx.fillText(state.info["truncated"] ? "TIME UP!" : "FELL!", this.canvasWidth / 2, this.canvasHeight - 30);
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
      exports.CartPoleRenderer = CartPoleRenderer;
      function createCartPoleRenderer(config) {
        return new CartPoleRenderer(config);
      }
    }
  });

  // dist/game/index.js
  var require_game = __commonJS({
    "dist/game/index.js"(exports) {
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.createCartPoleRenderer = exports.CartPoleRenderer = exports.createFrozenLakeRenderer = exports.FrozenLakeRenderer = exports.createGame = exports.Camera = exports.Sprite = exports.GameEntity = exports.Game = void 0;
      var engine_js_1 = require_engine();
      Object.defineProperty(exports, "Game", { enumerable: true, get: function() {
        return engine_js_1.Game;
      } });
      Object.defineProperty(exports, "GameEntity", { enumerable: true, get: function() {
        return engine_js_1.GameEntity;
      } });
      Object.defineProperty(exports, "Sprite", { enumerable: true, get: function() {
        return engine_js_1.Sprite;
      } });
      Object.defineProperty(exports, "Camera", { enumerable: true, get: function() {
        return engine_js_1.Camera;
      } });
      Object.defineProperty(exports, "createGame", { enumerable: true, get: function() {
        return engine_js_1.createGame;
      } });
      var frozen_lake_renderer_js_1 = require_frozen_lake_renderer();
      Object.defineProperty(exports, "FrozenLakeRenderer", { enumerable: true, get: function() {
        return frozen_lake_renderer_js_1.FrozenLakeRenderer;
      } });
      Object.defineProperty(exports, "createFrozenLakeRenderer", { enumerable: true, get: function() {
        return frozen_lake_renderer_js_1.createFrozenLakeRenderer;
      } });
      var cartpole_renderer_js_1 = require_cartpole_renderer();
      Object.defineProperty(exports, "CartPoleRenderer", { enumerable: true, get: function() {
        return cartpole_renderer_js_1.CartPoleRenderer;
      } });
      Object.defineProperty(exports, "createCartPoleRenderer", { enumerable: true, get: function() {
        return cartpole_renderer_js_1.createCartPoleRenderer;
      } });
    }
  });
  return require_game();
})();
