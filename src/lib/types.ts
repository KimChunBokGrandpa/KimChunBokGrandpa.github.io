// ─── Window Types ───
export type WindowMode = "windowed" | "maximized" | "minimized" | "closed";

export interface WindowState {
  mode: WindowMode;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  defaults: { x: number; y: number; w: number; h: number };
}

export interface WindowConfig {
  id: string;
  title: string;
  icon: string;
}

// ─── Processing Types ───
export interface ProcessingSettings {
  pixelSize: number;
  palette: string;
  crtEffect: boolean;
  glitchType: string; // none, rgb_split, noise, wave, slice
  glitchIntensity: number; // 1, 2, 3
  renderMode: string; // pixel_perfect, bilinear, hqx
}
