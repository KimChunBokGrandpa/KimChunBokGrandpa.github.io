import { clearPaletteCachesExcept } from "../utils/colorQuantizer";
import { applyQuantizationAsync } from "../utils/quantizerBackend";
import {
  applyEffectLayers,
  countVisibleColors,
  normalizeEffectLayers,
} from "../utils/effectLayers";
import type {
  ImageWorkerMessage,
  ImageWorkerResponse,
} from "../types";

onmessage = async (e: MessageEvent<ImageWorkerMessage>) => {
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
    useOklab,
    quantizationBackend,
    customPaletteColors,
    effectLayers,
  } = e.data;

  // Validate required fields (explicit > 0 check prevents OffscreenCanvas(0, 0) error)
  if (!id || !imageBitmap || !(width > 0) || !(height > 0)) {
    const errorId = id || 'unknown';
    postMessage({ id: errorId, type: 'complete', error: 'Invalid worker message: missing required fields' } as ImageWorkerResponse);
    return;
  }

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

    let processedData = await applyQuantizationAsync({
      imageData: sourceData,
      pixelSize,
      palette,
      ditherType: ditherType || 'none',
      customPaletteColors,
      useOklab,
      backend: quantizationBackend,
    });

    // Clear cached color lookups for unused palettes
    clearPaletteCachesExcept(palette);

    postMessage({ id, type: 'progress', progress: 0.4 } as ImageWorkerResponse);

    const layers = normalizeEffectLayers({ effectLayers, glitchFilters, renderMode });
    processedData = applyEffectLayers(processedData, {
      layers,
      glitchSeed,
      onProgress: (layerProgress) => {
        postMessage({ id, type: 'progress', progress: 0.4 + 0.5 * layerProgress } as ImageWorkerResponse);
      },
    });

    postMessage({ id, type: 'progress', progress: 0.9 } as ImageWorkerResponse);

    const response: ImageWorkerResponse = {
      id,
      type: 'complete',
      processedData,
      colorCount: countVisibleColors(processedData),
    };
    postMessage(response, { transfer: [processedData.data.buffer] });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown processing error";
    postMessage({ id, error: message } as ImageWorkerResponse);
  }
};
