# Claude Code v2.1.70~v2.1.71 + Skills 2.0 Impact Analysis & Enhancement Plan

> **Feature**: claude-code-v2171-impact-analysis
> **Type**: Plan-Plus (Brainstorming-Enhanced)
> **Version**: bkit v1.5.9 -> v1.6.0 (All-in-One)
> **Author**: CTO Team
> **Date**: 2026-03-07
> **Status**: Final
> **Previous**: claude-code-v2169-impact-analysis (v2.1.67~v2.1.69, ~96 changes, 13 ENH(72~84))
> **Scope**: CC v2.1.70~v2.1.71 패치 분석 + CC 2.1.0 Skills 2.0 전략적 영향 분석

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | CC v2.1.70~v2.1.71 (총 ~61 changes)의 bkit 영향도 파악 및 CC 2.1.0 Skills 2.0 (1,096 commits)의 전략적 활용 방안 부재. bkit 27 skills의 수명 관리 체계와 품질 측정 프레임워크가 없음. |
| **Solution** | 3축 분석 (패치 호환성 + Skills 2.0 전략 + Context Engineering 고도화)으로 19 ENH(85~103) 도출. v1.6.0 All-in-One 릴리스로 Skills 2.0 완전 통합. |
| **Function/UX Effect** | v2.1.71 stdin 정지 해결로 CTO Team 장시간 세션 안정성 직접 개선. Skills 2.0 Evals 도입으로 27 skills 품질 자동 검증. frontmatter hooks 마이그레이션으로 hooks.json 복잡도 감소. /loop + Cron으로 PDCA 자동 모니터링 가능. **PDCA 문서 템플릿 준수 검증 자동화로 Executive Summary 등 필수 섹션 누락 방지.** |
| **Core Value** | bkit의 3대 철학 (Automation First, No Guessing, Docs=Code)을 Skills 2.0과 정렬: **Evals = No Guessing 자동화**, **Skill Classification = Automation First 수명 관리**, **context:fork native = Docs=Code 격리 실행**, **Template Compliance = Docs=Code 문서 품질 강제**. 37 consecutive compatible releases 달성 (v2.1.34~v2.1.71). |

### Quick Numbers

| Metric | Value |
|--------|:-----:|
| CC 변경사항 총계 | ~61 (v2.1.70: ~20, v2.1.71: ~41) |
| Breaking Changes | **0** |
| Consecutive Compatible Releases | **37** (v2.1.34~v2.1.71) |
| ENH Opportunities | **19** (ENH-85~103) |
| bkit Skills 분류 | 9 Workflow / 16 Capability / 2 Hybrid |
| v1.6.0 Target ENH | **19 (All-in-One)** (P0: 6, P1: 7, P2: 4, AUTO: 2) |
| HIGH Impact Items | **2** (stdin freeze fix, bg agent recovery) |
| Skills 2.0 CRITICAL Items | **5** (context:fork, frontmatter hooks, Evals, Classification, Skill Creator) |
| Bug/Improvement Found | **1** (ENH-103: PDCA 문서 템플릿 준수 검증 부재) |

---

## Phase 0: Intent Discovery (Brainstorming)

### 0.1 분석 목적

이번 분석은 **2가지 축**으로 구성된다:

1. **패치 분석** (v2.1.70~v2.1.71): 기존 impact analysis 패턴을 따르는 호환성 검증
2. **전략 분석** (CC 2.1.0 Skills 2.0): bkit의 Context Engineering 철학과 Skills 2.0의 전략적 시너지 분석 및 v2.0.0 로드맵 수립

### 0.2 분석 팀 구성

| # | Agent | Role | Model | Task |
|---|-------|------|:-----:|------|
| 1 | cto-lead | 총괄 분석 + 전략 수립 | opus | Task #1 |
| 2 | v2170-analyst | CC v2.1.70 변경사항 상세 분석 | code-analyzer | Task #2 |
| 3 | v2171-analyst | CC v2.1.71 변경사항 바이너리 분석 | code-analyzer | Task #3 |
| 4 | skills20-analyst | Skills 2.0 bkit 영향 분석 | enterprise-expert | Task #4 |
| 5 | enhancement-arch | ENH 고도화 제안 | enterprise-expert | Task #5 |

### 0.3 분석 범위 (Scope)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Analysis Scope                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Axis 1: Patch Analysis (v2.1.70~v2.1.71)                                   │
│  ├── v2.1.70: ~20 changes (Bug Fixes, Performance, VSCode)                  │
│  └── v2.1.71: npm published, CHANGELOG TBD                                  │
│                                                                              │
│  Axis 2: Strategic Analysis (CC 2.1.0 Skills 2.0)                           │
│  ├── context:fork (native) vs bkit FR-03 (custom)                           │
│  ├── Skill hot reload → 27 skills 개발 생산성                                │
│  ├── Frontmatter hooks → 6-Layer Hook System 재설계                          │
│  ├── Skill Creator + Evals → 27 skills 품질 관리 체계                        │
│  └── Capability Uplift vs Workflow Skills → bkit 스킬 분류 전략              │
│                                                                              │
│  Axis 3: bkit Context Engineering 고도화 방향                                │
│  ├── v1.6.0 All-in-One (Skills 2.0 완전 통합)                               │
│  └── ENH-103: PDCA 문서 템플릿 준수 검증 (신규 발견 버그)                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Version Changes Summary

### 1.1 CC v2.1.70 (2026-03-06, ~20 changes)

**릴리스 유형**: Stabilization + VSCode Enhancement

#### Bug Fixes

