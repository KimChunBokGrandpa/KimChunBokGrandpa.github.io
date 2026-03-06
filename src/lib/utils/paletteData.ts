/**
 * Palette hex data — separated from palettes.ts for maintainability.
 * Each palette is an array of hex color strings (#RRGGBB).
 * The "win256" palette is generated programmatically in palettes.ts.
 */

/** HSL → RGB 변환 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/** RGB → hex string */
function toHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * 테마 기반 팔레트 제너레이터.
 * hues: 테마의 주요 HSL 색상각 배열
 * satRange: [min, max] 채도 범위
 * count: 생성할 색상 수
 * grayRatio: 그레이스케일 비율 (0~0.2)
 */
function generateThemePalette(
  hues: number[],
  satRange: [number, number],
  count: number,
  grayRatio = 0.12,
): string[] {
  const seen = new Set<string>();
  const colors: string[] = [];
  const grayCount = Math.max(4, Math.floor(count * grayRatio));
  const colorCount = count - grayCount;
  const stepsPerHue = Math.ceil(colorCount / hues.length);

  for (const h of hues) {
    for (let li = 0; li < stepsPerHue && colors.length < colorCount; li++) {
      const l = 0.08 + (li / (stepsPerHue - 1)) * 0.82;
      const s = satRange[0] + (satRange[1] - satRange[0]) * (0.5 + 0.5 * Math.sin(l * Math.PI));
      const [r, g, b] = hslToRgb((h + li * 2) % 360, s, l);
      const hex = toHex(r, g, b);
      if (!seen.has(hex)) { seen.add(hex); colors.push(hex); }
    }
  }
  for (let i = 0; i < grayCount; i++) {
    const v = Math.round(i * 255 / Math.max(1, grayCount - 1));
    const hex = toHex(v, v, v);
    if (!seen.has(hex)) { seen.add(hex); colors.push(hex); }
  }
  return colors.slice(0, count);
}

