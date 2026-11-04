# Lowkey Mandarin — audit record

Date: 4 November 2026

This file records what was reviewed, what changed, and what remains limited. It
is a working engineering record, not a compliance certificate.

## Scope

- Full product pass over the existing Lowkey Mandarin app: content, interface,
  navigation, accessibility, accounts, persistence, security, legal copy, SEO,
  performance and production readiness.
- The editorial-brutalist identity, vanilla frontend and Flask/SQLite backend
  were kept. No framework or build step was introduced.

## Main changes

### Product and interface

- Homepage rewritten around the promise “Learning is by discovery”, with a
  discovery-chain section that links into Word Cosmos.
- Navigation grouped into a desktop rail and a five-item mobile bar with an
  accessible “More” sheet.
- One help page explains the rooms, shortcuts, account model and first steps.
- First-visit note, honest empty states and account-aware copy on the home page.
- Account page for registration, sign-in, profile, password change, JSON export
  and account deletion. Password-reset UI appears only when SMTP is configured.
- Guests can browse vocabulary, cosmos, scenes, sounds, lab and challenge
  content. Memory Studio and Your Archive require an account. Write actions
  redirect to the account page with a return path.

### Accounts and data

- Learner tables are scoped by `user_id`: `progress`, `discoveries`, `sessions`
  and `challenge_results`. The old single-learner tables and demo progress were
  removed; shared vocabulary and relations were kept.
- Passwords use Werkzeug's scrypt hash. Session tokens are opaque random values;
  only a SHA-256 digest is stored.
- Cookies: `hanzi_session` is HttpOnly and SameSite=Lax; `hanzi_csrf` feeds the
  `X-CSRF-Token` header. Secure cookies are enabled with
  `HANZI_COOKIE_SECURE=1`.
- Sessions last 30 days. Password changes invalidate other sessions. Account
  deletion removes all linked learner rows.
- Export produces one JSON file containing the account and its study data, with
  no password hash, session token, CSRF token or IP address.

### Vocabulary and HSK coverage

- Imported the complete HSK 2.0 level 1–5 headword list (2,500 official entries)
  from MIT-licensed public lists. 2,007 were missing from the hand-written
  archive and were added, for 2,594 total words after deduplication.
- Level distribution: HSK 1 213, HSK 2 220, HSK 3 310, HSK 4 536, HSK 5 1,272,
  HSK 6 preview 43.
- 1,659 shared-character relations were added alongside the existing 2,575, for
  4,234 total relations. Links skip characters shared by more than 40 words so
  common characters do not become hubs.
- Imported words keep dictionary meanings but no examples. Review falls back
  from a sentence prompt to a meaning prompt when no example exists.
- The home page now separates guest and member states: guests see open-content
  facts and a free-account path; members see discovered, due, retained and
  connected counts plus their next step.
- Word Cosmos was rebuilt as a word-first connection browser instead of a
  canvas graph. A searchable, paged word list sits beside a reading pane that
  groups every relation by type. Desktop keeps the pane sticky; narrow screens
  stack it and scroll to the detail after a tap.

### Privacy and legal

- Privacy, Terms, Cookies, Disclaimer, Copyright, Contact and Your Data pages
  were rewritten to match the real account model, cookies, retention, export,
  deletion and third-party requests.
- No claim of legal compliance is made. Governing-law wording is marked as an
  assumption that a lawyer should review before public launch.
- Contact address is supplied by `HANZI_CONTACT_EMAIL`; the interface states
  when it is not configured.

### Security

