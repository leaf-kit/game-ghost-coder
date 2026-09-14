#!/usr/bin/env python3
"""GhostCoder — 로컬 정적 서버.

index.html 은 빌드도 CDN 도 쓰지 않는 순수 정적 페이지다. 같은 폴더의
syntax.js 와 scenarios.js 만 곁에 있으면 되고, 그대로 GitHub Pages 같은
정적 호스팅에 올려도 동작한다. 브라우저로 index.html 을 바로 열어도
대개 잘 돌아간다.

이 스크립트는 file:// 대신 http:// 로 띄우고 싶을 때 쓰는 편의 도구다.
  · 일부 브라우저가 file:// 에서 하위 스크립트 로드를 막을 때
  · 전체화면처럼 보안 컨텍스트를 타는 기능을 쓸 때
  · 사무실 모니터나 남는 노트북에 URL 로 띄워 둘 때

    python3 serve.py            # http://localhost:8010
    python3 serve.py 8080       # 포트 지정
"""

import http.server
import os
import socket
import socketserver
import sys
import webbrowser

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8010


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        # 개발 중 캐시 때문에 수정이 반영되지 않는 일을 막는다.
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("  %s\n" % (fmt % args))


def lan_ip():
    """같은 네트워크의 다른 기기에서 접속할 수 있도록 사설 IP를 찾는다."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))
        return s.getsockname()[0]
    except OSError:
        return None
    finally:
        s.close()


class Server(socketserver.TCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    with Server(("", PORT), Handler) as httpd:
        ip = lan_ip()
        print()
        print("  GHOSTCODER — Autonomous Engineer Simulator")
        print("  ────────────────────────────────────────────────")
        print(f"  Local     http://localhost:{PORT}/")
        if ip:
            print(f"  Network   http://{ip}:{PORT}/")
        print(f"  Kiosk     http://localhost:{PORT}/"
              "?auto=1&layout=agent&stack=go&mission=incident&pace=turbo")
        print()
        print("  Ctrl+C to stop")
        print()
        try:
            webbrowser.open(f"http://localhost:{PORT}/")
        except Exception:
            pass
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n  bye.\n")
