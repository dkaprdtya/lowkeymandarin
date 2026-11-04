"""Consistent SQLite backup for Lowkey Mandarin.

Uses the SQLite online backup API, so a running server can be backed up without
copying a half-written database. The copy is verified with ``integrity_check``
before older backups are pruned.

Examples:

    python backup.py
    python backup.py --db /data/hanzi.db --out /data/backups --keep 14

Restore: stop the app, replace the database file with a backup, remove any
stale ``-wal`` and ``-shm`` files, then start the app again.
"""
from __future__ import annotations

import argparse
import os
import sqlite3
import sys
from datetime import datetime, timezone

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB = os.path.abspath(
    os.environ.get("HANZI_DB") or os.path.join(BASE_DIR, "instance", "hanzi.db")
)
DEFAULT_OUT = os.path.join(BASE_DIR, "backups")


def backup(source: str, destination: str) -> None:
    src = sqlite3.connect(source, timeout=10)
    try:
        src.execute("PRAGMA busy_timeout = 5000")
        dst = sqlite3.connect(destination)
        try:
            src.backup(dst)
            result = dst.execute("PRAGMA integrity_check").fetchone()
            if not result or result[0] != "ok":
                raise RuntimeError(f"integrity_check failed: {result}")
            dst.commit()
        finally:
            dst.close()
    finally:
        src.close()


def prune(folder: str, keep: int) -> None:
    if keep < 1:
        return
    names = sorted(
        name for name in os.listdir(folder)
        if name.startswith("hanzi-") and name.endswith(".db")
    )
    for name in names[:-keep]:
        os.remove(os.path.join(folder, name))


def main() -> int:
    parser = argparse.ArgumentParser(description="Back up the Lowkey Mandarin database.")
    parser.add_argument("--db", default=DEFAULT_DB, help="Source database path")
    parser.add_argument("--out", default=DEFAULT_OUT, help="Backup directory")
    parser.add_argument("--keep", type=int, default=14, help="Backups to keep (default 14)")
    args = parser.parse_args()

    source = os.path.abspath(args.db)
    if not os.path.isfile(source):
        print(f"No database at {source}", file=sys.stderr)
        return 1

    folder = os.path.abspath(args.out)
    os.makedirs(folder, exist_ok=True)
    if os.name != "nt":
        for path, mode in ((folder, 0o700),):
            try:
                os.chmod(path, mode)
            except OSError:
                pass
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    destination = os.path.join(folder, f"hanzi-{stamp}.db")

    backup(source, destination)
    if os.name != "nt":
        try:
            os.chmod(destination, 0o600)
        except OSError:
            pass
    prune(folder, args.keep)
    print(destination)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
