/**
 * Image Processing Store — Manages image loading, processing pipeline,
 * settings state, undo history, and save operations.
 * Extracted from +page.svelte for separation of concerns.
 */
import { processorService } from '$lib/utils/imageProcessor';
import { saveImage } from '$lib/services/saveService';
import type { SaveFormat } from '$lib/services/saveService';
import type { ProcessingSettings } from '$lib/types';

const DEBOUNCE_MS = 150;
const MAX_HISTORY = 20;

const DEFAULT_SETTINGS: ProcessingSettings = {
  pixelSize: 1,
  palette: 'original',
  crtEffect: false,
  glitchFilters: [],
  renderMode: 'pixel_perfect',
  glitchSeed: null,
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

  // ─── Internal State ───
  let currentObjectUrl: string | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let processingGeneration = 0;
  let dimensionCapShown = false;

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
  async function processImmediate() {
    if (!originalImageSrc) return;
    if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
    const gen = ++processingGeneration;
    isProcessing = true;
    try {
      lastError = null;
      const result = await processorService.processImage(originalImageSrc, settings, handleDimensionCapped);
      if (result !== null) processedImageSrc = result;
    } catch (err) {
      console.error(err);
      lastError = err instanceof Error ? err.message : String(err);
    }
    finally { if (gen === processingGeneration) isProcessing = false; }
  }

  function applyProcessingDebounced() {
    if (!originalImageSrc) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    isProcessing = true;
    debounceTimer = setTimeout(async () => {
      debounceTimer = null;
      const gen = ++processingGeneration;
      try {
        lastError = null;
        const result = await processorService.processImage(originalImageSrc!, settings, handleDimensionCapped);
        if (result !== null) processedImageSrc = result;
      } catch (err) {
        console.error(err);
        lastError = err instanceof Error ? err.message : String(err);
      }
      finally { if (gen === processingGeneration) isProcessing = false; }
    }, DEBOUNCE_MS);
  }

  // ─── Public Actions ───
  function loadImage(file: File) {
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      processorService.clearImageCache();
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
    originalImageSrc = null;
    processedImageSrc = null;
  }

  function updateSettings(newSettings: ProcessingSettings) {
    pushHistory(settings);
    settings = { ...newSettings };
    applyProcessingDebounced();
  }

  function selectPalette(paletteId: string) {
    pushHistory(settings);
    settings.palette = paletteId;
    processImmediate();
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

  async function save(): Promise<string | null> {
    if (!processedImageSrc) return null;
    const cachedCanvas = processorService.getLastCanvas();
    return saveImage(processedImageSrc, { format: saveFormat, quality: saveQuality }, cachedCanvas);
  }

  function setFormat(format: SaveFormat) { saveFormat = format; }
  function setQuality(quality: number) { saveQuality = quality; }

  function setDimensionCapCallback(cb: (original: { w: number; h: number }, capped: { w: number; h: number }) => void) {
    onDimensionCapped = cb;
  }

  function destroy() {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
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

    // Actions
    loadImage,
    loadNewImage,
    updateSettings,
    selectPalette,
    undo,
    redo,
    jumpToHistory,
    save,
    setFormat,
    setQuality,
    setDimensionCapCallback,
    destroy,
    clearError: () => { lastError = null; },
  };
}
