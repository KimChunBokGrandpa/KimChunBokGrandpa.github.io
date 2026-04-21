
`HOURLY_LOG.md`, `RUN_STATE.json`, `ACTIVE_ISSUES.md`를 읽고,
사람이 2~3일 뒤에 확인해도 흐름을 이해할 수 있는 요약 보고서를 일자별 파일로 작성해줘.

실행 환경:
- 타임존: `Asia/Seoul` (KST, UTC+9) 고정. 모든 시각/날짜 표기는 KST
- 실행 시각: **별도 스케줄러가 매일 09:00 KST에 1회 실행**
- hourly가 daily를 직접 호출하지 않는다
- 락 공유: `.auto_run.lock` 경로를 hourly와 공유
- 단순 존재 확인 기반 락이 아니라 `mkdir .auto_run.lock` 같은 원자적 취득 방식을 사용
- 락이 이미 있고 mtime 55분 이내면 hourly 런과 충돌 → 즉시 종료 + `HOURLY_LOG.md`에 `DAILY_LOCKED` 기록
- stale 락(55분 초과)이면 제거 후 다시 원자적으로 취득
- 락 취득 방식과 stale 판정 기준은 hourly와 동일해야 합니다. 별도 구현으로 어긋나지 마세요
- 단일 장기 셸 세션을 보장하지 않으므로 `trap ... EXIT` 기반 자동 락 해제를 사용하지 마세요
- 리포트 작성, 상태 갱신, 로그 기록이 끝난 **가장 마지막 단계**에서만 `rm -rf .auto_run.lock`을 명시적으로 실행하세요
- 시작 시 타임스탬프: `TZ=Asia/Seoul date +%Y-%m-%dT%H:%M:%S%z`
- 별도 `.daily_run.lock`은 사용하지 않는다
- daily도 hourly와 동일한 `.auto_run.lock`만 사용한다
- 출력 디렉토리 `reports/`가 없으면 생성
- 파일 쓰기는 원자적: **이번 실행에서 선택한 최종 출력 경로**에 `.tmp`를 붙여 먼저 쓰고, 마지막에 `mv`
  - 예: `reports/DAILY_SUMMARY_YYYY-MM-DD.md.tmp`
  - 예: `reports/DAILY_SUMMARY_YYYY-MM-DD_HHMM.md.tmp`
- partial write 방지: 모든 섹션이 완성된 경우에만 최종 rename
- `last_summary_at` 갱신은 일자별 리포트 파일 무결성 확인 후에만

실패 처리:
- 쓰기 실패 또는 리포트 생성 중단 시:
  - `HOURLY_LOG.md`에 `DAILY_SUMMARY_FAILED: {사유}` append
  - `RUN_STATE.json.last_summary_at`은 이전 값 유지 (갱신 금지)
- 성공 시:
  - `RUN_STATE.json.last_summary_at` = 현재 KST ISO8601

중요 원칙:
- 이 보고서는 "오늘만" 요약하지 않는다.
- 기본 기준은 아래 우선순위로 선택한다.
  1. `RUN_STATE.json.last_summary_at` 이후 전체
  2. 없으면 최근 72시간
  3. 그것도 불가능하면 최근 3개 날짜
- 지난 24시간 내 daily report 생성 실패 또는 누락이 있으면, 누락된 기간의 통계와 이슈도 이번 보고서에 합산하세요
- 미해결 이슈는 최근 24시간 밖으로 밀려나도 반드시 포함한다.
- `ACTIVE_ISSUES.md`의 `OPEN`, `DEFERRED`, `BLOCKED`, `MANUAL_QA`, `NEEDS_REVIEW` 항목은 carry-over 이슈로 집계한다.
- `RECENTLY_RESOLVED` 항목은 별도 섹션으로 요약하고, 해결 근거가 약하면 완전 해결로 단정하지 않는다.
- 상태 판단 근거가 부족하면 임의로 ✅를 주지 말고 `보류` 또는 `근거부족`으로 적는다.
- 검증이 통과했더라도 UI/UX 레이아웃, spacing, 포커스 흐름, 모바일 배치, 시각적 어긋남은 자동으로 판단할 수 없으므로 이런 항목은 반드시 `MANUAL_QA` 또는 `보류`로 분류하세요.

