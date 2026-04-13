import type { CrossAppHandoffEnvelopeV1 } from '$lib/handoffs/contracts';
import type { AppId } from '$lib/projects/schema';
import type { ProjectStorageAdapter } from '$lib/projects/storageAdapter';

export interface PixelLabHandoffConsumer {
  peek(): CrossAppHandoffEnvelopeV1 | null;
  consume(targetAppId?: AppId): CrossAppHandoffEnvelopeV1 | null;
}

export interface ConsumePixelLabCaptureHandoffInput {
  handoffBus: PixelLabHandoffConsumer;
  projectStorage: ProjectStorageAdapter;
  loadImage: (file: File) => void;
  notifyMissingAsset?: (message: string) => void;
  missingAssetMessage?: string;
}

function buildFallbackFilename(mimeType: string): string {
  if (mimeType === 'image/jpeg') return 'retrocam-capture.jpg';
  if (mimeType === 'image/webp') return 'retrocam-capture.webp';
  return 'retrocam-capture.png';
}

export async function consumePixelLabCaptureHandoff(
  input: ConsumePixelLabCaptureHandoffInput,
): Promise<boolean> {
  const pending = input.handoffBus.peek();
  if (!pending || pending.toAppId !== 'pixel-lab' || pending.intent !== 'edit_capture') {
    return false;
  }

  const envelope = input.handoffBus.consume('pixel-lab');
  if (!envelope || envelope.intent !== 'edit_capture') return false;

  const resolved = await input.projectStorage.resolveAsset(envelope.assetId);
  if (!resolved) {
    if (input.notifyMissingAsset && input.missingAssetMessage) {
      input.notifyMissingAsset(input.missingAssetMessage);
    }
    return true;
  }

  const filename = resolved.asset.filename || buildFallbackFilename(resolved.asset.mimeType || resolved.blob.type);
  const file = new File([resolved.blob], filename, {
    type: resolved.asset.mimeType || resolved.blob.type || 'image/png',
  });

  input.loadImage(file);
  return true;
}
