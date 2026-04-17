import { beforeEach, describe, expect, it } from 'vitest';
import {
  getAllEffects,
  getEffectsByCategory,
  getRegisteredEffectIds,
  resetEffectRegistryForTests,
} from './effectRegistry';
import { builtInEffects, ensureBuiltInEffectsRegistered } from './effects';

describe('effectRegistry', () => {
  beforeEach(() => {
    resetEffectRegistryForTests();
  });

  it('registers built-in effects through the initializer', () => {
    ensureBuiltInEffectsRegistered();
    expect(getRegisteredEffectIds()).toEqual(builtInEffects.map((effect) => effect.id));
  });

  it('is safe to initialize multiple times', () => {
    ensureBuiltInEffectsRegistered();
    ensureBuiltInEffectsRegistered();
    expect(getAllEffects()).toHaveLength(builtInEffects.length);
  });

  it('keeps category metadata for registry-driven menus', () => {
    ensureBuiltInEffectsRegistered();
    expect(getEffectsByCategory('glitch').map((effect) => effect.id)).toEqual([
      'rgb_split',
      'wave',
      'noise',
      'slice',
      'vhs_tracking',
    ]);
    expect(getEffectsByCategory('filter').map((effect) => effect.id)).toEqual(['interlace']);
  });
});
