/**
 * GIF Playback Manager — Handles GIF animation state, frame processing,
 * playback controls, caching, and export.
 * Used internally by imageProcessingStore.
 */
import { processorService } from '$lib/services/imageProcessor';
import { decodeGif, frameToBlobUrl, type GifInfo } from '$lib/utils/gifProcessor';
import type { ProcessingSettings, ImageWorkerMessage, GifEncodeWorkerMessage, GifEncodeWorkerResponse } from '$lib/types';
import { i18n } from '$lib/i18n/index.svelte';
import { customPaletteStore } from '$lib/stores/customPaletteStore.svelte';

/**
 * Cached GIF encode worker — reused across exports, auto-terminated after idle.
 */
const workerIdleMs = 30_000;
let cachedGifWorker: Worker | null = null;
let workerIdleTimer: ReturnType<typeof setTimeout> | null = null;

function getGifEncodeWorker(): Worker {
  if (workerIdleTimer) { clearTimeout(workerIdleTimer); workerIdleTimer = null; }
  if (!cachedGifWorker) {
    cachedGifWorker = new Worker(
      new URL('../workers/gifEncodeWorker.ts', import.meta.url),
      { type: 'module' },
    );
  }
  return cachedGifWorker;
}

function scheduleWorkerCleanup() {
  if (workerIdleTimer) clearTimeout(workerIdleTimer);
  workerIdleTimer = setTimeout(() => {
    cachedGifWorker?.terminate();
    cachedGifWorker = null;
    workerIdleTimer = null;
  }, workerIdleMs);
}

function encodeGifInWorker(
  frames: { data: Uint8ClampedArray; delay: number }[],
  width: number,
  height: number,
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const worker = getGifEncodeWorker();

    worker.onmessage = (e: MessageEvent<GifEncodeWorkerResponse>) => {
      scheduleWorkerCleanup();
      if (e.data.error) {
        reject(new Error(e.data.error));
      } else {
        resolve(new Uint8Array(e.data.gifData!));
      }
    };

    worker.onerror = (err) => {
      // On error, discard the worker
      cachedGifWorker?.terminate();
      cachedGifWorker = null;
      reject(err);
    };

    // Transfer frame ArrayBuffers for zero-copy
    const transferable: ArrayBuffer[] = [];
    const message: GifEncodeWorkerMessage = {
      frames: frames.map((f) => {
        const buf = f.data.buffer.slice(0);
        transferable.push(buf);
        return { data: buf, delay: f.delay };
      }),
      width,
      height,
    };

    worker.postMessage(message, transferable);
  });
}

export interface GifManagerDeps {
  getSettings: () => ProcessingSettings;
  getSettingsHash: () => string;
  setProcessedImageSrc: (src: string) => void;
  setIsProcessing: (v: boolean) => void;
  setColorCount: (v: number) => void;
  setLastError: (err: string | null) => void;
  handleDimensionCapped: (original: { w: number; h: number }, capped: { w: number; h: number }) => void;
}

