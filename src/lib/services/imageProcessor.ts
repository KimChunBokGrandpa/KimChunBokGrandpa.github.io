import type {
  ProcessingSettings,
  ImageWorkerMessage,
  ImageWorkerResponse,
} from "../types";
import { customPaletteStore } from "../stores/customPaletteStore.svelte";

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
  private workerErrorCount = 0;
  private static readonly MAX_WORKER_RETRIES = 3;
  private pendingResolvers = new Map<
    string,
    {
      resolve: (value: string | null) => void;
      reject: (reason: unknown) => void;
      onProgress?: (progress: number) => void;
    }
  >();
  private imageCache = new Map<string, HTMLImageElement>();
  private static readonly MAX_IMAGE_CACHE = 10;
  private lastBlobUrl: string | null = null;

  /** Maximum processing dimension to prevent OOM on large images */
  private readonly MAX_DIMENSION = 2048;
  /** HQx doubles resolution, so use stricter limit */
  private readonly MAX_DIMENSION_HQX = 1024;

  /** Cached last-rendered canvas for save without re-decode */
  private lastCanvas: HTMLCanvasElement | null = null;

  /** Last computed unique color count */
  private _lastColorCount = 0;

  /** Reusable canvas for early (no-worker) processing */
  private earlyCanvas: HTMLCanvasElement | null = null;
  /** Get or create a reusable canvas for early processing, resizing only when needed */
  private getOrCreateEarlyCanvas(w: number, h: number): HTMLCanvasElement {
    if (this.earlyCanvas) {
      if (this.earlyCanvas.width !== w) this.earlyCanvas.width = w;
      if (this.earlyCanvas.height !== h) this.earlyCanvas.height = h;
      return this.earlyCanvas;
    }
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    this.earlyCanvas = c;
    return c;
  }

  /** Revoke old blob URL and register new one */
  private replaceBlobUrl(newUrl: string): string {
    if (this.lastBlobUrl) {
      URL.revokeObjectURL(this.lastBlobUrl);
    }
    this.lastBlobUrl = newUrl;
    return newUrl;
  }

  private ensureWorker(): Worker {
    if (this.workerErrorCount >= ImageProcessorService.MAX_WORKER_RETRIES) {
      throw new Error('Worker crashed: max retries exceeded');
    }
    if (!this.worker) {
      this.worker = new Worker(
        new URL("../workers/imageWorker.ts", import.meta.url),
        { type: "module" },
      );
      this.worker.onmessage = (e: MessageEvent<ImageWorkerResponse>) => {
        const { id, type, processedData, colorCount, progress, error } = e.data;
        const pending = this.pendingResolvers.get(id);
        if (!pending) return;

        // Handle progress updates (don't resolve yet)
        if (type === 'progress' && progress !== undefined) {
          pending.onProgress?.(progress);
          return;
        }

        this.pendingResolvers.delete(id);
        // Reset error count on successful response
        this.workerErrorCount = 0;

        if (error) {
          pending.reject(new Error(error));
        } else {
          // Reconstruct ImageData to ensure buffer integrity after transfer
          const safeData = new ImageData(
            new Uint8ClampedArray(processedData.data),
            processedData.width,
            processedData.height,
          );

          // Use a dedicated canvas per result to avoid race condition:
          // toBlob is async, so a reused canvas could be overwritten by the next request
          const resultCanvas = document.createElement('canvas');
          resultCanvas.width = processedData.width;
          resultCanvas.height = processedData.height;
          const resultCtx = resultCanvas.getContext('2d');
          if (!resultCtx) {
            pending.reject(new Error("Failed to get 2d context for result"));
            return;
          }
          resultCtx.putImageData(safeData, 0, 0);
          this.lastCanvas = resultCanvas;
          if (colorCount !== undefined) this._lastColorCount = colorCount;
          // Use toBlob + createObjectURL instead of toDataURL for memory efficiency
          resultCanvas.toBlob((blob) => {
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
        this.workerErrorCount++;
        for (const [, pending] of this.pendingResolvers) {
          pending.reject(err);
        }
        this.pendingResolvers.clear();
        this.worker?.terminate();
        this.worker = null;
        if (this.workerErrorCount >= ImageProcessorService.MAX_WORKER_RETRIES) {
          console.error(`Worker failed ${this.workerErrorCount} times, stopping retries`);
        }
      };
    }
    return this.worker;
  }

  /** Evict the least-recently-used entry from the image cache */
  private evictLRU() {
    const oldest = this.imageCache.keys().next().value;
    if (oldest !== undefined) {
      this.imageCache.delete(oldest);
      // Revoke blob URLs to free memory — non-blob URLs are harmlessly ignored
      if (oldest.startsWith('blob:')) {
        URL.revokeObjectURL(oldest);
      }
    }
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    const cached = this.imageCache.get(src);
    if (cached) {
      // Move to end for LRU ordering
      this.imageCache.delete(src);
      this.imageCache.set(src, cached);
      return Promise.resolve(cached);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        img.onload = null;
        img.onerror = null;
        // Evict oldest entries until under limit
        while (this.imageCache.size >= ImageProcessorService.MAX_IMAGE_CACHE) {
          this.evictLRU();
        }
        this.imageCache.set(src, img);
        resolve(img);
      };
      img.onerror = () => { img.onload = null; img.onerror = null; reject(new Error("Failed to load image")); };
      img.src = src;
    });
  }

  /**
   * Handle images that need no worker processing (original settings).
   * Still converts to blob URL for save compatibility.
   */
  private async processWithoutWorker(
    imageSrc: string,
    requestId: string,
  ): Promise<string | null> {
    const img = await this.loadImage(imageSrc);
    if (this.currentRequestId !== requestId) return null;
    const c = this.getOrCreateEarlyCanvas(img.width, img.height);
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2d context");
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

  async processImage(
    imageSrc: string,
    settings: ProcessingSettings,
    onDimensionCapped?: (
      original: { w: number; h: number },
      capped: { w: number; h: number },
    ) => void,
    onProgress?: (progress: number) => void,
  ): Promise<string | null> {
    const requestId = crypto.randomUUID();
    this.currentRequestId = requestId;

    // Cancel previous pending requests — resolve as null (stale)
    if (this.pendingResolvers.size > 0) {
      for (const [, pending] of this.pendingResolvers) {
        pending.resolve(null);
      }
      this.pendingResolvers.clear();
    }

    // Early return: no processing needed
    if (
      settings.pixelSize <= 1 &&
      settings.palette === "original" &&
      settings.glitchFilters.length === 0 &&
      settings.renderMode !== "hqx" &&
      (!settings.ditherType || settings.ditherType === 'none')
    ) {
      return this.processWithoutWorker(imageSrc, requestId);
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
      this.pendingResolvers.set(requestId, { resolve, reject, onProgress });

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
        ditherType: settings.ditherType,
        customPaletteColors: settings.palette.startsWith('custom_')
          ? customPaletteStore.getPaletteById(settings.palette)?.colors
              ?.map(c => ({ r: c.r, g: c.g, b: c.b }))
          : undefined,
        effectLayers: settings.effectLayers?.map(l => ({ ...l })),
      };

      this.ensureWorker().postMessage(message, [bitmap]);
    });
  }

  clearImageCache() {
    this.imageCache.clear();
  }

  /** Remove a single entry from the image cache (e.g. before revoking its blob URL) */
  evictFromImageCache(src: string) {
    this.imageCache.delete(src);
  }

  /** Get the last rendered canvas for direct export (avoids re-decoding) */
  getLastCanvas(): HTMLCanvasElement | null {
    return this.lastCanvas;
  }

  /** Get the number of unique colors in the last processed image */
  getLastColorCount(): number {
    return this._lastColorCount;
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
