export type CanvasSurface = HTMLCanvasElement | OffscreenCanvas;
export type CanvasSurfaceContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

interface Canvas2DSurface {
  canvas: CanvasSurface;
  ctx: CanvasSurfaceContext;
}

function normalizeDimension(value: number): number {
  return Math.max(1, Math.round(value));
}

export function createCanvasSurface(width: number, height: number): Canvas2DSurface {
  const normalizedWidth = normalizeDimension(width);
  const normalizedHeight = normalizeDimension(height);

  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(normalizedWidth, normalizedHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context unavailable');
    }
    return { canvas, ctx };
  }

  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = normalizedWidth;
    canvas.height = normalizedHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context unavailable');
    }
    return { canvas, ctx };
  }

  throw new Error('Canvas surface unavailable');
}

export async function canvasSurfaceToBlob(
  canvas: CanvasSurface,
  type: string = 'image/png',
  quality?: number,
): Promise<Blob> {
  if ('convertToBlob' in canvas && typeof canvas.convertToBlob === 'function') {
    return canvas.convertToBlob({ type, quality });
  }

  if ('toBlob' in canvas && typeof canvas.toBlob === 'function') {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error('Failed to create blob from canvas'));
      }, type, quality);
    });
  }

  throw new Error('Canvas blob export unavailable');
}
