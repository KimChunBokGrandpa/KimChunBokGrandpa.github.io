// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTransformStore } from './transformStore.svelte';

const originalURL = globalThis.URL;
const originalImage = globalThis.Image;
const createElement = document.createElement.bind(document);

let objectUrlCounter = 0;

class MockImage {
  onload: null | (() => void) = null;
  onerror: null | (() => void) = null;
  naturalWidth = 100;
  naturalHeight = 60;

  set src(_value: string) {
    queueMicrotask(() => {
      this.onload?.();
    });
  }
}

describe('createTransformStore', () => {
  beforeEach(() => {
    objectUrlCounter = 0;
    globalThis.URL.createObjectURL = vi.fn(() => `blob:transform-${++objectUrlCounter}`);
    globalThis.URL.revokeObjectURL = vi.fn();
    globalThis.Image = MockImage as typeof Image;

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName !== 'canvas') {
        return createElement(tagName);
      }

      const ctx = {
        save: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        drawImage: vi.fn(),
        restore: vi.fn(),
      };

      return {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ctx),
        toBlob: (callback: BlobCallback) => callback(new Blob(['ok'], { type: 'image/png' })),
      } as unknown as HTMLCanvasElement;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.URL = originalURL;
    globalThis.Image = originalImage;
  });

  it('starts with no transform state', () => {
    const store = createTransformStore();

    expect(store.rotation).toBe(0);
    expect(store.cropRect).toBeNull();
    expect(store.transformedSrc).toBeNull();
  });

  it('creates a transformed blob url when rotated', async () => {
    const store = createTransformStore();

    const result = await store.rotate('blob:source', 90);

    expect(result).toBe('blob:transform-1');
    expect(store.rotation).toBe(90);
    expect(store.cropRect).toBeNull();
    expect(store.transformedSrc).toBe('blob:transform-1');
  });

  it('stores crop state and transformed output', async () => {
    const store = createTransformStore();

    const result = await store.setCrop('blob:source', { x: 1, y: 2, w: 30, h: 20 });

    expect(result).toBe('blob:transform-1');
    expect(store.cropRect).toEqual({ x: 1, y: 2, w: 30, h: 20 });
    expect(store.transformedSrc).toBe('blob:transform-1');
  });

  it('resets state and revokes created urls', async () => {
    const store = createTransformStore();
    await store.rotate('blob:source', 180);

    store.reset();

    expect(store.rotation).toBe(0);
    expect(store.cropRect).toBeNull();
    expect(store.transformedSrc).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:transform-1');
  });
});
