/**
 * APNG Encoder — Encodes RGBA frames into an Animated PNG (APNG) file.
 *
 * APNG extends PNG with animation control (acTL) and frame data (fcTL + fdAT) chunks.
 * Each frame is independently deflate-compressed. The first frame doubles as the
 * default (static) PNG image for non-APNG-aware decoders.
 *
 * Reference: https://wiki.mozilla.org/APNG_Specification
 */

/** CRC32 lookup table (built once) */
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buf: Uint8Array, start: number, len: number): number {
  let c = 0xFFFFFFFF;
  for (let i = start; i < start + len; i++) {
    c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

/** Adler-32 checksum for zlib */
function adler32(buf: Uint8Array): number {
  let a = 1, b = 0;
  for (let i = 0; i < buf.length; i++) {
    a = (a + buf[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

/**
 * Minimal deflate (store-only, no compression).
 * Wraps raw data in zlib container with stored blocks.
 * Produces valid zlib stream that any decoder can read.
 */
function zlibStore(raw: Uint8Array): Uint8Array {
  const maxBlock = 65535;
  const numBlocks = Math.ceil(raw.length / maxBlock) || 1;
  // zlib header (2) + blocks * (5 header each) + raw data + adler32 (4)
  const out = new Uint8Array(2 + numBlocks * 5 + raw.length + 4);
  let pos = 0;

  // zlib header: CM=8 (deflate), CINFO=7 (32K window), FCHECK
  out[pos++] = 0x78;
  out[pos++] = 0x01;

  let remaining = raw.length;
  let offset = 0;

  while (remaining > 0) {
    const blockLen = Math.min(remaining, maxBlock);
    const isLast = remaining <= maxBlock;
    out[pos++] = isLast ? 1 : 0; // BFINAL
    out[pos++] = blockLen & 0xFF;
    out[pos++] = (blockLen >> 8) & 0xFF;
    out[pos++] = (~blockLen) & 0xFF;
    out[pos++] = ((~blockLen) >> 8) & 0xFF;
    out.set(raw.subarray(offset, offset + blockLen), pos);
    pos += blockLen;
    offset += blockLen;
    remaining -= blockLen;
  }

  // Adler-32 checksum (big-endian)
  const checksum = adler32(raw);
  out[pos++] = (checksum >> 24) & 0xFF;
  out[pos++] = (checksum >> 16) & 0xFF;
  out[pos++] = (checksum >> 8) & 0xFF;
  out[pos++] = checksum & 0xFF;

  return out.subarray(0, pos);
}

/** Build PNG-filtered scanlines (filter type 0 = None for each row) */
function buildFilteredData(rgba: Uint8ClampedArray, width: number, height: number): Uint8Array {
  const rowBytes = width * 4;
  const filtered = new Uint8Array(height * (1 + rowBytes));
  for (let y = 0; y < height; y++) {
    const outOff = y * (1 + rowBytes);
    filtered[outOff] = 0; // filter type: None
    filtered.set(rgba.subarray(y * rowBytes, y * rowBytes + rowBytes), outOff + 1);
  }
  return filtered;
}

/** Write a 4-byte big-endian uint32 into buf at offset */
function writeU32(buf: Uint8Array, offset: number, value: number): void {
  buf[offset] = (value >> 24) & 0xFF;
  buf[offset + 1] = (value >> 16) & 0xFF;
  buf[offset + 2] = (value >> 8) & 0xFF;
  buf[offset + 3] = value & 0xFF;
}

/** Write a 2-byte big-endian uint16 into buf at offset */
function writeU16(buf: Uint8Array, offset: number, value: number): void {
  buf[offset] = (value >> 8) & 0xFF;
  buf[offset + 1] = value & 0xFF;
}

/** Create a PNG chunk: length (4) + type (4) + data (N) + CRC (4) */
function makeChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(12 + data.length);
  writeU32(chunk, 0, data.length);
  chunk[4] = type.charCodeAt(0);
  chunk[5] = type.charCodeAt(1);
  chunk[6] = type.charCodeAt(2);
  chunk[7] = type.charCodeAt(3);
  chunk.set(data, 8);
  const crc = crc32(chunk, 4, 4 + data.length);
  writeU32(chunk, 8 + data.length, crc);
  return chunk;
}

export interface ApngFrame {
  /** RGBA pixel data */
  data: Uint8ClampedArray;
  /** Frame delay in milliseconds */
  delay: number;
  width: number;
  height: number;
}

/**
 * Encode frames into an APNG file.
 *
 * @param frames - Array of RGBA frames (all same dimensions)
 * @param loops - Number of loops (0 = infinite)
 * @returns Uint8Array containing the APNG file
 */
export function encodeApng(frames: ApngFrame[], loops: number = 0): Uint8Array {
  if (frames.length === 0) throw new Error('No frames to encode');

  const { width, height } = frames[0];
  const chunks: Uint8Array[] = [];

  // PNG signature
  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  chunks.push(signature);

  // IHDR chunk
  const ihdr = new Uint8Array(13);
  writeU32(ihdr, 0, width);
  writeU32(ihdr, 4, height);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  chunks.push(makeChunk('IHDR', ihdr));

  // acTL chunk (animation control)
  const actl = new Uint8Array(8);
  writeU32(actl, 0, frames.length); // num_frames
  writeU32(actl, 4, loops);         // num_plays
  chunks.push(makeChunk('acTL', actl));

  let seqNum = 0;

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];

    // Simplify delay to numerator/denominator
    // Use milliseconds with denominator 1000
    const delayMs = Math.max(1, Math.round(frame.delay));
    const delayNum = delayMs;
    const delayDen = 1000;

    // fcTL chunk (frame control) — 26 bytes of data
    const fctl = new Uint8Array(26);
    writeU32(fctl, 0, seqNum++); // sequence_number
    writeU32(fctl, 4, width);    // width
    writeU32(fctl, 8, height);   // height
    writeU32(fctl, 12, 0);       // x_offset
    writeU32(fctl, 16, 0);       // y_offset
    writeU16(fctl, 20, delayNum); // delay_num
    writeU16(fctl, 22, delayDen); // delay_den
    fctl[24] = 0; // dispose_op: APNG_DISPOSE_OP_NONE
    fctl[25] = 0; // blend_op: APNG_BLEND_OP_SOURCE
    chunks.push(makeChunk('fcTL', fctl));

    // Compress frame data
    const filtered = buildFilteredData(frame.data, width, height);
    const compressed = zlibStore(filtered);

    if (i === 0) {
      // First frame uses IDAT (backwards compatible)
      chunks.push(makeChunk('IDAT', compressed));
    } else {
      // Subsequent frames use fdAT (sequence_number + compressed data)
      const fdat = new Uint8Array(4 + compressed.length);
      writeU32(fdat, 0, seqNum++);
      fdat.set(compressed, 4);
      chunks.push(makeChunk('fdAT', fdat));
    }
  }

  // IEND chunk
  chunks.push(makeChunk('IEND', new Uint8Array(0)));

  // Concatenate all chunks
  const totalSize = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalSize);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}
