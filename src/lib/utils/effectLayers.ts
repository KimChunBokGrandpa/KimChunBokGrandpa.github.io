import type {
  EffectLayer,
  GlitchFilter,
  RenderMode,
} from '$lib/types';
import { applyGlitch } from '$lib/utils/glitchEngine';
import { getEffectWeight } from '$lib/utils/effectRegistry';
import { ensureBuiltInEffectsRegistered } from '$lib/utils/effects';
import { applyScaling } from '$lib/utils/scaleEngine';

interface EffectLayerSource {
  renderMode?: RenderMode;
  effectLayers?: EffectLayer[];
  glitchFilters?: GlitchFilter[];
}

interface ApplyEffectLayersOptions {
  layers: EffectLayer[];
  glitchSeed?: number | null;
  getLayerSeed?: (layer: EffectLayer, index: number) => number | undefined;
  onProgress?: (progress: number) => void;
}

const HQX_EFFECT_WEIGHT = 4;
const DEFAULT_COLOR_SAMPLE_THRESHOLD = 500_000;

export function hasActiveHqxLayer(settings: EffectLayerSource): boolean {
  return normalizeEffectLayers(settings).some((layer) => layer.type === 'hqx');
}

export function countActiveEffectLayers(settings: EffectLayerSource): number {
  return normalizeEffectLayers(settings).length;
}

export function normalizeEffectLayers(
  settings: EffectLayerSource,
): EffectLayer[] {
  if (settings.effectLayers && settings.effectLayers.length > 0) {
    return settings.effectLayers.filter((layer) => layer.enabled);
  }

  const layers: EffectLayer[] = (settings.glitchFilters ?? [])
    .filter((filter) => filter.type !== 'none')
    .map((filter, index) => ({
      id: `legacy-${index}`,
      type: 'glitch',
      enabled: true,
      glitchType: filter.type,
      intensity: filter.intensity,
    }));

  if (settings.renderMode === 'hqx') {
    layers.push({
      id: 'legacy-hqx',
      type: 'hqx',
      enabled: true,
      intensity: 1,
    });
  }

  return layers;
}

function getLayerWeight(layer: EffectLayer): number {
  if (layer.type === 'hqx') return HQX_EFFECT_WEIGHT;
  const key = layer.type === 'glitch' ? (layer.glitchType || 'noise') : layer.type;
  return getEffectWeight(key);
}

export function applyEffectLayers(
  imageData: ImageData,
  options: ApplyEffectLayersOptions,
): ImageData {
  ensureBuiltInEffectsRegistered();

  let processedData = imageData;
  const totalWeight = options.layers.reduce(
    (sum, layer) => sum + getLayerWeight(layer),
    0,
  );
  let completedWeight = 0;

  for (const [index, layer] of options.layers.entries()) {
    if (layer.type === 'glitch' && layer.glitchType && layer.glitchType !== 'none') {
      processedData = applyGlitch(
        processedData,
        layer.glitchType,
        layer.intensity || 1,
        options.getLayerSeed?.(layer, index) ?? options.glitchSeed ?? undefined,
      );
    } else if (layer.type === 'hqx') {
      processedData = applyScaling(processedData, 'hqx');
    }

    completedWeight += getLayerWeight(layer);
    if (totalWeight > 0) {
      options.onProgress?.(completedWeight / totalWeight);
    }
  }

  return processedData;
}

export function countVisibleColors(
  imageData: ImageData,
  sampleThreshold: number = DEFAULT_COLOR_SAMPLE_THRESHOLD,
): number {
  const colorSet = new Set<number>();
  const pixels = imageData.data;
  const totalPixels = pixels.length / 4;
  const step = totalPixels > sampleThreshold
    ? Math.ceil(totalPixels / sampleThreshold) * 4
    : 4;

  for (let index = 0; index < pixels.length; index += step) {
    if (pixels[index + 3] < 128) continue;
    colorSet.add((pixels[index] << 16) | (pixels[index + 1] << 8) | pixels[index + 2]);
  }

  return colorSet.size;
}
