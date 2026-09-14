/* ════════════════════════════════════════════════════════════════════════
   GHOSTCODER — 한국어
   ────────────────────────────────────────────────────────────────────────
   기본은 영어다. 실제 개발 환경이 영어이기 때문이고, 그래서 여기 있는
   한국어는 "UI 번역"이 아니라 한국어로 일하는 에이전트의 말투다.

   번역 대상과 비대상을 분명히 나눈다.
   ─ 번역한다  런처, VS Code 크롬 라벨, 에이전트가 하는 말/계획/보고
   ─ 번역하지 않는다  코드, 명령어, 터미널 출력, 로그, 파일 경로
     한국 개발자 화면에서도 저것들은 영어다. 여기서 한글이 나오면
     오히려 가짜가 된다.

   SCRIPT 의 키는 scenarios.js 가 내놓는 영어 원문이고, 치환자는
   {T} 티켓 번호 · {A} 작업 영역 · {R} 저장소 이름 이다. 키가 없으면
   영어 원문이 그대로 나간다(빠뜨려도 화면이 깨지지 않는다).
   ════════════════════════════════════════════════════════════════════════ */
"use strict";

const I18N = (() => {

/* ── 런처 · 크롬 ─────────────────────────────────────────────────────── */
const UI = {
  en: null,   // 영어는 HTML 에 직접 박혀 있다
  ko: {
    'tag.1': '당신의 AI 직원이 티켓을 읽고, 코드를 쓰고, 테스트를 돌리고, PR 을 올립니다 —',
    'tag.2': '누가 봐도 실제 작업 화면과 구별되지 않는 화면 위에서.',
    'tag.3': '당신은 그 앞에 앉아 있기만 하면 됩니다.',
    'id.n': '신원', 'id.h': '타이틀바 · 셸 프롬프트 · git 커밋 · 에이전트 패널에 그대로 나타납니다',
    'id.user': '내 이름', 'id.agent': '에이전트 이름', 'id.model': '모델',
    'lay.n': '작업 화면', 'lay.h': '화면에 무엇을 띄울지 — 그리고 타이핑을 보여줄지',
    'stk.n': '개발 환경', 'stk.h': '저장소 · 파일 트리 · 언어 · 툴체인 · 터미널 출력 전부가 바뀝니다',
    'msn.n': '미션', 'msn.h': '에이전트가 지금 하는 일',
    'thm.n': '테마', 'thm.h': '실제 VS Code 기본 테마',
    'pac.n': '속도', 'pac.h': '타이핑과 출력 속도',
    'opt.n': '사실감', 'opt.h': '설득력을 만드는 — 또는 들키게 하는 — 작은 것들',
    'flt.n': '플릿 규모', 'flt.h': 'AGI 화면이 동시에 돌리는 에이전트 판의 개수',
    'ui.mergequeue': '머지 큐',
    'lang.n': '언어', 'lang.h': '에이전트가 말하는 언어. 코드와 터미널은 영어 그대로입니다',
    'btn.start': '▸ 출근', 'btn.rand': '🎲 아무거나',
    'repo.link': 'GitHub 저장소',
    'foot.1': '<kbd>Esc</kbd> 설정 · <kbd>Space</kbd> 일시정지 · <kbd>⌘B</kbd> 사이드바 · <kbd>⌘J</kbd> 패널 · <kbd>⌘⇧P</kbd> 팔레트 · <kbd>1</kbd>–<kbd>5</kbd> 속도 · <kbd>L</kbd> 화면 · <kbd>F</kbd> 전체화면',
    'foot.2': '<kbd>`</kbd> <em>집중</em> — 터미널을 최대로 키우고 빌드 로그를 쏟아붓습니다',
    'foot.3': '미션이 끝나면 다음 티켓이 저절로 시작됩니다. 이 페이지는 당신의 컴퓨터를 건드리지 않습니다 — 파일을 읽거나 쓰지 않고, 네트워크 요청도 하지 않습니다. 일이 아니라 일의 그림입니다.',
    /* VS Code 한국어 언어 팩 기준 */
    'ui.explorer': '탐색기', 'ui.outline': '개요', 'ui.timeline': '타임라인',
    'ui.problems': '문제', 'ui.output': '출력', 'ui.debug': '디버그 콘솔',
    'ui.terminal': '터미널', 'ui.ports': '포트', 'ui.terminals': '터미널',
    'ui.agent': '에이전트', 'ui.ask': '⌨ 무엇이든 물어보세요…',
    'ui.noprob': '작업 영역에서 발견된 문제가 없습니다.',
    'ui.session': '세션 완료', 'ui.thought': '초 동안 생각함', 'ui.thinking': '생각 중…',
    'ui.interrupt': 'esc 로 중단', 'ui.pipeline': '파이프라인', 'ui.livetail': '실시간 로그',
    'ui.agentsess': '에이전트 세션', 'ui.idle': '대기', 'ui.done': '완료', 'ui.working': '작업 중',
    'ui.paused': '일시정지', 'ui.lines': '줄/분',
    'ctl.full': '전체화면', 'ctl.pause': '일시정지', 'ctl.resume': '재생',
    'ctl.hyper': '초고속', 'ctl.home': '메인', 'ctl.layout': '화면 전환',
    'msg.next': '다음 티켓을 자동으로 받았습니다.',
    'msg.panic': '집중 모드 — 터미널을 최대로 키웠습니다. ` 를 다시 누르면 돌아갑니다.',
    'msg.pace': '속도',
    'hint': '<kbd>Esc</kbd> 설정 &nbsp;·&nbsp; <kbd>Space</kbd> 일시정지 &nbsp;·&nbsp; <kbd>L</kbd> 화면 &nbsp;·&nbsp; <kbd>`</kbd> 집중 &nbsp;·&nbsp; <kbd>F</kbd> 전체화면',
  },
};

/* ── 레이아웃 · 스택 · 미션 · 속도 설명 ─────────────────────────────── */
const META = {
  ko: {
    layout: {
      ide: ['IDE — 에디터 + 터미널', '완전한 VS Code. 파일 트리, 탭, 실시간 코드 타이핑, 통합 터미널, 에이전트 패널. 사람이 키보드를 잡고 있는 것처럼 보이는 쪽입니다.'],
      agent: ['에이전트 — 헤드리스 CLI', '타이핑이 없습니다. 전체화면 에이전트 세션 하나가 쉬지 않고 툴 호출과 diff, 테스트 결과, 토큰 카운터를 뱉습니다. 마우스를 움직일 필요조차 없습니다.'],
      swarm: ['스웜 — 에이전트 4대, tmux 4분할', '네 개의 티켓을 네 개의 판에서 동시에. 화면 면적당 처리량이 가장 높아 보이는 구성입니다.'],
      ops: ['운영 — 파이프라인 + 로그', 'SRE 벽면. CI 단계, 실시간 로그, 지연·에러율 지표, 롤링 배포. 프로덕션을 혼자 떠받치고 있는 것처럼 보입니다.'],
      agi: ['AGI — 자율 플릿', '수백 대의 에이전트가 백로그 전체를 동시에 처리합니다. 살아 있는 판, 집계 처리량, 그리고 머지 큐 소방호스. 어떤 팀도 낼 수 없는 처리량 — 그게 이 화면의 요점입니다.'],
    },
    stack: {
      next: ['TypeScript · Next.js', 'pnpm · Next 15 · React 19 · Vitest · ESLint · tsc --watch. 이커머스 결제와 쿠폰 가격 계산.'],
      fastapi: ['Python · FastAPI', 'uv · FastAPI · SQLAlchemy 2 · pytest · ruff · mypy --strict. 멱등키를 쓰는 복식부기 원장.'],
      go: ['Go · gRPC 서비스', 'Go 1.24 · gRPC + protobuf · sqlc · testcontainers · golangci-lint. 게이트웨이 뒤의 주문 상태 기계.'],
      rust: ['Rust · Tokio 엣지', 'cargo · tokio · axum · tower · criterion · clippy. 레이트 리밋과 요청 차단을 하는 엣지 라우터.'],
      k8s: ['SRE · K8s + Terraform', 'terraform · kubectl · helm · argocd · promtool. 노드 풀, HPA, 알림 규칙, 롤링 배포. 가장 시니어 온콜처럼 보이는 선택.'],
      postgres: ['PostgreSQL · 데이터', 'psql · Flyway · pgTAP · sqlfluff · pgbench · pg_stat_statements. 4TB 웨어하우스의 파티셔닝, 인덱스 튜닝, 실행 계획.'],
      langchain: ['LangChain · 에이전트 개발', 'uv · LangGraph · LangChain · LangSmith · pgvector · ragas. 툴 호출 에이전트를 만들고 평가합니다. 화면에서 eval 점수가 올라갑니다.'],
      azure: ['Azure · 모델 서빙', 'az CLI · Bicep · AKS · Azure ML 엔드포인트 · Azure OpenAI · APIM. 추론 엔드포인트의 블루/그린 롤아웃.'],
    },
    mission: {
      feature: ['기능 개발', '보드에서 티켓을 하나 집어 코드를 읽고, 구현하고, 테스트를 붙이고, PR 을 올립니다. 평범한 화요일의 리듬.'],
      incident: ['장애 대응 — P1', '호출기가 울렸습니다. 프로덕션 로그를 읽고, 재현하고, 레이스를 찾아 패치하고, 검증하고 배포합니다. 붉은 글씨와 긴박함 — 화면에 띄워 두기에 가장 설득력 있는 미션.'],
      refactor: ['리팩터링 마라톤', '길고 끊김 없이, 파일에서 파일로. 드라마 없이 테스트 스위트를 안전망 삼아 꾸준히 고쳐 씁니다. 몇 시간을 채우기에 좋습니다.'],
      greenfield: ['신규 구축 — 맨바닥부터', '빈 폴더가 동작하는 서비스가 됩니다. 스캐폴딩, 의존성, 첫 모듈, 첫 테스트, 첫 초록불. 새 코드가 화면을 가득 채웁니다.'],
      harden: ['테스트 · 보안 강화', '커버리지 구멍, 프로퍼티 테스트, 의존성 감사, CI 게이트. 초록 체크만 쌓여 갑니다 — 대단히 성실해 보입니다.'],
      migrate: ['마이그레이션', '스키마 변경, 코드 생성, 백필, 무중단 롤아웃. 조심스럽고 순차적이며 도구 출력이 많습니다.'],
      review: ['코드 리뷰', '열려 있는 PR 큐를 처리합니다. diff 를 읽고, 브랜치를 받아 직접 돌려 보고, 코멘트를 남깁니다. 목록에서 가장 시니어다워 보이는 활동.'],
      perf: ['성능 개선', '프로파일링으로 핫 패스를 찾아 다시 쓰고, 벤치마크 diff 로 증명합니다. 숫자가 눈에 보이게 좋아집니다.'],
    },
    pace: {
      human: ['사람', '신중하게. 초당 7자 정도에 망설임까지 — 누군가 1분 내내 화면을 본다면 가장 자연스럽습니다.'],
      caff: ['카페인', '커피 세 잔 마신 개발자. 짧게 몰아치고 잠깐 쉽니다.'],
      agentp: ['에이전트', '기계의 리듬. 사람이 칠 수 없는 속도로 코드가 나타납니다 — AI 에이전트가 실제로 그렇습니다.'],
      turbo: ['터보', '출력 소방호스. 멀리서 보는 스웜·운영 화면에 좋습니다. 가까이서 읽기에는 너무 빠릅니다.'],
      hyper: ['초고속', '한계까지. 로그가 읽을 수 없는 속도로 흐르고 파일이 순식간에 채워집니다. 회의실 스크린과 복도에서 보이는 모니터용.'],
    },
    opts: {
      notifs: ['에디터 알림', '오른쪽 아래에 뜨는 VS Code 알림. 테스트 결과, 포매터, PR 생성.'],
      pings: ['메신저 알림', '동료들이 구석에서 반응합니다. 가장 설득력 있는 한 가지 — 다른 사람들이 당신의 작업을 믿고 있다는 뜻이 되니까요.'],
      palette: ['커맨드 팔레트', '누군가 키보드로 에디터를 실제로 조작할 때처럼, 팔레트가 이따금 열립니다.'],
      loop: ['멈추지 않기', '미션이 끝나면 다음 티켓이 저절로 시작됩니다. 회의 내내 켜 두세요.'],
      sound: ['키보드 소리', '합성 키 클릭. 주의 — 아무도 손대지 않은 키보드에서 타이핑 소리가 나는 것이야말로 들키는 이유입니다.'],
    },
  },
};

/* ── 에이전트 대사 ───────────────────────────────────────────────────── */
const SCRIPT = {
ko: {
/* 기능 개발 */
'Planning': '계획',
'Pick up {T}. Read the ticket, then implement it in {A}. Add tests and open a PR when green.':
  '{T} 잡아서 진행해 주세요. 티켓 읽고 {A}에 구현하고, 테스트 붙여서 초록불 되면 PR 올려 주세요.',
/* 기능 개발 — 스택별 문구.
   think/say/done/ping 은 스택의 topic 에서 조립되므로 여덟 가지가 나온다. */
'Reading the ticket and the surrounding code before touching anything. The acceptance criteria mention stacking order, so the discount pipeline is where this lands.':
  '손대기 전에 티켓과 주변 코드를 먼저 읽습니다. 수용 기준에 중복 적용 순서가 언급돼 있으니, 할인 파이프라인이 작업 지점입니다.',
'The current behaviour is implicit: fixed and percentage coupons are applied in whatever order they arrive. I will make the order explicit and clamp each step to the remaining base.':
  '지금 동작은 암묵적입니다. 정액·정률 쿠폰이 들어온 순서대로 적용됩니다. 순서를 명시적으로 만들고, 각 단계를 남은 기준액으로 clamp 하겠습니다.',

/* Python · FastAPI */
'Reading the ticket and the surrounding code before touching anything. The acceptance criteria mention hold expiry, so the posting path is where this lands.':
  '손대기 전에 티켓과 주변 코드를 먼저 읽습니다. 수용 기준에 hold 만료가 언급돼 있으니, 기표 경로가 작업 지점입니다.',
'The current behaviour is implicit: a hold stays on the balance until something else happens to the account. I will give every hold an explicit expiry and release it in the same transaction that reads it.':
  '지금 동작은 암묵적입니다. hold 가 계좌에 다른 일이 생길 때까지 잔액에 남아 있습니다. 모든 hold 에 명시적 만료를 주고, 그것을 읽는 같은 트랜잭션에서 해제하겠습니다.',
'holds expiring on their own is going to close about six support tickets a week. approving':
  'hold 가 스스로 만료되면 주당 여섯 건쯤 되는 문의가 사라질 겁니다. approve 하겠습니다',
'Done. {T} is implemented, covered, and pushed as a PR. Holds now carry an expiry and are released on read rather than lingering.':
  '완료했습니다. {T} 구현·테스트·PR 까지 마쳤습니다. hold 가 이제 만료를 갖고, 남아 있지 않고 읽을 때 해제됩니다.',

/* Go · gRPC */
'Reading the ticket and the surrounding code before touching anything. The acceptance criteria mention at-least-once delivery, so the transition path is where this lands.':
  '손대기 전에 티켓과 주변 코드를 먼저 읽습니다. 수용 기준에 at-least-once 전달이 언급돼 있으니, 상태 전이 경로가 작업 지점입니다.',
'The current behaviour is implicit: events are published inside the business transaction, so a slow broker rolls back the order. I will write the event to an outbox in the same transaction and let a relay drain it.':
  '지금 동작은 암묵적입니다. 이벤트를 비즈니스 트랜잭션 안에서 발행하기 때문에, 브로커가 느리면 주문이 롤백됩니다. 같은 트랜잭션에서 아웃박스에 쓰고, 릴레이가 빼 가도록 하겠습니다.',
'outbox in the same tx is the right call. we lost orders to broker timeouts twice last quarter':
  '같은 트랜잭션에서 아웃박스에 쓰는 게 맞습니다. 지난 분기에 브로커 타임아웃으로 주문을 두 번 잃었습니다',
'Done. {T} is implemented, covered, and pushed as a PR. Transitions now write to an outbox in the same transaction, so a broker outage cannot roll back an order.':
  '완료했습니다. {T} 구현·테스트·PR 까지 마쳤습니다. 상태 전이가 같은 트랜잭션에서 아웃박스에 쓰므로, 브로커 장애가 주문을 롤백시킬 수 없습니다.',

/* Rust · Tokio */
'Reading the ticket and the surrounding code before touching anything. The acceptance criteria mention a bare 429 is not actionable, so the limiter is where this lands.':
  '손대기 전에 티켓과 주변 코드를 먼저 읽습니다. 수용 기준에 맨 429 는 조치할 수 없다고 적혀 있으니, 리미터가 작업 지점입니다.',
'The current behaviour is implicit: a rejected caller learns nothing about when to come back and retries immediately. I will compute the wait from the refill rate and hand it back with the rejection.':
  '지금 동작은 암묵적입니다. 거절된 호출자는 언제 다시 와야 하는지 알 수 없어 곧바로 재시도합니다. 충전 속도에서 대기 시간을 계산해 거절과 함께 돌려주겠습니다.',
'retry-after computed from the refill rate rather than a constant. that is the detail i would have skipped':
  '상수가 아니라 충전 속도에서 계산한 retry-after 네요. 제가 건너뛸 디테일입니다',
'Done. {T} is implemented, covered, and pushed as a PR. Rejections now carry the exact wait time, so clients back off instead of hammering.':
  '완료했습니다. {T} 구현·테스트·PR 까지 마쳤습니다. 거절이 이제 정확한 대기 시간을 담고 있어, 클라이언트가 몰아치지 않고 물러납니다.',

/* SRE · K8s */
'Reading the ticket and the surrounding code before touching anything. The acceptance criteria mention fast burn pages, slow burn opens a ticket, so the alerting module is where this lands.':
  '손대기 전에 티켓과 주변 코드를 먼저 읽습니다. 수용 기준에 빠른 소진은 호출, 느린 소진은 티켓이라고 적혀 있으니, 알림 모듈이 작업 지점입니다.',
'The current behaviour is implicit: every threshold breach pages, so the on-call learns to ignore the pager. I will alert on multi-window burn rate and route slow burn to a ticket instead of a page.':
  '지금 동작은 암묵적입니다. 임계값을 넘으면 전부 호출하기 때문에, 온콜은 호출기를 무시하는 법을 배웁니다. 다중 윈도 소진율로 알리고, 느린 소진은 호출 대신 티켓으로 보내겠습니다.',
'multi-window burn rate instead of static thresholds. the pager might actually mean something now':
  '고정 임계값 대신 다중 윈도 소진율이라니. 이제 호출기가 정말 뭔가를 뜻하겠네요',
'Done. {T} is implemented, covered, and pushed as a PR. Alerts now fire on burn rate across two windows, so only budget-threatening breaches page.':
  '완료했습니다. {T} 구현·테스트·PR 까지 마쳤습니다. 알림이 두 개의 윈도에 걸친 소진율로 발생하므로, 예산을 위협하는 경우만 호출합니다.',

/* PostgreSQL */
'Reading the ticket and the surrounding code before touching anything. The acceptance criteria mention retention must not rewrite live pages, so {A} is where this lands.':
  '손대기 전에 티켓과 주변 코드를 먼저 읽습니다. 수용 기준에 보존 작업이 살아 있는 페이지를 다시 쓰면 안 된다고 적혀 있으니, {A}가 작업 지점입니다.',
'The current behaviour is implicit: retention is a DELETE, so every night rewrites the heap and autovacuum never catches up. I will range-partition by the column retention filters on, so a drop replaces the delete.':
  '지금 동작은 암묵적입니다. 보존 작업이 DELETE 라서 매일 밤 힙을 다시 쓰고 autovacuum 이 따라잡지 못합니다. 보존 작업이 필터하는 컬럼으로 범위 파티셔닝해서, DELETE 를 DROP 으로 바꾸겠습니다.',
'detach instead of delete. the nightly job went from 18 seconds and timing out to under one':
  'DELETE 대신 DETACH 네요. 야간 작업이 18초에 타임아웃 나던 게 1초 아래로 내려갔습니다',
'Done. {T} is implemented, covered, and pushed as a PR. Retention is now a DETACH and DROP on the partition key, which holds no lock on the parent.':
  '완료했습니다. {T} 구현·테스트·PR 까지 마쳤습니다. 보존 작업이 이제 파티션 키에 대한 DETACH 와 DROP 이고, 부모 테이블에 락을 잡지 않습니다.',

/* LangChain */
"Reading the ticket and the surrounding code before touching anything. The acceptance criteria mention tool selection above 0.92 on the graded set, so the router node is where this lands.":
  '손대기 전에 티켓과 주변 코드를 먼저 읽습니다. 수용 기준에 채점 세트에서 툴 선택 0.92 이상이 적혀 있으니, 라우터 노드가 작업 지점입니다.',
"The current behaviour is implicit: the router sees every tool's raw JSON schema and cannot tell near-identical ones apart. I will give each tool a card that states what it is for and what it is not for.":
  '지금 동작은 암묵적입니다. 라우터가 모든 툴의 원시 JSON 스키마를 보기 때문에 거의 같은 것들을 구분하지 못합니다. 각 툴에 무엇을 위한 것이고 무엇을 위한 것이 아닌지 적은 카드를 주겠습니다.',
'use_for plus never_for was the whole fix. exact_tool up nine points and the prompt got shorter':
  'use_for 에 never_for 를 더한 게 수정의 전부였네요. exact_tool 이 9포인트 오르고 프롬프트는 짧아졌습니다',
'Done. {T} is implemented, covered, and pushed as a PR. The router now reads tool cards, and tool selection moved from 0.871 to 0.958 on the graded set.':
  '완료했습니다. {T} 구현·테스트·PR 까지 마쳤습니다. 라우터가 이제 툴 카드를 읽고, 채점 세트에서 툴 선택이 0.871 에서 0.958 로 올랐습니다.',

/* Azure */
'Reading the ticket and the surrounding code before touching anything. The acceptance criteria mention p95 under the 450ms SLO at 200 concurrent callers, so {A} is where this lands.':
  '손대기 전에 티켓과 주변 코드를 먼저 읽습니다. 수용 기준에 동시 호출 200에서 p95 를 450ms SLO 아래로 두라고 적혀 있으니, {A}가 작업 지점입니다.',
'The current behaviour is implicit: scaling reacts to CPU, which stays low while the GPU waits on a queue thousands deep. I will scale on queue depth and endpoint latency, keeping CPU only as a floor.':
  '지금 동작은 암묵적입니다. 스케일링이 CPU 에 반응하는데, GPU 가 수천 건 쌓인 큐를 기다리는 동안 CPU 는 낮게 유지됩니다. 큐 깊이와 엔드포인트 지연으로 스케일하고, CPU 는 하한으로만 두겠습니다.',
'scaling on queue depth instead of cpu. 429s went to zero and we are paying less':
  'CPU 대신 큐 깊이로 스케일하니 429 가 0이 되고 비용은 줄었네요',
'Done. {T} is implemented, covered, and pushed as a PR. The endpoint now scales on queue depth, so it reacts in eleven seconds rather than ninety-four.':
  '완료했습니다. {T} 구현·테스트·PR 까지 마쳤습니다. 엔드포인트가 이제 큐 깊이로 스케일하므로, 94초가 아니라 11초에 반응합니다.',
'Read the current implementation and tests': '현재 구현과 테스트 읽기',
'Implement the new behaviour': '새 동작 구현',
'Cover with unit tests': '유닛 테스트로 덮기',
'Typecheck, lint, and open a PR': '타입 검사 · 린트 후 PR 올리기',
'The stacking order is implicit today — fixed and percentage coupons are applied in whatever order they arrive. I will make the order explicit and clamp each step to the remaining base.':
  '지금은 적용 순서가 암묵적입니다. 정액·정률 쿠폰이 들어온 순서대로 적용됩니다. 순서를 명시적으로 만들고, 각 단계를 남은 기준액으로 clamp 하겠습니다.',
'Implementing': '구현',
'One type error: clamp() needs the remaining base as a second argument. Fixing the call site.':
  '타입 오류 하나. clamp() 가 두 번째 인자로 남은 기준액을 받아야 합니다. 호출부를 고칩니다.',
'Testing': '테스트',
'Two failures, both mine: the fixture assumed the old ordering. The production code is right — the expectations were written against the bug.':
  '실패 두 건, 둘 다 제 쪽입니다. 픽스처가 옛 순서를 가정하고 있었습니다. 프로덕션 코드가 맞고, 기대값이 버그에 맞춰 쓰여 있었습니다.',
'All tests passed. 55 passed, 0 failed.': '모든 테스트 통과. 55 성공, 0 실패.',
'Shipping': '배포',
'nice, the stacking order finally reads like the spec. approving once CI is green':
  '좋네요, 적용 순서가 드디어 스펙처럼 읽힙니다. CI 초록 되면 approve 하겠습니다',
'PR opened · {T} · 5 files changed': 'PR 생성 · {T} · 5개 파일 변경',
'Done. {T} is implemented, covered, and pushed as a PR. Discount stacking is now explicit and clamped at every step.':
  '완료했습니다. {T} 구현·테스트·PR 까지 마쳤습니다. 할인 중복 적용이 이제 명시적이고 모든 단계에서 clamp 됩니다.',
'5 files changed': '파일 5개 변경', '+152 / -38': '+152 / -38',
'55 tests green': '테스트 55건 초록', 'PR opened': 'PR 생성',

/* 장애 대응 */
'Triage': '초기 대응',
'PagerDuty just fired: INC-2291, {A} throwing 500s in prod since 13:58. You are the responder. Find it and stop the bleeding.':
  'PagerDuty 울렸습니다. INC-2291, 13:58 부터 프로덕션 {A}에서 500 이 나옵니다. 담당자는 당신입니다. 원인 찾고 지혈하세요.',
'INC-2291 triggered · severity P1 · you are on call': 'INC-2291 발생 · 심각도 P1 · 온콜 담당',
'Error rate started at 13:58 with no deploy in that window, which points at a data-dependent or concurrency-dependent path rather than a bad release. Logs first, then reproduce locally before changing a line.':
  '13:58 에 에러율이 오르기 시작했는데 그 시각에 배포가 없었습니다. 배포 문제가 아니라 데이터나 동시성에 의존하는 경로라는 뜻입니다. 로그부터 보고, 한 줄도 고치기 전에 로컬에서 재현합니다.',
'Read production logs and scope the blast radius': '프로덕션 로그 읽고 영향 범위 파악',
'Reproduce locally': '로컬에서 재현',
'Patch and prove it with a test': '패치하고 테스트로 증명',
'Deploy and watch the error rate': '배포 후 에러율 확인',
'Same stack frame every time, three accounts affected, first seen 13:58:02. Nothing shipped then — so this is a latent race that traffic finally hit.':
  '매번 같은 스택 프레임이고, 계정 3개가 영향받았습니다. 첫 발생 13:58:02. 그 시각 배포는 없었습니다. 잠재된 레이스에 트래픽이 드디어 닿은 겁니다.',
'Local reproduction matches the production stack trace.': '로컬 재현이 프로덕션 스택 트레이스와 일치합니다.',
'Diagnosing': '원인 분석',
'Found it. The read happens outside the lock, so two writers both pass the guard with the same pre-write value. The fix is to make the read and the write one atomic step — not to add a retry around it.':
  '찾았습니다. 읽기가 락 밖에서 일어나서, 두 writer 가 쓰기 전 같은 값으로 가드를 통과합니다. 해법은 읽기와 쓰기를 하나의 원자적 단계로 만드는 것입니다. 바깥에 재시도를 두르는 게 아닙니다.',
'Root cause: the guard reads state that another writer can change before the write lands. I am making the check-and-write atomic. A retry would only make the window smaller, not closed.':
  '근본 원인: 가드가 읽는 상태를, 쓰기가 반영되기 전에 다른 writer 가 바꿀 수 있습니다. 검사와 쓰기를 원자적으로 만듭니다. 재시도는 창을 좁힐 뿐 닫지는 못합니다.',
'Good — the regression test fails against the old behaviour. Now the fix.':
  '좋습니다. 회귀 테스트가 기존 동작에서 실패합니다. 이제 수정합니다.',
'Shipping the fix': '수정 배포',
'root cause confirmed, fix is up. rollback plan: revert to the previous image, no schema change involved':
  '근본 원인 확인됐고 수정 올라갔습니다. 롤백 계획은 이전 이미지로 되돌리기, 스키마 변경 없음',
'Error rate back to baseline · 0.00% over 120s': '에러율 정상 복귀 · 120초간 0.00%',
'error rate is flat. calling it mitigated — can you write the postmortem draft?':
  '에러율 평평합니다. 완화 처리로 종결하겠습니다 — 포스트모템 초안 부탁드려도 될까요?',
'Mitigated. Root cause was a non-atomic check-and-write under concurrency; the guard now holds a lock for the whole step. Error rate is back to 0.00% and a regression test pins the behaviour.':
  '완화 완료. 근본 원인은 동시성 하에서 원자적이지 않은 검사·쓰기였고, 이제 가드가 단계 전체에서 락을 잡습니다. 에러율 0.00% 로 복귀했고 회귀 테스트가 동작을 고정합니다.',
'INC-2291 mitigated': 'INC-2291 완화', 'MTTR 34m': 'MTTR 34분',
'0.00% error rate': '에러율 0.00%', 'regression test added': '회귀 테스트 추가',

/* 리팩터링 */
'Mapping': '구조 파악',
'No new behaviour today. Refactor {A} so each step is explicit and unit-testable. Keep the test suite green the whole way.':
  '오늘은 새 동작 추가 없습니다. {A}를 각 단계가 명시적이고 유닛 테스트 가능하도록 리팩터링해 주세요. 진행 내내 테스트는 초록으로 유지하고요.',
'The rule for this kind of work is that the tests do not change. If I have to edit an assertion to keep it passing, I changed behaviour and need to stop and say so.':
  '이런 작업의 규칙은 테스트를 고치지 않는 것입니다. 통과시키려고 단정문을 손대야 한다면 동작을 바꾼 것이고, 멈춰서 그 사실을 말해야 합니다.',
'Map the current call graph': '현재 호출 그래프 파악',
'Extract the pure pieces': '순수한 부분 추출',
'Thread the types through': '타입 연결',
'Prove behaviour is unchanged': '동작이 그대로임을 증명',
'Baseline captured: green before I touch anything. 55 tests, and I intend to end on exactly the same 55 assertions.':
  '기준선 확보. 손대기 전에 초록입니다. 테스트 55건이고, 정확히 같은 55개 단정문으로 끝낼 생각입니다.',
'Extracting': '추출',
'Three call sites were relying on a loose type. That is the good kind of breakage — the compiler is showing me exactly where the old shape leaked.':
  '호출부 세 곳이 느슨한 타입에 기대고 있었습니다. 이건 좋은 쪽의 깨짐입니다. 옛 형태가 어디로 새어 나갔는지 컴파일러가 정확히 짚어 줍니다.',
'Verifying': '검증',
'Two lint findings left over from the extraction: an unused parameter and an import order. Both mechanical.':
  '추출 과정에서 남은 린트 두 건. 안 쓰는 파라미터와 import 순서입니다. 둘 다 기계적인 수정입니다.',
'Coverage held at 94% with no assertion changes.': '단정문 변경 없이 커버리지 94% 유지.',
'this is the cleanest that module has looked in two years. no test edits, which is the part i care about':
  '그 모듈이 2년 만에 가장 깔끔해졌네요. 테스트를 안 고친 게 제일 마음에 듭니다',
'Refactor complete. Same 55 assertions, same behaviour, four fewer layers of indirection. Nothing in the test suite was edited, which is the only proof that matters here.':
  '리팩터링 완료. 같은 55개 단정문, 같은 동작, 간접 계층 4개 감소. 테스트 스위트는 한 줄도 고치지 않았고, 이 작업에서 의미 있는 증거는 그것뿐입니다.',
'+178 / -30': '+178 / -30', '0 assertions changed': '단정문 변경 0',
'coverage 94%': '커버리지 94%',

/* 신규 구축 */
'Scaffolding': '스캐폴딩',
'Start the new module from scratch. Set up the project, write the core type, one real module, and a test that actually runs.':
  '새 모듈을 맨바닥부터 시작해 주세요. 프로젝트 셋업, 핵심 타입, 실제로 동작하는 모듈 하나, 그리고 실제로 돌아가는 테스트까지.',
'Nothing exists yet, so the ordering matters: dependency manifest, then the smallest type everything else depends on, then one vertical slice that proves the wiring works end to end.':
  '아직 아무것도 없으니 순서가 중요합니다. 의존성 매니페스트, 그다음 나머지 전부가 의존하는 가장 작은 타입, 그다음 배선이 끝까지 통하는지 증명하는 수직 슬라이스 하나.',
'Set up the project and dependencies': '프로젝트와 의존성 셋업',
'Write the core domain type': '핵심 도메인 타입 작성',
'Write one real module on top of it': '그 위에 실제 모듈 하나 작성',
'Get a green test run': '테스트 초록불 만들기',
'Workspace installed and locked.': '워크스페이스 설치 및 락 완료.',
'Core types': '핵심 타입',
'Money is an integer with a currency and nothing else. Every bug I have ever seen in a pricing path started with a float sneaking in here.':
  'Money 는 통화가 붙은 정수이고, 그 이상은 아닙니다. 가격 계산 경로에서 본 모든 버그는 여기에 float 이 끼어드는 데서 시작했습니다.',
'First module': '첫 모듈',
'First green run': '첫 초록불',
'Expected — the factory helpers do not exist yet. Writing them now.':
  '예상했던 실패입니다. 팩토리 헬퍼가 아직 없습니다. 지금 작성합니다.',
'Running and healthy on the first boot.': '첫 부팅에 정상 동작.',
'wait, this already builds and has tests? i was going to spend the afternoon on the scaffold':
  '벌써 빌드도 되고 테스트도 있어요? 오후 내내 스캐폴드 잡을 생각이었는데',
'Module bootstrapped: dependencies locked, core type written, one real vertical slice on top of it, tests green, dev server booting, production build clean.':
  '모듈 부트스트랩 완료. 의존성 락, 핵심 타입 작성, 그 위 실제 수직 슬라이스 하나, 테스트 초록, 개발 서버 정상 부팅, 프로덕션 빌드 클린.',
'6 files created': '파일 6개 생성', '+412 lines': '+412줄',
'tests green': '테스트 초록', 'build clean': '빌드 클린',

/* 테스트 강화 */
'Surveying': '현황 조사',
'Coverage on {A} is below the gate and the audit has open findings. Close both. Do not lower any threshold to make it pass.':
  '{A}의 커버리지가 게이트 아래이고 보안 감사 지적도 열려 있습니다. 둘 다 닫아 주세요. 통과시키려고 기준을 내리지는 마세요.',
'The rule here is that a gate is only meaningful if it never moves down. If I cannot reach the number I write the tests, I do not edit the number.':
  '게이트는 내려가지 않을 때만 의미가 있습니다. 숫자에 못 닿으면 테스트를 쓰고, 숫자를 고치지는 않습니다.',
'Find the uncovered branches': '커버되지 않은 분기 찾기',
'Add property and concurrency tests': '프로퍼티·동시성 테스트 추가',
'Close the dependency audit findings': '의존성 감사 지적 처리',
'Tighten the CI gate': 'CI 게이트 강화',
'The uncovered lines are all the error paths — the happy path is well covered and the failure modes are not, which is exactly backwards.':
  '커버되지 않은 줄이 전부 에러 경로입니다. 정상 경로는 잘 덮여 있고 실패 모드는 아닌데, 정확히 거꾸로입니다.',
'Writing tests': '테스트 작성',
'The concurrency test found a real one on the first run. That is not a flaky test — the invariant genuinely does not hold under parallel writers.':
  '동시성 테스트가 첫 실행에 실제 버그를 잡았습니다. 불안정한 테스트가 아닙니다. 병렬 writer 하에서 불변식이 진짜로 깨집니다.',
'Gate raised to 90% and met at 94%.': '게이트 90% 로 올리고 94% 로 충족.',
'Audit': '보안 감사',
'One moderate finding, reachable only through a dependency we do not call into. Bumping it anyway — arguing about reachability costs more than the upgrade.':
  'moderate 한 건인데, 우리가 호출하지 않는 의존성을 통해서만 도달합니다. 그래도 올립니다. 도달 가능성을 따지는 비용이 업그레이드보다 큽니다.',
'All gates green with the stricter thresholds.': '더 엄격한 기준으로 모든 게이트 초록.',
'coverage gate at 90 and the concurrency test caught an actual bug. that is the good outcome':
  '커버리지 게이트 90 이고 동시성 테스트가 실제 버그를 잡았네요. 좋은 결과입니다',
'Hardened. Coverage gate raised rather than lowered, a real concurrency bug found by the new property test, and the audit findings closed by upgrading instead of suppressing.':
  '강화 완료. 커버리지 게이트를 내리지 않고 올렸고, 새 프로퍼티 테스트가 실제 동시성 버그를 찾았고, 감사 지적은 무시가 아니라 업그레이드로 닫았습니다.',
'gate 90% (was 80%)': '게이트 90% (이전 80%)', '1 real bug found': '실제 버그 1건 발견',
'0 audit findings': '감사 지적 0건',

/* 마이그레이션 */
'Planning the migration': '마이그레이션 계획',
'We need the new column live without a maintenance window. Plan it, generate it, apply it to staging, then production.':
  '점검 시간 없이 새 컬럼을 올려야 합니다. 계획하고, 생성하고, 스테이징에 적용한 다음 프로덕션까지 진행해 주세요.',
'Zero downtime means the migration has to be compatible in both directions for one release: add nullable, backfill in batches, then make it required in a later change. Never all three at once.':
  '무중단이란 한 릴리스 동안 마이그레이션이 양방향으로 호환돼야 한다는 뜻입니다. nullable 로 추가, 배치로 백필, NOT NULL 은 다음 변경에서. 세 개를 한 번에 하지 않습니다.',
'Write the migration as an additive change': '마이그레이션을 추가형 변경으로 작성',
'Regenerate the typed query layer': '타입 쿼리 레이어 재생성',
'Apply to staging and verify': '스테이징 적용 및 검증',
'Roll out to production': '프로덕션 롤아웃',
'Plan: additive nullable column, concurrent index, batched backfill, and the NOT NULL constraint deferred to the next release. Old pods keep working the whole way.':
  '계획은 이렇습니다. nullable 컬럼 추가, concurrent 인덱스, 배치 백필, NOT NULL 제약은 다음 릴리스로 미룸. 구버전 파드가 그 사이에도 계속 동작합니다.',
'Generated and applied locally · schema at head.': '생성 및 로컬 적용 완료 · 스키마 최신.',
'Regenerating': '재생성',
'Staging': '스테이징',
'Staging is on the new schema and the old binary still serves traffic against it. That is the property I needed to confirm before touching production.':
  '스테이징이 새 스키마로 올라갔고, 구버전 바이너리가 그 위에서 여전히 트래픽을 처리합니다. 프로덕션을 건드리기 전에 확인해야 했던 성질입니다.',
'Production': '프로덕션',
'Rolled out with no maintenance window.': '점검 시간 없이 롤아웃 완료.',
'migration went out with zero downtime and no lock waits over 50ms. nice batching':
  '무중단으로 나갔고 50ms 넘는 락 대기도 없었습니다. 배치 잘 나눴네요',
'Migration complete with no maintenance window: additive schema change, concurrent index, batched backfill, and the constraint tightening deferred to the next release.':
  '점검 시간 없이 마이그레이션 완료. 추가형 스키마 변경, concurrent 인덱스, 배치 백필, 제약 강화는 다음 릴리스로 이월.',
'schema at head': '스키마 최신', '0 downtime': '중단 0',
'lock waits < 50ms': '락 대기 50ms 미만', 'rollback tested': '롤백 검증 완료',

/* 코드 리뷰 */
'Reading the queue': '큐 확인',
'Three PRs have been waiting on review since yesterday. Work the queue: read the diffs properly, check out the branches, and only approve what you have actually verified.':
  'PR 세 개가 어제부터 리뷰 대기 중입니다. 큐를 처리해 주세요. diff 를 제대로 읽고, 브랜치를 받아 보고, 직접 검증한 것만 approve 하세요.',
'Reviewing a diff without running it catches style and misses behaviour. For anything touching a concurrency or money path I am going to check the branch out and run the suite myself.':
  '돌려 보지 않고 diff 만 읽으면 스타일은 잡고 동작은 놓칩니다. 동시성이나 금액 경로를 건드리는 건 브랜치를 받아서 직접 스위트를 돌리겠습니다.',
'Read the diff and the linked ticket': 'diff 와 연결된 티켓 읽기',
'Check out the branch and run the suite': '브랜치 받아서 테스트 실행',
'Verify the perf claim independently': '성능 주장 직접 검증',
'Leave comments and a verdict': '코멘트와 결론 남기기',
'The diff is correct and the description is honest about what it does not cover. One thing to check: the author claims a 40% improvement, and that number came from a single run.':
  'diff 는 맞고, 설명도 다루지 못한 부분을 솔직하게 적었습니다. 확인할 게 하나 있습니다. 작성자가 40% 개선을 주장하는데 그 숫자가 단일 실행에서 나왔습니다.',
'Verifying locally': '로컬 검증',
'Checking the claim': '주장 확인',
'The claim holds — I get the same improvement across five runs, and the allocation count dropped too, which the description did not even mention.':
  '주장이 맞습니다. 다섯 번 돌려도 같은 개선이 나오고, 설명에 언급조차 없던 할당 횟수까지 줄었습니다.',
"Adding one test case to the PR: the diff handles the empty input path but nothing exercises it. Pushing it to the author's branch rather than asking them to.":
  'PR 에 테스트 케이스 하나를 추가합니다. diff 가 빈 입력 경로를 처리하는데 그걸 검증하는 테스트가 없습니다. 요청하는 대신 작성자 브랜치에 직접 푸시합니다.',
'Verdict': '결론',
'Review submitted · approved with 2 comments': '리뷰 제출 · 코멘트 2건과 함께 approve',
'thanks for actually running the bench instead of taking my word for it. and for writing the empty-input test':
  '말만 믿지 않고 벤치를 직접 돌려 주셔서 감사합니다. 빈 입력 테스트도 써 주셨네요',
'Queue worked. One PR approved after verifying the perf claim across five runs, one test case added to cover an untested path, two non-blocking comments left on naming.':
  '큐 처리 완료. 성능 주장을 다섯 번 검증한 뒤 PR 하나 approve, 검증되지 않은 경로에 테스트 케이스 하나 추가, 네이밍에 대해 차단하지 않는 코멘트 두 건.',
'3 PRs reviewed': 'PR 3건 리뷰', '1 approved': '1건 approve',
'perf claim verified': '성능 주장 검증', '1 test added': '테스트 1건 추가',

/* 성능 */
'Measuring': '측정',
'p99 on {A} has drifted from 40ms to 280ms over the quarter. Find out why and fix the actual cause. Measure before you change anything.':
  '{A}의 p99 가 분기 동안 40ms 에서 280ms 로 밀렸습니다. 이유를 찾아 실제 원인을 고쳐 주세요. 무엇이든 바꾸기 전에 먼저 측정하세요.',
'No optimisation before a profile. The p50 is fine and only the tail moved, which usually means contention or an allocation cliff rather than an algorithmic problem.':
  '프로파일 없이는 최적화하지 않습니다. p50 은 괜찮고 꼬리만 움직였습니다. 보통 알고리즘 문제가 아니라 경합이나 할당 절벽이라는 뜻입니다.',
'Capture a baseline benchmark': '기준 벤치마크 확보',
'Profile and find the hot path': '프로파일링으로 핫 패스 찾기',
'Rewrite it': '다시 쓰기',
'Prove the win with a benchmark diff': '벤치마크 diff 로 개선 증명',
'Baseline saved. p50 is healthy, the tail is not — so I am looking for something that only hurts under contention.':
  '기준선 저장했습니다. p50 은 건강하고 꼬리는 아닙니다. 경합 상황에서만 아픈 무언가를 찾습니다.',
'Profiling': '프로파일링',
'The hot path allocates once per call and takes a lock that is held across work that does not need it. Both are fixable without changing the public shape of the function.':
  '핫 패스가 호출마다 한 번 할당하고, 필요하지 않은 작업까지 감싼 락을 잡습니다. 둘 다 함수의 공개 형태를 바꾸지 않고 고칠 수 있습니다.',
'Two findings: an allocation per call that can be packed into a single word, and a lock held across work that could happen outside it. Doing the allocation first — it is the safer of the two.':
  '두 가지를 찾았습니다. 한 워드로 packing 할 수 있는 호출당 할당, 그리고 바깥에서 해도 되는 작업까지 감싼 락. 할당부터 처리합니다. 둘 중 더 안전한 쪽입니다.',
'Rewriting': '재작성',
'Allocation gone, 39% off the mean. Now the lock.': '할당 제거, 평균 39% 감소. 이제 락입니다.',
'Caught by the concurrency test — narrowing the lock exposed the same invariant the test was written to protect. Making the update a single atomic step instead.':
  '동시성 테스트에 걸렸습니다. 락을 좁히자 그 테스트가 지키려던 바로 그 불변식이 드러났습니다. 대신 갱신을 하나의 원자적 단계로 만듭니다.',
'Proving it': '증명',
'p99 down 70% · no regressions in 62 tests': 'p99 70% 감소 · 테스트 62건 회귀 없음',
'p99 back under 40ms in prod. the allocation was the easy half, the lock narrowing is the part i would not have gotten right':
  '프로덕션 p99 다시 40ms 아래입니다. 할당은 쉬운 절반이고, 락 좁히기는 제가 못 맞췄을 부분이네요',
'p99 is back under 40ms in production, down from 280ms. The win came from removing a per-call allocation and making a lock-protected update atomic, both proven with a benchmark diff across five runs.':
  '프로덕션 p99 가 280ms 에서 40ms 아래로 돌아왔습니다. 호출당 할당 제거와 락으로 보호된 갱신의 원자화에서 나온 개선이고, 둘 다 다섯 번의 벤치마크 diff 로 증명했습니다.',
'p99 280ms → 38ms': 'p99 280ms → 38ms', '-71% mean': '평균 -71%',
'-71% allocations': '할당 -71%', '62 tests green': '테스트 62건 초록',
},
};

/* 작업 영역 이름 — 에이전트 대사 안에 들어간다 */
const AREA = {
  ko: {
    'checkout pricing': '결제 가격 계산',
    'the transfer ledger': '이체 원장',
    'the order state machine': '주문 상태 기계',
    'the edge rate limiter': '엣지 레이트 리미터',
    'the payments node pool': '결제 노드 풀',
  },
};

const LANGS = {
  en: { label: 'English', icon: 'EN' },
  ko: { label: '한국어', icon: 'KO' },
};

/** 문장 하나를 번역한다. 사전에 없으면 원문 그대로. */
function tr(lang, text, tk) {
  if (lang === 'en' || !text) return text;
  const dict = SCRIPT[lang]; if (!dict) return text;
  const area = tk ? tk.area : null;
  let key = String(text);
  if (tk) {
    key = key.split(tk.id).join('{T}');
    if (area) key = key.split(area).join('{A}');
    if (tk.repoName) key = key.split(tk.repoName).join('{R}');
  }
  let out = dict[key];
  if (out === undefined) return text;
  if (tk) {
    const areaL = (AREA[lang] && AREA[lang][area]) || area;
    out = out.split('{T}').join(tk.id).split('{A}').join(areaL).split('{R}').join(tk.repoName);
  }
  return out;
}

/** build() 결과의 비트를 통째로 번역한다. */
function localize(run, lang) {
  if (lang === 'en') return run;
  const tk = run.ticket;
  const t = s => tr(lang, s, tk);
  for (const b of run.beats) {
    if (b.text) b.text = t(b.text);
    if (b.label) b.label = t(b.label);
    if (b.title) b.title = t(b.title);
    if (b.t === 'todo' && b.items) for (const i of b.items) i.text = t(i.text);
    if (b.t === 'done' && b.stats) b.stats = b.stats.map(t);
  }
  run.title = t(run.title);
  return run;
}

/** 런처·크롬 문자열. 영어일 때는 null 을 돌려 HTML 원문을 쓰게 한다. */
function s(lang, key) {
  if (lang === 'en') return null;
  const d = UI[lang];
  return d ? (d[key] !== undefined ? d[key] : null) : null;
}

/** 레이아웃/스택/미션/속도/옵션의 이름과 설명. */
function meta(lang, kind, id) {
  const m = META[lang] && META[lang][kind] && META[lang][kind][id];
  return m ? { label: m[0], hint: m[1] } : null;
}

return { LANGS, tr, localize, s, meta, SCRIPT, UI };
})();

if (typeof module !== 'undefined') module.exports = I18N;
