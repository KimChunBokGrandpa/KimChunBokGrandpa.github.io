# Product Team Harness 사용 가이드

기능 개발을 위한 통합 프로덕트 멀티 에이전트 팀. 기획 → 병렬 개발(프론트/백엔드/스타일) → 병렬 검증(QA/UX) → 통합의 4단계로 기능을 개발합니다.

---

## 아키텍처 개요

```
Phase 1 (순차):     [product-planner] → 스펙 + 작업 분해
                            │
Phase 2 (병렬):    ┌────────┼────────┐
                   ▼        ▼        ▼
            [frontend] [backend] [style]  → 각각 구현
                   │        │        │
Phase 3 (병렬):    └────┬───┘────┬───┘
                        ▼        ▼
                  [qa-engineer] [ux-optimizer] → 검증
                        │        │
Phase 4 (순차):         └───┬────┘
                            ▼
                     [통합 + 빌드 확인]
```

**패턴:** Pipeline + Fan-out/Fan-in (복합)
**실행 모드:** 에이전트 팀 (6명 + 리더)

---

## 빠른 시작

### 기능 개발 실행

```
기능 개발 해줘: 이미지 회전에 자유 각도 입력 기능 추가
```

또는

```
새 기능 구현: 팔레트 즐겨찾기 기능
```

자동으로 `product-team-orchestrator` 스킬이 트리거되어 6명의 팀원이 단계별로 작업합니다.

### 범위 지정 개발

```
프론트만 개발: 배치 처리 UI 개선
백엔드만: Rust 이미지 리사이즈 최적화
스타일만: 다크모드 지원
```

### 개별 팀원 실행

```
기능 기획만 해줘          # product-planner만
프론트 개발 해줘          # frontend-dev만
백엔드 작업 해줘          # backend-dev만
스타일 작업 해줘          # style-engineer만
QA 검증 해줘             # qa-engineer만
UX 분석 해줘             # ux-optimizer만
```

---

## 에이전트 상세

### 1. product-planner (기획자)

| 항목 | 내용 |
|------|------|
| **파일** | `.claude/agents/product-planner.md` |
| **스킬** | `.claude/skills/product-planning/skill.md` |
| **역할** | 요구사항 분석, 기술 스펙 작성, 작업 분해 |
| **출력** | `_workspace/prod_01_spec.md` |

**핵심 산출물:**
- 기능 요약 + 사용자 스토리
- 변경 대상 파일 목록
- 작업 분해: FE Tasks / BE Tasks / ST Tasks
- 의존성 그래프
- 테스트 요구사항
- 위험 요소 + 완료 기준

### 2. frontend-dev (프론트엔드 개발자)

| 항목 | 내용 |
|------|------|
| **파일** | `.claude/agents/frontend-dev.md` |
| **스킬** | `.claude/skills/frontend-development/skill.md` |
| **역할** | Svelte 5 컴포넌트, 스토어, 서비스, i18n 구현 |
| **출력** | `_workspace/prod_02_frontend.md` + 소스 코드 |

**전문 영역:**
- Svelte 5 runes ($state, $derived, $effect)
- 컴포넌트 개발 (.svelte)
- 리액티브 스토어 (.svelte.ts)
- i18n 키 관리 (en.ts, ko.ts, ja.ts)
- Worker 통신 로직

### 3. backend-dev (백엔드 개발자)

| 항목 | 내용 |
|------|------|
| **파일** | `.claude/agents/backend-dev.md` |
| **스킬** | `.claude/skills/backend-development/skill.md` |
| **역할** | Tauri IPC, Rust 알고리즘, Worker 파이프라인, CI/CD |
| **출력** | `_workspace/prod_03_backend.md` + 소스 코드 |

