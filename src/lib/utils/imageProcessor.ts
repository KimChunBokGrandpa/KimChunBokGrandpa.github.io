import type {
  ImageWorkerMessage,
  ImageWorkerResponse,
} from "../workers/imageWorker";
import type { ProcessingSettings } from "../types";

/**
 * Singleton-based image processing service.
 * - Reuses a single Web Worker across calls
 * - Cancels stale requests via request ID tracking
 * - Uses Transferable ArrayBuffers to avoid data copying
 * - Caches loaded Image elements
 */
class ImageProcessorService {
  private worker: Worker | null = null;
  private currentRequestId: string | null = null;
  private pendingResolvers = new Map<
    string,
    {
      resolve: (value: string | null) => void;
      reject: (reason: unknown) => void;
      canvas: HTMLCanvasElement;
      ctx: CanvasRenderingContext2D;
    }
  >();
  private imageCache = new Map<string, HTMLImageElement>();
  private lastBlobUrl: string | null = null;

  /** Maximum processing dimension to prevent OOM on large images */
  private readonly MAX_DIMENSION = 2048;
  /** HQx doubles resolution, so use stricter limit */
  private readonly MAX_DIMENSION_HQX = 1024;

  /** Cached last-rendered canvas for save without re-decode */
  private lastCanvas: HTMLCanvasElement | null = null;

  /** Revoke old blob URL and register new one */
  private replaceBlobUrl(newUrl: string): string {
    if (this.lastBlobUrl) {
      URL.revokeObjectURL(this.lastBlobUrl);
    }
    this.lastBlobUrl = newUrl;
    return newUrl;
  }

  private ensureWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(
        new URL("../workers/imageWorker.ts", import.meta.url),
        { type: "module" },
      );
      this.worker.onmessage = (e: MessageEvent<ImageWorkerResponse>) => {
        const { id, processedData, error } = e.data;
        const pending = this.pendingResolvers.get(id);
        if (!pending) return;
        this.pendingResolvers.delete(id);

        if (error) {
          pending.reject(new Error(error));
        } else {
          // Reconstruct ImageData to ensure buffer integrity after transfer
          const safeData = new ImageData(
            new Uint8ClampedArray(processedData.data),
            processedData.width,
            processedData.height,
          );

          // Canvas 크기를 처리된 데이터에 맞게 조정 (HQx 등으로 인해 해상도가 커졌을 수 있음)
          pending.canvas.width = processedData.width;
          pending.canvas.height = processedData.height;

          pending.ctx.putImageData(safeData, 0, 0);
          this.lastCanvas = pending.canvas;
          // Use toBlob + createObjectURL instead of toDataURL for memory efficiency
          pending.canvas.toBlob((blob) => {
            if (blob) {
              const url = this.replaceBlobUrl(URL.createObjectURL(blob));
              pending.resolve(url);
            } else {
              pending.reject(new Error("Failed to create image blob"));
            }
          }, "image/png");
        }
      };
      this.worker.onerror = (err) => {
        for (const [, pending] of this.pendingResolvers) {
          pending.reject(err);
        }
        this.pendingResolvers.clear();
        // Reset worker so next call creates a fresh one
        this.worker?.terminate();
        this.worker = null;
      };
    }
    return this.worker;
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    const cached = this.imageCache.get(src);
    if (cached) return Promise.resolve(cached);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        this.imageCache.set(src, img);
        resolve(img);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = src;
    });
  }

  async processImage(
    imageSrc: string,
    settings: ProcessingSettings,
    onDimensionCapped?: (
      original: { w: number; h: number },
      capped: { w: number; h: number },
    ) => void,
  ): Promise<string | null> {
    const requestId = crypto.randomUUID();
    this.currentRequestId = requestId;

    // Cancel previous pending requests — resolve as null (stale)
    // Worker is kept alive; stale results will be discarded in onmessage
    // because their IDs won't be in pendingResolvers anymore.
    if (this.pendingResolvers.size > 0) {
      for (const [, pending] of this.pendingResolvers) {
        pending.resolve(null);
      }
      this.pendingResolvers.clear();
    }

    // Early return: no processing needed — still convert to data URL for save compatibility
    if (
      settings.pixelSize <= 1 &&
      settings.palette === "original" &&
      (!settings.glitchFilters || settings.glitchFilters.length === 0) &&
      (!settings.renderMode || settings.renderMode !== "hqx")
    ) {
      const img = await this.loadImage(imageSrc);
      if (this.currentRequestId !== requestId) return null;
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      this.lastCanvas = c;
      return new Promise<string>((resolve, reject) => {
        c.toBlob((blob) => {
          if (blob) {
            const url = this.replaceBlobUrl(URL.createObjectURL(blob));
            resolve(url);
          } else {
            reject(new Error("Failed to create image blob"));
          }
        }, "image/png");
      });
    }

    const img = await this.loadImage(imageSrc);
    if (this.currentRequestId !== requestId) return null;

    // Constrain to MAX_DIMENSION for performance
    // HQx doubles resolution, so use stricter limit
    const maxDim = settings.renderMode === 'hqx' ? this.MAX_DIMENSION_HQX : this.MAX_DIMENSION;
    let procWidth = img.width;
    let procHeight = img.height;
    if (procWidth > maxDim || procHeight > maxDim) {
      const scale = maxDim / Math.max(procWidth, procHeight);
      procWidth = Math.round(procWidth * scale);
      procHeight = Math.round(procHeight * scale);
      onDimensionCapped?.(
        { w: img.width, h: img.height },
        { w: procWidth, h: procHeight },
      );
    }

    // Use createImageBitmap to decode off-thread and transfer to worker
    const bitmap = await createImageBitmap(img, {
      resizeWidth: procWidth,
      resizeHeight: procHeight,
    });

    return new Promise<string | null>((resolve, reject) => {
      // Create canvas for the final export
      const canvas = document.createElement("canvas");
      canvas.width = procWidth;
      canvas.height = procHeight;
      const ctx = canvas.getContext("2d")!;
      this.pendingResolvers.set(requestId, { resolve, reject, canvas, ctx });

      const message: ImageWorkerMessage = {
        id: requestId,
        imageBitmap: bitmap,
        width: procWidth,
        height: procHeight,
        pixelSize: settings.pixelSize,
        palette: settings.palette,
        glitchFilters: settings.glitchFilters.map((f) => ({
          type: f.type,
          intensity: f.intensity,
        })),
        renderMode: settings.renderMode,
        glitchSeed: settings.glitchSeed,
      };

      this.ensureWorker().postMessage(message, [bitmap]);
    });
  }

  clearImageCache() {
    this.imageCache.clear();
  }

  /** Get the last rendered canvas for direct export (avoids re-decoding) */
  getLastCanvas(): HTMLCanvasElement | null {
    return this.lastCanvas;
  }

  destroy() {
    for (const [, pending] of this.pendingResolvers) {
      pending.resolve(null);
    }
    this.pendingResolvers.clear();
    this.worker?.terminate();
    this.worker = null;
    this.currentRequestId = null;
    this.imageCache.clear();
    // Release tracked blob URL
    if (this.lastBlobUrl) {
      URL.revokeObjectURL(this.lastBlobUrl);
      this.lastBlobUrl = null;
    }
    this.lastCanvas = null;
  }
}

// Module-level singleton
export const processorService = new ImageProcessorService();
