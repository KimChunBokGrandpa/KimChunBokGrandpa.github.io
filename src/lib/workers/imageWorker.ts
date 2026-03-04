import { applyPixelationAndPalette } from "../utils/colorQuantizer";

export interface ImageWorkerMessage {
  id: string;
  imageBitmap: ImageBitmap;
  width: number;
  height: number;
  pixelSize: number;
  palette: string;
}

export interface ImageWorkerResponse {
  id: string;
  processedData: ImageData;
  error?: string;
}

onmessage = (e: MessageEvent<ImageWorkerMessage>) => {
  const { id, imageBitmap, width, height, pixelSize, palette } = e.data;

  try {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    }) as OffscreenCanvasRenderingContext2D;
    ctx.drawImage(imageBitmap, 0, 0);
    const sourceData = ctx.getImageData(0, 0, width, height);
    imageBitmap.close(); // Release memory

    const processedData = applyPixelationAndPalette(
      sourceData,
      pixelSize,
      palette,
    );

    const response: ImageWorkerResponse = { id, processedData };
    postMessage(response, { transfer: [processedData.data.buffer] });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown processing error";
    postMessage({ id, error: message } as ImageWorkerResponse);
  }
};
