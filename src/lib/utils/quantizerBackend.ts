import type { DitherType, QuantizationBackend } from '$lib/types';
import { applyPixelationAndPalette } from './colorQuantizer';
import { PALETTES, normalizePaletteId, type RGB } from './palettes';
import { quantizeWithWasm } from './wasmQuantizer';

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
  const normalizedPalette = normalizePaletteId(request.palette);
  return applyPixelationAndPalette(
    request.imageData,
    request.pixelSize,
    normalizedPalette,
    request.ditherType ?? 'none',
    request.customPaletteColors,
    request.useOklab,
  );
}

export async function applyQuantizationAsync(request: QuantizationRequest): Promise<ImageData> {
  const backend = resolveQuantizationBackend(request.backend);
  const normalizedPalette = normalizePaletteId(request.palette);
  const resolvedPaletteColors = request.customPaletteColors
    ?? (normalizedPalette !== 'original' ? PALETTES[normalizedPalette] : undefined);

  if (backend === 'wasm') {
    const wasmResult = await quantizeWithWasm({
      imageData: request.imageData,
      pixelSize: request.pixelSize,
      ditherType: request.ditherType,
      customPaletteColors: resolvedPaletteColors,
      useOklab: request.useOklab,
    });

    if (wasmResult) return wasmResult;
  }

  return applyQuantization({
    ...request,
    palette: normalizedPalette,
    customPaletteColors: request.customPaletteColors ?? resolvedPaletteColors,
  });
}
