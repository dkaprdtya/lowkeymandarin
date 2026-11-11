# Lowkey Mandarin

An independent Mandarin study archive built around connections, not streaks.
Eight learning rooms and a private archive share one vocabulary field of 2,594
words: HSK 2.0 levels 1–5 complete, plus an HSK 6 preview. A free account keeps
each learner's reviews, saved words and discoveries separate.

| Room | What it does |
| --- | --- |
| **Origin** | Entry page: the discovery promise, three starting steps, the rooms and short answers. Signed-in visitors see their own progress instead |
| **The Ladder** | HSK 1–5 rungs plus an HSK 6 preview, HSK or Efficiency pace, grammar notes, 60% discovery gate |
| **Word Cosmos** | Word-first connection browser over 2,594 words and 4,234 typed relations; pick a word, read its links, follow one |
| **Memory Studio** | Spaced review with six exercise types and SM-2-style scheduling |
| **Living Mandarin** | Four interactive scenes with dialogue choices and pinyin/translation toggles |
| **Hanzi Lab** | Character anatomy, stroke animation (Hanzi Writer when available), offline trace fallback |
| **Sound Archive** | Tone contours, speech playback, minimal pairs, eight-round listening check |
| **Challenge Room** | Four games: association, sentence reconstruction, tone recognition, vocabulary memory |
| **Your Archive** | Coverage, retention, 28-day review rhythm, traces, session log, saved words |

Reading the vocabulary, cosmos, scenes, sounds and character pages needs no
account. Memory Studio and Your Archive need one, and every write is scoped to
the signed-in account. Guests see open content and an optional account path;
members see their due count, path progress and next step.

## Stack

- Python 3.11+, Flask, SQLite
- Vanilla HTML, CSS and ES modules; no frontend framework and no build step
- Canvas 2D for the tone waveform; inline SVG for contours,
  meters and the archive sparkline
- Web Speech API for pronunciation; Web Audio API for synthesised tone contours

Fonts and the optional Hanzi Writer stroke library load from CDNs. Both have
local fallbacks: the system font stack and an offline trace canvas.

## Run

```powershell
cd hanzi-flow
python -m pip install -r requirements.txt
python app.py                 # http://127.0.0.1:5000
```

The database is created and seeded on first import. It contains shared learning
content only; no demo account and no starter progress. Register an account to
begin saving.

To start from an empty archive:

```powershell
Remove-Item instance\hanzi.db
python app.py
```

## Structure

```
hanzi-flow/
  app.py                 Flask routes, learning APIs, bootstrap, export
  auth.py                accounts, sessions, CSRF, password reset, deletion
  database.py            SQLite connection, schema migration, helpers
  mailer.py              optional SMTP password-reset delivery
  backup.py              consistent SQLite backup and pruning
  security.py            headers, CSP, rate limits, JSON guard
  webfront.py            contact, robots, sitemap, errors, redirects
  wsgi.py                WSGI entry point and optional ProxyFix
  Dockerfile             production image, database on /data
  docker-compose.yml     single-service deployment with a named volume
  deploy/                Nginx, systemd and environment examples
  schema.sql             SQLite schema
  seed.py                Shared content seeding and synchronisation
  extra_words.py         Additional HSK vocabulary
  extra_words_advanced.py
  extra_words_hsk.py     Complete HSK 2.0 levels 1-5 import (2,007 words)
  extra_relations.py     Additional typed relations
  extra_relations_hsk.py Shared-character links for the imported HSK words
  materials.py           HSK grammar and study notes
  templates/             Application shell and error page
  static/css/            tokens, base, layout, components, page styles
  static/js/app.js       Route registration, rail state, search palette, boot
  static/js/core/        API client, router, store, gate, UI helpers, audio
  static/js/pages/       One module per room plus account and legal pages
  docs/                  Editing guide, architecture notes, documentation index
  .vscode/               Recommended extensions, settings, debug, tasks
  instance/hanzi.db      Local SQLite database (created at runtime)
```

## Accounts

