import * as fs from 'fs/promises';
import * as path from 'path';
import { GPT } from './gpt.js';
import { Module } from './nn.js';
import { Tensor } from './tensor.js';
import ndarray from 'ndarray';

export interface ModelSnapshot {
  version: string;
  type: string;
  config: Record<string, unknown>;
  weights: WeightEntry[];
  metadata: Record<string, unknown>;
}

export interface WeightEntry {
  path: string;
  shape: number[];
  data: number[];
}

function getWeightsWithPath(
  module: Module,
  prefix = ''
): { path: string; tensor: Tensor }[] {
  const result: { path: string; tensor: Tensor }[] = [];
  const obj = module as unknown as Record<string, unknown>;

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

    const value = obj[key];
    const currentPath = prefix ? `${prefix}.${key}` : key;

    if (value instanceof Tensor && (value as Tensor).requires_grad) {
      result.push({ path: currentPath, tensor: value as Tensor });
    } else if (value instanceof Module) {
      result.push(...getWeightsWithPath(value as Module, currentPath));
    } else if (Array.isArray(value)) {
      for (let i = 0; i < (value as unknown[]).length; i++) {
        const item = (value as unknown[])[i];
        if (item instanceof Module) {
          result.push(...getWeightsWithPath(item, `${currentPath}[${i}]`));
        }
      }
    }
  }

  return result;
}

export function serializeModel(
  model: Module,
  config: Record<string, unknown>,
  metadata: Record<string, unknown> = {}
): ModelSnapshot {
  const weightsWithPath = getWeightsWithPath(model);

  const weights: WeightEntry[] = weightsWithPath.map(({ path, tensor }) => ({
    path,
    shape: tensor.data.shape.slice(),
    data: Array.from(tensor.data.data),
  }));

  return {
    version: '1.0.0',
    type: 'nn/gpt',
    config,
    weights,
    metadata: {
      ...metadata,
      created: Date.now(),
    },
  };
}

export function deserializeModel(snapshot: ModelSnapshot): Module {
  if (snapshot.type !== 'nn/gpt') {
    throw new Error(`Unsupported model type: ${snapshot.type}`);
  }

  const config = snapshot.config as {
    vocab_size: number;
    block_size: number;
    n_layer: number;
    n_embd: number;
    n_head: number;
  };

  const model = new GPT(
    config.vocab_size,
    config.block_size,
    config.n_layer,
    config.n_embd,
    config.n_head
  );

  loadWeights(model, snapshot.weights);

  return model;
}

export function loadWeights(model: Module, weights: WeightEntry[]): void {
  const weightMap = new Map<string, Tensor>();

  for (const entry of weights) {
    const tensor = new Tensor(
      ndarray(new Float32Array(entry.data), entry.shape),
      [],
      true
    );
    weightMap.set(entry.path, tensor);
  }

  loadWeightsRecursive(model, '', weightMap);
}

function loadWeightsRecursive(
  module: Module,
  prefix: string,
  weightMap: Map<string, Tensor>
): void {
  const obj = module as unknown as Record<string, unknown>;

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

    const value = obj[key];
    const currentPath = prefix ? `${prefix}.${key}` : key;

    if (value instanceof Tensor && (value as Tensor).requires_grad) {
      const weight = weightMap.get(currentPath);
      if (weight) {
        (value as Tensor).data.data.set(weight.data.data);
      }
    } else if (value instanceof Module) {
      loadWeightsRecursive(value as Module, currentPath, weightMap);
    } else if (Array.isArray(value)) {
      for (let i = 0; i < (value as unknown[]).length; i++) {
        const item = (value as unknown[])[i];
        if (item instanceof Module) {
          loadWeightsRecursive(item, `${currentPath}[${i}]`, weightMap);
        }
      }
    }
  }
}

export function modelToJSON(
  model: Module,
  config: Record<string, unknown>,
  metadata: Record<string, unknown> = {}
): string {
  const snapshot = serializeModel(model, config, metadata);
  return JSON.stringify(snapshot, null, 2);
}

export function modelFromJSON<T extends Module>(json: string): T {
  const snapshot = JSON.parse(json) as ModelSnapshot;
  return deserializeModel(snapshot) as T;
}

export async function saveModelToFile(
  model: Module,
  filepath: string,
  config: Record<string, unknown>,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const json = modelToJSON(model, config, metadata);
  const dir = path.dirname(filepath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filepath, json, 'utf-8');
}

export async function loadModelFromFile<T extends Module>(
  filepath: string
): Promise<T> {
  const json = await fs.readFile(filepath, 'utf-8');
  return modelFromJSON<T>(json);
}

export function saveModelToStorage(
  key: string,
  model: Module,
  config: Record<string, unknown>,
  metadata: Record<string, unknown> = {}
): void {
  if (typeof localStorage === 'undefined') {
    throw new Error('localStorage is not available');
  }
  const json = modelToJSON(model, config, metadata);
  localStorage.setItem(key, json);
}

export function loadModelFromStorage<T extends Module>(key: string): T | null {
  if (typeof localStorage === 'undefined') {
    throw new Error('localStorage is not available');
  }
  const json = localStorage.getItem(key);
  if (!json) return null;
  return modelFromJSON<T>(json);
}

export function deleteModelFromStorage(key: string): boolean {
  if (typeof localStorage === 'undefined') {
    throw new Error('localStorage is not available');
  }
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    return true;
  }
  return false;
}