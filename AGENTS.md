# AGENTS.md

## Commands

```sh
npm test              # Run unit tests (jest + ts-jest)
npm run test:e2e      # Run e2e tests (playwright, requires dev server)
npm run lint          # Lint src/ and tests/
npm run typecheck     # TypeScript type check (no emit)
npm run build         # tsc + esbuild (see bundle_entry.ts for browser bundle)
npm run server        # vite dev server on port 3000
```

Full test flow: `npm test` → `./server.sh` (port 3002) → `npm run test:e2e`

## Architecture

- `src/nn/` — neural network core: Tensor, Linear, Attention, GPT, CharGPT, Adam optimizer, serialization (io.ts)
- `src/gym/` — OpenAI Gym-compatible envs: Discrete/Box spaces, FrozenLake, CartPole
- `src/game/` — 2D game engine: Game, Sprite, Camera, renderers
- `bundle_entry.ts` — browser bundle entry (exports gym + game to window.ai4js)
- `vite.config.ts` root is `web/game`; build output goes to `dist-bundle/`

## Key conventions

- `"type": "commonjs"` in package.json — use `.js` extensions in imports
- Jest: `ts-jest` preset, `*.test.ts` in `tests/` folder, moduleNameMapper strips `.js` extension
- Playwright e2e: base URL `http://localhost:3000`, runs against `web/game/` pages
- ndarray used for tensor storage (ndarray dependency)

## Dependencies

- `ndarray` for tensor data
- `esbuild` for bundling browser build
- `vite` for dev server and web bundling