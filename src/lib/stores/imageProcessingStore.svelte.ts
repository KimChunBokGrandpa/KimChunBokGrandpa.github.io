/**
 * Image Processing Store — Manages image loading, processing pipeline,
 * settings state, undo history, and save operations.
 * Extracted from +page.svelte for separation of concerns.
 */
import { processorService } from '$lib/services/imageProcessor';
import { createExportFile, saveImage, shareImage } from '$lib/services/saveService';
import type { SaveFormat } from '$lib/services/saveService';
import type { ProcessingSettings, PostProcessFilters } from '$lib/types';
import { applyCrtEffect } from '$lib/utils/crtRenderer';
import { createGifPlaybackManager } from '$lib/stores/gifPlaybackManager.svelte';
import { createHistoryStore } from '$lib/stores/historyStore.svelte';
import { createSettingsStore, defaultProcessingSettings } from '$lib/stores/settingsStore.svelte';
import { createTransformStore, type CropRect } from '$lib/stores/transformStore.svelte';
import {
  createAssetId,
  createExportHistoryEntry,
  createProjectId,
  createProjectManifest,
  timestampNow,
  type ExportHistoryEntry,
  type RetroProjectManifestV1,
} from '$lib/projects/schema';
import { getProjectStorageAdapter } from '$lib/projects/runtime';
import type { ProjectStorageAdapter } from '$lib/projects/storageAdapter';

const debounceMs = 150;
const maxExportHistoryEntries = 20;

function derivePixelLabProjectName(filename: string | null): string {
  const trimmed = filename?.trim();
  if (!trimmed) return 'Pixel Lab Project';
  return trimmed.replace(/\.[^.]+$/, '');
}

