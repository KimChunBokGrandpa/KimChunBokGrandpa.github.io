# Request Intake Analysis — 2026-05-08

Purpose: `request.md`에 들어온 외부 분석을 vNext 기준으로 취사선택하고, 중복 권위를 제거한다. 원본 `request.md`는 이 분석으로 흡수한 뒤 삭제한다.

---

## Intake Decision

`request.md`의 진단 방향은 채택한다.

- 제품 중심은 `Pixel Lab`이다.
- `Classic Pixel`과 `Retro Treatment`를 모두 정식 방향으로 수용한다.
- 추천은 최종 결과가 아니라 "바로 조정 가능한 시작점"이다.
- `sampleImages/retro/`는 현재 레트로 픽셀화 1차 reference set이다.
- 실행 판단은 "Classic Pixel 품질, Retro Treatment 품질, 추천 품질, Pixel Lab 편집 속도 중 무엇을 개선하는가?"로 한다.

다만 `request.md`의 남은 작업 목록은 작성 시점 이후 진행된 작업을 반영하지 않으므로 그대로 task authority로 쓰지 않는다. 실행 권위는 계속 `PLAN_TASK.md`, `docs/vnext/06_work_packages.md`, `docs/sample_image_benchmark.md`, `docs/vnext/16_processing_effect_boundary_inventory_2026-05-07.md`, `required.md`를 따른다.

---

## Adopted

`request.md`에서 그대로 흡수한 판단:

- 첫 질문: "어떤 이미지를 넣었을 때 내가 원하는 고전/레트로 픽셀화가 아니라고 느꼈는가?"
- 실제 문제: 단순 pixelate 부재가 아니라, 캐릭터 가독성, palette/dither 질감, 레트로 효과의 주제 파괴, 추천 신뢰 문제다.
- 제품 구조: `Input -> Recommendation -> Tune -> Judge -> Export`.
- 다음 큰 방향: `sampleImages/retro/`와 cross-style core 5 기준으로 실제 결과 품질을 먼저 판단한다.
- UX 후속 방향: 결과 품질 판단 이후 `Preview Compare confidence`와 `Export hierarchy`를 정리한다.

---

## Already Covered

`request.md`의 후보 B, `effectLayers / HQx / CRT boundary 2차 정리`, 중 자동으로 닫을 수 있는 부분은 이미 상당 부분 진행했다.

- effect-layer-only fast path bypass 수정
- HistoryPanel / ControlPanel compact effect count 정렬
- built-in preset preview/application settings shape 통일
- GIF export HQx cap / expanded output size / Oklab payload 회귀 테스트
- Tauri legacy `renderMode: hqx` fallback post-processing 회귀 테스트

남은 boundary 성격 작업은 browser/Tauri visual parity와 CRT stack 편입 여부이며, 이는 runtime/manual 판단이 필요하다.

---

## Current Priority

현재 우선순위는 `request.md`의 후보 A를 승격한다.

1. `sampleImages/retro/` 5장 + cross-style core 5 결과 품질 스윕
2. runtime/manual browser/Tauri visual parity 확인
3. `WP-08` Preview Compare confidence + Export hierarchy
4. `WP-07 / WP-08` recommendation family clarity edge-case 점검
5. tall-phone / Tauri native save / webcam permission / clipboard-save manual QA tracking

2026-05-08 진행 메모: 현재 워크스페이스에는 local `sampleImages/` 디렉토리가 없어 후보 A의 실제 품질 스윕은 asset 복구 전까지 보류한다. 자동으로 진행 가능한 다음 작업으로 `WP-08` Preview Compare confidence 1차 보강을 먼저 진행했다.

---

## Task Conversion

| Request Candidate | Decision | Current Target |
|-------------------|----------|----------------|
| A. sampleImages result quality sweep | Adopt as next active work | `docs/sample_image_benchmark.md` checklist 기준 first review log 작성 |
| B. effectLayers / HQx / CRT boundary cleanup | Partially completed; keep remainder scoped | runtime/manual visual parity and CRT stack decision only |
| C. Preview Compare confidence + Export hierarchy | Keep after A | Use quality sweep findings to decide what confidence UI must expose |

---

## Source Cleanup

`request.md`는 중복 diagnosis 문서이므로 삭제한다. 필요한 판단은 이 문서와 기존 vNext/task 문서에 흡수됐다.
