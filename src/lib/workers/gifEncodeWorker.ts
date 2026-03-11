/**
 * Web Worker for GIF encoding — runs encodeGif off the main thread
 * to prevent UI blocking on large animated GIFs.
 */
import { encodeGif } from '../utils/gifProcessor';
import type { GifEncodeWorkerMessage, GifEncodeWorkerResponse } from '../types';

onmessage = (e: MessageEvent<GifEncodeWorkerMessage>) => {
  const { frames, width, height } = e.data;

  try {
    // Convert ArrayBuffers back to Uint8ClampedArray
    const typedFrames = frames.map((f) => ({
      data: new Uint8ClampedArray(f.data),
      delay: f.delay,
    }));

    const gifBytes = encodeGif(typedFrames, width, height);

    // Transfer the result buffer to avoid copying
    const response: GifEncodeWorkerResponse = { gifData: gifBytes.buffer };
    postMessage(response, { transfer: [gifBytes.buffer] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'GIF encoding failed';
    postMessage({ error: message } as GifEncodeWorkerResponse);
  }
};
