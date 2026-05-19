import { describe, test, expect } from '@jest/globals';
import { GymReplay, createEpisodeRecord, recordStep } from '../src/gym/replay';

describe('GymReplay', () => {
  test('creates episode record', () => {
    const record = createEpisodeRecord();
    expect(record.observations).toEqual([]);
    expect(record.actions).toEqual([]);
    expect(record.rewards).toEqual([]);
    expect(record.dones).toEqual([]);
  });

  test('records steps correctly', () => {
    const record = createEpisodeRecord();
    recordStep(record, [0, 0, 0, 0], 1, 1, false);
    recordStep(record, [0.1, 0.2, 0.01, 0.03], 1, 1, true);

    expect(record.observations).toHaveLength(2);
    expect(record.observations[0]).toEqual([0, 0, 0, 0]);
    expect(record.actions).toEqual([1, 1]);
    expect(record.rewards).toEqual([1, 1]);
    expect(record.dones).toEqual([false, true]);
  });

  test('replay calls onStep for each step', async () => {
    const record = createEpisodeRecord();
    recordStep(record, [0, 0, 0, 0], 1, 1, false);
    recordStep(record, [0.1, 0.2, 0.01, 0.03], 1, 1, false);
    recordStep(record, [0.2, 0.4, 0.02, 0.06], 0, 1, true);

    const steps: number[] = [];
    const replay = new GymReplay({
      episodeRecord: record,
      onStep: (step) => steps.push(step),
    });

    expect(replay.getTotalSteps()).toBe(3);
    expect(replay.isPlaying()).toBe(false);
    expect(replay.getCurrentStep()).toBe(0);

    replay.play();
    await new Promise(r => setTimeout(r, 200));
    replay.pause();

    expect(replay.getCurrentStep()).toBeGreaterThan(0);
    expect(replay.isPlaying()).toBe(false);
  });

  test('replay calls onDone when finished', async () => {
    const record = createEpisodeRecord();
    recordStep(record, [1, 2, 3, 4], 0, 1, true);

    let doneCalled = false;
    let totalReward = 0;
    let success = false;

    const replay = new GymReplay({
      episodeRecord: record,
      onDone: (reward, succ) => {
        doneCalled = true;
        totalReward = reward;
        success = succ;
      },
    });

    replay.setSpeed(10);
    replay.play();

    await new Promise(r => setTimeout(r, 100));

    expect(doneCalled).toBe(true);
    expect(totalReward).toBe(1);
    expect(success).toBe(true);
  });

  test('stop resets step counter', async () => {
    const record = createEpisodeRecord();
    recordStep(record, [1], 0, 1, false);
    recordStep(record, [2], 1, 1, false);
    recordStep(record, [3], 0, 1, true);

    const replay = new GymReplay({ episodeRecord: record });
    replay.setSpeed(10);

    replay.play();
    await new Promise(r => setTimeout(r, 50));
    replay.stop();

    expect(replay.getCurrentStep()).toBe(0);
    expect(replay.isPlaying()).toBe(false);
  });
});