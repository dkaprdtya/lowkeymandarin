// Lowkey Mandarin — The Challenge Room
// Four arcade games, four different hands: association, reconstruction,
// tone recognition and vocabulary memory. Each posts its result to the archive.

import { get, post } from "../core/api.js";
import { esc, icons, toast } from "../core/ui.js";
import { speak } from "../core/audio.js";

const GAMES = [
  {
    id: "association",
    num: "01",
    glyph: "联",
    title: "Word Association",
    desc: "A word appears. Pick the one connected to it. Synonyms, opposites, time words, collocations.",
    accent: "#dceb72",
    skill: "MEANING",
  },
  {
    id: "reconstruction",
    num: "02",
    glyph: "句",
    title: "Sentence Reconstruction",
    desc: "Scattered characters, one correct order. Drag or tap the tiles until the sentence makes sense.",
    accent: "#8fd3b6",
    skill: "SYNTAX",
  },
  {
    id: "tone",
    num: "03",
    glyph: "声",
    title: "Tone Recognition",
    desc: "Listen to a word and name the pitch movement. No characters, no pinyin — just your ear.",
    accent: "#ed6048",
    skill: "LISTENING",
  },
  {
    id: "memory",
    num: "04",
    glyph: "记",
    title: "Vocabulary Memory",
    desc: "Sixteen cards face down. Pair each character with its meaning in as few turns as you can.",
    accent: "#8fb4d9",
    skill: "RECALL",
  },
];

const GAME_BY_ID = Object.fromEntries(GAMES.map((g) => [g.id, g]));

const TIMEOUTS = new Set();
function later(fn, ms) {
  const id = setTimeout(() => { TIMEOUTS.delete(id); fn(); }, ms);
  TIMEOUTS.add(id);
  return id;
}
function clearLater() {
  TIMEOUTS.forEach((id) => clearTimeout(id));
  TIMEOUTS.clear();
}

const mmss = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

function shell({ game, dark, stats = [] }) {
  return `
    <div class="game ${dark ? "game--dark" : ""}" id="gameShell">
      <div class="game__top">
        <div class="game__title">
          <b>${esc(game.title)}</b>
          <span>${game.num} / ${esc(game.skill)}</span>
        </div>
        <div class="game__stats">
          ${stats.map((s) => `
            <div class="game__stat">
              <b data-stat="${s.id}">${esc(s.value)}</b>
              <span>${esc(s.label)}</span>
            </div>`).join("")}
        </div>
        <a class="game__close" href="#/challenge">Close ✕</a>
      </div>
      <div class="game__body">
        <div class="game__inner" id="gameInner"></div>
      </div>
    </div>`;
}

function setStat(root, id, value) {
  const node = root.querySelector(`[data-stat="${id}"]`);
  if (node) node.textContent = value;
}