- Email plus password. Passwords are hashed with Werkzeug's scrypt helper and
  never stored, logged or exported.
- Sessions are opaque random tokens. Only a SHA-256 digest is stored. The
  `hanzi_session` cookie is HttpOnly and SameSite=Lax; the `hanzi_csrf` cookie
  feeds the `X-CSRF-Token` header on state-changing requests.
- Sessions last 30 days. A password change signs out other devices.
- The account page supports display-name changes, password changes, JSON export
  and full deletion. Deletion requires the current password and the word
  `DELETE`.
- Password reset by email runs only when SMTP is configured and
  `HANZI_PUBLIC_URL` is an HTTPS origin. Without both, the endpoint returns an
  honest 503 and the interface hides the reset form. Reset links are built from
  `HANZI_PUBLIC_URL`, never from the request `Host` header.

## Configuration

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port for `python app.py` (default `5000`) |
| `FLASK_DEBUG` | Set to `1` for Flask debug mode; never in production |
| `DATABASE_URL` | PostgreSQL connection string; when set, PostgreSQL replaces SQLite |
| `POSTGRES_URL` | Accepted alias for `DATABASE_URL`, written by some Vercel/Neon integrations |
| `HANZI_DB` | Absolute path to the SQLite database (ignored when `DATABASE_URL` is set) |
| `HANZI_ALLOW_EPHEMERAL` | `1` allows throwaway `/tmp` SQLite on a serverless host |
| `HANZI_CONTACT_EMAIL` | Contact address shown on the contact page |
| `HANZI_PUBLIC_URL` | Public origin used in password-reset links |
| `HANZI_COOKIE_SECURE` | `1` forces Secure cookies behind an HTTPS proxy |
| `HANZI_TRUST_PROXY` | `1` trusts one reverse proxy's `X-Forwarded-*` headers |
| `HANZI_TRUSTED_HOSTS` | Extra accepted `Host` values, comma separated |
| `HANZI_MAX_BODY` | Largest request body in bytes (default `262144`) |
| `HANZI_SMTP_HOST` | SMTP host; leave unset to disable reset email |
| `HANZI_SMTP_PORT` | SMTP port (default `587`; `465` uses implicit TLS) |
| `HANZI_SMTP_USER` | SMTP username |
| `HANZI_SMTP_PASSWORD` | SMTP password |
| `HANZI_SMTP_FROM` | From address (defaults to the SMTP user) |
| `HANZI_SMTP_TLS` | `0` disables STARTTLS (default enabled) |

The app reads these values from the process environment. It does not load a
`.env` file itself; Docker Compose loads `.env` automatically, and systemd uses
`EnvironmentFile`.

### Make it your portfolio

The Contact page names the author and links to Instagram. Both values live in
one place, `static/js/pages/legal.js`:

```js
const PORTFOLIO = Object.freeze({
  instagramHandle: "dkaprdtya",
  instagramUrl: "https://www.instagram.com/dkaprdtya/",
});
```

Change them if the account changes. Set `HANZI_CONTACT_EMAIL` to show an email
address as well; leave it empty to show Instagram only. Also review the Contact
description in `DESCRIPTIONS` inside `static/js/app.js` and the legal text in the
same `legal.js` file before publishing your own copy.

## Documentation

- [docs/EDITING.md](docs/EDITING.md) — file map, how to change text, vocabulary,
  styles, pages and API routes.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — request flow, database model,
  API map and extension points.
- [docs/README.md](docs/README.md) — documentation index and fast start.
- [AUDIT.md](AUDIT.md) — what was tested, and what remains untested.

## Open in VS Code

The repository ships with `.editorconfig` and a `.vscode/` folder. VS Code
prompts for the recommended extensions on first open. The default build task
starts the development server with `FLASK_DEBUG=1`:

```text
Terminal → Run Task → Lowkey Mandarin: dev server
```

The debug configuration `Lowkey Mandarin: Flask (debug)` starts the same server under
the debugger. Python edits restart the process; frontend edits need only a page
reload. The project has no build step and no `package.json`.