| # | Change | Category | bkit Impact |
|---|--------|----------|:-----------:|
| 1 | API 400 errors fix (ANTHROPIC_BASE_URL proxy) - tool_reference block 비활성화 | Networking | LOW |
| 2 | effort parameter error fix (Bedrock custom inference profiles) | Model Compat | LOW |
| 3 | Empty model responses after ToolSearch fix | Tool System | **MEDIUM** |
| 4 | Clipboard CJK/emoji fix (Windows/WSL PowerShell Set-Clipboard) | Platform | NONE |
| 5 | remote-control crash fix (npm install) | CLI | NONE |
| 6 | Opus 4/4.1 모델 ID deprecated 해결 | Model | NONE |
| 7 | 반복 모델 업데이트 알림 수정 | UX | LOW |
| 8 | Plugin 표시 이슈 수정 | Plugin | LOW |
| 9 | /security-review 구 git 버전 호환 | CLI | NONE |
| 10 | /color 리셋 옵션 수정 | CLI | NONE |
| 11 | AskUserQuestion preview dialog 성능 수정 | UX | **MEDIUM** |
| 12 | Feature flag caching 수정 | Internal | LOW |
| 13 | Permissions settings in Remote 환경 수정 | Security | LOW |

#### Performance Improvements

| # | Change | Savings | bkit Impact |
|---|--------|:-------:|:-----------:|
| 14 | /rename 처리 중 사용 가능 | UX | LOW |
| 15 | Prompt input re-renders ~74% 감소 | CPU/Memory | **MEDIUM** |
| 16 | Startup memory ~426KB 감소 | Memory | LOW |
| 17 | Remote Control /poll rate 감소 (1-2s → 10min) | Network | NONE |

#### VSCode Improvements

| # | Change | bkit Impact |
|---|--------|:-----------:|
| 18 | Activity bar spark icon (session listing) | NONE |
| 19 | Markdown plan views with commenting | LOW |
| 20 | Native MCP server management | LOW |

**v2.1.70 bkit 영향 요약**:
- Breaking Changes: **0**
- HIGH Impact: **0**
- MEDIUM Impact: **3** (ToolSearch empty response fix, AskUserQuestion preview 성능, re-render 감소)
- 호환성: **100%**

### 1.2 CC v2.1.71 (2026-03-07, ~41 changes) — 정규 릴리스

**릴리스 유형**: **정규 릴리스** (Features 4, Bug Fixes ~29, Performance 5, VSCode 3)
**커밋**: 53a5f3e

> **NOTE**: 초기 분석 시 GitHub CHANGELOG 미게시로 Skip Release로 추정했으나,
> 백그라운드 에이전트 분석 결과 CHANGELOG + GitHub Release 모두 정상 게시된 정규 릴리스로 확인됨.

#### New Features (4)

| # | Change | Description | bkit Impact |
|---|--------|-------------|:-----------:|
| 1 | **`/loop` 명령어** | 프롬프트/슬래시 명령어를 반복 간격으로 실행 (예: `/loop 5m check deploy`) | **MEDIUM** |
| 2 | **Cron 스케줄링 도구** | 세션 내 반복 프롬프트를 위한 cron 도구 추가 | **MEDIUM** |
| 3 | **`voice:pushToTalk` 키바인딩** | 음성 활성화 키 커스터마이징 | NONE |
| 4 | **Bash 자동승인 허용리스트 확장** | `fmt`, `comm`, `cmp`, `numfmt`, `expr`, `test`, `printf`, `getconf`, `seq`, `tsort`, `pr` 추가 | LOW |

#### Key Bug Fixes (~29)

| # | Change | bkit Impact |
|---|--------|:-----------:|
| 1 | **stdin 정지 해결** (장시간 세션 키스트로크 중단) | **HIGH** |
| 2 | **백그라운드 에이전트 완료** (출력 파일 경로 누락으로 부모 에이전트 복구 불가) | **HIGH** |
| 3 | **OAuth 토큰 갱신** (다중 인스턴스 동시 갱신 시 UI 정지) | MEDIUM |
| 4 | **이미지 처리 실패** (컨텍스트 손상으로 세션 중단) | MEDIUM |
| 5 | **Bash heredoc 커밋** (거짓 긍정 권한 프롬프트) | MEDIUM |
| 6 | **다중 인스턴스 플러그인 손실** | MEDIUM |
| 7 | **/fork 동일 플랜 파일 편집 덮어쓰기** | LOW |
| 8 | **Bash 0이 아닌 종료 중복 출력** | LOW |
| 9-29 | v2.1.70과 동일 수정 포함 (API 400, clipboard, VSCode 등) | LOW~NONE |

#### Performance (5)

| # | Change | bkit Impact |
|---|--------|:-----------:|
| 1 | Prompt input re-renders ~74% 감소 | MEDIUM |
| 2 | Startup memory ~426KB 감소 | LOW |
| 3 | Remote Control /poll rate 300배 감소 | NONE |
| 4 | 이미지 압축 보존 (프롬프트 캐시 재사용) | MEDIUM |
| 5 | /rename 처리 중 즉시 동작 | NONE |

**v2.1.71 bkit 영향 요약**:
- Breaking Changes: **0**
- HIGH Impact: **2** (stdin 정지 해결, 백그라운드 에이전트 복구)
- MEDIUM Impact: **7** (/loop, cron, OAuth, 이미지, heredoc, 플러그인, 캐시)
- 호환성: **100%**
- **핵심**: stdin 정지 해결은 CTO Team 장시간 세션 안정성 직접 개선