**전문 영역:**
- Tauri v2 IPC 명령 (#[tauri::command])
- Rust 이미지 처리 (양자화, 디더링)
- Web Worker 최적화 (transferable)
- GitHub Actions 배포 파이프라인

### 4. style-engineer (스타일 엔지니어)

| 항목 | 내용 |
|------|------|
| **파일** | `.claude/agents/style-engineer.md` |
| **스킬** | `.claude/skills/style-engineering/skill.md` |
| **역할** | 98.css 테마, CSS 변수 토큰, 반응형 레이아웃 |
| **출력** | `_workspace/prod_04_style.md` + CSS 코드 |

**전문 영역:**
- Windows 98 테마 (98.css) 통합
- --w98-* CSS 변수 토큰 시스템
- 반응형 레이아웃 (550px 브레이크포인트)
- Win98 3D 효과 (outset/inset 그림자)

### 5. qa-engineer (QA 엔지니어)

| 항목 | 내용 |
|------|------|
| **파일** | `.claude/agents/qa-engineer.md` |
| **스킬** | `.claude/skills/qa-engineering/skill.md` |
| **역할** | 테스트 작성, 버그 탐지, 회귀 검증 |
| **출력** | `_workspace/prod_05_qa_report.md` + 테스트 코드 |

**검증 범위:**
- 기존 362개 테스트 회귀 확인
- 유닛/컴포넌트 테스트 작성 (Vitest + @testing-library)
- 코드 버그 탐지 (논리 오류, 경계 조건, 메모리)
- TypeScript 타입 체크 + 빌드 검증

### 6. ux-optimizer (UX 최적화 전문가)

| 항목 | 내용 |
|------|------|
| **파일** | `.claude/agents/ux-optimizer.md` |
| **스킬** | `.claude/skills/ux-optimization/skill.md` |
| **역할** | 사용성, 접근성(a11y), 반응형, Win98 테마 일관성 |
| **출력** | `_workspace/prod_06_ux_report.md` + 수정 코드 |

**분석 영역:**
- WCAG 2.1 AA 접근성 (ARIA, 키보드, 포커스, 색상 대비)
- 사용자 플로우 최적화
- 반응형 레이아웃 검증 (데스크톱 ↔ 모바일)
- Win98 미학 ↔ 현대적 UX 균형

---

## 팀 통신 패턴

```
planner ──────→ frontend (FE 스펙)
         ├────→ backend  (BE 스펙)
         └────→ styler   (ST 스펙)

frontend ←──→ backend  (Tauri invoke 인터페이스 합의)
frontend ←──→ styler   (HTML 구조 ↔ CSS 클래스)

qa ──→ frontend  (FE 버그 알림)
   ├─→ backend   (BE 버그 알림)
   └─→ ux        (사용성 이슈 공유)

ux ──→ frontend  (ARIA/키보드 요청)
   └─→ styler    (색상 대비/포커스 스타일)
```

핵심: **개발자 3명은 리더를 거치지 않고 직접 소통**하여 인터페이스를 빠르게 합의.

---

## 워크플로우 상세

```
Phase 1: 기획 (순차)
  ├── 사용자 요청 분석
  ├── 코드 영향도 분석
  ├── 기술 스펙 작성
  ├── 작업 분해 (FE/BE/ST)
  └── prod_01_spec.md 생성

Phase 2: 병렬 개발
  ├── frontend-dev (컴포넌트/스토어/서비스) → prod_02_frontend.md
  ├── backend-dev  (Tauri/Worker/CI)        → prod_03_backend.md
  └── style-engineer (CSS/반응형/테마)       → prod_04_style.md
  ** 팀원 간 인터페이스 합의 via SendMessage **

Phase 3: 병렬 검증
  ├── qa-engineer  (테스트/버그/회귀)       → prod_05_qa_report.md
  └── ux-optimizer (UX/접근성/반응형)       → prod_06_ux_report.md
  ** 버그 수정 루프 최대 2회 **

Phase 4: 통합
  ├── npm test (전체 테스트 통과)
  ├── npm run check (타입 체크)
  ├── npm run build (빌드 성공)
  └── prod_07_final_report.md 생성

Phase 5: 정리
  ├── 팀 정리
  ├── _workspace/ 보존
  └── 결과 요약 보고
```

---

## 에러 핸들링

| 상황 | 전략 |
|------|------|
| 스펙 불명확 | planner가 3가지 방향 제안 → 사용자 선택 |
| 개발자 1명 실패 | 리더 중재 → 재시도 → 다른 팀원에 재할당 |
| 인터페이스 충돌 | types.ts 기준으로 리더가 결정 |
| CRITICAL 버그 | qa → 해당 개발자 즉시 알림 → 수정 후 재검증 |
| 빌드 실패 | 타입 에러 → FE, 빌드 에러 → BE에 수정 요청 |
| 전체 테스트 실패 | 회귀 원인 분석 → 해당 팀원 수정 |

---

## 출력 파일 구조

```
_workspace/
├── prod_01_spec.md              # 기술 스펙 + 작업 분해
├── prod_02_frontend.md          # FE 구현 리포트
├── prod_03_backend.md           # BE 구현 리포트
├── prod_04_style.md             # 스타일 구현 리포트
├── prod_05_qa_report.md         # QA 리포트
├── prod_06_ux_report.md         # UX 분석 리포트
└── prod_07_final_report.md      # 최종 통합 리포트
```

---

## 파일 구조

```
.claude/
├── agents/
│   ├── product-planner.md        # 기획자
│   ├── frontend-dev.md           # 프론트엔드 개발자
│   ├── backend-dev.md            # 백엔드 개발자
│   ├── style-engineer.md         # 스타일 엔지니어
│   ├── qa-engineer.md            # QA 엔지니어
│   └── ux-optimizer.md           # UX 최적화 전문가
├── skills/
│   ├── product-team-orchestrator/
│   │   └── skill.md              # 통합 오케스트레이터
│   ├── product-planning/
│   │   └── skill.md              # 기획 스킬
│   ├── frontend-development/
│   │   └── skill.md              # 프론트엔드 개발 스킬
│   ├── backend-development/
│   │   └── skill.md              # 백엔드 개발 스킬
│   ├── style-engineering/
│   │   └── skill.md              # 스타일 엔지니어링 스킬
│   ├── qa-engineering/
│   │   └── skill.md              # QA 스킬
│   └── ux-optimization/
│       └── skill.md              # UX 최적화 스킬
```
