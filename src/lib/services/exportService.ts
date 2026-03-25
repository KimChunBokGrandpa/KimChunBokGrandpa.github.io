/**
 * Export Service — Handles SVG and spritesheet export operations.
 * Extracts export logic from +page.svelte for separation of concerns.
 */
import { imageDataToSvg, downloadSvg } from '$lib/utils/svgExporter';
import { createSpritesheet, downloadSpritesheet } from '$lib/utils/spritesheetExporter';
import { frameToBlobUrl, type GifInfo } from '$lib/utils/gifProcessor';

/**
 * Export the processed image as SVG (pixel art → <rect> elements).
 * Uses the cached canvas from processorService when available to avoid re-decoding the blob URL.
 * @param processedImageSrc - Blob URL of the processed image (fallback if no canvas)
 * @param lastCanvas - Cached canvas from processorService.getLastCanvas()
 * @returns filename of the exported SVG
 */
export async function exportSvg(processedImageSrc: string, lastCanvas?: HTMLCanvasElement | null): Promise<string> {
  let imageData: ImageData;

  if (lastCanvas) {
    const ctx = lastCanvas.getContext('2d');
    if (ctx) {
      imageData = ctx.getImageData(0, 0, lastCanvas.width, lastCanvas.height);
    } else {
      imageData = await decodeImageSrc(processedImageSrc);
    }
  } else {
    imageData = await decodeImageSrc(processedImageSrc);
  }

  const filename = `pixel-art-${Date.now()}.svg`;
  const svgString = imageDataToSvg(imageData);
  downloadSvg(svgString, filename);
  return filename;
}

/** Fallback: decode blob URL into ImageData */
async function decodeImageSrc(src: string): Promise<ImageData> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => { img.onload = null; img.onerror = null; resolve(); };
    img.onerror = () => { img.onload = null; img.onerror = null; reject(new Error('Failed to load image')); };
    img.src = src;
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2d context');
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
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
