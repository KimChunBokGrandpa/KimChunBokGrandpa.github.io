/**
 * Recommend the best-matching built-in palettes for a given image.
 * Compares extracted image colors against each palette using average
 * minimum perceptual distance.
 */
import type { RGB } from './palettes';
import { palettes } from './palettes';
import { createCanvasSurface } from './canvasSurface';
import { extractPaletteFromImageData } from './paletteExtractor';

/** Weighted Euclidean distance (matches colorQuantizer) */
function distSq(a: RGB, b: RGB): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return 2 * dr * dr + 4 * dg * dg + 3 * db * db;
}

/**
 * Score a palette against extracted image colors.
 * Lower = better match. For each image color, find the closest palette color.
 * Returns the average of these minimum distances.
 */
function scorePalette(imageColors: RGB[], paletteColors: RGB[]): number {
  if (paletteColors.length === 0) return Infinity;

  let totalDist = 0;
  for (const ic of imageColors) {
    let minDist = Infinity;
    for (const pc of paletteColors) {
      const d = distSq(ic, pc);
      if (d < minDist) minDist = d;
    }
    totalDist += minDist;
  }
  return totalDist / imageColors.length;
}

export interface PaletteRecommendation {
  id: string;
  score: number; // lower = better
}

/**
 * Recommend top N palettes that best match the image.
 *
 * @param imageData - Image pixel data
 * @param topN - Number of recommendations (default 5)
 * @returns Sorted array of { id, score } (best first)
 */
export function recommendPalettes(
  imageData: ImageData,
  topN: number = 5,
): PaletteRecommendation[] {
  // Extract representative colors from the image (16 colors for comparison)
  const imageColors = extractPaletteFromImageData(imageData, 16);
  if (imageColors.length === 0) return [];

  const scores: PaletteRecommendation[] = [];

  for (const [id, colors] of Object.entries(palettes)) {
    if (id === 'original') continue;
    scores.push({ id, score: scorePalette(imageColors, colors) });
  }

  // Sort by score (ascending = best match first)
  scores.sort((a, b) => a.score - b.score);
  return scores.slice(0, topN);
}

/**
 * Async version that loads image from URL and recommends palettes.
 */
export async function recommendPalettesFromImage(
  imageSrc: string,
  topN: number = 5,
): Promise<PaletteRecommendation[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const maxDim = 128; // Small for speed — recommendation doesn't need precision
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        const scale = maxDim / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const { ctx } = createCanvasSurface(w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      resolve(recommendPalettes(imageData, topN));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageSrc;
  });
}
