/**
 * Image Processing Store — Manages image loading, processing pipeline,
 * settings state, undo history, and save operations.
 * Extracted from +page.svelte for separation of concerns.
 */
import { processorService } from '$lib/utils/imageProcessor';
import { saveImage } from '$lib/services/saveService';
import type { SaveFormat } from '$lib/services/saveService';
import type { ProcessingSettings, PostProcessFilters } from '$lib/types';
import { DEFAULT_POST_FILTERS } from '$lib/types';
import { decodeGif, encodeGif, frameToBlobUrl, type GifInfo } from '$lib/utils/gifProcessor';
import { i18n } from '$lib/i18n/index.svelte';

const DEBOUNCE_MS = 150;
const MAX_HISTORY = 20;

const DEFAULT_SETTINGS: ProcessingSettings = {
  pixelSize: 1,
  palette: 'original',
  crtEffect: false,
  glitchFilters: [],
  renderMode: 'pixel_perfect',
  glitchSeed: null,
  ditherType: 'none',
};

export function createImageProcessingStore() {
  // ─── Reactive State ───
  let originalImageSrc = $state<string | null>(null);
  let processedImageSrc = $state<string | null>(null);
  let isProcessing = $state(false);
  let lastError = $state<string | null>(null);
  let settings = $state<ProcessingSettings>({ ...DEFAULT_SETTINGS });
  let saveFormat = $state<SaveFormat>('png');
  let saveQuality = $state(0.92);
  let colorCount = $state(0);
  let postFilters = $state<PostProcessFilters>({ ...DEFAULT_POST_FILTERS });
  let autoProcess = $state(true);

  // ─── Transform State (pre-processing) ───
  let rotation = $state(0); // 0, 90, 180, 270
  let cropRect = $state<{ x: number; y: number; w: number; h: number } | null>(null);
  let transformedSrc = $state<string | null>(null); // blob URL after rotation/crop
  let transformedObjectUrl: string | null = null;

  /**
   * Apply rotation and crop to the original image, producing a transformed source.
   * Returns a blob URL of the transformed image.
   */
  async function applyTransform(): Promise<string | null> {
    if (!originalImageSrc) return null;

    // No transform needed
    if (rotation === 0 && !cropRect) {
      if (transformedObjectUrl) {
        URL.revokeObjectURL(transformedObjectUrl);
        transformedObjectUrl = null;
      }
      transformedSrc = null;
      return null;
    }

    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image for transform'));
      img.src = originalImageSrc!;
    });

    let srcX = 0, srcY = 0, srcW = img.naturalWidth, srcH = img.naturalHeight;
    if (cropRect) {
      srcX = cropRect.x;
      srcY = cropRect.y;
      srcW = cropRect.w;
      srcH = cropRect.h;
    }

    const isRotated90 = rotation === 90 || rotation === 270;
    const outW = isRotated90 ? srcH : srcW;
    const outH = isRotated90 ? srcW : srcH;

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d')!;

    ctx.save();
    ctx.translate(outW / 2, outH / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    // After rotation, draw centered
    const drawW = srcW;
    const drawH = srcH;
    ctx.drawImage(img, srcX, srcY, srcW, srcH, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/png');
    });

    if (transformedObjectUrl) URL.revokeObjectURL(transformedObjectUrl);
    transformedObjectUrl = URL.createObjectURL(blob);
    transformedSrc = transformedObjectUrl;
    return transformedObjectUrl;
  }

  // ─── Internal State ───
  let currentObjectUrl: string | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let processingGeneration = 0;
  let dimensionCapShown = false;

  // ─── GIF Animation State ───
  let isGif = $state(false);
  let gifInfo = $state<GifInfo | null>(null);
  let gifCurrentFrame = $state(0);
  let gifPlaying = $state(false);
  let gifProcessingProgress = $state(0); // 0-1 for export progress
  let gifIsExporting = $state(false);
  let gifFrameBlobUrls: (string | null)[] = [];
  let gifAnimTimer: ReturnType<typeof setTimeout> | null = null;

  // ─── Undo / Redo History ───
  let settingsHistory = $state<ProcessingSettings[]>([]);
  let redoHistory = $state<ProcessingSettings[]>([]);

  function cloneSettings(s: ProcessingSettings): ProcessingSettings {
    return { ...s, glitchFilters: s.glitchFilters.map(f => ({ ...f })) };
  }

  function pushHistory(s: ProcessingSettings) {
    settingsHistory.push(cloneSettings(s));
    if (settingsHistory.length > MAX_HISTORY) settingsHistory.shift();
    redoHistory.length = 0; // new action clears redo
  }

  // ─── Dimension Cap Notification ───
  let onDimensionCapped: ((original: { w: number; h: number }, capped: { w: number; h: number }) => void) | null = null;

  function handleDimensionCapped(original: { w: number; h: number }, capped: { w: number; h: number }) {
    if (dimensionCapShown) return;
    dimensionCapShown = true;
    onDimensionCapped?.(original, capped);
  }

  // ─── Processing Pipeline ───
  async function runProcessing() {
    const gen = ++processingGeneration;
    try {
      lastError = null;
      const srcToProcess = transformedSrc || originalImageSrc!;
      const result = await processorService.processImage(srcToProcess, settings, handleDimensionCapped);
      if (result !== null) {
        processedImageSrc = result;
        colorCount = processorService.getLastColorCount();
      }
    } catch (err) {
      console.error(err);
      lastError = err instanceof Error ? err.message : String(err);
    } finally {
      if (gen === processingGeneration) isProcessing = false;
    }
  }

  function processImmediate() {
    if (!originalImageSrc) return;
    if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
    isProcessing = true;
    runProcessing();
  }

  function applyProcessingDebounced() {
    if (!originalImageSrc) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    isProcessing = true;
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      runProcessing();
    }, DEBOUNCE_MS);
  }

  // ─── GIF Frame Cache ───
  let gifFrameCache = new Map<string, string>(); // "settingsHash:frameIdx" → blobUrl
  let gifCacheSettingsHash = '';

  function settingsHash(): string {
    return JSON.stringify({
      p: settings.pixelSize, pal: settings.palette, crt: settings.crtEffect,
      g: settings.glitchFilters, r: settings.renderMode, s: settings.glitchSeed,
      d: settings.ditherType,
    });
  }

  function invalidateGifCache() {
    for (const url of gifFrameCache.values()) URL.revokeObjectURL(url);
    gifFrameCache.clear();
    gifCacheSettingsHash = '';
  }

  // ─── GIF Helpers ───
  function stopGifPlayback() {
    gifPlaying = false;
    if (gifAnimTimer) { clearTimeout(gifAnimTimer); gifAnimTimer = null; }
  }

  function cleanupGif() {
    stopGifPlayback();
    isGif = false;
    gifInfo = null;
    gifCurrentFrame = 0;
    gifProcessingProgress = 0;
    gifIsExporting = false;
    for (const url of gifFrameBlobUrls) {
      if (url) URL.revokeObjectURL(url);
    }
    gifFrameBlobUrls = [];
    invalidateGifCache();
  }

  async function processGifFrame(frameIndex: number): Promise<string | null> {
    if (!gifInfo || frameIndex >= gifInfo.frames.length) return null;
    const frame = gifInfo.frames[frameIndex];
    // Create a blob URL from the raw frame, then process it
    const blobUrl = await frameToBlobUrl(frame);
    try {
      const result = await processorService.processImage(blobUrl, settings, handleDimensionCapped);
      return result;
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  }

  async function showGifFrame(index: number) {
    gifCurrentFrame = index;
    const hash = settingsHash();
    // Invalidate cache if settings changed
    if (hash !== gifCacheSettingsHash) {
      invalidateGifCache();
      gifCacheSettingsHash = hash;
    }
    // Check cache
    const cacheKey = `${index}`;
    const cached = gifFrameCache.get(cacheKey);
    if (cached) {
      processedImageSrc = cached;
      isProcessing = false;
      return;
    }
    isProcessing = true;
    try {
      const result = await processGifFrame(index);
      if (result !== null) {
        processedImageSrc = result;
        colorCount = processorService.getLastColorCount();
        gifFrameCache.set(cacheKey, result);
      }
    } catch (err) {
      console.error('GIF frame processing error:', err);
    } finally {
      isProcessing = false;
    }
  }

  function playGif() {
    if (!gifInfo || gifInfo.frames.length <= 1) return;
    gifPlaying = true;

    function nextFrame() {
      if (!gifPlaying || !gifInfo) return;
      const nextIdx = (gifCurrentFrame + 1) % gifInfo.frames.length;
      showGifFrame(nextIdx).then(() => {
        if (gifPlaying && gifInfo) {
          gifAnimTimer = setTimeout(nextFrame, gifInfo.frames[nextIdx].delay);
        }
      });
    }
    nextFrame();
  }

  function pauseGif() {
    stopGifPlayback();
  }

  function seekGifFrame(index: number) {
    stopGifPlayback();
    showGifFrame(index);
  }

  async function exportGif(): Promise<string | null> {
    if (!gifInfo) return null;
    gifIsExporting = true;
    gifProcessingProgress = 0;

    try {
      const processedFrames: { data: Uint8ClampedArray; delay: number }[] = [];
      let outW = 0;
      let outH = 0;

      for (let i = 0; i < gifInfo.frames.length; i++) {
        gifProcessingProgress = i / gifInfo.frames.length;
        const frame = gifInfo.frames[i];

        // Create blob URL from raw frame
        const blobUrl = await frameToBlobUrl(frame);
        try {
          // Process through the pipeline
          const resultUrl = await processorService.processImage(blobUrl, settings, handleDimensionCapped);
          if (!resultUrl) continue;

          // Read the processed result back as ImageData
          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Failed to load processed frame'));
            img.src = resultUrl;
          });

          // Track output dimensions from first frame
          if (i === 0) { outW = img.width; outH = img.height; }

          const canvas = document.createElement('canvas');
          canvas.width = outW;
          canvas.height = outH;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, outW, outH);
          const imageData = ctx.getImageData(0, 0, outW, outH);

          processedFrames.push({
            data: imageData.data,
            delay: frame.delay,
          });

          URL.revokeObjectURL(resultUrl);
        } finally {
          URL.revokeObjectURL(blobUrl);
        }
      }

      if (processedFrames.length === 0 || outW === 0) return null;

      gifProcessingProgress = 1;

      const gifBytes = encodeGif(processedFrames, outW, outH);
      const blob = new Blob([gifBytes], { type: 'image/gif' });
      const url = URL.createObjectURL(blob);

      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pixel-art-animation.gif';
      a.click();
      URL.revokeObjectURL(url);

      return i18n.t('gif_exported');
    } catch (err) {
      console.error('GIF export error:', err);
      lastError = err instanceof Error ? err.message : String(err);
      return null;
    } finally {
      gifIsExporting = false;
      gifProcessingProgress = 0;
    }
  }

  // ─── Public Actions ───
  function loadImage(file: File) {
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      processorService.clearImageCache();
    }
    cleanupGif();

    // Check if it's a GIF
    if (file.type === 'image/gif') {
      isProcessing = true;
      file.arrayBuffer().then((buffer) => {
        try {
          const info = decodeGif(buffer);
          if (info.frames.length > 1) {
            // It's an animated GIF
            isGif = true;
            gifInfo = info;
            gifCurrentFrame = 0;
            // Also set originalImageSrc for the preview
            currentObjectUrl = URL.createObjectURL(file);
            originalImageSrc = currentObjectUrl;
            dimensionCapShown = false;
            // Process first frame
            showGifFrame(0);
            return;
          }
        } catch {
          // Not a valid animated GIF, fall through to normal handling
        }
        // Single-frame GIF: treat as normal image
        currentObjectUrl = URL.createObjectURL(file);
        originalImageSrc = currentObjectUrl;
        dimensionCapShown = false;
        processImmediate();
      }).catch(() => {
        currentObjectUrl = URL.createObjectURL(file);
        originalImageSrc = currentObjectUrl;
        dimensionCapShown = false;
        processImmediate();
      });
      return;
    }

    currentObjectUrl = URL.createObjectURL(file);
    originalImageSrc = currentObjectUrl;
    dimensionCapShown = false;
    processImmediate();
  }

  function loadNewImage() {
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
      processorService.clearImageCache();
    }
    cleanupGif();
    originalImageSrc = null;
    processedImageSrc = null;
  }

  function updateSettings(newSettings: ProcessingSettings) {
    pushHistory(settings);
    settings = { ...newSettings };
    if (!autoProcess) return;
    if (isGif && gifInfo) {
      stopGifPlayback();
      showGifFrame(gifCurrentFrame);
    } else {
      applyProcessingDebounced();
    }
  }

  function selectPalette(paletteId: string) {
    pushHistory(settings);
    settings.palette = paletteId;
    if (!autoProcess) return;
    if (isGif && gifInfo) {
      stopGifPlayback();
      showGifFrame(gifCurrentFrame);
    } else {
      processImmediate();
    }
  }

  /** Manual apply — used when autoProcess is off */
  function applyNow() {
    if (!originalImageSrc) return;
    if (isGif && gifInfo) {
      stopGifPlayback();
      showGifFrame(gifCurrentFrame);
    } else {
      processImmediate();
    }
  }

  function undo() {
    if (settingsHistory.length === 0) return;
    redoHistory.push(cloneSettings(settings));
    const prev = settingsHistory.pop()!;
    settings = prev;
    applyProcessingDebounced();
  }

  function redo() {
    if (redoHistory.length === 0) return;
    settingsHistory.push(cloneSettings(settings));
    const next = redoHistory.pop()!;
    settings = next;
    applyProcessingDebounced();
  }

  function jumpToHistory(index: number, isRedoList: boolean = false) {
    if (isRedoList) {
      // Jump forward into redo history
      for (let i = 0; i <= index; i++) redo();
    } else {
      // Jump backward into settings history
      // index is from 0 (oldest) to length-1 (newest)
      // distance is length - 1 - index
      const distance = settingsHistory.length - 1 - index;
      for (let i = 0; i <= distance; i++) undo();
    }
  }

  function postFilterCssString(): string {
    const f = postFilters;
    const parts: string[] = [];
    if (f.brightness !== 100) parts.push(`brightness(${f.brightness}%)`);
    if (f.contrast !== 100) parts.push(`contrast(${f.contrast}%)`);
    if (f.saturation !== 100) parts.push(`saturate(${f.saturation}%)`);
    if (f.hueRotate !== 0) parts.push(`hue-rotate(${f.hueRotate}deg)`);
    return parts.join(' ');
  }

  async function save(): Promise<string | null> {
    if (!processedImageSrc) return null;
    const cachedCanvas = processorService.getLastCanvas();
    const filterStr = postFilterCssString();
    return saveImage(processedImageSrc, { format: saveFormat, quality: saveQuality }, cachedCanvas, filterStr || undefined);
  }

  function setFormat(format: SaveFormat) { saveFormat = format; }
  function setQuality(quality: number) { saveQuality = quality; }

  // ─── Rotation & Crop ───
  async function rotate(degrees: 90 | -90 | 180) {
    rotation = ((rotation + degrees) % 360 + 360) % 360;
    // Reset crop when rotating
    cropRect = null;
    await applyTransform();
    processorService.clearImageCache();
    processImmediate();
  }

  async function setCrop(rect: { x: number; y: number; w: number; h: number } | null) {
    cropRect = rect;
    await applyTransform();
    processorService.clearImageCache();
    processImmediate();
  }

  function resetTransform() {
    rotation = 0;
    cropRect = null;
    if (transformedObjectUrl) {
      URL.revokeObjectURL(transformedObjectUrl);
      transformedObjectUrl = null;
    }
    transformedSrc = null;
    processorService.clearImageCache();
    processImmediate();
  }

  function setDimensionCapCallback(cb: (original: { w: number; h: number }, capped: { w: number; h: number }) => void) {
    onDimensionCapped = cb;
  }

  function destroy() {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    cleanupGif();
    processorService.destroy();
  }

  return {
    // Reactive getters
    get originalImageSrc() { return originalImageSrc; },
    get processedImageSrc() { return processedImageSrc; },
    get isProcessing() { return isProcessing; },
    get lastError() { return lastError; },
    get settings() { return settings; },
    set settings(v: ProcessingSettings) { settings = v; },
    get settingsHistory() { return settingsHistory; },
    get redoHistory() { return redoHistory; },
    get saveFormat() { return saveFormat; },
    get saveQuality() { return saveQuality; },
    get colorCount() { return colorCount; },
    get postFilters() { return postFilters; },
    set postFilters(v: PostProcessFilters) { postFilters = v; },
    get postFilterCss() { return postFilterCssString(); },
    get autoProcess() { return autoProcess; },
    set autoProcess(v: boolean) { autoProcess = v; },

    // Transform state
    get rotation() { return rotation; },
    get cropRect() { return cropRect; },

    // GIF state
    get isGif() { return isGif; },
    get gifInfo() { return gifInfo; },
    get gifCurrentFrame() { return gifCurrentFrame; },
    get gifPlaying() { return gifPlaying; },
    get gifProcessingProgress() { return gifProcessingProgress; },
    get gifIsExporting() { return gifIsExporting; },
    get gifFrameCount() { return gifInfo?.frames.length ?? 0; },

    // Actions
    loadImage,
    loadNewImage,
    updateSettings,
    selectPalette,
    applyNow,
    undo,
    redo,
    jumpToHistory,
    save,
    setFormat,
    setQuality,
    setDimensionCapCallback,
    destroy,
    clearError: () => { lastError = null; },

    // Transform actions
    rotate,
    setCrop,
    resetTransform,

    // GIF actions
    playGif,
    pauseGif,
    seekGifFrame,
    exportGif,
  };
}
