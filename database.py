"""Database access for Lowkey Mandarin.

SQLite is used for local development and single-server deployments. When
``DATABASE_URL`` points at PostgreSQL (Neon, Supabase, RDS, ...) the same
application code runs against it instead, which is what serverless platforms
need: their filesystem is read-only and per-instance, so an SQLite file there
loses data as soon as an instance is recycled.

Learning content is shared. Progress, discoveries, study sessions and challenge
results belong to one account and are removed with that account.
"""
from __future__ import annotations

import os
import shutil
import sqlite3
from datetime import datetime, timezone

from flask import g

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BUNDLED_DB = os.path.join(BASE_DIR, "instance", "hanzi.db")
SCHEMA_PATH = os.path.join(BASE_DIR, "schema.sql")
SCHEMA_PG_PATH = os.path.join(BASE_DIR, "schema_postgres.sql")

# Vercel and most serverless runtimes mount the project read-only. SQLite needs
# a writable file and a writable sidecar for WAL, so a fallback database would
# have to live in /tmp. That storage is per instance and disappears with it,
# which silently loses accounts and progress; refuse to use it unless the
# operator explicitly opts into a throwaway demo database.
_SERVERLESS = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))
_ALLOW_EPHEMERAL = (os.environ.get("HANZI_ALLOW_EPHEMERAL") or "").strip().lower() in {
    "1", "true", "yes", "on",
}

DATABASE_URL = (os.environ.get("DATABASE_URL") or "").strip()
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = "postgresql://" + DATABASE_URL[len("postgres://"):]
IS_POSTGRES = DATABASE_URL.startswith("postgresql://")

DB_PATH = os.path.abspath(
    os.environ.get("HANZI_DB")
    or ("/tmp/hanzi.db" if _SERVERLESS else os.path.join(BASE_DIR, "instance", "hanzi.db"))
)

# Tables that hold learner state. A database created before accounts existed is
# migrated by discarding these tables; the shared vocabulary and materials are
# preserved and rebuilt by seed.py / sync_content().
LEARNER_TABLES = ("progress", "discoveries", "sessions", "challenge_results")

try:  # PostgreSQL support is optional so a plain SQLite checkout still runs.
    import psycopg as _psycopg
    from psycopg import errors as _pg_errors
except ImportError:  # pragma: no cover - depends on the install extras
    _psycopg = None
    _pg_errors = None

# Tuple usable as ``except INTEGRITY_ERRORS:`` for duplicate-key handling.
INTEGRITY_ERRORS: tuple[type[BaseException], ...] = (sqlite3.IntegrityError,)
if _pg_errors is not None:
    INTEGRITY_ERRORS += (_pg_errors.UniqueViolation, _pg_errors.IntegrityError)


class DatabaseNotConfigured(RuntimeError):
    """Raised when a serverless deployment has no durable database."""


def database_ready() -> bool:
    """True when the configured storage can accept writes durably."""
    if IS_POSTGRES:
        return True
    if not _SERVERLESS:
        return True
    return _ALLOW_EPHEMERAL


def _connect_pg():
    if _psycopg is None:
        raise DatabaseNotConfigured(
            "DATABASE_URL is set but the PostgreSQL driver is not installed. "
            "Add psycopg[binary] to requirements.txt."
        )
    last: Exception | None = None
    for _attempt in range(2):
        try:
            return _psycopg.connect(DATABASE_URL, connect_timeout=15)
        except Exception as exc:  # network hiccups and Neon wake-ups
            last = exc
    raise DatabaseNotConfigured(f"Could not connect to the configured database: {last}")


class Row:
    """Row that supports both column names and positional access.

    Mirrors ``sqlite3.Row`` closely enough for the rest of the codebase, which
    is written against that interface.
    """

    __slots__ = ("_values", "_index")

    def __init__(self, values, columns):
        self._values = tuple(values)
        self._index = {name: position for position, name in enumerate(columns)}

    def __getitem__(self, key):
        if isinstance(key, (int, slice)):
            return self._values[key]
        try:
            return self._values[self._index[key]]
        except KeyError:
            raise IndexError(f"No column named {key!r}") from None

    def __iter__(self):
        return iter(self._values)

    def __len__(self):
        return len(self._values)

    def keys(self):
        return list(self._index)

    def __repr__(self):
        return f"Row({dict(zip(self._index, self._values))!r})"


class PgCursor:
    """Small cursor shim that behaves like a sqlite3 cursor for our queries."""

    __slots__ = ("_rows", "rowcount", "lastrowid")

    def __init__(self, rows=(), rowcount: int = 0):
        self._rows = list(rows)
        self.rowcount = rowcount
        self.lastrowid = None

    def fetchone(self):
        return self._rows[0] if self._rows else None

    def fetchall(self):
        return list(self._rows)

    def __iter__(self):
        return iter(self._rows)


def _split_statements(script: str) -> list[str]:
    """Split a DDL script into statements.

    Line comments are removed first so a ';' inside prose cannot cut a comment
    into a statement. The schemas contain no ';' inside string literals and no
    '--' inside literals.
    """
    lines = []
    for line in script.splitlines():
        marker = line.find("--")
        if marker >= 0:
            line = line[:marker]
        lines.append(line)
    return [chunk.strip() for chunk in "\n".join(lines).split(";") if chunk.strip()]