async function finishGame(root, inner, { game, score, accuracy, duration, detail }) {
  const clean = Math.max(0, Math.round(score));
  const acc = Math.max(0, Math.min(100, Math.round(accuracy)));
  try {
    await post("/api/challenge/result", {
      game: game.id,
      score: clean,
      accuracy: acc,
      duration,
    });
  } catch (error) {
    toast(error.message);
  }
  inner.innerHTML = `
    <div class="result">
      <span class="result__glyph" aria-hidden="true">${game.glyph}</span>
      <span class="eyebrow ${root.querySelector(".game--dark") ? "eyebrow--light" : "eyebrow--accent"}">${esc(game.title)} complete</span>
      <h2>${detail.headline || "Run recorded."}</h2>
      <p class="lede" style="text-align:center;max-width:34ch">${esc(detail.note || "The result is stored in your archive, beside the words it tested.")}</p>
      <div class="result__grid">
        <div><b>${clean}</b><span>score</span></div>
        <div><b>${acc}%</b><span>accuracy</span></div>
        <div><b>${mmss(duration)}</b><span>duration</span></div>
      </div>
      <div class="result__actions">
        <button class="btn" type="button" data-again>Run it again ${icons.arrow}</button>
        <a class="btn btn--ghost" href="#/challenge">Back to the room</a>
      </div>
    </div>`;
  inner.querySelector("[data-again]").addEventListener("click", () => {
    location.hash = `#/challenge/${game.id}`;
    // Re-render when the hash is already the current route.
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
}

// --------------------------------------------------------------------------
// Association
// --------------------------------------------------------------------------
async function association(view) {
  const game = GAME_BY_ID.association;
  const { rounds } = await get("/api/challenge/association");
  view.innerHTML = shell({
    game,
    dark: false,
    stats: [
      { id: "round", label: "round", value: `01 / ${String(rounds.length).padStart(2, "0")}` },
      { id: "score", label: "score", value: "0" },
      { id: "time", label: "seconds", value: "30" },
    ],
  });
  const root = view.querySelector("#gameShell");
  const inner = view.querySelector("#gameInner");

  const state = { index: 0, score: 0, correct: 0, answered: false, left: 30, started: performance.now() };
  let timer = null;
  let advanceTimer = null;

  const render = () => {
    const round = rounds[state.index];
    if (!round) return end();
    state.answered = false;
    state.left = 30;
    setStat(root, "round", `${String(state.index + 1).padStart(2, "0")} / ${String(rounds.length).padStart(2, "0")}`);
    setStat(root, "score", String(state.score));
    setStat(root, "time", "30");

    inner.innerHTML = `
      <div class="assoc__timer" aria-hidden="true"><div style="width:100%"></div></div>
      <div class="assoc__prompt">
        <span class="assoc__type">${esc(round.type)} connection</span>
        <span class="assoc__hanzi">${esc(round.prompt)}</span>
        <span class="assoc__meta">${esc(round.pinyin)} · ${esc(round.meaning)}</span>
      </div>
      <div class="assoc__options" role="group" aria-label="Choose the connected word">
        ${round.options.map((option, i) => `
          <button class="option" type="button" data-option="${i}">
            <span class="option__key">${i + 1}</span>
            <span class="option__body">
              <span class="option__main" style="font-family:var(--font-cn);font-size:1.35rem">${esc(option.hanzi)}</span>
              <span class="option__sub">${esc(option.pinyin)} · ${esc(option.meaning)}</span>
            </span>
          </button>`).join("")}
      </div>
      <p class="assoc__note" data-note hidden></p>
      <p class="mono" style="color:var(--grey)">KEYS 1–4 TO ANSWER</p>`;

    inner.querySelectorAll("[data-option]").forEach((button) => {
      button.addEventListener("click", () => answer(Number(button.dataset.option)));
    });

    clearInterval(timer);
    const bar = inner.querySelector(".assoc__timer div");
    timer = setInterval(() => {
      state.left -= 1;
      setStat(root, "time", String(Math.max(0, state.left)));
      if (bar) bar.style.width = `${Math.max(0, (state.left / 30) * 100)}%`;
      if (state.left <= 0) {
        clearInterval(timer);
        answer(-1);
      }
    }, 1000);
  };

  const answer = (choice) => {
    if (state.answered) return;
    state.answered = true;
    clearInterval(timer);
    const round = rounds[state.index];
    const buttons = inner.querySelectorAll("[data-option]");
    const correctIndex = round.options.findIndex((o) => o.correct);
    buttons.forEach((button, i) => {
      button.disabled = true;
      if (i === correctIndex) button.classList.add("is-correct");
      else if (i === choice) button.classList.add("is-wrong");
      else button.classList.add("is-muted");
    });
    const note = inner.querySelector("[data-note]");
    if (note) {
      note.hidden = false;
      note.textContent = round.note;
    }
    if (choice === correctIndex) {
      state.correct += 1;
      state.score += 100 + Math.max(0, state.left) * 3;
      setStat(root, "score", String(state.score));
    }
    advanceTimer = later(() => {
      state.index += 1;
      render();
    }, choice === correctIndex ? 900 : 1600);
  };

  const end = () => {
    clearInterval(timer);
    const duration = Math.round((performance.now() - state.started) / 1000);
    finishGame(root, inner, {
      game,
      score: state.score,
      accuracy: (state.correct / Math.max(1, rounds.length)) * 100,
      duration,
      detail: {
        headline: state.correct === rounds.length ? "Every connection found." : "The network is taking shape.",
        note: `${state.correct} of ${rounds.length} connections named. Weak links return in the next run.`,
      },
    });
  };

  const onKey = (event) => {
    if (event.target.matches("input, textarea")) return;
    if (event.key >= "1" && event.key <= "4") {
      const index = Number(event.key) - 1;
      if (rounds[state.index]?.options[index]) answer(index);
    }
  };
  document.addEventListener("keydown", onKey);

  render();

  return () => {
    clearInterval(timer);
    clearLater();
    document.removeEventListener("keydown", onKey);
  };
}

// --------------------------------------------------------------------------
// Sentence reconstruction
// --------------------------------------------------------------------------
async function reconstruction(view) {
  const game = GAME_BY_ID.reconstruction;
  const { rounds } = await get("/api/challenge/reconstruction");
  view.innerHTML = shell({
    game,
    dark: false,
    stats: [
      { id: "round", label: "line", value: `01 / ${String(rounds.length).padStart(2, "0")}` },
      { id: "score", label: "score", value: "0" },
      { id: "exact", label: "exact", value: "0" },
    ],
  });
  const root = view.querySelector("#gameShell");
  const inner = view.querySelector("#gameInner");

  const state = { index: 0, score: 0, exact: 0, tray: [], checked: false, started: performance.now() };

  const render = () => {
    const round = rounds[state.index];
    if (!round) return end();
    state.tray = [];
    state.checked = false;
    setStat(root, "round", `${String(state.index + 1).padStart(2, "0")} / ${String(rounds.length).padStart(2, "0")}`);

    inner.innerHTML = `
      <div class="stack stack--2">
        <span class="assoc__type">Line ${String(state.index + 1).padStart(2, "0")} · ${esc(round.focus)} focus</span>
        <p class="recon__en">${esc(round.en)}</p>
      </div>
      <div class="recon__tray" id="reconTray" aria-label="Your sentence" aria-live="polite">
        <span class="mono" style="color:var(--grey);align-self:center">Build the sentence here</span>
      </div>
      <div class="recon__bank" id="reconBank" aria-label="Available characters">
        ${round.tokens.map((token, i) => `
          <button class="token" type="button" data-bank="${i}" draggable="true">${esc(token)}</button>`).join("")}
      </div>
      <div class="row" style="gap:.6rem;flex-wrap:wrap;align-items:center">
        <button class="btn" type="button" data-check disabled>Check the sentence</button>
        <button class="btn btn--quiet" type="button" data-clear>Clear</button>
        <span class="recon__answer" data-answer hidden></span>
      </div>
      <p class="mono" style="color:var(--grey)">CLICK OR DRAG A TILE · ENTER TO CHECK</p>`;

    const tray = inner.querySelector("#reconTray");
    const bank = inner.querySelector("#reconBank");
    const check = inner.querySelector("[data-check]");
    const clear = inner.querySelector("[data-clear]");
    const answer = inner.querySelector("[data-answer]");

    const paint = () => {
      const used = new Set(state.tray.map((t) => t.index));
      bank.querySelectorAll("[data-bank]").forEach((button) => {
        button.classList.toggle("is-used", used.has(Number(button.dataset.bank)));
        button.disabled = state.checked;
      });
      tray.innerHTML = state.tray.length
        ? state.tray.map((t, i) => `<button class="token" type="button" data-tray="${i}">${esc(t.token)}</button>`).join("")
        : `<span class="mono" style="color:var(--grey);align-self:center">Build the sentence here</span>`;
      check.disabled = state.tray.length !== round.tokens.length || state.checked;
      clear.disabled = state.checked;
      tray.querySelectorAll("[data-tray]").forEach((button) => {
        button.addEventListener("click", () => {
          if (state.checked) return;
          state.tray.splice(Number(button.dataset.tray), 1);
          paint();
        });
        button.addEventListener("dragstart", (event) => {
          event.dataTransfer.setData("text/plain", `tray:${button.dataset.tray}`);
        });
      });
    };

    const addToken = (index) => {
      if (state.checked || state.tray.some((t) => t.index === index)) return;
      state.tray.push({ index, token: round.tokens[index] });
      paint();
    };

    bank.querySelectorAll("[data-bank]").forEach((button) => {
      button.addEventListener("click", () => addToken(Number(button.dataset.bank)));
      button.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/plain", `bank:${button.dataset.bank}`);
      });
    });

    [tray, bank].forEach((zone) => {
      zone.addEventListener("dragover", (event) => {
        if (!state.checked) event.preventDefault();
        zone.style.borderColor = "var(--ink)";
      });
      zone.addEventListener("dragleave", () => { zone.style.borderColor = ""; });
      zone.addEventListener("drop", (event) => {
        event.preventDefault();
        zone.style.borderColor = "";
        const payload = event.dataTransfer.getData("text/plain");
        if (!payload) return;
        const [from, raw] = payload.split(":");
        const index = Number(raw);
        if (from === "bank") {
          addToken(index);
        } else if (from === "tray" && zone === bank) {
          state.tray.splice(index, 1);
          paint();
        }
      });
    });

    clear.addEventListener("click", () => {
      if (state.checked) return;
      state.tray = [];
      paint();
    });

    check.addEventListener("click", () => {
      if (state.checked) return;
      state.checked = true;
      const built = state.tray.map((t) => t.token).join("");
      const expected = round.answer.join("");
      const exact = built === expected;
      if (exact) {
        state.exact += 1;
        state.score += 150 + Math.max(0, 30 - Math.round((performance.now() - state.started) / rounds.length / 1000)) * 2;
      }
      setStat(root, "score", String(state.score));
      setStat(root, "exact", String(state.exact));
      tray.classList.add(exact ? "is-good" : "is-bad");
      answer.hidden = false;
      answer.textContent = exact ? `Correct · ${round.answer.join("")}` : `Correct order · ${round.answer.join("")}`;
      setStat(root, "score", String(state.score));

      const next = document.createElement("button");
      next.className = "btn";
      next.type = "button";
      next.textContent = state.index + 1 >= rounds.length ? "See the result" : "Next line →";
      next.addEventListener("click", () => {
        state.index += 1;
        if (state.index >= rounds.length) end();
        else render();
      });
      check.replaceWith(next);
      next.focus();
      paint();
    });

    paint();
  };

  const end = () => {
    const duration = Math.round((performance.now() - state.started) / 1000);
    finishGame(root, inner, {
      game,
      score: state.score,
      accuracy: (state.exact / Math.max(1, rounds.length)) * 100,
      duration,
      detail: {
        headline: state.exact === rounds.length ? "Every line landed." : "Order is a kind of grammar.",
        note: `${state.exact} of ${rounds.length} sentences reconstructed exactly. Read the missed ones aloud once.`,
      },
    });
  };

  const onKey = (event) => {
    if (event.target.matches("input, textarea")) return;
    if (event.key === "Enter") {
      event.preventDefault();
      const current = view.querySelector("#gameInner");
      const check = current.querySelector("[data-check]");
      if (check && !check.disabled) check.click();
      else current.querySelector(".btn")?.click();
    }
  };
  document.addEventListener("keydown", onKey);

  render();

  return () => {
    clearLater();
    document.removeEventListener("keydown", onKey);
  };
}

