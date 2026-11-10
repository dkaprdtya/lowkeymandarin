"""Production entry point for Lowkey Mandarin.

Run this module with a WSGI server instead of ``python app.py``:

    python -m waitress --listen=127.0.0.1:5000 --threads=4 \
        --no-clear-untrusted-proxy-headers wsgi:app

``app.py`` remains usable for local development. Debug mode stays off unless
``FLASK_DEBUG=1`` is set explicitly.

When the app runs behind a reverse proxy, set ``HANZI_TRUST_PROXY=1``. ProxyFix
then reads ``X-Forwarded-For``, ``X-Forwarded-Proto``, ``X-Forwarded-Host`` and
``X-Forwarded-Port`` so rate limiting, secure cookies and HSTS see the real
client and scheme. Leave it unset when the app is exposed directly; otherwise a
client can spoof those headers.
"""
from __future__ import annotations

try:
    from app import app
except ImportError:  # pragma: no cover - package import
    from .app import app

# Proxy header handling lives in app.py so the Vercel entry point gets it too.
# Set HANZI_TRUST_PROXY=1 when this module runs behind nginx or Caddy.

__all__ = ["app"]


if __name__ == "__main__":
    app.run()
