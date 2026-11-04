"""Security helpers for Lowkey Mandarin.

Accounts exist, so cookies and request verification matter. These headers,
cookie rules and limits are centralised here instead of being scattered through
the route modules.
"""
from __future__ import annotations

import gzip
import os
import time
from collections import defaultdict, deque
from urllib.parse import urlsplit

from flask import Flask, jsonify, request

# Requests per rolling minute, per client address.
READ_LIMIT = 240
WRITE_LIMIT = 60
WINDOW_SECONDS = 60

# Google Fonts and jsDelivr (optional Hanzi Writer stroke data) are the only
# external origins the interface needs. Inline styles are used for dynamic
# meters and SVG colours; inline scripts are not.
CONTENT_SECURITY_POLICY = "; ".join([
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "script-src 'self' https://cdn.jsdelivr.net",
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
])


def trusted_hosts() -> list[str]:
    """Hostnames accepted by Flask when a public origin is configured.

    A forged Host header must not poison generated links. Loopback stays allowed
    for container health checks and local diagnostics.
    """
    hosts = {
        item.strip().lower()
        for item in (os.environ.get("HANZI_TRUSTED_HOSTS") or "").split(",")
        if item.strip()
    }
    public = urlsplit((os.environ.get("HANZI_PUBLIC_URL") or "").strip())
    if public.hostname:
        hosts.add(public.hostname.lower())
    if hosts:
        hosts.update({"127.0.0.1", "localhost", "::1", "[::1]"})
    return sorted(hosts)


class RateLimiter:
    """Small in-process sliding-window limiter.

    One process only: the development server and the documented single-worker
    deployment. A multi-worker production deployment should move this to Redis
    or the reverse proxy.
    """

    def __init__(self, read_limit: int = READ_LIMIT, write_limit: int = WRITE_LIMIT,
                 window: int = WINDOW_SECONDS):
        self.read_limit = read_limit
        self.write_limit = write_limit
        self.window = window
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def allow(self, key: str, limit: int, now: float | None = None) -> bool:
        now = time.monotonic() if now is None else now
        stamps = self._hits[key]
        cutoff = now - self.window
        while stamps and stamps[0] <= cutoff:
            stamps.popleft()
        if len(stamps) >= limit:
            return False
        stamps.append(now)
        # Opportunistic cleanup so the dict cannot grow without bounds.
        if len(self._hits) > 2048:
            for other in [k for k, v in self._hits.items() if not v or v[-1] <= cutoff]:
                self._hits.pop(other, None)
        return True


def init_security(app: Flask) -> None:
    limiter = RateLimiter()
    app.extensions["hanzi_rate_limiter"] = limiter
    try:
        max_body = int(os.environ.get("HANZI_MAX_BODY") or 256 * 1024)
    except ValueError:
        max_body = 256 * 1024
    app.config["MAX_CONTENT_LENGTH"] = max(1024, min(max_body, 4 * 1024 * 1024))
    hosts = trusted_hosts()
    if hosts:
        app.config["TRUSTED_HOSTS"] = hosts

    @app.before_request
    def _guard_requests():
        # Static assets are cheap and only served from this origin.
        if request.path.startswith("/static/"):
            return None

        client = request.remote_addr or "unknown"
        write = request.method in {"POST", "PUT", "PATCH", "DELETE"}
        limit = limiter.write_limit if write else limiter.read_limit
        if not limiter.allow(f"{client}:{'w' if write else 'r'}", limit):
            response = jsonify({"error": "Too many requests. Wait a minute and try again."})
            response.status_code = 429
            response.headers["Retry-After"] = str(limiter.window)
            return response

        if write and request.content_length:
            content_type = (request.content_type or "").split(";")[0].strip().lower()
            if content_type != "application/json":
                return jsonify({"error": "Expected a JSON request body."}), 415
        return None

    @app.after_request
    def _security_headers(response):
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Cross-Origin-Resource-Policy", "same-origin")
        response.headers.setdefault("X-Permitted-Cross-Domain-Policies", "none")
        response.headers.setdefault("Origin-Agent-Cluster", "?1")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault(
            "Permissions-Policy",
            "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
        )
        response.headers.setdefault("Content-Security-Policy", CONTENT_SECURITY_POLICY)
        response.headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
        if request.is_secure:
            response.headers.setdefault(
                "Strict-Transport-Security", "max-age=31536000; includeSubDomains"
            )
        if request.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
            # The graph payload is over a megabyte of JSON. Compressing it here
            # keeps that usable behind any WSGI server, not just a proxy that
            # happens to enable gzip.
            if (
                request.method != "HEAD"
                and response.status_code == 200
                and response.mimetype == "application/json"
                and "gzip" in (request.headers.get("Accept-Encoding") or "")
                and not response.headers.get("Content-Encoding")
                and not response.direct_passthrough
            ):
                data = response.get_data()
                if len(data) >= 1024:
                    compressed = gzip.compress(data, 6)
                    response.set_data(compressed)
                    response.headers["Content-Encoding"] = "gzip"
                    response.headers["Content-Length"] = str(len(compressed))
                    response.headers.setdefault("Vary", "Accept-Encoding")
        return response
