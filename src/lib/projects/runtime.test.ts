// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { defaultPostFilters } from '$lib/types';
import { defaultProcessingSettings } from '$lib/stores/settingsStore.svelte';
import { createProjectManifest, type PixelLabProjectStateV1 } from '$lib/projects/schema';
import {
  getProjectStorageAdapter,
  listRecentProjects,
  loadProject,
  resetProjectStorageAdapter,
  setProjectStorageAdapter,
} from '$lib/projects/runtime';

class FakeRequest<T> {
  onsuccess: ((this: IDBRequest<T>, ev: Event) => unknown) | null = null;
  onerror: ((this: IDBRequest<T>, ev: Event) => unknown) | null = null;
  onupgradeneeded: ((this: IDBOpenDBRequest, ev: IDBVersionChangeEvent) => unknown) | null = null;
  result!: T;
  error: DOMException | null = null;
}

class FakeObjectStore {
  constructor(
    private readonly map: Map<string, unknown>,
    private readonly keyField: string,
  ) {}

  put(value: Record<string, unknown>) {
    const request = new FakeRequest<unknown>() as unknown as IDBRequest<unknown>;
    queueMicrotask(() => {
      this.map.set(String(value[this.keyField]), structuredClone(value));
      (request as unknown as FakeRequest<unknown>).result = value;
      (request as unknown as FakeRequest<unknown>).onsuccess?.call(request, new Event('success'));
    });
    return request;
  }

  get(key: string) {
    const request = new FakeRequest<unknown>() as unknown as IDBRequest<unknown>;
    queueMicrotask(() => {
      (request as unknown as FakeRequest<unknown>).result = structuredClone(this.map.get(key));
      (request as unknown as FakeRequest<unknown>).onsuccess?.call(request, new Event('success'));
    });
    return request;
  }
}

class FakeTransaction {
  oncomplete: ((this: IDBTransaction, ev: Event) => unknown) | null = null;
  onabort: ((this: IDBTransaction, ev: Event) => unknown) | null = null;
  onerror: ((this: IDBTransaction, ev: Event) => unknown) | null = null;
  error: DOMException | null = null;

  constructor(
    private readonly stores: Record<string, FakeObjectStore>,
  ) {
    setTimeout(() => {
      this.oncomplete?.call(this as unknown as IDBTransaction, new Event('complete'));
    }, 0);
  }

  objectStore(name: string) {
    return this.stores[name] as unknown as IDBObjectStore;
  }
}

class FakeDatabase {
  readonly objectStoreNames = {
    contains: (name: string) => Object.hasOwn(this.storeMaps, name),
  } as DOMStringList;

  private readonly storeMaps: Record<string, Map<string, unknown>> = {};

  createObjectStore(name: string, options?: IDBObjectStoreParameters) {
    const keyField = (options?.keyPath as string) ?? 'id';
    this.storeMaps[name] = new Map<string, unknown>();
    return new FakeObjectStore(this.storeMaps[name], keyField) as unknown as IDBObjectStore;
  }

  transaction(names: string | string[]) {
    const storeNames = Array.isArray(names) ? names : [names];
    const stores = Object.fromEntries(
      storeNames.map((name) => [name, new FakeObjectStore(this.storeMaps[name], name === 'projects' ? 'projectId' : 'assetId')]),
    );
    return new FakeTransaction(stores) as unknown as IDBTransaction;
  }
}

class FakeIndexedDbFactory {
  private readonly database = new FakeDatabase();

  open() {
    const request = new FakeRequest<IDBDatabase>() as unknown as IDBOpenDBRequest;
    queueMicrotask(() => {
      (request as unknown as FakeRequest<IDBDatabase>).result = this.database as unknown as IDBDatabase;
      (request as unknown as FakeRequest<IDBDatabase>).onupgradeneeded?.call(
        request,
        new Event('upgradeneeded') as IDBVersionChangeEvent,
      );
      (request as unknown as FakeRequest<IDBDatabase>).onsuccess?.call(request, new Event('success'));
    });
    return request;
  }
}

function makePixelLabState(): PixelLabProjectStateV1 {
  return {
    kind: 'pixel-lab',
    processingSettings: {
      ...defaultProcessingSettings,
      glitchFilters: [],
      effectLayers: [],
    },
    postFilters: { ...defaultPostFilters },
    transformState: {
      rotation: 0,
      cropRect: null,
    },
  };
}