- CSP, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` and
  same-origin form/frame rules are sent on responses.
- JSON-only guard on mutating APIs; 415 for non-JSON bodies.
- Parameterised SQL, server-side validation, generic authentication errors.
- In-memory rate limits for auth paths, reads and writes. Limits are per process.
- Debug mode is opt-in through `FLASK_DEBUG=1`; production uses `wsgi.py`.

### SEO and performance

- Per-route titles, descriptions, canonical URLs, Open Graph and Twitter
  metadata, plus JSON-LD on the home page.
- `robots.txt`, `sitemap.xml`, clean redirects from path URLs to hash routes and
  a real 404 page.
- No blocking analytics, ads or third-party scripts. Hanzi Writer loads only on
  Hanzi Lab.

## Verification performed

### API

A scripted client exercised:

- guest bootstrap and guest 401 responses for account-only data;
- registration, short-password rejection and CSRF rejection;
- progress save, export, sign-out and sign-in;
- isolation between two accounts;
- profile update, password change and deletion;
- rejection of a deleted account;
- 415 for a non-JSON request body;
- security headers, redirects, `robots.txt`, `sitemap.xml` and 404 response.

### Browser

- Registration through the form, signed-in home note, review card, grade and
  next card, reload persistence, sign-out, account gate with `next` return,
  profile page, JSON download (about 440 KB) and deletion through the UI.
- The signed-in home showed discovered, due, retained and connected counts; the
  guest home showed vocabulary, HSK range, connections and price.
- Review queue checked with imported words: items without an example sentence
  were rendered as meaning prompts instead of empty sentence cards, both in the
  API payload and in the studio.
- Archive showed opened words, coverage by cluster, review rhythm and traces.
  Export contained the account and study data with no password hash, session
  token, CSRF token or IP address.
- Word Cosmos: search, category filter, show-more paging, relation-link
  navigation, duplicate suppression and the mobile scroll-to-detail step all
  worked.
- Expired-session handling: deleting the session row caused the next grade to
  redirect to `#/account?next=%2Fmemory`.
- Guest rendering checked for Ladder, Cosmos, Living Mandarin, Hanzi Lab, Sound
  Archive, Challenge Room and Archive.
- Legal pages checked for expected headings and content.
- Contact page showed the portfolio copy, the `@dkaprdtya` link with
  `target="_blank"` and `rel="noopener noreferrer"`, and no console errors.
  Privacy page text contained no server paths, environment variable names,
  proxy or deployment details.

### Cosmos performance

The canvas graph forced a full 2,594-node simulation and a large first paint.
The page now fetches the same /api/graph payload once and builds an adjacency
map in memory. Only 24 words render at a time, so the browser paints a short
list and one detail pane. /api/graph is compressed with gzip when the client
accepts it, dropping the transfer from 1.37 MB to about 173 KB. These are
desktop test-machine numbers, not a device benchmark.

### Responsive check

Chromium rendered every public route at 360 px, 768 px and 1280 px. No route
had document-level horizontal overflow. The rail switches to the bottom bar
below 960 px, and the Cosmos two-column layout stacks below 900 px. The
category chips are the only deliberate scroll strip. Lighthouse on #/cosmos
reported 100 for accessibility, best practices and SEO.

### Lighthouse

Accessibility, best-practices and SEO scored 100 on:

- `/`
- `#/account` (guest and signed-in)
- `#/privacy`
- `#/terms`
- `#/cookies`
- `#/data`
- `#/help`
- `#/ladder`
- `#/cosmos`

The browser tool does not run a performance benchmark, so no performance score
is claimed here.

### Hosting

- Waitress 3.0.2 served the app from `wsgi.py`. `/api/health` returned 200 and
  `{"ok":true,"words":2594}`.
- With `HANZI_TRUST_PROXY=1` and `X-Forwarded-Proto: https`, the response carried
  HSTS and the CSRF cookie was marked `Secure`.
- Registration behind the proxy returned a `Secure; HttpOnly` session cookie.
  Account deletion then removed the test account.
- The limiter keyed on the forwarded client address: after 61 writes from one
  test IP the next write returned 429, while a different test IP was still
  served (403 for the missing CSRF token, not 429).
- Waitress 3 strips `X-Forwarded-*` by default. The documented commands add
  `--no-clear-untrusted-proxy-headers`; without it `ProxyFix` receives nothing.
