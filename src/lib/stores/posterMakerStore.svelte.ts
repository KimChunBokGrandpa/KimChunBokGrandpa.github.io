import type { CrossAppHandoffEnvelopeV1 } from '$lib/handoffs/contracts';
import { i18n } from '$lib/i18n/index.svelte';
import {
  createAssetId,
  createExportHistoryEntry,
  createProjectId,
  createProjectManifest,
  getDefaultProjectName,
  timestampNow,
  type AppId,
  type ExportHistoryEntry,
  type LocalAssetRefV1,
  type PosterMakerLayerV1,
  type PosterMakerProjectStateV1,
  type ProjectSourceContextV1,
  type RecentProjectEntryV1,
} from '$lib/projects/schema';
import { getProjectStorageAdapter } from '$lib/projects/runtime';
import type { ProjectStorageAdapter } from '$lib/projects/storageAdapter';
import {
  defaultPosterPresetId,
  defaultPosterSubtitle,
  defaultPosterTitle,
  getPosterPreset,
  isPosterPresetId,
  type PosterPresetId,
} from '$lib/poster/presets';
import {
  defaultPosterFrameStyleId,
  defaultPosterOverlayStyleId,
  defaultPosterStickerStyleId,
  isPosterFrameStyleId,
  isPosterOverlayStyleId,
  isPosterStickerStyleId,
  type PosterFrameStyleId,
  type PosterOverlayStyleId,
  type PosterStickerStyleId,
} from '$lib/poster/styles';

const maxExportHistoryEntries = 20;

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
  return defaultPosterFrameStyleId;
}

function getOverlayStyleId(layers: PosterMakerLayerV1[]): PosterOverlayStyleId {
  const layer = layers.find((entry) => entry.type === 'overlay');
  if (layer?.type === 'overlay' && isPosterOverlayStyleId(layer.overlayStyleId)) {
    return layer.overlayStyleId;
  }
  return defaultPosterOverlayStyleId;
}

function getStickerStyleId(layers: PosterMakerLayerV1[]): PosterStickerStyleId {
  const layer = layers.find((entry) => entry.type === 'sticker');
  if (layer?.type === 'sticker' && isPosterStickerStyleId(layer.stickerId)) {
    return layer.stickerId;
  }
  return defaultPosterStickerStyleId;
}

interface ImportStoredAssetOptions {
  resetProject?: boolean;
}

