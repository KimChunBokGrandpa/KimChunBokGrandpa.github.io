/**
 * Image Processing Store — Manages image loading, processing pipeline,
 * settings state, undo history, and save operations.
 * Extracted from +page.svelte for separation of concerns.
 */
import { processorService } from '$lib/services/imageProcessor';
import { saveImage, shareImage } from '$lib/services/saveService';
import type { SaveFormat } from '$lib/services/saveService';
import type { ProcessingSettings, PostProcessFilters } from '$lib/types';
import { applyCrtEffect } from '$lib/utils/crtRenderer';
import { createGifPlaybackManager } from '$lib/stores/gifPlaybackManager.svelte';
import { createHistoryStore } from '$lib/stores/historyStore.svelte';
import { createSettingsStore, DEFAULT_PROCESSING_SETTINGS } from '$lib/stores/settingsStore.svelte';
import { createTransformStore, type CropRect } from '$lib/stores/transformStore.svelte';

const DEBOUNCE_MS = 150;

export function createImageProcessingStore() {
  // ─── Reactive State ───
  let originalImageSrc = $state<string | null>(null);
  let processedImageSrc = $state<string | null>(null);
  let isProcessing = $state(false);
  let lastError = $state<string | null>(null);
  let colorCount = $state(0);

  // ─── Internal State ───
  let currentObjectUrl: string | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let processingGeneration = 0;
  let dimensionCapShown = false;

  // ─── Sub-Stores ───
  const settingsStore = createSettingsStore(DEFAULT_PROCESSING_SETTINGS);
  const transformStore = createTransformStore();

  // ─── Undo / Redo History ───
  const history = createHistoryStore();

  // ─── Dimension Cap Notification ───
  let onDimensionCapped: ((original: { w: number; h: number }, capped: { w: number; h: number }) => void) | null = null;

  function handleDimensionCapped(original: { w: number; h: number }, capped: { w: number; h: number }) {
    if (dimensionCapShown) return;
    dimensionCapShown = true;
    onDimensionCapped?.(original, capped);
  }

  // ─── GIF Playback Manager ───
  const gif = createGifPlaybackManager({
    getSettings: () => settingsStore.settings,
    getSettingsHash: () => settingsStore.settingsHash,
    setProcessedImageSrc: (src: string) => { processedImageSrc = src; },
    setIsProcessing: (v: boolean) => { isProcessing = v; },
    setColorCount: (v: number) => { colorCount = v; },
    setLastError: (err: string | null) => { lastError = err; },
    handleDimensionCapped,
  });

  // ─── Processing Progress ───
  let processingProgress = $state(0);
  let processingStartTime = $state(0);

  // ─── Processing Pipeline ───
  async function runProcessing() {
    const gen = ++processingGeneration;
    try {
      lastError = null;
      processingProgress = 0;
      processingStartTime = Date.now();
      const srcToProcess = transformStore.transformedSrc || originalImageSrc;
      if (!srcToProcess) return;
      const result = await processorService.processImage(
        srcToProcess,
        settingsStore.settings,
        handleDimensionCapped,
        (p: number) => { processingProgress = p; },
      );
      if (result !== null) {
        processedImageSrc = result;
        colorCount = processorService.getLastColorCount();
      }
    } catch (err) {
      console.error(err);
      lastError = err instanceof Error ? err.message : String(err);
    } finally {
      if (gen === processingGeneration) {
        isProcessing = false;
        processingProgress = 1;
      }
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
    transformStore.reset();

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
    transformStore.reset();
    originalImageSrc = null;
    processedImageSrc = null;
  }

  function updateSettings(newSettings: ProcessingSettings) {
    history.push(settingsStore.settings);
    settingsStore.setSettings(newSettings);
    if (!settingsStore.autoProcess) {
      settingsStore.markUnappliedChanges();
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
    history.push(settingsStore.settings);
    settingsStore.selectPalette(paletteId);
    if (!settingsStore.autoProcess) {
      settingsStore.markUnappliedChanges();
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
    settingsStore.clearUnappliedChanges();
    if (gif.isGif && gif.gifInfo) {
      gif.stopPlayback();
      gif.showFrame(gif.gifCurrentFrame);
    } else {
      processImmediate();
    }
  }

  function undo() {
    const prev = history.undo(settingsStore.settings);
    if (!prev) return;
    settingsStore.setSettings(prev);
    if (settingsStore.autoProcess) applyProcessingDebounced();
  }

  function redo() {
    const next = history.redo(settingsStore.settings);
    if (!next) return;
    settingsStore.setSettings(next);
    if (settingsStore.autoProcess) applyProcessingDebounced();
  }

  function jumpToHistory(index: number, isRedoList: boolean = false) {
    // Temporarily disable autoProcess to prevent debounce stacking per step
    const wasAutoProcess = settingsStore.autoProcess;
    settingsStore.setAutoProcess(false);
    try {
      if (isRedoList) {
        for (let i = 0; i <= index; i++) redo();
      } else {
        const distance = history.undoStack.length - 1 - index;
        for (let i = 0; i <= distance; i++) undo();
      }
    } finally {
      settingsStore.setAutoProcess(wasAutoProcess);
    }
    // Process once at the final state
    if (wasAutoProcess) applyProcessingDebounced();
  }

  async function save(): Promise<string | null> {
    if (!processedImageSrc) return null;
    let canvas = processorService.getLastCanvas();
    if (settingsStore.settings.crtEffect !== 'none' && canvas) {
      canvas = applyCrtEffect(canvas, settingsStore.settings.crtEffect);
    }
    const filterStr = settingsStore.postFilterCss;
    return saveImage(
      processedImageSrc,
      { format: settingsStore.saveFormat, quality: settingsStore.saveQuality },
      canvas,
      filterStr || undefined,
    );
  }

  async function share(): Promise<string | null> {
    if (!processedImageSrc) return null;
    let canvas = processorService.getLastCanvas();
    if (settingsStore.settings.crtEffect !== 'none' && canvas) {
      canvas = applyCrtEffect(canvas, settingsStore.settings.crtEffect);
    }
    const filterStr = settingsStore.postFilterCss;
    return shareImage(
      processedImageSrc,
      { format: settingsStore.saveFormat, quality: settingsStore.saveQuality },
      canvas,
      filterStr || undefined,
    );
  }

  function setFormat(format: SaveFormat) { settingsStore.setFormat(format); }
  function setQuality(quality: number) { settingsStore.setQuality(quality); }

  // ─── Rotation & Crop ───
  async function rotate(degrees: 90 | -90 | 180) {
    await transformStore.rotate(originalImageSrc, degrees);
    processorService.clearImageCache();
    processImmediate();
  }

  async function setCrop(rect: CropRect | null) {
    await transformStore.setCrop(originalImageSrc, rect);
    processorService.clearImageCache();
    processImmediate();
  }

  function resetTransform() {
    transformStore.reset();
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
    transformStore.destroy();
    processorService.destroy();
  }

  return {
    // Reactive getters
    get originalImageSrc() { return originalImageSrc; },
    get processedImageSrc() { return processedImageSrc; },
    get isProcessing() { return isProcessing; },
    get lastError() { return lastError; },
    get settings() { return settingsStore.settings; },
    set settings(v: ProcessingSettings) { settingsStore.setSettings(v); },
    get settingsHistory() { return history.undoStack; },
    get redoHistory() { return history.redoStack; },
    get saveFormat() { return settingsStore.saveFormat; },
    get saveQuality() { return settingsStore.saveQuality; },
    get colorCount() { return colorCount; },
    get postFilters() { return settingsStore.postFilters; },
    set postFilters(v: PostProcessFilters) { settingsStore.setPostFilters(v); },
    get postFilterCss() { return settingsStore.postFilterCss; },
    get autoProcess() { return settingsStore.autoProcess; },
    set autoProcess(v: boolean) { settingsStore.setAutoProcess(v); },
    get hasUnappliedChanges() { return settingsStore.hasUnappliedChanges; },
    get processingProgress() { return processingProgress; },
    get processingStartTime() { return processingStartTime; },

    // Transform state
    get rotation() { return transformStore.rotation; },
    get cropRect() { return transformStore.cropRect; },

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
    share,
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
    reorderGifFrame: gif.reorderFrame,
  };
}
