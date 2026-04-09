# Project Schema Specification

---

## Purpose

Define the local-only project model that allows multiple programs to share assets, restore work, and exchange state without introducing any server dependency.

This is the canonical contract for:

- project metadata
- asset references
- per-program state payloads
- persistence boundaries
- recent-project behavior

---

## Scope

This spec covers:

- local project manifests
- local asset references
- program-specific state containers
- shared export history summaries

This spec does not require:

- remote sync
- accounts
- collaboration
- cloud storage

---

## Core Principles

- all canonical project state remains local
- project payloads must be versioned
- structured project metadata must be JSON-serializable
- binary assets must not depend on transient object URLs alone
- `localStorage` may cache lightweight indexes, but should not be the canonical store for full project payloads

---

## Canonical Terms

### Project

A restorable local work unit owned by one primary app.

### Asset

A locally stored binary or derived resource referenced by one or more projects.

### Program State

The app-specific editing state attached to a project.

### Recent Project Entry

A lightweight record used by the shell to show recently opened work.

---

## Project Manifest

### Top-Level Shape

```ts
type AppId = 'pixel-lab' | 'poster-maker' | 'retrocam';

interface RetroProjectManifestV1 {
  schemaVersion: 1;
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
```

### Field Rules

| Field | Rule |
|---|---|
| `schemaVersion` | must increment for breaking persistence changes |
| `projectId` | stable UUID-like identifier |
| `appId` | primary owning program |
| `name` | user-facing local project title |
| `createdAt` / `updatedAt` / `lastOpenedAt` | ISO timestamp strings |
| `sourceAssetIds` | inputs imported or captured into the project |
| `derivedAssetIds` | processed outputs created during the project |
| `primaryAssetId` | the asset the primary view should open with |
| `previewAssetId` | lightweight thumbnail/preview reference when available |
| `exportHistory` | summary only, not full binary export contents |
| `shellState` | optional shell restoration hints |
| `programState` | app-specific payload |

---

## Asset Reference Schema

```ts
type AssetRole =
  | 'source'
  | 'processed'
  | 'capture'
  | 'composition-layer'
  | 'export-preview'
  | 'export-final';

interface LocalAssetRefV1 {
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
```

### Asset Rules

- `assetId` must be stable and unique
- `storageKey` must resolve through a local storage adapter
- `originAppId` tracks provenance for cross-app debugging and UX
- object URLs may be generated at runtime but must not be the only durable reference

---

## Shared Supporting Types

```ts
interface ExportHistoryEntry {
  exportId: string;
  createdAt: string;
  format: 'png' | 'jpeg' | 'webp' | 'gif' | 'apng' | 'svg';
  assetId?: string;
  width?: number;
  height?: number;
}

interface ProjectShellState {
  lastWindowLayoutId?: string;
  preferredWindowMode?: 'windowed' | 'maximized';
  activeUtilitySurface?: string;
}
```

---

## Program State Union

```ts
type ProgramStateV1 =
  | PixelLabProjectStateV1
  | PosterMakerProjectStateV1
  | RetroCamProjectStateV1;
```

### Pixel Lab State

```ts
interface PixelLabProjectStateV1 {
  kind: 'pixel-lab';
  activeSourceAssetId?: string;
  lastProcessedAssetId?: string;
  processingSettings: Record<string, unknown>;
  postFilters?: Record<string, unknown>;
  transformState?: Record<string, unknown>;
  selectedPresetId?: string;
  historySummary?: {
    undoDepth: number;
    redoDepth: number;
  };
  exportDefaults?: {
    format: 'png' | 'jpeg' | 'webp';
    quality: number;
  };
}
```

### Pixel Lab Rules

- `processingSettings` must contain the app’s serializable image-processing state
- undo/redo stack contents do not need to be fully persisted in MVP
- `historySummary` exists for shell insight and diagnostics only

### Poster Maker State

```ts
interface PosterMakerProjectStateV1 {
  kind: 'poster-maker';
  documentPresetId: string;
  canvas: {
    width: number;
    height: number;
    backgroundStyleId?: string;
  };
  layers: PosterMakerLayerV1[];
  activeLayerId?: string;
  exportDefaults?: {
    format: 'png' | 'jpeg' | 'webp';
    quality: number;
  };
}

type PosterMakerLayerV1 =
  | PosterImageLayerV1
  | PosterTextLayerV1
  | PosterFrameLayerV1
  | PosterStickerLayerV1;
```

### Poster Maker Layer Shapes

```ts
interface BasePosterLayerV1 {
  layerId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
}

interface PosterImageLayerV1 extends BasePosterLayerV1 {
  type: 'image';
  assetId: string;
}

interface PosterTextLayerV1 extends BasePosterLayerV1 {
  type: 'text';
  text: string;
  textStyleId: string;
}

interface PosterFrameLayerV1 extends BasePosterLayerV1 {
  type: 'frame';
  frameStyleId: string;
}

interface PosterStickerLayerV1 extends BasePosterLayerV1 {
  type: 'sticker';
  stickerId: string;
}
```

### RetroCam State

```ts
interface RetroCamProjectStateV1 {
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
```

---

## Persistence Contract

### Canonical Storage Rule

Canonical project state must be saved through a local persistence adapter.

The adapter contract should support:

- save project manifest
- load project manifest
- list recent projects
- save asset blob
- resolve asset blob
- delete project and associated local assets when requested

### MVP Storage Guidance

- structured manifests: local persistent store through adapter
- asset blobs: local persistent store through adapter
- recent-project index: lightweight local index is acceptable
- `localStorage`: allowed for settings and recent index cache, not for canonical asset payloads

### Environment Guidance

- web: prefer IndexedDB-backed adapter for canonical project and asset persistence
- Tauri: may initially use the same adapter abstraction if it remains fully local

This spec intentionally defines the contract before locking a storage backend implementation.

---

## Recent Projects Contract

```ts
interface RecentProjectEntryV1 {
  projectId: string;
  appId: AppId;
  name: string;
  lastOpenedAt: string;
  previewAssetId?: string;
}
```

Rules:

- the shell should be able to list recent work without loading full project payloads
- recent entries should be derived from canonical manifests
- deleting a project must remove its recent entry

---

## Cross-App Compatibility Rules

- one project has one owning `appId`
- assets may be shared across projects
- a handoff may create a new project in another app instead of mutating the source project
- the receiving app must not silently overwrite unrelated project state

Examples:

- Pixel Lab processed image can seed a new Poster Maker project
- RetroCam capture can open a new Pixel Lab project
- Poster Maker export may create a new asset without becoming a Pixel Lab project

---

## Import / Export Boundaries

### MVP Must Support

- internal local persistence
- restore last or recent projects
- cross-app handoff using shared local asset references

### MVP May Defer

- portable project package export
- archive bundling
- external project interchange format

Portable project packaging can be added later as a separate layer on top of this schema.

---

## Migration Policy

- new schema versions must provide a migration path from older manifests
- migration should happen at load time through explicit version handlers
- unknown `schemaVersion` values must fail safely with a clear local error state

---

## Acceptance Criteria

- the team can define a concrete `projectStorageAdapter` from this document
- Pixel Lab and Poster Maker can both persist meaningful local project state
- cross-app handoff can reference shared assets without remote services
- no future project work requires reinterpretation of ownership or persistence scope
