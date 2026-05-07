import {
  cloneAssetRef,
  cloneProjectManifest,
  createRecentProjectEntry,
  type LocalAssetRefV1,
  type RecentProjectEntryV1,
  type RetroProjectManifestV1,
} from '$lib/projects/schema';
import type {
  DeleteProjectOptions,
  ListRecentProjectsOptions,
  ProjectStorageAdapter,
  SaveAssetInput,
  StoredAssetRecord,
} from '$lib/projects/storageAdapter';

const projectDatabaseName = 'retro-pixel-converter-projects';
const projectDatabaseVersion = 1;
const projectsStoreName = 'projects';
const assetsStoreName = 'assets';

interface StoredManifestRecord {
  projectId: string;
  manifest: RetroProjectManifestV1;
}

interface StoredAssetDbRecord {
  assetId: string;
  asset: LocalAssetRefV1;
  blob: Blob;
}

function cloneRecentProjectEntry(entry: RecentProjectEntryV1): RecentProjectEntryV1 {
  return { ...entry };
}

function sortRecentEntries(entries: RecentProjectEntryV1[]): RecentProjectEntryV1[] {
  return [...entries].sort((a, b) => Date.parse(b.lastOpenedAt) - Date.parse(a.lastOpenedAt));
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
  });
}

function openProjectDatabase(indexedDbFactory: IDBFactory): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDbFactory.open(projectDatabaseName, projectDatabaseVersion);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(projectsStoreName)) {
        db.createObjectStore(projectsStoreName, { keyPath: 'projectId' });
      }
      if (!db.objectStoreNames.contains(assetsStoreName)) {
        db.createObjectStore(assetsStoreName, { keyPath: 'assetId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

class IndexedDbProjectStorageAdapter implements ProjectStorageAdapter {
  private readonly dbPromise: Promise<IDBDatabase>;
  private readonly listeners = new Set<() => void>();

  constructor(indexedDbFactory: IDBFactory) {
    this.dbPromise = openProjectDatabase(indexedDbFactory);
  }

  private notifySubscribers() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private async getDb(): Promise<IDBDatabase> {
    return this.dbPromise;
  }

  async saveProject(manifest: RetroProjectManifestV1): Promise<RetroProjectManifestV1> {
    const db = await this.getDb();
    const cloned = cloneProjectManifest(manifest);
    const transaction = db.transaction(projectsStoreName, 'readwrite');
    const store = transaction.objectStore(projectsStoreName);
    store.put({
      projectId: cloned.projectId,
      manifest: cloned,
    } satisfies StoredManifestRecord);
    await transactionDone(transaction);
    this.notifySubscribers();
    return cloneProjectManifest(cloned);
  }

  async loadProject(projectId: string): Promise<RetroProjectManifestV1 | null> {
    const db = await this.getDb();
    const transaction = db.transaction(projectsStoreName, 'readonly');
    const store = transaction.objectStore(projectsStoreName);
    const record = await requestToPromise(store.get(projectId) as IDBRequest<StoredManifestRecord | undefined>);
    await transactionDone(transaction);
    return record ? cloneProjectManifest(record.manifest) : null;
  }

  async listRecentProjects(options: ListRecentProjectsOptions = {}): Promise<RecentProjectEntryV1[]> {
    const db = await this.getDb();
    const transaction = db.transaction(projectsStoreName, 'readonly');
    const store = transaction.objectStore(projectsStoreName);
    const records = await requestToPromise(store.getAll() as IDBRequest<StoredManifestRecord[]>);
    await transactionDone(transaction);
    const entries = sortRecentEntries(
      records.map((record) => createRecentProjectEntry(record.manifest)),
    );
    const limited = typeof options.limit === 'number' ? entries.slice(0, options.limit) : entries;
    return limited.map(cloneRecentProjectEntry);
  }

  async saveAsset(input: SaveAssetInput): Promise<LocalAssetRefV1> {
    const db = await this.getDb();
    const asset = cloneAssetRef(input.asset);
    const transaction = db.transaction(assetsStoreName, 'readwrite');
    const store = transaction.objectStore(assetsStoreName);
    store.put({
      assetId: asset.assetId,
      asset,
      blob: input.blob,
    } satisfies StoredAssetDbRecord);
    await transactionDone(transaction);
    return cloneAssetRef(asset);
  }

  async resolveAsset(assetId: string): Promise<StoredAssetRecord | null> {
    const db = await this.getDb();
    const transaction = db.transaction(assetsStoreName, 'readonly');
    const store = transaction.objectStore(assetsStoreName);
    const record = await requestToPromise(store.get(assetId) as IDBRequest<StoredAssetDbRecord | undefined>);
    await transactionDone(transaction);
    if (!record) return null;
    return {
      asset: cloneAssetRef(record.asset),
      blob: record.blob,
    };
  }

  async deleteProject(projectId: string, options: DeleteProjectOptions = {}): Promise<void> {
    const db = await this.getDb();
    const transaction = db.transaction([projectsStoreName, assetsStoreName], 'readwrite');
    transaction.objectStore(projectsStoreName).delete(projectId);
    for (const assetId of options.deleteAssetIds ?? []) {
      transaction.objectStore(assetsStoreName).delete(assetId);
    }
    await transactionDone(transaction);
    this.notifySubscribers();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export function createIndexedDbProjectStorageAdapter(
  indexedDbFactory: IDBFactory = indexedDB,
): ProjectStorageAdapter {
  return new IndexedDbProjectStorageAdapter(indexedDbFactory);
}
