/**
 * Save Service — Handles exporting processed images.
 * Supports PNG, JPEG, and WebP formats with quality control.
 * Works in both Tauri (native dialog) and web (download) environments.
 */

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
  return new Promise<Blob>((resolve, reject) => {
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const mime = MIME_MAP[format];
      const q = format === "png" ? undefined : quality;
      c.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        },
        mime,
        q,
      );
    };
    img.onerror = () => reject(new Error("Failed to load image for save"));
    img.src = src;
  });
}

/**
 * Save the processed image.
 * @returns A result message string.
 */
export async function saveImage(
  processedImageSrc: string,
  options: SaveOptions = { format: "png", quality: 0.92 },
): Promise<string> {
  const blobData = await imageSrcToBlob(
    processedImageSrc,
    options.format,
    options.quality,
  );
  const ext = EXT_MAP[options.format];
  const filename = `retro_pixel_${Date.now()}.${ext}`;

  const isTauri = typeof window !== "undefined" && !!(window as any).__TAURI__;

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
      return "File saved successfully!";
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
    return "Image downloaded successfully!";
  }
}
