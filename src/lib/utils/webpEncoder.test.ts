import { describe, it, expect } from 'vitest';
import { encodeAnimatedWebp } from './webpEncoder';

function writeU32(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
  bytes[offset + 3] = (value >>> 24) & 0xff;
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

function makeStillWebp(type: 'VP8 ' | 'VP8L', withAlpha: boolean = false): Uint8Array {
  const imageChunks = [
    ...(withAlpha ? [makeChunk('ALPH', new Uint8Array([1, 2, 3, 4]))] : []),
    makeChunk(type, new Uint8Array([9, 8, 7, 6])),
  ];
  const body = new Uint8Array(imageChunks.reduce((sum, chunk) => sum + chunk.length, 0));
  let offset = 0;
  for (const chunk of imageChunks) {
    body.set(chunk, offset);
    offset += chunk.length;
  }

  const out = new Uint8Array(12 + body.length);
  out.set(fourCC('RIFF'), 0);
  writeU32(out, 4, 4 + body.length);
  out.set(fourCC('WEBP'), 8);
  out.set(body, 12);
  return out;
}

function countAscii(haystack: Uint8Array, needle: string): number {
  const text = new TextDecoder().decode(haystack);
  return text.split(needle).length - 1;
}

describe('encodeAnimatedWebp', () => {
  it('throws for empty frame list', () => {
    expect(() => encodeAnimatedWebp([])).toThrow('No frames to encode');
  });

  it('creates animated WebP container with VP8X, ANIM, and ANMF chunks', () => {
    const bytes = encodeAnimatedWebp([
      { webp: makeStillWebp('VP8 '), delay: 100, width: 4, height: 4 },
      { webp: makeStillWebp('VP8L'), delay: 200, width: 4, height: 4 },
    ]);

    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe('RIFF');
    expect(new TextDecoder().decode(bytes.slice(8, 12))).toBe('WEBP');
    expect(countAscii(bytes, 'VP8X')).toBe(1);
    expect(countAscii(bytes, 'ANIM')).toBe(1);
    expect(countAscii(bytes, 'ANMF')).toBe(2);
  });

  it('sets alpha flag when any frame includes alpha chunk', () => {
    const bytes = encodeAnimatedWebp([
      { webp: makeStillWebp('VP8 ', true), delay: 100, width: 4, height: 4 },
    ]);

    const vp8xOffset = new TextDecoder().decode(bytes).indexOf('VP8X');
    expect(vp8xOffset).toBeGreaterThanOrEqual(0);
    expect(bytes[vp8xOffset + 8]).toBe(0x12);
  });

  it('throws when still WebP frame has no VP8/VP8L image data', () => {
    const invalid = new Uint8Array(20);
    invalid.set(fourCC('RIFF'), 0);
    writeU32(invalid, 4, 12);
    invalid.set(fourCC('WEBP'), 8);
    invalid.set(fourCC('JUNK'), 12);
    writeU32(invalid, 16, 0);

    expect(() =>
      encodeAnimatedWebp([{ webp: invalid, delay: 100, width: 4, height: 4 }])
    ).toThrow('Invalid WebP: missing VP8/VP8L frame data');
  });
});

