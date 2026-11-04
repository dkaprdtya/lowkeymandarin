// Lowkey Mandarin — The Ladder
// Choose how the queue is bounded, then climb the HSK rungs from the ground up.

import { get, post } from "../core/api.js";
import { esc, icons, toast } from "../core/ui.js";
import { loadBoot } from "../core/store.js";

const PACE_COPY = {
  hsk: {
    label: "HSK Track",
    line: "Bounded to the rung you are on. Clear it before you climb.",
  },
  efficiency: {
    label: "Efficiency",
    line: "No ceiling. The queue follows the strongest connection, wherever it sits.",
  },
};

function rungState(level, current) {
  if (level.current) return { key: "current", label: "CURRENT" };
  if (level.cleared) return { key: "cleared", label: "CLEARED" };
  if (level.ahead) return { key: "ahead", label: "AHEAD" };
  if (current && level.hsk < current.hsk) return { key: "below", label: "BELOW" };
  return { key: "open", label: "OPEN" };
}

export default {
  route: "ladder",
  index: "01",
  name: "The Ladder",
  async render(view) {
    view.innerHTML = `<section class="page"><div class="loading">Setting the rungs</div></section>`;

    let data = await get("/api/ladder");
    let busy = false;

    const panelHTML = () => {
      if (data.pace === "efficiency") {
        return `
          <span class="eyebrow eyebrow--accent">Current position</span>
          <div class="ladder__badge ladder__badge--wide">∞</div>
          <h2 class="ladder__title">No ceiling.</h2>
          <p class="ladder__copy">Efficiency ignores the rung boundary. Review draws from all ${data.scopeWords} words in the archive and follows the strongest connection, wherever it sits.</p>
          <div class="ladder__meter">
            <div class="row row--between">
              <span class="mono">${String(data.scopeWords).padStart(2, "0")} WORDS IN SCOPE</span>
              <span class="mono">${String(data.scopeDue).padStart(2, "0")} DUE</span>
            </div>
            <div class="meter" aria-hidden="true"><div class="meter__fill" style="width:100%"></div></div>
            <div class="row row--between">
              <span class="mono">OPEN FIELD</span>
              <span class="mono">NO LOCK</span>
            </div>
          </div>
          <div class="ladder__actions">
            <a class="btn" href="#/memory">${data.scopeDue > 0 ? `Review ${data.scopeDue} due` : "Open the review queue"} ${icons.arrow}</a>
            <a class="btn btn--ghost" href="#/cosmos">Follow a new thread ${icons.arrow}</a>
          </div>
          <p class="ladder__note">Pick a rung below to switch to HSK Track at that level.</p>`;
      }

      const current = data.current;
      if (!current) {
        return `
          <span class="eyebrow eyebrow--accent">Current position</span>
          <h2 class="ladder__title">The ladder is empty.</h2>
          <p class="ladder__copy">Seed the archive before you climb.</p>`;
      }

      const needed = Math.ceil((current.total * data.clearAt) / 100);
      const remaining = Math.max(0, needed - current.discovered);
      const gateNote = current.cleared
        ? "This rung holds. The next one is open."
        : `Meet ${remaining} more word${remaining === 1 ? "" : "s"} in this rung to clear it. Discovery counts — retention keeps it.`;
      const climbLabel = data.next ? `Climb to HSK ${data.next.hsk}` : "Top of the ladder";

      return `
        <span class="eyebrow eyebrow--accent">Current position</span>
        <div class="ladder__badge">HSK ${current.hsk}</div>
        <h2 class="ladder__title">${esc(current.title)}</h2>
        <p class="ladder__copy">${current.discovered} of ${current.total} words met. ${current.retained} retained. ${current.due} due for review.${current.preview ? " Preview rung: the old HSK 6 list is not complete here." : ""}</p>
        <div class="ladder__meter">
          <div class="row row--between">
            <span class="mono">${current.discovered} / ${current.total} MET</span>
            <span class="mono">${current.progress}%</span>
          </div>
          <div class="meter" aria-hidden="true"><div class="meter__fill" style="width:${Math.min(100, current.progress)}%"></div></div>
          <div class="row row--between">
            <span class="mono">${current.retained} RETAINED</span>
            <span class="mono">${current.due} DUE</span>
          </div>
        </div>
        <div class="ladder__actions">
          <a class="btn" href="#/memory">${data.scopeDue > 0 ? `Review ${data.scopeDue} due` : "Open the review queue"} ${icons.arrow}</a>
          <button class="btn btn--ghost" type="button" data-climb ${data.next && current.cleared ? "" : "disabled"}>
            ${climbLabel} ${icons.arrow}
          </button>
        </div>
        <p class="ladder__note">${gateNote}</p>`;
    };

    const rungsHTML = () => data.levels.map((level) => {
      const state = rungState(level, data.current);
      return `
        <li class="rung is-${state.key}">
          <button class="rung__btn" type="button" data-level="${level.hsk}"
                  aria-pressed="${level.current ? "true" : "false"}">
            <span class="rung__marker" aria-hidden="true"></span>
            <span class="rung__level">HSK ${level.hsk}${level.preview ? " · preview" : ""}</span>
            <span class="rung__body">
              <span class="rung__title">${esc(level.title)}</span>
              <span class="rung__meta">${level.discovered}/${level.total} words · ${level.retained} retained · ${level.due} due · ${level.material.length} patterns</span>
              <span class="meter" aria-hidden="true"><span class="meter__fill" style="width:${Math.min(100, level.progress)}%"></span></span>
            </span>
            <span class="rung__side">
              <span class="rung__pct">${level.progress}%</span>
              <span class="rung__state">${state.label}</span>
            </span>
          </button>
        </li>`;
    }).join("");

    const paint = () => {
      const current = data.current;
      const bound = data.pace === "hsk" && current ? `HSK ${current.hsk}` : "∞";
      const activeLevel = current || data.levels.find((l) => l.hsk === data.level) || data.levels[0];
      const materials = activeLevel?.material || [];
      const materialHTML = materials.length ? `
        <section class="materials" aria-labelledby="materials-title">
          <div class="materials__head">
            <div class="stack stack--2">
              <span class="eyebrow eyebrow--accent" id="materials-title">Materi / 语法</span>
              <h2 class="materials__title">Patterns for HSK ${activeLevel.hsk}.</h2>
            </div>
            <div class="materials__aside">
              <span class="mono">${String(materials.length).padStart(2, "0")} PATTERNS</span>
              <p>${data.pace === "hsk"
                ? "Open a pattern and read it against the words already in this rung. Grammar only becomes yours when the vocabulary around it is familiar."
                : "Materials follow the rung you last selected. Efficiency still draws the review queue from every word in the archive."}</p>
            </div>
          </div>
          <div class="materials__list">
            ${materials.map((m, i) => `
              <details class="material"${i === 0 ? " open" : ""}>
                <summary>
                  <span class="material__num">${String(i + 1).padStart(2, "0")}</span>
                  <span class="material__pattern cn">${esc(m.pattern)}</span>
                  <span class="material__title">${esc(m.title)}</span>
                  <span class="material__sign" aria-hidden="true"></span>
                </summary>
                <div class="material__body">
                  <p class="material__copy">${esc(m.body)}</p>
                  <ul class="material__examples">
                    ${m.examples.map((ex) => `
                      <li>
                        <span class="cn material__example-hanzi">${esc(ex.hanzi)}</span>
                        <span class="mono material__example-pinyin">${esc(ex.pinyin)}</span>
                        <span class="material__example-en">${esc(ex.en)}</span>
                      </li>`).join("")}
                  </ul>
                </div>
              </details>`).join("")}
          </div>
          <p class="materials__foot mono">READ THE PATTERN · USE IT IN THE SENTENCE EXERCISE · REVIEW IT TOMORROW</p>
        </section>` : "";
      view.innerHTML = `
        <section class="page ladder">
          <div class="page-head">
            <div class="stack stack--2">
              <span class="eyebrow eyebrow--accent">The Ladder / 阶梯</span>
              <h1 class="page-head__title">Begin at the<br><em>bottom. Climb.</em></h1>
            </div>
            <div class="page-head__aside">
              <p>HSK gives you a spine. Efficiency gives you a current. Both keep the same method: meet a word, connect it, let review hold it.</p>
              <div class="page-head__stats">
                <div class="page-head__stat"><b>${String(data.scopeWords).padStart(2, "0")}</b><span>WORDS IN SCOPE</span></div>
                <div class="page-head__stat"><b>${String(data.scopeDue).padStart(2, "0")}</b><span>DUE NOW</span></div>
                <div class="page-head__stat"><b>${bound}</b><span>ACTIVE BOUND</span></div>
              </div>
            </div>
          </div>

          <div class="pace" role="radiogroup" aria-label="Study pace">
            ${Object.entries(PACE_COPY).map(([key, copy], i) => `
              <button class="pace__option ${data.pace === key ? "is-active" : ""}" type="button"
                      data-pace="${key}" role="radio" aria-checked="${data.pace === key}">
                <span class="pace__mark">${i === 0 ? "A" : "B"}</span>
                <span class="pace__body">
                  <b>${copy.label}</b>
                  <span>${copy.line}</span>
                </span>
                <span class="pace__state">${data.pace === key ? "SELECTED" : "SELECT"}</span>
              </button>`).join("")}
          </div>

          <div class="ladder__layout">
            <div class="ladder__track">
              <div class="ladder__track-head">
                <span class="eyebrow">The rungs</span>
                <span class="mono">${data.levels.length} LEVELS · HSK 1–5 COMPLETE, HSK 6 PREVIEW</span>
              </div>
              <ol class="rungs">${rungsHTML()}</ol>
            </div>
            <aside class="ladder__panel" aria-live="polite">${panelHTML()}</aside>
          </div>

          ${materialHTML}

          <footer class="ladder__foot">
            <span class="eyebrow">DISCOVERY 60% CLEARS A RUNG · RETENTION KEEPS IT</span>
            <span class="eyebrow" style="color:var(--grey)">NO STREAKS · NO COINS · NO LOCKED DOORS</span>
          </footer>
        </section>`;
    };

    const save = async (payload, message) => {
      if (busy) return;
      busy = true;
      view.setAttribute("aria-busy", "true");
      try {
        data = await post("/api/ladder/pace", payload);
        paint();
        await loadBoot(true);
        if (message) toast(message);
      } catch (error) {
        toast(error.message);
      } finally {
        busy = false;
        view.removeAttribute("aria-busy");
      }
    };

    view.addEventListener("click", (event) => {
      const paceButton = event.target.closest("[data-pace]");
      if (paceButton) {
        const pace = paceButton.dataset.pace;
        if (pace !== data.pace) {
          save({ pace }, pace === "efficiency" ? "Efficiency mode: no ceiling." : "HSK Track: climb the rungs.");
        }
        return;
      }

      const rung = event.target.closest("[data-level]");
      if (rung) {
        const level = Number(rung.dataset.level);
        if (data.pace !== "hsk" || level !== data.level) {
          save({ pace: "hsk", level }, `Now studying HSK ${level}.`);
        }
        return;
      }

      const climb = event.target.closest("[data-climb]");
      if (climb && data.next && data.current?.cleared) {
        save({ level: data.next.hsk }, `Climbed to HSK ${data.next.hsk}.`);
      }
    });

    paint();
  },
};
