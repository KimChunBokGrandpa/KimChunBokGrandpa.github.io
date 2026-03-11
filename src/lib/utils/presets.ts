import type { DitherType, GlitchFilter, RenderMode } from '../types';
import type { TranslationKey } from '../i18n/en';

export interface Preset {
  id: string;
  icon: string;
  labelKey: TranslationKey;
  /** @deprecated Use icon + i18n.t(labelKey) instead */
  label: string;
  pixelSize: number;
  palette: string;
  crtEffect: boolean;
  glitchFilters: GlitchFilter[];
  renderMode: RenderMode;
  ditherType: DitherType;
}

export const PRESETS: Preset[] = [
  { id: 'retro_crt',  icon: '📺', labelKey: 'preset_retro_crt',  label: '📺 CRT',         pixelSize: 3, palette: 'win256',      crtEffect: true,  glitchFilters: [],                                                                   renderMode: 'pixel_perfect', ditherType: 'none' },
  { id: 'gameboy',    icon: '🎮', labelKey: 'preset_gameboy',    label: '🎮 Gameboy',     pixelSize: 4, palette: 'dmg',          crtEffect: false, glitchFilters: [],                                                                   renderMode: 'pixel_perfect', ditherType: 'none' },
  { id: 'nes',        icon: '🕹️', labelKey: 'preset_nes',        label: '🕹️ NES',         pixelSize: 3, palette: 'nes',          crtEffect: false, glitchFilters: [],                                                                   renderMode: 'pixel_perfect', ditherType: 'none' },
  { id: 'pico8',      icon: '👾', labelKey: 'preset_pico8',      label: '👾 PICO-8',      pixelSize: 4, palette: 'pico8',        crtEffect: false, glitchFilters: [],                                                                   renderMode: 'pixel_perfect', ditherType: 'none' },
  { id: 'broken_vhs', icon: '📼', labelKey: 'preset_broken_vhs', label: '📼 Broken VHS',  pixelSize: 2, palette: 'win256',       crtEffect: true,  glitchFilters: [{ type: 'wave', intensity: 2 }],                                      renderMode: 'pixel_perfect', ditherType: 'none' },
  { id: 'cyberpunk',  icon: '🌃', labelKey: 'preset_cyberpunk',  label: '🌃 Cyberpunk',   pixelSize: 2, palette: 'cyberpunk16',  crtEffect: true,  glitchFilters: [{ type: 'rgb_split', intensity: 2 }],                                  renderMode: 'pixel_perfect', ditherType: 'none' },
  { id: 'glitch_art', icon: '☠️', labelKey: 'preset_glitch_art', label: '☠️ Glitch Art',  pixelSize: 3, palette: 'ega',          crtEffect: true,  glitchFilters: [{ type: 'noise', intensity: 3 }],                                     renderMode: 'pixel_perfect', ditherType: 'none' },
  { id: 'chaos',      icon: '🔥', labelKey: 'preset_chaos',      label: '🔥 Chaos',       pixelSize: 2, palette: 'win256',       crtEffect: true,  glitchFilters: [{ type: 'rgb_split', intensity: 3 }, { type: 'wave', intensity: 2 }, { type: 'noise', intensity: 3 }], renderMode: 'pixel_perfect', ditherType: 'none' },
  { id: 'smooth_hqx', icon: '✨', labelKey: 'preset_smooth_hqx', label: '✨ Smooth HQx',  pixelSize: 2, palette: 'win256',       crtEffect: false, glitchFilters: [],                                                                   renderMode: 'hqx',           ditherType: 'none' },
  { id: 'dither_fs',  icon: '🔳', labelKey: 'preset_dither_fs',  label: '🔳 Dither FS',   pixelSize: 3, palette: 'ega',          crtEffect: false, glitchFilters: [],                                                                   renderMode: 'pixel_perfect', ditherType: 'floyd_steinberg' },
  { id: 'original',   icon: '🖼️', labelKey: 'preset_original',   label: '🖼️ Original',    pixelSize: 1, palette: 'original',     crtEffect: false, glitchFilters: [],                                                                   renderMode: 'pixel_perfect', ditherType: 'none' },
];
