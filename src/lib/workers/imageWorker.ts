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

    // Effect weight map: heavier effects get proportionally more progress
    const EFFECT_WEIGHTS: Record<string, number> = {
      noise: 1,
      rgb_split: 1,
      wave: 2,
      slice: 3,
      hqx: 4,
    };

    // Normalize: convert legacy glitchFilters + renderMode into unified effectLayers
    let layers: EffectLayer[];
    if (effectLayers && effectLayers.length > 0) {
      layers = effectLayers.filter((l: EffectLayer) => l.enabled);
    } else {
      // Build layers from legacy fields for backward compatibility
      layers = [];
      if (glitchFilters && glitchFilters.length > 0) {
        for (let fi = 0; fi < glitchFilters.length; fi++) {
          const filter = glitchFilters[fi];
          if (filter.type && filter.type !== 'none') {
            layers.push({ id: `legacy-${fi}`, type: 'glitch', glitchType: filter.type, intensity: filter.intensity || 1, enabled: true });
          }
        }
      }
      if (renderMode === 'hqx') {
        layers.push({ id: 'legacy-hqx', type: 'hqx', enabled: true, intensity: 1 });
      }
    }

    // Apply effect layers with progress tracking
    const totalWeight = layers.reduce((sum, l) => {
      const key = l.type === 'glitch' ? (l.glitchType || 'noise') : l.type;
      return sum + (EFFECT_WEIGHTS[key] || 1);
    }, 0);
    let completedWeight = 0;

    for (const layer of layers) {
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
      const key = layer.type === 'glitch' ? (layer.glitchType || 'noise') : layer.type;
      completedWeight += EFFECT_WEIGHTS[key] || 1;
      const layerProgress = totalWeight > 0 ? completedWeight / totalWeight : 1;
      postMessage({ id, type: 'progress', progress: 0.4 + 0.5 * layerProgress } as ImageWorkerResponse);
    }

    postMessage({ id, type: 'progress', progress: 0.9 } as ImageWorkerResponse);

    // Count unique colors (sample for large images to reduce overhead)
    const colorSet = new Set<number>();
    const pd = processedData.data;
    const totalPixels = pd.length / 4;
    const SAMPLE_THRESHOLD = 500_000;
    const step = totalPixels > SAMPLE_THRESHOLD ? Math.ceil(totalPixels / SAMPLE_THRESHOLD) * 4 : 4;
    for (let i = 0; i < pd.length; i += step) {
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
