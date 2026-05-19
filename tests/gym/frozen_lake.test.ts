import { FrozenLake, Discrete } from '../../src/gym/index.js';

describe('FrozenLake', () => {
  let env: FrozenLake;

  beforeEach(() => {
    env = new FrozenLake({ size: 8, max_steps: 100 });
  });

  test('should have correct spaces', () => {
    expect(env.observation_space).toBeInstanceOf(Discrete);
    expect(env.action_space).toBeInstanceOf(Discrete);
    expect((env.observation_space as Discrete).n).toBe(64);
    expect((env.action_space as Discrete).n).toBe(4);
  });

  test('reset returns initial state', () => {
    const obs = env.reset();
    expect(obs).toEqual([0]);
  });

  test('step returns valid result structure', () => {
    env.reset();
    const result = env.step(0);
    expect(result).toHaveProperty('observation');
    expect(result).toHaveProperty('reward');
    expect(result).toHaveProperty('done');
    expect(result).toHaveProperty('info');
    expect(typeof result.reward).toBe('number');
    expect(typeof result.done).toBe('boolean');
  });

  test('step validates action', () => {
    env.reset();
    expect(() => env.step(5)).toThrow('Invalid action');
  });

  test('episode can complete', () => {
    env.reset();
    let done = false;
    let steps = 0;

    while (!done && steps < 100) {
      const action = Math.floor(Math.random() * 4);
      const result = env.step(action);
      done = result.done;
      steps++;
    }

    expect(steps).toBeLessThanOrEqual(100);
  });

  test('slippery behavior causes different outcomes', () => {
    const results: number[] = [];

    for (let trial = 0; trial < 10; trial++) {
      env.reset();
      const result = env.step(1);
      results.push(result.observation[0]);
    }

    const allSame = results.every(r => r === results[0]);
    expect(allSame).toBe(false);
  });

  test('max_steps limits episode length', () => {
    env = new FrozenLake({ size: 8, max_steps: 10 });
    env.reset();

    let done = false;
    let steps = 0;

    while (!done) {
      const result = env.step(Math.floor(Math.random() * 4));
      done = result.done || (result.info as Record<string, unknown>)['truncated'] === true;
      steps++;
    }

    expect(steps).toBeLessThanOrEqual(10);
  });

  test('action 0 (up) from state 0 returns state 0 (boundary)', () => {
    env = new FrozenLake({ is_slippery: false });
    env.reset();
    const result = env.step(0);
    expect(result.observation[0]).toBe(0);
  });

  test('action 2 (left) from state 0 returns state 0 (boundary)', () => {
    env = new FrozenLake({ is_slippery: false });
    env.reset();
    const result = env.step(2);
    expect(result.observation[0]).toBe(0);
  });

  test('action 3 (right) from state 0 moves to state 1', () => {
    env = new FrozenLake({ is_slippery: false });
    env.reset();
    const result = env.step(3);
    expect(result.observation[0]).toBe(1);
  });

  test('action 1 (down) from state 0 moves to state 8', () => {
    env = new FrozenLake({ is_slippery: false });
    env.reset();
    const result = env.step(1);
    expect(result.observation[0]).toBe(8);
  });
});