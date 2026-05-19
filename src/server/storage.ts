import * as fs from 'fs/promises';
import * as path from 'path';
import { SnapshotMetadata, SaveSnapshotRequest, GymSnapshotMetadata, SaveGymSnapshotRequest, EpisodeRecord } from './types.js';

const STORAGE_DIR = './snapshots';
const GYM_STORAGE_DIR = './gym-snapshots';

export class SnapshotStorage {
  async save(req: SaveSnapshotRequest): Promise<string> {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const meta: SnapshotMetadata = {
      id, name: req.name, type: req.type,
      created: Date.now(), steps: req.steps, loss: req.loss,
    };

    await fs.mkdir(STORAGE_DIR, { recursive: true });
    await Promise.all([
      fs.writeFile(path.join(STORAGE_DIR, `${id}.meta.json`), JSON.stringify(meta)),
      fs.writeFile(path.join(STORAGE_DIR, `${id}.data.json`), JSON.stringify({ data: req.data })),
    ]);
    return id;
  }

  async list(): Promise<SnapshotMetadata[]> {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    const files = await fs.readdir(STORAGE_DIR);
    const metas: SnapshotMetadata[] = [];
    for (const f of files) {
      if (f.endsWith('.meta.json')) {
        const content = await fs.readFile(path.join(STORAGE_DIR, f), 'utf-8');
        metas.push(JSON.parse(content));
      }
    }
    return metas.sort((a, b) => b.created - a.created);
  }

  async load(id: string): Promise<{ metadata: SnapshotMetadata; data: string } | null> {
    try {
      const [metaContent, dataContent] = await Promise.all([
        fs.readFile(path.join(STORAGE_DIR, `${id}.meta.json`), 'utf-8'),
        fs.readFile(path.join(STORAGE_DIR, `${id}.data.json`), 'utf-8'),
      ]);
      return { metadata: JSON.parse(metaContent), data: JSON.parse(dataContent).data };
    } catch {
      return null;
    }
  }

  async delete(id: string): Promise<void> {
    await Promise.all([
      fs.unlink(path.join(STORAGE_DIR, `${id}.meta.json`)).catch(() => {}),
      fs.unlink(path.join(STORAGE_DIR, `${id}.data.json`)).catch(() => {}),
    ]);
  }

  // Gym snapshot methods
  async saveGym(req: SaveGymSnapshotRequest): Promise<string> {
    const id = `gym-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const meta: GymSnapshotMetadata = {
      id,
      name: req.name,
      env: req.env,
      created: Date.now(),
      totalReward: req.totalReward,
      success: req.success,
      steps: req.episodeRecord.observations.length,
    };

    await fs.mkdir(GYM_STORAGE_DIR, { recursive: true });
    await Promise.all([
      fs.writeFile(path.join(GYM_STORAGE_DIR, `${id}.meta.json`), JSON.stringify(meta)),
      fs.writeFile(path.join(GYM_STORAGE_DIR, `${id}.data.json`), JSON.stringify({ episodeRecord: req.episodeRecord })),
    ]);
    return id;
  }

  async listGym(env?: string): Promise<GymSnapshotMetadata[]> {
    await fs.mkdir(GYM_STORAGE_DIR, { recursive: true });
    const files = await fs.readdir(GYM_STORAGE_DIR);
    const metas: GymSnapshotMetadata[] = [];
    for (const f of files) {
      if (f.endsWith('.meta.json')) {
        const content = await fs.readFile(path.join(GYM_STORAGE_DIR, f), 'utf-8');
        const meta: GymSnapshotMetadata = JSON.parse(content);
        if (!env || meta.env === env) {
          metas.push(meta);
        }
      }
    }
    return metas.sort((a, b) => b.created - a.created);
  }

  async loadGym(id: string): Promise<{ metadata: GymSnapshotMetadata; episodeRecord: EpisodeRecord } | null> {
    try {
      const [metaContent, dataContent] = await Promise.all([
        fs.readFile(path.join(GYM_STORAGE_DIR, `${id}.meta.json`), 'utf-8'),
        fs.readFile(path.join(GYM_STORAGE_DIR, `${id}.data.json`), 'utf-8'),
      ]);
      const metadata: GymSnapshotMetadata = JSON.parse(metaContent);
      const { episodeRecord } = JSON.parse(dataContent) as { episodeRecord: EpisodeRecord };
      return { metadata, episodeRecord };
    } catch {
      return null;
    }
  }

  async deleteGym(id: string): Promise<void> {
    await Promise.all([
      fs.unlink(path.join(GYM_STORAGE_DIR, `${id}.meta.json`)).catch(() => {}),
      fs.unlink(path.join(GYM_STORAGE_DIR, `${id}.data.json`)).catch(() => {}),
    ]);
  }
}