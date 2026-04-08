/**
 * Animated WebP Encoder — Muxes still WebP frames into an animated WebP container.
 * Frame bitstreams are expected to be valid still-image WebP files.
 */

export interface AnimatedWebpFrame {
  webp: Uint8Array;
  delay: number;
  width: number;
  height: number;
  hasAlpha?: boolean;
}

type ImageChunkType = 'ALPH' | 'VP8 ' | 'VP8L';

interface ParsedChunk {
  type: string;
  data: Uint8Array;
}

function readU32(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset]
    | (bytes[offset + 1] << 8)
    | (bytes[offset + 2] << 16)
    | (bytes[offset + 3] << 24)
  ) >>> 0;
}

function writeU32(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
  bytes[offset + 3] = (value >>> 24) & 0xff;
}

function writeU24(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function fourCC(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function makeChunk(type: string, payload: Uint8Array): Uint8Array {
  const pad = payload.length % 2;
  const out = new Uint8Array(8 + payload.length + pad);
  out.set(fourCC(type), 0);
  writeU32(out, 4, payload.length);
  out.set(payload, 8);
  return out;
}

function parseWebpChunks(webp: Uint8Array): ParsedChunk[] {
  if (webp.length < 16) throw new Error('Invalid WebP: file too small');
  if (new TextDecoder().decode(webp.slice(0, 4)) !== 'RIFF') throw new Error('Invalid WebP: missing RIFF header');
  if (new TextDecoder().decode(webp.slice(8, 12)) !== 'WEBP') throw new Error('Invalid WebP: missing WEBP signature');

  const chunks: ParsedChunk[] = [];
  let offset = 12;
  while (offset + 8 <= webp.length) {
    const type = new TextDecoder().decode(webp.slice(offset, offset + 4));
    const size = readU32(webp, offset + 4);
    const dataStart = offset + 8;
    const dataEnd = dataStart + size;
    if (dataEnd > webp.length) throw new Error(`Invalid WebP: truncated ${type} chunk`);
    chunks.push({ type, data: webp.slice(dataStart, dataEnd) });
    offset = dataEnd + (size % 2);
  }
  return chunks;
}

function getImageChunks(webp: Uint8Array): ParsedChunk[] {
  const imageChunks = parseWebpChunks(webp).filter((chunk) =>
    chunk.type === 'ALPH' || chunk.type === 'VP8 ' || chunk.type === 'VP8L'
  );

  if (!imageChunks.some((chunk) => chunk.type === 'VP8 ' || chunk.type === 'VP8L')) {
    throw new Error('Invalid WebP: missing VP8/VP8L frame data');
  }

  return imageChunks;
}

function containsAlpha(frame: AnimatedWebpFrame, imageChunks: ParsedChunk[]): boolean {
  return Boolean(
    frame.hasAlpha
    || imageChunks.some((chunk) => chunk.type === 'ALPH')
    || imageChunks.some((chunk) => chunk.type === 'VP8L')
  );
}

export function encodeAnimatedWebp(frames: AnimatedWebpFrame[], loopCount: number = 0): Uint8Array {
  if (frames.length === 0) throw new Error('No frames to encode');

  const width = frames[0].width;
  const height = frames[0].height;
  if (!(width > 0) || !(height > 0)) throw new Error('Animated WebP dimensions must be positive');

  const parsedFrames = frames.map((frame) => {
    if (frame.width !== width || frame.height !== height) {
      throw new Error('All Animated WebP frames must have identical dimensions');
    }
    return {
      ...frame,
      imageChunks: getImageChunks(frame.webp),
    };
  });

  const hasAlpha = parsedFrames.some((frame) => containsAlpha(frame, frame.imageChunks));

  const vp8x = new Uint8Array(10);
  vp8x[0] = 0x02 | (hasAlpha ? 0x10 : 0);
  writeU24(vp8x, 4, width - 1);
  writeU24(vp8x, 7, height - 1);

  const anim = new Uint8Array(6);
  writeU32(anim, 0, 0); // transparent background
  anim[4] = loopCount & 0xff;
  anim[5] = (loopCount >>> 8) & 0xff;

  const chunks: Uint8Array[] = [
    makeChunk('VP8X', vp8x),
    makeChunk('ANIM', anim),
  ];

  for (const frame of parsedFrames) {
    const frameHeader = new Uint8Array(16);
    writeU24(frameHeader, 0, 0);
    writeU24(frameHeader, 3, 0);
    writeU24(frameHeader, 6, width - 1);
    writeU24(frameHeader, 9, height - 1);
    writeU24(frameHeader, 12, Math.max(1, Math.round(frame.delay)));
    frameHeader[15] = 0;

    const payload = concatBytes([
      frameHeader,
      ...frame.imageChunks.map((chunk) => makeChunk(chunk.type as ImageChunkType, chunk.data)),
    ]);
    chunks.push(makeChunk('ANMF', payload));
  }

  const body = concatBytes(chunks);
  const out = new Uint8Array(12 + body.length);
  out.set(fourCC('RIFF'), 0);
  writeU32(out, 4, 4 + body.length);
  out.set(fourCC('WEBP'), 8);
  out.set(body, 12);
  return out;
}

