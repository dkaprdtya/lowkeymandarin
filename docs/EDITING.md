# Editing guide

This project is intentionally small: Flask, SQLite, and plain HTML/CSS/JavaScript.
There is no bundler, package manager for the frontend, or generated build output.
You can edit every visible file directly.

## 1. Open the project

```powershell
cd hanzi-flow
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```

On macOS or Linux, use `source .venv/bin/activate` instead. Open
`http://127.0.0.1:5000`.

Useful VS Code tasks are in `.vscode/tasks.json`. The debug configuration starts
Flask with the reloader, so Python edits restart the server automatically.

## 2. Find the right file

| I want to change... | Edit this |
| --- | --- |
| Contact text, Instagram, privacy, terms, cookies, disclaimer | `static/js/pages/legal.js` |
| Home page | `static/js/pages/home.js` |
| The Ladder | `static/js/pages/ladder.js` |
| Word Cosmos | `static/js/pages/cosmos.js` |
| Memory Studio | `static/js/pages/memory.js` |
| Living Mandarin scenes | `static/js/pages/living.js` and `seed.py` (`SCENARIOS`) |
| Hanzi Lab | `static/js/pages/lab.js` and `seed.py` (`CHAR_META`) |
| Sound Archive | `static/js/pages/sound.js` and `seed.py` (`SOUND_SETS`) |
| Challenge Room | `static/js/pages/challenge.js` |
| Your Archive | `static/js/pages/archive.js` |
| Account page | `static/js/pages/account.js` |
| Navigation, routes, search palette, page titles | `static/js/app.js` |
| Colours, spacing, type scale | `static/css/tokens.css` |
| Shared buttons, cards, tags, forms | `static/css/components.css` |
| Page layout and responsive breakpoints | `static/css/layout.css`, `static/css/pages.css` |
| App shell and meta tags | `templates/index.html` |
| API routes and learning logic | `app.py` |
| Login, sessions, password reset | `auth.py` |
| HTTP headers and rate limits | `security.py` |
| Vocabulary, examples and relations | `seed.py`, `extra_words*.py`, `extra_relations*.py` |
| Grammar notes | `materials.py` |
| Database schema | `schema.sql` |

### Brand and tab title

- Wordmark, footer and meta tags: `templates/index.html`
- Browser tab title: `templates/index.html` for the first load, then
  `static/js/core/router.js` for every hash route
- Brand prose in descriptions and legal copy: `static/js/app.js`,
  `static/js/pages/legal.js`
- Reset email wording: `mailer.py`

Keep the `HANZI_*` environment variables, cookie names, storage keys and folder
names unchanged. They are internal identifiers, not the public brand.

## 3. Change the portfolio contact

Open `static/js/pages/legal.js`. At the top:

```js
const PORTFOLIO = Object.freeze({
  instagramHandle: "dkaprdtya",
  instagramUrl: "https://www.instagram.com/dkaprdtya/",
});
```

Change both values if the account changes. The Contact page reads them directly.
Also update `contact` in `DESCRIPTIONS` inside `static/js/app.js` if you want a
different search/social description.

The optional email address comes from the `HANZI_CONTACT_EMAIL` environment
variable. If it is empty, the Contact page shows Instagram only.

## 4. Edit legal copy

All public legal text lives in the `LEGAL` object in `static/js/pages/legal.js`.
Each page has `title`, `cn`, `lede`, and `sections`. A section is:

```js
["Heading", [
  "First paragraph.",
  "Second paragraph. Backticks make `code` spans.",
]],
```

Update `UPDATED` when you change a policy. Backticks are escaped before rendering.
Never insert raw HTML into these strings; the renderer escapes them.

The privacy policy should describe what the site actually stores. If you add
analytics, advertising, embedded media or a new third-party request, update the
Privacy and Cookie pages first.

## 5. Add or edit vocabulary

The canonical row shape is:

```python
(
    hanzi, pinyin, meaning, category, hsk,
    radical, strokes, components,
    example, example_pinyin, example_en, note,
)
```