export function createPosterMakerStore(
  storageAdapter: ProjectStorageAdapter = getProjectStorageAdapter(),
) {
  let projectId = $state(createProjectId());
  let activePresetId = $state<PosterPresetId>(defaultPosterPresetId);
  let titleText = $state(defaultPosterTitle);
  let subtitleText = $state(defaultPosterSubtitle);
  let importedAssetId = $state<string | null>(null);
  let importedFilename = $state<string | null>(null);
  let frameStyleId = $state<PosterFrameStyleId>(defaultPosterFrameStyleId);
  let overlayStyleId = $state<PosterOverlayStyleId>(defaultPosterOverlayStyleId);
  let stickerStyleId = $state<PosterStickerStyleId>(defaultPosterStickerStyleId);
  let sourceContext = $state<ProjectSourceContextV1 | null>(null);
  let initialized = $state(false);
  let recentProjects = $state<RecentProjectEntryV1[]>([]);
  let exportHistory = $state<ExportHistoryEntry[]>([]);

  function isBlankDocument(): boolean {
    return !importedAssetId
      && activePresetId === defaultPosterPresetId
      && titleText === defaultPosterTitle
      && subtitleText === defaultPosterSubtitle
      && frameStyleId === defaultPosterFrameStyleId
      && overlayStyleId === defaultPosterOverlayStyleId
      && stickerStyleId === defaultPosterStickerStyleId;
  }

  function currentProjectName(): string {
    const trimmedTitle = titleText.trim();
    if (trimmedTitle) return trimmedTitle;
    const derivedTitle = deriveTitleFromFilename(importedFilename);
    return derivedTitle ?? getDefaultProjectName('poster-maker', i18n.locale);
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
      sourceContext: sourceContext ?? undefined,
      activeLayerId: importedAssetId ? 'image-layer' : 'title-layer',
    };
  }

  async function nextOpenedTimestamp(baselineTimestamps: Array<string | undefined> = []) {
    const latestRecentProject = (await storageAdapter.listRecentProjects({ limit: 1 }))[0];
    const candidates = [
      Date.now(),
      ...baselineTimestamps
        .filter((value): value is string => Boolean(value))
        .map((value) => Date.parse(value)),
      latestRecentProject ? Date.parse(latestRecentProject.lastOpenedAt) + 1 : Number.NaN,
    ].filter((value) => Number.isFinite(value));

    const nextValue = candidates.length > 0 ? Math.max(...candidates) : Date.now();
    return new Date(nextValue).toISOString();
  }

  async function persist() {
    const existingManifest = await storageAdapter.loadProject(projectId);
    const now = await nextOpenedTimestamp([
      existingManifest?.updatedAt,
      existingManifest?.lastOpenedAt,
    ]);
    const manifest = createProjectManifest({
      projectId,
      appId: 'poster-maker',
      locale: i18n.locale,
      name: currentProjectName(),
      sourceAssetIds: importedAssetId ? [importedAssetId] : [],
      primaryAssetId: importedAssetId ?? undefined,
      previewAssetId: importedAssetId ?? undefined,
      createdAt: existingManifest?.createdAt,
      updatedAt: now,
      lastOpenedAt: now,
      exportHistory: exportHistory.length > 0
        ? exportHistory
        : existingManifest?.exportHistory ?? [],
      programState: buildProjectState(),
    });
    projectId = manifest.projectId;
    exportHistory = manifest.exportHistory.map((entry) => ({ ...entry }));
    initialized = true;
    const saved = await storageAdapter.saveProject(manifest);
    await refreshRecentProjects();
    return saved;
  }

  function resetDocument() {
    projectId = createProjectId();
    activePresetId = defaultPosterPresetId;
    titleText = defaultPosterTitle;
    subtitleText = defaultPosterSubtitle;
    importedAssetId = null;
    importedFilename = null;
    frameStyleId = defaultPosterFrameStyleId;
    overlayStyleId = defaultPosterOverlayStyleId;
    stickerStyleId = defaultPosterStickerStyleId;
    sourceContext = null;
    exportHistory = [];
    initialized = true;
  }

  async function loadProject(projectIdToLoad: string) {
    const manifest = await storageAdapter.loadProject(projectIdToLoad);
    if (!manifest || manifest.appId !== 'poster-maker' || manifest.programState.kind !== 'poster-maker') {
      return null;
    }

    const reopenedAt = await nextOpenedTimestamp([
      manifest.updatedAt,
      manifest.lastOpenedAt,
    ]);

    const reopenedManifest = createProjectManifest({
      ...manifest,
      createdAt: manifest.createdAt,
      updatedAt: reopenedAt,
      lastOpenedAt: reopenedAt,
      exportHistory: manifest.exportHistory,
      programState: manifest.programState,
    });
    await storageAdapter.saveProject(reopenedManifest);

    const programState = reopenedManifest.programState;
    if (programState.kind !== 'poster-maker') {
      return null;
    }

    projectId = reopenedManifest.projectId;
    exportHistory = reopenedManifest.exportHistory.map((entry) => ({ ...entry }));
    activePresetId = isPosterPresetId(programState.documentPresetId)
      ? programState.documentPresetId
      : defaultPosterPresetId;
    titleText = getTextLayer(programState.layers, 'title-layer') ?? defaultPosterTitle;
    subtitleText = getTextLayer(programState.layers, 'subtitle-layer') ?? defaultPosterSubtitle;
    importedAssetId = getImportedAssetId(programState.layers);
    frameStyleId = getFrameStyleId(programState.layers);
    overlayStyleId = getOverlayStyleId(programState.layers);
    stickerStyleId = getStickerStyleId(programState.layers);
    sourceContext = programState.sourceContext ?? null;

    if (importedAssetId) {
      const resolved = await storageAdapter.resolveAsset(importedAssetId);
      importedFilename = resolved?.asset.filename ?? null;
    } else {
      importedFilename = null;
    }

    initialized = true;
    await refreshRecentProjects();
    return reopenedManifest;
  }

  async function refreshRecentProjects() {
    const nextRecentProjects = await storageAdapter.listRecentProjects({ limit: 20 });
    recentProjects = nextRecentProjects.filter((entry) => entry.appId === 'poster-maker');
    return recentProjects;
  }

  async function ensureInitialized() {
    if (initialized) return;

    const nextRecentProjects = await refreshRecentProjects();
    const recentPosterProject = nextRecentProjects[0];
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
    if (derivedTitle && (options.resetProject || isBlankDocument() || titleText === defaultPosterTitle)) {
      titleText = derivedTitle;
    }

    await persist();
  }

  async function importFile(file: File, originAppId: AppId) {
    if (originAppId === 'poster-maker') {
      sourceContext = null;
    }

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
    activePresetId = defaultPosterPresetId;
    frameStyleId = defaultPosterFrameStyleId;
    overlayStyleId = defaultPosterOverlayStyleId;
    stickerStyleId = defaultPosterStickerStyleId;
    titleText = deriveTitleFromFilename(importedFilename) ?? defaultPosterTitle;
    subtitleText = defaultPosterSubtitle;
    await persist();
  }

  async function recordExport(input: { format: ExportHistoryEntry['format']; width?: number; height?: number }) {
    exportHistory = [
      createExportHistoryEntry(input),
      ...exportHistory,
    ].slice(0, maxExportHistoryEntries);
    return persist();
  }

  async function applyHandoff(envelope: CrossAppHandoffEnvelopeV1) {
    const resolved = await storageAdapter.resolveAsset(envelope.assetId);
    if (!resolved) return false;

    await importStoredAsset(resolved.asset, {
      resetProject: envelope.openMode === 'create_project',
    });

    sourceContext = {
      sourceAppId: envelope.fromAppId,
      sourceProjectId: envelope.sourceProjectId,
      sourceLabel: envelope.sourceLabel,
      importedAt: envelope.createdAt,
    };
    await persist();
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
    get sourceContext() {
      return sourceContext;
    },
    get initialized() {
      return initialized;
    },
    get recentProjects() {
      return recentProjects;
    },
    get exportHistory() {
      return exportHistory;
    },
    isBlankDocument,
    currentProjectName,
    buildProjectState,
    persist,
    resetDocument,
    loadProject,
    refreshRecentProjects,
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
    recordExport,
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