### 1.3 CC 2.1.0 (2026-01-07, 1,096 commits) — Skills 2.0

**릴리스 유형**: **Major Release** (v2.0.x → v2.1.0)

| # | Feature | Description | bkit Impact |
|---|---------|-------------|:-----------:|
| 1 | **context:fork** | 스킬 frontmatter에서 격리 컨텍스트 실행 | **CRITICAL** |
| 2 | **Skill hot reload** | ~/.claude/skills 수정 시 세션 재시작 없이 즉시 반영 | **HIGH** |
| 3 | **Frontmatter hooks** | Agent/Skill YAML에 PreToolUse/PostToolUse/Stop 선언 | **CRITICAL** |
| 4 | **Custom agent in skills** | 스킬에서 커스텀 에이전트 지정 | **HIGH** |
| 5 | **/ invoke** | 슬래시로 스킬 직접 호출 | **HIGH** |
| 6 | **Wildcard permissions** | `Bash(*-h*)` 패턴 매칭 | MEDIUM |
| 7 | **Shift+Enter newlines** | 제로 설정 멀티라인 입력 | NONE |
| 8 | **Agent deny 시 계속** | 도구 거부해도 에이전트 미중단 | MEDIUM |
| 9 | **/teleport** | 세션을 claude.ai/code로 전송 | LOW |
| 10 | **언어 설정** | 모델 응답 언어 설정 가능 | LOW |

#### Skill Creator + Evals (Skills 2.0 확장)

| # | Feature | Description | bkit Impact |
|---|---------|-------------|:-----------:|
| 11 | **Skill Creator** | 스킬 설계/테스트/최적화 도구 | **HIGH** |
| 12 | **Evals (평가)** | 테스트 프롬프트로 스킬 품질 자동 검증 | **CRITICAL** |
| 13 | **A/B Testing** | 스킬 활성화 전/후 성능 비교 | **HIGH** |
| 14 | **Benchmark mode** | eval 통과율/시간/토큰 사용량 추적 | **HIGH** |
| 15 | **Skill Classification** | Capability Uplift vs Workflow/Preference 분류 | **CRITICAL** |

---

## Phase 2: Strategic Impact Analysis — Skills 2.0 × bkit Context Engineering

### 2.1 bkit 철학과 Skills 2.0 Alignment

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 bkit Philosophy × Skills 2.0 Alignment                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  bkit Core Mission:                                                          │
│  "Enable developers to naturally adopt document-driven development           │
│   and continuous improvement without knowing commands"                        │
│                                                                              │
│  Three Philosophies:                                                          │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐                │
│  │ Automation First │  │ No Guessing  │  │ Docs = Code      │                │
│  │                  │  │              │  │                  │                │
│  │ Skills 2.0:      │  │ Skills 2.0:  │  │ Skills 2.0:      │                │
│  │ hot reload +     │  │ Evals +      │  │ Skill Creator +  │                │
│  │ / invoke =       │  │ Benchmark =  │  │ A/B Testing =    │                │
│  │ 즉시 반영 자동화 │  │ 추측 배제    │  │ 품질 검증 자동화 │                │
│  └─────────────────┘  └──────────────┘  └──────────────────┘                │
│                                                                              │
│  Context Engineering:                                                        │
│  "The art of designing systems that integrate prompts, tools, and state      │
│   to provide LLMs with optimal context for inference"                        │
│                                                                              │
│  Skills 2.0 Synergy:                                                         │
│  ├── context:fork = FR-03 native 대체 (228줄 자체 구현 → CC 내장)            │
│  ├── frontmatter hooks = Layer 2/3 강화 (hooks.json 의존도 감소)             │
│  ├── Evals = Context Engineering 품질 측정 자동화                            │
│  └── Skill Classification = 스킬 수명 주기 관리 체계화                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 context:fork vs FR-03 분석

| 항목 | bkit FR-03 (lib/context-fork.js) | CC 2.1.0 native context:fork |
|------|:--------------------------------:|:----------------------------:|
| 구현 | 자체 228줄 Node.js | CC 엔진 내장 |
| 선언 | JavaScript API 호출 | YAML frontmatter |
| 격리 | 딥 클론 + 머지 옵션 | CC 내부 격리 |
| 사용 에이전트 | gap-detector, design-validator | 모든 skill/agent |
| 장점 | 완전 제어, 머지 전략 커스텀 | 제로 코드, CC 최적화 |
| 단점 | 유지보수 부담, CC 업데이트 추종 | 커스텀 머지 전략 제한 |

**전략적 판단** (v1.6.0 All-in-One):
- native context:fork로 완전 마이그레이션, FR-03은 deprecated 처리
- mergeForkedContext() 커스텀 로직 (array dedupe, object merge)은 PostToolUse hook으로 대체
- gap-detector, design-validator 두 에이전트 frontmatter에 `context: fork` 추가
- lib/context-fork.js는 deprecated 마킹 후 유지 (하위 호환)

### 2.3 Frontmatter Hooks vs 6-Layer Hook System

