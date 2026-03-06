import type { GlitchFilter, RenderMode } from '../types';

export interface Preset {
  id: string;
  label: string;
  pixelSize: number;
  palette: string;
  crtEffect: boolean;
  glitchFilters: GlitchFilter[];
  renderMode: RenderMode;
}

export const PRESETS: Preset[] = [
  { id: 'retro_crt',  label: '📺 CRT',         pixelSize: 3, palette: 'win256',      crtEffect: true,  glitchFilters: [],                                                                   renderMode: 'pixel_perfect' },
  { id: 'gameboy',    label: '🎮 Gameboy',     pixelSize: 4, palette: 'dmg',          crtEffect: false, glitchFilters: [],                                                                   renderMode: 'pixel_perfect' },
  { id: 'nes',        label: '🕹️ NES',         pixelSize: 3, palette: 'nes',          crtEffect: false, glitchFilters: [],                                                                   renderMode: 'pixel_perfect' },
  { id: 'pico8',      label: '👾 PICO-8',      pixelSize: 4, palette: 'pico8',        crtEffect: false, glitchFilters: [],                                                                   renderMode: 'pixel_perfect' },
  { id: 'broken_vhs', label: '📼 Broken VHS',  pixelSize: 2, palette: 'win256',       crtEffect: true,  glitchFilters: [{ type: 'wave', intensity: 2 }],                                      renderMode: 'pixel_perfect' },
  { id: 'cyberpunk',  label: '🌃 Cyberpunk',   pixelSize: 2, palette: 'cyberpunk16',  crtEffect: true,  glitchFilters: [{ type: 'rgb_split', intensity: 2 }],                                  renderMode: 'pixel_perfect' },
  { id: 'glitch_art', label: '☠️ Glitch Art',  pixelSize: 3, palette: 'ega',          crtEffect: true,  glitchFilters: [{ type: 'noise', intensity: 3 }],                                     renderMode: 'pixel_perfect' },
  { id: 'chaos',      label: '🔥 Chaos',       pixelSize: 2, palette: 'win256',       crtEffect: true,  glitchFilters: [{ type: 'rgb_split', intensity: 3 }, { type: 'wave', intensity: 2 }, { type: 'noise', intensity: 3 }], renderMode: 'pixel_perfect' },
  { id: 'smooth_hqx', label: '✨ Smooth HQx',  pixelSize: 2, palette: 'win256',       crtEffect: false, glitchFilters: [],                                                                   renderMode: 'hqx' },
  { id: 'original',   label: '🖼️ Original',    pixelSize: 1, palette: 'original',     crtEffect: false, glitchFilters: [],                                                                   renderMode: 'pixel_perfect' },
];
