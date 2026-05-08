# Design System Alignment Tasks

---

Purpose: Pixel Lab-first product direction에 맞춰, `.agents/skills/designSystem/`의 확정 샘플과 현재 Svelte 구현을 비교하고 실제 앱을 design system 기준으로 정렬하기 위한 작업 단위를 정의한다.

Status: active Pixel Lab acceptance cleanup
Updated: 2026-05-07

---

## Scope

이번 문서는 다음 비교를 기준으로 작성한다.

- design system source
  - `.agents/skills/designSystem/README.md`
  - `.agents/skills/designSystem/colors_and_type.css`
  - `.agents/skills/designSystem/ui_kits/pixel-lab/*`
  - `.agents/skills/designSystem/preview/*`
- current product source
  - `src/lib/styles/theme.css`
  - `src/app.css`
  - `src/routes/+page.svelte`
  - `src/lib/components/window/*`
  - `src/lib/components/editor/*`
  - `src/lib/components/feedback/*`
  - `src/lib/components/media/*`
  - `src/lib/components/poster/PosterMaker.svelte`
  - `src/lib/components/retrocam/RetroCam.svelte`

---

## Product Premise For Design Work

- Pixel Lab is the main editor.
- The editor must support two valid output families:
  - `Classic Pixel`: palette-limited, dithered, console/handheld-inspired output
  - `Retro Treatment`: CRT/VHS/glitch/color-mood output
- Recommendations are starting points that users can refine.
- Poster Maker and RetroCam are supporting surfaces.
- Win98 shell identity matters, but shell chrome must not hide Pixel Lab's upload, recommendation, preview, compare, tuning, and export loop.

---

## Comparison Summary

현재 프로젝트는 Win98 shell, teal desktop, emoji iconography, taskbar, draggable/resizable windows, typography/token 기준을 이미 design system 쪽으로 상당 부분 고정했다.

남아 있는 일은 “새 디자인 입히기”보다 “Pixel Lab 중심 정보 구조 정리”에 가깝다. 즉, 이미 정해진 토큰/recipe를 유지하면서 사용자가 추천을 적용하고 결과를 판단하고 세밀하게 조정하는 루프를 더 잘 보이게 해야 한다.

- source of truth 정리
  - typography source of truth는 `.agents/skills/designSystem/README.md` 우선으로 고정했다.
  - 현재 구현 기준 토큰은 `src/lib/styles/theme.css`와 `src/app.css`다.
- shell component contract 정리
  - shell metadata(start menu / desktop / mobile order)는 `windowStore` SSOT로 모아 disconnected launch wiring을 줄였다.
  - shell polish는 이제 Pixel Lab 접근성과 editing confidence를 지원할 때만 우선한다.
- app mood 분화
  - Pixel Lab은 중심 편집기다.
  - Poster Maker는 composition destination이다.
  - RetroCam은 capture source다.

---

## Source Of Truth Freeze

이번 패스에서는 typography와 shell chrome의 기준을 아래처럼 유지한다.

- typography source of truth
  - `.agents/skills/designSystem/README.md` 우선
- implementation source of truth
  - `src/lib/styles/theme.css`
  - `src/app.css`
  - shell / feedback / editor 컴포넌트는 위 토큰과 공용 `w98-*` recipe를 사용한다.
- decision
  - `DS-00`는 `A: bitmap "Pixelated MS Sans Serif" 유지`로 고정
  - emoji fallback은 별도 `--w98-emoji-font` 체인을 유지

이 결정에 따라 현재 앱은 `11px` base, 전역 bold, anti-aliased modern UI 제거, bevel-first chrome을 기본값으로 사용한다.

---

## Key Gaps

### 1. Pixel Lab recommendation hierarchy is now the primary design gap

다음 흐름이 한눈에 보여야 한다.

- upload/import
- recommended direction
- Classic Pixel / Retro Treatment choice
- preview and compare
- manual tuning
- export/share/send

### 2. Controls / Preview surfaces need structural alignment