```
현재 bkit 6-Layer Hook System:
─────────────────────────────────────────────────────────────
Layer 1: hooks.json (Global)     ← 유지 (SessionStart, PreCompact 등)
Layer 2: Skill Frontmatter       ← Skills 2.0 native 교체 가능
Layer 3: Agent Frontmatter       ← Skills 2.0 native 교체 가능
Layer 4: Description Triggers    ← 유지 (8-language keyword)
Layer 5: Scripts (47 modules)    ← 유지 (비즈니스 로직)
Layer 6: Team Orchestration      ← 유지 (CTO-led patterns)
─────────────────────────────────────────────────────────────

Skills 2.0 이후 제안 구조:
─────────────────────────────────────────────────────────────
Layer 1: hooks.json (Global)         ← SessionStart 등 글로벌 이벤트
Layer 2: Skill frontmatter hooks     ← CC 2.1.0 native (PreToolUse, PostToolUse, Stop)
Layer 3: Agent frontmatter hooks     ← CC 2.1.0 native (PreToolUse, PostToolUse)
Layer 4: Description Triggers        ← bkit 고유 (8-lang, 변경 없음)
Layer 5: Scripts (47 modules)        ← 비즈니스 로직 (변경 없음)
Layer 6: Team Orchestration          ← CTO-led patterns (변경 없음)
─────────────────────────────────────────────────────────────

변경 범위: Layer 2, 3만 migration (hooks.json → YAML frontmatter)
영향도: hooks.json 항목 중 skill/agent scoped 항목만 이동
리스크: LOW (기존 hooks.json도 계속 동작, 점진적 이행 가능)
```

### 2.4 bkit 27 Skills 분류 — Capability Uplift vs Workflow

Skills 2.0은 스킬을 두 유형으로 분류한다:
- **Capability Uplift**: 모델이 못하는 것을 보완 (모델 발전 시 불필요해질 수 있음)
- **Workflow/Preference**: 반복 작업 자동화 (모델 발전과 무관하게 지속 유용)

| # | Skill | Type | 근거 | 모델 발전 시 |
|---|-------|:----:|------|:------------:|
| 1 | bkit-rules | **Workflow** | PDCA 자동 적용 규칙 | 유지 |
| 2 | bkit-templates | **Workflow** | 문서 구조 표준화 | 유지 |
| 3 | pdca | **Workflow** | PDCA 사이클 관리 | 유지 |
| 4 | plan-plus | **Hybrid** | 브레인스토밍 + PDCA 통합 | 부분 유지 |
| 5 | starter | **Capability** | 초보자 가이드 | 축소 가능 |
| 6 | dynamic | **Capability** | 풀스택 개발 가이드 | 축소 가능 |
| 7 | enterprise | **Capability** | MSA/K8s 패턴 | 축소 가능 |
| 8 | development-pipeline | **Workflow** | 9-phase 순서 관리 | 유지 |
| 9 | phase-1-schema | **Capability** | 스키마 설계 패턴 | 축소 가능 |
| 10 | phase-2-convention | **Workflow** | 코딩 규칙 강제 | 유지 |
| 11 | phase-3-mockup | **Capability** | UI/UX 목업 생성 | 축소 가능 |
| 12 | phase-4-api | **Capability** | API 설계 패턴 | 축소 가능 |
| 13 | phase-5-design-system | **Capability** | 디자인 시스템 구축 | 축소 가능 |
| 14 | phase-6-ui-integration | **Capability** | UI-API 통합 | 축소 가능 |
| 15 | phase-7-seo-security | **Capability** | SEO/보안 체크 | 축소 가능 |
| 16 | phase-8-review | **Workflow** | 코드 리뷰 프로세스 | 유지 |
| 17 | phase-9-deployment | **Capability** | 배포 가이드 | 축소 가능 |
| 18 | zero-script-qa | **Workflow** | 로그 기반 QA 방법론 | 유지 |
| 19 | mobile-app | **Capability** | 모바일 앱 개발 | 축소 가능 |
| 20 | desktop-app | **Capability** | 데스크톱 앱 개발 | 축소 가능 |
| 21 | code-review | **Workflow** | 코드 리뷰 표준 | 유지 |
| 22 | claude-code-learning | **Capability** | CC 학습 가이드 | 축소 가능 |
| 23 | bkend-quickstart | **Capability** | bkend 온보딩 | 축소 가능 |
| 24 | bkend-auth | **Capability** | 인증 구현 패턴 | 축소 가능 |
| 25 | bkend-data | **Capability** | 데이터 CRUD 패턴 | 축소 가능 |
| 26 | bkend-cookbook | **Capability** | 실전 예제 | 축소 가능 |
| 27 | bkend-storage | **Capability** | 파일 스토리지 패턴 | 축소 가능 |

**분류 요약**:

| Type | Count | 비율 | 특성 |
|------|:-----:|:----:|------|
| **Workflow/Preference** | 9 | 33% | 모델 발전과 무관, 영구 유지 |
| **Capability Uplift** | 16 | 59% | 모델 발전 시 축소/통합 가능 |
| **Hybrid** | 2 | 8% | 부분 유지 |

**전략적 시사점**:
- 9개 Workflow 스킬이 bkit의 **핵심 가치** — PDCA 방법론, 파이프라인 관리, 코딩 규칙, QA 프로세스
- 16개 Capability 스킬은 **Evals 기반 수명 관리** 도입 필요
- 모델이 발전해도 Workflow 스킬은 "개발 프로세스 자동화"라는 고유 가치 유지