export function createImageProcessingStore(
  projectStorage: ProjectStorageAdapter = getProjectStorageAdapter(),
) {
  // ─── Reactive State ───
  let originalImageSrc = $state<string | null>(null);
  let processedImageSrc = $state<string | null>(null);
  let isProcessing = $state(false);
  let lastError = $state<string | null>(null);
  let colorCount = $state(0);
  let currentProjectId = $state<string | null>(null);
  let currentProjectCreatedAt = $state<string | null>(null);
  let currentSourceAssetId = $state<string | null>(null);
  let currentSourceFilename = $state<string | null>(null);
  let currentExportHistory = $state<ExportHistoryEntry[]>([]);

  // ─── Internal State ───
  let currentObjectUrl: string | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let processingGeneration = 0;
  let dimensionCapShown = false;

  // ─── Sub-Stores ───
  const settingsStore = createSettingsStore(defaultProcessingSettings);
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
    }, debounceMs);
  }

  // ─── Public Actions ───
  async function persistCurrentProject() {
    if (!currentProjectId || !currentProjectCreatedAt || !currentSourceAssetId) return null;

    const now = timestampNow();
    const manifest = createProjectManifest({
      projectId: currentProjectId,
      createdAt: currentProjectCreatedAt,
      updatedAt: now,
      lastOpenedAt: now,
      appId: 'pixel-lab',
      name: derivePixelLabProjectName(currentSourceFilename),
      sourceAssetIds: [currentSourceAssetId],
      primaryAssetId: currentSourceAssetId,
      previewAssetId: currentSourceAssetId,
      exportHistory: currentExportHistory,
      programState: {
        kind: 'pixel-lab',
        activeSourceAssetId: currentSourceAssetId,
        lastProcessedAssetId: currentSourceAssetId,
        processingSettings: settingsStore.settings,
        postFilters: settingsStore.postFilters,
        transformState: {
          rotation: transformStore.rotation,
          cropRect: transformStore.cropRect,
        },
        exportDefaults: {
          format: settingsStore.saveFormat,
          quality: settingsStore.saveQuality,
        },
      },
    });
    await projectStorage.saveProject(manifest);
    return manifest;
  }

  async function recordExport(format: SaveFormat, canvas: HTMLCanvasElement | null | undefined) {
    if (!currentProjectId || !currentProjectCreatedAt || !currentSourceAssetId) return null;

    currentExportHistory = [
      createExportHistoryEntry({
        format,
        width: canvas?.width,
        height: canvas?.height,
      }),
      ...currentExportHistory,
    ].slice(0, maxExportHistoryEntries);

    return persistCurrentProject();
  }

  async function startNewPixelLabProject(file: File) {
    const createdAt = timestampNow();
    const nextProjectId = createProjectId();
    const nextAssetId = createAssetId();

    await projectStorage.saveAsset({
      asset: {
        assetId: nextAssetId,
        role: 'source',
        mimeType: file.type || 'image/png',
        storageKey: `pixel-lab-sources/${nextAssetId}-${file.name}`,
        originAppId: 'pixel-lab',
        createdAt,
        filename: file.name,
        byteSize: file.size,
      },
      blob: file,
    });

    currentProjectId = nextProjectId;
    currentProjectCreatedAt = createdAt;
    currentSourceAssetId = nextAssetId;
    currentSourceFilename = file.name;
    currentExportHistory = [];
    await persistCurrentProject();
  }

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
    void startNewPixelLabProject(file);
    processImmediate();
  }

  async function loadPixelLabProject(manifest: RetroProjectManifestV1, file: File) {
    if (manifest.appId !== 'pixel-lab' || manifest.programState.kind !== 'pixel-lab') {
      throw new Error('Unsupported Pixel Lab project manifest');
    }

    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
      processorService.clearImageCache();
    }
    gif.cleanup();
    transformStore.reset();
    history.reset();

    currentObjectUrl = URL.createObjectURL(file);
    originalImageSrc = currentObjectUrl;
    processedImageSrc = null;
    lastError = null;
    colorCount = 0;
    dimensionCapShown = false;
    currentProjectId = manifest.projectId;
    currentProjectCreatedAt = manifest.createdAt;
    currentSourceAssetId = manifest.programState.activeSourceAssetId
      ?? manifest.programState.lastProcessedAssetId
      ?? manifest.primaryAssetId
      ?? null;
    currentSourceFilename = file.name;
    currentExportHistory = manifest.exportHistory.map((entry) => ({ ...entry }));

    settingsStore.setSettings(manifest.programState.processingSettings);
    settingsStore.setPostFilters(manifest.programState.postFilters);
    if (manifest.programState.exportDefaults) {
      settingsStore.setFormat(manifest.programState.exportDefaults.format);
      settingsStore.setQuality(manifest.programState.exportDefaults.quality);
    }
    settingsStore.clearUnappliedChanges();

    await transformStore.restore(
      originalImageSrc,
      manifest.programState.transformState.rotation,
      manifest.programState.transformState.cropRect,
    );
    processorService.clearImageCache();
    await persistCurrentProject();
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
    currentProjectId = null;
    currentProjectCreatedAt = null;
    currentSourceAssetId = null;
    currentSourceFilename = null;
    currentExportHistory = [];
  }

  function updateSettings(newSettings: ProcessingSettings) {
    history.push(settingsStore.settings);
    settingsStore.setSettings(newSettings);
    void persistCurrentProject();
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
    void persistCurrentProject();
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
    void persistCurrentProject();
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
    void persistCurrentProject();
    if (settingsStore.autoProcess) applyProcessingDebounced();
  }

  function redo() {
    const next = history.redo(settingsStore.settings);
    if (!next) return;
    settingsStore.setSettings(next);
    void persistCurrentProject();
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
    const result = await saveImage(
      processedImageSrc,
      { format: settingsStore.saveFormat, quality: settingsStore.saveQuality },
      canvas,
      filterStr || undefined,
    );
    if (result) {
      await recordExport(settingsStore.saveFormat, canvas);
    }
    return result;
  }

  async function share(): Promise<string | null> {
    if (!processedImageSrc) return null;
    let canvas = processorService.getLastCanvas();
    if (settingsStore.settings.crtEffect !== 'none' && canvas) {
      canvas = applyCrtEffect(canvas, settingsStore.settings.crtEffect);
    }
    const filterStr = settingsStore.postFilterCss;
    const result = await shareImage(
      processedImageSrc,
      { format: settingsStore.saveFormat, quality: settingsStore.saveQuality },
      canvas,
      filterStr || undefined,
    );
    if (result) {
      await recordExport(settingsStore.saveFormat, canvas);
    }
    return result;
  }

  async function createTransferFile(filename = 'pixel-lab-transfer'): Promise<File | null> {
    if (!processedImageSrc) return null;
    let canvas = processorService.getLastCanvas();
    if (settingsStore.settings.crtEffect !== 'none' && canvas) {
      canvas = applyCrtEffect(canvas, settingsStore.settings.crtEffect);
    }
    const filterStr = settingsStore.postFilterCss;
    return createExportFile(
      processedImageSrc,
      { format: 'png', quality: settingsStore.saveQuality, filename },
      canvas,
      filterStr || undefined,
    );
  }

  function setFormat(format: SaveFormat) {
    settingsStore.setFormat(format);
    void persistCurrentProject();
  }
  function setQuality(quality: number) {
    settingsStore.setQuality(quality);
    void persistCurrentProject();
  }

  // ─── Rotation & Crop ───
  async function rotate(degrees: 90 | -90 | 180) {
    await transformStore.rotate(originalImageSrc, degrees);
    processorService.clearImageCache();
    void persistCurrentProject();
    processImmediate();
  }

  async function setCrop(rect: CropRect | null) {
    await transformStore.setCrop(originalImageSrc, rect);
    processorService.clearImageCache();
    void persistCurrentProject();
    processImmediate();
  }

  function resetTransform() {
    transformStore.reset();
    processorService.clearImageCache();
    void persistCurrentProject();
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
    set settings(v: ProcessingSettings) {
      settingsStore.setSettings(v);
      void persistCurrentProject();
    },
    get settingsHistory() { return history.undoStack; },
    get redoHistory() { return history.redoStack; },
    get saveFormat() { return settingsStore.saveFormat; },
    get saveQuality() { return settingsStore.saveQuality; },
    get colorCount() { return colorCount; },
    get postFilters() { return settingsStore.postFilters; },
    set postFilters(v: PostProcessFilters) {
      settingsStore.setPostFilters(v);
      void persistCurrentProject();
    },
    get postFilterCss() { return settingsStore.postFilterCss; },
    get autoProcess() { return settingsStore.autoProcess; },
    set autoProcess(v: boolean) { settingsStore.setAutoProcess(v); },
    get hasUnappliedChanges() { return settingsStore.hasUnappliedChanges; },
    get processingProgress() { return processingProgress; },
    get processingStartTime() { return processingStartTime; },

    // Transform state
    get rotation() { return transformStore.rotation; },
    get cropRect() { return transformStore.cropRect; },
    get currentProjectId() { return currentProjectId; },
    get exportHistory() { return currentExportHistory; },

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
    loadPixelLabProject,
    loadNewImage,
    updateSettings,
    selectPalette,
    applyNow,
    undo,
    redo,
    jumpToHistory,
    save,
    share,
    createTransferFile,
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
