# Harness 통합 가이드

Retro Pixel Converter 프로젝트의 멀티 에이전트 하네스 전체 구성 및 사용법.

---

## 개요

이 프로젝트에는 4개의 전문 에이전트 팀이 구성되어 있습니다:

| 하네스 | 패턴 | 에이전트 수 | 용도 |
|--------|------|------------|------|
| [Planning Team](#planning-team-harness) | Fan-out/Fan-in (병렬→통합) | 4 | 기능 분석 + 기술 전략 + UX 설계 + 로드맵 |
| [Product Team](#product-team-harness) | Pipeline + Fan-out/Fan-in | 6 | 기능 기획 + 개발 + 검증 |
| [Code Review](#code-review-harness) | Fan-out/Fan-in (병렬) | 4 | 코드 품질 종합 감사 |
| [API Documentation](#api-documentation-harness) | Pipeline (순차) | 4 | API 문서 자동 생성 |

총 **18개 전문 에이전트**, **4개 오케스트레이터 스킬**, **17개 개별 스킬**로 구성됩니다.

---

## 프로젝트 컨텍스트

- **기술 스택:** SvelteKit 5 + Svelte 5 runes + Tauri v2 + TypeScript + Rust
- **UI 테마:** Windows 98 (98.css)
- **배포:** GitHub Actions → GitHub Pages (웹) + Tauri (데스크톱)
- **핵심 기능:** 이미지를 레트로 픽셀 아트로 변환 (팔레트 양자화, 디더링, 글리치, HQx 스케일링)
- **테스트:** 362개 테스트 (39개 파일) — Vitest + @testing-library/svelte

---

## Planning Team Harness

> 상세: [docs/planning-team-harness.md](planning-team-harness.md)

### 빠른 실행

```
기획 분석 해줘              # 전체 (기능+기술+UX → 로드맵)
로드맵 만들어줘             # 동일
기능 제안 해줘              # 동일
프로덕트 분석 해줘           # 동일
```

### 개별 실행

```
기능 분석만 해줘            # feature-analyst만
기술 분석 해줘              # tech-strategist만
UX 설계 해줘               # ux-designer만
```

### 에이전트 구성

| 에이전트 | 역할 | Phase |
|---------|------|-------|
| `feature-analyst` | 7개 기능 영역 갭 분석 + 신규 기능 제안 | 1 (병렬) |
| `tech-strategist` | 기술 부채, 성능 최적화, CI/CD, 아키텍처 | 1 (병렬) |
| `ux-designer` | 사용자 플로우, 접근성, 모바일, Win98 테마 | 1 (병렬) |
| `roadmap-architect` | RICE 점수 통합 + 단계별 로드맵 | 2 (통합) |

### 출력

```
_workspace/
├── plan_01_feature_analysis.md    # 기능 분석
├── plan_02_tech_strategy.md       # 기술 전략
├── plan_03_ux_design.md           # UX 설계
└── plan_04_roadmap.md             # 통합 로드맵 (RICE + Phase 0~3)
```

---

## Product Team Harness

> 상세: [docs/product-team-harness.md](product-team-harness.md)

### 빠른 실행

```
기능 개발 해줘: 이미지 회전에 자유 각도 입력 기능 추가
새 기능 구현: 팔레트 즐겨찾기 기능
프로덕트 팀 시작: 배치 내보내기 포맷 확장
```

### 개별 실행

```
기능 기획만 해줘          # product-planner만
프론트 개발 해줘          # frontend-dev만
백엔드 작업 해줘          # backend-dev만
스타일 작업 해줘          # style-engineer만
QA 검증 해줘             # qa-engineer만
UX 분석 해줘             # ux-optimizer만
```

### 에이전트 구성

| 에이전트 | 역할 | Phase |
|---------|------|-------|
| `product-planner` | 기획, 스펙 작성, 작업 분해 | 1 (순차) |
| `frontend-dev` | Svelte 5 컴포넌트/스토어/서비스 | 2 (병렬) |
| `backend-dev` | Tauri/Rust/Worker/CI | 2 (병렬) |
| `style-engineer` | 98.css 테마/CSS 변수/반응형 | 2 (병렬) |
| `qa-engineer` | 테스트 작성/버그/회귀 | 3 (병렬) |
| `ux-optimizer` | 사용성/접근성/반응형 | 3 (병렬) |

### 출력

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

## Code Review Harness

> 상세: [docs/code-review-harness.md](code-review-harness.md)

### 빠른 실행

```
종합 코드 리뷰 해줘          # 전체 프로젝트
src/lib/services/ 리뷰 해줘  # 특정 경로
변경된 파일만 감사 해줘       # git diff 기반
```

### 개별 실행

```
아키텍처 리뷰 해줘     # 모듈 결합도, 레이어 위반, 순환 참조
보안 감사 해줘         # OWASP, XSS, Tauri IPC, 민감 데이터
성능 병목 분석 해줘     # 메모리 누수, 렌더링, Worker, 번들
스타일 리뷰 해줘       # Svelte 5 관용구, TypeScript, i18n
```

### 에이전트 구성

| 에이전트 | 영역 | 심각도 체계 |
|---------|------|-----------|
| `arch-reviewer` | 구조, 의존성, Tauri 경계 | CRITICAL / WARNING / INFO |
| `security-reviewer` | OWASP, XSS, IPC, 데이터 | CRITICAL / HIGH / MEDIUM / LOW |
| `perf-reviewer` | 메모리, 렌더링, 파이프라인 | HIGH / MEDIUM / LOW |
| `style-reviewer` | 컨벤션, 타입, i18n | MUST FIX / SHOULD FIX / NITPICK |

### 출력

```
_workspace/
├── 00_scope.md               # 분석 범위
├── 01_arch_review.md          # 아키텍처
├── 02_security_review.md      # 보안
├── 03_perf_review.md          # 성능
├── 04_style_review.md         # 스타일
└── 05_integrated_report.md    # 통합 (P0/P1/P2 우선순위)
```

---

## API Documentation Harness

> 상세: [docs/api-doc-harness.md](api-doc-harness.md)

### 빠른 실행

```
API 문서 생성 해줘            # 전체
서비스 API 문서화 해줘         # 특정 레이어
Store API docs 만들어줘       # 특정 레이어
```

### 파이프라인 단계

```
1. endpoint-analyzer  → 모든 public API 수집
2. doc-writer         → 파라미터/반환값/제약조건 상세 문서
3. example-generator  → 동작하는 코드 예제
4. doc-reviewer       → 완성도/정확성 검증 + 최종 통합
```

### 출력

```
_workspace/
├── api_01_endpoints.md           # API 카탈로그
├── api_02_documentation.md       # 상세 문서
├── api_03_examples.md            # 사용 예제
├── api_04_review.md              # 리뷰 결과
└── api_05_final_documentation.md # 최종 문서

docs/
└── api-reference.md              # 배포용 (자동 복사)
```

---

## 전체 파일 구조

```
.claude/
├── agents/                           # 에이전트 정의 (18개)
│   │
│   │  # Planning Team (4)
│   ├── feature-analyst.md            # 기능 분석가
│   ├── tech-strategist.md            # 기술 전략가
│   ├── ux-designer.md                # UX 설계자
│   ├── roadmap-architect.md          # 로드맵 설계자
│   │
│   │  # Product Team (6)
│   ├── product-planner.md            # 기획자
│   ├── frontend-dev.md               # 프론트엔드 개발자
│   ├── backend-dev.md                # 백엔드 개발자
│   ├── style-engineer.md             # 스타일 엔지니어
│   ├── qa-engineer.md                # QA 엔지니어
│   ├── ux-optimizer.md               # UX 최적화 전문가
│   │
│   │  # Code Review Team (4)
│   ├── arch-reviewer.md              # 아키텍처 감사
│   ├── security-reviewer.md          # 보안 감사
│   ├── perf-reviewer.md              # 성능 감사
│   ├── style-reviewer.md             # 스타일 감사
│   │
│   │  # API Documentation Team (4)
│   ├── endpoint-analyzer.md          # 엔드포인트 분석
│   ├── doc-writer.md                 # 문서 작성
│   ├── example-generator.md          # 예제 생성
│   └── doc-reviewer.md               # 문서 리뷰
│
├── skills/                           # 스킬 정의 (22개)
│   │
│   │  # Planning Team Skills (5)
│   ├── planning-orchestrator/
│   │   └── skill.md                  # 기획팀 오케스트레이터
│   ├── feature-analysis/
│   │   └── skill.md                  # 기능 분석 스킬
│   ├── tech-strategy/
│   │   └── skill.md                  # 기술 전략 스킬
│   ├── ux-design/
│   │   └── skill.md                  # UX 설계 스킬
│   ├── roadmap-architecture/
│   │   └── skill.md                  # 로드맵 설계 스킬
│   │
│   │  # Product Team Skills (7)
│   ├── product-team-orchestrator/
│   │   └── skill.md                  # 프로덕트팀 오케스트레이터
│   ├── product-planning/
│   │   └── skill.md                  # 기획 스킬
│   ├── frontend-development/
│   │   └── skill.md                  # 프론트엔드 개발 스킬
│   ├── backend-development/
│   │   └── skill.md                  # 백엔드 개발 스킬
│   ├── style-engineering/
│   │   └── skill.md                  # 스타일 엔지니어링 스킬
│   ├── qa-engineering/
│   │   └── skill.md                  # QA 스킬
│   ├── ux-optimization/
│   │   └── skill.md                  # UX 최적화 스킬
│   │
│   │  # Code Review Skills (5)
│   ├── code-review-orchestrator/
│   │   └── skill.md                  # 종합 리뷰 오케스트레이터
│   ├── arch-review/
│   │   └── skill.md                  # 아키텍처 감사 절차
│   ├── security-review/
│   │   └── skill.md                  # 보안 감사 절차
│   ├── perf-review/
│   │   └── skill.md                  # 성능 감사 절차
│   ├── style-review/
│   │   └── skill.md                  # 스타일 감사 절차
│   │
│   │  # API Documentation Skills (5)
│   ├── api-doc-orchestrator/
│   │   └── skill.md                  # API 문서 오케스트레이터
│   ├── endpoint-analysis/
│   │   └── skill.md                  # 엔드포인트 분석 절차
│   ├── doc-writing/
│   │   └── skill.md                  # 문서 작성 절차
│   ├── example-generation/
│   │   └── skill.md                  # 예제 생성 절차
│   └── doc-review/
│       └── skill.md                  # 문서 리뷰 절차

docs/                                 # 가이드 문서
├── harness-guide.md                  # 이 파일 (통합 가이드)
├── planning-team-harness.md          # Planning Team 상세 가이드
├── product-team-harness.md           # Product Team 상세 가이드
├── code-review-harness.md            # Code Review 상세 가이드
└── api-doc-harness.md                # API Documentation 상세 가이드
```

---

## 하네스 조합 사용 예시

### 1. 전체 프로덕트 사이클 (기획 → 개발 → 감사 → 문서)

```
1단계: "기획 분석 해줘"                          → Planning Team이 로드맵 생성
2단계: plan_04_roadmap.md에서 Quick Win 선택
3단계: "기능 개발 해줘: [선택한 항목]"             → Product Team이 개발
4단계: "종합 코드 리뷰 해줘"                      → Code Review Team이 감사
5단계: "API 문서 생성 해줘"                       → API Doc Team이 문서화
```

### 2. 기획 → 개발 직결

```
1단계: "기획 분석 해줘"                          → 로드맵 확인
2단계: "기능 개발 해줘: 팔레트 이미지 추출 기능"   → Product Team이 개발
```

### 3. 개발 → 코드 리뷰

```
1단계: "기능 개발 해줘: APNG 내보내기 추가"       → Product Team이 개발
2단계: "종합 코드 리뷰 해줘"                      → Code Review Team이 감사
```

---

## 필수 사전 조건

1. **Claude Code** — Opus 모델 (1M context) 권장
2. **에이전트 팀 활성화** — `~/.claude/settings.json`에서 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: "1"` 설정
3. **프로젝트 CLAUDE.md** — 에이전트들이 프로젝트 컨벤션을 참조

현재 설정 확인:
```json
// ~/.claude/settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "model": "opus[1m]"
}
```

---

## 주의사항

- `_workspace/` 디렉토리는 실행마다 누적됩니다 (이전 결과 보존)
- 필요 시 수동으로 `rm -rf _workspace/`로 초기화
- `.gitignore`에 `_workspace/`가 이미 추가되어 리포지토리에 포함되지 않음
- `.claude/agents/`와 `.claude/skills/`는 git 추적 대상 — 팀과 공유 가능
- Product Team의 최종 리포트에서 미해결 이슈를 반드시 확인
- Code Review의 P0 이슈는 즉시 대응 필요
