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
  let settings = $state<ProcessingSettings>({ ...DEFAULT_SETTINGS });
  let saveFormat = $state<SaveFormat>('png');
  let saveQuality = $state(0.92);

  // ─── Internal State ───
  let currentObjectUrl: string | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let processingGeneration = 0;
  let dimensionCapShown = false;

  // ─── Undo History ───
  let settingsHistory: ProcessingSettings[] = [];

  function cloneSettings(s: ProcessingSettings): ProcessingSettings {
    return { ...s, glitchFilters: s.glitchFilters.map(f => ({ ...f })) };
  }

  function pushHistory(s: ProcessingSettings) {
    settingsHistory.push(cloneSettings(s));
    if (settingsHistory.length > MAX_HISTORY) settingsHistory.shift();
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
      const result = await processorService.processImage(originalImageSrc, settings, handleDimensionCapped);
      if (result !== null) processedImageSrc = result;
    } catch (err) { console.error(err); }
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
        const result = await processorService.processImage(originalImageSrc!, settings, handleDimensionCapped);
        if (result !== null) processedImageSrc = result;
      } catch (err) { console.error(err); }
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
    const prev = settingsHistory.pop()!;
    settings = prev;
    applyProcessingDebounced();
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
    get settings() { return settings; },
    set settings(v: ProcessingSettings) { settings = v; },
    get saveFormat() { return saveFormat; },
    get saveQuality() { return saveQuality; },

    // Actions
    loadImage,
    loadNewImage,
    updateSettings,
    selectPalette,
    undo,
    save,
    setFormat,
    setQuality,
    setDimensionCapCallback,
    destroy,
  };
}
