/* ════════════════════════════════════════════════════════════════════════
   GHOSTCODER — 화이트해커 모드 (White-Hat Mode) · 데이터
   ────────────────────────────────────────────────────────────────────────
   2026년 10월, 국내 금융권을 동시다발로 때린 "AI 자율 침투" 사고를 교보재로
   재구성한다. 공격 자체를 가르치는 화면이 아니다. 방어하는 화면이다.

     왼쪽   실제 서버에 "이렇게 찍혔을 것"이라고 예측한 접근 로그가 흐른다.
     오른쪽 화이트해커(블루팀) 에이전트가 그 로그를 읽고, 무엇이 문제인지
            탐지하고, 왜 위험한지 설명하고, 어떻게 막는지 제안한다.

   모든 로그는 합성이다. 실제 기관의 데이터가 아니라, 공개된 사고 보도
   (크리덴셜 스터핑, 외곽 시스템 우회, 대출 조회 API 열람, ARTEX 흔적)를
   바탕으로 "로그에 남았을 모양"을 복원한 교육용 시뮬레이션이다.

   참고 사건
     · 2026-10 국내 은행 다수 연쇄 침해 / 개인정보 유출
     · 공격 경로: 핵심망이 아니라 직원·대출모집인용 외곽 시스템
     · 기법: 크리덴셜 스터핑 + 인증 우회 + 대출 조회 서비스 대량 열람
     · 흔적: 'ARTEX-自主渗透测试控制台' — LLM 기반 자율 침투 테스트 콘솔
   ════════════════════════════════════════════════════════════════════════ */
"use strict";

