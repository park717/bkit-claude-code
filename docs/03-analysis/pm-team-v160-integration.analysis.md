# PM Team v1.6.0 통합 보완 Gap Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: bkit (Vibecoding Kit)
> **Version**: v1.6.0
> **Analyst**: gap-detector
> **Date**: 2026-03-07
> **Design Doc**: [pm-team-v160-integration.design.md](../02-design/features/pm-team-v160-integration.design.md)
> **Plan Doc**: [pm-team-v160-integration.plan.md](../01-plan/features/pm-team-v160-integration.plan.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

PM Team PR #42 머지 후 bkit v1.6.0 코어 시스템 통합 상태를 검증한다. 설계서 16개 GAP 항목 + 2개 EXTRA 항목, 계획서 9개 FR 항목 대비 실제 구현 코드를 비교한다.

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/pm-team-v160-integration.design.md`
- **Plan Document**: `docs/01-plan/features/pm-team-v160-integration.plan.md`
- **Implementation**: `lib/pdca/`, `scripts/`, `agents/`, `hooks/`, `lib/intent/`, `lib/team/`, `evals/`, `lib/core/paths.js`, `README.md`, `bkit-system/`
- **Analysis Date**: 2026-03-07

---

## 2. Gap Analysis (Design vs Implementation)

### 2.1 Per-GAP Verification (16 GAP + 2 EXTRA)

| GAP | File | Design Expectation | Implementation Status | Status |
|-----|------|-------------------|----------------------|:------:|
| GAP-01 | `lib/pdca/phase.js` | PDCA_PHASES에 `pm: { order: 0, name: 'PM', icon: '\U0001F3AF' }` 추가, getPreviousPdcaPhase/getNextPdcaPhase에 'pm' 포함 | Line 23: pm 존재, order:0. Line 60/71: order 배열에 'pm' 첫 번째 | **PASS** |
| GAP-02 | `lib/pdca/automation.js` | generateAutoTrigger phaseMap에 `pm: { skill: 'pdca', args: 'plan ...' }` + autoAdvancePdcaPhase nextPhaseMap에 `pm: 'plan'` | Line 76: pm 항목 존재. Line 167: `pm: 'plan'` 존재 | **PASS** |
| GAP-03 | `lib/pdca/automation.js` | detectPdcaFromTaskSubject patterns에 `pm: /\[PM\]\s+(.+)/` | Line 502: pm 패턴 정확 일치 | **PASS** |
| GAP-04 | `lib/pdca/automation.js` | getNextPdcaActionAfterCompletion nextPhaseMap에 `pm: { nextPhase: 'plan', command: '/pdca plan ...' }` | Line 538: pm 항목 정확 일치 | **PASS** |
| GAP-05 | `lib/pdca/automation.js` | buildNextActionQuestion questionSets에 'pm' phase 옵션 3개 (Start Plan, Re-run PM, Skip to Plan-Plus) | Line 302-345: 'pm' questionSet 존재, 3개 옵션 + preview 포함 | **PASS** |
| GAP-06 | `scripts/unified-stop.js` | SKILL_HANDLERS에 `'pm-discovery': './pdca-skill-stop.js'` | Line 35: 정확 일치 | **PASS** |
| GAP-07 | `scripts/unified-stop.js` | AGENT_HANDLERS에 `'pm-lead': './pdca-skill-stop.js'` | Line 63: 정확 일치 | **PASS** |
| GAP-08 | `agents/pm-*.md` (5개) | 5개 PM agents에 hooks.Stop frontmatter 추가 | pm-lead(L34-38), pm-discovery(L26-30), pm-strategy(L25-29), pm-research(L26-30), pm-prd(L24-28): 모두 존재 | **PASS** |
| GAP-09 | `lib/pdca/template-validator.js` | REQUIRED_SECTIONS에 'prd' 타입 + detectDocumentType에 'docs/00-pm/' 인식 | Line 58-66: prd 타입 7개 섹션. Line 77: detectDocumentType 정확 인식 | **PASS** |
| GAP-10 | `lib/intent/language.js` | AGENT_TRIGGER_PATTERNS에 'pm-lead' 항목, 8개국어 PM 키워드 | Line 76-85: pm-lead 8개국어 패턴 존재. trigger.js가 language.js를 참조 | **PASS** |
| GAP-11 | `hooks/session-start.js` | PM Team context (agent trigger 테이블, v1.6.0 PM 정보) | Line 525: PM trigger 테이블 행 존재. Line 731: PM Agent Team 안내. Line 724: 28 skills 카운트 | **PASS** |
| GAP-12 | `evals/config.json` + `evals/workflow/pm-discovery/` | pm-discovery eval 정의 | config.json L13: workflow에 pm-discovery 포함. eval.yaml 존재 (3 criteria) | **PASS** |
| GAP-13 | `bkit-system/philosophy/context-engineering.md` | PM Team 아키텍처 반영 (agent 카운트 21, PDCA phase 다이어그램에 PM) | Line 711: PM Task 다이어그램. Line 944: 21 agents + 10 skills | **PASS** |
| GAP-14 | `lib/team/strategy.js` | Enterprise 레벨에 pm role (`agent: 'pm-lead'`, `phases: ['pm']`) | Line 49-54: Enterprise roles에 pm role 정확 일치. Dynamic phaseStrategy에 `pm: 'single'` (L37) | **PASS** |
| GAP-15 | `lib/team/coordinator.js` | PM agent 할당 지원 (generateTeamStrategy에서 PM phase 인식) | generateTeamStrategy (L54-57)가 strategy.js 위임. PM role은 strategy에서 처리됨 | **PASS** |
| GAP-16 | `README.md` | badge 업데이트 (v2.1.71+, v1.6.0) | L4: `Claude%20Code-v2.1.63+`, L5: `Version-1.5.9`. 미업데이트 | **FAIL** |
| EXTRA-1 | `scripts/pdca-skill-stop.js` | actionPattern regex에 'pm' 포함 | Line 153: `pdca\s+(pm\|plan\|design\|...)` — 'pm' 포함 | **PASS** |
| EXTRA-2 | `lib/core/paths.js` | DEFAULT_DOC_PATHS에 'pm' 항목, getDocPaths()에 pm 포함 | Line 59-62: pm paths 존재. Line 93: getDocPaths() pm 포함 | **PASS** |

### 2.2 Match Rate Summary

```
+---------------------------------------------+
|  Overall Match Rate: 94.4% (17/18)           |
+---------------------------------------------+
|  PASS:  17 items (94.4%)                     |
|  FAIL:   1 item  ( 5.6%)                     |
+---------------------------------------------+
```

---

## 3. Per-FR Verification (Plan Document)

| FR | 설명 | GAP 연결 | 검증 결과 | Status |
|----|------|----------|-----------|:------:|
| FR-01 | PDCA_PHASES에 pm phase(order: 0) 포함 | GAP-01 | phase.js L23: `pm: { order: 0 }` 확인 | **PASS** |
| FR-02 | pm phase 완료 시 자동 plan phase 안내 | GAP-02, GAP-04 | automation.js L76(generateAutoTrigger), L167(autoAdvance), L538(getNextAction) 모두 pm->plan 확인 | **PASS** |
| FR-03 | `[PM] feature-name` Task Subject 인식 | GAP-03 | automation.js L502: `pm: /\[PM\]\s+(.+)/` 패턴 확인 | **PASS** |
| FR-04 | PM 스킬/에이전트 Stop 시 unified-stop.js 정리 | GAP-06, GAP-07 | unified-stop.js L35(pm-discovery), L63(pm-lead) 확인 | **PASS** |
| FR-05 | 5개 PM agents hooks.Stop frontmatter | GAP-08 | 5개 agents 모두 hooks.Stop 존재 확인 | **PASS** |
| FR-06 | PRD 문서 template-validator 검증 | GAP-09 | template-validator.js L58-66(prd 섹션), L77(detectDocumentType) 확인 | **PASS** |
| FR-07 | PM 키워드 8개국어 auto-trigger | GAP-10 | language.js L76-85: pm-lead 8개국어 트리거 확인 | **PASS** |
| FR-08 | SessionStart 21 agents/28 skills 카운트 | GAP-11 | session-start.js: agents 21개 존재(glob 확인). L724: 28 skills. 단, agent scope 설명은 "14+2=16" 유지 (memory 섹션만 — PM agents 미포함 가능) | **PASS** (INFO) |
| FR-09 | CTO Team strategy에 PM teammate 포함 | GAP-14, GAP-15 | strategy.js L49-54: Enterprise pm role. coordinator.js: generateTeamStrategy 위임 | **PASS** |

```
+---------------------------------------------+
|  FR 구현률: 100% (9/9)                       |
+---------------------------------------------+
```

---

## 4. Differences Found

### 4.1 FAIL 항목

| # | GAP | 파일 | 설계 | 구현 | 영향 |
|---|-----|------|------|------|------|
| 1 | GAP-16 | `README.md` | CC badge `v2.1.71+`, Version badge `1.6.0` | CC badge `v2.1.63+`, Version badge `1.5.9` | Low (문서) |

### 4.2 INFO 항목 (기능 영향 없음)

| # | 파일 | 관찰 사항 |
|---|------|-----------|
| 1 | `hooks/session-start.js:647` | agent memory scope 설명이 "14 agents project, 2 user" 유지. 21개 agents 중 PM 5개의 scope 미반영 (pm-lead~pm-prd 모두 project scope). 실제 카운트는 "19 project + 2 user = 21 agents"가 정확 |
| 2 | `scripts/pdca-skill-stop.js` | PDCA_PHASE_TRANSITIONS (L52-96)에 'pm' 항목 없음. actionPattern에 'pm' 인식은 되지만 determinePdcaTransition에서 pm phase 전환 로직 누락. 실질적으로 pdca-skill-stop.js의 `nextStepMap`에도 'pm' 항목 없음. 기능 영향은 경미 (pm action 완료 시 generic guidance 제공) |
| 3 | `lib/pdca/template-validator.js` | 설계서 REQUIRED_SECTIONS prd 7개 섹션명과 구현 7개 섹션명이 다름. 설계: Summary/Background/Objective/Market Segments/Value Propositions/Solution/Release. 구현: Executive Summary/Opportunity Discovery/Value Proposition/Market Research/Go-To-Market/Product Requirements/Attribution. 구현이 최종 PRD 템플릿과 일치하므로 구현이 정확 |

---

## 5. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match (16 GAP) | 93.8% (15/16) | PASS |
| EXTRA Items (2) | 100% (2/2) | PASS |
| FR 구현률 (9 FR) | 100% (9/9) | PASS |
| **Overall (18 items)** | **94.4%** | **PASS** |

---

## 6. Recommended Actions

### 6.1 Immediate (P2 - Documentation)

| # | Action | 파일 | 설명 |
|---|--------|------|------|
| 1 | README.md badge 업데이트 | `README.md` L4-5 | CC badge `v2.1.71+`, Version `1.6.0`으로 변경 |

### 6.2 Optional Improvements (INFO)

| # | Action | 파일 | 설명 |
|---|--------|------|------|
| 1 | Agent scope 카운트 업데이트 | `hooks/session-start.js:647` | "14 agents project, 2 user" -> "19 agents project, 2 user" |
| 2 | PDCA_PHASE_TRANSITIONS에 pm 추가 | `scripts/pdca-skill-stop.js:52` | pm phase transition 로직 추가 (pm -> plan) |
| 3 | 설계서 prd 섹션명 정정 | `docs/02-design/features/pm-team-v160-integration.design.md` | REQUIRED_SECTIONS prd 섹션명을 구현과 일치시킴 |

---

## 7. Synchronization Recommendation

Match Rate **94.4%** >= 90% 기준 충족.

- GAP-16 (README badge)는 P2 문서 항목으로, v1.6.0 릴리스 시점에 일괄 업데이트 가능
- INFO 항목 3건은 기능 영향 없으므로 선택적 개선

**결론**: 설계-구현 일치도 양호. GAP-16 badge 업데이트만 완료하면 100% 달성 가능.

---

## 8. Regression Check

기존 PDCA 흐름 (plan -> design -> do -> check -> act -> report) 무영향 확인:

| 검증 항목 | 결과 |
|-----------|------|
| PDCA_PHASES plan order (1) 유지 | PASS |
| getNextPdcaPhase('plan') = 'design' | PASS |
| getPreviousPdcaPhase('plan') = 'pm' (기존 null -> pm) | PASS (additive) |
| autoAdvancePdcaPhase plan -> design | PASS |
| pm phase는 optional (기존 plan 시작 가능) | PASS |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-07 | Initial gap analysis (94.4% match rate) | gap-detector |
