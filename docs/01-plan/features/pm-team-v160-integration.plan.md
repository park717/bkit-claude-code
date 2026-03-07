# PM Team v1.6.0 통합 보완 계획서

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Feature** | pm-team-v160-integration |
| **Version** | bkit v1.6.0 |
| **Date** | 2026-03-07 |
| **Author** | CTO Team (8+ agents) |
| **Status** | Draft |

### Value Delivered

| 관점 | 내용 |
|------|------|
| **Problem** | PM Team PR #42가 main에 머지되었으나, v1.6.0 표준(frontmatter hooks, Skill Classification, Evals, PDCA phase 통합, lib/ 함수, Stop handler, auto-trigger, template-validator, session-start context)에 미통합. 5개 PM 에이전트와 1개 PM 스킬이 bkit 시스템과 격리되어 동작 |
| **Solution** | PM Team 5 agents + 1 skill을 v1.6.0 표준에 100% 통합. PDCA phase map에 'pm' 추가, lib/ 함수 확장, Stop handler 등록, auto-trigger 키워드 추가, template-validator에 PRD 검증 추가, Evals 정의 보완 |
| **Function/UX Effect** | `/pdca pm` → `/pdca plan` 자동 연결, PM phase 상태 추적, PRD 문서 템플릿 검증, PM 에이전트 Stop 시 정리, PM 키워드 8개국어 자동 트리거, session-start에서 PM Team 인식 |
| **Core Value** | PM Team을 bkit PDCA 수명주기에 완전 통합하여 PM→Plan→Design→Do→Check→Act→Report 전체 흐름의 일관성 보장 |

---

## 1. Overview

### 1.1 배경

PR #42 (`feature/pm-agent-team`)이 main에 머지되어 PM Agent Team이 추가됨:
- 5개 에이전트: `pm-lead`, `pm-discovery`, `pm-strategy`, `pm-research`, `pm-prd`
- 1개 스킬: `pm-discovery` (SKILL.md)
- 1개 템플릿: `pm-prd.template.md`
- `skills/pdca/SKILL.md`에 pm action 추가

그러나 v1.6.0 Skills 2.0 통합 작업(ENH-85~103)과 독립적으로 개발되어, bkit 코어 시스템과의 통합이 필요함.

### 1.2 목적

PM Team을 bkit v1.6.0 표준에 100% 통합하여:
1. PDCA 수명주기에서 PM phase를 정식 지원
2. lib/ 함수에서 PM phase 인식
3. 기존 hook/script 시스템과 PM 에이전트 연동
4. Evals/Classification으로 PM 스킬 품질 관리

---

## 2. Scope

### 2.1 In Scope

| # | 항목 | 우선순위 | 영향 |
|---|------|----------|------|
| GAP-01 | `lib/pdca/phase.js` — PDCA_PHASES에 'pm' phase 추가 | P0 | PM phase 상태 추적 |
| GAP-02 | `lib/pdca/automation.js` — phaseMap/nextPhaseMap에 pm→plan 매핑 추가 | P0 | 자동 진행/트리거 |
| GAP-03 | `lib/pdca/automation.js` — detectPdcaFromTaskSubject에 `[PM]` 패턴 추가 | P0 | TaskCompleted hook 연동 |
| GAP-04 | `lib/pdca/automation.js` — getNextPdcaActionAfterCompletion에 pm→plan 추가 | P0 | 완료 후 다음 단계 안내 |
| GAP-05 | `lib/pdca/automation.js` — buildNextActionQuestion에 'pm' phase 옵션 추가 | P1 | AskUserQuestion UX |
| GAP-06 | `scripts/unified-stop.js` — SKILL_HANDLERS에 pm-discovery 추가 | P0 | Stop 시 정리 |
| GAP-07 | `scripts/unified-stop.js` — AGENT_HANDLERS에 pm-lead 추가 | P0 | Agent Stop 시 정리 |
| GAP-08 | PM agents frontmatter hooks 추가 (5 agents) | P1 | v1.6.0 frontmatter hooks 표준 |
| GAP-09 | `lib/pdca/template-validator.js` — REQUIRED_SECTIONS에 'prd' 타입 추가 | P1 | PRD 문서 검증 |
| GAP-10 | `lib/intent/trigger.js` — PM 관련 auto-trigger 키워드 추가 | P1 | 8개국어 자동 감지 |
| GAP-11 | `hooks/session-start.js` — PM Team agent 카운트 + context 보강 | P1 | 세션 시작 시 PM 인식 |
| GAP-12 | `evals/config.json` — pm-discovery eval 데이터 보강 | P2 | Eval 품질 향상 |
| GAP-13 | `bkit-system/philosophy/context-engineering.md` — PM Team 아키텍처 반영 | P2 | 문서 정합성 |
| GAP-14 | `lib/team/strategy.js` — PM Team 전략 생성 함수 | P1 | team strategy에 PM 포함 |
| GAP-15 | `lib/team/coordinator.js` — PM teammate 지원 | P1 | CTO Team에서 PM 할당 |
| GAP-16 | README.md — v1.6.0 badge 업데이트 (Version, CC 버전) | P2 | 공개 문서 정확성 |

