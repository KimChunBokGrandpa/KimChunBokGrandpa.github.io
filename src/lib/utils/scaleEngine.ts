/**
 * Scale Engine - Applies advanced pixel art scaling algorithms like EPX/Scale2x or HQx.
 * Operates purely on pixel arrays for Web Worker compatibility.
 */

import type { RenderMode } from "../types";

export const applyScaling = (
  imageData: ImageData,
  renderMode: RenderMode,
): ImageData => {
  if (renderMode !== "hqx") {
    return imageData; // Other modes are handled via CSS image-rendering or WebGL, no need for software upscaling here
  }

  // Implements a simplified Scale2x (EPX algorithm) for "HQx" feel on pixel art
  // which works by doubling the resolution and rounding edges.
  const { width, height, data } = imageData;
  const sw = width;
  const sh = height;

  const targetW = sw * 2;
  const targetH = sh * 2;
  const targetData = new Uint8ClampedArray(targetW * targetH * 4);

  const getIdx = (x: number, y: number, w: number) => (y * w + x) * 4;

  const getPixel = (x: number, y: number) => {
    // Clamp to edge
    x = Math.max(0, Math.min(sw - 1, x));
    y = Math.max(0, Math.min(sh - 1, y));
    const i = getIdx(x, y, sw);
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
  };

  const isSameColor = (p1: number[], p2: number[]) => {
    return (
      p1[0] === p2[0] && p1[1] === p2[1] && p1[2] === p2[2] && p1[3] === p2[3]
    );
  };

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const P = getPixel(x, y);
      const A = getPixel(x, y - 1); // Top
      const C = getPixel(x - 1, y); // Left
      const B = getPixel(x + 1, y); // Right
      const D = getPixel(x, y + 1); // Bottom

      /*
        EPX / Scale2x algorithm logic:
        A
      C P B
        D
      
      E0 E1
      E2 E3
      */

      let E0 = P,
        E1 = P,
        E2 = P,
        E3 = P;

      if (
        !isSameColor(C, A) &&
        !isSameColor(C, D) &&
        !isSameColor(A, B) &&
        !isSameColor(B, D)
      ) {
        if (isSameColor(C, A)) E0 = A;
        if (isSameColor(A, B)) E1 = B;
        if (isSameColor(C, D)) E2 = C;
        if (isSameColor(D, B)) E3 = D;
      }

      // Write doubled pixels
      const tx = x * 2;
      const ty = y * 2;

      const writePx = (px: number, py: number, color: number[]) => {
        const idx = getIdx(px, py, targetW);
        targetData[idx] = color[0];
        targetData[idx + 1] = color[1];
        targetData[idx + 2] = color[2];
        targetData[idx + 3] = color[3];
      };

      writePx(tx, ty, E0);
      writePx(tx + 1, ty, E1);
      writePx(tx, ty + 1, E2);
      writePx(tx + 1, ty + 1, E3);
    }
  }

  return new ImageData(targetData, targetW, targetH);
};
