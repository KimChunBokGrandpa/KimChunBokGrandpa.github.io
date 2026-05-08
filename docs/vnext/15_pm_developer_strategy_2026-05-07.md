# PM / Developer Strategy Note — 2026-05-07

Purpose: 내가 이 프로젝트를 맡은 기획자이자 개발자라면 어떤 질문에서 시작하고, 어떤 전제를 깔고, 어떤 구조로 남은 작업을 진행할지 고정한다.

This note is a product and execution premise. It does not replace implementation specs; it explains why the next specs and tasks are ordered this way.

---

## First Question

가장 먼저 물어볼 질문:

> 어떤 이미지를 넣었을 때 "내가 원하는 고전/레트로 픽셀화가 아니다"라고 느꼈나?

이 질문이 먼저인 이유는 이 제품의 핵심 문제가 `pixel size` 하나로 해결되는 일반 pixelate filter 문제가 아니기 때문이다. 사용자가 불만을 느끼는 지점은 대개 다음 중 하나다.

- 얼굴, 실루엣, 의상 경계가 깨져 캐릭터를 알아보기 어렵다.
- palette reduction이 의도적인 고전 하드웨어 느낌이 아니라 muddy posterization처럼 보인다.
- CRT/VHS/glitch 효과가 분위기는 주지만 피사체를 가린다.
- 추천 preset이 왜 나왔는지 모르겠고, 적용 후 어디를 만져야 할지도 불분명하다.
- 고전 픽셀풍과 레트로화가 섞여 있는데 제품이 둘을 같은 필터처럼 취급한다.

따라서 후속 질문은 다음 순서로 간다.

1. 원하는 결과는 `Classic Pixel`인가, `Retro Treatment`인가, 아니면 둘 사이의 hybrid인가?
2. 반드시 살아야 하는 정보는 무엇인가: 얼굴, 실루엣, 색감, 선화, 배경 분위기, 텍스트 영역?
3. 추천은 자동 완성 결과여야 하는가, 아니면 좋은 시작점이어야 하는가?
4. 사용자가 조정해야 하는 첫 3개 control은 무엇인가: pixel size, palette, dither, CRT, glitch, export scale?

---

## Starting Issue

이 프로젝트를 시작한 이슈는 "이미지를 픽셀로 쪼개는 도구가 없다"가 아니다. 그런 도구는 많다.

실제 이슈는 다음에 더 가깝다.

- 단순 pixelate는 blocky preview만 만들고, 고전 게임기 같은 palette/dither 질감을 만들지 못한다.
- AI 스타일 필터는 분위기는 빠르게 만들지만 결과가 불투명하고 반복 조정이 어렵다.
- 캐릭터/일러스트 입력에서는 눈, 얼굴선, 머리카락, 옷 경계가 조금만 망가져도 결과가 실패로 보인다.
- 사용자는 "정확한 고전 픽셀풍"과 "넓은 의미의 레트로화"를 둘 다 원하지만, 상황마다 기대치가 다르다.

그래서 제품의 중심은 `Pixel Lab`이다. `Poster Maker`, `RetroCam`, Win98 shell은 모두 이 핵심 편집 루프를 돕는 곁가지다.

---

## Working Assumptions

- `Pixel Lab`이 메인 제품 surface다.
- `Classic Pixel`과 `Retro Treatment`를 둘 다 정식 방향으로 수용한다.
- 추천은 final answer가 아니라 "바로 조정 가능한 시작점"이다.
- 결과 품질은 shell polish보다 우선한다.
- 제품은 client-only/local-first다. 서버, 계정, 원격 렌더링, 원격 AI 추론을 core scope에 넣지 않는다.
- Win98 UI 정체성은 강점이지만, upload -> recommendation -> tune -> preview -> export 흐름을 가리면 실패다.
- `sampleImages/`는 임시 local reference pool이다. 이미지 파일 자체가 사라질 수 있으므로, Git에 남는 계약은 `docs/sample_image_benchmark.md`의 판단 기준이다.
- `sampleImages/retro/`는 현재 기준에서 레트로 픽셀화의 1차 reference set으로 본다.

---

## Trend-Informed Structure

최근 공개 자료 기준으로, 이 제품 방향은 "AI가 전부 자동으로 만들어주는 필터"보다 "analog feel + controllable tool" 쪽이 더 설득력 있다.

