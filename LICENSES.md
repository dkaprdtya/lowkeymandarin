# Third-party licences and attribution

Lowkey Mandarin contains original interface code, written lessons, grammar notes,
scene dialogue and example sentences. Those are protected by copyright and are
not released under an open-source licence by this repository. You may study and
use the running site for personal learning; do not republish substantial
portions without written permission.

The components below remain under their own licences. This file records them for
convenience and is not a substitute for the upstream licence text.

## Python runtime

| Component | Version tested | Licence |
| --- | --- | --- |
| Flask | 3.1.3 | BSD-3-Clause |
| Werkzeug | 3.1.9 | BSD-3-Clause |
| Jinja2 | 3.1.6 | BSD-3-Clause |
| itsdangerous | 2.2.0 | BSD-3-Clause |
| click | 8.5.0 | BSD-3-Clause |
| MarkupSafe | 3.0.3 | BSD-3-Clause |
| blinker | 1.9.0 | MIT |

Project links:

- Flask: https://palletsprojects.com/projects/flask/
- Werkzeug: https://palletsprojects.com/projects/werkzeug/
- Jinja2: https://palletsprojects.com/projects/jinja/
- click: https://palletsprojects.com/projects/click/
- itsdangerous: https://palletsprojects.com/projects/itsdangerous/
- MarkupSafe: https://palletsprojects.com/projects/markupsafe/
- blinker: https://github.com/pallets-eco/blinker

Python itself is distributed under the Python Software Foundation License.

## Browser assets

### Hanzi Writer

- Purpose: optional stroke-order animation in Hanzi Lab.
- Delivery: `https://cdn.jsdelivr.net/npm/hanzi-writer@3/dist/hanzi-writer.min.js`
  and the corresponding character data, loaded only on that page.
- Licence: MIT.
- Project: https://hanziwriter.org/

The app falls back to an offline trace canvas when the library or its data
cannot load.

### Fonts

Served through Google Fonts:

| Family | Licence |
| --- | --- |
| Instrument Serif | SIL Open Font License 1.1 |
| Inter | SIL Open Font License 1.1 |
| IBM Plex Mono | SIL Open Font License 1.1 |
| Noto Serif SC | SIL Open Font License 1.1 |
| Noto Sans SC | SIL Open Font License 1.1 |

The SIL Open Font License permits use, study, modification and redistribution
of the fonts under its terms. This project does not sell or sublicense them.
When the CDN is unreachable, the CSS font stack falls back to locally installed
serif, sans-serif and monospace faces.

- Instrument Serif: https://github.com/Instrument/instrument-serif
- Inter: https://github.com/rsms/inter
- IBM Plex: https://github.com/IBM/plex
- Noto: https://github.com/notofonts/noto-cjk

## Chinese language data

Individual characters, words and dictionary meanings are linguistic facts.
The selection, ordering, explanations, relations and example sentences in this
archive are original editorial work created for Lowkey Mandarin, except where a
quotation is clearly attributed.

The complete HSK 2.0 level 1–5 headword list was imported from public,
MIT-licensed collections:

| Source | Used for | Licence |
| --- | --- | --- |
| [gigacool/hanyu-shuiping-kaoshi](https://github.com/gigacool/hanyu-shuiping-kaoshi) `hsk.json` | Headwords, pinyin, level, dictionary senses (2,007 words not already written by hand) | MIT |
| [drkameleon/complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary) `wordlists/inclusive/old/1–5.min.json` | Radical for each imported word | MIT |

Imported entries keep the first dictionary senses only. They carry no example
sentence, and the app never invents one; review falls back from a sentence
prompt to a meaning prompt when an example is absent. Character strokes and
components are left empty when the source does not supply them. The 1,659
imported relations are factual notes that two words share a character, capped
so common characters do not become hubs.

Hand-written words, examples, notes and relations in `seed.py`,
`extra_words.py`, `extra_words_advanced.py` and `extra_relations.py` remain
authoritative and were not overwritten by the import.

## No warranty

Third-party components are provided under their own terms, without warranty from
the Lowkey Mandarin operator. Check the upstream projects for the binding licence
text before redistributing them.
