import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { startServer, stopServer, PORT } from '../src/server/index';
import * as http from 'http';

let server: ReturnType<typeof http.createServer>;

beforeAll(async () => {
  server = await startServer(PORT);
});

afterAll(() => {
  stopServer();
});

async function request(method: string, path: string, body?: string): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve, reject) => {
    const options = { hostname: 'localhost', port: PORT, path, method };
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode ?? 0, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode ?? 0, data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

describe('Gym API', () => {
  test('POST /api/gym saves episode', async () => {
    const episodeRecord = {
      observations: [[0, 0, 0, 0], [0.1, 0.2, 0.01, 0.03]],
      actions: [1, 1],
      rewards: [1, 1],
      dones: [false, true],
    };
    const body = JSON.stringify({
      name: 'test-gym',
      env: 'CartPole',
      episodeRecord,
      totalReward: 2,
      success: false,
    });
    const res = await request('POST', '/api/gym', body);
    expect(res.status).toBe(200);
    expect((res.data as { id: string }).id).toBeDefined();
  });

  test('GET /api/gym lists snapshots', async () => {
    const res = await request('GET', '/api/gym');
    expect(res.status).toBe(200);
    expect((res.data as { snapshots: unknown[] }).snapshots).toBeInstanceOf(Array);
  });

  test('GET /api/gym/:id returns episode', async () => {
    const episodeRecord = {
      observations: [[1, 2, 3, 4]],
      actions: [0],
      rewards: [1],
      dones: [true],
    };
    const postRes = await request('POST', '/api/gym', JSON.stringify({
      name: 'test-episode',
      env: 'FrozenLake',
      episodeRecord,
      totalReward: 1,
      success: true,
    }));
    const id = (postRes.data as { id: string }).id;
    const getRes = await request('GET', `/api/gym/${id}`);
    expect(getRes.status).toBe(200);
    expect((getRes.data as { metadata: { env: string } }).metadata.env).toBe('FrozenLake');
  });

  test('GET /api/gym?env=CartPole filters by env', async () => {
    const res = await request('GET', '/api/gym?env=CartPole');
    expect(res.status).toBe(200);
    const { snapshots } = res.data as { snapshots: { env: string }[] };
    snapshots.forEach(s => expect(s.env).toBe('CartPole'));
  });

  test('DELETE /api/gym/:id removes snapshot', async () => {
    const postRes = await request('POST', '/api/gym', JSON.stringify({
      name: 'delete-me',
      env: 'CartPole',
      episodeRecord: { observations: [], actions: [], rewards: [], dones: [] },
      totalReward: 0,
      success: false,
    }));
    const id = (postRes.data as { id: string }).id;
    const delRes = await request('DELETE', `/api/gym/${id}`);
    expect(delRes.status).toBe(200);
    const getRes = await request('GET', `/api/gym/${id}`);
    expect(getRes.status).toBe(404);
  });
});