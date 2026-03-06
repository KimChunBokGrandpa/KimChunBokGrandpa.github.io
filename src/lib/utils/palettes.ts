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
  palettes: { id: string; name: string }[];
}

export const PALETTE_GROUPS: PaletteGroup[] = [
  {
    groupId: "2",
    groupName: "2 Colors",
    palettes: [
      { id: "monochrome", name: "Monochrome" },
      { id: "sepia2", name: "Monochrome" },
      { id: "blue2", name: "Monochrome" },
      { id: "green2", name: "Monochrome" },
      { id: "amber2", name: "Monochrome" },
      { id: "red2", name: "Monochrome" },
      { id: "earth2", name: "Earth Tone" },
      { id: "neon2", name: "Neon Glow" },
      { id: "ocean2", name: "Ocean" },
      { id: "sunset2", name: "Sunset" },
      { id: "vintage2", name: "Vintage Film" },
      { id: "forest2", name: "Forest Canopy" },
    ],
  },
  {
    groupId: "4",
    groupName: "4 Colors",
    palettes: [
      { id: "dmg", name: "Gameboy" },
      { id: "pocket", name: "Gameboy" },
      { id: "gb_warm", name: "Gameboy" },
      { id: "gb_blue", name: "Gameboy" },
      { id: "gb_red", name: "Gameboy" },
      { id: "gamewatch", name: "Gameboy" },
      { id: "arctic4", name: "Artistic" },
      { id: "earth4", name: "Earth Tone" },
      { id: "forest4", name: "Forest Canopy" },
      { id: "neon4", name: "Neon Glow" },
      { id: "ocean4", name: "Ocean" },
      { id: "pastel4", name: "Pastel Dream" },
      { id: "sunset4", name: "Sunset" },
      { id: "vintage4", name: "Vintage Film" },
    ],
  },
  {
    groupId: "8",
    groupName: "8 Colors",
    palettes: [
      { id: "cga", name: "Retro PC" },
      { id: "earth8", name: "Earth Tone" },
      { id: "forest8", name: "Forest Canopy" },
      { id: "neon8", name: "Neon Glow" },
      { id: "ocean8", name: "Ocean" },
      { id: "pastel8", name: "Pastel Dream" },
      { id: "sunset8", name: "Sunset" },
      { id: "vintage8", name: "Vintage Film" },
    ],
  },
  {
    groupId: "16",
    groupName: "16 Colors",
    palettes: [
      { id: "ega", name: "Retro PC" },
      { id: "msx", name: "Retro PC" },
      { id: "pico8", name: "Retro Console" },
      { id: "nes", name: "Retro Console" },
      { id: "gameboy_color", name: "Retro Console" },
      { id: "autumn16", name: "Artistic" },
      { id: "earth16", name: "Earth Tone" },
      { id: "forest16", name: "Forest Canopy" },
      { id: "neon16", name: "Neon Glow" },
      { id: "ocean16", name: "Ocean" },
      { id: "pastel16", name: "Pastel Dream" },
      { id: "sunset16", name: "Sunset" },
      { id: "vintage16", name: "Vintage Film" },
    ],
  },
  {
    groupId: "32",
    groupName: "32 Colors",
    palettes: [
      { id: "snes32", name: "Retro Console" },
      { id: "mega32", name: "Retro Console" },
      { id: "pc98", name: "Retro PC" },
      { id: "retro32", name: "Artistic" },
      { id: "twilight32", name: "Artistic" },
      { id: "earth32", name: "Earth Tone" },
      { id: "forest32", name: "Forest Canopy" },
      { id: "neon32", name: "Neon Glow" },
      { id: "ocean32", name: "Ocean" },
      { id: "pastel32", name: "Pastel Dream" },
      { id: "sunset32", name: "Sunset" },
      { id: "vintage32", name: "Vintage Film" },
    ],
  },
  {
    groupId: "48",
    groupName: "44–54 Colors",
    palettes: [
      { id: "nes_full", name: "Retro Console" },
      { id: "snes_rpg", name: "Retro Console" },
      { id: "snes_bg", name: "Retro Console" },
      { id: "neogeo_char", name: "Retro Console" },
      { id: "cyberpunk16", name: "Cyberpunk" },
      { id: "synthwave48", name: "Cyberpunk" },
      { id: "watercolor48", name: "Artistic" },
      { id: "earth48", name: "Earth Tone" },
      { id: "forest48", name: "Forest Canopy" },
      { id: "neon48", name: "Neon Glow" },
      { id: "ocean48", name: "Ocean" },
      { id: "pastel48", name: "Pastel Dream" },
      { id: "sunset48", name: "Sunset" },
      { id: "vintage48", name: "Vintage Film" },
    ],
  },
  {
    groupId: "64",
    groupName: "64 Colors",
    palettes: [
      { id: "c64_full", name: "Retro PC" },
      { id: "vga64", name: "Retro PC" },
      { id: "amiga64", name: "Retro PC" },
      { id: "retro_pc64", name: "Retro PC" },
      { id: "earth64", name: "Earth Tone" },
      { id: "forest64", name: "Forest Canopy" },
      { id: "neon64", name: "Neon Glow" },
      { id: "ocean64", name: "Ocean" },
      { id: "sunset64", name: "Sunset" },
      { id: "vintage64", name: "Vintage Film" },
    ],
  },
  {
    groupId: "128",
    groupName: "128 Colors",
    palettes: [
      { id: "snes128", name: "Retro Console" },
      { id: "gba128", name: "Retro Console" },
      { id: "earth128", name: "Earth Tone" },
      { id: "forest128", name: "Forest Canopy" },
      { id: "neon128", name: "Neon Glow" },
      { id: "ocean128", name: "Ocean" },
      { id: "sunset128", name: "Sunset" },
      { id: "vintage128", name: "Vintage Film" },
    ],
  },
  {
    groupId: "256",
    groupName: "256 Colors",
    palettes: [
      { id: "apple2gs", name: "Retro PC" },
      { id: "atarist256", name: "Retro PC" },
      { id: "spectrum256", name: "Artistic" },
      { id: "win256", name: "★ Windows 256" },
      { id: "earth256", name: "Earth Tone" },
      { id: "forest256", name: "Forest Canopy" },
      { id: "neon256", name: "Neon Glow" },
      { id: "ocean256", name: "Ocean" },
      { id: "sunset256", name: "Sunset" },
      { id: "vintage256", name: "Vintage Film" },
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
  // Theme series: earth2 → "Earth Tone 2", neon64 → "Neon Glow 64"
  for (const group of PALETTE_GROUPS) {
    const p = group.palettes.find(pal => pal.id === id);
    if (p) {
      const colorCount = (PALETTES[id] || []).length;
      return `${p.name} (${colorCount})`;
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
      const themeName = p.name.replace(/\s*\(\d+\)\s*$/, '').trim();
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
