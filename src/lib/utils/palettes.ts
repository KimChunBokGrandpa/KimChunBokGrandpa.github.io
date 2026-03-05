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
      { id: "monochrome", name: "Monochrome (B&W)" },
      { id: "sepia2", name: "Sepia Duo" },
      { id: "blue2", name: "Blueprint" },
      { id: "green2", name: "Terminal Green" },
      { id: "amber2", name: "Amber CRT" },
      { id: "red2", name: "Darkroom Red" },
    ],
  },
  {
    groupId: "4",
    groupName: "4 Colors",
    palettes: [
      { id: "dmg", name: "DMG Green (Gameboy)" },
      { id: "pocket", name: "GB Pocket" },
      { id: "gb_warm", name: "GB Warm Amber" },
      { id: "gb_blue", name: "GB Blue" },
      { id: "gb_red", name: "GB Red" },
      { id: "gamewatch", name: "Game & Watch LCD" },
      { id: "arctic4", name: "Arctic" },
      { id: "sunset4", name: "Sunset" },
      { id: "pastel4", name: "Pastel Candy" },
      { id: "ocean4", name: "Deep Ocean" },
    ],
  },
  {
    groupId: "8",
    groupName: "8 Colors",
    palettes: [
      { id: "cga", name: "CGA Mode4" },
      { id: "pastel8", name: "Pastel Dream" },
      { id: "earth8", name: "Earth Tone" },
      { id: "neon8", name: "Neon Glow" },
      { id: "vintage8", name: "Vintage Film" },
      { id: "forest8", name: "Forest Canopy" },
    ],
  },
  {
    groupId: "16",
    groupName: "16 Colors",
    palettes: [
      { id: "pico8", name: "PICO-8" },
      { id: "nes", name: "NES Standard" },
      { id: "ega", name: "IBM EGA" },
      { id: "gameboy_color", name: "GBC Poke" },
      { id: "msx", name: "MSX TMS9918" },
      { id: "pastel16", name: "Pastel Dream 16" },
      { id: "autumn16", name: "Autumn Harvest" },
      { id: "ocean16", name: "Ocean Breeze" },
    ],
  },
  {
    groupId: "32",
    groupName: "32 Colors",
    palettes: [
      { id: "snes32", name: "SNES Natural" },
      { id: "mega32", name: "Mega Drive" },
      { id: "pc98", name: "PC-98 Night" },
      { id: "pastel32", name: "Pastel Dream 32" },
      { id: "retro32", name: "Retro Pop" },
      { id: "twilight32", name: "Twilight Sky" },
    ],
  },
  {
    groupId: "48+",
    groupName: "48+ Colors",
    palettes: [
      { id: "snes_rpg", name: "SNES RPG Interior (44)" },
      { id: "snes_bg", name: "SNES Background (48)" },
      { id: "neogeo_char", name: "NEO-GEO Character (48)" },
      { id: "cyberpunk16", name: "Cyberpunk City (48)" },
      { id: "nes_full", name: "NES Full (54)" },
      { id: "pastel48", name: "Pastel Dream 48" },
      { id: "watercolor48", name: "Watercolor (48)" },
      { id: "synthwave48", name: "Synthwave (48)" },
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

// ─── Palette Name Lookup (shared, single source of truth) ───
const paletteNameMap = new Map<string, string>([
  ["original", "Full Color (Original)"],
  ["win256", "8-bit Windows 256"],
  ["monochrome", "2-bit Monochrome"],
  ...PALETTE_GROUPS.flatMap((g) => g.palettes).map(
    (p) => [p.id, p.name] as [string, string],
  ),
]);

export function getPaletteName(id: string): string {
  return paletteNameMap.get(id) ?? id;
}
