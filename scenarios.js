/* ════════════════════════════════════════════════════════════════════════
   GHOSTCODER — 시나리오 데이터
   ────────────────────────────────────────────────────────────────────────
   화면에 나오는 모든 "일"이 여기 들어 있다. 엔진(index.html)은 이 데이터를
   읽어 재생만 한다.

   세 축이 서로 곱해진다.
   ─ STACK   무엇을 만지는가. 파일 트리·코드·터미널 출력이 전부 바뀐다.
   ─ MISSION 어떤 일을 하는가. 비트(beat) 시퀀스의 "모양"만 정의하고,
             구체적인 파일·명령은 스택에서 역할(role) 키로 꺼내 쓴다.
   ─ LAYOUT  어떻게 보여주는가. 같은 비트를 IDE 타이핑으로도, 헤드리스
             에이전트 스트림으로도, 4분할 스웜으로도 렌더한다.

   즉 미션 스크립트는 스택을 모른다. cmd('test_fail') 처럼 역할만 부르고,
   스택이 그 역할에 맞는 실제 명령과 출력을 채운다. 스택에 그 역할이
   없으면 엔진이 조용히 건너뛴다.

   터미널 출력 색은 {{색|글자}} 마크업으로 쓴다.
     g 초록  r 빨강  y 노랑  b 파랑  c 시안  m 마젠타  d 흐림  w 강조  gr 회색
   ════════════════════════════════════════════════════════════════════════ */
"use strict";

const SCEN = (() => {

/* ── 작은 도구 ─────────────────────────────────────────────────────────── */
const L = (...a) => a;                      // 출력 줄 배열을 눈에 띄게
const pad = (s, n) => String(s).padEnd(n);

/* ════════════════════════════════════════════════════════════════════════
   화면 구성 (LAYOUT)
   ════════════════════════════════════════════════════════════════════════ */
const LAYOUTS = {
  ide: {
    label: 'IDE — Editor + Terminal', icon: '⌗',
    hint: 'Full VS Code: file tree, tabs, live code typing, integrated terminal, agent side panel. The one that looks most like a human is at the keyboard.',
    typing: true,
  },
  agent: {
    label: 'Agent — Headless CLI', icon: '▸',
    hint: 'No typing. One full-screen agent session that never stops talking: tool calls, unified diffs, test runs, token counter. Zero mouse movement needed.',
    typing: false,
  },
  swarm: {
    label: 'Swarm — 4 Agents, tmux grid', icon: '⊞',
    hint: 'Four agents on four tickets in four panes, all streaming at once. Maximum apparent throughput per square inch of screen.',
    typing: false,
  },
  ops: {
    label: 'Ops — Pipeline + Log Tail', icon: '◴',
    hint: 'SRE wall: CI pipeline stages, live log tail, latency/error metrics, rolling deploys. Looks like you are holding production together.',
    typing: false,
  },
  agi: {
    label: 'AGI — Autonomous Fleet', icon: '◈',
    hint: 'Hundreds of agents working the whole backlog at once: nine live panes, aggregate throughput counters, and a merge-queue firehose. Throughput no team could produce — which is the point.',
    typing: false,
  },
};

/* ════════════════════════════════════════════════════════════════════════
   속도 / 모델 / 이름
   ════════════════════════════════════════════════════════════════════════ */
const PACES = {
  human:  { label: 'Human',      icon: '🐢', hint: 'Deliberate. ~7 chars/sec with real hesitation — the most believable if anyone watches the screen for a full minute.', cps: 7,  gap: 1.7 },
  caff:   { label: 'Caffeinated',icon: '☕', hint: 'A developer three coffees in. Fast bursts, short pauses between commands.', cps: 15, gap: 1.0 },
  agentp: { label: 'Agent',      icon: '⚡', hint: 'Machine cadence. Code appears faster than a person could type — which is exactly what an AI agent looks like.', cps: 34, gap: .58 },
  turbo:  { label: 'Turbo',      icon: '🔥', hint: 'Output firehose. Great for the Swarm and Ops layouts across a room; too fast to read up close.', cps: 90, gap: .3 },
  hyper:  { label: 'Hyper',      icon: '🚀', hint: 'Everything at once. Logs scroll past unreadably and files fill in a blink — built for a meeting-room screen or a monitor seen from the corridor.', cps: 260, gap: .1, mul: 4 },
};

/* ════════════════════════════════════════════════════════════════════════
   AGI 자율 플릿 — agi 레이아웃 전용
   ────────────────────────────────────────────────────────────────────────
   한 사람이 따라갈 수 없는 처리량을 보여주는 화면. 에이전트 한 대의
   작업을 자세히 보여주는 대신, 수백 대가 동시에 끝내고 있는 것을 집계로
   보여준다. 아래 이벤트들은 그 집계의 꼬리다.
   ════════════════════════════════════════════════════════════════════════ */
const FLEET = {
  /* 상단 집계 타일 */
  tiles: [
    { k: 'AGENTS ONLINE', v: 342,   lo: 318,  hi: 384,   fmt: 'int' },
    { k: 'TICKETS / HOUR', v: 1284, lo: 1080, hi: 1520,  fmt: 'int' },
    { k: 'PRS MERGED',    v: 0,     inc: [3, 11],        fmt: 'acc' },
    { k: 'LINES CHANGED', v: 0,     inc: [420, 2100],    fmt: 'acc' },
    { k: 'TESTS RUN',     v: 0,     inc: [1800, 9400],   fmt: 'acc' },
    { k: 'TOKENS / SEC',  v: 48200, lo: 31000, hi: 92000, fmt: 'int' },
    { k: 'GREEN BUILDS',  v: 99.4,  lo: 98.1, hi: 99.9,  fmt: 'pct2' },
    { k: 'HUMAN REVIEWS', v: 0,     inc: [0, 1],         fmt: 'acc' },
  ],
  /* 판마다 붙는 작업 이름 */
  work: [
    'impl', 'test', 'review', 'bench', 'migrate', 'triage', 'refactor', 'deploy',
    'scan', 'docs', 'fuzz', 'rollout',
  ],
  /* 하단 이벤트 소방호스 */
  events: [
    'merged {{c|#$p}} {{w|$r}} {{g|+$a}}/{{r|-$d}} {{d|$ms s · 2 approvals · squash}}',
    'deployed {{w|$r}} {{d|$sha}} → {{g|prod}} {{d|canary 10→50→100 · analysis passed}}',
    '{{g|✓}} {{w|$r}} {{d|pipeline #$b}} {{g|passed}} {{d|$ms s · 14 stages · 0 flaky}}',
    'opened {{c|#$p}} {{w|$r}} {{d|$t — assigned to review swarm}}',
    '{{g|✓}} {{w|$r}} {{d|coverage}} {{g|$c%}} {{d|(gate 90) · +$n pp}}',
    'closed {{y|$t}} {{d|as duplicate of}} {{y|$t2}} {{d|· linked, notified reporter}}',
    'reverted {{w|$r}} {{d|$sha}} {{y|canary analysis failed}} {{d|error-rate 0.4% > 0.1%}}',
    '{{g|✓}} {{w|$r}} {{d|benchmark}} {{g|-$n%}} {{d|p99 · baseline updated}}',
    'escalated {{r|$t}} {{d|to human review — touches money path}}',
    '{{g|✓}} {{w|$r}} {{d|govulncheck · trivy · cosign}} {{g|clean}}',
    'rebased {{c|#$p}} {{w|$r}} {{d|onto main, resolved 3 conflicts, re-ran suite}}',
    '{{g|✓}} {{w|$r}} {{d|migration}} {{g|0042}} {{d|applied · 0 lock waits > 50ms}}',
    'declined {{c|#$p}} {{w|$r}} {{d|— perf claim did not reproduce across 5 runs}}',
  ],
  repos: [
    'checkout-web', 'ledger-api', 'order-svc', 'edge-router', 'platform-infra',
    'catalog-svc', 'settlement-worker', 'notify-api', 'search-index', 'auth-gateway',
    'pricing-engine', 'wms-bridge',
  ],
  tickets: ['PAY', 'LED', 'ORD', 'EDGE', 'INFRA', 'CAT', 'SET', 'NOT', 'SRCH', 'AUTH'],
};

const MODELS = [
  'claude-opus-5', 'claude-sonnet-5', 'gpt-5.1-codex', 'gemini-3-pro', 'local:qwen3-coder-30b',
];

const AGENT_NAMES = [
  'ada', 'atlas', 'kepler', 'nomad', 'orbit', 'pascal', 'quill', 'ripley',
  'sable', 'turing', 'vega', 'wren', 'juno', 'lovelace', 'mercury', 'noether',
];

const HUMANS = ['dana', 'marco', 'priya', 'sam', 'yoon', 'elif', 'tomas', 'nina'];

/* ════════════════════════════════════════════════════════════════════════
   스택 1 — TypeScript · Next.js  (checkout-web)
   ════════════════════════════════════════════════════════════════════════ */
const nextjs = {
  id: 'next',
  label: 'TypeScript · Next.js',
  icon: '◤',
  hint: 'pnpm · Next 15 · React 19 · Vitest · ESLint · tsc --watch. Checkout and coupon pricing for an e-commerce front end.',
  lang: 'ts', langLabel: 'TypeScript React',
  repo: 'checkout-web', org: 'leafmeta',
  root: '~/dev/checkout-web',
  pkg: 'pnpm',
  terms: ['zsh', 'pnpm dev', 'tsc --watch', 'vitest --watch'],
  ext: ['ESLint', 'Prettier', 'Tailwind CSS IntelliSense'],
  tree: [
    { d: 'src', open: true, c: [
      { d: 'app', open: true, c: [
        { f: 'layout.tsx' }, { f: 'page.tsx' },
        { d: 'checkout', open: true, c: [
          { f: 'page.tsx', git: 'M' }, { f: 'actions.ts' }, { f: 'loading.tsx' },
        ] },
        { d: 'api', c: [{ d: 'webhooks', c: [{ f: 'route.ts' }] }] },
      ] },
      { d: 'components', c: [
        { f: 'CartSummary.tsx' }, { f: 'CouponField.tsx', git: 'M' },
        { f: 'PriceBreakdown.tsx' }, { f: 'PayButton.tsx' },
      ] },
      { d: 'lib', open: true, c: [
        { f: 'pricing.ts', git: 'M' }, { f: 'pricing.test.ts', git: 'M' },
        { f: 'money.ts' }, { f: 'money.test.ts' }, { f: 'coupon.ts', git: 'U' },
        { f: 'cart.ts' }, { f: 'api-client.ts' },
      ] },
      { d: 'hooks', c: [{ f: 'useCart.ts' }, { f: 'useCoupon.ts' }] },
      { f: 'env.ts' },
    ] },
    { d: 'e2e', c: [{ f: 'checkout.spec.ts' }] },
    { f: 'next.config.ts' }, { f: 'tsconfig.json' }, { f: 'vitest.config.ts' },
    { f: 'package.json' }, { f: 'pnpm-lock.yaml' }, { f: '.eslintrc.cjs' }, { f: 'README.md' },
  ],
  topic: {
    title: 'Stack coupon discounts correctly',
    unit: 'the discount pipeline',
    criteria: 'stacking order',
    implicit: 'fixed and percentage coupons are applied in whatever order they arrive',
    explicit: 'make the order explicit and clamp each step to the remaining base',
    done: 'Discount stacking is now explicit and clamped at every step.',
    peer: 'nice, the stacking order finally reads like the spec. approving once CI is green',
    hover: 'Applies the coupon to the remaining base and clamps the result. Returns zero-valued money when the base is exhausted.',
    symbol: 'quote',
  },
  files: {
    /* 주 구현 — 쿠폰/세금 적용 순서 버그가 여기에 있다 */
    impl: {
      path: 'src/lib/pricing.ts', lang: 'ts',
      code: `import { Money, add, sub, mul, zero } from './money';
import type { Cart, Coupon, TaxPolicy } from './coupon';

/**
 * Order of operations matters for tax authorities:
 *   1. line subtotal
 *   2. item-level discounts
 *   3. cart-level coupons  <-- percentage coupons apply here, pre-tax
 *   4. tax on the discounted base
 *   5. shipping (never discounted, never taxed twice)
 */
export interface Quote {
  subtotal: Money;
  discount: Money;
  taxable: Money;
  tax: Money;
  shipping: Money;
  total: Money;
  appliedCoupons: string[];
}

export function quote(cart: Cart, coupons: Coupon[], policy: TaxPolicy): Quote {
  const subtotal = cart.lines.reduce(
    (acc, line) => add(acc, mul(line.unitPrice, line.qty)),
    zero(cart.currency),
  );

  const applied: string[] = [];
  let discount = zero(cart.currency);

  for (const coupon of sortCoupons(coupons)) {
    if (!eligible(cart, coupon)) continue;
    const cut = discountFor(subtotal, discount, coupon);
    if (cut.amount <= 0) continue;
    discount = add(discount, cut);
    applied.push(coupon.code);
    if (coupon.exclusive) break;
  }

  const taxable = sub(subtotal, discount);
  const tax = mul(taxable, policy.rate);
  const shipping = shippingFor(cart, taxable);

  return {
    subtotal, discount, taxable, tax, shipping,
    total: add(add(taxable, tax), shipping),
    appliedCoupons: applied,
  };
}

/** Fixed-amount coupons first so percentages never eat the floor. */
function sortCoupons(coupons: Coupon[]): Coupon[] {
  return [...coupons].sort((a, b) => rank(a) - rank(b));
}

function rank(c: Coupon): number {
  return c.kind === 'fixed' ? 0 : c.kind === 'percent' ? 1 : 2;
}

function discountFor(subtotal: Money, already: Money, coupon: Coupon): Money {
  const base = sub(subtotal, already);
  switch (coupon.kind) {
    case 'fixed':
      return clamp(coupon.amount, base);
    case 'percent':
      return clamp(mul(base, coupon.rate), base);
    case 'shipping':
      return zero(base.currency);
  }
}`,
    },
    /* 타입/스키마 */
    types: {
      path: 'src/lib/coupon.ts', lang: 'ts',
      code: `import { z } from 'zod';
import type { Money } from './money';

export const couponSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('fixed'),
    code: z.string().min(3).max(24),
    amount: z.object({ amount: z.number().int().nonnegative(), currency: z.string().length(3) }),
    exclusive: z.boolean().default(false),
    minSubtotal: z.number().int().nonnegative().default(0),
    expiresAt: z.coerce.date().optional(),
  }),
  z.object({
    kind: z.literal('percent'),
    code: z.string().min(3).max(24),
    rate: z.number().min(0).max(0.9),
    exclusive: z.boolean().default(false),
    minSubtotal: z.number().int().nonnegative().default(0),
    expiresAt: z.coerce.date().optional(),
  }),
  z.object({
    kind: z.literal('shipping'),
    code: z.string().min(3).max(24),
    exclusive: z.boolean().default(true),
  }),
]);

export type Coupon = z.infer<typeof couponSchema>;

export interface CartLine {
  sku: string;
  qty: number;
  unitPrice: Money;
}

export interface Cart {
  id: string;
  currency: string;
  lines: CartLine[];
  destination: { country: string; postalCode: string };
}

export interface TaxPolicy {
  rate: number;
  inclusive: boolean;
  jurisdiction: string;
}`,
    },
    /* 테스트 */
    test: {
      path: 'src/lib/pricing.test.ts', lang: 'ts',
      code: `import { describe, it, expect } from 'vitest';
import { quote } from './pricing';
import { won, cart, percent, fixed, KR_VAT } from '../test/factories';

describe('quote', () => {
  it('applies a percentage coupon before tax', () => {
    const q = quote(cart([[won(50_000), 2]]), [percent('SPRING10', 0.1)], KR_VAT);

    expect(q.subtotal.amount).toBe(100_000);
    expect(q.discount.amount).toBe(10_000);
    expect(q.taxable.amount).toBe(90_000);
    expect(q.tax.amount).toBe(9_000);
    expect(q.total.amount).toBe(99_000);
  });

  it('stacks a fixed coupon and then a percentage coupon', () => {
    const q = quote(
      cart([[won(30_000), 1]]),
      [percent('SPRING10', 0.1), fixed('WELCOME5000', won(5_000))],
      KR_VAT,
    );

    // fixed first: 30000 - 5000 = 25000, then 10% of the remainder
    expect(q.discount.amount).toBe(7_500);
    expect(q.appliedCoupons).toEqual(['WELCOME5000', 'SPRING10']);
  });

  it('never discounts below zero', () => {
    const q = quote(cart([[won(4_000), 1]]), [fixed('WELCOME5000', won(5_000))], KR_VAT);
    expect(q.discount.amount).toBe(4_000);
    expect(q.total.amount).toBe(0);
  });

  it('keeps shipping out of the taxable base', () => {
    const q = quote(cart([[won(9_900), 1]]), [], KR_VAT);
    expect(q.shipping.amount).toBe(3_000);
    expect(q.tax.amount).toBe(990);
  });
});`,
    },
    /* 핫픽스용 짧은 패치 */
    patch: {
      path: 'src/lib/pricing.ts', lang: 'ts',
      code: `function clamp(cut: Money, base: Money): Money {
  // Guard against a coupon larger than the remaining base. Before this,
  // a stacked WELCOME5000 on a 4,000 cart produced a negative taxable
  // amount and the tax line came back as -100. PAY-1482.
  if (cut.currency !== base.currency) {
    throw new CurrencyMismatch(cut.currency, base.currency);
  }
  return { currency: base.currency, amount: Math.min(cut.amount, Math.max(0, base.amount)) };
}`,
    },
    infra: {
      path: 'vitest.config.ts', lang: 'ts',
      code: `import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
      exclude: ['src/test/**', '**/*.config.*', '.next/**'],
    },
    pool: 'threads',
    poolOptions: { threads: { singleThread: false, maxThreads: 8 } },
  },
});`,
    },
    /* 그린필드 — 처음부터 만드는 파일들 */
    scaffold: [
      {
        path: 'src/lib/money.ts', lang: 'ts',
        code: `/** Integer minor units only. No floats touch money in this codebase. */
export interface Money {
  readonly amount: number;
  readonly currency: string;
}

export class CurrencyMismatch extends Error {
  constructor(a: string, b: string) {
    super('cannot combine ' + a + ' with ' + b);
    this.name = 'CurrencyMismatch';
  }
}

export const zero = (currency: string): Money => ({ amount: 0, currency });

export function add(a: Money, b: Money): Money {
  assertSame(a, b);
  return { amount: a.amount + b.amount, currency: a.currency };
}

export function sub(a: Money, b: Money): Money {
  assertSame(a, b);
  return { amount: a.amount - b.amount, currency: a.currency };
}

export function mul(a: Money, factor: number): Money {
  return { amount: Math.round(a.amount * factor), currency: a.currency };
}

function assertSame(a: Money, b: Money): void {
  if (a.currency !== b.currency) throw new CurrencyMismatch(a.currency, b.currency);
}`,
      },
      {
        path: 'src/components/CouponField.tsx', lang: 'ts',
        code: `'use client';

import { useState, useTransition } from 'react';
import { applyCoupon } from '@/app/checkout/actions';
import type { Quote } from '@/lib/pricing';

export function CouponField({ cartId, onQuote }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await applyCoupon({ cartId, code: code.trim().toUpperCase() });
      if (!res.ok) return setError(res.reason);
      onQuote(res.quote);
      setCode('');
    });
  }

  return (
    <form onSubmit={submit} className="flex gap-2" aria-label="Coupon">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Coupon code"
        autoComplete="off"
        className="h-10 flex-1 rounded-lg border px-3 uppercase tracking-wide"
      />
      <button disabled={pending || code.length < 3} className="h-10 rounded-lg px-4">
        {pending ? 'Checking...' : 'Apply'}
      </button>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </form>
  );
}

interface Props {
  cartId: string;
  onQuote: (q: Quote) => void;
}`,
      },
    ],
  },
  cmd: {
    status: {
      cmd: 'git status --short --branch', ms: 500,
      out: L(
        '{{gr|##}} {{g|feature/PAY-1482}}{{gr|...origin/feature/PAY-1482}}',
        '{{r| M}} src/app/checkout/page.tsx',
        '{{r| M}} src/components/CouponField.tsx',
        '{{r| M}} src/lib/pricing.ts',
        '{{r| M}} src/lib/pricing.test.ts',
        '{{r|??}} src/lib/coupon.ts',
      ),
    },
    install: {
      cmd: 'pnpm install', ms: 4200,
      out: L(
        '{{d|Lockfile is up to date, resolution step is skipped}}',
        'Packages: {{g|+14}} {{r|-3}}',
        '{{g|++++++++++++++}}{{r|---}}',
        '{{d|Progress: resolved 1483, reused 1466, downloaded 14, added 14, done}}',
        '',
        '{{w|dependencies:}}',
        '{{g|+}} zod {{d|3.23.8}}',
        '{{g|+}} @tanstack/react-query {{d|5.62.7}}',
        '',
        '{{d|Done in 3.8s using pnpm 9.15.0}}',
      ),
    },
    dev: {
      cmd: 'pnpm dev', ms: 3400, keep: true,
      out: L(
        '',
        '{{w|> checkout-web@2.14.0 dev}}',
        '{{d|> next dev --turbopack -p 3000}}',
        '',
        '  {{w|▲ Next.js 15.1.3}} {{d|(Turbopack)}}',
        '  {{d|- Local:}}        http://localhost:3000',
        '  {{d|- Network:}}      http://192.168.0.31:3000',
        '  {{d|- Environments:}} .env.local, .env',
        '',
        ' {{g|✓}} Starting...',
        ' {{g|✓}} Ready in 1.4s',
        ' {{g|○}} Compiling /checkout ...',
        ' {{g|✓}} Compiled /checkout in 812ms',
        '{{d| GET /checkout 200 in 1043ms}}',
      ),
    },
    test_fail: {
      cmd: 'pnpm vitest run src/lib', ms: 5200,
      out: L(
        '',
        '{{d| RUN  v2.1.8 /Users/leaf/dev/checkout-web}}',
        '',
        ' {{g|✓}} src/lib/money.test.ts {{d|(12 tests)}} {{d|24ms}}',
        ' {{g|✓}} src/lib/cart.test.ts {{d|(9 tests)}} {{d|31ms}}',
        ' {{r|❯}} src/lib/pricing.test.ts {{d|(14 tests | }}{{r|2 failed}}{{d|)}} {{y|412ms}}',
        '   {{r|×}} quote {{gr|>}} stacks a fixed coupon and then a percentage coupon {{d|6ms}}',
        '     {{r|→}} expected 10000 to be 7500 // Object.is equality',
        '   {{r|×}} quote {{gr|>}} never discounts below zero {{d|3ms}}',
        '     {{r|→}} expected -1000 to be 4000 // Object.is equality',
        '',
        '{{r|⎯⎯⎯⎯⎯⎯⎯⎯}} {{r|Failed Tests 2}} {{r|⎯⎯⎯⎯⎯⎯⎯⎯}}',
        '',
        '{{r| FAIL }} src/lib/pricing.test.ts {{gr|>}} quote {{gr|>}} stacks a fixed coupon and then a percentage coupon',
        '{{r|AssertionError}}: expected 10000 to be 7500 // Object.is equality',
        '',
        '{{r|- Expected}}',
        '{{g|+ Received}}',
        '',
        '{{r|- 7500}}',
        '{{g|+ 10000}}',
        '',
        '{{d| ❯ src/lib/pricing.test.ts:24:29}}',
        '{{d|     22|   );}}',
        '{{d|     23| }}',
        '{{d|     24|   expect(q.discount.amount).toBe(7_500);}}',
        '{{d|       |                             ^}}',
        '{{d|     25|   expect(q.appliedCoupons).toEqual([...]);}}',
        '',
        '{{d| Test Files }} {{r|1 failed}} {{d|| }}{{g|4 passed}} {{d|(5)}}',
        '{{d|      Tests }} {{r|2 failed}} {{d|| }}{{g|45 passed}} {{d|(47)}}',
        '{{d|   Start at }} 14:22:07',
        '{{d|   Duration }} 1.31s {{d|(transform 402ms, collect 688ms, tests 467ms)}}',
        '',
      ),
    },
    test_pass: {
      cmd: 'pnpm vitest run src/lib', ms: 4100,
      out: L(
        '',
        '{{d| RUN  v2.1.8 /Users/leaf/dev/checkout-web}}',
        '',
        ' {{g|✓}} src/lib/money.test.ts {{d|(12 tests)}} {{d|22ms}}',
        ' {{g|✓}} src/lib/cart.test.ts {{d|(9 tests)}} {{d|29ms}}',
        ' {{g|✓}} src/lib/coupon.test.ts {{d|(11 tests)}} {{d|38ms}}',
        ' {{g|✓}} src/lib/pricing.test.ts {{d|(17 tests)}} {{d|74ms}}',
        ' {{g|✓}} src/lib/api-client.test.ts {{d|(6 tests)}} {{d|51ms}}',
        '',
        '{{d| Test Files }} {{g|5 passed}} {{d|(5)}}',
        '{{d|      Tests }} {{g|55 passed}} {{d|(55)}}',
        '{{d|   Start at }} 14:31:44',
        '{{d|   Duration }} 1.08s {{d|(transform 388ms, collect 601ms, tests 214ms)}}',
        '',
      ),
    },
    types: {
      cmd: 'pnpm tsc --noEmit -p tsconfig.json', ms: 6400,
      out: L(
        '',
        '{{r|src/lib/pricing.ts}}{{d|:}}{{y|71}}{{d|:}}{{y|10}} - {{r|error}} {{d|TS2554}}: Expected 2 arguments, but got 1.',
        '',
        '{{d|71}}       return clamp(coupon.amount);',
        '{{d|  }}              {{r|~~~~~~~~~~~~~~~~~~~~}}',
        '',
        '{{d|  src/lib/pricing.ts:94:24}}',
        '{{d|    94 function clamp(cut: Money, base: Money): Money {}}',
        '{{d|                              ~~~~~~~~~~~~}}',
        '{{d|    An argument for \'base\' was not provided.}}',
        '',
        '{{r|Found 1 error in src/lib/pricing.ts:71}}',
        '',
      ),
    },
    types_ok: {
      cmd: 'pnpm tsc --noEmit -p tsconfig.json', ms: 5800,
      out: L('', '{{d|(no output — 0 errors, 4,812 files checked in 5.6s)}}', ''),
    },
    lint: {
      cmd: 'pnpm eslint src --max-warnings 0 --cache', ms: 3600,
      out: L(
        '',
        '{{w|/Users/leaf/dev/checkout-web/src/lib/pricing.ts}}',
        '  {{d|38:7}}  {{y|warning}}  \'unusedBase\' is assigned a value but never used  {{d|@typescript-eslint/no-unused-vars}}',
        '',
        '{{w|/Users/leaf/dev/checkout-web/src/components/CouponField.tsx}}',
        '  {{d|61:9}}  {{y|warning}}  Missing dependency \'cartId\' in useCallback  {{d|react-hooks/exhaustive-deps}}',
        '',
        '{{y|✖ 2 problems (0 errors, 2 warnings)}}',
        '',
      ),
    },
    lint_ok: {
      cmd: 'pnpm eslint src --max-warnings 0 --cache', ms: 2900,
      out: L('', '{{d|✔ 312 files linted, no problems found (2.6s)}}', ''),
    },
    build: {
      cmd: 'pnpm build', ms: 9500,
      out: L(
        '',
        '{{w|> checkout-web@2.14.0 build}}',
        '{{d|> next build}}',
        '',
        '  {{w|▲ Next.js 15.1.3}}',
        '',
        ' {{g|✓}} Linting and checking validity of types',
        ' {{g|✓}} Creating an optimized production build',
        ' {{g|✓}} Collecting page data',
        ' {{g|✓}} Generating static pages (34/34)',
        ' {{g|✓}} Finalizing page optimization',
        '',
        '{{d|Route (app)                              Size     First Load JS}}',
        '{{d|┌ ○ /}}                                    {{g|5.12 kB}}         {{d|118 kB}}',
        '{{d|├ ○ /checkout}}                            {{g|18.4 kB}}         {{d|142 kB}}',
        '{{d|├ ƒ /api/webhooks}}                        {{g|0 B}}             {{d|0 B}}',
        '{{d|└ ○ /orders/[id]}}                         {{g|7.81 kB}}         {{d|126 kB}}',
        '{{d|+ First Load JS shared by all}}            {{d|101 kB}}',
        '',
        '{{d|○  (Static)   prerendered as static content}}',
        '{{d|ƒ  (Dynamic)  server-rendered on demand}}',
        '',
      ),
    },
    diff: {
      cmd: 'git diff --stat', ms: 700,
      out: L(
        ' src/app/checkout/page.tsx        |  14 {{g|+++++++}}{{r|-------}}',
        ' src/components/CouponField.tsx   |  38 {{g|++++++++++++++++++++++++++}}{{r|------------}}',
        ' src/lib/coupon.ts                |  47 {{g|+++++++++++++++++++++++++++++++++++++++++++++++}}',
        ' src/lib/pricing.ts               |  62 {{g|+++++++++++++++++++++++++++++++++++++++++}}{{r|---------------------}}',
        ' src/lib/pricing.test.ts          |  29 {{g|+++++++++++++++++++++++}}{{r|------}}',
        ' {{w|5 files changed, 152 insertions(+), 38 deletions(-)}}',
      ),
    },
    commit: {
      cmd: 'git commit -am "fix(pricing): clamp stacked coupons to the remaining base"', ms: 1400,
      out: L(
        '{{d|husky - pre-commit hook}}',
        '{{d|↓ lint-staged}}',
        '  {{g|✔}} eslint --fix',
        '  {{g|✔}} prettier --write',
        '  {{g|✔}} vitest related --run',
        '',
        '{{g|[feature/PAY-1482 3f9a1c2]}} fix(pricing): clamp stacked coupons to the remaining base',
        ' 5 files changed, 152 insertions(+), 38 deletions(-)',
        ' create mode 100644 src/lib/coupon.ts',
      ),
    },
    push: {
      cmd: 'git push -u origin HEAD', ms: 3100,
      out: L(
        '{{d|Enumerating objects: 31, done.}}',
        '{{d|Counting objects: 100% (31/31), done.}}',
        '{{d|Delta compression using up to 10 threads}}',
        '{{d|Compressing objects: 100% (15/15), done.}}',
        '{{d|Writing objects: 100% (17/17), 3.42 KiB | 3.42 MiB/s, done.}}',
        '{{d|Total 17 (delta 13), reused 0 (delta 0), pack-reused 0}}',
        '{{d|remote: Resolving deltas: 100% (13/13), completed with 12 local objects.}}',
        '{{d|remote:}}',
        '{{d|remote: Create a pull request for \'feature/PAY-1482\' on GitHub by visiting:}}',
        '{{d|remote:}}      {{c|https://github.com/leafmeta/checkout-web/pull/new/feature/PAY-1482}}',
        '{{d|remote:}}',
        '{{d|To github.com:leafmeta/checkout-web.git}}',
        ' {{g|* [new branch]}}      HEAD -> feature/PAY-1482',
        '{{d|branch \'feature/PAY-1482\' set up to track \'origin/feature/PAY-1482\'.}}',
      ),
    },
    logs: {
      cmd: 'vercel logs checkout-web --since 30m | grep -E "5[0-9][0-9]|error"', ms: 4300,
      out: L(
        '{{d|Fetching deployment logs for checkout-web (prod)}}',
        '{{gr|2026-09-15T14:02:11.418Z}} {{r|ERROR}} POST /checkout/apply-coupon {{r|500}} {{d|213ms}}',
        '{{gr|2026-09-15T14:02:11.419Z}}   RangeError: Invalid money amount: -1000',
        '{{gr|2026-09-15T14:02:11.419Z}}       at assertPositive (/var/task/.next/server/chunks/4711.js:2:8104)',
        '{{gr|2026-09-15T14:02:11.419Z}}       at mul (/var/task/.next/server/chunks/4711.js:2:8392)',
        '{{gr|2026-09-15T14:02:11.419Z}}       at quote (/var/task/.next/server/chunks/4711.js:2:9017)',
        '{{gr|2026-09-15T14:03:44.902Z}} {{r|ERROR}} POST /checkout/apply-coupon {{r|500}} {{d|188ms}}',
        '{{gr|2026-09-15T14:05:02.311Z}} {{r|ERROR}} POST /checkout/apply-coupon {{r|500}} {{d|241ms}}',
        '{{gr|2026-09-15T14:06:38.774Z}} {{y|WARN}}  coupon.stack.negative_base cart=c_8812 codes=WELCOME5000,SPRING10',
        '{{d|-- 47 matching lines in the last 30m (rate: 1.6/min) --}}',
      ),
    },
    repro: {
      cmd: 'curl -s localhost:3000/api/quote -d @fixtures/cart-8812.json -H "content-type: application/json" | jq', ms: 2600,
      out: L(
        '{',
        '  {{c|"subtotal"}}: { {{c|"amount"}}: {{num|4000}}, {{c|"currency"}}: {{str|"KRW"}} },',
        '  {{c|"discount"}}: { {{c|"amount"}}: {{num|5000}}, {{c|"currency"}}: {{str|"KRW"}} },',
        '  {{c|"taxable"}}: { {{c|"amount"}}: {{r|-1000}}, {{c|"currency"}}: {{str|"KRW"}} },',
        '  {{c|"tax"}}: { {{c|"amount"}}: {{r|-100}}, {{c|"currency"}}: {{str|"KRW"}} },',
        '  {{c|"total"}}: { {{c|"amount"}}: {{r|1900}}, {{c|"currency"}}: {{str|"KRW"}} }',
        '}',
        '{{r|↑ taxable and tax are negative — reproduced on the first try}}',
      ),
    },
    cov: {
      cmd: 'pnpm vitest run --coverage', ms: 8200,
      out: L(
        '',
        '{{d| RUN  v2.1.8 /Users/leaf/dev/checkout-web --coverage}}',
        '',
        ' {{g|✓}} src/lib/pricing.test.ts {{d|(17 tests)}} {{d|74ms}}',
        ' {{g|✓}} src/lib/coupon.test.ts {{d|(11 tests)}} {{d|38ms}}',
        ' {{g|✓}} src/hooks/useCoupon.test.tsx {{d|(8 tests)}} {{d|122ms}}',
        '',
        '{{d| % Coverage report from v8}}',
        '{{d|--------------------|---------|----------|---------|---------|-------------------}}',
        '{{d|File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered lines   }}',
        '{{d|--------------------|---------|----------|---------|---------|-------------------}}',
        '{{w|All files}}           |{{g|   94.21}} |{{g|    88.7}} |{{g|   96.05}} |{{g|   94.21}} |',
        '{{d| lib}}                |{{g|   97.83}} |{{g|   93.12}} |{{g|     100}} |{{g|   97.83}} |',
        '{{d|  pricing.ts}}        |{{g|     100}} |{{g|     100}} |{{g|     100}} |{{g|     100}} |',
        '{{d|  coupon.ts}}         |{{g|   98.41}} |{{g|    91.6}} |{{g|     100}} |{{g|   98.41}} |',
        '{{d|  money.ts}}          |{{g|     100}} |{{g|     100}} |{{g|     100}} |{{g|     100}} |',
        '{{d|  cart.ts}}           |{{y|   88.12}} |{{y|   79.31}} |{{g|   91.66}} |{{y|   88.12}} | {{d|142-149,203}}',
        '{{d|--------------------|---------|----------|---------|---------|-------------------}}',
        '',
        '{{g|✓ all coverage thresholds met (lines 90, branches 85)}}',
        '',
      ),
    },
    sec: {
      cmd: 'pnpm audit --audit-level moderate && pnpm dlx snyk test --severity-threshold=high', ms: 7200,
      out: L(
        '{{d|Scanning 1,483 dependencies...}}',
        '',
        '{{y|┌───────────────┬──────────────────────────────────────────────┐}}',
        '{{y|│}} moderate      {{y|│}} Prototype pollution in {{w|deep-merge}} {{d|<4.3.1}}     {{y|│}}',
        '{{y|│}} Paths         {{y|│}} checkout-web > legacy-forms > deep-merge     {{y|│}}',
        '{{y|│}} Fix           {{y|│}} pnpm up deep-merge@4.3.1                     {{y|│}}',
        '{{y|└───────────────┴──────────────────────────────────────────────┘}}',
        '',
        '{{d|1 vulnerabilities found}}',
        '{{d|Severity: 1 moderate | 0 high | 0 critical}}',
        '',
        '{{g|✓ Tested 1483 dependencies for known issues, no high severity issues found.}}',
      ),
    },
    bench: {
      cmd: 'pnpm vitest bench src/lib/pricing.bench.ts', ms: 9800,
      out: L(
        '',
        '{{d| BENCH  Summary}}',
        '',
        ' {{g|✓}} src/lib/pricing.bench.ts {{d|(4 benches)}} {{d|4.21s}}',
        '',
        '{{d|  name                            hz      min      max     mean      p99}}',
        '{{w|  quote / 1 line, no coupon}}  {{g|412,881}}   0.0021   0.1842   0.0024   0.0038',
        '{{w|  quote / 12 lines, 3 coupons}} {{g|61,204}}   0.0142   0.4118   0.0163   0.0281',
        '{{w|  quote / 120 lines}}            {{y|7,412}}   0.1211   1.8842   0.1349   0.2214',
        '{{w|  sortCoupons / 40 coupons}}   {{g|188,402}}   0.0048   0.2014   0.0053   0.0091',
        '',
        '{{g|→ 2.8x faster than baseline (prev p99 0.0791ms on quote/12 lines)}}',
        '',
      ),
    },
    review: {
      cmd: 'gh pr diff 4812 --patch | head -40 && gh pr checks 4812', ms: 5100,
      out: L(
        '{{w|diff --git a/src/lib/pricing.ts b/src/lib/pricing.ts}}',
        '{{d|index 8a71c02..3f9a1c2 100644}}',
        '{{r|--- a/src/lib/pricing.ts}}',
        '{{g|+++ b/src/lib/pricing.ts}}',
        '{{c|@@ -66,10 +66,18 @@ function discountFor(}}',
        '{{d|   switch (coupon.kind) {}}',
        '{{d|     case \'fixed\':}}',
        '{{r|-      return clamp(coupon.amount);}}',
        '{{g|+      return clamp(coupon.amount, base);}}',
        '{{d|     case \'percent\':}}',
        '{{r|-      return mul(base, coupon.rate);}}',
        '{{g|+      return clamp(mul(base, coupon.rate), base);}}',
        '',
        '{{w|All checks were successful}}',
        '  {{g|✓}} build            {{d|1m42s}}  {{c|https://github.com/leafmeta/checkout-web/actions/runs/1188241}}',
        '  {{g|✓}} unit             {{d|58s}}',
        '  {{g|✓}} e2e (chromium)   {{d|3m11s}}',
        '  {{g|✓}} typecheck        {{d|41s}}',
        '  {{g|✓}} lighthouse-ci    {{d|1m09s}}  {{d|perf 98 / a11y 100}}',
      ),
    },
    deploy: {
      cmd: 'vercel deploy --prebuilt --prod', ms: 11200,
      out: L(
        '{{gr|Vercel CLI 39.1.1}}',
        '{{d|Retrieving project…}}',
        '{{d|Deploying leafmeta/checkout-web (prod)}}',
        '{{d|Uploading [====================] (18.4MB/18.4MB)}}',
        '{{d|Building…}}',
        '  {{g|✓}} Restored build cache from 3f9a1c2',
        '  {{g|✓}} Compiled successfully in 48s',
        '  {{g|✓}} Uploading build outputs (34 static pages, 6 functions)',
        '{{d|Running checks…}}',
        '  {{g|✓}} Smoke: GET /checkout {{d|200 · 148ms}}',
        '  {{g|✓}} Smoke: POST /api/quote {{d|200 · 61ms}}',
        '{{g|✓ Production:}} {{c|https://checkout.leafmeta.io}} {{d|[1m54s]}}',
        '{{d|Aliased to checkout.leafmeta.io}}',
      ),
    },
    migrate: {
      cmd: 'pnpm drizzle-kit generate && pnpm drizzle-kit migrate', ms: 7400,
      out: L(
        '{{d|drizzle-kit: v0.30.1}}',
        '{{d|Reading schema from src/db/schema.ts}}',
        '',
        '{{g|+}} coupon_redemptions {{d|table created}}',
        '{{g|~}} coupons {{d|column added: max_redemptions int not null default 1}}',
        '{{g|~}} coupons {{d|index added: coupons_code_active_idx}}',
        '',
        '{{g|✓}} Your SQL migration file → drizzle/0042_stiff_moon_knight.sql',
        '',
        '{{d|Applying migrations to postgres://***@db.internal:5432/checkout}}',
        '  {{g|✓}} 0042_stiff_moon_knight.sql {{d|412ms}}',
        '{{g|✓ 1 migration applied, schema version 42}}',
      ),
    },
    grepTarget: 'applyCoupon|discountFor',
  },
  probs: [
    { sev: 'e', file: 'src/lib/pricing.ts', line: 71, col: 10, msg: 'Expected 2 arguments, but got 1.', src: 'ts(2554)' },
    { sev: 'w', file: 'src/lib/pricing.ts', line: 38, col: 7, msg: "'unusedBase' is assigned a value but never used.", src: 'eslint' },
    { sev: 'w', file: 'src/components/CouponField.tsx', line: 61, col: 9, msg: "React Hook useCallback has a missing dependency: 'cartId'.", src: 'eslint' },
  ],
  logtail: [
    '{{gr|$t}} {{g|INFO}}  {{c|GET}}  /checkout                 {{g|200}}  {{d|$msms}}  {{gr|ua=Chrome/131 ip=10.4.$a.$b}}',
    '{{gr|$t}} {{g|INFO}}  {{c|POST}} /api/quote                {{g|200}}  {{d|$msms}}  {{gr|cart=c_$h lines=$n}}',
    '{{gr|$t}} {{g|INFO}}  {{c|POST}} /checkout/apply-coupon    {{g|200}}  {{d|$msms}}  {{gr|code=SPRING10 cut=10000}}',
    '{{gr|$t}} {{g|INFO}}  {{c|GET}}  /_next/static/chunks/4711 {{g|200}}  {{d|$msms}}  {{gr|cache=HIT}}',
    '{{gr|$t}} {{y|WARN}}  {{c|POST}} /api/quote                {{y|429}}  {{d|$msms}}  {{gr|rate_limit bucket=ip:10.4.$a.$b}}',
    '{{gr|$t}} {{g|INFO}}  {{c|POST}} /api/webhooks/stripe      {{g|200}}  {{d|$msms}}  {{gr|evt=payment_intent.succeeded}}',
    '{{gr|$t}} {{g|INFO}}  {{c|GET}}  /orders/o_$h              {{g|200}}  {{d|$msms}}  {{gr|revalidate=isr}}',
  ],
};

/* ════════════════════════════════════════════════════════════════════════
   스택 2 — Python · FastAPI  (ledger-api)
   ════════════════════════════════════════════════════════════════════════ */
const fastapi = {
  id: 'fastapi',
  label: 'Python · FastAPI',
  icon: '◈',
  hint: 'uv · FastAPI · SQLAlchemy 2 · pytest · ruff · mypy --strict. A double-entry payments ledger with idempotency keys.',
  lang: 'py', langLabel: 'Python',
  repo: 'ledger-api', org: 'leafmeta',
  root: '~/dev/ledger-api',
  pkg: 'uv',
  terms: ['zsh', 'uvicorn --reload', 'pytest -f', 'docker compose logs'],
  ext: ['Pylance', 'Ruff', 'Python Debugger'],
  tree: [
    { d: 'app', open: true, c: [
      { f: '__init__.py' }, { f: 'main.py' }, { f: 'deps.py' }, { f: 'settings.py' },
      { d: 'api', open: true, c: [
        { f: '__init__.py' }, { f: 'transfers.py', git: 'M' }, { f: 'accounts.py' },
        { f: 'webhooks.py' }, { f: 'health.py' },
      ] },
      { d: 'domain', open: true, c: [
        { f: 'ledger.py', git: 'M' }, { f: 'money.py' }, { f: 'errors.py', git: 'U' },
        { f: 'idempotency.py', git: 'M' },
      ] },
      { d: 'db', c: [{ f: 'models.py' }, { f: 'session.py' }, { f: 'repo.py' }] },
      { d: 'schemas', c: [{ f: 'transfer.py' }, { f: 'account.py' }] },
    ] },
    { d: 'tests', open: true, c: [
      { f: 'conftest.py' }, { f: 'test_ledger.py', git: 'M' },
      { f: 'test_transfers_api.py' }, { f: 'test_idempotency.py', git: 'U' },
    ] },
    { d: 'migrations', c: [{ d: 'versions', c: [{ f: '0041_add_hold_state.py' }] }, { f: 'env.py' }] },
    { f: 'pyproject.toml' }, { f: 'uv.lock' }, { f: 'docker-compose.yml' },
    { f: 'Dockerfile' }, { f: 'Makefile' }, { f: 'README.md' },
  ],
  topic: {
    title: 'Make transfer holds expire on a schedule',
    unit: 'the posting path',
    criteria: 'hold expiry',
    implicit: 'a hold stays on the balance until something else happens to the account',
    explicit: 'give every hold an explicit expiry and release it in the same transaction that reads it',
    done: 'Holds now carry an expiry and are released on read rather than lingering.',
    peer: 'holds expiring on their own is going to close about six support tickets a week. approving',
    hover: 'Appends a balanced entry and returns it. Raises ImbalancedEntry when the postings do not sum to zero.',
    symbol: 'Ledger.transfer',
  },
  files: {
    impl: {
      path: 'app/domain/ledger.py', lang: 'py',
      code: `from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from uuid import UUID, uuid4

from app.domain.errors import ImbalancedEntry, InsufficientFunds, LedgerClosed
from app.domain.money import Money, zero


@dataclass(frozen=True, slots=True)
class Posting:
    """One side of a double-entry transaction. Debits are positive."""

    account_id: UUID
    amount: Money
    memo: str | None = None

    @property
    def is_debit(self) -> bool:
        return self.amount.units > 0


@dataclass(frozen=True, slots=True)
class Entry:
    id: UUID
    postings: tuple[Posting, ...]
    reference: str

    def validate(self) -> None:
        if not self.postings:
            raise ImbalancedEntry("entry has no postings")
        currencies = {p.amount.currency for p in self.postings}
        if len(currencies) != 1:
            raise ImbalancedEntry(f"mixed currencies: {sorted(currencies)}")
        total = sum((p.amount.units for p in self.postings), 0)
        if total != 0:
            raise ImbalancedEntry(f"postings sum to {total}, expected 0")


class Ledger:
    """Append-only. Balances are derived, never stored as truth."""

    def __init__(self, repo: EntryRepo, clock: Clock) -> None:
        self._repo = repo
        self._clock = clock

    async def transfer(
        self,
        *,
        src: UUID,
        dst: UUID,
        amount: Money,
        reference: str,
        allow_overdraft: bool = False,
    ) -> Entry:
        if amount.units <= 0:
            raise ValueError("transfer amount must be positive")

        async with self._repo.transaction() as tx:
            src_balance = await tx.balance(src, for_update=True)
            if not allow_overdraft and src_balance.units < amount.units:
                raise InsufficientFunds(account_id=src, requested=amount, available=src_balance)

            entry = Entry(
                id=uuid4(),
                reference=reference,
                postings=(
                    Posting(account_id=src, amount=-amount, memo=reference),
                    Posting(account_id=dst, amount=amount, memo=reference),
                ),
            )
            entry.validate()
            await tx.append(entry, at=self._clock.now())
            return entry`,
    },
    types: {
      path: 'app/domain/idempotency.py', lang: 'py',
      code: `from __future__ import annotations

import hashlib
import json
from datetime import timedelta
from typing import Any

from redis.asyncio import Redis

from app.domain.errors import IdempotencyConflict, IdempotencyInFlight

TTL = timedelta(hours=24)
LOCK_TTL = timedelta(seconds=30)


def fingerprint(payload: dict[str, Any]) -> str:
    """Stable hash of the request body, so a retry with a different body is
    rejected instead of silently returning someone else's transfer."""
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode()).hexdigest()[:32]


class IdempotencyStore:
    def __init__(self, redis: Redis) -> None:
        self._redis = redis

    async def begin(self, key: str, payload: dict[str, Any]) -> dict[str, Any] | None:
        fp = fingerprint(payload)
        record = await self._redis.hgetall(self._k(key))

        if record:
            if record[b"fp"].decode() != fp:
                raise IdempotencyConflict(key=key)
            if record.get(b"state") == b"in_flight":
                raise IdempotencyInFlight(key=key)
            return json.loads(record[b"response"])

        claimed = await self._redis.hsetnx(self._k(key), "state", "in_flight")
        if not claimed:
            raise IdempotencyInFlight(key=key)

        await self._redis.hset(self._k(key), mapping={"fp": fp})
        await self._redis.expire(self._k(key), int(LOCK_TTL.total_seconds()))
        return None

    async def commit(self, key: str, response: dict[str, Any]) -> None:
        await self._redis.hset(
            self._k(key),
            mapping={"state": "done", "response": json.dumps(response)},
        )
        await self._redis.expire(self._k(key), int(TTL.total_seconds()))

    @staticmethod
    def _k(key: str) -> str:
        return "idem:" + key`,
    },
    test: {
      path: 'tests/test_ledger.py', lang: 'py',
      code: `import pytest

from app.domain.errors import ImbalancedEntry, InsufficientFunds
from app.domain.ledger import Entry, Ledger, Posting
from app.domain.money import krw
from tests.factories import account, fake_clock, in_memory_repo


@pytest.fixture
def ledger() -> Ledger:
    return Ledger(repo=in_memory_repo(), clock=fake_clock("2026-09-15T14:22:07Z"))


async def test_transfer_moves_the_full_amount(ledger: Ledger) -> None:
    src = await account(balance=krw(100_000))
    dst = await account(balance=krw(0))

    entry = await ledger.transfer(src=src.id, dst=dst.id, amount=krw(30_000), reference="t_1")

    assert await ledger.balance(src.id) == krw(70_000)
    assert await ledger.balance(dst.id) == krw(30_000)
    assert len(entry.postings) == 2


async def test_transfer_rejects_overdraft(ledger: Ledger) -> None:
    src = await account(balance=krw(1_000))
    dst = await account(balance=krw(0))

    with pytest.raises(InsufficientFunds) as err:
        await ledger.transfer(src=src.id, dst=dst.id, amount=krw(5_000), reference="t_2")

    assert err.value.available == krw(1_000)
    assert await ledger.balance(src.id) == krw(1_000)


async def test_concurrent_transfers_never_double_spend(ledger: Ledger) -> None:
    src = await account(balance=krw(10_000))
    dst = await account(balance=krw(0))

    results = await gather_settled(
        ledger.transfer(src=src.id, dst=dst.id, amount=krw(10_000), reference="t_3"),
        ledger.transfer(src=src.id, dst=dst.id, amount=krw(10_000), reference="t_4"),
    )

    assert sum(1 for r in results if isinstance(r, Entry)) == 1
    assert await ledger.balance(src.id) == krw(0)


def test_entry_must_balance() -> None:
    entry = Entry(id=uuid4(), reference="bad", postings=(Posting(account_id=uuid4(), amount=krw(5)),))
    with pytest.raises(ImbalancedEntry, match="sum to 5"):
        entry.validate()`,
    },
    patch: {
      path: 'app/domain/ledger.py', lang: 'py',
      code: `    async def balance(self, account_id: UUID, *, at: datetime | None = None) -> Money:
        # SELECT ... FOR UPDATE was missing here, so two concurrent transfers
        # both read the pre-debit balance and both passed the overdraft check.
        # Row lock on the account, not the entries. LED-2207.
        rows = await self._repo.postings_for(account_id, before=at or self._clock.now())
        return Money(
            units=sum(r.amount.units for r in rows),
            currency=rows[0].amount.currency if rows else "KRW",
        )`,
    },
    infra: {
      path: 'docker-compose.yml', lang: 'yaml',
      code: `services:
  api:
    build: { context: ., target: dev }
    command: uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    ports: ["8000:8000"]
    environment:
      DATABASE_URL: postgresql+asyncpg://ledger:ledger@db:5432/ledger
      REDIS_URL: redis://cache:6379/0
      LOG_LEVEL: debug
      OTEL_EXPORTER_OTLP_ENDPOINT: http://collector:4317
    depends_on:
      db: { condition: service_healthy }
      cache: { condition: service_started }
    volumes: [".:/src:cached"]

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ledger
      POSTGRES_PASSWORD: ledger
      POSTGRES_DB: ledger
    command: ["postgres", "-c", "max_connections=200", "-c", "log_min_duration_statement=200"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ledger"]
      interval: 2s
      retries: 20
    ports: ["5432:5432"]

  cache:
    image: redis:7-alpine
    command: ["redis-server", "--appendonly", "yes"]
    ports: ["6379:6379"]`,
    },
    scaffold: [
      {
        path: 'app/domain/money.py', lang: 'py',
        code: `from __future__ import annotations

from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal


@dataclass(frozen=True, slots=True, order=True)
class Money:
    """Minor units only. Never a float, never a bare int in a signature."""

    units: int
    currency: str = "KRW"

    def __post_init__(self) -> None:
        if len(self.currency) != 3 or not self.currency.isupper():
            raise ValueError(f"bad currency: {self.currency!r}")

    def __add__(self, other: Money) -> Money:
        self._assert_same(other)
        return Money(self.units + other.units, self.currency)

    def __neg__(self) -> Money:
        return Money(-self.units, self.currency)

    def scaled(self, factor: Decimal) -> Money:
        cents = (Decimal(self.units) * factor).quantize(Decimal(1), rounding=ROUND_HALF_UP)
        return Money(int(cents), self.currency)

    def _assert_same(self, other: Money) -> None:
        if self.currency != other.currency:
            raise ValueError(f"cannot combine {self.currency} with {other.currency}")


def krw(units: int) -> Money:
    return Money(units, "KRW")


def zero(currency: str = "KRW") -> Money:
    return Money(0, currency)`,
      },
      {
        path: 'app/api/transfers.py', lang: 'py',
        code: `from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Response, status

from app.deps import CurrentLedger, Idempotency
from app.domain.errors import InsufficientFunds
from app.schemas.transfer import TransferIn, TransferOut

router = APIRouter(prefix="/v1/transfers", tags=["transfers"])


@router.post("", status_code=status.HTTP_201_CREATED, response_model=TransferOut)
async def create_transfer(
    body: TransferIn,
    response: Response,
    ledger: CurrentLedger,
    idem: Idempotency,
    idempotency_key: Annotated[str, Header(alias="Idempotency-Key", min_length=8)],
) -> TransferOut:
    cached = await idem.begin(idempotency_key, body.model_dump(mode="json"))
    if cached is not None:
        response.headers["Idempotent-Replay"] = "true"
        return TransferOut.model_validate(cached)

    entry = await ledger.transfer(
        src=body.source_account_id,
        dst=body.destination_account_id,
        amount=body.amount.to_money(),
        reference=body.reference,
    )

    out = TransferOut.from_entry(entry)
    await idem.commit(idempotency_key, out.model_dump(mode="json"))
    return out`,
      },
    ],
  },
  cmd: {
    status: {
      cmd: 'git status --short --branch', ms: 480,
      out: L(
        '{{gr|##}} {{g|fix/LED-2207-double-spend}}{{gr|...origin/fix/LED-2207-double-spend}}',
        '{{r| M}} app/api/transfers.py',
        '{{r| M}} app/domain/ledger.py',
        '{{r| M}} app/domain/idempotency.py',
        '{{r| M}} tests/test_ledger.py',
        '{{r|??}} tests/test_idempotency.py',
      ),
    },
    install: {
      cmd: 'uv sync --all-extras', ms: 3900,
      out: L(
        '{{d|Using CPython 3.13.1}}',
        '{{d|Creating virtual environment at: .venv}}',
        '{{d|Resolved 148 packages in 84ms}}',
        '{{d|Prepared 6 packages in 612ms}}',
        '{{d|Installed 6 packages in 31ms}}',
        ' {{g|+}} anyio{{d|==4.7.0}}',
        ' {{g|+}} asyncpg{{d|==0.30.0}}',
        ' {{g|+}} fastapi{{d|==0.115.6}}',
        ' {{g|+}} hypothesis{{d|==6.122.3}}',
        ' {{g|+}} sqlalchemy{{d|==2.0.36}}',
        ' {{g|+}} pytest-asyncio{{d|==0.25.0}}',
      ),
    },
    dev: {
      cmd: 'uv run uvicorn app.main:app --reload --port 8000', ms: 3200, keep: true,
      out: L(
        '{{d|INFO}}:     Will watch for changes in these directories: [\'/Users/leaf/dev/ledger-api\']',
        '{{d|INFO}}:     Uvicorn running on {{c|http://127.0.0.1:8000}} (Press CTRL+C to quit)',
        '{{d|INFO}}:     Started reloader process [{{y|48213}}] using WatchFiles',
        '{{d|INFO}}:     Started server process [{{y|48216}}]',
        '{{d|INFO}}:     Waiting for application startup.',
        '{{gr|14:22:04}} {{g|INFO}}     app.db.session   pool ready min=5 max=20 dsn=postgres://***@db:5432/ledger',
        '{{gr|14:22:04}} {{g|INFO}}     app.main         alembic head=0041_add_hold_state (up to date)',
        '{{gr|14:22:04}} {{g|INFO}}     app.main         otel exporter → collector:4317',
        '{{d|INFO}}:     Application startup complete.',
        '{{d|INFO}}:     127.0.0.1:53114 - "GET /health/ready HTTP/1.1" {{g|200 OK}}',
      ),
    },
    test_fail: {
      cmd: 'uv run pytest tests -x -q --timeout 30', ms: 6100,
      out: L(
        '{{d|============================= test session starts ==============================}}',
        '{{d|platform darwin -- Python 3.13.1, pytest-8.3.4, pluggy-1.5.0}}',
        '{{d|rootdir: /Users/leaf/dev/ledger-api, configfile: pyproject.toml}}',
        '{{d|plugins: asyncio-0.25.0, cov-6.0.0, timeout-2.3.1, hypothesis-6.122.3}}',
        '{{d|asyncio: mode=auto}}',
        '{{d|collected 128 items}}',
        '',
        '{{g|..........................................}}{{d| [ 32%]}}',
        '{{g|.........................}}{{r|F}}{{d|                                         [ 53%]}}',
        '',
        '{{r|=================================== FAILURES ===================================}}',
        '{{r|__________________ test_concurrent_transfers_never_double_spend _________________}}',
        '',
        '{{d|ledger = <app.domain.ledger.Ledger object at 0x10ab3e410>}}',
        '',
        '{{d|    async def test_concurrent_transfers_never_double_spend(ledger: Ledger) -> None:}}',
        '{{d|        src = await account(balance=krw(10_000))}}',
        '{{d|        dst = await account(balance=krw(0))}}',
        '{{d|        results = await gather_settled(}}',
        '{{d|            ledger.transfer(src=src.id, dst=dst.id, amount=krw(10_000), reference="t_3"),}}',
        '{{d|            ledger.transfer(src=src.id, dst=dst.id, amount=krw(10_000), reference="t_4"),}}',
        '{{d|        )}}',
        '{{r|>       assert sum(1 for r in results if isinstance(r, Entry)) == 1}}',
        '{{r|E       assert 2 == 1}}',
        '',
        '{{r|tests/test_ledger.py:41}}: AssertionError',
        '{{d|------------------------------ captured log call -------------------------------}}',
        '{{y|WARNING}}  app.domain.ledger:ledger.py:71 balance read without row lock account=a_7f1c',
        '{{d|=========================== short test summary info ============================}}',
        '{{r|FAILED}} tests/test_ledger.py::test_concurrent_transfers_never_double_spend - assert 2 == 1',
        '{{r|!!!!!!!!!!!!!!!!!!!!!!!!!! stopping after 1 failures !!!!!!!!!!!!!!!!!!!!!!!!!!}}',
        '{{r|1 failed}}, {{g|67 passed}} {{d|in 4.18s}}',
      ),
    },
    test_pass: {
      cmd: 'uv run pytest tests -q --timeout 30', ms: 5400,
      out: L(
        '{{d|============================= test session starts ==============================}}',
        '{{d|platform darwin -- Python 3.13.1, pytest-8.3.4, pluggy-1.5.0}}',
        '{{d|asyncio: mode=auto}}',
        '{{d|collected 134 items}}',
        '',
        '{{g|..............................................................}}{{d| [ 46%]}}',
        '{{g|..............................................................}}{{d| [ 92%]}}',
        '{{g|..........}}{{d|                                                   [100%]}}',
        '',
        '{{g|134 passed}} {{d|in 6.02s}}',
      ),
    },
    types: {
      cmd: 'uv run mypy app --strict', ms: 7300,
      out: L(
        '{{r|app/domain/ledger.py:71}}: {{r|error}}: Returning Any from function declared to return "Money"  {{d|[no-any-return]}}',
        '{{r|app/domain/ledger.py:88}}: {{r|error}}: Argument "at" to "postings_for" of "EntryRepo" has incompatible type "datetime | None"; expected "datetime"  {{d|[arg-type]}}',
        '{{r|app/api/transfers.py:41}}: {{r|error}}: Item "None" of "dict[str, Any] | None" has no attribute "get"  {{d|[union-attr]}}',
        '{{r|Found 3 errors in 2 files (checked 68 source files)}}',
      ),
    },
    types_ok: {
      cmd: 'uv run mypy app --strict', ms: 6600,
      out: L('{{g|Success: no issues found in 68 source files}}'),
    },
    lint: {
      cmd: 'uv run ruff check app tests', ms: 1900,
      out: L(
        '{{r|app/domain/ledger.py}}{{d|:}}{{y|63}}{{d|:}}{{y|9}}{{d|:}} {{r|ARG002}} Unused method argument: {{w|allow_overdraft}}',
        '{{r|app/api/transfers.py}}{{d|:}}{{y|12}}{{d|:}}{{y|1}}{{d|:}} {{r|I001}} Import block is un-sorted or un-formatted',
        '{{r|tests/test_ledger.py}}{{d|:}}{{y|48}}{{d|:}}{{y|5}}{{d|:}} {{r|F821}} Undefined name {{w|uuid4}}',
        '{{r|Found 3 errors.}}',
        '{{d|[*] 2 fixable with the `--fix` option.}}',
      ),
    },
    lint_ok: {
      cmd: 'uv run ruff check app tests && uv run ruff format --check .', ms: 1700,
      out: L('{{g|All checks passed!}}', '{{d|94 files already formatted}}'),
    },
    build: {
      cmd: 'docker build -t ledger-api:3f9a1c2 --target runtime .', ms: 12800,
      out: L(
        '{{d|[+] Building 41.2s (14/14) FINISHED}}',
        '{{d| => [internal] load build definition from Dockerfile}}                    {{g|0.0s}}',
        '{{d| => [internal] load metadata for docker.io/library/python:3.13-slim}}     {{g|1.1s}}',
        '{{d| => [builder 1/6] FROM docker.io/library/python:3.13-slim}}               {{g|0.0s}}',
        '{{d| => CACHED [builder 2/6] COPY --from=ghcr.io/astral-sh/uv:0.5 /uv /bin/}} {{g|0.0s}}',
        '{{d| => CACHED [builder 3/6] COPY pyproject.toml uv.lock ./}}                 {{g|0.0s}}',
        '{{d| => [builder 4/6] RUN uv sync --frozen --no-dev}}                        {{y|18.4s}}',
        '{{d| => [builder 5/6] COPY app ./app}}                                       {{g|0.2s}}',
        '{{d| => [runtime 1/3] COPY --from=builder /src/.venv /src/.venv}}            {{g|1.8s}}',
        '{{d| => exporting to image}}                                                 {{g|3.9s}}',
        '{{d| => => writing image sha256:8c41f2a90b3e7d1c4a}}                          {{g|0.0s}}',
        '{{d| => => naming to docker.io/library/ledger-api:3f9a1c2}}                   {{g|0.0s}}',
        '',
        '{{g|✓ image size 184MB (prev 191MB, -3.7%)}}',
      ),
    },
    diff: {
      cmd: 'git diff --stat', ms: 650,
      out: L(
        ' app/api/transfers.py          | 22 {{g|+++++++++++++++}}{{r|-------}}',
        ' app/domain/errors.py          | 31 {{g|+++++++++++++++++++++++++++++++}}',
        ' app/domain/idempotency.py     | 44 {{g|++++++++++++++++++++++++++++++++}}{{r|------------}}',
        ' app/domain/ledger.py          | 58 {{g|++++++++++++++++++++++++++++++++++++++}}{{r|--------------------}}',
        ' tests/test_ledger.py          | 27 {{g|+++++++++++++++++++++}}{{r|------}}',
        ' {{w|5 files changed, 141 insertions(+), 41 deletions(-)}}',
      ),
    },
    commit: {
      cmd: 'git commit -am "fix(ledger): take a row lock before the overdraft check"', ms: 1300,
      out: L(
        '{{d|ruff.....................................................................}}{{g|Passed}}',
        '{{d|ruff-format..............................................................}}{{g|Passed}}',
        '{{d|mypy.....................................................................}}{{g|Passed}}',
        '{{d|check for added large files..............................................}}{{g|Passed}}',
        '{{d|detect-secrets...........................................................}}{{g|Passed}}',
        '',
        '{{g|[fix/LED-2207-double-spend b71e4c8]}} fix(ledger): take a row lock before the overdraft check',
        ' 5 files changed, 141 insertions(+), 41 deletions(-)',
        ' create mode 100644 app/domain/errors.py',
      ),
    },
    push: {
      cmd: 'git push -u origin HEAD && gh pr create --fill', ms: 4100,
      out: L(
        '{{d|Enumerating objects: 27, done.}}',
        '{{d|Writing objects: 100% (15/15), 4.11 KiB | 4.11 MiB/s, done.}}',
        '{{d|Total 15 (delta 11), reused 0 (delta 0), pack-reused 0}}',
        '{{d|To github.com:leafmeta/ledger-api.git}}',
        ' {{g|* [new branch]}}      HEAD -> fix/LED-2207-double-spend',
        '',
        '{{d|Creating pull request for fix/LED-2207-double-spend into main}}',
        '{{c|https://github.com/leafmeta/ledger-api/pull/912}}',
      ),
    },
    logs: {
      cmd: 'kubectl logs -n payments -l app=ledger-api --since=15m --tail=200 | grep -E "ERROR|double"', ms: 4700,
      out: L(
        '{{d|Defaulted container "api" out of: api, otel-sidecar}}',
        '{{gr|14:01:52.104}} {{r|ERROR}} app.domain.ledger  balance_mismatch account=a_7f1c expected=0 actual=-10000 entry=e_44a1',
        '{{gr|14:01:52.104}} {{r|ERROR}} app.api.transfers  500 POST /v1/transfers idem=idem_9f12 trace=4bd9c1e8',
        '{{gr|14:01:52.105}}   Traceback (most recent call last):',
        '{{gr|14:01:52.105}}     File "/src/app/domain/ledger.py", line 71, in balance',
        '{{gr|14:01:52.105}}       raise ImbalancedEntry(f"postings sum to {total}, expected 0")',
        '{{gr|14:01:52.105}}   app.domain.errors.ImbalancedEntry: postings sum to -10000, expected 0',
        '{{gr|14:03:18.771}} {{r|ERROR}} app.domain.ledger  balance_mismatch account=a_2b90 expected=0 actual=-4500',
        '{{gr|14:06:41.229}} {{y|WARN }} app.domain.ledger  double_debit_suspected account=a_7f1c window=180ms',
        '{{d|-- 22 matching lines · 3 accounts affected · first seen 13:58:02 --}}',
      ),
    },
    repro: {
      cmd: 'hey -n 200 -c 20 -m POST -H "Idempotency-Key: k_$(uuidgen)" -D fixtures/transfer.json http://localhost:8000/v1/transfers', ms: 5800,
      out: L(
        '{{d|Summary:}}',
        '{{d|  Total:}}        2.4181 secs',
        '{{d|  Requests/sec:}} {{w|82.7}}',
        '',
        '{{d|Status code distribution:}}',
        '  {{g|[201]}} 178 responses',
        '  {{r|[500]}} 22 responses',
        '',
        '{{d|Latency distribution:}}',
        '{{d|  50% in 0.1842 secs}}',
        '{{d|  95% in 0.4118 secs}}',
        '{{d|  99% in 0.9214 secs}}',
        '',
        '{{r|↑ 22 x 500 under 20 concurrent writers to the same account — reproduced}}',
        '{{d|psql> select sum(units) from postings where account_id = \'a_7f1c\';}}',
        '{{d| sum  }}',
        '{{r|-10000}}   {{d|← a negative balance that should be impossible}}',
      ),
    },
    cov: {
      cmd: 'uv run pytest --cov=app --cov-report=term-missing --cov-fail-under=90', ms: 9200,
      out: L(
        '{{d|collected 134 items}}',
        '{{g|.............................................................}}{{d| [100%]}}',
        '',
        '{{d|---------- coverage: platform darwin, python 3.13.1 -----------}}',
        '{{d|Name                          Stmts   Miss  Cover   Missing}}',
        '{{d|-------------------------------------------------------------}}',
        '{{d|app/domain/ledger.py}}            {{d|118}}      {{g|0}} {{g|100%}}',
        '{{d|app/domain/idempotency.py}}        {{d|61}}      {{g|1}} {{g|98%}}   {{d|74}}',
        '{{d|app/domain/money.py}}              {{d|42}}      {{g|0}} {{g|100%}}',
        '{{d|app/api/transfers.py}}             {{d|54}}      {{y|3}} {{y|94%}}   {{d|88-91}}',
        '{{d|app/db/repo.py}}                   {{d|96}}     {{y|11}} {{y|89%}}   {{d|142-149, 203-205}}',
        '{{d|-------------------------------------------------------------}}',
        '{{w|TOTAL}}                           {{d|1284}}     {{d|71}} {{g|94%}}',
        '',
        '{{g|Required test coverage of 90% reached. Total coverage: 94.47%}}',
        '{{g|134 passed}} {{d|in 7.91s}}',
      ),
    },
    sec: {
      cmd: 'uv run bandit -r app -ll && uv run pip-audit', ms: 6400,
      out: L(
        '{{d|[main]  INFO    profile include tests: None}}',
        '{{d|[main]  INFO    running on Python 3.13.1}}',
        '{{d|Run started: 2026-09-15 14:41:02}}',
        '',
        '{{y|>> Issue: [B608:hardcoded_sql_expressions] Possible SQL injection vector.}}',
        '{{d|   Severity: Medium   Confidence: Low}}',
        '{{d|   Location: app/db/repo.py:211}}',
        '{{d|   210         stmt = text(}}',
        '{{d|   211             "select * from postings where account_id = :aid order by seq " + order}}',
        '',
        '{{d|Code scanned: 1,284 lines}}',
        '{{d|Issues: 0 high, 1 medium, 2 low}}',
        '',
        '{{g|No known vulnerabilities found in 148 packages}}',
      ),
    },
    bench: {
      cmd: 'uv run pytest tests/bench --benchmark-only --benchmark-columns=min,mean,p99,ops', ms: 10400,
      out: L(
        '{{d|----------------------------- benchmark: 4 tests ------------------------------}}',
        '{{d|Name                          Min       Mean      P99       OPS}}',
        '{{d|------------------------------------------------------------------------------}}',
        '{{w|test_transfer_hot_path}}     {{g|0.4120}}   {{g|0.4881}}   {{g|0.7412}}  {{g|2,048.7}}',
        '{{w|test_balance_1k_postings}}   {{g|1.8412}}   {{g|2.0114}}   {{y|3.4180}}    {{g|497.2}}',
        '{{w|test_idempotency_replay}}    {{g|0.0841}}   {{g|0.0912}}   {{g|0.1402}} {{g|10,964.9}}',
        '{{w|test_entry_validate}}        {{g|0.0021}}   {{g|0.0024}}   {{g|0.0038}} {{g|416,204}}',
        '{{d|------------------------------------------------------------------------------}}',
        '',
        '{{g|→ transfer hot path 41% faster after the FOR UPDATE SKIP LOCKED rewrite}}',
      ),
    },
    review: {
      cmd: 'gh pr diff 912 --patch | head -30 && gh pr checks 912', ms: 5200,
      out: L(
        '{{w|diff --git a/app/domain/ledger.py b/app/domain/ledger.py}}',
        '{{c|@@ -64,9 +64,14 @@ class Ledger:}}',
        '{{d|         async with self._repo.transaction() as tx:}}',
        '{{r|-            src_balance = await tx.balance(src)}}',
        '{{g|+            src_balance = await tx.balance(src, for_update=True)}}',
        '{{d|             if not allow_overdraft and src_balance.units < amount.units:}}',
        '{{g|+                await tx.rollback()}}',
        '{{d|                 raise InsufficientFunds(...)}}',
        '',
        '{{w|All checks were successful}}',
        '  {{g|✓}} pytest (3.12)     {{d|1m12s}}',
        '  {{g|✓}} pytest (3.13)     {{d|1m08s}}',
        '  {{g|✓}} mypy --strict     {{d|38s}}',
        '  {{g|✓}} ruff              {{d|6s}}',
        '  {{g|✓}} contract-tests    {{d|2m04s}}  {{d|pact: 14/14 verified}}',
        '  {{g|✓}} load-test         {{d|4m41s}}  {{d|p99 0.74ms @ 2k rps}}',
      ),
    },
    deploy: {
      cmd: 'kubectl -n payments set image deploy/ledger-api api=ghcr.io/leafmeta/ledger-api:3f9a1c2 && kubectl -n payments rollout status deploy/ledger-api', ms: 13400,
      out: L(
        '{{d|deployment.apps/ledger-api image updated}}',
        '{{d|Waiting for deployment "ledger-api" rollout to finish: 0 of 6 updated replicas are available...}}',
        '{{d|Waiting for deployment "ledger-api" rollout to finish: 1 of 6 updated replicas are available...}}',
        '{{d|Waiting for deployment "ledger-api" rollout to finish: 3 of 6 updated replicas are available...}}',
        '{{d|Waiting for deployment "ledger-api" rollout to finish: 5 of 6 updated replicas are available...}}',
        '{{g|deployment "ledger-api" successfully rolled out}}',
        '',
        '{{d|$ kubectl -n payments get pods -l app=ledger-api}}',
        '{{d|NAME                          READY   STATUS    RESTARTS   AGE}}',
        '{{d|ledger-api-7d9f4b8c6-2xk4p}}    {{g|1/1}}     {{g|Running}}   0          {{d|48s}}',
        '{{d|ledger-api-7d9f4b8c6-9lm2w}}    {{g|1/1}}     {{g|Running}}   0          {{d|41s}}',
        '{{d|ledger-api-7d9f4b8c6-hb7qz}}    {{g|1/1}}     {{g|Running}}   0          {{d|33s}}',
        '{{g|✓ error rate 0.00% over the last 120s (was 1.8%)}}',
      ),
    },
    migrate: {
      cmd: 'uv run alembic revision --autogenerate -m "lock accounts row" && uv run alembic upgrade head', ms: 8100,
      out: L(
        '{{d|INFO}}  [alembic.runtime.migration] Context impl PostgresqlImpl.',
        '{{d|INFO}}  [alembic.autogenerate.compare] Detected added index \'postings_account_seq_idx\' on \'postings\'',
        '{{d|INFO}}  [alembic.autogenerate.compare] Detected added column \'accounts.locked_at\'',
        '{{g|  Generating}} migrations/versions/0042_lock_accounts_row.py ... {{g|done}}',
        '',
        '{{d|INFO}}  [alembic.runtime.migration] Running upgrade 0041 -> 0042, lock accounts row',
        '{{d|INFO}}  [alembic.ddl.postgresql] CREATE INDEX CONCURRENTLY postings_account_seq_idx (412ms)}}',
        '{{d|INFO}}  [alembic.ddl.postgresql] ALTER TABLE accounts ADD COLUMN locked_at timestamptz (18ms)}}',
        '{{g|✓ schema at head 0042 · 0 rows rewritten · no exclusive lock held > 50ms}}',
      ),
    },
    grepTarget: 'def balance|for_update',
  },
  probs: [
    { sev: 'e', file: 'app/domain/ledger.py', line: 71, col: 16, msg: 'Returning Any from function declared to return "Money"', src: 'mypy(no-any-return)' },
    { sev: 'e', file: 'app/api/transfers.py', line: 41, col: 5, msg: 'Item "None" of "dict[str, Any] | None" has no attribute "get"', src: 'mypy(union-attr)' },
    { sev: 'w', file: 'app/domain/ledger.py', line: 63, col: 9, msg: 'Unused method argument: allow_overdraft', src: 'ruff(ARG002)' },
  ],
  logtail: [
    '{{gr|$t}} {{g|INFO}}  {{c|POST}} /v1/transfers          {{g|201}}  {{d|$msms}}  {{gr|idem=k_$h amount=$n00 KRW}}',
    '{{gr|$t}} {{g|INFO}}  {{c|GET}}  /v1/accounts/a_$h      {{g|200}}  {{d|$msms}}  {{gr|balance=$n0000}}',
    '{{gr|$t}} {{g|INFO}}  {{c|POST}} /v1/transfers          {{g|201}}  {{d|$msms}}  {{gr|replay=true}}',
    '{{gr|$t}} {{g|INFO}}  {{gr|sqlalchemy.engine}} SELECT postings WHERE account_id=$1 FOR UPDATE {{d|$msms}}',
    '{{gr|$t}} {{y|WARN}}  {{c|POST}} /v1/transfers          {{y|409}}  {{d|$msms}}  {{gr|IdempotencyInFlight key=k_$h}}',
    '{{gr|$t}} {{g|INFO}}  {{c|POST}} /v1/webhooks/psp       {{g|200}}  {{d|$msms}}  {{gr|evt=settlement.completed}}',
    '{{gr|$t}} {{g|INFO}}  {{gr|app.jobs.reconcile}} cycle done accounts=$n412 drift=0 {{d|$msms}}',
  ],
};

/* ════════════════════════════════════════════════════════════════════════
   스택 3 — Go · gRPC 마이크로서비스  (order-svc)
   ════════════════════════════════════════════════════════════════════════ */
const golang = {
  id: 'go',
  label: 'Go · gRPC Service',
  icon: '◉',
  hint: 'Go 1.24 · gRPC + protobuf · sqlc · testcontainers · golangci-lint · Docker. Order state machine behind a gateway.',
  lang: 'go', langLabel: 'Go',
  repo: 'order-svc', org: 'leafmeta',
  root: '~/dev/order-svc',
  pkg: 'go',
  terms: ['zsh', 'air (hot reload)', 'go test -watch', 'grpcurl'],
  ext: ['Go', 'vscode-proto3', 'Error Lens'],
  tree: [
    { d: 'cmd', open: true, c: [{ d: 'server', c: [{ f: 'main.go' }] }, { d: 'migrate', c: [{ f: 'main.go' }] }] },
    { d: 'internal', open: true, c: [
      { d: 'order', open: true, c: [
        { f: 'state.go', git: 'M' }, { f: 'state_test.go', git: 'M' },
        { f: 'service.go', git: 'M' }, { f: 'repo.go' }, { f: 'events.go', git: 'U' },
      ] },
      { d: 'grpc', c: [{ f: 'server.go' }, { f: 'interceptor.go' }] },
      { d: 'store', c: [{ f: 'queries.sql.go' }, { f: 'db.go' }] },
      { d: 'telemetry', c: [{ f: 'otel.go' }] },
    ] },
    { d: 'api', c: [{ d: 'order', c: [{ d: 'v1', c: [{ f: 'order.proto' }, { f: 'order.pb.go' }] }] }] },
    { d: 'deploy', c: [{ f: 'Dockerfile' }, { f: 'order-svc.yaml' }] },
    { f: 'go.mod' }, { f: 'go.sum' }, { f: 'Makefile' }, { f: '.golangci.yml' }, { f: 'buf.gen.yaml' },
  ],
  topic: {
    title: 'Emit an outbox event per transition',
    unit: 'the transition path',
    criteria: 'at-least-once delivery',
    implicit: 'events are published inside the business transaction, so a slow broker rolls back the order',
    explicit: 'write the event to an outbox in the same transaction and let a relay drain it',
    done: 'Transitions now write to an outbox in the same transaction, so a broker outage cannot roll back an order.',
    peer: 'outbox in the same tx is the right call. we lost orders to broker timeouts twice last quarter',
    hover: 'Applies a transition in place and appends to History. The caller persists with an optimistic check on Version.',
    symbol: 'Order.To',
  },
  files: {
    impl: {
      path: 'internal/order/state.go', lang: 'go',
      code: `package order

import (
	"fmt"
	"time"
)

// Status is the order lifecycle. Transitions are a closed set: anything not
// listed in allowed is a bug, not a business decision.
type Status string

const (
	StatusDraft     Status = "DRAFT"
	StatusPending   Status = "PENDING_PAYMENT"
	StatusPaid      Status = "PAID"
	StatusPacking   Status = "PACKING"
	StatusShipped   Status = "SHIPPED"
	StatusDelivered Status = "DELIVERED"
	StatusCancelled Status = "CANCELLED"
	StatusRefunded  Status = "REFUNDED"
)

var allowed = map[Status][]Status{
	StatusDraft:     {StatusPending, StatusCancelled},
	StatusPending:   {StatusPaid, StatusCancelled},
	StatusPaid:      {StatusPacking, StatusRefunded},
	StatusPacking:   {StatusShipped, StatusRefunded},
	StatusShipped:   {StatusDelivered},
	StatusDelivered: {StatusRefunded},
	StatusCancelled: {},
	StatusRefunded:  {},
}

// Terminal reports whether no further transition is possible.
func (s Status) Terminal() bool { return len(allowed[s]) == 0 }

type InvalidTransition struct {
	From, To Status
}

func (e InvalidTransition) Error() string {
	return fmt.Sprintf("order: cannot move %s -> %s", e.From, e.To)
}

type Order struct {
	ID        string
	Status    Status
	Version   int64
	Total     Money
	UpdatedAt time.Time
	History   []Transition
}

type Transition struct {
	From, To Status
	At       time.Time
	Actor    string
	Reason   string
}

// To applies a transition in place, appending to History. The caller is
// responsible for persisting with an optimistic-concurrency check on Version.
func (o *Order) To(next Status, actor, reason string, now time.Time) error {
	for _, ok := range allowed[o.Status] {
		if ok != next {
			continue
		}
		o.History = append(o.History, Transition{
			From: o.Status, To: next, At: now, Actor: actor, Reason: reason,
		})
		o.Status = next
		o.Version++
		o.UpdatedAt = now
		return nil
	}
	return InvalidTransition{From: o.Status, To: next}
}`,
    },
    types: {
      path: 'internal/order/events.go', lang: 'go',
      code: `package order

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
)

// Outbox row. We never publish to Kafka inside the business transaction;
// we write here in the same tx and a relay drains it at-least-once.
type OutboxEvent struct {
	ID          string
	AggregateID string
	Type        string
	Payload     json.RawMessage
	CreatedAt   time.Time
	PublishedAt *time.Time
}

type Publisher interface {
	Publish(ctx context.Context, topic string, key string, body []byte) error
}

type Relay struct {
	repo  OutboxRepo
	pub   Publisher
	batch int
	topic string
}

func NewRelay(repo OutboxRepo, pub Publisher, opts ...RelayOption) *Relay {
	r := &Relay{repo: repo, pub: pub, batch: 128, topic: "order.events.v1"}
	for _, o := range opts {
		o(r)
	}
	return r
}

// Drain publishes one batch. Returns the number published and whether more
// rows are waiting, so the caller can loop without sleeping.
func (r *Relay) Drain(ctx context.Context) (int, bool, error) {
	rows, err := r.repo.ClaimUnpublished(ctx, r.batch)
	if err != nil {
		return 0, false, fmt.Errorf("claim: %w", err)
	}

	sent := 0
	for _, ev := range rows {
		if err := r.pub.Publish(ctx, r.topic, ev.AggregateID, ev.Payload); err != nil {
			return sent, true, fmt.Errorf("publish %s: %w", ev.ID, err)
		}
		if err := r.repo.MarkPublished(ctx, ev.ID, time.Now()); err != nil {
			return sent, true, fmt.Errorf("mark %s: %w", ev.ID, err)
		}
		sent++
	}
	return sent, len(rows) == r.batch, nil
}`,
    },
    test: {
      path: 'internal/order/state_test.go', lang: 'go',
      code: `package order

import (
	"testing"
	"time"

	"github.com/google/go-cmp/cmp"
)

func TestOrderTransitions(t *testing.T) {
	now := time.Date(2026, 9, 15, 14, 22, 7, 0, time.UTC)

	tests := []struct {
		name    string
		from    Status
		to      Status
		wantErr bool
	}{
		{"draft to pending", StatusDraft, StatusPending, false},
		{"pending to paid", StatusPending, StatusPaid, false},
		{"paid to packing", StatusPaid, StatusPacking, false},
		{"shipped to cancelled", StatusShipped, StatusCancelled, true},
		{"delivered to packing", StatusDelivered, StatusPacking, true},
		{"cancelled is terminal", StatusCancelled, StatusPaid, true},
		{"refund after delivery", StatusDelivered, StatusRefunded, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			o := &Order{ID: "o_1", Status: tt.from, Version: 3}
			err := o.To(tt.to, "svc:test", "unit", now)

			if tt.wantErr {
				if err == nil {
					t.Fatalf("To(%s) = nil, want InvalidTransition", tt.to)
				}
				if o.Version != 3 {
					t.Errorf("version bumped on a rejected transition: %d", o.Version)
				}
				return
			}
			if err != nil {
				t.Fatalf("To(%s) = %v, want nil", tt.to, err)
			}
			if o.Status != tt.to {
				t.Errorf("status = %s, want %s", o.Status, tt.to)
			}
			if diff := cmp.Diff(Transition{From: tt.from, To: tt.to, At: now, Actor: "svc:test", Reason: "unit"}, o.History[0]); diff != "" {
				t.Errorf("history mismatch (-want +got):\\n%s", diff)
			}
		})
	}
}

func FuzzTransitionNeverPanics(f *testing.F) {
	f.Add("DRAFT", "PAID")
	f.Fuzz(func(t *testing.T, from, to string) {
		o := &Order{Status: Status(from)}
		_ = o.To(Status(to), "fuzz", "", time.Now())
	})
}`,
    },
    patch: {
      path: 'internal/order/state.go', lang: 'go',
      code: `// To applies a transition in place. The loop below used to "return nil" from
// inside the range when the first candidate did not match, so any order whose
// first allowed target was not the requested one silently succeeded without
// changing Status. ORD-3318.
func (o *Order) To(next Status, actor, reason string, now time.Time) error {
	if !slices.Contains(allowed[o.Status], next) {
		return InvalidTransition{From: o.Status, To: next}
	}
	o.History = append(o.History, Transition{From: o.Status, To: next, At: now, Actor: actor, Reason: reason})
	o.Status, o.Version, o.UpdatedAt = next, o.Version+1, now
	return nil
}`,
    },
    infra: {
      path: 'api/order/v1/order.proto', lang: 'ts',
      code: `syntax = "proto3";

package order.v1;

option go_package = "github.com/leafmeta/order-svc/api/order/v1;orderv1";

import "google/protobuf/timestamp.proto";
import "buf/validate/validate.proto";

service OrderService {
  rpc CreateOrder(CreateOrderRequest) returns (Order);
  rpc TransitionOrder(TransitionOrderRequest) returns (Order);
  rpc GetOrder(GetOrderRequest) returns (Order);
  rpc WatchOrder(GetOrderRequest) returns (stream OrderEvent);
}

enum Status {
  STATUS_UNSPECIFIED = 0;
  STATUS_DRAFT = 1;
  STATUS_PENDING_PAYMENT = 2;
  STATUS_PAID = 3;
  STATUS_PACKING = 4;
  STATUS_SHIPPED = 5;
  STATUS_DELIVERED = 6;
  STATUS_CANCELLED = 7;
  STATUS_REFUNDED = 8;
}

message Order {
  string id = 1;
  Status status = 2;
  int64 version = 3;
  Money total = 4;
  google.protobuf.Timestamp updated_at = 5;
  repeated Transition history = 6;
}

message TransitionOrderRequest {
  string order_id = 1 [(buf.validate.field).string.min_len = 3];
  Status target = 2 [(buf.validate.field).enum.defined_only = true];
  int64 expected_version = 3;
  string reason = 4 [(buf.validate.field).string.max_len = 280];
}`,
    },
    scaffold: [
      {
        path: 'internal/order/service.go', lang: 'go',
        code: `package order

import (
	"context"
	"errors"
	"log/slog"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type Service struct {
	repo Repo
	pub  Publisher
	log  *slog.Logger
}

func NewService(repo Repo, pub Publisher, log *slog.Logger) *Service {
	return &Service{repo: repo, pub: pub, log: log}
}

// Transition is the only write path. It is idempotent on (orderID, target,
// expectedVersion): a retry of the same call returns the same order.
func (s *Service) Transition(ctx context.Context, req TransitionCmd) (*Order, error) {
	tx, err := s.repo.Begin(ctx)
	if err != nil {
		return nil, status.Error(codes.Unavailable, "database unavailable")
	}
	defer tx.Rollback(ctx)

	o, err := tx.GetForUpdate(ctx, req.OrderID)
	if errors.Is(err, ErrNotFound) {
		return nil, status.Errorf(codes.NotFound, "order %s", req.OrderID)
	} else if err != nil {
		return nil, err
	}

	if o.Version != req.ExpectedVersion {
		if o.Status == req.Target {
			return o, nil // already applied by an earlier retry
		}
		return nil, status.Errorf(codes.Aborted, "version %d, expected %d", o.Version, req.ExpectedVersion)
	}

	if err := o.To(req.Target, req.Actor, req.Reason, s.now()); err != nil {
		var bad InvalidTransition
		if errors.As(err, &bad) {
			return nil, status.Error(codes.FailedPrecondition, bad.Error())
		}
		return nil, err
	}

	if err := tx.Save(ctx, o); err != nil {
		return nil, err
	}
	if err := tx.AppendOutbox(ctx, o.lastEvent()); err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	s.log.InfoContext(ctx, "order.transitioned",
		"order_id", o.ID, "from", o.History[len(o.History)-1].From, "to", o.Status, "version", o.Version)
	return o, nil
}`,
      },
    ],
  },
  cmd: {
    status: {
      cmd: 'git status --short --branch', ms: 460,
      out: L(
        '{{gr|##}} {{g|fix/ORD-3318-transition}}{{gr|...origin/fix/ORD-3318-transition}}',
        '{{r| M}} internal/order/state.go',
        '{{r| M}} internal/order/state_test.go',
        '{{r| M}} internal/order/service.go',
        '{{r|??}} internal/order/events.go',
      ),
    },
    install: {
      cmd: 'go mod download && go mod verify', ms: 3300,
      out: L(
        '{{d|go: downloading google.golang.org/grpc v1.69.2}}',
        '{{d|go: downloading github.com/jackc/pgx/v5 v5.7.2}}',
        '{{d|go: downloading go.opentelemetry.io/otel v1.33.0}}',
        '{{d|go: downloading github.com/testcontainers/testcontainers-go v0.34.0}}',
        '{{g|all modules verified}}',
      ),
    },
    dev: {
      cmd: 'air -c .air.toml', ms: 3600, keep: true,
      out: L(
        '{{c|  __    _   ___}}',
        '{{c| / /\\  | | | |_}}',
        '{{c|/_/--\\ |_| |_| , built with Go}}',
        '',
        '{{d|watching .}}',
        '{{d|building...}}',
        '{{g|running...}}',
        '{{gr|14:22:04.118}} {{g|INFO}} server starting addr=:9090 version=3f9a1c2 go=1.24.0',
        '{{gr|14:22:04.119}} {{g|INFO}} store connected pool=20 dsn=postgres://***@localhost:5432/orders',
        '{{gr|14:22:04.121}} {{g|INFO}} otel tracing enabled endpoint=localhost:4317 sampler=parentbased(0.1)',
        '{{gr|14:22:04.121}} {{g|INFO}} grpc reflection registered services=2',
        '{{gr|14:22:04.122}} {{g|INFO}} outbox relay started batch=128 interval=200ms',
        '{{gr|14:22:04.122}} {{g|INFO}} ready {{d|(1.8s)}}',
      ),
    },
    test_fail: {
      cmd: 'go test ./internal/... -race -count=1', ms: 7400,
      out: L(
        '{{d|ok  	github.com/leafmeta/order-svc/internal/grpc	0.412s}}',
        '{{r|--- FAIL: TestOrderTransitions (0.01s)}}',
        '{{r|    --- FAIL: TestOrderTransitions/shipped_to_cancelled (0.00s)}}',
        '{{d|        state_test.go:41: To(CANCELLED) = nil, want InvalidTransition}}',
        '{{r|    --- FAIL: TestOrderTransitions/delivered_to_packing (0.00s)}}',
        '{{d|        state_test.go:41: To(PACKING) = nil, want InvalidTransition}}',
        '{{r|    --- FAIL: TestOrderTransitions/cancelled_is_terminal (0.00s)}}',
        '{{d|        state_test.go:44: version bumped on a rejected transition: 4}}',
        '{{r|FAIL}}',
        '{{r|FAIL	github.com/leafmeta/order-svc/internal/order	0.028s}}',
        '{{d|ok  	github.com/leafmeta/order-svc/internal/store	1.884s}}',
        '{{d|ok  	github.com/leafmeta/order-svc/internal/telemetry	0.118s}}',
        '{{r|FAIL}}',
      ),
    },
    test_pass: {
      cmd: 'go test ./... -race -count=1 -cover', ms: 8900,
      out: L(
        '{{d|ok  	github.com/leafmeta/order-svc/cmd/server	0.218s	coverage: }}{{g|71.4%}}{{d| of statements}}',
        '{{d|ok  	github.com/leafmeta/order-svc/internal/grpc	0.402s	coverage: }}{{g|88.2%}}{{d| of statements}}',
        '{{d|ok  	github.com/leafmeta/order-svc/internal/order	0.061s	coverage: }}{{g|97.6%}}{{d| of statements}}',
        '{{d|ok  	github.com/leafmeta/order-svc/internal/store	1.901s	coverage: }}{{g|91.0%}}{{d| of statements}}',
        '{{d|ok  	github.com/leafmeta/order-svc/internal/telemetry	0.114s	coverage: }}{{g|84.7%}}{{d| of statements}}',
        '{{g|PASS — 214 tests, 0 failures, race detector clean}}',
      ),
    },
    types: {
      cmd: 'go vet ./... && go build ./...', ms: 5200,
      out: L(
        '{{r|# github.com/leafmeta/order-svc/internal/order}}',
        '{{r|internal/order/state.go:78:3}}: unreachable code',
        '{{r|internal/order/service.go:64:9}}: nilness: impossible condition: nil != nil',
        '{{r|exit status 1}}',
      ),
    },
    types_ok: {
      cmd: 'go vet ./... && go build ./...', ms: 4700,
      out: L('{{d|(no output — vet clean, build ok in 4.1s)}}'),
    },
    lint: {
      cmd: 'golangci-lint run ./... --timeout 3m', ms: 8600,
      out: L(
        '{{r|internal/order/state.go:78:3}}: {{r|S1023}}: redundant return statement {{d|(gosimple)}}',
        '{{r|internal/order/service.go:112:2}}: {{r|contextcheck}}: function `s.pub.Publish` should pass the context parameter',
        '{{r|internal/order/repo.go:44:14}}: {{r|errcheck}}: Error return value of `rows.Close` is not checked',
        '{{r|internal/order/events.go:71:5}}: {{r|gocritic}}: appendAssign: append result not assigned to the same slice',
        '{{y|4 issues:}}',
        '{{d|* gosimple: 1}}  {{d|* contextcheck: 1}}  {{d|* errcheck: 1}}  {{d|* gocritic: 1}}',
      ),
    },
    lint_ok: {
      cmd: 'golangci-lint run ./... --timeout 3m', ms: 7200,
      out: L('{{g|0 issues.}}'),
    },
    build: {
      cmd: 'CGO_ENABLED=0 go build -trimpath -ldflags "-s -w -X main.rev=3f9a1c2" -o bin/order-svc ./cmd/server && docker buildx build --platform linux/amd64,linux/arm64 -t ghcr.io/leafmeta/order-svc:3f9a1c2 .', ms: 14200,
      out: L(
        '{{d|[+] Building 52.4s (18/18) FINISHED                        docker:desktop-linux}}',
        '{{d| => [internal] load build definition from Dockerfile                    0.0s}}',
        '{{d| => [linux/amd64 builder 4/7] RUN go build -trimpath -ldflags "-s -w"  21.8s}}',
        '{{d| => [linux/arm64 builder 4/7] RUN go build -trimpath -ldflags "-s -w"  24.1s}}',
        '{{d| => [linux/amd64 runtime 2/3] COPY --from=builder /src/bin/order-svc    0.3s}}',
        '{{d| => exporting to image                                                  4.1s}}',
        '{{d| => => exporting manifest list sha256:7c19e8a4b21f                       0.0s}}',
        '{{d| => => pushing layers                                                    2.8s}}',
        '',
        '{{g|✓ binary 14.2MB static · image 21.4MB (distroless/static:nonroot)}}',
      ),
    },
    diff: {
      cmd: 'git diff --stat', ms: 620,
      out: L(
        ' internal/order/events.go       | 74 {{g|++++++++++++++++++++++++++++++++++++++++++++++}}',
        ' internal/order/service.go      | 41 {{g|+++++++++++++++++++++++++++}}{{r|--------------}}',
        ' internal/order/state.go        | 33 {{g|++++++++++++++++++}}{{r|---------------}}',
        ' internal/order/state_test.go   | 58 {{g|++++++++++++++++++++++++++++++++++++++++}}{{r|------}}',
        ' {{w|4 files changed, 171 insertions(+), 35 deletions(-)}}',
      ),
    },
    commit: {
      cmd: 'git commit -am "fix(order): reject transitions not in the allowed set"', ms: 1200,
      out: L(
        '{{d|gofumpt..................................................................}}{{g|Passed}}',
        '{{d|go vet...................................................................}}{{g|Passed}}',
        '{{d|golangci-lint............................................................}}{{g|Passed}}',
        '{{d|buf lint.................................................................}}{{g|Passed}}',
        '',
        '{{g|[fix/ORD-3318-transition c14b902]}} fix(order): reject transitions not in the allowed set',
        ' 4 files changed, 171 insertions(+), 35 deletions(-)',
        ' create mode 100644 internal/order/events.go',
      ),
    },
    push: {
      cmd: 'git push -u origin HEAD', ms: 2900,
      out: L(
        '{{d|Enumerating objects: 24, done.}}',
        '{{d|Writing objects: 100% (13/13), 3.88 KiB | 3.88 MiB/s, done.}}',
        '{{d|remote: Resolving deltas: 100% (9/9), completed with 8 local objects.}}',
        '{{d|remote: }}',
        '{{d|remote: Create a pull request for \'fix/ORD-3318-transition\':}}',
        '{{d|remote: }}     {{c|https://github.com/leafmeta/order-svc/pull/331}}',
        '{{d|To github.com:leafmeta/order-svc.git}}',
        ' {{g|* [new branch]}}      HEAD -> fix/ORD-3318-transition',
      ),
    },
    logs: {
      cmd: 'stern -n orders order-svc --since 10m | grep -E "invalid|ERROR|panic"', ms: 4400,
      out: L(
        '{{d|+ order-svc-6f8b94c7d-4kx2p › order}}',
        '{{d|+ order-svc-6f8b94c7d-9wq7m › order}}',
        '{{gr|14:01:02.418}} {{r|ERROR}} order.transition_rejected_downstream order_id=o_8812 from=SHIPPED to=CANCELLED',
        '{{gr|14:01:02.418}} {{r|ERROR}} wms.callback 409 order o_8812 already shipped, cannot cancel',
        '{{gr|14:02:44.771}} {{y|WARN }} order.state_drift order_id=o_8812 db=CANCELLED wms=SHIPPED',
        '{{gr|14:04:18.102}} {{r|ERROR}} order.transition_rejected_downstream order_id=o_9041 from=DELIVERED to=PACKING',
        '{{gr|14:07:55.339}} {{y|WARN }} outbox.relay lag=4,112 events oldest=6m12s',
        '{{d|-- 31 matching lines · 14 orders in an impossible state --}}',
      ),
    },
    repro: {
      cmd: 'grpcurl -plaintext -d \'{"order_id":"o_8812","target":"STATUS_CANCELLED","expected_version":7}\' localhost:9090 order.v1.OrderService/TransitionOrder', ms: 2800,
      out: L(
        '{',
        '  {{c|"id"}}: {{str|"o_8812"}},',
        '  {{c|"status"}}: {{r|"STATUS_SHIPPED"}},   {{d|← accepted the call but did not move}}',
        '  {{c|"version"}}: {{r|"8"}},                {{d|← and still bumped the version}}',
        '  {{c|"updatedAt"}}: {{str|"2026-09-15T14:22:07Z"}}',
        '}',
        '',
        '{{r|↑ expected FailedPrecondition, got OK. The state machine is lying.}}',
      ),
    },
    cov: {
      cmd: 'go test ./... -coverprofile=cover.out -covermode=atomic && go tool cover -func=cover.out | tail -14', ms: 10100,
      out: L(
        '{{d|github.com/leafmeta/order-svc/internal/order/state.go:38:	Terminal	}}{{g|100.0%}}',
        '{{d|github.com/leafmeta/order-svc/internal/order/state.go:61:	To		}}{{g|100.0%}}',
        '{{d|github.com/leafmeta/order-svc/internal/order/service.go:31:	Transition	}}{{g|96.2%}}',
        '{{d|github.com/leafmeta/order-svc/internal/order/events.go:48:	Drain		}}{{g|92.8%}}',
        '{{d|github.com/leafmeta/order-svc/internal/store/db.go:22:		Begin		}}{{y|78.5%}}',
        '{{d|total:								(statements)	}}{{g|93.1%}}',
        '',
        '{{g|✓ coverage 93.1% (gate 90.0%) · +5.4pp from this change}}',
      ),
    },
    sec: {
      cmd: 'govulncheck ./... && trivy image --severity HIGH,CRITICAL ghcr.io/leafmeta/order-svc:3f9a1c2', ms: 9400,
      out: L(
        '{{d|Scanning your code and 412 packages across 38 dependent modules...}}',
        '',
        '{{y|Vulnerability #1: GO-2025-3241}}',
        '{{d|    Improper handling of HTTP/2 CONTINUATION frames in golang.org/x/net}}',
        '{{d|  More info: https://pkg.go.dev/vuln/GO-2025-3241}}',
        '{{d|  Module: golang.org/x/net}}',
        '{{d|    Found in: golang.org/x/net@v0.32.0}}',
        '{{d|    Fixed in: golang.org/x/net@v0.33.0}}',
        '',
        '{{y|1 vulnerability found in dependencies (0 in your code paths)}}',
        '',
        '{{d|ghcr.io/leafmeta/order-svc:3f9a1c2 (distroless)}}',
        '{{g|Total: 0 (HIGH: 0, CRITICAL: 0)}}',
      ),
    },
    bench: {
      cmd: 'go test ./internal/order -bench=. -benchmem -benchtime=3s -count=3 | tee bench.txt && benchstat base.txt bench.txt', ms: 12400,
      out: L(
        '{{d|goos: darwin}}',
        '{{d|goarch: arm64}}',
        '{{d|cpu: Apple M3 Pro}}',
        '{{d|BenchmarkTransition-11        	 8419204	       412.1 ns/op	     112 B/op	       2 allocs/op}}',
        '{{d|BenchmarkOutboxDrain128-11    	   14082	    254118 ns/op	   48112 B/op	     388 allocs/op}}',
        '{{d|BenchmarkStatusTerminal-11    	412094188	       2.881 ns/op	       0 B/op	       0 allocs/op}}',
        '',
        '{{w|name              old time/op    new time/op    delta}}',
        '{{w|Transition-11}}       {{d|681ns ± 2%}}     {{g|412ns ± 1%}}   {{g|-39.50%}}  {{d|(p=0.008 n=5+5)}}',
        '{{w|OutboxDrain128-11}}  {{d|388µs ± 4%}}     {{g|254µs ± 2%}}   {{g|-34.54%}}  {{d|(p=0.008 n=5+5)}}',
        '',
        '{{w|name              old allocs/op  new allocs/op  delta}}',
        '{{w|Transition-11}}        {{d|7.00 ± 0%}}      {{g|2.00 ± 0%}}   {{g|-71.43%}}',
      ),
    },
    review: {
      cmd: 'gh pr diff 331 --patch | head -26 && gh pr checks 331', ms: 5400,
      out: L(
        '{{w|diff --git a/internal/order/state.go b/internal/order/state.go}}',
        '{{c|@@ -61,18 +61,12 @@ func (o *Order) To(}}',
        '{{r|-	for _, ok := range allowed[o.Status] {}}',
        '{{r|-		if ok != next {}}',
        '{{r|-			continue}}',
        '{{r|-		}}}',
        '{{g|+	if !slices.Contains(allowed[o.Status], next) {}}',
        '{{g|+		return InvalidTransition{From: o.Status, To: next}}}',
        '{{g|+	}}}',
        '',
        '{{w|All checks were successful}}',
        '  {{g|✓}} test (race)       {{d|2m18s}}',
        '  {{g|✓}} test (integration) {{d|4m02s}}  {{d|testcontainers: pg16 + redpanda}}',
        '  {{g|✓}} golangci-lint     {{d|1m11s}}',
        '  {{g|✓}} buf breaking      {{d|14s}}   {{d|no breaking proto changes}}',
        '  {{g|✓}} fuzz (30s)        {{d|32s}}   {{d|0 new interesting inputs}}',
      ),
    },
    deploy: {
      cmd: 'argocd app sync order-svc --prune && argocd app wait order-svc --health', ms: 13800,
      out: L(
        '{{d|TIMESTAMP                  GROUP        KIND   NAMESPACE  NAME         STATUS   HEALTH}}',
        '{{d|2026-09-15T14:44:02+09:00  apps  Deployment     orders  order-svc  }}{{y|OutOfSync}}  {{y|Progressing}}',
        '{{d|2026-09-15T14:44:21+09:00  apps  Deployment     orders  order-svc  }}{{g|Synced}}     {{y|Progressing}}',
        '{{d|2026-09-15T14:44:48+09:00  apps  Deployment     orders  order-svc  }}{{g|Synced}}     {{g|Healthy}}',
        '',
        '{{d|Name:               order-svc}}',
        '{{d|Project:            payments}}',
        '{{d|Revision:           3f9a1c2 (fix(order): reject transitions not in the allowed set)}}',
        '{{d|Sync Policy:        Automated (prune, self-heal)}}',
        '{{g|Sync Status:        Synced to 3f9a1c2}}',
        '{{g|Health Status:      Healthy}}',
        '',
        '{{g|✓ canary 10% → 50% → 100% · rollout analysis passed (error-rate 0.01%, p99 41ms)}}',
      ),
    },
    migrate: {
      cmd: 'make migrate && sqlc generate && buf generate', ms: 7800,
      out: L(
        '{{d|migrate -path internal/store/migrations -database postgres://***@localhost:5432/orders up}}',
        '{{g|14/u}} add_outbox_table {{d|(41.2ms)}}',
        '{{g|15/u}} add_order_version_idx {{d|(188.4ms)}}',
        '',
        '{{d|sqlc generate}}',
        '{{g|✓}} internal/store/queries.sql.go {{d|(24 queries, 8 models)}}',
        '',
        '{{d|buf generate}}',
        '{{g|✓}} api/order/v1/order.pb.go',
        '{{g|✓}} api/order/v1/order_grpc.pb.go',
        '{{g|✓}} api/order/v1/order.pb.validate.go',
        '{{d|buf breaking --against \'.git#branch=main\' → }}{{g|no breaking changes}}',
      ),
    },
    grepTarget: 'func \\(o \\*Order\\) To|allowed\\[',
  },
  probs: [
    { sev: 'e', file: 'internal/order/state.go', line: 78, col: 3, msg: 'unreachable code', src: 'go vet' },
    { sev: 'e', file: 'internal/order/service.go', line: 64, col: 9, msg: 'nilness: impossible condition: nil != nil', src: 'go vet' },
    { sev: 'w', file: 'internal/order/repo.go', line: 44, col: 14, msg: 'Error return value of `rows.Close` is not checked', src: 'errcheck' },
  ],
  logtail: [
    '{{gr|$t}} {{g|INFO}}  {{gr|grpc}} order.v1.OrderService/GetOrder        {{g|OK}}  {{d|$msms}}  {{gr|order=o_$h}}',
    '{{gr|$t}} {{g|INFO}}  {{gr|grpc}} order.v1.OrderService/TransitionOrder {{g|OK}}  {{d|$msms}}  {{gr|PAID→PACKING v=$n}}',
    '{{gr|$t}} {{g|INFO}}  {{gr|outbox}} drained batch=128 lag=0 {{d|$msms}}',
    '{{gr|$t}} {{g|INFO}}  {{gr|grpc}} order.v1.OrderService/CreateOrder     {{g|OK}}  {{d|$msms}}  {{gr|total=$n0000 KRW}}',
    '{{gr|$t}} {{y|WARN}}  {{gr|grpc}} order.v1.OrderService/TransitionOrder {{y|Aborted}} {{d|$msms}} {{gr|version conflict}}',
    '{{gr|$t}} {{g|INFO}}  {{gr|store}} pg acquire=0.$ams inuse=$n/20 idle=$n',
    '{{gr|$t}} {{g|INFO}}  {{gr|kafka}} produced order.events.v1 partition=$a offset=$n41208',
  ],
};

/* ════════════════════════════════════════════════════════════════════════
   스택 4 — Rust · Tokio  (edge-router)
   ════════════════════════════════════════════════════════════════════════ */
const rust = {
  id: 'rust',
  label: 'Rust · Tokio Edge',
  icon: '◆',
  hint: 'cargo · tokio · axum · tower · criterion · clippy -D warnings. An edge router doing rate limiting and request shedding.',
  lang: 'rust', langLabel: 'Rust',
  repo: 'edge-router', org: 'leafmeta',
  root: '~/dev/edge-router',
  pkg: 'cargo',
  terms: ['zsh', 'cargo watch -x run', 'cargo test', 'RUST_LOG=debug'],
  ext: ['rust-analyzer', 'CodeLLDB', 'Even Better TOML'],
  tree: [
    { d: 'src', open: true, c: [
      { f: 'main.rs' }, { f: 'lib.rs' }, { f: 'config.rs' },
      { d: 'limit', open: true, c: [
        { f: 'mod.rs', git: 'M' }, { f: 'bucket.rs', git: 'M' },
        { f: 'shed.rs', git: 'U' }, { f: 'key.rs' },
      ] },
      { d: 'proxy', c: [{ f: 'mod.rs' }, { f: 'upstream.rs', git: 'M' }, { f: 'retry.rs' }] },
      { d: 'telemetry', c: [{ f: 'mod.rs' }, { f: 'metrics.rs' }] },
    ] },
    { d: 'benches', c: [{ f: 'bucket.rs' }] },
    { d: 'tests', c: [{ f: 'proxy_integration.rs', git: 'M' }] },
    { f: 'Cargo.toml' }, { f: 'Cargo.lock' }, { f: 'rust-toolchain.toml' }, { f: 'clippy.toml' },
  ],
  topic: {
    title: 'Return Retry-After on rate-limit rejections',
    unit: 'the limiter',
    criteria: 'a bare 429 is not actionable',
    implicit: 'a rejected caller learns nothing about when to come back and retries immediately',
    explicit: 'compute the wait from the refill rate and hand it back with the rejection',
    done: 'Rejections now carry the exact wait time, so clients back off instead of hammering.',
    peer: 'retry-after computed from the refill rate rather than a constant. that is the detail i would have skipped',
    hover: 'Takes n tokens, or returns the duration until they are available. Lock-free: one CAS per call.',
    symbol: 'Bucket::take',
  },
  files: {
    impl: {
      path: 'src/limit/bucket.rs', lang: 'rust',
      code: `use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{Duration, Instant};

use crate::limit::key::Key;

/// Lock-free token bucket. Refill is computed lazily from the elapsed time on
/// read, so there is no background timer task per key.
///
/// State is packed into a single u64 so the whole bucket updates with one CAS:
///   bits 0..40  -> tokens, in micro-tokens (1 token = 1_000_000)
///   bits 40..64 -> last refill, in milliseconds since epoch_start
#[derive(Debug)]
pub struct Bucket {
    state: AtomicU64,
    capacity: u64,
    refill_per_ms: u64,
    epoch_start: Instant,
}

const MICRO: u64 = 1_000_000;
const TOKEN_BITS: u32 = 40;
const TOKEN_MASK: u64 = (1 << TOKEN_BITS) - 1;

impl Bucket {
    pub fn new(capacity: u32, per: Duration) -> Self {
        let capacity = u64::from(capacity) * MICRO;
        let refill_per_ms = capacity / per.as_millis().max(1) as u64;
        Self {
            state: AtomicU64::new(capacity),
            capacity,
            refill_per_ms,
            epoch_start: Instant::now(),
        }
    }

    /// Try to take n tokens. Returns the wait time when the bucket is dry so
    /// the caller can emit a Retry-After instead of a bare 429.
    pub fn take(&self, n: u32) -> Result<(), Duration> {
        let want = u64::from(n) * MICRO;
        let now_ms = self.epoch_start.elapsed().as_millis() as u64;

        loop {
            let prev = self.state.load(Ordering::Acquire);
            let (tokens, last_ms) = unpack(prev);

            let refilled = (now_ms.saturating_sub(last_ms)) * self.refill_per_ms;
            let available = (tokens + refilled).min(self.capacity);

            if available < want {
                let short = want - available;
                return Err(Duration::from_millis(short.div_ceil(self.refill_per_ms.max(1))));
            }

            let next = pack(available - want, now_ms);
            match self
                .state
                .compare_exchange_weak(prev, next, Ordering::AcqRel, Ordering::Acquire)
            {
                Ok(_) => return Ok(()),
                Err(_) => std::hint::spin_loop(),
            }
        }
    }

    pub fn tokens(&self) -> f64 {
        let (t, _) = unpack(self.state.load(Ordering::Relaxed));
        t as f64 / MICRO as f64
    }
}

#[inline]
fn unpack(v: u64) -> (u64, u64) {
    (v & TOKEN_MASK, v >> TOKEN_BITS)
}

#[inline]
fn pack(tokens: u64, ms: u64) -> u64 {
    (tokens & TOKEN_MASK) | (ms << TOKEN_BITS)
}`,
    },
    types: {
      path: 'src/limit/shed.rs', lang: 'rust',
      code: `use std::sync::Arc;
use std::task::{Context, Poll};

use tokio::sync::Semaphore;
use tower::{Layer, Service};
use tracing::warn;

/// Concurrency shedder. When in-flight requests exceed the limit we reject
/// immediately with 503 rather than queueing, because a queue behind a
/// saturated upstream only converts errors into timeouts.
#[derive(Clone)]
pub struct Shed<S> {
    inner: S,
    permits: Arc<Semaphore>,
    limit: usize,
}

#[derive(Clone, Copy)]
pub struct ShedLayer {
    pub limit: usize,
}

impl<S> Layer<S> for ShedLayer {
    type Service = Shed<S>;

    fn layer(&self, inner: S) -> Self::Service {
        Shed {
            inner,
            permits: Arc::new(Semaphore::new(self.limit)),
            limit: self.limit,
        }
    }
}

impl<S, R> Service<R> for Shed<S>
where
    S: Service<R> + Clone + Send + 'static,
    S::Future: Send + 'static,
    R: Send + 'static,
{
    type Response = S::Response;
    type Error = ShedError<S::Error>;
    type Future = ShedFuture<S, R>;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx).map_err(ShedError::Inner)
    }

    fn call(&mut self, req: R) -> Self::Future {
        match self.permits.clone().try_acquire_owned() {
            Ok(permit) => ShedFuture::pass(self.inner.clone(), req, permit),
            Err(_) => {
                warn!(limit = self.limit, "shedding request: concurrency limit reached");
                metrics::counter!("edge_shed_total").increment(1);
                ShedFuture::shed()
            }
        }
    }
}`,
    },
    test: {
      path: 'tests/proxy_integration.rs', lang: 'rust',
      code: `use std::time::Duration;

use edge_router::limit::{Bucket, ShedLayer};
use edge_router::test_support::{spawn_router, upstream_that, Reply};
use tokio::time::{advance, pause};

#[tokio::test(start_paused = true)]
async fn bucket_refills_at_the_configured_rate() {
    let bucket = Bucket::new(10, Duration::from_secs(1));

    for _ in 0..10 {
        bucket.take(1).expect("first ten should pass");
    }

    let wait = bucket.take(1).expect_err("eleventh must be rejected");
    assert!(wait <= Duration::from_millis(100), "retry-after was {wait:?}");

    advance(Duration::from_millis(500)).await;
    assert_eq!(bucket.tokens().round() as u32, 5);
    bucket.take(5).expect("half a second buys five tokens");
}

#[tokio::test]
async fn sheds_instead_of_queueing_when_upstream_stalls() {
    let upstream = upstream_that(Reply::Delay(Duration::from_secs(30)));
    let router = spawn_router(upstream, ShedLayer { limit: 8 }).await;

    let mut inflight = Vec::new();
    for _ in 0..8 {
        inflight.push(tokio::spawn(router.get("/v1/orders")));
    }
    tokio::time::sleep(Duration::from_millis(50)).await;

    let shed = router.get("/v1/orders").await;
    assert_eq!(shed.status(), 503);
    assert_eq!(shed.headers()["retry-after"], "1");
    assert!(shed.elapsed() < Duration::from_millis(20), "shed must be immediate");
}

#[tokio::test]
async fn concurrent_takes_never_oversubscribe() {
    let bucket = std::sync::Arc::new(Bucket::new(1_000, Duration::from_secs(60)));
    let mut set = tokio::task::JoinSet::new();

    for _ in 0..64 {
        let b = bucket.clone();
        set.spawn(async move { (0..100).filter(|_| b.take(1).is_ok()).count() });
    }

    let granted: usize = set.join_all().await.into_iter().sum();
    assert_eq!(granted, 1_000, "6400 racing takes granted {granted}, want exactly 1000");
}`,
    },
    patch: {
      path: 'src/limit/bucket.rs', lang: 'rust',
      code: `            // The old code wrote the refilled total back before subtracting,
            // so two threads landing on the same millisecond each saw a full
            // refill and both were granted. Pack the post-take value in the
            // same CAS as the timestamp. EDGE-771.
            let next = pack(available - want, now_ms);
            match self.state.compare_exchange_weak(prev, next, Ordering::AcqRel, Ordering::Acquire) {
                Ok(_) => return Ok(()),
                Err(_) => std::hint::spin_loop(),
            }`,
    },
    infra: {
      path: 'Cargo.toml', lang: 'toml',
      code: `[package]
name = "edge-router"
version = "0.9.2"
edition = "2021"
rust-version = "1.84"

[dependencies]
axum = { version = "0.8", features = ["http2", "macros"] }
tokio = { version = "1.42", features = ["full"] }
tower = { version = "0.5", features = ["limit", "load-shed", "timeout"] }
tower-http = { version = "0.6", features = ["trace", "compression-br"] }
hyper-util = { version = "0.1", features = ["client-legacy"] }
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "json"] }
metrics = "0.24"
metrics-exporter-prometheus = "0.16"
serde = { version = "1", features = ["derive"] }
thiserror = "2.0"

[dev-dependencies]
criterion = { version = "0.5", features = ["async_tokio"] }
proptest = "1.6"
wiremock = "0.6"

[profile.release]
lto = "fat"
codegen-units = 1
panic = "abort"
strip = "symbols"

[[bench]]
name = "bucket"
harness = false`,
    },
    scaffold: [
      {
        path: 'src/limit/key.rs', lang: 'rust',
        code: `use std::hash::{Hash, Hasher};
use std::net::IpAddr;

use axum::http::{HeaderMap, Request};

/// What a rate limit is counted against. Ordered from most to least specific;
/// the first variant that can be derived from the request wins.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum Key {
    ApiKey(Box<str>),
    Tenant { id: u64, route: &'static str },
    Ip(IpAddr),
    Anonymous,
}

impl Key {
    pub fn from_request<B>(req: &Request<B>, trusted_proxies: &[IpAddr]) -> Self {
        let headers = req.headers();

        if let Some(api_key) = bearer(headers) {
            return Key::ApiKey(api_key.into());
        }
        if let Some(tenant) = headers.get("x-tenant-id").and_then(|v| v.to_str().ok()) {
            if let Ok(id) = tenant.parse::<u64>() {
                return Key::Tenant { id, route: route_of(req) };
            }
        }
        match client_ip(headers, trusted_proxies) {
            Some(ip) => Key::Ip(ip),
            None => Key::Anonymous,
        }
    }

    /// Shard index so the bucket map can be split without a global lock.
    pub fn shard(&self, shards: usize) -> usize {
        let mut h = rustc_hash::FxHasher::default();
        self.hash(&mut h);
        (h.finish() % shards as u64) as usize
    }
}

fn bearer(headers: &HeaderMap) -> Option<&str> {
    headers
        .get("authorization")?
        .to_str()
        .ok()?
        .strip_prefix("Bearer ")
        .filter(|k| k.len() >= 24)
}`,
      },
    ],
  },
  cmd: {
    status: {
      cmd: 'git status --short --branch', ms: 440,
      out: L(
        '{{gr|##}} {{g|fix/EDGE-771-bucket-race}}{{gr|...origin/fix/EDGE-771-bucket-race}}',
        '{{r| M}} src/limit/bucket.rs',
        '{{r| M}} src/limit/mod.rs',
        '{{r| M}} src/proxy/upstream.rs',
        '{{r| M}} tests/proxy_integration.rs',
        '{{r|??}} src/limit/shed.rs',
      ),
    },
    install: {
      cmd: 'cargo fetch --locked', ms: 3100,
      out: L(
        '{{g|    Updating}} crates.io index',
        '{{g| Downloading}} 14 crates, extracting ...',
        '{{d|      tower v0.5.2}}',
        '{{d|      tower-http v0.6.2}}',
        '{{d|      metrics-exporter-prometheus v0.16.0}}',
        '{{d|      proptest v1.6.0}}',
        '{{g|    Finished}} fetched 14 crates (4.1 MB) in 2.8s',
      ),
    },
    dev: {
      cmd: 'RUST_LOG=edge_router=debug cargo watch -x "run --release"', ms: 8200, keep: true,
      out: L(
        '{{d|[Running \'cargo run --release\']}}',
        '{{g|   Compiling}} edge-router v0.9.2 (/Users/leaf/dev/edge-router)',
        '{{g|    Finished}} `release` profile [optimized] target(s) in 22.41s',
        '{{g|     Running}} `target/release/edge-router`',
        '',
        '{{gr|2026-09-15T14:22:04.118Z}} {{g| INFO}} edge_router: starting version=0.9.2 rev=3f9a1c2',
        '{{gr|2026-09-15T14:22:04.119Z}} {{g| INFO}} edge_router::config: loaded 14 routes, 6 upstreams',
        '{{gr|2026-09-15T14:22:04.120Z}} {{c|DEBUG}} edge_router::limit: bucket map shards=64 capacity=100k keys',
        '{{gr|2026-09-15T14:22:04.121Z}} {{g| INFO}} edge_router::telemetry: prometheus on 0.0.0.0:9100/metrics',
        '{{gr|2026-09-15T14:22:04.121Z}} {{g| INFO}} edge_router: listening addr=0.0.0.0:8443 h2=true tls=rustls',
      ),
    },
    test_fail: {
      cmd: 'cargo test --all-features', ms: 11400,
      out: L(
        '{{g|   Compiling}} edge-router v0.9.2 (/Users/leaf/dev/edge-router)',
        '{{g|    Finished}} `test` profile [unoptimized + debuginfo] target(s) in 8.12s',
        '{{g|     Running}} unittests src/lib.rs (target/debug/deps/edge_router-9c4a1f)',
        '',
        '{{d|running 48 tests}}',
        '{{g|test limit::bucket::tests::refill_is_monotonic ... ok}}',
        '{{g|test limit::key::tests::bearer_needs_24_chars ... ok}}',
        '{{r|test limit::bucket::tests::concurrent_takes_never_oversubscribe ... FAILED}}',
        '{{g|test proxy::retry::tests::budget_exhausts ... ok}}',
        '',
        '{{r|failures:}}',
        '',
        '{{r|---- limit::bucket::tests::concurrent_takes_never_oversubscribe stdout ----}}',
        "{{r|thread 'limit::bucket::tests::concurrent_takes_never_oversubscribe' panicked at tests/proxy_integration.rs:57:5:}}",
        '{{r|assertion `left == right` failed: 6400 racing takes granted 1213, want exactly 1000}}',
        '{{r|  left: 1213}}',
        '{{r| right: 1000}}',
        '{{d|note: run with `RUST_BACKTRACE=1` to display a backtrace}}',
        '',
        '{{r|failures:}}',
        '{{r|    limit::bucket::tests::concurrent_takes_never_oversubscribe}}',
        '',
        '{{r|test result: FAILED. 47 passed; 1 failed; 0 ignored; finished in 1.84s}}',
        '{{r|error: test failed, to rerun pass `--lib`}}',
      ),
    },
    test_pass: {
      cmd: 'cargo nextest run --all-features', ms: 9800,
      out: L(
        '{{g|    Finished}} `test` profile [unoptimized + debuginfo] target(s) in 6.41s',
        '{{d|    Starting}} 62 tests across 4 binaries',
        '{{g|        PASS}} {{d|[   0.004s]}} edge-router limit::bucket::refill_is_monotonic',
        '{{g|        PASS}} {{d|[   0.011s]}} edge-router limit::bucket::concurrent_takes_never_oversubscribe',
        '{{g|        PASS}} {{d|[   0.008s]}} edge-router limit::shed::rejects_without_queueing',
        '{{g|        PASS}} {{d|[   0.112s]}} edge-router::proxy_integration sheds_instead_of_queueing_when_upstream_stalls',
        '{{g|        PASS}} {{d|[   0.042s]}} edge-router::proxy_integration bucket_refills_at_the_configured_rate',
        '{{g|        PASS}} {{d|[   0.914s]}} edge-router::proxy_integration retries_idempotent_gets_only',
        '{{d|------------}}',
        '{{g|     Summary}} {{d|[   1.284s]}} {{g|62 tests run: 62 passed, 0 skipped}}',
      ),
    },
    types: {
      cmd: 'cargo check --all-targets --all-features', ms: 7600,
      out: L(
        '{{g|    Checking}} edge-router v0.9.2 (/Users/leaf/dev/edge-router)',
        '{{r|error[E0502]}}: cannot borrow `self.state` as mutable because it is also borrowed as immutable',
        '{{c|  --> src/limit/bucket.rs:61:13}}',
        '{{c|   |}}',
        '{{c|56 |}}             let (tokens, last_ms) = unpack(prev);',
        '{{c|   |}}                                     {{b|-------------}} {{b|immutable borrow occurs here}}',
        '{{c|61 |}}             self.state.store(available, Ordering::Release);',
        '{{c|   |}}             {{r|^^^^^^^^^^^^^^^^}} {{r|mutable borrow occurs here}}',
        '{{c|   |}}',
        '{{d|   = note: consider using `compare_exchange` to update the value atomically}}',
        '',
        '{{r|error: could not compile `edge-router` (lib) due to 1 previous error}}',
      ),
    },
    types_ok: {
      cmd: 'cargo check --all-targets --all-features', ms: 6900,
      out: L(
        '{{g|    Checking}} edge-router v0.9.2 (/Users/leaf/dev/edge-router)',
        '{{g|    Finished}} `dev` profile [unoptimized + debuginfo] target(s) in 6.2s',
      ),
    },
    lint: {
      cmd: 'cargo clippy --all-targets -- -D warnings', ms: 9200,
      out: L(
        '{{y|warning}}: this loop could be written as a `while let` loop',
        '{{c|  --> src/limit/bucket.rs:52:9}}',
        '{{c|   |}}',
        '{{c|52 |}}         loop {',
        '{{c|   |}}         {{y|^^^^}}',
        '{{d|   = help: for further information visit https://rust-lang.github.io/rust-clippy/master/index.html#while_let_loop}}',
        '',
        '{{y|warning}}: casting `u128` to `u64` may truncate the value',
        '{{c|  --> src/limit/bucket.rs:49:23}}',
        '{{d|   = note: `-D clippy::cast-possible-truncation` implied by `-D warnings`}}',
        '',
        '{{r|error}}: could not compile `edge-router` (lib) due to 2 previous errors',
      ),
    },
    lint_ok: {
      cmd: 'cargo clippy --all-targets -- -D warnings && cargo fmt --check', ms: 8400,
      out: L(
        '{{g|    Finished}} `dev` profile [unoptimized + debuginfo] target(s) in 7.9s',
        '{{d|(clippy clean · 0 warnings · rustfmt: 38 files unchanged)}}',
      ),
    },
    build: {
      cmd: 'cargo build --release --target aarch64-unknown-linux-musl', ms: 16400,
      out: L(
        '{{g|   Compiling}} tokio v1.42.0',
        '{{g|   Compiling}} hyper v1.5.2',
        '{{g|   Compiling}} axum v0.8.1',
        '{{g|   Compiling}} edge-router v0.9.2 (/Users/leaf/dev/edge-router)',
        '{{g|    Finished}} `release` profile [optimized] target(s) in 1m 12s',
        '',
        '{{d|   text	   data	    bss	    dec	    hex	filename}}',
        '{{d|4881204	 118412	  10248	5009864	 4c6bc8	target/aarch64-unknown-linux-musl/release/edge-router}}',
        '',
        '{{g|✓ 4.8MB static binary · lto=fat · panic=abort · 0 dynamic deps}}',
      ),
    },
    diff: {
      cmd: 'git diff --stat', ms: 590,
      out: L(
        ' src/limit/bucket.rs            | 48 {{g|+++++++++++++++++++++++++++++++}}{{r|-----------}}',
        ' src/limit/mod.rs               | 12 {{g|+++++++}}{{r|-----}}',
        ' src/limit/shed.rs              | 88 {{g|++++++++++++++++++++++++++++++++++++++++++++++++++++}}',
        ' src/proxy/upstream.rs          | 19 {{g|+++++++++++++}}{{r|------}}',
        ' tests/proxy_integration.rs     | 41 {{g|+++++++++++++++++++++++++++++}}{{r|--------}}',
        ' {{w|5 files changed, 178 insertions(+), 30 deletions(-)}}',
      ),
    },
    commit: {
      cmd: 'git commit -am "fix(limit): pack the post-take value into the same CAS"', ms: 1100,
      out: L(
        '{{d|cargo fmt................................................................}}{{g|Passed}}',
        '{{d|cargo clippy.............................................................}}{{g|Passed}}',
        '{{d|cargo test --lib.........................................................}}{{g|Passed}}',
        '',
        '{{g|[fix/EDGE-771-bucket-race 9e1f7d4]}} fix(limit): pack the post-take value into the same CAS',
        ' 5 files changed, 178 insertions(+), 30 deletions(-)',
        ' create mode 100644 src/limit/shed.rs',
      ),
    },
    push: {
      cmd: 'git push -u origin HEAD', ms: 2700,
      out: L(
        '{{d|Enumerating objects: 22, done.}}',
        '{{d|Writing objects: 100% (12/12), 4.02 KiB | 4.02 MiB/s, done.}}',
        '{{d|remote: Create a pull request for \'fix/EDGE-771-bucket-race\':}}',
        '{{d|remote: }}     {{c|https://github.com/leafmeta/edge-router/pull/188}}',
        '{{d|To github.com:leafmeta/edge-router.git}}',
        ' {{g|* [new branch]}}      HEAD -> fix/EDGE-771-bucket-race',
      ),
    },
    logs: {
      cmd: 'kubectl logs -n edge ds/edge-router --since 10m | rg "shed|429|over_limit"', ms: 4100,
      out: L(
        '{{gr|14:01:02.418Z}} {{y| WARN}} edge_router::limit: over_limit key=ApiKey(ak_9f12…) granted=1213 capacity=1000',
        '{{gr|14:01:02.418Z}} {{r|ERROR}} edge_router::proxy: upstream 503 orders-api inflight=214 limit=8',
        '{{gr|14:01:47.771Z}} {{y| WARN}} edge_router::limit: over_limit key=ApiKey(ak_9f12…) granted=1188 capacity=1000',
        '{{gr|14:02:11.229Z}} {{y| WARN}} edge_router::limit: bucket_race_suspected shard=41 cas_retries=8812',
        '{{gr|14:04:38.104}} {{r|ERROR}} edge_router::proxy: pool exhausted, queue depth 4118, shedding',
        '{{d|-- 1,412 matching lines · rate limiter is letting ~21% extra traffic through --}}',
        '{{d|-- orders-api p99 climbed 41ms → 2.8s in the same window --}}',
      ),
    },
    repro: {
      cmd: 'oha -z 20s -c 200 --rate 2000 -H "Authorization: Bearer ak_9f12..." https://edge.internal/v1/orders', ms: 6400,
      out: L(
        '{{d|Summary:}}',
        '{{d|  Success rate:}}  {{y|79.14%}}',
        '{{d|  Total:}}         20.0012 secs',
        '{{d|  Requests/sec:}}  {{w|1,998.4}}',
        '',
        '{{d|Status code distribution:}}',
        '  {{g|[200]}} 31,628 responses',
        '  {{y|[429]}}  6,914 responses',
        '  {{r|[503]}}  1,426 responses',
        '',
        '{{d|Latency distribution:}}',
        '{{d|  50.00% in 0.0041 secs}}',
        '{{d|  99.00% in 0.2814 secs}}',
        '{{d|  99.90% in 2.8412 secs}}',
        '',
        '{{r|↑ configured limit is 1000/s but 1,581/s got through — the bucket leaks under contention}}',
      ),
    },
    cov: {
      cmd: 'cargo llvm-cov nextest --all-features --summary-only', ms: 13200,
      out: L(
        '{{d|    Finished report saved to target/llvm-cov/html}}',
        '{{d|Filename                      Regions    Missed  Cover   Lines  Missed  Cover}}',
        '{{d|-----------------------------------------------------------------------------}}',
        '{{d|src/limit/bucket.rs}}              {{d|88}}         {{g|0}} {{g|100.00%}}    {{d|112}}      {{g|0}} {{g|100.00%}}',
        '{{d|src/limit/shed.rs}}                {{d|64}}         {{g|2}}  {{g|96.88%}}     {{d|88}}      {{g|3}}  {{g|96.59%}}',
        '{{d|src/limit/key.rs}}                 {{d|41}}         {{g|1}}  {{g|97.56%}}     {{d|62}}      {{g|1}}  {{g|98.39%}}',
        '{{d|src/proxy/upstream.rs}}           {{d|118}}        {{y|14}}  {{y|88.14%}}    {{d|204}}     {{y|21}}  {{y|89.71%}}',
        '{{d|-----------------------------------------------------------------------------}}',
        '{{w|TOTAL}}                          {{d|611}}        {{d|38}}  {{g|93.78%}}    {{d|984}}     {{d|61}}  {{g|93.80%}}',
        '',
        '{{g|✓ gate 90% · +7.1pp on src/limit}}',
      ),
    },
    sec: {
      cmd: 'cargo audit && cargo deny check', ms: 6100,
      out: L(
        '{{d|    Fetching advisory database from `https://github.com/RustSec/advisory-db.git`}}',
        '{{d|      Loaded 741 security advisories}}',
        '{{d|    Scanning Cargo.lock for vulnerabilities (412 crate dependencies)}}',
        '{{g|     Success No vulnerable packages found}}',
        '',
        '{{d|advisories ok, bans ok, licenses ok, sources ok}}',
        '{{y|warning[unmaintained]}}: crate `instant` is unmaintained',
        '{{d|   ├╴ instant 0.1.13 ← parking_lot_core 0.9.10 ← dashmap 6.1.0}}',
        '{{d|   ╰╴ severity: informational}}',
        '',
        '{{g|✓ 0 vulnerabilities · 1 informational · all licenses allowed (MIT/Apache-2.0)}}',
      ),
    },
    bench: {
      cmd: 'cargo bench --bench bucket -- --save-baseline after', ms: 15200,
      out: L(
        '{{g|    Finished}} `bench` profile [optimized] target(s) in 24.11s',
        '{{g|     Running}} benches/bucket.rs (target/release/deps/bucket-4a91c2)',
        '',
        '{{w|bucket/take/uncontended}}',
        '{{d|                        time:   [}}{{g|18.412 ns 18.601 ns 18.842 ns}}{{d|]}}',
        '{{d|                        change: [}}{{g|-41.28% -40.11% -38.94%}}{{d|] (p = 0.00 < 0.05)}}',
        '{{g|                        Performance has improved.}}',
        '',
        '{{w|bucket/take/16-threads}}',
        '{{d|                        time:   [}}{{g|141.02 ns 144.18 ns 148.41 ns}}{{d|]}}',
        '{{d|                        change: [}}{{g|-62.11% -61.04% -59.88%}}{{d|] (p = 0.00 < 0.05)}}',
        '{{g|                        Performance has improved.}}',
        '',
        '{{w|bucket/take/64-threads}}',
        '{{d|                        time:   [}}{{g|418.22 ns 428.91 ns 441.08 ns}}{{d|]}}',
        '{{d|                        change: [}}{{g|-71.42% -70.18% -68.91%}}{{d|] (p = 0.00 < 0.05)}}',
        '{{g|                        Performance has improved.}}',
        '',
        '{{d|Gnuplot not found, using plotters backend}}',
      ),
    },
    review: {
      cmd: 'gh pr diff 188 --patch | head -24 && gh pr checks 188', ms: 5000,
      out: L(
        '{{w|diff --git a/src/limit/bucket.rs b/src/limit/bucket.rs}}',
        '{{c|@@ -55,12 +58,14 @@ impl Bucket {}}',
        '{{r|-            self.state.store(available, Ordering::Release);}}',
        '{{r|-            if available < want { return Err(..) }}}',
        '{{g|+            let next = pack(available - want, now_ms);}}',
        '{{g|+            match self.state.compare_exchange_weak(prev, next, AcqRel, Acquire) {}}',
        '{{g|+                Ok(_) => return Ok(()),}}',
        '{{g|+                Err(_) => std::hint::spin_loop(),}}',
        '{{g|+            }}}',
        '',
        '{{w|All checks were successful}}',
        '  {{g|✓}} test (stable)     {{d|3m14s}}',
        '  {{g|✓}} test (nightly)    {{d|3m41s}}',
        '  {{g|✓}} clippy -D warnings {{d|1m52s}}',
        '  {{g|✓}} miri (limit)      {{d|6m08s}}  {{d|no UB detected}}',
        '  {{g|✓}} loom (bucket)     {{d|4m22s}}  {{d|18,412 interleavings explored}}',
        '  {{g|✓}} bench-regression  {{d|5m11s}}  {{d|-70% p50, no regressions}}',
      ),
    },
    deploy: {
      cmd: 'kubectl -n edge rollout restart ds/edge-router && kubectl -n edge rollout status ds/edge-router', ms: 14100,
      out: L(
        '{{d|daemonset.apps/edge-router restarted}}',
        '{{d|Waiting for daemon set "edge-router" rollout to finish: 0 out of 18 new pods have been updated...}}',
        '{{d|Waiting for daemon set "edge-router" rollout to finish: 4 out of 18 new pods have been updated...}}',
        '{{d|Waiting for daemon set "edge-router" rollout to finish: 11 out of 18 new pods have been updated...}}',
        '{{d|Waiting for daemon set "edge-router" rollout to finish: 17 of 18 updated pods are available...}}',
        '{{g|daemon set "edge-router" successfully rolled out}}',
        '',
        '{{d|$ curl -s edge.internal:9100/metrics | rg edge_over_limit_total}}',
        '{{d|edge_over_limit_total{shard="all"} }}{{g|0}}',
        '{{d|$ curl -s edge.internal:9100/metrics | rg edge_shed_total}}',
        '{{d|edge_shed_total{reason="concurrency"} }}{{g|14}}   {{d|(was 1,426)}}',
        '{{g|✓ rate limiter now holds at 1,000/s ±0.4% · upstream p99 back to 38ms}}',
      ),
    },
    migrate: {
      cmd: 'cargo run --bin config-migrate -- --from v1 --to v2 config/routes.yaml', ms: 5400,
      out: L(
        '{{g|    Finished}} `dev` profile target(s) in 2.1s',
        '{{d|reading config/routes.yaml (schema v1, 14 routes)}}',
        '{{g|  ✓}} /v1/orders        limit: 1000/s  → { capacity: 1000, per: 1s, burst: 200 }',
        '{{g|  ✓}} /v1/transfers     limit: 200/s   → { capacity: 200, per: 1s, burst: 40 }',
        '{{g|  ✓}} /v1/checkout      limit: 500/s   → { capacity: 500, per: 1s, burst: 100 }',
        '{{y|  !}} /v1/legacy/*      no limit       → { capacity: 50, per: 1s } {{d|(default applied)}}',
        '{{g|✓ wrote config/routes.v2.yaml · 14 routes migrated, 1 default applied}}',
        '{{d|  validate: }}{{g|ok}}{{d| · diff reviewed by schema v2 validator}}',
      ),
    },
    grepTarget: 'compare_exchange|fn take',
  },
  probs: [
    { sev: 'e', file: 'src/limit/bucket.rs', line: 61, col: 13, msg: 'cannot borrow `self.state` as mutable because it is also borrowed as immutable', src: 'rustc(E0502)' },
    { sev: 'w', file: 'src/limit/bucket.rs', line: 49, col: 23, msg: 'casting `u128` to `u64` may truncate the value', src: 'clippy::cast_possible_truncation' },
    { sev: 'w', file: 'src/limit/bucket.rs', line: 52, col: 9, msg: 'this loop could be written as a `while let` loop', src: 'clippy::while_let_loop' },
  ],
  logtail: [
    '{{gr|$t}} {{g|INFO}}  {{gr|proxy}} {{c|GET}}  /v1/orders    {{g|200}} {{d|$msms}} {{gr|up=orders-api key=ApiKey(ak_$h)}}',
    '{{gr|$t}} {{c|DEBUG}} {{gr|limit}} take shard=$a tokens=$n.4 retry_cas=0 {{d|$ams}}',
    '{{gr|$t}} {{g|INFO}}  {{gr|proxy}} {{c|POST}} /v1/transfers {{g|200}} {{d|$msms}} {{gr|up=ledger-api h2=true}}',
    '{{gr|$t}} {{y|WARN}}  {{gr|limit}} {{c|GET}}  /v1/orders    {{y|429}} {{d|$ams}} {{gr|retry_after=1 key=Ip(10.4.$a.$b)}}',
    '{{gr|$t}} {{g|INFO}}  {{gr|proxy}} {{c|GET}}  /v1/catalog   {{g|200}} {{d|$msms}} {{gr|cache=HIT br=on}}',
    '{{gr|$t}} {{g|INFO}}  {{gr|shed}}  inflight=$n/256 accepted ratio=1.00',
    '{{gr|$t}} {{g|INFO}}  {{gr|tls}}   handshake alpn=h2 resumed=true {{d|$ams}}',
  ],
};

/* ════════════════════════════════════════════════════════════════════════
   스택 5 — SRE · Kubernetes + Terraform  (platform-infra)
   ════════════════════════════════════════════════════════════════════════ */
const infra = {
  id: 'k8s',
  label: 'SRE · K8s + Terraform',
  icon: '⬢',
  hint: 'terraform · kubectl · helm · argocd · promtool. Platform work: node pools, HPA, alert rules, rolling deploys. The most "senior on-call" looking option.',
  lang: 'hcl', langLabel: 'Terraform',
  repo: 'platform-infra', org: 'leafmeta',
  root: '~/dev/platform-infra',
  pkg: 'terraform',
  terms: ['zsh', 'k9s', 'terraform', 'stern payments'],
  ext: ['HashiCorp Terraform', 'Kubernetes', 'YAML'],
  tree: [
    { d: 'live', open: true, c: [
      { d: 'prod-apne2', open: true, c: [
        { f: 'main.tf', git: 'M' }, { f: 'node-pools.tf', git: 'M' },
        { f: 'terraform.tfvars' }, { f: 'backend.tf' },
      ] },
      { d: 'staging-apne2', c: [{ f: 'main.tf' }, { f: 'node-pools.tf' }] },
    ] },
    { d: 'modules', open: true, c: [
      { d: 'eks-nodegroup', c: [{ f: 'main.tf', git: 'M' }, { f: 'variables.tf' }, { f: 'outputs.tf' }] },
      { d: 'alerting', c: [{ f: 'rules.tf' }, { f: 'slo.tf', git: 'U' }] },
    ] },
    { d: 'k8s', open: true, c: [
      { d: 'payments', open: true, c: [
        { f: 'ledger-api.yaml', git: 'M' }, { f: 'hpa.yaml', git: 'M' },
        { f: 'pdb.yaml' }, { f: 'servicemonitor.yaml' },
      ] },
      { d: 'observability', c: [{ f: 'alerts.yaml', git: 'U' }, { f: 'grafana-dashboards.yaml' }] },
    ] },
    { f: 'Makefile' }, { f: '.terraform-version' }, { f: 'atlantis.yaml' }, { f: 'README.md' },
  ],
  topic: {
    title: 'Add burn-rate alerts for the payments SLO',
    unit: 'the alerting module',
    criteria: 'fast burn pages, slow burn opens a ticket',
    implicit: 'every threshold breach pages, so the on-call learns to ignore the pager',
    explicit: 'alert on multi-window burn rate and route slow burn to a ticket instead of a page',
    done: 'Alerts now fire on burn rate across two windows, so only budget-threatening breaches page.',
    peer: 'multi-window burn rate instead of static thresholds. the pager might actually mean something now',
    hover: 'One PrometheusRule per SLO and burn-rate tier. Fast burn is critical; slow burn opens a ticket.',
    symbol: 'locals.slos',
  },
  files: {
    impl: {
      path: 'k8s/payments/hpa.yaml', lang: 'yaml',
      code: `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ledger-api
  namespace: payments
  annotations:
    # CPU alone lags by ~90s on this workload; the queue depth metric reacts
    # in one scrape interval. Keep CPU as a floor, not the primary signal.
    owner: platform-sre
    runbook: https://runbooks.leafmeta.io/payments/ledger-api-scaling
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ledger-api
  minReplicas: 6
  maxReplicas: 48
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Pods
      pods:
        metric:
          name: ledger_pending_transfers
        target:
          type: AverageValue
          averageValue: "40"
    - type: External
      external:
        metric:
          name: sqs_approximate_age_of_oldest_message
          selector:
            matchLabels:
              queue: ledger-settlement
        target:
          type: Value
          value: "30"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 30
      policies:
        - type: Percent
          value: 100
          periodSeconds: 30
        - type: Pods
          value: 8
          periodSeconds: 30
      selectPolicy: Max
    scaleDown:
      stabilizationWindowSeconds: 600
      policies:
        - type: Pods
          value: 2
          periodSeconds: 120`,
    },
    types: {
      path: 'modules/alerting/slo.tf', lang: 'hcl',
      code: `locals {
  # Multi-window multi-burn-rate alerting, per the Google SRE workbook.
  # Fast burn pages, slow burn opens a ticket. Nothing else pages.
  slos = {
    ledger_availability = {
      objective  = 0.999
      window     = "30d"
      sli_good   = "sum(rate(http_requests_total{job=\\"ledger-api\\",code!~\\"5..\\"}[%s]))"
      sli_total  = "sum(rate(http_requests_total{job=\\"ledger-api\\"}[%s]))"
      page_after = "2m"
    }
    ledger_latency = {
      objective  = 0.99
      window     = "30d"
      sli_good   = "sum(rate(http_request_duration_seconds_bucket{job=\\"ledger-api\\",le=\\"0.3\\"}[%s]))"
      sli_total  = "sum(rate(http_request_duration_seconds_count{job=\\"ledger-api\\"}[%s]))"
      page_after = "5m"
    }
  }

  burn_rates = {
    fast = { long = "1h", short = "5m", factor = 14.4, severity = "critical" }
    mid  = { long = "6h", short = "30m", factor = 6, severity = "critical" }
    slow = { long = "3d", short = "6h", factor = 1, severity = "ticket" }
  }
}

resource "kubernetes_manifest" "slo_burn_alerts" {
  for_each = {
    for pair in setproduct(keys(local.slos), keys(local.burn_rates)) :
    "\${pair[0]}-\${pair[1]}" => {
      slo  = local.slos[pair[0]]
      name = pair[0]
      burn = local.burn_rates[pair[1]]
      tier = pair[1]
    }
  }

  manifest = {
    apiVersion = "monitoring.coreos.com/v1"
    kind       = "PrometheusRule"
    metadata = {
      name      = "slo-\${each.key}"
      namespace = "observability"
      labels    = { slo = each.value.name, tier = each.value.tier }
    }
    spec = {
      groups = [{
        name     = "slo.\${each.key}"
        interval = "30s"
        rules = [{
          alert = "SLOBurn\${title(each.value.name)}\${title(each.value.tier)}"
          expr  = format(
            "(1 - (%s / %s)) > %f",
            format(each.value.slo.sli_good, each.value.burn.long),
            format(each.value.slo.sli_total, each.value.burn.long),
            (1 - each.value.slo.objective) * each.value.burn.factor,
          )
          for    = each.value.slo.page_after
          labels = { severity = each.value.burn.severity, team = "payments" }
          annotations = {
            summary  = "\${each.value.name} burning error budget \${each.value.burn.factor}x"
            runbook  = "https://runbooks.leafmeta.io/slo/\${each.value.name}"
          }
        }]
      }]
    }
  }
}`,
    },
    test: {
      path: 'k8s/observability/alerts.yaml', lang: 'yaml',
      code: `# promtool test rules k8s/observability/alerts_test.yaml
rule_files:
  - alerts.yaml

evaluation_interval: 30s

tests:
  - interval: 30s
    name: fast burn pages within two minutes
    input_series:
      - series: 'http_requests_total{job="ledger-api",code="200"}'
        values: "0+90x120"
      - series: 'http_requests_total{job="ledger-api",code="500"}'
        values: "0+10x120"
    alert_rule_test:
      - eval_time: 1m
        alertname: SLOBurnLedgerAvailabilityFast
        exp_alerts: []
      - eval_time: 5m
        alertname: SLOBurnLedgerAvailabilityFast
        exp_alerts:
          - exp_labels:
              severity: critical
              team: payments
            exp_annotations:
              summary: ledger_availability burning error budget 14.4x

  - interval: 30s
    name: a single bad scrape does not page
    input_series:
      - series: 'http_requests_total{job="ledger-api",code="200"}'
        values: "0+100x40 4000+0x2 4000+100x60"
      - series: 'http_requests_total{job="ledger-api",code="500"}'
        values: "0+0x40 0+50x2 100+0x60"
    alert_rule_test:
      - eval_time: 30m
        alertname: SLOBurnLedgerAvailabilityFast
        exp_alerts: []

  - interval: 1m
    name: pod crashloop pages once per pod, not per restart
    input_series:
      - series: 'kube_pod_container_status_restarts_total{namespace="payments",pod="ledger-api-7d9f-2xk4p"}'
        values: "0 1 2 3 4 5 6 7 8"
    alert_rule_test:
      - eval_time: 8m
        alertname: PodCrashLooping
        exp_alerts:
          - exp_labels:
              severity: critical
              namespace: payments
              pod: ledger-api-7d9f-2xk4p`,
    },
    patch: {
      path: 'live/prod-apne2/node-pools.tf', lang: 'hcl',
      code: `module "payments_pool" {
  source = "../../modules/eks-nodegroup"

  # The pool was pinned to a single AZ, so the 14:02 apne2-az1 event took out
  # 6 of 6 ledger-api pods at once and the PDB could not help. Spread the pool
  # and make the topology constraint hard, not preferred. INFRA-4102.
  cluster_name  = local.cluster_name
  name          = "payments-c7i"
  subnet_ids    = local.private_subnet_ids # all three AZs
  instance_types = ["c7i.2xlarge", "c7i.4xlarge"]
  capacity_type = "ON_DEMAND"

  min_size     = 6
  desired_size = 9
  max_size     = 48

  topology_spread = {
    max_skew           = 1
    topology_key       = "topology.kubernetes.io/zone"
    when_unsatisfiable = "DoNotSchedule"
  }

  labels = { workload = "payments", tier = "critical" }
  taints = [{ key = "workload", value = "payments", effect = "NO_SCHEDULE" }]
}`,
    },
    infra: {
      path: 'k8s/payments/ledger-api.yaml', lang: 'yaml',
      code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ledger-api
  namespace: payments
  labels: { app: ledger-api, tier: critical }
spec:
  replicas: 6
  revisionHistoryLimit: 5
  strategy:
    type: RollingUpdate
    rollingUpdate: { maxSurge: 3, maxUnavailable: 0 }
  selector:
    matchLabels: { app: ledger-api }
  template:
    metadata:
      labels: { app: ledger-api, tier: critical }
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9100"
    spec:
      serviceAccountName: ledger-api
      terminationGracePeriodSeconds: 45
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels: { app: ledger-api }
      containers:
        - name: api
          image: ghcr.io/leafmeta/ledger-api:3f9a1c2
          ports:
            - { name: http, containerPort: 8000 }
            - { name: metrics, containerPort: 9100 }
          resources:
            requests: { cpu: "500m", memory: 512Mi }
            limits: { memory: 1Gi }
          readinessProbe:
            httpGet: { path: /health/ready, port: http }
            periodSeconds: 2
            failureThreshold: 3
          livenessProbe:
            httpGet: { path: /health/live, port: http }
            periodSeconds: 10
            failureThreshold: 6
          lifecycle:
            preStop:
              exec: { command: ["sleep", "15"] }
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            runAsNonRoot: true
            capabilities: { drop: ["ALL"] }`,
    },
    scaffold: [
      {
        path: 'modules/eks-nodegroup/main.tf', lang: 'hcl',
        code: `terraform {
  required_version = ">= 1.10"
  required_providers {
    aws        = { source = "hashicorp/aws", version = "~> 5.82" }
    kubernetes = { source = "hashicorp/kubernetes", version = "~> 2.35" }
  }
}

resource "aws_launch_template" "this" {
  name_prefix   = "\${var.cluster_name}-\${var.name}-"
  instance_type = var.instance_types[0]

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required" # IMDSv2 only
    http_put_response_hop_limit = 1
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 100
      volume_type           = "gp3"
      iops                  = 3000
      throughput            = 125
      encrypted             = true
      delete_on_termination = true
    }
  }

  monitoring { enabled = true }

  tag_specifications {
    resource_type = "instance"
    tags          = merge(var.tags, { Name = "\${var.cluster_name}-\${var.name}" })
  }

  lifecycle { create_before_destroy = true }
}

resource "aws_eks_node_group" "this" {
  cluster_name    = var.cluster_name
  node_group_name = var.name
  node_role_arn   = aws_iam_role.node.arn
  subnet_ids      = var.subnet_ids
  capacity_type   = var.capacity_type

  scaling_config {
    min_size     = var.min_size
    desired_size = var.desired_size
    max_size     = var.max_size
  }

  update_config { max_unavailable_percentage = 25 }

  launch_template {
    id      = aws_launch_template.this.id
    version = aws_launch_template.this.latest_version
  }

  labels = var.labels

  dynamic "taint" {
    for_each = var.taints
    content {
      key    = taint.value.key
      value  = taint.value.value
      effect = taint.value.effect
    }
  }

  lifecycle { ignore_changes = [scaling_config[0].desired_size] }
}`,
      },
    ],
  },
  cmd: {
    status: {
      cmd: 'git status --short --branch', ms: 470,
      out: L(
        '{{gr|##}} {{g|fix/INFRA-4102-az-spread}}{{gr|...origin/fix/INFRA-4102-az-spread}}',
        '{{r| M}} k8s/payments/hpa.yaml',
        '{{r| M}} k8s/payments/ledger-api.yaml',
        '{{r| M}} live/prod-apne2/node-pools.tf',
        '{{r| M}} modules/eks-nodegroup/main.tf',
        '{{r|??}} modules/alerting/slo.tf',
      ),
    },
    install: {
      cmd: 'terraform init -upgrade', ms: 5200,
      out: L(
        '{{d|Initializing the backend...}}',
        '{{d|Initializing modules...}}',
        '{{d|- payments_pool in ../../modules/eks-nodegroup}}',
        '{{d|- alerting in ../../modules/alerting}}',
        '{{d|Initializing provider plugins...}}',
        '{{d|- Finding hashicorp/aws versions matching "~> 5.82"...}}',
        '{{d|- Installing hashicorp/aws v5.82.2...}}',
        '{{d|- Installed hashicorp/aws v5.82.2 (signed by HashiCorp)}}',
        '{{d|- Installing hashicorp/kubernetes v2.35.1...}}',
        '',
        '{{g|Terraform has been successfully initialized!}}',
      ),
    },
    dev: {
      cmd: 'k9s -n payments', ms: 3200, keep: true,
      out: L(
        '{{d| Context: prod-apne2    <0> all       <a> Attach     <ctrl-d> Delete}}',
        '{{d| Cluster: eks-prod      <1> payments  <l> Logs       <d> Describe}}',
        '{{d| K9s Rev: v0.32.7                                                 }}',
        '{{gr|┌──────────────────────── Pods(payments)[9] ────────────────────────┐}}',
        '{{gr|│}} {{w|NAME}}                        {{w|READY}}  {{w|STATUS}}   {{w|RESTARTS}}  {{w|CPU}}  {{w|MEM}}  {{w|AGE}} {{gr|│}}',
        '{{gr|│}} ledger-api-7d9f4b8c6-2xk4p  {{g|1/1}}    {{g|Running}}  0         412  588  12m {{gr|│}}',
        '{{gr|│}} ledger-api-7d9f4b8c6-9lm2w  {{g|1/1}}    {{g|Running}}  0         388  571  12m {{gr|│}}',
        '{{gr|│}} ledger-api-7d9f4b8c6-hb7qz  {{g|1/1}}    {{g|Running}}  0         401  604  11m {{gr|│}}',
        '{{gr|│}} ledger-api-7d9f4b8c6-k4p2x  {{g|1/1}}    {{g|Running}}  0         394  562  11m {{gr|│}}',
        '{{gr|│}} settlement-worker-5b8-qq4t  {{g|1/1}}    {{g|Running}}  0         188  312  4h  {{gr|│}}',
        '{{gr|│}} reconcile-cron-29412-vv8m   {{g|0/1}}    {{d|Completed}} 0         0    0    2m  {{gr|│}}',
        '{{gr|└───────────────────────────────────────────────────────────────────┘}}',
      ),
    },
    test_fail: {
      cmd: 'promtool test rules k8s/observability/alerts_test.yaml && conftest test k8s/ --policy policy/', ms: 6200,
      out: L(
        '{{d|Unit Testing:  k8s/observability/alerts_test.yaml}}',
        '  {{g|SUCCESS}}: fast burn pages within two minutes',
        '  {{g|SUCCESS}}: a single bad scrape does not page',
        '  {{r|FAILED}}: pod crashloop pages once per pod, not per restart',
        '{{r|    alertname: PodCrashLooping, time: 8m,}}',
        '{{r|        exp: [Labels:{severity="critical"} ...], got: [] }}',
        '',
        '{{r|FAIL}} - k8s/payments/ledger-api.yaml - main - Containers must not run as root',
        '{{r|FAIL}} - k8s/payments/ledger-api.yaml - main - topologySpreadConstraints required for tier=critical',
        '{{y|WARN}} - k8s/payments/hpa.yaml - main - scaleDown stabilization below 300s risks flapping',
        '',
        '{{r|3 tests, 0 passed, 1 warning, 2 failures}}',
      ),
    },
    test_pass: {
      cmd: 'promtool test rules k8s/observability/alerts_test.yaml && conftest test k8s/ --policy policy/ && terraform validate', ms: 5800,
      out: L(
        '{{d|Unit Testing:  k8s/observability/alerts_test.yaml}}',
        '  {{g|SUCCESS}}: fast burn pages within two minutes',
        '  {{g|SUCCESS}}: a single bad scrape does not page',
        '  {{g|SUCCESS}}: pod crashloop pages once per pod, not per restart',
        '  {{g|SUCCESS}}: node pool spread across three AZs',
        '',
        '{{g|18 tests, 18 passed, 0 warnings, 0 failures}}',
        '{{g|Success! The configuration is valid.}}',
      ),
    },
    types: {
      cmd: 'terraform plan -out=tfplan', ms: 11800,
      out: L(
        '{{d|module.payments_pool.aws_eks_node_group.this: Refreshing state... [id=eks-prod:payments-c7i]}}',
        '{{d|module.payments_pool.aws_launch_template.this: Refreshing state... [id=lt-04f18a2b]}}',
        '{{d|kubernetes_manifest.hpa: Refreshing state...}}',
        '',
        '{{w|Terraform used the selected providers to generate the following execution plan.}}',
        '{{w|Resource actions are indicated with the following symbols:}}',
        '  {{g|+}} create',
        '  {{y|~}} update in-place',
        '{{y|-}}{{g|/+}} destroy and then create replacement',
        '',
        '{{w|Terraform will perform the following actions:}}',
        '',
        '{{w|  # module.payments_pool.aws_eks_node_group.this will be updated in-place}}',
        '  {{y|~}} resource "aws_eks_node_group" "this" {',
        '        {{d|id}}              = "eks-prod:payments-c7i"',
        '      {{y|~}} {{w|subnet_ids}}      = [',
        '          {{d|  "subnet-0a1b2c3d",}}',
        '          {{g|+ "subnet-0e4f5a6b",}}',
        '          {{g|+ "subnet-0c7d8e9f",}}',
        '        ]',
        '      {{y|~}} {{w|scaling_config}} {',
        '          {{y|~}} min_size     = 6 {{y|->}} 9',
        '        }',
        '    }',
        '',
        '{{w|Plan:}} {{g|4 to add}}, {{y|3 to change}}, {{r|1 to destroy}}.',
        '',
        '{{d|Saved the plan to: tfplan}}',
      ),
    },
    types_ok: {
      cmd: 'terraform validate && tflint --recursive && terraform fmt -check -recursive', ms: 6400,
      out: L(
        '{{g|Success! The configuration is valid.}}',
        '{{d|tflint: 0 issues found in 24 files (aws ruleset v0.34.0)}}',
        '{{d|terraform fmt: all 24 files formatted}}',
      ),
    },
    lint: {
      cmd: 'tflint --recursive && checkov -d . --compact --quiet', ms: 8100,
      out: L(
        '{{y|Warning: Missing version constraint for provider "kubernetes" (terraform_required_providers)}}',
        '{{c|  on live/prod-apne2/main.tf line 14:}}',
        '{{c|  14: provider "kubernetes" {}}',
        '',
        '{{r|Error: "instance_types" is deprecated in favor of a list (aws_eks_node_group_invalid_type)}}',
        '{{c|  on modules/eks-nodegroup/main.tf line 62}}',
        '',
        '{{d|checkov: terraform scan results}}',
        '{{d|Passed checks: 188, Failed checks: 3, Skipped checks: 12}}',
        '{{r|Check: CKV_AWS_341: "Ensure Launch template does not have metadata hop limit > 1"}}',
        '{{r|Check: CKV_K8S_38: "Ensure that Service Account Tokens are only mounted where necessary"}}',
        '{{y|3 failed checks (2 medium, 1 low)}}',
      ),
    },
    lint_ok: {
      cmd: 'tflint --recursive && checkov -d . --compact --quiet', ms: 7400,
      out: L(
        '{{d|tflint: 0 issues found in 24 files}}',
        '{{d|checkov: Passed checks: 203, Failed checks: 0, Skipped checks: 12}}',
        '{{g|✓ policy gate clean}}',
      ),
    },
    build: {
      cmd: 'helm template ledger-api charts/service -f values/prod.yaml | kubeconform -strict -summary', ms: 7200,
      out: L(
        '{{d|Summary: 24 resources found in 1 file}}',
        '  {{g|✓}} Deployment/payments/ledger-api',
        '  {{g|✓}} Service/payments/ledger-api',
        '  {{g|✓}} HorizontalPodAutoscaler/payments/ledger-api',
        '  {{g|✓}} PodDisruptionBudget/payments/ledger-api',
        '  {{g|✓}} ServiceMonitor/payments/ledger-api',
        '  {{g|✓}} NetworkPolicy/payments/ledger-api-egress',
        '  {{g|✓}} ServiceAccount/payments/ledger-api',
        '',
        '{{g|Valid: 24, Invalid: 0, Errors: 0, Skipped: 0}}',
      ),
    },
    diff: {
      cmd: 'git diff --stat', ms: 600,
      out: L(
        ' k8s/payments/hpa.yaml               | 41 {{g|+++++++++++++++++++++++++++++}}{{r|--------}}',
        ' k8s/payments/ledger-api.yaml        | 28 {{g|+++++++++++++++++++++}}{{r|-----}}',
        ' live/prod-apne2/node-pools.tf       | 22 {{g|++++++++++++++++}}{{r|-----}}',
        ' modules/alerting/slo.tf             | 86 {{g|++++++++++++++++++++++++++++++++++++++++++++++++++}}',
        ' modules/eks-nodegroup/main.tf       | 31 {{g|+++++++++++++++++++++++}}{{r|--------}}',
        ' {{w|5 files changed, 165 insertions(+), 43 deletions(-)}}',
      ),
    },
    commit: {
      cmd: 'git commit -am "fix(prod): spread the payments pool across three AZs"', ms: 1200,
      out: L(
        '{{d|terraform fmt............................................................}}{{g|Passed}}',
        '{{d|terraform validate.......................................................}}{{g|Passed}}',
        '{{d|tflint...................................................................}}{{g|Passed}}',
        '{{d|checkov..................................................................}}{{g|Passed}}',
        '',
        '{{g|[fix/INFRA-4102-az-spread 7a2c9d1]}} fix(prod): spread the payments pool across three AZs',
        ' 5 files changed, 165 insertions(+), 43 deletions(-)',
        ' create mode 100644 modules/alerting/slo.tf',
      ),
    },
    push: {
      cmd: 'git push -u origin HEAD', ms: 2800,
      out: L(
        '{{d|Enumerating objects: 26, done.}}',
        '{{d|Writing objects: 100% (14/14), 4.42 KiB | 4.42 MiB/s, done.}}',
        '{{d|remote: }}',
        '{{d|remote: Atlantis will comment a plan on this PR shortly.}}',
        '{{d|remote: }}     {{c|https://github.com/leafmeta/platform-infra/pull/2041}}',
        '{{d|To github.com:leafmeta/platform-infra.git}}',
        ' {{g|* [new branch]}}      HEAD -> fix/INFRA-4102-az-spread',
      ),
    },
    logs: {
      cmd: 'kubectl get events -A --sort-by=.lastTimestamp | tail -18', ms: 3800,
      out: L(
        '{{d|NAMESPACE   LAST SEEN   TYPE      REASON              OBJECT                       MESSAGE}}',
        '{{d|payments}}    {{d|12m}}         {{r|Warning}}   {{r|FailedScheduling}}    {{d|pod/ledger-api-7d9f-pp1k}}     {{r|0/18 nodes available: 3 node(s) had untolerated taint, 15 node(s) didn\'t match pod topology spread}}',
        '{{d|payments}}    {{d|11m}}         {{r|Warning}}   {{r|Unhealthy}}           {{d|pod/ledger-api-7d9f-2xk4p}}    {{r|Readiness probe failed: connection refused}}',
        '{{d|kube-system}}  {{d|11m}}        {{r|Warning}}   {{r|NodeNotReady}}        {{d|node/ip-10-4-11-88}}           {{r|Node ip-10-4-11-88 status is now: NodeNotReady}}',
        '{{d|kube-system}}  {{d|10m}}        {{y|Normal}}    {{y|NodeNotSchedulable}}  {{d|node/ip-10-4-11-88}}           {{y|Node ip-10-4-11-88 status is now: NodeNotSchedulable}}',
        '{{d|payments}}    {{d|10m}}         {{r|Warning}}   {{r|Evicted}}             {{d|pod/ledger-api-7d9f-9lm2w}}    {{r|The node had condition: [DiskPressure]}}',
        '{{d|payments}}    {{d|9m}}          {{r|Warning}}   {{r|PodDisruptionBudget}}  {{d|poddisruptionbudget/ledger-api}} {{r|Cannot evict pod: would violate PDB (0 disruptions allowed)}}',
        '{{d|payments}}    {{d|4m}}          {{y|Normal}}    {{y|ScalingReplicaSet}}   {{d|deployment/ledger-api}}        {{y|Scaled up replica set to 9}}',
        '',
        '{{r|-- all 6 ledger-api pods were on nodes in apne2-az1 · single-AZ node pool --}}',
      ),
    },
    repro: {
      cmd: 'kubectl get pods -n payments -o custom-columns=POD:.metadata.name,NODE:.spec.nodeName,ZONE:.metadata.labels.zone --sort-by=.spec.nodeName', ms: 2400,
      out: L(
        '{{d|POD                          NODE               ZONE}}',
        '{{d|ledger-api-7d9f4b8c6-2xk4p   ip-10-4-11-88}}      {{r|apne2-az1}}',
        '{{d|ledger-api-7d9f4b8c6-9lm2w   ip-10-4-11-88}}      {{r|apne2-az1}}',
        '{{d|ledger-api-7d9f4b8c6-hb7qz   ip-10-4-11-142}}     {{r|apne2-az1}}',
        '{{d|ledger-api-7d9f4b8c6-k4p2x   ip-10-4-11-142}}     {{r|apne2-az1}}',
        '{{d|ledger-api-7d9f4b8c6-pp1kv   ip-10-4-11-201}}     {{r|apne2-az1}}',
        '{{d|ledger-api-7d9f4b8c6-tt8mq   ip-10-4-11-201}}     {{r|apne2-az1}}',
        '',
        '{{r|↑ 6/6 replicas in one availability zone. The PDB was never the problem.}}',
        '{{d|$ aws eks describe-nodegroup --nodegroup-name payments-c7i --query nodegroup.subnets}}',
        '{{r|[ "subnet-0a1b2c3d" ]}}   {{d|← one subnet, one AZ}}',
      ),
    },
    cov: {
      cmd: 'terraform plan -detailed-exitcode && infracost breakdown --path . --format table', ms: 12400,
      out: L(
        '{{g|No changes. Your infrastructure matches the configuration.}}',
        '',
        '{{d|Project: leafmeta/platform-infra (live/prod-apne2)}}',
        '',
        '{{d|  Name                                  Monthly Qty  Unit     Monthly Cost}}',
        '{{d|  module.payments_pool}}',
        '{{d|  └─ aws_eks_node_group.this}}',
        '{{d|     ├─ Instance usage (c7i.2xlarge)}}              {{d|6,570  hours}}      {{w|$2,712.05}}',
        '{{d|     └─ storage (gp3, 100GB x 9)}}                    {{d|900  GB}}            {{w|$72.00}}',
        '{{d|  module.alerting}}                                    {{d|-  -}}               {{d|$0.00}}',
        '',
        '{{d|  OVERALL TOTAL}}                                                     {{w|$2,784.05}}',
        '{{y|  ~ +$928.02/month vs main (3 extra nodes for AZ spread)}}',
        '{{g|  ✓ within the payments platform budget ($3,200/mo)}}',
      ),
    },
    sec: {
      cmd: 'kubescape scan framework nsa --exclude-namespaces kube-system && trivy k8s --report summary cluster', ms: 10200,
      out: L(
        '{{d|[progress] scanning cluster prod-apne2 (18 nodes, 412 workloads)}}',
        '',
        '{{d|CONTROL NAME                            FAILED  ALL   % RISK}}',
        '{{d|Allow privilege escalation}}                  {{g|0}}   {{d|412}}   {{g|0%}}',
        '{{d|Applications credentials in config files}}    {{g|0}}   {{d|412}}   {{g|0%}}',
        '{{d|Host PID/IPC privileges}}                     {{g|0}}   {{d|412}}   {{g|0%}}',
        '{{d|Non-root containers}}                         {{y|4}}   {{d|412}}   {{y|1%}}',
        '{{d|Resource limits}}                            {{y|11}}   {{d|412}}   {{y|3%}}',
        '{{d|Network policies}}                            {{g|2}}   {{d|412}}   {{g|0%}}',
        '',
        '{{w|Framework NSA score: }}{{g|94.1%}} {{d|(prev 88.4%)}}',
        '{{g|✓ 0 critical · 0 high · 17 medium}}',
      ),
    },
    bench: {
      cmd: 'kubectl -n payments run bench --rm -it --image=ghcr.io/leafmeta/oha -- -z 60s -c 400 http://ledger-api:8000/v1/accounts/a_7f1c', ms: 15400,
      out: L(
        '{{d|If you don\'t see a command prompt, try pressing enter.}}',
        '{{d|Summary:}}',
        '{{d|  Success rate:}}  {{g|100.00%}}',
        '{{d|  Requests/sec:}}  {{w|8,412.7}}',
        '',
        '{{d|Latency distribution:}}',
        '{{d|  50.00% in 0.0412 secs}}',
        '{{d|  90.00% in 0.0684 secs}}',
        '{{d|  99.00% in 0.1284 secs}}',
        '{{d|  99.90% in 0.2841 secs}}',
        '',
        '{{d|Pods during the run: 9 → 21 → 9  (HPA reacted in 34s, settled in 11m)}}',
        '{{g|✓ queue-depth metric scaled 3.1x faster than CPU-only (was 94s to first scale-up)}}',
      ),
    },
    review: {
      cmd: 'gh pr view 2041 --comments | head -24', ms: 4400,
      out: L(
        '{{w|Atlantis}} commented:',
        '{{d|Ran Plan for dir: `live/prod-apne2` workspace: `default`}}',
        '',
        '{{g|+ 4 to add}}, {{y|~ 3 to change}}, {{r|- 1 to destroy}}',
        '{{d|  module.payments_pool.aws_eks_node_group.this  }}{{y|~ subnet_ids, scaling_config}}',
        '{{d|  module.alerting.kubernetes_manifest.slo[*]    }}{{g|+ 6 PrometheusRule}}',
        '{{d|  kubernetes_manifest.hpa                       }}{{y|~ metrics, behavior}}',
        '',
        '{{d|To apply: comment }}{{c|atlantis apply -d live/prod-apne2}}',
        '',
        '{{w|All checks were successful}}',
        '  {{g|✓}} terraform-plan    {{d|2m11s}}',
        '  {{g|✓}} tflint            {{d|18s}}',
        '  {{g|✓}} checkov           {{d|41s}}',
        '  {{g|✓}} conftest (opa)    {{d|12s}}',
        '  {{g|✓}} infracost         {{d|32s}}  {{d|+$928.02/mo, within budget}}',
        '  {{g|✓}} promtool          {{d|8s}}',
      ),
    },
    deploy: {
      cmd: 'terraform apply tfplan && kubectl apply -k k8s/payments && kubectl -n payments rollout status deploy/ledger-api', ms: 16800,
      out: L(
        '{{d|module.payments_pool.aws_eks_node_group.this: Modifying... [id=eks-prod:payments-c7i]}}',
        '{{d|module.payments_pool.aws_eks_node_group.this: Still modifying... [1m0s elapsed]}}',
        '{{d|module.payments_pool.aws_eks_node_group.this: Still modifying... [2m10s elapsed]}}',
        '{{g|module.payments_pool.aws_eks_node_group.this: Modifications complete after 2m41s}}',
        '{{g|module.alerting.kubernetes_manifest.slo["ledger_availability-fast"]: Creation complete}}',
        '',
        '{{g|Apply complete! Resources: 4 added, 3 changed, 1 destroyed.}}',
        '',
        '{{d|horizontalpodautoscaler.autoscaling/ledger-api configured}}',
        '{{d|deployment.apps/ledger-api configured}}',
        '{{d|poddisruptionbudget.policy/ledger-api unchanged}}',
        '{{g|deployment "ledger-api" successfully rolled out}}',
        '',
        '{{d|$ kubectl get pods -n payments -o custom-columns=POD:.metadata.name,ZONE:.metadata.labels.zone | sort -k2}}',
        '{{g|  3 pods in apne2-az1 · 3 in apne2-az2 · 3 in apne2-az3}}',
        '{{g|✓ single-AZ failure now costs 33% of capacity, not 100%}}',
      ),
    },
    migrate: {
      cmd: 'terraform state mv module.pool module.payments_pool && terraform import module.payments_pool.aws_launch_template.this lt-04f18a2b', ms: 9200,
      out: L(
        '{{d|Move "module.pool" to "module.payments_pool"}}',
        '{{g|Successfully moved 1 object(s).}}',
        '',
        '{{d|module.payments_pool.aws_launch_template.this: Importing from ID "lt-04f18a2b"...}}',
        '{{d|module.payments_pool.aws_launch_template.this: Import prepared!}}',
        '{{d|  Prepared aws_launch_template for import}}',
        '{{d|module.payments_pool.aws_launch_template.this: Refreshing state... [id=lt-04f18a2b]}}',
        '',
        '{{g|Import successful!}}',
        '{{d|The resources that were imported are shown above. These resources are now in}}',
        '{{d|your Terraform state and will henceforth be managed by Terraform.}}',
        '',
        '{{d|$ terraform plan}}',
        '{{g|No changes. Your infrastructure matches the configuration.}}',
      ),
    },
    grepTarget: 'topologySpreadConstraints|subnet_ids',
  },
  probs: [
    { sev: 'e', file: 'modules/eks-nodegroup/main.tf', line: 62, col: 3, msg: '"instance_types" is deprecated in favor of a list', src: 'tflint' },
    { sev: 'e', file: 'k8s/payments/ledger-api.yaml', line: 41, col: 11, msg: 'Containers must not run as root (CKV_K8S_23)', src: 'conftest' },
    { sev: 'w', file: 'live/prod-apne2/main.tf', line: 14, col: 1, msg: 'Missing version constraint for provider "kubernetes"', src: 'tflint' },
  ],
  logtail: [
    '{{gr|$t}} {{g|INFO}}  {{gr|kube-apiserver}} PATCH /apis/apps/v1/namespaces/payments/deployments {{g|200}} {{d|$msms}}',
    '{{gr|$t}} {{g|INFO}}  {{gr|hpa-controller}} ledger-api desired=$n current=$n metric=pending_transfers/40',
    '{{gr|$t}} {{g|INFO}}  {{gr|scheduler}} bound pod=ledger-api-7d9f-$h node=ip-10-4-$a-$b zone=apne2-az$a',
    '{{gr|$t}} {{g|INFO}}  {{gr|argocd}} sync operation succeeded app=ledger-api rev=3f9a1c2 {{d|$msms}}',
    '{{gr|$t}} {{y|WARN}}  {{gr|cluster-autoscaler}} scale_up: 2 nodes requested (unschedulable=4)',
    '{{gr|$t}} {{g|INFO}}  {{gr|prometheus}} scrape payments/ledger-api:9100 samples=412 {{d|$msms}}',
    '{{gr|$t}} {{g|INFO}}  {{gr|alertmanager}} no active alerts · error budget 30d: 98.4% remaining',
  ],
};

/* ════════════════════════════════════════════════════════════════════════
   스택 6 — PostgreSQL · 데이터 플랫폼  (warehouse-db)
   ════════════════════════════════════════════════════════════════════════ */
const postgres = {
  id: 'postgres',
  label: 'PostgreSQL · Data',
  icon: '⛁',
  hint: 'psql · Flyway · pgTAP · sqlfluff · pgbench · pg_stat_statements. Partitioning, index tuning and query plans on a 4TB warehouse.',
  lang: 'sql', langLabel: 'SQL',
  repo: 'warehouse-db', org: 'leafmeta',
  root: '~/dev/warehouse-db',
  pkg: 'psql',
  terms: ['zsh', 'psql prod-ro', 'pg_activity', 'flyway'],
  ext: ['PostgreSQL', 'SQLTools', 'sqlfluff'],
  tree: [
    { d: 'migrations', open: true, c: [
      { f: 'V0039__add_settlement_index.sql' }, { f: 'V0040__events_retention.sql' },
      { f: 'V0041__order_items_fk.sql' }, { f: 'V0042__partition_events.sql', git: 'U' },
    ] },
    { d: 'schema', open: true, c: [
      { f: 'orders.sql', git: 'M' }, { f: 'events.sql', git: 'M' },
      { f: 'settlements.sql' }, { f: 'views.sql' }, { f: 'policies.sql', git: 'M' },
    ] },
    { d: 'tests', open: true, c: [
      { f: 'test_constraints.sql', git: 'M' }, { f: 'test_policies.sql' }, { f: 'test_partitions.sql', git: 'U' },
    ] },
    { d: 'analysis', c: [{ f: 'slow_queries.sql' }, { f: 'bloat.sql' }, { f: 'index_usage.sql' }] },
    { d: 'conf', c: [{ f: 'postgresql.conf', git: 'M' }, { f: 'pg_hba.conf' }] },
    { f: 'flyway.toml' }, { f: '.sqlfluff' }, { f: 'Makefile' }, { f: 'README.md' },
  ],
  topic: {
    title: 'Make retention a partition drop',
    unit: 'the events table',
    criteria: 'retention must not rewrite live pages',
    implicit: 'retention is a DELETE, so every night rewrites the heap and autovacuum never catches up',
    explicit: 'range-partition by the column retention filters on, so a drop replaces the delete',
    done: 'Retention is now a DETACH and DROP on the partition key, which holds no lock on the parent.',
    peer: 'detach instead of delete. the nightly job went from 18 seconds and timing out to under one',
    hover: 'Monthly range partitions on occurred_at. Retention detaches and drops rather than deleting rows.',
    symbol: 'events',
  },
  files: {
    impl: {
      path: 'migrations/V0042__partition_events.sql', lang: 'sql',
      code: `-- Events is 2.9TB in one heap. Every retention delete rewrites live pages and
-- the autovacuum never catches up. Convert to monthly range partitions so
-- retention becomes DETACH + DROP, which is O(1) and takes no exclusive lock
-- on the parent. WH-812.
--
-- Safe under load because we attach the existing heap as the "historic"
-- partition rather than copying 2.9TB of rows.

begin;

set local lock_timeout = '3s';
set local statement_timeout = '15min';

alter table events rename to events_historic;

create table events (
  id            bigint       generated always as identity,
  aggregate_id  uuid         not null,
  type          text         not null,
  payload       jsonb        not null,
  occurred_at   timestamptz  not null,
  ingested_at   timestamptz  not null default now(),
  constraint events_pkey primary key (id, occurred_at)
) partition by range (occurred_at);

comment on table events is 'Append-only domain events. Monthly partitions, 13 months retained.';

-- The old heap covers everything up to the cutover. No data moves.
alter table events attach partition events_historic
  for values from (minvalue) to ('2026-09-01');

do $$
declare
  m date := date '2026-09-01';
begin
  while m < date '2026-12-01' loop
    execute format(
      'create table %I partition of events for values from (%L) to (%L)',
      'events_' || to_char(m, 'YYYY_MM'), m, m + interval '1 month'
    );
    m := m + interval '1 month';
  end loop;
end $$;

create index events_aggregate_occurred_idx
  on events (aggregate_id, occurred_at desc);

create index events_type_occurred_idx
  on events (type, occurred_at desc)
  where type in ('order.paid', 'order.refunded', 'settlement.completed');

commit;

analyze events;`,
    },
    types: {
      path: 'schema/orders.sql', lang: 'sql',
      code: `create table orders (
  id              uuid         primary key default gen_random_uuid(),
  customer_id     uuid         not null references customers (id) on delete restrict,
  status          order_status not null default 'DRAFT',
  currency        char(3)      not null,
  subtotal_minor  bigint       not null check (subtotal_minor >= 0),
  discount_minor  bigint       not null default 0 check (discount_minor >= 0),
  tax_minor       bigint       not null default 0 check (tax_minor >= 0),
  total_minor     bigint       not null generated always as
                    (subtotal_minor - discount_minor + tax_minor) stored,
  version         bigint       not null default 1,
  placed_at       timestamptz,
  updated_at      timestamptz  not null default now(),

  constraint orders_discount_within_subtotal
    check (discount_minor <= subtotal_minor),
  constraint orders_placed_when_not_draft
    check ((status = 'DRAFT') = (placed_at is null))
);

create index orders_customer_placed_idx
  on orders (customer_id, placed_at desc nulls last);

-- Partial index: the operational dashboards only ever read open orders, and
-- they are under 2% of the table.
create index orders_open_idx
  on orders (placed_at desc)
  where status in ('PENDING_PAYMENT', 'PAID', 'PACKING');

create trigger orders_touch_updated_at
  before update on orders
  for each row
  when (old.* is distinct from new.*)
  execute function touch_updated_at();`,
    },
    test: {
      path: 'tests/test_partitions.sql', lang: 'sql',
      code: `begin;
select plan(9);

-- Structure -----------------------------------------------------------------
select has_table('public', 'events', 'events exists');
select is_partitioned('public', 'events', 'events is partitioned');
select is(
  (select count(*)::int from pg_inherits where inhparent = 'events'::regclass),
  4,
  'historic + three monthly partitions attached'
);

-- Routing -------------------------------------------------------------------
insert into events (aggregate_id, type, payload, occurred_at)
values (gen_random_uuid(), 'order.paid', '{}', '2026-10-14T09:00:00Z');

select is(
  (select tableoid::regclass::text from events where occurred_at = '2026-10-14T09:00:00Z'),
  'events_2026_10',
  'October rows land in the October partition'
);

-- Constraints ---------------------------------------------------------------
select throws_ok(
  $$insert into events (aggregate_id, type, payload, occurred_at)
    values (gen_random_uuid(), 'x', '{}', '2027-06-01T00:00:00Z')$$,
  '23514',
  null,
  'a row past the last partition is rejected, not silently dropped'
);

-- Retention is a DETACH, not a DELETE ---------------------------------------
select lives_ok(
  $$alter table events detach partition events_historic concurrently$$,
  'historic partition detaches without an exclusive lock on the parent'
);

-- Plans ---------------------------------------------------------------------
select plan_uses_index(
  $$select * from events where aggregate_id = gen_random_uuid()
      and occurred_at > now() - interval '7 days'$$,
  'events_aggregate_occurred_idx',
  'aggregate lookups use the composite index'
);
select plan_prunes_partitions(
  $$select count(*) from events where occurred_at >= '2026-10-01'$$,
  3,
  'a date filter prunes to one partition'
);
select isnt_empty(
  $$select * from pg_stat_user_tables where relname like 'events_%' and n_live_tup >= 0$$,
  'statistics exist for every partition'
);

select * from finish();
rollback;`,
    },
    patch: {
      path: 'schema/events.sql', lang: 'sql',
      code: `-- The retention job filtered on ingested_at while the partition key is
-- occurred_at, so every run scanned all 13 partitions instead of one. The
-- planner cannot prune on a column that is not the partition key. WH-812.
create or replace function prune_events(retain interval default '13 months')
returns table (dropped text, rows bigint)
language plpgsql
as $$
declare
  cutoff date := date_trunc('month', now() - retain)::date;
  part   record;
begin
  for part in
    select c.relname,
           pg_catalog.pg_get_expr(c.relpartbound, c.oid) as bound
      from pg_class c
      join pg_inherits i on i.inhrelid = c.oid
     where i.inhparent = 'events'::regclass
  loop
    if partition_upper_bound(part.bound) <= cutoff then
      execute format('alter table events detach partition %I', part.relname);
      execute format('drop table %I', part.relname);
      return query select part.relname, 0::bigint;
    end if;
  end loop;
end $$;`,
    },
    infra: {
      path: 'conf/postgresql.conf', lang: 'toml',
      code: `# db-prod-apne2-1 · r7g.8xlarge · 256GB RAM · gp3 12k IOPS
# Reviewed 2026-09-15 after the events partitioning work.

max_connections = 400
superuser_reserved_connections = 5

shared_buffers = 64GB                  # 25% of RAM
effective_cache_size = 180GB           # planner hint, not an allocation
work_mem = 96MB                        # per sort node, 400 conns worst case
maintenance_work_mem = 4GB             # index builds and autovacuum
huge_pages = try

wal_level = logical
max_wal_size = 32GB
min_wal_size = 4GB
checkpoint_timeout = 15min
checkpoint_completion_target = 0.9
wal_compression = zstd

random_page_cost = 1.1                 # gp3, not spinning rust
effective_io_concurrency = 256
default_statistics_target = 250        # partition pruning needs good stats

autovacuum_max_workers = 8
autovacuum_vacuum_cost_limit = 4000
autovacuum_naptime = 15s
log_autovacuum_min_duration = 250ms

log_min_duration_statement = 200ms
log_lock_waits = on
log_temp_files = 0
track_io_timing = on
shared_preload_libraries = 'pg_stat_statements,auto_explain'
auto_explain.log_min_duration = 2s
auto_explain.log_analyze = on`,
    },
    scaffold: [
      {
        path: 'analysis/slow_queries.sql', lang: 'sql',
        code: `-- The first thing to run on any "the database is slow" report.
-- Ranks by total time, not by mean: a 4ms query called 40M times costs more
-- than a 4s report nobody reads.
select
  substring(regexp_replace(query, '\\s+', ' ', 'g') for 90) as query,
  calls,
  round(total_exec_time::numeric / 1000, 1)        as total_s,
  round(mean_exec_time::numeric, 2)                as mean_ms,
  round(stddev_exec_time::numeric, 2)              as sd_ms,
  round((100 * total_exec_time / sum(total_exec_time) over ())::numeric, 1) as pct,
  rows,
  round(shared_blks_hit * 100.0 / nullif(shared_blks_hit + shared_blks_read, 0), 1) as hit_pct,
  round(temp_blks_written * 8192 / 1024.0 / 1024, 1) as temp_mb
from pg_stat_statements
where query not like '%pg_stat_statements%'
  and calls > 50
order by total_exec_time desc
limit 25;`,
      },
      {
        path: 'analysis/index_usage.sql', lang: 'sql',
        code: `-- Indexes that cost writes and buy nothing. Drop candidates, in order.
with idx as (
  select
    s.schemaname,
    s.relname          as table_name,
    s.indexrelname     as index_name,
    s.idx_scan,
    pg_relation_size(s.indexrelid)                  as bytes,
    i.indisunique,
    i.indisprimary
  from pg_stat_user_indexes s
  join pg_index i on i.indexrelid = s.indexrelid
)
select
  table_name,
  index_name,
  idx_scan                                   as scans,
  pg_size_pretty(bytes)                      as size,
  case
    when indisprimary then 'primary key — keep'
    when indisunique  then 'unique constraint — keep'
    when idx_scan = 0 then 'never scanned since last reset — drop'
    when idx_scan < 50 then 'rarely scanned — review'
    else 'in use'
  end                                        as verdict
from idx
where not indisprimary
order by (idx_scan = 0) desc, bytes desc
limit 30;`,
      },
    ],
  },
  cmd: {
    status: {
      cmd: 'git status --short --branch', ms: 470,
      out: L(
        '{{gr|##}} {{g|feat/WH-812-partition-events}}{{gr|...origin/feat/WH-812-partition-events}}',
        '{{r| M}} conf/postgresql.conf',
        '{{r| M}} schema/events.sql',
        '{{r| M}} schema/orders.sql',
        '{{r| M}} schema/policies.sql',
        '{{r|??}} migrations/V0042__partition_events.sql',
        '{{r|??}} tests/test_partitions.sql',
      ),
    },
    install: {
      cmd: 'make deps && psql -c "create extension if not exists pg_stat_statements; create extension if not exists pgtap"', ms: 3400,
      out: L(
        '{{d|flyway 10.20.1 · sqlfluff 3.2.5 · pgtap 1.3.3 · pgbench (PostgreSQL) 16.4}}',
        '{{d|CREATE EXTENSION}}',
        '{{d|CREATE EXTENSION}}',
        '',
        '{{d|$ psql -Atc "select name, default_version, installed_version from pg_available_extensions where installed_version is not null"}}',
        '{{d|pg_stat_statements|1.11|1.11}}',
        '{{d|pgtap|1.3.3|1.3.3}}',
        '{{d|pg_partman|5.2.0|5.2.0}}',
        '{{d|pgcrypto|1.3|1.3}}',
        '{{g|✓ extensions ready on 16.4}}',
      ),
    },
    dev: {
      cmd: 'psql "postgres://leaf@db-prod-apne2-ro:5432/warehouse?application_name=psql-leaf"', ms: 2900, keep: true,
      out: L(
        '{{d|psql (16.4)}}',
        '{{d|SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384)}}',
        '{{d|Type "help" for help.}}',
        '',
        '{{c|warehouse=>}} \\dt+ events*',
        '{{d|                          List of relations}}',
        '{{d| Schema |      Name      | Type  | Owner |  Size   | Description}}',
        '{{d|--------+----------------+-------+-------+---------+-------------}}',
        '{{d| public | events}}          {{d|| table | leaf  |}} {{y|2913 GB}} {{d|| partitioned}}',
        '{{d| public | events_historic}} {{d|| table | leaf  |}} {{y|2904 GB}} {{d||}}',
        '{{d| public | events_2026_09}}  {{d|| table | leaf  |}} {{g|6144 MB}} {{d||}}',
        '{{d| public | events_2026_10}}  {{d|| table | leaf  |}} {{g|2880 MB}} {{d||}}',
        '{{d|(4 rows)}}',
        '',
        '{{c|warehouse=>}} {{gr|-- read-only replica, statement_timeout = 30s}}',
      ),
    },
    test_fail: {
      cmd: 'pg_prove -d warehouse_test tests/*.sql', ms: 6200,
      out: L(
        '{{d|tests/test_constraints.sql .. ok}}',
        '{{d|tests/test_policies.sql ..... ok}}',
        '{{r|tests/test_partitions.sql ...}} ',
        '{{d|1..9}}',
        '{{g|ok 1}} - events exists',
        '{{g|ok 2}} - events is partitioned',
        '{{g|ok 3}} - historic + three monthly partitions attached',
        '{{g|ok 4}} - October rows land in the October partition',
        '{{r|not ok 5}} - a row past the last partition is rejected, not silently dropped',
        '{{r|#   Failed test 5: "a row past the last partition is rejected"}}',
        '{{r|#         caught: 23514 no partition of relation "events" found for row}}',
        '{{r|#         wanted: 23514 with a DETAIL naming the partition key}}',
        '{{g|ok 6}} - historic partition detaches without an exclusive lock on the parent',
        '{{r|not ok 7}} - aggregate lookups use the composite index',
        '{{r|#   Failed test 7: plan used Parallel Seq Scan on events_historic}}',
        '{{g|ok 8}} - a date filter prunes to one partition',
        '{{g|ok 9}} - statistics exist for every partition',
        '{{r|# Looks like you failed 2 tests of 9.}}',
        '',
        '{{r|Test Summary Report}}',
        '{{r|-------------------}}',
        '{{r|tests/test_partitions.sql (Wstat: 0 Tests: 9 Failed: 2)}}',
        '{{r|  Failed tests:  5, 7}}',
        '{{d|Files=3, Tests=41, 4.8s}}',
        '{{r|Result: FAIL}}',
      ),
    },
    test_pass: {
      cmd: 'pg_prove -d warehouse_test tests/*.sql', ms: 5400,
      out: L(
        '{{d|tests/test_constraints.sql .. ok}}     {{d|1804 ms}}',
        '{{d|tests/test_partitions.sql ... ok}}     {{d|2418 ms}}',
        '{{d|tests/test_policies.sql ..... ok}}     {{d|912 ms}}',
        '{{d|All tests successful.}}',
        '{{d|Files=3, Tests=41, 5.2s (usr 0.12 sys 0.03 = 0.15 CPU)}}',
        '{{g|Result: PASS}}',
      ),
    },
    types: {
      cmd: 'sqlfluff lint migrations schema --dialect postgres', ms: 4100,
      out: L(
        '{{r|== [migrations/V0042__partition_events.sql] FAIL}}',
        '{{d|L:  18 | P:   1 |}} {{r|LT02}} {{d|| Expected indent of 2 spaces.}}',
        '{{d|L:  24 | P:  18 |}} {{r|RF04}} {{d|| Column name "type" is a reserved keyword.}}',
        '{{d|L:  41 | P:   3 |}} {{r|CV10}} {{d|| Use single quotes, not double quotes, for string literals.}}',
        '{{r|== [schema/orders.sql] FAIL}}',
        '{{d|L:  12 | P:  21 |}} {{r|LT09}} {{d|| Select targets should be on a new line unless there is only one.}}',
        '{{d|L:  31 | P:   1 |}} {{r|ST06}} {{d|| Select wildcards then simple targets before calculations.}}',
        '{{r|All Finished!}}',
        '{{r|5 violations across 2 files}}',
      ),
    },
    types_ok: {
      cmd: 'sqlfluff lint migrations schema --dialect postgres && flyway validate', ms: 3700,
      out: L(
        '{{g|All Finished!}}',
        '{{d|0 violations across 12 files}}',
        '',
        '{{d|Flyway Community Edition 10.20.1 by Redgate}}',
        '{{d|Database: jdbc:postgresql://db-staging:5432/warehouse (PostgreSQL 16.4)}}',
        '{{g|Successfully validated 42 migrations (execution time 00:00.412s)}}',
      ),
    },
    lint: {
      cmd: 'psql -f analysis/index_usage.sql -f analysis/bloat.sql', ms: 5100,
      out: L(
        '{{d|    table_name    |          index_name           | scans |  size   |              verdict}}',
        '{{d|------------------+-------------------------------+-------+---------+------------------------------------}}',
        '{{d| events_historic}}  {{d|| events_payload_gin_idx}}        {{r||     0}} {{r|| 184 GB}}  {{r|| never scanned since last reset}}',
        '{{d| orders}}           {{d|| orders_status_idx}}             {{y||    41}} {{y|| 2118 MB}} {{y|| rarely scanned — review}}',
        '{{d| settlements}}      {{d|| settlements_psp_ref_idx}}       {{g||  8.4M}} {{d|| 984 MB}}  {{d|| in use}}',
        '{{d| orders}}           {{d|| orders_customer_placed_idx}}    {{g|| 41.2M}} {{d|| 1412 MB}} {{d|| in use}}',
        '',
        '{{y|→ dropping events_payload_gin_idx frees 184GB and removes ~18% of write amplification}}',
        '{{y|→ orders_status_idx is covered by orders_open_idx; candidate for removal}}',
      ),
    },
    lint_ok: {
      cmd: 'sqlfluff fix migrations schema --dialect postgres --force && sqlfluff lint --dialect postgres', ms: 4400,
      out: L(
        '{{d|==== finding fixable violations ====}}',
        '{{g|== [migrations/V0042__partition_events.sql] FIXED}}',
        '{{g|== [schema/orders.sql] FIXED}}',
        '{{d|==== fixing violations ====}}',
        '{{g|5 fixable linting violations found}}',
        '{{d|All Finished!}}',
        '{{g|0 violations across 12 files}}',
      ),
    },
    build: {
      cmd: 'pg_dump --schema-only warehouse | psql -q warehouse_shadow && flyway -configFiles=flyway.toml migrate -dryRunOutput=plan.sql', ms: 9800,
      out: L(
        '{{d|Flyway Community Edition 10.20.1}}',
        '{{d|Database: jdbc:postgresql://localhost:5432/warehouse_shadow (PostgreSQL 16.4)}}',
        '{{d|Successfully validated 42 migrations}}',
        '{{d|Current version of schema "public": 41}}',
        '{{d|Migrating schema "public" to version "42 - partition events" [dry run]}}',
        '',
        '{{d|-- plan.sql (excerpt)}}',
        '{{y|ALTER TABLE events RENAME TO events_historic;}}',
        '{{g|CREATE TABLE events (...) PARTITION BY RANGE (occurred_at);}}',
        '{{g|ALTER TABLE events ATTACH PARTITION events_historic FOR VALUES FROM (MINVALUE) TO (\'2026-09-01\');}}',
        '{{g|CREATE INDEX events_aggregate_occurred_idx ON events (aggregate_id, occurred_at DESC);}}',
        '',
        '{{g|✓ dry run clean · 0 table rewrites · longest predicted lock 1.8s (ACCESS EXCLUSIVE on parent only)}}',
      ),
    },
    diff: {
      cmd: 'git diff --stat && migra postgres:///warehouse_shadow postgres:///warehouse', ms: 3200,
      out: L(
        ' conf/postgresql.conf                        | 18 {{g|+++++++++++}}{{r|-------}}',
        ' migrations/V0042__partition_events.sql       | 62 {{g|++++++++++++++++++++++++++++++++++++++++++}}',
        ' schema/events.sql                           | 34 {{g|+++++++++++++++++++++}}{{r|-------------}}',
        ' schema/orders.sql                           | 21 {{g|++++++++++++++}}{{r|-------}}',
        ' tests/test_partitions.sql                   | 58 {{g|++++++++++++++++++++++++++++++++++++++++}}',
        ' {{w|5 files changed, 193 insertions(+), 27 deletions(-)}}',
        '',
        '{{d|-- schema drift between shadow and prod: none}}',
      ),
    },
    commit: {
      cmd: 'git commit -am "feat(events): range-partition events by occurred_at"', ms: 1300,
      out: L(
        '{{d|sqlfluff-lint............................................................}}{{g|Passed}}',
        '{{d|flyway-validate..........................................................}}{{g|Passed}}',
        '{{d|pg_prove.................................................................}}{{g|Passed}}',
        '{{d|no-drop-without-ticket...................................................}}{{g|Passed}}',
        '',
        '{{g|[feat/WH-812-partition-events 4c81e02]}} feat(events): range-partition events by occurred_at',
        ' 5 files changed, 193 insertions(+), 27 deletions(-)',
        ' create mode 100644 migrations/V0042__partition_events.sql',
      ),
    },
    push: {
      cmd: 'git push -u origin HEAD && gh pr create --fill --label migration', ms: 3400,
      out: L(
        '{{d|Enumerating objects: 23, done.}}',
        '{{d|Writing objects: 100% (13/13), 5.18 KiB | 5.18 MiB/s, done.}}',
        '{{d|To github.com:leafmeta/warehouse-db.git}}',
        ' {{g|* [new branch]}}      HEAD -> feat/WH-812-partition-events',
        '',
        '{{d|Creating pull request for feat/WH-812-partition-events into main}}',
        '{{d|label: migration · requires DBA approval}}',
        '{{c|https://github.com/leafmeta/warehouse-db/pull/418}}',
      ),
    },
    logs: {
      cmd: 'tail -f /var/log/postgresql/postgresql-16-main.log | grep -E "duration|LOCK|autovacuum"', ms: 4600,
      out: L(
        '{{gr|2026-09-15 14:01:02.418 KST}} {{y|LOG}}  duration: {{r|18412.882 ms}}  statement: delete from events where ingested_at < now() - interval \'13 months\'',
        '{{gr|2026-09-15 14:01:21.104 KST}} {{y|LOG}}  automatic vacuum of table "warehouse.public.events": index scans: 1',
        '{{gr|2026-09-15 14:01:21.104 KST}}      pages: 0 removed, {{y|381204418 remain}}, 0 skipped due to pins',
        '{{gr|2026-09-15 14:01:21.104 KST}}      tuples: 4188204 removed, {{y|9841204188 remain}}, 1841204 are dead but not yet removable',
        '{{gr|2026-09-15 14:01:21.104 KST}}      system usage: CPU: user: 412.18 s, system: 88.04 s, {{r|elapsed: 3418.42 s}}',
        '{{gr|2026-09-15 14:02:44.771 KST}} {{r|LOG}}  process 48213 still waiting for {{r|ShareLock}} on transaction 918412044 after 1000.118 ms',
        '{{gr|2026-09-15 14:02:44.771 KST}}      detail: Process holding the lock: 48109. Wait queue: 48213, 48240, 48288.',
        '{{gr|2026-09-15 14:03:18.229 KST}} {{y|LOG}}  temporary file: path "base/pgsql_tmp/pgsql_tmp48213.14", size {{y|8841204480}}',
        '{{gr|2026-09-15 14:05:02.118 KST}} {{r|ERROR}} canceling statement due to statement timeout',
        '{{d|-- retention job has not completed inside its window for 9 consecutive nights --}}',
      ),
    },
    repro: {
      cmd: 'psql -c "explain (analyze, buffers, settings) select count(*) from events where aggregate_id = \'a1f3…\' and occurred_at > now() - interval \'7 days\'"', ms: 6800,
      out: L(
        '{{d|                                    QUERY PLAN}}',
        '{{d|------------------------------------------------------------------------------------}}',
        '{{d| Finalize Aggregate  (cost=24818412.02..24818412.03 rows=1 width=8)}}',
        '{{d|   (actual time=}}{{r|41882.104..41882.118}}{{d| rows=1 loops=1)}}',
        '{{d|   Buffers: shared hit=1204 read=}}{{r|38104882}}',
        '{{d|   ->  Gather  (cost=24818411.80..24818412.01 rows=2 width=8)}}',
        '{{d|         Workers Planned: 2  Workers Launched: 2}}',
        '{{d|         ->  Partial Aggregate  (cost=24817411.80..24817411.81 rows=1 width=8)}}',
        '{{r|               ->  Parallel Seq Scan on events_historic events_1}}',
        '{{d|                     (actual time=}}{{r|0.412..41204.882}}{{d| rows=1394 loops=3)}}',
        '{{d|                     Filter: ((aggregate_id = \'a1f3…\'::uuid) AND (occurred_at > ...))}}',
        '{{r|                     Rows Removed by Filter: 3280401396}}',
        '{{d| Settings: effective_cache_size = \'180GB\', random_page_cost = \'1.1\'}}',
        '{{d| Planning Time: 0.884 ms}}',
        '{{r| Execution Time: 41882.204 ms}}',
        '',
        '{{r|↑ 41.9 s and 290GB read to return 1,394 rows. No index, no pruning.}}',
      ),
    },
    cov: {
      cmd: 'psql -f analysis/slow_queries.sql', ms: 5200,
      out: L(
        '{{d|                  query                   |  calls   | total_s | mean_ms | pct  | hit_pct | temp_mb}}',
        '{{d|------------------------------------------+----------+---------+---------+------+---------+---------}}',
        '{{d| select count(*) from events where aggr…}} {{d||}}   {{d|412804}} {{d||}} {{g|   418.2}} {{g||    1.01}} {{g|| 18.4}} {{g||    99.8}} {{g||     0.0}}',
        '{{d| select * from orders where customer_id…}} {{d||}} {{d|18412044}} {{d||}} {{g|   388.1}} {{g||    0.02}} {{g|| 17.1}} {{g||    99.9}} {{g||     0.0}}',
        '{{d| insert into events (aggregate_id, type…}} {{d||}} {{d|41204188}} {{d||}} {{g|   204.8}} {{g||    0.00}} {{g||  9.0}} {{g||   100.0}} {{g||     0.0}}',
        '{{d| select * from settlement_daily_v}}       {{d||}}      {{d|412} }{{d||}} {{y|   188.4}} {{y||  457.28}} {{y||  8.3}} {{y||    88.1}} {{y||   412.8}}',
        '',
        '{{g|✓ p99 on the aggregate lookup: 41,882 ms → 2.1 ms after partitioning + index}}',
        '{{g|✓ events table no longer appears in the top 10 by total time}}',
        '{{d|  cache hit ratio 99.8% · temp file spills 412MB/day → 0}}',
      ),
    },
    sec: {
      cmd: 'psql -f analysis/rls_audit.sql && pgaudit-report --since 24h', ms: 6400,
      out: L(
        '{{d|      table       | rls_enabled | forced |            policies}}',
        '{{d|------------------+-------------+--------+--------------------------------}}',
        '{{d| orders}}           {{g|| t}}           {{g|| t}}      {{d|| tenant_isolation, admin_read}}',
        '{{d| settlements}}      {{g|| t}}           {{g|| t}}      {{d|| tenant_isolation}}',
        '{{d| events}}           {{r|| f}}           {{r|| f}}      {{r|| —}}',
        '{{d| customers}}        {{g|| t}}           {{g|| t}}      {{d|| tenant_isolation, gdpr_export}}',
        '',
        '{{r|✗ events has no row-level security · reachable by 4 service roles}}',
        '{{y|! 2 roles hold BYPASSRLS: etl_writer, analytics_ro}}',
        '',
        '{{d|pgaudit: 18,412,044 statements audited in the last 24h}}',
        '{{g|✓ 0 direct DML from human accounts on production}}',
        '{{g|✓ 0 superuser logins outside the break-glass window}}',
      ),
    },
    bench: {
      cmd: 'pgbench -c 64 -j 8 -T 120 -f bench/events_insert.sql -f bench/aggregate_lookup.sql warehouse_bench', ms: 13400,
      out: L(
        '{{d|pgbench (16.4)}}',
        '{{d|transaction type: multiple scripts}}',
        '{{d|scaling factor: 1}}',
        '{{d|query mode: simple}}',
        '{{d|number of clients: 64}}',
        '{{d|number of threads: 8}}',
        '{{d|duration: 120 s}}',
        '{{d|number of transactions actually processed: 4188204}}',
        '{{d|number of failed transactions: 0 (0.000%)}}',
        '{{d|latency average = }}{{g|1.834 ms}}',
        '{{d|latency stddev = }}{{g|0.912 ms}}',
        '{{d|initial connection time = 188.412 ms}}',
        '{{w|tps = 34,901.702 (without initial connection time)}}',
        '',
        '{{d|SQL script 1: bench/events_insert.sql}}',
        '{{d| - latency average = }}{{g|0.884 ms}}',
        '{{d|SQL script 2: bench/aggregate_lookup.sql}}',
        '{{d| - latency average = }}{{g|2.118 ms}}  {{d|(was 41,882 ms)}}',
        '',
        '{{g|→ aggregate lookup 19,800x faster · insert throughput unchanged}}',
      ),
    },
    review: {
      cmd: 'gh pr diff 418 --patch | head -26 && gh pr checks 418', ms: 5100,
      out: L(
        '{{w|diff --git a/schema/events.sql b/schema/events.sql}}',
        '{{c|@@ -12,7 +12,7 @@ create or replace function prune_events(}}',
        '{{r|-  where ingested_at < cutoff;}}',
        '{{g|+    if partition_upper_bound(part.bound) <= cutoff then}}',
        '{{g|+      execute format(\'alter table events detach partition %I\', part.relname);}}',
        '{{g|+      execute format(\'drop table %I\', part.relname);}}',
        '',
        '{{w|All checks were successful}}',
        '  {{g|✓}} sqlfluff          {{d|22s}}',
        '  {{g|✓}} pg_prove          {{d|1m18s}}  {{d|41 assertions}}',
        '  {{g|✓}} flyway-dry-run    {{d|2m41s}}  {{d|0 table rewrites}}',
        '  {{g|✓}} shadow-apply      {{d|8m12s}}  {{d|restored 4TB snapshot, applied, diffed}}',
        '  {{g|✓}} lock-analysis     {{d|41s}}   {{d|longest ACCESS EXCLUSIVE 1.8s}}',
        '  {{g|✓}} pgbench-regress   {{d|4m02s}}  {{d|tps 34.9k (base 34.4k)}}',
        '  {{g|✓}} dba-approval      {{d|—}}      {{d|approved by @priya}}',
      ),
    },
    deploy: {
      cmd: 'flyway -configFiles=flyway.prod.toml migrate && psql -c "analyze events"', ms: 15200,
      out: L(
        '{{d|Flyway Community Edition 10.20.1}}',
        '{{d|Database: jdbc:postgresql://db-prod-apne2-1:5432/warehouse (PostgreSQL 16.4)}}',
        '{{d|Successfully validated 42 migrations}}',
        '{{d|Current version of schema "public": 41}}',
        '{{d|Migrating schema "public" to version "42 - partition events"}}',
        '{{d|  acquiring ACCESS EXCLUSIVE on events (lock_timeout 3s) ...}}',
        '{{g|  acquired in 412 ms}}',
        '{{d|  ALTER TABLE events RENAME TO events_historic}}                    {{g|18 ms}}',
        '{{d|  CREATE TABLE events (...) PARTITION BY RANGE (occurred_at)}}       {{g|41 ms}}',
        '{{d|  ALTER TABLE events ATTACH PARTITION events_historic}}              {{g|884 ms}}',
        '{{d|  CREATE TABLE events_2026_09..events_2026_11}}                      {{g|112 ms}}',
        '{{d|  CREATE INDEX events_aggregate_occurred_idx}}                      {{y|4m 12s}}',
        '{{g|Successfully applied 1 migration to schema "public", now at version v42 (execution time 04:21.884s)}}',
        '',
        '{{d|ANALYZE}}',
        '{{g|✓ total lock held: 1.8s · 0 rows rewritten · 0 connections dropped}}',
        '{{g|✓ retention job now runs in 0.9s (was 18.4s and timing out)}}',
      ),
    },
    migrate: {
      cmd: 'flyway info | tail -12 && psql -c "select partition_name, pg_size_pretty(size) from partition_report(\'events\')"', ms: 7200,
      out: L(
        '{{d|+-----------+---------+----------------------------+--------+---------------------+---------+}}',
        '{{d|| Category  | Version | Description                | Type   | Installed On        | State   |}}',
        '{{d|+-----------+---------+----------------------------+--------+---------------------+---------+}}',
        '{{d|| Versioned | 39      | add settlement index       | SQL    | 2026-08-02 11:14:08 |}} {{g|Success}} {{d||}}',
        '{{d|| Versioned | 40      | events retention           | SQL    | 2026-08-19 09:41:22 |}} {{g|Success}} {{d||}}',
        '{{d|| Versioned | 41      | order items fk             | SQL    | 2026-09-04 15:08:41 |}} {{g|Success}} {{d||}}',
        '{{d|| Versioned | 42      | partition events           | SQL    | 2026-09-15 14:48:02 |}} {{g|Success}} {{d||}}',
        '{{d|+-----------+---------+----------------------------+--------+---------------------+---------+}}',
        '',
        '{{d|  partition_name  | pg_size_pretty}}',
        '{{d|------------------+----------------}}',
        '{{d| events_historic}}  {{d|| 2904 GB}}',
        '{{d| events_2026_09}}   {{d|| 6144 MB}}',
        '{{d| events_2026_10}}   {{d|| 2880 MB}}',
        '{{d| events_2026_11}}   {{d|| 0 bytes}}',
        '{{g|✓ schema v42 · pruning verified on all read paths}}',
      ),
    },
    grepTarget: 'partition of events|occurred_at',
  },
  probs: [
    { sev: 'e', file: 'migrations/V0042__partition_events.sql', line: 24, col: 18, msg: 'Column name "type" is a reserved keyword.', src: 'sqlfluff(RF04)' },
    { sev: 'e', file: 'schema/policies.sql', line: 8, col: 1, msg: 'Table "events" has no row-level security policy.', src: 'rls-audit' },
    { sev: 'w', file: 'schema/orders.sql', line: 31, col: 1, msg: 'Select wildcards then simple targets before calculations.', src: 'sqlfluff(ST06)' },
  ],
  logtail: [
    '{{gr|$t}} {{g|LOG}}  duration: {{g|1.8$a ms}}  {{d|bind}} {{gr|select * from orders where customer_id = $1}}',
    '{{gr|$t}} {{g|LOG}}  duration: {{g|0.$a ms}}  {{d|execute}} {{gr|insert into events (aggregate_id, type, payload, occurred_at) values …}}',
    '{{gr|$t}} {{g|LOG}}  checkpoint complete: wrote $n412 buffers ({{d|$a.$b%}}); {{d|sync=0.$a s total=$n.4 s}}',
    '{{gr|$t}} {{g|LOG}}  automatic analyze of table "warehouse.public.events_2026_09" {{d|$ms ms}}',
    '{{gr|$t}} {{y|LOG}}  duration: {{y|2$n8.4 ms}}  {{d|statement}} {{gr|select * from settlement_daily_v}}',
    '{{gr|$t}} {{g|LOG}}  connection authorized: user=etl_writer database=warehouse SSL {{d|TLSv1.3}}',
    '{{gr|$t}} {{g|LOG}}  partition pruning: $a of 4 partitions scanned {{d|events_2026_$a}}',
  ],
};

/* ════════════════════════════════════════════════════════════════════════
   스택 7 — LangChain · LangGraph 에이전트 개발  (agent-platform)
   ────────────────────────────────────────────────────────────────────────
   "AI 에이전트를 만드는 AI 에이전트"가 화면에 뜬다. 평가(eval) 점수가
   올라가는 장면이 이 스택의 핵심이고, 그래서 다른 스택보다 테스트 출력이
   길고 숫자가 많다.
   ════════════════════════════════════════════════════════════════════════ */
const langchain = {
  id: 'langchain',
  label: 'LangChain · Agent Dev',
  icon: '◉',
  hint: 'uv · LangGraph · LangChain · LangSmith · pgvector · ragas · pytest. Building and evaluating a tool-calling agent, with eval scores moving on screen.',
  lang: 'py', langLabel: 'Python',
  repo: 'agent-platform', org: 'leafmeta',
  root: '~/dev/agent-platform',
  pkg: 'uv',
  terms: ['zsh', 'langgraph dev', 'pytest evals', 'langsmith'],
  ext: ['Pylance', 'Ruff', 'Jupyter'],
  tree: [
    { d: 'agent', open: true, c: [
      { f: '__init__.py' }, { f: 'graph.py', git: 'M' }, { f: 'state.py', git: 'M' },
      { d: 'nodes', open: true, c: [
        { f: 'router.py', git: 'M' }, { f: 'planner.py' }, { f: 'executor.py' },
        { f: 'critic.py', git: 'U' },
      ] },
      { d: 'tools', open: true, c: [
        { f: 'registry.py', git: 'M' }, { f: 'sql_tool.py' }, { f: 'search_tool.py' },
        { f: 'ticket_tool.py' },
      ] },
      { d: 'prompts', c: [{ f: 'router.md', git: 'M' }, { f: 'planner.md' }, { f: 'critic.md' }] },
      { d: 'retrieval', c: [{ f: 'store.py' }, { f: 'chunker.py' }, { f: 'rerank.py' }] },
    ] },
    { d: 'evals', open: true, c: [
      { f: 'datasets', open: false }, { f: 'test_router_eval.py', git: 'M' },
      { f: 'test_tool_selection.py', git: 'U' }, { f: 'test_faithfulness.py' }, { f: 'conftest.py' },
    ] },
    { d: 'serve', c: [{ f: 'app.py' }, { f: 'stream.py' }] },
    { f: 'langgraph.json' }, { f: 'pyproject.toml' }, { f: 'uv.lock' }, { f: '.env.example' },
  ],
  topic: {
    title: 'Route on tool cards instead of raw schemas',
    unit: 'the router node',
    criteria: 'tool selection above 0.92 on the graded set',
    implicit: 'the router sees every tool\'s raw JSON schema and cannot tell near-identical ones apart',
    explicit: 'give each tool a card that states what it is for and what it is not for',
    done: 'The router now reads tool cards, and tool selection moved from 0.871 to 0.958 on the graded set.',
    peer: 'use_for plus never_for was the whole fix. exact_tool up nine points and the prompt got shorter',
    hover: 'Picks the next node from structured output. Routes to clarify below the confidence floor rather than guessing.',
    symbol: 'router',
  },
  files: {
    impl: {
      path: 'agent/nodes/router.py', lang: 'py',
      code: `from __future__ import annotations

from typing import Literal

from langchain_core.messages import AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from langgraph.types import Command
from pydantic import BaseModel, Field

from agent.state import AgentState
from agent.tools.registry import TOOLS, tool_card

Route = Literal["plan", "execute", "retrieve", "clarify", "finish"]


class RouteDecision(BaseModel):
    """Structured output. Free-form routing text is how agents get lost."""

    route: Route = Field(description="the next node to run")
    reason: str = Field(description="one sentence, for the trace", max_length=280)
    tools: list[str] = Field(default_factory=list, description="tools the next node may use")
    confidence: float = Field(ge=0.0, le=1.0)


ROUTER_PROMPT = ChatPromptTemplate.from_messages([
    ("system", open("agent/prompts/router.md").read()),
    ("placeholder", "{messages}"),
    ("human", "Available tools:\\n{tool_cards}\\n\\nDecide the next step."),
])


async def router(state: AgentState) -> Command[Route]:
    """Pick the next node. Three rules, learned the hard way:

    1. Route on structured output, never on a parsed string.
    2. If confidence is below the floor, ask the user instead of guessing —
       a clarifying question costs one turn, a wrong tool call costs five.
    3. Never route to 'execute' without at least one tool in the decision.
    """
    llm = state.llm.with_structured_output(RouteDecision, method="json_schema")
    chain = ROUTER_PROMPT | llm

    decision: RouteDecision = await chain.ainvoke({
        "messages": state.messages[-12:],
        "tool_cards": "\\n".join(tool_card(t) for t in TOOLS if t.name in state.allowed_tools),
    })

    if decision.confidence < state.config.route_floor:
        return Command(goto="clarify", update={"route_reason": decision.reason})

    if decision.route == "execute" and not decision.tools:
        return Command(goto="plan", update={"route_reason": "execute without tools; replanning"})

    return Command(
        goto=decision.route,
        update={
            "messages": [AIMessage(content="", additional_kwargs={"route": decision.route})],
            "selected_tools": decision.tools,
            "route_reason": decision.reason,
            "route_confidence": decision.confidence,
        },
    )`,
    },
    types: {
      path: 'agent/state.py', lang: 'py',
      code: `from __future__ import annotations

import operator
from typing import Annotated, Any

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages
from pydantic import BaseModel, ConfigDict, Field


class RunConfig(BaseModel):
    """Everything tunable. Nothing here is read from the environment at
    call time — an agent whose behaviour depends on ambient state cannot
    be evaluated."""

    model: str = "claude-opus-5"
    temperature: float = 0.0
    max_steps: int = 24
    route_floor: float = 0.55
    retrieval_k: int = 12
    rerank_top_n: int = 4
    tool_timeout_s: float = 20.0
    budget_tokens: int = 180_000


class ToolCall(BaseModel):
    name: str
    args: dict[str, Any]
    ok: bool
    latency_ms: int
    tokens: int
    error: str | None = None


class AgentState(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    messages: Annotated[list[AnyMessage], add_messages]
    calls: Annotated[list[ToolCall], operator.add] = Field(default_factory=list)
    steps: int = 0

    allowed_tools: list[str] = Field(default_factory=list)
    selected_tools: list[str] = Field(default_factory=list)
    retrieved: list[dict[str, Any]] = Field(default_factory=list)

    route_reason: str = ""
    route_confidence: float = 0.0

    llm: BaseChatModel | None = None
    config: RunConfig = Field(default_factory=RunConfig)

    @property
    def spent_tokens(self) -> int:
        return sum(c.tokens for c in self.calls)

    @property
    def exhausted(self) -> bool:
        return self.steps >= self.config.max_steps or self.spent_tokens >= self.config.budget_tokens`,
    },
    test: {
      path: 'evals/test_tool_selection.py', lang: 'py',
      code: `"""Tool-selection eval. Not a unit test — a graded dataset.

The number that matters is not "does it work on my example" but the
distribution over 240 recorded cases, including the 41 adversarial ones
where the right answer is to pick no tool at all.
"""
from __future__ import annotations

import pytest
from langsmith import aevaluate, traceable

from agent.graph import build_graph
from evals.datasets import load_dataset
from evals.scorers import exact_tool, no_tool_when_unanswerable, step_budget


DATASET = "tool-selection-v7"
GATES = {"exact_tool": 0.92, "no_tool_when_unanswerable": 0.95, "step_budget": 0.98}


@pytest.fixture(scope="module")
def graph():
    return build_graph(checkpointer=None)


@pytest.mark.asyncio
@pytest.mark.parametrize("case", load_dataset(DATASET, split="dev"), ids=lambda c: c.id)
async def test_single_case(graph, case) -> None:
    result = await graph.ainvoke({"messages": case.messages, "allowed_tools": case.tools})

    picked = [c.name for c in result["calls"]]
    assert picked == case.expected_tools, f"{case.id}: picked {picked}, want {case.expected_tools}"
    assert result["steps"] <= case.max_steps, f"{case.id}: used {result['steps']} steps"


@pytest.mark.asyncio
async def test_dataset_meets_gates(graph) -> None:
    report = await aevaluate(
        lambda inputs: graph.ainvoke(inputs),
        data=DATASET,
        evaluators=[exact_tool, no_tool_when_unanswerable, step_budget],
        experiment_prefix="tool-router",
        max_concurrency=8,
    )

    scores = {k: report.aggregate[k] for k in GATES}
    failed = {k: (v, GATES[k]) for k, v in scores.items() if v < GATES[k]}
    assert not failed, "gates missed: " + ", ".join(f"{k} {v:.3f} < {g}" for k, (v, g) in failed.items())


@traceable(name="adversarial-sweep")
@pytest.mark.asyncio
async def test_never_calls_sql_tool_on_prose_questions(graph) -> None:
    for case in load_dataset(DATASET, split="adversarial"):
        result = await graph.ainvoke({"messages": case.messages, "allowed_tools": ["sql", "search"]})
        assert "sql" not in [c.name for c in result["calls"]], case.id`,
    },
    patch: {
      path: 'agent/tools/registry.py', lang: 'py',
      code: `def tool_card(tool: BaseTool) -> str:
    """One compact card per tool, injected into the router prompt.

    The router used to see the raw JSON schema of every tool, which is where
    the 8% mis-selection rate came from: three tools had near-identical
    descriptions and the model could not tell them apart. Cards make the
    boundary explicit — what it is for, and what it is NOT for. AGT-1904.
    """
    return textwrap.dedent(f"""
        <tool name="{tool.name}">
          <use_for>{tool.metadata['use_for']}</use_for>
          <never_for>{tool.metadata['never_for']}</never_for>
          <cost>{tool.metadata['p50_ms']}ms p50 · {tool.metadata['cost_tier']}</cost>
          <args>{compact_schema(tool.args_schema)}</args>
        </tool>
    """).strip()`,
    },
    infra: {
      path: 'langgraph.json', lang: 'json',
      code: `{
  "dependencies": ["."],
  "graphs": {
    "agent": "./agent/graph.py:graph",
    "critic": "./agent/nodes/critic.py:critic_graph"
  },
  "env": ".env",
  "python_version": "3.13",
  "checkpointer": {
    "type": "postgres",
    "uri": "\${POSTGRES_URI}",
    "pool": { "min_size": 2, "max_size": 20 }
  },
  "store": {
    "type": "postgres",
    "index": {
      "dims": 1536,
      "embed": "openai:text-embedding-3-small",
      "fields": ["text", "title"]
    }
  },
  "http": {
    "cors": { "allow_origins": ["https://console.leafmeta.io"] },
    "configurable_headers": { "includes": ["x-tenant-id", "x-request-id"] }
  },
  "ui": { "agent": "./serve/ui.tsx" }
}`,
    },
    scaffold: [
      {
        path: 'agent/graph.py', lang: 'py',
        code: `from __future__ import annotations

from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.graph import END, START, StateGraph

from agent.nodes.clarify import clarify
from agent.nodes.critic import critic
from agent.nodes.executor import executor
from agent.nodes.planner import planner
from agent.nodes.retrieve import retrieve
from agent.nodes.router import router
from agent.state import AgentState


def build_graph(checkpointer: AsyncPostgresSaver | None = None):
    """Router in the middle, everything else on spokes.

    A linear chain cannot back out of a bad plan; a fully connected graph
    cannot be reasoned about. One hub with a step budget is the shape that
    survived contact with production.
    """
    g = StateGraph(AgentState)

    g.add_node("router", router)
    g.add_node("plan", planner)
    g.add_node("retrieve", retrieve)
    g.add_node("execute", executor)
    g.add_node("critic", critic)
    g.add_node("clarify", clarify)

    g.add_edge(START, "router")
    for spoke in ("plan", "retrieve", "execute"):
        g.add_edge(spoke, "critic")

    g.add_conditional_edges(
        "critic",
        lambda s: "finish" if s.done or s.exhausted else "router",
        {"finish": END, "router": "router"},
    )
    g.add_edge("clarify", END)

    return g.compile(
        checkpointer=checkpointer,
        interrupt_before=["execute"] if False else None,
        debug=False,
    )


graph = build_graph()`,
      },
      {
        path: 'agent/prompts/router.md', lang: 'md',
        code: `You route a single step of a software-engineering agent. You do not answer
the user and you do not call tools yourself. You choose the next node.

## Nodes

- **plan** — the request needs decomposition, or the previous plan failed.
- **retrieve** — the answer depends on repository or document content you
  have not read yet in this run.
- **execute** — there is a concrete, already-planned action with a named tool.
- **clarify** — the request is ambiguous in a way that changes the work.
- **finish** — the user's request has been satisfied and verified.

## Rules

1. Prefer **retrieve** over **execute** when you have not read the relevant
   file in this run. Acting on remembered content is the most common failure.
2. Never choose **execute** without naming at least one tool.
3. Choose **clarify** when two readings of the request lead to materially
   different work. One question is cheaper than a wrong five-step plan.
4. Your \`confidence\` is the probability that this route is correct, not how
   confident you are about the overall task.
5. \`reason\` is one sentence and is read by humans in traces. Write it for them.`,
      },
    ],
  },
  cmd: {
    status: {
      cmd: 'git status --short --branch', ms: 460,
      out: L(
        '{{gr|##}} {{g|feat/AGT-1904-tool-router}}{{gr|...origin/feat/AGT-1904-tool-router}}',
        '{{r| M}} agent/graph.py',
        '{{r| M}} agent/nodes/router.py',
        '{{r| M}} agent/prompts/router.md',
        '{{r| M}} agent/tools/registry.py',
        '{{r|??}} agent/nodes/critic.py',
        '{{r|??}} evals/test_tool_selection.py',
      ),
    },
    install: {
      cmd: 'uv sync --all-extras', ms: 4100,
      out: L(
        '{{d|Resolved 214 packages in 118ms}}',
        '{{d|Prepared 9 packages in 1.42s}}',
        '{{d|Installed 9 packages in 44ms}}',
        ' {{g|+}} langchain-core{{d|==0.3.29}}',
        ' {{g|+}} langgraph{{d|==0.2.62}}',
        ' {{g|+}} langgraph-checkpoint-postgres{{d|==2.0.9}}',
        ' {{g|+}} langsmith{{d|==0.2.10}}',
        ' {{g|+}} langchain-anthropic{{d|==0.3.3}}',
        ' {{g|+}} ragas{{d|==0.2.10}}',
        ' {{g|+}} pgvector{{d|==0.3.6}}',
        ' {{g|+}} rank-bm25{{d|==0.2.2}}',
        ' {{g|+}} tiktoken{{d|==0.8.0}}',
      ),
    },
    dev: {
      cmd: 'langgraph dev --port 2024 --no-browser', ms: 4200, keep: true,
      out: L(
        '{{d|INFO}}:     Will watch for changes in these directories: [\'/Users/leaf/dev/agent-platform\']',
        '{{gr|14:22:04}} {{g|INFO}}  langgraph_api.graph  loading graph "agent" from ./agent/graph.py:graph',
        '{{gr|14:22:05}} {{g|INFO}}  langgraph_api.graph  compiled 6 nodes, 9 edges, 1 conditional',
        '{{gr|14:22:05}} {{g|INFO}}  checkpointer  postgres pool ready (min=2 max=20) schema=langgraph',
        '{{gr|14:22:05}} {{g|INFO}}  store  pgvector index dims=1536 metric=cosine rows=48,204',
        '{{gr|14:22:05}} {{g|INFO}}  langsmith  tracing → project "agent-platform-dev"',
        '',
        '{{g|    Ready!}}',
        '{{d|    - API:    }}{{c|http://127.0.0.1:2024}}',
        '{{d|    - Docs:   }}{{c|http://127.0.0.1:2024/docs}}',
        '{{d|    - Studio: }}{{c|https://smith.langchain.com/studio?baseUrl=http://127.0.0.1:2024}}',
        '',
        '{{gr|14:22:41}} {{g|INFO}}  POST /threads/8f1c/runs/stream {{g|200}} {{d|router→retrieve→execute→critic→finish · 4 steps · 6.2s}}',
      ),
    },
    test_fail: {
      cmd: 'uv run pytest evals -q --langsmith', ms: 12400,
      out: L(
        '{{d|=============================== test session starts ===============================}}',
        '{{d|plugins: asyncio-0.25.0, langsmith-0.2.10, anyio-4.7.0}}',
        '{{d|collected 247 items}}',
        '',
        '{{g|........................................}}{{d| [ 16%]}}',
        '{{g|.....................}}{{r|F}}{{g|..............}}{{d|      [ 30%]}}',
        '{{g|........................................}}{{d| [ 46%]}}',
        '{{r|F}}{{g|.......................................}}{{d| [ 62%]}}',
        '',
        '{{r|==================================== FAILURES ====================================}}',
        '{{r|__________________________ test_dataset_meets_gates __________________________}}',
        '',
        '{{d|    scores = {k: report.aggregate[k] for k in GATES}}}',
        '{{d|    failed = {k: (v, GATES[k]) for k, v in scores.items() if v < GATES[k]}}}',
        '{{r|>   assert not failed, "gates missed: " + ", ".join(...)}}',
        '{{r|E   AssertionError: gates missed: exact_tool 0.871 < 0.92}}',
        '',
        '{{d|evals/test_tool_selection.py:48: AssertionError}}',
        '{{d|--------------------------------- captured log ----------------------------------}}',
        '{{y|WARNING}} agent.nodes.router: low confidence 0.41 route=execute tools=[] → replanned',
        '{{y|WARNING}} agent.nodes.router: picked "search" where dataset expects "sql" (17 cases)',
        '',
        '{{r|____________ test_never_calls_sql_tool_on_prose_questions ____________}}',
        '{{r|E   AssertionError: adv-0031}}',
        '',
        '{{w|LangSmith experiment: tool-router-ab3f91}}',
        '{{c|  https://smith.langchain.com/o/leafmeta/experiments/tool-router-ab3f91}}',
        '',
        '{{d|  exact_tool                  }}{{r|0.871}} {{d|(gate 0.92)  ↓ 0.049}}',
        '{{d|  no_tool_when_unanswerable   }}{{r|0.902}} {{d|(gate 0.95)  ↓ 0.048}}',
        '{{d|  step_budget                 }}{{g|0.994}} {{d|(gate 0.98)  ✓}}',
        '{{d|  p50 latency 2.41s · p95 6.88s · mean 11.2k tokens/run · $0.042/run}}',
        '',
        '{{r|2 failed}}, {{g|245 passed}} {{d|in 108.44s (0:01:48)}}',
      ),
    },
    test_pass: {
      cmd: 'uv run pytest evals -q --langsmith', ms: 11200,
      out: L(
        '{{d|=============================== test session starts ===============================}}',
        '{{d|collected 247 items}}',
        '',
        '{{g|........................................}}{{d| [ 16%]}}',
        '{{g|........................................}}{{d| [ 32%]}}',
        '{{g|........................................}}{{d| [ 48%]}}',
        '{{g|........................................}}{{d| [ 64%]}}',
        '{{g|........................................}}{{d| [ 80%]}}',
        '{{g|...............................................}}{{d| [100%]}}',
        '',
        '{{w|LangSmith experiment: tool-router-c81f04}}',
        '{{d|  exact_tool                  }}{{g|0.958}} {{d|(gate 0.92)}}  {{g|↑ 0.087}}',
        '{{d|  no_tool_when_unanswerable   }}{{g|0.971}} {{d|(gate 0.95)}}  {{g|↑ 0.069}}',
        '{{d|  step_budget                 }}{{g|0.996}} {{d|(gate 0.98)}}  {{g|↑ 0.002}}',
        '{{d|  faithfulness (ragas)        }}{{g|0.944}} {{d|(gate 0.90)}}  {{g|↑ 0.031}}',
        '{{d|  answer_relevancy            }}{{g|0.921}} {{d|(gate 0.88)}}  {{g|↑ 0.014}}',
        '',
        '{{d|  p50 latency 1.88s · p95 4.92s · mean 8.4k tokens/run · }}{{g|$0.031/run (-26%)}}',
        '{{g|247 passed}} {{d|in 96.12s (0:01:36)}}',
      ),
    },
    types: {
      cmd: 'uv run mypy agent evals --strict', ms: 7100,
      out: L(
        '{{r|agent/nodes/router.py:52}}: {{r|error}}: Returning Any from function declared to return "Command[Route]"  {{d|[no-any-return]}}',
        '{{r|agent/nodes/router.py:44}}: {{r|error}}: "BaseChatModel | None" has no attribute "with_structured_output"  {{d|[union-attr]}}',
        '{{r|agent/tools/registry.py:71}}: {{r|error}}: Value of type "dict[str, Any] | None" is not indexable  {{d|[index]}}',
        '{{r|Found 3 errors in 2 files (checked 41 source files)}}',
      ),
    },
    types_ok: {
      cmd: 'uv run mypy agent evals --strict', ms: 6400,
      out: L('{{g|Success: no issues found in 41 source files}}'),
    },
    lint: {
      cmd: 'uv run ruff check agent evals && uv run promptfoo lint agent/prompts', ms: 3800,
      out: L(
        '{{r|agent/nodes/router.py}}{{d|:}}{{y|29}}{{d|:}}{{y|5}}{{d|:}} {{r|SIM115}} Use a context manager for opening files',
        '{{r|agent/nodes/router.py}}{{d|:}}{{y|61}}{{d|:}}{{y|9}}{{d|:}} {{r|TRY300}} Consider moving this statement to an `else` block',
        '{{r|agent/graph.py}}{{d|:}}{{y|48}}{{d|:}}{{y|24}}{{d|:}} {{r|SIM108}} Use ternary operator instead of if-else-block',
        '{{r|Found 3 errors.}}',
        '',
        '{{y|promptfoo: agent/prompts/router.md}}',
        '{{y|  warn}} prompt contains no explicit refusal boundary',
        '{{y|  warn}} 1,412 tokens — above the 1,200 budget for a routing prompt',
      ),
    },
    lint_ok: {
      cmd: 'uv run ruff check agent evals && uv run promptfoo lint agent/prompts', ms: 3300,
      out: L(
        '{{g|All checks passed!}}',
        '{{g|promptfoo: 3 prompts linted, 0 warnings}}',
        '{{d|  router.md   1,088 tokens  (budget 1,200)}}',
        '{{d|  planner.md    842 tokens  (budget 1,200)}}',
        '{{d|  critic.md     614 tokens  (budget 1,200)}}',
      ),
    },
    build: {
      cmd: 'langgraph build -t ghcr.io/leafmeta/agent-platform:4c81e02 && docker run --rm agent-platform:4c81e02 python -c "from agent.graph import graph; print(graph.get_graph().draw_ascii())"', ms: 13800,
      out: L(
        '{{d|[+] Building 38.2s (12/12) FINISHED}}',
        '{{d| => [builder 3/5] RUN uv sync --frozen --no-dev}}                        {{y|21.4s}}',
        '{{d| => [runtime 2/4] COPY --from=builder /src/.venv /src/.venv}}             {{g|2.1s}}',
        '{{g| => => naming to ghcr.io/leafmeta/agent-platform:4c81e02}}                {{g|0.0s}}',
        '',
        '{{d|        +-----------+}}',
        '{{d|        | __start__ |}}',
        '{{d|        +-----------+}}',
        '{{d|              *}}',
        '{{d|         +--------+}}',
        '{{d|         | router |}}',
        '{{d|         +--------+}}',
        '{{d|       ***    *    ***}}',
        '{{d|   ****       *       ****}}',
        '{{d|+------+ +----------+ +---------+}}',
        '{{d?| plan | | retrieve | | execute |}}',
        '{{d|+------+ +----------+ +---------+}}',
        '{{d|       ***    *    ***}}',
        '{{d|         +--------+}}',
        '{{d|         | critic |}}',
        '{{d|         +--------+}}',
        '{{g|✓ graph compiles in the image · 6 nodes · image 412MB}}',
      ),
    },
    diff: {
      cmd: 'git diff --stat', ms: 620,
      out: L(
        ' agent/graph.py                   | 24 {{g|+++++++++++++++++}}{{r|-------}}',
        ' agent/nodes/critic.py            | 71 {{g|+++++++++++++++++++++++++++++++++++++++++++++}}',
        ' agent/nodes/router.py            | 58 {{g|+++++++++++++++++++++++++++++++++++++}}{{r|-------------}}',
        ' agent/prompts/router.md          | 41 {{g|++++++++++++++++++++++++++}}{{r|-------}}',
        ' agent/tools/registry.py          | 33 {{g|++++++++++++++++++++++}}{{r|-----}}',
        ' evals/test_tool_selection.py     | 62 {{g|+++++++++++++++++++++++++++++++++++++++++++}}',
        ' {{w|6 files changed, 244 insertions(+), 32 deletions(-)}}',
      ),
    },
    commit: {
      cmd: 'git commit -am "feat(router): route on tool cards instead of raw schemas"', ms: 1300,
      out: L(
        '{{d|ruff.....................................................................}}{{g|Passed}}',
        '{{d|mypy.....................................................................}}{{g|Passed}}',
        '{{d|prompt-token-budget......................................................}}{{g|Passed}}',
        '{{d|eval-gate (dev split)....................................................}}{{g|Passed}}',
        '{{d|no-secrets-in-prompts....................................................}}{{g|Passed}}',
        '',
        '{{g|[feat/AGT-1904-tool-router 6b2f18d]}} feat(router): route on tool cards instead of raw schemas',
        ' 6 files changed, 244 insertions(+), 32 deletions(-)',
        ' create mode 100644 agent/nodes/critic.py',
      ),
    },
    push: {
      cmd: 'git push -u origin HEAD && gh pr create --fill --label eval', ms: 3600,
      out: L(
        '{{d|Enumerating objects: 29, done.}}',
        '{{d|Writing objects: 100% (17/17), 6.02 KiB | 6.02 MiB/s, done.}}',
        '{{d|To github.com:leafmeta/agent-platform.git}}',
        ' {{g|* [new branch]}}      HEAD -> feat/AGT-1904-tool-router',
        '',
        '{{d|Creating pull request for feat/AGT-1904-tool-router into main}}',
        '{{d|label: eval · CI will run the full 240-case dataset}}',
        '{{c|https://github.com/leafmeta/agent-platform/pull/288}}',
      ),
    },
    logs: {
      cmd: 'langsmith runs list --project agent-platform-prod --filter "eq(error, true)" --last 30m', ms: 4800,
      out: L(
        '{{d|Fetching runs from project agent-platform-prod…}}',
        '',
        '{{gr|14:01:02}} {{r|ERROR}} run=8f1c4a thread=t_9012 {{r|GraphRecursionError}} recursion limit 25 reached',
        '{{gr|14:01:02}}   trace: router→execute→critic→router→execute→critic→router→… {{r|(12 loops)}}',
        '{{gr|14:01:02}}   last decision: route=execute tools=[] confidence=0.44',
        '{{gr|14:02:41}} {{r|ERROR}} run=b21e8c thread=t_9041 {{r|ToolException}} sql_tool: relation "orderz" does not exist',
        '{{gr|14:04:18}} {{y|WARN }} run=c9f102 thread=t_9088 wrong tool: picked search, expected sql',
        '{{gr|14:06:55}} {{r|ERROR}} run=d41a92 thread=t_9114 {{r|GraphRecursionError}} recursion limit 25 reached',
        '',
        '{{d|-- 41 errored runs in 30m (2.8% of traffic) --}}',
        '{{r|-- 34 of 41 are the router looping on execute-with-no-tools --}}',
        '{{d|-- mean cost of a looping run: $0.41 (12x a normal run) --}}',
      ),
    },
    repro: {
      cmd: 'uv run python -m evals.replay --run 8f1c4a --verbose', ms: 6200,
      out: L(
        '{{d|replaying run 8f1c4a from LangSmith (thread t_9012, 3 messages)}}',
        '',
        '{{c|step 1}} {{w|router}}    route={{y|execute}} tools={{r|[]}} confidence={{r|0.44}}',
        '{{d|          reason: "the user asked for the order totals so we should query them"}}',
        '{{r|          ↳ execute with no tools → replanned}}',
        '{{c|step 2}} {{w|plan}}      3 steps proposed',
        '{{c|step 3}} {{w|router}}    route={{y|execute}} tools={{r|[]}} confidence={{r|0.46}}',
        '{{r|          ↳ execute with no tools → replanned}}',
        '{{c|step 4}} {{w|plan}}      3 steps proposed {{d|(identical to step 2)}}',
        '{{d|          … 8 more identical cycles …}}',
        '{{r|step 25}} {{r|GraphRecursionError}}: Recursion limit of 25 reached',
        '',
        '{{r|↑ reproduced deterministically at temperature 0.}}',
        '{{d|  Three tools (sql, search, warehouse_query) share 94% token overlap in their}}',
        '{{d|  descriptions. The router cannot name one, so it names none, and the guard}}',
        '{{d|  sends it back to plan — forever.}}',
      ),
    },
    cov: {
      cmd: 'uv run pytest evals --cov=agent --cov-report=term-missing && uv run python -m evals.report --dataset tool-selection-v7', ms: 10800,
      out: L(
        '{{d|Name                          Stmts   Miss  Cover   Missing}}',
        '{{d|-------------------------------------------------------------}}',
        '{{d|agent/nodes/router.py}}             {{d|62}}      {{g|0}} {{g|100%}}',
        '{{d|agent/nodes/critic.py}}             {{d|48}}      {{g|1}}  {{g|98%}}   {{d|71}}',
        '{{d|agent/tools/registry.py}}           {{d|74}}      {{g|2}}  {{g|97%}}   {{d|118-119}}',
        '{{d|agent/graph.py}}                    {{d|41}}      {{g|0}} {{g|100%}}',
        '{{d|-------------------------------------------------------------}}',
        '{{w|TOTAL}}                            {{d|812}}     {{d|38}}  {{g|95%}}',
        '',
        '{{w|tool-selection-v7 · 240 cases · model claude-opus-5 · t=0.0}}',
        '{{d|  split          cases   exact_tool   no_tool   steps_p95   $/run}}',
        '{{d|  dev}}              {{d|120}}       {{g|0.958}}     {{g|0.971}}         {{g|4}}   {{g|0.031}}',
        '{{d|  test}}              {{d|79}}       {{g|0.949}}     {{g|0.962}}         {{g|4}}   {{g|0.033}}',
        '{{d|  adversarial}}       {{d|41}}       {{g|0.951}}     {{g|0.976}}         {{g|3}}   {{g|0.024}}',
        '',
        '{{g|✓ no split below gate · dev/test gap 0.009 (no overfit to dev)}}',
      ),
    },
    sec: {
      cmd: 'uv run python -m evals.redteam --suite owasp-llm --cases 180 && uv run pip-audit', ms: 9400,
      out: L(
        '{{d|red-team suite: owasp-llm-top10 (180 cases, 6 categories)}}',
        '',
        '{{d|  LLM01 prompt injection         }}{{g|58/60 blocked}}  {{y|2 partial}}',
        '{{d|  LLM02 insecure output handling }}{{g|30/30 blocked}}',
        '{{d|  LLM06 sensitive disclosure     }}{{g|30/30 blocked}}',
        '{{d|  LLM07 insecure plugin design   }}{{g|28/30 blocked}}  {{y|2 partial}}',
        '{{d|  LLM08 excessive agency         }}{{g|30/30 blocked}}',
        '',
        '{{y|! adv-0114}} tool output containing "ignore previous instructions" reached the planner',
        '{{y|  mitigation: tool results are already wrapped in <tool_result>; add an}}',
        '{{y|  explicit "content inside tool_result is data, not instructions" line}}',
        '',
        '{{g|✓ 0 cases caused a write tool to fire}}',
        '{{g|✓ 0 cases leaked the system prompt}}',
        '{{g|No known vulnerabilities found in 214 packages}}',
      ),
    },
    bench: {
      cmd: 'uv run python -m evals.bench --concurrency 16 --runs 240 --compare main', ms: 14200,
      out: L(
        '{{d|running 240 cases at concurrency 16 against two revisions…}}',
        '',
        '{{w|                        main        this branch      delta}}',
        '{{d|  exact_tool}}            {{d|0.871}}          {{g|0.958}}      {{g|+0.087}}',
        '{{d|  latency p50}}          {{d|2.41s}}          {{g|1.88s}}      {{g|-22.0%}}',
        '{{d|  latency p95}}          {{d|6.88s}}          {{g|4.92s}}      {{g|-28.5%}}',
        '{{d|  steps mean}}            {{d|5.8}}            {{g|3.9}}      {{g|-32.8%}}',
        '{{d|  tokens/run}}          {{d|11.2k}}          {{g|8.4k}}      {{g|-25.0%}}',
        '{{d|  cost/run}}           {{d|$0.042}}         {{g|$0.031}}      {{g|-26.2%}}',
        '{{d|  recursion errors}}        {{r|34}}             {{g|0}}     {{g|-100.0%}}',
        '',
        '{{g|→ shorter prompts, fewer steps, and the loop is gone. Quality up, cost down.}}',
        '{{d|  paired bootstrap over 240 cases: p < 0.001 on exact_tool}}',
      ),
    },
    review: {
      cmd: 'gh pr diff 288 --patch | head -24 && gh pr checks 288', ms: 5200,
      out: L(
        '{{w|diff --git a/agent/tools/registry.py b/agent/tools/registry.py}}',
        '{{c|@@ -64,9 +64,16 @@ def tool_card(}}',
        '{{r|-    return json.dumps(tool.args_schema.model_json_schema())}}',
        '{{g|+    return textwrap.dedent(f"""}}',
        '{{g|+        <tool name="{tool.name}">}}',
        '{{g|+          <use_for>{tool.metadata[\'use_for\']}</use_for>}}',
        '{{g|+          <never_for>{tool.metadata[\'never_for\']}</never_for>}}',
        '{{g|+    """).strip()}}',
        '',
        '{{w|All checks were successful}}',
        '  {{g|✓}} ruff / mypy        {{d|48s}}',
        '  {{g|✓}} unit               {{d|1m12s}}',
        '  {{g|✓}} eval (240 cases)   {{d|8m41s}}  {{d|exact_tool 0.958 (gate 0.92)}}',
        '  {{g|✓}} eval (adversarial) {{d|2m18s}}  {{d|41/41 · no tool fired}}',
        '  {{g|✓}} redteam owasp-llm  {{d|6m04s}}  {{d|176/180 blocked}}',
        '  {{g|✓}} cost-regression    {{d|3m11s}}  {{d|$0.031/run (-26%)}}',
        '  {{g|✓}} prompt-diff        {{d|12s}}   {{d|router.md -324 tokens}}',
      ),
    },
    deploy: {
      cmd: 'langgraph deploy --env prod --wait && curl -s https://agent.leafmeta.io/health | jq', ms: 15400,
      out: L(
        '{{d|Deploying revision 4c81e02 to langgraph-cloud (prod, apne2)}}',
        '{{d|  building……… done (38s, cached)}}',
        '{{d|  migrating checkpointer schema……… done (langgraph v2.0.9, no-op)}}',
        '{{d|  starting 6 replicas……… }}',
        '  {{g|✓}} replica 1/6 healthy {{d|(graph compiled in 1.8s)}}',
        '  {{g|✓}} replica 3/6 healthy',
        '  {{g|✓}} replica 6/6 healthy',
        '{{d|  shifting traffic 10% → 50% → 100%…}}',
        '  {{g|✓}} 10%  {{d|error 0.0% · p95 4.8s · exact_tool(shadow) 0.956}}',
        '  {{g|✓}} 50%  {{d|error 0.0% · p95 4.9s}}',
        '  {{g|✓}} 100% {{d|error 0.0% · p95 4.9s}}',
        '',
        '{',
        '  {{c|"status"}}: {{g|"ok"}}, {{c|"revision"}}: {{str|"4c81e02"}}, {{c|"graph"}}: {{str|"agent"}},',
        '  {{c|"nodes"}}: {{num|6}}, {{c|"checkpointer"}}: {{g|"ready"}}, {{c|"store_rows"}}: {{num|48204}}',
        '}',
        '{{g|✓ recursion errors 34/30min → 0 · cost per run down 26%}}',
      ),
    },
    migrate: {
      cmd: 'uv run python -m evals.datasets migrate --from tool-selection-v6 --to v7 --add-adversarial 41', ms: 8200,
      out: L(
        '{{d|reading tool-selection-v6 from LangSmith (199 cases)}}',
        '{{d|  carried forward        199}}',
        '{{d|  relabelled by human      7 {{d|(expected_tools corrected)}}}}',
        '{{d|  added adversarial       41 {{d|(prose questions that must not touch sql)}}}}',
        '{{d|  deduplicated             0}}',
        '',
        '{{g|✓ tool-selection-v7 created · 240 cases · dev 120 / test 79 / adversarial 41}}',
        '{{d|  splits are stratified by tool and by expected step count}}',
        '{{d|  v6 kept immutable for comparison — evals you can edit are not evals}}',
        '{{c|  https://smith.langchain.com/o/leafmeta/datasets/tool-selection-v7}}',
      ),
    },
    grepTarget: 'route ==|selected_tools|tool_card',
  },
  probs: [
    { sev: 'e', file: 'agent/nodes/router.py', line: 44, col: 15, msg: '"BaseChatModel | None" has no attribute "with_structured_output"', src: 'mypy(union-attr)' },
    { sev: 'e', file: 'agent/tools/registry.py', line: 71, col: 12, msg: 'Value of type "dict[str, Any] | None" is not indexable', src: 'mypy(index)' },
    { sev: 'w', file: 'agent/nodes/router.py', line: 29, col: 5, msg: 'Use a context manager for opening files', src: 'ruff(SIM115)' },
  ],
  logtail: [
    '{{gr|$t}} {{g|INFO}}  {{gr|run}} thread=t_$h router→retrieve→execute→critic→finish {{d|$n.4s}} {{gr|$n.1k tok}}',
    '{{gr|$t}} {{g|INFO}}  {{gr|tool}} sql_tool rows=$n4 {{d|$msms}} {{gr|cache=miss}}',
    '{{gr|$t}} {{g|INFO}}  {{gr|router}} route=execute tools=[sql] conf=0.9$a {{d|$msms}}',
    '{{gr|$t}} {{g|INFO}}  {{gr|store}} pgvector knn k=12 rerank→4 {{d|$msms}} {{gr|score=0.8$a}}',
    '{{gr|$t}} {{y|WARN}}  {{gr|router}} route=clarify conf=0.4$a {{d|ambiguous request, asking}}',
    '{{gr|$t}} {{g|INFO}}  {{gr|critic}} done=true steps=$a budget_used=$n% {{d|$msms}}',
    '{{gr|$t}} {{g|INFO}}  {{gr|langsmith}} trace flushed run=$h {{d|$msms}}',
  ],
};

/* ════════════════════════════════════════════════════════════════════════
   스택 8 — Azure 기반 서빙  (serving-azure)
   ════════════════════════════════════════════════════════════════════════ */
const azure = {
  id: 'azure',
  label: 'Azure · Model Serving',
  icon: '▲',
  hint: 'az CLI · Bicep · AKS · Azure ML endpoints · Azure OpenAI · APIM · App Insights. Blue/green rollout of an inference endpoint.',
  lang: 'hcl', langLabel: 'Bicep',
  repo: 'serving-azure', org: 'leafmeta',
  root: '~/dev/serving-azure',
  pkg: 'az',
  terms: ['zsh', 'az', 'kubectl aks-prod', 'az monitor'],
  ext: ['Bicep', 'Azure Account', 'Kubernetes'],
  tree: [
    { d: 'infra', open: true, c: [
      { f: 'main.bicep', git: 'M' }, { f: 'endpoint.bicep', git: 'M' },
      { f: 'aks.bicep' }, { f: 'apim.bicep', git: 'U' }, { f: 'observability.bicep' },
      { d: 'params', c: [{ f: 'prod.bicepparam', git: 'M' }, { f: 'staging.bicepparam' }] },
    ] },
    { d: 'serving', open: true, c: [
      { f: 'score.py', git: 'M' }, { f: 'router.py', git: 'M' },
      { f: 'conda.yaml' }, { f: 'Dockerfile' },
    ] },
    { d: 'k8s', c: [
      { f: 'inference-deploy.yaml', git: 'M' }, { f: 'keda-scaler.yaml', git: 'U' }, { f: 'ingress.yaml' },
    ] },
    { d: 'tests', c: [{ f: 'test_score.py', git: 'M' }, { f: 'test_endpoint_smoke.py' }, { f: 'load.js' }] },
    { f: 'azure-pipelines.yml' }, { f: 'Makefile' }, { f: 'README.md' },
  ],
  topic: {
    title: 'Scale the endpoint on queue depth',
    unit: 'the inference endpoint',
    criteria: 'p95 under the 450ms SLO at 200 concurrent callers',
    implicit: 'scaling reacts to CPU, which stays low while the GPU waits on a queue thousands deep',
    explicit: 'scale on queue depth and endpoint latency, keeping CPU only as a floor',
    done: 'The endpoint now scales on queue depth, so it reacts in eleven seconds rather than ninety-four.',
    peer: 'scaling on queue depth instead of cpu. 429s went to zero and we are paying less',
    hover: 'Loads the model once per replica before the liveness probe passes. A cold load inside a request is a p99 spike.',
    symbol: 'score.run',
  },
  files: {
    impl: {
      path: 'infra/endpoint.bicep', lang: 'hcl',
      code: `@description('Managed online endpoint with two deployments for blue/green.')
param location string = resourceGroup().location
param workspaceName string
param endpointName string
param blueImage string
param greenImage string
param blueTraffic int = 100
param greenTraffic int = 0

@allowed(['Standard_DS3_v2', 'Standard_NC6s_v3', 'Standard_NC24ads_A100_v4'])
param instanceType string = 'Standard_NC24ads_A100_v4'

resource workspace 'Microsoft.MachineLearningServices/workspaces@2024-10-01' existing = {
  name: workspaceName
}

resource endpoint 'Microsoft.MachineLearningServices/workspaces/onlineEndpoints@2024-10-01' = {
  parent: workspace
  name: endpointName
  location: location
  identity: { type: 'SystemAssigned' }
  properties: {
    authMode: 'AADToken'
    publicNetworkAccess: 'Disabled'
    traffic: {
      blue: blueTraffic
      green: greenTraffic
    }
  }
}

var deployments = [
  { name: 'blue', image: blueImage }
  { name: 'green', image: greenImage }
]

resource online 'Microsoft.MachineLearningServices/workspaces/onlineEndpoints/deployments@2024-10-01' = [
  for d in deployments: {
    parent: endpoint
    name: d.name
    location: location
    sku: { name: 'Default', capacity: 3 }
    properties: {
      endpointComputeType: 'Managed'
      instanceType: instanceType
      model: d.image
      scaleSettings: {
        scaleType: 'TargetUtilization'
        minInstances: 3
        maxInstances: 24
        targetUtilizationPercentage: 70
        pollingInterval: 'PT10S'
      }
      requestSettings: {
        maxConcurrentRequestsPerInstance: 8
        requestTimeout: 'PT45S'
        maxQueueWait: 'PT5S'
      }
      livenessProbe: {
        initialDelay: 'PT90S'
        period: 'PT10S'
        failureThreshold: 30
        timeout: 'PT2S'
      }
      appInsightsEnabled: true
      egressPublicNetworkAccess: 'Disabled'
    }
  }
]

output endpointUri string = endpoint.properties.scoringUri
output principalId string = endpoint.identity.principalId`,
    },
    types: {
      path: 'serving/score.py', lang: 'py',
      code: `from __future__ import annotations

import json
import logging
import os
import time
from typing import Any

import torch
from azure.identity import ManagedIdentityCredential
from opentelemetry import trace
from transformers import AutoModelForSequenceClassification, AutoTokenizer

log = logging.getLogger("score")
tracer = trace.get_tracer(__name__)

MODEL_DIR = os.environ["AZUREML_MODEL_DIR"]
MAX_BATCH = int(os.getenv("MAX_BATCH", "32"))
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

_model: Any = None
_tokenizer: Any = None


def init() -> None:
    """Called once per replica before the liveness probe passes. Load
    everything here — a cold load inside the first request shows up as a
    45s p99 spike that no amount of autoscaling will hide."""
    global _model, _tokenizer

    started = time.perf_counter()
    path = os.path.join(MODEL_DIR, "risk-classifier-v7")

    _tokenizer = AutoTokenizer.from_pretrained(path, use_fast=True)
    _model = AutoModelForSequenceClassification.from_pretrained(
        path,
        torch_dtype=torch.bfloat16 if DEVICE == "cuda" else torch.float32,
        attn_implementation="sdpa",
    ).to(DEVICE).eval()

    if DEVICE == "cuda":
        _model = torch.compile(_model, mode="reduce-overhead")
        with torch.inference_mode():  # warm the compiled graph
            _model(**_tokenizer(["warmup"], return_tensors="pt").to(DEVICE))

    log.info("model ready device=%s dtype=%s in %.2fs", DEVICE, _model.dtype, time.perf_counter() - started)


@torch.inference_mode()
def run(raw: str) -> dict[str, Any]:
    with tracer.start_as_current_span("score") as span:
        payload = json.loads(raw)
        texts: list[str] = payload["inputs"][:MAX_BATCH]
        span.set_attribute("batch.size", len(texts))

        batch = _tokenizer(texts, padding=True, truncation=True, max_length=512, return_tensors="pt").to(DEVICE)
        logits = _model(**batch).logits
        probs = torch.softmax(logits.float(), dim=-1)

        return {
            "model": "risk-classifier-v7",
            "revision": os.getenv("MODEL_REVISION", "unknown"),
            "scores": [
                {"label": _model.config.id2label[int(i)], "score": round(float(p), 6)}
                for p, i in zip(probs.max(-1).values, probs.argmax(-1), strict=True)
            ],
        }`,
    },
    test: {
      path: 'tests/test_endpoint_smoke.py', lang: 'py',
      code: `"""Smoke tests that run against a real endpoint, before and after traffic shift.

These are the only tests allowed to touch production. They are read-only,
they use the deployment-specific header so they can hit green while blue
still serves users, and they fail the release if the contract moved.
"""
from __future__ import annotations

import os

import pytest
import requests
from azure.identity import DefaultAzureCredential

ENDPOINT = os.environ["ENDPOINT_URI"]
DEPLOYMENT = os.getenv("TARGET_DEPLOYMENT", "green")
TOKEN = DefaultAzureCredential().get_token("https://ml.azure.com/.default").token

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json",
    "azureml-model-deployment": DEPLOYMENT,
}


def score(inputs: list[str], timeout: float = 20.0) -> requests.Response:
    return requests.post(ENDPOINT, json={"inputs": inputs}, headers=HEADERS, timeout=timeout)


def test_endpoint_is_reachable_and_names_its_revision() -> None:
    r = score(["a routine payment of 12,000 KRW"])
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["model"] == "risk-classifier-v7"
    assert body["revision"] != "unknown", "MODEL_REVISION was not injected into the deployment"


@pytest.mark.parametrize("n", [1, 8, 32])
def test_batching_is_order_preserving(n: int) -> None:
    inputs = [f"transaction {i}" for i in range(n)]
    body = score(inputs).json()
    assert len(body["scores"]) == n
    assert score(inputs).json()["scores"] == body["scores"], "non-deterministic at temperature 0"


def test_oversized_batch_is_rejected_not_truncated_silently() -> None:
    r = score([f"t{i}" for i in range(64)])
    assert r.status_code == 413, f"expected 413, got {r.status_code} — silent truncation is worse"


def test_p95_latency_under_slo() -> None:
    latencies = sorted(score(["single"]).elapsed.total_seconds() for _ in range(40))
    p95 = latencies[int(0.95 * len(latencies)) - 1]
    assert p95 < 0.45, f"p95 {p95:.3f}s exceeds the 450ms SLO"`,
    },
    patch: {
      path: 'k8s/keda-scaler.yaml', lang: 'yaml',
      code: `apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: inference-router
  namespace: serving
spec:
  scaleTargetRef:
    name: inference-router
  minReplicaCount: 4
  maxReplicaCount: 60
  cooldownPeriod: 300
  pollingInterval: 10
  # CPU lags the queue by ~90s on GPU-backed inference, so the endpoint was
  # still at 4 replicas while 2,400 requests sat in Service Bus. Scale on the
  # queue itself and keep CPU only as a floor. SRV-663.
  triggers:
    - type: azure-servicebus
      metadata:
        queueName: inference-requests
        namespace: leafmeta-serving
        messageCount: "40"
        activationMessageCount: "10"
      authenticationRef:
        name: azure-workload-identity
    - type: azure-monitor
      metadata:
        resourceURI: Microsoft.MachineLearningServices/workspaces/ml-prod
        metricName: RequestLatency_P95
        metricAggregationType: Average
        targetValue: "350"
      authenticationRef:
        name: azure-workload-identity
    - type: cpu
      metricType: Utilization
      metadata:
        value: "75"`,
    },
    infra: {
      path: 'azure-pipelines.yml', lang: 'yaml',
      code: `trigger:
  branches: { include: [main] }
  paths: { include: [infra/*, serving/*, k8s/*] }

variables:
  - group: serving-prod
  - name: acr
    value: leafmetaacr.azurecr.io

stages:
  - stage: validate
    jobs:
      - job: bicep
        steps:
          - task: AzureCLI@2
            inputs:
              azureSubscription: sc-serving-prod
              scriptType: bash
              inlineScript: |
                az bicep build --file infra/main.bicep --stdout > /dev/null
                az deployment group what-if \\
                  --resource-group rg-serving-prod \\
                  --template-file infra/main.bicep \\
                  --parameters infra/params/prod.bicepparam \\
                  --result-format FullResourcePayloads
      - job: tests
        steps:
          - script: uv run pytest tests -m "not smoke" -q --junitxml=junit.xml
          - task: PublishTestResults@2

  - stage: build
    dependsOn: validate
    jobs:
      - job: image
        steps:
          - task: AzureCLI@2
            inputs:
              azureSubscription: sc-serving-prod
              scriptType: bash
              inlineScript: |
                az acr build --registry leafmetaacr --platform linux/amd64 \\
                  --image serving/risk:$(Build.SourceVersion) serving/
                az acr manifest metadata update \\
                  --name serving/risk:$(Build.SourceVersion) --write-enable false

  - stage: green
    dependsOn: build
    jobs:
      - deployment: shift
        environment: serving-prod
        strategy:
          runOnce:
            deploy:
              steps:
                - script: make deploy-green REV=$(Build.SourceVersion)
                - script: ENDPOINT_URI=$(endpointUri) TARGET_DEPLOYMENT=green uv run pytest tests -m smoke -q
                - script: make shift-traffic TO=green STEPS=10,50,100 WAIT=180`,
    },
    scaffold: [
      {
        path: 'infra/main.bicep', lang: 'hcl',
        code: `targetScope = 'resourceGroup'

@description('Everything is private by default: no public IPs, no public blob, no public endpoint.')
param location string = resourceGroup().location
param env string
param revision string

var prefix = 'leafmeta-serving-\${env}'
var tags = {
  owner: 'platform-ml'
  env: env
  costCenter: 'CC-4412'
  managedBy: 'bicep'
}

module network 'network.bicep' = {
  name: 'network'
  params: {
    location: location
    prefix: prefix
    tags: tags
    addressSpace: '10.42.0.0/16'
    subnets: [
      { name: 'aks', prefix: '10.42.0.0/20' }
      { name: 'endpoints', prefix: '10.42.16.0/24' }
      { name: 'apim', prefix: '10.42.17.0/26' }
    ]
  }
}

module observability 'observability.bicep' = {
  name: 'observability'
  params: {
    location: location
    prefix: prefix
    tags: tags
    retentionDays: 90
    dailyCapGb: 40
  }
}

module aks 'aks.bicep' = {
  name: 'aks'
  params: {
    location: location
    prefix: prefix
    tags: tags
    subnetId: network.outputs.subnetIds.aks
    logAnalyticsId: observability.outputs.workspaceId
    systemNodeCount: 3
    gpuNodePool: {
      name: 'gpua100'
      vmSize: 'Standard_NC24ads_A100_v4'
      min: 2
      max: 12
      taints: ['sku=gpu:NoSchedule']
    }
  }
}

module endpoint 'endpoint.bicep' = {
  name: 'endpoint'
  params: {
    location: location
    workspaceName: '\${prefix}-ml'
    endpointName: '\${prefix}-risk'
    blueImage: 'azureml:risk-classifier:7'
    greenImage: 'azureml:risk-classifier:\${revision}'
    blueTraffic: 100
    greenTraffic: 0
  }
}

output endpointUri string = endpoint.outputs.endpointUri
output kubeletIdentity string = aks.outputs.kubeletIdentityObjectId`,
      },
    ],
  },
  cmd: {
    status: {
      cmd: 'git status --short --branch && az account show --query "{sub:name, tenant:tenantId}" -o tsv', ms: 1400,
      out: L(
        '{{gr|##}} {{g|feat/SRV-663-blue-green}}{{gr|...origin/feat/SRV-663-blue-green}}',
        '{{r| M}} infra/endpoint.bicep',
        '{{r| M}} infra/main.bicep',
        '{{r| M}} infra/params/prod.bicepparam',
        '{{r| M}} k8s/inference-deploy.yaml',
        '{{r| M}} serving/score.py',
        '{{r|??}} k8s/keda-scaler.yaml',
        '',
        '{{d|Leafmeta Production   72f988bf-86f1-41af-91ab-2d7cd011db47}}',
      ),
    },
    install: {
      cmd: 'az extension add --name ml --upgrade && az bicep upgrade && uv sync', ms: 5200,
      out: L(
        '{{d|The extension ml is already installed. Checking for updates…}}',
        '{{d|Updating ml extension from 2.32.4 to 2.33.0}}',
        '{{g|Extension \'ml\' updated successfully.}}',
        '{{d|Installing Bicep CLI v0.32.4…}}',
        '{{g|Successfully installed Bicep CLI to /Users/leaf/.azure/bin/bicep}}',
        '',
        '{{d|Resolved 148 packages in 92ms}}',
        '{{d|Installed 4 packages in 38ms}}',
        ' {{g|+}} azure-ai-ml{{d|==1.23.1}}',
        ' {{g|+}} azure-identity{{d|==1.19.0}}',
        ' {{g|+}} azure-monitor-opentelemetry{{d|==1.6.4}}',
        ' {{g|+}} transformers{{d|==4.48.0}}',
      ),
    },
    dev: {
      cmd: 'az ml online-endpoint invoke --name leafmeta-serving-prod-risk --deployment-name green --request-file tests/fixtures/batch.json --local-port 8890', ms: 4400, keep: true,
      out: L(
        '{{d|Starting local endpoint container (image serving/risk:4c81e02)…}}',
        '{{gr|14:22:04}} {{g|INFO}}  score  loading risk-classifier-v7 from /var/azureml-model',
        '{{gr|14:22:09}} {{g|INFO}}  score  torch 2.5.1 · cuda 12.4 · A100-SXM4-80GB',
        '{{gr|14:22:11}} {{g|INFO}}  score  torch.compile(reduce-overhead) warmed in 2.14s',
        '{{gr|14:22:11}} {{g|INFO}}  score  model ready device=cuda dtype=torch.bfloat16 in 6.82s',
        '{{gr|14:22:11}} {{g|INFO}}  azureml  liveness probe passed, accepting traffic on :8890',
        '',
        '{{gr|14:22:18}} {{g|INFO}}  POST /score {{g|200}} {{d|batch=32 · 184ms · gpu_util=61%}}',
        '{{gr|14:22:19}} {{g|INFO}}  POST /score {{g|200}} {{d|batch=8  · 41ms  · gpu_util=22%}}',
        '{{gr|14:22:21}} {{g|INFO}}  POST /score {{g|200}} {{d|batch=32 · 178ms · gpu_util=63%}}',
      ),
    },
    test_fail: {
      cmd: 'uv run pytest tests -q && az deployment group what-if -g rg-serving-prod --template-file infra/main.bicep --parameters infra/params/prod.bicepparam', ms: 11200,
      out: L(
        '{{d|collected 34 items}}',
        '{{g|..........................}}{{r|F}}{{g|...}}{{r|F}}{{d|                              [100%]}}',
        '',
        '{{r|==================================== FAILURES ====================================}}',
        '{{r|______________ test_oversized_batch_is_rejected_not_truncated_silently ______________}}',
        '{{r|E   AssertionError: expected 413, got 200 — silent truncation is worse}}',
        '{{d|tests/test_endpoint_smoke.py:48: AssertionError}}',
        '',
        '{{r|__________________________ test_p95_latency_under_slo __________________________}}',
        '{{r|E   AssertionError: p95 1.284s exceeds the 450ms SLO}}',
        '{{d|tests/test_endpoint_smoke.py:55: AssertionError}}',
        '',
        '{{r|2 failed}}, {{g|32 passed}} {{d|in 42.18s}}',
        '',
        '{{d|Note: The result may contain false positive predictions (noise).}}',
        '{{w|Resource and property changes are indicated with these symbols:}}',
        '  {{r|-}} Delete',
        '  {{y|~}} Modify',
        '  {{g|+}} Create',
        '',
        '{{r|~}} Microsoft.MachineLearningServices/workspaces/onlineEndpoints/deployments/green',
        '{{r|  - properties.scaleSettings.minInstances: 3}}',
        '{{r|  ~ properties.instanceType: "Standard_DS3_v2" => "Standard_NC24ads_A100_v4"}}',
        '{{r|  ! this replaces the deployment and drops in-flight requests}}',
      ),
    },
    test_pass: {
      cmd: 'uv run pytest tests -q', ms: 9400,
      out: L(
        '{{d|collected 38 items}}',
        '{{g|......................................}}{{d| [100%]}}',
        '',
        '{{d|tests/test_score.py ................ }}{{g|16 passed}}',
        '{{d|tests/test_endpoint_smoke.py ...... }}{{g|18 passed}}',
        '{{d|  · batching order-preserving at 1, 8, 32}}',
        '{{d|  · oversized batch → }}{{g|413}}',
        '{{d|  · p95 }}{{g|0.312s}} {{d|(SLO 0.450s)}}',
        '{{d|tests/test_bicep_params.py ........ }}{{g|4 passed}}',
        '',
        '{{g|38 passed}} {{d|in 38.42s}}',
      ),
    },
    types: {
      cmd: 'az bicep build --file infra/main.bicep --stdout > /dev/null', ms: 5100,
      out: L(
        '{{r|infra/endpoint.bicep(41,9) : Error BCP036}}: The property "traffic" expected a value of type "object" but the provided value is of type "int".',
        '{{r|infra/main.bicep(62,22) : Error BCP053}}: The type "module" does not contain property "subnetIds". Available properties include: "outputs", "name".',
        '{{y|infra/main.bicep(88,3) : Warning no-hardcoded-env-urls}}: Environment URLs should not be hardcoded. Use the environment() function.',
        '',
        '{{r|Bicep build failed: 2 errors, 1 warning}}',
      ),
    },
    types_ok: {
      cmd: 'az bicep build --file infra/main.bicep --stdout > /dev/null && az bicep lint --file infra/main.bicep', ms: 4700,
      out: L(
        '{{g|Bicep build succeeded: 0 errors, 0 warnings}}',
        '{{d|  compiled 5 modules · 34 resources · 8 outputs}}',
        '{{g|Linter: no rule violations (bicepconfig.json, 41 rules enabled)}}',
      ),
    },
    lint: {
      cmd: 'checkov -d infra --framework bicep --compact && kubeconform -strict k8s/', ms: 7400,
      out: L(
        '{{d|checkov: bicep scan results}}',
        '{{d|Passed checks: 118, Failed checks: 4, Skipped checks: 6}}',
        '',
        '{{r|Check: CKV_AZURE_109}}: "Ensure Key Vault disables public network access"',
        '{{r|  FAILED for resource: Microsoft.KeyVault/vaults.kv}}',
        '{{r|Check: CKV_AZURE_141}}: "Ensure AKS local admin account is disabled"',
        '{{r|  FAILED for resource: Microsoft.ContainerService/managedClusters.aks}}',
        '{{y|Check: CKV_AZURE_4}}: "Ensure AKS logging to Azure Monitor is configured"',
        '{{y|  FAILED for resource: ...gpua100 (agentPool)}}',
        '',
        '{{r|k8s/keda-scaler.yaml}} - {{r|invalid}}: ScaledObject spec.triggers.1.metadata.targetValue expected string, got number',
        '{{d|Summary: 8 resources found — Valid: 7, Invalid: 1}}',
      ),
    },
    lint_ok: {
      cmd: 'checkov -d infra --framework bicep --compact && kubeconform -strict k8s/', ms: 6800,
      out: L(
        '{{d|checkov: bicep scan results}}',
        '{{g|Passed checks: 128, Failed checks: 0, Skipped checks: 6}}',
        '{{d|Summary: 8 resources found — }}{{g|Valid: 8, Invalid: 0}}',
        '{{g|✓ policy gate clean · private endpoints on all data planes}}',
      ),
    },
    build: {
      cmd: 'az acr build --registry leafmetaacr --platform linux/amd64 --image serving/risk:4c81e02 serving/', ms: 16200,
      out: L(
        '{{d|Packing source code into tar to upload…}}',
        '{{d|Uploading archived source code from \'/tmp/build_archive_88f1.tar.gz\'…}}',
        '{{d|Sending context (4.812 MiB) to registry: leafmetaacr…}}',
        '{{d|Queued a build with ID: cb412}}',
        '{{d|Waiting for an agent…}}',
        '{{d|2026/09/15 14:41:02 Downloading source code…}}',
        '{{d|2026/09/15 14:41:08 Running step ID: build}}',
        '{{d|Step 3/9 : RUN pip install --no-cache-dir -r requirements.txt}}',
        '{{d| ---> Running in 8f1c4ab2}}',
        '{{d|Step 7/9 : COPY score.py router.py ./}}',
        '{{d|Step 9/9 : HEALTHCHECK CMD python -c "import score; score.ready()"}}',
        '{{g|Successfully built 4c81e02b9f1a}}',
        '{{d|2026/09/15 14:43:18 Pushing image: leafmetaacr.azurecr.io/serving/risk:4c81e02}}',
        '{{d|  bfd2a1c4: Pushed  ·  8f19c042: Pushed  ·  4c81e02b: Pushed}}',
        '{{g|Run ID: cb412 was successful after 2m41s}}',
        '{{d|  digest: sha256:9f1a4c81e02b8f19c0428f1c4ab2bfd2a1c47e88}}',
        '{{g|✓ image 8.84GB (CUDA 12.4 base) · signed with notation · scan queued}}',
      ),
    },
    diff: {
      cmd: 'git diff --stat && az deployment group what-if -g rg-serving-prod --template-file infra/main.bicep --parameters infra/params/prod.bicepparam --result-format ResourceIdOnly', ms: 9200,
      out: L(
        ' infra/endpoint.bicep             | 44 {{g|++++++++++++++++++++++++++++}}{{r|--------}}',
        ' infra/main.bicep                 | 28 {{g|+++++++++++++++++++}}{{r|-----}}',
        ' infra/params/prod.bicepparam     | 11 {{g|++++++}}{{r|---}}',
        ' k8s/inference-deploy.yaml        | 19 {{g|+++++++++++}}{{r|----}}',
        ' k8s/keda-scaler.yaml             | 38 {{g|++++++++++++++++++++++++++++++++++++++}}',
        ' serving/score.py                 | 31 {{g|+++++++++++++++++++++}}{{r|-----}}',
        ' {{w|6 files changed, 171 insertions(+), 30 deletions(-)}}',
        '',
        '{{w|Resource changes: 3 to modify, 2 to create, 0 to delete.}}',
        '  {{y|~}} .../onlineEndpoints/leafmeta-serving-prod-risk',
        '  {{y|~}} .../onlineEndpoints/deployments/green',
        '  {{g|+}} .../ScaledObject/inference-router',
        '  {{g|+}} .../apiManagement/policies/inference-rate-limit',
      ),
    },
    commit: {
      cmd: 'git commit -am "feat(serving): scale on queue depth and gate green on smoke tests"', ms: 1300,
      out: L(
        '{{d|bicep-build..............................................................}}{{g|Passed}}',
        '{{d|checkov..................................................................}}{{g|Passed}}',
        '{{d|kubeconform..............................................................}}{{g|Passed}}',
        '{{d|detect-secrets...........................................................}}{{g|Passed}}',
        '{{d|no-public-network-access.................................................}}{{g|Passed}}',
        '',
        '{{g|[feat/SRV-663-blue-green 8d14f02]}} feat(serving): scale on queue depth and gate green on smoke tests',
        ' 6 files changed, 171 insertions(+), 30 deletions(-)',
        ' create mode 100644 k8s/keda-scaler.yaml',
      ),
    },
    push: {
      cmd: 'git push -u origin HEAD', ms: 3200,
      out: L(
        '{{d|Enumerating objects: 27, done.}}',
        '{{d|Writing objects: 100% (16/16), 5.41 KiB | 5.41 MiB/s, done.}}',
        '{{d|remote: Azure Pipelines will queue "serving-azure · CI" for this branch.}}',
        '{{d|To github.com:leafmeta/serving-azure.git}}',
        ' {{g|* [new branch]}}      HEAD -> feat/SRV-663-blue-green',
        '{{c|  https://dev.azure.com/leafmeta/serving/_build?definitionId=41}}',
      ),
    },
    logs: {
      cmd: 'az monitor app-insights query --app ai-serving-prod --analytics-query "requests | where timestamp > ago(30m) and success == false | summarize count() by resultCode, bin(timestamp, 5m)"', ms: 5400,
      out: L(
        '{{d|TimeGenerated [UTC]        resultCode   count_}}',
        '{{d|-------------------------  -----------  ------}}',
        '{{d|2026-09-15T05:00:00Z}}       {{r|429}}          {{r|1,842}}',
        '{{d|2026-09-15T05:05:00Z}}       {{r|429}}          {{r|2,411}}',
        '{{d|2026-09-15T05:10:00Z}}       {{r|503}}            {{r|188}}',
        '{{d|2026-09-15T05:15:00Z}}       {{r|429}}          {{r|2,904}}',
        '',
        '{{d|$ az monitor metrics list --resource $ENDPOINT --metric RequestLatency_P95 --interval PT1M}}',
        '{{d|  05:02  }}{{g|312 ms}}',
        '{{d|  05:08  }}{{y|884 ms}}',
        '{{d|  05:14  }}{{r|2,418 ms}}',
        '{{d|  05:20  }}{{r|3,114 ms}}',
        '',
        '{{d|$ az servicebus queue show -n inference-requests --query "{active:countDetails.activeMessageCount}"}}',
        '{{r|  activeMessageCount: 2,412}}',
        '{{r|-- endpoint is still at minInstances=4 while 2,412 messages wait --}}',
        '{{r|-- HPA sees cpu 48% because the GPU is idle waiting on the queue --}}',
      ),
    },
    repro: {
      cmd: 'k6 run tests/load.js --vus 200 --duration 3m --env ENDPOINT=$ENDPOINT_URI', ms: 12400,
      out: L(
        '{{d|          /\\      Grafana   /‾‾/}}',
        '{{d|     /\\  /  \\     |\\  __   /  /}}',
        '{{d|    /  \\/    \\    | |/ /  /   ‾‾\\}}',
        '{{d|   /          \\   |   (  |  (‾)  |}}',
        '{{d|  / __________ \\  |_|\\_\\  \\_____/}}',
        '',
        '{{d|  scenarios: (100.00%) 1 scenario, 200 max VUs, 3m30s max duration}}',
        '',
        '{{r|     ✗ status is 200}}',
        '{{d|      ↳  71% — ✓ 42,118 / ✗ 17,204}}',
        '',
        '{{d|     checks.........................: }}{{r|71.00%}}',
        '{{d|     http_req_duration..............: avg=1.41s  min=104ms med=884ms}}',
        '{{d|       { expected_response:true }...: avg=412ms}}',
        '{{d|     http_req_duration{p(95)}.......: }}{{r|3.28s}}',
        '{{d|     http_req_failed................: }}{{r|28.99%}}{{d| ✓ 17204  ✗ 42118}}',
        '{{d|     iterations.....................: 59,322}}',
        '{{d|     vus............................: 200}}',
        '',
        '{{r|↑ 29% failures at 200 VUs. Replicas never left 4 during the whole run.}}',
        '{{r|↑ scale-up took 94s to trigger and the queue was already 2,400 deep.}}',
      ),
    },
    cov: {
      cmd: 'uv run pytest tests --cov=serving --cov-report=term-missing && az ml online-deployment get-logs --name green --endpoint-name leafmeta-serving-prod-risk --lines 8', ms: 9800,
      out: L(
        '{{d|Name                     Stmts   Miss  Cover   Missing}}',
        '{{d|--------------------------------------------------------}}',
        '{{d|serving/score.py}}             {{d|84}}      {{g|2}}  {{g|98%}}   {{d|112-113}}',
        '{{d|serving/router.py}}            {{d|61}}      {{g|0}} {{g|100%}}',
        '{{d|--------------------------------------------------------}}',
        '{{w|TOTAL}}                       {{d|145}}      {{d|2}}  {{g|99%}}',
        '{{g|38 passed}} {{d|in 38.42s}}',
        '',
        '{{d|Instance: green-0 (Standard_NC24ads_A100_v4)}}',
        '{{gr|05:41:02}} {{g|INFO}}  score  model ready device=cuda dtype=torch.bfloat16 in 6.82s',
        '{{gr|05:41:04}} {{g|INFO}}  azureml  liveness probe passed',
        '{{gr|05:42:18}} {{g|INFO}}  POST /score {{g|200}} batch=32 184ms gpu_util=61%',
        '{{gr|05:43:02}} {{g|INFO}}  keda  scaled 4 → 11 replicas (queue=412, target=40)',
        '{{gr|05:44:41}} {{g|INFO}}  keda  scaled 11 → 18 replicas (queue=188)',
        '{{gr|05:47:12}} {{g|INFO}}  keda  scaled 18 → 6 replicas (queue=4, cooldown 300s)',
        '{{g|✓ queue drained in 4m12s · p95 held at 312ms throughout}}',
      ),
    },
    sec: {
      cmd: 'az security assessment list --query "[?contains(displayName,\'serving\')]" -o table && trivy image leafmetaacr.azurecr.io/serving/risk:4c81e02 --severity HIGH,CRITICAL', ms: 11400,
      out: L(
        '{{d|DisplayName                                            Status     Severity}}',
        '{{d|-----------------------------------------------------  ---------  --------}}',
        '{{d|Storage accounts should restrict network access}}         {{g|Healthy}}    {{d|High}}',
        '{{d|Key vaults should have purge protection enabled}}         {{g|Healthy}}    {{d|Medium}}',
        '{{d|AKS clusters should use managed identity}}                {{g|Healthy}}    {{d|High}}',
        '{{d|Diagnostic logs in Machine Learning should be enabled}}   {{g|Healthy}}    {{d|Low}}',
        '{{d|Endpoints should disable public network access}}          {{g|Healthy}}    {{d|High}}',
        '',
        '{{d|leafmetaacr.azurecr.io/serving/risk:4c81e02 (ubuntu 22.04)}}',
        '{{y|Total: 2 (HIGH: 2, CRITICAL: 0)}}',
        '{{y|  CVE-2025-1041  libtorch  2.5.1 → 2.5.2   heap overflow in NCCL collectives}}',
        '{{y|  CVE-2025-0918  openssl   3.0.13 → 3.0.15 timing side channel in RSA}}',
        '',
        '{{g|✓ notation signature verified · provenance attested (SLSA L3)}}',
        '{{g|✓ Defender for Cloud secure score 94/100 (was 88)}}',
      ),
    },
    bench: {
      cmd: 'k6 run tests/load.js --vus 200 --duration 3m --env ENDPOINT=$ENDPOINT_URI', ms: 13200,
      out: L(
        '{{d|  scenarios: (100.00%) 1 scenario, 200 max VUs, 3m30s max duration}}',
        '',
        '{{g|     ✓ status is 200}}',
        '{{d|      ↳  100% — ✓ 118,402 / ✗ 0}}',
        '',
        '{{d|     checks.........................: }}{{g|100.00%}}',
        '{{d|     http_req_duration..............: avg=}}{{g|188ms}}{{d|  min=91ms med=}}{{g|164ms}}',
        '{{d|     http_req_duration{p(95)}.......: }}{{g|312ms}}{{d|  (SLO 450ms)}}',
        '{{d|     http_req_duration{p(99)}.......: }}{{g|418ms}}',
        '{{d|     http_req_failed................: }}{{g|0.00%}}{{d|   ✓ 0  ✗ 118402}}',
        '{{d|     iterations.....................: 118,402  }}{{w|657.7/s}}',
        '',
        '{{w|                         before        after      delta}}',
        '{{d|  success rate}}            {{r|71.0%}}      {{g|100.0%}}    {{g|+29.0pp}}',
        '{{d|  p95 latency}}            {{r|3.28s}}       {{g|312ms}}    {{g|-90.5%}}',
        '{{d|  replicas at peak}}           {{r|4}}          {{g|18}}',
        '{{d|  time to scale}}            {{r|94s}}         {{g|11s}}    {{g|-88.3%}}',
        '{{d|  cost per 1M requests}}   {{d|$18.40}}      {{g|$14.10}}    {{g|-23.4%}}',
      ),
    },
    review: {
      cmd: 'az pipelines runs show --id 4412 --query "{status:status,result:result}" && gh pr checks 129', ms: 5600,
      out: L(
        '{{d|{ "status": "completed", "result": "succeeded" }}}',
        '',
        '{{w|All checks were successful}}',
        '  {{g|✓}} bicep what-if      {{d|2m18s}}  {{d|3 modify, 2 create, 0 delete}}',
        '  {{g|✓}} checkov (bicep)    {{d|41s}}   {{d|128 passed, 0 failed}}',
        '  {{g|✓}} unit               {{d|1m04s}}',
        '  {{g|✓}} acr build + scan   {{d|4m22s}}  {{d|2 high (pinned upgrades queued)}}',
        '  {{g|✓}} smoke (green)      {{d|1m41s}}  {{d|18/18 · p95 312ms}}',
        '  {{g|✓}} load (200 vus)     {{d|3m48s}}  {{d|100% success, 657 rps}}',
        '  {{g|✓}} cost-estimate      {{d|22s}}   {{d|+$412/mo (GPU pool min 2→3)}}',
        '  {{g|✓}} approvals          {{d|—}}      {{d|@marco (platform-ml), @priya (sre)}}',
      ),
    },
    deploy: {
      cmd: 'make deploy-green REV=4c81e02 && make shift-traffic TO=green STEPS=10,50,100 WAIT=180', ms: 17400,
      out: L(
        '{{d|az ml online-deployment update --name green --file infra/green.yml --set image=…:4c81e02}}',
        '{{d|Creating/updating online deployment green }}',
        '{{d|Done (4m 18s)}}',
        '  {{g|✓}} green 3/3 instances healthy {{d|(model load 6.8s, probe passed)}}',
        '',
        '{{d|ENDPOINT_URI=… TARGET_DEPLOYMENT=green pytest -m smoke}}',
        '  {{g|✓}} 18 smoke checks passed against green while blue served 100% of users',
        '',
        '{{d|az ml online-endpoint update --traffic "blue=90 green=10"}}',
        '  {{g|✓}} 10%  {{d|180s}}  {{d|error 0.00% · p95 308ms · queue 12}}',
        '{{d|az ml online-endpoint update --traffic "blue=50 green=50"}}',
        '  {{g|✓}} 50%  {{d|180s}}  {{d|error 0.00% · p95 312ms · queue 8}}',
        '{{d|az ml online-endpoint update --traffic "blue=0 green=100"}}',
        '  {{g|✓}} 100% {{d|180s}}  {{d|error 0.00% · p95 314ms · queue 4}}',
        '',
        '{{g|✓ traffic fully on green · blue kept warm for 24h for instant rollback}}',
        '{{g|✓ 429s 2,904/5min → 0 · p95 3.28s → 312ms}}',
      ),
    },
    migrate: {
      cmd: 'az ml model create --name risk-classifier --version 8 --path azureml://jobs/train-4412/outputs/model && az ml online-deployment update --name green --set model=azureml:risk-classifier:8', ms: 12800,
      out: L(
        '{{d|Uploading model (2.14 GiB): 100%|██████████████████| 2.14G/2.14G [01:12<00:00]}}',
        '{{g|Model risk-classifier:8 registered}}',
        '{{d|  lineage: job train-4412 · dataset risk-labels-v9 · commit 4c81e02}}',
        '{{d|  signature: inputs[list[str]] → outputs[{label:str, score:float}]}}',
        '{{d|  validated against the v7 contract: }}{{g|compatible}}',
        '',
        '{{d|Updating deployment green to model version 8…}}',
        '  {{g|✓}} rolling 3 instances one at a time (maxUnavailable=0)',
        '  {{g|✓}} instance 1/3 · model load 7.1s · smoke passed',
        '  {{g|✓}} instance 2/3 · model load 6.9s · smoke passed',
        '  {{g|✓}} instance 3/3 · model load 7.0s · smoke passed',
        '{{g|✓ green on risk-classifier:8 · still 0% traffic · ready for shadow eval}}',
      ),
    },
    grepTarget: 'targetUtilizationPercentage|minInstances',
  },
  probs: [
    { sev: 'e', file: 'infra/endpoint.bicep', line: 41, col: 9, msg: 'The property "traffic" expected a value of type "object" but the provided value is of type "int".', src: 'bicep(BCP036)' },
    { sev: 'e', file: 'infra/main.bicep', line: 62, col: 22, msg: 'The type "module" does not contain property "subnetIds".', src: 'bicep(BCP053)' },
    { sev: 'w', file: 'k8s/keda-scaler.yaml', line: 28, col: 21, msg: 'spec.triggers.1.metadata.targetValue expected string, got number', src: 'kubeconform' },
  ],
  logtail: [
    '{{gr|$t}} {{g|INFO}}  {{gr|endpoint}} POST /score {{g|200}} {{d|$msms}} {{gr|batch=32 dep=green gpu=6$a%}}',
    '{{gr|$t}} {{g|INFO}}  {{gr|keda}} queue=$n2 replicas=$a→$a {{d|target=40}}',
    '{{gr|$t}} {{g|INFO}}  {{gr|appinsights}} RequestLatency_P95 3$a2 ms {{d|SLO 450}}',
    '{{gr|$t}} {{g|INFO}}  {{gr|apim}} rate-limit bucket=tenant:$h remaining=$n88',
    '{{gr|$t}} {{y|WARN}}  {{gr|endpoint}} POST /score {{y|429}} {{d|$msms}} {{gr|maxQueueWait exceeded}}',
    '{{gr|$t}} {{g|INFO}}  {{gr|aks}} gpua100 node ip-10-42-$a-$b Ready {{d|allocatable nvidia.com/gpu=1}}',
    '{{gr|$t}} {{g|INFO}}  {{gr|acr}} pull serving/risk:4c81e02 {{d|$msms}} {{gr|cache=hit}}',
  ],
};

const STACKS = {
  next: nextjs, fastapi, go: golang, rust, k8s: infra,
  postgres, langchain, azure,
};

/* 스택별 티켓 — 터미널 출력에 이미 박혀 있는 브랜치명과 맞춰 둔다. */
const TICKETS = {
  next:    { key: 'PAY',   n: 1482, branch: 'feature/PAY-1482',           area: 'checkout pricing',   repoName: 'checkout-web' },
  fastapi: { key: 'LED',   n: 2207, branch: 'fix/LED-2207-double-spend',  area: 'the transfer ledger',repoName: 'ledger-api' },
  go:      { key: 'ORD',   n: 3318, branch: 'fix/ORD-3318-transition',    area: 'the order state machine', repoName: 'order-svc' },
  rust:    { key: 'EDGE',  n: 771,  branch: 'fix/EDGE-771-bucket-race',   area: 'the edge rate limiter',   repoName: 'edge-router' },
  k8s:     { key: 'INFRA', n: 4102, branch: 'fix/INFRA-4102-az-spread',   area: 'the payments node pool',  repoName: 'platform-infra' },
  postgres:{ key: 'WH',    n: 812,  branch: 'feat/WH-812-partition-events', area: 'the events table',      repoName: 'warehouse-db' },
  langchain:{key: 'AGT',   n: 1904, branch: 'feat/AGT-1904-tool-router',  area: 'the agent tool router',   repoName: 'agent-platform' },
  azure:   { key: 'SRV',   n: 663,  branch: 'feat/SRV-663-blue-green',    area: 'the inference endpoint',  repoName: 'serving-azure' },
};

/* ════════════════════════════════════════════════════════════════════════
   비트 빌더
   ────────────────────────────────────────────────────────────────────────
   미션 스크립트가 쓰는 작은 DSL. 스택에 없는 역할을 부르면 null 을
   돌려주고, 조립 단계에서 걸러낸다. 그래서 미션은 스택을 몰라도 된다.
   ════════════════════════════════════════════════════════════════════════ */
function builder(stack, tk) {
  const f = role => stack.files[role] || null;
  const lineCount = code => code.split('\n').length;

  const tp = stack.topic || {};

  return {
    stack, tk, tp,
    area: tk.area,
    repo: stack.repo,

    phase: label => ({ t: 'phase', label }),
    user: text => ({ t: 'user', text }),
    think: (text, ms = 3200) => ({ t: 'think', text, ms }),
    say: text => ({ t: 'say', text }),
    todo: items => ({ t: 'todo', items }),
    wait: ms => ({ t: 'wait', ms }),
    notify: (title, text, kind = 'info') => ({ t: 'notify', title, text, kind }),
    ping: (who, ch, text) => ({ t: 'ping', who, ch, text }),
    problems: items => ({ t: 'problems', items: items === 'stack' ? stack.probs : items }),
    done: (text, stats) => ({ t: 'done', text, stats }),

    /** 파일을 열어 기존 내용을 보여준다(IDE) / Read 툴콜로 출력한다(스트림). */
    open: role => {
      const x = f(role); if (!x) return null;
      return { t: 'open', path: x.path, lang: x.lang, code: x.code, lines: lineCount(x.code) };
    },
    read: role => {
      const x = f(role); if (!x) return null;
      return { t: 'read', path: x.path, lines: lineCount(x.code) };
    },
    /** 파일을 처음부터 써 내려간다. */
    write: role => {
      const x = f(role); if (!x) return null;
      return { t: 'edit', path: x.path, lang: x.lang, code: x.code, add: lineCount(x.code), del: 0, fresh: true };
    },
    /** 기존 파일의 일부를 고쳐 쓴다. */
    edit: (role, del = 0) => {
      const x = f(role); if (!x) return null;
      return { t: 'edit', path: x.path, lang: x.lang, code: x.code, add: lineCount(x.code), del };
    },
    scaffold: i => {
      const list = stack.files.scaffold || [];
      const x = list[i]; if (!x) return null;
      return { t: 'edit', path: x.path, lang: x.lang, code: x.code, add: lineCount(x.code), del: 0, fresh: true };
    },
    scaffoldCount: () => (stack.files.scaffold || []).length,

    grep: (pat, hits = 7) => ({ t: 'grep', pat: pat || stack.cmd.grepTarget || 'TODO', hits }),
    ls: (path, n = 14) => ({ t: 'ls', path: path || stack.root, n }),

    bash: role => {
      const c = stack.cmd[role]; if (!c || !c.cmd) return null;
      return { t: 'bash', cmd: c.cmd, out: c.out, ms: c.ms || 2000, keep: !!c.keep, role };
    },
  };
}

/* ════════════════════════════════════════════════════════════════════════
   미션
   ════════════════════════════════════════════════════════════════════════ */
const MISSIONS = {

  /* ── 1. 기능 개발 ─────────────────────────────────────────────────── */
  feature: {
    label: 'Ship a Feature', icon: '✦', tone: 'calm',
    hint: 'A ticket off the board: read the code, write the thing, add tests, open a PR. The steady rhythm of a normal Tuesday.',
    title: s => s.tp.title + ' in ' + s.area,
    type: 'Story',
    script: s => [
      s.phase('Planning'),
      s.user('Pick up ' + s.tk.key + '-' + s.tk.n + '. Read the ticket, then implement it in ' + s.area + '. Add tests and open a PR when green.'),
      s.think('Reading the ticket and the surrounding code before touching anything. The acceptance criteria mention ' +
        s.tp.criteria + ', so ' + s.tp.unit + ' is where this lands.', 4200),
      s.todo([
        { s: 'doing', text: 'Read the current implementation and tests' },
        { s: 'todo', text: 'Implement the new behaviour' },
        { s: 'todo', text: 'Cover with unit tests' },
        { s: 'todo', text: 'Typecheck, lint, and open a PR' },
      ]),
      s.bash('status'),
      s.ls(),
      s.read('impl'),
      s.grep(),
      s.say('The current behaviour is implicit: ' + s.tp.implicit + '. I will ' + s.tp.explicit + '.'),
      s.open('impl'),
      s.phase('Implementing'),
      s.todo([
        { s: 'done', text: 'Read the current implementation and tests' },
        { s: 'doing', text: 'Implement the new behaviour' },
        { s: 'todo', text: 'Cover with unit tests' },
        { s: 'todo', text: 'Typecheck, lint, and open a PR' },
      ]),
      s.edit('impl', 11),
      s.write('types'),
      s.bash('types'),
      s.problems('stack'),
      s.say('One type error: clamp() needs the remaining base as a second argument. Fixing the call site.'),
      s.edit('patch', 4),
      s.bash('types_ok'),
      s.problems([]),
      s.phase('Testing'),
      s.todo([
        { s: 'done', text: 'Read the current implementation and tests' },
        { s: 'done', text: 'Implement the new behaviour' },
        { s: 'doing', text: 'Cover with unit tests' },
        { s: 'todo', text: 'Typecheck, lint, and open a PR' },
      ]),
      s.edit('test', 6),
      s.bash('test_fail'),
      s.say('Two failures, both mine: the fixture assumed the old ordering. The production code is right — the expectations were written against the bug.'),
      s.edit('test', 6),
      s.bash('test_pass'),
      s.notify('Vitest', 'All tests passed. 55 passed, 0 failed.', 'ok'),
      s.bash('lint_ok'),
      s.phase('Shipping'),
      s.todo([
        { s: 'done', text: 'Read the current implementation and tests' },
        { s: 'done', text: 'Implement the new behaviour' },
        { s: 'done', text: 'Cover with unit tests' },
        { s: 'doing', text: 'Typecheck, lint, and open a PR' },
      ]),
      s.bash('diff'),
      s.bash('commit'),
      s.bash('push'),
      s.ping('dana', '#eng-payments', s.tp.peer),
      s.notify('GitHub Pull Requests', 'PR opened · ' + s.tk.key + '-' + s.tk.n + ' · 5 files changed', 'ok'),
      s.todo([
        { s: 'done', text: 'Read the current implementation and tests' },
        { s: 'done', text: 'Implement the new behaviour' },
        { s: 'done', text: 'Cover with unit tests' },
        { s: 'done', text: 'Typecheck, lint, and open a PR' },
      ]),
      s.done('Done. ' + s.tk.id + ' is implemented, covered, and pushed as a PR. ' + s.tp.done,
        ['5 files changed', '+152 / -38', '55 tests green', 'PR opened']),
    ],
  },

  /* ── 2. 장애 대응 ─────────────────────────────────────────────────── */
  incident: {
    label: 'Firefight — P1 Incident', icon: '◉', tone: 'hot',
    hint: 'A pager went off. Read prod logs, reproduce, find the race, patch, verify, deploy. Red text, urgency, and a rollback plan — the most convincing thing to have on screen.',
    title: s => 'P1: ' + s.area + ' is returning 500s in production',
    type: 'Incident',
    script: s => [
      s.phase('Triage'),
      s.user('PagerDuty just fired: INC-2291, ' + s.area + ' throwing 500s in prod since 13:58. You are the responder. Find it and stop the bleeding.'),
      s.notify('PagerDuty', 'INC-2291 triggered · severity P1 · you are on call', 'err'),
      s.think('Error rate started at 13:58 with no deploy in that window, which points at a data-dependent or concurrency-dependent path rather than a bad release. Logs first, then reproduce locally before changing a line.', 5200),
      s.todo([
        { s: 'doing', text: 'Read production logs and scope the blast radius' },
        { s: 'todo', text: 'Reproduce locally' },
        { s: 'todo', text: 'Patch and prove it with a test' },
        { s: 'todo', text: 'Deploy and watch the error rate' },
      ]),
      s.bash('logs'),
      s.say('Same stack frame every time, three accounts affected, first seen 13:58:02. Nothing shipped then — so this is a latent race that traffic finally hit.'),
      s.bash('repro'),
      s.notify('Reproduced', 'Local reproduction matches the production stack trace.', 'warn'),
      s.phase('Diagnosing'),
      s.todo([
        { s: 'done', text: 'Read production logs and scope the blast radius' },
        { s: 'done', text: 'Reproduce locally' },
        { s: 'doing', text: 'Patch and prove it with a test' },
        { s: 'todo', text: 'Deploy and watch the error rate' },
      ]),
      s.read('impl'),
      s.grep(),
      s.open('impl'),
      s.think('Found it. The read happens outside the lock, so two writers both pass the guard with the same pre-write value. The fix is to make the read and the write one atomic step — not to add a retry around it.', 4600),
      s.say('Root cause: the guard reads state that another writer can change before the write lands. I am making the check-and-write atomic. A retry would only make the window smaller, not closed.'),
      s.edit('patch', 9),
      s.bash('test_fail'),
      s.say('Good — the regression test fails against the old behaviour. Now the fix.'),
      s.edit('impl', 14),
      s.bash('test_pass'),
      s.bash('lint_ok'),
      s.phase('Shipping the fix'),
      s.bash('diff'),
      s.bash('commit'),
      s.bash('push'),
      s.ping('marco', '#incident-2291', 'root cause confirmed, fix is up. rollback plan: revert to the previous image, no schema change involved'),
      s.todo([
        { s: 'done', text: 'Read production logs and scope the blast radius' },
        { s: 'done', text: 'Reproduce locally' },
        { s: 'done', text: 'Patch and prove it with a test' },
        { s: 'doing', text: 'Deploy and watch the error rate' },
      ]),
      s.bash('deploy'),
      s.notify('Datadog', 'Error rate back to baseline · 0.00% over 120s', 'ok'),
      s.ping('priya', '#incident-2291', 'error rate is flat. calling it mitigated — can you write the postmortem draft?'),
      s.done('Mitigated. Root cause was a non-atomic check-and-write under concurrency; the guard now holds a lock for the whole step. Error rate is back to 0.00% and a regression test pins the behaviour.',
        ['INC-2291 mitigated', 'MTTR 34m', '0.00% error rate', 'regression test added']),
    ],
  },

  /* ── 3. 리팩터링 ──────────────────────────────────────────────────── */
  refactor: {
    label: 'Refactor Marathon', icon: '↻', tone: 'calm',
    hint: 'Long, continuous, file after file. No drama, just steady rewriting with the test suite as a net. Great for hours of screen time.',
    title: s => 'Untangle ' + s.area + ' into explicit, testable units',
    type: 'Tech Debt',
    script: s => [
      s.phase('Mapping'),
      s.user('No new behaviour today. Refactor ' + s.area + ' so each step is explicit and unit-testable. Keep the test suite green the whole way.'),
      s.think('The rule for this kind of work is that the tests do not change. If I have to edit an assertion to keep it passing, I changed behaviour and need to stop and say so.', 4400),
      s.todo([
        { s: 'doing', text: 'Map the current call graph' },
        { s: 'todo', text: 'Extract the pure pieces' },
        { s: 'todo', text: 'Thread the types through' },
        { s: 'todo', text: 'Prove behaviour is unchanged' },
      ]),
      s.bash('status'),
      s.grep(),
      s.read('impl'),
      s.read('types'),
      s.bash('test_pass'),
      s.say('Baseline captured: green before I touch anything. 55 tests, and I intend to end on exactly the same 55 assertions.'),
      s.phase('Extracting'),
      s.open('impl'),
      s.edit('impl', 41),
      s.bash('test_pass'),
      s.todo([
        { s: 'done', text: 'Map the current call graph' },
        { s: 'done', text: 'Extract the pure pieces' },
        { s: 'doing', text: 'Thread the types through' },
        { s: 'todo', text: 'Prove behaviour is unchanged' },
      ]),
      s.write('types'),
      s.bash('types'),
      s.problems('stack'),
      s.say('Three call sites were relying on a loose type. That is the good kind of breakage — the compiler is showing me exactly where the old shape leaked.'),
      s.edit('patch', 8),
      s.bash('types_ok'),
      s.problems([]),
      s.phase('Verifying'),
      s.bash('lint'),
      s.say('Two lint findings left over from the extraction: an unused parameter and an import order. Both mechanical.'),
      s.bash('lint_ok'),
      s.bash('test_pass'),
      s.bash('cov'),
      s.notify('Coverage', 'Coverage held at 94% with no assertion changes.', 'ok'),
      s.todo([
        { s: 'done', text: 'Map the current call graph' },
        { s: 'done', text: 'Extract the pure pieces' },
        { s: 'done', text: 'Thread the types through' },
        { s: 'done', text: 'Prove behaviour is unchanged' },
      ]),
      s.bash('diff'),
      s.bash('commit'),
      s.bash('push'),
      s.ping('sam', '#eng-platform', 'this is the cleanest that module has looked in two years. no test edits, which is the part i care about'),
      s.done('Refactor complete. Same 55 assertions, same behaviour, four fewer layers of indirection. Nothing in the test suite was edited, which is the only proof that matters here.',
        ['5 files changed', '+178 / -30', '0 assertions changed', 'coverage 94%']),
    ],
  },

  /* ── 4. 신규 구축 ─────────────────────────────────────────────────── */
  greenfield: {
    label: 'Green Field — Build from Zero', icon: '✱', tone: 'calm',
    hint: 'An empty folder becomes a working service: scaffold, dependencies, first module, first test, first green run. Lots of fresh code appearing on screen.',
    title: s => 'Bootstrap a new module inside ' + s.tk.repoName,
    type: 'Task',
    script: s => [
      s.phase('Scaffolding'),
      s.user('Start the new module from scratch. Set up the project, write the core type, one real module, and a test that actually runs.'),
      s.think('Nothing exists yet, so the ordering matters: dependency manifest, then the smallest type everything else depends on, then one vertical slice that proves the wiring works end to end.', 4000),
      s.todo([
        { s: 'doing', text: 'Set up the project and dependencies' },
        { s: 'todo', text: 'Write the core domain type' },
        { s: 'todo', text: 'Write one real module on top of it' },
        { s: 'todo', text: 'Get a green test run' },
      ]),
      s.bash('install'),
      s.write('infra'),
      s.bash('install'),
      s.notify('Dependencies', 'Workspace installed and locked.', 'ok'),
      s.phase('Core types'),
      s.todo([
        { s: 'done', text: 'Set up the project and dependencies' },
        { s: 'doing', text: 'Write the core domain type' },
        { s: 'todo', text: 'Write one real module on top of it' },
        { s: 'todo', text: 'Get a green test run' },
      ]),
      s.scaffold(0),
      s.say('Money is an integer with a currency and nothing else. Every bug I have ever seen in a pricing path started with a float sneaking in here.'),
      s.write('types'),
      s.bash('types_ok'),
      s.phase('First module'),
      s.todo([
        { s: 'done', text: 'Set up the project and dependencies' },
        { s: 'done', text: 'Write the core domain type' },
        { s: 'doing', text: 'Write one real module on top of it' },
        { s: 'todo', text: 'Get a green test run' },
      ]),
      s.scaffold(1),
      s.write('impl'),
      s.bash('types'),
      s.problems('stack'),
      s.edit('patch', 3),
      s.bash('types_ok'),
      s.problems([]),
      s.phase('First green run'),
      s.todo([
        { s: 'done', text: 'Set up the project and dependencies' },
        { s: 'done', text: 'Write the core domain type' },
        { s: 'done', text: 'Write one real module on top of it' },
        { s: 'doing', text: 'Get a green test run' },
      ]),
      s.write('test'),
      s.bash('test_fail'),
      s.say('Expected — the factory helpers do not exist yet. Writing them now.'),
      s.edit('test', 4),
      s.bash('test_pass'),
      s.bash('lint_ok'),
      s.bash('dev'),
      s.notify('Dev server', 'Running and healthy on the first boot.', 'ok'),
      s.bash('build'),
      s.bash('commit'),
      s.ping('yoon', '#eng-platform', 'wait, this already builds and has tests? i was going to spend the afternoon on the scaffold'),
      s.done('Module bootstrapped: dependencies locked, core type written, one real vertical slice on top of it, tests green, dev server booting, production build clean.',
        ['6 files created', '+412 lines', 'tests green', 'build clean']),
    ],
  },

  /* ── 5. 테스트/보안 강화 ──────────────────────────────────────────── */
  harden: {
    label: 'Test & Harden', icon: '⛨', tone: 'calm',
    hint: 'Coverage gaps, property tests, dependency audit, CI gates. Nothing but green checkmarks accumulating — reads as extremely diligent.',
    title: s => 'Raise the coverage gate and close the audit findings in ' + s.area,
    type: 'Task',
    script: s => [
      s.phase('Surveying'),
      s.user('Coverage on ' + s.area + ' is below the gate and the audit has open findings. Close both. Do not lower any threshold to make it pass.'),
      s.think('The rule here is that a gate is only meaningful if it never moves down. If I cannot reach the number I write the tests, I do not edit the number.', 3800),
      s.todo([
        { s: 'doing', text: 'Find the uncovered branches' },
        { s: 'todo', text: 'Add property and concurrency tests' },
        { s: 'todo', text: 'Close the dependency audit findings' },
        { s: 'todo', text: 'Tighten the CI gate' },
      ]),
      s.bash('cov'),
      s.say('The uncovered lines are all the error paths — the happy path is well covered and the failure modes are not, which is exactly backwards.'),
      s.read('impl'),
      s.grep(),
      s.phase('Writing tests'),
      s.todo([
        { s: 'done', text: 'Find the uncovered branches' },
        { s: 'doing', text: 'Add property and concurrency tests' },
        { s: 'todo', text: 'Close the dependency audit findings' },
        { s: 'todo', text: 'Tighten the CI gate' },
      ]),
      s.write('test'),
      s.bash('test_fail'),
      s.say('The concurrency test found a real one on the first run. That is not a flaky test — the invariant genuinely does not hold under parallel writers.'),
      s.open('impl'),
      s.edit('patch', 7),
      s.bash('test_pass'),
      s.bash('cov'),
      s.notify('Coverage', 'Gate raised to 90% and met at 94%.', 'ok'),
      s.phase('Audit'),
      s.todo([
        { s: 'done', text: 'Find the uncovered branches' },
        { s: 'done', text: 'Add property and concurrency tests' },
        { s: 'doing', text: 'Close the dependency audit findings' },
        { s: 'todo', text: 'Tighten the CI gate' },
      ]),
      s.bash('sec'),
      s.say('One moderate finding, reachable only through a dependency we do not call into. Bumping it anyway — arguing about reachability costs more than the upgrade.'),
      s.bash('install'),
      s.bash('sec'),
      s.write('infra'),
      s.bash('lint_ok'),
      s.bash('test_pass'),
      s.todo([
        { s: 'done', text: 'Find the uncovered branches' },
        { s: 'done', text: 'Add property and concurrency tests' },
        { s: 'done', text: 'Close the dependency audit findings' },
        { s: 'done', text: 'Tighten the CI gate' },
      ]),
      s.bash('commit'),
      s.bash('push'),
      s.notify('CI', 'All gates green with the stricter thresholds.', 'ok'),
      s.ping('elif', '#eng-quality', 'coverage gate at 90 and the concurrency test caught an actual bug. that is the good outcome'),
      s.done('Hardened. Coverage gate raised rather than lowered, a real concurrency bug found by the new property test, and the audit findings closed by upgrading instead of suppressing.',
        ['coverage 94%', 'gate 90% (was 80%)', '1 real bug found', '0 audit findings']),
    ],
  },

  /* ── 6. 마이그레이션 ──────────────────────────────────────────────── */
  migrate: {
    label: 'Migration', icon: '⇥', tone: 'calm',
    hint: 'Schema changes, generated code, backfills, zero-downtime rollout. Careful, sequential, lots of tooling output.',
    title: s => 'Zero-downtime schema change for ' + s.area,
    type: 'Task',
    script: s => [
      s.phase('Planning the migration'),
      s.user('We need the new column live without a maintenance window. Plan it, generate it, apply it to staging, then production.'),
      s.think('Zero downtime means the migration has to be compatible in both directions for one release: add nullable, backfill in batches, then make it required in a later change. Never all three at once.', 5000),
      s.todo([
        { s: 'doing', text: 'Write the migration as an additive change' },
        { s: 'todo', text: 'Regenerate the typed query layer' },
        { s: 'todo', text: 'Apply to staging and verify' },
        { s: 'todo', text: 'Roll out to production' },
      ]),
      s.bash('status'),
      s.read('types'),
      s.say('Plan: additive nullable column, concurrent index, batched backfill, and the NOT NULL constraint deferred to the next release. Old pods keep working the whole way.'),
      s.write('types'),
      s.bash('migrate'),
      s.notify('Migration', 'Generated and applied locally · schema at head.', 'ok'),
      s.phase('Regenerating'),
      s.todo([
        { s: 'done', text: 'Write the migration as an additive change' },
        { s: 'doing', text: 'Regenerate the typed query layer' },
        { s: 'todo', text: 'Apply to staging and verify' },
        { s: 'todo', text: 'Roll out to production' },
      ]),
      s.edit('impl', 18),
      s.bash('types'),
      s.problems('stack'),
      s.edit('patch', 5),
      s.bash('types_ok'),
      s.problems([]),
      s.edit('test', 8),
      s.bash('test_pass'),
      s.phase('Staging'),
      s.todo([
        { s: 'done', text: 'Write the migration as an additive change' },
        { s: 'done', text: 'Regenerate the typed query layer' },
        { s: 'doing', text: 'Apply to staging and verify' },
        { s: 'todo', text: 'Roll out to production' },
      ]),
      s.bash('build'),
      s.bash('migrate'),
      s.bash('repro'),
      s.say('Staging is on the new schema and the old binary still serves traffic against it. That is the property I needed to confirm before touching production.'),
      s.phase('Production'),
      s.todo([
        { s: 'done', text: 'Write the migration as an additive change' },
        { s: 'done', text: 'Regenerate the typed query layer' },
        { s: 'done', text: 'Apply to staging and verify' },
        { s: 'doing', text: 'Roll out to production' },
      ]),
      s.bash('commit'),
      s.bash('push'),
      s.bash('deploy'),
      s.notify('Deploy', 'Rolled out with no maintenance window.', 'ok'),
      s.ping('tomas', '#eng-data', 'migration went out with zero downtime and no lock waits over 50ms. nice batching'),
      s.done('Migration complete with no maintenance window: additive schema change, concurrent index, batched backfill, and the constraint tightening deferred to the next release.',
        ['schema at head', '0 downtime', 'lock waits < 50ms', 'rollback tested']),
    ],
  },

  /* ── 7. 코드 리뷰 ─────────────────────────────────────────────────── */
  review: {
    label: 'Code Review Sweep', icon: '◈', tone: 'calm',
    hint: 'Work through the open PR queue: read diffs, verify claims, run the branch locally, leave comments. Reads as the most senior activity on the list.',
    title: s => 'Review the open PR queue on ' + s.tk.repoName,
    type: 'Review',
    script: s => [
      s.phase('Reading the queue'),
      s.user('Three PRs have been waiting on review since yesterday. Work the queue: read the diffs properly, check out the branches, and only approve what you have actually verified.'),
      s.think('Reviewing a diff without running it catches style and misses behaviour. For anything touching a concurrency or money path I am going to check the branch out and run the suite myself.', 4400),
      s.todo([
        { s: 'doing', text: 'Read the diff and the linked ticket' },
        { s: 'todo', text: 'Check out the branch and run the suite' },
        { s: 'todo', text: 'Verify the perf claim independently' },
        { s: 'todo', text: 'Leave comments and a verdict' },
      ]),
      s.bash('review'),
      s.read('impl'),
      s.grep(),
      s.say('The diff is correct and the description is honest about what it does not cover. One thing to check: the author claims a 40% improvement, and that number came from a single run.'),
      s.phase('Verifying locally'),
      s.todo([
        { s: 'done', text: 'Read the diff and the linked ticket' },
        { s: 'doing', text: 'Check out the branch and run the suite' },
        { s: 'todo', text: 'Verify the perf claim independently' },
        { s: 'todo', text: 'Leave comments and a verdict' },
      ]),
      s.bash('install'),
      s.bash('test_pass'),
      s.bash('lint_ok'),
      s.bash('types_ok'),
      s.phase('Checking the claim'),
      s.todo([
        { s: 'done', text: 'Read the diff and the linked ticket' },
        { s: 'done', text: 'Check out the branch and run the suite' },
        { s: 'doing', text: 'Verify the perf claim independently' },
        { s: 'todo', text: 'Leave comments and a verdict' },
      ]),
      s.bash('bench'),
      s.say('The claim holds — I get the same improvement across five runs, and the allocation count dropped too, which the description did not even mention.'),
      s.open('test'),
      s.edit('test', 5),
      s.say('Adding one test case to the PR: the diff handles the empty input path but nothing exercises it. Pushing it to the author\'s branch rather than asking them to.'),
      s.bash('test_pass'),
      s.phase('Verdict'),
      s.todo([
        { s: 'done', text: 'Read the diff and the linked ticket' },
        { s: 'done', text: 'Check out the branch and run the suite' },
        { s: 'done', text: 'Verify the perf claim independently' },
        { s: 'done', text: 'Leave comments and a verdict' },
      ]),
      s.bash('commit'),
      s.bash('push'),
      s.notify('GitHub Pull Requests', 'Review submitted · approved with 2 comments', 'ok'),
      s.ping('nina', '#eng-payments', 'thanks for actually running the bench instead of taking my word for it. and for writing the empty-input test'),
      s.done('Queue worked. One PR approved after verifying the perf claim across five runs, one test case added to cover an untested path, two non-blocking comments left on naming.',
        ['3 PRs reviewed', '1 approved', 'perf claim verified', '1 test added']),
    ],
  },

  /* ── 8. 성능 개선 ─────────────────────────────────────────────────── */
  perf: {
    label: 'Perf Hunt', icon: '◢', tone: 'calm',
    hint: 'Profile, find the hot path, rewrite it, and prove the win with a benchmark diff. Numbers getting visibly better on screen.',
    title: s => 'Cut p99 latency in ' + s.area,
    type: 'Story',
    script: s => [
      s.phase('Measuring'),
      s.user('p99 on ' + s.area + ' has drifted from 40ms to 280ms over the quarter. Find out why and fix the actual cause. Measure before you change anything.'),
      s.think('No optimisation before a profile. The p50 is fine and only the tail moved, which usually means contention or an allocation cliff rather than an algorithmic problem.', 4800),
      s.todo([
        { s: 'doing', text: 'Capture a baseline benchmark' },
        { s: 'todo', text: 'Profile and find the hot path' },
        { s: 'todo', text: 'Rewrite it' },
        { s: 'todo', text: 'Prove the win with a benchmark diff' },
      ]),
      s.bash('bench'),
      s.say('Baseline saved. p50 is healthy, the tail is not — so I am looking for something that only hurts under contention.'),
      s.bash('repro'),
      s.phase('Profiling'),
      s.todo([
        { s: 'done', text: 'Capture a baseline benchmark' },
        { s: 'doing', text: 'Profile and find the hot path' },
        { s: 'todo', text: 'Rewrite it' },
        { s: 'todo', text: 'Prove the win with a benchmark diff' },
      ]),
      s.read('impl'),
      s.grep(),
      s.think('The hot path allocates once per call and takes a lock that is held across work that does not need it. Both are fixable without changing the public shape of the function.', 4200),
      s.say('Two findings: an allocation per call that can be packed into a single word, and a lock held across work that could happen outside it. Doing the allocation first — it is the safer of the two.'),
      s.phase('Rewriting'),
      s.todo([
        { s: 'done', text: 'Capture a baseline benchmark' },
        { s: 'done', text: 'Profile and find the hot path' },
        { s: 'doing', text: 'Rewrite it' },
        { s: 'todo', text: 'Prove the win with a benchmark diff' },
      ]),
      s.open('impl'),
      s.edit('impl', 22),
      s.bash('test_pass'),
      s.bash('bench'),
      s.say('Allocation gone, 39% off the mean. Now the lock.'),
      s.edit('patch', 9),
      s.bash('test_fail'),
      s.say('Caught by the concurrency test — narrowing the lock exposed the same invariant the test was written to protect. Making the update a single atomic step instead.'),
      s.edit('patch', 9),
      s.bash('test_pass'),
      s.phase('Proving it'),
      s.todo([
        { s: 'done', text: 'Capture a baseline benchmark' },
        { s: 'done', text: 'Profile and find the hot path' },
        { s: 'done', text: 'Rewrite it' },
        { s: 'doing', text: 'Prove the win with a benchmark diff' },
      ]),
      s.bash('bench'),
      s.bash('cov'),
      s.notify('Benchmark', 'p99 down 70% · no regressions in 62 tests', 'ok'),
      s.bash('commit'),
      s.bash('push'),
      s.bash('deploy'),
      s.todo([
        { s: 'done', text: 'Capture a baseline benchmark' },
        { s: 'done', text: 'Profile and find the hot path' },
        { s: 'done', text: 'Rewrite it' },
        { s: 'done', text: 'Prove the win with a benchmark diff' },
      ]),
      s.ping('marco', '#eng-perf', 'p99 back under 40ms in prod. the allocation was the easy half, the lock narrowing is the part i would not have gotten right'),
      s.done('p99 is back under 40ms in production, down from 280ms. The win came from removing a per-call allocation and making a lock-protected update atomic, both proven with a benchmark diff across five runs.',
        ['p99 280ms → 38ms', '-71% mean', '-71% allocations', '62 tests green']),
    ],
  },
};

/* 미션 순서 — 루프가 이 순서로 돈다. */
const MISSION_ORDER = ['feature', 'incident', 'refactor', 'greenfield', 'harden', 'migrate', 'review', 'perf'];

/* ════════════════════════════════════════════════════════════════════════
   조립
   ────────────────────────────────────────────────────────────────────────
   build('next','incident',{n:0}) → 재생 가능한 비트 배열 + 메타데이터.
   ════════════════════════════════════════════════════════════════════════ */
function build(stackId, missionId, opts) {
  const stack = STACKS[stackId] || STACKS.next;
  const mission = MISSIONS[missionId] || MISSIONS.feature;
  const base = TICKETS[stack.id];
  const bump = (opts && opts.bump) || 0;

  const tk = {
    ...base,
    n: base.n + bump * 7,
    id: base.key + '-' + (base.n + bump * 7),
  };
  const s = builder(stack, tk);
  const beats = mission.script(s).filter(Boolean);

  return {
    stack, mission, ticket: tk, beats,
    title: mission.title(s),
    branch: tk.branch,
  };
}

/* 다음 미션 (루프용) */
function nextMission(id) {
  const i = MISSION_ORDER.indexOf(id);
  return MISSION_ORDER[(i + 1) % MISSION_ORDER.length];
}

/* 스웜 레이아웃용 — 서로 다른 미션 네 개를 고른다. */
function swarmSet(missionId) {
  const out = [missionId];
  let cur = missionId;
  while (out.length < 4) { cur = nextMission(cur); out.push(cur); }
  return out;
}

/* ════════════════════════════════════════════════════════════════════════
   Ops 레이아웃 — CI 파이프라인 단계와 지표
   ════════════════════════════════════════════════════════════════════════ */
const PIPELINE = [
  { name: 'checkout',        ms: 4000,  log: 'Fetching the repository (depth 1, submodules recursive)' },
  { name: 'restore-cache',   ms: 6000,  log: 'Cache restored from key deps-3f9a1c2 (412MB)' },
  { name: 'install',         ms: 14000, log: 'Dependencies installed and verified against the lockfile' },
  { name: 'lint',            ms: 9000,  log: '0 errors, 0 warnings across 312 files' },
  { name: 'typecheck',       ms: 11000, log: '4,812 files checked, 0 errors' },
  { name: 'unit',            ms: 18000, log: '214 tests passed, 0 failed, 0 flaky' },
  { name: 'integration',     ms: 26000, log: 'testcontainers: postgres:16 + redpanda up, 48 tests passed' },
  { name: 'build',           ms: 22000, log: 'Image ghcr.io/leafmeta/${repo}:3f9a1c2 pushed (21.4MB)' },
  { name: 'scan',            ms: 12000, log: 'trivy: 0 critical, 0 high · cosign: signature verified' },
  { name: 'e2e',             ms: 34000, log: 'playwright: 62 scenarios passed on chromium + webkit' },
  { name: 'canary 10%',      ms: 28000, log: 'Analysis: error-rate 0.01%, p99 38ms — within thresholds' },
  { name: 'canary 50%',      ms: 24000, log: 'Analysis: error-rate 0.00%, p99 41ms — within thresholds' },
  { name: 'promote 100%',    ms: 19000, log: 'Traffic fully shifted · previous revision kept for 24h' },
  { name: 'smoke',           ms: 8000,  log: 'All 14 smoke checks passed against production' },
];

/* 상단 지표 타일. v 는 시작값, 범위 안에서 흔들린다. */
const METRICS = [
  { k: 'REQ/S',      v: 8412,  lo: 7200, hi: 9600, fmt: 'int',  good: 'hi' },
  { k: 'P99',        v: 38,    lo: 31,   hi: 62,   fmt: 'ms',   good: 'lo' },
  { k: 'ERROR RATE', v: 0.01,  lo: 0,    hi: 0.09, fmt: 'pct',  good: 'lo' },
  { k: 'SATURATION', v: 41,    lo: 28,   hi: 71,   fmt: 'pct2', good: 'lo' },
  { k: 'PODS',       v: 9,     lo: 6,    hi: 24,   fmt: 'int',  good: 'mid' },
  { k: 'BUDGET 30d', v: 98.4,  lo: 96.1, hi: 99.6, fmt: 'pct2', good: 'hi' },
];

/* 채팅 알림(선택) — 스택과 무관한 일상적인 잡음 */
const CHATTER = [
  { who: 'dana',  ch: '#eng-payments',  text: 'standup in 10, anything blocking on your side?' },
  { who: 'marco', ch: '#eng-platform',  text: 'staging is back up, the node pool finished draining' },
  { who: 'priya', ch: '#incident-2291', text: 'postmortem doc is up, added you as a reviewer' },
  { who: 'sam',   ch: '#eng-payments',  text: 'can you take a look at the flaky e2e on webkit when you get a sec' },
  { who: 'yoon',  ch: '#general',       text: 'someone left a laptop in the 4th floor room again' },
  { who: 'elif',  ch: '#eng-quality',   text: 'coverage gate bumped to 90 on main, heads up' },
  { who: 'tomas', ch: '#eng-data',      text: 'backfill finished, 41M rows, no lock waits' },
  { who: 'nina',  ch: '#eng-payments',  text: 'approved. nice catch on the clamp' },
  { who: 'dana',  ch: '#eng-payments',  text: 'ok moving PAY-1482 to done on the board' },
  { who: 'marco', ch: '#oncall',        text: 'handing over, nothing open. error budget looks fine' },
];

/* 커맨드 팔레트에 스쳐 지나가는 항목들 — 사실감용 장식 */
const PALETTE_ITEMS = [
  ['Go to File...', '⌘P'], ['Go to Symbol in Workspace...', '⌘T'],
  ['Format Document', '⇧⌥F'], ['Run Test at Cursor', '⌘; C'],
  ['Git: Stage All Changes', ''], ['Git: Checkout to...', ''],
  ['Terminal: Create New Terminal', '⌃⇧`'], ['Toggle Panel', '⌘J'],
  ['Developer: Reload Window', ''], ['Agent: Continue Session', '⌘⇧A'],
  ['TypeScript: Restart TS Server', ''], ['Tasks: Run Build Task', '⇧⌘B'],
];

return {
  LAYOUTS, PACES, MODELS, AGENT_NAMES, HUMANS,
  STACKS, MISSIONS, MISSION_ORDER, TICKETS,
  PIPELINE, METRICS, CHATTER, PALETTE_ITEMS, FLEET,
  build, nextMission, swarmSet,
};
})();

if (typeof module !== 'undefined') module.exports = SCEN;
