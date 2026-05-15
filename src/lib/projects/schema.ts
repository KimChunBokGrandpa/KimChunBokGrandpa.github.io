import type { SaveFormat } from '$lib/services/saveService';
import type { PostProcessFilters, ProcessingSettings } from '$lib/types';
import type { CropRect } from '$lib/stores/transformStore.svelte';

export const retroProjectSchemaVersion = 1 as const;

export type AppId = 'pixel-lab' | 'retrocam';
export type ProjectNameLocale = 'en' | 'ko' | 'ja';

export type AssetRole =
  | 'source'
  | 'processed'
  | 'capture'
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
  locale?: ProjectNameLocale;
  sourceAssetIds?: string[];
  derivedAssetIds?: string[];
  primaryAssetId?: string;
  previewAssetId?: string;
  tags?: string[];
  exportHistory?: ExportHistoryEntry[];
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

export function getDefaultProjectName(appId: AppId, locale: ProjectNameLocale = 'en'): string {
  switch (appId) {
    case 'pixel-lab':
      return 'Pixel Lab Project';
    case 'retrocam':
      return 'RetroCam Capture';
  }
}

export function normalizeProjectName(
  name: string | undefined,
  appId: AppId,
  locale: ProjectNameLocale = 'en',
): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  return getDefaultProjectName(appId, locale);
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
    case 'retrocam':
      return cloneRetroCamState(programState);
  }
}

export function cloneExportHistoryEntry(entry: ExportHistoryEntry): ExportHistoryEntry {
  return { ...entry };
}

export function createExportHistoryEntry(
  input: Omit<ExportHistoryEntry, 'exportId' | 'createdAt'> & {
    exportId?: string;
    createdAt?: string;
  },
): ExportHistoryEntry {
  return {
    ...input,
    exportId: input.exportId ?? createExportId(),
    createdAt: input.createdAt ?? timestampNow(),
  };
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
    name: normalizeProjectName(input.name, input.appId, input.locale),
    createdAt,
    updatedAt,
    lastOpenedAt,
    sourceAssetIds: [...(input.sourceAssetIds ?? [])],
    derivedAssetIds: [...(input.derivedAssetIds ?? [])],
    primaryAssetId: input.primaryAssetId,
    previewAssetId: input.previewAssetId,
    tags: input.tags ? [...input.tags] : undefined,
    exportHistory: (input.exportHistory ?? []).map(cloneExportHistoryEntry),
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