작성 대상 파일:
- `HOURLY_LOG.md`
- `HOURLY_LOG_ARCHIVE_*.md` (있으면)
- `reports/DAILY_SUMMARY_*.md` 최근 1~3개 (있으면, 연속성 참고용)
- `RUN_STATE.json`
- `ACTIVE_ISSUES.md`

출력 파일:
- `reports/DAILY_SUMMARY_YYYY-MM-DD.md`
- 같은 날짜의 기존 보고서를 덮어쓰지 마세요
- 해당 날짜 리포트가 이미 있으면 `reports/DAILY_SUMMARY_YYYY-MM-DD_HHMM.md` 형식의 새 파일을 생성하세요
- 분 단위까지도 충돌하면 `reports/DAILY_SUMMARY_YYYY-MM-DD_HHMMSS.md` 형식으로 생성하세요
- 관리자가 며칠 뒤 확인하더라도 이전 날짜 요약본이 유실되지 않도록 일자별 독립 파일로 보존하세요

집계 규칙:
- 수치화된 통계(N회, N%)는 가능하면 `RUN_STATE.json`의 배열 크기, 카운터, 최근 상태 필드를 최우선으로 사용하세요
- `RUN_STATE.json`에 충분한 정량 데이터가 없을 때만 `HOURLY_LOG.md`/`HOURLY_LOG_ARCHIVE_*.md`의 로그 마커를 보조 근거로 사용하세요
- 정확한 숫자 집계가 불확실하면 거짓 데이터를 만들지 말고 `데이터 기반 산출 불가`, `근거부족`, 또는 `(약 N건 추정)`으로 명시하세요
- `issue_group_id`는 hourly에서 기록한 결정적 ID를 그대로 사용하세요
- 같은 문제를 다른 이름으로 다시 만들지 마세요
- `최근 3일간 동일 파일 반복 수정 횟수`는 요약 구간 내 `HOURLY_LOG.md`의 `MODIFIED: 파일경로` 등장 횟수로 계산하세요
- `이슈 해결률(생성 대비 해결)`은 요약 구간 내 새로 `OPEN`된 `issue_id` 대비 `RECENTLY_RESOLVED`로 이동한 `issue_id` 비율로 계산하세요
- 분모가 0이면 비율을 추정하지 말고 `근거부족` 또는 `해당없음`으로 적으세요
- `총 실행 횟수`는 요약 구간 내 `## [YYYY-MM-DD HH:00] 실행 결과` 헤더 개수로 계산하세요
- `이슈 그룹 처리 실행 횟수`는 요약 구간 내 `실행 유형`이 `이슈 수정`이거나 `이번 실행 처리 이슈 그룹`이 비어 있지 않은 실행 횟수로 계산하세요
- `no-op 횟수`는 `실행 유형: no-op` 기준으로 계산하세요
- `BLOCKED 횟수`는 `실행 유형: BLOCKED` 또는 상태 변경에 `BLOCKED`가 기록된 실행 횟수로 계산하세요
- `LOCKED 스킵 횟수`는 `LOCKED` 또는 `DAILY_LOCKED` 로그 마커 개수로 계산하세요
- `검증 실패 횟수`는 `검증 결과` 섹션의 실패 기록과 `last_failure`의 검증 실패 요약을 근거로 계산하세요
- `STATE_CORRUPTED 복구 횟수`는 `STATE_CORRUPTED` 로그 마커 개수로 계산하세요
- 이전 daily summary는 **서술 연속성 참고용**으로만 사용하세요
- 이전 daily summary의 숫자나 상태를 그대로 복제하지 말고, 현재 `RUN_STATE.json`/`ACTIVE_ISSUES.md`/최근 로그로 다시 앵커링하세요

형식:

## Daily Summary - [작성 시각]

