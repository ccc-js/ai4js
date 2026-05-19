import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { startServer, stopServer, PORT } from '../src/server/index';
import { saveSnapshot, listSnapshots, loadSnapshot, deleteSnapshot } from '../src/nn/demo/api';

let server: ReturnType<typeof import('http').createServer>;

beforeAll(async () => {
  server = await startServer(PORT);
});

afterAll(() => {
  stopServer();
});

describe('Client API', () => {
  test('saveSnapshot and listSnapshots', async () => {
    const { id } = await saveSnapshot('test-client', 'linear', 10, 0.5, '{"w":1.5}');
    expect(id).toBeDefined();

    const snapshots = await listSnapshots();
    expect(snapshots.some(s => s.id === id)).toBe(true);

    await deleteSnapshot(id);
  });

  test('loadSnapshot returns saved data', async () => {
    const { id } = await saveSnapshot('load-test', 'gpt', 20, undefined, '{"model":"test"}');
    const data = await loadSnapshot(id);
    expect(data).toBe('{"model":"test"}');
    await deleteSnapshot(id);
  });
});