// --------------------------------------------------------------------------
// Tone recognition
// --------------------------------------------------------------------------
async function toneGame(view) {
  const game = GAME_BY_ID.tone;
  const { rounds: all } = await get("/api/challenge/tone");
  const rounds = all.slice(0, 10);
  view.innerHTML = shell({
    game,
    dark: true,
    stats: [
      { id: "round", label: "round", value: `01 / ${String(rounds.length).padStart(2, "0")}` },
      { id: "score", label: "score", value: "0" },
      { id: "streak", label: "streak", value: "0" },
    ],
  });
  const root = view.querySelector("#gameShell");
  const inner = view.querySelector("#gameInner");
  const TONE_NAMES = { 1: "high level", 2: "rising", 3: "dipping", 4: "falling" };

  const state = { index: 0, score: 0, correct: 0, streak: 0, best: 0, answered: false, started: performance.now() };

  const play = () => {
    const round = rounds[state.index];
    if (round) speak(round.cue || round.hanzi, { rate: 0.62 });
  };

  const render = () => {
    const round = rounds[state.index];
    if (!round) return end();
    state.answered = false;
    setStat(root, "round", `${String(state.index + 1).padStart(2, "0")} / ${String(rounds.length).padStart(2, "0")}`);

    inner.innerHTML = `
      <div class="tonegame">
        <span class="assoc__type">Listen · name the pitch movement</span>
        <button class="tonegame__speaker" type="button" data-play aria-label="Play the word">${icons.speaker}</button>
        <p class="mono" style="color:var(--ivory-55)">${state.index + 1 === 1 ? "Press play. Listen once, then once more." : "Play again if you need to."}</p>
        <div class="tonegame__keypad" role="group" aria-label="Choose the tone">
          ${[1, 2, 3, 4].map((tone) => `
            <button class="keypad" type="button" data-tone="${tone}">
              <b>${tone}</b><span>${TONE_NAMES[tone]}</span>
            </button>`).join("")}
        </div>
        <p class="tonegame__feedback" data-feedback>Four movements: level, rise, dip, fall.</p>
        <p class="mono" style="color:var(--ivory-55);font-size:.5625rem">KEYS 1–4 · SPACE TO REPLAY</p>
      </div>`;

    inner.querySelector("[data-play]").addEventListener("click", play);
    inner.querySelectorAll("[data-tone]").forEach((button) => {
      button.addEventListener("click", () => answer(Number(button.dataset.tone)));
    });
    later(play, 280);
  };

  const answer = (choice) => {
    if (state.answered) return;
    state.answered = true;
    const round = rounds[state.index];
    const feedback = inner.querySelector("[data-feedback]");
    const buttons = inner.querySelectorAll("[data-tone]");
    buttons.forEach((button) => {
      button.disabled = true;
      if (Number(button.dataset.tone) === round.tone) button.classList.add("is-correct");
      else if (Number(button.dataset.tone) === choice) button.classList.add("is-wrong");
    });
    const correct = choice === round.tone;
    if (correct) {
      state.correct += 1;
      state.streak += 1;
      state.best = Math.max(state.best, state.streak);
      state.score += 100 + state.streak * 15;
    } else {
      state.streak = 0;
    }
    setStat(root, "score", String(state.score));
    setStat(root, "streak", String(state.best));
    if (feedback) {
      feedback.textContent = `${correct ? "Correct" : "Not this one"} · ${round.hanzi} ${round.pinyin} · ${round.meaning} · tone ${round.tone}`;
    }
    if (!correct) speak(round.cue || round.hanzi, { rate: 0.55 });
    later(() => {
      state.index += 1;
      render();
    }, correct ? 900 : 1500);
  };

  const end = () => {
    const duration = Math.round((performance.now() - state.started) / 1000);
    finishGame(root, inner, {
      game,
      score: state.score,
      accuracy: (state.correct / Math.max(1, rounds.length)) * 100,
      duration,
      detail: {
        headline: state.correct >= rounds.length - 2 ? "Your ear is holding." : "Pitch needs repetition.",
        note: `${state.correct} of ${rounds.length} tones identified. Longest streak: ${state.best}.`,
      },
    });
  };

  const onKey = (event) => {
    if (event.target.matches("input, textarea")) return;
    if (event.key >= "1" && event.key <= "4") answer(Number(event.key));
    else if (event.code === "Space") { event.preventDefault(); play(); }
  };
  document.addEventListener("keydown", onKey);

  render();

  return () => {
    clearLater();
    document.removeEventListener("keydown", onKey);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  };
}

