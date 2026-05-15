/**
 * Save Service — Handles exporting processed images.
 * Supports PNG, JPEG, and WebP formats with quality control.
 * Works in both Tauri (native dialog) and web (download) environments.
 */

import { isTauriRuntime } from "../utils/env";
import { i18n } from "$lib/i18n/index.svelte";

export type SaveFormat = "png" | "jpeg" | "webp";

export interface SaveOptions {
  format: SaveFormat;
  quality: number; // 0.0 ~ 1.0 (only for JPEG/WebP)
  filename?: string; // Custom filename (without extension)
}

export interface ImageExportInput {
  processedImageSrc: string;
  sourceCanvas?: HTMLCanvasElement | null;
  cssFilter?: string;
  filename?: string;
}

const mimeMap: Record<SaveFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

const extMap: Record<SaveFormat, string> = {
  png: "png",
  jpeg: "jpg",
  webp: "webp",
};

/** Timeout for image loading in imageSrcToBlob to prevent indefinite hangs */
const imageLoadTimeoutMs = 30_000;

/**
 * Load an image src into a canvas and export as Blob.
 * This avoids blob: URL fetch issues in Tauri.
 */
async function imageSrcToBlob(
  src: string,
  format: SaveFormat,
  quality: number,
): Promise<Blob> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  return new Promise<HTMLCanvasElement>((resolve, reject) => {
    const timer = setTimeout(() => {
      img.src = "";
      reject(new Error("Image load timed out"));
    }, imageLoadTimeoutMs);

    img.onload = () => {
      clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get 2d context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(c);
    };
    img.onerror = () => {
      clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
      reject(new Error("Failed to load image for save"));
    };
    img.src = src;
  }).then((canvas) => canvasToBlob(canvas, format, quality));
}

/**
 * Convert a canvas directly to Blob (avoids re-decoding from URL).
 */
const blobTimeoutMs = 10_000;
const downloadUrlRevokeDelayMs = 1_000;

function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: SaveFormat,
  quality: number,
): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("toBlob timed out"));
    }, blobTimeoutMs);
    const mime = mimeMap[format];
    const q = format === "png" ? undefined : quality;
    canvas.toBlob(
      (blob) => {
        clearTimeout(timer);
        if (blob) resolve(blob);
        else reject(new Error("Failed to create blob from canvas"));
      },
      mime,
      q,
    );
  });
}

function resolveFilename(options: SaveOptions): string {
  const ext = extMap[options.format];
  return options.filename
    ? `${options.filename}.${ext}`
    : `retro_pixel_${Date.now()}.${ext}`;
}

async function buildBlobData(
  processedImageSrc: string,
  options: SaveOptions,
  sourceCanvas?: HTMLCanvasElement | null,
  cssFilter?: string,
): Promise<Blob> {
  if (cssFilter && sourceCanvas) {
    const filtered = document.createElement("canvas");
    filtered.width = sourceCanvas.width;
    filtered.height = sourceCanvas.height;
    const fctx = filtered.getContext("2d");
    if (!fctx) throw new Error("Failed to get 2d context for filtered canvas");
    fctx.filter = cssFilter;
    fctx.drawImage(sourceCanvas, 0, 0);
    return canvasToBlob(filtered, options.format, options.quality);
  }

  if (sourceCanvas) {
    return canvasToBlob(sourceCanvas, options.format, options.quality);
  }

  return imageSrcToBlob(processedImageSrc, options.format, options.quality);
}

async function buildExportFile(
  processedImageSrc: string,
  options: SaveOptions,
  sourceCanvas?: HTMLCanvasElement | null,
  cssFilter?: string,
): Promise<File> {
  const blobData = await buildBlobData(processedImageSrc, options, sourceCanvas, cssFilter);
  const mime = mimeMap[options.format];
  return new File([blobData], resolveFilename(options), { type: mime });
}

function triggerBrowserDownload(file: File): string {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, downloadUrlRevokeDelayMs);
  return i18n.t('image_downloaded');
}

async function shareFiles(files: File[]): Promise<string> {
  const canShareFiles = typeof navigator.share === 'function'
    && (typeof navigator.canShare !== 'function' || navigator.canShare({ files }));

  if (!canShareFiles) {
    throw new Error(i18n.t('share_not_supported'));
  }

  try {
    await navigator.share({ files });
    return i18n.t('image_shared');
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return '';
    }
    throw err;
  }
}

/**
 * Save the processed image.
 * @param sourceCanvas - Optional pre-rendered canvas to avoid re-decoding.
 * @returns A result message string.
 */
export async function saveImage(
  processedImageSrc: string,
  options: SaveOptions = { format: "png", quality: 0.92 },
  sourceCanvas?: HTMLCanvasElement | null,
  cssFilter?: string,
): Promise<string> {
  const blobData = await buildBlobData(processedImageSrc, options, sourceCanvas, cssFilter);
  const ext = extMap[options.format];
  const filename = resolveFilename(options);

  if (isTauriRuntime()) {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeFile } = await import("@tauri-apps/plugin-fs");
    const filePath = await save({
      filters: [{ name: "Image", extensions: [ext] }],
      defaultPath: filename,
    });
    if (filePath) {
      try {
        const arrayBuffer = await blobData.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        await writeFile(filePath, bytes);
        return i18n.t('file_saved');
      } catch (err) {
        throw new Error(`Failed to write file: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    return ""; // User cancelled
  }

  const mime = mimeMap[options.format];
  const file = new File([blobData], filename, { type: mime });
  return triggerBrowserDownload(file);
}

export async function shareImage(
  processedImageSrc: string,
  options: SaveOptions = { format: "png", quality: 0.92 },
  sourceCanvas?: HTMLCanvasElement | null,
  cssFilter?: string,
): Promise<string> {
  const file = await buildExportFile(processedImageSrc, options, sourceCanvas, cssFilter);
  return shareFiles([file]);
}

export async function shareImageFiles(
  inputs: ImageExportInput[],
  options: Omit<SaveOptions, 'filename'> = { format: "png", quality: 0.92 },
): Promise<string> {
  const files = await Promise.all(inputs.map((input) =>
    buildExportFile(
      input.processedImageSrc,
      { ...options, filename: input.filename },
      input.sourceCanvas,
      input.cssFilter,
    )
  ));
  return shareFiles(files);
}