- With `HANZI_PUBLIC_URL=https://hanzi.example.com`, a request with a forged
  `Host` header returned 400, while the public host and loopback returned 200.
- A 300 KB request body returned 413 with a JSON error. Unknown routes and
  oversized bodies keep the honest HTML/JSON error split.
- A state-changing request with `Sec-Fetch-Site: cross-site` returned 403 even
  with a valid CSRF token. A missing or wrong token also returned 403.
- Unknown-email login runs the same scrypt comparison as a real account, so
  response timing does not reveal whether an address is registered.
- With SMTP unset, `/api/auth/forgot` returned 503 and `/api/site` reported
  `emailConfigured: false`; the reset form stays hidden.
- `/robots.txt` and `/sitemap.xml` used `HANZI_PUBLIC_URL`, not the request
  host. The CSRF cookie carried `Secure`, `SameSite=Lax` and host-only scope.
- `backup.py` produced an 832 KB copy from the live database and
  `PRAGMA integrity_check` on the copy returned `ok`.
- `py_compile` passed for all Python modules, and `node --check` passed for every
  frontend module.
- The release archive was extracted to a clean folder, then `py_compile`,
  `node --check`, the zero-user database and `PRAGMA integrity_check` were
  re-run there. VS Code launch, task and settings JSON files parse.
- Docker is not installed on the test machine, so the Dockerfile and compose
  file were reviewed but not executed. Test them on the target host before
  relying on them.
### Final database state

After tests: zero users, sessions, password-reset rows, progress, discoveries,
sessions and challenge results. Shared content remains at 2,594 words and 4,234
relations. The live database passed `PRAGMA integrity_check`.

## Brand pass

- Public brand changed from HANZI FLOW to Lowkey Mandarin.
- Browser tab title changed to GO STUDY: `GO STUDY` on first load and
  `<page> — GO STUDY` for hash routes.
- Wordmark, footer, meta tags, page descriptions, legal copy, reset email,
  documentation and VS Code task labels were updated.
- `HANZI_*` environment variables, cookie names, storage keys, database paths
  and folder names were deliberately left unchanged.
- All 18 routes rendered with a clean console. Python compile, JavaScript
  syntax and VS Code JSON checks passed. The archive holds 69 entries and a
  zero-user database with `PRAGMA integrity_check` returning `ok`.

## Known limitations

- Google Fonts was intermittently unreachable in the test browser. Local font
  fallbacks worked, but CDN typography could not be visually confirmed.
- The browser tool exposes one viewport width. Mobile and tablet breakpoints were
  checked in CSS and by DOM structure, not by a device emulator.
- SMTP was not configured, so password-reset delivery was code-inspected only.
  The honest 503 path and hidden reset link were verified.
- There is no email verification or address-change flow. A typo in an address
  cannot be confirmed, and reset email is the only recovery path.
- Testing covered Chromium. Firefox and Safari were not exercised.
- The in-process rate limiter is per worker. A multi-worker deployment needs
  proxy-level limits.
- SQLite suits one small deployment. It is not a clustered database.
- Content is best-effort and not an official HSK course.

## Before a public launch

1. Serve over HTTPS and set `HANZI_COOKIE_SECURE=1`.
2. Set `HANZI_TRUST_PROXY=1` only when a trusted proxy sets `X-Forwarded-*`.
3. Set `HANZI_PUBLIC_URL` and `HANZI_CONTACT_EMAIL`. Add staging hostnames to
   `HANZI_TRUSTED_HOSTS`; the public host and loopback are accepted already.
4. Configure and test SMTP, or leave reset disabled.
5. Put proxy-level rate limits in front of the app.
6. Keep the database on a persistent volume, outside the web root.
7. Schedule `backup.py`, copy backups off the host and test a restore.
8. Have a lawyer review the Terms, Privacy Policy and governing-law clause.
9. Re-run Lighthouse and a real-device pass after any further UI change.