const originalIndexedDb = globalThis.indexedDB;

afterEach(() => {
  globalThis.indexedDB = originalIndexedDb;
  resetProjectStorageAdapter();
});

describe('project storage runtime', () => {
  it('falls back to in-memory storage when indexedDB is unavailable', async () => {
    globalThis.indexedDB = undefined as never;
    resetProjectStorageAdapter();

    const adapter = getProjectStorageAdapter();
    const manifest = createProjectManifest({
      appId: 'pixel-lab',
      name: 'In Memory Session',
      programState: makePixelLabState(),
    });

    await adapter.saveProject(manifest);
    resetProjectStorageAdapter();

    expect(await getProjectStorageAdapter().loadProject(manifest.projectId)).toBeNull();
  });

  it('defaults to persistent indexedDB storage when available', async () => {
    globalThis.indexedDB = new FakeIndexedDbFactory() as unknown as IDBFactory;
    resetProjectStorageAdapter();

    const manifest = createProjectManifest({
      appId: 'pixel-lab',
      name: 'Persistent Session',
      programState: makePixelLabState(),
    });

    await getProjectStorageAdapter().saveProject(manifest);
    resetProjectStorageAdapter();

    expect((await getProjectStorageAdapter().loadProject(manifest.projectId))?.name).toBe('Persistent Session');
  });

  it('filters out legacy poster-maker entries from recent projects', async () => {
    globalThis.indexedDB = undefined as never;
    resetProjectStorageAdapter();

    const adapter = getProjectStorageAdapter();

    // Save a valid pixel-lab project
    const pixelLabManifest = createProjectManifest({
      appId: 'pixel-lab',
      name: 'My Pixel Lab',
      programState: makePixelLabState(),
    });
    await adapter.saveProject(pixelLabManifest);

    // Save a legacy poster-maker project by bypassing type safety
    const posterManifest = createProjectManifest({
      appId: 'pixel-lab' as never,
      name: 'Legacy Poster',
      programState: makePixelLabState(),
    });
    // Manually override appId to simulate legacy poster-maker record
    (posterManifest as unknown as { appId: string }).appId = 'poster-maker';
    await adapter.saveProject(posterManifest as never);

    const recentProjects = await listRecentProjects();
    expect(recentProjects).toHaveLength(1);
    expect(recentProjects[0].appId).toBe('pixel-lab');
    expect(recentProjects[0].name).toBe('My Pixel Lab');
  });

  it('returns null for poster-maker project on loadProject', async () => {
    globalThis.indexedDB = undefined as never;
    resetProjectStorageAdapter();

    const adapter = getProjectStorageAdapter();

    // Save a legacy poster-maker project by bypassing type safety
    const posterManifest = createProjectManifest({
      appId: 'pixel-lab' as never,
      name: 'Legacy Poster',
      programState: makePixelLabState(),
    });
    (posterManifest as unknown as { appId: string }).appId = 'poster-maker';
    await adapter.saveProject(posterManifest as never);

    // loadProject should return null without throwing
    const result = await loadProject(posterManifest.projectId);
    expect(result).toBeNull();
  });

  it('returns null for project with poster-maker programState.kind', async () => {
    globalThis.indexedDB = undefined as never;
    resetProjectStorageAdapter();

    const adapter = getProjectStorageAdapter();
    const manifest = createProjectManifest({
      appId: 'pixel-lab',
      name: 'Sneaky Poster',
      programState: makePixelLabState(),
    });

    // Use a custom adapter that returns a record with poster-maker programState.kind
    setProjectStorageAdapter({
      ...adapter,
      async loadProject() {
        return {
          ...manifest,
          programState: { kind: 'poster-maker' },
        } as never;
      },
    } as typeof adapter);

    const result = await loadProject(manifest.projectId);
    expect(result).toBeNull();
  });

  it('loadProject returns valid pixel-lab projects normally', async () => {
    globalThis.indexedDB = undefined as never;
    resetProjectStorageAdapter();

    const adapter = getProjectStorageAdapter();

    const manifest = createProjectManifest({
      appId: 'pixel-lab',
      name: 'Valid Project',
      programState: makePixelLabState(),
    });
    await adapter.saveProject(manifest);

    const result = await loadProject(manifest.projectId);
    expect(result).not.toBeNull();
    expect(result?.name).toBe('Valid Project');
  });
});
