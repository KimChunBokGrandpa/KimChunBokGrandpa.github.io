import {
  applyPixelationAndPalette,
  clearPaletteCachesExcept,
} from "../utils/colorQuantizer";
import { applyGlitch, type GlitchType } from "../utils/glitchEngine";
import { applyScaling, type RenderMode } from "../utils/scaleEngine";

export interface ImageWorkerMessage {
  id: string;
  imageBitmap: ImageBitmap;
  width: number;
  height: number;
  pixelSize: number;
  palette: string;
  glitchFilters?: Array<{ type: string; intensity: number }>;
  renderMode?: string;
}

export interface ImageWorkerResponse {
  id: string;
  processedData: ImageData;
  error?: string;
}

onmessage = (e: MessageEvent<ImageWorkerMessage>) => {
  const {
    id,
    imageBitmap,
    width,
    height,
    pixelSize,
    palette,
    glitchFilters,
    renderMode,
  } = e.data;

  try {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    }) as OffscreenCanvasRenderingContext2D;
    ctx.drawImage(imageBitmap, 0, 0);
    const sourceData = ctx.getImageData(0, 0, width, height);
    imageBitmap.close(); // Release memory

    let processedData = applyPixelationAndPalette(
      sourceData,
      pixelSize,
      palette,
    );

    // Clear cached color lookups for unused palettes
    clearPaletteCachesExcept(palette);

    if (glitchFilters && glitchFilters.length > 0) {
      for (const filter of glitchFilters) {
        if (filter.type && filter.type !== "none") {
          processedData = applyGlitch(
            processedData,
            filter.type as GlitchType,
            filter.intensity || 1,
          );
        }
      }
    }

    if (renderMode && renderMode === "hqx") {
      processedData = applyScaling(processedData, renderMode as RenderMode);
    }

    const response: ImageWorkerResponse = { id, processedData };
    postMessage(response, { transfer: [processedData.data.buffer] });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown processing error";
    postMessage({ id, error: message } as ImageWorkerResponse);
  }
};
