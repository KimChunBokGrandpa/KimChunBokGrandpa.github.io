/**
 * Export capability detection.
 *
 * Determines which export actions are available in the current runtime.
 * `canShareStill` depends on Web Share API file support; all other capabilities
 * are local file I/O and always available.
 */

export interface ExportCapability {
  canShareStill: boolean; // navigator.share + canShare({ files: [imageFile] })
  canExportSvgStill: boolean;
  canExportApng: boolean;
  canExportAnimatedSvg: boolean;
  canExportAnimatedWebp: boolean;
  canExportSpritesheet: boolean;
  canExportFrameSequence: boolean;
}

export function detectExportCapability(): ExportCapability {
  const canShareStill =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function'
      ? navigator.canShare({
          files: [new File([new Uint8Array(1)], 'probe.png', { type: 'image/png' })],
        })
      : false;

  return {
    canShareStill,
    canExportSvgStill: true,
    canExportApng: true,
    canExportAnimatedSvg: true,
    canExportAnimatedWebp: true,
    canExportSpritesheet: true,
    canExportFrameSequence: true,
  };
}