Categories used by the Cosmos filter are `time`, `people`, `food`, `travel`,
`study`, `nature`, `feeling`, `action`, and `general`. HSK levels are 1–6.

Files:

- `seed.py` — curated core words, relations, scenarios, character notes and sound sets.
- `extra_words.py` — additional HSK 1–3 words using the `_w()` helper.
- `extra_words_advanced.py` — additional HSK 4–6 words using the same helper.
- `extra_words_hsk.py` — the imported HSK 2.0 1–5 headword list.
- `extra_relations.py` and `extra_relations_hsk.py` — typed relations.

On restart, `sync_content()` inserts new words and updates the editable fields of
existing curated rows: pinyin, meaning, category, HSK level, example, and note.
It does not delete words that you remove from a Python list. To remove a word,
delete its row from the database as well, or rebuild the database.

Rebuilding deletes all accounts and study progress. Back up first:

```powershell
python backup.py --out backups
Remove-Item instance\hanzi.db
python app.py
```

Relations use the shape `(source_hanzi, target_hanzi, type, note, strength)`.
Allowed types are in `RELATION_TYPES` in `app.py`.

## 6. Add a page

1. Create `static/js/pages/myroom.js`:

```js
export default {
  route: "myroom",
  index: "11",
  name: "My Room",
  description: "One sentence for the page metadata.",
  async render(view, options) {
    view.innerHTML = `<section class="page"><h1>My Room</h1></section>`;
  },
};
```

2. Import and register it in `static/js/app.js`:

```js
import myroom from "./pages/myroom.js";
register("/myroom", myroom);
```

3. Add `"myroom"` to `HASH_SECTIONS` in `webfront.py`, so `GET /myroom`
   redirects to `/#/myroom`.
4. Add a navigation link in `templates/index.html`.
5. Add styles in `static/css/pages.css` or a new CSS file linked from the template.

A page may return a cleanup function from `render()`. The router calls it before
the next page loads. Use it to stop timers, animation frames, audio or event
listeners.

## 7. Add an API route

Add the route in `app.py`. Reads should use `get_db()` and parameterised SQL.
Writes should call `require_user()` and commit explicitly:

```python
@app.post("/api/myroom/save")
def myroom_save():
    denied = require_user()
    if denied:
        return denied
    data = request.get_json(silent=True) or {}
    db = get_db()
    db.execute("UPDATE users SET settings=? WHERE id=?", ("{}", current_user_id()))
    db.commit()
    return jsonify({"ok": True})
```

The browser client adds the CSRF header automatically for `post()`. For new HTTP
methods, extend `static/js/core/api.js`.

## 8. Edit styles

Design tokens are CSS custom properties in `static/css/tokens.css`. Change those
before adding one-off colours. The layout is mobile-first; the main breakpoint is
`960px`. Reduced-motion rules are already in `base.css`.

Keep the editorial-brutalist identity: warm paper background, black type, one lime
accent, visible rules, little rounding, and no decorative gradients.

## 9. Check your work

There is no automated test suite. Use these checks:

```powershell
# Python syntax
Get-ChildItem -Filter *.py | ForEach-Object { python -m py_compile $_.FullName }

# JavaScript syntax
node --check static\js\app.js
node --check static\js\pages\legal.js

# Database integrity
python -c "import sqlite3; print(sqlite3.connect('instance/hanzi.db').execute('PRAGMA integrity_check').fetchone())"
```

Then open the affected page, check the browser console, and test one guest path and
one signed-in path. Before deploys, run `python backup.py` and keep a copy off the
host.

## 10. Formatting rules

- Python: 4 spaces, UTF-8, one responsibility per function, docstrings for
  non-obvious logic, parameterised SQL only.
- JavaScript: ES modules, 2 spaces, semicolons, `const` by default, `async/await`.
- CSS: one component per block, tokens before raw values.
- Keep comments in English. Do not add secrets, analytics or hidden network calls.

`.editorconfig` and `.vscode/settings.json` already set encoding, indentation and
trailing-whitespace rules.
