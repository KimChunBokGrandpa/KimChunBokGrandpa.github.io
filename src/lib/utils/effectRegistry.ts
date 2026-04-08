/**
 * Effect Registry — Plugin architecture for image effects.
 * Each effect registers itself with metadata and an apply function.
 * New effects can be added without modifying any switch statements.
 */
import type { TranslationKey } from '$lib/i18n/en';
import type { GlitchType } from '$lib/types';

export type EffectId = Exclude<GlitchType, 'none'>;

export interface EffectDefinition {
  /** Unique effect ID (matches GlitchType values) */
  id: EffectId;
  /** Category for grouping in UI */
  category: 'glitch' | 'filter' | 'transform';
  /** Weight for progress tracking (higher = slower) */
  weight: number;
  /** UI metadata for registry-driven menus */
  icon: string;
  labelKey: TranslationKey;
  /** Pure function: applies effect to ImageData */
  apply: (imageData: ImageData, intensity: number, seed: number) => ImageData;
}

const registry = new Map<EffectId, EffectDefinition>();

export function registerEffect(def: EffectDefinition): void {
  registry.set(def.id, def);
}

export function getEffect(id: EffectId): EffectDefinition | undefined {
  return registry.get(id);
}

export function getAllEffects(): EffectDefinition[] {
  return Array.from(registry.values());
}

export function getEffectsByCategory(category: EffectDefinition['category']): EffectDefinition[] {
  return getAllEffects().filter(e => e.category === category);
}

export function getEffectWeight(id: string): number {
  return registry.get(id as EffectId)?.weight ?? 1;
}

export function getRegisteredEffectIds(): string[] {
  return Array.from(registry.keys());
}

export function resetEffectRegistryForTests(): void {
  registry.clear();
}
