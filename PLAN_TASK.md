# PLAN_TASK — Retro Pixel Converter

> v1.3.1 에러 핸들링 수정 완료 (2026-03-18). 전체 이력은 `REVISION_HISTORY.md` 참조.

---

## Backlog

| 항목 | 우선순위 | 비고 |
|------|----------|------|
| 미사용 i18n 번역 키 정리 (97개) | P3 | 향후 기능에서 사용 가능성 있어 보류 중 |
| Pixel grid overlay 좌표 drift 보정 | P3 | object-fit:contain 계산 edge case |
| Storybook 타입 호환성 | P3 | Svelte 5 ↔ Storybook 10, 런타임 무관. 차기 버전 대기 |
| CompareView/EyedropperOverlay 인터랙션 테스트 | P3 | 커버리지 확장 가능 영역 |

---

## Known Issues

- Pre-existing type errors 5건: CompareView.test.ts (3) + vitest.setup.ts (2) — svelte-check 전용, 런타임 무관
- a11y warning 1건: ToastNotification `<div>` 이벤트 리스너 (기존)

---

## Build & Test

```bash
npm run dev          # 개발 서버 (port 1420)
npm run check        # 타입 체크
npm test             # 테스트 실행 (290개, 34 files)
npm run test:watch   # 테스트 워치 모드
npm run storybook    # Storybook (port 6006)
```