### 관리자 즉시 개입 필요 (Blockers)
- `HALTED`, 반복 `BLOCKED`, 검증 연속 실패, 수동 QA 없이 배포하면 위험한 항목만 최상단에 1~5줄로 요약
- 즉시 개입이 필요 없으면 `없음`으로 명시

### 요약 범위
- 기준: last_summary_at 이후 / 최근 72시간 / 최근 3개 날짜
- 시작 시각: ...
- 종료 시각: ...
- 요약 구간이 여러 KST 날짜에 걸치면 아래 섹션들을 날짜별 소제목으로 나눠 정리하세요
  - 예: `#### 2026-04-15`, `#### 2026-04-16`

### 최근 실패 구간 발췌
- 최근 24시간 또는 이번 요약 구간 안에 검증 실패, `HALTED`, `TIMEOUT`, `STATE_CORRUPTED`가 있었다면 가장 중요한 실패 구간만 3~10줄 내로 발췌
- 실패가 없으면 `없음`으로 적기

### 운영 통계
- 총 실행 횟수: N회
- 이슈 그룹 처리 실행 횟수: N회
- no-op 횟수: N회
- BLOCKED 횟수: N회
- HALTED 진입 횟수: N회 (consecutive_failures >= 3)
- LOCKED 스킵 횟수: N회
- STATE_CORRUPTED 복구 횟수: N회
- 검증 실패 횟수: N회
- 검증 TIMEOUT 횟수: N회
- 처리한 이슈 그룹 수: N개
- 수정한 파일 수: N개
- 전체 검증 실행 횟수: N회
- 수동 QA 누적 항목 수: N개
- 현재 `consecutive_failures` 값: N
- 최근 3일간 동일 파일 반복 수정 횟수: 상위 N개
- 이슈 해결률(생성 대비 해결): N%
- 정확한 집계가 어려운 항목은 `데이터 기반 산출 불가` 또는 `(약 N건 추정)`으로 표기 가능

### 현재 제품 상태 스냅샷
| 영역 | 상태 | 변화 | 근거 |
|------|------|------|------|
| Pixel Lab 기본 편집 | ✅/🔧/❌/보류 | 개선/악화/변화없음 | ... |
| Poster Maker 레이아웃 | ✅/🔧/❌/보류 | ... | ... |
| RetroCam 캡처 | ✅/🔧/❌/보류 | ... | ... |
| 프로그램 간 handoff | ✅/🔧/❌/보류 | ... | ... |
| 저장/불러오기 | ✅/🔧/❌/보류 | ... | ... |
| 모바일 대응 | ✅/🔧/❌/보류 | ... | ... |
| Win98 shell 일관성 | ✅/🔧/❌/보류 | ... | ... |

### 관리자 확인용 변경 요약
- 이번 기간에 자동화가 처리한 주요 이슈 그룹을 3~6줄 내로 요약
- 관리자가 이후 수동으로 git commit/push 판단을 할 수 있도록 아래를 분명히 적기:
  - 무엇이 안정화되었는지
  - 어떤 파일군이 함께 변경되었는지
  - 아직 확인이 더 필요한 부분이 무엇인지

### Conflict Preview
- 자동화가 수정한 파일군과 현재 워크트리의 차이를 읽기 전용 관점에서 요약
- 특히 아래를 강조:
  - 반복적으로 다시 수정된 파일
  - 아직 `ACTIVE_ISSUES.md`에 남아 있는 파일
  - 관리자가 수동 git 작업 전에 충돌 가능성을 먼저 볼 필요가 있는 파일
- 이번 요약 구간에서 공통으로 많이 수정된 `hotspot` 파일이 있으면 별도로 강조하세요
- 근거가 부족하면 추측하지 말고 `근거부족`으로 적는다

### 이번 기간에 처리한 이슈
- `HOURLY_LOG.md`의 MODIFIED 항목, 이슈 그룹 기록, 상태 변경 항목을 묶어서 요약
- 같은 이슈가 여러 번 등장하면 하나로 묶고 최종 상태를 적기
- `issue_group_id`가 같으면 같은 이슈 그룹으로 간주하세요

