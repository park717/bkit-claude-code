# bkit v1.6.0 종합 테스트 계획서

> **요약**: bkit v1.6.0 종합 테스트 — PM Agent Team 통합, Skills 2.0, Evals 프레임워크, Template Validator PRD 등 v1.6.0 신규 기능과 전체 bkit 시스템을 아우르는 종합 커버리지 테스트 계획. 28개 스킬, 21개 에이전트, 10개 훅 이벤트, 15개 템플릿, 46개 스크립트, 41개 라이브러리 모듈, 28개 Eval 세트, 4개 출력 스타일, 8개 언어 i18n 포함
>
> **프로젝트**: bkit-claude-code
> **버전**: 1.6.0
> **작성자**: CTO 팀 (8+ 테스트 전문 에이전트)
> **작성일**: 2026-03-07
> **상태**: 초안
> **이전 테스트**: v1.5.9 (594 TC, 576 실행, 97% 통과)
> **환경**: CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1, Claude Code v2.1.71+
> **브랜치**: feature/bkit-v1.6.0-skills2-enhancement
> **총 TC**: 706 (v1.6.0 집중 178 + 전체 커버리지 392 + 철학 & 컨텍스트 엔지니어링 136)

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **문제** | v1.6.0에서 PM Agent Team(5개 에이전트, 1개 스킬, 1개 템플릿), Skills 2.0 분류(10 Workflow/16 Capability/2 Hybrid), Evals 프레임워크(28개 세트), Template Validator PRD 타입, PDCA PM Phase 통합(16 GAP+3 EXTRA 항목) 등 대규모 변경이 도입됨. 21개 에이전트, 28개 스킬, 46개 스크립트, 41개 라이브러리 모듈에 대한 종합 검증 필요 |
| **해결** | 8명 이상의 테스트 전문 에이전트가 39개 테스트 카테고리, 706개 테스트 케이스를 다각도로 검증: v1.6.0 집중(178 TC) + 전체 커버리지(392 TC) + 철학 & 컨텍스트 엔지니어링(136 TC) |
| **기능/UX 효과** | PM→Plan 자동 전환, PRD 템플릿 검증, 8개 언어 PM 트리거, Evals A/B 테스팅, Skills 분류 정확성, 전체 PDCA 7단계(PM→Plan→Design→Do→Check→Act→Report) E2E, CTO Team PM 역할 오케스트레이션을 포함한 모든 기능 검증 |
| **핵심 가치** | v1.5.9 대비 +112 TC 증가로 PM Team 통합, Skills 2.0, Evals 등 신규 기능과 기존 전체 기능의 100% 인벤토리 커버리지 달성. `claude -p` 비대화형 테스트, Unit/E2E/UX 다관점 검증으로 프로덕션 품질 보장 |

---

## 1. 배경

### 1.1 테스트 필요성

bkit v1.6.0은 네 가지 주요 변경 범주를 도입함:
1. **PM Agent Team 통합**: 5개 PM 에이전트(pm-lead, pm-discovery, pm-strategy, pm-research, pm-prd), 1개 스킬(pm-discovery), 1개 템플릿(pm-prd.template.md)을 추가하고 core 시스템 18개 파일에 통합
2. **Skills 2.0**: context:fork native, frontmatter hooks, Skill Evals, Skill Classification(10 Workflow/16 Capability/2 Hybrid), hot reload 지원
3. **Evals 프레임워크**: runner.js, reporter.js, ab-tester.js + 28개 eval 세트(8 workflow, 18 capability, 1 hybrid, 1 pm-discovery)
4. **Template Validator PRD**: PRD 문서 타입 검증(7개 필수 섹션), docs/00-pm/ 경로 인식

이전 v1.5.9 테스트(594 TC, 97% 통과)에서 전체 시스템 안정성을 확인했으나, v1.6.0의 25개 파일 +1981줄 변경과 PM 통합에 따른 종합 검증이 필요함.

### 1.2 이전 테스트 결과 (v1.5.9)

| 지표 | 값 |
|------|:--:|
| 총 TC | 594 (계획) |
| 실행 TC | 576 |
| 통과율 | 97% (558 PASS, 18 SKIP) |
| common.js export 수 | 199 |
| 스킬 | 27 |
| 에이전트 | 16 |
| 훅 이벤트 | 10 |

### 1.3 v1.6.0 구성요소 인벤토리

| 구성요소 | 수량 | 위치 | v1.5.9 대비 변경 |
|----------|:----:|------|:----------------:|
| 스킬 | **28** (코어 22 + bkend 5 + pm 1) | `skills/*/SKILL.md` | **+1** (pm-discovery) |
| 에이전트 | **21** | `agents/*.md` | **+5** (pm-lead, pm-discovery, pm-strategy, pm-research, pm-prd) |
| 훅 이벤트 | 10 | `hooks/hooks.json` | 0 |
| 스크립트 | **46** | `scripts/*.js` | **+1** |
| 라이브러리 모듈 | **41** | `lib/**/*.js` | **+2** (template-validator.js 수정, paths.js 수정) |
| 라이브러리 export (common.js) | **~205** | `lib/` -> `lib/common.js` | **+~6** (PM 관련) |
| 템플릿 | **15** | `templates/` | **+1** (pm-prd.template.md) |
| 출력 스타일 | 4 | `output-styles/` | 0 |
| Eval 세트 | **28** | `evals/` | **신규** (전체) |
| 설정 파일 | 2 | `plugin.json`, `bkit.config.json` | 버전 변경 |

### 1.4 v1.6.0 주요 변경 파일 (25개 파일, +1981/-27줄)

| # | 파일 | 변경 유형 | 카테고리 |
|---|------|:---------:|----------|
| 1 | `lib/pdca/phase.js` | 수정 | PM Phase 추가 (order 0) |
| 2 | `lib/pdca/automation.js` | 수정 | 5개 phase map에 pm 추가 |
| 3 | `lib/pdca/template-validator.js` | 수정 | PRD 타입 + 7개 필수 섹션 |
| 4 | `lib/core/paths.js` | 수정 | PM doc paths 추가 |
| 5 | `lib/intent/language.js` | 수정 | pm-lead 8개 언어 트리거 |
| 6 | `lib/team/strategy.js` | 수정 | Enterprise PM 역할 추가 |
| 7 | `scripts/unified-stop.js` | 수정 | pm-discovery, pm-lead 핸들러 |
| 8 | `scripts/pdca-skill-stop.js` | 수정 | PM phase transition/nextStep |
| 9 | `agents/pm-lead.md` | 수정 | Stop hook frontmatter |
| 10 | `agents/pm-discovery.md` | 수정 | Stop hook frontmatter |
| 11 | `agents/pm-strategy.md` | 수정 | Stop hook frontmatter |
| 12 | `agents/pm-research.md` | 수정 | Stop hook frontmatter |
| 13 | `agents/pm-prd.md` | 수정 | Stop hook frontmatter |
| 14 | `hooks/session-start.js` | 수정 | PM 트리거, agent count 19 |
| 15 | `README.md` | 수정 | 배지 v2.1.71+, v1.6.0 |
| 16 | `bkit-system/philosophy/context-engineering.md` | 수정 | 21 Agents, 28 skills |
| 17 | `evals/runner.js` | **신규** | Eval runner |
| 18 | `evals/reporter.js` | **신규** | Eval reporter |
| 19 | `evals/ab-tester.js` | **신규** | A/B 테스팅 |
| 20 | `evals/config.json` | **신규** | Eval 설정 |
| 21-28 | `evals/workflow/*/` | **신규** | 9개 Workflow eval 세트 |
| 29-46 | `evals/capability/*/` | **신규** | 18개 Capability eval 세트 |
| 47 | `evals/hybrid/plan-plus/` | **신규** | 1개 Hybrid eval 세트 |
| 48 | `templates/pm-prd.template.md` | **신규** | PM PRD 템플릿 |

