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

  // Use Uint32 views for fast single-op pixel copy
  const src32 = new Uint32Array(data.buffer, data.byteOffset, data.length / 4);
  const dst32 = new Uint32Array(targetData.buffer, targetData.byteOffset, targetData.length / 4);

  // Returns the pixel index for (x, y), clamped to image edges.
  const getIdx = (x: number, y: number): number => {
    x = Math.max(0, Math.min(sw - 1, x));
    y = Math.max(0, Math.min(sh - 1, y));
    return y * sw + x;
  };

  const isSame = (i1: number, i2: number): boolean => src32[i1] === src32[i2];

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const P = getIdx(x, y);
      const A = getIdx(x, y - 1); // Top
      const C = getIdx(x - 1, y); // Left
      const B = getIdx(x + 1, y); // Right
      const D = getIdx(x, y + 1); // Bottom

      /*
        EPX / Scale2x algorithm logic:
        A
      C P B
        D

      E0 E1
      E2 E3
      */

      let e0 = P, e1 = P, e2 = P, e3 = P;

      if (!isSame(C, B) && !isSame(A, D)) {
        if (isSame(C, A)) e0 = A;
        if (isSame(A, B)) e1 = B;
        if (isSame(C, D)) e2 = C;
        if (isSame(D, B)) e3 = D;
      }

      // Write doubled pixels (single Uint32 assignment per pixel)
      const tx = x * 2;
      const ty = y * 2;
      dst32[ty * targetW + tx] = src32[e0];
      dst32[ty * targetW + tx + 1] = src32[e1];
      dst32[(ty + 1) * targetW + tx] = src32[e2];
      dst32[(ty + 1) * targetW + tx + 1] = src32[e3];
    }
  }

  return new ImageData(targetData, targetW, targetH);
};
