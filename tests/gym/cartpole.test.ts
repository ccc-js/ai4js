import { CartPole, Discrete, Box } from '../../src/gym/index.js';

describe('CartPole', () => {
  let env: CartPole;

  beforeEach(() => {
    env = new CartPole({ max_steps: 500 });
  });

  test('should have correct spaces', () => {
    expect(env.observation_space).toBeInstanceOf(Box);
    expect(env.action_space).toBeInstanceOf(Discrete);
    expect((env.action_space as Discrete).n).toBe(2);
  });

  test('reset returns 4D observation', () => {
    const obs = env.reset();
    expect(obs).toHaveLength(4);
    expect(obs.every(x => typeof x === 'number')).toBe(true);
  });

  test('step returns valid result structure', () => {
    env.reset();
    const result = env.step(0);
    expect(result).toHaveProperty('observation');
    expect(result).toHaveProperty('reward');
    expect(result).toHaveProperty('done');
    expect(result).toHaveProperty('info');
  });

  test('step validates action', () => {
    env.reset();
    expect(() => env.step(3)).toThrow('Invalid action');
  });

  test('reward is 1.0 when not done', () => {
    env.reset();
    let done = false;
    let steps = 0;

    while (!done && steps < 100) {
      const result = env.step(0);
      done = result.done;
      if (!done) {
        expect(result.reward).toBe(1.0);
      }
      steps++;
    }
  });

  test('theta and x are within bounds initially after reset', () => {
    const obs = env.reset();
    expect(obs[0]).toBeGreaterThanOrEqual(-2.4);
    expect(obs[0]).toBeLessThanOrEqual(2.4);
    expect(obs[2]).toBeGreaterThanOrEqual(-0.21);
    expect(obs[2]).toBeLessThanOrEqual(0.21);
  });

  test('random policy can run episode', () => {
    env.reset();
    let done = false;
    let steps = 0;

    while (!done && steps < 500) {
      const action = Math.random() > 0.5 ? 1 : 0;
      const result = env.step(action);
      done = result.done;
      steps++;
    }

    expect(steps).toBeLessThanOrEqual(500);
  });

  test('actions 0 and 1 are both valid', () => {
    env.reset();
    const r0 = env.step(0);
    const r1 = env.step(1);
    expect(typeof r0.reward).toBe('number');
    expect(typeof r1.reward).toBe('number');
  });

  test('cartpole can stay up for multiple steps with alternating actions', () => {
    env.reset();
    let done = false;
    let steps = 0;

    while (!done && steps < 200) {
      const action = steps % 2 === 0 ? 0 : 1;
      const result = env.step(action);
      done = result.done;
      steps++;
    }

    expect(steps).toBeGreaterThan(10);
  });
});