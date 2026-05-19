const API_BASE = 'http://localhost:3001';

export interface SnapshotMeta {
  id: string;
  name: string;
  type: string;
  steps: number;
}

export async function saveSnapshot(
  name: string, type: 'linear' | 'gpt',
  steps: number, loss: number | undefined, data: string
): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/api/snapshots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, type, steps, loss, data }),
  });
  return res.json();
}

export async function listSnapshots(): Promise<SnapshotMeta[]> {
  const res = await fetch(`${API_BASE}/api/snapshots`);
  const data = await res.json();
  return data.snapshots;
}

export async function loadSnapshot(id: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/snapshots/${id}`);
  const data = await res.json();
  return data.data;
}

export async function deleteSnapshot(id: string): Promise<void> {
  await fetch(`${API_BASE}/api/snapshots/${id}`, { method: 'DELETE' });
}