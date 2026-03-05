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
export type GlitchType = "none" | "rgb_split" | "noise" | "wave" | "slice";
export type RenderMode = "pixel_perfect" | "bilinear" | "hqx";

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
}

// ─── Worker Message Types ───
export interface ImageWorkerMessage {
  id: string;
  imageBitmap: ImageBitmap;
  width: number;
  height: number;
  pixelSize: number;
  palette: string;
  glitchFilters?: Array<{ type: GlitchType; intensity: number }>;
  renderMode?: RenderMode;
  glitchSeed?: number | null;
}

export interface ImageWorkerResponse {
  id: string;
  processedData: ImageData;
  error?: string;
}
