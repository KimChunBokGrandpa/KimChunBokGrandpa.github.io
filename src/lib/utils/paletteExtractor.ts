/**
 * Extract dominant colors from an image using K-means++ clustering.
 * Produces a custom palette that captures the image's color essence.
 */
import type { RGB } from './palettes';

/** Sampling limit — skip pixels to keep clustering fast on large images */
const MAX_SAMPLE_PIXELS = 10000;

/** K-means++ initialization: pick initial centroids with weighted probability */
function initCentroids(pixels: RGB[], k: number): RGB[] {
  const centroids: RGB[] = [];
  // First centroid: random pixel
  centroids.push({ ...pixels[Math.floor(Math.random() * pixels.length)] });

  for (let c = 1; c < k; c++) {
    // Compute min distance from each pixel to nearest existing centroid
    const distances = pixels.map(p => {
      let minDist = Infinity;
      for (const cent of centroids) {
        const d = distSq(p, cent);
        if (d < minDist) minDist = d;
      }
      return minDist;
    });

    // Weighted random selection (probability proportional to distance²)
    const totalDist = distances.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalDist;
    for (let i = 0; i < distances.length; i++) {
      r -= distances[i];
      if (r <= 0) {
        centroids.push({ ...pixels[i] });
        break;
      }
    }
    // Fallback if floating point drift
    if (centroids.length <= c) {
      centroids.push({ ...pixels[Math.floor(Math.random() * pixels.length)] });
    }
  }

  return centroids;
}

function distSq(a: RGB, b: RGB): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  // Perceptual weighting (same as colorQuantizer: R:2, G:4, B:3)
  return 2 * dr * dr + 4 * dg * dg + 3 * db * db;
}

/** Run K-means clustering on pixel data */
function kMeans(pixels: RGB[], k: number, maxIter: number = 20): RGB[] {
  if (pixels.length === 0) return [];
  if (pixels.length <= k) return pixels.map(p => ({ ...p }));

  let centroids = initCentroids(pixels, k);

  for (let iter = 0; iter < maxIter; iter++) {
    // Assign each pixel to nearest centroid
    const clusters: RGB[][] = Array.from({ length: k }, () => []);

    for (const p of pixels) {
      let minDist = Infinity;
      let minIdx = 0;
      for (let i = 0; i < centroids.length; i++) {
        const d = distSq(p, centroids[i]);
        if (d < minDist) {
          minDist = d;
          minIdx = i;
        }
      }
      clusters[minIdx].push(p);
    }

    // Recompute centroids as cluster means
    let converged = true;
    const newCentroids: RGB[] = [];

    for (let i = 0; i < k; i++) {
      const cluster = clusters[i];
      if (cluster.length === 0) {
        // Empty cluster: re-seed from random pixel
        newCentroids.push({ ...pixels[Math.floor(Math.random() * pixels.length)] });
        converged = false;
        continue;
      }

      const avg: RGB = {
        r: Math.round(cluster.reduce((s, p) => s + p.r, 0) / cluster.length),
        g: Math.round(cluster.reduce((s, p) => s + p.g, 0) / cluster.length),
        b: Math.round(cluster.reduce((s, p) => s + p.b, 0) / cluster.length),
      };

      if (avg.r !== centroids[i].r || avg.g !== centroids[i].g || avg.b !== centroids[i].b) {
        converged = false;
      }
      newCentroids.push(avg);
    }

    centroids = newCentroids;
    if (converged) break;
  }

  return centroids;
}

/** Sort colors by perceptual luminance (dark to light) */
function sortByLuminance(colors: RGB[]): RGB[] {
  return [...colors].sort((a, b) => {
    const la = 0.299 * a.r + 0.587 * a.g + 0.114 * a.b;
    const lb = 0.299 * b.r + 0.587 * b.g + 0.114 * b.b;
    return la - lb;
  });
}

/** Remove near-duplicate colors (within perceptual threshold) */
function deduplicateColors(colors: RGB[], threshold: number = 500): RGB[] {
  const result: RGB[] = [];
  for (const c of colors) {
    const isDupe = result.some(r => distSq(r, c) < threshold);
    if (!isDupe) result.push(c);
  }
  return result;
}

/**
 * Extract a palette from image pixel data using K-means++ clustering.
 *
 * @param imageData - Raw ImageData from a canvas
 * @param colorCount - Desired number of colors (2-64)
 * @returns Sorted RGB palette
 */
export function extractPaletteFromImageData(
  imageData: ImageData,
  colorCount: number = 8,
): RGB[] {
  const { data, width, height } = imageData;
  const totalPixels = width * height;
  const k = Math.max(2, Math.min(64, colorCount));

  // Sample pixels (skip transparent and subsample large images)
  const step = Math.max(1, Math.floor(totalPixels / MAX_SAMPLE_PIXELS));
  const samples: RGB[] = [];

  for (let i = 0; i < totalPixels; i += step) {
    const idx = i * 4;
    const a = data[idx + 3];
    if (a < 128) continue; // skip transparent
    samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
  }

  if (samples.length === 0) return [];

  // Run K-means with extra clusters, then deduplicate
  const raw = kMeans(samples, Math.min(k + 2, samples.length));
  const deduped = deduplicateColors(raw);
  const sorted = sortByLuminance(deduped);

  // Trim to requested count
  return sorted.slice(0, k);
}

/**
 * Extract palette from an image URL (loads onto canvas to get pixel data).
 *
 * @param imageSrc - URL or blob URL of the image
 * @param colorCount - Desired number of colors
 * @returns Promise resolving to sorted RGB palette
 */
export async function extractPaletteFromImage(
  imageSrc: string,
  colorCount: number = 8,
): Promise<RGB[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Downsample large images for speed
      const maxDim = 256;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        const scale = maxDim / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }

      const canvas = new OffscreenCanvas(w, h);
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context unavailable')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      resolve(extractPaletteFromImageData(imageData, colorCount));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageSrc;
  });
}
