import type { SaveFormat } from '$lib/services/saveService';
import type { CropRect } from '$lib/stores/transformStore.svelte';
import type { PostProcessFilters, ProcessingSettings } from '$lib/types';
import { createHandoffEnvelope, type CrossAppHandoffEnvelopeV1 } from '$lib/handoffs/contracts';
import {
  createAssetId,
  createProjectManifest,
  type RetroProjectManifestV1,
} from '$lib/projects/schema';
import type { ProjectStorageAdapter } from '$lib/projects/storageAdapter';

export interface PixelLabPosterTransferSnapshot {
  settings: ProcessingSettings;
  postFilters: PostProcessFilters;
  rotation: number;
  cropRect: CropRect | null;
  saveFormat: SaveFormat;
  saveQuality: number;
}

export interface HandoffPublisher {
  publish(envelope: CrossAppHandoffEnvelopeV1): unknown;
}

export interface SendPixelLabToPosterMakerInput {
  transferFile: File | null;
  snapshot: PixelLabPosterTransferSnapshot;
  projectStorage: ProjectStorageAdapter;
  handoffBus: HandoffPublisher;
}

export interface SendPixelLabToPosterMakerResult {
  assetId: string;
  manifest: RetroProjectManifestV1;
  envelope: CrossAppHandoffEnvelopeV1;
}

function cloneSettings(settings: ProcessingSettings): ProcessingSettings {
  return {
    ...settings,
    glitchFilters: settings.glitchFilters.map((filter) => ({ ...filter })),
    effectLayers: settings.effectLayers?.map((layer) => ({ ...layer })) ?? [],
  };
}

function clonePostFilters(postFilters: PostProcessFilters): PostProcessFilters {
  return { ...postFilters };
}

function cloneCropRect(cropRect: CropRect | null): CropRect | null {
  return cropRect ? { ...cropRect } : null;
}

export async function sendPixelLabToPosterMaker(
  input: SendPixelLabToPosterMakerInput,
): Promise<SendPixelLabToPosterMakerResult | null> {
  const { transferFile, snapshot, projectStorage, handoffBus } = input;
  if (!transferFile) return null;

  const assetId = createAssetId();
  await projectStorage.saveAsset({
    asset: {
      assetId,
      role: 'processed',
      mimeType: transferFile.type,
      storageKey: `poster-transfers/${assetId}.png`,
      originAppId: 'pixel-lab',
      createdAt: new Date().toISOString(),
      filename: transferFile.name,
    },
    blob: transferFile,
  });

  const manifest = createProjectManifest({
    appId: 'pixel-lab',
    name: 'Pixel Lab Transfer',
    sourceAssetIds: [assetId],
    derivedAssetIds: [assetId],
    primaryAssetId: assetId,
    previewAssetId: assetId,
    programState: {
      kind: 'pixel-lab',
      activeSourceAssetId: assetId,
      lastProcessedAssetId: assetId,
      processingSettings: cloneSettings(snapshot.settings),
      postFilters: clonePostFilters(snapshot.postFilters),
      transformState: {
        rotation: snapshot.rotation,
        cropRect: cloneCropRect(snapshot.cropRect),
      },
      exportDefaults: {
        format: snapshot.saveFormat,
        quality: snapshot.saveQuality,
      },
    },
  });
  await projectStorage.saveProject(manifest);

  const envelope = createHandoffEnvelope({
    fromAppId: 'pixel-lab',
    toAppId: 'poster-maker',
    intent: 'place_processed_asset',
    openMode: 'create_project',
    assetId,
    sourceProjectId: manifest.projectId,
    sourceLabel: 'Pixel Lab Transfer',
    payload: { placeMode: 'fit-center' },
  });
  handoffBus.publish(envelope);

  return {
    assetId,
    manifest,
    envelope,
  };
}
