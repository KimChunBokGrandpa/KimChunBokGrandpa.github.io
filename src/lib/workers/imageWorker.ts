import {
  applyPixelationAndPalette,
  clearPaletteCachesExcept,
} from "../utils/colorQuantizer";
import { applyGlitch } from "../utils/glitchEngine";
import { applyScaling } from "../utils/scaleEngine";
import type {
  ImageWorkerMessage,
  ImageWorkerResponse,
} from "../types";

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
    glitchSeed,
    ditherType,
    customPaletteColors,
  } = e.data;

  try {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    }) as OffscreenCanvasRenderingContext2D;
    ctx.drawImage(imageBitmap, 0, 0);
    const sourceData = ctx.getImageData(0, 0, width, height);
    imageBitmap.close(); // Release memory

    // Report progress: quantization starting
    postMessage({ id, type: 'progress', progress: 0.1 } as ImageWorkerResponse);

    let processedData = applyPixelationAndPalette(
      sourceData,
      pixelSize,
      palette,
      ditherType || 'none',
      customPaletteColors,
    );

    // Clear cached color lookups for unused palettes
    clearPaletteCachesExcept(palette);

    postMessage({ id, type: 'progress', progress: 0.4 } as ImageWorkerResponse);

    if (glitchFilters && glitchFilters.length > 0) {
      for (const filter of glitchFilters) {
        if (filter.type && filter.type !== "none") {
          processedData = applyGlitch(
            processedData,
            filter.type,
            filter.intensity || 1,
            glitchSeed ?? undefined,
          );
        }
      }
    }

    postMessage({ id, type: 'progress', progress: 0.7 } as ImageWorkerResponse);

    if (renderMode === "hqx") {
      processedData = applyScaling(processedData, renderMode);
    }

    postMessage({ id, type: 'progress', progress: 0.9 } as ImageWorkerResponse);

    // Count unique colors
    const colorSet = new Set<number>();
    const pd = processedData.data;
    for (let i = 0; i < pd.length; i += 4) {
      if (pd[i + 3] < 128) continue; // skip transparent
      colorSet.add((pd[i] << 16) | (pd[i + 1] << 8) | pd[i + 2]);
    }

    const response: ImageWorkerResponse = { id, type: 'complete', processedData, colorCount: colorSet.size };
    postMessage(response, { transfer: [processedData.data.buffer] });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown processing error";
    postMessage({ id, error: message } as ImageWorkerResponse);
  }
};
