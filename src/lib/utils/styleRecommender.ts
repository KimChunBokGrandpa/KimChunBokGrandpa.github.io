import type { TranslationKey } from '$lib/i18n/en';
import { PRESETS } from '$lib/utils/presets';
import { recommendPalettes } from './paletteRecommender';

export interface StyleRecommendation {
  id: string;
  score: number;
  reasonKey: TranslationKey;
}

interface ImageStyleProfile {
  brightness: number;
  contrast: number;
  saturation: number;
  edgeDensity: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  if (edge0 === edge1) return value >= edge1 ? 1 : 0;
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function analyzeImageStyle(imageData: ImageData): ImageStyleProfile {
  const { data, width, height } = imageData;
  let pixels = 0;
  let brightnessSum = 0;
  let brightnessSqSum = 0;
  let saturationSum = 0;
  let edgeTotal = 0;
  let edgeSamples = 0;

  function luminanceAt(offset: number): number {
    return (
      (0.2126 * data[offset] + 0.7152 * data[offset + 1] + 0.0722 * data[offset + 2]) / 255
    );
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const alpha = data[offset + 3];
      if (alpha === 0) continue;

      const r = data[offset] / 255;
      const g = data[offset + 1] / 255;
      const b = data[offset + 2] / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const luminance = luminanceAt(offset);

      pixels += 1;
      brightnessSum += luminance;
      brightnessSqSum += luminance * luminance;
      saturationSum += max === 0 ? 0 : (max - min) / max;

      if (x + 1 < width) {
        const rightOffset = offset + 4;
        if (data[rightOffset + 3] !== 0) {
          edgeTotal += Math.abs(luminance - luminanceAt(rightOffset));
          edgeSamples += 1;
        }
      }

      if (y + 1 < height) {
        const downOffset = offset + width * 4;
        if (data[downOffset + 3] !== 0) {
          edgeTotal += Math.abs(luminance - luminanceAt(downOffset));
          edgeSamples += 1;
        }
      }
    }
  }

  if (pixels === 0) {
    return { brightness: 0, contrast: 0, saturation: 0, edgeDensity: 0 };
  }

  const brightness = brightnessSum / pixels;
  const variance = Math.max(0, brightnessSqSum / pixels - brightness * brightness);

  return {
    brightness,
    contrast: Math.sqrt(variance),
    saturation: saturationSum / pixels,
    edgeDensity: edgeSamples > 0 ? edgeTotal / edgeSamples : 0,
  };
}

function paletteAffinity(paletteId: string, rankMap: Map<string, number>): number {
  const rank = rankMap.get(paletteId);
  if (rank === undefined) return 0;
  return Math.max(0, 1 - rank * 0.16);
}

function scorePreset(presetId: string, profile: ImageStyleProfile): { score: number; reasonKey: TranslationKey } {
  const darkScene = smoothstep(0.55, 0.2, profile.brightness);
  const brightScene = smoothstep(0.35, 0.8, profile.brightness);
  const saturated = smoothstep(0.25, 0.75, profile.saturation);
  const vivid = smoothstep(0.35, 0.9, profile.saturation);
  const contrasty = smoothstep(0.08, 0.28, profile.contrast);
  const edgy = smoothstep(0.03, 0.15, profile.edgeDensity);
  const smooth = 1 - edgy;

  switch (presetId) {
    case 'gameboy':
      return {
        score: 0.9 * darkScene + 0.8 * contrasty + 0.25 * smooth,
        reasonKey: 'style_reason_contrast',
      };
    case 'nes':
      return {
        score: 0.65 * brightScene + 0.5 * saturated + 0.3 * contrasty,
        reasonKey: 'style_reason_arcade',
      };
    case 'pico8':
      return {
        score: 0.8 * saturated + 0.45 * contrasty + 0.2 * smooth,
        reasonKey: 'style_reason_bold_colors',
      };
    case 'retro_crt':
      return {
        score: 0.55 * contrasty + 0.35 * edgy + 0.2 * brightScene,
        reasonKey: 'style_reason_crt',
      };
    case 'broken_vhs':
      return {
        score: 0.55 * edgy + 0.35 * darkScene + 0.1 * contrasty,
        reasonKey: 'style_reason_vhs',
      };
    case 'cyberpunk':
      return {
        score: 0.95 * vivid + 0.55 * darkScene + 0.25 * contrasty,
        reasonKey: 'style_reason_neon',
      };
    case 'glitch_art':
      return {
        score: 0.55 * edgy + 0.35 * contrasty + 0.1 * saturated,
        reasonKey: 'style_reason_glitch',
      };
    case 'chaos':
      return {
        score: 0.45 * edgy + 0.45 * vivid + 0.05 * contrasty,
        reasonKey: 'style_reason_chaos',
      };
    case 'smooth_hqx':
      return {
        score: 0.9 * smooth + 0.45 * brightScene + 0.2 * saturated,
        reasonKey: 'style_reason_smooth',
      };
    case 'dither_fs':
      return {
        score: 0.7 * contrasty + 0.45 * smooth + 0.2 * darkScene,
        reasonKey: 'style_reason_dither',
      };
    default:
      return {
        score: 0,
        reasonKey: 'style_reason_balanced',
      };
  }
}

export function recommendStyles(imageData: ImageData, topN: number = 3): StyleRecommendation[] {
  const paletteRecommendations = recommendPalettes(imageData, 10);
  const paletteRankMap = new Map<string, number>(
    paletteRecommendations.map((rec, index) => [rec.id, index]),
  );
  const profile = analyzeImageStyle(imageData);

  return PRESETS
    .filter((preset) => preset.id !== 'original')
    .map((preset) => {
      const heuristic = scorePreset(preset.id, profile);
      return {
        id: preset.id,
        score: paletteAffinity(preset.palette, paletteRankMap) * 1.4 + heuristic.score,
        reasonKey: heuristic.reasonKey,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

export async function recommendStylesFromImage(
  imageSrc: string,
  topN: number = 3,
): Promise<StyleRecommendation[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const maxDim = 128;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        const scale = maxDim / Math.max(w, h);
        w = Math.max(1, Math.round(w * scale));
        h = Math.max(1, Math.round(h * scale));
      }
      const canvas = new OffscreenCanvas(w, h);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(recommendStyles(ctx.getImageData(0, 0, w, h), topN));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageSrc;
  });
}
