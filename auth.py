"""Accounts, sessions, CSRF and password reset for Lowkey Mandarin.

Design notes
------------
* Passwords are hashed with Werkzeug's scrypt-based helper. Plain passwords are
  never written to the database, logs or exports.
* Sessions are opaque random tokens. Only a SHA-256 digest is stored, so a
  database leak does not expose usable session cookies.
* State-changing API calls require a CSRF header that matches the CSRF cookie
  (or the signed-in session's CSRF value). Session cookies are HttpOnly and
  SameSite=Lax.
* Email is used only for sign-in and optional password reset. There is no
  marketing email, analytics or verification email.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone

from flask import Flask, g, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

from database import get_db, iso, parse_dt
from mailer import public_base, reset_configured, send_password_reset
from security import RateLimiter

SESSION_COOKIE = "hanzi_session"
CSRF_COOKIE = "hanzi_csrf"
SESSION_DAYS = 30
RESET_MINUTES = 60
MAX_DISPLAY_NAME = 40
MIN_PASSWORD = 10
MAX_PASSWORD = 200
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]{2,}$")

AUTH_WRITE_PATHS = {
    "/api/auth/login": 10,
    "/api/auth/register": 6,
    "/api/auth/forgot": 4,
    "/api/auth/reset": 6,
}

CSRF_EXEMPT = {
    # Public read-only endpoints never need a token; listed for clarity.
    "/api/bootstrap", "/api/site", "/api/health",
}


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _secure_cookie() -> bool:
    forced = os.environ.get("HANZI_COOKIE_SECURE")
    if forced == "1":
        return True
    if forced == "0":
        return False
    if public_base().startswith("https://"):
        return True
    return request.is_secure


def _email_key(email: str) -> str:
    """Hash an address for limiter keys so memory never holds raw emails."""
    return hashlib.sha256(email.encode("utf-8")).hexdigest()[:32]


DUMMY_HASH = generate_password_hash(secrets.token_urlsafe(18))


def _client_ip() -> str:
    return request.remote_addr or "unknown"


def current_user() -> dict | None:
    return g.get("user")


def current_user_id() -> int | None:
    user = g.get("user")
    return int(user["id"]) if user else None


def require_user():
    """Return a JSON 401 response when no account is signed in."""
    if current_user() is None:
        return jsonify({"error": "Sign in to save progress."}), 401
    return None


def public_user(row: sqlite3.Row | dict) -> dict:
    try:
        settings = json.loads(row["settings"] or "{}")
    except (TypeError, ValueError, KeyError):
        settings = {}
    return {
        "id": row["id"],
        "email": row["email"],
        "displayName": row["display_name"] or row["email"].split("@")[0],
        "createdAt": row["created_at"],
        "settings": settings,
    }


def _normalise_email(value) -> str:
    return str(value or "").strip().lower()


def _validate_email(email: str) -> str | None:
    if len(email) > 254 or not EMAIL_RE.match(email):
        return "Enter a valid email address."
    return None


def _validate_password(password: str, email: str = "") -> str | None:
    if len(password) < MIN_PASSWORD:
        return f"Use at least {MIN_PASSWORD} characters."
    if len(password) > MAX_PASSWORD:
        return f"Use no more than {MAX_PASSWORD} characters."
    if email and password.lower() == email.lower():
        return "Do not use your email address as the password."
    return None


def _clean_name(value, email: str) -> str:
    name = " ".join(str(value or "").split())
    if not name:
        name = email.split("@")[0]
    return name[:MAX_DISPLAY_NAME]


def _set_session_cookie(response, token: str) -> None:
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=SESSION_DAYS * 86400,
        httponly=True,
        secure=_secure_cookie(),
        samesite="Lax",
        path="/",
    )


def _set_csrf_cookie(response, token: str) -> None:
    response.set_cookie(
        CSRF_COOKIE,
        token,
        max_age=365 * 86400,
        httponly=False,
        secure=_secure_cookie(),
        samesite="Lax",
        path="/",
    )


def _clear_session_cookie(response) -> None:
    response.delete_cookie(SESSION_COOKIE, path="/", samesite="Lax")


def establish_session(db, user_id: int):
    """Create a new session row and return (raw token, csrf token)."""
    now = datetime.now(timezone.utc)
    db.execute("DELETE FROM auth_sessions WHERE expires_at <= ?", (iso(now),))
    db.execute(
        """DELETE FROM auth_sessions
           WHERE user_id=? AND token_hash NOT IN (
             SELECT token_hash FROM auth_sessions WHERE user_id=?
             ORDER BY created_at DESC LIMIT 9
           )""",
        (user_id, user_id),
    )
    token = secrets.token_urlsafe(32)
    csrf = secrets.token_urlsafe(32)
    db.execute(
        """INSERT INTO auth_sessions
           (token_hash, user_id, csrf_token, created_at, expires_at, last_seen, ip, user_agent)
           VALUES (?,?,?,?,?,?,?,?)""",
        (
            hash_token(token),
            user_id,
            csrf,
            iso(now),
            iso(now + timedelta(days=SESSION_DAYS)),
            iso(now),
            _client_ip(),
            (request.user_agent.string or "")[:240],
        ),
    )
    return token, csrf


def _load_session(db) -> None:
    raw = request.cookies.get(SESSION_COOKIE)
    g.auth_session = None
    g.user = None
    if not raw:
        return

    row = db.execute(
        "SELECT * FROM auth_sessions WHERE token_hash=?", (hash_token(raw),)
    ).fetchone()
    if not row:
        return

    now = datetime.now(timezone.utc)
    expires = parse_dt(row["expires_at"])
    if not expires or expires <= now:
        db.execute("DELETE FROM auth_sessions WHERE token_hash=?", (row["token_hash"],))
        db.commit()
        return

    user = db.execute("SELECT * FROM users WHERE id=?", (row["user_id"],)).fetchone()
    if not user:
        db.execute("DELETE FROM auth_sessions WHERE token_hash=?", (row["token_hash"],))
        db.commit()
        return

    g.auth_session = dict(row)
    g.user = dict(user)

    last_seen = parse_dt(row["last_seen"])
    if not last_seen or (now - last_seen) > timedelta(hours=1):
        db.execute(
            "UPDATE auth_sessions SET last_seen=? WHERE token_hash=?",
            (iso(now), row["token_hash"]),
        )
        db.commit()


def init_auth(app: Flask) -> None:
    auth_limiter = RateLimiter(window=900)
    app.extensions["hanzi_auth_limiter"] = auth_limiter

    if public_base().startswith("https://") and os.environ.get("HANZI_COOKIE_SECURE") == "0":
        app.logger.warning(
            "HANZI_PUBLIC_URL is HTTPS but HANZI_COOKIE_SECURE=0. "
            "Session cookies would travel without the Secure flag."
        )
    if reset_configured() is False and (os.environ.get("HANZI_SMTP_HOST") or "").strip():
        app.logger.warning(
            "SMTP is set but password reset is disabled: HANZI_PUBLIC_URL must be "
            "an https origin (http is accepted only for localhost)."
        )

    @app.before_request
    def _load_identity():
        if request.path.startswith("/static/"):
            return None
        db = get_db()
        _load_session(db)

        cookie = request.cookies.get(CSRF_COOKIE) or ""
        g.csrf_cookie = cookie or secrets.token_urlsafe(32)
        g.csrf_new = not cookie
        g.csrf_token = (g.auth_session or {}).get("csrf_token") or g.csrf_cookie

        if g.auth_session and cookie != g.csrf_token:
            g.csrf_cookie = g.csrf_token
            g.csrf_new = True

        if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
            fetch_site = (request.headers.get("Sec-Fetch-Site") or "").lower()
            if fetch_site and fetch_site not in {"same-origin", "none"}:
                return jsonify({"error": "Cross-site requests are not accepted."}), 403

            supplied = request.headers.get("X-CSRF-Token") or ""
            if not supplied or not hmac.compare_digest(supplied, g.csrf_token):
                return jsonify({"error": "This request could not be verified. Reload the page."}), 403

            limit = AUTH_WRITE_PATHS.get(request.path)
            if limit and not auth_limiter.allow(f"{_client_ip()}:{request.path}", limit):
                response = jsonify({"error": "Too many attempts. Wait a few minutes and try again."})
                response.status_code = 429
                response.headers["Retry-After"] = "900"
                return response
        return None

    @app.after_request
    def _csrf_cookie(response):
        if getattr(g, "csrf_new", False):
            _set_csrf_cookie(response, g.csrf_cookie)
        return response

    # ------------------------------------------------------------------ #
    # Account endpoints
    # ------------------------------------------------------------------ #
    @app.get("/api/auth/me")
    def auth_me():
        user = current_user()
        return jsonify({"user": public_user(user) if user else None})

    @app.post("/api/auth/register")
    def auth_register():
        data = request.get_json(silent=True) or {}
        email = _normalise_email(data.get("email"))
        password = str(data.get("password") or "")
        error = _validate_email(email) or _validate_password(password, email)
        if error:
            return jsonify({"error": error}), 400

        if not auth_limiter.allow(f"register:email:{_email_key(email)}", 3):
            response = jsonify({"error": "Too many attempts. Wait a few minutes and try again."})
            response.status_code = 429
            response.headers["Retry-After"] = "900"
            return response

        db = get_db()
        if db.execute("SELECT 1 FROM users WHERE email=?", (email,)).fetchone():
            return jsonify({"error": "An account with that email already exists."}), 409

        now = iso()
        try:
            cur = db.execute(
                """INSERT INTO users
                   (email, password_hash, display_name, created_at, updated_at, settings)
                   VALUES (?,?,?,?,?,?)""",
                (
                    email,
                    generate_password_hash(password),
                    _clean_name(data.get("displayName"), email),
                    now,
                    now,
                    json.dumps({"pace": "hsk", "hskLevel": 1}),
                ),
            )
        except sqlite3.IntegrityError:
            return jsonify({"error": "An account with that email already exists."}), 409

        token, csrf = establish_session(db, int(cur.lastrowid))
        db.commit()
        row = db.execute("SELECT * FROM users WHERE id=?", (cur.lastrowid,)).fetchone()
        response = jsonify({"user": public_user(row)})
        response.status_code = 201
        _set_session_cookie(response, token)
        _set_csrf_cookie(response, csrf)
        return response

    @app.post("/api/auth/login")
    def auth_login():
        data = request.get_json(silent=True) or {}
        email = _normalise_email(data.get("email"))
        password = str(data.get("password") or "")
        email_key = _email_key(email)

        if not auth_limiter.allow(f"{_client_ip()}:email:{email_key}", 6):
            return jsonify({"error": "Too many attempts. Wait a few minutes and try again."}), 429
        if not auth_limiter.allow(f"login:email:{email_key}", 12):
            response = jsonify({"error": "Too many attempts. Wait a few minutes and try again."})
            response.status_code = 429
            response.headers["Retry-After"] = "900"
            return response

        db = get_db()
        row = db.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
        if not row:
            # Spend the same scrypt time for an unknown address, so response
            # timing does not reveal whether an account exists.
            check_password_hash(DUMMY_HASH, password)
            return jsonify({"error": "Email or password is incorrect."}), 401
        if not check_password_hash(row["password_hash"], password):
            return jsonify({"error": "Email or password is incorrect."}), 401

        token, csrf = establish_session(db, int(row["id"]))
        db.commit()
        response = jsonify({"user": public_user(row)})
        _set_session_cookie(response, token)
        _set_csrf_cookie(response, csrf)
        return response

    @app.post("/api/auth/logout")
    def auth_logout():
        session = g.get("auth_session")
        if session:
            db = get_db()
            db.execute("DELETE FROM auth_sessions WHERE token_hash=?", (session["token_hash"],))
            db.commit()
        response = jsonify({"ok": True})
        _clear_session_cookie(response)
        return response

    @app.post("/api/auth/profile")
    def auth_profile():
        denied = require_user()
        if denied:
            return denied
        data = request.get_json(silent=True) or {}
        user = current_user()
        name = _clean_name(data.get("displayName"), user["email"])
        db = get_db()
        db.execute(
            "UPDATE users SET display_name=?, updated_at=? WHERE id=?",
            (name, iso(), user["id"]),
        )
        db.commit()
        row = db.execute("SELECT * FROM users WHERE id=?", (user["id"],)).fetchone()
        return jsonify({"user": public_user(row)})

    @app.post("/api/auth/password")
    def auth_password():
        denied = require_user()
        if denied:
            return denied
        data = request.get_json(silent=True) or {}
        user = current_user()
        current = str(data.get("currentPassword") or "")
        new_password = str(data.get("newPassword") or "")

        if not check_password_hash(user["password_hash"], current):
            return jsonify({"error": "The current password is incorrect."}), 400
        error = _validate_password(new_password, user["email"])
        if error:
            return jsonify({"error": error}), 400

        db = get_db()
        db.execute(
            "UPDATE users SET password_hash=?, updated_at=? WHERE id=?",
            (generate_password_hash(new_password), iso(), user["id"]),
        )
        session = g.get("auth_session")
        if session:
            db.execute(
                "DELETE FROM auth_sessions WHERE user_id=? AND token_hash<>?",
                (user["id"], session["token_hash"]),
            )
        db.execute("DELETE FROM password_resets WHERE user_id=?", (user["id"],))
        db.commit()
        return jsonify({"ok": True})

    @app.post("/api/auth/forgot")
    def auth_forgot():
        data = request.get_json(silent=True) or {}
        email = _normalise_email(data.get("email"))
        if not reset_configured():
            return jsonify({
                "error": "Password reset by email is unavailable on this copy. "
                         "Sign in and change your password from the account page."
            }), 503
        if not _validate_email(email):
            return jsonify({"ok": True})

        email_key = _email_key(email)
        if not auth_limiter.allow(f"{_client_ip()}:forgot", 4):
            return jsonify({"error": "Too many attempts. Wait a few minutes and try again."}), 429
        if not auth_limiter.allow(f"forgot:email:{email_key}", 3):
            return jsonify({"error": "Too many attempts. Wait a few minutes and try again."}), 429

        db = get_db()
        row = db.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
        if row:
            now = datetime.now(timezone.utc)
            token = secrets.token_urlsafe(32)
            db.execute(
                "UPDATE password_resets SET used_at=? WHERE user_id=? AND used_at IS NULL",
                (iso(now), row["id"]),
            )
            db.execute(
                """INSERT INTO password_resets (user_id, token_hash, created_at, expires_at)
                   VALUES (?,?,?,?)""",
                (
                    row["id"],
                    hash_token(token),
                    iso(now),
                    iso(now + timedelta(minutes=RESET_MINUTES)),
                ),
            )
            db.commit()
            base = public_base()
            try:
                send_password_reset(email, f"{base}/#/account?reset={token}")
            except Exception as exc:  # delivery failure must not leak account state
                app.logger.error("Password reset email failed: %s", exc)
        return jsonify({"ok": True})

    @app.post("/api/auth/reset")
    def auth_reset():
        data = request.get_json(silent=True) or {}
        token = str(data.get("token") or "")
        password = str(data.get("password") or "")
        if not token:
            return jsonify({"error": "This reset link is incomplete."}), 400

        db = get_db()
        row = db.execute(
            "SELECT * FROM password_resets WHERE token_hash=?", (hash_token(token),)
        ).fetchone()
        expires = parse_dt(row["expires_at"]) if row else None
        if not row or row["used_at"] or not expires or expires <= datetime.now(timezone.utc):
            return jsonify({"error": "This reset link is invalid or has expired."}), 400

        user = db.execute("SELECT * FROM users WHERE id=?", (row["user_id"],)).fetchone()
        if not user:
            return jsonify({"error": "This reset link is invalid or has expired."}), 400
        error = _validate_password(password, user["email"])
        if error:
            return jsonify({"error": error}), 400

        now = iso()
        db.execute(
            "UPDATE users SET password_hash=?, updated_at=? WHERE id=?",
            (generate_password_hash(password), now, user["id"]),
        )
        db.execute(
            "UPDATE password_resets SET used_at=? WHERE id=?", (now, row["id"])
        )
        db.execute("DELETE FROM auth_sessions WHERE user_id=?", (user["id"],))
        db.commit()
        return jsonify({"ok": True})

    @app.post("/api/account/delete")
    def account_delete():
        denied = require_user()
        if denied:
            return denied
        data = request.get_json(silent=True) or {}
        user = current_user()
        if str(data.get("confirm") or "") != "DELETE":
            return jsonify({"error": "Type DELETE to confirm account removal."}), 400
        if not check_password_hash(user["password_hash"], str(data.get("password") or "")):
            return jsonify({"error": "The password is incorrect."}), 400

        db = get_db()
        db.execute("DELETE FROM users WHERE id=?", (user["id"],))
        db.commit()
        response = jsonify({"ok": True})
        _clear_session_cookie(response)
        return response


def account_stats(db, user_id: int) -> dict:
    """Small, read-only summary used by the account page."""
    row = db.execute(
        """SELECT COUNT(*) AS tracked,
                  COALESCE(SUM(saved),0) AS saved,
                  COALESCE(SUM(reps >= 2),0) AS retained
           FROM progress WHERE user_id=?""",
        (user_id,),
    ).fetchone()
    return {
        "tracked": row["tracked"] if row else 0,
        "saved": row["saved"] if row else 0,
        "retained": row["retained"] if row else 0,
    }
