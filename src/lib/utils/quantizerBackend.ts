import type { DitherType, QuantizationBackend } from '$lib/types';
import { applyPixelationAndPalette } from './colorQuantizer';
import type { RGB } from './palettes';

export interface QuantizationRequest {
  imageData: ImageData;
  pixelSize: number;
  palette: string;
  ditherType?: DitherType;
  customPaletteColors?: RGB[];
  useOklab?: boolean;
  backend?: QuantizationBackend;
}

export function resolveQuantizationBackend(backend?: QuantizationBackend): QuantizationBackend {
  return backend === 'wasm' ? 'wasm' : 'js';
}

export function applyQuantization(request: QuantizationRequest): ImageData {
  const backend = resolveQuantizationBackend(request.backend);

  // WASM path is intentionally a soft fallback until the module lands.
  if (backend === 'wasm') {
    return applyPixelationAndPalette(
      request.imageData,
      request.pixelSize,
      request.palette,
      request.ditherType ?? 'none',
      request.customPaletteColors,
      request.useOklab,
    );
  }

  return applyPixelationAndPalette(
    request.imageData,
    request.pixelSize,
    request.palette,
    request.ditherType ?? 'none',
    request.customPaletteColors,
    request.useOklab,
  );
}
