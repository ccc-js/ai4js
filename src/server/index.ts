import { createServer } from 'http';
import { SnapshotStorage } from './storage.js';
import type { IncomingMessage, ServerResponse } from 'http';

const storage = new SnapshotStorage();
export const PORT = 3001;

function sendJSON(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

async function parseBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  try {
    if (pathname === '/api/snapshots') {
      if (req.method === 'GET') {
        const snapshots = await storage.list();
        sendJSON(res, 200, { snapshots });
      } else if (req.method === 'POST') {
        const body = await parseBody(req);
        const id = await storage.save(JSON.parse(body));
        sendJSON(res, 200, { id, success: true });
      } else {
        sendJSON(res, 405, { error: 'Method not allowed' });
      }
    } else if (pathname.startsWith('/api/snapshots/')) {
      const id = pathname.split('/')[3];
      if (req.method === 'GET') {
        const result = await storage.load(id);
        if (!result) { sendJSON(res, 404, { error: 'Not found' }); return; }
        sendJSON(res, 200, { metadata: result.metadata, data: result.data });
      } else if (req.method === 'DELETE') {
        await storage.delete(id);
        sendJSON(res, 200, { success: true });
      } else {
        sendJSON(res, 405, { error: 'Method not allowed' });
      }
    } else {
      sendJSON(res, 404, { error: 'Not found' });
    }
  } catch (e) {
    sendJSON(res, 500, { error: String(e) });
  }
});

export function startServer(port = PORT): Promise<ReturnType<typeof createServer>> {
  return new Promise(resolve => {
    server.listen(port, () => resolve(server));
  });
}

export function stopServer(): void {
  server.close();
}

if (require.main === module) {
  startServer().then(() => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}