## Production

Use one WSGI process and put HTTPS in front. `wsgi.py` exposes the Flask
application. Waitress is in `requirements.txt` and works on Windows and Linux:

```powershell
python -m pip install -r requirements.txt
python -m waitress --listen=127.0.0.1:5000 --threads=4 --no-clear-untrusted-proxy-headers wsgi:app
```

Waitress 3 removes `X-Forwarded-*` headers unless told otherwise. The
`--no-clear-untrusted-proxy-headers` flag keeps them so `HANZI_TRUST_PROXY=1`
can apply them. Without that variable (or `VERCEL=1`) the app ignores them.

The app seeds the database on first start. Set `HANZI_DB` to a persistent,
writable path before the first run, or set `DATABASE_URL` to use PostgreSQL.
`instance/hanzi.db` is the default for local development only.

### Deploy on Vercel with PostgreSQL

Vercel's filesystem is read-only and per-instance, so SQLite cannot hold
accounts there. The app uses PostgreSQL when a connection string is present, and
creates and seeds its schema on the first request. It reads `DATABASE_URL`
first, then `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`
and `DATABASE_URL_UNPOOLED`, so a Vercel/Neon integration can be attached
without renaming anything.

1. Create a PostgreSQL database (Neon, Supabase, RDS). Copy the pooled
   connection string that ends with `?sslmode=require`.
2. Import the repository with the Vercel **Flask** framework preset. Vercel uses
   `app.py` as the entry point and serves every path through it, including
   `static/` and `templates/`. Do not add a catch-all rewrite to `api/index`;
   that sends the rewritten path to Flask and every route answers 404.
3. In the Vercel project, add environment variables for Production and Preview:
   - `DATABASE_URL` - the connection string (or attach the Neon integration and
     let it set `POSTGRES_URL`)
   - `HANZI_COOKIE_SECURE=1`
   - `HANZI_PUBLIC_URL=https://your-domain`
   - `HANZI_TRUSTED_HOSTS=your-domain` (optional; the public URL host is added
     automatically)
4. Redeploy. `VERCEL=1` is set by the platform, so forwarded headers and
   HTTPS-only cookies are handled without extra configuration.
5. Check `https://your-domain/api/health`. It must return
   `{"ok": true, "words": 2594, "engine": "postgresql", "env": "DATABASE_URL"}`.
   The `env` field names the variable that was used and never prints its value.

Never commit the connection string. Rotate the database password if it has been
shared, and enable the provider's backups or point-in-time recovery.

A Vercel deployment with no usable connection string still serves the archive:
the bundled content database is opened read-only, so browsing, word pages and
the graph work while accounts, saved words and progress answer 503 with a
`readOnly` flag. `/api/health` reports `"readOnly": true` and lists
`acceptedEnv`, the variable names it looks for. Nothing is written to storage
that would disappear.

### Test a host with Docker

Docker is optional; it is not required to run the app.

```bash
cp .env.example .env
# edit .env: public URL, contact address, cookie security, SMTP if used
docker compose up -d --build
curl http://127.0.0.1:8000/api/health
```

The compose file keeps port 8000 on loopback and stores the database in the
`hanzi-data` volume at `/data/hanzi.db`. Put Nginx, Caddy or the hosting
provider's HTTPS proxy in front. Scale the app to one container: SQLite and the
in-process rate limiter are not shared across replicas.

For a local check over plain HTTP, set `HANZI_COOKIE_SECURE=0` in `.env`.
Use `1` behind HTTPS, or sign-in cookies will not persist.

To open the container directly from another machine for a short test, change
the port mapping to `8000:8000` and set `HANZI_TRUST_PROXY=0` and
`HANZI_COOKIE_SECURE=0`. Revert those changes before public use; a directly
exposed app must not trust forwarded headers.

### Test a VPS without Docker

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

export HANZI_DB=/var/lib/hanzi-flow/hanzi.db
export HANZI_PUBLIC_URL=https://hanzi.example.com
export HANZI_CONTACT_EMAIL=hello@example.com
export HANZI_COOKIE_SECURE=1
export HANZI_TRUST_PROXY=1

