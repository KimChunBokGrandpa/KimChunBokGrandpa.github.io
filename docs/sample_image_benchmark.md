# Sample Image Benchmark

> Created: 2026-05-07.
> Source directory: `sampleImages/`

## Purpose

`sampleImages/`는 Pixel Lab 결과 품질을 판단하기 위한 local visual benchmark pool이다.

현재 샘플은 제품이 다뤄야 할 전체 범위를 전부 대표하지는 않는다. 다만 지금 사용할 수 있는 샘플 기준으로, 특히 `retro/` 디렉토리는 레트로 픽셀화 결과의 1차 참조군으로 본다.

## Directory Taxonomy

| Directory | Current Count | Product Role |
|-----------|---------------|--------------|
| `sampleImages/retro/` | 5 | 레트로 픽셀화 / Retro Treatment 핵심 참조군 |
| `sampleImages/highQualityPixel/` | 15 | 고품질 캐릭터 입력, clean silhouette, limited-palette stability 확인 |
| `sampleImages/oldPaperType/` | 10 | 종이/만화/라인아트/따뜻한 야외톤 입력 확인 |
| `sampleImages/doodleType/` | 2 | 낙서풍/단일 피사체/스케치성 입력 확인 |

## Retro Reference Set

`sampleImages/retro/`의 5장은 레트로 픽셀화 기준 이미지로 고정한다.

| # | File | What Must Stay Readable |
|---|------|--------------------------|
| 1 | `sampleImages/retro/1.png` | pink/purple lighting, subject outline, dark bar background |
| 2 | `sampleImages/retro/2.png` | yellow/purple contrast, face/hair silhouette, floor/background separation |
| 3 | `sampleImages/retro/3.png` | seated subject pose, pale hair detail, bar counter depth |
| 4 | `sampleImages/retro/4.png` | magenta lighting, screen glow, clothing edges |
| 5 | `sampleImages/retro/5.png` | low-angle pose, high saturation, dark foreground readability |

Expected behavior:

- `Retro Treatment` recommendations should be plausible starting points for these images.
- CRT/VHS/glitch effects may be visible, but they must not destroy subject readability.
- Palette reduction should preserve the neon/purple/pink mood instead of flattening everything into muddy dark tones.
- Dithering should help tonal transitions and not turn skin or hair into noise.

## Cross-Style Core 5

| # | File | Benchmark Role | What Must Stay Readable |
|---|------|----------------|--------------------------|
| 1 | `sampleImages/retro/1.png` | retro pixelization reference | neon palette, dark background, subject silhouette |
| 2 | `sampleImages/highQualityPixel/tmp295s0v90.png` | full-body character / flat background | full-body silhouette, small facial detail, limited-palette stability |
| 3 | `sampleImages/oldPaperType/mabimobile-20260308-205735-0004-Xnh6AbL8.png` | bright outdoor color scene | warm daylight palette, skin/hair separation, clothing contrast |
| 4 | `sampleImages/oldPaperType/mabimobile-20260401-235158-0001-vGg7E7QH.png` | monochrome manga / line-art scene | line weight, speech bubble regions, black-white contrast |
| 5 | `sampleImages/doodleType/KakaoTalk_Photo_2026-05-07-16-05-50 001.jpeg` | clean single-subject / doodle-like input | subject silhouette, face area, accessory edges |

## Product Judgement Criteria

Use the retro reference set and cross-style core 5 to answer the same questions after major Pixel Lab changes:

- Does `Classic Pixel` preserve recognizable silhouette and key facial/subject details?
- Does palette reduction create a deliberate hardware-like look instead of muddy posterization?
- Does dithering improve shading without turning skin, hair, or line art into noise?
- Does `Retro Treatment` add CRT/VHS/glitch mood without destroying the subject?
- Does the recommendation feel like a useful starting point for the image, not an unexplained final answer?
- Can the user move from recommendation to preview confidence to export without hunting for controls?

## Manual Review Checklist

This checklist is guidance, not an automated assertion. `sampleImages/` is a temporary local reference pool; the durable product contract is the judgement rule recorded here.

### Retro Reference Checklist

