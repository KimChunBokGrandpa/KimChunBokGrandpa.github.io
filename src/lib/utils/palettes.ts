import { PALETTE_HEX_DATA } from "./paletteData";

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
// PALETTE_GROUPS.name은 테마 그룹핑용이므로, 개별 팔레트 표시 이름은 별도 정의
const DISPLAY_NAMES: Record<string, string> = {
  original: "Full Color (Original)",
  win256: "8-bit Windows 256",
  // Monochrome
  monochrome: "Monochrome (B&W)",
  sepia2: "Sepia Duo",
  blue2: "Blueprint",
  green2: "Terminal Green",
  amber2: "Amber CRT",
  red2: "Darkroom Red",
  // Gameboy
  dmg: "DMG Green",
  pocket: "GB Pocket",
  gb_warm: "GB Warm Amber",
  gb_blue: "GB Blue",
  gb_red: "GB Red",
  gamewatch: "Game & Watch LCD",
  // Retro Console
  pico8: "PICO-8",
  nes: "NES Standard",
  gameboy_color: "GBC Color",
  snes32: "SNES Natural",
  mega32: "Mega Drive",
  nes_full: "NES Full (45)",
  snes_rpg: "SNES RPG (44)",
  snes_bg: "SNES Background (48)",
  neogeo_char: "NEO-GEO Character (49)",
  snes128: "SNES Extended",
  gba128: "GBA Natural",
  // Retro PC
  cga: "CGA Mode4",
  ega: "IBM EGA",
  msx: "MSX TMS9918",
  pc98: "PC-98 Night",
  c64_full: "Commodore 64",
  vga64: "VGA Standard",
  amiga64: "Amiga OCS",
  retro_pc64: "Retro PC 64",
  apple2gs: "Apple IIGS",
  atarist256: "Atari ST",
  // Artistic
  arctic4: "Arctic",
  autumn16: "Autumn Harvest",
  retro32: "Retro Pop",
  twilight32: "Twilight Sky",
  watercolor48: "Watercolor (48)",
  spectrum256: "Spectrum",
  // Cyberpunk
  cyberpunk16: "Cyberpunk City (48)",
  synthwave48: "Synthwave (46)",
};

export function getPaletteName(id: string): string {
  if (DISPLAY_NAMES[id]) return DISPLAY_NAMES[id];
  // Theme series: earth2 → "Earth Tone (2)", neon64 → "Neon Glow (64)"
  for (const group of PALETTE_GROUPS) {
    const p = group.palettes.find(pal => pal.id === id);
    if (p) {
      const colorCount = (PALETTES[id] || []).length;
      return `${p.theme} (${colorCount})`;
    }
  }
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