.venv/bin/waitress-serve --listen=127.0.0.1:8000 --threads=4 --no-clear-untrusted-proxy-headers wsgi:app
```

`deploy/hanzi-flow.service`, `deploy/nginx.conf.example` and
`deploy/Caddyfile.example` are starting points. The systemd unit expects
`/etc/hanzi-flow.env`; the sample is `deploy/hanzi-flow.env.example`.

Reverse-proxy checklist:

1. Terminate TLS at the proxy and forward `X-Forwarded-Proto`,
   `X-Forwarded-For`, `X-Forwarded-Host` and `X-Forwarded-Port`.
2. Set `HANZI_TRUST_PROXY=1` so rate limits, secure cookies and HSTS use the
   real client and scheme. Leave it unset when the app is exposed directly.
3. Set `HANZI_COOKIE_SECURE=1` and a real `HANZI_PUBLIC_URL`. The host in that
   URL is accepted automatically; add staging names to `HANZI_TRUSTED_HOSTS`.
4. Keep the database outside the web root and readable only by the app user.
5. The in-process rate limiter is per process. Keep one worker or add limits at
   the proxy. `deploy/nginx-ratelimit.example.conf` shows a second layer.
6. Password reset stays disabled until SMTP is configured, tested, and
   `HANZI_PUBLIC_URL` is HTTPS.

The app also sends a strict Content-Security-Policy, refuses cross-site
state-changing requests, limits request bodies to 256 KB, and rejects unknown
`Host` headers when a public URL or trusted-host list is set.

### Backup and restore

`backup.py` uses the SQLite online backup API, so it is safe while the app is
running. It verifies the copy and keeps the last 14 files by default.

```bash
python backup.py --db /data/hanzi.db --out /data/backups --keep 14
```

Schedule it daily with cron, a systemd timer or the host's scheduler, and copy
the backups off the server. The file is only useful if it survives the host.
On systemd:

```bash
sudo cp deploy/hanzi-backup.service deploy/hanzi-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now hanzi-backup.timer
systemctl list-timers hanzi-backup.timer
```

The sample timer runs at 03:15 with up to 15 minutes of jitter. Check that the
first run writes a file and passes `PRAGMA integrity_check`.

To restore: stop the app, replace the database with the chosen backup, delete
the stale `hanzi.db-wal` and `hanzi.db-shm` files, start the app, and check
`/api/health`. Test a restore before inviting real accounts.

SQLite is appropriate for a single small deployment. It is not a clustered
database; do not run several app servers against one file over a network share.


## Interaction notes

- Navigation is hash based: `#/ladder`, `#/cosmos`, `#/memory`, `#/account`,
  `#/living/cafe`, `#/lab/时`, `#/challenge/tone`, `#/archive`.
- The Ladder: HSK Track bounds review to the selected rung; Efficiency draws
  from the whole archive. A rung clears at 60% discovered. Pace and level are
  stored in the account settings.
- `Ctrl/Cmd + K` opens vocabulary search. Arrow keys move, Enter opens the word
  in the cosmos, Escape closes.
- Memory Studio: Space reveals, `1`–`4` rate recall, `P` replays audio.
- Challenge Room: `1`–`4` answer, Space replays tone audio or reveals, Enter
  advances, Escape leaves the cabinet.
- The desktop rail remembers its expanded state in `localStorage`. Below 960px
  the rail is replaced by the bottom navigation.
- `prefers-reduced-motion` disables CSS animation.

## Honest limitations

- Content is written for this project and reviewed on a best-effort basis. It is
  not an official HSK course and may contain mistakes.
- The app has no email verification. An address is trusted for sign-in only.
- Password reset depends on SMTP operated by the deployment owner.
- There is no cloud sync between separate deployments. Export JSON if you move.
- Third-party CDNs (Google Fonts, jsDelivr) are contacted by the browser; they
  are not required for core function.