Pixel Lab의 실질적인 차이는 여기서 가장 많이 난다.

- `src/lib/components/editor/ControlPanel.svelte`
- `src/lib/components/editor/PreviewContent.svelte`
- `src/lib/components/editor/ImageCanvas.svelte`
- `src/lib/components/editor/ImageDropZone.svelte`
- `src/lib/components/editor/PreviewBottomBar.svelte`
- `src/lib/components/editor/PresetManager.svelte`

현재 구현은 실제 제품 기능을 담으면서 UI kit보다 더 복잡해졌다. 그래서 바로 “예쁘게 바꾸기”보다 아래 순서가 맞다.

- recommendation -> tuning -> export 정보 구조로 다시 매핑
- 각 탭/필드셋의 bevel, spacing, density를 정렬
- preview empty state / bottom bar / CRT frame 계약을 샘플과 맞춤
- 실제 기능은 유지하되 외형 계약을 kit에 맞춤

### 3. Preset and palette surfaces must express the two-family model

- Classic Pixel presets should feel hardware/palette/constraint-driven
- Retro Treatment presets should feel mood/effect/post-process-driven
- hybrid presets may exist but should not blur explanation copy
- palette recommendation should connect to visible image colors and output goals

### 4. Shell visuals are close, but now support priority is lower

아래 컴포넌트는 이미 상당 부분 정리되었고, 남은 작업은 regression guard 성격이다.

- `src/lib/components/window/Win98Window.svelte`
- `src/lib/components/window/Taskbar.svelte`
- `src/lib/components/window/DesktopIcons.svelte`
- `src/lib/components/window/DesktopWorkspace.svelte`

남은 관심사는 shell의 완성도가 아니라 Pixel Lab 흐름을 방해하지 않는지다.

### 5. Supporting program identity should stay subordinate

- `PosterMaker.svelte`는 Pixel Lab 결과물의 composition destination으로 읽혀야 한다
- `RetroCam.svelte`는 Pixel Lab input source로 읽혀야 한다
- `BatchProcessor.svelte`, `HistoryPanel.svelte`, `PaletteGallery.svelte`는 Pixel Lab utility hierarchy를 더 또렷하게 가져가야 한다

### 6. Feedback patterns need one shared visual language

다음 컴포넌트는 design system preview와 비교해 정렬이 필요하다.

- `src/lib/components/feedback/ToastNotification.svelte`
- `src/lib/components/feedback/MessageDialog.svelte`
- `src/lib/components/feedback/ContextMenu.svelte`
- `src/lib/components/feedback/KeyboardShortcuts.svelte`

현재는 동작은 맞지만, icon usage, border recipe, action row spacing, close affordance, status tone을 더 통일할 수 있다.

---

## Proposed Workstreams

## DS-00 Source Of Truth Freeze

Goal: typography와 토큰 기준을 확정한다.

Tasks:

- [x] typography source of truth를 `.agents/skills/designSystem/README.md` 우선으로 고정했다.
- [x] `A`: bitmap `Pixelated MS Sans Serif` 유지로 freeze했다.
- [x] 확정 결과를 `src/lib/styles/theme.css`와 `src/app.css` 기준으로 문서화했다.
- [x] icon/emoji font fallback rule을 `--w98-emoji-font` 체인으로 고정했다.

---

## DS-01 Token And Recipe Alignment

Goal: 현재 앱의 design token과 shell recipe를 design system 기준으로 유지한다.

Files:

- `src/lib/styles/theme.css`
- `src/app.css`

Tasks:

- [x] typography scale, font stack, font weight, focus ring 규칙을 정렬했다.
- [x] bevel recipe, semantic colors, tooltip recipe, disabled contrast 기준을 일원화했다.
- [x] 공용 utility recipe를 `w98-*` 계열로 정리했다.
- [ ] supporting surface에서 토큰 우회 스타일이 다시 생기지 않도록 잔여 spot-check를 유지한다.

---

## DS-02 Pixel Lab Recommendation Surface

