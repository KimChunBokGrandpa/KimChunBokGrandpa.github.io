/**
 * Image Processing Store — Manages image loading, processing pipeline,
 * settings state, undo history, and save operations.
 * Extracted from +page.svelte for separation of concerns.
 */
import { processorService } from '$lib/services/imageProcessor';
import { saveImage } from '$lib/services/saveService';
import type { SaveFormat } from '$lib/services/saveService';
import type { ProcessingSettings, PostProcessFilters } from '$lib/types';
import { DEFAULT_POST_FILTERS } from '$lib/types';
import { applyCrtEffect } from '$lib/utils/crtRenderer';
import { createGifPlaybackManager } from '$lib/stores/gifPlaybackManager.svelte';

const DEBOUNCE_MS = 150;
const MAX_HISTORY = 20;

const DEFAULT_SETTINGS: ProcessingSettings = {
  pixelSize: 1,
  palette: 'original',
  crtEffect: 'none',
  glitchFilters: [],
  renderMode: 'pixel_perfect',
  glitchSeed: null,
  ditherType: 'none',
  effectLayers: [],
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
  let hasUnappliedChanges = $state(false);

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

    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => { img.onload = null; img.onerror = null; resolve(); };
        img.onerror = () => { img.onload = null; img.onerror = null; reject(new Error('Failed to load image for transform')); };
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
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get 2d context for transform');

      ctx.save();
      ctx.translate(outW / 2, outH / 2);
      ctx.rotate((rotation * Math.PI) / 180);

      // After rotation, draw centered
      const drawW = srcW;
      const drawH = srcH;
      ctx.drawImage(img, srcX, srcY, srcW, srcH, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (!b) return reject(new Error('Failed to create transform blob'));
          resolve(b);
        }, 'image/png');
      });

      if (transformedObjectUrl) URL.revokeObjectURL(transformedObjectUrl);
      transformedObjectUrl = URL.createObjectURL(blob);
      transformedSrc = transformedObjectUrl;
      return transformedObjectUrl;
    } catch (err) {
      // Clean up stale URL on error to prevent memory leak
      if (transformedObjectUrl) {
        URL.revokeObjectURL(transformedObjectUrl);
        transformedObjectUrl = null;
      }
      transformedSrc = null;
      throw err;
    }
  }

  // ─── Internal State ───
  let currentObjectUrl: string | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let processingGeneration = 0;
  let dimensionCapShown = false;

  // ─── Undo / Redo History ───
  let settingsHistory = $state<ProcessingSettings[]>([]);
  let redoHistory = $state<ProcessingSettings[]>([]);

  function cloneSettings(s: ProcessingSettings): ProcessingSettings {
    return {
      ...s,
      glitchFilters: s.glitchFilters.map(f => ({ ...f })),
      effectLayers: s.effectLayers?.map(l => ({ ...l })),
    };
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

  // ─── Settings Hash (for GIF cache invalidation) ───
  let currentSettingsHash = $derived(JSON.stringify({
    p: settings.pixelSize, pal: settings.palette, crt: settings.crtEffect,
    g: settings.glitchFilters, r: settings.renderMode, s: settings.glitchSeed,
    d: settings.ditherType, el: settings.effectLayers,
  }));

  // ─── GIF Playback Manager ───
  const gif = createGifPlaybackManager({
    getSettings: () => settings,
    getSettingsHash: () => currentSettingsHash,
    setProcessedImageSrc: (src: string) => { processedImageSrc = src; },
    setIsProcessing: (v: boolean) => { isProcessing = v; },
    setColorCount: (v: number) => { colorCount = v; },
    setLastError: (err: string | null) => { lastError = err; },
    handleDimensionCapped,
  });

  // ─── Processing Pipeline ───
  async function runProcessing() {
    const gen = ++processingGeneration;
    try {
      lastError = null;
      const srcToProcess = transformedSrc || originalImageSrc;
      if (!srcToProcess) return;
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
    void runProcessing();
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

  // ─── Public Actions ───
  function loadImage(file: File) {
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      processorService.clearImageCache();
    }
    gif.cleanup();

    // Check if it's a GIF
    if (file.type === 'image/gif') {
      isProcessing = true;
      gif.loadGifFile(file, (url: string) => {
        currentObjectUrl = url;
        originalImageSrc = url;
        dimensionCapShown = false;
      }).then((wasMultiFrame) => {
        if (!wasMultiFrame) {
          // Single-frame or failed GIF: treat as normal image
          currentObjectUrl = URL.createObjectURL(file);
          originalImageSrc = currentObjectUrl;
          dimensionCapShown = false;
          processImmediate();
        }
      }).catch((err) => {
        console.error('GIF load failed:', err);
        isProcessing = false;
        lastError = err instanceof Error ? err.message : String(err);
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
    gif.cleanup();
    originalImageSrc = null;
    processedImageSrc = null;
  }

  function updateSettings(newSettings: ProcessingSettings) {
    pushHistory(settings);
    settings = { ...newSettings };
    if (!autoProcess) {
      hasUnappliedChanges = true;
      return;
    }
    if (gif.isGif && gif.gifInfo) {
      gif.stopPlayback();
      gif.showFrame(gif.gifCurrentFrame);
    } else {
      applyProcessingDebounced();
    }
  }

  function selectPalette(paletteId: string) {
    pushHistory(settings);
    settings.palette = paletteId;
    if (!autoProcess) {
      hasUnappliedChanges = true;
      return;
    }
    if (gif.isGif && gif.gifInfo) {
      gif.stopPlayback();
      gif.showFrame(gif.gifCurrentFrame);
    } else {
      processImmediate();
    }
  }

  /** Manual apply — used when autoProcess is off */
  function applyNow() {
    if (!originalImageSrc) return;
    hasUnappliedChanges = false;
    if (gif.isGif && gif.gifInfo) {
      gif.stopPlayback();
      gif.showFrame(gif.gifCurrentFrame);
    } else {
      processImmediate();
    }
  }

  function undo() {
    if (settingsHistory.length === 0) return;
    redoHistory.push(cloneSettings(settings));
    const prev = settingsHistory.pop()!;
    settings = prev;
    if (autoProcess) applyProcessingDebounced();
  }

  function redo() {
    if (redoHistory.length === 0) return;
    settingsHistory.push(cloneSettings(settings));
    const next = redoHistory.pop()!;
    settings = next;
    if (autoProcess) applyProcessingDebounced();
  }

  function jumpToHistory(index: number, isRedoList: boolean = false) {
    // Temporarily disable autoProcess to prevent debounce stacking per step
    const wasAutoProcess = autoProcess;
    autoProcess = false;
    try {
      if (isRedoList) {
        for (let i = 0; i <= index; i++) redo();
      } else {
        const distance = settingsHistory.length - 1 - index;
        for (let i = 0; i <= distance; i++) undo();
      }
    } finally {
      autoProcess = wasAutoProcess;
    }
    // Process once at the final state
    if (wasAutoProcess) applyProcessingDebounced();
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
    let canvas = processorService.getLastCanvas();
    if (settings.crtEffect !== 'none' && canvas) {
      canvas = applyCrtEffect(canvas, settings.crtEffect);
    }
    const filterStr = postFilterCssString();
    return saveImage(processedImageSrc, { format: saveFormat, quality: saveQuality }, canvas, filterStr || undefined);
  }

  function setFormat(format: SaveFormat) { saveFormat = format; }
  function setQuality(quality: number) { saveQuality = quality; }

  // ─── Rotation & Crop ───
  async function rotate(degrees: 90 | -90 | 180) {
    rotation = ((rotation + degrees) % 360 + 360) % 360;
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
    gif.cleanup();
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
    get hasUnappliedChanges() { return hasUnappliedChanges; },

    // Transform state
    get rotation() { return rotation; },
    get cropRect() { return cropRect; },

    // GIF state (delegated to gifPlaybackManager)
    get isGif() { return gif.isGif; },
    get gifInfo() { return gif.gifInfo; },
    get gifCurrentFrame() { return gif.gifCurrentFrame; },
    get gifPlaying() { return gif.gifPlaying; },
    get gifProcessingProgress() { return gif.gifProcessingProgress; },
    get gifIsExporting() { return gif.gifIsExporting; },
    get gifFrameCount() { return gif.gifFrameCount; },

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

    // Canvas access
    getLastCanvas: () => processorService.getLastCanvas(),

    // Transform actions
    rotate,
    setCrop,
    resetTransform,

    // GIF actions
    playGif: gif.play,
    pauseGif: gif.pause,
    seekGifFrame: gif.seek,
    exportGif: gif.exportGif,
    cancelGifExport: gif.cancelExport,
    deleteGifFrame: gif.deleteFrame,
    duplicateGifFrame: gif.duplicateFrame,
  };
}
