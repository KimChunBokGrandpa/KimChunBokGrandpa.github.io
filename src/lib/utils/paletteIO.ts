/**
 * Palette Import/Export — Supports .hex and .gpl (GIMP Palette) formats.
 */
import type { RGB } from './palettes';

// ─── Parsing ───

function hexToRgb(hex: string): RGB | null {
  const clean = hex.replace(/^#/, '').trim();
  if (!/^[0-9a-f]{6}$/i.test(clean)) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

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
      if (r <= 255 && g <= 255 && b <= 255) {
        colors.push({ r, g, b });
      }
    }
  }

  if (colors.length < 2) return null;
  return { name, colors };
}

/**
 * Auto-detect file format and parse.
 */
export function parsePaletteFile(text: string, filename: string): { name: string; colors: RGB[] } | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  let result: { name: string; colors: RGB[] } | null = null;

  if (ext === 'gpl') {
    result = parseGplFile(text);
  } else if (ext === 'hex') {
    result = parseHexFile(text);
  } else {
    // Try both formats
    result = parseGplFile(text) ?? parseHexFile(text);
  }

  if (result && !result.name) {
    // Use filename (without extension) as palette name
    result.name = filename.replace(/\.[^.]+$/, '');
  }
  return result;
}

// ─── Exporting ───

function rgbToHex(c: RGB): string {
  return `#${c.r.toString(16).padStart(2, '0')}${c.g.toString(16).padStart(2, '0')}${c.b.toString(16).padStart(2, '0')}`.toUpperCase();
}

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
