import type { SaveFormat } from '$lib/services/saveService';
import type { PostProcessFilters, ProcessingSettings } from '$lib/types';
import type { CropRect } from '$lib/stores/transformStore.svelte';

export const retroProjectSchemaVersion = 1 as const;

export type AppId = 'pixel-lab' | 'poster-maker' | 'retrocam';

export type AssetRole =
  | 'source'
  | 'processed'
  | 'capture'
  | 'composition-layer'
  | 'export-preview'
  | 'export-final';

export interface LocalAssetRefV1 {
  assetId: string;
  role: AssetRole;
  mimeType: string;
  storageKey: string;
  originAppId: AppId;
  createdAt: string;
  width?: number;
  height?: number;
  byteSize?: number;
  durationMs?: number;
  filename?: string;
  derivedFromAssetId?: string;
}

export interface ExportHistoryEntry {
  exportId: string;
  createdAt: string;
  format: SaveFormat | 'gif' | 'apng' | 'svg';
  assetId?: string;
  width?: number;
  height?: number;
}

export interface ProjectShellState {
  lastWindowLayoutId?: string;
  preferredWindowMode?: 'windowed' | 'maximized';
  activeUtilitySurface?: string;
}

export interface PixelLabTransformStateV1 {
  rotation: number;
  cropRect: CropRect | null;
}

export interface PixelLabProjectStateV1 {
  kind: 'pixel-lab';
  activeSourceAssetId?: string;
  lastProcessedAssetId?: string;
  processingSettings: ProcessingSettings;
  postFilters: PostProcessFilters;
  transformState: PixelLabTransformStateV1;
  selectedPresetId?: string;
  historySummary?: {
    undoDepth: number;
    redoDepth: number;
  };
  exportDefaults?: {
    format: SaveFormat;
    quality: number;
  };
}

export interface PosterMakerCanvasStateV1 {
  width: number;
  height: number;
  backgroundStyleId?: string;
}

export interface ProjectSourceContextV1 {
  sourceAppId: AppId;
  sourceProjectId?: string;
  sourceLabel?: string;
  importedAt: string;
}

export interface BasePosterLayerV1 {
  layerId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
}

export interface PosterImageLayerV1 extends BasePosterLayerV1 {
  type: 'image';
  assetId: string;
}

export interface PosterTextLayerV1 extends BasePosterLayerV1 {
  type: 'text';
  text: string;
  textStyleId: string;
}

export interface PosterFrameLayerV1 extends BasePosterLayerV1 {
  type: 'frame';
  frameStyleId: string;
}

export interface PosterOverlayLayerV1 extends BasePosterLayerV1 {
  type: 'overlay';
  overlayStyleId: string;
}

export interface PosterStickerLayerV1 extends BasePosterLayerV1 {
  type: 'sticker';
  stickerId: string;
}

export type PosterMakerLayerV1 =
  | PosterImageLayerV1
  | PosterTextLayerV1
  | PosterFrameLayerV1
  | PosterOverlayLayerV1
  | PosterStickerLayerV1;

export interface PosterMakerProjectStateV1 {
  kind: 'poster-maker';
  documentPresetId: string;
  canvas: PosterMakerCanvasStateV1;
  layers: PosterMakerLayerV1[];
  sourceContext?: ProjectSourceContextV1;
  activeLayerId?: string;
  exportDefaults?: {
    format: SaveFormat;
    quality: number;
  };
}

export interface RetroCamProjectStateV1 {
  kind: 'retrocam';
  inputMode: 'webcam' | 'image-upload' | 'screen-capture';
  fastPresetId?: string;
  lastCaptureAssetId?: string;
  captureSettings?: {
    mirrored?: boolean;
    timerSeconds?: number;
    deviceId?: string;
  };
}

export type ProgramStateV1 =
  | PixelLabProjectStateV1
  | PosterMakerProjectStateV1
  | RetroCamProjectStateV1;

export interface RetroProjectManifestV1 {
  schemaVersion: typeof retroProjectSchemaVersion;
  projectId: string;
  appId: AppId;
  name: string;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
  sourceAssetIds: string[];
  derivedAssetIds: string[];
  primaryAssetId?: string;
  previewAssetId?: string;
  tags?: string[];
  exportHistory: ExportHistoryEntry[];
  shellState?: ProjectShellState;
  programState: ProgramStateV1;
}

export interface RecentProjectEntryV1 {
  projectId: string;
  appId: AppId;
  name: string;
  lastOpenedAt: string;
  previewAssetId?: string;
}

export interface CreateProjectManifestInput {
  appId: AppId;
  name?: string;
  sourceAssetIds?: string[];
  derivedAssetIds?: string[];
  primaryAssetId?: string;
  previewAssetId?: string;
  tags?: string[];
  exportHistory?: ExportHistoryEntry[];
  shellState?: ProjectShellState;
  programState: ProgramStateV1;
  projectId?: string;
  createdAt?: string;
  updatedAt?: string;
  lastOpenedAt?: string;
}

