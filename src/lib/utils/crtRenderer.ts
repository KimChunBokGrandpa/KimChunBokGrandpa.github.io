/**
 * CRT Canvas Renderer — Applies CRT scanline effects directly to canvas pixels.
 * Used for export so the saved image includes CRT effects.
 */
import type { CrtMode } from '../types';

const SCANLINE_OPACITY = 0.25;
const CHROMATIC_OFFSET = 1;

/**
 * Apply CRT scanline effect to a canvas.
 * Modifies the canvas in-place and returns it.
 */
export function applyCrtEffect(
  sourceCanvas: HTMLCanvasElement,
  mode: CrtMode,
): HTMLCanvasElement {
  if (mode === 'none') return sourceCanvas;

  const w = sourceCanvas.width;
  const h = sourceCanvas.height;
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d');
  if (!ctx) return sourceCanvas;

  // Step 1: Draw chromatic aberration (slight RGB offset)
  drawChromaticAberration(ctx, sourceCanvas, w, h);

  // Step 2: Apply scanlines
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  if (mode === 'horizontal') {
    // Darken every other row pair (2px scanline pattern)
    for (let y = 0; y < h; y++) {
      if (y % 4 >= 2) {
        const rowStart = y * w * 4;
        for (let x = 0; x < w; x++) {
          const idx = rowStart + x * 4;
          data[idx] = Math.round(data[idx] * (1 - SCANLINE_OPACITY));
          data[idx + 1] = Math.round(data[idx + 1] * (1 - SCANLINE_OPACITY));
          data[idx + 2] = Math.round(data[idx + 2] * (1 - SCANLINE_OPACITY));
        }
      }
    }
  } else {
    // Vertical: darken every other column pair
    for (let x = 0; x < w; x++) {
      if (x % 4 >= 2) {
        for (let y = 0; y < h; y++) {
          const idx = (y * w + x) * 4;
          data[idx] = Math.round(data[idx] * (1 - SCANLINE_OPACITY));
          data[idx + 1] = Math.round(data[idx + 1] * (1 - SCANLINE_OPACITY));
          data[idx + 2] = Math.round(data[idx + 2] * (1 - SCANLINE_OPACITY));
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // Step 3: Add subtle vignette (darker edges)
  drawVignette(ctx, w, h);

  return out;
}

function drawChromaticAberration(
  ctx: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  w: number,
  h: number,
): void {
  // Red channel shifted right
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(source, 0, 0);

  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = 'rgb(255, 0, 0)';
  ctx.fillRect(0, 0, w, h);

  // Temp canvas for green+blue
  const tmp = document.createElement('canvas');
  tmp.width = w;
  tmp.height = h;
  const tmpCtx = tmp.getContext('2d');
  if (!tmpCtx) return;

  // Green channel (no shift)
  tmpCtx.drawImage(source, 0, 0);
  tmpCtx.globalCompositeOperation = 'multiply';
  tmpCtx.fillStyle = 'rgb(0, 255, 0)';
  tmpCtx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(tmp, -CHROMATIC_OFFSET, 0);

  // Blue channel shifted left
  tmpCtx.globalCompositeOperation = 'source-over';
  tmpCtx.drawImage(source, 0, 0);
  tmpCtx.globalCompositeOperation = 'multiply';
  tmpCtx.fillStyle = 'rgb(0, 0, 255)';
  tmpCtx.fillRect(0, 0, w, h);

  ctx.drawImage(tmp, CHROMATIC_OFFSET, 0);

  ctx.globalCompositeOperation = 'source-over';
}

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const gradient = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.8);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}
