/**
 * Vitest setup: Polyfill ImageData for Node.js environment.
 * ImageData is a browser API used by the image processing utilities.
 */
if (typeof globalThis.ImageData === "undefined") {
  class ImageDataPolyfill {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    colorSpace: string;

    constructor(
      dataOrWidth: Uint8ClampedArray | number,
      widthOrHeight: number,
      height?: number,
    ) {
      if (dataOrWidth instanceof Uint8ClampedArray) {
        this.data = dataOrWidth;
        this.width = widthOrHeight;
        this.height = height ?? dataOrWidth.length / (widthOrHeight * 4);
      } else {
        this.width = dataOrWidth;
        this.height = widthOrHeight;
        this.data = new Uint8ClampedArray(this.width * this.height * 4);
      }
      this.colorSpace = "srgb";
    }
  }
  (globalThis as any).ImageData = ImageDataPolyfill;
}
