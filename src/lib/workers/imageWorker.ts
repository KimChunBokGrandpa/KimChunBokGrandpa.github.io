import {
  applyPixelationAndPalette,
  clearPaletteCachesExcept,
} from "../utils/colorQuantizer";
import { applyGlitch } from "../utils/glitchEngine";
import { applyScaling } from "../utils/scaleEngine";
import type {
  EffectLayer,
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
    effectLayers,
  } = e.data;

  // Validate required fields
  if (!id || !imageBitmap || !width || !height) {
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

    // Use effectLayers if present, otherwise fall back to legacy fields
    const hasEffectLayers = effectLayers && effectLayers.length > 0;

    if (hasEffectLayers) {
      const enabledLayers = effectLayers.filter((l: EffectLayer) => l.enabled);
      const totalLayers = enabledLayers.length;
      for (let i = 0; i < totalLayers; i++) {
        const layer = enabledLayers[i];
        if (layer.type === 'glitch' && layer.glitchType && layer.glitchType !== 'none') {
          processedData = applyGlitch(
            processedData,
            layer.glitchType,
            layer.intensity || 1,
            glitchSeed ?? undefined,
          );
        } else if (layer.type === 'hqx') {
          processedData = applyScaling(processedData, 'hqx');
        }
        postMessage({ id, type: 'progress', progress: 0.4 + 0.5 * ((i + 1) / totalLayers) } as ImageWorkerResponse);
      }
    } else {
      // Legacy path: glitchFilters then hqx
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
