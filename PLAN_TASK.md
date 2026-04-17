# PLAN_TASK — Retro Pixel Converter

> v1.6.68 기준 상태 반영 완료 (2026-04-16). 전체 구현 이력과 완료 로그는 `REVISION_HISTORY.md`를 참조.
> 제품 backlog 및 기능 우선순위는 `docs/vnext/` 문서 세트를 우선 기준으로 운영한다.
> 아키텍처 전제: 본 제품은 브라우저/Tauri 로컬 리소스만 사용하는 client-only 앱이며, 별도 서버/백엔드를 두지 않는다.
> 품질 전제: 앞으로 모든 작업은 `웹 브라우저 사용성`, `Windows 98 UI 컨셉 유지`, `19.5:9급 모바일 반응형/UX`를 비기능 요구사항으로 함께 만족해야 한다.
> 네이밍 전제: 내부 `TypeScript / Svelte` 식별자는 `PascalCase(type)` / `camelCase(variable)` 기준으로 유지하며, 외부 계약 문자열과 Rust `snake_case`는 boundary 예외로 관리한다.
> QA 운영 전제: 실환경 manual QA는 현재 Codex 실행 환경에서 직접 완료할 수 없으므로, 문서상 추적 항목으로만 유지하고 자동 진행 우선순위에서는 건너뛴다.

---

## Current Product Progress

- `P3-005` 스타일 추천 MVP — 🚧 진행 중
  - `styleRecommender` 유틸로 이미지 밝기/채도/에지 특성과 palette match를 함께 점수화
  - PresetManager 프리셋 탭에 추천 스타일 카드와 이유 문구 추가
  - 팔레트 rank만 보던 추천을 실제 palette distance 기반 strength로 보정
  - exact palette fit가 강한 경우 `palette match` 설명을 우선 노출하도록 개선
  - broad palette 이미지에서는 하위 추천 슬롯이 한 팔레트로만 몰리지 않도록 diversity re-rank 추가
  - smooth / low-saturation grayscale 이미지에서 vivid-heavy preset 과추천을 줄이는 mismatch penalty 추가
  - recommendation loading / stale result ignore / click apply 흐름 테스트 보강
- `vNext suite base` — ✅ 구현 완료
  - `WP-01` ~ `WP-04`, `WP-07` 완료
  - `Pixel Lab`, `Poster Maker`, `RetroCam` shell / persistence / handoff / reopen 기반 완료
- `vNext / WP-05 RetroCam MVP` — ◐ residual follow-up만 남음
  - core capture / save / handoff / provenance / persistence / reopen 흐름은 구현 및 회귀 확보 완료
  - 남은 일은 short-loop export 판단과 manual/device QA 추적
- `vNext / WP-06 Shell polish` — ◐ acceptance follow-up만 남음
  - Start / recent reopen / launch strip / taskbar wording / `Open With` / first-run guide / shell confirm / copy cohesion은 1차 완료
  - 남은 일은 suite cohesion acceptance와 broader shell-wide expansion 여부 판단

## Next Up

- `vNext / WP-06` Shell polish / continuity 확장
  - suite reads as one product family인지 release 관점에서 다시 확인
  - app switching 이해도와 shell complexity 과다 여부 판단
  - broader shell-wide reopen/open-with expansion은 새 자산 타입/목적지가 생길 때까지 deferred 유지
- `vNext / WP-05` RetroCam residual follow-up
  - short-loop export 필요성 판단
  - tall-phone / permission-device real-device QA는 문서상 추적만 유지
  - output distinctiveness가 충분한지 판단
- `P3-005` 추천 품질 개선
  - 남은 휴리스틱 edge case를 더 찾고 설명 문구 선택 기준을 다듬기
- `Test / QA` follow-up
  - remaining case-by-case test noise 정리 가치 판단
  - Tauri/native save runtime manual QA 추적
- `네이밍 / 식별자` follow-up
  - `windowId` / `appId` / effect id 혼용이 실제 코드에 없는지 점진 점검
  - 다음 boundary 추가 시 mapper-first 패턴 유지

