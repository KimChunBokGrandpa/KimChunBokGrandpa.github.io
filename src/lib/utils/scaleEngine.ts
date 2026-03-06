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

  // Returns the byte offset for pixel (x, y) in a buffer of width w.
  // Clamps coordinates to the image edge.
  const getIdx = (x: number, y: number): number => {
    x = Math.max(0, Math.min(sw - 1, x));
    y = Math.max(0, Math.min(sh - 1, y));
    return (y * sw + x) * 4;
  };

  const isSame = (i1: number, i2: number): boolean =>
    data[i1] === data[i2] &&
    data[i1 + 1] === data[i2 + 1] &&
    data[i1 + 2] === data[i2 + 2] &&
    data[i1 + 3] === data[i2 + 3];

  const writeFrom = (tx: number, ty: number, srcIdx: number) => {
    const di = (ty * targetW + tx) * 4;
    targetData[di] = data[srcIdx];
    targetData[di + 1] = data[srcIdx + 1];
    targetData[di + 2] = data[srcIdx + 2];
    targetData[di + 3] = data[srcIdx + 3];
  };

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

      // Write doubled pixels
      const tx = x * 2;
      const ty = y * 2;
      writeFrom(tx, ty, e0);
      writeFrom(tx + 1, ty, e1);
      writeFrom(tx, ty + 1, e2);
      writeFrom(tx + 1, ty + 1, e3);
    }
  }

  return new ImageData(targetData, targetW, targetH);
};