### 2.2 Out of Scope

- PM 에이전트 자체 로직 변경 (PR #42 내용 유지)
- pm-prd.template.md 구조 변경
- 새로운 PM 에이전트 추가
- PM stop handler 스크립트 신규 생성 (unified-stop.js 매핑만 추가)

---

## 3. Requirements

### 3.1 기능 요구사항

| FR | 설명 | GAP 연결 |
|----|------|----------|
| FR-01 | PDCA_PHASES에 pm phase(order: 0)가 포함되어야 함 | GAP-01 |
| FR-02 | pm phase 완료 시 자동으로 plan phase 안내가 되어야 함 | GAP-02, GAP-04 |
| FR-03 | `[PM] feature-name` 형식의 Task Subject를 인식해야 함 | GAP-03 |
| FR-04 | PM 스킬/에이전트 Stop 시 unified-stop.js를 통해 정리되어야 함 | GAP-06, GAP-07 |
| FR-05 | 5개 PM agents에 hooks.Stop frontmatter가 있어야 함 | GAP-08 |
| FR-06 | PRD 문서(`docs/00-pm/*.prd.md`)가 template-validator로 검증되어야 함 | GAP-09 |
| FR-07 | PM 관련 키워드(8개국어)가 auto-trigger로 감지되어야 함 | GAP-10 |
| FR-08 | SessionStart에서 21 agents/28 skills 카운트가 정확해야 함 | GAP-11 |
| FR-09 | CTO Team strategy에 PM teammate가 포함되어야 함 | GAP-14, GAP-15 |

### 3.2 비기능 요구사항

| NFR | 설명 |
|-----|------|
| NFR-01 | 기존 PDCA 흐름(plan→design→do→check→act→report) 무변경 |
| NFR-02 | PM phase는 optional — pm 없이 바로 plan 시작 가능 유지 |
| NFR-03 | 하위 호환 100% — 기존 v1.5.9 사용자 영향 없음 |
| NFR-04 | 모든 코드 영어 작성 (docs/ 제외) |

---

## 4. Success Criteria

| 기준 | 목표값 |
|------|--------|
| Gap Analysis Match Rate | >= 95% |
| FR 구현률 | 9/9 (100%) |
| GAP 해소률 | 16/16 (100%) |
| 기존 테스트 회귀 | 0 failures |
| 하위 호환 | 100% |

---

## 5. Risks and Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| PM phase 추가로 기존 phase 순서 영향 | High | Low | pm order=0으로 기존 plan(1)~archived(7) 유지 |
| unified-stop.js에 PM handler 없어 stop 시 상태 불일치 | Medium | High | SKILL_HANDLERS/AGENT_HANDLERS에 매핑 추가 |
| template-validator에 PRD 타입 없어 검증 누락 | Medium | High | REQUIRED_SECTIONS에 prd 타입 추가 |
| CTO Team에서 PM agent 미인식 | Medium | Medium | team/strategy.js, coordinator.js 확장 |

---

## 6. Architecture Considerations

### 6.1 PM Phase 위치

```
[PM] (order: 0, optional)
  ↓
[Plan] (order: 1) → [Design] (2) → [Do] (3) → [Check] (4) → [Act] (5) → [Report] (6) → [Archived] (7)
```

PM phase는 order 0으로 Plan 이전에 위치하되, optional이므로 기존 흐름 무영향.

### 6.2 변경 파일 매트릭스 (~20 files)

| Category | Files | Change Type |
|----------|-------|-------------|
| PDCA Core | phase.js, automation.js | MOD (pm phase 추가) |
| Template Validator | template-validator.js | MOD (prd 타입 추가) |
| Stop Handlers | unified-stop.js | MOD (pm 매핑 추가) |
| PM Agents (5) | pm-lead.md, pm-discovery.md, pm-strategy.md, pm-research.md, pm-prd.md | MOD (hooks frontmatter) |
| Team | strategy.js, coordinator.js | MOD (pm teammate) |
| Intent | trigger.js | MOD (pm 키워드) |
| Session | session-start.js | MOD (카운트, context) |
| Evals | config.json, pm-discovery/eval.yaml | MOD (보강) |
| Docs | context-engineering.md | MOD (아키텍처 반영) |
| README | README.md | MOD (badge, 카운트) |

---

## 7. Convention Prerequisites

- 모든 코드 영어 작성 (docs/ 한국어)
- 기존 v1.6.0 패턴 준수 (classification, frontmatter hooks, evals)
- @version 1.6.0 유지

---

## 8. Next Steps

1. `/pdca design pm-team-v160-integration` — 상세 설계서 작성
2. `/pdca do pm-team-v160-integration` — 구현
3. `/pdca analyze pm-team-v160-integration` — Gap Analysis
4. 필요 시 `/pdca iterate` 반복

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-07 | CTO Team | Initial plan |
