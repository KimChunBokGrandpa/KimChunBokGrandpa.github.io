import type { DitherType } from '$lib/types';
import type { RGB } from '$lib/utils/palettes';

interface TauriQuantizeRequest {
  width: number;
  height: number;
  pixel_size: number;
  palette: RGB[];
  dither_type: DitherType;
  use_oklab: boolean;
}

export interface CreateTauriQuantizeRequestInput {
  width: number;
  height: number;
  pixelSize: number;
  paletteColors: RGB[];
  ditherType?: DitherType;
  useOklab?: boolean;
}

export function createTauriQuantizeRequest(
  input: CreateTauriQuantizeRequestInput,
): TauriQuantizeRequest {
  return {
    width: input.width,
    height: input.height,
    pixel_size: input.pixelSize,
    palette: input.paletteColors,
    dither_type: input.ditherType ?? 'none',
    use_oklab: input.useOklab ?? false,
  };
}
