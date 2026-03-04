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
      { id: "monochrome", name: "★ Monochrome (B&W)" },
      { id: "sepia2", name: "★ Sepia Duo" },
      { id: "blue2", name: "Blueprint" },
      { id: "green2", name: "Terminal Green" },
    ],
  },
  {
    groupId: "4",
    groupName: "4 Colors",
    palettes: [
      { id: "dmg", name: "★ DMG Green (Gameboy)" },
      { id: "pocket", name: "GB Pocket" },
      { id: "gb_warm", name: "GB Warm Amber" },
      { id: "gb_blue", name: "GB Blue" },
      { id: "gb_red", name: "GB Red" },
      { id: "gamewatch", name: "Game & Watch LCD" },
      { id: "arctic4", name: "★ Arctic" },
      { id: "sunset4", name: "Sunset" },
    ],
  },
  {
    groupId: "8",
    groupName: "8 Colors",
    palettes: [
      { id: "cga", name: "★ CGA Mode4" },
      { id: "pastel8", name: "★ Pastel Dream" },
      { id: "earth8", name: "Earth Tone" },
    ],
  },
  {
    groupId: "16",
    groupName: "16 Colors",
    palettes: [
      { id: "pico8", name: "★ PICO-8" },
      { id: "nes", name: "★ NES Standard" },
      { id: "ega", name: "IBM EGA" },
      { id: "gameboy_color", name: "GBC Poke" },
      { id: "msx", name: "MSX TMS9918" },
    ],
  },
  {
    groupId: "32",
    groupName: "32 Colors",
    palettes: [
      { id: "snes32", name: "★ SNES Natural" },
      { id: "mega32", name: "★ Mega Drive" },
      { id: "pc98", name: "PC-98 Night" },
    ],
  },
  {
    groupId: "48+",
    groupName: "48+ Colors",
    palettes: [
      { id: "snes_rpg", name: "SNES RPG Interior (44色)" },
      { id: "snes_bg", name: "★ SNES Background (48色)" },
      { id: "neogeo_char", name: "NEO-GEO Character (48色)" },
      { id: "cyberpunk16", name: "★ Cyberpunk City (48色)" },
      { id: "nes_full", name: "NES Full (54色)" },
    ],
  },
];

