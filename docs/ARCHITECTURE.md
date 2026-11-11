# Architecture

## Request flow

```text
Browser
  templates/index.html          static shell, navigation, meta tags
  static/js/app.js             routes, shared chrome, search palette
  static/js/core/api.js        fetch wrapper + CSRF header
  static/js/pages/*.js         one module per room
        |
        v  JSON over HTTP
Flask app factory
  app.py                       page, learning API, export, health
  auth.py                      accounts, sessions, reset, deletion
  security.py                  headers, body limit, rate limiter, host check
  webfront.py                  site info, robots, sitemap, errors, redirects
  database.py                  SQLite/PostgreSQL connection and schema migration
  seed.py                      vocabulary, relations, scenes, sound, characters
        |
        v
Storage
  SQLite
    instance/hanzi.db          local default
    /data/hanzi.db             Docker volume
    HANZI_DB                   overrides the path
  PostgreSQL
    DATABASE_URL                used instead of SQLite when set (required on
                                serverless hosts such as Vercel)
    POSTGRES_URL                accepted alias written by the Vercel/Neon
    POSTGRES_PRISMA_URL         integrations; the first one present wins
    DATABASE_URL_UNPOOLED
```

`wsgi.py` imports the Flask app. `app.py` applies `ProxyFix` when
`HANZI_TRUST_PROXY=1` or when the platform sets `VERCEL=1`. Only trust
forwarded headers when a proxy overwrites them, and keep a directly exposed
app on `HANZI_TRUST_PROXY=0`.

## Frontend

`templates/index.html` contains the permanent shell: rail, top bar, footer, bottom
navigation and a `<main id="view">` container. `app.js` registers hash routes and
loads one page module at a time.

A page module exports an object:

```js
export default {
  route,          // used for navigation highlighting
  index,          // two-character breadcrumb label
  name,           // document title
  description,    // meta description
  async render(view, options) { /* write HTML into view */ },
};
```

`options` contains decoded path parameters, `options.query` (URLSearchParams) and
`options.word` when the palette passes a word id.

The router clears `#view`, calls the previous page's cleanup function, renders the
next page, updates navigation and metadata, and dispatches `hanzi:route`.

Shared state comes from `GET /api/bootstrap`, cached in `core/store.js`. Do not
copy account or progress data into separate globals; call `loadBoot()` or the
relevant API.

## Backend

`app.py` creates the Flask application at import time, registers security, auth
and site hooks, then defines the learning API. Every request gets a SQLite
connection from `database.get_db()`; `teardown_appcontext` closes it.

Writes require a signed-in account via `require_user()`. The current account is
resolved from the `hanzi_session` cookie by `auth.py`; only a SHA-256 digest of the
session token is stored. Session IDs, progress and discoveries are all scoped by
`user_id`.

Security is centralised in `security.py`:

- strict Content-Security-Policy and browser isolation headers;
- JSON-only request bodies for writes;
- 256 KB body limit (configurable, capped at 4 MB);
- per-IP read/write sliding-window limits;
- optional trusted-host enforcement when `HANZI_PUBLIC_URL` or
  `HANZI_TRUSTED_HOSTS` is set;
- gzip for JSON responses over 1 KB.

`auth.py` owns CSRF validation, login/register limits, password hashing,
session rotation and password reset. Password reset needs both SMTP and an HTTPS
`HANZI_PUBLIC_URL`; links are never built from the request host.

## Database

`schema.sql` is the source of truth for SQLite and `schema_postgres.sql` for
PostgreSQL. Both are applied with `CREATE TABLE IF NOT EXISTS` by
`database.prepare_schema()`, which also removes the obsolete single-profile
table. `app_meta` stores the content version, so an already seeded database
skips the per-row sync on later starts.

