# -*- coding: utf-8 -*-
"""Lowkey Mandarin — Flask API + SQLite persistence.

Shared learning content, per-account progress, spaced repetition, scenarios,
sound archive, character lab and arcade results. No frontend framework.
"""
from __future__ import annotations

import json
import os
import random
import sqlite3
from datetime import datetime, timedelta, timezone

from flask import Flask, jsonify, render_template, request

try:
    from auth import (
        account_stats,
        current_user,
        current_user_id,
        init_auth,
        public_user,
        require_user,
    )
    from database import (
        DatabaseNotConfigured,
        DATABASE_URL_KEYS,
        DATABASE_URL_SOURCE,
        IS_POSTGRES,
        acquire_startup_lock,
        bundled_word_count,
        close_db,
        content_version,
        database_ready,
        get_db,
        iso,
        like_operator,
        open_connection,
        parse_dt,
        prepare_schema,
        release_startup_lock,
        restrict_permissions,
        set_content_version,
    )
    from seed import CONTENT_VERSION, WORDS, seed, sync_content
    from materials import HSK_MATERIAL
    from security import init_security
    from webfront import init_site
except ImportError:  # pragma: no cover - package import
    from .auth import (
        account_stats,
        current_user,
        current_user_id,
        init_auth,
        public_user,
        require_user,
    )
    from .database import (
        DatabaseNotConfigured,
        DATABASE_URL_KEYS,
        DATABASE_URL_SOURCE,
        IS_POSTGRES,
        acquire_startup_lock,
        bundled_word_count,
        close_db,
        content_version,
        database_ready,
        get_db,
        iso,
        like_operator,
        open_connection,
        parse_dt,
        prepare_schema,
        release_startup_lock,
        restrict_permissions,
        set_content_version,
    )
    from .seed import CONTENT_VERSION, WORDS, seed, sync_content
    from .materials import HSK_MATERIAL
    from .security import init_security
    from .webfront import init_site

RELATION_TYPES = ["synonym", "antonym", "time", "semantic", "collocation", "sentence", "component"]

# Hand-tokenised sentences for the reconstruction game.
SENTENCES = [
    {"tokens": ["我", "每天", "坐", "地铁", "去", "学校", "。"],
     "en": "I take the subway to school every day.", "focus": "每天"},
    {"tokens": ["明天", "下午", "你", "有", "时间", "吗", "？"],
     "en": "Do you have time tomorrow afternoon?", "focus": "时间"},
    {"tokens": ["我", "想", "喝", "一杯", "咖啡", "。"],
     "en": "I would like a coffee.", "focus": "咖啡"},
    {"tokens": ["昨天", "我", "很", "忙", "，", "没有", "时间", "。"],
     "en": "I was busy yesterday, I had no time.", "focus": "昨天"},
    {"tokens": ["老师", "问", "了", "一个", "问题", "。"],
     "en": "The teacher asked a question.", "focus": "问"},
    {"tokens": ["我", "认识", "他", "，", "但是", "不", "知道", "他", "的", "名字", "。"],
     "en": "I know him, but I don't know his name.", "focus": "认识"},
    {"tokens": ["山", "上", "有", "很", "多", "树", "。"],
     "en": "There are many trees on the mountain.", "focus": "山"},
    {"tokens": ["请", "给", "我", "一杯", "水", "。"],
     "en": "Please give me a glass of water.", "focus": "水"},
    {"tokens": ["今天", "下雨", "，", "我们", "不", "去", "公园", "。"],
     "en": "It is raining today, we are not going to the park.", "focus": "今天"},
    {"tokens": ["晚上", "我", "想", "看书", "。"],
     "en": "In the evening I want to read.", "focus": "晚上"},
]

app = Flask(__name__, static_folder="static", template_folder="templates")
app.json.ensure_ascii = False
app.config["HANZI_CONTACT_EMAIL"] = (os.environ.get("HANZI_CONTACT_EMAIL") or "").strip()


def _proxy_fix_enabled() -> bool:
    forced = (os.environ.get("HANZI_TRUST_PROXY") or "").strip().lower()
    if forced in {"1", "true", "yes", "on"}:
        return True
    if forced in {"0", "false", "no", "off"}:
        return False
    # Vercel terminates TLS and sets X-Forwarded-For at the edge. Without this,
    # every client shares the proxy address and one rate-limit bucket.
    return bool(os.environ.get("VERCEL"))


if _proxy_fix_enabled():
    from werkzeug.middleware.proxy_fix import ProxyFix

    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=1)

init_security(app)
init_auth(app)
init_site(app)
app.teardown_appcontext(close_db)


@app.errorhandler(DatabaseNotConfigured)
def _database_not_configured(_error):
    # Deliberately generic: connection strings and driver errors stay in logs.
    return jsonify({"error": "The archive database is not connected yet."}), 503


def safe_int(value, default: int, low: int | None = None, high: int | None = None) -> int:
    try:
        number = int(value)
    except (TypeError, ValueError):
        return default
    if low is not None:
        number = max(low, number)
    if high is not None:
        number = min(high, number)
    return number


