import { applyPixelationAndPalette } from "../utils/colorQuantizer";

export interface ImageWorkerMessage {
  id: string;
  imageBitmap?: ImageBitmap;
  imageData?: ImageData;
  width?: number;
  height?: number;
  pixelSize: number;
  palette: string;
}

export interface ImageWorkerResponse {
  id: string;
  processedData: ImageData;
  error?: string;
}

self.onmessage = (e: MessageEvent<ImageWorkerMessage>) => {
  const { id, imageBitmap, imageData, width, height, pixelSize, palette } =
    e.data;

  try {
    let sourceData = imageData;

    if (imageBitmap && width && height) {
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext("2d", {
        willReadFrequently: true,
      }) as OffscreenCanvasRenderingContext2D;
      ctx.drawImage(imageBitmap, 0, 0);
      sourceData = ctx.getImageData(0, 0, width, height);
      imageBitmap.close(); // Release memory
    }

    if (!sourceData) {
      throw new Error("No image data provided");
    }

    const processedData = applyPixelationAndPalette(
      sourceData,
      pixelSize,
      palette,
    );

    const response: ImageWorkerResponse = { id, processedData };
    (self as any).postMessage(response, [processedData.data.buffer]);
  } catch (error: any) {
    self.postMessage({
      id,
      error: error?.message || "Unknown processing error",
    } as ImageWorkerResponse);
  }
};
