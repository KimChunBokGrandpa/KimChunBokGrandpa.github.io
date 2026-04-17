import { getRegisteredEffectIds, registerEffect, type EffectDefinition } from '../effectRegistry';
import { interlaceEffect } from './interlace';
import { noiseEffect } from './noise';
import { rgbSplitEffect } from './rgbSplit';
import { sliceEffect } from './slice';
import { vhsTrackingEffect } from './vhsTracking';
import { waveEffect } from './wave';

export const builtInEffects: EffectDefinition[] = [
  rgbSplitEffect,
  waveEffect,
  noiseEffect,
  sliceEffect,
  vhsTrackingEffect,
  interlaceEffect,
];

let builtInEffectsRegistered = false;

export function ensureBuiltInEffectsRegistered(): void {
  if (builtInEffectsRegistered && getRegisteredEffectIds().length >= builtInEffects.length) return;
  for (const effect of builtInEffects) {
    registerEffect(effect);
  }
  builtInEffectsRegistered = true;
}
