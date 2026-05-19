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