| Table | Owner | Purpose |
| --- | --- | --- |
| `users` | account | email, password hash, display name, settings |
| `auth_sessions` | account | hashed session token, CSRF token, expiry, last seen |
| `password_resets` | account | hashed one-use reset token and expiry |
| `words` | shared | hanzi, pinyin, meaning, category, HSK, anatomy, example |
| `relations` | shared | typed edges between words |
| `char_meta` | shared | character lab notes |
| `scenarios` | shared | Living Mandarin dialogue data |
| `sound_sets` | shared | listening sets and items |
| `progress` | account | scheduling state, confidence, saved flag |
| `discoveries` | account | words, scenes and characters opened |
| `sessions` | account | study session summaries |
| `challenge_results` | account | game scores and accuracy |

Foreign keys cascade on account deletion. Shared content has no account column.

## API map

| Method | Path | Account | Purpose |
| --- | --- | --- | --- |
| GET | `/api/bootstrap` | optional | words, progress, ladder, metrics, profile |
| GET | `/api/words` | no | search and category filter |
| GET | `/api/words/<id>` | optional | one word with progress |
| GET | `/api/graph` | optional | graph nodes and relations |
| POST | `/api/words/<id>/save` | yes | toggle a saved word |
| POST | `/api/discover` | yes | record a discovery |
| GET | `/api/ladder` | optional | HSK rungs and current position |
| POST | `/api/ladder/pace` | yes | save pace and level |
| GET | `/api/review/queue` | yes | due words and exercises |
| POST | `/api/review/grade` | yes | grade a review and schedule it |
| POST | `/api/session` | yes | log a study session |
| GET | `/api/scenarios` | no | scene index |
| GET | `/api/scenarios/<slug>` | no | scene detail |
| POST | `/api/scenarios/<slug>/complete` | yes | mark a scene complete |
| GET | `/api/sound` | no | sound sets |
| GET | `/api/sound/quiz` | no | listening quiz |
| GET | `/api/lab` | no | character index |
| GET | `/api/lab/<char>` | no | character anatomy |
| GET | `/api/challenge/<game>` | no | generate a challenge |
| GET | `/api/challenge/history` | yes | recent results |
| POST | `/api/challenge/result` | yes | save a result |
| GET | `/api/archive` | yes | coverage, retention, history |
| GET | `/api/export` | yes | JSON account export |
| GET | `/api/health` | no | liveness and word count |
| GET | `/api/auth/me` | optional | current profile |
| POST | `/api/auth/register` | no | create account |
| POST | `/api/auth/login` | no | sign in |
| POST | `/api/auth/logout` | optional | sign out |
| POST | `/api/auth/profile` | yes | display name and settings |
| POST | `/api/auth/password` | yes | change password |
| POST | `/api/auth/forgot` | no | request reset email |
| POST | `/api/auth/reset` | no | consume reset token |
| POST | `/api/account/delete` | yes | delete account and learner data |
| GET | `/api/site` | no | contact address and capability flags |
| GET | `/robots.txt` | no | crawler rules |
| GET | `/sitemap.xml` | no | canonical URL |

All write endpoints expect `Content-Type: application/json` and the
`X-CSRF-Token` header. The browser client adds both.

## Extension points

- **New page:** `static/js/pages/`, `app.js`, `HASH_SECTIONS`, navigation.
- **New API:** `app.py`, using `get_db()`, `current_user_id()` and `require_user()`.
- **New content:** Python lists in `extra_words*.py` / `extra_relations*.py`, then
  restart and let `sync_content()` update the database.
- **New account field:** add a column in `schema.sql` with a safe default, handle
  old rows in `prepare_schema()` if needed, then update `public_user()`.
- **New third party:** update the CSP in `security.py`, the Privacy page, the Cookie
  page and `LICENSES.md` in the same change.

## Deliberate limits

One process and one database. The rate limiter is in memory, so API limits are
per instance on a serverless host. There is no email verification, background
job queue, password pepper or WAF. Treat those as real constraints, not missing
polish hidden behind claims. A multi-instance deployment should move rate
limiting to the platform firewall or Redis.
