/* ════════════════════════════════════════════════════════════════════════
   GHOSTCODER — 문법 하이라이터 + 에디터 테마
   ────────────────────────────────────────────────────────────────────────
   에디터는 한 글자씩 타이핑되므로, 토크나이저는 두 가지를 만족해야 한다.
   ─ 줄 단위로 끊어서 토큰화할 수 있어야 한다. 마지막 줄만 다시 그리면
     되도록, 각 줄은 "들어올 때의 상태(블록 주석/문자열/괄호 깊이)"를
     받아 "나갈 때의 상태"를 돌려준다.
   ─ 색은 토큰 타입 → CSS 클래스(.t-kw 등)로만 나간다. 실제 색은 테마가
     루트에 꽂는 CSS 변수(--t-kw)가 정하므로, 테마를 바꿀 때 다시 그릴
     필요가 없다.

   완벽한 파서가 아니다. 이 게임이 화면에 띄우는 코드는 전부
   scenarios.js 안에 내가 직접 써 둔 것이므로, 그 코드가 제대로 보이는
   수준까지만 맞춘다.
   ════════════════════════════════════════════════════════════════════════ */
"use strict";

const HL = (() => {

/* ── 언어 정의 ─────────────────────────────────────────────────────────
   kw   선언·수식어 (파랑)      ctrl 제어 흐름 (보라)
   lit  리터럴/상수 (파랑)      ty   내장 타입 (청록)
   ------------------------------------------------------------------- */
const W = s => s.trim().split(/\s+/);

const LANGS = {
  ts: {
    line: '//', block: ['/*', '*/'], quotes: `'"\``, tpl: '`', jsx: true, deco: true,
    kw: W(`const let var function class interface type enum extends implements
           new this super static public private protected readonly abstract declare
           export import from as default async await void keyword namespace module
           get set of in instanceof typeof satisfies infer keyof asserts is override`),
    ctrl: W(`if else for while do switch case break continue return throw try catch
             finally yield delete require`),
    lit: W(`true false null undefined NaN Infinity`),
    ty: W(`string number boolean bigint symbol object any unknown never void
           Array Promise Record Partial Pick Omit Map Set Date Error JSON Math
           Object String Number Boolean RegExp Response Request URL`),
  },
  py: {
    line: '#', tri: ['"""', "'''"], quotes: `'"`, deco: true, fstr: true,
    kw: W(`def class lambda import from as global nonlocal async await with
           pass del assert yield return self cls`),
    ctrl: W(`if elif else for while break continue try except finally raise match case`),
    lit: W(`True False None NotImplemented Ellipsis`),
    ty: W(`int str float bool bytes list dict set tuple frozenset type object
           Optional List Dict Any Union Literal Annotated Callable Iterable
           Sequence Mapping Awaitable Exception ValueError KeyError TypeError
           RuntimeError HTTPException BaseModel Decimal UUID datetime`),
    op2: W(`and or not is in`),
  },
  go: {
    line: '//', block: ['/*', '*/'], quotes: '`"\'',
    kw: W(`package import func type struct interface var const map chan go defer
           select range make new len cap append copy close delete panic recover`),
    ctrl: W(`if else for switch case default break continue return goto fallthrough`),
    lit: W(`true false nil iota`),
    ty: W(`string int int8 int16 int32 int64 uint uint8 uint16 uint32 uint64
           byte rune float32 float64 bool error any context Context
           Duration Time WaitGroup Mutex RWMutex`),
  },
  rust: {
    line: '//', block: ['/*', '*/'], quotes: '"', rust: true, deco: true,
    kw: W(`fn let mut const static struct enum trait impl for where pub use mod
           crate self super as dyn ref move async await unsafe extern type
           macro_rules derive`),
    ctrl: W(`if else match loop while break continue return`),
    lit: W(`true false None Some Ok Err`),
    ty: W(`u8 u16 u32 u64 usize i8 i16 i32 i64 isize f32 f64 bool char str String
           Vec Option Result Box Arc Rc RefCell Mutex RwLock HashMap HashSet
           BTreeMap Duration Instant Self`),
  },
  yaml: {
    line: '#', quotes: `'"`, yaml: true,
    kw: [], ctrl: [], lit: W(`true false null yes no on off`), ty: [],
  },
  json: { line: null, quotes: '"', json: true, kw: [], ctrl: [], lit: W(`true false null`), ty: [] },
  sh: {
    line: '#', quotes: `'"`, sh: true,
    kw: W(`export source alias set local declare readonly function`),
    ctrl: W(`if then else elif fi for while do done case esac return exit`),
    lit: [], ty: [],
  },
  docker: {
    line: '#', quotes: `'"`,
    kw: W(`FROM RUN CMD LABEL EXPOSE ENV ADD COPY ENTRYPOINT VOLUME USER
           WORKDIR ARG ONBUILD STOPSIGNAL HEALTHCHECK SHELL AS`),
    ctrl: [], lit: [], ty: [],
  },
  hcl: {
    line: '#', block: ['/*', '*/'], quotes: '"', hcl: true,
    kw: W(`resource variable output module provider data locals terraform
           backend required_providers source version type default description`),
    ctrl: W(`for_each count dynamic depends_on lifecycle`),
    lit: W(`true false null`), ty: W(`string number bool list map set object any`),
  },
  toml: { line: '#', quotes: `'"`, toml: true, kw: [], ctrl: [], lit: W(`true false`), ty: [] },
  sql: {
    line: '--', block: ['/*', '*/'], quotes: `'"`, upper: true,
    kw: W(`select from where join left right inner outer on group by order having
           limit offset insert into values update set delete create table alter
           index unique primary key foreign references default not null as with
           returning conflict do nothing begin commit rollback explain analyze`),
    ctrl: W(`case when then else end and or in exists between`),
    lit: W(`true false null`), ty: W(`int bigint text varchar boolean timestamptz
           numeric jsonb uuid serial date interval`),
  },
  md: { line: null, quotes: '`', md: true, kw: [], ctrl: [], lit: [], ty: [] },
  txt: { line: null, quotes: '', kw: [], ctrl: [], lit: [], ty: [] },
};

/* 각 언어의 단어 목록을 Set 으로 한 번만 굽는다. */
for (const L of Object.values(LANGS)) {
  L.S = {
    kw: new Set(L.kw), ctrl: new Set(L.ctrl), lit: new Set(L.lit),
    ty: new Set(L.ty), op2: new Set(L.op2 || []),
  };
}

const ID_START = /[A-Za-z_$]/;
const ID = /[A-Za-z0-9_$]/;
const NUM_START = /[0-9]/;

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ── 한 줄 토큰화 ──────────────────────────────────────────────────────
   st = { com:블록주석중, str:여러줄문자열종료기호, depth:괄호깊이, tag:JSX태그안 }
   ------------------------------------------------------------------- */
function tokLine(src, L, st0) {
  const st = { com: st0.com, str: st0.str, depth: st0.depth | 0, tag: st0.tag };
  const out = [];
  const push = (t, v) => { if (v) out.push([t, v]); };
  let i = 0;
  const n = src.length;

  /* 이어지는 블록 주석 */
  if (st.com) {
    const e = src.indexOf(L.block[1]);
    if (e < 0) { push('com', src); return { toks: out, st }; }
    push('com', src.slice(0, e + 2)); i = e + 2; st.com = false;
  }
  /* 이어지는 여러 줄 문자열(파이썬 """ 등) */
  if (st.str) {
    const e = src.indexOf(st.str);
    if (e < 0) { push('str', src); return { toks: out, st }; }
    push('str', src.slice(0, e + st.str.length)); i = e + st.str.length; st.str = null;
  }

  /* 줄 머리 특수 문법 ------------------------------------------------- */
  if (i === 0) {
    if (L.md) return { toks: mdLine(src), st };
    if (L.yaml) {
      const m = src.match(/^(\s*-?\s*)([A-Za-z0-9_.\-/]+)(\s*:)(?=\s|$)/);
      if (m) { push('punc', m[1]); push('prop', m[2]); push('punc', m[3]); i = m[0].length; }
      else {
        const d = src.match(/^(\s*)(- )/);
        if (d) { push('punc', d[1] + d[2]); i = d[0].length; }
      }
    }
    if (L.toml) {
      const m = src.match(/^\s*\[{1,2}[^\]]+\]{1,2}/);
      if (m) { push('type', m[0]); i = m[0].length; }
    }
  }

  while (i < n) {
    const c = src[i];
    const rest = src.slice(i);

    /* 공백 */
    if (c === ' ' || c === '\t') { let j = i; while (j < n && (src[j] === ' ' || src[j] === '\t')) j++; push('sp', src.slice(i, j)); i = j; continue; }

    /* 줄 주석 */
    if (L.line && rest.startsWith(L.line)) { push('com', rest); break; }

    /* 블록 주석 시작 */
    if (L.block && rest.startsWith(L.block[0])) {
      const e = src.indexOf(L.block[1], i + 2);
      if (e < 0) { push('com', rest); st.com = true; break; }
      push('com', src.slice(i, e + 2)); i = e + 2; continue;
    }

    /* 여러 줄 문자열(파이썬) */
    if (L.tri) {
      const t = L.tri.find(q => rest.startsWith(q));
      if (t) {
        const e = src.indexOf(t, i + 3);
        if (e < 0) { push('str', rest); st.str = t; break; }
        push('str', src.slice(i, e + 3)); i = e + 3; continue;
      }
    }

    /* 러스트 라이프타임 ('a) — 문자 리터럴과 구분한다 */
    if (L.rust && c === "'") {
      const lt = rest.match(/^'([A-Za-z_]\w*)(?!')/);
      if (lt) { push('type', lt[0]); i += lt[0].length; continue; }
      const ch = rest.match(/^'(\\.|[^'])'/);
      if (ch) { push('str', ch[0]); i += ch[0].length; continue; }
    }

    /* 어트리뷰트/데코레이터 (@Get, #[derive], @property) */
    if (L.deco) {
      if (c === '@') { const m = rest.match(/^@[\w.]*/); push('deco', m[0]); i += m[0].length; continue; }
      if (L.rust && c === '#') { const m = rest.match(/^#!?\[[^\]]*\]/); if (m) { push('deco', m[0]); i += m[0].length; continue; } }
    }

    /* 문자열 */
    if (L.quotes.includes(c)) {
      /* f-string / 템플릿 리터럴은 ${...}, {...} 안을 살짝 다르게 칠한다 */
      const isTpl = (L.tpl && c === L.tpl);
      const isF = L.fstr && /[fr]$/.test(src.slice(0, i)) && out.length && out[out.length - 1][1].endsWith('f');
      let j = i + 1, buf = c;
      while (j < n) {
        if (src[j] === '\\') { buf += src.slice(j, j + 2); j += 2; continue; }
        if (src[j] === c) { buf += c; j++; break; }
        const interp = (isTpl && src.startsWith('${', j)) || (isF && src[j] === '{' && src[j + 1] !== '{');
        if (interp) {
          push('str', buf); buf = '';
          const open = isTpl ? 2 : 1;
          let d = 1, k = j + open;
          while (k < n && d > 0) { if (src[k] === '{') d++; else if (src[k] === '}') d--; k++; }
          push('punc', src.slice(j, j + open));
          const innerSrc = src.slice(j + open, k - 1);
          for (const t of tokLine(innerSrc, L, { depth: 0 }).toks) out.push(t);
          push('punc', '}');
          j = k; continue;
        }
        buf += src[j]; j++;
      }
      push('str', buf); i = j; continue;
    }

    /* 숫자 */
    if (NUM_START.test(c) || (c === '.' && NUM_START.test(src[i + 1] || ''))) {
      const m = rest.match(/^(0[xXbBoO][0-9a-fA-F_]+|\.\d[\d_]*|\d[\d_]*\.?[\d_]*([eE][+-]?\d+)?)([a-zA-Z_]\w*)?/);
      if (m) { push('num', m[0]); i += m[0].length; continue; }
      push('punc', c); i++; continue;
    }

    /* JSX 태그 */
    if (L.jsx && c === '<') {
      const m = rest.match(/^<\/?([A-Za-z][\w.]*)/);
      if (m) { push('punc', m[0].slice(0, m[0].length - m[1].length)); push('tag', m[1]); i += m[0].length; st.tag = true; continue; }
      if (rest.startsWith('</>') || rest.startsWith('<>')) { const v = rest.startsWith('<>') ? '<>' : '</>'; push('tag', v); i += v.length; continue; }
    }
    if (st.tag && (c === '>' || rest.startsWith('/>'))) { const v = c === '>' ? '>' : '/>'; push('punc', v); i += v.length; st.tag = false; continue; }

    /* 식별자 / 키워드 */
    if (ID_START.test(c)) {
      let j = i; while (j < n && ID.test(src[j])) j++;
      const w = src.slice(i, j);
      const prev = lastMeaning(out);
      const next = src.slice(j).match(/^\s*(.)/);
      const nc = next ? next[1] : '';
      let t = 'plain';

      if (L.S.kw.has(w)) t = 'kw';
      else if (L.S.ctrl.has(w)) t = 'ctrl';
      else if (L.S.lit.has(w)) t = 'lit';
      else if (L.S.op2.has(w)) t = 'ctrl';
      else if (L.S.ty.has(w)) t = 'type';
      else if (L.upper && L.S.kw.has(w.toLowerCase())) t = 'kw';
      else if (L.upper && L.S.ctrl.has(w.toLowerCase())) t = 'ctrl';
      else if (L.upper && L.S.ty.has(w.toLowerCase())) t = 'type';
      else if (st.tag && nc === '=') t = 'attr';
      else if (nc === '(') t = 'fn';
      else if (nc === '!' && src[j + 1] === '(') t = 'fn';            // 러스트 매크로
      else if (/^[A-Z][A-Za-z0-9]*$/.test(w)) t = 'type';             // PascalCase
      else if (/^[A-Z][A-Z0-9_]{2,}$/.test(w)) t = 'const';           // UPPER_SNAKE
      else if (prev === '.') t = 'prop';
      else if (prev === ':' && (L.json || L.yaml)) t = 'plain';
      else t = 'var';

      /* 파이썬 데코레이터/정의 뒤 이름은 함수·클래스색으로 */
      if ((L.line === '#' || L.deco) && (prev === 'def' || prev === 'class')) t = prev === 'class' ? 'type' : 'fn';
      /* 선언 키워드 바로 뒤 식별자는 변수색 유지 */
      if (t === 'plain') t = 'var';
      push(t, w); i = j; continue;
    }

    /* 괄호 — 깊이별 색 (VS Code 브라켓 페어 색상화) */
    if ('([{'.includes(c)) { push('br' + (st.depth++ % 3), c); i++; continue; }
    if (')]}'.includes(c)) { st.depth = Math.max(0, st.depth - 1); push('br' + (st.depth % 3), c); i++; continue; }

    /* 연산자 / 구두점 */
    const opm = rest.match(/^(=>|===|!==|==|!=|<=|>=|&&|\|\||\?\?|\?\.|\.\.\.|\.\.=|\.\.|::|->|<-|\+\+|--|\*\*|[-+*/%<>=!&|^~?:]=?)/);
    if (opm) { push('op', opm[0]); i += opm[0].length; continue; }
    push('punc', c); i++;
  }
  return { toks: out, st };
}

/* 공백이 아닌 마지막 토큰의 문자열 — 문맥 판단에 쓴다 */
function lastMeaning(out) {
  for (let k = out.length - 1; k >= 0; k--) if (out[k][0] !== 'sp') return out[k][1];
  return '';
}

/* 마크다운은 줄 단위 규칙만 본다 */
function mdLine(src) {
  if (/^\s*#{1,6}\s/.test(src)) return [['mdh', src]];
  if (/^\s*```/.test(src)) return [['com', src]];
  if (/^\s*([-*+]|\d+\.)\s/.test(src)) {
    const m = src.match(/^\s*([-*+]|\d+\.)\s/);
    return [['ctrl', m[0]], ['plain', src.slice(m[0].length)]];
  }
  if (/^\s*>/.test(src)) return [['com', src]];
  const out = []; let last = 0;
  src.replace(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g, (m, _g, idx) => {
    if (idx > last) out.push(['plain', src.slice(last, idx)]);
    out.push([m[0] === '`' ? 'str' : m[0] === '[' ? 'fn' : 'mdb', m]);
    last = idx + m.length; return m;
  });
  if (last < src.length) out.push(['plain', src.slice(last)]);
  return out;
}

/* ── 파일 전체 토큰화 ─────────────────────────────────────────────────
   줄별 토큰과 "그 줄에 들어갈 때의 상태"를 함께 돌려준다. 한 줄만 다시
   그릴 때 states[i] 를 그대로 먹이면 블록 주석·문자열이 어긋나지 않는다.
   ------------------------------------------------------------------- */
const ZERO = { com: false, str: null, depth: 0, tag: false };

function tokenize(text, lang) {
  const L = LANGS[lang] || LANGS.txt;
  const lines = text.split('\n');
  const toks = [], states = [];
  let st = ZERO;
  for (const ln of lines) { states.push(st); const r = tokLine(ln, L, st); toks.push(r.toks); st = r.st; }
  return { toks, states };
}

/* 토큰 배열 → HTML. 공백은 그대로 두고(pre) 탭만 펼친다. */
function html(toks) {
  let s = '';
  for (const [t, v] of toks) {
    const x = esc(v.replace(/\t/g, '  '));
    s += t === 'sp' ? x : '<span class="t-' + t + '">' + x + '</span>';
  }
  return s || '&nbsp;';
}

function line(src, lang, st) {
  const L = LANGS[lang] || LANGS.txt;
  return tokLine(src, L, st || ZERO);
}

/* ════════════════════════════════════════════════════════════════════════
   테마
   ────────────────────────────────────────────────────────────────────────
   실제 VS Code 기본 테마들의 색값을 그대로 옮겼다. ui.* 는 크롬(타이틀바·
   사이드바·상태바), tok.* 는 토큰색이다. --t-* / --u-* CSS 변수로 나간다.
   ════════════════════════════════════════════════════════════════════════ */
const THEMES = {
  dark_modern: {
    label: 'Dark Modern', kind: 'dark',
    ui: {
      bg: '#1f1f1f', fg: '#cccccc', title: '#181818', titleFg: '#cccccc',
      act: '#181818', actFg: '#d7d7d7', actActive: '#ffffff', side: '#181818', sideFg: '#cccccc',
      sideHead: '#181818', tabBar: '#181818', tabActive: '#1f1f1f', tabActiveFg: '#ffffff',
      tabFg: '#9d9d9d', tabTop: '#0078d4', border: '#2b2b2b', panelBorder: '#2b2b2b',
      status: '#181818', statusFg: '#cccccc', statusRemote: '#0078d4',
      lineNr: '#6e7681', lineNrActive: '#cccccc', cur: '#282828', curBorder: '#2a2a2a',
      sel: '#264f78', panel: '#181818', term: '#cccccc', accent: '#0078d4',
      badge: '#0078d4', badgeFg: '#ffffff', hover: '#2a2d2e', widget: '#202020',
      scroll: '#4f4f4f', indent: '#404040', minimapSel: '#264f78',
      green: '#23d18b', red: '#f14c4c', yellow: '#cca700', blue: '#3794ff',
      magenta: '#d670d6', cyan: '#29b8db', gray: '#8b949e', dirty: '#e2c08d',
    },
    tok: {
      plain: '#cccccc', var: '#9cdcfe', kw: '#569cd6', ctrl: '#c586c0', str: '#ce9178',
      num: '#b5cea8', com: '#6a9955', fn: '#dcdcaa', type: '#4ec9b0', prop: '#9cdcfe',
      op: '#d4d4d4', punc: '#cccccc', tag: '#569cd6', attr: '#9cdcfe', deco: '#dcdcaa',
      const: '#4fc1ff', lit: '#569cd6', br0: '#ffd700', br1: '#da70d6', br2: '#179fff',
      mdh: '#569cd6', mdb: '#cccccc',
    },
  },
  dark_plus: {
    label: 'Dark+ (classic)', kind: 'dark',
    ui: {
      bg: '#1e1e1e', fg: '#d4d4d4', title: '#3c3c3c', titleFg: '#cccccc',
      act: '#333333', actFg: '#d7d7d7', actActive: '#ffffff', side: '#252526', sideFg: '#cccccc',
      sideHead: '#252526', tabBar: '#252526', tabActive: '#1e1e1e', tabActiveFg: '#ffffff',
      tabFg: '#969696', tabTop: '#007acc', border: '#252526', panelBorder: '#3c3c3c',
      status: '#007acc', statusFg: '#ffffff', statusRemote: '#16825d',
      lineNr: '#858585', lineNrActive: '#c6c6c6', cur: '#282828', curBorder: '#282828',
      sel: '#264f78', panel: '#1e1e1e', term: '#cccccc', accent: '#007acc',
      badge: '#4d4d4d', badgeFg: '#ffffff', hover: '#2a2d2e', widget: '#252526',
      scroll: '#4f4f4f', indent: '#404040', minimapSel: '#264f78',
      green: '#0dbc79', red: '#f14c4c', yellow: '#e5e510', blue: '#2472c8',
      magenta: '#bc3fbc', cyan: '#11a8cd', gray: '#888888', dirty: '#e2c08d',
    },
    tok: {
      plain: '#d4d4d4', var: '#9cdcfe', kw: '#569cd6', ctrl: '#c586c0', str: '#ce9178',
      num: '#b5cea8', com: '#6a9955', fn: '#dcdcaa', type: '#4ec9b0', prop: '#9cdcfe',
      op: '#d4d4d4', punc: '#d4d4d4', tag: '#569cd6', attr: '#9cdcfe', deco: '#dcdcaa',
      const: '#4fc1ff', lit: '#569cd6', br0: '#ffd700', br1: '#da70d6', br2: '#179fff',
      mdh: '#569cd6', mdb: '#d4d4d4',
    },
  },
  monokai: {
    label: 'Monokai', kind: 'dark',
    ui: {
      bg: '#272822', fg: '#f8f8f2', title: '#1e1f1c', titleFg: '#c5c8c6',
      act: '#1e1f1c', actFg: '#c5c8c6', actActive: '#f8f8f2', side: '#1e1f1c', sideFg: '#c5c8c6',
      sideHead: '#1e1f1c', tabBar: '#1e1f1c', tabActive: '#272822', tabActiveFg: '#f8f8f2',
      tabFg: '#8f908a', tabTop: '#a6e22e', border: '#1e1f1c', panelBorder: '#3a3b35',
      status: '#414339', statusFg: '#f8f8f2', statusRemote: '#a6e22e',
      lineNr: '#90908a', lineNrActive: '#f8f8f2', cur: '#3e3d32', curBorder: '#3e3d32',
      sel: '#49483e', panel: '#1e1f1c', term: '#f8f8f2', accent: '#a6e22e',
      badge: '#75715e', badgeFg: '#f8f8f2', hover: '#383830', widget: '#2d2e27',
      scroll: '#5a5b52', indent: '#464741', minimapSel: '#49483e',
      green: '#a6e22e', red: '#f92672', yellow: '#e6db74', blue: '#66d9ef',
      magenta: '#ae81ff', cyan: '#66d9ef', gray: '#75715e', dirty: '#e2c08d',
    },
    tok: {
      plain: '#f8f8f2', var: '#f8f8f2', kw: '#f92672', ctrl: '#f92672', str: '#e6db74',
      num: '#ae81ff', com: '#88846f', fn: '#a6e22e', type: '#66d9ef', prop: '#f8f8f2',
      op: '#f92672', punc: '#f8f8f2', tag: '#f92672', attr: '#a6e22e', deco: '#a6e22e',
      const: '#ae81ff', lit: '#ae81ff', br0: '#ffd700', br1: '#da70d6', br2: '#66d9ef',
      mdh: '#f92672', mdb: '#f8f8f2',
    },
  },
  one_dark: {
    label: 'One Dark Pro', kind: 'dark',
    ui: {
      bg: '#282c34', fg: '#abb2bf', title: '#21252b', titleFg: '#9da5b4',
      act: '#21252b', actFg: '#6b727d', actActive: '#d7dae0', side: '#21252b', sideFg: '#9da5b4',
      sideHead: '#21252b', tabBar: '#21252b', tabActive: '#282c34', tabActiveFg: '#d7dae0',
      tabFg: '#6b727d', tabTop: '#61afef', border: '#181a1f', panelBorder: '#181a1f',
      status: '#21252b', statusFg: '#9da5b4', statusRemote: '#4d78cc',
      lineNr: '#495162', lineNrActive: '#abb2bf', cur: '#2c313c', curBorder: '#2c313c',
      sel: '#3e4451', panel: '#21252b', term: '#abb2bf', accent: '#61afef',
      badge: '#4d78cc', badgeFg: '#ffffff', hover: '#2c313a', widget: '#21252b',
      scroll: '#4e5666', indent: '#3b4048', minimapSel: '#3e4451',
      green: '#98c379', red: '#e06c75', yellow: '#e5c07b', blue: '#61afef',
      magenta: '#c678dd', cyan: '#56b6c2', gray: '#5c6370', dirty: '#e2c08d',
    },
    tok: {
      plain: '#abb2bf', var: '#e06c75', kw: '#c678dd', ctrl: '#c678dd', str: '#98c379',
      num: '#d19a66', com: '#5c6370', fn: '#61afef', type: '#e5c07b', prop: '#e06c75',
      op: '#56b6c2', punc: '#abb2bf', tag: '#e06c75', attr: '#d19a66', deco: '#61afef',
      const: '#d19a66', lit: '#d19a66', br0: '#d19a66', br1: '#c678dd', br2: '#61afef',
      mdh: '#e06c75', mdb: '#abb2bf',
    },
  },
  github_dark: {
    label: 'GitHub Dark', kind: 'dark',
    ui: {
      bg: '#0d1117', fg: '#e6edf3', title: '#010409', titleFg: '#e6edf3',
      act: '#010409', actFg: '#7d8590', actActive: '#e6edf3', side: '#010409', sideFg: '#7d8590',
      sideHead: '#010409', tabBar: '#010409', tabActive: '#0d1117', tabActiveFg: '#e6edf3',
      tabFg: '#7d8590', tabTop: '#fd8c73', border: '#30363d', panelBorder: '#30363d',
      status: '#010409', statusFg: '#7d8590', statusRemote: '#1f6feb',
      lineNr: '#6e7681', lineNrActive: '#e6edf3', cur: '#161b22', curBorder: '#161b22',
      sel: '#264f78', panel: '#010409', term: '#e6edf3', accent: '#1f6feb',
      badge: '#1f6feb', badgeFg: '#ffffff', hover: '#161b22', widget: '#161b22',
      scroll: '#484f58', indent: '#21262d', minimapSel: '#264f78',
      green: '#3fb950', red: '#f85149', yellow: '#d29922', blue: '#58a6ff',
      magenta: '#bc8cff', cyan: '#39c5cf', gray: '#8b949e', dirty: '#e3b341',
    },
    tok: {
      plain: '#e6edf3', var: '#e6edf3', kw: '#ff7b72', ctrl: '#ff7b72', str: '#a5d6ff',
      num: '#79c0ff', com: '#8b949e', fn: '#d2a8ff', type: '#ffa657', prop: '#79c0ff',
      op: '#ff7b72', punc: '#e6edf3', tag: '#7ee787', attr: '#79c0ff', deco: '#d2a8ff',
      const: '#79c0ff', lit: '#79c0ff', br0: '#e6edf3', br1: '#bc8cff', br2: '#58a6ff',
      mdh: '#79c0ff', mdb: '#e6edf3',
    },
  },
};

/* 테마를 CSS 변수로 꽂는다. */
function applyTheme(id, el) {
  const th = THEMES[id] || THEMES.dark_modern;
  const s = (el || document.documentElement).style;
  for (const [k, v] of Object.entries(th.ui)) s.setProperty('--u-' + k, v);
  for (const [k, v] of Object.entries(th.tok)) s.setProperty('--t-' + k, v);
  return th;
}

return { tokenize, line, html, esc, THEMES, applyTheme, LANGS, ZERO };
})();

if (typeof module !== 'undefined') module.exports = HL;
