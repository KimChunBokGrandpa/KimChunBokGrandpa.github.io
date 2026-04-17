import {
  sendRetroCamToPosterMaker,
  type HandoffPublisher,
  type SendRetroCamToPosterMakerResult,
} from '$lib/handoffs/retroCamToPosterMaker';
import type { ProjectStorageAdapter } from '$lib/projects/storageAdapter';
import type { RetroCamPresetId } from '$lib/stores/retroCamStore.svelte';

export interface RetroCamPosterMakerFlowInput {
  snapshotFile: File | null;
  activePresetId: RetroCamPresetId;
  projectStorage: ProjectStorageAdapter;
  handoffBus: HandoffPublisher;
  openPosterMaker: () => void;
  notify: (message: string) => void;
  successMessage: string;
}

export async function launchPosterMakerFromRetroCam(
  input: RetroCamPosterMakerFlowInput,
): Promise<SendRetroCamToPosterMakerResult | null> {
  const result = await sendRetroCamToPosterMaker({
    snapshotFile: input.snapshotFile,
    activePresetId: input.activePresetId,
    projectStorage: input.projectStorage,
    handoffBus: input.handoffBus,
  });

  if (!result) return null;

  input.openPosterMaker();
  input.notify(input.successMessage);
  return result;
}
