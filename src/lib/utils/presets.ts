import type { CrtMode, DitherType, GlitchFilter, RenderMode } from '../types';
import type { TranslationKey } from '../i18n/en';

export interface Preset {
  id: string;
  icon: string;
  labelKey: TranslationKey;
  pixelSize: number;
  palette: string;
  crtEffect: CrtMode;
  glitchFilters: GlitchFilter[];
  renderMode: RenderMode;
  ditherType: DitherType;
}

export const presets: Preset[] = [
  { id: 'retro_crt',  icon: '📺', labelKey: 'preset_retro_crt',  pixelSize: 3, palette: 'win256',      crtEffect: 'horizontal', glitchFilters: [],                                                                   renderMode: 'pixel_perfect', ditherType: 'none' },
  { id: 'gameboy',    icon: '🎮', labelKey: 'preset_gameboy',    pixelSize: 4, palette: 'dmg',          crtEffect: 'none',       glitchFilters: [],                                                                   renderMode: 'pixel_perfect', ditherType: 'none' },
  { id: 'nes',        icon: '🕹️', labelKey: 'preset_nes',        pixelSize: 3, palette: 'nes',          crtEffect: 'none',       glitchFilters: [],                                                                   renderMode: 'pixel_perfect', ditherType: 'none' },
  { id: 'pico8',      icon: '👾', labelKey: 'preset_pico8',      pixelSize: 4, palette: 'pico8',        crtEffect: 'none',       glitchFilters: [],                                                                   renderMode: 'pixel_perfect', ditherType: 'none' },
  { id: 'broken_vhs', icon: '📼', labelKey: 'preset_broken_vhs', pixelSize: 2, palette: 'win256',       crtEffect: 'horizontal', glitchFilters: [{ type: 'wave', intensity: 2 }],                                      renderMode: 'pixel_perfect', ditherType: 'none' },
  { id: 'cyberpunk',  icon: '🌃', labelKey: 'preset_cyberpunk',  pixelSize: 2, palette: 'cyberpunk16',  crtEffect: 'vertical',   glitchFilters: [{ type: 'rgb_split', intensity: 2 }],                                  renderMode: 'pixel_perfect', ditherType: 'none' },
  { id: 'glitch_art', icon: '☠️', labelKey: 'preset_glitch_art', pixelSize: 3, palette: 'ega',          crtEffect: 'horizontal', glitchFilters: [{ type: 'noise', intensity: 3 }],                                     renderMode: 'pixel_perfect', ditherType: 'none' },
  { id: 'chaos',      icon: '🔥', labelKey: 'preset_chaos',      pixelSize: 2, palette: 'win256',       crtEffect: 'horizontal', glitchFilters: [{ type: 'rgb_split', intensity: 3 }, { type: 'wave', intensity: 2 }, { type: 'noise', intensity: 3 }], renderMode: 'pixel_perfect', ditherType: 'none' },
  { id: 'smooth_hqx', icon: '✨', labelKey: 'preset_smooth_hqx', pixelSize: 2, palette: 'win256',       crtEffect: 'none',       glitchFilters: [],                                                                   renderMode: 'hqx',           ditherType: 'none' },
  { id: 'dither_fs',  icon: '🔳', labelKey: 'preset_dither_fs',  pixelSize: 3, palette: 'ega',          crtEffect: 'none',       glitchFilters: [],                                                                   renderMode: 'pixel_perfect', ditherType: 'floyd_steinberg' },
  { id: 'original',   icon: '🖼️', labelKey: 'preset_original',   pixelSize: 1, palette: 'original',     crtEffect: 'none',       glitchFilters: [],                                                                   renderMode: 'pixel_perfect', ditherType: 'none' },
];