### 2.5 Skill Evals 도입 전략

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Skill Evals Framework for bkit                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  v1.6.0 All-in-One: Full Evals + A/B Testing + Skill Creator                │
│                                                                              │
│  Core Evals (9 Workflow Skills):                                             │
│  ├── bkit-rules: PDCA 자동 적용 정확도 eval                                 │
│  ├── pdca: 각 action (plan/design/do/analyze) 정확도 eval                    │
│  ├── phase-2-convention: 코딩 규칙 적용 일관성 eval                          │
│  └── 나머지 6개 Workflow 스킬 eval                                           │
│                                                                              │
│  Capability Monitoring (16 Capability + 2 Hybrid Skills):                    │
│  ├── starter/dynamic/enterprise: 레벨별 가이드 유효성 benchmark              │
│  ├── phase-1~9: 각 phase 출력 품질 benchmark                                │
│  └── bkend-*: MCP 도구 호출 정확도 benchmark                                │
│                                                                              │
│  A/B Testing + Skill Creator:                                                │
│  ├── 모델 업데이트 후 자동 benchmark 실행                                    │
│  ├── Capability Uplift 스킬 deprecation 판단 자동화                          │
│  └── "이 스킬 없이도 모델이 잘 수행하는가?" 자동 검증                        │
│                                                                              │
│  Eval Types per Skill Category:                                              │
│  ├── Workflow Skills: Trigger accuracy + Process compliance                  │
│  ├── Capability Skills: Output quality + Model parity test                   │
│  └── Hybrid Skills: Both eval types                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 3: Enhancement Opportunities (ENH-85~103)

### 3.0 근본 원인 분석 — Executive Summary 누락 버그

이번 계획서 작성 과정에서 **Executive Summary 섹션이 누락**되는 문제가 발생했다.

**2가지 누락 지점**:
1. **문서 내 누락**: 계획서에 Executive Summary 섹션 자체가 빠짐
2. **응답 출력 누락**: bkit Feature Usage처럼 매 응답에 Executive Summary를 출력해야 하는데 안 함

**근본 원인**:
1. `plan.template.md`, `plan-plus.template.md` 모두 Executive Summary를 정의하지만, **PDCA 문서 생성 시 템플릿 필수 섹션 준수를 검증하는 메커니즘이 없음**
2. 이전 v2.1.69 계획서에도 Executive Summary가 없었으며, **잘못된 선례를 답습**
3. bkit Feature Usage Report는 SessionStart hook에서 매 응답 강제하지만, **Executive Summary 응답 출력은 어디서도 강제하지 않음**
4. Executive Summary는 사용자가 **한눈에 요약 파악 → Next Action 결정**하기 위한 핵심 정보

**분류**: bkit 내부 버그 (Docs=Code 철학 위반)

**해결**: ENH-103으로 2중 강제 메커니즘 도입

```
[A] 문서 내 검증:
현재: 문서 생성 → 템플릿 참조 (선택) → 검증 없음
개선: 문서 생성 → 템플릿 참조 (필수) → PostToolUse(Write) hook에서 필수 섹션 검증
     → 누락 시 additionalContext로 "Executive Summary 섹션이 누락되었습니다" 경고

[B] 응답 출력 강제:
현재: bkit Feature Usage만 매 응답 출력
개선: /pdca plan, /pdca plan-plus, /pdca report 실행 시
     → bkit Feature Usage 블록 바로 위에 Executive Summary 블록 필수 출력
     → SessionStart hook additionalContext에 규칙 추가:
       "PDCA plan/plan-plus/report 작업 시 Executive Summary를 반드시 응답에 출력하세요"

출력 형식:
─────────────────────────────────────────────────
📋 Executive Summary
─────────────────────────────────────────────────
Problem:  {핵심 문제 1줄}
Solution: {선택한 접근법 1줄}
Impact:   {기대 효과 1줄}
Value:    {핵심 가치 1줄}
─────────────────────────────────────────────────
```

### 3.1 Brainstorming: 대안 비교

| Approach | Pros | Cons | Verdict |
|----------|------|------|:-------:|
| **A: 패치만** (v2.1.70~71 문서 업데이트) | 즉시 완료, 위험 0 | Skills 2.0 기회 미활용, 버그 미수정 | REJECT |
| **B: v1.6.0 All-in-One** (Skills 2.0 완전 통합 + 버그 수정) | 한 번에 완료, 기회 최대 활용 | 변경 범위 큼 (~50 files) | **ACCEPT** |
| **C: 점진적** (v1.6.0 기초 + v2.0.0 완전 통합) | 안정적 | 2 릴리스 필요, 지연 | REJECT |

### 3.2 YAGNI Review

| ENH | YAGNI Check | Verdict |
|-----|-------------|:-------:|
| ENH-85 | context:fork native로 FR-03 228줄 deprecated 가능 | **ACCEPT (v1.6.0)** |
| ENH-86 | frontmatter hooks로 hooks.json 복잡도 감소 | **ACCEPT (v1.6.0)** |
| ENH-87 | hot reload는 개발 생산성 즉시 향상 | **ACCEPT (v1.6.0)** |
| ENH-88 | Skill Evals 전체 27 스킬 도입 | **ACCEPT (v1.6.0)** |
| ENH-89 | A/B Testing은 모델 업데이트 대응 필수 | **ACCEPT (v1.6.0)** |
| ENH-90 | Skill Classification 체계 정립 | **ACCEPT (v1.6.0)** |
| ENH-91 | ToolSearch empty response 대응 | **ACCEPT (v1.6.0)** |
| ENH-92 | AskUserQuestion preview 통합 | **ACCEPT (v1.6.0)** |
| ENH-93 | Prompt re-render 74% 감소 | **AUTO** (자동 수혜) |
| ENH-94 | Startup memory 426KB 감소 | **AUTO** (자동 수혜) |
| ENH-95 | Wildcard permissions 가이드 | **ACCEPT (v1.6.0)** |
| ENH-96 | / invoke 체계 문서 보강 | **ACCEPT (v1.6.0)** |
| ENH-97 | Skill Creator 통합 워크플로우 | **ACCEPT (v1.6.0)** |
| ENH-98 | CC 2.1.0 호환성 매트릭스 문서 | **ACCEPT (v1.6.0)** |
| ENH-99 | Capability 스킬 deprecation 로드맵 | **ACCEPT (v1.6.0)** |
| ENH-100 | /loop + Cron PDCA 자동 모니터링 | **ACCEPT (v1.6.0)** |
| ENH-101 | stdin 정지 해결 문서 | **ACCEPT (v1.6.0)** |
| ENH-102 | 백그라운드 에이전트 복구 활용 | **ACCEPT (v1.6.0)** |
| ENH-103 | **PDCA 문서 템플릿 준수 검증** (신규 버그 수정) | **ACCEPT (v1.6.0, P0)** |