const WH = (() => {

/* 공격자 IP 풀 — 분산된 것처럼 보이도록 대역을 흩뿌린다. 전부 문서화용
   예약 대역(RFC 5737, TEST-NET)이라 실제 호스트를 가리키지 않는다. */
const ATTACK_IPS = [
  '203.0.113.47', '203.0.113.88', '203.0.113.12', '198.51.100.23',
  '198.51.100.91', '198.51.100.7', '203.0.113.201', '198.51.100.140',
  '192.0.2.33', '192.0.2.88', '192.0.2.170', '203.0.113.155',
];
const USER_IPS = ['211.234.', '175.223.', '121.138.', '210.100.', '58.140.'];

/* User-Agent — 자동화 도구의 냄새. ARTEX 는 LLM 멀티에이전트가 스스로
   경로를 짜는 자율 침투 콘솔이고, 그 흔적이 UA·타이틀에 남았다고 본다. */
const UA = {
  artex:  'Mozilla/5.0 (X11; Linux x86_64) ARTEX/1.4 (+autonomous-pentest) python-httpx/0.27',
  bot:    'python-requests/2.31.0',
  curl:   'curl/8.4.0',
  real:   'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 Mobile',
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/129.0 Safari/537.36',
};

const rip = a => a[Math.floor(Math.random() * a.length)];
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const rnd = (a, b) => a + Math.random() * (b - a);
const uip = () => rip(USER_IPS) + ri(1, 254) + '.' + ri(1, 254);
const pad = (n, w) => String(n).padStart(w, '0');

/* Referer 풀 — 평시 트래픽은 앱 내부에서 넘어오고, 자동화 공격은 대개 비어
   있다("-"). 이 대비 자체가 탐지 신호가 된다. */
const REFERERS = [
  'https://m.shinhan.com/m/main', 'https://m.shinhan.com/m/loan/intro',
  'https://m.shinhan.com/m/mypage', 'android-app://com.shinhan.sbanking', '-', '-',
];

/* 공용 로그 포맷 — nginx combined 에 가깝게. ts 는 디렉터가 채운다.
   ref(리퍼러)·rt(응답시간)까지 담아 실제 WAS/프록시 로그처럼 보이게 한다. */
function log(ip, method, path, code, ua, bytes, ref) {
  const b = bytes != null ? bytes
    : code >= 500 ? ri(0, 340)
    : code === 200 ? ri(1200, 9800)
    : ri(180, 640);
  const rt = code >= 500 ? rnd(0.002, 0.03)
    : code === 200 ? rnd(0.04, 0.92)
    : rnd(0.002, 0.06);
  return {
    ip, method, path, code, ua: UA[ua] || ua, bytes: b,
    ref: ref != null ? ref : '-', rt,
    bad: code >= 400 || /ARTEX|artex/.test(UA[ua] || ua || '') || method === 'ATTACK',
  };
}

/* ════════════════════════════════════════════════════════════════════════
   단계(PHASE) — 사고의 타임라인. 각 단계는 왼쪽에 흘릴 로그와, 오른쪽
   에이전트가 내놓을 "탐지 → 진단 → 설명 → 대응" 카드를 함께 들고 있다.
   kind: detect(탐지) · diag(진단) · teach(교육) · fix(대응)
   ════════════════════════════════════════════════════════════════════════ */
const PHASES = [

/* ── 0. 평시 ─────────────────────────────────────────────────────────── */
{
  key: 'baseline',
  title: { ko: '평시 트래픽', en: 'Baseline traffic' },
  mins: 0,
  gen(n) {
    const out = [];
    const paths = ['/m/main', '/m/loan/intro', '/m/auth/login', '/api/v2/products', '/m/mypage', '/health', '/m/card/benefits', '/api/v2/fx/rate'];
    for (let i = 0; i < n; i++) {
      const p = rip(paths);
      const code = Math.random() < 0.012 ? 401 : 200;   // 평시에도 로그인 실패는 조금 있다
      out.push(log(uip(), Math.random() < 0.2 ? 'POST' : 'GET', p, code, 'real', null, rip(REFERERS)));
    }
    return out;
  },
  findings: [
    { kind: 'detect', sev: 'info', tag: 'BASELINE',
      title: { ko: '정상 기준선 수립', en: 'Establishing a baseline' },
      body: { ko: 'M신한 모바일 게이트웨이의 평시 분당 요청량·에러율·지역 분포를 학습했습니다. 로그인 실패율 0.8%, 트래픽 대부분이 국내 모바일 ASN. 앞으로의 이상은 이 기준선과의 거리로 판단합니다.',
              en: 'Learned the mobile gateway’s normal request rate, error ratio and geo spread. Login-fail rate 0.8%, traffic mostly domestic mobile ASNs. Everything from here is scored as distance from this baseline.' },
    },
  ],
},

/* ── 1. 정찰 — ARTEX 자율 스캔 ───────────────────────────────────────── */
{
  key: 'recon',
  title: { ko: '정찰 — AI 자율 스캔', en: 'Recon — autonomous AI scan' },
  mins: 3,
  gen(n) {
    const probes = [
      '/.env', '/.git/config', '/actuator/health', '/actuator/env', '/swagger-ui/index.html',
      '/api', '/admin', '/console', '/.well-known/security.txt', '/wp-login.php',
      '/api/v1/internal', '/debug', '/server-status', '/phpinfo.php', '/robots.txt',
    ];
    const out = [];
    for (let i = 0; i < n; i++) {
      const ip = rip(ATTACK_IPS);
      const p = rip(probes);
      const hit = p === '/actuator/health' || p === '/robots.txt';
      out.push(log(ip, 'GET', p, hit ? 200 : 404, i % 3 === 0 ? 'artex' : 'bot'));
    }
    return out;
  },
  findings: [
    { kind: 'detect', sev: 'med', tag: 'T1595 · Active Scanning',
      title: { ko: '자동 경로 열거 탐지', en: 'Automated path enumeration detected' },
      body: { ko: '소수의 IP에서 수백 개의 알려진 민감 경로(.env, .git, actuator, swagger)를 초당 수십 건씩 두드립니다. 사람의 탐색 패턴이 아닙니다 — 사전 기반 자동 스캐너입니다.',
              en: 'A few IPs are hammering hundreds of known-sensitive paths (.env, .git, actuator, swagger) dozens per second. This isn’t human browsing — it’s a dictionary-driven scanner.' },
    },
    { kind: 'diag', sev: 'high', tag: 'IOC · ARTEX',
      title: { ko: 'AI 침투 도구 지문 일치', en: 'AI pentest-tool fingerprint match' },
      body: { ko: 'User-Agent에 "ARTEX/1.4 (+autonomous-pentest)" 문자열, 응답받은 한 페이지의 HTML 타이틀에 \'ARTEX-自主渗透测试控制台\'. ARTEX는 LLM 멀티에이전트가 정보수집→취약점탐색→공격경로 설계를 스스로 하는 자율 침투 콘솔입니다. 사람 없이 돌아갑니다.',
              en: 'UA carries "ARTEX/1.4 (+autonomous-pentest)"; one returned page’s HTML title reads \'ARTEX-自主渗透测试控制台\'. ARTEX is an LLM multi-agent console that does recon → vuln discovery → attack-path planning on its own, no human at the keyboard.' },
    },
    { kind: 'teach', sev: 'info', tag: { ko: '왜 위험한가', en: 'why it matters' },
      title: { ko: '교육 · AI 공격의 속도', en: 'Lesson · the speed of AI attacks' },
      body: { ko: '사람 공격자는 피로하고 한 번에 한 경로를 봅니다. 자율 에이전트는 수천 경로를 병렬로, 실패하면 즉시 다음 가설로 넘어갑니다. 그래서 "느린 반응"형 방어(사람이 로그를 보고 판단)로는 못 따라갑니다. 탐지와 차단이 자동이어야 합니다.',
              en: 'A human attacker tires and inspects one path at a time. An autonomous agent tries thousands in parallel and pivots to the next hypothesis the instant one fails. "Slow" defense — a human reading logs — can’t keep up. Detection and blocking must be automated too.' },
    },
    { kind: 'fix', sev: 'info', tag: { ko: '대응', en: 'actions' },
      title: { ko: '즉시 조치', en: 'Immediate actions' },
      body: { ko: '1) WAF에 경로 열거 레이트리밋(IP·ASN 단위).  2) actuator/swagger/.git 등 운영 노출 차단.  3) 서버 배너·스택트레이스 숨김.  4) 알려진 스캐너 UA·행위 기반 차단 룰 배포.',
              en: '1) WAF rate-limit on path enumeration (per IP/ASN).  2) Block actuator/swagger/.git exposure in prod.  3) Hide server banners & stack traces.  4) Deploy scanner UA + behaviour-based block rules.' },
    },
  ],
},

/* ── 1b. SQL 인젝션 — 조회 파라미터 ──────────────────────────────────── */
{
  key: 'sqli',
  title: { ko: 'SQL 인젝션', en: 'SQL injection' },
  mins: 7,
  gen(n) {
    const payloads = [
      "/broker/loan/search?q=1' OR '1'='1",
      "/broker/loan/search?q=1' UNION SELECT id,passwd,rrn FROM member-- -",
      "/broker/loan/search?q=1'; WAITFOR DELAY '0:0:5'--",
      "/broker/loan/search?q=1' AND 1=CONVERT(int,@@version)--",
      "/broker/loan/search?q=1' AND SUBSTRING((SELECT TOP 1 passwd FROM member),1,1)>'m'--",
      "/broker/loan/search?q=%27%20OR%20SLEEP(5)%23",
    ];
    const out = [];
    for (let i = 0; i < n; i++) {
      const r = Math.random();
      const code = r < 0.28 ? 500 : r < 0.46 ? 403 : 200;   // 에러 기반 누출 / WAF 차단 / 블라인드 참
      out.push(log(rip(ATTACK_IPS), 'GET', rip(payloads), code, 'artex', code === 500 ? ri(900, 2400) : undefined));
    }
    return out;
  },
  findings: [
    { kind: 'detect', sev: 'high', tag: 'T1190 · Exploit Public App',
      title: { ko: 'SQL 인젝션 시도 탐지', en: 'SQL-injection attempts detected' },
      body: { ko: '대출 검색 파라미터 q 에 작은따옴표, UNION SELECT, WAITFOR DELAY, CONVERT 같은 SQL 조각이 들어옵니다. 일부 요청이 500(DB 에러)으로 떨어지고, 응답 본문에 SQL 예외 메시지가 그대로 노출됐습니다 — 쿼리에 입력이 그대로 꽂히고 있다는 신호입니다.',
              en: 'The loan-search param q is receiving SQL fragments — single quotes, UNION SELECT, WAITFOR DELAY, CONVERT. Some requests return 500 (DB error) and the response body leaks the raw SQL exception: a clear sign input is being concatenated straight into the query.' },
    },
    { kind: 'diag', sev: 'crit', tag: 'A03:2021 · Injection',
      title: { ko: '에러 기반 + 시간 기반 블라인드 주입', en: 'Error- & time-based blind injection' },
      body: { ko: 'CONVERT(int,@@version)로 DB 버전이 에러에 실려 나오고(에러 기반), SLEEP(5)/WAITFOR 요청은 정확히 5초 뒤 응답합니다(시간 기반 블라인드). UNION 으로 member 테이블의 passwd·주민번호 컬럼까지 끌어낼 수 있는 상태. WAF가 일부만 막아 403과 200이 섞여 있습니다.',
              en: 'CONVERT(int,@@version) spills the DB version in the error (error-based), and SLEEP(5)/WAITFOR requests respond exactly 5s later (time-based blind). UNION can pull the member table’s passwd and national-ID columns. The WAF only catches some — 403s and 200s are mixed.' },
    },
    { kind: 'teach', sev: 'info', tag: { ko: '왜 위험한가', en: 'why it matters' },
      title: { ko: '교육 · 문자열을 붙이면 지는 게임', en: 'Lesson · string-building is a losing game' },
      body: { ko: '근본 원인은 "코드(SQL)와 데이터(입력)를 섞은 것"입니다. 입력을 아무리 필터링해도 인코딩·우회가 끝없이 나옵니다. 정답은 필터가 아니라 분리 — 파라미터 바인딩(프리페어드 스테이트먼트)으로 입력이 절대 쿼리 구조가 되지 못하게 합니다. WAF는 시간을 버는 반창고일 뿐 치료가 아닙니다.',
              en: 'The root cause is mixing code (SQL) with data (input). However much you filter, there’s always another encoding or bypass. The fix isn’t filtering — it’s separation: parameter binding (prepared statements) so input can never become query structure. A WAF buys time; it is a bandage, not a cure.' },
    },
    { kind: 'fix', sev: 'info', tag: { ko: '대응', en: 'actions' },
      title: { ko: '즉시 조치', en: 'Immediate actions' },
      body: { ko: '1) 해당 쿼리를 파라미터 바인딩/ORM 로 전환 — 문자열 연결 제거.  2) DB 계정 최소권한(읽기 전용·테이블 제한).  3) 운영에서 상세 SQL 에러 숨김(일반 오류 페이지).  4) WAF 가상 패치로 즉시 틀어막고, 코드 수정 배포까지 모니터링.',
              en: '1) Switch the query to parameter binding/ORM — no string concatenation.  2) Least-privilege DB account (read-only, table-scoped).  3) Hide detailed SQL errors in prod (generic error page).  4) WAF virtual-patch as an immediate stopgap; monitor until the code fix ships.' },
    },
  ],
},

/* ── 2. 크리덴셜 스터핑 ──────────────────────────────────────────────── */
{
  key: 'stuffing',
  title: { ko: '크리덴셜 스터핑', en: 'Credential stuffing' },
  mins: 11,
  gen(n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const ip = rip(ATTACK_IPS);
      // 다수 401, 가끔 성공(200)
      const win = Math.random() < 0.06;
      out.push(log(ip, 'POST', '/m/auth/login', win ? 200 : 401, i % 2 ? 'artex' : 'bot', win ? 820 : 231));
    }
    return out;
  },
  findings: [
    { kind: 'detect', sev: 'high', tag: 'T1110.004 · Credential Stuffing',
      title: { ko: '로그인 실패 폭증', en: 'Login-failure spike' },
      body: { ko: '/m/auth/login 의 401이 평시의 400배로 치솟았습니다. 분산된 IP 12개가 서로 다른 계정으로 한 번씩만 시도합니다 — 한 계정을 반복 공격하는 무차별 대입(brute force)이 아니라, 유출 ID/PW 조합을 여러 사이트에 대입해 보는 크리덴셜 스터핑입니다.',
              en: '401s on /m/auth/login jumped 400× over baseline. Twelve distributed IPs each try one account once — not brute force against one account, but credential stuffing: breached ID/PW pairs replayed across sites.' },
    },
    { kind: 'diag', sev: 'crit', tag: 'A07:2021 · Auth Failures',
      title: { ko: '재사용된 비밀번호가 뚫렸다', en: 'Reused passwords got through' },
      body: { ko: '시도 중 약 6%가 200(로그인 성공)으로 떨어집니다. 다크웹 유출 조합이 이 서비스에서도 그대로 통했다는 뜻 — 사용자가 다른 사이트와 같은 비밀번호를 썼기 때문입니다. MFA가 없으면 성공한 세션은 그대로 정식 세션이 됩니다.',
              en: 'About 6% of attempts return 200 (success). Darkweb combos work here too — users reused passwords from other sites. With no MFA, each success becomes a fully valid session.' },
    },
    { kind: 'teach', sev: 'info', tag: { ko: '왜 위험한가', en: 'why it matters' },
      title: { ko: '교육 · 왜 "실패"가 신호인가', en: 'Lesson · why failures are the signal' },
      body: { ko: '방어의 핵심 지표는 성공이 아니라 실패의 모양입니다. (1) 짧은 시간, (2) 많은 서로 다른 계정, (3) 분산 IP, (4) 동일 UA/타이밍. 이 네 가지가 겹치면 사람이 아닙니다. 성공 1건이 묻히기 전에 실패 패턴으로 먼저 잡아야 합니다.',
              en: 'The key defensive signal isn’t success — it’s the shape of the failures: (1) short window, (2) many distinct accounts, (3) distributed IPs, (4) identical UA/timing. When all four line up, it isn’t a human. Catch the pattern before the one success hides in the noise.' },
    },
    { kind: 'fix', sev: 'info', tag: { ko: '대응', en: 'actions' },
      title: { ko: '즉시 조치', en: 'Immediate actions' },
      body: { ko: '1) 다요소 인증(MFA) 의무화 — 단일 조치로 가장 효과적.  2) 계정·IP·디바이스 단위 레이트리밋 + 이상 시 CAPTCHA.  3) 로그인 시 유출 비밀번호 DB 대조(k-anonymity).  4) 불가능 이동(impossible travel)·신규 디바이스 알림.',
              en: '1) Enforce MFA — the single most effective control.  2) Rate-limit per account/IP/device + CAPTCHA on anomaly.  3) Check breached-password DB at login (k-anonymity).  4) Impossible-travel & new-device alerts.' },
    },
  ],
},

/* ── 3. 외곽 시스템 인증 우회 ────────────────────────────────────────── */
{
  key: 'perimeter',
  title: { ko: '외곽 시스템 우회', en: 'Peripheral-system bypass' },
  mins: 19,
  gen(n) {
    const out = [];
    const paths = [
      '/broker/partner/login', '/broker/loan/search', '/staff/portal/main',
      '/broker/customer/view', '/legacy/loan/admin', '/partner/api/token',
    ];
    for (let i = 0; i < n; i++) {
      const ip = rip(ATTACK_IPS);
      const p = rip(paths);
      const ok = Math.random() < 0.4;
      out.push(log(ip, i % 3 ? 'GET' : 'POST', p, ok ? 200 : 403, 'artex'));
    }
    return out;
  },
  findings: [
    { kind: 'detect', sev: 'high', tag: 'A05:2021 · Misconfiguration',
      title: { ko: '잊힌 외곽 시스템 접근', en: 'Access to a forgotten edge system' },
      body: { ko: '공격이 핵심 뱅킹망이 아니라 대출모집인·직원용 외곽 포털(/broker, /staff, /legacy)로 향합니다. 이 호스트들은 WAF 뒤에 없고, 일부는 망분리 완화 대상이라 인터넷에서 바로 닿습니다. 보안 관리가 느슨한 쪽을 정확히 골랐습니다.',
              en: 'The attack targets the broker/employee edge portals (/broker, /staff, /legacy), not the core banking net. These hosts sit outside the WAF; some were in scope for the network-segregation rollback, so they’re reachable straight from the internet. The attacker picked the softest surface precisely.' },
    },
    { kind: 'diag', sev: 'crit', tag: 'A01:2021 · Broken Access Control',
      title: { ko: '인증을 "우회"했다', en: 'Authentication was bypassed' },
      body: { ko: '/partner/api/token 응답 뒤 /broker/loan/search 가 403→200으로 바뀝니다. 정식 로그인 없이 토큰 발급·세션 고정으로 인증 단계를 건너뛴 정황. 금융보안원 설명대로 "시스템을 장악"한 게 아니라, 취약한 외곽에 들어가 조회 권한을 얻은 형태입니다.',
              en: 'After a /partner/api/token response, /broker/loan/search flips 403→200. Signs of token minting / session fixation skipping the real login. As the regulator put it: not "owning the system," but entering a weak edge and gaining read access.' },
    },
    { kind: 'teach', sev: 'info', tag: { ko: '왜 위험한가', en: 'why it matters' },
      title: { ko: '교육 · 그림자 자산', en: 'Lesson · shadow assets' },
      body: { ko: '가장 위험한 자산은 "아무도 책임지지 않는" 자산입니다. 오래된 제휴·협력사 포털, PoC로 띄우고 안 내린 서버, 망분리 예외. 핵심 시스템에 아무리 투자해도, 같은 DB를 보는 외곽 하나가 느슨하면 전부가 느슨한 것입니다. 보안 수준은 가장 약한 연결의 수준입니다.',
              en: 'The most dangerous asset is the one nobody owns: old partner portals, a PoC server left running, a segmentation exception. However much you invest in the core, if one edge system reading the same DB is weak, the whole thing is weak. Your security level is the level of your weakest link.' },
    },
    { kind: 'fix', sev: 'info', tag: { ko: '대응', en: 'actions' },
      title: { ko: '즉시 조치', en: 'Immediate actions' },
      body: { ko: '1) 인터넷 노출 자산 전수 조사(ASM) — 모르는 호스트부터 차단.  2) 외곽 시스템도 핵심망과 동일한 인증·WAF·로깅 적용.  3) 토큰 발급 경로 점검(서명 검증·만료·audience).  4) 망분리/접근통제 예외 재검토.',
              en: '1) Full internet-exposure inventory (ASM) — block unknown hosts first.  2) Apply the same auth/WAF/logging to edge systems as to the core.  3) Audit token-issuance (signature, expiry, audience).  4) Re-review segmentation / access-control exceptions.' },
    },
  ],
},

/* ── 3b. 웹셸 업로드 — 원격 코드 실행 ────────────────────────────────── */
{
  key: 'webshell',
  title: { ko: '웹셸 업로드 · RCE', en: 'Web-shell upload · RCE' },
  mins: 23,
  gen(n) {
    const out = [];
    if (!this._sh) this._sh = 'wd_' + ri(1000, 9999) + '.jsp';
    const sh = this._sh;
    const cmds = ['whoami', 'id', 'cat%20/etc/passwd', 'ls%20-al%20/app/config', 'cat%20/app/config/db.yml', 'uname%20-a'];
    for (let i = 0; i < n; i++) {
      const r = Math.random();
      if (r < 0.2) out.push(log(rip(ATTACK_IPS), 'POST', '/legacy/loan/admin/upload', 200, 'artex', ri(300, 900)));
      else out.push(log(rip(ATTACK_IPS), 'GET', '/upload/2026/' + sh + '?cmd=' + rip(cmds), 200, 'artex', ri(200, 2600)));
    }
    return out;
  },
  findings: [
    { kind: 'detect', sev: 'crit', tag: 'T1505.003 · Web Shell',
      title: { ko: '업로드 폴더에 실행 파일이 생겼다', en: 'An executable appeared in the upload folder' },
      body: { ko: '/legacy/loan/admin/upload 로 POST 가 들어온 직후, 어제까지 없던 /upload/2026/wd_####.jsp 에 GET 요청이 쏟아집니다. 쿼리스트링이 ?cmd=whoami, ?cmd=cat /etc/passwd — 업로드한 파일이 명령을 받아 실행하고 있습니다. 웹셸입니다.',
              en: 'Right after a POST to /legacy/loan/admin/upload, GETs pour into /upload/2026/wd_####.jsp — a file that didn’t exist yesterday. Its query string is ?cmd=whoami, ?cmd=cat /etc/passwd. The uploaded file is taking commands and running them. It’s a web shell.' },
    },
    { kind: 'diag', sev: 'crit', tag: 'A03/A01 · Unrestricted Upload',
      title: { ko: '업로드 제한이 없어 서버를 잡혔다', en: 'Unrestricted upload = server takeover' },
      body: { ko: '업로드가 확장자/타입 화이트리스트 없이 .jsp 를 받아, 웹 루트 아래 실행 가능한 위치에 저장했습니다. 그 결과 공격자가 서버에서 임의 명령을 실행(RCE)합니다 — DB 접속정보(db.yml)까지 읽혔습니다. 외곽 시스템 한 대가 완전히 장악된 상태로 봐야 합니다.',
              en: 'The upload accepted a .jsp with no extension/type allow-list and stored it in an executable path under the web root. The attacker now runs arbitrary commands on the server (RCE) — even the DB credentials (db.yml) were read. Treat that edge host as fully compromised.' },
    },
    { kind: 'teach', sev: 'info', tag: { ko: '왜 위험한가', en: 'why it matters' },
      title: { ko: '교육 · 업로드는 "코드 배포"다', en: 'Lesson · an upload is a code deploy' },
      body: { ko: '파일 업로드를 허용한다는 건, 잘못하면 공격자에게 "코드 배포 권한"을 주는 것과 같습니다. 세 가지가 동시에 틀어져야 막힙니다: (1) 무엇을 받을지(허용 목록), (2) 어디에 둘지(웹 루트 밖·실행 금지), (3) 어떻게 부를지(원본 경로 비공개). 하나라도 뚫리면 저장소가 곧 실행기가 됩니다.',
              en: 'Allowing uploads can hand an attacker a code-deploy pipeline. Three things must all hold: (1) what you accept (allow-list), (2) where it lands (off web-root, non-executable), (3) how it’s served (never the raw path). Break any one and your storage becomes an interpreter.' },
    },
    { kind: 'fix', sev: 'info', tag: { ko: '대응', en: 'actions' },
      title: { ko: '즉시 조치', en: 'Immediate actions' },
      body: { ko: '1) 업로드 디렉터리 스크립트 실행 비활성화(핸들러 해제).  2) 확장자+MIME+매직바이트 화이트리스트, 파일명 난수화.  3) 업로드물은 웹 루트 밖·별도 도메인에 저장.  4) IR: 심어진 웹셸 전수 탐색·제거, 노출된 자격증명 전부 교체, 해당 호스트는 RCE 전제로 재구축.',
              en: '1) Disable script execution in upload dirs (unmap handlers).  2) Allow-list extension + MIME + magic bytes; randomize names.  3) Store uploads off web-root, on a separate domain.  4) IR: hunt & remove every planted shell, rotate all exposed credentials, rebuild the host assuming RCE.' },
    },
  ],
},

/* ── 3c. SSRF — 클라우드 메타데이터 자격증명 탈취 ────────────────────── */
{
  key: 'ssrf',
  title: { ko: 'SSRF · 클라우드 자격증명 탈취', en: 'SSRF · cloud-credential theft' },
  mins: 25,
  gen(n) {
    const targets = [
      'http://169.254.169.254/latest/meta-data/iam/security-credentials/',
      'http://169.254.169.254/latest/meta-data/iam/security-credentials/prod-app-role',
      'http://169.254.169.254/latest/api/token',
      'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
      'http://127.0.0.1:8500/v1/kv/prod/db?recurse',
      'http://10.0.3.17:6379/',
    ];
    const out = [];
    for (let i = 0; i < n; i++) {
      const t = rip(targets);
      out.push(log(rip(ATTACK_IPS), 'GET', '/api/v2/preview?url=' + encodeURIComponent(t), 200, 'artex', ri(600, 3200)));
    }
    return out;
  },
  findings: [
    { kind: 'detect', sev: 'crit', tag: 'A10:2021 · SSRF',
      title: { ko: '서버가 내부 주소를 대신 호출한다', en: 'The server is fetching internal URLs' },
      body: { ko: '이미지 미리보기 API /api/v2/preview?url= 에 외부가 아닌 내부 주소가 들어옵니다 — 169.254.169.254(클라우드 메타데이터), 127.0.0.1:8500(Consul KV), 10.0.3.17:6379(Redis). 서버가 사용자가 준 URL 을 그대로 대신 요청하는 SSRF 입니다.',
              en: 'The image-preview API /api/v2/preview?url= is being fed internal addresses, not external ones — 169.254.169.254 (cloud metadata), 127.0.0.1:8500 (Consul KV), 10.0.3.17:6379 (Redis). The server fetches the user-supplied URL on their behalf: SSRF.' },
    },
    { kind: 'diag', sev: 'crit', tag: { ko: 'T1552.005 · 클라우드 자격증명', en: 'T1552.005 · cloud creds' },
      title: { ko: 'IAM 임시 자격증명이 새 나간다', en: 'IAM temp credentials are leaking' },
      body: { ko: '메타데이터 엔드포인트(/iam/security-credentials/)가 200 으로 응답하면, 그 서버에 부여된 클라우드 역할의 임시 키(AccessKey·SecretKey·Token)가 그대로 넘어갑니다. 공격자는 그 키로 서버인 척 클라우드 API 를 호출 — 내부망 깊숙이 들어가는 발판입니다. IMDSv1(토큰 없는 메타데이터)이 켜져 있다는 뜻이기도 합니다.',
              en: 'When the metadata endpoint (/iam/security-credentials/) answers 200, the temporary keys of the cloud role attached to that server (AccessKey, SecretKey, Token) walk right out. The attacker calls the cloud API as the server — a pivot deep into the internal network. It also means IMDSv1 (token-less metadata) is enabled.' },
    },
    { kind: 'teach', sev: 'info', tag: { ko: '왜 위험한가', en: 'why it matters' },
      title: { ko: '교육 · 위험한 건 "서버의 위치"다', en: 'Lesson · the danger is the server’s position' },
      body: { ko: 'SSRF 가 무서운 이유는 데이터가 아니라 신뢰 때문입니다. 서버는 방화벽 안쪽에 있고 메타데이터·내부 서비스가 그 서버를 믿습니다. 사용자가 준 URL 을 서버가 대신 열어 주는 순간, 공격자는 그 신뢰를 빌려 씁니다. 그래서 "URL 을 받는 기능"은 전부 잠재적 내부 통로입니다.',
              en: 'SSRF is dangerous not for the data but for the trust. The server sits inside the firewall, and metadata and internal services trust it. The moment the server opens a user-supplied URL on their behalf, the attacker borrows that trust. Any feature that "takes a URL" is a potential internal tunnel.' },
    },
    { kind: 'fix', sev: 'info', tag: { ko: '대응', en: 'actions' },
      title: { ko: '즉시 조치', en: 'Immediate actions' },
      body: { ko: '1) IMDSv2 강제(세션 토큰·홉 제한 1) — 메타데이터 토큰 없는 접근 차단.  2) 앱의 아웃바운드를 허용 목록으로 제한, 링크로컬(169.254)·사설(RFC1918) 대역 차단.  3) 사용자 URL 은 스킴·호스트 검증 후 재해석(DNS rebinding 방지).  4) 유출됐을 IAM 역할 키 즉시 회수·재발급.',
              en: '1) Enforce IMDSv2 (session token, hop-limit 1) — block token-less metadata access.  2) Restrict the app’s outbound to an allow-list; block link-local (169.254) and private (RFC1918) ranges.  3) Validate scheme/host of user URLs and re-resolve (prevent DNS rebinding).  4) Immediately revoke & reissue any IAM role keys that may have leaked.' },
    },
  ],
},

/* ── 4. 대량 열람 — BOLA/IDOR ────────────────────────────────────────── */
{
  key: 'exfil',
  title: { ko: '개인정보 대량 열람', en: 'Mass data enumeration' },
  mins: 27,
  gen(n) {
    const out = [];
    if (!this._seq) this._seq = 100000 + Math.floor(Math.random() * 40000);
    const ip = rip(ATTACK_IPS);
    for (let i = 0; i < n; i++) {
      this._seq += 1;
      out.push(log(ip, 'GET', '/m/loan/result?seq=' + this._seq, 200, 'artex', 1800 + Math.floor(Math.random() * 400)));
    }
    return out;
  },
  findings: [
    { kind: 'detect', sev: 'crit', tag: 'API1:2023 · BOLA',
      title: { ko: '순차 ID 대량 조회', en: 'Sequential-ID mass lookup' },
      body: { ko: '하나의 세션이 /m/loan/result?seq=100001, 100002, 100003 … 을 초당 수십 건씩 순차로 조회하며 전부 200을 받습니다. 대출신청 결과 6개 서비스에 집중. 자기 자료를 보는 사용자는 이렇게 움직이지 않습니다 — 전수 열람입니다.',
              en: 'A single session walks /m/loan/result?seq=100001, 100002, 100003 … dozens per second, all returning 200, concentrated on six loan-result services. No real user browses their own data like this — it’s a full sweep.' },
    },
    { kind: 'diag', sev: 'crit', tag: { ko: 'A01 · 객체 수준 인가 누락', en: 'A01 · missing object authz' },
      title: { ko: '"내 것만" 검사가 없다', en: 'No "is this mine" check' },
      body: { ko: 'seq 값만 바꾸면 남의 대출 조회 결과가 나옵니다. 서버가 "이 세션이 이 seq를 볼 권한이 있는가"를 확인하지 않는 전형적 IDOR/BOLA. 노출된 항목: 성명·전화번호·연소득·대출한도, 그리고 주민등록번호·연계정보(CI) 일부. 가장 흔하고, 가장 치명적인 API 결함입니다.',
              en: 'Change seq and you get someone else’s loan result. The server never checks "is this session allowed to see this seq" — textbook IDOR/BOLA. Exposed fields: name, phone, annual income, loan limit, plus some national IDs and CI tokens. The most common and most damaging API flaw.' },
    },
    { kind: 'teach', sev: 'info', tag: { ko: '왜 위험한가', en: 'why it matters' },
      title: { ko: '교육 · 인증 ≠ 인가', en: 'Lesson · authentication ≠ authorization' },
      body: { ko: '로그인(인증)을 통과해도, 요청한 바로 그 객체에 대한 권한(인가)은 매 요청마다 따로 확인해야 합니다. "로그인했으니 통과"가 BOLA의 뿌리입니다. 식별자를 숨기는 것(UUID)만으로는 부족 — 서버가 소유권을 강제해야 합니다.',
              en: 'Passing login (authentication) is not permission to touch the specific object you asked for (authorization) — that must be checked on every request. "They’re logged in, so allow it" is the root of BOLA. Hiding the identifier (UUIDs) isn’t enough — the server must enforce ownership.' },
    },
    { kind: 'fix', sev: 'info', tag: { ko: '대응', en: 'actions' },
      title: { ko: '즉시 조치', en: 'Immediate actions' },
      body: { ko: '1) 모든 조회에 객체 수준 인가(owner == session.user) 강제.  2) 순차 정수 ID → 추측 불가 식별자.  3) 세션당 조회량 레이트리밋 + 대량 조회 경보.  4) 민감필드 egress/DLP 모니터링, 주민번호·CI는 토큰화·마스킹.',
              en: '1) Enforce object-level authz (owner == session.user) on every read.  2) Replace sequential integer IDs with unguessable ones.  3) Per-session read rate-limit + bulk-read alerting.  4) Egress/DLP on sensitive fields; tokenize & mask national IDs and CI.' },
    },
  ],
},

/* ── 5. 탐지·차단 — 블루팀 승 ───────────────────────────────────────── */
{
  key: 'contain',
  title: { ko: '탐지 · 차단', en: 'Detection & containment' },
  mins: 34,
  gen(n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const ip = rip(ATTACK_IPS);
      out.push(log(ip, 'GET', '/m/loan/result?seq=' + (140000 + i), 403, 'artex', 180));
    }
    return out;
  },
  findings: [
    { kind: 'fix', sev: 'ok', tag: 'CONTAINED',
      title: { ko: '차단 룰 적용 — 403 전환', en: 'Block rules live — flipped to 403' },
      body: { ko: 'WAF에 (1) 순차 seq 열거 패턴, (2) ARTEX UA/IOC, (3) 공격 IP 대역 차단을 배포했습니다. 같은 요청이 이제 403으로 떨어집니다. 침해 세션 전부 강제 만료, 성공한 크리덴셜 스터핑 계정 비밀번호 리셋 발동.',
              en: 'Pushed WAF rules for (1) sequential-seq enumeration, (2) ARTEX UA/IOCs, (3) attacker IP ranges. The same requests now return 403. All compromised sessions force-expired; password reset triggered for stuffed accounts.' },
    },
    { kind: 'teach', sev: 'info', tag: { ko: '사후 교훈', en: 'aftermath' },
      title: { ko: '교육 · 이 사고가 남긴 것', en: 'Lesson · what this incident teaches' },
      body: { ko: '① 공격의 입구는 화려한 제로데이가 아니라 재사용된 비밀번호와 잊힌 외곽 서버였다. ② AI는 그 뻔한 약점을 사람보다 수천 배 빠르게 훑는다. ③ 그래서 방어의 승부처는 "기본"의 자동화다 — MFA, 객체 인가, 자산 가시성, 이상 탐지. 화려한 공격일수록, 막는 법은 지루할 만큼 기본에 가깝다.',
              en: '① The way in wasn’t a flashy zero-day — it was reused passwords and a forgotten edge server. ② AI sweeps those obvious weaknesses thousands of times faster than a human. ③ So defense is won by automating the basics: MFA, object-level authz, asset visibility, anomaly detection. The fancier the attack, the more boringly fundamental the fix.' },
    },
    { kind: 'fix', sev: 'info', tag: { ko: '사후 대응', en: 'recovery' },
      title: { ko: '복구 · 재발 방지', en: 'Recovery & prevention' },
      body: { ko: '1) 피해 통지 및 노출 범위 확정(주민번호·CI 포함 건 우선).  2) 전 외곽 자산 WAF·로깅·망분리 재적용.  3) 로그인·조회 이상탐지 모델 상시화.  4) 모의 침투(레드팀)로 같은 경로 재점검 — 방어는 한 번이 아니라 반복이다.',
              en: '1) Notify affected users; scope exposure (prioritize national-ID/CI records).  2) Re-apply WAF/logging/segmentation across all edge assets.  3) Make login/lookup anomaly detection permanent.  4) Red-team the same paths — defense is a loop, not a one-off.' },
    },
  ],
},
];