Goal: Classic Pixel / Retro Treatment 추천 방향을 Pixel Lab 안에서 명확하게 표현한다.

Files:

- `src/lib/components/editor/PresetManager.svelte`
- `src/lib/components/editor/ControlPanel.svelte`
- `src/lib/utils/styleRecommender.ts`
- `src/lib/utils/paletteRecommender.ts`

Tasks:

- [x] 추천 family label과 설명 copy 위치를 정한다.
- [x] 추천을 적용한 뒤 manual tuning으로 이어지는 control hierarchy를 1차 연결한다.
- [ ] palette recommendation이 Classic Pixel과 Retro Treatment 어디에 기여하는지 표시한다.
- [x] 추천 설명이 실제 scoring reason과 어긋나지 않도록 UI copy를 점검한다.

Acceptance:

- 사용자가 추천이 왜 나왔는지 대략 이해한다.
- 추천을 적용한 뒤 바로 조정할 수 있다.

---

## DS-03 Pixel Lab Controls / Preview Alignment

Goal: Pixel Lab의 Controls / Preview / Gallery를 UI kit 구조에 맞추되 실제 기능은 유지한다.

Files:

- `src/lib/components/editor/ControlPanel.svelte`
- `src/lib/components/editor/PreviewContent.svelte`
- `src/lib/components/editor/ImageCanvas.svelte`
- `src/lib/components/editor/ImageDropZone.svelte`
- `src/lib/components/editor/PreviewBottomBar.svelte`
- `src/lib/components/editor/PresetManager.svelte`
- `src/lib/components/palette/PaletteGallery.svelte`
- `src/lib/components/palette/PaletteDetail.svelte`
- `src/lib/components/palette/PaletteToolbar.svelte`

Tasks:

- [x] Presets 탭에서 pixel size / quick palette / dithering quick tune strip을 제공해 recommendation -> tuning bridge를 1차 연결한다.
- [x] `ControlPanel.svelte` sticky export bar에서 Save As를 primary action으로, Share/SVG/Poster Maker를 secondary action으로 구분한다.
- [ ] `ControlPanel.svelte`의 tabs / fieldsets / action bar를 recommendation -> tuning -> export 정보 구조에 맞게 재배치한다.
- [ ] save/share/apply 액션 우선순위와 버튼 hierarchy를 kit 기준으로 정렬한다.
- [ ] `PreviewContent.svelte`와 `ImageCanvas.svelte`를 canvas-frame / dropzone / bottom bar 계약에 맞춘다.
- [ ] empty state drop zone copy, hierarchy, CTA placement를 sample 기준으로 정리한다.
- [x] preview bottom action bar에 현재 output의 pixel size / palette / dithering / color count summary를 1차 연결한다.
- [ ] preview bottom action bar의 pressed state, icon style, compare-confidence 흐름을 recommendation 판단에 맞게 정리한다.
- [ ] `PresetManager.svelte`와 gallery 관련 컴포넌트의 palette-card, selected state, swatch row, caption 구조를 kit 기준으로 통일한다.

Acceptance:

- Pixel Lab이 기능은 풍부하지만 시각적으로는 한 시대의 같은 소프트웨어처럼 보인다.
- Controls / Preview / Gallery를 나눠 봐도 공통 recipe가 유지된다.

---

## DS-04 Supporting Surface Pass

Goal: Poster Maker, RetroCam, Batch, History의 mood를 Pixel Lab supporting surface로 정리한다.

Files:

- `src/lib/components/poster/PosterMaker.svelte`
- `src/lib/components/retrocam/RetroCam.svelte`
- `src/lib/components/media/BatchProcessor.svelte`
- `src/lib/components/feedback/HistoryPanel.svelte`

Tasks:

- [ ] `PosterMaker.svelte`를 composition destination 구조로 정리한다.
- [ ] `RetroCam.svelte`를 capture source 구조로 정리한다.
- [ ] `BatchProcessor.svelte`를 Pixel Lab utility window답게 table/list 중심의 compact shell로 정리한다.
- [ ] `HistoryPanel.svelte`를 Pixel Lab utility log 느낌으로 정리한다.