export const PALETTE_HEX_DATA: Record<string, string[]> = {
  // ─── 2-Color Palettes ───
  monochrome: ["#000000", "#FFFFFF"],
  sepia2: ["#2B1B0E", "#D4A96A"],
  blue2: ["#0A1628", "#6BB8E0"],
  green2: ["#0D1A00", "#33FF00"],
  amber2: ["#1A0E00", "#FFB000"],
  red2: ["#1A0000", "#CC2200"],

  // ─── 4-Color Palettes ───
  dmg: ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"],
  pocket: ["#1a1a1a", "#555555", "#aaaaaa", "#e8e8e8"],
  gb_warm: ["#2b1b00", "#7a5800", "#c8a000", "#f0e090"],
  gb_blue: ["#001040", "#204880", "#5088c0", "#b8d0f0"],
  gb_red: ["#200000", "#701010", "#c82020", "#f0a0a0"],
  gamewatch: ["#101800", "#404800", "#a0b000", "#d8e890"],
  arctic4: ["#1B2838", "#4A8DB7", "#A8D8EA", "#F0F8FF"],

  cga: ["#000000", "#555555", "#aaaaaa", "#ffffff", "#00aaaa", "#55ffff", "#aa00aa", "#ff55ff"],

  // ─── 16-Color Palettes ───
  pico8: [
    "#000000", "#1d2b53", "#7e2553", "#008751",
    "#ab5236", "#5f574f", "#c2c3c7", "#fff1e8",
    "#ff004d", "#ffa300", "#ffec27", "#00e436",
    "#29adff", "#83769c", "#ff77a8", "#ffccaa",
  ],
  nes: [
    "#000000", "#fcfcfc", "#f8f8f8", "#bcbcbc",
    "#7c7c7c", "#d82800", "#fc7460", "#f89800",
    "#f8d870", "#00d800", "#58f898", "#3cbcfc",
    "#0078f8", "#6844fc", "#d800cc", "#787800",
  ],
  ega: [
    "#000000", "#0000aa", "#00aa00", "#00aaaa",
    "#aa0000", "#aa00aa", "#aa5500", "#aaaaaa",
    "#555555", "#5555ff", "#55ff55", "#55ffff",
    "#ff5555", "#ff55ff", "#ffff55", "#ffffff",
  ],
  gameboy_color: [
    "#000000", "#181010", "#285060", "#305010",
    "#f8b800", "#f87800", "#a02028", "#505060",
    "#78a0c8", "#a8d0f0", "#50b060", "#90d870",
    "#f8d870", "#f0f0f0", "#e8c870", "#ffffff",
  ],
  msx: [
    "#000000", "#000000", "#3eb849", "#74d07d",
    "#5955e0", "#8076f1", "#b95e51", "#65dbef",
    "#db6559", "#ff897d", "#ccc35e", "#ded087",
    "#3aa241", "#b766b5", "#cccccc", "#ffffff",
  ],

  autumn16: [
    "#1A0800", "#4A1800", "#883010", "#C85020",
    "#E88030", "#F8B050", "#F8D870", "#F8F0A0",
    "#2A3010", "#4A5820", "#708040", "#A0A060",
    "#382010", "#684028", "#C0B8A0", "#F0E8D8",
  ],


  // ─── 32-Color Palettes ───
  snes32: [
    "#000000", "#181818", "#303030", "#505050",
    "#787878", "#a0a0a0", "#d0d0d0", "#ffffff",
    "#580000", "#a00000", "#e03030", "#f87070",
    "#582800", "#a05010", "#d09040", "#f0d880",
    "#205000", "#409820", "#58d858", "#90f860",
    "#004858", "#0080a8", "#30b8e0", "#a0e8f8",
    "#000068", "#1828c8", "#5068f0", "#a0b0f8",
    "#480058", "#8000a0", "#d040d0", "#f8a0f0",
  ],
  mega32: [
    "#000000", "#222222", "#444444", "#888888",
    "#cccccc", "#ffffff", "#220000", "#882200",
    "#cc4400", "#ee6622", "#ffaa44", "#ffdd88",
    "#002200", "#004400", "#22aa44", "#22ccaa",
    "#44ffcc", "#aaffee", "#000044", "#002288",
    "#0044cc", "#2288ff", "#88ccff", "#cceeFF",
    "#440044", "#880088", "#cc22cc", "#ff66ff",
    "#442200", "#884400", "#ccaa44", "#eedd88",
  ],
  pc98: [
    "#000000", "#0a0a14", "#14143c", "#1e1e5a",
    "#0000aa", "#2828cc", "#00aaff", "#00ccff",
    "#00ffff", "#aaffff", "#002200", "#00550a",
    "#008800", "#00cc44", "#00ff88", "#aaffcc",
    "#220000", "#550022", "#880000", "#cc2244",
    "#ff0066", "#ff66aa", "#330033", "#660066",
    "#aa00aa", "#cc44cc", "#ff00ff", "#ffaaff",
    "#181818", "#555555", "#aaaaaa", "#ffffff",
  ],

  retro32: [
    "#000000", "#1A1A2E", "#16213E", "#0F3460",
    "#E94560", "#FF6B6B", "#FFA07A", "#FFD700",
    "#00CEC9", "#55EFC4", "#81ECEC", "#74B9FF",
    "#A29BFE", "#DFE6E9", "#FFEAA7", "#FAB1A0",
    "#00B894", "#6C5CE7", "#FD79A8", "#E17055",
    "#2D3436", "#636E72", "#B2BEC3", "#FFFFFF",
    "#D63031", "#E84393", "#0984E3", "#00B894",
    "#FDCB6E", "#F0932B", "#EB4D4B", "#7ED6DF",
  ],
  twilight32: [
    "#0A0010", "#100820", "#181040", "#201860",
    "#302080", "#4028A0", "#5030C0", "#6840D8",
    "#8858E8", "#A870F0", "#C090F8", "#D8B0FF",
    "#F0D0FF", "#FFF0FF", "#FF6080", "#FF8070",
    "#FFA060", "#FFC050", "#FFE040", "#FFF880",
    "#001830", "#003060", "#005090", "#0078C0",
    "#00A0E0", "#40C0F0", "#80D8F8", "#C0F0FF",
    "#FFFFFF", "#C8C0D0", "#807088", "#403048",
  ],

  // ─── 48+ Color Palettes ───
  nes_full: [
    "#626262", "#001fb2", "#2404c8", "#5200b2",
    "#730076", "#800024", "#730b00", "#522800",
    "#244400", "#005700", "#005c00", "#005324",
    "#003c76", "#000000", "#ababab", "#0d57ff",
    "#4b30ff", "#8a13ff", "#bc08d6", "#d21269",
    "#c72e00", "#9d5400", "#607b00", "#209800",
    "#00a300", "#009942", "#007db4", "#ffffff",
    "#53aeff", "#9085ff", "#d365ff", "#ff57ff",
    "#ff5dcf", "#ff7757", "#fca044", "#c4be00",
    "#72d800", "#3cde5a", "#1ed9a4", "#38d5f9",
    "#4e4e4e", "#ffffff", "#c0dfff", "#d3d2ff",
    "#e8c8ff",
  ],
  snes_rpg: [
    "#080808", "#181818", "#282828", "#403830",
    "#685848", "#888070", "#a89880", "#c8b898",
    "#300800", "#602010", "#984020", "#c87840",
    "#e0a060", "#f8d098", "#200000", "#601000",
    "#c03000", "#e86020", "#f8a000", "#fff0a0",
    "#003060", "#0060a8", "#00a8e0", "#40d8f8",
    "#a0f0f8", "#e0f8ff", "#200040", "#6000a0",
    "#a000d0", "#e040f0", "#f0a0ff", "#fff0ff",
    "#301800", "#705008", "#b89010", "#e8c000",
    "#f8e060", "#fff8a0", "#002800", "#205020",
    "#409840", "#60d060", "#282040", "#4040a0",
  ],
  snes_bg: [
    "#003070", "#0848a8", "#1868c8", "#3880d8",
    "#6090d8", "#80a8e0", "#a8c8e8", "#c8dff0",
    "#f8a000", "#f87800", "#f84800", "#f82060",
    "#c81880", "#980880", "#600870", "#300058",
    "#e0e8f8", "#d0d8f0", "#b0b8d0", "#9098b8",
    "#003888", "#0050a8", "#0068c0", "#2080c8",
    "#40a0d0", "#60c0e0", "#88d8f0", "#b0f0f8",
    "#180800", "#401800", "#703800", "#a05818",
    "#d09040", "#e8c860", "#082008", "#184818",
    "#286828", "#409040", "#58b858", "#78d870",
    "#98f880", "#c0f8a0", "#101010", "#383838",
    "#686868", "#a0a0a0", "#d0d0d0", "#ffffff",
  ],
  neogeo_char: [
    "#f0c080", "#d89860", "#b87040", "#805028",
    "#503018", "#f8e0b0", "#100800", "#301000",
    "#602000", "#c04000", "#e07800", "#f8d000",
    "#d0d0d0", "#ffffff", "#300000", "#780000",
    "#c80000", "#f84040", "#f89090", "#000830",
    "#002080", "#0040d0", "#2880f8", "#80b8f8",
    "#003000", "#008000", "#40d040", "#303000",
    "#808000", "#f8c000", "#f8a000", "#300030",
    "#800080", "#d040d0", "#202020", "#484848",
    "#808080", "#c0c0c0", "#e8e8e8", "#ffffff",
    "#f8c040", "#c88010", "#804800", "#00f8f8",
    "#ff00ff", "#ffff00", "#ff8800", "#8800ff",
    "#00ff44",
  ],
  cyberpunk16: [
    "#000000", "#050510", "#0a0a20", "#101030",
    "#151540", "#1a1a50", "#ff0044", "#ff0066",
    "#ff2288", "#ff44aa", "#ff66cc", "#cc0033",
    "#0088ff", "#00aaff", "#00ccff", "#00ffff",
    "#88ffff", "#0044cc", "#00ff44", "#00ff88",
    "#00ffaa", "#44ffcc", "#88ffee", "#00aa44",
    "#8800ff", "#aa22ff", "#cc66ff", "#ee99ff",
    "#6600aa", "#440077", "#ff8800", "#ffaa00",
    "#ffcc00", "#ffee44", "#fff088", "#cc5500",
    "#ffeecc", "#ffd888", "#ffb844", "#cc8822",
    "#884400", "#442200", "#223344", "#445566",
    "#667788", "#8899aa", "#aabbcc", "#ccddee",
  ],

  watercolor48: [
    "#F5C6C6", "#E8A0A0", "#D07878", "#B85050",
    "#F8D8D8", "#FCE8E8", "#C6D8F0", "#A0B8E0",
    "#7898C8", "#5070A8", "#D8E8F8", "#E8F0FC",
    "#C6E8C6", "#A0D8A0", "#78C078", "#50A050",
    "#D8F0D8", "#E8F8E8", "#F0E8C6", "#E0D0A0",
    "#C8B878", "#B0A050", "#F8F0D8", "#FCF8E8",
    "#D8C6E8", "#C0A0D8", "#A878C0", "#8850A0",
    "#E8D8F0", "#F0E8F8", "#E0D0B8", "#C8B090",
    "#A89068", "#887048", "#F0E8D8", "#F8F0E8",
    "#C8D0D8", "#A0A8B0", "#788088", "#505860",
    "#E0E8F0", "#F0F0F0", "#FFFFFF", "#F8F8F8",
    "#B0B0B0", "#808080", "#404040", "#101010",
  ],
  synthwave48: [
    "#0A0010", "#100820", "#180C30", "#201040",
    "#281450", "#301860", "#FF0066", "#FF2288",
    "#FF44AA", "#FF66CC", "#FF88DD", "#FFAAEE",
    "#0044FF", "#0066FF", "#0088FF", "#00BBFF",
    "#00DDFF", "#66EEFF", "#6600CC", "#8800EE",
    "#AA22FF", "#CC44FF", "#DD88FF", "#EEBBFF",
    "#FF4400", "#FF6600", "#FF8800", "#FFAA00",
    "#FFCC00", "#FFEE44", "#1A1A2E", "#2A2A4E",
    "#3A3A6E", "#5A5A8E", "#8888AA", "#BBBBDD",
    "#00FF44", "#00FF88", "#44FFAA", "#88FFCC",
    "#FFFFFF", "#F0E0FF", "#E0F0FF", "#D0D0E8",
    "#A0A0C0", "#606080",
  ],

  // ─── 64-Color Palettes ───
  c64_full: [
    "#000000", "#FFFFFF", "#880000", "#AAFFEE",
    "#CC44CC", "#00CC55", "#0000AA", "#EEEE77",
    "#DD8855", "#664400", "#FF7777", "#333333",
    "#777777", "#AAFF66", "#0088FF", "#BBBBBB",
  ],
  vga64: [
    "#000000", "#0000AA", "#00AA00", "#00AAAA",
    "#AA0000", "#AA00AA", "#AA5500", "#AAAAAA",
    "#555555", "#5555FF", "#55FF55", "#55FFFF",
    "#FF5555", "#FF55FF", "#FFFF55", "#FFFFFF",
    "#000000", "#141414", "#202020", "#2C2C2C",
    "#383838", "#444444", "#505050", "#616161",
    "#717171", "#818181", "#919191", "#A1A1A1",
    "#B6B6B6", "#CACACA", "#E2E2E2", "#FFFFFF",
    "#0000FF", "#4100FF", "#7D00FF", "#BE00FF",
    "#FF00FF", "#FF00BE", "#FF007D", "#FF0041",
    "#FF0000", "#FF4100", "#FF7D00", "#FFBE00",
    "#FFFF00", "#BEFF00", "#7DFF00", "#41FF00",
    "#00FF00", "#00FF41", "#00FF7D", "#00FFBE",
    "#00FFFF", "#00BEFF", "#007DFF", "#0041FF",
    "#7D7DFF", "#9E7DFF", "#BE7DFF", "#DF7DFF",
    "#FF7DFF", "#FF7DDF", "#FF7DBE", "#FF7D9E",
  ],
  amiga64: [
    "#000000", "#111111", "#222222", "#333333",
    "#444444", "#555555", "#666666", "#777777",
    "#888888", "#999999", "#AAAAAA", "#BBBBBB",
    "#CCCCCC", "#DDDDDD", "#EEEEEE", "#FFFFFF",
    "#FF0000", "#DD0000", "#BB0000", "#990000",
    "#770000", "#550000", "#330000", "#110000",
    "#00FF00", "#00DD00", "#00BB00", "#009900",
    "#007700", "#005500", "#003300", "#001100",
    "#0000FF", "#0000DD", "#0000BB", "#000099",
    "#000077", "#000055", "#000033", "#000011",
    "#FFFF00", "#FF8800", "#FF4400", "#FF0044",
    "#FF0088", "#FF00CC", "#CC00FF", "#8800FF",
    "#4400FF", "#0044FF", "#0088FF", "#00CCFF",
    "#00FFCC", "#00FF88", "#00FF44", "#44FF00",
    "#88FF00", "#CCFF00", "#FFD800", "#FFB000",
    "#FF9000", "#FF7000", "#FF5000", "#FF3000",
  ],
  retro_pc64: [
    "#000000", "#0000A8", "#00A800", "#00A8A8",
    "#A80000", "#A800A8", "#A85400", "#A8A8A8",
    "#545454", "#5454FC", "#54FC54", "#54FCFC",
    "#FC5454", "#FC54FC", "#FCFC54", "#FCFCFC",
    "#000054", "#0054A8", "#00A854", "#00FCFC",
    "#540054", "#5454A8", "#54A854", "#54FCFC",
    "#A80054", "#A854A8", "#A8A854", "#A8FCFC",
    "#FC0054", "#FC54A8", "#FCA854", "#FCFCFC",
    "#002800", "#005400", "#008000", "#00AB00",
    "#00D500", "#00FF00", "#280000", "#540000",
    "#800000", "#AB0000", "#D50000", "#FF0000",
    "#000028", "#000054", "#000080", "#0000AB",
    "#0000D5", "#0000FF", "#282828", "#404040",
    "#585858", "#707070", "#909090", "#B0B0B0",
    "#C8C8C8", "#E0E0E0", "#F0F0F0", "#FFFFFF",
    "#FFD800", "#FFA800", "#FF7800", "#FF4800",
  ],

  // ─── 128-Color Palettes ───
  snes128: [
    // grayscale ramp (16)
    "#000000", "#111111", "#222222", "#333333",
    "#444444", "#555555", "#666666", "#777777",
    "#888888", "#999999", "#AAAAAA", "#BBBBBB",
    "#CCCCCC", "#DDDDDD", "#EEEEEE", "#FFFFFF",
    // reds (16)
    "#1A0000", "#330000", "#4D0000", "#660000",
    "#800000", "#990000", "#B30000", "#CC0000",
    "#E60000", "#FF0000", "#FF3333", "#FF6666",
    "#FF8080", "#FF9999", "#FFB3B3", "#FFCCCC",
    // oranges (16)
    "#1A0D00", "#331A00", "#4D2600", "#663300",
    "#804000", "#994D00", "#B35900", "#CC6600",
    "#E67300", "#FF8000", "#FF9933", "#FFB366",
    "#FFCC80", "#FFD999", "#FFE6B3", "#FFF0CC",
    // yellows (16)
    "#1A1A00", "#333300", "#4D4D00", "#666600",
    "#808000", "#999900", "#B3B300", "#CCCC00",
    "#E6E600", "#FFFF00", "#FFFF33", "#FFFF66",
    "#FFFF80", "#FFFF99", "#FFFFB3", "#FFFFCC",
    // greens (16)
    "#001A00", "#003300", "#004D00", "#006600",
    "#008000", "#009900", "#00B300", "#00CC00",
    "#00E600", "#00FF00", "#33FF33", "#66FF66",
    "#80FF80", "#99FF99", "#B3FFB3", "#CCFFCC",
    // cyans (16)
    "#001A1A", "#003333", "#004D4D", "#006666",
    "#008080", "#009999", "#00B3B3", "#00CCCC",
    "#00E6E6", "#00FFFF", "#33FFFF", "#66FFFF",
    "#80FFFF", "#99FFFF", "#B3FFFF", "#CCFFFF",
    // blues (16)
    "#00001A", "#000033", "#00004D", "#000066",
    "#000080", "#000099", "#0000B3", "#0000CC",
    "#0000E6", "#0000FF", "#3333FF", "#6666FF",
    "#8080FF", "#9999FF", "#B3B3FF", "#CCCCFF",
    // purples (16)
    "#1A001A", "#330033", "#4D004D", "#660066",
    "#800080", "#990099", "#B300B3", "#CC00CC",
    "#E600E6", "#FF00FF", "#FF33FF", "#FF66FF",
    "#FF80FF", "#FF99FF", "#FFB3FF", "#FFCCFF",
  ],
  gba128: [
    // grays (8)
    "#000000", "#242424", "#484848", "#6D6D6D",
    "#919191", "#B6B6B6", "#DADADA", "#FFFFFF",
    // skin/earth tones (16)
    "#3D1C00", "#5A2D0E", "#7A4420", "#9B6230",
    "#BA8348", "#D4A76A", "#E8C88E", "#F5E0B0",
    "#2B1B0E", "#4A3520", "#6B5038", "#8E6E52",
    "#B08E70", "#CEB090", "#E4D0B2", "#F4E8D4",
    // reds-oranges (16)
    "#400000", "#680000", "#8B0000", "#B22222",
    "#CD3333", "#DC4E4E", "#EA6D6D", "#F5A0A0",
    "#6B2600", "#8B4513", "#A0522D", "#B8742E",
    "#CD853F", "#DAA06D", "#E8BC8A", "#F5D5B0",
    // greens (16)
    "#002000", "#003800", "#005200", "#006E00",
    "#008B00", "#00AA00", "#2BBD2B", "#55D055",
    "#193000", "#264D00", "#3A6B00", "#4E8B00",
    "#66AA00", "#88CC22", "#AADD55", "#CCEE88",
    // blues (16)
    "#000040", "#000060", "#000088", "#0000AA",
    "#0000CC", "#2222DD", "#4444EE", "#7777FF",
    "#001830", "#002850", "#003C78", "#0052A0",
    "#006ACC", "#3388DD", "#66AAEE", "#99CCFF",
    // purples (16)
    "#200028", "#380040", "#520060", "#6E0088",
    "#8800AA", "#AA22CC", "#CC44EE", "#DD88FF",
    "#280020", "#480038", "#680052", "#880070",
    "#AA0088", "#CC22AA", "#DD55CC", "#EE88DD",
    // warm accents (16)
    "#FF0055", "#FF2277", "#FF4499", "#FF66BB",
    "#FF88CC", "#FFAADD", "#FFCCEE", "#FFEEFF",
    "#FF6600", "#FF8822", "#FFAA44", "#FFBB66",
    "#FFCC88", "#FFDDAA", "#FFEECC", "#FFF5E0",
    // cyans & teals (16)
    "#002828", "#004040", "#006060", "#008080",
    "#00A0A0", "#00C0C0", "#33D8D8", "#66EEEE",
    "#003838", "#005858", "#007878", "#009898",
    "#00B8B8", "#44D0D0", "#88E8E8", "#BBFFFF",
    // yellows (8)
    "#4D4D00", "#808000", "#B3B300", "#CCCC00",
    "#E6E600", "#FFFF33", "#FFFF88", "#FFFFCC",
  ],

  // ─── 256-Color Palettes ───
  apple2gs: (() => {
    // Apple IIGS-inspired 256-color palette: 16 hue ramps × 16 brightness levels
    const colors: string[] = [];
    const hues = [
      [255,0,0],[255,80,0],[255,160,0],[255,220,0],
      [200,255,0],[0,255,0],[0,255,128],[0,255,255],
      [0,160,255],[0,80,255],[80,0,255],[160,0,255],
      [255,0,255],[255,0,160],[255,0,80],[192,192,192],
    ];
    for (const [hr,hg,hb] of hues) {
      for (let i = 0; i < 16; i++) {
        const t = i / 15;
        colors.push(toHex(Math.round(hr * t), Math.round(hg * t), Math.round(hb * t)));
      }
    }
    return colors;
  })(),
  atarist256: (() => {
    // Atari ST-style palette: 8 levels per channel (8×8×4 = 256)
    const colors: string[] = [];
    const seen = new Set<string>();
    for (let r = 0; r < 8; r++) {
      for (let g = 0; g < 8; g++) {
        for (let b = 0; b < 4; b++) {
          const rv = Math.round(r * 255 / 7);
          const gv = Math.round(g * 255 / 7);
          const bv = Math.round(b * 255 / 3);
          const hex = toHex(rv, gv, bv);
          if (!seen.has(hex)) { seen.add(hex); colors.push(hex); }
        }
      }
    }
    // Fill remaining slots with interpolated grays
    for (let i = colors.length; i < 256; i++) {
      const v = Math.round((i - colors.length) * 255 / (256 - colors.length));
      colors.push(toHex(v, v, v));
    }
    return colors;
  })(),
  spectrum256: (() => {
    // Full spectrum with smooth gradients: 256 evenly distributed hues
    const colors: string[] = [];
    // 200 hue-based colors (full saturation, brightness variations)
    for (let i = 0; i < 200; i++) {
      const h = (i / 200) * 360;
      const s = 1;
      const l = 0.15 + (i % 10) * 0.07;
      const [r, g, b] = hslToRgb(h, s, l);
      colors.push(toHex(r, g, b));
    }
    // 32 pastel tones
    for (let i = 0; i < 32; i++) {
      const h = (i / 32) * 360;
      const [r, g, b] = hslToRgb(h, 0.5, 0.75);
      colors.push(toHex(r, g, b));
    }
    // 24 grayscale
    for (let i = 0; i < 24; i++) {
      const v = Math.round(i * 255 / 23);
      colors.push(toHex(v, v, v));
    }
    return colors;
  })(),

  // ══════════════════════════════════════════════════
  // ═══ UNIFIED THEME SERIES (consistent HSL hues) ═══
  // ══════════════════════════════════════════════════
  //
  // 각 테마의 핵심 hue를 공유하여 2색→256색 전체에서 일관된 색감을 보장합니다.
  // 색상수가 적을수록 핵심 hue만 사용하고, 많을수록 보조 hue가 추가됩니다.

  // ─── Earth Tone Series ───
  // 핵심 hue: 20(적갈), 30(갈색), 40(황갈), 55(올리브), 75(녹갈)
  earth2:   generateThemePalette([30, 45], [0.3, 0.6], 2),
  earth4:   generateThemePalette([25, 35, 50], [0.3, 0.6], 4),
  earth8:   generateThemePalette([20, 30, 40, 55], [0.3, 0.6], 8),
  earth16:  generateThemePalette([20, 30, 40, 55, 75], [0.3, 0.6], 16),
  earth32:  generateThemePalette([20, 30, 40, 55, 75, 100], [0.3, 0.6], 32),
  earth48:  generateThemePalette([20, 30, 40, 55, 75, 100], [0.3, 0.6], 48),
  earth64:  generateThemePalette([15, 25, 35, 45, 55, 70, 90, 115], [0.25, 0.6], 64),
  earth128: generateThemePalette([10, 20, 28, 35, 42, 50, 60, 75, 90, 110, 130], [0.2, 0.55], 128),
  earth256: generateThemePalette([8, 15, 20, 25, 30, 35, 40, 48, 55, 65, 75, 90, 105, 120, 140], [0.15, 0.5], 256),

  // ─── Neon Glow Series ───
  // 핵심 hue: 전 스펙트럼 (0~330), 고채도
  neon2:   generateThemePalette([330, 160], [0.9, 1.0], 2, 0.08),
  neon4:   generateThemePalette([330, 160, 210], [0.9, 1.0], 4, 0.08),
  neon8:   generateThemePalette([0, 60, 120, 210, 270, 330], [0.9, 1.0], 8, 0.08),
  neon16:  generateThemePalette([0, 30, 60, 120, 180, 270, 300, 330], [0.9, 1.0], 16, 0.08),
  neon32:  generateThemePalette([0, 30, 60, 120, 180, 210, 270, 300, 330], [0.9, 1.0], 32, 0.08),
  neon48:  generateThemePalette([0, 30, 60, 120, 180, 210, 270, 300, 330], [0.9, 1.0], 48, 0.08),
  neon64:  generateThemePalette([0, 25, 50, 75, 120, 160, 200, 240, 280, 320], [0.85, 1.0], 64, 0.08),
  neon128: generateThemePalette([0, 20, 40, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330], [0.8, 1.0], 128, 0.06),
  neon256: generateThemePalette([0, 15, 30, 45, 60, 80, 100, 120, 145, 170, 195, 220, 245, 270, 295, 320, 345], [0.75, 1.0], 256, 0.06),

  // ─── Ocean Series ───
  // 핵심 hue: 185(시안), 200(하늘), 215(코발트), 230(남색), 245(짙은남)
  ocean2:   generateThemePalette([200, 220], [0.5, 0.85], 2),
  ocean4:   generateThemePalette([195, 210, 230], [0.5, 0.85], 4),
  ocean8:   generateThemePalette([190, 205, 220, 240], [0.5, 0.85], 8),
  ocean16:  generateThemePalette([185, 200, 215, 230, 245], [0.5, 0.85], 16),
  ocean32:  generateThemePalette([185, 195, 205, 215, 225, 235, 245], [0.5, 0.85], 32),
  ocean48:  generateThemePalette([185, 195, 205, 215, 225, 235, 245], [0.5, 0.85], 48),
  ocean64:  generateThemePalette([180, 190, 200, 210, 220, 230, 240, 250], [0.45, 0.85], 64),
  ocean128: generateThemePalette([175, 185, 192, 200, 208, 216, 224, 232, 240, 248], [0.4, 0.8], 128),
  ocean256: generateThemePalette([170, 178, 185, 192, 198, 205, 212, 218, 225, 232, 238, 245, 252], [0.35, 0.8], 256),

  // ─── Sunset Series ───
  // 핵심 hue: 340(마젠타), 0(빨강), 20(주황), 40(황금), 300(보라)
  sunset2:   generateThemePalette([350, 30], [0.6, 0.9], 2),
  sunset4:   generateThemePalette([340, 10, 35], [0.6, 0.9], 4),
  sunset8:   generateThemePalette([330, 350, 15, 40], [0.6, 0.9], 8),
  sunset16:  generateThemePalette([320, 340, 0, 20, 40, 50], [0.6, 0.9], 16),
  sunset32:  generateThemePalette([0, 10, 20, 30, 40, 50, 280, 300, 320, 340], [0.6, 0.9], 32),
  sunset48:  generateThemePalette([0, 10, 20, 30, 40, 50, 280, 300, 320, 340], [0.6, 0.9], 48),
  sunset64:  generateThemePalette([350, 0, 10, 20, 30, 40, 50, 60, 280, 300, 320, 340], [0.55, 0.9], 64),
  sunset128: generateThemePalette([345, 355, 5, 15, 25, 35, 45, 55, 270, 285, 300, 315, 330], [0.5, 0.85], 128),
  sunset256: generateThemePalette([340, 348, 355, 3, 10, 18, 25, 32, 40, 48, 56, 265, 278, 290, 305, 318, 335], [0.45, 0.85], 256),

  // ─── Vintage Film Series ───
  // 핵심 hue: 20(세피아), 30(갈색), 40(카키), 80(올리브그린), 낮은 채도
  vintage2:   generateThemePalette([25, 40], [0.15, 0.4], 2),
  vintage4:   generateThemePalette([20, 35, 50], [0.15, 0.4], 4),
  vintage8:   generateThemePalette([20, 30, 40, 80], [0.15, 0.4], 8),
  vintage16:  generateThemePalette([20, 30, 40, 50, 80, 120], [0.15, 0.4], 16),
  vintage32:  generateThemePalette([20, 30, 40, 50, 80, 120, 200], [0.15, 0.4], 32),
  vintage48:  generateThemePalette([20, 30, 40, 50, 80, 120, 200], [0.15, 0.4], 48),
  vintage64:  generateThemePalette([15, 25, 35, 45, 55, 80, 110, 190], [0.12, 0.38], 64),
  vintage128: generateThemePalette([10, 20, 28, 35, 42, 50, 60, 80, 100, 130, 180], [0.1, 0.35], 128),
  vintage256: generateThemePalette([8, 15, 22, 28, 34, 40, 48, 56, 70, 85, 100, 120, 150, 180, 210], [0.08, 0.32], 256),

  // ─── Forest Canopy Series ───
  // 핵심 hue: 80(연두), 100(녹색), 120(짙은녹), 140(청록), 160(에메랄드)
  forest2:   generateThemePalette([100, 130], [0.4, 0.7], 2),
  forest4:   generateThemePalette([90, 115, 140], [0.4, 0.7], 4),
  forest8:   generateThemePalette([85, 105, 125, 150], [0.4, 0.7], 8),
  forest16:  generateThemePalette([80, 100, 120, 140, 160], [0.4, 0.7], 16),
  forest32:  generateThemePalette([80, 95, 110, 125, 140, 155, 170], [0.4, 0.7], 32),
  forest48:  generateThemePalette([80, 95, 110, 125, 140, 155, 170], [0.4, 0.7], 48),
  forest64:  generateThemePalette([75, 88, 100, 112, 125, 138, 150, 165], [0.35, 0.7], 64),
  forest128: generateThemePalette([70, 82, 93, 105, 115, 125, 135, 148, 160, 175], [0.3, 0.65], 128),
  forest256: generateThemePalette([65, 75, 85, 95, 105, 112, 120, 128, 138, 148, 158, 170, 185], [0.25, 0.65], 256),

  // ─── Pastel Dream Series ───
  // 핵심 hue: 전 스펙트럼, 고명도 / 중간 채도
  pastel4:   generateThemePalette([330, 210, 120], [0.4, 0.65], 4, 0.05),
  pastel8:   generateThemePalette([330, 210, 120, 50], [0.4, 0.65], 8, 0.08),
  pastel16:  generateThemePalette([330, 270, 210, 150, 90, 30], [0.4, 0.65], 16, 0.08),
  pastel32:  generateThemePalette([330, 290, 250, 210, 170, 130, 90, 50], [0.4, 0.65], 32, 0.08),
  pastel48:  generateThemePalette([330, 300, 270, 240, 210, 180, 150, 120, 90, 50], [0.4, 0.65], 48, 0.08),
};

