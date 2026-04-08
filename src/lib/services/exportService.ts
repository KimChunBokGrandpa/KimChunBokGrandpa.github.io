/**
 * Export Service — Handles SVG, spritesheet, and frame sequence export operations.
 * Extracts export logic from +page.svelte for separation of concerns.
 */
import { imageDataToSvg, downloadSvg } from '$lib/utils/svgExporter';
import { createSpritesheet, downloadSpritesheet } from '$lib/utils/spritesheetExporter';
import { frameToBlobUrl, type GifInfo } from '$lib/utils/gifProcessor';
import { encodeApng, type ApngFrame } from '$lib/utils/apngEncoder';
import { encodeAnimatedWebp, type AnimatedWebpFrame } from '$lib/utils/webpEncoder';

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

/**
 * Export GIF frames as individual PNG files (frame_001.png, frame_002.png, ...).
 * Downloads each frame separately via anchor click.
 * @param gifInfo - Decoded GIF information with frames
 * @returns number of exported frames
 */
export async function exportFrameSequence(gifInfo: GifInfo): Promise<number> {
  const { frames, width, height } = gifInfo;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2d context');

  const pad = String(frames.length).length;

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const imageData = new ImageData(new Uint8ClampedArray(frame.data), frame.width, frame.height);
    ctx.clearRect(0, 0, width, height);
    ctx.putImageData(imageData, 0, 0);

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) continue;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `frame_${String(i + 1).padStart(pad, '0')}.png`;
    a.click();
    URL.revokeObjectURL(url);

    // Small delay to prevent browser throttling
    if (i < frames.length - 1) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  return frames.length;
}

/**
 * Export GIF frames as an Animated PNG (APNG) file.
 * APNG supports full alpha channel and more than 256 colors per frame.
 * @param gifInfo - Decoded GIF information with frames
 * @returns filename of the exported APNG
 */
export async function exportApng(gifInfo: GifInfo): Promise<string> {
  const { frames, width, height } = gifInfo;
  if (frames.length === 0) throw new Error('No frames to export');

  const apngFrames: ApngFrame[] = frames.map(f => ({
    data: f.data,
    delay: f.delay,
    width,
    height,
  }));

  const apngData = encodeApng(apngFrames);
  const blob = new Blob([apngData], { type: 'image/png' });
  const url = URL.createObjectURL(blob);

  const filename = `animated-${Date.now()}.apng`;
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  return filename;
}

async function canvasToWebpBytes(canvas: HTMLCanvasElement, quality: number): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
  if (!blob || blob.type !== 'image/webp') {
    throw new Error('Animated WebP export is not supported in this browser');
  }
  return new Uint8Array(await blob.arrayBuffer());
}

function frameHasAlpha(data: Uint8ClampedArray): boolean {
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) return true;
  }
  return false;
}

/**
 * Export GIF frames as an Animated WebP file.
 * Uses canvas WebP encoding per frame, then muxes them into an animated container.
 * @param gifInfo - Decoded GIF information with frames
 * @param quality - WebP quality (0.0 ~ 1.0)
 * @returns filename of the exported Animated WebP
 */
export async function exportAnimatedWebp(gifInfo: GifInfo, quality: number = 0.92): Promise<string> {
  const { frames, width, height } = gifInfo;
  if (frames.length === 0) throw new Error('No frames to export');

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2d context');

  const webpFrames: AnimatedWebpFrame[] = [];
  for (const frame of frames) {
    const imageData = new ImageData(new Uint8ClampedArray(frame.data), frame.width, frame.height);
    ctx.clearRect(0, 0, width, height);
    ctx.putImageData(imageData, 0, 0);
    webpFrames.push({
      webp: await canvasToWebpBytes(canvas, quality),
      delay: frame.delay,
      width,
      height,
      hasAlpha: frameHasAlpha(frame.data),
    });
  }

  const webpData = encodeAnimatedWebp(webpFrames);
  const blob = new Blob([webpData], { type: 'image/webp' });
  const url = URL.createObjectURL(blob);

  const filename = `animated-${Date.now()}.webp`;
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  return filename;
}
