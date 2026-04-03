/**
 * Palette Import/Export — Supports .hex and .gpl (GIMP Palette) formats.
 */
import type { RGB } from './palettes';
import { hexToRgb, rgbToHex } from './colorUtils';

// ─── Parsing ───

/**
 * Parse a .hex file — one hex color per line (e.g. "#FF0000" or "FF0000").
 */
export function parseHexFile(text: string): { name: string; colors: RGB[] } | null {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith(';'));
  const colors: RGB[] = [];
  for (const line of lines) {
    const rgb = hexToRgb(line);
    if (rgb) colors.push(rgb);
  }
  if (colors.length < 2) return null;
  return { name: '', colors };
}

/**
 * Parse a .gpl (GIMP Palette) file.
 * Format:
 *   GIMP Palette
 *   Name: My Palette
 *   Columns: 16
 *   #
 *   255   0   0  Red
 *   0   255   0  Green
 */
export function parseGplFile(text: string): { name: string; colors: RGB[] } | null {
  const lines = text.split(/\r?\n/);
  if (!lines[0]?.trim().startsWith('GIMP Palette')) return null;

  let name = '';
  const colors: RGB[] = [];
  let headerDone = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!headerDone) {
      if (line.startsWith('Name:')) {
        name = line.slice(5).trim();
        continue;
      }
      if (line.startsWith('Columns:') || line === '' || line === '#') {
        if (line === '#') headerDone = true;
        continue;
      }
      headerDone = true;
    }
    // Parse "R G B [name]"
    const match = line.match(/^\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})/);
    if (match) {
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
        colors.push({ r, g, b });
      }
    }
  }

  if (colors.length < 2) return null;
  return { name, colors };
}

/**
 * Parse a .pal (JASC-PAL / RIFF PAL) file.
 * JASC-PAL format:
 *   JASC-PAL
 *   0100
 *   256
 *   R G B
 *   ...
 */
export function parsePalFile(data: string | ArrayBuffer): { name: string; colors: RGB[] } | null {
  // Try text-based JASC-PAL first
  if (typeof data === 'string') {
    const lines = data.split(/\r?\n/).map(l => l.trim());
    if (lines[0] === 'JASC-PAL') {
      const colors: RGB[] = [];
      for (let i = 3; i < lines.length; i++) {
        const match = lines[i].match(/^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})$/);
        if (match) {
          const r = parseInt(match[1]);
          const g = parseInt(match[2]);
          const b = parseInt(match[3]);
          if (r <= 255 && g <= 255 && b <= 255) colors.push({ r, g, b });
        }
      }
      if (colors.length >= 2) return { name: '', colors };
    }
  }
  // Binary RIFF PAL
  if (data instanceof ArrayBuffer && data.byteLength >= 24) {
    const view = new DataView(data);
    const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
    if (riff === 'RIFF') {
      const colors: RGB[] = [];
      const numColors = view.getUint16(22, true);
      for (let i = 0; i < numColors && 24 + i * 4 + 2 < data.byteLength; i++) {
        const offset = 24 + i * 4;
        colors.push({ r: view.getUint8(offset), g: view.getUint8(offset + 1), b: view.getUint8(offset + 2) });
      }
      if (colors.length >= 2) return { name: '', colors };
    }
  }
  return null;
}

/**
 * Parse a .act (Adobe Color Table) file — 768 bytes (256 * 3 RGB).
 */
export function parseActFile(data: ArrayBuffer): { name: string; colors: RGB[] } | null {
  if (data.byteLength < 6) return null;
  const bytes = new Uint8Array(data);
  // .act is exactly 768 bytes (256 colors) or 772 bytes (with count + transparency)
  const numColors = data.byteLength >= 772
    ? (bytes[768] << 8 | bytes[769])
    : Math.floor(Math.min(data.byteLength, 768) / 3);

  if (numColors < 2) return null;
  const colors: RGB[] = [];
  for (let i = 0; i < numColors && i * 3 + 2 < data.byteLength; i++) {
    colors.push({ r: bytes[i * 3], g: bytes[i * 3 + 1], b: bytes[i * 3 + 2] });
  }
  // Filter out trailing black entries that are padding
  const meaningful = colors.filter((c, i) => i < 16 || c.r !== 0 || c.g !== 0 || c.b !== 0);
  if (meaningful.length >= 2) return { name: '', colors: meaningful };
  if (colors.length >= 2) return { name: '', colors };
  return null;
}

