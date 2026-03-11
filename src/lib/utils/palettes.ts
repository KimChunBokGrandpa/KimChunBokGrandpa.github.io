import { PALETTE_HEX_DATA } from "./paletteData";
import type { TranslationKey } from '../i18n/en';

export type RGB = { r: number; g: number; b: number };

function hexToRgb(hex: string): RGB {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

export interface PaletteGroup {
  groupId: string;
  groupName: string;
  palettes: { id: string; theme: string }[];
}

export const PALETTE_GROUPS: PaletteGroup[] = [
  {
    groupId: "2",
    groupName: "2 Colors",
    palettes: [
      { id: "monochrome", theme: "Monochrome" },
      { id: "sepia2", theme: "Monochrome" },
      { id: "blue2", theme: "Monochrome" },
      { id: "green2", theme: "Monochrome" },
      { id: "amber2", theme: "Monochrome" },
      { id: "red2", theme: "Monochrome" },
      { id: "earth2", theme: "Earth Tone" },
      { id: "neon2", theme: "Neon Glow" },
      { id: "ocean2", theme: "Ocean" },
      { id: "sunset2", theme: "Sunset" },
      { id: "vintage2", theme: "Vintage Film" },
      { id: "forest2", theme: "Forest Canopy" },
      { id: "pastel2", theme: "Pastel Dream" },
    ],
  },
  {
    groupId: "4",
    groupName: "4 Colors",
    palettes: [
      { id: "dmg", theme: "Gameboy" },
      { id: "pocket", theme: "Gameboy" },
      { id: "gb_warm", theme: "Gameboy" },
      { id: "gb_blue", theme: "Gameboy" },
      { id: "gb_red", theme: "Gameboy" },
      { id: "gamewatch", theme: "Gameboy" },
      { id: "arctic4", theme: "Artistic" },
      { id: "earth4", theme: "Earth Tone" },
      { id: "forest4", theme: "Forest Canopy" },
      { id: "neon4", theme: "Neon Glow" },
      { id: "ocean4", theme: "Ocean" },
      { id: "pastel4", theme: "Pastel Dream" },
      { id: "sunset4", theme: "Sunset" },
      { id: "vintage4", theme: "Vintage Film" },
    ],
  },
  {
    groupId: "8",
    groupName: "8 Colors",
    palettes: [
      { id: "cga", theme: "Retro PC" },
      { id: "earth8", theme: "Earth Tone" },
      { id: "forest8", theme: "Forest Canopy" },
      { id: "neon8", theme: "Neon Glow" },
      { id: "ocean8", theme: "Ocean" },
      { id: "pastel8", theme: "Pastel Dream" },
      { id: "sunset8", theme: "Sunset" },
      { id: "vintage8", theme: "Vintage Film" },
    ],
  },
  {
    groupId: "16",
    groupName: "16 Colors",
    palettes: [
      { id: "ega", theme: "Retro PC" },
      { id: "msx", theme: "Retro PC" },
      { id: "pico8", theme: "Retro Console" },
      { id: "nes", theme: "Retro Console" },
      { id: "gameboy_color", theme: "Retro Console" },
      { id: "autumn16", theme: "Artistic" },
      { id: "c64_full", theme: "Retro PC" },
      { id: "earth16", theme: "Earth Tone" },
      { id: "forest16", theme: "Forest Canopy" },
      { id: "neon16", theme: "Neon Glow" },
      { id: "ocean16", theme: "Ocean" },
      { id: "pastel16", theme: "Pastel Dream" },
      { id: "sunset16", theme: "Sunset" },
      { id: "vintage16", theme: "Vintage Film" },
    ],
  },
  {
    groupId: "32",
    groupName: "32 Colors",
    palettes: [
      { id: "snes32", theme: "Retro Console" },
      { id: "mega32", theme: "Retro Console" },
      { id: "pc98", theme: "Retro PC" },
      { id: "retro32", theme: "Artistic" },
      { id: "twilight32", theme: "Artistic" },
      { id: "earth32", theme: "Earth Tone" },
      { id: "forest32", theme: "Forest Canopy" },
      { id: "neon32", theme: "Neon Glow" },
      { id: "ocean32", theme: "Ocean" },
      { id: "pastel32", theme: "Pastel Dream" },
      { id: "sunset32", theme: "Sunset" },
      { id: "vintage32", theme: "Vintage Film" },
    ],
  },
  {
    groupId: "48",
    groupName: "44–54 Colors",
    palettes: [
      { id: "nes_full", theme: "Retro Console" },
      { id: "snes_rpg", theme: "Retro Console" },
      { id: "snes_bg", theme: "Retro Console" },
      { id: "neogeo_char", theme: "Retro Console" },
      { id: "cyberpunk16", theme: "Cyberpunk" },
      { id: "synthwave48", theme: "Cyberpunk" },
      { id: "watercolor48", theme: "Artistic" },
      { id: "earth48", theme: "Earth Tone" },
      { id: "forest48", theme: "Forest Canopy" },
      { id: "neon48", theme: "Neon Glow" },
      { id: "ocean48", theme: "Ocean" },
      { id: "pastel48", theme: "Pastel Dream" },
      { id: "sunset48", theme: "Sunset" },
      { id: "vintage48", theme: "Vintage Film" },
    ],
  },
  {
    groupId: "64",
    groupName: "64 Colors",
    palettes: [
      { id: "vga64", theme: "Retro PC" },
      { id: "amiga64", theme: "Retro PC" },
      { id: "retro_pc64", theme: "Retro PC" },
      { id: "earth64", theme: "Earth Tone" },
      { id: "forest64", theme: "Forest Canopy" },
      { id: "neon64", theme: "Neon Glow" },
      { id: "ocean64", theme: "Ocean" },
      { id: "pastel64", theme: "Pastel Dream" },
      { id: "sunset64", theme: "Sunset" },
      { id: "vintage64", theme: "Vintage Film" },
    ],
  },
  {
    groupId: "128",
    groupName: "128 Colors",
    palettes: [
      { id: "snes128", theme: "Retro Console" },
      { id: "gba128", theme: "Retro Console" },
      { id: "earth128", theme: "Earth Tone" },
      { id: "forest128", theme: "Forest Canopy" },
      { id: "neon128", theme: "Neon Glow" },
      { id: "ocean128", theme: "Ocean" },
      { id: "pastel128", theme: "Pastel Dream" },
      { id: "sunset128", theme: "Sunset" },
      { id: "vintage128", theme: "Vintage Film" },
    ],
  },
  {
    groupId: "256",
    groupName: "256 Colors",
    palettes: [
      { id: "apple2gs", theme: "Retro PC" },
      { id: "atarist256", theme: "Retro PC" },
      { id: "spectrum256", theme: "Artistic" },
      { id: "win256", theme: "★ Windows 256" },
      { id: "earth256", theme: "Earth Tone" },
      { id: "forest256", theme: "Forest Canopy" },
      { id: "neon256", theme: "Neon Glow" },
      { id: "ocean256", theme: "Ocean" },
      { id: "pastel256", theme: "Pastel Dream" },
      { id: "sunset256", theme: "Sunset" },
      { id: "vintage256", theme: "Vintage Film" },
    ],
  },
];

// ─── Convert hex data to RGB palettes at module load ───
const hexPalettes: Record<string, RGB[]> = {};
for (const [id, hexArr] of Object.entries(PALETTE_HEX_DATA)) {
  hexPalettes[id] = hexArr.map(hexToRgb);
}

// ─── Web-safe 256-color palette (generated) ───
function generateWebSafePalette(): RGB[] {
  const seen = new Set<string>();
  const palette: RGB[] = [];

  function add(r: number, g: number, b: number) {
    const key = `${r}:${g}:${b}`;
    if (!seen.has(key)) {
      seen.add(key);
      palette.push({ r, g, b });
    }
  }

  // Web-safe 216 colors
  const values = [0, 51, 102, 153, 204, 255];
  for (const r of values) {
    for (const g of values) {
      for (const b of values) {
        add(r, g, b);
      }
    }
  }

  // Additional EGA-style colors (only unique ones added)
  const extras: [number, number, number][] = [
    [0, 0, 170],
    [0, 170, 0],
    [0, 170, 170],
    [170, 0, 0],
    [170, 0, 170],
    [170, 85, 0],
    [170, 170, 170],
    [85, 85, 85],
    [85, 85, 255],
    [85, 255, 85],
    [85, 255, 255],
    [255, 85, 85],
    [255, 85, 255],
    [255, 255, 85],
  ];
  for (const [r, g, b] of extras) {
    add(r, g, b);
  }

  return palette;
}

export const PALETTES: Record<string, RGB[]> = {
  ...hexPalettes,
  win256: generateWebSafePalette(),
};

// ─── Palette Display Name Lookup ───
// Each palette has a nameKey (i18n TranslationKey) and a fallback English name.
const DISPLAY_NAMES: Record<string, { name: string; nameKey: TranslationKey }> = {
  original: { name: "Full Color (Original)", nameKey: "palette_original" },
  win256: { name: "8-bit Windows 256", nameKey: "palette_win256" },
  // Monochrome
  monochrome: { name: "Monochrome (B&W)", nameKey: "palette_monochrome" },
  sepia2: { name: "Sepia Duo", nameKey: "palette_sepia2" },
  blue2: { name: "Blueprint", nameKey: "palette_blue2" },
  green2: { name: "Terminal Green", nameKey: "palette_green2" },
  amber2: { name: "Amber CRT", nameKey: "palette_amber2" },
  red2: { name: "Darkroom Red", nameKey: "palette_red2" },
  earth2: { name: "Earth Tone (2)", nameKey: "palette_earth2" },
  neon2: { name: "Neon Glow (2)", nameKey: "palette_neon2" },
  ocean2: { name: "Ocean (2)", nameKey: "palette_ocean2" },
  sunset2: { name: "Sunset (2)", nameKey: "palette_sunset2" },
  vintage2: { name: "Vintage Film (2)", nameKey: "palette_vintage2" },
  forest2: { name: "Forest Canopy (2)", nameKey: "palette_forest2" },
  pastel2: { name: "Pastel Dream (2)", nameKey: "palette_pastel2" },
  // Gameboy
  dmg: { name: "DMG Green", nameKey: "palette_dmg" },
  pocket: { name: "GB Pocket", nameKey: "palette_pocket" },
  gb_warm: { name: "GB Warm Amber", nameKey: "palette_gb_warm" },
  gb_blue: { name: "GB Blue", nameKey: "palette_gb_blue" },
  gb_red: { name: "GB Red", nameKey: "palette_gb_red" },
  gamewatch: { name: "Game & Watch LCD", nameKey: "palette_gamewatch" },
  arctic4: { name: "Arctic", nameKey: "palette_arctic4" },
  earth4: { name: "Earth Tone (4)", nameKey: "palette_earth4" },
  forest4: { name: "Forest Canopy (4)", nameKey: "palette_forest4" },
  neon4: { name: "Neon Glow (4)", nameKey: "palette_neon4" },
  ocean4: { name: "Ocean (4)", nameKey: "palette_ocean4" },
  pastel4: { name: "Pastel Dream (4)", nameKey: "palette_pastel4" },
  sunset4: { name: "Sunset (4)", nameKey: "palette_sunset4" },
  vintage4: { name: "Vintage Film (4)", nameKey: "palette_vintage4" },
  // Retro PC (8 colors)
  cga: { name: "CGA Mode4", nameKey: "palette_cga" },
  earth8: { name: "Earth Tone (8)", nameKey: "palette_earth8" },
  forest8: { name: "Forest Canopy (8)", nameKey: "palette_forest8" },
  neon8: { name: "Neon Glow (8)", nameKey: "palette_neon8" },
  ocean8: { name: "Ocean (8)", nameKey: "palette_ocean8" },
  pastel8: { name: "Pastel Dream (8)", nameKey: "palette_pastel8" },
  sunset8: { name: "Sunset (8)", nameKey: "palette_sunset8" },
  vintage8: { name: "Vintage Film (8)", nameKey: "palette_vintage8" },
  // Retro Console / PC (16 colors)
  ega: { name: "IBM EGA", nameKey: "palette_ega" },
  msx: { name: "MSX TMS9918", nameKey: "palette_msx" },
  pico8: { name: "PICO-8", nameKey: "palette_pico8" },
  nes: { name: "NES Standard", nameKey: "palette_nes" },
  gameboy_color: { name: "GBC Color", nameKey: "palette_gameboy_color" },
  autumn16: { name: "Autumn Harvest", nameKey: "palette_autumn16" },
  c64_full: { name: "Commodore 64", nameKey: "palette_c64_full" },
  earth16: { name: "Earth Tone (16)", nameKey: "palette_earth16" },
  forest16: { name: "Forest Canopy (16)", nameKey: "palette_forest16" },
  neon16: { name: "Neon Glow (16)", nameKey: "palette_neon16" },
  ocean16: { name: "Ocean (16)", nameKey: "palette_ocean16" },
  pastel16: { name: "Pastel Dream (16)", nameKey: "palette_pastel16" },
  sunset16: { name: "Sunset (16)", nameKey: "palette_sunset16" },
  vintage16: { name: "Vintage Film (16)", nameKey: "palette_vintage16" },
  // 32 colors
  snes32: { name: "SNES Natural", nameKey: "palette_snes32" },
  mega32: { name: "Mega Drive", nameKey: "palette_mega32" },
  pc98: { name: "PC-98 Night", nameKey: "palette_pc98" },
  retro32: { name: "Retro Pop", nameKey: "palette_retro32" },
  twilight32: { name: "Twilight Sky", nameKey: "palette_twilight32" },
  earth32: { name: "Earth Tone (32)", nameKey: "palette_earth32" },
  forest32: { name: "Forest Canopy (32)", nameKey: "palette_forest32" },
  neon32: { name: "Neon Glow (32)", nameKey: "palette_neon32" },
  ocean32: { name: "Ocean (32)", nameKey: "palette_ocean32" },
  pastel32: { name: "Pastel Dream (32)", nameKey: "palette_pastel32" },
  sunset32: { name: "Sunset (32)", nameKey: "palette_sunset32" },
  vintage32: { name: "Vintage Film (32)", nameKey: "palette_vintage32" },
  // 44–54 colors
  nes_full: { name: "NES Full (45)", nameKey: "palette_nes_full" },
  snes_rpg: { name: "SNES RPG (44)", nameKey: "palette_snes_rpg" },
  snes_bg: { name: "SNES Background (48)", nameKey: "palette_snes_bg" },
  neogeo_char: { name: "NEO-GEO Character (49)", nameKey: "palette_neogeo_char" },
  cyberpunk16: { name: "Cyberpunk City (48)", nameKey: "palette_cyberpunk16" },
  synthwave48: { name: "Synthwave (46)", nameKey: "palette_synthwave48" },
  watercolor48: { name: "Watercolor (48)", nameKey: "palette_watercolor48" },
  earth48: { name: "Earth Tone (48)", nameKey: "palette_earth48" },
  forest48: { name: "Forest Canopy (48)", nameKey: "palette_forest48" },
  neon48: { name: "Neon Glow (48)", nameKey: "palette_neon48" },
  ocean48: { name: "Ocean (48)", nameKey: "palette_ocean48" },
  pastel48: { name: "Pastel Dream (48)", nameKey: "palette_pastel48" },
  sunset48: { name: "Sunset (48)", nameKey: "palette_sunset48" },
  vintage48: { name: "Vintage Film (48)", nameKey: "palette_vintage48" },
  // 64 colors
  vga64: { name: "VGA Standard", nameKey: "palette_vga64" },
  amiga64: { name: "Amiga OCS", nameKey: "palette_amiga64" },
  retro_pc64: { name: "Retro PC 64", nameKey: "palette_retro_pc64" },
  earth64: { name: "Earth Tone (64)", nameKey: "palette_earth64" },
  forest64: { name: "Forest Canopy (64)", nameKey: "palette_forest64" },
  neon64: { name: "Neon Glow (64)", nameKey: "palette_neon64" },
  ocean64: { name: "Ocean (64)", nameKey: "palette_ocean64" },
  pastel64: { name: "Pastel Dream (64)", nameKey: "palette_pastel64" },
  sunset64: { name: "Sunset (64)", nameKey: "palette_sunset64" },
  vintage64: { name: "Vintage Film (64)", nameKey: "palette_vintage64" },
  // 128 colors
  snes128: { name: "SNES Extended", nameKey: "palette_snes128" },
  gba128: { name: "GBA Natural", nameKey: "palette_gba128" },
  earth128: { name: "Earth Tone (128)", nameKey: "palette_earth128" },
  forest128: { name: "Forest Canopy (128)", nameKey: "palette_forest128" },
  neon128: { name: "Neon Glow (128)", nameKey: "palette_neon128" },
  ocean128: { name: "Ocean (128)", nameKey: "palette_ocean128" },
  pastel128: { name: "Pastel Dream (128)", nameKey: "palette_pastel128" },
  sunset128: { name: "Sunset (128)", nameKey: "palette_sunset128" },
  vintage128: { name: "Vintage Film (128)", nameKey: "palette_vintage128" },
  // 256 colors
  apple2gs: { name: "Apple IIGS", nameKey: "palette_apple2gs" },
  atarist256: { name: "Atari ST", nameKey: "palette_atarist256" },
  spectrum256: { name: "Spectrum", nameKey: "palette_spectrum256" },
  earth256: { name: "Earth Tone (256)", nameKey: "palette_earth256" },
  forest256: { name: "Forest Canopy (256)", nameKey: "palette_forest256" },
  neon256: { name: "Neon Glow (256)", nameKey: "palette_neon256" },
  ocean256: { name: "Ocean (256)", nameKey: "palette_ocean256" },
  pastel256: { name: "Pastel Dream (256)", nameKey: "palette_pastel256" },
  sunset256: { name: "Sunset (256)", nameKey: "palette_sunset256" },
  vintage256: { name: "Vintage Film (256)", nameKey: "palette_vintage256" },
};

// Reverse lookup: palette id → { theme, colorCount } (built once)
const _paletteIdLookup = new Map<string, { theme: string; colorCount: number }>();
for (const group of PALETTE_GROUPS) {
  for (const p of group.palettes) {
    _paletteIdLookup.set(p.id, {
      theme: p.theme,
      colorCount: (PALETTES[p.id] || []).length,
    });
  }
}

/**
 * Register a translate function for i18n palette names.
 * Called once from the app root to avoid importing svelte runes in utility code.
 */
let _translate: ((key: TranslationKey) => string) | null = null;
export function registerPaletteTranslator(fn: (key: TranslationKey) => string): void {
  _translate = fn;
}

export function getPaletteName(id: string): string {
  const entry = DISPLAY_NAMES[id];
  if (entry) {
    if (_translate) return _translate(entry.nameKey);
    return entry.name;
  }
  const info = _paletteIdLookup.get(id);
  if (info) return `${info.theme} (${info.colorCount})`;
  return id;
}

// ─── Theme-based palette grouping (auto-built from PALETTE_GROUPS) ───
export interface PaletteTheme {
  themeId: string;
  themeName: string;
  variants: { id: string; colorCount: number; groupName: string }[];
}

export const PALETTE_THEMES: PaletteTheme[] = (() => {
  // Collect all palettes with their group info
  const themeMap = new Map<string, { id: string; colorCount: number; groupName: string }[]>();

  for (const group of PALETTE_GROUPS) {
    for (const p of group.palettes) {
      // Extract base theme name (remove color count suffixes like "(48)")
      const themeName = p.theme.replace(/\s*\(\d+\)\s*$/, '').trim();
      if (!themeMap.has(themeName)) themeMap.set(themeName, []);
      const colorCount = (PALETTES[p.id] || []).length;
      themeMap.get(themeName)!.push({ id: p.id, colorCount, groupName: group.groupName });
    }
  }

  // Build themes: only themes with 2+ variants get their own group
  // Single-variant palettes go into a "Standalone" group
  const themes: PaletteTheme[] = [];
  const standalone: PaletteTheme['variants'] = [];

  for (const [name, variants] of [...themeMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    // Sort variants by color count
    variants.sort((a, b) => a.colorCount - b.colorCount);
    if (variants.length >= 2) {
      themes.push({
        themeId: name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        themeName: name,
        variants,
      });
    } else {
      standalone.push(...variants);
    }
  }

  // Add standalone group at the end
  if (standalone.length > 0) {
    standalone.sort((a, b) => a.colorCount - b.colorCount);
    themes.push({
      themeId: '_standalone',
      themeName: 'Standalone',
      variants: standalone,
    });
  }

  return themes;
})();
