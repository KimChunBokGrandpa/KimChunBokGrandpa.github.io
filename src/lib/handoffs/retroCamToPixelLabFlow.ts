import {
  sendRetroCamToPixelLab,
  type SendRetroCamToPixelLabResult,
  type HandoffPublisher,
} from '$lib/handoffs/retroCamToPixelLab';
import type { ProjectStorageAdapter } from '$lib/projects/storageAdapter';
import type { RetroCamPresetId } from '$lib/stores/retroCamStore.svelte';

export interface RetroCamPixelLabFlowInput {
  snapshotFile: File | null;
  activePresetId: RetroCamPresetId;
  projectStorage: ProjectStorageAdapter;
  handoffBus: HandoffPublisher;
  openPixelLab: () => void;
  notify: (message: string) => void;
  successMessage: string;
}

export async function launchPixelLabFromRetroCam(
  input: RetroCamPixelLabFlowInput,
): Promise<SendRetroCamToPixelLabResult | null> {
  const result = await sendRetroCamToPixelLab({
    snapshotFile: input.snapshotFile,
    activePresetId: input.activePresetId,
    projectStorage: input.projectStorage,
    handoffBus: input.handoffBus,
  });

  if (!result) return null;

  input.openPixelLab();
  input.notify(input.successMessage);
  return result;
}
