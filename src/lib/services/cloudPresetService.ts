import { browser } from '$app/environment';
import type { ProcessingSettings } from '$lib/types';

const storageKey = 'retro-pixel-cloud-presets';

export type CloudPresetVisibility = 'public' | 'unlisted';

export interface CloudPresetRecord {
  id: string;
  shortId: string;
  name: string;
  visibility: CloudPresetVisibility;
  settings: ProcessingSettings;
  createdAt: number;
  updatedAt: number;
  applyCount: number;
}

export interface PublishCloudPresetInput {
  name: string;
  settings: ProcessingSettings;
  visibility: CloudPresetVisibility;
}

export interface CloudPresetRepository {
  publish(input: PublishCloudPresetInput): Promise<CloudPresetRecord>;
  listOwn(): Promise<CloudPresetRecord[]>;
  listPublic(): Promise<CloudPresetRecord[]>;
  applyByShortId(shortId: string): Promise<CloudPresetRecord | null>;
}

function cloneSettings(settings: ProcessingSettings): ProcessingSettings {
  return {
    ...settings,
    glitchFilters: settings.glitchFilters.map((filter) => ({ ...filter })),
    effectLayers: settings.effectLayers?.map((layer) => ({ ...layer })) ?? [],
  };
}

function createShortId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 10);
  }
  return Math.random().toString(36).slice(2, 12);
}

function createFingerprint(name: string, settings: ProcessingSettings, visibility: CloudPresetVisibility): string {
  return JSON.stringify({
    name: name.trim(),
    visibility,
    settings: cloneSettings(settings),
  });
}

class LocalCloudPresetRepository implements CloudPresetRepository {
  private async listAll(): Promise<CloudPresetRecord[]> {
    if (!browser) return [];
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private async saveAll(records: CloudPresetRecord[]): Promise<void> {
    if (!browser) return;
    localStorage.setItem(storageKey, JSON.stringify(records));
  }

  async publish(input: PublishCloudPresetInput): Promise<CloudPresetRecord> {
    const now = Date.now();
    const records = await this.listAll();
    const fingerprint = createFingerprint(input.name, input.settings, input.visibility);
    const existing = records.find((record) =>
      createFingerprint(record.name, record.settings, record.visibility) === fingerprint
    );

    const record: CloudPresetRecord = existing
      ? {
          ...existing,
          name: input.name.trim() || 'Shared Cloud Preset',
          visibility: input.visibility,
          settings: cloneSettings(input.settings),
          updatedAt: now,
        }
      : {
          id: `cloud_${crypto.randomUUID()}`,
          shortId: createShortId(),
          name: input.name.trim() || 'Shared Cloud Preset',
          visibility: input.visibility,
          settings: cloneSettings(input.settings),
          createdAt: now,
          updatedAt: now,
          applyCount: 0,
        };

    await this.saveAll([record, ...records.filter((item) => item.id !== record.id)]);
    return record;
  }

  async listOwn(): Promise<CloudPresetRecord[]> {
    const records = await this.listAll();
    return records.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async listPublic(): Promise<CloudPresetRecord[]> {
    const records = await this.listAll();
    return records
      .filter((record) => record.visibility === 'public')
      .sort((a, b) => (b.applyCount - a.applyCount) || (b.updatedAt - a.updatedAt));
  }

  async applyByShortId(shortId: string): Promise<CloudPresetRecord | null> {
    const records = await this.listAll();
    const match = records.find((record) => record.shortId === shortId);
    if (!match) return null;

    const updated = {
      ...match,
      applyCount: match.applyCount + 1,
      updatedAt: Date.now(),
    };

    await this.saveAll([updated, ...records.filter((record) => record.id !== updated.id)]);
    return updated;
  }
}

let repositoryOverride: CloudPresetRepository | null = null;

export function setCloudPresetRepository(nextRepository: CloudPresetRepository) {
  repositoryOverride = nextRepository;
}

export function resetCloudPresetRepository() {
  repositoryOverride = null;
}

function getCloudPresetRepository(): CloudPresetRepository {
  if (repositoryOverride) return repositoryOverride;

  return new LocalCloudPresetRepository();
}

export function buildCloudPresetShareUrl(shortId: string, origin: string, basePath = ''): string {
  return `${origin}${basePath || ''}/?cloudPreset=${encodeURIComponent(shortId)}`;
}

export async function publishCloudPreset(input: PublishCloudPresetInput): Promise<CloudPresetRecord> {
  return getCloudPresetRepository().publish(input);
}

export async function listPublicCloudPresets(): Promise<CloudPresetRecord[]> {
  return getCloudPresetRepository().listPublic();
}

export async function listOwnCloudPresets(): Promise<CloudPresetRecord[]> {
  return getCloudPresetRepository().listOwn();
}

export async function applyCloudPresetByShortId(shortId: string): Promise<CloudPresetRecord | null> {
  return getCloudPresetRepository().applyByShortId(shortId);
}