### 3.3 ENH Priority Matrix — v1.6.0 All-in-One

| Priority | ENH | Title | Difficulty | Impact |
|:--------:|-----|-------|:----------:|:------:|
| **P0** | ENH-85 | context:fork native 마이그레이션 (FR-03 deprecated) | Hard | **CRITICAL** |
| **P0** | ENH-86 | Frontmatter hooks 마이그레이션 (agent/skill scoped) | Medium | HIGH |
| **P0** | ENH-88 | Skill Evals 전체 27 스킬 도입 | Hard | **CRITICAL** |
| **P0** | ENH-90 | Skill Classification 체계 정립 (Workflow 9 / Capability 16 / Hybrid 2) | Easy | HIGH |
| **P0** | ENH-97 | Skill Creator 통합 워크플로우 | Hard | **CRITICAL** |
| **P0** | ENH-103 | PDCA 문서 템플릿 준수 검증 + Executive Summary 응답 출력 강제 | Medium | **CRITICAL** |
| **P1** | ENH-87 | Hot reload 개발 가이드 문서화 | Easy | MEDIUM |
| **P1** | ENH-89 | A/B Testing 모델 업데이트 대응 자동화 | Medium | HIGH |
| **P1** | ENH-91 | ToolSearch empty response 방어 코드 | Easy | MEDIUM |
| **P1** | ENH-92 | AskUserQuestion preview 통합 (ENH-78 연계) | Medium | HIGH |
| **P1** | ENH-95 | Wildcard permissions 가이드 (bkit-rules 연계) | Easy | MEDIUM |
| **P1** | ENH-99 | Capability Uplift 스킬 deprecation 로드맵 | Medium | HIGH |
| **P1** | ENH-100 | /loop + Cron PDCA 자동 모니터링 워크플로우 | Medium | HIGH |
| **P1** | ENH-102 | 백그라운드 에이전트 복구 안정성 활용 (CTO Team) | Easy | MEDIUM |
| **P2** | ENH-96 | / invoke 체계 문서 보강 | Easy | LOW |
| **P2** | ENH-98 | CC 2.1.0 호환성 매트릭스 문서 | Easy | MEDIUM |
| **P2** | ENH-101 | stdin 정지 해결 + CTO Team 장시간 안정성 문서 | Easy | LOW |
| - | ENH-93 | Prompt re-render 감소 (자동 수혜) | - | AUTO |
| - | ENH-94 | Startup memory 감소 (자동 수혜) | - | AUTO |

---

## Phase 4: Implementation Roadmap

### 4.1 v1.6.0 All-in-One Release Plan (Skills 2.0 완전 통합)

**목표**: Skills 2.0 완전 활용 + 전체 27 스킬 Evals + Skill Creator + 버그 수정
**예상 변경 파일**: ~50 files
**ENH 대상**: ENH-85~103 전체 19개 (P0: 6, P1: 7, P2: 4, AUTO: 2)

#### P0 — 핵심 구조 변경 (6 ENH)

| # | ENH | Target Files | Description |
|---|-----|-------------|-------------|
| 1 | ENH-85 | `lib/context-fork.js` → deprecated, agent frontmatter `context: fork` | native context:fork 완전 마이그레이션 (FR-03 deprecated) |
| 2 | ENH-86 | `agents/*.md` (16), `skills/*/SKILL.md` (선택) | agent/skill scoped hooks를 frontmatter로 이행 |
| 3 | ENH-88 | 신규 `evals/` 디렉토리, 전체 27 skills eval 셋 | Skill Evals 전체 도입 (Workflow 9 + Capability 16 + Hybrid 2) |
| 4 | ENH-90 | `bkit-system/philosophy/context-engineering.md`, `skills/*/SKILL.md` frontmatter | Skill Classification 메타데이터 추가 |
| 5 | ENH-97 | 신규 `skill-creator/` 디렉토리, Skill Creator 워크플로우 통합 | Skill Creator + 평가 파이프라인 |
| 6 | ENH-103 | `scripts/post-tool-use.js`, `scripts/session-start.js`, `lib/pdca/template-validator.js` (신규) | **PDCA 문서 템플릿 준수 검증 + Executive Summary 응답 출력 강제** (PostToolUse hook + SessionStart additionalContext) |

#### P1 — 기능 강화 (7 ENH)

