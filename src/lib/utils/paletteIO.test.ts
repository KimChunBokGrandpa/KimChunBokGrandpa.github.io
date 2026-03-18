import { describe, it, expect } from 'vitest';
import { parseHexFile, parseGplFile, parsePaletteFile, exportAsHex, exportAsGpl } from './paletteIO';

describe('parseHexFile', () => {
  it('parses hex colors with # prefix', () => {
    const result = parseHexFile('#FF0000\n#00FF00\n#0000FF');
    expect(result).not.toBeNull();
    expect(result!.colors).toHaveLength(3);
    expect(result!.colors[0]).toEqual({ r: 255, g: 0, b: 0 });
    expect(result!.colors[1]).toEqual({ r: 0, g: 255, b: 0 });
    expect(result!.colors[2]).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('parses hex colors without # prefix', () => {
    const result = parseHexFile('FF0000\n00FF00');
    expect(result).not.toBeNull();
    expect(result!.colors).toHaveLength(2);
  });

  it('skips comments and blank lines', () => {
    const result = parseHexFile('// comment\n; another comment\n\n#FF0000\n#00FF00');
    expect(result).not.toBeNull();
    expect(result!.colors).toHaveLength(2);
  });

  it('returns null for fewer than 2 colors', () => {
    expect(parseHexFile('#FF0000')).toBeNull();
    expect(parseHexFile('')).toBeNull();
  });

  it('handles CRLF line endings', () => {
    const result = parseHexFile('#FF0000\r\n#00FF00\r\n#0000FF');
    expect(result).not.toBeNull();
    expect(result!.colors).toHaveLength(3);
  });

  it('returns empty name', () => {
    const result = parseHexFile('#FF0000\n#00FF00');
    expect(result!.name).toBe('');
  });
});

describe('parseGplFile', () => {
  const validGpl = `GIMP Palette
Name: Test Palette
Columns: 16
#
255   0   0\tRed
  0 255   0\tGreen
  0   0 255\tBlue`;

  it('parses valid GPL file', () => {
    const result = parseGplFile(validGpl);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Test Palette');
    expect(result!.colors).toHaveLength(3);
    expect(result!.colors[0]).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('returns null if not starting with GIMP Palette', () => {
    expect(parseGplFile('Not a palette\n255 0 0')).toBeNull();
  });

  it('returns null for fewer than 2 colors', () => {
    expect(parseGplFile('GIMP Palette\n#\n255 0 0')).toBeNull();
  });

  it('handles missing Name header', () => {
    const gpl = `GIMP Palette
#
255   0   0\tRed
  0 255   0\tGreen`;
    const result = parseGplFile(gpl);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('');
    expect(result!.colors).toHaveLength(2);
  });

  it('skips out-of-range RGB values', () => {
    const gpl = `GIMP Palette
#
255   0   0\tRed
300   0   0\tInvalid
  0 255   0\tGreen`;
    const result = parseGplFile(gpl);
    expect(result).not.toBeNull();
    expect(result!.colors).toHaveLength(2);
  });
});

describe('parsePaletteFile', () => {
  it('detects .hex extension', () => {
    const result = parsePaletteFile('#FF0000\n#00FF00', 'my-palette.hex');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('my-palette');
  });

  it('detects .gpl extension', () => {
    const gpl = `GIMP Palette
Name: GPL Test
#
255 0 0\tR
0 255 0\tG`;
    const result = parsePaletteFile(gpl, 'colors.gpl');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('GPL Test');
  });

  it('auto-detects format for unknown extension', () => {
    const result = parsePaletteFile('#FF0000\n#00FF00', 'palette.txt');
    expect(result).not.toBeNull();
    expect(result!.colors).toHaveLength(2);
  });

  it('uses filename as palette name when name is empty', () => {
    const result = parsePaletteFile('#FF0000\n#00FF00', 'MyColors.hex');
    expect(result!.name).toBe('MyColors');
  });
});

describe('exportAsHex', () => {
  it('exports colors as hex lines', () => {
    const result = exportAsHex([
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 0 },
    ]);
    expect(result).toBe('#FF0000\n#00FF00\n');
  });

  it('handles single color', () => {
    const result = exportAsHex([{ r: 0, g: 0, b: 0 }]);
    expect(result).toBe('#000000\n');
  });
});

describe('exportAsGpl', () => {
  it('exports valid GIMP Palette format', () => {
    const result = exportAsGpl('Test', [
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 128, b: 255 },
    ]);
    expect(result).toContain('GIMP Palette');
    expect(result).toContain('Name: Test');
    expect(result).toContain('Columns: 2');
    expect(result).toContain('255   0   0\tUntitled');
    expect(result).toContain('  0 128 255\tUntitled');
  });

  it('caps columns at 16', () => {
    const colors = Array.from({ length: 32 }, () => ({ r: 0, g: 0, b: 0 }));
    const result = exportAsGpl('Big', colors);
    expect(result).toContain('Columns: 16');
  });

  it('roundtrips with parseGplFile', () => {
    const original = [
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 0, b: 255 },
    ];
    const exported = exportAsGpl('Roundtrip', original);
    const parsed = parseGplFile(exported);
    expect(parsed).not.toBeNull();
    expect(parsed!.name).toBe('Roundtrip');
    expect(parsed!.colors).toEqual(original);
  });
});
