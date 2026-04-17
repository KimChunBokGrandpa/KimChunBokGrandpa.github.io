// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { defaultPostFilters } from '$lib/types';
import { defaultProcessingSettings } from '$lib/stores/settingsStore.svelte';
import {
  createAssetId,
  createProjectManifest,
  type LocalAssetRefV1,
  type PixelLabProjectStateV1,
} from '$lib/projects/schema';
import { createIndexedDbProjectStorageAdapter } from '$lib/projects/persistentStorageAdapter';

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

  getAll() {
    const request = new FakeRequest<unknown[]>() as unknown as IDBRequest<unknown[]>;
    queueMicrotask(() => {
      (request as unknown as FakeRequest<unknown[]>).result = [...this.map.values()].map((value) => structuredClone(value));
      (request as unknown as FakeRequest<unknown[]>).onsuccess?.call(request, new Event('success'));
    });
    return request;
  }

  delete(key: string) {
    const request = new FakeRequest<undefined>() as unknown as IDBRequest<undefined>;
    queueMicrotask(() => {
      this.map.delete(key);
      (request as unknown as FakeRequest<undefined>).result = undefined;
      (request as unknown as FakeRequest<undefined>).onsuccess?.call(request, new Event('success'));
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

function makeAssetRef(assetId = createAssetId()): LocalAssetRefV1 {
  return {
    assetId,
    role: 'source',
    mimeType: 'image/png',
    storageKey: `assets/${assetId}.png`,
    originAppId: 'pixel-lab',
    createdAt: '2026-04-09T00:00:00.000Z',
    filename: 'test.png',
  };
}

describe('indexeddb project storage adapter', () => {
  it('saves and loads project manifests durably', async () => {
    const adapter = createIndexedDbProjectStorageAdapter(new FakeIndexedDbFactory() as unknown as IDBFactory);
    const manifest = createProjectManifest({
      appId: 'pixel-lab',
      name: 'Persistent Session',
      programState: makePixelLabState(),
    });

    await adapter.saveProject(manifest);
    const loaded = await adapter.loadProject(manifest.projectId);

    expect(loaded?.name).toBe('Persistent Session');
  });

  it('saves, resolves, and deletes assets', async () => {
    const adapter = createIndexedDbProjectStorageAdapter(new FakeIndexedDbFactory() as unknown as IDBFactory);
    const asset = makeAssetRef();
    const blob = new Blob(['pixel'], { type: 'image/png' });

    await adapter.saveAsset({ asset, blob });
    expect((await adapter.resolveAsset(asset.assetId))?.asset.filename).toBe('test.png');

    const manifest = createProjectManifest({
      appId: 'pixel-lab',
      name: 'Cleanup',
      sourceAssetIds: [asset.assetId],
      programState: makePixelLabState(),
    });
    await adapter.saveProject(manifest);
    await adapter.deleteProject(manifest.projectId, { deleteAssetIds: [asset.assetId] });

    expect(await adapter.loadProject(manifest.projectId)).toBeNull();
    expect(await adapter.resolveAsset(asset.assetId)).toBeNull();
  });
});