| # | ENH | Target Files | Description |
|---|-----|-------------|-------------|
| 7 | ENH-87 | `skills/bkit-rules/SKILL.md`, `skills/claude-code-learning/SKILL.md` | Hot reload 개발 가이드 문서화 |
| 8 | ENH-89 | `evals/` 확장, CI/CD 통합 | A/B Testing 모델 업데이트 대응 자동화 |
| 9 | ENH-91 | `lib/core/cache.js` 또는 관련 모듈 | ToolSearch 빈 응답 방어 코드 |
| 10 | ENH-92 | `lib/pdca/automation.js`, `scripts/gap-detector-stop.js` | AskUserQuestion preview 통합 |
| 11 | ENH-95 | `skills/bkit-rules/SKILL.md` | Wildcard permissions 가이드 |
| 12 | ENH-99 | 16 Capability skills deprecation 평가, `bkit-system/philosophy/` | Capability Uplift 스킬 deprecation 로드맵 |
| 13 | ENH-100 | `skills/pdca/SKILL.md`, `agents/cto-lead.md` | /loop + Cron PDCA 자동 모니터링 (예: `/loop 5m /pdca status`) |

#### P2 — 문서 및 부가 기능 (4 ENH)

| # | ENH | Target Files | Description |
|---|-----|-------------|-------------|
| 14 | ENH-96 | `skills/pdca/SKILL.md` | / invoke 체계 문서 보강 |
| 15 | ENH-98 | `bkit-system/philosophy/context-engineering.md` | CC 2.1.0 호환성 매트릭스 문서 |
| 16 | ENH-101 | `scripts/session-start.js` additionalContext | CC 권장 버전 v2.1.71, stdin 안정화 문서 |
| 17 | ENH-102 | `agents/cto-lead.md`, `lib/team/coordinator.js` | 백그라운드 에이전트 복구 신뢰성 활용 |

#### AUTO — 자동 수혜 (2 ENH)

| ENH | Description |
|-----|-------------|
| ENH-93 | Prompt re-render ~74% 감소 (CC v2.1.71 자동 적용) |
| ENH-94 | Startup memory ~426KB 감소 (CC v2.1.71 자동 적용) |

### 4.2 Context Engineering Architecture Evolution

```
v1.5.9 (Current):
─────────────────────────────────────────────────────────────
27 Skills │ 16 Agents │ 10 Hooks │ 199 exports │ 6-Layer
Custom context-fork │ hooks.json 중심 │ No evals

v1.6.0 (All-in-One Target):
─────────────────────────────────────────────────────────────
27 Skills │ 16 Agents │ 11+ Hooks │ 210+ exports │ 6-Layer
Native context:fork │ frontmatter hooks 주력 │ 27 evals + A/B
FR-03 deprecated │ Skill Classification │ Skill Creator
PostToolUse 문서 검증 │ /loop + Cron PDCA │ Hot reload guide
```

### 4.3 Risk Mitigation

| Risk | Impact | Mitigation | Owner |
|------|:------:|-----------|:-----:|
| context:fork native가 커스텀 머지 전략 미지원 | HIGH | PostToolUse hook으로 커스텀 머지 로직 대체, 미지원 시 FR-03 fallback 유지 | CTO |
| frontmatter hooks와 hooks.json 충돌 | MEDIUM | 단계적 이행, hooks.json 우선 유지, 충돌 시 hooks.json 우선순위 | CTO |
| Skill Evals 27개 전체 작성 비용 | MEDIUM | Workflow 9개 우선 작성, Capability 16개는 자동 생성 템플릿 활용 | QA |
| 16개 Capability 스킬 조기 deprecation | LOW | Evals 기반 데이터 확보 후 판단, 충분한 데이터 없이 deprecation 금지 | CTO |
| ~50 files 변경 범위 관리 | MEDIUM | P0 → P1 → P2 순서 구현, 각 Priority 단위 Gap Analysis 수행 | CTO |
| v2.1.71 예기치 않은 breaking change | LOW | 이미 확인 완료 (37 consecutive compatible), 모니터링 유지 | CTO |

---

## Phase 5: Monitoring & Metrics

### 5.1 CC Version Compatibility History

```
v2.1.34~v2.1.71: 37 consecutive compatible releases (확정)
Breaking Changes: 0 (across all 37 releases)
bkit Code Changes Required: 0
CC 2.1.0 (major): 100% backward compatible (Skills 2.0 is additive)
```

### 5.2 Hook Coverage

| Version | bkit Hooks | CC Hook Events | Coverage |
|---------|:---------:|:--------------:|:--------:|
| v2.1.69 | 10 | 18 | 55.6% |
| v2.1.71 | 10 | 18 | 55.6% |
| v1.6.0 (target) | 12+ (+InstructionsLoaded, PostToolUse 문서 검증) | 18 | 66%+ |

### 5.3 Skills 2.0 Adoption Tracking

| Metric | v1.5.9 | v1.6.0 Target |
|--------|:------:|:-------------:|
| Frontmatter hooks usage | 0/16 agents | 16/16 agents |
| Skill Evals | 0/27 | 27/27 |
| context:fork native | 0/2 | 2/2 |
| Skill Classification metadata | 0/27 | 27/27 |
| A/B Testing | N/A | Active |
| Skill Creator | N/A | Active |
| PDCA 문서 템플릿 검증 | N/A | Active (PostToolUse) |

### 5.4 ENH Registry (ENH-85~103)