### 1.5 CTO 팀 구성 (8+ 에이전트)

| # | 역할 | 에이전트 | 모델 | 담당 카테고리 |
|---|------|----------|:----:|-------------|
| 1 | **CTO 리드** | cto-lead | opus | 전체 조율, 품질 게이트, 최종 판정 |
| 2 | PM 통합 테스터 | product-manager | opus | PM Team 통합, PM Phase E2E, PM 트리거 |
| 3 | 코드 분석가 | code-analyzer | opus | Unit 테스트: 함수 I/O, export 체인, 엣지 |
| 4 | QA 전략가 | qa-strategist | sonnet | 테스트 전략, 매트릭스 설계, 회귀 |
| 5 | 갭 감지기 | gap-detector | opus | E2E 테스트: 설계-구현 갭, 전체 사이클 |
| 6 | QA 모니터 | qa-monitor | sonnet | 훅 테스트, 스크립트 실행, JSON 검증 |
| 7 | Evals 전문가 | frontend-architect | sonnet | Evals 프레임워크, A/B 테스터, 28 eval 세트 |
| 8 | 보안 검증자 | security-architect | sonnet | 권한 관리, 입력 검증, 경로 주입 방지 |
| 9 | 인프라 검증자 | infra-architect | sonnet | paths.js, config, 파일 시스템, 마이그레이션 |

---

## 2. 테스트 전략 개요

### 2.1 테스트 방법론

| 방법 | 도구 | 용도 |
|------|------|------|
| **Node.js require 검증** | `node -e` / `node << 'SCRIPT'` | 함수 export 존재 및 반환값 검증 |
| **claude -p 비대화형** | `claude -p "prompt"` | 스킬/에이전트 E2E 동작 검증 |
| **grep/rg 패턴 매칭** | `grep -c`, `rg` | 코드 내 패턴 존재 여부 확인 |
| **파일 존재 확인** | `ls`, `test -f` | 파일/디렉토리 구조 검증 |
| **JSON 파싱** | `node -e "JSON.parse(...)"` | 설정 파일, 상태 파일 구조 검증 |
| **Eval 실행** | `node evals/runner.js` | Skill Eval 세트 자동 실행 |

### 2.2 테스트 카테고리 매트릭스

| # | 카테고리 | 접두사 | TC 수 | 담당 에이전트 | 섹션 |
|---|----------|--------|:-----:|--------------|:----:|
| | **v1.6.0 신규 기능** | | **178** | | |
| 1 | PM Agent Team | TC-PM-A | 30 | product-manager | 4 |
| 2 | PM Core 통합 | TC-PM-C | 28 | code-analyzer | 5 |
| 3 | PM Stop/Hook 통합 | TC-PM-H | 18 | qa-monitor | 6 |
| 4 | Template Validator PRD | TC-TV | 12 | code-analyzer | 7 |
| 5 | Evals 프레임워크 | TC-EV | 28 | frontend-architect | 8 |
| 6 | Skills 2.0 분류 | TC-SC | 15 | gap-detector | 9 |
| 7 | PM i18n (8개 언어) | TC-PM-L | 16 | product-manager | 10 |
| 8 | PM Team Strategy | TC-PM-T | 12 | qa-strategist | 11 |
| 9 | Session-Start PM | TC-SS | 10 | qa-monitor | 12 |
| 10 | 회귀 (v1.5.9 보존) | TC-RG | 9 | qa-strategist | 13 |
| | **전체 커버리지** | | **392** | | |
| 11 | 코어 시스템 | TC-CS | 50 | code-analyzer | 14 |
| 12 | 인텐트 시스템 | TC-IN | 35 | product-manager | 15 |
| 13 | 태스크 시스템 | TC-TS | 25 | code-analyzer | 16 |
| 14 | 팀 시스템 | TC-TM | 32 | code-analyzer | 17 |
| 15 | PDCA 전체 시스템 | TC-PD | 28 | code-analyzer | 18 |
| 16 | 스킬 시스템 | TC-SK | 28 | gap-detector | 19 |
| 17 | 에이전트 시스템 | TC-AG | 21 | gap-detector | 20 |
| 18 | 설정 시스템 | TC-CF | 12 | infra-architect | 21 |
| 19 | 템플릿 시스템 | TC-TP | 28 | gap-detector | 22 |
| 20 | 출력 스타일 | TC-OS | 6 | qa-monitor | 23 |
| 21 | PDCA 레벨 E2E | TC-LV | 15 | product-manager | 24 |
| 22 | i18n (8개 언어) | TC-L10N | 18 | product-manager | 25 |
| 23 | 메모리 시스템 | TC-MEM | 11 | infra-architect | 26 |
| 24 | 스크립트 시스템 | TC-SCR | 35 | qa-monitor | 27 |
| 25 | 보안 검증 | TC-SEC | 12 | security-architect | 28 |
| 26 | 경로 & 파일 시스템 | TC-FS | 16 | infra-architect | 29 |
| | **철학 & 컨텍스트 엔지니어링** | | **136** | | |
| 27 | 핵심 철학 | TC-PH | 18 | product-manager | 30 |
| 28 | 컨텍스트 엔지니어링 | TC-CE | 33 | code-analyzer | 31 |
| 29 | 6계층 훅 시스템 | TC-HL | 8 | qa-monitor | 32 |
| 30 | 동적 컨텍스트 주입 | TC-DI | 20 | product-manager | 33 |
| 31 | AI 네이티브 원칙 | TC-AN | 20 | gap-detector | 34 |
| 32 | PDCA 방법론 | TC-PMT | 18 | gap-detector | 35 |
| 33 | 오케스트레이션 패턴 | TC-OP | 10 | qa-strategist | 36 |
| 34 | 출력 스타일 컨텍스트 | TC-OC | 5 | qa-monitor | 37 |
| 35 | 응답 리포트 규칙 | TC-RR | 4 | qa-monitor | 38 |

### 2.3 TC 요약

| 우선순위 | v1.6.0 집중 | 전체 커버리지 | 철학 & CE | 합계 |
|:--------:|:-----------:|:------------:|:---------:|:----:|
| P0 (필수) | 128 | 195 | 75 | 398 |
| P1 (권장) | 40 | 165 | 52 | 257 |
| P2 (선택) | 10 | 32 | 9 | 51 |
| **총합** | **178** | **392** | **136** | **706** |

### 2.4 테스트 실행 전략

| 단계 | 순서 | 병렬성 | TC 범위 | 시간 |
|------|:----:|:------:|:-------:|------|
| 1. Unit 테스트 | 1st | 3명 병렬 | TC-PM-C, TC-TV, TC-CS, TC-PD | 최우선 |
| 2. Integration 테스트 | 2nd | 2명 병렬 | TC-PM-H, TC-SS, TC-IN, TC-TS | Unit 완료 후 |
| 3. E2E 테스트 | 3rd | 2명 병렬 | TC-PM-A, TC-LV, TC-EV | Integration 완료 후 |
| 4. UX/철학 테스트 | 4th | 3명 병렬 | TC-PH, TC-CE, TC-AN, TC-PMT | E2E 완료 후 |
| 5. 보안/회귀 테스트 | 5th | 2명 병렬 | TC-SEC, TC-RG | 전체 병렬 가능 |

---

## 3. 테스트 범위 매트릭스

### 3.1 v1.6.0 신규 기능