export const PALETTES: Record<string, RGB[]> = {
  dmg: [
    hexToRgb("#0f380f"), // 블랙
    hexToRgb("#306230"), // 다크그린
    hexToRgb("#8bac0f"), // 라이트그린
    hexToRgb("#9bbc0f"), // 스크린화이트
  ],
  pocket: [
    hexToRgb("#1a1a1a"), // 블랙
    hexToRgb("#555555"), // 다크그레이
    hexToRgb("#aaaaaa"), // 라이트그레이
    hexToRgb("#e8e8e8"), // 화이트
  ],
  gb_warm: [
    hexToRgb("#2b1b00"), // 시에나블랙
    hexToRgb("#7a5800"), // 다크앰버
    hexToRgb("#c8a000"), // 앰버
    hexToRgb("#f0e090"), // 크림
  ],
  gb_blue: [
    hexToRgb("#001040"), // 네이비
    hexToRgb("#204880"), // 다크블루
    hexToRgb("#5088c0"), // 미드블루
    hexToRgb("#b8d0f0"), // 스카이
  ],
  gb_red: [
    hexToRgb("#200000"), // 다크레드
    hexToRgb("#701010"), // 미드레드
    hexToRgb("#c82020"), // 레드
    hexToRgb("#f0a0a0"), // 핑크화이트
  ],
  gamewatch: [
    hexToRgb("#101800"), // LCD블랙
    hexToRgb("#404800"), // LCD다크
    hexToRgb("#a0b000"), // LCD그린
    hexToRgb("#d8e890"), // LCD배경
  ],
  nes: [
    hexToRgb("#000000"), // 블랙
    hexToRgb("#fcfcfc"), // 화이트
    hexToRgb("#f8f8f8"), // 라이트그레이
    hexToRgb("#bcbcbc"), // 미드그레이
    hexToRgb("#7c7c7c"), // 다크그레이
    hexToRgb("#d82800"), // 레드
    hexToRgb("#fc7460"), // 핑크레드
    hexToRgb("#f89800"), // 오렌지
    hexToRgb("#f8d870"), // 옐로우
    hexToRgb("#00d800"), // 그린
    hexToRgb("#58f898"), // 라이트그린
    hexToRgb("#3cbcfc"), // 스카이블루
    hexToRgb("#0078f8"), // 블루
    hexToRgb("#6844fc"), // 퍼플
    hexToRgb("#d800cc"), // 마젠타
    hexToRgb("#787800"), // 올리브
  ],
  ega: [
    hexToRgb("#000000"), // 블랙
    hexToRgb("#0000aa"), // 블루
    hexToRgb("#00aa00"), // 그린
    hexToRgb("#00aaaa"), // 시안
    hexToRgb("#aa0000"), // 레드
    hexToRgb("#aa00aa"), // 마젠타
    hexToRgb("#aa5500"), // 브라운
    hexToRgb("#aaaaaa"), // 라이트그레이
    hexToRgb("#555555"), // 다크그레이
    hexToRgb("#5555ff"), // 브라이트블루
    hexToRgb("#55ff55"), // 브라이트그린
    hexToRgb("#55ffff"), // 브라이트시안
    hexToRgb("#ff5555"), // 브라이트레드
    hexToRgb("#ff55ff"), // 브라이트마젠타
    hexToRgb("#ffff55"), // 옐로우
    hexToRgb("#ffffff"), // 화이트
  ],
  cga: [
    hexToRgb("#000000"), // 블랙
    hexToRgb("#555555"), // 다크그레이
    hexToRgb("#aaaaaa"), // 그레이
    hexToRgb("#ffffff"), // 화이트
    hexToRgb("#00aaaa"), // 다크시안
    hexToRgb("#55ffff"), // 시안
    hexToRgb("#aa00aa"), // 다크마젠타
    hexToRgb("#ff55ff"), // 마젠타
  ],
  pico8: [
    hexToRgb("#000000"), // 블랙
    hexToRgb("#1d2b53"), // 다크블루
    hexToRgb("#7e2553"), // 다크퍼플
    hexToRgb("#008751"), // 다크그린
    hexToRgb("#ab5236"), // 브라운
    hexToRgb("#5f574f"), // 다크그레이
    hexToRgb("#c2c3c7"), // 라이트그레이
    hexToRgb("#fff1e8"), // 화이트
    hexToRgb("#ff004d"), // 레드
    hexToRgb("#ffa300"), // 오렌지
    hexToRgb("#ffec27"), // 옐로우
    hexToRgb("#00e436"), // 그린
    hexToRgb("#29adff"), // 블루
    hexToRgb("#83769c"), // 라벤더
    hexToRgb("#ff77a8"), // 핑크
    hexToRgb("#ffccaa"), // 피치
  ],
  gameboy_color: [
    hexToRgb("#000000"), // 블랙
    hexToRgb("#181010"), // 다크브라운
    hexToRgb("#285060"), // 다크틸
    hexToRgb("#305010"), // 다크그린
    hexToRgb("#f8b800"), // 옐로우
    hexToRgb("#f87800"), // 오렌지
    hexToRgb("#a02028"), // 레드
    hexToRgb("#505060"), // 슬레이트
    hexToRgb("#78a0c8"), // 라이트블루
    hexToRgb("#a8d0f0"), // 스카이
    hexToRgb("#50b060"), // 그린
    hexToRgb("#90d870"), // 라이트그린
    hexToRgb("#f8d870"), // 크림옐로우
    hexToRgb("#f0f0f0"), // 라이트그레이
    hexToRgb("#e8c870"), // 탄
    hexToRgb("#ffffff"), // 화이트
  ],
  msx: [
    hexToRgb("#000000"), // 투명/블랙
    hexToRgb("#000000"), // 블랙
    hexToRgb("#3eb849"), // 미디엄그린
    hexToRgb("#74d07d"), // 라이트그린
    hexToRgb("#5955e0"), // 다크블루
    hexToRgb("#8076f1"), // 라이트블루
    hexToRgb("#b95e51"), // 다크레드
    hexToRgb("#65dbef"), // 시안
    hexToRgb("#db6559"), // 미디엄레드
    hexToRgb("#ff897d"), // 라이트레드
    hexToRgb("#ccc35e"), // 다크옐로우
    hexToRgb("#ded087"), // 라이트옐로우
    hexToRgb("#3aa241"), // 다크그린
    hexToRgb("#b766b5"), // 마젠타
    hexToRgb("#cccccc"), // 그레이
    hexToRgb("#ffffff"), // 화이트
  ],
  snes32: [
    hexToRgb("#000000"), // 블랙
    hexToRgb("#181818"), // 다크블랙
    hexToRgb("#303030"), // 다크그레이
    hexToRgb("#505050"), // 미드그레이
    hexToRgb("#787878"), // 그레이
    hexToRgb("#a0a0a0"), // 실버
    hexToRgb("#d0d0d0"), // 라이트그레이
    hexToRgb("#ffffff"), // 화이트
    hexToRgb("#580000"), // 마룬
    hexToRgb("#a00000"), // 다크레드
    hexToRgb("#e03030"), // 레드
    hexToRgb("#f87070"), // 핑크레드
    hexToRgb("#582800"), // 다크브라운
    hexToRgb("#a05010"), // 브라운
    hexToRgb("#d09040"), // 탄
    hexToRgb("#f0d880"), // 크림
    hexToRgb("#205000"), // 포레스트
    hexToRgb("#409820"), // 다크그린
    hexToRgb("#58d858"), // 그린
    hexToRgb("#90f860"), // 라이트그린
    hexToRgb("#004858"), // 딥틸
    hexToRgb("#0080a8"), // 틸
    hexToRgb("#30b8e0"), // 스카이블루
    hexToRgb("#a0e8f8"), // 라이트시안
    hexToRgb("#000068"), // 다크네이비
    hexToRgb("#1828c8"), // 블루
    hexToRgb("#5068f0"), // 미드블루
    hexToRgb("#a0b0f8"), // 퍼왕클
    hexToRgb("#480058"), // 다크퍼플
    hexToRgb("#8000a0"), // 퍼플
    hexToRgb("#d040d0"), // 마젠타
    hexToRgb("#f8a0f0"), // 핑크
  ],
  pc98: [
    hexToRgb("#000000"), // 블랙
    hexToRgb("#0a0a14"), // 다크네이비
    hexToRgb("#14143c"), // 딥블루
    hexToRgb("#1e1e5a"), // 미드네이비
    hexToRgb("#0000aa"), // 블루
    hexToRgb("#2828cc"), // 브라이트블루
    hexToRgb("#00aaff"), // 시안블루
    hexToRgb("#00ccff"), // 네온시안
    hexToRgb("#00ffff"), // 시안
    hexToRgb("#aaffff"), // 라이트시안
    hexToRgb("#002200"), // 다크그린
    hexToRgb("#00550a"), // 포레스트
    hexToRgb("#008800"), // 그린
    hexToRgb("#00cc44"), // 라이트그린
    hexToRgb("#00ff88"), // 네온그린
    hexToRgb("#aaffcc"), // 민트
    hexToRgb("#220000"), // 다크레드
    hexToRgb("#550022"), // 마룬
    hexToRgb("#880000"), // 레드
    hexToRgb("#cc2244"), // 브라이트레드
    hexToRgb("#ff0066"), // 네온레드
    hexToRgb("#ff66aa"), // 핫핑크
    hexToRgb("#330033"), // 다크마젠타
    hexToRgb("#660066"), // 퍼플
    hexToRgb("#aa00aa"), // 마젠타
    hexToRgb("#cc44cc"), // 라이트마젠타
    hexToRgb("#ff00ff"), // 네온마젠타
    hexToRgb("#ffaaff"), // 라이트핑크
    hexToRgb("#181818"), // 다크그레이
    hexToRgb("#555555"), // 그레이
    hexToRgb("#aaaaaa"), // 실버
    hexToRgb("#ffffff"), // 화이트
  ],
  nes_full: [
    hexToRgb("#626262"), // Grey
    hexToRgb("#001fb2"), // Blue
    hexToRgb("#2404c8"), // BlueViolet
    hexToRgb("#5200b2"), // Violet
    hexToRgb("#730076"), // Purple
    hexToRgb("#800024"), // DarkRed
    hexToRgb("#730b00"), // RedBrown
    hexToRgb("#522800"), // Brown
    hexToRgb("#244400"), // OliveGreen
    hexToRgb("#005700"), // Green
    hexToRgb("#005c00"), // DarkGreen
    hexToRgb("#005324"), // ForestGreen
    hexToRgb("#003c76"), // NavyBlue
    hexToRgb("#000000"), // Black
    hexToRgb("#ababab"), // LightGrey
    hexToRgb("#0d57ff"), // BrightBlue
    hexToRgb("#4b30ff"), // BrightViolet
    hexToRgb("#8a13ff"), // BrightPurple
    hexToRgb("#bc08d6"), // BrightMagenta
    hexToRgb("#d21269"), // Crimson
    hexToRgb("#c72e00"), // OrangeRed
    hexToRgb("#9d5400"), // DarkOrange
    hexToRgb("#607b00"), // YellowGreen
    hexToRgb("#209800"), // GrassGreen
    hexToRgb("#00a300"), // BrightGreen
    hexToRgb("#009942"), // SeaGreen
    hexToRgb("#007db4"), // SteelBlue
    hexToRgb("#ffffff"), // White
    hexToRgb("#53aeff"), // LightBlue
    hexToRgb("#9085ff"), // LightViolet
    hexToRgb("#d365ff"), // LightPurple
    hexToRgb("#ff57ff"), // LightMagenta
    hexToRgb("#ff5dcf"), // LightPink
    hexToRgb("#ff7757"), // Salmon
    hexToRgb("#fca044"), // Orange
    hexToRgb("#c4be00"), // Yellow
    hexToRgb("#72d800"), // YellowGreen2
    hexToRgb("#3cde5a"), // Lime
    hexToRgb("#1ed9a4"), // Mint
    hexToRgb("#38d5f9"), // Cyan
    hexToRgb("#4e4e4e"), // DarkGrey
    hexToRgb("#ffffff"), // White2
    hexToRgb("#c0dfff"), // PaleBlue
    hexToRgb("#d3d2ff"), // PalePurple
    hexToRgb("#e8c8ff"), // PaleLavender
  ],
  mega32: [
    hexToRgb("#000000"), // 블랙
    hexToRgb("#222222"), // 다크그레이
    hexToRgb("#444444"), // 미드그레이
    hexToRgb("#888888"), // 그레이
    hexToRgb("#cccccc"), // 실버
    hexToRgb("#ffffff"), // 화이트
    hexToRgb("#220000"), // 다크레드
    hexToRgb("#882200"), // 마룬
    hexToRgb("#cc4400"), // 번트오렌지
    hexToRgb("#ee6622"), // 오렌지
    hexToRgb("#ffaa44"), // 라이트오렌지
    hexToRgb("#ffdd88"), // 피치
    hexToRgb("#002200"), // 다크그린
    hexToRgb("#004400"), // 포레스트
    hexToRgb("#22aa44"), // 그린
    hexToRgb("#22ccaa"), // 틸
    hexToRgb("#44ffcc"), // 아쿠아
    hexToRgb("#aaffee"), // 민트
    hexToRgb("#000044"), // 다크블루
    hexToRgb("#002288"), // 블루
    hexToRgb("#0044cc"), // 로얄블루
    hexToRgb("#2288ff"), // 스카이블루
    hexToRgb("#88ccff"), // 라이트블루
    hexToRgb("#cceeFF"), // 페일블루
    hexToRgb("#440044"), // 다크퍼플
    hexToRgb("#880088"), // 퍼플
    hexToRgb("#cc22cc"), // 마젠타
    hexToRgb("#ff66ff"), // 핫핑크
    hexToRgb("#442200"), // 다크브라운
    hexToRgb("#884400"), // 브라운
    hexToRgb("#ccaa44"), // 탄
    hexToRgb("#eedd88"), // 크림
  ],
  snes_bg: [
    hexToRgb("#003070"), // 딥스카이1
    hexToRgb("#0848a8"), // 딥스카이2
    hexToRgb("#1868c8"), // 미드스카이1
    hexToRgb("#3880d8"), // 미드스카이2
    hexToRgb("#6090d8"), // 스카이블루
    hexToRgb("#80a8e0"), // 스카이
    hexToRgb("#a8c8e8"), // 라이트스카이
    hexToRgb("#c8dff0"), // 페일스카이
    hexToRgb("#f8a000"), // 썬옐로우
    hexToRgb("#f87800"), // 썬오렌지
    hexToRgb("#f84800"), // 썬셋레드
    hexToRgb("#f82060"), // 매직핑크
    hexToRgb("#c81880"), // 딥핑크
    hexToRgb("#980880"), // 라벤더
    hexToRgb("#600870"), // 딥바이올렛
    hexToRgb("#300058"), // 나이트블루
    hexToRgb("#e0e8f8"), // 클라우드1
    hexToRgb("#d0d8f0"), // 클라우드2
    hexToRgb("#b0b8d0"), // 클라우드3
    hexToRgb("#9098b8"), // 클라우드4
    hexToRgb("#003888"), // 딥워터
    hexToRgb("#0050a8"), // 워터1
    hexToRgb("#0068c0"), // 워터2
    hexToRgb("#2080c8"), // 워터3
    hexToRgb("#40a0d0"), // 워터4
    hexToRgb("#60c0e0"), // 라이트워터
    hexToRgb("#88d8f0"), // 쇼어라인
    hexToRgb("#b0f0f8"), // 폼
    hexToRgb("#180800"), // 어스블랙
    hexToRgb("#401800"), // 다크어스
    hexToRgb("#703800"), // 어스브라운
    hexToRgb("#a05818"), // 어스탄
    hexToRgb("#d09040"), // 탄
    hexToRgb("#e8c860"), // 샌드
    hexToRgb("#082008"), // 다크포레스트
    hexToRgb("#184818"), // 포레스트
    hexToRgb("#286828"), // 다크그린
    hexToRgb("#409040"), // 그린
    hexToRgb("#58b858"), // 미드그린
    hexToRgb("#78d870"), // 라이트그린
    hexToRgb("#98f880"), // 브라이트그린
    hexToRgb("#c0f8a0"), // 페일그린
    hexToRgb("#101010"), // 블랙
    hexToRgb("#383838"), // 다크그레이
    hexToRgb("#686868"), // 그레이
    hexToRgb("#a0a0a0"), // 실버
    hexToRgb("#d0d0d0"), // 라이트그레이
    hexToRgb("#ffffff"), // 화이트
  ],
  neogeo_char: [
    hexToRgb("#f0c080"), // 스킨라이트
    hexToRgb("#d89860"), // 스킨
    hexToRgb("#b87040"), // 스킨다크
    hexToRgb("#805028"), // 시에나
    hexToRgb("#503018"), // 다크브라운스킨
    hexToRgb("#f8e0b0"), // 크림스킨
    hexToRgb("#100800"), // 블랙헤어
    hexToRgb("#301000"), // 다크브라운헤어
    hexToRgb("#602000"), // 브라운헤어
    hexToRgb("#c04000"), // 레드헤어
    hexToRgb("#e07800"), // 오렌지헤어
    hexToRgb("#f8d000"), // 블론드
    hexToRgb("#d0d0d0"), // 실버헤어
    hexToRgb("#ffffff"), // 화이트헤어
    hexToRgb("#300000"), // 다크크림슨
    hexToRgb("#780000"), // 다크레드
    hexToRgb("#c80000"), // 레드
    hexToRgb("#f84040"), // 브라이트레드
    hexToRgb("#f89090"), // 핑크레드
    hexToRgb("#000830"), // 다크네이비
    hexToRgb("#002080"), // 네이비
    hexToRgb("#0040d0"), // 블루
    hexToRgb("#2880f8"), // 브라이트블루
    hexToRgb("#80b8f8"), // 라이트블루
    hexToRgb("#003000"), // 다크그린
    hexToRgb("#008000"), // 그린
    hexToRgb("#40d040"), // 라이트그린
    hexToRgb("#303000"), // 다크올리브
    hexToRgb("#808000"), // 올리브
    hexToRgb("#f8c000"), // 옐로우
    hexToRgb("#f8a000"), // 오렌지
    hexToRgb("#300030"), // 다크퍼플
    hexToRgb("#800080"), // 퍼플
    hexToRgb("#d040d0"), // 마젠타
    hexToRgb("#202020"), // 블랙메탈
    hexToRgb("#484848"), // 다크메탈
    hexToRgb("#808080"), // 메탈
    hexToRgb("#c0c0c0"), // 실버메탈
    hexToRgb("#e8e8e8"), // 라이트메탈
    hexToRgb("#ffffff"), // 화이트
    hexToRgb("#f8c040"), // 골드
    hexToRgb("#c88010"), // 다크골드
    hexToRgb("#804800"), // 브론즈
    hexToRgb("#00f8f8"), // 시안FX
    hexToRgb("#ff00ff"), // 마젠타FX
    hexToRgb("#ffff00"), // 옐로우FX
    hexToRgb("#ff8800"), // 파이어FX
    hexToRgb("#8800ff"), // 매직FX
    hexToRgb("#00ff44"), // 슬라임FX
  ],
  snes_rpg: [
    hexToRgb("#080808"), // 블랙
    hexToRgb("#181818"), // 다크스톤
    hexToRgb("#282828"), // 스톤블랙
    hexToRgb("#403830"), // 다크그레이스톤
    hexToRgb("#685848"), // 다크브라운스톤
    hexToRgb("#888070"), // 스톤
    hexToRgb("#a89880"), // 라이트스톤
    hexToRgb("#c8b898"), // 페일스톤
    hexToRgb("#300800"), // 다크우드
    hexToRgb("#602010"), // 미드우드
    hexToRgb("#984020"), // 우드레드
    hexToRgb("#c87840"), // 우드
    hexToRgb("#e0a060"), // 라이트우드
    hexToRgb("#f8d098"), // 페일우드
    hexToRgb("#200000"), // 엠버블랙
    hexToRgb("#601000"), // 다크파이어
    hexToRgb("#c03000"), // 파이어레드
    hexToRgb("#e86020"), // 파이어오렌지
    hexToRgb("#f8a000"), // 파이어옐로우
    hexToRgb("#fff0a0"), // 라이트글로우
    hexToRgb("#003060"), // 딥워터
    hexToRgb("#0060a8"), // 워터블루
    hexToRgb("#00a8e0"), // 크리스탈
    hexToRgb("#40d8f8"), // 라이트크리스탈
    hexToRgb("#a0f0f8"), // 페일크리스탈
    hexToRgb("#e0f8ff"), // 아이스
    hexToRgb("#200040"), // 다크마법
    hexToRgb("#6000a0"), // 퍼플마법
    hexToRgb("#a000d0"), // 마젠타마법
    hexToRgb("#e040f0"), // 라이트마법
    hexToRgb("#f0a0ff"), // 페일마법
    hexToRgb("#fff0ff"), // 매직화이트
    hexToRgb("#301800"), // 다크골드
    hexToRgb("#705008"), // 올드골드
    hexToRgb("#b89010"), // 골드다크
    hexToRgb("#e8c000"), // 골드
    hexToRgb("#f8e060"), // 브라이트골드
    hexToRgb("#fff8a0"), // 페일골드
    hexToRgb("#002800"), // 다크그린
    hexToRgb("#205020"), // 그린
    hexToRgb("#409840"), // 미드그린
    hexToRgb("#60d060"), // 라이트그린
    hexToRgb("#282040"), // 다크UI
    hexToRgb("#4040a0"), // 미드UI
    hexToRgb("#8080d0"), // 라이트UI
    hexToRgb("#c0c0f0"), // 페일UI
  ],
  cyberpunk16: [
    hexToRgb("#000000"), // 블랙
    hexToRgb("#050510"), // 다크네이비
    hexToRgb("#0a0a20"), // 딥네이비
    hexToRgb("#101030"), // 미드네이비
    hexToRgb("#151540"), // 네이비
    hexToRgb("#1a1a50"), // 다크블루
    hexToRgb("#ff0044"), // 네온레드
    hexToRgb("#ff0066"), // 핫핑크
    hexToRgb("#ff2288"), // 마젠타핑크
    hexToRgb("#ff44aa"), // 라이트핑크
    hexToRgb("#ff66cc"), // 페일핑크
    hexToRgb("#cc0033"), // 다크레드
    hexToRgb("#0088ff"), // 네온블루
    hexToRgb("#00aaff"), // 라이트블루
    hexToRgb("#00ccff"), // 시안블루
    hexToRgb("#00ffff"), // 시안
    hexToRgb("#88ffff"), // 라이트시안
    hexToRgb("#0044cc"), // 다크블루
    hexToRgb("#00ff44"), // 네온그린
    hexToRgb("#00ff88"), // 민트그린
    hexToRgb("#00ffaa"), // 아쿠아
    hexToRgb("#44ffcc"), // 라이트민트
    hexToRgb("#88ffee"), // 페일민트
    hexToRgb("#00aa44"), // 다크그린
    hexToRgb("#8800ff"), // 네온퍼플
    hexToRgb("#aa22ff"), // 퍼플
    hexToRgb("#cc66ff"), // 라이트퍼플
    hexToRgb("#ee99ff"), // 라벤더
    hexToRgb("#6600aa"), // 다크퍼플
    hexToRgb("#440077"), // 딥퍼플
    hexToRgb("#ff8800"), // 오렌지
    hexToRgb("#ffaa00"), // 앰버
    hexToRgb("#ffcc00"), // 옐로우
    hexToRgb("#ffee44"), // 브라이트옐로우
    hexToRgb("#fff088"), // 페일옐로우
    hexToRgb("#cc5500"), // 다크오렌지
    hexToRgb("#ffeecc"), // 윈도우라이트
    hexToRgb("#ffd888"), // 웜라이트
    hexToRgb("#ffb844"), // 소듐라이트
    hexToRgb("#cc8822"), // 다크소듐
    hexToRgb("#884400"), // 다크윈도우
    hexToRgb("#442200"), // 딥윈도우
    hexToRgb("#223344"), // 다크메탈
    hexToRgb("#445566"), // 미드메탈
    hexToRgb("#667788"), // 메탈
    hexToRgb("#8899aa"), // 라이트메탈
    hexToRgb("#aabbcc"), // 실버
    hexToRgb("#ccddee"), // 페일실버
  ],
  monochrome: [
    { r: 0, g: 0, b: 0 },
    { r: 255, g: 255, b: 255 },
  ],
  sepia2: [hexToRgb("#2B1B0E"), hexToRgb("#D4A96A")],
  blue2: [hexToRgb("#0A1628"), hexToRgb("#6BB8E0")],
  green2: [hexToRgb("#0D1A00"), hexToRgb("#33FF00")],
  arctic4: [
    hexToRgb("#1B2838"),
    hexToRgb("#4A8DB7"),
    hexToRgb("#A8D8EA"),
    hexToRgb("#F0F8FF"),
  ],
  sunset4: [
    hexToRgb("#2D0A31"),
    hexToRgb("#C62E46"),
    hexToRgb("#F58A07"),
    hexToRgb("#F9DC5C"),
  ],
  pastel8: [
    hexToRgb("#F8B4C8"),
    hexToRgb("#B8D4E8"),
    hexToRgb("#C8E8B0"),
    hexToRgb("#F8E8A0"),
    hexToRgb("#E0C0F0"),
    hexToRgb("#F0D0B0"),
    hexToRgb("#FFFFFF"),
    hexToRgb("#404040"),
  ],
  earth8: [
    hexToRgb("#1A0E00"),
    hexToRgb("#4A2800"),
    hexToRgb("#8B5E3C"),
    hexToRgb("#C8A882"),
    hexToRgb("#2D4A1E"),
    hexToRgb("#5C8A3C"),
    hexToRgb("#7BA0C8"),
    hexToRgb("#F0E8D8"),
  ],
  win256: generateWebSafePalette(),
};

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
