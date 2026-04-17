import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ProcessingSettings } from '$lib/types';
import { createProjectManifest } from '$lib/projects/schema';
import { createInMemoryProjectStorageAdapter } from '$lib/projects/storageAdapter';

// ─── Mocks ───

const mockProcessorService = {
  processImage: vi.fn().mockResolvedValue('blob:processed'),
  getLastColorCount: vi.fn().mockReturnValue(16),
  getLastCanvas: vi.fn().mockReturnValue(null),
  clearImageCache: vi.fn(),
  evictFromImageCache: vi.fn(),
  destroy: vi.fn(),
};

vi.mock('$lib/services/imageProcessor', () => ({
  processorService: mockProcessorService,
}));

vi.mock('$lib/services/saveService', () => ({
  createExportFile: vi.fn().mockResolvedValue(new File(['transfer'], 'pixel-lab-transfer.png', { type: 'image/png' })),
  saveImage: vi.fn().mockResolvedValue('saved-file.png'),
  shareImage: vi.fn().mockResolvedValue('shared-file.png'),
}));

vi.mock('$lib/utils/crtRenderer', () => ({
  applyCrtEffect: vi.fn((canvas: unknown) => canvas),
}));

const mockGifManager = {
  isGif: false,
  gifInfo: null,
  gifCurrentFrame: 0,
  gifPlaying: false,
  gifProcessingProgress: 0,
  gifIsExporting: false,
  gifFrameCount: 0,
  cleanup: vi.fn(),
  loadGifFile: vi.fn(),
  play: vi.fn(),
  pause: vi.fn(),
  seek: vi.fn(),
  showFrame: vi.fn(),
  stopPlayback: vi.fn(),
  exportGif: vi.fn(),
  cancelExport: vi.fn(),
};

vi.mock('$lib/stores/gifPlaybackManager.svelte', () => ({
  createGifPlaybackManager: vi.fn(() => mockGifManager),
}));

// Mock URL.createObjectURL / revokeObjectURL
let objectUrlCounter = 0;
globalThis.URL.createObjectURL = vi.fn(() => `blob:mock-${++objectUrlCounter}`);
globalThis.URL.revokeObjectURL = vi.fn();

const { createImageProcessingStore } = await import('./imageProcessingStore.svelte');
const { saveImage, shareImage, createExportFile } = await import('$lib/services/saveService');
const { applyCrtEffect } = await import('$lib/utils/crtRenderer');

function makeSettings(overrides?: Partial<ProcessingSettings>): ProcessingSettings {
  return {
    pixelSize: 1,
    palette: 'original',
    crtEffect: 'none',
    glitchFilters: [],
    renderMode: 'pixel_perfect',
    glitchSeed: null,
    ditherType: 'none',
    effectLayers: [],
    ...overrides,
  };
}