| ENH | Title | Release | Priority | Status |
|-----|-------|:-------:|:--------:|:------:|
| ENH-85 | context:fork native 마이그레이션 (FR-03 deprecated) | v1.6.0 | P0 | PLANNED |
| ENH-86 | Frontmatter hooks 마이그레이션 | v1.6.0 | P0 | PLANNED |
| ENH-87 | Hot reload 개발 가이드 | v1.6.0 | P1 | PLANNED |
| ENH-88 | Skill Evals 전체 27 스킬 도입 | v1.6.0 | P0 | PLANNED |
| ENH-89 | A/B Testing 자동화 | v1.6.0 | P1 | PLANNED |
| ENH-90 | Skill Classification 체계 | v1.6.0 | P0 | PLANNED |
| ENH-91 | ToolSearch 빈 응답 방어 | v1.6.0 | P1 | PLANNED |
| ENH-92 | AskUserQuestion preview 통합 | v1.6.0 | P1 | PLANNED |
| ENH-93 | Prompt re-render 감소 (자동) | AUTO | - | AUTO |
| ENH-94 | Startup memory 감소 (자동) | AUTO | - | AUTO |
| ENH-95 | Wildcard permissions 가이드 | v1.6.0 | P2 | PLANNED |
| ENH-96 | / invoke 문서 보강 | v1.6.0 | P2 | PLANNED |
| ENH-97 | Skill Creator 통합 | v1.6.0 | P0 | PLANNED |
| ENH-98 | CC 2.1.0 호환성 매트릭스 | v1.6.0 | P2 | PLANNED |
| ENH-99 | Capability 스킬 deprecation 로드맵 | v1.6.0 | P1 | PLANNED |
| ENH-100 | /loop + Cron PDCA 자동 모니터링 | v1.6.0 | P1 | PLANNED |
| ENH-101 | stdin 정지 해결 CTO Team 안정성 문서 | v1.6.0 | P2 | PLANNED |
| ENH-102 | 백그라운드 에이전트 복구 안정성 활용 | v1.6.0 | P1 | PLANNED |
| ENH-103 | **PDCA 문서 템플릿 준수 검증 + Executive Summary 응답 출력 강제** (신규 버그 수정) | v1.6.0 | P0 | PLANNED |

### 5.5 GitHub Issues Monitor

| Issue | Title | Status | bkit Impact |
|-------|-------|:------:|:-----------:|
| #29548 | ExitPlanMode skips approval | OPEN | MEDIUM |
| #29423 | Task subagents ignore CLAUDE.md | OPEN | MEDIUM |
| #30926 | Bedrock beta flag regression | OPEN | LOW* |
| #30586 | PostToolUse stdout duplicated | OPEN | LOW |

---

## Appendix A: Analysis Sources

- [Claude Code CHANGELOG.md](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- [Claude Code Releases](https://github.com/anthropics/claude-code/releases)
- [Claude Code v2.1.70 Release](https://github.com/anthropics/claude-code/releases/tag/v2.1.70)
- [Claude Code Skills 2.0 - Geeky Gadgets](https://www.geeky-gadgets.com/anthropic-skill-creator/)
- [Claude Code 2.1.0 - VentureBeat](https://venturebeat.com/orchestration/claude-code-2-1-0-arrives-with-smoother-workflows-and-smarter-agents/)
- [Improving skill-creator - Claude Blog](https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills)
- [Claude Code Skills Docs](https://code.claude.com/docs/en/skills)
- [npm @anthropic-ai/claude-code](https://www.npmjs.com/package/@anthropic-ai/claude-code)
- bkit-system/philosophy/core-mission.md
- bkit-system/philosophy/ai-native-principles.md
- bkit-system/philosophy/pdca-methodology.md
- bkit-system/philosophy/context-engineering.md

## Appendix B: Quick Reference

### bkit v1.5.9 Current State

| Component | Count | Detail |
|-----------|:-----:|--------|
| Skills | 27 | 9 Workflow + 16 Capability + 2 Hybrid |
| Agents | 16 | 7 opus / 7 sonnet / 2 haiku |
| Hook Events | 10 | command type only |
| Library Exports | 199 | 5 subdirs + common.js bridge |
| Output Styles | 4 | learning, pdca-guide, enterprise, pdca-enterprise |

### CC Version Summary

| Version | Changes | bkit Impact | Status |
|---------|:-------:|:-----------:|:------:|
| v2.1.70 | ~20 (Bug Fixes, Perf, VSCode) | LOW~MEDIUM | COMPATIBLE |
| v2.1.71 | ~41 (Features 4, Fixes 29, Perf 5, VSCode 3) | **HIGH** (stdin fix, bg agent fix) | COMPATIBLE |
| v2.1.0 (Skills 2.0) | 1,096 commits | **CRITICAL (전략적)** | COMPATIBLE |

### v2.1.71 Key Numbers
```
Total: ~41 changes (Features 4, Bug Fixes ~29, Performance 5, VSCode 3)
New Commands: /loop (repeat execution)
New Tools: Cron scheduling
Bash Allowlist: +11 commands (fmt, comm, cmp, numfmt, expr, test, printf, getconf, seq, tsort, pr)
HIGH Impact: stdin freeze fix (CTO Team), background agent recovery fix
GitHub: Release + CHANGELOG published (정규 릴리스)
```

### Compatibility Verdict

```
COMPATIBLE - 0 Breaking Changes
37 Consecutive Compatible Releases (v2.1.34~v2.1.71, 확정)
CC 2.1.0 Skills 2.0: Additive features, no breaking changes
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-07 | Plan-Plus draft - CC v2.1.70~71 + Skills 2.0 strategic analysis, 15 ENH(85~99), 3-release roadmap | CTO Team |
| 1.1 | 2026-03-07 | v2.1.71 정규 릴리스 확인 (~41 changes), /loop + Cron 발견, ENH-100~102 추가, 18 ENH 총계 | CTO Team (3 background agents) |
| 1.2 | 2026-03-07 | Executive Summary 추가, ENH-103 (PDCA 문서 템플릿 준수 검증) 추가, 전체 v1.6.0 All-in-One 통합 (v2.0.0 분리 제거), 19 ENH 총계 | CTO Team |