// --------------------------------------------------------------------------
// Vocabulary memory
// --------------------------------------------------------------------------
async function memoryGame(view) {
  const game = GAME_BY_ID.memory;
  const { pairs } = await get("/api/challenge/memory");
  view.innerHTML = shell({
    game,
    dark: false,
    stats: [
      { id: "pairs", label: "pairs", value: `00 / ${String(pairs.length).padStart(2, "0")}` },
      { id: "turns", label: "turns", value: "0" },
      { id: "time", label: "time", value: "0:00" },
    ],
  });
  const root = view.querySelector("#gameShell");
  const inner = view.querySelector("#gameInner");

  const cards = [];
  pairs.forEach((pair) => {
    cards.push({ pair: pair.id, kind: "hanzi", text: pair.hanzi, pinyin: pair.pinyin });
    cards.push({ pair: pair.id, kind: "meaning", text: pair.meaning, pinyin: pair.pinyin });
  });
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  const state = { open: [], matched: new Set(), turns: 0, hits: 0, locked: false, started: performance.now() };

  inner.innerHTML = `
    <div class="row row--between" style="flex-wrap:wrap;gap:1rem">
      <span class="assoc__type">Find each character's meaning · one pair per turn</span>
      <button class="btn btn--sm btn--ghost" type="button" data-peek>Peek 1.5s</button>
    </div>
    <div class="memgrid" id="memGrid" aria-label="Memory cards">
      ${cards.map((card, i) => `
        <button class="memcard" type="button" data-card="${i}" aria-label="Card ${i + 1}, face down">
          <span class="memcard__inner">
            <span class="memcard__face memcard__front" aria-hidden="true">${game.glyph}</span>
            <span class="memcard__face memcard__back">
              <span class="${card.kind === "hanzi" ? "cn" : "mean"}" style="${card.kind === "meaning" ? "font-size:.8rem" : ""}">${esc(card.text)}</span>
            </span>
          </span>
        </button>`).join("")}
    </div>
    <p class="mono" style="color:var(--grey);text-align:center">MATCHED PAIRS STAY OPEN · MISMATCHES CLOSE</p>`;

  const grid = inner.querySelector("#memGrid");
  let clock = null;
  const tickClock = () => {
    const seconds = Math.round((performance.now() - state.started) / 1000);
    setStat(root, "time", mmss(seconds));
    setStat(root, "pairs", `${String(state.matched.size / 2).padStart(2, "0")} / ${String(pairs.length).padStart(2, "0")}`);
  };
  clock = setInterval(tickClock, 1000);
  tickClock();

  const closeAll = () => {
    state.open.forEach((i) => {
      const card = grid.querySelector(`[data-card="${i}"]`);
      card.classList.remove("is-open");
      card.setAttribute("aria-label", `Card ${i + 1}, face down`);
    });
    state.open = [];
    state.locked = false;
  };

  const choose = (index) => {
    if (state.locked) return;
    const card = cards[index];
    const node = grid.querySelector(`[data-card="${index}"]`);
    if (!node || node.classList.contains("is-open") || node.classList.contains("is-matched")) return;

    node.classList.add("is-open");
    node.setAttribute("aria-label", card.text);
    state.open.push(index);
    if (card.kind === "hanzi") speak(card.text, { rate: 0.85 });

    if (state.open.length === 2) {
      state.turns += 1;
      setStat(root, "turns", String(state.turns));
      const [a, b] = state.open;
      const first = cards[a];
      const second = cards[b];
      if (first.pair === second.pair && first.kind !== second.kind) {
        state.hits += 1;
        state.matched.add(first.pair);
        [a, b].forEach((i) => {
          grid.querySelector(`[data-card="${i}"]`).classList.add("is-matched");
        });
        state.open = [];
        setStat(root, "pairs", `${String(state.matched.size).padStart(2, "0")} / ${String(pairs.length).padStart(2, "0")}`);
        if (state.matched.size === pairs.length) {
          later(() => end(), 650);
        }
      } else {
        state.locked = true;
        later(closeAll, 850);
      }
    }
  };

  grid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-card]");
    if (card) choose(Number(card.dataset.card));
  });

  inner.querySelector("[data-peek]").addEventListener("click", (event) => {
    if (state.locked) return;
    const button = event.currentTarget;
    const unmatched = cards.map((_c, i) => i).filter((i) => !grid.querySelector(`[data-card="${i}"]`).classList.contains("is-matched"));
    button.disabled = true;
    unmatched.forEach((i) => grid.querySelector(`[data-card="${i}"]`).classList.add("is-open"));
    later(() => {
      unmatched.forEach((i) => {
        if (!grid.querySelector(`[data-card="${i}"]`).classList.contains("is-matched")) {
          grid.querySelector(`[data-card="${i}"]`).classList.remove("is-open");
        }
      });
      button.disabled = false;
    }, 1500);
  });

  const end = () => {
    clearInterval(clock);
    const seconds = Math.round((performance.now() - state.started) / 1000);
    const accuracy = state.turns ? (state.hits / state.turns) * 100 : 0;
    const score = state.hits * 100 + Math.max(0, 120 - seconds) * 3 - (state.turns - state.hits) * 20;
    finishGame(root, inner, {
      game,
      score,
      accuracy,
      duration: seconds,
      detail: {
        headline: state.turns <= pairs.length + 4 ? "Sharp turns." : "The grid resolved.",
        note: `${pairs.length} pairs in ${state.turns} turns. Fewer turns means stronger first recall.`,
      },
    });
  };

  return () => {
    clearInterval(clock);
    clearLater();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  };
}