describe('createImageProcessingStore', () => {
  let store: ReturnType<typeof createImageProcessingStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    objectUrlCounter = 0;
    store = createImageProcessingStore();
  });

  afterEach(() => {
    store.destroy();
  });

  // ─── Initial State ───

  describe('initial state', () => {
    it('starts with null image sources', () => {
      expect(store.originalImageSrc).toBeNull();
      expect(store.processedImageSrc).toBeNull();
    });

    it('starts with default settings', () => {
      expect(store.settings.pixelSize).toBe(1);
      expect(store.settings.palette).toBe('original');
      expect(store.settings.crtEffect).toBe('none');
      expect(store.settings.renderMode).toBe('pixel_perfect');
      expect(store.settings.ditherType).toBe('none');
    });

    it('starts with no errors', () => {
      expect(store.lastError).toBeNull();
      expect(store.isProcessing).toBe(false);
    });

    it('has empty history', () => {
      expect(store.settingsHistory).toHaveLength(0);
      expect(store.redoHistory).toHaveLength(0);
    });

    it('has default save format and quality', () => {
      expect(store.saveFormat).toBe('png');
      expect(store.saveQuality).toBe(0.92);
    });

    it('has default post filters', () => {
      expect(store.postFilters.brightness).toBe(100);
      expect(store.postFilters.contrast).toBe(100);
      expect(store.postFilters.saturation).toBe(100);
      expect(store.postFilters.hueRotate).toBe(0);
    });

    it('autoProcess is true by default', () => {
      expect(store.autoProcess).toBe(true);
    });

    it('has no unapplied changes', () => {
      expect(store.hasUnappliedChanges).toBe(false);
    });

    it('has no transform state', () => {
      expect(store.rotation).toBe(0);
      expect(store.cropRect).toBeNull();
    });
  });

  // ─── Settings Update & History ───

  describe('updateSettings', () => {
    it('updates settings and pushes to history', () => {
      const newSettings = makeSettings({ pixelSize: 4 });
      store.updateSettings(newSettings);

      expect(store.settings.pixelSize).toBe(4);
      expect(store.settingsHistory).toHaveLength(1);
    });

    it('clears redo history on new update', () => {
      // Create some history for undo
      store.updateSettings(makeSettings({ pixelSize: 2 }));
      store.updateSettings(makeSettings({ pixelSize: 4 }));
      store.undo();
      expect(store.redoHistory.length).toBeGreaterThan(0);

      // New update should clear redo
      store.updateSettings(makeSettings({ pixelSize: 8 }));
      expect(store.redoHistory).toHaveLength(0);
    });

    it('marks hasUnappliedChanges when autoProcess is off', () => {
      store.autoProcess = false;
      store.updateSettings(makeSettings({ pixelSize: 4 }));
      expect(store.hasUnappliedChanges).toBe(true);
    });
  });

  describe('selectPalette', () => {
    it('normalizes legacy palette ids, changes palette, and pushes history', () => {
      store.selectPalette('gameboy');
      expect(store.settings.palette).toBe('dmg');
      expect(store.settingsHistory).toHaveLength(1);
    });

    it('marks hasUnappliedChanges when autoProcess is off', () => {
      store.autoProcess = false;
      store.selectPalette('gameboy');
      expect(store.hasUnappliedChanges).toBe(true);
    });
  });

  // ─── Undo / Redo ───

  describe('undo/redo', () => {
    it('undo restores previous settings', () => {
      store.updateSettings(makeSettings({ pixelSize: 4 }));
      store.updateSettings(makeSettings({ pixelSize: 8 }));

      expect(store.settings.pixelSize).toBe(8);
      store.undo();
      expect(store.settings.pixelSize).toBe(4);
    });

    it('redo restores undone settings', () => {
      store.updateSettings(makeSettings({ pixelSize: 4 }));
      store.updateSettings(makeSettings({ pixelSize: 8 }));

      store.undo();
      expect(store.settings.pixelSize).toBe(4);
      store.redo();
      expect(store.settings.pixelSize).toBe(8);
    });

    it('undo does nothing when history is empty', () => {
      const before = { ...store.settings };
      store.undo();
      expect(store.settings.pixelSize).toBe(before.pixelSize);
    });

    it('redo does nothing when redo history is empty', () => {
      store.updateSettings(makeSettings({ pixelSize: 4 }));
      const before = { ...store.settings };
      store.redo();
      expect(store.settings.pixelSize).toBe(before.pixelSize);
    });

    it('history is capped at MAX_HISTORY (20)', () => {
      for (let i = 1; i <= 25; i++) {
        store.updateSettings(makeSettings({ pixelSize: i }));
      }
      expect(store.settingsHistory.length).toBeLessThanOrEqual(20);
    });
  });

  describe('jumpToHistory', () => {
    it('jumps back multiple steps in undo history', () => {
      store.updateSettings(makeSettings({ pixelSize: 2 }));
      store.updateSettings(makeSettings({ pixelSize: 4 }));
      store.updateSettings(makeSettings({ pixelSize: 8 }));

      // Jump to index 0 (first saved state = original defaults)
      store.jumpToHistory(0);
      // After jumping to index 0, the current settings should be the original defaults
      expect(store.settings.pixelSize).toBe(1);
    });
  });

  // ─── Save Format / Quality ───

  describe('setFormat / setQuality', () => {
    it('updates save format', () => {
      store.setFormat('jpeg');
      expect(store.saveFormat).toBe('jpeg');
    });

    it('updates save quality', () => {
      store.setQuality(0.8);
      expect(store.saveQuality).toBe(0.8);
    });
  });

  describe('save/share/transfer flow', () => {
    async function loadProcessedImage() {
      store.loadImage(new File(['pixels'], 'sample.png', { type: 'image/png' }));
      await Promise.resolve();
      await Promise.resolve();
      expect(store.processedImageSrc).toBe('blob:processed');
    }

    it('save delegates to saveImage with active export options', async () => {
      await loadProcessedImage();
      store.setFormat('webp');
      store.setQuality(0.77);
      store.postFilters = { brightness: 120, contrast: 90, saturation: 110, hueRotate: 15 };

      const result = await store.save();

      expect(result).toBe('saved-file.png');
      expect(saveImage).toHaveBeenCalledWith(
        'blob:processed',
        { format: 'webp', quality: 0.77 },
        null,
        'brightness(120%) contrast(90%) saturate(110%) hue-rotate(15deg)',
      );
    });

    it('share delegates to shareImage and applies CRT canvas when enabled', async () => {
      const canvas = {} as HTMLCanvasElement;
      mockProcessorService.getLastCanvas.mockReturnValue(canvas);
      (applyCrtEffect as ReturnType<typeof vi.fn>).mockReturnValue(canvas);

      await loadProcessedImage();
      store.settings = makeSettings({ crtEffect: 'horizontal' });

      const result = await store.share();

      expect(result).toBe('shared-file.png');
      expect(applyCrtEffect).toHaveBeenCalledWith(canvas, 'horizontal');
      expect(shareImage).toHaveBeenCalledWith(
        'blob:processed',
        { format: 'png', quality: 0.92 },
        canvas,
        undefined,
      );
    });

    it('createTransferFile builds png export file for handoff', async () => {
      mockProcessorService.getLastCanvas.mockReturnValue(null);
      await loadProcessedImage();
      store.setQuality(0.81);

      const file = await store.createTransferFile('poster-input');

      expect(file?.name).toBe('pixel-lab-transfer.png');
      expect(createExportFile).toHaveBeenCalledWith(
        'blob:processed',
        { format: 'png', quality: 0.81, filename: 'poster-input' },
        null,
        undefined,
      );
    });
  });

  describe('loadPixelLabProject', () => {
    it('restores pixel lab settings, post filters, and export defaults from a project manifest', async () => {
      const manifest = createProjectManifest({
        appId: 'pixel-lab',
        name: 'Reopen Session',
        programState: {
          kind: 'pixel-lab',
          activeSourceAssetId: 'asset-source-1',
          lastProcessedAssetId: 'asset-source-1',
          processingSettings: makeSettings({
            pixelSize: 4,
            palette: 'dmg',
            renderMode: 'bilinear',
          }),
          postFilters: {
            brightness: 120,
            contrast: 90,
            saturation: 80,
            hueRotate: 12,
          },
          transformState: {
            rotation: 0,
            cropRect: null,
          },
          exportDefaults: {
            format: 'jpeg',
            quality: 0.77,
          },
        },
      });

      await store.loadPixelLabProject(
        manifest,
        new File(['pixels'], 'reopen-source.png', { type: 'image/png' }),
      );

      await Promise.resolve();
      await Promise.resolve();

      expect(store.originalImageSrc).toMatch(/^blob:mock-/);
      expect(store.settings.pixelSize).toBe(4);
      expect(store.settings.palette).toBe('dmg');
      expect(store.settings.renderMode).toBe('bilinear');
      expect(store.postFilters.brightness).toBe(120);
      expect(store.postFilters.hueRotate).toBe(12);
      expect(store.saveFormat).toBe('jpeg');
      expect(store.saveQuality).toBe(0.77);
      expect(mockProcessorService.processImage).toHaveBeenCalled();
    });
  });

  describe('pixel lab project persistence', () => {
    it('creates a recent pixel lab project when a new image is loaded', async () => {
      const adapter = createInMemoryProjectStorageAdapter();
      const projectBackedStore = createImageProcessingStore(adapter);

      projectBackedStore.loadImage(new File(['pixels'], 'session.png', { type: 'image/png' }));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      const recentProjects = await adapter.listRecentProjects();
      expect(recentProjects[0]?.appId).toBe('pixel-lab');
      expect(recentProjects[0]?.name).toBe('session');
      expect(projectBackedStore.currentProjectId).toBeTruthy();

      projectBackedStore.destroy();
    });

    it('updates the persisted pixel lab project when export and filter state changes', async () => {
      const adapter = createInMemoryProjectStorageAdapter();
      const projectBackedStore = createImageProcessingStore(adapter);

      projectBackedStore.loadImage(new File(['pixels'], 'session.png', { type: 'image/png' }));
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      projectBackedStore.setFormat('webp');
      projectBackedStore.setQuality(0.73);
      projectBackedStore.postFilters = {
        brightness: 115,
        contrast: 92,
        saturation: 108,
        hueRotate: 18,
      };
      await Promise.resolve();
      await Promise.resolve();

      const projectId = projectBackedStore.currentProjectId;
      expect(projectId).toBeTruthy();

      const manifest = await adapter.loadProject(projectId!);
      expect(manifest?.programState.kind).toBe('pixel-lab');
      if (manifest?.programState.kind !== 'pixel-lab') {
        throw new Error('Expected pixel-lab manifest');
      }

      expect(manifest.programState.exportDefaults).toEqual({
        format: 'webp',
        quality: 0.73,
      });
      expect(manifest.programState.postFilters).toEqual({
        brightness: 115,
        contrast: 92,
        saturation: 108,
        hueRotate: 18,
      });

      projectBackedStore.destroy();
    });
  });

  // ─── Post Filters CSS ───

  describe('postFilterCss', () => {
    it('returns empty string for default filters', () => {
      expect(store.postFilterCss).toBe('');
    });

    it('generates brightness filter', () => {
      store.postFilters = { brightness: 120, contrast: 100, saturation: 100, hueRotate: 0 };
      expect(store.postFilterCss).toContain('brightness(120%)');
    });

    it('generates multiple filters', () => {
      store.postFilters = { brightness: 120, contrast: 80, saturation: 150, hueRotate: 45 };
      const css = store.postFilterCss;
      expect(css).toContain('brightness(120%)');
      expect(css).toContain('contrast(80%)');
      expect(css).toContain('saturate(150%)');
      expect(css).toContain('hue-rotate(45deg)');
    });
  });

  // ─── Auto Process Toggle ───

  describe('autoProcess', () => {
    it('can be toggled off and on', () => {
      store.autoProcess = false;
      expect(store.autoProcess).toBe(false);
      store.autoProcess = true;
      expect(store.autoProcess).toBe(true);
    });
  });

  // ─── Clear Error ───

  describe('clearError', () => {
    it('clears the last error', () => {
      // We can't easily set lastError directly, but clearError should be safe to call
      store.clearError();
      expect(store.lastError).toBeNull();
    });
  });

  // ─── loadNewImage ───

  describe('loadNewImage', () => {
    it('resets image state', () => {
      // Simulate loaded state by loading an image
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      store.loadImage(file);

      store.loadNewImage();
      expect(store.originalImageSrc).toBeNull();
      expect(store.processedImageSrc).toBeNull();
    });

    it('calls gif cleanup', () => {
      store.loadNewImage();
      expect(mockGifManager.cleanup).toHaveBeenCalled();
    });
  });

  // ─── GIF Delegation ───

  describe('GIF state delegation', () => {
    it('delegates isGif from gif manager', () => {
      expect(store.isGif).toBe(false);
    });

    it('delegates gifFrameCount from gif manager', () => {
      expect(store.gifFrameCount).toBe(0);
    });
  });

  // ─── Destroy ───

  describe('destroy', () => {
    it('calls processorService.destroy', () => {
      store.destroy();
      expect(mockProcessorService.destroy).toHaveBeenCalled();
    });

    it('calls gif cleanup', () => {
      store.destroy();
      expect(mockGifManager.cleanup).toHaveBeenCalled();
    });
  });
});
