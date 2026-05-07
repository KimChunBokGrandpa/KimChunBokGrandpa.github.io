import type { CrtMode, DitherType, GlitchFilter, RenderMode } from '../types';
import type { TranslationKey } from '../i18n/en';

export interface Preset {
  id: string;
  icon: string;
  labelKey: TranslationKey;
  family: PresetFamily;
  pixelSize: number;
  palette: string;
  crtEffect: CrtMode;
  glitchFilters: GlitchFilter[];
  renderMode: RenderMode;
  ditherType: DitherType;
}

export type PresetFamily = 'classic_pixel' | 'retro_treatment' | 'hybrid' | 'reference';

const presetFamilyLabelKeys: Record<PresetFamily, TranslationKey> = {
  classic_pixel: 'preset_family_classic_pixel',
  retro_treatment: 'preset_family_retro_treatment',
  hybrid: 'preset_family_hybrid',
  reference: 'preset_family_reference',
};

export function getPresetFamilyLabelKey(family: PresetFamily): TranslationKey {
  return presetFamilyLabelKeys[family];
}

export const presets: Preset[] = [
  { id: 'retro_crt',  icon: '📺', labelKey: 'preset_retro_crt',  family: 'retro_treatment', pixelSize: 3, palette: 'win256',      crtEffect: 'horizontal', glitchFilters: [],                                                                   renderMode: 'pixel_perfect', ditherType: 'none' },
  { id: 'gameboy',    icon: '🎮', labelKey: 'preset_gameboy',    family: 'classic_pixel',   pixelSize: 4, palette: 'dmg',          crtEffect: 'none',       glitchFilters: [],                                                                   renderMode: 'pixel_perfect', ditherType: 'none' },
  { id: 'nes',        icon: '🕹️', labelKey: 'preset_nes',        family: 'classic_pixel',   pixelSize: 3, palette: 'nes',          crtEffect: 'none',       glitchFilters: [],                                                                   renderMode: 'pixel_perfect', ditherType: 'none' },
  { id: 'pico8',      icon: '👾', labelKey: 'preset_pico8',      family: 'classic_pixel',   pixelSize: 4, palette: 'pico8',        crtEffect: 'none',       glitchFilters: [],                                                                   renderMode: 'pixel_perfect', ditherType: 'none' },
  { id: 'broken_vhs', icon: '📼', labelKey: 'preset_broken_vhs', family: 'retro_treatment', pixelSize: 2, palette: 'win256',       crtEffect: 'horizontal', glitchFilters: [{ type: 'wave', intensity: 2 }],                                      renderMode: 'pixel_perfect', ditherType: 'none' },
  { id: 'cyberpunk',  icon: '🌃', labelKey: 'preset_cyberpunk',  family: 'retro_treatment', pixelSize: 2, palette: 'cyberpunk16',  crtEffect: 'vertical',   glitchFilters: [{ type: 'rgb_split', intensity: 2 }],                                  renderMode: 'pixel_perfect', ditherType: 'none' },
  { id: 'glitch_art', icon: '☠️', labelKey: 'preset_glitch_art', family: 'retro_treatment', pixelSize: 3, palette: 'ega',          crtEffect: 'horizontal', glitchFilters: [{ type: 'noise', intensity: 3 }],                                     renderMode: 'pixel_perfect', ditherType: 'none' },
  { id: 'chaos',      icon: '🔥', labelKey: 'preset_chaos',      family: 'retro_treatment', pixelSize: 2, palette: 'win256',       crtEffect: 'horizontal', glitchFilters: [{ type: 'rgb_split', intensity: 3 }, { type: 'wave', intensity: 2 }, { type: 'noise', intensity: 3 }], renderMode: 'pixel_perfect', ditherType: 'none' },
  { id: 'smooth_hqx', icon: '✨', labelKey: 'preset_smooth_hqx', family: 'hybrid',          pixelSize: 2, palette: 'win256',       crtEffect: 'none',       glitchFilters: [],                                                                   renderMode: 'hqx',           ditherType: 'none' },
  { id: 'dither_fs',  icon: '🔳', labelKey: 'preset_dither_fs',  family: 'classic_pixel',   pixelSize: 3, palette: 'ega',          crtEffect: 'none',       glitchFilters: [],                                                                   renderMode: 'pixel_perfect', ditherType: 'floyd_steinberg' },
  { id: 'original',   icon: '🖼️', labelKey: 'preset_original',   family: 'reference',       pixelSize: 1, palette: 'original',     crtEffect: 'none',       glitchFilters: [],                                                                   renderMode: 'pixel_perfect', ditherType: 'none' },
];