Acceptance:

- supporting surfaces가 유용하지만 Pixel Lab보다 앞서 보이지 않는다.

---

## DS-05 Feedback, Dialog, Contextual UI Alignment

Goal: toast, dialog, context menu, shortcuts overlay를 design system preview 기준으로 정렬한다.

Files:

- `src/lib/components/feedback/ToastNotification.svelte`
- `src/lib/components/feedback/MessageDialog.svelte`
- `src/lib/components/feedback/ContextMenu.svelte`
- `src/lib/components/feedback/KeyboardShortcuts.svelte`

Tasks:

- [ ] toast icon set을 canonical emoji/status 규칙에 맞춘다.
- [ ] toast/dialog surface가 floating + outset recipe를 공유하게 정리한다.
- [ ] context menu hover/active recipe를 preview specimen 기준으로 통일한다.
- [ ] keyboard shortcuts overlay가 modal chrome 안에서 읽히도록 hierarchy를 정리한다.
- [ ] close affordance와 action row spacing을 공통화한다.

---

## DS-06 Design-System Violation Cleanup

Goal: modern-looking CSS를 systematic하게 줄인다.

Files:

- `src/lib/components/editor/*`
- `src/lib/components/media/*`
- `src/lib/components/window/*`
- `src/lib/components/feedback/*`

Tasks:

- [ ] `transition` 사용처를 점검하고, chrome 영역의 easing/animation을 제거한다.
- [ ] `color-mix(...)` 의존 스타일을 design token 기반 색상으로 치환한다.
- [ ] glow / halo / modern shadow를 Win98 bevel or allowed floating shadow로 치환한다.
- [ ] hover 시 color change, scale, translation이 들어가는지 점검하고 chrome 정책에 맞게 조정한다.
- [ ] `border-radius: 0` 원칙 예외가 CRT surface 외에 없는지 점검한다.

---

## DS-07 Regression Safety And Review Harness

Goal: 디자인 전환 후 regression을 막을 검증 루프를 추가한다.

Files:

- `src/lib/components/__tests__/*`
- `e2e/*`
- `.storybook/*`
- `docs/sample_image_benchmark.md`
- `sampleImages/*`

Tasks:

- [x] `sampleImages/` category 구조와 `retro/` reference set을 visual benchmark로 고정한다.
- [x] `sampleImages/retro/`와 cross-style core 5의 expected family / preset / pass-fail manual checklist를 작성한다.
- [ ] shell / controls / preview / taskbar visual contract를 검증하는 component tests를 보강한다.
- [ ] aria-label / window title 계약이 바뀐 현재 상태에 맞춰 E2E selector를 안정화한다.
- [ ] Storybook stories를 design-system 비교 기준으로 보강한다.
- [ ] 주요 Pixel Lab surface에 screenshot/manual review checklist를 만든다.

---

## Recommended Execution Order

1. `DS-00 Source Of Truth Freeze`
2. `DS-01 Token And Recipe Alignment`
3. `DS-02 Pixel Lab Recommendation Surface`
4. `DS-03 Pixel Lab Controls / Preview Alignment`
5. `DS-04 Supporting Surface Pass`
6. `DS-05 Feedback, Dialog, Contextual UI Alignment`
7. `DS-06 Design-System Violation Cleanup`
8. `DS-07 Regression Safety And Review Harness`

---

## Suggested Definition Of Done

- Pixel Lab이 메인 제품 surface로 읽힌다
- Classic Pixel / Retro Treatment 추천 방향이 UI에서 이해된다
- upload -> recommendation -> preview/compare -> tune -> export 흐름이 끊기지 않는다
- Poster Maker / RetroCam은 supporting role로 읽힌다
- shell chrome이 Win98 제품군으로 유지된다
- modern CSS effect가 핵심 Win98 chrome에서 제거된다
- component test / E2E / manual review checklist가 디자인 전환 후 상태를 보호한다