- Adobe Firefly 2025 prompt trend 자료는 `static`, `stippling`, `halftone`, `grainy`, `nostalgia` 같은 nostalgic / analog 표현 수요가 올라갔다고 설명한다.
- Canva Design Trends 2025는 `Analog Meets AI`, `Refined Grit`처럼 아날로그 감성과 디지털/AI 도구의 결합을 큰 흐름으로 잡는다.
- Figma 2025 AI report는 AI adoption이 커지는 동시에, 디자인 산출물의 품질 신뢰에는 사용자군별 perception gap이 있다고 본다.

이 전제에서 제품 구조는 다음이 맞다.

```text
Input -> Recommendation -> Tune -> Judge -> Export
```

- `Input`: 사용자는 캐릭터, 라인아트, 레트로 조명, 낙서풍 등 다양한 이미지를 넣는다.
- `Recommendation`: 제품은 Classic Pixel / Retro Treatment / Hybrid 중 시작 방향을 제안한다.
- `Tune`: 사용자는 pixel size, palette, dithering, CRT/glitch를 빠르게 조정한다.
- `Judge`: preview summary, compare mode, color count, readability 기준으로 결과를 판단한다.
- `Export`: 결과가 목적지에 맞게 저장/공유/Poster Maker handoff된다.

핵심은 AI처럼 보이는 magic을 만드는 것이 아니라, 추천과 수동 조정이 같은 방향을 보도록 만드는 것이다.

---

## Remaining Work Priority

1. `WP-09` reference-based output quality
   - `sampleImages/retro/` 5장과 cross-style core 5의 expected family / starting preset / pass-fail 기준을 문서화한다.
   - 다음 처리 품질 작업은 이 기준을 보고 regress 여부를 판단한다.
2. `WP-09` processing parity and legacy boundary
   - `effectLayers`, CRT, glitch, HQx, worker/WASM/Tauri path가 같은 결과 의도를 유지하는지 목록화한다.
   - legacy `glitchFilters` / `renderMode`는 compatibility boundary로 묶는다.
3. `WP-08` preview confidence and export hierarchy
   - 추천 적용 후 사용자가 "좋은 결과인지" 판단할 수 있게 compare confidence와 export action hierarchy를 정리한다.
4. `WP-07 / WP-08` recommendation family clarity
   - Classic Pixel / Retro Treatment / Hybrid label과 설명이 preset card, quick tune, palette surface에서 계속 일관되게 보이게 한다.
5. Manual QA tracking
   - tall-phone, Tauri native save, webcam permission, clipboard/save affordance는 `required.md`에서 실환경 검증 항목으로 유지한다.

---

## Risks

- Pixelate filter trap: pixel size만 키우는 도구처럼 보이면 제품 차별성이 사라진다.
- Recommendation drift: 추천 설명이 실제 scoring signal과 어긋나면 신뢰가 무너진다.
- Sample overfitting: 현재 `sampleImages/`가 전체 사용자 이미지를 대표한다고 착각하면 안 된다.
- Shell bloat: Win98 shell 확장이 Pixel Lab의 편집 명료성을 잡아먹을 수 있다.
- Client-only drift: 원격 AI/서버 전제를 넣으면 현재 제품 구조와 privacy promise가 깨진다.

---

## Validation

- `docs/sample_image_benchmark.md`의 retro reference set과 cross-style core 5를 기준으로 주요 결과 품질을 수동 점검한다.
- 추천/tuning/preview surface 변경은 component test와 i18n test로 보호한다.
- docs-only 변경은 별도 runtime test 없이 문서 diff로 검증한다.
- 실제 Tauri, webcam permission, tall-phone, native save는 `required.md`의 manual QA authority를 따른다.

---

## External Sources

- Adobe Blog: ["Halftone" "nostalgia" and more: 2025's top Firefly prompt trends](https://blog.adobe.com/en/publish/2026/01/08/halftone-nostalgia-more-2025-top-firefly-prompt-trends)
- Canva: [Design Trends 2025](https://www.canva.com/design-trends/2025/)
- Canva Newsroom: [Get ahead of the curve: Canva's top Design Trends for 2025](https://www.canva.com/newsroom/news/design-trends-2025/)
- Figma Blog: [Figma's 2025 AI report: Perspectives from designers and developers](https://www.figma.com/blog/figma-2025-ai-report-perspectives/)
