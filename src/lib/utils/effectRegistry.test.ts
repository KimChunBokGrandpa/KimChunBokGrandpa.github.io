import { beforeEach, describe, expect, it } from 'vitest';
import {
  getAllEffects,
  getEffectsByCategory,
  getRegisteredEffectIds,
  resetEffectRegistryForTests,
} from './effectRegistry';
import { BUILT_IN_EFFECTS, ensureBuiltInEffectsRegistered } from './effects';

describe('effectRegistry', () => {
  beforeEach(() => {
    resetEffectRegistryForTests();
  });

  it('registers built-in effects through the initializer', () => {
    ensureBuiltInEffectsRegistered();
    expect(getRegisteredEffectIds()).toEqual(BUILT_IN_EFFECTS.map((effect) => effect.id));
  });

  it('is safe to initialize multiple times', () => {
    ensureBuiltInEffectsRegistered();
    ensureBuiltInEffectsRegistered();
    expect(getAllEffects()).toHaveLength(BUILT_IN_EFFECTS.length);
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
