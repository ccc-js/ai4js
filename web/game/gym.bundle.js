"use strict";
var gym = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // dist/gym/spaces.js
  var require_spaces = __commonJS({
    "dist/gym/spaces.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Box = exports.Discrete = void 0;
      var Discrete = class {
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
      exports.Discrete = Discrete;
      var Box = class {
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
          if (x.length !== this.shape[0])
            return false;
          for (let i = 0; i < x.length; i++) {
            if (x[i] < this.low[i] || x[i] > this.high[i])
              return false;
          }
          return true;
        }
      };
      exports.Box = Box;
    }
  });

  // dist/gym/frozen_lake.js
  var require_frozen_lake = __commonJS({
    "dist/gym/frozen_lake.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.FrozenLake = void 0;
      var spaces_js_1 = require_spaces();
      var MAP_8X8 = [
        "SFFFFFFF",
        "FHHFFFHF",
        "FFFHFFHF",
        "FFFHFFFF",
        "HF FFFFH",
        "FFFFFFFH",
        "FHHFFFHF",
        "FFFFFFFG"
      ];
      var FrozenLake = class {
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
          this.observation_space = new spaces_js_1.Discrete(this.size * this.size);
          this.action_space = new spaces_js_1.Discrete(4);
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
              if (row > 0)
                new_state = this.state - this.size;
              break;
            case 1:
              if (row < this.size - 1)
                new_state = this.state + this.size;
              break;
            case 2:
              if (col > 0)
                new_state = this.state - 1;
              break;
            case 3:
              if (col < this.size - 1)
                new_state = this.state + 1;
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
          if (action === 0 || action === 1)
            return [2, 3];
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
      exports.FrozenLake = FrozenLake;
    }
  });

  // dist/gym/cartpole.js
  var require_cartpole = __commonJS({
    "dist/gym/cartpole.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.CartPole = void 0;
      var spaces_js_1 = require_spaces();
      var CartPole = class {
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
          this.observation_space = new spaces_js_1.Box([-2.4, -3.5, -0.21, -3.5], [2.4, 3.5, 0.21, 3.5]);
          this.action_space = new spaces_js_1.Discrete(2);
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
      exports.CartPole = CartPole;
    }
  });

  // dist/gym/index.js
  var require_index = __commonJS({
    "dist/gym/index.js"(exports) {
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.CartPole = exports.FrozenLake = exports.Box = exports.Discrete = void 0;
      var spaces_js_1 = require_spaces();
      Object.defineProperty(exports, "Discrete", { enumerable: true, get: function() {
        return spaces_js_1.Discrete;
      } });
      Object.defineProperty(exports, "Box", { enumerable: true, get: function() {
        return spaces_js_1.Box;
      } });
      var frozen_lake_js_1 = require_frozen_lake();
      Object.defineProperty(exports, "FrozenLake", { enumerable: true, get: function() {
        return frozen_lake_js_1.FrozenLake;
      } });
      var cartpole_js_1 = require_cartpole();
      Object.defineProperty(exports, "CartPole", { enumerable: true, get: function() {
        return cartpole_js_1.CartPole;
      } });
    }
  });
  return require_index();
})();