/**
 * Parse a .ase (Adobe Swatch Exchange) file.
 * Binary format with RGB color entries.
 */
export function parseAseFile(data: ArrayBuffer): { name: string; colors: RGB[] } | null {
  if (data.byteLength < 12) return null;
  const view = new DataView(data);
  // Signature: ASEF
  const sig = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  if (sig !== 'ASEF') return null;

  const colors: RGB[] = [];
  let offset = 12; // Skip header (4 sig + 2 ver major + 2 ver minor + 4 block count)

  while (offset + 6 < data.byteLength) {
    const blockType = view.getUint16(offset, false);
    const blockLen = view.getUint32(offset + 2, false);
    offset += 6;

    if (blockType === 0x0001 && blockLen > 0) { // Color entry
      // Skip name: 2-byte length (char count) + UTF-16BE chars
      const nameLen = view.getUint16(offset, false);
      let colorOffset = offset + 2 + nameLen * 2;

      if (colorOffset + 4 <= data.byteLength) {
        const model = String.fromCharCode(
          view.getUint8(colorOffset), view.getUint8(colorOffset + 1),
          view.getUint8(colorOffset + 2), view.getUint8(colorOffset + 3)
        );
        colorOffset += 4;

        if (model === 'RGB ' && colorOffset + 12 <= data.byteLength) {
          const r = Math.round(view.getFloat32(colorOffset, false) * 255);
          const g = Math.round(view.getFloat32(colorOffset + 4, false) * 255);
          const b = Math.round(view.getFloat32(colorOffset + 8, false) * 255);
          colors.push({
            r: Math.max(0, Math.min(255, r)),
            g: Math.max(0, Math.min(255, g)),
            b: Math.max(0, Math.min(255, b)),
          });
        }
      }
      offset += blockLen;
    } else {
      offset += blockLen;
    }
  }

  if (colors.length >= 2) return { name: '', colors };
  return null;
}

/**
 * Auto-detect file format and parse.
 * Supports text formats (.hex, .gpl, .pal JASC) and binary formats (.act, .ase, .pal RIFF).
 */
export function parsePaletteFile(text: string, filename: string, binaryData?: ArrayBuffer): { name: string; colors: RGB[] } | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  let result: { name: string; colors: RGB[] } | null = null;

  if (ext === 'act' && binaryData) {
    result = parseActFile(binaryData);
  } else if (ext === 'ase' && binaryData) {
    result = parseAseFile(binaryData);
  } else if (ext === 'pal') {
    // Try text JASC-PAL first, then binary RIFF
    result = parsePalFile(text);
    if (!result && binaryData) result = parsePalFile(binaryData);
  } else if (ext === 'gpl') {
    result = parseGplFile(text);
  } else if (ext === 'hex') {
    result = parseHexFile(text);
  } else {
    // Try all text formats, then binary
    result = parseGplFile(text) ?? parseHexFile(text) ?? parsePalFile(text);
    if (!result && binaryData) {
      result = parseActFile(binaryData) ?? parseAseFile(binaryData) ?? parsePalFile(binaryData);
    }
  }

  if (result && !result.name) {
    result.name = filename.replace(/\.[^.]+$/, '');
  }
  return result;
}

// ─── Exporting ───

/**
 * Export palette as .hex format (one color per line, #RRGGBB).
 */
export function exportAsHex(colors: RGB[]): string {
  return colors.map(c => rgbToHex(c)).join('\n') + '\n';
}

/**
 * Export palette as .gpl (GIMP Palette) format.
 */
export function exportAsGpl(name: string, colors: RGB[]): string {
  const lines = ['GIMP Palette', `Name: ${name}`, `Columns: ${Math.min(16, colors.length)}`, '#'];
  for (const c of colors) {
    lines.push(`${c.r.toString().padStart(3)} ${c.g.toString().padStart(3)} ${c.b.toString().padStart(3)}\tUntitled`);
  }
  return lines.join('\n') + '\n';
}

/**
 * Trigger file download in the browser.
 */
export function downloadFile(content: string, filename: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
