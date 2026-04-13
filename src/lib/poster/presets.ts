export type PosterPresetId = 'poster' | 'banner' | 'profile';

export interface PosterPreset {
  id: PosterPresetId;
  labelKey: 'poster_preset_poster' | 'poster_preset_banner' | 'poster_preset_profile';
  width: number;
  height: number;
  background: string;
  accent: string;
  textColor: string;
}

export const DEFAULT_POSTER_PRESET_ID: PosterPresetId = 'poster';
export const DEFAULT_POSTER_TITLE = 'RETRO STUDIO';
export const DEFAULT_POSTER_SUBTITLE = 'Client-only poster layout';

export const POSTER_PRESETS: PosterPreset[] = [
  {
    id: 'poster',
    labelKey: 'poster_preset_poster',
    width: 720,
    height: 960,
    background: '#f8edc6',
    accent: '#143a7b',
    textColor: '#143a7b',
  },
  {
    id: 'banner',
    labelKey: 'poster_preset_banner',
    width: 960,
    height: 540,
    background: '#d9eef6',
    accent: '#8b1f52',
    textColor: '#8b1f52',
  },
  {
    id: 'profile',
    labelKey: 'poster_preset_profile',
    width: 720,
    height: 720,
    background: '#f3d8d8',
    accent: '#145f51',
    textColor: '#145f51',
  },
];

export function isPosterPresetId(value: string): value is PosterPresetId {
  return POSTER_PRESETS.some((preset) => preset.id === value);
}

export function getPosterPreset(id: PosterPresetId): PosterPreset {
  return POSTER_PRESETS.find((preset) => preset.id === id) ?? POSTER_PRESETS[0];
}