function createId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createProjectId(): string {
  return createId('project');
}

export function createAssetId(): string {
  return createId('asset');
}

export function createExportId(): string {
  return createId('export');
}

export function timestampNow(): string {
  return new Date().toISOString();
}

export function normalizeProjectName(name: string | undefined, appId: AppId): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  switch (appId) {
    case 'pixel-lab':
      return 'Pixel Lab Project';
    case 'poster-maker':
      return 'Poster Maker Project';
    case 'retrocam':
      return 'RetroCam Capture';
  }
}

function cloneCropRect(rect: CropRect | null | undefined): CropRect | null {
  if (!rect) return null;
  return { ...rect };
}

function cloneProcessingSettings(settings: ProcessingSettings): ProcessingSettings {
  return {
    ...settings,
    glitchFilters: settings.glitchFilters.map((filter) => ({ ...filter })),
    effectLayers: settings.effectLayers?.map((layer) => ({ ...layer })) ?? [],
  };
}

function clonePostFilters(postFilters: PostProcessFilters): PostProcessFilters {
  return { ...postFilters };
}

function clonePixelLabState(state: PixelLabProjectStateV1): PixelLabProjectStateV1 {
  return {
    ...state,
    processingSettings: cloneProcessingSettings(state.processingSettings),
    postFilters: clonePostFilters(state.postFilters),
    transformState: {
      rotation: state.transformState.rotation,
      cropRect: cloneCropRect(state.transformState.cropRect),
    },
    historySummary: state.historySummary ? { ...state.historySummary } : undefined,
    exportDefaults: state.exportDefaults ? { ...state.exportDefaults } : undefined,
  };
}

function clonePosterLayer(layer: PosterMakerLayerV1): PosterMakerLayerV1 {
  return { ...layer };
}

function clonePosterMakerState(state: PosterMakerProjectStateV1): PosterMakerProjectStateV1 {
  return {
    ...state,
    canvas: { ...state.canvas },
    layers: state.layers.map(clonePosterLayer),
    sourceContext: state.sourceContext ? { ...state.sourceContext } : undefined,
    exportDefaults: state.exportDefaults ? { ...state.exportDefaults } : undefined,
  };
}

function cloneRetroCamState(state: RetroCamProjectStateV1): RetroCamProjectStateV1 {
  return {
    ...state,
    captureSettings: state.captureSettings ? { ...state.captureSettings } : undefined,
  };
}

export function cloneProgramState(programState: ProgramStateV1): ProgramStateV1 {
  switch (programState.kind) {
    case 'pixel-lab':
      return clonePixelLabState(programState);
    case 'poster-maker':
      return clonePosterMakerState(programState);
    case 'retrocam':
      return cloneRetroCamState(programState);
  }
}

export function cloneExportHistoryEntry(entry: ExportHistoryEntry): ExportHistoryEntry {
  return { ...entry };
}

export function cloneAssetRef(asset: LocalAssetRefV1): LocalAssetRefV1 {
  return { ...asset };
}

export function cloneProjectManifest(manifest: RetroProjectManifestV1): RetroProjectManifestV1 {
  return {
    ...manifest,
    sourceAssetIds: [...manifest.sourceAssetIds],
    derivedAssetIds: [...manifest.derivedAssetIds],
    tags: manifest.tags ? [...manifest.tags] : undefined,
    exportHistory: manifest.exportHistory.map(cloneExportHistoryEntry),
    shellState: manifest.shellState ? { ...manifest.shellState } : undefined,
    programState: cloneProgramState(manifest.programState),
  };
}

export function createProjectManifest(input: CreateProjectManifestInput): RetroProjectManifestV1 {
  const createdAt = input.createdAt ?? timestampNow();
  const updatedAt = input.updatedAt ?? createdAt;
  const lastOpenedAt = input.lastOpenedAt ?? updatedAt;

  return {
    schemaVersion: retroProjectSchemaVersion,
    projectId: input.projectId ?? createProjectId(),
    appId: input.appId,
    name: normalizeProjectName(input.name, input.appId),
    createdAt,
    updatedAt,
    lastOpenedAt,
    sourceAssetIds: [...(input.sourceAssetIds ?? [])],
    derivedAssetIds: [...(input.derivedAssetIds ?? [])],
    primaryAssetId: input.primaryAssetId,
    previewAssetId: input.previewAssetId,
    tags: input.tags ? [...input.tags] : undefined,
    exportHistory: (input.exportHistory ?? []).map(cloneExportHistoryEntry),
    shellState: input.shellState ? { ...input.shellState } : undefined,
    programState: cloneProgramState(input.programState),
  };
}

export function createRecentProjectEntry(manifest: RetroProjectManifestV1): RecentProjectEntryV1 {
  return {
    projectId: manifest.projectId,
    appId: manifest.appId,
    name: manifest.name,
    lastOpenedAt: manifest.lastOpenedAt,
    previewAssetId: manifest.previewAssetId,
  };
}
