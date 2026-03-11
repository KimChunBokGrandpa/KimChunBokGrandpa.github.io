// ─── Window Types ───
export type WindowMode = "windowed" | "maximized" | "minimized" | "closed";
export type WindowId = "preview" | "settings" | "gallery" | "batch" | "history";

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
  id: WindowId;
  title: string;
  icon: string;
}

// ─── Processing Types ───
export type GlitchType = "none" | "rgb_split" | "noise" | "wave" | "slice";
export type RenderMode = "pixel_perfect" | "bilinear" | "hqx";
export type DitherType = "none" | "floyd_steinberg" | "ordered";

export interface GlitchFilter {
  type: GlitchType;
  intensity: number; // 1, 2, 3
}

export interface ProcessingSettings {
  pixelSize: number;
  palette: string;
  crtEffect: boolean;
  glitchFilters: GlitchFilter[];
  renderMode: RenderMode;
  glitchSeed: number | null; // null = random each time, number = fixed seed
  ditherType: DitherType;
}

// ─── Post-Process Filter Types ───
export interface PostProcessFilters {
  brightness: number; // 100 = normal
  contrast: number;   // 100 = normal
  saturation: number; // 100 = normal
  hueRotate: number;  // 0 = normal, degrees
}

export const DEFAULT_POST_FILTERS: PostProcessFilters = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hueRotate: 0,
};

// ─── Worker Message Types ───
export interface ImageWorkerMessage {
  id: string;
  imageBitmap: ImageBitmap;
  width: number;
  height: number;
  pixelSize: number;
  palette: string;
  glitchFilters?: GlitchFilter[];
  renderMode?: RenderMode;
  glitchSeed?: number | null;
  ditherType?: DitherType;
  customPaletteColors?: { r: number; g: number; b: number }[];
}

export interface ImageWorkerResponse {
  id: string;
  type?: 'progress' | 'complete';
  processedData: ImageData;
  colorCount?: number;
  progress?: number; // 0–1, sent during processing stages
  error?: string;
}

// ─── GIF Encode Worker Types ───
export interface GifEncodeWorkerMessage {
  frames: { data: ArrayBuffer; delay: number }[];
  width: number;
  height: number;
}

export interface GifEncodeWorkerResponse {
  gifData?: ArrayBuffer;
  error?: string;
}