class PgConnection:
    """Adapter that lets the SQLite-oriented queries run on PostgreSQL.

    Only two differences matter for this codebase: placeholders are ``%s``
    instead of ``?``, and rows are returned as :class:`Row` objects.
    """

    __slots__ = ("_raw",)

    def __init__(self, raw):
        self._raw = raw

    @staticmethod
    def _adapt(sql: str) -> str:
        return sql.replace("?", "%s")

    def execute(self, sql: str, params=()):
        cur = self._raw.cursor()
        cur.execute(self._adapt(sql), tuple(params) if params else ())
        if cur.description is None:
            result = PgCursor((), cur.rowcount)
        else:
            columns = [column[0] for column in cur.description]
            rows = [Row(values, columns) for values in cur.fetchall()]
            result = PgCursor(rows, len(rows))
        cur.close()
        return result

    def executemany(self, sql: str, sequence):
        rows = [tuple(item) for item in sequence]
        if not rows:
            return PgCursor((), 0)
        cur = self._raw.cursor()
        cur.executemany(self._adapt(sql), rows)
        result = PgCursor((), cur.rowcount)
        cur.close()
        return result

    def executescript(self, script: str):
        cur = self._raw.cursor()
        for statement in _split_statements(script):
            cur.execute(statement)
        cur.close()
        return PgCursor((), 0)

    def commit(self) -> None:
        self._raw.commit()

    def rollback(self) -> None:
        self._raw.rollback()

    def close(self) -> None:
        self._raw.close()


def prepare_storage() -> bool:
    """Make the SQLite database path writable before the first connection.

    Returns True when a bundled database was copied into place. On a normal
    server the path already exists or is created empty; nothing is copied.
    """
    folder = os.path.dirname(DB_PATH)
    os.makedirs(folder, exist_ok=True)
    if not _SERVERLESS or os.path.exists(DB_PATH):
        return False
    if os.path.exists(BUNDLED_DB) and os.path.abspath(BUNDLED_DB) != DB_PATH:
        shutil.copy2(BUNDLED_DB, DB_PATH)
        return True
    return False


def open_connection():
    """Open a connection outside a request, for startup and maintenance."""
    if IS_POSTGRES:
        return PgConnection(_connect_pg())
    prepare_storage()
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA busy_timeout = 5000")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


def get_db():
    if "db" not in g:
        if not database_ready():
            raise DatabaseNotConfigured(
                "This serverless deployment has no durable database. Set "
                "DATABASE_URL to a PostgreSQL connection string."
            )
        g.db = open_connection()
    return g.db


def close_db(_exc=None) -> None:
    db = g.pop("db", None)
    if db is not None:
        db.close()


def restrict_permissions() -> None:
    """Best-effort hardening for the database and its directory on POSIX."""
    if IS_POSTGRES or os.name == "nt":
        return
    folder = os.path.dirname(DB_PATH)
    for path, mode in ((folder, 0o700), (DB_PATH, 0o600)):
        try:
            os.chmod(path, mode)
        except OSError:
            pass


def table_columns(conn, table: str) -> set[str]:
    if IS_POSTGRES:
        rows = conn.execute(
            """SELECT column_name FROM information_schema.columns
               WHERE table_name=? AND table_schema=current_schema()""",
            (table,),
        ).fetchall()
        return {row[0] for row in rows}
    try:
        return {row[1] for row in conn.execute(f"PRAGMA table_info({table})").fetchall()}
    except sqlite3.DatabaseError:
        return set()


def prepare_schema(conn) -> bool:
    """Create tables and migrate a pre-account database.

    Returns True when a legacy learner table was discarded. The caller decides
    whether that is worth logging. Shared content is never dropped.
    """
    if IS_POSTGRES:
        with open(SCHEMA_PG_PATH, "r", encoding="utf-8") as handle:
            conn.executescript(handle.read())
        return False

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


def content_version(conn) -> str:
    row = conn.execute(
        "SELECT value FROM app_meta WHERE key='content_version' LIMIT 1"
    ).fetchone()
    return row[0] if row else ""


def set_content_version(conn, version: str) -> None:
    conn.execute(
        """INSERT INTO app_meta (key, value) VALUES ('content_version', ?)
           ON CONFLICT(key) DO UPDATE SET value=excluded.value""",
        (version,),
    )


def like_operator() -> str:
    """Case-insensitive LIKE. SQLite's LIKE ignores ASCII case; PostgreSQL needs ILIKE."""
    return "ILIKE" if IS_POSTGRES else "LIKE"


def bundled_word_count() -> int:
    """Word count of the bundled read-only archive.

    Used for metadata when no database is configured, so `/api/site` keeps
    reporting the archive size instead of zero.
    """
    if not os.path.exists(BUNDLED_DB):
        return 0
    try:
        conn = sqlite3.connect(f"file:{BUNDLED_DB}?mode=ro", uri=True)
    except sqlite3.Error:
        return 0
    try:
        return int(conn.execute("SELECT COUNT(*) FROM words").fetchone()[0])
    except (sqlite3.Error, TypeError):
        return 0
    finally:
        conn.close()


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
