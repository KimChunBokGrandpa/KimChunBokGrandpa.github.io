import type { ProcessingSettings } from '$lib/types';
import type { RGB } from './palettes';
import { applyQuantization } from './quantizerBackend';
import { applyCrtEffect } from './crtRenderer';
import { customPaletteStore } from '$lib/stores/customPaletteStore.svelte';
import { applyEffectLayers, normalizeEffectLayers } from './effectLayers';

export interface PresetPreviewInput {
  id?: string;
  name?: string;
  settings: ProcessingSettings;
}

const previewWidth = 84;
const previewHeight = 60;
const sourceWidth = 56;
const sourceHeight = 40;

const previewCache = new Map<string, Promise<string>>();

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getCustomPaletteColors(paletteId: string): RGB[] | undefined {
  return paletteId.startsWith('custom_')
    ? customPaletteStore.getPaletteById(paletteId)?.colors
    : undefined;
}

function createSampleCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = sourceWidth;
  canvas.height = sourceHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2d context for preset preview');

  const sky = ctx.createLinearGradient(0, 0, 0, sourceHeight);
  sky.addColorStop(0, '#10203b');
  sky.addColorStop(0.55, '#e57a4f');
  sky.addColorStop(1, '#f0d285');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, sourceWidth, sourceHeight);

  ctx.fillStyle = '#2d5a2b';
  ctx.fillRect(0, sourceHeight * 0.62, sourceWidth, sourceHeight * 0.38);

  ctx.fillStyle = '#fee28a';
  ctx.beginPath();
  ctx.arc(sourceWidth * 0.72, sourceHeight * 0.26, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#33456e';
  ctx.beginPath();
  ctx.moveTo(0, sourceHeight * 0.62);
  ctx.lineTo(10, sourceHeight * 0.34);
  ctx.lineTo(22, sourceHeight * 0.58);
  ctx.lineTo(34, sourceHeight * 0.28);
  ctx.lineTo(46, sourceHeight * 0.55);
  ctx.lineTo(sourceWidth, sourceHeight * 0.4);
  ctx.lineTo(sourceWidth, sourceHeight * 0.62);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#0f1728';
  ctx.fillRect(6, 20, 5, 18);
  ctx.fillRect(14, 16, 7, 22);
  ctx.fillRect(24, 22, 6, 16);
  ctx.fillRect(33, 18, 8, 20);
  ctx.fillRect(44, 24, 6, 14);

  ctx.fillStyle = '#8cf0ff';
  ctx.fillRect(8, 24, 1, 2);
  ctx.fillRect(17, 20, 1, 2);
  ctx.fillRect(36, 22, 1, 2);

  return canvas;
}

function renderPresetPreview(input: PresetPreviewInput): string {
  const seedBase = hashString(`${input.id ?? input.name ?? 'preset'}:${JSON.stringify(input.settings)}`);
  const customPaletteColors = getCustomPaletteColors(input.settings.palette);

  const sampleCanvas = createSampleCanvas();
  const sampleCtx = sampleCanvas.getContext('2d');
  if (!sampleCtx) throw new Error('Failed to get 2d context for sample image');

  let imageData = sampleCtx.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height);
  imageData = applyQuantization({
    imageData,
    pixelSize: input.settings.pixelSize,
    palette: input.settings.palette,
    ditherType: input.settings.ditherType ?? 'none',
    customPaletteColors,
    useOklab: input.settings.useOklab,
  });

  const layers = normalizeEffectLayers(input.settings);
  imageData = applyEffectLayers(imageData, {
    layers,
    getLayerSeed: (_, index) => seedBase + index,
  });

  const processedCanvas = document.createElement('canvas');
  processedCanvas.width = imageData.width;
  processedCanvas.height = imageData.height;
  const processedCtx = processedCanvas.getContext('2d');
  if (!processedCtx) throw new Error('Failed to get 2d context for processed preview');
  processedCtx.putImageData(imageData, 0, 0);

  const crtCanvas = applyCrtEffect(processedCanvas, input.settings.crtEffect);

  const previewCanvas = document.createElement('canvas');
  previewCanvas.width = previewWidth;
  previewCanvas.height = previewHeight;
  const previewCtx = previewCanvas.getContext('2d');
  if (!previewCtx) throw new Error('Failed to get 2d context for final preview');
  previewCtx.imageSmoothingEnabled = false;
  previewCtx.fillStyle = '#000';
  previewCtx.fillRect(0, 0, previewWidth, previewHeight);

  const scale = Math.min(previewWidth / crtCanvas.width, previewHeight / crtCanvas.height);
  const drawW = Math.max(1, Math.floor(crtCanvas.width * scale));
  const drawH = Math.max(1, Math.floor(crtCanvas.height * scale));
  const dx = Math.floor((previewWidth - drawW) / 2);
  const dy = Math.floor((previewHeight - drawH) / 2);
  previewCtx.drawImage(crtCanvas, dx, dy, drawW, drawH);

  return previewCanvas.toDataURL('image/png');
}

export function getPresetPreviewCacheKey(input: PresetPreviewInput): string {
  const customPaletteColors = getCustomPaletteColors(input.settings.palette);
  return JSON.stringify({
    id: input.id ?? null,
    name: input.name ?? null,
    pixelSize: input.settings.pixelSize,
    palette: input.settings.palette,
    customPaletteColors,
    crtEffect: input.settings.crtEffect,
    glitchFilters: input.settings.glitchFilters,
    renderMode: input.settings.renderMode,
    ditherType: input.settings.ditherType,
    glitchSeed: input.settings.glitchSeed,
    useOklab: input.settings.useOklab ?? false,
    effectLayers: input.settings.effectLayers ?? [],
  });
}

export function clearPresetPreviewCache() {
  previewCache.clear();
}

export function getPresetPreview(input: PresetPreviewInput): Promise<string> {
  const key = getPresetPreviewCacheKey(input);
  if (!previewCache.has(key)) {
    previewCache.set(key, Promise.resolve(renderPresetPreview(input)));
  }
  return previewCache.get(key)!;
}