## vNext Planning Docs

- 다음 버전 컨셉/앱구성/로드맵/체크리스트는 `docs/vnext/` 문서 세트를 기준으로 관리한다.
- 현재 active focus는 `WP-06 Shell Polish` acceptance와 `P3-005` 추천 품질 follow-up이며, `WP-05`는 residual manual-QA / loop-export 판단만 남아 있다.
- `RetroCam` 첫 MVP 범위는 `docs/vnext/12_retrocam_mvp_spec.md`를 기준으로 고정한다.
- UI/UX 비기능 요구사항은 `docs/vnext/04_ui_system_guidelines.md`, `05_master_checklists.md`, `11_status_review.md`를 함께 기준으로 본다.

## UX / Device Guardrails

- 웹 페이지로 처음 진입한 사용자도 핵심 작업을 몇 초 안에 이해할 수 있어야 한다.
- 모든 신규 화면은 Win98 데스크탑 안의 소프트웨어처럼 보여야 하며, generic modern UI로 흐려지면 안 된다.
- 모바일은 보조 채널이 아니라 지원 대상이며, `19.5:9` 비율의 tall-phone viewport에서도 launch / focus switching / 핵심 액션 수행이 가능해야 한다.
- 자동 테스트가 green이어도 tall-phone 실기기 또는 동등 viewport 기준 수동 점검 가치가 높은 작업은 별도 확인 대상으로 남긴다.

---

## Task List (active / deferred only)

| # | 항목 | 파일 | 상태 |
|---|------|------|------|
| 1 | `P3-005` 추천 품질 edge-case 후속 | `styleRecommender.ts`, `PresetManager.svelte` | 🚧 진행 중 |
| 2 | `WP-06` shell cohesion acceptance | `window/*`, `DesktopWorkspace.svelte`, `Taskbar.svelte` | 🚧 진행 중 |
| 3 | `WP-05` short-loop export 판단 | `RetroCam.svelte`, export flow | ⏳ 후속 판단 |
| 4 | tall-phone / permission-device / native-save manual QA | mobile/runtime QA | ⏭️ 문서상 추적만 유지 |
| 5 | 미사용 i18n 동적 참조 키 후속 점검 | `src/lib/i18n/` | ⏳ follow-up |
| 6 | stale request worker cancel 시그널 | `imageProcessor.ts` | ⏭️ 보류 — 현재 stale 결과 폐기가 합리적 |
| 7 | `npm audit` low-risk dependency follow-up | `package-lock.json` | ⏭️ 보류 — 정적 SPA 기준 실질 영향 낮음 |

---

## Known Issues

- `npm run lint`: **0 errors / 0 warnings**
- `npm run check`: **0 errors / 0 warnings**
- `npm run verify:client`: **green**
- `npm test`: **599 tests / 83 files green**
- 프로젝트 runtime storage는 browser/Tauri local 환경에서 `IndexedDB`를 기본 사용하고, unsupported/test 환경은 in-memory fallback을 사용
- `RetroCam` webcam flow, tall-phone viewport, Tauri native save dialog/path behavior manual QA는 문서상 추적만 유지
- remaining jsdom canvas `getContext()` noise는 case-by-case 후속 정리 후보로 유지
- broader shell-wide reopen/open-with expansion은 새 자산 타입/목적지 전까지 deferred

---

## Build & Test

```bash
npm run dev           # 개발 서버 (port 1420)
npm run verify:client # lint + 타입 체크 + 테스트 일괄 검증
npm run lint          # ESLint (현재 0 errors / 0 warnings)
npm run check         # 타입 체크
npm test              # 테스트 실행 (현재 599개, 83 files)
npm run test:e2e      # Playwright E2E
npm run benchmark:quantizer:runtime  # 브라우저 quantizer runtime snapshot
npm run build-storybook  # Storybook 정적 빌드
npm run tauri build -- --debug  # 로컬 Tauri debug bundle 빌드
npm run test:watch    # 테스트 워치 모드
npm run storybook     # Storybook (port 6006)
```
