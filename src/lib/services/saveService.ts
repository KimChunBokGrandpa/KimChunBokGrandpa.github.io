/**
 * Save Service — Handles exporting processed images.
 * Supports PNG, JPEG, and WebP formats with quality control.
 * Works in both Tauri (native dialog) and web (download) environments.
 */

import { isTauri } from "../utils/env";
import { i18n } from "$lib/i18n/index.svelte";

export type SaveFormat = "png" | "jpeg" | "webp";

export interface SaveOptions {
  format: SaveFormat;
  quality: number; // 0.0 ~ 1.0 (only for JPEG/WebP)
}

const MIME_MAP: Record<SaveFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

const EXT_MAP: Record<SaveFormat, string> = {
  png: "png",
  jpeg: "jpg",
  webp: "webp",
};

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
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      resolve(c);
    };
    img.onerror = () => reject(new Error("Failed to load image for save"));
    img.src = src;
  }).then((canvas) => canvasToBlob(canvas, format, quality));
}

/**
 * Convert a canvas directly to Blob (avoids re-decoding from URL).
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: SaveFormat,
  quality: number,
): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const mime = MIME_MAP[format];
    const q = format === "png" ? undefined : quality;
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create blob from canvas"));
      },
      mime,
      q,
    );
  });
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
  let blobData: Blob;
  if (cssFilter && sourceCanvas) {
    // Re-draw with CSS filter applied via canvas.filter
    const filtered = document.createElement("canvas");
    filtered.width = sourceCanvas.width;
    filtered.height = sourceCanvas.height;
    const fctx = filtered.getContext("2d")!;
    fctx.filter = cssFilter;
    fctx.drawImage(sourceCanvas, 0, 0);
    blobData = await canvasToBlob(filtered, options.format, options.quality);
  } else if (sourceCanvas) {
    blobData = await canvasToBlob(sourceCanvas, options.format, options.quality);
  } else {
    blobData = await imageSrcToBlob(processedImageSrc, options.format, options.quality);
  }
  const ext = EXT_MAP[options.format];
  const filename = `retro_pixel_${Date.now()}.${ext}`;

  if (isTauri) {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeFile } = await import("@tauri-apps/plugin-fs");
    const filePath = await save({
      filters: [{ name: "Image", extensions: [ext] }],
      defaultPath: filename,
    });
    if (filePath) {
      const arrayBuffer = await blobData.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      await writeFile(filePath, bytes);
      return i18n.t('file_saved');
    }
    return ""; // User cancelled
  } else {
    const url = URL.createObjectURL(blobData);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return i18n.t('image_downloaded');
  }
}
