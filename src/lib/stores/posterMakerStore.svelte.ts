import type { CrossAppHandoffEnvelopeV1 } from '$lib/handoffs/contracts';
import {
  createAssetId,
  createProjectId,
  createProjectManifest,
  timestampNow,
  type AppId,
  type LocalAssetRefV1,
  type PosterMakerLayerV1,
  type PosterMakerProjectStateV1,
} from '$lib/projects/schema';
import { getProjectStorageAdapter } from '$lib/projects/runtime';
import type { ProjectStorageAdapter } from '$lib/projects/storageAdapter';
import {
  DEFAULT_POSTER_PRESET_ID,
  DEFAULT_POSTER_SUBTITLE,
  DEFAULT_POSTER_TITLE,
  getPosterPreset,
  isPosterPresetId,
  type PosterPresetId,
} from '$lib/poster/presets';
import {
  DEFAULT_POSTER_FRAME_STYLE_ID,
  DEFAULT_POSTER_OVERLAY_STYLE_ID,
  DEFAULT_POSTER_STICKER_STYLE_ID,
  isPosterFrameStyleId,
  isPosterOverlayStyleId,
  isPosterStickerStyleId,
  type PosterFrameStyleId,
  type PosterOverlayStyleId,
  type PosterStickerStyleId,
} from '$lib/poster/styles';

function deriveTitleFromFilename(filename: string | null | undefined): string | null {
  const trimmed = filename?.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\.[^.]+$/, '').toUpperCase();
}

function getTextLayer(layers: PosterMakerLayerV1[], layerId: string): string | null {
  const layer = layers.find((entry) => entry.type === 'text' && entry.layerId === layerId);
  return layer?.type === 'text' ? layer.text : null;
}

function getImportedAssetId(layers: PosterMakerLayerV1[]): string | null {
  const layer = layers.find((entry) => entry.type === 'image');
  return layer?.type === 'image' ? layer.assetId : null;
}

function getFrameStyleId(layers: PosterMakerLayerV1[]): PosterFrameStyleId {
  const layer = layers.find((entry) => entry.type === 'frame');
  if (layer?.type === 'frame' && isPosterFrameStyleId(layer.frameStyleId)) {
    return layer.frameStyleId;
  }
  return DEFAULT_POSTER_FRAME_STYLE_ID;
}

function getOverlayStyleId(layers: PosterMakerLayerV1[]): PosterOverlayStyleId {
  const layer = layers.find((entry) => entry.type === 'overlay');
  if (layer?.type === 'overlay' && isPosterOverlayStyleId(layer.overlayStyleId)) {
    return layer.overlayStyleId;
  }
  return DEFAULT_POSTER_OVERLAY_STYLE_ID;
}

function getStickerStyleId(layers: PosterMakerLayerV1[]): PosterStickerStyleId {
  const layer = layers.find((entry) => entry.type === 'sticker');
  if (layer?.type === 'sticker' && isPosterStickerStyleId(layer.stickerId)) {
    return layer.stickerId;
  }
  return DEFAULT_POSTER_STICKER_STYLE_ID;
}

interface ImportStoredAssetOptions {
  resetProject?: boolean;
}

