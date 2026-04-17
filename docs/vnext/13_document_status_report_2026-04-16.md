# vNext Document Status Report

> Report date: 2026-04-16
> Purpose: 문서 세트 전체를 기준으로 완료 사항, 진행 중 사항, 다음 작업, 문서 정합성 포인트를 한 장으로 요약한다.

---

## 1. 검토 범위

- `README.md`
- `PLAN_TASK.md`
- `REVISION_HISTORY.md`
- `docs/vnext/README.md`
- `docs/vnext/03_execution_roadmap.md`
- `docs/vnext/05_master_checklists.md`
- `docs/vnext/06_work_packages.md`
- `docs/vnext/07_app_taxonomy_spec.md`
- `docs/vnext/08_project_schema_spec.md`
- `docs/vnext/09_cross_app_handoff_spec.md`
- `docs/vnext/10_role_execution_plan.md`
- `docs/vnext/11_status_review.md`
- `docs/vnext/12_retrocam_mvp_spec.md`

---

## 2. 상태 판단 기준

- forward-looking SSOT는 계속 `docs/vnext/` 문서 세트다.
- 실제 현재 완료/진행 상태 판독은 아래 묶음을 함께 봐야 한다.
  - `docs/vnext/06_work_packages.md`
  - `docs/vnext/10_role_execution_plan.md`
  - `docs/vnext/11_status_review.md`
  - `PLAN_TASK.md`
  - `REVISION_HISTORY.md`
- `docs/vnext/03_execution_roadmap.md`, `docs/vnext/05_master_checklists.md`는 여전히 유효하지만, live completion tracker라기보다 sequencing/checklist 문서로 읽는 편이 맞다.

---

## 3. 완료 확인 사항

### 제품/프로그램 구조

- `client-only` 제품 전제는 문서 전반에서 일관된다.
- 제품 프레이밍은 단일 변환기에서 `retro desktop creative suite`로 확장된 상태다.
- first-party program 3종(`Pixel Lab`, `Poster Maker`, `RetroCam`) 정의가 고정돼 있다.

### vNext work package 상태

- `WP-01 Shell Reframing` 완료
- `WP-02 Pixel Lab Packaging` 완료
- `WP-03 Shared Project Model` 완료
  - `IndexedDB` 기반 durable persistence 반영
  - unsupported/test 환경만 in-memory fallback 유지
- `WP-04 Poster Maker MVP` 완료
- `WP-07 QA and Regression Coverage` 완료

### 현재 구현상 이미 확보된 핵심 범위

- `Pixel Lab` shell identity, utility window taxonomy, launch/taskbar naming 정리 완료
- `Poster Maker` desktop launch, document workflow, export, `Pixel Lab -> Poster Maker` handoff 완료
- `RetroCam` webcam-only snapshot MVP, permission/error state, `RetroCam -> Pixel Lab` handoff 완료
- `RetroCam -> Poster Maker` direct handoff는 최초 MVP 범위를 넘는 continuity slice로 이미 구현됨
- shell 수준 recent-project reopen, first-run guide, shared confirm dialog, `Open With` 패턴 1차 정착 완료
- `P3-001`, `P3-002`, `P3-003`, `P3-004`는 문서상 완료 상태

---

## 4. 진행 중 사항

### `P3-005` 추천 품질 개선

- local heuristic MVP는 완료
- recent edge-case pass까지 반영됨
- 현재는 narrow edge-case 추가 판단 단계

### `WP-05 RetroCam MVP`

- active tier 표기는 유지되지만, 실제 남은 일은 핵심 기능 구현보다 polish/QA/deferred follow-up 성격이 강하다.
- 현재 문서 기준 남은 포인트:
  - real-device permission/device QA
  - tall-phone mobile manual QA
  - short loop/export 후속 판단
  - suite continuity follow-up 판단

---

## 5. 앞으로 작업해야 할 사항

### 우선순위 높음

1. `remaining case-by-case test noise`가 추가 정리 가치가 있는지 판단
2. `P3-005`에 더 좁은 추천 품질 edge case가 남았는지 판단
3. browser usability / Win98 identity / `19.5:9` tall-phone UX를 이후 변경의 release guardrail로 계속 유지

### 우선순위 중간

1. suite continuity를 과확장하지 않는 선에서 reopen/open-with follow-up 필요 여부 점검
2. shell/system copy drift가 다시 생길 때만 소규모 wording pass 수행

### deferred manual QA

1. Tauri native save dialog 실제 런타임 확인
2. `RetroCam` permission/device edge case 실환경 확인
3. tall-phone viewport 실기기 QA

### 명시적 deferred 범위

1. `RetroCam` short loop/export
2. shell-wide open-with destination 과확장
3. 새로운 asset type 없는 상태에서의 broader reopen graph 확장

---

## 6. 문서 정합성 점검 결과

### 확인된 일치 사항

- `README.md`, `PLAN_TASK.md`, `docs/vnext/11_status_review.md`는 현재 제품 방향과 주요 완료 항목을 대체로 같은 방향으로 설명한다.
- `07_app_taxonomy_spec.md`, `08_project_schema_spec.md`, `09_cross_app_handoff_spec.md`는 현재 구현 방향과 큰 충돌 없다.

### 확인된 주의 사항

- `03_execution_roadmap.md` acceptance checklist는 아직 미체크 상태가 많다.
  - 해석: 미구현 표시라기보다 live tracker가 아니라는 뜻으로 읽어야 한다.
- `05_master_checklists.md`도 top-level checklist는 대부분 generic open 상태다.
  - 실제 현재 상태는 같은 문서 안 snapshot 블록과 `11_status_review.md`가 더 정확하다.

### 이번 정리에서 반영한 수정

- `12_retrocam_mvp_spec.md`
  - 문서 성격을 "historical MVP contract + current implementation note"로 명확화
  - `RetroCam -> Poster Maker` direct handoff가 now implemented continuity slice라는 점 반영
  - project runtime persistence가 더 이상 pure in-memory 전제가 아니라는 점 반영
- `docs/vnext/README.md`
  - 본 보고 문서 링크 추가

---

## 7. 추천 읽기 순서

1. 방향/범위: `docs/vnext/README.md`, `03_execution_roadmap.md`
2. 계약: `07_app_taxonomy_spec.md`, `08_project_schema_spec.md`, `09_cross_app_handoff_spec.md`
3. 실행 상태: `06_work_packages.md`, `10_role_execution_plan.md`, `11_status_review.md`
4. 일일 운영 상태: `PLAN_TASK.md`, `REVISION_HISTORY.md`
5. 이번 요약: 이 문서

---

## 8. 결론

- 문서 세트는 전반적으로 현재 구현 방향과 맞다.
- 실제 완료 비중은 높고, 남은 일은 대형 신규 기능보다 품질 판단, continuity polish, manual QA deferred 추적 쪽에 가깝다.
- 지금 시점에서 가장 중요한 실무 해석은 아래 한 줄이다.

`WP-01`~`WP-04`, `WP-07` 완료. `WP-05`는 사실상 polish/QA follow-up 단계. 현재 자동 구현 우선순위는 `test noise 판단`과 `P3-005 edge-case 추가 판단`.