| 기능 | 변경 파일 | TC 수 | 우선순위 |
|------|:---------:|:-----:|:--------:|
| PM Agent Team (5 에이전트) | 5개 agents/*.md | 30 | P0 |
| PM Core 통합 (phase, automation, paths) | phase.js, automation.js, paths.js | 28 | P0 |
| PM Stop/Hook 통합 | unified-stop.js, pdca-skill-stop.js | 18 | P0 |
| Template Validator PRD | template-validator.js | 12 | P0 |
| Evals 프레임워크 | evals/ (28 세트 + 3 도구) | 28 | P0/P1 |
| Skills 2.0 분류 | 28개 스킬 분류 검증 | 15 | P0 |
| PM i18n (8개 언어) | language.js | 16 | P0/P1 |
| PM Team Strategy | strategy.js | 12 | P0/P1 |
| Session-Start PM | session-start.js | 10 | P0/P1 |
| 회귀 (v1.5.9 기능 보존) | 전체 | 9 | P0 |

### 3.2 기존 기능 (전체 커버리지)

| 기능 | 구성요소 수 | TC 수 | 우선순위 |
|------|:----------:|:-----:|:--------:|
| 코어 시스템 (platform, cache, I/O, debug, config, file, paths) | ~50 export | 50 | P0/P1 |
| 인텐트 시스템 (language, trigger, ambiguity) | ~20 export | 35 | P0/P1 |
| 태스크 시스템 (classification, context, creator, tracker) | ~26 export | 25 | P0/P1 |
| 팀 시스템 (coordinator, strategy, orchestrator, communication, queue, cto, state) | ~42 export | 32 | P0/P1 |
| PDCA 전체 시스템 (tier, level, phase, status, automation, executive-summary) | ~65 export | 28 | P0/P1 |
| 스킬 시스템 | 28개 스킬 | 28 | P0/P1 |
| 에이전트 시스템 | 21개 에이전트 | 21 | P0 |
| 설정 시스템 | 3개 파일 | 12 | P0/P1 |
| 템플릿 시스템 | 15개 템플릿 | 28 | P0/P1/P2 |
| 출력 스타일 | 4개 스타일 | 6 | P0/P1 |
| PDCA 레벨 E2E | 3개 레벨 | 15 | P0/P1/P2 |
| i18n (8개 언어) | 8개 언어 | 18 | P0/P1 |
| 메모리 시스템 | 3개 시스템 | 11 | P0/P1 |
| 스크립트 시스템 | 46개 스크립트 | 35 | P0/P1/P2 |
| 보안 검증 | 권한, 입력, 경로 | 12 | P0 |
| 경로 & 파일 시스템 | paths.js, legacy migration | 16 | P0/P1 |

---

## 4. PM Agent Team 테스트 (TC-PM-A, product-manager)

### 4.1 PM 에이전트 존재 및 구조

| TC-ID | 설명 | 검증 방법 | 기대 결과 | 우선순위 |
|-------|------|-----------|-----------|:--------:|
| TC-PM-A001 | pm-lead.md 파일 존재 | `test -f agents/pm-lead.md` | 존재 | P0 |
| TC-PM-A002 | pm-discovery.md 파일 존재 | `test -f agents/pm-discovery.md` | 존재 | P0 |
| TC-PM-A003 | pm-strategy.md 파일 존재 | `test -f agents/pm-strategy.md` | 존재 | P0 |
| TC-PM-A004 | pm-research.md 파일 존재 | `test -f agents/pm-research.md` | 존재 | P0 |
| TC-PM-A005 | pm-prd.md 파일 존재 | `test -f agents/pm-prd.md` | 존재 | P0 |
| TC-PM-A006 | pm-lead에 Stop hook frontmatter | grep 'hooks:' + 'Stop:' | 존재 | P0 |
| TC-PM-A007 | pm-discovery에 Stop hook frontmatter | grep 확인 | 존재 | P0 |
| TC-PM-A008 | pm-strategy에 Stop hook frontmatter | grep 확인 | 존재 | P0 |
| TC-PM-A009 | pm-research에 Stop hook frontmatter | grep 확인 | 존재 | P0 |
| TC-PM-A010 | pm-prd에 Stop hook frontmatter | grep 확인 | 존재 | P0 |

### 4.2 PM 스킬

| TC-ID | 설명 | 검증 방법 | 기대 결과 | 우선순위 |
|-------|------|-----------|-----------|:--------:|
| TC-PM-A011 | pm-discovery SKILL.md 존재 | `test -f skills/pm-discovery/SKILL.md` | 존재 | P0 |
| TC-PM-A012 | pm-prd.template.md 존재 | `test -f templates/pm-prd.template.md` | 존재 | P0 |
| TC-PM-A013 | pm-prd.template.md에 Executive Summary 섹션 | grep 확인 | 포함 | P0 |
| TC-PM-A014 | pm-prd.template.md에 7개 필수 섹션 존재 | grep 각 섹션명 | 모두 존재 | P0 |

### 4.3 PM E2E 워크플로

| TC-ID | 설명 | 검증 방법 | 기대 결과 | 우선순위 |
|-------|------|-----------|-----------|:--------:|
| TC-PM-A015 | `/pdca pm` 명령 인식 | `claude -p "/pdca pm test"` | PM 분석 시작 | P0 |
| TC-PM-A016 | PM 완료 후 Plan으로 자동 전환 제안 | pdca-skill-stop 출력 확인 | "Proceed to Plan phase" 메시지 | P0 |
| TC-PM-A017 | PM→Plan 전환 시 AskUserQuestion 생성 | Hook 출력 JSON | userPrompt 포함 | P0 |
| TC-PM-A018 | PM 단계에서 PRD 문서 생성 | docs/00-pm/features/ 확인 | .prd.md 파일 생성 | P1 |
| TC-PM-A019 | PM phase가 PDCA status에 기록 | getPdcaStatusFull() | phase = 'pm' 기록 | P0 |
| TC-PM-A020 | PM이 선택적 단계로 동작 (Plan 직접 시작 가능) | `/pdca plan` 직접 실행 | PM 없이 Plan 시작 가능 | P0 |

### 4.4 PM Agent Team 협업

| TC-ID | 설명 | 검증 방법 | 기대 결과 | 우선순위 |
|-------|------|-----------|-----------|:--------:|
| TC-PM-A021 | pm-lead가 다른 4개 PM 에이전트 조율 | 에이전트 설정 확인 | pm-lead가 orchestrator 역할 | P1 |
| TC-PM-A022 | pm-discovery가 기회 발견 담당 | 에이전트 역할 확인 | Opportunity Discovery | P1 |
| TC-PM-A023 | pm-strategy가 전략 분석 담당 | 에이전트 역할 확인 | Strategy Analysis | P1 |
| TC-PM-A024 | pm-research가 시장 조사 담당 | 에이전트 역할 확인 | Market Research | P1 |
| TC-PM-A025 | pm-prd가 PRD 문서 작성 담당 | 에이전트 역할 확인 | PRD Generation | P1 |
| TC-PM-A026 | 5개 PM 에이전트 모두 동일 Stop handler 사용 | frontmatter 비교 | pdca-skill-stop.js | P0 |
| TC-PM-A027 | PM 에이전트 총 개수 5개 | `ls agents/pm-*.md | wc -l` | 5 | P0 |
| TC-PM-A028 | PM 에이전트가 전체 에이전트 21개 중 일부 | `ls agents/*.md | wc -l` | 21 | P0 |
| TC-PM-A029 | PM 스킬 pdca SKILL.md에 pm 액션 문서화 | grep 확인 | pm 관련 설명 존재 | P1 |
| TC-PM-A030 | PM phase icon이 올바른 이모지 | phase.js 확인 | '🎯' | P0 |

---

## 5. PM Core 통합 테스트 (TC-PM-C, code-analyzer)

### 5.1 phase.js PM Phase

| TC-ID | 설명 | 검증 방법 | 기대 결과 | 우선순위 |
|-------|------|-----------|-----------|:--------:|
| TC-PM-C001 | PDCA_PHASES에 pm 항목 존재 | node require | pm: {order:0, name:'PM', icon:'🎯'} | P0 |
| TC-PM-C002 | PM order가 0 (Plan 이전) | node require | PDCA_PHASES.pm.order === 0 | P0 |
| TC-PM-C003 | getPreviousPdcaPhase 배열에 pm 포함 | 함수 확인 | ['pm', 'plan', ...] | P0 |
| TC-PM-C004 | getNextPdcaPhase 배열에 pm 포함 | 함수 확인 | ['pm', 'plan', ...] | P0 |
| TC-PM-C005 | pm 다음 단계가 plan | getNextPdcaPhase('pm') | 'plan' | P0 |
| TC-PM-C006 | pm 이전 단계가 null | getPreviousPdcaPhase('pm') | null | P0 |
| TC-PM-C007 | plan 이전 단계가 pm | getPreviousPdcaPhase('plan') | 'pm' | P0 |

### 5.2 automation.js PM Maps

| TC-ID | 설명 | 검증 방법 | 기대 결과 | 우선순위 |
|-------|------|-----------|-----------|:--------:|
| TC-PM-C008 | generateAutoTrigger phaseMap에 pm 존재 | 코드 grep | `pm: { skill: 'pdca', args: 'plan' }` | P0 |
| TC-PM-C009 | autoAdvancePdcaPhase nextPhaseMap에 pm 존재 | 코드 grep | `pm: 'plan'` | P0 |
| TC-PM-C010 | detectPdcaFromTaskSubject에 PM 패턴 존재 | 코드 grep | `pm: /\[PM\]\s+(.+)/` | P0 |
| TC-PM-C011 | detectPdcaFromTaskSubject('[PM] my-feat') | node require | {phase:'pm', feature:'my-feat'} | P0 |
| TC-PM-C012 | getNextPdcaActionAfterCompletion에 pm 존재 | 코드 grep | pm → plan 전환 | P0 |
| TC-PM-C013 | buildNextActionQuestion에 pm 질문 세트 존재 | 코드 grep | 'pm' key with 3 options | P0 |
| TC-PM-C014 | buildNextActionQuestion('pm', 'feat') 호출 | node require | header='PM Complete', 3 options | P0 |
| TC-PM-C015 | PM 옵션에 'Start Plan', 'Re-run PM', 'Skip to Plan-Plus' | node require | 3개 label 확인 | P0 |

### 5.3 paths.js PM Paths

| TC-ID | 설명 | 검증 방법 | 기대 결과 | 우선순위 |
|-------|------|-----------|-----------|:--------:|
| TC-PM-C016 | DEFAULT_DOC_PATHS에 pm 키 존재 | node require | pm 배열 존재 | P0 |
| TC-PM-C017 | PM doc path 첫 번째: docs/00-pm/features/{feature}.prd.md | node require | 패턴 일치 | P0 |
| TC-PM-C018 | PM doc path 두 번째: docs/00-pm/{feature}.prd.md | node require | 패턴 일치 | P0 |
| TC-PM-C019 | getDocPaths()에 pm 키 반환 | node require | pm 배열 반환 | P0 |
| TC-PM-C020 | resolveDocPaths('pm', 'test-feat') 경로 생성 | node require | 2개 절대 경로 | P0 |
| TC-PM-C021 | findDoc('pm', 'nonexist') 빈 문자열 | node require | '' | P1 |

### 5.4 pdca-skill-stop.js PM 통합

| TC-ID | 설명 | 검증 방법 | 기대 결과 | 우선순위 |
|-------|------|-----------|-----------|:--------:|
| TC-PM-C022 | actionPattern regex에 pm 포함 | grep 확인 | `(pm|plan|design|...)` | P0 |
| TC-PM-C023 | PDCA_PHASE_TRANSITIONS에 pm 키 존재 | grep 확인 | pm → plan 전환 | P0 |
| TC-PM-C024 | nextStepMap에 pm 키 존재 | grep 확인 | nextAction: 'plan' | P0 |
| TC-PM-C025 | PM transition의 next가 'plan' | grep 확인 | next: 'plan' | P0 |
| TC-PM-C026 | PM transition의 skill이 '/pdca plan' | grep 확인 | skill: '/pdca plan' | P0 |
| TC-PM-C027 | PM nextStep options에 2개 이상 선택지 | grep 확인 | Start Plan + Later | P0 |
| TC-PM-C028 | Executive Summary 생성 조건에 pm 액션 미포함 | grep 확인 | plan/design/report만 | P1 |

---

## 6. PM Stop/Hook 통합 테스트 (TC-PM-H, qa-monitor)

### 6.1 unified-stop.js 핸들러

| TC-ID | 설명 | 검증 방법 | 기대 결과 | 우선순위 |
|-------|------|-----------|-----------|:--------:|
| TC-PM-H001 | SKILL_HANDLERS에 pm-discovery 존재 | grep 확인 | `'pm-discovery': './pdca-skill-stop.js'` | P0 |
| TC-PM-H002 | AGENT_HANDLERS에 pm-lead 존재 | grep 확인 | `'pm-lead': './pdca-skill-stop.js'` | P0 |
| TC-PM-H003 | pm-discovery 스킬 Stop 시 pdca-skill-stop.js 실행 | 경로 추적 | 올바른 handler 매핑 | P0 |
| TC-PM-H004 | pm-lead 에이전트 Stop 시 pdca-skill-stop.js 실행 | 경로 추적 | 올바른 handler 매핑 | P0 |

### 6.2 PM 에이전트 frontmatter hooks

| TC-ID | 설명 | 검증 방법 | 기대 결과 | 우선순위 |
|-------|------|-----------|-----------|:--------:|
| TC-PM-H005 | pm-lead.md hooks.Stop type=command | grep 확인 | type: command | P0 |
| TC-PM-H006 | pm-lead.md hooks.Stop command 경로 | grep 확인 | `${CLAUDE_PLUGIN_ROOT}/scripts/pdca-skill-stop.js` | P0 |
| TC-PM-H007 | pm-lead.md hooks.Stop timeout=10000 | grep 확인 | timeout: 10000 | P0 |
| TC-PM-H008 | 5개 PM 에이전트 모두 동일한 Stop hook 설정 | diff 비교 | 5개 모두 일치 | P0 |
| TC-PM-H009 | PM 에이전트 frontmatter YAML 유효성 | YAML 파싱 | 오류 없음 | P0 |

### 6.3 PM Phase transition

| TC-ID | 설명 | 검증 방법 | 기대 결과 | 우선순위 |
|-------|------|-----------|-----------|:--------:|
| TC-PM-H010 | determinePdcaTransition('pm') → plan | 함수 호출 | {next:'plan', skill:'/pdca plan'} | P0 |
| TC-PM-H011 | PM 완료 시 pdca-status.json 업데이트 | 상태 파일 확인 | phase='pm' 기록 | P0 |
| TC-PM-H012 | PM→Plan 자동 Task 생성 | autoCreatePdcaTask 호출 | [Plan] task 생성 | P1 |
| TC-PM-H013 | PM Stop에서 Task Chain 생성 미발생 | 로직 확인 | pm≠plan이므로 chain 미생성 | P1 |
| TC-PM-H014 | PM phase auto-advance Full-Auto 모드 | autoTrigger 확인 | plan 스킬 자동 트리거 | P1 |
| TC-PM-H015 | PM phase auto-advance Semi-Auto 모드 | userPrompt 확인 | AskUserQuestion 생성 | P1 |
| TC-PM-H016 | PM 완료 시 systemMessage에 guidance 포함 | JSON 출력 확인 | 'PM analysis completed' | P0 |
| TC-PM-H017 | PM action이 updatePdcaStatus에 전달 | 코드 경로 | feature, 'pm' phase | P0 |
| TC-PM-H018 | PM action이 phaseMap에서 'pm'으로 매핑 | grep 확인 | pm action → pm phase | P0 |

---

## 7. Template Validator PRD 테스트 (TC-TV, code-analyzer)

| TC-ID | 설명 | 검증 방법 | 기대 결과 | 우선순위 |
|-------|------|-----------|-----------|:--------:|
| TC-TV001 | REQUIRED_SECTIONS에 prd 키 존재 | node require | 7개 섹션 배열 | P0 |
| TC-TV002 | PRD 필수 섹션: Executive Summary | 배열 확인 | 포함 | P0 |
| TC-TV003 | PRD 필수 섹션: Opportunity Discovery | 배열 확인 | 포함 | P0 |
| TC-TV004 | PRD 필수 섹션: Value Proposition | 배열 확인 | 포함 | P0 |
| TC-TV005 | PRD 필수 섹션: Market Research | 배열 확인 | 포함 | P0 |
| TC-TV006 | PRD 필수 섹션: Go-To-Market | 배열 확인 | 포함 | P0 |
| TC-TV007 | PRD 필수 섹션: Product Requirements | 배열 확인 | 포함 | P0 |
| TC-TV008 | PRD 필수 섹션: Attribution | 배열 확인 | 포함 | P0 |
| TC-TV009 | detectDocumentType: docs/00-pm/*.prd.md → 'prd' | 함수 호출 | 'prd' | P0 |
| TC-TV010 | detectDocumentType: docs/01-plan/*.plan.md → 'plan' (기존 유지) | 함수 호출 | 'plan' | P0 |
| TC-TV011 | validateDocument: PRD 모든 섹션 있으면 valid | 완전한 PRD 입력 | {valid:true, missing:[]} | P0 |
| TC-TV012 | validateDocument: PRD 일부 섹션 없으면 invalid | 불완전 PRD | {valid:false, missing:['...']} | P0 |

---

## 8. Evals 프레임워크 테스트 (TC-EV, frontend-architect)

### 8.1 Evals 인프라

| TC-ID | 설명 | 검증 방법 | 기대 결과 | 우선순위 |
|-------|------|-----------|-----------|:--------:|
| TC-EV001 | evals/runner.js 존재 및 구문 유효 | `node -c evals/runner.js` | 오류 없음 | P0 |
| TC-EV002 | evals/reporter.js 존재 및 구문 유효 | `node -c evals/reporter.js` | 오류 없음 | P0 |
| TC-EV003 | evals/ab-tester.js 존재 및 구문 유효 | `node -c evals/ab-tester.js` | 오류 없음 | P0 |
| TC-EV004 | evals/config.json 유효한 JSON | `node -e "JSON.parse(...)"` | 파싱 성공 | P0 |
| TC-EV005 | evals/README.md 존재 | `test -f evals/README.md` | 존재 | P1 |

### 8.2 Workflow Eval 세트 (9개)

| TC-ID | 설명 | 검증 방법 | 기대 결과 | 우선순위 |
|-------|------|-----------|-----------|:--------:|
| TC-EV006 | bkit-rules eval 세트 (eval.yaml, prompt-1.md, expected-1.md) | 3파일 존재 | 모두 존재 | P0 |
| TC-EV007 | bkit-templates eval 세트 | 3파일 존재 | 모두 존재 | P0 |
| TC-EV008 | pdca eval 세트 | 3파일 존재 | 모두 존재 | P0 |
| TC-EV009 | development-pipeline eval 세트 | 3파일 존재 | 모두 존재 | P0 |
| TC-EV010 | phase-2-convention eval 세트 | 3파일 존재 | 모두 존재 | P0 |
| TC-EV011 | phase-8-review eval 세트 | 3파일 존재 | 모두 존재 | P0 |
| TC-EV012 | zero-script-qa eval 세트 | 3파일 존재 | 모두 존재 | P0 |
| TC-EV013 | code-review eval 세트 | 3파일 존재 | 모두 존재 | P0 |
| TC-EV014 | pm-discovery eval 세트 | 3파일 존재 | 모두 존재 | P0 |

### 8.3 Capability Eval 세트 (18개)

| TC-ID | 설명 | 검증 방법 | 기대 결과 | 우선순위 |
|-------|------|-----------|-----------|:--------:|
| TC-EV015 | starter eval 세트 | 3파일 존재 | 모두 존재 | P1 |
| TC-EV016 | dynamic eval 세트 | 3파일 존재 | 모두 존재 | P1 |
| TC-EV017 | enterprise eval 세트 | 3파일 존재 | 모두 존재 | P1 |
| TC-EV018 | phase-1-schema eval 세트 | 3파일 존재 | 모두 존재 | P1 |
| TC-EV019 | phase-3-mockup eval 세트 | 3파일 존재 | 모두 존재 | P1 |
| TC-EV020 | phase-4-api eval 세트 | 3파일 존재 | 모두 존재 | P1 |
| TC-EV021 | phase-5-design-system eval 세트 | 3파일 존재 | 모두 존재 | P1 |
| TC-EV022 | phase-6-ui-integration eval 세트 | 3파일 존재 | 모두 존재 | P1 |
| TC-EV023 | phase-7-seo-security eval 세트 | 3파일 존재 | 모두 존재 | P1 |
| TC-EV024 | phase-9-deployment eval 세트 | 3파일 존재 | 모두 존재 | P1 |
| TC-EV025 | mobile-app eval 세트 | 3파일 존재 | 모두 존재 | P1 |
| TC-EV026 | desktop-app eval 세트 | 3파일 존재 | 모두 존재 | P1 |
| TC-EV027 | claude-code-learning eval 세트 | 3파일 존재 | 모두 존재 | P1 |
| TC-EV028 | 5개 bkend eval 세트 (quickstart, auth, data, cookbook, storage) | 각 3파일 | 모두 존재 | P1 |

### 8.4 Hybrid Eval 세트 (1개)

| TC-ID | 설명 | 검증 방법 | 기대 결과 | 우선순위 |
|-------|------|-----------|-----------|:--------:|
| TC-EV029 | plan-plus hybrid eval 세트 | 3파일 존재 | 모두 존재 | P1 |

### 8.5 Eval YAML 구조

| TC-ID | 설명 | 검증 방법 | 기대 결과 | 우선순위 |
|-------|------|-----------|-----------|:--------:|
| TC-EV030 | 모든 eval.yaml 파일 유효한 YAML | YAML 파싱 | 28개 모두 성공 | P0 |
| TC-EV031 | Workflow eval: 9개 총 개수 | 디렉토리 count | 9 | P0 |
| TC-EV032 | Capability eval: 18개 총 개수 | 디렉토리 count | 18 | P0 |
| TC-EV033 | Hybrid eval: 1개 총 개수 | 디렉토리 count | 1 | P0 |

---

## 9. Skills 2.0 분류 테스트 (TC-SC, gap-detector)

| TC-ID | 설명 | 검증 방법 | 기대 결과 | 우선순위 |
|-------|------|-----------|-----------|:--------:|
| TC-SC001 | 전체 스킬 수 28개 | `ls skills/*/SKILL.md | wc -l` | 28 | P0 |
| TC-SC002 | Workflow 스킬 10개 (pdca, plan-plus, bkit-rules, bkit-templates, development-pipeline, code-review, zero-script-qa, phase-2-convention, phase-8-review, pm-discovery) | 분류 확인 | 10 | P0 |
| TC-SC003 | Capability 스킬 16개 (starter, dynamic, enterprise, phase-1/3/4/5/6/7/9, mobile-app, desktop-app, claude-code-learning, bkend-quickstart/auth/data/cookbook/storage) | 분류 확인 | 16 | P0 |
| TC-SC004 | Hybrid 스킬 2개 (plan-plus가 hybrid이면 재분류 필요) | 분류 확인 | 2 | P0 |
| TC-SC005 | 10+16+2 = 28 검증 | 합산 | 28 | P0 |
| TC-SC006 | Evals 디렉토리 구조가 분류와 일치 | evals/workflow/, capability/, hybrid/ | 일치 | P0 |
| TC-SC007 | 각 Workflow 스킬에 대응하는 eval 존재 | 교차 비교 | 누락 없음 | P1 |
| TC-SC008 | 각 Capability 스킬에 대응하는 eval 존재 | 교차 비교 | 누락 없음 | P1 |
| TC-SC009 | pm-discovery가 Workflow로 분류 | evals/workflow/pm-discovery 존재 | 존재 | P0 |
| TC-SC010 | plan-plus가 Hybrid로 분류 | evals/hybrid/plan-plus 존재 | 존재 | P0 |
| TC-SC011 | 모든 스킬 SKILL.md에 description 필드 | grep 확인 | 28개 모두 존재 | P1 |
| TC-SC012 | context:fork 설정 스킬 식별 | frontmatter 확인 | 해당 스킬 목록화 | P1 |
| TC-SC013 | frontmatter hooks 설정 스킬 식별 | frontmatter 확인 | 해당 스킬 목록화 | P1 |
| TC-SC014 | hot reload 동작 확인 | SKILL.md 수정 후 반영 | 세션 재시작 불필요 | P2 |
| TC-SC015 | Skill Creator eval 실행 가능 | runner.js dry-run | 오류 없음 | P2 |

---

## 10. PM i18n 테스트 (TC-PM-L, product-manager)

| TC-ID | 설명 | 검증 방법 | 기대 결과 | 우선순위 |
|-------|------|-----------|-----------|:--------:|
| TC-PM-L001 | pm-lead EN 트리거: pm, product discovery, PRD | grep 확인 | 모두 존재 | P0 |
| TC-PM-L002 | pm-lead KO 트리거: PM 분석, 제품 기획, PRD 작성 | grep 확인 | 모두 존재 | P0 |
| TC-PM-L003 | pm-lead JA 트리거: PM分析, プロダクト分析 | grep 확인 | 모두 존재 | P0 |
| TC-PM-L004 | pm-lead ZH 트리거: 产品分析, 产品发现 | grep 확인 | 모두 존재 | P0 |
| TC-PM-L005 | pm-lead ES 트리거: análisis PM | grep 확인 | 존재 | P0 |
| TC-PM-L006 | pm-lead FR 트리거: analyse PM | grep 확인 | 존재 | P0 |
| TC-PM-L007 | pm-lead DE 트리거: PM-Analyse | grep 확인 | 존재 | P0 |
| TC-PM-L008 | pm-lead IT 트리거: analisi PM | grep 확인 | 존재 | P0 |
| TC-PM-L009 | AGENT_TRIGGER_PATTERNS에 pm-lead 키 존재 | node require | 존재 | P0 |
| TC-PM-L010 | pm-lead 트리거 8개 언어 모두 보유 | 키 개수 확인 | 8 | P0 |
| TC-PM-L011 | EN 'PRD' 트리거로 pm-lead 감지 | detectAgent('PRD') | pm-lead | P1 |
| TC-PM-L012 | KO '제품 기획' 트리거로 pm-lead 감지 | detectAgent('제품 기획') | pm-lead | P1 |
| TC-PM-L013 | JA 'PM分析' 트리거로 pm-lead 감지 | detectAgent('PM分析') | pm-lead | P1 |
| TC-PM-L014 | ZH '产品管理' 트리거로 pm-lead 감지 | detectAgent('产品管理') | pm-lead | P1 |
| TC-PM-L015 | session-start.js에 PM 트리거 행 포함 | grep 확인 | pm, PRD, product discovery | P0 |
| TC-PM-L016 | 기존 16개 에이전트 트리거 영향 없음 (회귀) | 전체 트리거 확인 | 기존 트리거 유지 | P0 |

---

## 11. PM Team Strategy 테스트 (TC-PM-T, qa-strategist)

| TC-ID | 설명 | 검증 방법 | 기대 결과 | 우선순위 |
|-------|------|-----------|-----------|:--------:|
| TC-PM-T001 | Enterprise teammates에 pm 역할 존재 | node require | name:'pm' 존재 | P0 |
| TC-PM-T002 | Enterprise pm 역할의 agents 배열 | 확인 | ['pm-lead'] | P0 |
| TC-PM-T003 | Enterprise pm 역할의 phases 배열 | 확인 | ['pm'] | P0 |
| TC-PM-T004 | Enterprise teammates 총 6개 (기존 5 + pm) | count | 6 | P0 |
| TC-PM-T005 | Dynamic phaseStrategy에 pm: 'single' | grep 확인 | 존재 | P0 |
| TC-PM-T006 | Enterprise phaseStrategy에 pm: 'single' | grep 확인 | 존재 | P0 |
| TC-PM-T007 | Dynamic teammates에 pm 역할 미포함 (3명 유지) | count | 3 (developer, frontend, qa) | P1 |
| TC-PM-T008 | Starter level에서 Team Mode 불가 | detectLevel | 차단 | P1 |
| TC-PM-T009 | Enterprise pm 역할 description | 확인 | PM analysis 관련 | P1 |
| TC-PM-T010 | Team strategy pm phase에서 single 모드 | 확인 | pm-lead 단독 실행 | P1 |
| TC-PM-T011 | CTO Lead가 PM 역할 조율 가능 | 로직 확인 | pm 태스크 할당 | P1 |
| TC-PM-T012 | pm 역할이 기존 역할과 충돌 없음 | 역할 목록 | 중복 없음 | P0 |

---

## 12. Session-Start PM 테스트 (TC-SS, qa-monitor)

| TC-ID | 설명 | 검증 방법 | 기대 결과 | 우선순위 |
|-------|------|-----------|-----------|:--------:|
| TC-SS001 | session-start.js Agent Triggers 테이블에 PM 행 | grep 확인 | pm, PRD, product discovery | P0 |
| TC-SS002 | agent scope count: 19 agents | grep 확인 | '19 agents' | P0 |
| TC-SS003 | phaseDisplay에 pm: 'PM Discovery' 존재 | grep 확인 | 존재 | P0 |
| TC-SS004 | session-start.js 구문 유효 | `node -c session-start.js` | 오류 없음 | P0 |
| TC-SS005 | PM 관련 변경이 기존 SessionStart 흐름 영향 없음 | 전체 실행 | 기존 출력 유지 | P0 |
| TC-SS006 | 활성 feature의 pm phase 표시 | phaseDisplay 매핑 | 'PM Discovery' 표시 | P1 |
| TC-SS007 | PM feature 진행 중일 때 "Continue" 옵션 | AskUserQuestion | pm phase 컨텍스트 | P1 |
| TC-SS008 | v1.6.0 Enhancement 목록에 PM Team 포함 | 출력 확인 | PM Agent Team 언급 | P1 |
| TC-SS009 | agent count 21 표기 (bkit-system 관련) | context-engineering.md | '21 Agents' | P1 |
| TC-SS010 | skill count 28 표기 | context-engineering.md | '28 skills' | P1 |

---

## 13. 회귀 테스트 (TC-RG, qa-strategist)

| TC-ID | 설명 | 검증 방법 | 기대 결과 | 우선순위 |
|-------|------|-----------|-----------|:--------:|
| TC-RG001 | 기존 PDCA 6단계 사이클 정상 (plan→design→do→check→act→report) | E2E 시나리오 | 기존 흐름 유지 | P0 |
| TC-RG002 | common.js export 총 수 ~205개 이상 | node require | >= 199 | P0 |
| TC-RG003 | 기존 27개 스킬 정상 로드 | SKILL.md 구문 확인 | 27개 오류 없음 | P0 |
| TC-RG004 | 기존 16개 에이전트 정상 | agents/*.md 존재 | 16개 존재 | P0 |
| TC-RG005 | Executive Summary 모듈 정상 (v1.5.9) | node require | 3개 함수 존재 | P0 |
| TC-RG006 | AskUserQuestion Preview 정상 (v1.5.9) | buildNextActionQuestion | preview 필드 존재 | P0 |
| TC-RG007 | hooks.json 10개 이벤트 유지 | JSON 파싱 | 10 이벤트 | P0 |
| TC-RG008 | 출력 스타일 4개 유지 | 파일 존재 | 4개 .md | P0 |
| TC-RG009 | 메모리 시스템 (bkit + CC auto-memory) 분리 유지 | 경로 확인 | 충돌 없음 | P0 |

---

## 14. 코어 시스템 테스트 (TC-CS, code-analyzer)

### 14.1 플랫폼 & 캐시

| TC-ID | 설명 | 우선순위 |
|-------|------|:--------:|
| TC-CS001 | platform.js: PROJECT_DIR 반환 | P0 |
| TC-CS002 | platform.js: PLUGIN_ROOT 반환 | P0 |
| TC-CS003 | platform.js: IS_PLUGIN 감지 | P0 |
| TC-CS004 | cache.js: getCache/setCache 기본 동작 | P0 |
| TC-CS005 | cache.js: TTL 만료 | P1 |
| TC-CS006 | cache.js: clearCache 동작 | P1 |

### 14.2 I/O, 디버그, 설정, 파일

| TC-ID | 설명 | 우선순위 |
|-------|------|:--------:|
| TC-CS007 | io.js: readStdinSync 동작 | P0 |
| TC-CS008 | io.js: emitUserPrompt 구조 | P0 |
| TC-CS009 | debug.js: debugLog 활성화/비활성화 | P0 |
| TC-CS010 | debug.js: BKIT_DEBUG 환경변수 | P1 |
| TC-CS011 | config.js: getConfig 기본값 | P0 |
| TC-CS012 | config.js: getBkitConfig 파일 로드 | P0 |
| TC-CS013 | config.js: 중첩 키 접근 (pdca.docPaths.pm) | P0 |
| TC-CS014 | file.js: readJsonFile 동작 | P0 |
| TC-CS015 | file.js: writeJsonFile 동작 | P0 |
| TC-CS016 | file.js: 존재하지 않는 파일 처리 | P1 |

### 14.3 경로 (paths.js)

| TC-ID | 설명 | 우선순위 |
|-------|------|:--------:|
| TC-CS017 | STATE_PATHS.root() 경로 | P0 |
| TC-CS018 | STATE_PATHS.pdcaStatus() 경로 | P0 |
| TC-CS019 | STATE_PATHS.memory() 경로 | P0 |
| TC-CS020 | STATE_PATHS.agentState() 경로 | P0 |
| TC-CS021 | LEGACY_PATHS 정의 (deprecated) | P1 |
| TC-CS022 | CONFIG_PATHS.bkitConfig() 경로 | P0 |
| TC-CS023 | ensureBkitDirs() 디렉토리 생성 | P0 |
| TC-CS024 | getDocPaths() 모든 phase 반환 (pm 포함) | P0 |
| TC-CS025 | resolveDocPaths() 절대 경로 생성 | P0 |
| TC-CS026 | findDoc() 존재하는 문서 찾기 | P1 |
| TC-CS027 | findDoc() 없는 문서 빈 문자열 | P1 |
| TC-CS028 | getArchivePath() 날짜 형식 | P1 |

### 14.4 index.js (코어 재export)

| TC-ID | 설명 | 우선순위 |
|-------|------|:--------:|
| TC-CS029~CS050 | core/index.js에서 주요 함수 재export 확인 (22개) | P0/P1 |

---

## 15. 인텐트 시스템 테스트 (TC-IN, product-manager)

| TC-ID | 설명 | 우선순위 |
|-------|------|:--------:|
| TC-IN001 | AGENT_TRIGGER_PATTERNS 키 개수 (pm-lead 포함) | P0 |
| TC-IN002~IN008 | 기존 7개 에이전트 트리거 유지 (gap-detector, pdca-iterator, code-analyzer, report-generator, starter-guide, bkend-expert, pm-lead) | P0 |
| TC-IN009~IN016 | 각 에이전트 8개 언어 트리거 존재 | P0 |
| TC-IN017 | SKILL_TRIGGER_PATTERNS 키 개수 | P0 |
| TC-IN018~IN021 | 4개 스킬 트리거 유지 (starter, dynamic, enterprise, mobile-app) | P0 |
| TC-IN022 | detectAgentFromInput() 기능 | P0 |
| TC-IN023 | detectSkillFromInput() 기능 | P0 |
| TC-IN024 | ambiguity.js: detectAmbiguity() | P1 |
| TC-IN025 | ambiguity.js: generateClarifyingQuestion() | P1 |
| TC-IN026 | trigger.js: matchTrigger() | P0 |
| TC-IN027~IN035 | 엣지 케이스: 대소문자, 부분 매칭, 다중 매칭 | P1/P2 |

---

## 16-29. 전체 커버리지 카테고리 (요약)

> 상세 TC는 설계서(Design document)에서 정의. 여기서는 카테고리별 TC 수와 담당만 명시.

| 섹션 | 카테고리 | TC 수 | 담당 |
|:----:|----------|:-----:|------|
| 16 | 태스크 시스템 (classification, context, creator, tracker) | 25 | code-analyzer |
| 17 | 팀 시스템 (coordinator, strategy, orchestrator, communication, queue, cto, state, hooks) | 32 | code-analyzer |
| 18 | PDCA 전체 시스템 (tier, level, phase, status, automation, executive-summary, template-validator) | 28 | code-analyzer |
| 19 | 스킬 시스템 (28개 스킬 SKILL.md 구조, frontmatter, imports) | 28 | gap-detector |
| 20 | 에이전트 시스템 (21개 에이전트 구조, frontmatter, hooks, model) | 21 | gap-detector |
| 21 | 설정 시스템 (plugin.json, bkit.config.json, hooks.json) | 12 | infra-architect |
| 22 | 템플릿 시스템 (15개 템플릿 구조, 필수 섹션, 변수) | 28 | gap-detector |
| 23 | 출력 스타일 (4개 스타일 파일, 구조, 레벨 매핑) | 6 | qa-monitor |
| 24 | PDCA 레벨 E2E (Starter/Dynamic/Enterprise 각 워크플로) | 15 | product-manager |
| 25 | i18n 전체 (8개 언어 x 에이전트+스킬 트리거 정확성) | 18 | product-manager |
| 26 | 메모리 시스템 (bkit memory, CC auto-memory, agent memory) | 11 | infra-architect |
| 27 | 스크립트 시스템 (46개 스크립트 구문 유효성, require 체인) | 35 | qa-monitor |
| 28 | 보안 검증 (권한 관리, 입력 검증, 경로 주입 방지) | 12 | security-architect |
| 29 | 경로 & 파일 시스템 (paths.js 전체, legacy migration, ensureBkitDirs) | 16 | infra-architect |

---

## 30-38. 철학 & 컨텍스트 엔지니어링 카테고리 (요약)

| 섹션 | 카테고리 | TC 수 | 담당 |
|:----:|----------|:-----:|------|
| 30 | 핵심 철학: 자동화 우선, 추측 금지, 문서=코드 (PM Phase 포함) | 18 | product-manager |
| 31 | 컨텍스트 엔지니어링: 8개 FR (계층, import, fork, 훅, 권한, 태스크, 압축, 메모리) | 33 | code-analyzer |
| 32 | 6계층 훅 시스템: Layer 1-6 순서 및 PM hook 통합 | 8 | qa-monitor |
| 33 | 동적 컨텍스트 주입: 4가지 패턴 (태스크 크기, 의도, 모호성, 일치율) + PM 패턴 | 20 | product-manager |
| 34 | AI 네이티브 원칙: 핵심 역량, 레벨 여정, 언어 티어, 에이전트 모델 (21개) | 20 | gap-detector |
| 35 | PDCA 방법론: 7단계(PM 포함), 파이프라인 관계, Check-Act 루프, 아카이브 | 18 | gap-detector |
| 36 | 오케스트레이션 패턴: leader/council/swarm/watchdog + PM single | 10 | qa-strategist |
| 37 | 출력 스타일 컨텍스트: 레벨 맞춤 출력 스타일 주입 | 5 | qa-monitor |
| 38 | 응답 리포트 규칙: 기능 사용 리포트 구조 및 정확성 | 4 | qa-monitor |

---

## 39. 성공 기준

### 39.1 통과 기준

| 지표 | 목표 |
|------|:----:|
| P0 TC 통과율 | **100%** |
| P1 TC 통과율 | **≥ 95%** |
| P2 TC 통과율 | **≥ 90%** |
| 전체 통과율 | **≥ 97%** |
| SKIP 허용 | ≤ 20 TC |
| FAIL 허용 | 0 (P0), ≤ 5 (P1), ≤ 5 (P2) |

### 39.2 품질 게이트

| 게이트 | 조건 | 차단 여부 |
|--------|------|:---------:|
| G1: Unit 테스트 | P0 Unit TC 100% PASS | 차단 |
| G2: Integration 테스트 | P0 Integration TC 100% PASS | 차단 |
| G3: E2E 테스트 | 전체 PDCA 사이클 (PM→Report) 성공 | 차단 |
| G4: 회귀 테스트 | v1.5.9 기능 100% 보존 | 차단 |
| G5: 보안 테스트 | 보안 취약점 0개 | 차단 |

---

## 40. 위험 및 완화

| # | 위험 | 영향 | 완화 |
|---|------|------|------|
| 1 | PM Agent Team이 CC v2.1.71 미만에서 동작 불가 | 높음 | CC 버전 체크 후 SKIP 처리 |
| 2 | `claude -p` 비대화형 모드에서 스킬 호출 제한 | 중간 | node require 기반 검증으로 대체 |
| 3 | Agent Teams 환경변수 미설정 시 Team 테스트 실패 | 높음 | 테스트 전 CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 확인 |
| 4 | Evals runner가 실제 claude API 호출 필요 | 중간 | dry-run 모드 또는 구문 검증만 수행 |
| 5 | 8명 에이전트 병렬 실행 시 메모리 부하 | 중간 | 3-4명씩 단계별 실행 |
| 6 | PM 통합 코드가 기존 PDCA 흐름에 side effect | 높음 | 회귀 테스트(TC-RG) 우선 실행 |

---

## 41. 테스트 실행 계획

### 41.1 Task Management 구조

```
[CTO 리드] bkit v1.6.0 종합 테스트 관리
├─ [Task-1] Unit 테스트 (code-analyzer)
│  ├─ TC-PM-C: PM Core 통합 (28 TC)
│  ├─ TC-TV: Template Validator PRD (12 TC)
│  └─ TC-CS: 코어 시스템 (50 TC)
├─ [Task-2] PM 에이전트 테스트 (product-manager)
│  ├─ TC-PM-A: PM Agent Team (30 TC)
│  ├─ TC-PM-L: PM i18n (16 TC)
│  └─ TC-IN: 인텐트 시스템 (35 TC)
├─ [Task-3] Hook/Script 테스트 (qa-monitor)
│  ├─ TC-PM-H: PM Stop/Hook (18 TC)
│  ├─ TC-SS: Session-Start PM (10 TC)
│  └─ TC-SCR: 스크립트 시스템 (35 TC)
├─ [Task-4] E2E & 스킬 테스트 (gap-detector)
│  ├─ TC-SC: Skills 2.0 분류 (15 TC)
│  ├─ TC-SK: 스킬 시스템 (28 TC)
│  └─ TC-AG: 에이전트 시스템 (21 TC)
├─ [Task-5] Evals 프레임워크 (frontend-architect)
│  └─ TC-EV: Evals 프레임워크 (28 TC → 33 TC 포함 YAML)
├─ [Task-6] 회귀 & 전략 (qa-strategist)
│  ├─ TC-RG: 회귀 (9 TC)
│  ├─ TC-PM-T: PM Team Strategy (12 TC)
│  └─ TC-OP: 오케스트레이션 패턴 (10 TC)
├─ [Task-7] 보안 검증 (security-architect)
│  └─ TC-SEC: 보안 검증 (12 TC)
├─ [Task-8] 인프라 검증 (infra-architect)
│  ├─ TC-CF: 설정 시스템 (12 TC)
│  ├─ TC-MEM: 메모리 시스템 (11 TC)
│  └─ TC-FS: 경로 & 파일 시스템 (16 TC)
└─ [Task-9] 철학 & CE (전체 팀 분담)
   ├─ TC-PH~DI: 철학, CE, 훅 계층, 동적 주입 (79 TC)
   ├─ TC-AN~PMT: AI 네이티브, PDCA 방법론 (38 TC)
   └─ TC-OP~RR: 오케스트레이션, 출력 스타일, 리포트 (19 TC)
