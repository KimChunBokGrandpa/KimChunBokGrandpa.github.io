import type { DitherType } from '$lib/types';
import wasmUrl from '$lib/wasm/quantizer_wasm.wasm?url';
import type { RGB } from './palettes';

interface WasmQuantizerExports {
  memory: WebAssembly.Memory;
  alloc(len: number): number;
  free(ptr: number, len: number): void;
  quantize(
    inputPtr: number,
    inputLen: number,
    width: number,
    height: number,
    pixelSize: number,
    palettePtr: number,
    paletteLen: number,
    ditherType: number,
  ): number;
}

interface WasmQuantizeRequest {
  imageData: ImageData;
  pixelSize: number;
  ditherType?: DitherType;
  customPaletteColors?: RGB[];
  useOklab?: boolean;
}

let cachedWasm: Promise<WasmQuantizerExports | null> | null = null;

function ditherTypeToCode(ditherType: DitherType | undefined): number | null {
  switch (ditherType ?? 'none') {
    case 'none':
      return 0;
    case 'ordered':
      return 1;
    case 'floyd_steinberg':
      return 2;
    case 'atkinson':
      return null;
  }
}

async function loadWasmQuantizer(): Promise<WasmQuantizerExports | null> {
  if (!cachedWasm) {
    cachedWasm = (async () => {
      try {
        const response = await fetch(wasmUrl);
        if (!response.ok) return null;
        const bytes = await response.arrayBuffer();
        const { instance } = await WebAssembly.instantiate(bytes, {});
        return instance.exports as unknown as WasmQuantizerExports;
      } catch {
        return null;
      }
    })();
  }

  return cachedWasm;
}

function writeToWasmMemory(exports: WasmQuantizerExports, bytes: Uint8Array): number {
  const ptr = exports.alloc(bytes.length);
  const memoryView = new Uint8Array(exports.memory.buffer, ptr, bytes.length);
  memoryView.set(bytes);
  return ptr;
}

function buildPaletteBytes(colors?: RGB[]): Uint8Array {
  if (!colors || colors.length === 0) return new Uint8Array();

  const bytes = new Uint8Array(colors.length * 3);
  for (let i = 0; i < colors.length; i++) {
    const offset = i * 3;
    bytes[offset] = colors[i].r;
    bytes[offset + 1] = colors[i].g;
    bytes[offset + 2] = colors[i].b;
  }
  return bytes;
}

export async function quantizeWithWasm(request: WasmQuantizeRequest): Promise<ImageData | null> {
  if (request.useOklab) return null;

  const ditherCode = ditherTypeToCode(request.ditherType);
  if (ditherCode === null) return null;

  const wasm = await loadWasmQuantizer();
  if (!wasm) return null;

  const input = new Uint8Array(
    request.imageData.data.buffer,
    request.imageData.data.byteOffset,
    request.imageData.data.byteLength,
  );
  const paletteBytes = buildPaletteBytes(request.customPaletteColors);

  const inputPtr = writeToWasmMemory(wasm, input);
  const palettePtr = paletteBytes.length > 0 ? writeToWasmMemory(wasm, paletteBytes) : 0;

  try {
    const outputPtr = wasm.quantize(
      inputPtr,
      input.length,
      request.imageData.width,
      request.imageData.height,
      request.pixelSize,
      palettePtr,
      paletteBytes.length,
      ditherCode,
    );

    if (outputPtr === 0) return null;

    const outputBytes = new Uint8ClampedArray(input.length);
    outputBytes.set(new Uint8Array(wasm.memory.buffer, outputPtr, input.length));
    wasm.free(outputPtr, input.length);
    return new ImageData(outputBytes, request.imageData.width, request.imageData.height);
  } catch {
    return null;
  } finally {
    wasm.free(inputPtr, input.length);
    if (palettePtr !== 0) {
      wasm.free(palettePtr, paletteBytes.length);
    }
  }
}
