import {
  sendPixelLabToPosterMaker,
  type PixelLabPosterTransferSnapshot,
  type SendPixelLabToPosterMakerResult,
} from '$lib/handoffs/pixelLabToPosterMaker';
import type { HandoffPublisher } from '$lib/handoffs/pixelLabToPosterMaker';
import type { ProjectStorageAdapter } from '$lib/projects/storageAdapter';

export interface PixelLabPosterMakerFlowInput {
  createTransferFile: (filename: string) => Promise<File | null>;
  snapshot: PixelLabPosterTransferSnapshot;
  projectStorage: ProjectStorageAdapter;
  handoffBus: HandoffPublisher;
  openPosterMaker: () => void;
  notify: (message: string) => void;
  successMessage: string;
}

export async function launchPosterMakerFromPixelLab(
  input: PixelLabPosterMakerFlowInput,
): Promise<SendPixelLabToPosterMakerResult | null> {
  const transferFile = await input.createTransferFile('pixel-lab-poster-input');
  const result = await sendPixelLabToPosterMaker({
    transferFile,
    snapshot: input.snapshot,
    projectStorage: input.projectStorage,
    handoffBus: input.handoffBus,
  });

  if (!result) return null;

  input.openPosterMaker();
  input.notify(input.successMessage);
  return result;
}
