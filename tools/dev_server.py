"""Servidor local de desarrollo (sin caché).

Uso:  python tools/dev_server.py [puerto]

Sirve la raíz del proyecto añadiendo cabeceras que impiden que el navegador
guarde copias obsoletas de CSS/JS mientras se edita. En producción (Vercel)
los archivos ya se sirven con revalidación, esto solo afecta al desarrollo.
"""

import http.server
import os
import socketserver
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", port), NoCacheHandler) as httpd:
        print(f"Sirviendo {ROOT} en http://127.0.0.1:{port}/")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
