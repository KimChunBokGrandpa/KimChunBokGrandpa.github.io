export type PosterFrameStyleId = 'none' | 'classic' | 'marquee';
export type PosterOverlayStyleId = 'none' | 'sunset' | 'cool';
export type PosterStickerStyleId = 'none' | 'pixel_lab' | 'new_burst';

export interface PosterFrameStyleOption {
  id: PosterFrameStyleId;
  labelKey: 'poster_frame_none' | 'poster_frame_classic' | 'poster_frame_marquee';
}

export interface PosterOverlayStyleOption {
  id: PosterOverlayStyleId;
  labelKey: 'poster_overlay_none' | 'poster_overlay_sunset' | 'poster_overlay_cool';
}

export interface PosterStickerStyleOption {
  id: PosterStickerStyleId;
  labelKey: 'poster_sticker_none' | 'poster_sticker_pixel_lab' | 'poster_sticker_new_burst';
}

export const DEFAULT_POSTER_FRAME_STYLE_ID: PosterFrameStyleId = 'classic';
export const DEFAULT_POSTER_OVERLAY_STYLE_ID: PosterOverlayStyleId = 'sunset';
export const DEFAULT_POSTER_STICKER_STYLE_ID: PosterStickerStyleId = 'pixel_lab';

export const POSTER_FRAME_STYLES: PosterFrameStyleOption[] = [
  { id: 'none', labelKey: 'poster_frame_none' },
  { id: 'classic', labelKey: 'poster_frame_classic' },
  { id: 'marquee', labelKey: 'poster_frame_marquee' },
];

export const POSTER_OVERLAY_STYLES: PosterOverlayStyleOption[] = [
  { id: 'none', labelKey: 'poster_overlay_none' },
  { id: 'sunset', labelKey: 'poster_overlay_sunset' },
  { id: 'cool', labelKey: 'poster_overlay_cool' },
];

export const POSTER_STICKER_STYLES: PosterStickerStyleOption[] = [
  { id: 'none', labelKey: 'poster_sticker_none' },
  { id: 'pixel_lab', labelKey: 'poster_sticker_pixel_lab' },
  { id: 'new_burst', labelKey: 'poster_sticker_new_burst' },
];

export function isPosterFrameStyleId(value: string): value is PosterFrameStyleId {
  return POSTER_FRAME_STYLES.some((option) => option.id === value);
}

export function isPosterOverlayStyleId(value: string): value is PosterOverlayStyleId {
  return POSTER_OVERLAY_STYLES.some((option) => option.id === value);
}

export function isPosterStickerStyleId(value: string): value is PosterStickerStyleId {
  return POSTER_STICKER_STYLES.some((option) => option.id === value);
}
