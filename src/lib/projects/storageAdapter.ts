import {
  cloneAssetRef,
  cloneProjectManifest,
  createRecentProjectEntry,
  type LocalAssetRefV1,
  type RecentProjectEntryV1,
  type RetroProjectManifestV1,
} from '$lib/projects/schema';

export interface StoredAssetRecord {
  asset: LocalAssetRefV1;
  blob: Blob;
}

export interface SaveAssetInput {
  asset: LocalAssetRefV1;
  blob: Blob;
}

export interface DeleteProjectOptions {
  deleteAssetIds?: string[];
}

export interface ListRecentProjectsOptions {
  limit?: number;
}

export interface ProjectStorageAdapter {
  saveProject(manifest: RetroProjectManifestV1): Promise<RetroProjectManifestV1>;
  loadProject(projectId: string): Promise<RetroProjectManifestV1 | null>;
  listRecentProjects(options?: ListRecentProjectsOptions): Promise<RecentProjectEntryV1[]>;
  saveAsset(input: SaveAssetInput): Promise<LocalAssetRefV1>;
  resolveAsset(assetId: string): Promise<StoredAssetRecord | null>;
  deleteProject(projectId: string, options?: DeleteProjectOptions): Promise<void>;
}

function cloneRecentProjectEntry(entry: RecentProjectEntryV1): RecentProjectEntryV1 {
  return { ...entry };
}

function sortRecentEntries(entries: RecentProjectEntryV1[]): RecentProjectEntryV1[] {
  return [...entries].sort((a, b) => Date.parse(b.lastOpenedAt) - Date.parse(a.lastOpenedAt));
}

class InMemoryProjectStorageAdapter implements ProjectStorageAdapter {
  private readonly projects = new Map<string, RetroProjectManifestV1>();
  private readonly assets = new Map<string, StoredAssetRecord>();

  async saveProject(manifest: RetroProjectManifestV1): Promise<RetroProjectManifestV1> {
    const cloned = cloneProjectManifest(manifest);
    this.projects.set(cloned.projectId, cloned);
    return cloneProjectManifest(cloned);
  }

  async loadProject(projectId: string): Promise<RetroProjectManifestV1 | null> {
    const project = this.projects.get(projectId);
    return project ? cloneProjectManifest(project) : null;
  }

  async listRecentProjects(options: ListRecentProjectsOptions = {}): Promise<RecentProjectEntryV1[]> {
    const entries = sortRecentEntries(
      [...this.projects.values()].map((manifest) => createRecentProjectEntry(manifest)),
    );
    const limited = typeof options.limit === 'number' ? entries.slice(0, options.limit) : entries;
    return limited.map(cloneRecentProjectEntry);
  }

  async saveAsset(input: SaveAssetInput): Promise<LocalAssetRefV1> {
    const record: StoredAssetRecord = {
      asset: cloneAssetRef(input.asset),
      blob: input.blob,
    };
    this.assets.set(record.asset.assetId, record);
    return cloneAssetRef(record.asset);
  }

  async resolveAsset(assetId: string): Promise<StoredAssetRecord | null> {
    const stored = this.assets.get(assetId);
    if (!stored) return null;
    return {
      asset: cloneAssetRef(stored.asset),
      blob: stored.blob,
    };
  }

  async deleteProject(projectId: string, options: DeleteProjectOptions = {}): Promise<void> {
    this.projects.delete(projectId);
    for (const assetId of options.deleteAssetIds ?? []) {
      this.assets.delete(assetId);
    }
  }
}

export function createInMemoryProjectStorageAdapter(): ProjectStorageAdapter {
  return new InMemoryProjectStorageAdapter();
}