def safe_float(value, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


# --------------------------------------------------------------------------- #
# Database initialisation
# --------------------------------------------------------------------------- #
def init_db() -> int:
    """Create or migrate storage, then return the shared word count.

    Runs once per process. With PostgreSQL the schema and seed are idempotent,
    so a cold serverless instance only pays for a count query.
    """
    if not database_ready():
        app.logger.error(
            "No durable database configured. Set DATABASE_URL to a PostgreSQL "
            "connection string; API routes will answer 503 until then."
        )
        # A Git deployment does not carry the gitignored instance database, so
        # fall back to the source vocabulary instead of reporting zero words.
        return max(bundled_word_count(), len(WORDS))

    conn = open_connection()
    acquire_startup_lock(conn)
    try:
        migrated = prepare_schema(conn)
        count = conn.execute("SELECT COUNT(*) FROM words").fetchone()[0]
        stored_version = content_version(conn)
        if count == 0:
            seed(conn)
        elif stored_version != CONTENT_VERSION:
            sync_content(conn)
        if stored_version != CONTENT_VERSION:
            set_content_version(conn, CONTENT_VERSION)
        conn.commit()
        count = conn.execute("SELECT COUNT(*) FROM words").fetchone()[0]
    finally:
        try:
            release_startup_lock(conn)
        except Exception:
            app.logger.exception("Could not release the database startup lock")
        conn.close()

    restrict_permissions()
    if migrated:
        app.logger.warning(
            "Legacy single-profile learner data was removed. Shared vocabulary was kept."
        )
    return count


HSK_TITLES = {
    1: "Foundations",
    2: "Everyday",
    3: "Independent",
    4: "Working",
    5: "Fluent",
    6: "Literary",
}
HSK_CLEAR_AT = 60


# --------------------------------------------------------------------------- #
# Per-account state helpers
# --------------------------------------------------------------------------- #
def read_settings(db, user_id: int | None = None) -> dict:
    defaults = {"pace": "hsk", "hskLevel": 1}
    if not user_id:
        return defaults
    row = db.execute("SELECT settings FROM users WHERE id=?", (user_id,)).fetchone()
    if not row:
        return defaults
    try:
        stored = json.loads(row["settings"] or "{}")
    except (TypeError, ValueError):
        stored = {}
    return {**defaults, **stored}


def write_settings(db, user_id: int, settings: dict) -> None:
    db.execute(
        "UPDATE users SET settings=?, updated_at=? WHERE id=?",
        (json.dumps(settings, ensure_ascii=False), iso(), user_id),
    )
    db.commit()


def progress_map(db, user_id: int | None = None) -> dict[int, sqlite3.Row]:
    if not user_id:
        return {}
    return {
        row["word_id"]: row
        for row in db.execute(
            "SELECT * FROM progress WHERE user_id=?", (user_id,)
        ).fetchall()
    }


def record_discovery(db, user_id: int | None, kind: str, ref: str, title: str,
                     detail: str = "") -> bool:
    if not user_id:
        return False
    exists = db.execute(
        "SELECT 1 FROM discoveries WHERE user_id=? AND kind=? AND ref=? LIMIT 1",
        (user_id, kind, ref),
    ).fetchone()
    if exists:
        return False
    db.execute(
        """INSERT INTO discoveries (user_id, kind, ref, title, detail, created_at)
           VALUES (?,?,?,?,?,?)""",
        (user_id, kind, ref, title, detail, iso()),
    )
    return True


def ladder_payload(db, user_id: int | None = None, settings: dict | None = None) -> dict:
    settings = settings or read_settings(db, user_id)
    pmap = progress_map(db, user_id)
    now = datetime.now(timezone.utc)
    words = db.execute("SELECT * FROM words ORDER BY id").fetchall()
    level_value = int(settings.get("hskLevel") or 1)
    pace = settings.get("pace") if settings.get("pace") in ("hsk", "efficiency") else "hsk"

    levels = []
    available = sorted({w["hsk"] for w in words})
    if available and level_value not in available:
        level_value = available[0]
    for hsk in available:
        items = [w for w in words if w["hsk"] == hsk]
        discovered = sum(1 for w in items if pmap.get(w["id"]) and pmap[w["id"]]["discovered"])
        retained = sum(1 for w in items if pmap.get(w["id"]) and pmap[w["id"]]["reps"] >= 2)
        due = sum(
            1 for w in items
            if pmap.get(w["id"])
            and pmap[w["id"]]["reps"] > 0
            and (parse_dt(pmap[w["id"]]["due"]) or now) <= now
        )
        progress = round((discovered / max(1, len(items))) * 100)
        levels.append({
            "hsk": hsk,
            "title": HSK_TITLES.get(hsk, f"HSK {hsk}"),
            "total": len(items),
            "discovered": discovered,
            "retained": retained,
            "due": due,
            "progress": progress,
            "cleared": progress >= HSK_CLEAR_AT,
            "current": hsk == level_value,
            "ahead": hsk > level_value,
            "preview": hsk >= 6,
            "material": HSK_MATERIAL.get(hsk, []),
        })

    if not levels:
        return {"pace": pace, "level": 1, "levels": [], "current": None, "next": None, "clearAt": HSK_CLEAR_AT}

    available = {entry["hsk"] for entry in levels}
    if level_value not in available:
        level_value = levels[0]["hsk"]
    current = next(entry for entry in levels if entry["hsk"] == level_value)
    next_entry = next((entry for entry in levels if entry["hsk"] > level_value), None)
    in_scope = words if pace == "efficiency" else [w for w in words if w["hsk"] <= level_value]
    scope_due = sum(
        1 for w in in_scope
        if pmap.get(w["id"])
        and pmap[w["id"]]["reps"] > 0
        and (parse_dt(pmap[w["id"]]["due"]) or now) <= now
    )
    return {
        "pace": pace,
        "level": level_value,
        "levels": levels,
        "current": current,
        "next": next_entry,
        "scopeDue": scope_due,
        "scopeWords": len(in_scope),
        "clearAt": HSK_CLEAR_AT,
    }


# --------------------------------------------------------------------------- #
# Serialisation
# --------------------------------------------------------------------------- #
def word_payload(row: sqlite3.Row, progress: sqlite3.Row | None = None) -> dict:
    data = {
        "id": row["id"],
        "hanzi": row["hanzi"],
        "pinyin": row["pinyin"],
        "meaning": row["meaning"],
        "category": row["category"],
        "hsk": row["hsk"],
        "radical": row["radical"],
        "strokes": row["strokes"],
        "components": row["components"].split(),
        "example": row["example"],
        "examplePinyin": row["example_pinyin"],
        "exampleEn": row["example_en"],
        "note": row["note"],
    }
    data["progress"] = {
        "state": progress["state"] if progress else "new",
        "saved": bool(progress["saved"]) if progress else False,
        "reps": progress["reps"] if progress else 0,
        "ease": progress["ease"] if progress else 2.5,
        "interval": progress["interval"] if progress else 0,
        "due": progress["due"] if progress else None,
        "confidence": progress["confidence"] if progress else 0,
        "discovered": progress["discovered"] if progress else None,
    }
    return data


# --------------------------------------------------------------------------- #
# Pages
# --------------------------------------------------------------------------- #
@app.route("/")
def index():
    return render_template("index.html")


# --------------------------------------------------------------------------- #
# Bootstrap
# --------------------------------------------------------------------------- #
@app.route("/api/bootstrap")
def bootstrap():
    db = get_db()
    user_id = current_user_id()
    user = current_user()
    pmap = progress_map(db, user_id)
    words = db.execute("SELECT * FROM words ORDER BY id").fetchall()
    settings = read_settings(db, user_id)
    scope_words = words
    if settings.get("pace") == "hsk":
        scope_words = [w for w in words if w["hsk"] <= int(settings.get("hskLevel") or 1)]

    now = datetime.now(timezone.utc)
    due = sum(
        1 for w in scope_words
        if pmap.get(w["id"]) and (parse_dt(pmap[w["id"]]["due"]) or now) <= now
    )
    discovered = [w for w in words if pmap.get(w["id"]) and pmap[w["id"]]["discovered"]]
    retained = [w for w in words if pmap.get(w["id"]) and pmap[w["id"]]["reps"] >= 2]

    # Current exploration: the category with the most discovered words.
    by_cat: dict[str, list] = {}
    for w in discovered:
        by_cat.setdefault(w["category"], []).append(w)
    current_cat = max(by_cat, key=lambda c: len(by_cat[c])) if by_cat else "time"
    cat_words = [w for w in words if w["category"] == current_cat]
    cat_ids = {w["id"] for w in cat_words}
    rels = db.execute("SELECT * FROM relations").fetchall()
    known_ids = {w["id"] for w in discovered}
    connected_ids = set()
    for r in rels:
        if r["source_id"] in cat_ids and r["target_id"] in known_ids:
            connected_ids.add(r["target_id"])
            connected_ids.add(r["source_id"])
    mastered = [
        w for w in cat_words
        if pmap.get(w["id"]) and pmap[w["id"]]["reps"] >= 3
    ]

    # Recommendations: undiscovered words with the strongest links to known ones.
    scores: dict[int, int] = {}
    for r in rels:
        if r["source_id"] in known_ids and r["target_id"] not in known_ids:
            scores[r["target_id"]] = scores.get(r["target_id"], 0) + r["strength"]
    word_by_id = {w["id"]: w for w in words}
    recommendations = [
        word_payload(word_by_id[wid], pmap.get(wid))
        for wid, _s in sorted(scores.items(), key=lambda kv: -kv[1])[:4]
        if wid in word_by_id
    ]
    if len(recommendations) < 4:
        for w in words:
            if len(recommendations) >= 4:
                break
            if w["id"] not in known_ids and all(r["id"] != w["id"] for r in recommendations):
                recommendations.append(word_payload(w, pmap.get(w["id"])))

    dialogues = (
        db.execute(
            "SELECT COUNT(*) FROM discoveries WHERE user_id=? AND kind='dialogue'",
            (user_id,),
        ).fetchone()[0] if user_id else 0
    )
    listening = (
        db.execute(
            "SELECT COALESCE(SUM(correct),0) FROM sessions WHERE user_id=? AND mode='sound'",
            (user_id,),
        ).fetchone()[0] if user_id else 0
    )
    writing = (
        db.execute(
            "SELECT COALESCE(SUM(score),0) FROM sessions WHERE user_id=? AND mode='lab'",
            (user_id,),
        ).fetchone()[0] if user_id else 0
    )
    timeline = (
        db.execute(
            "SELECT * FROM discoveries WHERE user_id=? ORDER BY created_at DESC LIMIT 8",
            (user_id,),
        ).fetchall() if user_id else []
    )

    return jsonify({
        "authenticated": user is not None,
        "profile": {
            "name": public_user(user)["displayName"] if user else None,
            "email": user["email"] if user else None,
            "joined": user["created_at"] if user else None,
            "settings": settings,
        } if user else None,
        "stats": account_stats(db, user_id) if user_id else {"tracked": 0, "saved": 0, "retained": 0},
        "ladder": ladder_payload(db, user_id, settings),
        "metrics": {
            "concepts": len(discovered),
            "connected": len(connected_ids),
            "retained": len(retained),
            "dialogues": dialogues,
            "listening": listening,
            "writing": writing,
            "due": due,
            "totalWords": len(words),
            "edges": db.execute("SELECT COUNT(*) FROM relations").fetchone()[0],
            "expressions": sum(
                3 for w in discovered
                if pmap.get(w["id"]) and pmap[w["id"]]["reps"] >= 3
            ),
        },
        "exploration": {
            "category": current_cat,
            "label": current_cat.upper(),
            "hanzi": "时间" if current_cat == "time" else cat_words[0]["hanzi"] if cat_words else "时间",
            "discovered": len(by_cat.get(current_cat, [])),
            "connected": len(connected_ids & cat_ids),
            "mastered": len(mastered),
            "description": "Explore the language of time: how days stack, how moments pass, how the calendar is spoken.",
        },
        "recommendations": recommendations,
        "timeline": [dict(t) for t in timeline],
    })


# --------------------------------------------------------------------------- #
# Words and graph
# --------------------------------------------------------------------------- #
@app.route("/api/words")
def words():
    db = get_db()
    pmap = progress_map(db, current_user_id())
    q = (request.args.get("q") or "").strip()[:80]
    category = request.args.get("category")
    sql = "SELECT * FROM words"
    params: list = []
    clauses = []
    like = like_operator()
    if q:
        clauses.append(f"(hanzi {like} ? OR pinyin {like} ? OR meaning {like} ?)")
        params += [f"%{q}%", f"%{q}%", f"%{q}%"]
    if category and category != "all":
        clauses.append("category = ?")
        params.append(category)
    if clauses:
        sql += " WHERE " + " AND ".join(clauses)
    sql += " ORDER BY id"
    rows = db.execute(sql, params).fetchall()
    return jsonify({"words": [word_payload(r, pmap.get(r["id"])) for r in rows]})


@app.route("/api/words/<int:wid>")
def word_detail(wid: int):
    db = get_db()
    pmap = progress_map(db, current_user_id())
    row = db.execute("SELECT * FROM words WHERE id=?", (wid,)).fetchone()
    if not row:
        return jsonify({"error": "word not found"}), 404
    rels = db.execute(
        """SELECT r.type, r.note, r.strength, w.*
           FROM relations r JOIN words w ON w.id = r.target_id
           WHERE r.source_id = ? ORDER BY r.strength DESC, w.id""",
        (wid,),
    ).fetchall()
    payload = word_payload(row, pmap.get(wid))
    payload["relations"] = [
        {
            "type": r["type"], "note": r["note"], "strength": r["strength"],
            "word": word_payload(r, pmap.get(r["id"])),
        }
        for r in rels
    ]
    payload["chars"] = [
        dict(db.execute("SELECT * FROM char_meta WHERE char=?", (ch,)).fetchone() or {})
        for ch in row["hanzi"]
        if db.execute("SELECT 1 FROM char_meta WHERE char=?", (ch,)).fetchone()
    ]
    return jsonify(payload)


@app.route("/api/graph")
def graph():
    db = get_db()
    pmap = progress_map(db, current_user_id())
    words_rows = db.execute("SELECT * FROM words ORDER BY id").fetchall()
    rels = db.execute("SELECT * FROM relations ORDER BY id").fetchall()
    degree: dict[int, int] = {}
    for r in rels:
        degree[r["source_id"]] = degree.get(r["source_id"], 0) + 1
        degree[r["target_id"]] = degree.get(r["target_id"], 0) + 1
    return jsonify({
        "nodes": [
            {**word_payload(w, pmap.get(w["id"])), "degree": degree.get(w["id"], 0)}
            for w in words_rows
        ],
        "edges": [
            {"source": r["source_id"], "target": r["target_id"],
             "type": r["type"], "strength": r["strength"], "note": r["note"]}
            for r in rels
        ],
        "types": RELATION_TYPES,
    })


@app.route("/api/words/<int:wid>/save", methods=["POST"])
def save_word(wid: int):
    denied = require_user()
    if denied:
        return denied
    db = get_db()
    user_id = current_user_id()
    if not db.execute("SELECT 1 FROM words WHERE id=?", (wid,)).fetchone():
        return jsonify({"error": "word not found"}), 404
    prow = db.execute(
        "SELECT * FROM progress WHERE user_id=? AND word_id=?", (user_id, wid)
    ).fetchone()
    saved = not (prow and prow["saved"])
    if prow:
        db.execute(
            "UPDATE progress SET saved=? WHERE user_id=? AND word_id=?",
            (int(saved), user_id, wid),
        )
    else:
        db.execute(
            """INSERT INTO progress (user_id, word_id, saved, discovered, state)
               VALUES (?,?,?,?,'learning')""",
            (user_id, wid, int(saved), iso()),
        )
        record_discovery(db, user_id, "concept", str(wid), "Saved to archive", "")
    db.commit()
    return jsonify({"saved": saved})


@app.route("/api/discover", methods=["POST"])
def discover():
    denied = require_user()
    if denied:
        return denied
    data = request.get_json(silent=True) or {}
    kind = (data.get("kind") or "concept").strip()[:40]
    ref = str(data.get("ref") or "").strip()[:120]
    title = (data.get("title") or "").strip()[:160]
    detail = (data.get("detail") or "").strip()[:400]
    if not ref or not title:
        return jsonify({"error": "ref and title required"}), 400
    db = get_db()
    created = record_discovery(db, current_user_id(), kind, ref, title, detail)
    db.commit()
    return jsonify({"created": created})


# --------------------------------------------------------------------------- #
# Spaced repetition
# --------------------------------------------------------------------------- #
@app.route("/api/ladder")
def ladder():
    db = get_db()
    return jsonify(ladder_payload(db, current_user_id()))


@app.route("/api/ladder/pace", methods=["POST"])
def ladder_pace():
    denied = require_user()
    if denied:
        return denied
    db = get_db()
    user_id = current_user_id()
    data = request.get_json(silent=True) or {}
    settings = read_settings(db, user_id)

    pace = data.get("pace")
    if pace in ("hsk", "efficiency"):
        settings["pace"] = pace

    level = data.get("level")
    if level is not None:
        try:
            settings["hskLevel"] = max(1, min(9, int(level)))
        except (TypeError, ValueError):
            pass

    write_settings(db, user_id, settings)
    return jsonify(ladder_payload(db, user_id, settings))


@app.route("/api/review/queue")
def review_queue():
    denied = require_user()
    if denied:
        return denied
    db = get_db()
    user_id = current_user_id()
    pmap = progress_map(db, user_id)
    now = datetime.now(timezone.utc)
    mode = request.args.get("mode", "mixed")
    limit = safe_int(request.args.get("limit", 20), 20, 1, 40)

    rows = db.execute("SELECT * FROM words ORDER BY id").fetchall()
    settings = read_settings(db, user_id)
    if settings.get("pace") == "hsk":
        level = int(settings.get("hskLevel") or 1)
        rows = [w for w in rows if w["hsk"] <= level]
    due = []
    fresh = []
    for w in rows:
        p = pmap.get(w["id"])
        payload = word_payload(w, p)
        if p and p["due"]:
            due_dt = parse_dt(p["due"]) or now
            if due_dt <= now and p["reps"] > 0:
                due.append((due_dt, payload))
            elif p["reps"] == 0:
                fresh.append(payload)
        else:
            fresh.append(payload)
    due.sort(key=lambda pair: pair[0])
    queue = [p for _d, p in due]
    random.Random(7).shuffle(fresh)
    queue += fresh[: max(0, limit - len(queue))]
    queue = queue[:limit]

    # A stable rotation of exercise types keeps sessions from feeling repetitive.
    types = ["hanzi", "meaning", "audio", "pinyin", "relation", "sentence"]
    for i, item in enumerate(queue):
        exercise = types[i % len(types)] if mode == "mixed" else mode
        # Imported HSK entries have no example sentence. Fall back to a plain
        # meaning prompt instead of showing an empty reconstruction card.
        if exercise == "sentence" and not item.get("example"):
            exercise = "meaning"
        item["exercise"] = exercise
        item["options"] = build_review_options(db, item, exercise, rows)
    return jsonify({"queue": queue, "due": len(due), "mode": mode})


def build_review_options(db, item: dict, exercise: str, rows) -> list[dict]:
    pool = [w for w in rows if w["id"] != item["id"]]
    rng = random.Random(item["id"] * 31 + len(exercise))
    picks = rng.sample(pool, k=min(3, len(pool)))
    correct_field = {
        "hanzi": "meaning",
        "meaning": "hanzi",
        "audio": "hanzi",
        "pinyin": "hanzi",
        "relation": "meaning",
        "sentence": "hanzi",
    }.get(exercise, "meaning")
    options = [{"text": item[correct_field], "correct": True}]
    for p in picks:
        options.append({"text": p[correct_field], "correct": False})
    rng.shuffle(options)
    return options


@app.route("/api/review/grade", methods=["POST"])
def review_grade():
    denied = require_user()
    if denied:
        return denied
    data = request.get_json(silent=True) or {}
    wid = safe_int(data.get("wordId"), 0, 1)
    grade = safe_int(data.get("grade", 2), 2, 0, 3)
    db = get_db()
    user_id = current_user_id()
    word = db.execute("SELECT * FROM words WHERE id=?", (wid,)).fetchone()
    if not word:
        return jsonify({"error": "word not found"}), 404

    p = db.execute(
        "SELECT * FROM progress WHERE user_id=? AND word_id=?", (user_id, wid)
    ).fetchone()
    ease = p["ease"] if p else 2.5
    interval = p["interval"] if p else 0.0
    reps = p["reps"] if p else 0
    lapses = p["lapses"] if p else 0
    now = datetime.now(timezone.utc)

    if grade == 0:
        lapses += 1
        reps = 0
        ease = max(1.3, ease - 0.2)
        interval = 0.007  # ten minutes
    else:
        ease = min(3.0, ease + (0.15 if grade == 3 else -0.05 if grade == 1 else 0.0))
        if reps == 0:
            interval = {1: 0.5, 2: 1.0, 3: 2.0}[grade]
        elif reps == 1:
            interval = {1: 2.0, 2: 3.0, 3: 5.0}[grade]
        else:
            factor = {1: 0.7, 2: 1.0, 3: 1.35}[grade]
            interval = min(180.0, max(1.0, interval * ease * factor))
        reps += 1

    due = now + timedelta(days=interval)
    state = "mastered" if interval >= 21 else "review" if reps > 1 else "learning"
    discovered = p["discovered"] if p and p["discovered"] else iso()
    db.execute(
        """INSERT INTO progress
           (user_id, word_id, state, ease, interval, due, reps, lapses, confidence, saved, discovered, last_review)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
           ON CONFLICT(user_id, word_id) DO UPDATE SET
             state=excluded.state, ease=excluded.ease, interval=excluded.interval,
             due=excluded.due, reps=excluded.reps, lapses=excluded.lapses,
             confidence=excluded.confidence, discovered=excluded.discovered,
             last_review=excluded.last_review""",
        (user_id, wid, state, ease, interval, due.isoformat(), reps, lapses,
         max(1, grade + 1), p["saved"] if p else 0, discovered, iso()),
    )
    record_discovery(db, user_id, "concept", str(wid), "Reviewed in Memory Studio",
                     f"Confidence {max(1, grade + 1)}/4")
    db.commit()
    return jsonify({
        "wordId": wid, "state": state, "interval": interval,
        "due": due.isoformat(), "reps": reps, "ease": ease,
    })


@app.route("/api/session", methods=["POST"])
def log_session():
    denied = require_user()
    if denied:
        return denied
    data = request.get_json(silent=True) or {}
    db = get_db()
    db.execute(
        """INSERT INTO sessions (user_id, mode, started_at, ended_at, score, correct, total, meta)
           VALUES (?,?,?,?,?,?,?,?)""",
        (
            current_user_id(),
            str(data.get("mode", "study"))[:40],
            data.get("startedAt") or iso(),
            iso(),
            safe_float(data.get("score", 0)),
            safe_int(data.get("correct", 0), 0),
            safe_int(data.get("total", 0), 0),
            json.dumps(data.get("meta", {}), ensure_ascii=False),
        ),
    )
    db.commit()
    return jsonify({"ok": True})


# --------------------------------------------------------------------------- #
# Living Mandarin
# --------------------------------------------------------------------------- #
@app.route("/api/scenarios")
def scenarios():
    db = get_db()
    user_id = current_user_id()
    rows = db.execute("SELECT * FROM scenarios ORDER BY id").fetchall()
    done = {
        r["ref"] for r in db.execute(
            "SELECT ref FROM discoveries WHERE user_id=? AND kind='dialogue'",
            (user_id,),
        ).fetchall()
    } if user_id else set()
    return jsonify({
        "scenarios": [
            {
                "slug": r["slug"], "title": r["title"], "hanzi": r["hanzi"],
                "setting": r["setting"], "description": r["description"],
                "level": r["level"], "accent": r["accent"],
                "lineCount": len(json.loads(r["dialogue"])),
                "completed": r["slug"] in done,
            }
            for r in rows
        ]
    })


@app.route("/api/scenarios/<slug>")
def scenario_detail(slug: str):
    db = get_db()
    row = db.execute("SELECT * FROM scenarios WHERE slug=?", (slug,)).fetchone()
    if not row:
        return jsonify({"error": "scenario not found"}), 404
    return jsonify({
        "slug": row["slug"], "title": row["title"], "hanzi": row["hanzi"],
        "setting": row["setting"], "description": row["description"],
        "level": row["level"], "accent": row["accent"],
        "dialogue": json.loads(row["dialogue"]),
        "choices": json.loads(row["choices"]),
        "phrases": json.loads(row["phrases"]),
    })


@app.route("/api/scenarios/<slug>/complete", methods=["POST"])
def scenario_complete(slug: str):
    denied = require_user()
    if denied:
        return denied
    data = request.get_json(silent=True) or {}
    db = get_db()
    user_id = current_user_id()
    row = db.execute("SELECT * FROM scenarios WHERE slug=?", (slug,)).fetchone()
    if not row:
        return jsonify({"error": "scenario not found"}), 404
    inserted = record_discovery(
        db, user_id, "dialogue", slug, row["title"],
        f"{data.get('correct', 0)}/{data.get('choices', 0)} contextual choices",
    )
    db.execute(
        """INSERT INTO sessions (user_id, mode, started_at, ended_at, score, correct, total, meta)
           VALUES (?, 'living', ?, ?, ?, ?, ?, ?)""",
        (user_id, iso(), iso(), safe_float(data.get("score", 0)),
         safe_int(data.get("correct", 0), 0), safe_int(data.get("choices", 0), 0),
         json.dumps({"slug": slug}, ensure_ascii=False)),
    )
    db.commit()
    return jsonify({"completed": True, "new": inserted})


# --------------------------------------------------------------------------- #
# Sound Archive
# --------------------------------------------------------------------------- #
@app.route("/api/sound")
def sound():
    db = get_db()
    rows = db.execute("SELECT * FROM sound_sets ORDER BY id").fetchall()
    return jsonify({
        "sets": [
            {
                "slug": r["slug"], "title": r["title"], "kind": r["kind"],
                "description": r["description"], "items": json.loads(r["items"]),
            }
            for r in rows
        ]
    })


@app.route("/api/sound/quiz")
def sound_quiz():
    db = get_db()
    words = db.execute("SELECT * FROM words ORDER BY RANDOM() LIMIT 12").fetchall()
    return jsonify({
        "rounds": [
            {
                "hanzi": w["hanzi"],
                "pinyin": w["pinyin"],
                "meaning": w["meaning"],
                "cue": w["hanzi"],
                "tone": tone_number(w["pinyin"]),
            }
            for w in words
        ]
    })


# --------------------------------------------------------------------------- #
# Hanzi Lab
# --------------------------------------------------------------------------- #
@app.route("/api/lab")
def lab_index():
    db = get_db()
    rows = db.execute("SELECT * FROM char_meta ORDER BY strokes").fetchall()
    return jsonify({"chars": [dict(r) for r in rows]})


@app.route("/api/lab/<char>")
def lab_detail(char: str):
    char = char[:4]
    db = get_db()
    meta = db.execute("SELECT * FROM char_meta WHERE char=?", (char,)).fetchone()
    if not meta:
        return jsonify({"error": "character not in the lab yet"}), 404
    pmap = progress_map(db, current_user_id())
    related = db.execute(
        "SELECT * FROM words WHERE hanzi " + like_operator() + " ? ORDER BY id LIMIT 8",
        (f"%{char}%",),
    ).fetchall()
    return jsonify({
        "char": meta["char"], "pinyin": meta["pinyin"], "meaning": meta["meaning"],
        "radical": meta["radical"], "strokes": meta["strokes"],
        "structure": meta["structure"], "components": meta["components"].split(),
        "origin": meta["origin"], "hint": meta["hint"],
        "words": [word_payload(w, pmap.get(w["id"])) for w in related],
    })


# --------------------------------------------------------------------------- #
# Challenge Room
# --------------------------------------------------------------------------- #
@app.route("/api/challenge/association")
def challenge_association():
    db = get_db()
    words = {w["id"]: w for w in db.execute("SELECT * FROM words").fetchall()}
    rels = db.execute(
        "SELECT * FROM relations WHERE type IN ('synonym','antonym','time','semantic','collocation')"
    ).fetchall()
    random.shuffle(rels)
    rounds = []
    used = set()
    for r in rels:
        if len(rounds) >= 10:
            break
        if r["source_id"] in used:
            continue
        target = words[r["source_id"]]
        answer = words[r["target_id"]]
        distractor_pool = [w for w in words.values() if w["id"] not in (target["id"], answer["id"])]
        distractors = random.sample(distractor_pool, 3)
        options = [{"hanzi": answer["hanzi"], "pinyin": answer["pinyin"],
                    "meaning": answer["meaning"], "correct": True}]
        options += [{"hanzi": d["hanzi"], "pinyin": d["pinyin"],
                     "meaning": d["meaning"], "correct": False} for d in distractors]
        random.shuffle(options)
        rounds.append({
            "prompt": target["hanzi"], "pinyin": target["pinyin"],
            "meaning": target["meaning"], "note": r["note"],
            "type": r["type"], "options": options,
        })
        used.add(r["source_id"])
        used.add(r["target_id"])
    return jsonify({"rounds": rounds})


@app.route("/api/challenge/reconstruction")
def challenge_reconstruction():
    items = random.sample(SENTENCES, k=min(6, len(SENTENCES)))
    rounds = []
    for item in items:
        tokens = item["tokens"][:]
        shuffled = tokens[:]
        random.shuffle(shuffled)
        if shuffled == tokens and len(tokens) > 1:
            shuffled = shuffled[1:] + shuffled[:1]
        rounds.append({"tokens": shuffled, "answer": tokens, "en": item["en"], "focus": item["focus"]})
    return jsonify({"rounds": rounds})


@app.route("/api/challenge/tone")
def challenge_tone():
    db = get_db()
    words = db.execute("SELECT * FROM words WHERE pinyin <> '' ORDER BY RANDOM() LIMIT 14").fetchall()
    rounds = []
    for w in words:
        tone = tone_number(w["pinyin"])
        rounds.append({
            "hanzi": w["hanzi"], "pinyin": w["pinyin"], "meaning": w["meaning"],
            "tone": tone, "cue": w["hanzi"],
        })
    return jsonify({"rounds": rounds})


def tone_number(pinyin: str) -> int:
    marks = {
        "ā": 1, "á": 2, "ǎ": 3, "à": 4,
        "ē": 1, "é": 2, "ě": 3, "è": 4,
        "ī": 1, "í": 2, "ǐ": 3, "ì": 4,
        "ō": 1, "ó": 2, "ǒ": 3, "ò": 4,
        "ū": 1, "ú": 2, "ǔ": 3, "ù": 4,
        "ǖ": 1, "ǘ": 2, "ǚ": 3, "ǜ": 4,
    }
    for ch in pinyin:
        if ch in marks:
            return marks[ch]
    return 0


@app.route("/api/challenge/memory")
def challenge_memory():
    db = get_db()
    pmap = progress_map(db, current_user_id())
    known = [w for w in db.execute("SELECT * FROM words").fetchall() if pmap.get(w["id"])]
    pool = known if len(known) >= 8 else db.execute("SELECT * FROM words").fetchall()
    picks = random.sample(list(pool), k=min(8, len(pool)))
    return jsonify({
        "pairs": [
            {"id": w["id"], "hanzi": w["hanzi"], "meaning": w["meaning"],
             "pinyin": w["pinyin"]}
            for w in picks
        ]
    })


@app.route("/api/challenge/history")
def challenge_history():
    db = get_db()
    user_id = current_user_id()
    if not user_id:
        return jsonify({"records": {}})
    rows = db.execute(
        """SELECT game, COUNT(*) AS plays, MAX(score) AS best, MAX(created_at) AS last
           FROM challenge_results WHERE user_id=? GROUP BY game""",
        (user_id,),
    ).fetchall()
    return jsonify({
        "records": {
            r["game"]: {"plays": r["plays"], "best": r["best"], "last": r["last"]}
            for r in rows
        }
    })


@app.route("/api/challenge/result", methods=["POST"])
def challenge_result():
    denied = require_user()
    if denied:
        return denied
    data = request.get_json(silent=True) or {}
    db = get_db()
    user_id = current_user_id()
    game = (data.get("game") or "unknown")[:40]
    db.execute(
        """INSERT INTO challenge_results (user_id, game, score, accuracy, duration, created_at)
           VALUES (?,?,?,?,?,?)""",
        (user_id, game, safe_int(data.get("score", 0), 0), safe_float(data.get("accuracy", 0)),
         safe_float(data.get("duration", 0)), iso()),
    )
    record_discovery(db, user_id, "challenge", game, f"Cleared {game.replace('-', ' ')}",
                     f"Score {data.get('score', 0)}")
    db.commit()
    return jsonify({"ok": True})


# --------------------------------------------------------------------------- #
# Archive
# --------------------------------------------------------------------------- #
@app.route("/api/archive")
def archive():
    denied = require_user()
    if denied:
        return denied
    db = get_db()
    user_id = current_user_id()
    pmap = progress_map(db, user_id)
    words = db.execute("SELECT * FROM words ORDER BY id").fetchall()
    categories: dict[str, dict] = {}
    for w in words:
        cat = categories.setdefault(w["category"], {"total": 0, "discovered": 0, "mastered": 0})
        cat["total"] += 1
        p = pmap.get(w["id"])
        if p and p["discovered"]:
            cat["discovered"] += 1
        if p and p["reps"] >= 2:
            cat["mastered"] += 1

    timeline = db.execute(
        """SELECT * FROM (SELECT id, kind, ref, title, detail, created_at FROM discoveries
           WHERE user_id=?
           UNION ALL
           SELECT id, 'session' AS kind, CAST(id AS TEXT) AS ref, mode AS title,
                  'Session complete' AS detail, ended_at AS created_at FROM sessions
           WHERE user_id=?)
           ORDER BY created_at DESC LIMIT 60""",
        (user_id, user_id),
    ).fetchall()

    sessions = db.execute(
        """SELECT mode, COUNT(*) AS count, COALESCE(SUM(correct),0) AS correct,
                  COALESCE(SUM(total),0) AS total, MAX(ended_at) AS last
           FROM sessions WHERE user_id=? GROUP BY mode ORDER BY count DESC""",
        (user_id,),
    ).fetchall()

    # 8-week review activity, bucketed by day.
    activity = []
    today = datetime.now(timezone.utc).date()
    rows = db.execute(
        "SELECT last_review FROM progress WHERE user_id=? AND last_review IS NOT NULL",
        (user_id,),
    ).fetchall()
    counts: dict[str, int] = {}
    for r in rows:
        dt = parse_dt(r["last_review"])
        if dt:
            counts[dt.date().isoformat()] = counts.get(dt.date().isoformat(), 0) + 1
    for i in range(27, -1, -1):
        day = today - timedelta(days=i)
        activity.append({"day": day.isoformat(), "count": counts.get(day.isoformat(), 0)})

    total_discovered = sum(1 for p in pmap.values() if p["discovered"])
    retained = sum(1 for p in pmap.values() if p["reps"] >= 2)
    return jsonify({
        "metrics": {
            "discovered": total_discovered,
            "retained": retained,
            "words": len(words),
            "retention": round(retained / max(1, total_discovered) * 100),
            "due": sum(
                1 for p in pmap.values()
                if p["due"] and (parse_dt(p["due"]) or datetime.now(timezone.utc)) <= datetime.now(timezone.utc)
            ),
        },
        "categories": categories,
        "timeline": [dict(t) for t in timeline],
        "sessions": [dict(s) for s in sessions],
        "activity": activity,
        "saved": [word_payload(w, pmap.get(w["id"])) for w in words if pmap.get(w["id"]) and pmap[w["id"]]["saved"]],
    })


@app.route("/api/export")
def export_data():
    """A complete, portable copy of the signed-in learner's own data."""
    denied = require_user()
    if denied:
        return denied
    db = get_db()
    user_id = current_user_id()
    user = current_user()

    def rows(sql: str, params: tuple = ()) -> list[dict]:
        return [dict(row) for row in db.execute(sql, params).fetchall()]

    payload = {
        "app": "Lowkey Mandarin",
        "format": 2,
        "exportedAt": iso(),
        "account": {
            "email": user["email"],
            "displayName": public_user(user)["displayName"],
            "createdAt": user["created_at"],
            "settings": read_settings(db, user_id),
        },
        "progress": rows(
            "SELECT * FROM progress WHERE user_id=? ORDER BY word_id", (user_id,)
        ),
        "discoveries": rows(
            "SELECT * FROM discoveries WHERE user_id=? ORDER BY created_at", (user_id,)
        ),
        "sessions": rows(
            "SELECT * FROM sessions WHERE user_id=? ORDER BY id", (user_id,)
        ),
        "challengeResults": rows(
            "SELECT * FROM challenge_results WHERE user_id=? ORDER BY id", (user_id,)
        ),
        "words": rows(
            """SELECT id, hanzi, pinyin, meaning, category, hsk, example,
                      example_pinyin, example_en FROM words ORDER BY id"""
        ),
    }
    response = jsonify(payload)
    response.headers["Content-Disposition"] = 'attachment; filename="lowkey-mandarin-export.json"'
    return response


@app.route("/api/health")
def health():
    if not database_ready():
        return jsonify({
            "ok": False,
            "stage": "config",
            "error": "DatabaseNotConfigured",
            "hint": (
                "No PostgreSQL connection string is visible to this deployment. "
                "Add DATABASE_URL, or attach a Postgres integration that sets "
                "POSTGRES_URL, then redeploy."
            ),
            "acceptedEnv": list(DATABASE_URL_KEYS),
        }), 503
    try:
        count = get_db().execute("SELECT COUNT(*) FROM words").fetchone()[0]
    except Exception:
        app.logger.exception("Database health check failed")
        return jsonify({
            "ok": False,
            "stage": "database",
            "error": "DatabaseUnavailable",
            "hint": "The configured database could not be reached.",
        }), 503
    return jsonify({
        "ok": True,
        "words": count,
        "engine": "postgresql" if IS_POSTGRES else "sqlite",
        "env": DATABASE_URL_SOURCE or "HANZI_DB",
    })


app.config["HANZI_WORD_COUNT"] = init_db()


if __name__ == "__main__":
    app.run(
        debug=os.environ.get("FLASK_DEBUG") == "1",
        port=safe_int(os.environ.get("PORT", 5000), 5000, 1, 65535),
    )
