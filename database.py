"""SQLite access and schema migration for Lowkey Mandarin.

Learning content is shared. Progress, discoveries, study sessions and challenge
results belong to one account and are removed with that account.
"""
from __future__ import annotations

import os
import sqlite3
from datetime import datetime, timezone

from flask import g

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.abspath(
    os.environ.get("HANZI_DB") or os.path.join(BASE_DIR, "instance", "hanzi.db")
)
SCHEMA_PATH = os.path.join(BASE_DIR, "schema.sql")

# Tables that hold learner state. A database created before accounts existed is
# migrated by discarding these tables; the shared vocabulary and materials are
# preserved and rebuilt by seed.py / sync_content().
LEARNER_TABLES = ("progress", "discoveries", "sessions", "challenge_results")


def get_db() -> sqlite3.Connection:
    if "db" not in g:
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
        conn = sqlite3.connect(DB_PATH, timeout=10)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        conn.execute("PRAGMA busy_timeout = 5000")
        conn.execute("PRAGMA journal_mode = WAL")
        g.db = conn
    return g.db


def close_db(_exc=None) -> None:
    db = g.pop("db", None)
    if db is not None:
        db.close()


def restrict_permissions() -> None:
    """Best-effort hardening for the database and its directory on POSIX."""
    if os.name == "nt":
        return
    folder = os.path.dirname(DB_PATH)
    for path, mode in ((folder, 0o700), (DB_PATH, 0o600)):
        try:
            os.chmod(path, mode)
        except OSError:
            pass


def table_columns(conn: sqlite3.Connection, table: str) -> set[str]:
    try:
        return {row[1] for row in conn.execute(f"PRAGMA table_info({table})").fetchall()}
    except sqlite3.DatabaseError:
        return set()


def prepare_schema(conn: sqlite3.Connection) -> bool:
    """Create tables and migrate a pre-account database.

    Returns True when a legacy learner table was discarded. The caller decides
    whether that is worth logging. Shared content is never dropped.
    """
    columns = table_columns(conn, "progress")
    migrated = bool(columns) and "user_id" not in columns
    if migrated:
        # The old indexes and constraints refer to the single-learner shape, so
        # the learner tables must be removed before the new schema is applied.
        for table in LEARNER_TABLES:
            conn.execute(f"DROP TABLE IF EXISTS {table}")
        conn.execute("DROP TABLE IF EXISTS profile")

    with open(SCHEMA_PATH, "r", encoding="utf-8") as handle:
        conn.executescript(handle.read())

    if not migrated and "profile" in {
        row[0] for row in conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        ).fetchall()
    }:
        # The single-profile table is obsolete once accounts exist.
        conn.execute("DROP TABLE IF EXISTS profile")
    return migrated


def iso(value: datetime | None = None) -> str:
    return (value or datetime.now(timezone.utc)).replace(microsecond=0).isoformat()


def parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value)
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
    except (TypeError, ValueError):
        return None
