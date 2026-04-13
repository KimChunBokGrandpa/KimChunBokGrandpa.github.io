import { createHandoffEnvelope, type CrossAppHandoffEnvelopeV1 } from '$lib/handoffs/contracts';
import {
  createAssetId,
  createProjectManifest,
  type RetroProjectManifestV1,
} from '$lib/projects/schema';
import type { ProjectStorageAdapter } from '$lib/projects/storageAdapter';
import type { RetroCamPresetId } from '$lib/stores/retroCamStore.svelte';

export interface HandoffPublisher {
  publish(envelope: CrossAppHandoffEnvelopeV1): unknown;
}

export interface SendRetroCamToPixelLabInput {
  snapshotFile: File | null;
  activePresetId: RetroCamPresetId;
  projectStorage: ProjectStorageAdapter;
  handoffBus: HandoffPublisher;
}

export interface SendRetroCamToPixelLabResult {
  assetId: string;
  manifest: RetroProjectManifestV1;
  envelope: CrossAppHandoffEnvelopeV1;
}

export async function sendRetroCamToPixelLab(
  input: SendRetroCamToPixelLabInput,
): Promise<SendRetroCamToPixelLabResult | null> {
  const { snapshotFile, activePresetId, projectStorage, handoffBus } = input;
  if (!snapshotFile) return null;

  const assetId = createAssetId();
  const createdAt = new Date().toISOString();

  await projectStorage.saveAsset({
    asset: {
      assetId,
      role: 'capture',
      mimeType: snapshotFile.type,
      storageKey: `retrocam-captures/${assetId}.png`,
      originAppId: 'retrocam',
      createdAt,
      filename: snapshotFile.name,
      byteSize: snapshotFile.size,
    },
    blob: snapshotFile,
  });

  const manifest = createProjectManifest({
    appId: 'retrocam',
    name: 'RetroCam Capture',
    sourceAssetIds: [assetId],
    derivedAssetIds: [assetId],
    primaryAssetId: assetId,
    previewAssetId: assetId,
    programState: {
      kind: 'retrocam',
      inputMode: 'webcam',
      fastPresetId: activePresetId,
      lastCaptureAssetId: assetId,
      captureSettings: {
        mirrored: true,
      },
    },
  });
  await projectStorage.saveProject(manifest);

  const envelope = createHandoffEnvelope({
    fromAppId: 'retrocam',
    toAppId: 'pixel-lab',
    intent: 'edit_capture',
    openMode: 'create_project',
    assetId,
    sourceProjectId: manifest.projectId,
    sourceLabel: 'RetroCam Snapshot',
    payload: {
      captureOrigin: 'webcam',
      presetId: activePresetId,
    },
  });
  handoffBus.publish(envelope);

  return {
    assetId,
    manifest,
    envelope,
  };
}
