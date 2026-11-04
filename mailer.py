"""Optional password-reset email delivery.

Nothing here runs unless the operator sets SMTP environment variables. The app
never claims that an email was sent when delivery is not configured.
"""
from __future__ import annotations

import os
import smtplib
import ssl
from email.message import EmailMessage
from urllib.parse import urlsplit

SMTP_HOST = (os.environ.get("HANZI_SMTP_HOST") or "").strip()
try:
    SMTP_PORT = int(os.environ.get("HANZI_SMTP_PORT") or "587")
except ValueError:
    SMTP_PORT = 587
if not 1 <= SMTP_PORT <= 65535:
    SMTP_PORT = 587
SMTP_USER = (os.environ.get("HANZI_SMTP_USER") or "").strip()
SMTP_PASSWORD = os.environ.get("HANZI_SMTP_PASSWORD") or ""
SMTP_FROM = (os.environ.get("HANZI_SMTP_FROM") or SMTP_USER).strip()
SMTP_TLS = (os.environ.get("HANZI_SMTP_TLS") or "1") != "0"


def public_base() -> str:
    """Return a safe public origin for links, or an empty string.

    Password-reset links must never be built from the request Host header: a
    forged host could send the token to an attacker's domain. HTTPS is required
    except for loopback testing.
    """
    raw = (os.environ.get("HANZI_PUBLIC_URL") or "").strip().rstrip("/")
    if not raw:
        return ""
    parts = urlsplit(raw)
    if parts.scheme not in {"http", "https"} or not parts.hostname:
        return ""
    if parts.username or parts.password:
        return ""
    if parts.scheme == "http" and parts.hostname not in {"localhost", "127.0.0.1", "::1"}:
        return ""
    return f"{parts.scheme}://{parts.netloc}"


def smtp_configured() -> bool:
    return bool(SMTP_HOST and SMTP_FROM)


def reset_configured() -> bool:
    """Password reset needs both delivery and a trustworthy public origin."""
    return bool(smtp_configured() and public_base())


def send_password_reset(to_email: str, reset_url: str) -> None:
    """Send one plain-text reset message. Raises on delivery failure."""
    if not smtp_configured():
        raise RuntimeError("SMTP is not configured")

    message = EmailMessage()
    message["Subject"] = "Reset your Lowkey Mandarin password"
    message["From"] = SMTP_FROM
    message["To"] = to_email
    message.set_content(
        "Someone requested a password reset for this email address at Lowkey Mandarin.\n\n"
        f"Open this link within one hour:\n{reset_url}\n\n"
        "If you did not request it, ignore this message. Your password has not changed.\n"
    )

    context = ssl.create_default_context()
    if SMTP_PORT == 465:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context, timeout=15) as server:
            if SMTP_USER:
                server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(message)
        return

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
        if SMTP_TLS:
            server.starttls(context=context)
        if SMTP_USER:
            server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(message)
