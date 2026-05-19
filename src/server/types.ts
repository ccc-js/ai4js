export interface SnapshotMetadata {
  id: string;
  name: string;
  type: 'linear' | 'gpt';
  created: number;
  steps: number;
  loss?: number;
}

export interface SaveSnapshotRequest {
  name: string;
  type: 'linear' | 'gpt';
  steps: number;
  loss?: number;
  data: string;
}

export interface SaveSnapshotResponse {
  id: string;
  success: boolean;
}

export interface ListSnapshotsResponse {
  snapshots: SnapshotMetadata[];
}

export interface GymSnapshotMetadata {
  id: string;
  name: string;
  env: 'CartPole' | 'FrozenLake';
  created: number;
  totalReward: number;
  success: boolean;
  steps: number;
}

export interface SaveGymSnapshotRequest {
  name: string;
  env: 'CartPole' | 'FrozenLake';
  episodeRecord: EpisodeRecord;
  totalReward: number;
  success: boolean;
}

export interface EpisodeRecord {
  observations: number[][];
  actions: number[];
  rewards: number[];
  dones: boolean[];
}

export interface ListGymSnapshotsResponse {
  snapshots: GymSnapshotMetadata[];
}