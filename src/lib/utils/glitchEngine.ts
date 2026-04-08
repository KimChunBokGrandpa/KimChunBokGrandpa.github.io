/**
 * Glitch Engine - Applies registered effect modules to ImageData.
 * Built-in effects are initialized lazily so consumers do not rely on side-effect imports.
 */

import type { GlitchType } from "../types";
import { getEffect } from "./effectRegistry";
import { ensureBuiltInEffectsRegistered } from "./effects";

export const applyGlitch = (
  imageData: ImageData,
  glitchType: GlitchType,
  intensity: number = 1,
  seed: number = Math.random(),
): ImageData => {
  if (glitchType === "none" || !glitchType || intensity < 1) {
    return imageData;
  }

  ensureBuiltInEffectsRegistered();
  const effect = getEffect(glitchType);
  if (!effect) return imageData;

  return effect.apply(imageData, intensity, seed);
};
