-- PostgreSQL schema for Lowkey Mandarin.
--
-- Mirrors schema.sql. SQLite is used for local development and single-server
-- deployments; PostgreSQL is used when DATABASE_URL is set (Neon, Supabase,
-- RDS, and other hosted providers). Keep the two files in step.

-- ---------------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    display_name    TEXT NOT NULL DEFAULT '',
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL,
    settings        TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS auth_sessions (
    token_hash  TEXT PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    csrf_token  TEXT NOT NULL,
    created_at  TEXT NOT NULL,
    expires_at  TEXT NOT NULL,
    last_seen   TEXT NOT NULL,
    ip          TEXT NOT NULL DEFAULT '',
    user_agent  TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON auth_sessions(expires_at);

CREATE TABLE IF NOT EXISTS password_resets (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL UNIQUE,
    created_at  TEXT NOT NULL,
    expires_at  TEXT NOT NULL,
    used_at     TEXT
);

CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);

-- ---------------------------------------------------------------------------
-- Shared learning content
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS words (
    id              SERIAL PRIMARY KEY,
    hanzi           TEXT NOT NULL UNIQUE,
    pinyin          TEXT NOT NULL,
    meaning         TEXT NOT NULL,
    category        TEXT NOT NULL,
    hsk             INTEGER NOT NULL DEFAULT 1,
    radical         TEXT NOT NULL DEFAULT '',
    strokes         INTEGER NOT NULL DEFAULT 0,
    components      TEXT NOT NULL DEFAULT '',
    example         TEXT NOT NULL DEFAULT '',
    example_pinyin  TEXT NOT NULL DEFAULT '',
    example_en      TEXT NOT NULL DEFAULT '',
    note            TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS relations (
    id          SERIAL PRIMARY KEY,
    source_id   INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    target_id   INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    type        TEXT NOT NULL,
    note        TEXT NOT NULL DEFAULT '',
    strength    INTEGER NOT NULL DEFAULT 3,
    UNIQUE (source_id, target_id, type)
);

CREATE TABLE IF NOT EXISTS scenarios (
    id          SERIAL PRIMARY KEY,
    slug        TEXT NOT NULL UNIQUE,
    title       TEXT NOT NULL,
    hanzi       TEXT NOT NULL,
    setting     TEXT NOT NULL,
    description TEXT NOT NULL,
    level       INTEGER NOT NULL DEFAULT 1,
    accent      TEXT NOT NULL DEFAULT 'vermilion',
    dialogue    TEXT NOT NULL,
    choices     TEXT NOT NULL,
    phrases     TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS sound_sets (
    id          SERIAL PRIMARY KEY,
    slug        TEXT NOT NULL UNIQUE,
    title       TEXT NOT NULL,
    kind        TEXT NOT NULL,
    description TEXT NOT NULL,
    items       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS char_meta (
    char        TEXT PRIMARY KEY,
    pinyin      TEXT NOT NULL DEFAULT '',
    meaning     TEXT NOT NULL DEFAULT '',
    radical     TEXT NOT NULL,
    strokes     INTEGER NOT NULL,
    structure   TEXT NOT NULL,
    components  TEXT NOT NULL,
    origin      TEXT NOT NULL,
    hint        TEXT NOT NULL
);

-- ---------------------------------------------------------------------------
-- Per-account learning state
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS progress (
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    word_id      INTEGER NOT NULL REFERENCES words(id) ON DELETE CASCADE,
    state        TEXT NOT NULL DEFAULT 'new',
    ease         DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    interval     DOUBLE PRECISION NOT NULL DEFAULT 0,
    due          TEXT,
    reps         INTEGER NOT NULL DEFAULT 0,
    lapses       INTEGER NOT NULL DEFAULT 0,
    confidence   INTEGER NOT NULL DEFAULT 0,
    saved        INTEGER NOT NULL DEFAULT 0,
    discovered   TEXT,
    last_review  TEXT,
    PRIMARY KEY (user_id, word_id)
);

CREATE TABLE IF NOT EXISTS discoveries (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind        TEXT NOT NULL,
    ref         TEXT NOT NULL,
    title       TEXT NOT NULL,
    detail      TEXT NOT NULL DEFAULT '',
    created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mode        TEXT NOT NULL,
    started_at  TEXT NOT NULL,
    ended_at    TEXT,
    score       DOUBLE PRECISION NOT NULL DEFAULT 0,
    correct     INTEGER NOT NULL DEFAULT 0,
    total       INTEGER NOT NULL DEFAULT 0,
    meta        TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS challenge_results (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game        TEXT NOT NULL,
    score       INTEGER NOT NULL,
    accuracy    DOUBLE PRECISION NOT NULL DEFAULT 0,
    duration    DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_relations_source ON relations(source_id);
CREATE INDEX IF NOT EXISTS idx_relations_target ON relations(target_id);
CREATE INDEX IF NOT EXISTS idx_progress_due ON progress(user_id, due);
CREATE INDEX IF NOT EXISTS idx_discoveries_user ON discoveries(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id, ended_at);
CREATE INDEX IF NOT EXISTS idx_challenge_user ON challenge_results(user_id, game);

-- ---------------------------------------------------------------------------
-- Bookkeeping
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_meta (
    key     TEXT PRIMARY KEY,
    value   TEXT NOT NULL
);
