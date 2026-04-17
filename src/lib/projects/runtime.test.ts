// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { defaultPostFilters } from '$lib/types';
import { defaultProcessingSettings } from '$lib/stores/settingsStore.svelte';
import { createProjectManifest, type PixelLabProjectStateV1 } from '$lib/projects/schema';
import { getProjectStorageAdapter, resetProjectStorageAdapter } from '$lib/projects/runtime';

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
});