```

### 41.2 테스트 스크립트 필요 목록

| # | 스크립트명 | 용도 | TC 범위 |
|---|-----------|------|---------|
| 1 | `test-scripts/test-pm-integration.sh` | PM Core 통합 검증 (node require + grep) | TC-PM-C |
| 2 | `test-scripts/test-pm-agents.sh` | PM 에이전트 존재/구조 검증 | TC-PM-A |
| 3 | `test-scripts/test-template-validator.sh` | Template Validator PRD 검증 | TC-TV |
| 4 | `test-scripts/test-evals-framework.sh` | Evals 파일 존재/구문 검증 | TC-EV |
| 5 | `test-scripts/test-skills-classification.sh` | Skills 2.0 분류 교차 검증 | TC-SC |
| 6 | `test-scripts/test-exports-v160.sh` | common.js export 총 수 + PM export 확인 | TC-CS, TC-RG |
| 7 | `test-scripts/test-i18n-pm.sh` | PM 8개 언어 트리거 검증 | TC-PM-L |
| 8 | `test-scripts/test-hooks-pm.sh` | PM Stop handler + frontmatter 검증 | TC-PM-H |
| 9 | `test-scripts/test-scripts-syntax.sh` | 46개 스크립트 구문 유효성 (`node -c`) | TC-SCR |
| 10 | `test-scripts/test-security.sh` | 보안 패턴 grep 검증 | TC-SEC |

---

## Version History

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 0.1 | 2026-03-07 | 초안 작성: 706 TC, 39개 카테고리, 9개 에이전트 |