| File | Expected Family | Expected Preset Starting Points | Pass Signals | Fail Signals |
|------|-----------------|---------------------------------|--------------|--------------|
| `sampleImages/retro/1.png` | `Retro Treatment` | `cyberpunk`, `retro_crt`, `broken_vhs` | neon pink/purple mood survives; subject outline and face area stay readable against the dark bar background | dark tones collapse into mud; CRT scanlines hide the face or subject edge |
| `sampleImages/retro/2.png` | `Retro Treatment` | `cyberpunk`, `broken_vhs`, `retro_crt` | yellow/purple contrast remains energetic; hair and face silhouette stay separated from the floor/background | highlights wash out; VHS wave or RGB split breaks the pose |
| `sampleImages/retro/3.png` | `Retro Treatment` / `Hybrid` | `retro_crt`, `cyberpunk`, `smooth_hqx` | seated pose, pale hair, and bar-counter depth remain legible | skin and hair merge; background becomes flat posterization |
| `sampleImages/retro/4.png` | `Retro Treatment` | `cyberpunk`, `retro_crt`, `broken_vhs` | screen glow and magenta lighting read as intentional retro lighting; clothing edges stay crisp enough | RGB split destroys the pose; glow overwhelms the subject |
| `sampleImages/retro/5.png` | `Retro Treatment` | `cyberpunk`, `broken_vhs`, `chaos` only if edges survive | high saturation and low-angle silhouette stay readable; dark foreground remains shaped | heavy distortion destroys the silhouette; dark foreground becomes a single block |

### Cross-Style Checklist

| File | Expected Family | Expected Preset Starting Points | Pass Signals | Fail Signals |
|------|-----------------|---------------------------------|--------------|--------------|
| `sampleImages/retro/1.png` | `Retro Treatment` | `cyberpunk`, `retro_crt`, `broken_vhs` | neon palette and subject silhouette survive together | retro effects become stronger than the subject |
| `sampleImages/highQualityPixel/tmp295s0v90.png` | `Classic Pixel` | `pico8`, `nes`, `dither_fs` | full-body silhouette, face area, and limited-palette stability hold on a flat background | pixel size makes the body stair-step too coarsely; face detail disappears |
| `sampleImages/oldPaperType/mabimobile-20260308-205735-0004-Xnh6AbL8.png` | `Classic Pixel` / `Hybrid` | `nes`, `pico8`, `smooth_hqx` | warm daylight, skin/hair separation, and clothing contrast remain clear | palette turns muddy; background and character collapse into one value group |
| `sampleImages/oldPaperType/mabimobile-20260401-235158-0001-vGg7E7QH.png` | `Classic Pixel` | `dither_fs`, `gameboy`, `nes` | line weight, speech-bubble regions, and black-white contrast remain understandable | dithering makes line art noisy; text/bubble regions vanish |
| `sampleImages/doodleType/KakaoTalk_Photo_2026-05-07-16-05-50 001.jpeg` | `Classic Pixel` / `Hybrid` | `smooth_hqx`, `nes`, `pico8` | subject silhouette, face area, and accessory edges stay clean | simple gray/background tones create halos; accessories merge into the body |

## Extended Pool

The remaining images in categorized `sampleImages/` directories should stay available as secondary checks:

- multi-character or collage-like layout
- additional portrait crops
- alternate outdoor scenes
- additional monochrome / manga panels
- repeated neon / bar-lighting scenes
- flat-background full-body variants

Use the extended pool when a specific preset, palette, dither mode, or layout bug is reproduced. Do not promote a new image into the cross-style core 5 unless it covers a gap the current five do not cover.

## Asset Tracking Note

`sampleImages/*` is currently ignored by Git. The benchmark contract in this document is tracked, while the image assets are treated as local visual QA references.

## Current Next Step

Use the checklist above during the next `WP-09` processing pass. The first pass was reaffirmed by `docs/vnext/17_request_intake_analysis_2026-05-08.md` after absorbing and deleting `request.md`.

Current blocker: as of 2026-05-08, the active workspace does not contain the local `sampleImages/` directory. Resume the first quality sweep as soon as those temporary reference assets are restored.

Record only meaningful deviations:

- recommendation family/preset differs from expectation
- output readability fails for the listed pass signals
- browser/Tauri path produces materially different CRT/glitch/HQx behavior
- export output differs from preview in scale, palette, or readability
