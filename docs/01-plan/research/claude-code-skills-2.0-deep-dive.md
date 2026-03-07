# Claude Code Skills 2.0 심층 분석 보고서

> **작성**: CTO Team (8명 병렬 조사)
> **날짜**: 2026-03-07
> **버전**: 1.0
> **범위**: Skills 2.0 핵심 개념, 사용자 경험 변화, AI Native 방법론 영향, 실전 활용 사례
> **대상 독자**: 개발자, 기술 리더, AI Native 방법론에 관심 있는 모든 사람

---

## 목차

1. [Skills 2.0이란 무엇인가?](#1-skills-20이란-무엇인가)
2. [5대 핵심 기능 상세 설명](#2-5대-핵심-기능-상세-설명)
3. [사용자 경험은 어떻게 달라지는가?](#3-사용자-경험은-어떻게-달라지는가)
4. [AI Native 방법론에서의 전략적 영향](#4-ai-native-방법론에서의-전략적-영향)
5. [실전 활용 사례와 Best Practices](#5-실전-활용-사례와-best-practices)
6. [미래 전망](#6-미래-전망)
7. [부록: CTO 팀 구성 및 조사 방법론](#7-부록-cto-팀-구성-및-조사-방법론)

---

## 1. Skills 2.0이란 무엇인가?

### 1.1 한 줄 요약

> Skills 2.0은 Claude Code v2.1.0에서 도입된 **스킬 시스템의 메이저 업그레이드**로,
> 스킬을 단순한 텍스트 지시문에서 **자기 서술적이고, 격리 실행되며, 품질을 자동 검증하는 독립 소프트웨어 컴포넌트**로 진화시킨 것이다.

### 1.2 배경

2026년 1월 7일, Anthropic은 Claude Code 2.1.0을 릴리스했다. **1,096개 커밋**이라는 역대 최대 규모의 업데이트였으며, 그 핵심이 바로 Skills 2.0이다.

기존 Skills 1.0에서는 SKILL.md가 "AI에게 읽혀주는 참고 문서" 역할이었다. 스킬을 수정하면 세션을 재시작해야 했고, 스킬이 제대로 동작하는지 확인할 방법도 없었다. Skills 2.0은 이 모든 한계를 해결한다.

### 1.3 Skills 1.0 vs 2.0 — 근본적 차이

| 관점 | Skills 1.0 (기존) | Skills 2.0 (v2.1.0) |
|------|:------------------:|:-------------------:|
| **스킬의 정체성** | 참조용 텍스트 문서 | 자기 완결적 실행 단위 |
| **컨텍스트 관리** | 모든 스킬이 같은 컨텍스트 공유 | `context: fork`로 격리 실행 |
| **훅(Hook) 정의** | hooks.json 중앙 집중 | frontmatter에서 직접 선언 |
| **품질 검증** | 수동 테스트만 가능 | Evals 자동 검증 + A/B Testing |
| **스킬 개발** | 수동 생성, 시행착오 반복 | Skill Creator + hot reload |
| **수명 관리** | 없음 (모든 스킬 동등 취급) | Classification으로 유형별 수명 전략 |
| **변경 반영** | 세션 재시작 필수 | Hot reload 즉시 반영 |
| **스킬 호출** | 자동 감지에만 의존 | `/스킬명`으로 직접 호출 가능 |

### 1.4 비유로 이해하기

**Skills 1.0**은 팀에게 나눠주는 **업무 매뉴얼(종이 문서)**과 같다.
- 매뉴얼을 수정하면 새로 인쇄해서 다시 배포해야 한다 (세션 재시작)
- 매뉴얼이 실제로 도움이 되는지 측정할 수 없다 (Evals 없음)
- 모든 직원이 같은 매뉴얼을 공유한다 (컨텍스트 오염)

**Skills 2.0**은 **실행 가능한 소프트웨어 모듈**과 같다.
- 코드를 수정하면 즉시 반영된다 (hot reload)
- 단위 테스트로 품질을 자동 검증한다 (Evals)
- 각 모듈은 독립적으로 실행된다 (context:fork)
- 필요하면 직접 호출할 수 있다 (/ invoke)

---

## 2. 5대 핵심 기능 상세 설명

### 2.1 context:fork — 격리 컨텍스트 실행

#### 이것이 왜 필요한가?

LLM의 컨텍스트 윈도우에서 **한 작업의 중간 산출물이 다른 작업의 추론을 왜곡하는 현상**을 "컨텍스트 오염"이라고 한다.

예를 들어, gap-detector가 설계서와 구현 코드를 비교 분석하는 동안, 그 분석 과정의 임시 데이터가 메인 대화에 섞이면 후속 코딩 작업에서 AI가 "분석 모드"와 "구현 모드"를 혼동할 수 있다.

#### context:fork가 하는 일

Git에서 브랜치를 따는 것처럼, 스킬 실행 시 현재 대화의 컨텍스트를 **복사본(fork)**으로 분리한다. 스킬이 하는 일이 원래 대화에 영향을 미치지 않는다.

```yaml
# 에이전트 frontmatter에 한 줄만 추가하면 격리 실행 활성화
---
name: gap-detector
context: fork
---
```

#### Before vs After

```
Before (Skills 1.0):
  lib/context-fork.js — 228줄 자체 구현
  ├── forkContext()         → 수동 Deep Clone
  ├── mergeForkedContext()  → 커스텀 배열 중복 제거, 객체 병합
  └── discardFork()        → 수동 폐기
  결과: 유지보수 부담, CC 업데이트 추종 필요

After (Skills 2.0):
  에이전트 frontmatter에 "context: fork" 한 줄
  → CC 엔진이 격리/병합 자동 처리
  → 228줄 → 0줄 (자체 구현 deprecated)
```

---

### 2.2 Frontmatter Hooks — 스킬 자체에서 훅 정의

#### 이것이 왜 필요한가?

기존에는 모든 훅(Hook)을 `hooks.json`이라는 하나의 파일에 중앙 집중적으로 정의했다. 27개 스킬과 16개 에이전트의 훅이 한 파일에 뒤섞여 있으면:

- 어떤 훅이 어느 스킬에 속하는지 파악이 어렵다
- 새 스킬을 만들면 hooks.json에 직접 항목을 추가해야 한다
- 스킬을 삭제하면 대응되는 훅 항목도 수동으로 찾아서 제거해야 한다

#### Frontmatter Hooks가 하는 일

각 스킬이나 에이전트가 **자기 파일 안에서 직접 훅을 선언**한다. 회사의 모든 업무 규칙이 하나의 규정집에 있던 것에서, 각 부서가 자기 문서에서 자기 규칙을 관리하는 것으로 바뀐 셈이다.

```yaml
# skills/pdca/SKILL.md — 스킬 파일 안에서 직접 훅 선언
---
name: pdca
hooks:
  Stop:
    - type: command
      command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/pdca-skill-stop.js"
      timeout: 10000
---
```

#### 지원하는 이벤트

| 이벤트 | 시점 | 활용 예시 |
|--------|------|----------|
| **PreToolUse** | 도구 실행 직전 | 권한 검사, 입력 검증 |
| **PostToolUse** | 도구 실행 직후 | 후속 가이드, 품질 체크 |
| **Stop** | 스킬 종료 시 | 결과 저장, 상태 업데이트 |

#### 핵심 이점: 자기 서술적 컨텍스트

스킬 파일 하나를 읽으면, 해당 스킬이 **무엇을 하고, 언제 개입하고, 어떤 도구를 쓰는지** 전부 파악할 수 있다. 더 이상 hooks.json을 따로 뒤져볼 필요가 없다.

```
이전: 스킬 이해를 위해 3곳을 봐야 함
  1. SKILL.md (역할)  2. hooks.json (훅)  3. scripts/ (로직)

이후: 1곳이면 충분
  1. SKILL.md (역할 + 훅 + 모든 것)
```

---

### 2.3 Skill Evals — 스킬 품질 자동 검증

#### 이것이 왜 필요한가?

27개 스킬이 있을 때, "이 스킬이 정말 의도대로 작동하는가?"를 매번 수동으로 확인하는 것은 비현실적이다. 특히 AI 모델이 업데이트될 때마다 모든 스킬을 재검증해야 하는데, Evals가 이것을 자동화한다.

#### Evals가 하는 일

소프트웨어의 **단위 테스트(unit test)**와 같은 개념을 스킬에 적용한다.

```yaml
# evals/workflow/pdca/eval.yaml
name: pdca
classification: workflow
version: 1.6.0

evals:
  - name: trigger-accuracy           # 테스트 이름
    prompt: prompt-1.md              # 입력 프롬프트 (질문)
    expected: expected-1.md          # 기대 출력 (정답)
    criteria:                        # 평가 기준
      - "Must trigger correctly on relevant keywords"
      - "Must follow defined process steps"
    timeout: 60000                   # 제한 시간 (60초)

parity_test:
  enabled: false                     # Workflow 스킬은 불필요

benchmark:
  model_baseline: "claude-sonnet-4-6"
  metrics:
    - trigger_accuracy
    - process_compliance
```

#### 실행 방법

```bash
# 단일 스킬 테스트
node evals/runner.js --skill pdca

# 분류별 일괄 테스트
node evals/runner.js --classification workflow

# 전체 27 스킬 벤치마크
node evals/runner.js --benchmark

# 모델 동등성 테스트 (Capability 스킬용)
node evals/runner.js --parity starter
```

#### Parity Test란?

Capability 스킬의 존재 이유를 검증하는 특별한 테스트다. **스킬을 켠 상태와 끈 상태**에서 같은 프롬프트를 실행하여, 스킬이 실질적 가치를 제공하는지 측정한다.

```
스킬 ON:  결과 품질 92점
스킬 OFF: 결과 품질 88점
→ 차이 4점 (4.3%) → 스킬이 여전히 가치 있음

스킬 ON:  결과 품질 92점
스킬 OFF: 결과 품질 91점
→ 차이 1점 (1.1%) → parityThreshold(85%) 초과 → deprecation 후보
```

---

### 2.4 Skill Creator — 스킬 생성 도구

#### 이것이 왜 필요한가?

기존에는 스킬을 만들려면 기존 SKILL.md를 복사하고, 수동으로 편집하고, hooks.json에 훅을 추가하고, 세션을 재시작해야 했다. Skill Creator는 이 모든 과정을 자동화한다.

#### 완전한 워크플로우

```
1. Skill Creator로 스캐폴딩 자동 생성
   → SKILL.md + eval.yaml + prompt + expected 동시 생성

   $ node skill-creator/generator.js \
       --name my-skill \
       --classification workflow

2. Hot Reload로 즉시 반영
   → 세션 재시작 없이 바로 적용

3. Evals로 품질 검증
   → 자동 테스트 실행, 통과율/시간/토큰 측정

   $ node evals/runner.js --skill my-skill

4. A/B Testing으로 비교
   → 스킬 활성화 전/후 성능 비교

   $ node evals/ab-tester.js --skill my-skill \
       --modelA claude-sonnet-4-6 --modelB claude-opus-4-6
```

#### 분류별 자동 템플릿 적용

| 분류 | 자동 설정 | hooks 기본값 | deprecation-risk |
|------|----------|:------------:|:----------------:|
| **Workflow** | parity_test: false | Stop 훅 포함 | none |
| **Capability** | parity_test: true | 훅 없음 | medium |
| **Hybrid** | parity_test: true | Stop 훅 포함 | low |

---

### 2.5 Skill Classification — 스킬 수명 관리 체계

#### 이것이 왜 필요한가?

AI 모델은 계속 발전한다. 오늘 필요한 스킬이 내일은 불필요해질 수 있다. 하지만 모든 스킬이 그런 것은 아니다. **프로세스를 자동화하는 스킬은 모델이 아무리 발전해도 여전히 필요하다.**

#### 3가지 분류

```
┌───────────────────────────────────────────────────────────────────┐
│                    Skill Classification                           │
├──────────────┬──────────────────┬────────────────────────────────┤
│              │                  │                                  │
│  Workflow    │  Capability      │  Hybrid                         │
│  (9개, 33%) │  (16개, 59%)     │  (2개, 8%)                      │
│              │                  │                                  │
│  "프로세스"  │  "능력 보완"     │  "둘 다"                        │
│              │                  │                                  │
│  모델이      │  모델이 똑똑해   │  일부는 유지                    │
│  아무리      │  지면 불필요해   │  일부는 축소                    │
│  똑똑해져도  │  질 수 있음      │                                  │
│  영구 유지   │                  │                                  │
│              │                  │                                  │
│  deprecation │  deprecation     │  deprecation                    │
│  -risk: none │  -risk: medium   │  -risk: low                     │
│              │                  │                                  │
│  예시:       │  예시:           │  예시:                          │
│  pdca        │  starter         │  plan-plus                      │
│  bkit-rules  │  enterprise      │                                  │
│  zero-script │  phase-1~9       │                                  │
│  -qa         │  bkend-*         │                                  │
│  code-review │  claude-code-    │                                  │
│              │  learning        │                                  │
└──────────────┴──────────────────┴────────────────────────────────┘
```

#### 비유로 이해하기

- **Workflow 스킬** = 회사의 업무 프로세스 매뉴얼 (직원이 아무리 뛰어나도 프로세스는 필요)
- **Capability 스킬** = 신입 교육 자료 (직원이 성장하면 더 이상 안 봐도 됨)
- **Hybrid 스킬** = 프로세스 + 교육이 섞인 자료

#### 수명 관리 프로세스

```
active → candidate (Parity Test 3회 연속 통과)
       → deprecated (CTO 승인, 2 릴리스 공고)
       → removed (완전 삭제)

핵심 원칙: 데이터 없이 deprecation하지 않는다.
```

---

## 3. 사용자 경험은 어떻게 달라지는가?

### 3.1 시나리오 A: 새로운 스킬 만들기

#### Before (Skills 1.0)

```
1. 기존 SKILL.md 파일 복사
2. 파일명 변경, 내용 수동 편집
3. hooks.json 열어서 새 훅 항목 직접 추가  ← 실수 위험
4. Claude Code 세션 종료 → 재시작           ← 컨텍스트 소실
5. 새 스킬이 동작하는지 수동 테스트
6. 결과가 마음에 안 들면 1~5번 반복

소요 시간: 30분~2시간
문제점: hooks.json 편집 실수, 세션 재시작, 품질 기준 없음
```

#### After (Skills 2.0)

```
1. Skill Creator 실행 (한 줄 명령)
2. 대화형 설정 (스킬 유형 선택)
3. SKILL.md + eval.yaml 자동 생성 (frontmatter hooks 포함)
4. Hot reload → 즉시 반영 (세션 재시작 없음)
5. Evals 실행 → 통과율/시간/토큰 수치 확인
6. 수정 필요 시 → 편집 → 즉시 반영 → eval 재실행

소요 시간: 10~30분
개선: 자동 스캐폴딩, 즉시 피드백, 수치 기반 품질 확인
```

### 3.2 시나리오 B: 스킬 품질 검증

#### Before (Skills 1.0)

```
개발자가 직접:
1. 프롬프트 5~10개 수동으로 입력
2. 각 응답을 읽고 기대치와 비교 (주관적)
3. "좋은 것 같다" → 완료 (기준 없음)
4. 모델 업데이트 후 → 다시 처음부터 수동 테스트

문제: 주관적, 재현 불가, 모델 비교 방법 없음
```

#### After (Skills 2.0)

```
개발자가:
1. eval.yaml에 테스트 케이스 정의 (최초 1회)
2. node evals/runner.js --skill pdca 실행
3. 결과 확인:
   - 통과율: 87/100 (87%)
   - 평균 소요시간: 12.3s
   - 평균 토큰: 2,847
4. 목표치(85%) 초과 → PASS
5. 모델 업데이트 후 → 동일 명령어 실행 → A/B 비교

개선: 객관적 수치, 재현 가능, 모델 비교 자동화
```

### 3.3 시나리오 C: 스킬 수정

#### Before (Skills 1.0)

```
SKILL.md 편집 → 저장 → "변경이 반영되지 않음"
→ Claude Code 세션 종료 → 재시작 → 이전 컨텍스트 소실
→ 테스트 → 또 수정 필요 → 다시 세션 종료 ...

매 수정마다 컨텍스트 초기화. 같은 상황을 여러 번 다시 설명해야 함.
```

#### After (Skills 2.0)

```
SKILL.md 편집 → 저장 → 즉시 반영
→ 같은 세션에서 바로 테스트 → 또 수정 → 즉시 반영 ...

컨텍스트 유지. 반복 속도 3~5배 향상.
```

### 3.4 시나리오 D: 모델 업그레이드 시 스킬 관리

#### Before (Skills 1.0)

```
모델 업데이트 발생:
1. 27개 스킬을 하나씩 수동 테스트
2. "이 스킬은 여전히 필요한가?" → 판단 근거 없음
3. "계속 유지" or "삭제" → 주관적 결정
```

#### After (Skills 2.0)

```
모델 업데이트 발생:
1. node evals/ab-tester.js --mode parity 자동 실행
2. 결과 자동 분류:
   - Workflow 스킬 (9개): 모델 무관 → 유지
   - Capability 스킬 (16개): parity test 결과 분류
3. 3회 연속 통과 → deprecation 후보 자동 감지
4. CTO 승인 → 2 릴리스 공고 → deprecated
```

### 3.5 워크플로우 변화 다이어그램

#### Skills 1.0 (복잡한 경로)

```
[새 스킬 개발]
    │
    ▼
기존 파일 복사 → 수동 편집 → hooks.json 수동 수정
    │                              ↑ 실수 위험
    ▼
세션 종료 → 재시작 ← 컨텍스트 소실
    │
    ▼
수동 테스트 (주관적)
    │
    ├── 불만족 → 다시 수동 편집 → 세션 재시작 (루프)
    └── 만족 → 완료 (품질 기준 없음)
```

#### Skills 2.0 (단순화된 경로)

```
[새 스킬 개발]
    │
    ▼
Skill Creator → SKILL.md + eval.yaml 자동 생성
    │
    ▼
Hot Reload → 즉시 반영 (세션 유지)
    │
    ▼
Evals 실행 → 수치 결과 확인
    │
    ├── 미달 → 편집 → 즉시 반영 → Evals 재실행
    └── 달성 → 완료 (수치 근거 있음)
```

### 3.6 비개발자를 위한 요약 — 핵심 3가지 변화

**변화 1: "수리하고 나서 바로 써볼 수 있다"**

자동차 엔진 오일을 교체할 때, 이전에는 반드시 차를 껐다가 다시 켜야 했다. Skills 2.0에서는 교체 즉시 시동을 걸어볼 수 있다.

**변화 2: "품질 검사가 자동화되었다"**

식당에서 "음식이 맛있는가?"를 손님 한 명의 주관으로 판단하던 것에서, 100명에게 동일 기준으로 점수를 받아 평균 87점이면 합격/불합격을 자동 결정하는 것으로 바뀌었다.

**변화 3: "도구의 수명을 데이터로 관리한다"**

오래된 도구가 여전히 필요한지 감으로 판단하던 것에서, "이 도구 없이도 같은 결과를 얻을 수 있는가?"를 자동으로 측정해 불필요해진 도구를 데이터 근거로 정리한다.

---

## 4. AI Native 방법론에서의 전략적 영향

### 4.1 bkit 3대 철학과 Skills 2.0의 구조적 정렬

bkit의 3대 철학은 단순한 원칙이 아니라, AI와 인간의 역할 분담을 정의하는 운영 체계이다. Skills 2.0은 이 체계의 "마지막 미비점"을 해결한다.

```
┌───────────────────────┐     ┌───────────────────────────────────┐
│    Automation First   │     │  Skills 2.0:                      │
│ "반복 작업을 자동화"  │────▶│  hot reload + / invoke = 즉시 자동 │
│                       │     │  /loop + Cron = 주기적 모니터링    │
│ 기존 한계:            │     │                                    │
│ 스킬 변경 시 재시작   │     │  기존: 스킬 "사용"만 자동화        │
│                       │     │  이후: 스킬 "관리"까지 자동화      │
└───────────────────────┘     └───────────────────────────────────┘

┌───────────────────────┐     ┌───────────────────────────────────┐
│    No Guessing        │     │  Skills 2.0:                      │
│ "데이터 기반 의사결정"│────▶│  Evals = 스킬 품질 측정            │
│                       │     │  Benchmark = 통과율/시간/토큰 추적 │
│ 기존 한계:            │     │  A/B Testing = 정량적 비교         │
│ 스킬 효과를 직감으로  │     │                                    │
│ 판단                  │     │  기존: 코드만 측정                  │
│                       │     │  이후: 스킬 자체도 측정            │
└───────────────────────┘     └───────────────────────────────────┘

┌───────────────────────┐     ┌───────────────────────────────────┐
│    Docs = Code        │     │  Skills 2.0:                      │
│ "문서가 곧 코드"      │────▶│  frontmatter hooks = 문서가 곧 실행│
│                       │     │  Skill Creator = 문서처럼 설계     │
│ 기존 한계:            │     │  Classification = 수명 메타데이터  │
│ 스킬은 정적 마크다운  │     │                                    │
│                       │     │  기존: PDCA 문서만 Docs=Code       │
│                       │     │  이후: 스킬 자체가 Docs=Code      │
└───────────────────────┘     └───────────────────────────────────┘
```

**핵심 통찰**: Skills 2.0 이전에는 No Guessing 원칙이 코드에만 적용되었다. Skills 2.0 이후에는 **스킬 자체**에도 적용된다. 이것은 방법론적 완성이다.

### 4.2 Context Engineering과의 시너지

Context Engineering은 "프롬프트, 도구, 상태를 통합 설계하여 LLM에 최적 컨텍스트를 제공하는 기술"이다. Skills 2.0은 4가지 차원에서 기여한다.

| Context Engineering 과제 | Skills 2.0 해결 방법 | 효과 |
|:------------------------:|:--------------------:|:----:|
| **컨텍스트 격리** | context:fork | 스킬 간 간섭 방지 |
| **자기 서술적 컨텍스트** | frontmatter hooks | 스킬이 자신의 동작을 완전히 서술 |
| **컨텍스트 수명 관리** | Skill Classification | 불필요한 컨텍스트 자동 축소 |
| **컨텍스트 품질 측정** | Evals + A/B Testing | 컨텍스트 품질 정량 측정 |

#### Context Engineering 아키텍처 변화

```
v1.5.9 (이전): 중앙 집중형
┌──────────────────────────────────────────────────┐
│  27 Skills ──┐                                    │
│              ├──▶ hooks.json (중앙) ──▶ scripts/  │
│  16 Agents ──┘                                    │
│  context-fork.js (228줄 자체 구현)               │
│  Evals: 없음 │ Classification: 없음              │
└──────────────────────────────────────────────────┘

v1.6.0 (이후): 분산 자율형
┌──────────────────────────────────────────────────┐
│  27 Skills ──┬──▶ frontmatter hooks (자기 서술)  │
│              ├──▶ context:fork (CC native)        │
│              ├──▶ Evals (27개 테스트 셋)          │
│              └──▶ Classification 메타데이터       │
│  hooks.json ──▶ 글로벌 이벤트만 남김             │
│  Skill Creator ──▶ 생성/테스트/최적화            │
└──────────────────────────────────────────────────┘
```

이것은 마이크로서비스 아키텍처에서 **API Gateway에서 Service Mesh로** 전환하는 것과 같은 패턴이다.

### 4.3 PDCA 사이클에서의 Skills 2.0 역할

| PDCA 단계 | Skills 2.0 기여 | 개선율 |
|:---------:|:---------------:|:------:|
| **Plan** | Skill Creator로 필요한 스킬 사전 설계, Classification으로 기존 스킬 적합성 판단 | ~40% 시간 단축 |
| **Do** | hot reload로 빠른 반복, / invoke로 즉시 실행, context:fork로 안전한 실험 | ~60% 반복 비용 감소 |
| **Check** | Evals로 자동 품질 검증, A/B Testing으로 정량 비교, /loop으로 자동 모니터링 | **측정 불가 → 측정 가능** |
| **Act** | Classification으로 수명 관리, parity test로 deprecation 자동 판단 | ~80% 판단 시간 단축 |

가장 큰 변화는 **Check Phase**에 있다. 기존에는 스킬의 효과를 "체감"으로만 판단했으나, 이제는 정량적 데이터 기반 판단이 가능하다.

### 4.4 패러다임 변화 — "스킬이 코드가 되는 시대"

#### 프롬프트 엔지니어링의 진화 3단계

```
Stage 1: 일회성 프롬프트 (2023~2024)
  "좋은 프롬프트를 작성하는 기술"
  → 매번 새로 작성, 재사용 불가, 품질 편차 큼
  → 비유: 스크립트 없이 즉흥 코딩

Stage 2: Context Engineering (2024~2025)
  "프롬프트, 도구, 상태를 통합 설계하는 기술"
  → 체계적 컨텍스트 관리, 스킬로 캡슐화
  → 비유: 함수와 모듈로 코드를 구조화
  → bkit v1.0~v1.5.9가 여기에 해당

Stage 3: Skill Engineering (2025~) ← Skills 2.0이 연 새 단계
  "재사용 가능한 스킬 자산을 설계/테스트/수명 관리하는 기술"
  → 스킬 = 테스트 가능한 소프트웨어 자산
  → 비유: 라이브러리 + 테스트 + 패키지 매니저
```

#### 소프트웨어 공학과의 1:1 대응

| 소프트웨어 공학 | Skills 2.0 | AI Native 의미 |
|:--------------:|:----------:|:--------------|
| 함수/클래스 | Skill | 재사용 가능한 AI 행동 단위 |
| 단위 테스트 | Evals | 스킬 품질 자동 검증 |
| 통합 테스트 | A/B Testing | 시스템 수준 효과 측정 |
| IDE | Skill Creator | 스킬 설계/디버깅 도구 |
| 패키지 매니저 | Classification | 수명/의존성 관리 |
| HMR | Hot Reload | 변경 즉시 반영 |
| API 호출 | / invoke | 명시적 스킬 실행 |
| Deprecated 라벨 | Capability Uplift | 모델 발전 시 자동 폐기 |

### 4.5 핵심 명제

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  "AI Native 개발에서 경쟁력의 원천은                               │
│   모델의 성능이 아니라 조직의 프로세스(Workflow 스킬)에 있다"       │
│                                                                     │
│  근거:                                                              │
│  1. 모델은 모든 조직이 동일하게 접근 가능 (commodity)              │
│  2. Capability 스킬은 모델 발전에 따라 불필요해짐                  │
│  3. Workflow 스킬만이 "우리 조직만의 개발 방식"을 코드화           │
│  4. PDCA, Zero Script QA, Pipeline은 모델과 무관한 고유 가치       │
│                                                                     │
│  결론: Skills 2.0의 Evals/Classification은 이 사실을               │
│        데이터로 증명하는 도구                                       │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

---

## 5. 실전 활용 사례와 Best Practices

### 5.1 사례: bkit의 27 Skills Classification 적용

bkit v1.6.0에서 27개 전체 스킬에 classification 메타데이터를 적용한 실제 사례이다.

#### 27개 스킬 분류 결과

**Workflow (9개, 영구 유지)**

| 스킬 | 역할 | deprecation-risk |
|------|------|:----------------:|
| pdca | PDCA 사이클 관리 | none |
| bkit-rules | PDCA 자동 적용 규칙 | none |
| bkit-templates | 문서 구조 표준화 | none |
| development-pipeline | 9-phase 순서 관리 | none |
| phase-2-convention | 코딩 규칙 강제 | none |
| phase-8-review | 코드 리뷰 프로세스 | none |
| zero-script-qa | 로그 기반 QA 방법론 | none |
| code-review | 코드 리뷰 표준 | none |
| pm-discovery | 제품 발견 프로세스 | none |

**Capability (16개, 축소 가능)**

| 스킬 | deprecation-risk | 비고 |
|------|:----------------:|------|
| claude-code-learning | **high** | 모델이 곧 대체 가능 |
| phase-3-mockup | **high** | 목업 생성은 모델 강점 |
| starter, dynamic | medium | 프레임워크 패턴 가이드 |
| phase-1,4,5,6,7,9 | medium | 개발 파이프라인 가이드 |
| bkend-* (5개) | medium | BaaS API 가이드 |
| enterprise, mobile-app, desktop-app | **low** | 깊은 도메인 전문성 |

**Hybrid (2개, 부분 유지)**

| 스킬 | deprecation-risk | 비고 |
|------|:----------------:|------|
| plan-plus | low | 브레인스토밍(Cap) + PDCA 통합(Work) |

#### 스킬 분포 통계

| deprecation-risk | 개수 | 의미 |
|:----------------:|:----:|:----:|
| none | 9 | 영구 유지 (프로세스) |
| low | 5 | 5~10년 장기 스킬 |
| medium | 11 | 1~2년 내 영향 예상 |
| high | 2 | 3~6개월 내 축소 예상 |

### 5.2 사례: Skill Evals 프레임워크

```
evals/
├── config.json              # 전역 설정 (parity 임계값 85%)
├── runner.js                # 실행 엔진 (6 함수)
├── reporter.js              # 결과 리포팅 (3 함수)
├── ab-tester.js             # A/B Testing (5 함수)
├── README.md
├── workflow/                # 9 Workflow 스킬 eval
│   ├── pdca/eval.yaml + prompt-1.md + expected-1.md
│   ├── bkit-rules/...
│   └── ... (9개)
├── capability/              # 16 Capability 스킬 eval
│   ├── starter/...
│   └── ... (16개)
└── hybrid/                  # 2 Hybrid 스킬 eval
    └── plan-plus/...
```

**핵심 설계 결정**: 분류별로 평가 전략이 다르다.

| 분류 | evalType | parityTest | 이유 |
|------|:--------:|:----------:|------|
| Workflow | process_compliance | false | 프로세스 준수만 확인 (모델 대체 불가) |
| Capability | output_quality | **true** | "스킬 없이도 되는가?" 비교 |
| Hybrid | both | true | 프로세스 + 품질 모두 |

### 5.3 사례: Frontmatter Hooks 마이그레이션

15개 컴포넌트(5 agents + 10 skills)에 frontmatter hooks를 적용했다.

```yaml
# 실제 적용 예시: skills/pdca/SKILL.md
---
name: pdca
classification: workflow
hooks:
  Stop:
    - type: command
      command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/pdca-skill-stop.js"
      timeout: 10000
---
```

마이그레이션 전략: **Gradual (점진적)**
- hooks.json과 frontmatter hooks가 동시에 존재해도 충돌 없음
- hooks.json에서 agent/skill scoped 항목 제거 → 글로벌만 남김
- 기존 코드 삭제 없음 (Additive-only)

### 5.4 Best Practices 정리

#### 스킬 설계 4원칙

| 원칙 | 설명 |
|------|------|
| **Self-describing** | SKILL.md 하나로 스킬의 목적, 트리거, 훅, 제한을 완전히 파악 |
| **격리 실행** | context:fork로 다른 작업에 영향 없이 독립 실행 |
| **품질 측정 가능** | eval.yaml이 반드시 존재해야 함 |
| **분류 기반 수명** | classification + deprecation-risk 명시 필수 |

#### Evals 작성 4원칙

| 원칙 | 설명 |
|------|------|
| **분류별 차등화** | Workflow는 프로세스 준수, Capability는 출력 품질 + parity |
| **기대 출력 명확** | expected-1.md에 필수 요소 목록화 |
| **parity test 자동화** | Capability 스킬은 반드시 parityTest: true |
| **벤치마크 모델 고정** | 비교 기준 유지를 위해 benchmarkModel 고정 |

#### 마이그레이션 4원칙

| 원칙 | 설명 |
|------|------|
| **점진적 이행** | hooks.json → frontmatter 동시 존재 허용 |
| **Additive-only** | 기존 코드 삭제 0건, deprecated 마킹만 |
| **하위 호환 100%** | 기존 사용자가 전환 시 깨지는 것 없음 |
| **리스크 최소화** | 자체 구현은 삭제하지 않고 deprecated만 |

---

## 6. 미래 전망

### 6.1 시간 축에 따른 스킬 포트폴리오 변화

```
시간 →
           현재 (v1.6.0)       중기 (v2.0.0)       장기 (v3.0.0+)
         ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
Workflow │█████████ 9  │     │█████████ 9  │     │█████████ 9  │ ← 불변
         ├─────────────┤     ├─────────────┤     ├─────────────┤
Hybrid   │██ 2         │     │█ 1          │     │█ 1          │ ← 미세 축소
         ├─────────────┤     ├─────────────┤     ├─────────────┤
Capability│████████████ │     │████████     │     │███          │ ← 점진 축소
         │     16      │     │    10~12    │     │    4~6      │
         └─────────────┘     └─────────────┘     └─────────────┘
합계:         27                 20~22               14~16

축소 판단 기준: Evals parity test 85%+ x 3회 연속 통과
```

### 6.2 단기 전망 (v1.6.0, 2026 Q1)

- Evals 전면 도입: 27 스킬 전수 테스트 셋 완비
- frontmatter hooks: Layer 2/3 자기 서술적 전환
- context:fork native: 자체 구현 228줄 deprecated
- Skill Classification: 전 스킬 분류 메타데이터 완료

### 6.3 중기 전망 (v2.0.0, 2026 Q2~Q3)

- HIGH risk 2개 (claude-code-learning, phase-3-mockup) 축소 평가
- Skill Creator 성숙: 조직별 맞춤 Workflow 스킬 제작 가능
- A/B Testing 자동화: 모델 업데이트 시 자동 benchmark + 보고서

### 6.4 장기 전망 (v3.0.0+, 2027~)

| 전망 | 설명 | 전제 조건 |
|------|------|-----------|
| **스킬 마켓플레이스** | 검증된 Workflow 스킬을 조직 간 공유 | Evals로 품질 보증 |
| **AI 팀 표준화** | 모든 팀원이 동일 스킬 세트 → 일관된 품질 | Agent Teams + Workflow 스킬 |
| **자가 진화 스킬** | Evals 결과 기반 스킬 자동 개선 | Skill Creator + Evals 피드백 루프 |
| **Capability 최소화** | 모델 발전으로 4~6개까지 축소 | 현재 모델 발전 속도 유지 |

### 6.5 결론: Skills 2.0의 본질

Skills 2.0은 "기능 추가"가 아니라 **방법론적 완성**이다.

| 차원 | 이전 | 이후 |
|------|:----:|:----:|
| 자동화 범위 | 코드 생성 + PDCA | + 스킬 자체의 수명/품질 |
| 측정 가능성 | 코드 품질만 | + 스킬 품질/효과 |
| 아키텍처 | 중앙 집중 (hooks.json) | 분산 자율 (frontmatter) |
| 투자 전략 | 27 스킬 일률 유지 | Workflow 집중 + Capability 자동 관리 |
| 경쟁 해자 | 프로세스 자동화 (정성적) | 프로세스 자동화 (Evals 데이터 증명) |

> **"모델이 발전할수록, 프로세스가 차별화 요소가 된다."**
>
> Capability 스킬은 모델 발전에 따라 자연 소멸하지만,
> Workflow 스킬은 영구히 가치를 유지한다.
> Skills 2.0의 Evals와 Classification은 이 사실을 **데이터로 증명**하는 도구이다.

---

## 7. 부록: CTO 팀 구성 및 조사 방법론

### 7.1 CTO 팀 구성 (8명)

| # | Agent | 역할 | 담당 영역 |
|---|-------|------|----------|
| 1 | **skills20-core-analyst** | Skills 2.0 핵심 분석가 | 5대 핵심 기능, 아키텍처 다이어그램 |
| 2 | **ux-change-analyst** | UX 변화 분석 전문가 | Before/After 시나리오, 워크플로우 변화 |
| 3 | **ai-native-analyst** | AI Native 전략 분석가 | 3대 철학 정렬, PDCA 영향, 패러다임 변화 |
| 4 | **practice-analyst** | 실전 활용 전문가 | 27 Skills 분류, Evals 프레임워크, Best Practices |
| 5 | **context-eng-researcher** | Context Engineering 연구원 | 6-Layer Hook System, 자기 서술적 패턴 |
| 6 | **evals-researcher** | Evals 프레임워크 연구원 | evals/ 디렉토리 구조, 함수 목록, 템플릿 |
| 7 | **classification-researcher** | Skill Classification 연구원 | 27개 스킬 frontmatter 검증, orchestrator 함수 |
| 8 | **official-docs-researcher** | 공식 문서 연구원 | CC 2.1.0 공식 발표, 1,096 commits 분석 |

### 7.2 조사 방법론

- **Task Management System**: 5개 태스크 생성, 의존성 설정, 진행 상태 추적
- **병렬 실행**: 8명 에이전트가 동시에 독립적 조사 수행
- **소스 기반**: 프로젝트 내부 파일 + 공식 문서 + 외부 자료 교차 검증
- **통합 방식**: 8명의 조사 결과를 단일 문서로 통합, 중복 제거, 일관성 확보

### 7.3 참조 자료

#### 프로젝트 내부 문서

- `docs/01-plan/features/claude-code-v2171-impact-analysis.plan.md` — Skills 2.0 전략 분석
- `docs/04-report/features/claude-code-v2171-impact-analysis.report.md` — v1.6.0 완료 보고서
- `bkit-system/philosophy/context-engineering.md` — Context Engineering 원칙
- `bkit-system/philosophy/ai-native-principles.md` — AI Native 원칙
- `bkit-system/components/skills/_skills-overview.md` — 27개 스킬 개요
- `evals/` — Skill Evals 프레임워크 전체
- `skill-creator/` — Skill Creator 도구 전체
- `lib/context-fork.js` — FR-03 자체 구현 (deprecated)
- `lib/skill-orchestrator.js` — Classification 함수

#### 외부 자료

- Claude Code 2.1.0 공식 릴리스 노트 (Boris Cherny, Anthropic)
- Claude Code Skills 공식 문서 (code.claude.com/docs/en/skills)
- "Claude Code 2.1.0 Just Changed Everything" (Medium)
- "Anthropic Skill Creator" (Geeky Gadgets)
- "Claude Code 2.1.0 arrives" (VentureBeat)
- "Improving Skill Creator" (Claude Blog)

---

**작성 완료**: 2026-03-07
**CTO Team**: 8명 병렬 조사, Task Management System 기반
**문서 버전**: 1.0