const RUNNERS = {
  association,
  reconstruction,
  tone: toneGame,
  memory: memoryGame,
};

export default {
  route: "challenge",
  index: "07",
  name: "Challenge Room",
  async render(view) {
    let records = {};
    try {
      ({ records } = await get("/api/challenge/history"));
    } catch (_e) { /* the room works without a history */ }

    view.innerHTML = `
      <section class="arcade">
        <header class="arcade__head">
          <div>
            <h1><span class="cn">挑战室</span>The Challenge<br><em>Room.</em></h1>
          </div>
          <div class="stack stack--3">
            <p>Four games. Each one tests a different edge of the language: meaning, order, pitch, recall. No lives, no tickets. A score is only a record of this run.</p>
            <div class="row" style="gap:.4rem;flex-wrap:wrap">
              <span class="tag tag--dark">KEYBOARD OK</span>
              <span class="tag tag--dark">DRAG OR TAP</span>
              <span class="tag tag--dark">SELF-PACED</span>
            </div>
          </div>
        </header>

        <div class="arcade__grid">
          ${GAMES.map((game, i) => {
            const record = records[game.id];
            return `
              <a class="cabinet ${i === 0 ? "cabinet--wide" : ""}" href="#/challenge/${game.id}" data-glyph="${game.glyph}">
                <span class="cabinet__top">
                  <span class="cabinet__num">${game.num} / ${esc(game.skill)}</span>
                  <span class="cabinet__accent" style="background:${game.accent}" aria-hidden="true"></span>
                </span>
                <span class="cabinet__body">
                  <h2>${esc(game.title)}</h2>
                  <p>${esc(game.desc)}</p>
                </span>
                <span class="cabinet__foot">
                  <span class="cabinet__meta">${record ? `BEST ${record.best} · ${record.plays} RUN${record.plays === 1 ? "" : "S"}` : "UNPLAYED"}</span>
                  ${icons.arrow}
                </span>
              </a>`;
          }).join("")}
        </div>

        <div class="row row--between" style="margin-top:2.5rem;padding-top:1.5rem;border-top:1px solid var(--ivory-20);gap:1.5rem;flex-wrap:wrap">
          <p class="eyebrow eyebrow--light" style="max-width:52ch;line-height:1.7">Games are generated from your vocabulary and the connection map. They reward the same thing the rest of Lowkey Mandarin rewards: noticing how the language fits together.</p>
          <a class="btn btn--invert" href="#/cosmos">Study the map first ${icons.arrow}</a>
        </div>
      </section>`;
  },
};

