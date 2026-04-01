# Code Review Harness 사용 가이드

종합 코드 리뷰를 위한 멀티 에이전트 하네스. 아키텍처, 보안, 성능, 스타일 4개 전문 리뷰어가 병렬로 코드를 감사하고, 결과를 하나의 통합 리포트로 생성합니다.

---

## 아키텍처 개요

```
                        ┌─────────────────────┐
                        │  code-review-       │
                        │  orchestrator       │
                        │  (오케스트레이터)     │
                        └────────┬────────────┘
                                 │
                   ┌─────────────┼─────────────┐
          Phase 2: │  병렬 실행  │             │
                   ▼             ▼             ▼             ▼
          ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
          │  arch-   │  │ security-│  │  perf-   │  │  style-  │
          │ reviewer │  │ reviewer │  │ reviewer │  │ reviewer │
          └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
               │             │             │             │
               ▼             ▼             ▼             ▼
          01_arch_     02_security_   03_perf_     04_style_
          review.md    review.md      review.md    review.md
               │             │             │             │
               └─────────────┴──────┬──────┴─────────────┘
                                    │
                           Phase 3-4: 통합
                                    ▼
                        ┌─────────────────────┐
                        │ 05_integrated_      │
                        │ report.md           │
                        │ (통합 리포트)         │
                        └─────────────────────┘
```

**패턴:** Fan-out / Fan-in (팬아웃/팬인)
**실행 모드:** 서브 에이전트 (4개 독립 병렬 실행)

---

## 빠른 시작

### 종합 코드 리뷰 실행

Claude Code에서 다음과 같이 요청합니다:

```
종합 코드 리뷰 해줘
```

또는

```
전체 감사 해줘
```

자동으로 `code-review-orchestrator` 스킬이 트리거되어 4개 리뷰어를 병렬 실행합니다.

### 범위 지정 리뷰

```
src/lib/services/ 디렉토리만 종합 리뷰 해줘
```

```
변경된 파일만 코드 리뷰 해줘
```

### 개별 리뷰어 실행

특정 영역만 감사하고 싶을 때:

```
아키텍처 리뷰 해줘          # arch-reviewer만 실행
보안 감사 해줘              # security-reviewer만 실행
성능 병목 분석 해줘          # perf-reviewer만 실행
스타일 리뷰 해줘            # style-reviewer만 실행
```

---

## 에이전트 상세

### 1. arch-reviewer (아키텍처 리뷰어)

| 항목 | 내용 |
|------|------|
| **파일** | `.claude/agents/arch-reviewer.md` |
| **스킬** | `.claude/skills/arch-review/skill.md` |
| **분석 영역** | 모듈 결합도, 응집도, 레이어 위반, 순환 참조, 의존성 방향 |
| **심각도** | CRITICAL / WARNING / INFO |
| **출력** | `_workspace/01_arch_review.md` |

**주요 체크 항목:**
- `components/` → `stores/` 직접 접근 패턴
- `workers/` → `stores/` 역참조 (Worker는 독립적이어야 함)
- `services/` → `components/` 역참조
- 5개 이상 외부 모듈에 의존하는 HIGH coupling 모듈
- 300줄 이상 단일 파일 (분리 후보)
- Tauri IPC ↔ 프론트엔드 명령 매칭 검증

### 2. security-reviewer (보안 리뷰어)

| 항목 | 내용 |
|------|------|
| **파일** | `.claude/agents/security-reviewer.md` |
| **스킬** | `.claude/skills/security-review/skill.md` |
| **분석 영역** | OWASP Top 10, XSS, 인젝션, Tauri IPC, 민감 데이터 노출 |
| **심각도** | CRITICAL / HIGH / MEDIUM / LOW (CWE 번호, CVSS 추정 포함) |
| **출력** | `_workspace/02_security_review.md` |

**주요 체크 항목:**
- `{@html}`, `innerHTML` 사용처
- 하드코딩된 시크릿, localStorage 민감 데이터
- Tauri IPC invoke 입력 검증
- `tauri.conf.json` CSP, capabilities 범위
- Blob URL use-after-revoke
- Worker 메시지 origin 검증
- GitHub Actions 시크릿 관리

### 3. perf-reviewer (성능 리뷰어)

| 항목 | 내용 |
|------|------|
| **파일** | `.claude/agents/perf-reviewer.md` |
| **스킬** | `.claude/skills/perf-review/skill.md` |
| **분석 영역** | 메모리 누수, 렌더링 비효율, 알고리즘, Worker, 번들 크기 |
| **심각도** | HIGH / MEDIUM / LOW (영향도 추정 포함) |
| **출력** | `_workspace/03_perf_review.md` |

**주요 체크 항목:**
- `URL.createObjectURL` / `URL.revokeObjectURL` 쌍 검증
- `$effect` 클린업 함수 반환 여부
- `$derived`로 대체 가능한 `$effect` 패턴
- Worker에서 transferable 사용 여부
- 이미지 처리 파이프라인 픽셀 순회 복잡도
- GIF 프레임 캐시 무한 성장 가능성
- 번들 크기 및 동적 import 활용

### 4. style-reviewer (스타일 리뷰어)

