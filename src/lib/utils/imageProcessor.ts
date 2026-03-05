import type {
  ImageWorkerMessage,
  ImageWorkerResponse,
} from "../workers/imageWorker";

export interface ProcessSettings {
  pixelSize: number;
  palette: string;
  crtEffect: boolean;
  glitchFilters: Array<{ type: string; intensity: number }>;
  renderMode: string;
}

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
  private activeBlobUrls = new Set<string>();
  private lastBlobUrl: string | null = null;

  /** Maximum processing dimension to prevent OOM on large images */
  private readonly MAX_DIMENSION = 2048;

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
          // Use toBlob + createObjectURL instead of toDataURL for memory efficiency
          pending.canvas.toBlob((blob) => {
            if (blob) {
              if (this.lastBlobUrl) {
                this.activeBlobUrls.delete(this.lastBlobUrl);
                URL.revokeObjectURL(this.lastBlobUrl);
              }
              const url = URL.createObjectURL(blob);
              this.lastBlobUrl = url;
              this.activeBlobUrls.add(url);
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
    settings: ProcessSettings,
  ): Promise<string | null> {
    const requestId = crypto.randomUUID();
    this.currentRequestId = requestId;

    // Cancel previous pending requests
    for (const [, pending] of this.pendingResolvers) {
      pending.resolve(null);
    }
    this.pendingResolvers.clear();

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
      return new Promise<string>((resolve, reject) => {
        c.toBlob((blob) => {
          if (blob) {
            if (this.lastBlobUrl) {
              this.activeBlobUrls.delete(this.lastBlobUrl);
              URL.revokeObjectURL(this.lastBlobUrl);
            }
            const url = URL.createObjectURL(blob);
            this.lastBlobUrl = url;
            this.activeBlobUrls.add(url);
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
    let procWidth = img.width;
    let procHeight = img.height;
    if (procWidth > this.MAX_DIMENSION || procHeight > this.MAX_DIMENSION) {
      const scale = this.MAX_DIMENSION / Math.max(procWidth, procHeight);
      procWidth = Math.round(procWidth * scale);
      procHeight = Math.round(procHeight * scale);
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
      };

      this.ensureWorker().postMessage(message, [bitmap]);
    });
  }

  clearImageCache() {
    this.imageCache.clear();
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
    // Release all tracked blob URLs
    for (const url of this.activeBlobUrls) {
      URL.revokeObjectURL(url);
    }
    this.activeBlobUrls.clear();
    this.lastBlobUrl = null;
  }
}

// Module-level singleton
export const processorService = new ImageProcessorService();
