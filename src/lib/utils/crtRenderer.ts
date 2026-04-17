/**
 * CRT Canvas Renderer — Applies CRT scanline effects directly to canvas pixels.
 * Used for export so the saved image includes CRT effects.
 */
import type { CrtMode } from '../types';

const scanlineOpacity = 0.25;
const chromaticOffset = 1;

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
          data[idx] = Math.round(data[idx] * (1 - scanlineOpacity));
          data[idx + 1] = Math.round(data[idx + 1] * (1 - scanlineOpacity));
          data[idx + 2] = Math.round(data[idx + 2] * (1 - scanlineOpacity));
        }
      }
    }
  } else {
    // Vertical: darken every other column pair
    for (let x = 0; x < w; x++) {
      if (x % 4 >= 2) {
        for (let y = 0; y < h; y++) {
          const idx = (y * w + x) * 4;
          data[idx] = Math.round(data[idx] * (1 - scanlineOpacity));
          data[idx + 1] = Math.round(data[idx + 1] * (1 - scanlineOpacity));
          data[idx + 2] = Math.round(data[idx + 2] * (1 - scanlineOpacity));
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
  // Direct pixel manipulation: shift R channel right, B channel left by chromaticOffset
  const srcCtx = source.getContext('2d');
  if (!srcCtx) return;
  const srcData = srcCtx.getImageData(0, 0, w, h).data;
  const outImageData = ctx.createImageData(w, h);
  const out = outImageData.data;

  for (let y = 0; y < h; y++) {
    const rowBase = y * w;
    for (let x = 0; x < w; x++) {
      const idx = (rowBase + x) * 4;
      // Red from pixel shifted left (source x - offset)
      const rSrcX = Math.max(0, Math.min(w - 1, x - chromaticOffset));
      const rIdx = (rowBase + rSrcX) * 4;
      // Blue from pixel shifted right (source x + offset)
      const bSrcX = Math.max(0, Math.min(w - 1, x + chromaticOffset));
      const bIdx = (rowBase + bSrcX) * 4;

      out[idx] = srcData[rIdx];         // R from shifted source
      out[idx + 1] = srcData[idx + 1];  // G from original position
      out[idx + 2] = srcData[bIdx + 2]; // B from shifted source
      out[idx + 3] = srcData[idx + 3];  // A from original
    }
  }

  ctx.putImageData(outImageData, 0, 0);
}

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const gradient = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.8);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}