| 항목 | 내용 |
|------|------|
| **파일** | `.claude/agents/style-reviewer.md` |
| **스킬** | `.claude/skills/style-review/skill.md` |
| **분석 영역** | 네이밍, Svelte 5 관용구, TypeScript, import 패턴, i18n |
| **심각도** | MUST FIX / SHOULD FIX / NITPICK (일관성 점수 포함) |
| **출력** | `_workspace/04_style_review.md` |

**주요 체크 항목:**
- `$:` 레거시 반응성 구문 사용
- `$lib/` 절대 import 준수 여부
- `.svelte.ts` 확장자 컨벤션
- `any` 타입 남용
- 하드코딩된 UI 문자열 (i18n 누락)
- 10줄 이상 중복 코드
- CSS 변수 토큰 (`--w98-*`) 사용

---

## 통합 리포트 형식

오케스트레이터가 4개 결과를 통합하여 `_workspace/05_integrated_report.md`에 생성합니다.

### 우선순위 체계

| 우선순위 | 기준 | 의미 |
|---------|------|------|
| **P0** | 보안 CRITICAL + 성능 HIGH | 즉시 수정 필요 |
| **P1** | 아키텍처 WARNING + 스타일 MUST FIX | 조기 수정 권장 |
| **P2** | 나머지 | 개선 권장 |

### 교차 영역 분석

오케스트레이터는 단순 병합이 아니라 **영역 간 연결**을 분석합니다:

- 아키텍처 결함 → 보안 취약점 (예: 레이어 위반 → 권한 우회)
- 성능 병목 → 보안 이슈 (예: 무한 루프 → DoS 벡터)
- 스타일 위반 → 아키텍처 이슈 (예: import 패턴 → 순환 참조)
- 타입 안전성 → 보안 (예: any 타입 → 런타임 인젝션)

---

## 워크플로우 상세

```
Phase 1: 준비
  ├── 분석 범위 결정 (전체 / 변경 파일 / 지정 범위)
  ├── _workspace/ 디렉토리 생성
  ├── 00_scope.md 작성
  └── CLAUDE.md 컨텍스트 로딩

Phase 2: 병렬 리뷰 실행
  ├── arch-reviewer     (background) → 01_arch_review.md
  ├── security-reviewer (background) → 02_security_review.md
  ├── perf-reviewer     (background) → 03_perf_review.md
  └── style-reviewer    (background) → 04_style_review.md

Phase 3: 결과 수집 및 통합
  ├── 4개 결과 파일 수집
  ├── 교차 영역 이슈 식별
  ├── 중복 발견 병합
  └── 통합 우선순위 산정 (P0/P1/P2)

Phase 4: 통합 리포트 생성
  └── _workspace/05_integrated_report.md

Phase 5: 정리
  ├── Executive Summary 출력
  └── P0 이슈 있으면 즉시 수정 여부 확인
```

---

## 에러 핸들링

| 상황 | 전략 |
|------|------|
| 리뷰어 1개 실패 | 1회 재시도 → 재실패 시 해당 영역 제외, 리포트에 "미분석" 명시 |
| 리뷰어 과반 실패 | 사용자에게 알리고 부분 리포트 생성 여부 확인 |
| 타임아웃 | 완료된 결과만으로 리포트 생성 |
| 영역 간 소견 충돌 | 양쪽 출처를 병기하고 삭제하지 않음 |

---

## 파일 구조

```
.claude/
├── agents/
│   ├── arch-reviewer.md          # 아키텍처 리뷰어 에이전트 정의
│   ├── security-reviewer.md      # 보안 리뷰어 에이전트 정의
│   ├── perf-reviewer.md          # 성능 리뷰어 에이전트 정의
│   └── style-reviewer.md         # 스타일 리뷰어 에이전트 정의
├── skills/
│   ├── arch-review/
│   │   └── skill.md              # 아키텍처 감사 스킬
│   ├── security-review/
│   │   └── skill.md              # 보안 감사 스킬
│   ├── perf-review/
│   │   └── skill.md              # 성능 감사 스킬
│   ├── style-review/
│   │   └── skill.md              # 스타일 감사 스킬
│   └── code-review-orchestrator/
│       └── skill.md              # 통합 오케스트레이터 스킬

_workspace/                       # 리뷰 실행 시 생성 (사후 검증용 보존)
├── 00_scope.md                   # 분석 범위
├── 01_arch_review.md             # 아키텍처 리뷰 결과
├── 02_security_review.md         # 보안 리뷰 결과
├── 03_perf_review.md             # 성능 리뷰 결과
├── 04_style_review.md            # 스타일 리뷰 결과
└── 05_integrated_report.md       # 통합 리포트
```

---

## 커스터마이징

### 에이전트 수정

각 에이전트의 분석 기준이나 출력 형식을 변경하려면 `.claude/agents/{name}.md` 파일을 직접 편집합니다.

### 스킬 수정

감사 절차나 체크 항목을 추가/제거하려면 `.claude/skills/{name}/skill.md` 파일을 편집합니다.

### 리뷰어 추가

새 리뷰어를 추가하려면:
1. `.claude/agents/{new-reviewer}.md` 에이전트 정의 생성
2. `.claude/skills/{new-review}/skill.md` 스킬 생성
3. `code-review-orchestrator/skill.md`의 에이전트 구성 테이블에 추가
4. Phase 2에 Agent 호출 추가, Phase 3 통합 로직에 반영

https://github.com/revfactory/harness/blob/main/README_KO.md