export function createPosterMakerStore(
  storageAdapter: ProjectStorageAdapter = getProjectStorageAdapter(),
) {
  let projectId = $state(createProjectId());
  let activePresetId = $state<PosterPresetId>(DEFAULT_POSTER_PRESET_ID);
  let titleText = $state(DEFAULT_POSTER_TITLE);
  let subtitleText = $state(DEFAULT_POSTER_SUBTITLE);
  let importedAssetId = $state<string | null>(null);
  let importedFilename = $state<string | null>(null);
  let frameStyleId = $state<PosterFrameStyleId>(DEFAULT_POSTER_FRAME_STYLE_ID);
  let overlayStyleId = $state<PosterOverlayStyleId>(DEFAULT_POSTER_OVERLAY_STYLE_ID);
  let stickerStyleId = $state<PosterStickerStyleId>(DEFAULT_POSTER_STICKER_STYLE_ID);
  let initialized = $state(false);

  function isBlankDocument(): boolean {
    return !importedAssetId
      && activePresetId === DEFAULT_POSTER_PRESET_ID
      && titleText === DEFAULT_POSTER_TITLE
      && subtitleText === DEFAULT_POSTER_SUBTITLE
      && frameStyleId === DEFAULT_POSTER_FRAME_STYLE_ID
      && overlayStyleId === DEFAULT_POSTER_OVERLAY_STYLE_ID
      && stickerStyleId === DEFAULT_POSTER_STICKER_STYLE_ID;
  }

  function currentProjectName(): string {
    const trimmedTitle = titleText.trim();
    if (trimmedTitle) return trimmedTitle;
    const derivedTitle = deriveTitleFromFilename(importedFilename);
    return derivedTitle ?? 'Poster Maker Project';
  }

  function buildProjectState(): PosterMakerProjectStateV1 {
    const preset = getPosterPreset(activePresetId);
    const layers: PosterMakerProjectStateV1['layers'] = [
      {
        layerId: 'title-layer',
        type: 'text',
        x: 48,
        y: preset.height - 180,
        width: preset.width - 96,
        height: 56,
        text: titleText,
        textStyleId: 'poster-title',
      },
      {
        layerId: 'subtitle-layer',
        type: 'text',
        x: 48,
        y: preset.height - 112,
        width: preset.width - 96,
        height: 40,
        text: subtitleText,
        textStyleId: 'poster-subtitle',
      },
    ];

    if (importedAssetId) {
      layers.unshift({
        layerId: 'image-layer',
        type: 'image',
        assetId: importedAssetId,
        x: 48,
        y: 48,
        width: preset.width - 96,
        height: preset.height - 280,
      });
    }

    if (overlayStyleId !== 'none') {
      layers.push({
        layerId: 'overlay-layer',
        type: 'overlay',
        overlayStyleId,
        x: 36,
        y: 36,
        width: preset.width - 72,
        height: preset.height - 72,
      });
    }

    if (frameStyleId !== 'none') {
      layers.push({
        layerId: 'frame-layer',
        type: 'frame',
        frameStyleId,
        x: 18,
        y: 18,
        width: preset.width - 36,
        height: preset.height - 36,
      });
    }

    if (stickerStyleId !== 'none') {
      layers.push({
        layerId: 'sticker-layer',
        type: 'sticker',
        stickerId: stickerStyleId,
        x: preset.width - 196,
        y: 36,
        width: 148,
        height: 78,
      });
    }

    return {
      kind: 'poster-maker',
      documentPresetId: activePresetId,
      canvas: {
        width: preset.width,
        height: preset.height,
        backgroundStyleId: activePresetId,
      },
      layers,
      activeLayerId: importedAssetId ? 'image-layer' : 'title-layer',
      exportDefaults: {
        format: 'png',
        quality: 0.92,
      },
    };
  }

  async function persist() {
    const existingManifest = await storageAdapter.loadProject(projectId);
    const now = timestampNow();
    const manifest = createProjectManifest({
      projectId,
      appId: 'poster-maker',
      name: currentProjectName(),
      sourceAssetIds: importedAssetId ? [importedAssetId] : [],
      primaryAssetId: importedAssetId ?? undefined,
      previewAssetId: importedAssetId ?? undefined,
      createdAt: existingManifest?.createdAt,
      updatedAt: now,
      lastOpenedAt: now,
      exportHistory: existingManifest?.exportHistory ?? [],
      shellState: existingManifest?.shellState,
      programState: buildProjectState(),
    });
    projectId = manifest.projectId;
    initialized = true;
    return storageAdapter.saveProject(manifest);
  }

  function resetDocument() {
    projectId = createProjectId();
    activePresetId = DEFAULT_POSTER_PRESET_ID;
    titleText = DEFAULT_POSTER_TITLE;
    subtitleText = DEFAULT_POSTER_SUBTITLE;
    importedAssetId = null;
    importedFilename = null;
    frameStyleId = DEFAULT_POSTER_FRAME_STYLE_ID;
    overlayStyleId = DEFAULT_POSTER_OVERLAY_STYLE_ID;
    stickerStyleId = DEFAULT_POSTER_STICKER_STYLE_ID;
    initialized = true;
  }

  async function loadProject(projectIdToLoad: string) {
    const manifest = await storageAdapter.loadProject(projectIdToLoad);
    if (!manifest || manifest.appId !== 'poster-maker' || manifest.programState.kind !== 'poster-maker') {
      return null;
    }

    projectId = manifest.projectId;
    activePresetId = isPosterPresetId(manifest.programState.documentPresetId)
      ? manifest.programState.documentPresetId
      : DEFAULT_POSTER_PRESET_ID;
    titleText = getTextLayer(manifest.programState.layers, 'title-layer') ?? DEFAULT_POSTER_TITLE;
    subtitleText = getTextLayer(manifest.programState.layers, 'subtitle-layer') ?? DEFAULT_POSTER_SUBTITLE;
    importedAssetId = getImportedAssetId(manifest.programState.layers);
    frameStyleId = getFrameStyleId(manifest.programState.layers);
    overlayStyleId = getOverlayStyleId(manifest.programState.layers);
    stickerStyleId = getStickerStyleId(manifest.programState.layers);

    if (importedAssetId) {
      const resolved = await storageAdapter.resolveAsset(importedAssetId);
      importedFilename = resolved?.asset.filename ?? null;
    } else {
      importedFilename = null;
    }

    initialized = true;
    return manifest;
  }

  async function ensureInitialized() {
    if (initialized) return;

    const recentProjects = await storageAdapter.listRecentProjects({ limit: 20 });
    const recentPosterProject = recentProjects.find((entry) => entry.appId === 'poster-maker');
    if (recentPosterProject) {
      const loaded = await loadProject(recentPosterProject.projectId);
      if (loaded) return loaded;
    }

    return persist();
  }

  async function setPreset(nextPresetId: PosterPresetId) {
    activePresetId = nextPresetId;
    await persist();
  }

  async function setTitle(nextTitle: string) {
    titleText = nextTitle;
    await persist();
  }

  async function setSubtitle(nextSubtitle: string) {
    subtitleText = nextSubtitle;
    await persist();
  }

  async function setFrameStyle(nextFrameStyleId: PosterFrameStyleId) {
    frameStyleId = nextFrameStyleId;
    await persist();
  }

  async function setOverlayStyle(nextOverlayStyleId: PosterOverlayStyleId) {
    overlayStyleId = nextOverlayStyleId;
    await persist();
  }

  async function setStickerStyle(nextStickerStyleId: PosterStickerStyleId) {
    stickerStyleId = nextStickerStyleId;
    await persist();
  }

  async function importStoredAsset(
    asset: LocalAssetRefV1,
    options: ImportStoredAssetOptions = {},
  ) {
    if (options.resetProject) {
      resetDocument();
    }

    importedAssetId = asset.assetId;
    importedFilename = asset.filename ?? null;

    const derivedTitle = deriveTitleFromFilename(asset.filename);
    if (derivedTitle && (options.resetProject || isBlankDocument() || titleText === DEFAULT_POSTER_TITLE)) {
      titleText = derivedTitle;
    }

    await persist();
  }

  async function importFile(file: File, originAppId: AppId) {
    const assetId = createAssetId();
    const asset: LocalAssetRefV1 = {
      assetId,
      role: 'composition-layer',
      mimeType: file.type || 'image/png',
      storageKey: `poster-assets/${assetId}-${file.name}`,
      originAppId,
      createdAt: timestampNow(),
      filename: file.name,
      byteSize: file.size,
    };

    await storageAdapter.saveAsset({ asset, blob: file });
    await importStoredAsset(asset);
    return asset;
  }

  async function clearImportedImage() {
    importedAssetId = null;
    importedFilename = null;
    await persist();
  }

  async function createNewDocument() {
    resetDocument();
    await persist();
  }

  async function resetCurrentDocument() {
    activePresetId = DEFAULT_POSTER_PRESET_ID;
    frameStyleId = DEFAULT_POSTER_FRAME_STYLE_ID;
    overlayStyleId = DEFAULT_POSTER_OVERLAY_STYLE_ID;
    stickerStyleId = DEFAULT_POSTER_STICKER_STYLE_ID;
    titleText = deriveTitleFromFilename(importedFilename) ?? DEFAULT_POSTER_TITLE;
    subtitleText = DEFAULT_POSTER_SUBTITLE;
    await persist();
  }

  async function applyHandoff(envelope: CrossAppHandoffEnvelopeV1) {
    const resolved = await storageAdapter.resolveAsset(envelope.assetId);
    if (!resolved) return false;

    await importStoredAsset(resolved.asset, {
      resetProject: envelope.openMode === 'create_project',
    });
    return true;
  }

  return {
    get projectId() {
      return projectId;
    },
    get activePresetId() {
      return activePresetId;
    },
    get titleText() {
      return titleText;
    },
    get subtitleText() {
      return subtitleText;
    },
    get importedAssetId() {
      return importedAssetId;
    },
    get importedFilename() {
      return importedFilename;
    },
    get frameStyleId() {
      return frameStyleId;
    },
    get overlayStyleId() {
      return overlayStyleId;
    },
    get stickerStyleId() {
      return stickerStyleId;
    },
    get initialized() {
      return initialized;
    },
    isBlankDocument,
    currentProjectName,
    buildProjectState,
    persist,
    resetDocument,
    loadProject,
    ensureInitialized,
    setPreset,
    setTitle,
    setSubtitle,
    setFrameStyle,
    setOverlayStyle,
    setStickerStyle,
    importStoredAsset,
    importFile,
    clearImportedImage,
    createNewDocument,
    resetCurrentDocument,
    applyHandoff,
  };
}

export let posterMakerStore = createPosterMakerStore();

export function resetPosterMakerStore(
  storageAdapter: ProjectStorageAdapter = getProjectStorageAdapter(),
) {
  posterMakerStore = createPosterMakerStore(storageAdapter);
  return posterMakerStore;
}
