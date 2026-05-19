// ai4js bundle entry point
import * as gym from './src/gym/index.js';
import * as game from './src/game/index.js';

(window as unknown as Record<string, unknown>).ai4js = { gym, game };