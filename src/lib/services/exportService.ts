/**
 * Export Service — Handles SVG and spritesheet export operations.
 * Extracts export logic from +page.svelte for separation of concerns.
 */
import { imageDataToSvg, downloadSvg } from '$lib/utils/svgExporter';
import { createSpritesheet, downloadSpritesheet } from '$lib/utils/spritesheetExporter';
import { frameToBlobUrl, type GifInfo } from '$lib/utils/gifProcessor';

/**
 * Export the processed image as SVG (pixel art → <rect> elements).
 * @param processedImageSrc - Blob URL of the processed image
 * @returns filename of the exported SVG
 */
export async function exportSvg(processedImageSrc: string): Promise<string> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = processedImageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2d context');
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const filename = `pixel-art-${Date.now()}.svg`;
  const svgString = imageDataToSvg(imageData);
  downloadSvg(svgString, filename);
  return filename;
}

/**
 * Export GIF frames as a spritesheet PNG.
 * @param gifInfo - Decoded GIF information with frames
 * @returns filename of the exported spritesheet
 */
export async function exportSpritesheet(gifInfo: GifInfo): Promise<string> {
  const frameSrcs: string[] = [];
  try {
    for (const frame of gifInfo.frames) {
      frameSrcs.push(await frameToBlobUrl(frame));
    }
    const canvas = await createSpritesheet(
      frameSrcs,
      gifInfo.width,
      gifInfo.height,
    );
    const filename = `spritesheet-${Date.now()}.png`;
    await downloadSpritesheet(canvas, filename);
    return filename;
  } finally {
    // Cleanup blob URLs even if export fails
    frameSrcs.forEach(URL.revokeObjectURL);
  }
}
