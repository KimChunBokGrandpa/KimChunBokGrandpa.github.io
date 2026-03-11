/**
 * Sprite Sheet Exporter — Combines GIF frames into a single sprite sheet image.
 * Frames are arranged in a grid (row-major order).
 */

export interface SpritesheetOptions {
  /** Max columns in the grid (default: auto-calculate based on frame count) */
  columns?: number;
  /** Padding between frames in pixels (default: 0) */
  padding?: number;
}

/**
 * Generate a sprite sheet canvas from an array of frame blob URLs.
 * @param frameSrcs - Array of image source URLs (blob: or data: URLs)
 * @param frameWidth - Width of each frame
 * @param frameHeight - Height of each frame
 */
export async function createSpritesheet(
  frameSrcs: string[],
  frameWidth: number,
  frameHeight: number,
  options: SpritesheetOptions = {},
): Promise<HTMLCanvasElement> {
  const count = frameSrcs.length;
  if (count === 0) throw new Error('No frames to export');

  const padding = options.padding ?? 0;
  const cols = options.columns ?? Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);

  const sheetW = cols * frameWidth + (cols - 1) * padding;
  const sheetH = rows * frameHeight + (rows - 1) * padding;

  const canvas = document.createElement('canvas');
  canvas.width = sheetW;
  canvas.height = sheetH;
  const ctx = canvas.getContext('2d')!;

  // Load all frames in parallel
  const images = await Promise.all(
    frameSrcs.map(
      (src) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Failed to load frame'));
          img.src = src;
        }),
    ),
  );

  // Draw frames in grid
  for (let i = 0; i < images.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const dx = col * (frameWidth + padding);
    const dy = row * (frameHeight + padding);
    ctx.drawImage(images[i], dx, dy, frameWidth, frameHeight);
  }

  return canvas;
}

/**
 * Download a sprite sheet canvas as PNG.
 */
export function downloadSpritesheet(
  canvas: HTMLCanvasElement,
  filename = 'spritesheet.png',
): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}