export const gamePage = {
  route: "challenge",
  index: "07",
  name: "Challenge Room",
  async render(view, params) {
    const runner = RUNNERS[params.game];
    if (!runner) {
      view.innerHTML = `
        <section class="page">
          <p class="eyebrow eyebrow--accent">No cabinet here</p>
          <h1 class="page-head__title" style="margin:.6rem 0 1rem">That game is not in the room.</h1>
          <p style="margin-top:1.5rem"><a class="btn" href="#/challenge">Back to the room ${icons.arrow}</a></p>
        </section>`;
      return;
    }

    view.innerHTML = `<div class="loading" style="padding:3rem var(--page-pad)">Loading the cabinet</div>`;
    let cleanup = null;
    try {
      cleanup = await runner(view);
    } catch (error) {
      view.innerHTML = `
        <section class="page">
          <p class="eyebrow eyebrow--accent">Cabinet jammed</p>
          <h1 class="page-head__title" style="margin:.6rem 0 1rem">The game did not start.</h1>
          <p class="lede">${esc(error.message)}</p>
          <p style="margin-top:1.5rem"><a class="btn" href="#/challenge">Back to the room ${icons.arrow}</a></p>
        </section>`;
      return;
    }

    const escKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        location.hash = "#/challenge";
      }
    };
    document.addEventListener("keydown", escKey);

    return () => {
      document.removeEventListener("keydown", escKey);
      if (typeof cleanup === "function") cleanup();
      clearLater();
    };
  },
};
