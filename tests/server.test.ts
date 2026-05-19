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

describe('Server API', () => {
  test('POST /api/snapshots saves snapshot', async () => {
    const body = JSON.stringify({ name: 'test', type: 'linear', steps: 10, data: '{}' });
    const res = await request('POST', '/api/snapshots', body);
    expect(res.status).toBe(200);
    expect((res.data as { id: string }).id).toBeDefined();
  });

  test('GET /api/snapshots lists snapshots', async () => {
    const res = await request('GET', '/api/snapshots');
    expect(res.status).toBe(200);
    expect((res.data as { snapshots: unknown[] }).snapshots).toBeInstanceOf(Array);
  });

  test('GET /api/snapshots/:id returns snapshot', async () => {
    const postRes = await request('POST', '/api/snapshots', JSON.stringify({ name: 'test', type: 'gpt', steps: 5, data: '{"test":true}' }));
    const id = (postRes.data as { id: string }).id;
    const getRes = await request('GET', `/api/snapshots/${id}`);
    expect(getRes.status).toBe(200);
    expect((getRes.data as { data: string }).data).toBe('{"test":true}');
  });

  test('DELETE /api/snapshots/:id removes snapshot', async () => {
    const postRes = await request('POST', '/api/snapshots', JSON.stringify({ name: 'delete-me', type: 'linear', steps: 1, data: '{}' }));
    const id = (postRes.data as { id: string }).id;
    const delRes = await request('DELETE', `/api/snapshots/${id}`);
    expect(delRes.status).toBe(200);
    const getRes = await request('GET', `/api/snapshots/${id}`);
    expect(getRes.status).toBe(404);
  });
});