export function createGifPlaybackManager(deps: GifManagerDeps) {
  // ─── GIF Animation State ───
  let isGif = $state(false);
  let gifInfo = $state<GifInfo | null>(null);
  let gifCurrentFrame = $state(0);
  let gifPlaying = $state(false);
  let gifProcessingProgress = $state(0);
  let gifIsExporting = $state(false);
  let gifFrameBlobUrls: (string | null)[] = [];
  let gifAnimTimer: ReturnType<typeof setTimeout> | null = null;
  let exportAbortController: AbortController | null = null;

  // ─── GIF Frame Cache (LRU, max 30 entries) ───
  const maxFrameCache = 30;
  let gifFrameCache = new Map<string, string>();
  let gifCacheSettingsHash = '';

  /** Track the currently displayed URL so we don't revoke it while it's still in an <img> */
  let activeFrameUrl: string | null = null;

  function invalidateCache() {
    for (const url of gifFrameCache.values()) {
      // Don't revoke the URL currently being displayed
      if (url !== activeFrameUrl) URL.revokeObjectURL(url);
    }
    gifFrameCache.clear();
    gifCacheSettingsHash = '';
  }

  function stopPlayback() {
    gifPlaying = false;
    if (gifAnimTimer) { clearTimeout(gifAnimTimer); gifAnimTimer = null; }
  }

  function cleanup() {
    stopPlayback();
    isGif = false;
    gifInfo = null;
    gifCurrentFrame = 0;
    gifProcessingProgress = 0;
    gifIsExporting = false;
    for (const url of gifFrameBlobUrls) {
      if (url) URL.revokeObjectURL(url);
    }
    gifFrameBlobUrls = [];
    // Revoke active frame URL before invalidating cache (cache won't revoke it)
    if (activeFrameUrl) {
      URL.revokeObjectURL(activeFrameUrl);
      activeFrameUrl = null;
    }
    invalidateCache();
  }

  async function processFrame(frameIndex: number): Promise<string | null> {
    if (!gifInfo || frameIndex >= gifInfo.frames.length) return null;
    const frame = gifInfo.frames[frameIndex];
    const blobUrl = await frameToBlobUrl(frame);
    try {
      return await processorService.processImage(blobUrl, deps.getSettings(), deps.handleDimensionCapped);
    } finally {
      processorService.evictFromImageCache(blobUrl);
      URL.revokeObjectURL(blobUrl);
    }
  }

  async function showFrame(index: number) {
    gifCurrentFrame = index;
    const hash = deps.getSettingsHash();
    if (hash !== gifCacheSettingsHash) {
      invalidateCache();
      gifCacheSettingsHash = hash;
    }
    const cacheKey = `${index}`;
    const cached = gifFrameCache.get(cacheKey);
    if (cached) {
      // LRU: re-insert to mark as recently used
      gifFrameCache.delete(cacheKey);
      gifFrameCache.set(cacheKey, cached);
      activeFrameUrl = cached;
      deps.setProcessedImageSrc(cached);
      deps.setIsProcessing(false);
      return;
    }
    deps.setIsProcessing(true);
    try {
      const result = await processFrame(index);
      if (result !== null) {
        activeFrameUrl = result;
        deps.setProcessedImageSrc(result);
        deps.setColorCount(processorService.getLastColorCount());
        gifFrameCache.set(cacheKey, result);
        // LRU eviction: remove oldest entries when cache exceeds limit
        if (gifFrameCache.size > maxFrameCache) {
          const oldest = gifFrameCache.keys().next().value!;
          const oldUrl = gifFrameCache.get(oldest)!;
          if (oldUrl !== activeFrameUrl) URL.revokeObjectURL(oldUrl);
          gifFrameCache.delete(oldest);
        }
      }
    } catch (err) {
      console.error('GIF frame processing error:', err);
    } finally {
      deps.setIsProcessing(false);
    }
  }

  function play() {
    if (!gifInfo || gifInfo.frames.length <= 1) return;
    gifPlaying = true;

    function nextFrame() {
      if (!gifPlaying || !gifInfo) return;
      const nextIdx = (gifCurrentFrame + 1) % gifInfo.frames.length;
      showFrame(nextIdx).then(() => {
        if (gifPlaying && gifInfo) {
          gifAnimTimer = setTimeout(nextFrame, gifInfo.frames[nextIdx].delay);
        }
      }).catch((err) => {
        console.error('GIF playback error:', err);
        stopPlayback();
      });
    }
    nextFrame();
  }

  function pause() {
    stopPlayback();
  }

  function seek(index: number) {
    stopPlayback();
    showFrame(index).catch((err) => {
      console.error('GIF seek error:', err);
    });
  }

  function cancelExport() {
    if (exportAbortController) {
      exportAbortController.abort();
      exportAbortController = null;
    }
  }

  async function exportGif(): Promise<string | null> {
    if (!gifInfo) return null;
    exportAbortController = new AbortController();
    const signal = exportAbortController.signal;
    gifIsExporting = true;
    gifProcessingProgress = 0;
    const settings = deps.getSettings();

    try {
      const { ImageWorkerPool } = await import('$lib/utils/workerPool');
      const pool = new ImageWorkerPool();

      try {
        if (signal.aborted) throw new DOMException('Export cancelled', 'AbortError');

        const frames = gifInfo.frames;
        const totalFrames = frames.length;
        let completedFrames = 0;

        const customPaletteColors = settings.palette.startsWith('custom_')
          ? customPaletteStore.getPaletteById(settings.palette)?.colors
              ?.map(c => ({ r: c.r, g: c.g, b: c.b }))
          : undefined;

        const maxDimension = settings.renderMode === 'hqx' ? 1024 : 2048;
        const frameW = frames[0].width;
        const frameH = frames[0].height;
        let procW = frameW;
        let procH = frameH;
        if (procW > maxDimension || procH > maxDimension) {
          const scale = maxDimension / Math.max(procW, procH);
          procW = Math.round(procW * scale);
          procH = Math.round(procH * scale);
        }

        const framePromises = frames.map(async (frame, i) => {
          if (signal.aborted) throw new DOMException('Export cancelled', 'AbortError');

          const imageData = new ImageData(
            new Uint8ClampedArray(frame.data),
            frame.width,
            frame.height,
          );
          const bitmap = await createImageBitmap(imageData, {
            resizeWidth: procW,
            resizeHeight: procH,
          });

          // Ensure bitmap is closed if abort happens after creation or submit fails
          if (signal.aborted) {
            bitmap.close();
            throw new DOMException('Export cancelled', 'AbortError');
          }

          const message: ImageWorkerMessage = {
            id: `gif-frame-${i}`,
            imageBitmap: bitmap,
            width: procW,
            height: procH,
            pixelSize: settings.pixelSize,
            palette: settings.palette,
            glitchFilters: settings.glitchFilters.map(f => ({
              type: f.type,
              intensity: f.intensity,
            })),
            renderMode: settings.renderMode,
            glitchSeed: settings.glitchSeed,
            ditherType: settings.ditherType,
            quantizationBackend: 'wasm',
            customPaletteColors,
            effectLayers: settings.effectLayers?.map(l => ({ ...l })),
          };

          try {
            const result = await pool.submit(message, [bitmap]);
            completedFrames++;
            gifProcessingProgress = (completedFrames / totalFrames) * 0.9;
            return { imageData: result, delay: frame.delay };
          } catch (err) {
            bitmap.close();
            throw err;
          }
        });

        const results = await Promise.all(framePromises);

        if (results.length === 0) return null;
        const outW = results[0].imageData.width;
        const outH = results[0].imageData.height;

        const processedFrames = results.map(r => ({
          data: r.imageData.data,
          delay: r.delay,
        }));

        if (signal.aborted) throw new DOMException('Export cancelled', 'AbortError');
        gifProcessingProgress = 0.92;

        const gifBytes = await encodeGifInWorker(processedFrames, outW, outH);
        gifProcessingProgress = 1;

        const blob = new Blob([gifBytes], { type: 'image/gif' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'pixel-art-animation.gif';
        a.click();
        URL.revokeObjectURL(url);

        return i18n.t('gif_exported');
      } finally {
        pool.destroy();
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User cancelled — not an error
        return null;
      }
      console.error('GIF export error:', err);
      deps.setLastError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      exportAbortController = null;
      gifIsExporting = false;
      gifProcessingProgress = 0;
    }
  }

  /** Load a GIF file. Returns true if it was a multi-frame GIF, false otherwise. */
  async function loadGifFile(file: File, setOriginalSrc: (url: string) => void): Promise<boolean> {
    try {
      const buffer = await file.arrayBuffer();
      try {
        const info = decodeGif(buffer);
        if (info.frames.length > 1) {
          isGif = true;
          gifInfo = info;
          gifCurrentFrame = 0;
          const objectUrl = URL.createObjectURL(file);
          setOriginalSrc(objectUrl);
          showFrame(0).catch((err) => {
            console.error('GIF initial frame error:', err);
          });
          return true;
        }
      } catch (err) {
        console.warn('GIF decode failed, treating as static image:', err);
      }
    } catch (err) {
      console.error('Failed to read GIF file:', err);
    }
    return false;
  }

  // ─── Frame Manipulation ───

  /** Delete the frame at the given index. Requires at least 2 frames. */
  function deleteFrame(frameIndex: number) {
    if (!gifInfo || gifInfo.frames.length <= 1) return;
    if (frameIndex < 0 || frameIndex >= gifInfo.frames.length) return;

    pause();
    invalidateCache();

    const newFrames = [...gifInfo.frames];
    newFrames.splice(frameIndex, 1);
    gifInfo = { ...gifInfo, frames: newFrames };

    // Adjust current frame if needed
    if (gifCurrentFrame >= newFrames.length) {
      gifCurrentFrame = newFrames.length - 1;
    }
    showFrame(gifCurrentFrame);
  }

  /** Duplicate the frame at the given index (insert copy after it). */
  function duplicateFrame(frameIndex: number) {
    if (!gifInfo) return;
    if (frameIndex < 0 || frameIndex >= gifInfo.frames.length) return;

    pause();
    invalidateCache();

    const frame = gifInfo.frames[frameIndex];
    const copy = {
      ...frame,
      data: new Uint8ClampedArray(frame.data),
    };

    const newFrames = [...gifInfo.frames];
    newFrames.splice(frameIndex + 1, 0, copy);
    gifInfo = { ...gifInfo, frames: newFrames };
  }

  /** Move a frame from one index to another. */
  function reorderFrame(fromIndex: number, toIndex: number) {
    if (!gifInfo) return;
    const len = gifInfo.frames.length;
    if (fromIndex < 0 || fromIndex >= len || toIndex < 0 || toIndex >= len) return;
    if (fromIndex === toIndex) return;

    pause();
    invalidateCache();

    const newFrames = [...gifInfo.frames];
    const [moved] = newFrames.splice(fromIndex, 1);
    newFrames.splice(toIndex, 0, moved);
    gifInfo = { ...gifInfo, frames: newFrames };
    gifCurrentFrame = toIndex;
    showFrame(toIndex);
  }

  return {
    // Reactive getters
    get isGif() { return isGif; },
    get gifInfo() { return gifInfo; },
    get gifCurrentFrame() { return gifCurrentFrame; },
    get gifPlaying() { return gifPlaying; },
    get gifProcessingProgress() { return gifProcessingProgress; },
    get gifIsExporting() { return gifIsExporting; },
    get gifFrameCount() { return gifInfo?.frames.length ?? 0; },

    // Actions
    play,
    pause,
    seek,
    showFrame,
    stopPlayback,
    cleanup,
    exportGif,
    cancelExport,
    loadGifFile,
    invalidateCache,
    deleteFrame,
    duplicateFrame,
    reorderFrame,
  };
}