| issue_group_id | 우선순위 | 관련 파일 | 이슈 | 최종 상태 | 비고 |
|----------------|---------|-----------|------|-----------|------|

### 이번 기간에 새로 발견된 미해결 이슈
- 이번 요약 구간 안에서 새로 생겼지만 아직 해결되지 않은 항목
- hourly에서 `NEEDS_REVIEW`로 남긴 항목도 여기에 포함할 수 있습니다

| 우선순위 | 파일 | 내용 | 상태 | 이유 |
|---------|------|------|------|------|

### 최근 해결된 이슈 (RECENTLY_RESOLVED)
- `ACTIVE_ISSUES.md`의 `RECENTLY_RESOLVED`와 `HOURLY_LOG.md`의 해결 기록을 함께 보고 정리
- 해결 근거가 약하면 `완전 해결` 대신 `관찰 필요`로 표시

| issue_id | 파일 | 내용 | 해결 시각 | 상태 |
|----------|------|------|-----------|------|

### 누적 carry-over 이슈
- `ACTIVE_ISSUES.md` 기준으로 현재 남아 있는 이슈를 정리
- 오래된 이슈라도 반드시 포함
- `NEEDS_REVIEW` 상태는 별도 검토 필요로 드러나게 표시하세요

| issue_id | 우선순위 | 파일 | 내용 | 상태 | 다음 액션 |
|----------|---------|------|------|------|----------|

### 검증 요약
| 명령어 | 성공/실패 횟수 | 비고 |
|--------|----------------|------|
| npm run check | N/N | ... |
| npm run lint | N/N | ... |
| npm test | N/N | ... |
| npm run verify:client | N/N | ... |

### 수동 QA 필요 항목 (이번 기간 신규)
| 항목 | 상태 | 이유 |
|------|------|------|
| Tauri native save dialog/path | 대기/진행중 | ... |
| webcam permission/device | 대기/진행중 | ... |
| tall-phone real-device | 대기/진행중 | ... |
| PWA/offline 실환경 | 대기/진행중 | ... |
| 시각적 레이아웃/spacing/focus 흐름 확인 | 대기/진행중 | 자동 검증만으로 확정 불가 |

### 수동 QA 누적 carry-over
- 이전 보고서부터 남아 있던 `MANUAL_QA` 항목을 별도로 정리
- 이번 기간 신규 항목과 섞지 마세요

| 항목 | 상태 | 이유 | 최초 확인 시각 |
|------|------|------|----------------|

### 무인운용 리스크 메모
- 2~3일 무인운용 중 주의할 점
- 반복 실패 또는 BLOCKED 패턴
- 문서 변경 감지 여부
- 이슈 그룹 예산 소진 경향
- 관리자가 수동으로 검토/커밋해야 할 변경 묶음이 있는지
- 이슈 해결률 추이와 hotspot 파일 반복 수정 여부를 함께 적기
- 해결률이 20% 미만이거나 특정 파일에서 5회 이상 수정-실패가 반복되면 `자동화의 한계 지점. 관리자 직접 개입 권장`을 명시하세요

### 다음 확인 시 최우선 권장
1. ...
2. ...
3. ...

마지막 줄에 아래를 추가:
- 선택된 최종 출력 파일(`reports/DAILY_SUMMARY_YYYY-MM-DD.md` 또는 `..._HHMM.md`/`..._HHMMSS.md`) 생성 성공 시에만 `RUN_STATE.json.last_summary_at`을 현재 KST ISO8601로 갱신
- 중단/실패 시 `last_summary_at`는 **이전 값 유지**
- 다음 요약은 이 시각 이후 로그부터 집계해야 함
- `consecutive_failures`가 3 이상(HALTED)이면 그 사실을 "무인운용 리스크 메모"에 반드시 명시
- 동일 날짜에 `HHMM` 또는 `HHMMSS` suffix 파일이 생성되어도 가장 마지막으로 성공한 파일 시각 기준으로만 `last_summary_at`을 갱신
- 모든 기록이 끝난 뒤 마지막 단계에서만 `.auto_run.lock`을 명시적으로 해제