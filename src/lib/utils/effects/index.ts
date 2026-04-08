import { getRegisteredEffectIds, registerEffect, type EffectDefinition } from '../effectRegistry';
import { interlaceEffect } from './interlace';
import { noiseEffect } from './noise';
import { rgbSplitEffect } from './rgbSplit';
import { sliceEffect } from './slice';
import { vhsTrackingEffect } from './vhsTracking';
import { waveEffect } from './wave';

export const BUILT_IN_EFFECTS: EffectDefinition[] = [
  rgbSplitEffect,
  waveEffect,
  noiseEffect,
  sliceEffect,
  vhsTrackingEffect,
  interlaceEffect,
];

let builtInEffectsRegistered = false;

export function ensureBuiltInEffectsRegistered(): void {
  if (builtInEffectsRegistered && getRegisteredEffectIds().length >= BUILT_IN_EFFECTS.length) return;
  for (const effect of BUILT_IN_EFFECTS) {
    registerEffect(effect);
  }
  builtInEffectsRegistered = true;
}
