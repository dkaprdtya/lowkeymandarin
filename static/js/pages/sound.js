// Lowkey Mandarin — Sound Archive
// Tones, minimal pairs, sentence listening, and a listening check.

import { get, post } from "../core/api.js";
import { esc, icons, toast, speakerButton } from "../core/ui.js";
import { speak, playTone, stopTone, drawWave, toneContourPath } from "../core/audio.js";

const TABS = [
  { id: "tones", label: "Tone contours" },
  { id: "pairs", label: "Minimal pairs" },
  { id: "sentences", label: "Sentence listening" },
  { id: "check", label: "Listening check" },
];

const TONE_NAMES = ["", "high", "rising", "dipping", "falling"];

export default {
  route: "sound",
  index: "06",
  name: "Sound Archive",
  async render(view) {
    const { sets } = await get("/api/sound");
    const bySlug = Object.fromEntries(sets.map((s) => [s.slug, s]));
    let tab = "tones";
    let quiz = null;

    view.innerHTML = `
      <section class="page">
        <header class="page-head">
          <div>
            <span class="eyebrow eyebrow--accent">Sound Archive / 声音档案</span>
            <h1 class="page-head__title" style="margin-top:.7rem">Hear the<br>shape of <em>it.</em></h1>
          </div>
          <div class="page-head__aside">
            <p>Mandarin is four pitch movements and a set of edges between sounds. Look at the contour while you hear it. The line is the lesson.</p>
            <div class="page-head__stats">
              <div class="page-head__stat"><b>4</b><span>tones</span></div>
              <div class="page-head__stat"><b>${bySlug["minimal-pairs"]?.items.length || 0}</b><span>minimal pairs</span></div>
              <div class="page-head__stat"><b>${bySlug["sentences"]?.items.length || 0}</b><span>sentences</span></div>
            </div>
          </div>
        </header>

        <div class="sound__tabs" role="tablist" aria-label="Sound archive sections">
          ${TABS.map((t) => `<button class="chip ${t.id === tab ? "is-active" : ""}" role="tab" aria-selected="${t.id === tab}" data-tab="${t.id}">${t.label}</button>`).join("")}
        </div>
        <div class="sound__section" id="soundContent"></div>
      </section>`;

    const content = view.querySelector("#soundContent");

    const renderTones = () => {
      const set = bySlug["tones"];
      content.innerHTML = `
        <div class="row row--between" style="margin-bottom:1.25rem;gap:1rem;flex-wrap:wrap">
          <div class="stack stack--2">
            <span class="eyebrow">${esc(set.title)}</span>
            <p style="max-width:56ch;color:var(--ink-70);font-size:.9375rem">${esc(set.description)}</p>
          </div>
          <div class="stack stack--2" style="align-items:flex-end">
            <canvas class="wave" id="toneWave" style="width:260px;height:54px" aria-label="Live waveform of the tone being played"></canvas>
            <span class="mono" style="color:var(--grey)">WAVEFORM / LIVE</span>
          </div>
        </div>
        <div class="sound__grid">
          ${set.items.map((tone, i) => `
            <article class="tone-card">
              <div class="tone-card__head">
                <span class="tone-card__num">TONE ${tone.tone} / ${TONE_NAMES[tone.tone].toUpperCase()}</span>
                <span class="mono" style="color:var(--ink-50)">${esc(tone.pinyin)}</span>
              </div>
              <div>
                <div class="tone-card__hanzi">${esc(tone.hanzi)}</div>
                <div class="tone-card__pinyin">${esc(tone.pinyin)}</div>
                <div class="tone-card__meaning">${esc(tone.meaning)}</div>
              </div>
              <div class="tone-card__chart">
                <svg viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true">
                  <path d="${toneContourPath(tone.contour, 100, 50, 6)}" fill="none" stroke="var(--vermilion)" stroke-width="1.6" vector-effect="non-scaling-stroke"/>
                  ${tone.contour.map((v, idx) => {
                    const x = 6 + (idx / (tone.contour.length - 1)) * 88;
                    const y = 50 - 6 - ((v - 1) / 4) * 38;
                    return `<circle cx="${x}" cy="${y}" r="1.6" fill="var(--ink)"/>`;
                  }).join("")}
                </svg>
              </div>
              <p class="tone-card__note">${esc(tone.note)}</p>
              <div class="tone-card__foot">
                <button class="btn btn--sm" type="button" data-tone="${i}">Play contour</button>
                <button class="iconbtn" type="button" data-say="${i}" aria-label="Play the syllable">${icons.speaker}</button>
              </div>
            </article>`).join("")}
        </div>
        <p class="eyebrow" style="margin-top:1.5rem;color:var(--grey)">Contour is synthesised from the tone's pitch path, not a recording · the syllable is spoken by your device</p>`;

      const waveCanvas = content.querySelector("#toneWave");
      content.querySelectorAll("[data-tone]").forEach((button) => {
        button.addEventListener("click", () => {
          const tone = set.items[Number(button.dataset.tone)];
          playTone(tone.contour, {
            onFrame: (data) => drawWave(waveCanvas, data, "#ed6048"),
            onEnd: () => drawWave(waveCanvas, new Uint8Array(256).fill(128), "#ed6048"),
          });
          button.classList.add("is-playing");
          setTimeout(() => button.classList.remove("is-playing"), 1200);
        });
      });
      content.querySelectorAll("[data-say]").forEach((button) => {
        button.addEventListener("click", () => {
          const tone = set.items[Number(button.dataset.say)];
          speak(tone.hanzi, { rate: 0.62 });
        });
      });
    };

    const renderPairs = () => {
      const set = bySlug["minimal-pairs"];
      content.innerHTML = `
        <div class="row row--between" style="margin-bottom:1rem;gap:1rem;flex-wrap:wrap">
          <div class="stack stack--2">
            <span class="eyebrow">${esc(set.title)}</span>
            <p style="max-width:56ch;color:var(--ink-70);font-size:.9375rem">${esc(set.description)}</p>
          </div>
        </div>
        <div>
          ${set.items.map((pair, i) => `
            <div class="pair-row" data-pair="${i}">
              <div class="pair-side">
                <button class="iconbtn" type="button" data-play-a="${i}" aria-label="Play ${esc(pair.a_pinyin)}">${icons.speaker}</button>
                <div>
                  <span class="cn">${esc(pair.a)}</span>
                  <span class="meta"><span class="mono">${esc(pair.a_pinyin)}</span><span class="en">${esc(pair.a_en)}</span></span>
                </div>
              </div>
              <span class="pair-vs">vs</span>
              <div class="pair-side">
                <button class="iconbtn" type="button" data-play-b="${i}" aria-label="Play ${esc(pair.b_pinyin)}">${icons.speaker}</button>
                <div>
                  <span class="cn">${esc(pair.b)}</span>
                  <span class="meta"><span class="mono">${esc(pair.b_pinyin)}</span><span class="en">${esc(pair.b_en)}</span></span>
                </div>
              </div>
              <div class="pair-actions">
                <button class="btn btn--sm btn--ghost" type="button" data-test="${i}">Test me</button>
                <span class="mono" data-feedback="${i}" style="color:var(--ink-50);align-self:center"></span>
              </div>
              <div class="pair-focus"><b>Listening focus</b>${esc(pair.focus)}</div>
            </div>`).join("")}
        </div>`;

      content.querySelectorAll("[data-play-a]").forEach((b) => b.addEventListener("click", () => {
        const pair = set.items[Number(b.dataset.playA)];
        speak(pair.a, { rate: 0.7 });
      }));
      content.querySelectorAll("[data-play-b]").forEach((b) => b.addEventListener("click", () => {
        const pair = set.items[Number(b.dataset.playB)];
        speak(pair.b, { rate: 0.7 });
      }));
      content.querySelectorAll("[data-test]").forEach((button) => {
        button.addEventListener("click", () => {
          const index = Number(button.dataset.test);
          const pair = set.items[index];
          const side = Math.random() > 0.5 ? "a" : "b";
          const feedback = content.querySelector(`[data-feedback="${index}"]`);
          speak(pair[side], { rate: 0.7 });
          feedback.textContent = "Which one?";
          button.textContent = "A or B?";
          button.dataset.answer = side;
          button.onclick = () => {
            // second click on the same button reveals the answer
            feedback.textContent = `That was ${side.toUpperCase()} · ${pair[side + "_pinyin"]}`;
            button.textContent = "Again";
            button.onclick = null;
          };
        });
      });
    };

    const renderSentences = () => {
      const set = bySlug["sentences"];
      content.innerHTML = `
        <div class="row row--between" style="margin-bottom:1rem;gap:1rem;flex-wrap:wrap">
          <div class="stack stack--2">
            <span class="eyebrow">${esc(set.title)}</span>
            <p style="max-width:56ch;color:var(--ink-70);font-size:.9375rem">${esc(set.description)}</p>
          </div>
        </div>
        <div>
          ${set.items.map((item, i) => `
            <div class="sentence-row">
              <button class="iconbtn" type="button" data-say="${i}" aria-label="Play sentence ${i + 1}">${icons.speaker}</button>
              <div>
                <div class="cn">${esc(item.hanzi)}</div>
                <div class="pinyin" data-pinyin="${i}" hidden>${esc(item.pinyin)}</div>
                <div class="en" data-en="${i}" hidden>${esc(item.en)}</div>
                <div class="focus">${item.focus.split(" / ").map((f) => `<span>${esc(f)}</span>`).join("")}</div>
              </div>
              <button class="btn btn--sm btn--ghost" type="button" data-reveal="${i}">Reveal</button>
            </div>`).join("")}
        </div>`;
      content.querySelectorAll("[data-say]").forEach((b) => b.addEventListener("click", () => {
        speak(set.items[Number(b.dataset.say)].hanzi, { rate: 0.78 });
      }));
      content.querySelectorAll("[data-reveal]").forEach((b) => b.addEventListener("click", () => {
        const i = b.dataset.reveal;
        const pinyin = content.querySelector(`[data-pinyin="${i}"]`);
        const en = content.querySelector(`[data-en="${i}"]`);
        const show = pinyin.hidden;
        pinyin.hidden = !show;
        en.hidden = !show;
        b.textContent = show ? "Hide" : "Reveal";
      }));
    };

    const renderCheck = async () => {
      content.innerHTML = `
        <div class="sound__quiz">
          <div class="stack stack--4">
            <div>
              <span class="eyebrow eyebrow--accent">Listening check</span>
              <h3 style="margin-top:.4rem">Name the tone<br>you hear.</h3>
            </div>
            <p>Eight words, drawn from your vocabulary. Listen once, choose the tone, then see the pinyin. This checks your ear, not your memory of the word.</p>
            <button class="btn" type="button" data-start disabled>Start the check ${icons.arrow}</button>
          </div>
          <div id="checkStage" class="sound__quiz-stage">
            <div class="empty" style="padding:2rem">
              <div class="empty__glyph">听</div>
              <p class="small">Four tones. One clear answer.</p>
            </div>
          </div>
        </div>`;
      const stage = content.querySelector("#checkStage");
      const startButton = content.querySelector("[data-start]");
      if (!quiz) {
        const data = await get("/api/sound/quiz");
        quiz = { rounds: data.rounds.slice(0, 8), index: 0, score: 0, answered: false };
      }
      const state = quiz;
      startButton.disabled = false;

      const playRound = () => {
        const round = state.rounds[state.index];
        if (!round) return;
        speak(round.cue, { rate: 0.66 });
      };

      const renderRound = () => {
        const round = state.rounds[state.index];
        if (!round) return finish();
        state.answered = false;
        stage.innerHTML = `
          <div class="row row--between">
            <span class="mono" style="color:var(--ink-50)">ROUND ${String(state.index + 1).padStart(2, "0")} / ${String(state.rounds.length).padStart(2, "0")}</span>
            <span class="mono" style="color:var(--vermilion-text)">${state.score} correct</span>
          </div>
          <button class="btn btn--ghost" type="button" data-play>Play the word ${icons.speaker}</button>
          <div class="sound__tones">
            ${[1, 2, 3, 4].map((tone) => `
              <button class="tone-btn" type="button" data-tone="${tone}">
                <b>${tone}</b><span>${TONE_NAMES[tone]}</span>
              </button>`).join("")}
          </div>
          <p class="sound__quiz-feedback" data-feedback>Listen for the movement of the pitch.</p>`;
        stage.querySelector("[data-play]").addEventListener("click", playRound);
        stage.querySelectorAll("[data-tone]").forEach((button) => {
          button.addEventListener("click", () => {
            if (state.answered) return;
            state.answered = true;
            const answer = Number(button.dataset.tone);
            const correct = answer === round.tone;
            if (correct) state.score += 1;
            stage.querySelectorAll("[data-tone]").forEach((b) => {
              b.disabled = true;
              if (Number(b.dataset.tone) === round.tone) b.classList.add("is-correct");
              else if (b === button) b.classList.add("is-wrong");
            });
            stage.querySelector("[data-feedback]").textContent = `${correct ? "Correct" : "Not this one"} · ${round.hanzi} ${round.pinyin} · ${round.meaning}`;
            const next = document.createElement("button");
            next.className = "btn btn--sm";
            next.type = "button";
            next.textContent = state.index + 1 >= state.rounds.length ? "See result" : "Next word";
            next.addEventListener("click", () => {
              state.index += 1;
              if (state.index >= state.rounds.length) finish();
              else renderRound();
            });
            stage.append(next);
          });
        });
        setTimeout(playRound, 220);
      };

      const finish = async () => {
        content.querySelector("[data-start]")?.remove();
        stage.innerHTML = `
          <div class="row row--between">
            <span class="mono" style="color:var(--ink-50)">CHECK COMPLETE</span>
            <button class="btn btn--sm btn--ghost" type="button" data-again>Run it again</button>
          </div>
          <div class="sound__quiz-score">
            <b>${state.score}</b>
            <span class="mono" style="color:var(--ink-50)">/ ${state.rounds.length} TONES IDENTIFIED</span>
          </div>
          <div class="meter"><div class="meter__fill meter__fill--accent" style="width:${(state.score / state.rounds.length) * 100}%"></div></div>
          <p class="sound__quiz-feedback">${state.score >= state.rounds.length - 1 ? "Your ear is holding. Move to minimal pairs." : "Replay the contour cards, then run the check again."}</p>`;
        try {
          await post("/api/session", {
            mode: "sound", score: state.score, correct: state.score,
            total: state.rounds.length, meta: { quiz: "tones" },
          });
        } catch (_e) { /* keep the local result visible */ }
        stage.querySelector("[data-again]").addEventListener("click", async () => {
          const data = await get("/api/sound/quiz");
          quiz = { rounds: data.rounds.slice(0, 8), index: 0, score: 0, answered: false };
          renderCheck();
        });
      };

      startButton.addEventListener("click", () => {
        startButton.remove();
        state.index = 0;
        state.score = 0;
        renderRound();
      });

      if (state.rounds.length && state.index > 0) {
        startButton.textContent = "Resume the check";
      }
    };

    const renderContent = () => {
      stopTone();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      if (tab === "tones") renderTones();
      else if (tab === "pairs") renderPairs();
      else if (tab === "sentences") renderSentences();
      else renderCheck();
    };

    view.querySelectorAll("[data-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        tab = button.dataset.tab;
        view.querySelectorAll("[data-tab]").forEach((b) => {
          const active = b.dataset.tab === tab;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-selected", String(active));
        });
        renderContent();
      });
    });

    renderContent();

    return () => {
      stopTone();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  },
};
