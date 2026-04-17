export type CropRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export function createTransformStore() {
  let rotation = $state(0);
  let cropRect = $state<CropRect | null>(null);
  let transformedSrc = $state<string | null>(null);
  let transformedObjectUrl: string | null = null;

  function clearTransformedUrl() {
    if (transformedObjectUrl) {
      URL.revokeObjectURL(transformedObjectUrl);
      transformedObjectUrl = null;
    }
  }

  async function applyTransform(originalImageSrc: string | null): Promise<string | null> {
    if (!originalImageSrc) return null;

    if (rotation === 0 && !cropRect) {
      clearTransformedUrl();
      transformedSrc = null;
      return null;
    }

    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          img.onload = null;
          img.onerror = null;
          resolve();
        };
        img.onerror = () => {
          img.onload = null;
          img.onerror = null;
          reject(new Error('Failed to load image for transform'));
        };
        img.src = originalImageSrc;
      });

      let srcX = 0;
      let srcY = 0;
      let srcW = img.naturalWidth;
      let srcH = img.naturalHeight;

      if (cropRect) {
        srcX = cropRect.x;
        srcY = cropRect.y;
        srcW = cropRect.w;
        srcH = cropRect.h;
      }

      const isRotated90 = rotation === 90 || rotation === 270;
      const outW = isRotated90 ? srcH : srcW;
      const outH = isRotated90 ? srcW : srcH;

      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get 2d context for transform');

      ctx.save();
      ctx.translate(outW / 2, outH / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, srcX, srcY, srcW, srcH, -srcW / 2, -srcH / 2, srcW, srcH);
      ctx.restore();

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (!result) {
            reject(new Error('Failed to create transform blob'));
            return;
          }
          resolve(result);
        }, 'image/png');
      });

      clearTransformedUrl();
      transformedObjectUrl = URL.createObjectURL(blob);
      transformedSrc = transformedObjectUrl;
      return transformedObjectUrl;
    } catch (error) {
      clearTransformedUrl();
      transformedSrc = null;
      throw error;
    }
  }

  async function rotate(originalImageSrc: string | null, degrees: 90 | -90 | 180) {
    rotation = ((rotation + degrees) % 360 + 360) % 360;
    cropRect = null;
    return applyTransform(originalImageSrc);
  }

  async function setCrop(originalImageSrc: string | null, rect: CropRect | null) {
    cropRect = rect;
    return applyTransform(originalImageSrc);
  }

  async function restore(originalImageSrc: string | null, nextRotation: number, nextCropRect: CropRect | null) {
    rotation = ((nextRotation % 360) + 360) % 360;
    cropRect = nextCropRect ? { ...nextCropRect } : null;
    return applyTransform(originalImageSrc);
  }

  function reset() {
    rotation = 0;
    cropRect = null;
    clearTransformedUrl();
    transformedSrc = null;
  }

  function destroy() {
    reset();
  }

  return {
    get rotation() { return rotation; },
    get cropRect() { return cropRect; },
    get transformedSrc() { return transformedSrc; },
    applyTransform,
    rotate,
    setCrop,
    restore,
    reset,
    destroy,
  };
}
