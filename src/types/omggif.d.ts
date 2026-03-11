/**
 * Ambient type declarations for the 'omggif' library.
 * Only covers the API surface used in this project.
 */
declare module 'omggif' {
  interface GifFrameInfo {
    x: number;
    y: number;
    width: number;
    height: number;
    delay: number;
    disposal: number;
    transparent?: number;
  }

  interface GifWriterOptions {
    loop?: number;
  }

  interface GifFrameOptions {
    palette?: number[];
    delay?: number;
    transparent?: number;
    disposal?: number;
  }

  export class GifReader {
    width: number;
    height: number;
    constructor(data: Uint8Array);
    numFrames(): number;
    frameInfo(frameIndex: number): GifFrameInfo;
    decodeAndBlitFrameRGBA(frameIndex: number, pixels: Uint8ClampedArray): void;
  }

  export class GifWriter {
    constructor(buf: Uint8Array, width: number, height: number, opts?: GifWriterOptions);
    addFrame(
      x: number,
      y: number,
      w: number,
      h: number,
      indexedPixels: Uint8Array,
      opts?: GifFrameOptions,
    ): void;
    end(): number;
  }
}