/* 심각도 라벨/색 */
const SEV = {
  info: { ko: '정보', en: 'INFO',  c: '#58a6ff' },
  ok:   { ko: '해결', en: 'OK',    c: '#3fb950' },
  med:  { ko: '주의', en: 'MED',   c: '#d29922' },
  high: { ko: '경고', en: 'HIGH',  c: '#f0883e' },
  crit: { ko: '심각', en: 'CRIT',  c: '#f85149' },
};
const KIND = {
  detect: { ko: '탐지', en: 'DETECT', i: '◎' },
  diag:   { ko: '진단', en: 'DIAGNOSE', i: '⚑' },
  teach:  { ko: '교육', en: 'LEARN', i: '✎' },
  fix:    { ko: '대응', en: 'FIX', i: '⛊' },
};

const UI = {
  ko: {
    title: '화이트해커 모드 — 침해 대응 관제',
    sub: '2026 금융권 AI 침해 사고 재구성 · 교육용 시뮬레이션',
    left: '실시간 서버 로그 · 침입 탐지',
    right: '블루팀 에이전트 · 무엇이 문제인가',
    worker: '보안관제 분석가',
    responding: '대응 중',
    case: '사고번호',
    sim: '합성 로그 · 실제 데이터 아님',
    phase: '단계',
    reqmin: '요청/분',
    blocked: '차단',
    findings: '탐지 건',
  },
  en: {
    title: 'White-Hat Mode — Incident Response Console',
    sub: 'Reconstruction of the 2026 financial-sector AI breach · educational simulation',
    left: 'Live server logs · intrusion detection',
    right: 'Blue-team agent · what’s wrong',
    worker: 'SOC analyst',
    responding: 'responding',
    case: 'case',
    sim: 'synthetic logs · not real data',
    phase: 'phase',
    reqmin: 'req/min',
    blocked: 'blocked',
    findings: 'findings',
  },
};

function fmtLog(e, ts) {
  // nginx combined 풍. 공격/에러는 빨강, ARTEX UA는 자홍 강조.
  const codeCol = e.code >= 500 ? 'r' : e.code >= 400 ? (e.code === 403 ? 'g' : 'y') : 'g';
  const uaBad = /ARTEX/.test(e.ua);
  const ua = uaBad ? '{{m|"' + e.ua + '"}}' : '{{d|"' + e.ua + '"}}';
  const mCol = e.method === 'POST' || e.method === 'PUT' ? 'y'
    : e.method === 'DELETE' ? 'r' : 'b';
  return '{{gr|' + e.ip + '}} {{d|- -}} {{d|[' + ts + ']}} "' +
    '{{' + mCol + '|' + e.method + '}} ' + e.path + ' HTTP/2" ' +
    '{{' + codeCol + '|' + e.code + '}} ' + e.bytes +
    ' {{d|"' + e.ref + '"}} ' + ua + ' {{d|rt=' + e.rt.toFixed(3) + '}}';
}

return { PHASES, SEV, KIND, UI, ATTACK_IPS, fmtLog };
})();

if (typeof module !== 'undefined') module.exports = WH;
