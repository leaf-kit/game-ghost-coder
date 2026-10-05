/* ════════════════════════════════════════════════════════════════════════
   GHOSTCODER — 장애 대응 (Outage / Incident) · 데이터
   ────────────────────────────────────────────────────────────────────────
   프로덕션 장애가 터지고, 온콜 엔지니어가 수습하는 과정을 한 화면에 담는다.

     왼쪽   장애 신호 — 서비스 상태 그리드, 에러율·p99·SLO 지표, 페이저 알림.
            장애가 번지면 빨개지고, 수습되면 초록으로 돌아온다.
     오른쪽 온콜 터미널 — 장애 대응 명령어가 한 글자씩 "타이핑"되고, 그
            출력이 뜬다. 왼쪽 신호와 싱크를 맞춰 — 롤백을 치면 에러율이 떨어진다.

   명령·출력은 전부 합성이고 아무것도 실행하지 않는다. 실제 온콜이 치는 순서와
   쿼리(kubectl / psql / curl …)를 그대로 옮긴 "그림"이다.
   ════════════════════════════════════════════════════════════════════════ */
"use strict";

const OUT = (() => {

/* 서비스 목록 — 왼쪽 상태 그리드 */
const SERVICES = [
  { id: 'checkout', name: 'checkout-web' },
  { id: 'payments', name: 'payments-api' },
  { id: 'orders', name: 'orders-svc' },
  { id: 'ledger', name: 'ledger-api' },
  { id: 'gateway', name: 'edge-gateway' },
  { id: 'db', name: 'postgres-primary' },
  { id: 'redis', name: 'redis-cache' },
  { id: 'kafka', name: 'kafka-broker' },
];

/* 온콜 프롬프트 */
const PROMPT = '{{g|sre@oncall}}{{d|:}}{{b|~}}{{gr|$}} ';

/* 장애 수명주기 — 단계마다 왼쪽 상태 목표값과, 오른쪽에서 타이핑할 명령/출력.
   st: 서비스 상태 맵(미지정은 ok). m: 지표 목표값(에러율%·p99ms·SLO 예산%).
   alert: 페이저 피드에 추가할 줄. beats: 오른쪽 터미널이 순서대로 타이핑. */
const PHASES = [

{ key: 'calm', title: { ko: '평시', en: 'Steady state' },
  m: { err: 0.3, p99: 180, slo: 99.4 }, st: {},
  alert: { lv: 'ok', t: 'all services healthy · error budget 99.4%' },
  beats: [
    { cmd: 'kubectl get deploy -n payments', out: [
      '{{d|NAME            READY   UP-TO-DATE   AVAILABLE   AGE}}',
      'checkout-web    4/4     4            4           21d',
      'payments-api    6/6     6            6           21d',
      'orders-svc      3/3     3            3           21d',
    ] },
  ],
},

{ key: 'detect', title: { ko: '장애 발생 — 페이저', en: 'Incident — paged' },
  m: { err: 23.5, p99: 4200, slo: 98.1 },
  st: { checkout: 'down', payments: 'degraded', gateway: 'degraded', orders: 'degraded' },
  alert: { lv: 'crit', t: 'PAGER · SEV1 · checkout 5xx 23% · p99 4.2s · payments latency' },
  beats: [
    { say: { ko: '페이지 떴다. 결제 체크아웃 5xx 폭증. 먼저 파드부터.', en: 'Paged. checkout 5xx spiking. Pods first.' },
      cmd: 'kubectl get pods -n payments', out: [
      '{{d|NAME                         READY   STATUS             RESTARTS   AGE}}',
      '{{r|checkout-web-7d9c-4m2k       0/1     CrashLoopBackOff   6          4m}}',
      '{{r|checkout-web-7d9c-9xb1       0/1     CrashLoopBackOff   6          4m}}',
      '{{y|checkout-web-7d9c-pk20       0/1     Running (unready)  0          4m}}',
      'payments-api-5f8c-2qd         1/1     Running            0          5h',
    ] },
    { cmd: 'kubectl top pods -n payments | head -4', out: [
      '{{d|NAME                         CPU(cores)   MEMORY}}',
      '{{r|checkout-web-7d9c-4m2k       980m         512Mi (limit)}}',
      'payments-api-5f8c-2qd         140m         256Mi',
    ] },
  ],
},

{ key: 'triage', title: { ko: '분류 — 무엇이 깨졌나', en: 'Triage — what broke' },
  m: { err: 24.8, p99: 4600, slo: 97.6 },
  st: { checkout: 'down', payments: 'degraded', gateway: 'degraded', orders: 'degraded' },
  alert: { lv: 'warn', t: 'readiness probe failing · HTTP 503 from checkout-web' },
  beats: [
    { cmd: 'kubectl describe pod checkout-web-7d9c-4m2k -n payments | tail -n 8', out: [
      '{{d|  Last State:   Terminated}}',
      '{{d|    Reason:     Error      Exit Code: 1}}',
      '{{r|  Readiness probe failed: HTTP 503 (connection pool timeout)}}',
      '{{d|  Events:  BackOff restarting failed container}}',
    ] },
    { say: { ko: '최근 배포 있었나?', en: 'Any recent deploy?' },
      cmd: 'kubectl rollout history deploy/checkout-web -n payments', out: [
      '{{d|REVISION   CHANGE-CAUSE}}',
      '127        checkout v2026.10.4',
      '{{y|128        checkout v2026.10.5  (deployed 12m ago)}}',
    ] },
  ],
},

{ key: 'diagnose', title: { ko: '원인 — 커넥션 풀 고갈', en: 'Root cause — pool exhausted' },
  m: { err: 26.1, p99: 5200, slo: 96.9 },
  st: { checkout: 'down', payments: 'degraded', gateway: 'degraded', orders: 'degraded', db: 'degraded' },
  alert: { lv: 'crit', t: 'postgres-primary · active connections 200/200 (max)' },
  beats: [
    { cmd: 'kubectl logs deploy/checkout-web -n payments --since=5m | grep -i error | tail -3', out: [
      '{{r|ERROR  HikariPool-1 - Connection is not available, request timed out after 30000ms}}',
      '{{r|ERROR  could not acquire connection from pool}}',
      '{{d|WARN   pool at capacity: active=50 idle=0 waiting=312}}',
    ] },
    { cmd: 'psql -h postgres-primary -tc "select count(*) from pg_stat_activity;"', out: [
      '{{r| 200}}   {{d|(max_connections = 200)}}',
    ] },
    { say: { ko: 'v128이 풀 사이즈를 10→50으로 올렸고 파드 4개 = 200. DB가 터졌다. 롤백한다.', en: 'v128 raised pool 10→50 × 4 pods = 200. DB maxed. Rolling back.' },
      cmd: 'git -C /src/checkout show 128 --stat | grep -i pool', out: [
      '{{y|  db.hikari.maximum-pool-size: 10 -> 50}}',
    ] },
  ],
},

{ key: 'mitigate', title: { ko: '완화 — 롤백', en: 'Mitigate — rollback' },
  m: { err: 11.0, p99: 2400, slo: 96.7 },
  st: { checkout: 'degraded', payments: 'degraded', db: 'degraded' },
  alert: { lv: 'warn', t: 'rollback in progress → revision 127 · draining connections' },
  beats: [
    { cmd: 'kubectl rollout undo deploy/checkout-web -n payments', out: [
      '{{g|deployment.apps/checkout-web rolled back}}',
    ] },
    { cmd: 'kubectl rollout status deploy/checkout-web -n payments', out: [
      '{{d|Waiting for deployment rollout to finish: 2 of 4 updated...}}',
      '{{d|Waiting for deployment rollout to finish: 3 of 4 updated...}}',
      '{{g|deployment "checkout-web" successfully rolled out}}',
    ] },
    { say: { ko: '대기 요청 흘려보내게 커넥션 여유도 확보.', en: 'Give it headroom while the backlog drains.' },
      cmd: 'kubectl scale deploy/checkout-web --replicas=6 -n payments', out: [
      '{{g|deployment.apps/checkout-web scaled}}',
    ] },
  ],
},

{ key: 'recover', title: { ko: '복구 — 신호 안정화', en: 'Recovery — signals settle' },
  m: { err: 1.8, p99: 420, slo: 96.8 },
  st: { checkout: 'ok', payments: 'ok', orders: 'ok', gateway: 'ok', db: 'ok' },
  alert: { lv: 'ok', t: 'error rate falling · pods Running 6/6 · p99 back under 500ms' },
  beats: [
    { cmd: 'kubectl get pods -n payments | grep checkout', out: [
      '{{g|checkout-web-55b8-7td   1/1   Running   0   48s}}',
      '{{g|checkout-web-55b8-q1m   1/1   Running   0   48s}}',
      '{{d|... 6 running}}',
    ] },
    { cmd: 'for i in 1 2 3; do curl -sf -o /dev/null -w "%{http_code} " https://checkout/healthz; done', out: [
      '{{g|200 200 200}}',
    ] },
  ],
},

{ key: 'resolved', title: { ko: '해소 — 포스트모템 예약', en: 'Resolved — postmortem queued' },
  m: { err: 0.4, p99: 190, slo: 96.9 },
  st: {},
  alert: { lv: 'ok', t: 'INCIDENT RESOLVED · MTTR 14m · postmortem #INC-2026 scheduled' },
  beats: [
    { cmd: 'curl -s -o /dev/null -w "%{http_code}  %{time_total}s\\n" https://checkout/healthz', out: [
      '{{g|200  0.041s}}',
    ] },
    { say: { ko: '복구 완료. 타임라인 적어두고 포스트모템.', en: 'Recovered. Writing the timeline, scheduling the postmortem.' },
      cmd: 'echo "INC-2026-1042 resolved · cause: pool size regression v128 · MTTR 14m" >> runbook.log', out: [] },
  ],
},
];

const UI = {
  ko: {
    title: '장애 대응 — 온콜 상황실',
    sub: '프로덕션 인시던트 시뮬레이션 · 합성 데이터',
    left: '장애 신호 · 서비스 상태',
    right: '온콜 터미널 · 대응 명령',
    sev: '심각도', dur: '경과', mttr: 'MTTR', responder: '온콜',
    err: '에러율', p99: 'p99 지연', slo: 'SLO 예산', failing: '실패 요청/분',
    services: '서비스', pager: '페이저', phase: '단계',
    up: '정상', degraded: '저하', down: '장애',
    sim: '합성 · 실제 서비스 아님',
  },
  en: {
    title: 'Incident Response — On-call War Room',
    sub: 'Production incident simulation · synthetic data',
    left: 'Incident signals · service health',
    right: 'On-call terminal · response commands',
    sev: 'severity', dur: 'elapsed', mttr: 'MTTR', responder: 'on-call',
    err: 'error rate', p99: 'p99 latency', slo: 'SLO budget', failing: 'failing req/min',
    services: 'services', pager: 'pager', phase: 'phase',
    up: 'up', degraded: 'degraded', down: 'down',
    sim: 'synthetic · not a real service',
  },
};

return { SERVICES, PHASES, PROMPT, UI };
})();

/* 레이아웃 자가 등록 — scenarios.js 를 수정하지 않고 작업 화면 칩에 추가한다. */
if (typeof SCEN !== 'undefined' && SCEN.LAYOUTS && !SCEN.LAYOUTS.outage) {
  SCEN.LAYOUTS.outage = {
    label: 'Outage — On-call War Room', icon: '🚨',
    hint: 'A production incident in progress. Left: service health, error-rate / p99 / SLO tiles and a pager feed that goes red then recovers. Right: an on-call terminal where the response commands (kubectl, psql, curl) are typed out live — in sync with the signals, so a rollback makes the error rate fall.',
    typing: true,
  };
}

if (typeof module !== 'undefined') module.exports = OUT;
