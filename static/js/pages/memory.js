// Lowkey Mandarin — Memory Studio
// One word at a time. Reveal, judge your recall, let the schedule do the rest.

import { get, post } from "../core/api.js";
import { esc, icons, toast, speakerButton } from "../core/ui.js";
import { speak, stopSpeech } from "../core/audio.js";
import { boot, setDue } from "../core/store.js";
import { requireAccount } from "../core/gate.js";

const EXERCISES = {
  hanzi: { label: "Hanzi → meaning", prompt: "What does this character mean?" },
  meaning: { label: "Meaning → hanzi", prompt: "Which characters carry this meaning?" },
  audio: { label: "Sound → word", prompt: "Listen. Which word is this?" },
  pinyin: { label: "Pinyin → tone", prompt: "Hear the pitch in your mind. Which word is it?" },
  relation: { label: "Word → connection", prompt: "What is this word connected to?" },
  sentence: { label: "Word → sentence", prompt: "Which word completes the line?" },
};

export default {
  route: "memory",
  index: "02",
  name: "Memory Studio",
  async render(view) {
    if (!(await requireAccount(view, "Spaced review schedules the next visit from your own answers."))) return;
    view.innerHTML = `<section class="page"><div class="loading">Opening the studio</div></section>`;
    const { queue, due } = await get("/api/review/queue?limit=14&mode=mixed");

    view.innerHTML = `
      <section class="page memory">
        <h1 class="sr-only">Memory Studio</h1>
        <div class="memory__top">
          <div class="memory__progress">
            <div class="memory__segments" id="memSegments"></div>
            <span class="memory__count" id="memCount">—</span>
          </div>
          <div class="row" style="gap:.8rem">
            <span class="tag">${due} DUE</span>
            <a class="btn btn--quiet" href="#/archive">Leave studio ${icons.arrow}</a>
          </div>
        </div>
        <div class="memory__stage" id="memStage"></div>
        <div class="memory__controls" id="memControls"></div>
      </section>`;

    const stage = view.querySelector("#memStage");
    const controls = view.querySelector("#memControls");
    const segments = view.querySelector("#memSegments");
    const count = view.querySelector("#memCount");

    if (!queue.length) {
      stage.innerHTML = `
        <div class="memory__empty">
          <span class="cn" aria-hidden="true">空</span>
          <h2 class="display" style="font-size:var(--step-3);max-width:16ch">The queue is empty. That is not a failure — it is a pause.</h2>
          <p class="lede" style="text-align:center">Discover a new word in the cosmos, then come back and let it settle.</p>
          <a class="btn" href="#/cosmos">Open the cosmos ${icons.arrow}</a>
        </div>`;
      count.textContent = "No words due";
      segments.innerHTML = "";
      return;
    }

    const state = {
      index: 0,
      revealed: false,
      busy: false,
      detail: null,
      startedAt: Date.now(),
      results: [],
      words: [],
    };

    const renderSegments = () => {
      segments.innerHTML = queue.map((_item, i) => {
        const cls = i < state.index ? "is-done" : i === state.index ? "is-now" : "";
        return `<span class="memory__segment ${cls}"></span>`;
      }).join("");
      count.textContent = `${String(state.index + 1).padStart(2, "0")} / ${String(queue.length).padStart(2, "0")} · ${EXERCISES[queue[state.index]?.exercise]?.label || "Review"}`;
    };

    const playCue = (item) => {
      const text = item.exercise === "audio" ? item.hanzi
        : item.exercise === "sentence" ? item.example
          : item.hanzi;
      speak(text, { rate: item.exercise === "sentence" ? 0.8 : 0.72 });
    };

    const targetHTML = (item) => {
      switch (item.exercise) {
        case "meaning":
          return `<div class="memory__target is-text">${esc(item.meaning)}</div>`;
        case "pinyin":
          return `<div class="memory__target is-text" style="font-family:var(--font-mono);font-size:clamp(2.6rem,7vw,5rem);letter-spacing:.02em">${esc(item.pinyin)}</div>`;
        case "audio":
          return `<div class="memory__target is-audio">
            ${speakerButton({ class: "speaker--lg", data: 'data-play', label: `Play ${item.pinyin}` })}
            <span class="memory__hidden-glyph" aria-hidden="true" style="font-family:var(--font-cn);font-size:clamp(5rem,12vw,9rem)">听</span>
          </div>`;
        case "sentence":
          return `<div class="memory__target is-text" style="font-family:var(--font-cn);font-size:clamp(1.8rem,5vw,3.4rem);line-height:1.3">${esc(item.example.replace(item.hanzi, "▢"))}</div>`;
        case "relation":
        case "hanzi":
        default:
          return `<div class="memory__target">${esc(item.hanzi)}</div>`;
      }
    };

    const answerHTML = (item) => {
      if (item.exercise === "meaning") {
        return `
          <div class="memory__answer-main cn" style="font-size:clamp(4rem,10vw,7rem);font-family:var(--font-cn);font-weight:900">${esc(item.hanzi)}</div>
          <div class="mono" style="color:var(--vermilion-text);font-size:.9rem">${esc(item.pinyin)}</div>`;
      }
      if (item.exercise === "relation") {
        const rel = state.detail?.relations?.find((r) => r.type !== "component") || state.detail?.relations?.[0];
        if (!rel) return `<div class="memory__answer-main">This word is still alone in your field.</div>`;
        return `
          <div class="memory__answer-main"><span class="cn" style="font-size:1.4em">${esc(rel.word.hanzi)}</span> <span style="color:var(--ink-50)">${esc(rel.word.pinyin)}</span></div>
          <p class="lede" style="text-align:center;font-size:.9rem">${esc(rel.word.meaning)}</p>
          <p class="mono" style="color:var(--vermilion-text);max-width:42ch;text-align:center">${esc(rel.note)}</p>
          <span class="tag">${esc(rel.type.toUpperCase())} LINK</span>`;
      }
      if (item.exercise === "sentence") {
        return `
          <div class="memory__answer-main cn" style="font-family:var(--font-cn);font-size:clamp(1.5rem,3vw,2.1rem)">${esc(item.example)}</div>
          <div class="mono" style="color:var(--vermilion-text)">${esc(item.pinyin)} · ${esc(item.hanzi)}</div>`;
      }
      if (item.exercise === "pinyin") {
        return `
          <div class="memory__answer-main"><span class="cn" style="font-size:2em;font-weight:900">${esc(item.hanzi)}</span></div>
          <p class="mono" style="color:var(--vermilion-text)">${esc(item.pinyin)}</p>`;
      }
      return `
        <div class="memory__answer-main">${esc(item.meaning)}</div>
        <div class="mono" style="color:var(--vermilion-text)">${esc(item.pinyin)}</div>`;
    };

    const ratingsHTML = (item) => {
      const next = item.progress?.state === "new" ? "first sight" : item.progress?.state || "review";
      return `
        <button class="rating rating--again" data-grade="0"><b>1 · Again</b><span>no recall · ${esc(next)}</span></button>
        <button class="rating" data-grade="1"><b>2 · Shaky</b><span>slow, partial</span></button>
        <button class="rating" data-grade="2"><b>3 · Solid</b><span>recalled</span></button>
        <button class="rating rating--easy" data-grade="3"><b>4 · Fluent</b><span>immediate</span></button>`;
    };

    const renderCard = async () => {
      const item = queue[state.index];
      if (!item) return finish();
      renderSegments();
      state.revealed = false;
      state.detail = null;

      stage.innerHTML = `
        <div class="memory__card">
          <span class="memory__prompt">${esc(EXERCISES[item.exercise]?.prompt || "Recall")}</span>
          ${targetHTML(item)}
          <div class="memory__sub">${item.exercise === "hanzi" ? "Say it in English before you reveal." : item.exercise === "audio" ? "Tap the speaker. Listen once, then again." : item.exercise === "pinyin" ? "Listen for the pitch, not the letters." : item.exercise === "relation" ? "What thread leads out of this word?" : "Hold the answer before you look."}</div>
          <div class="memory__answer" id="memAnswer">
            <div class="row row--between" style="width:100%">
              <span class="eyebrow">Answer</span>
              <span class="row" style="gap:.3rem">
                ${speakerButton({ label: `Play ${item.hanzi}` })}
                <button class="iconbtn" type="button" data-save aria-label="Save this word">${icons.save}</button>
              </span>
            </div>
            ${answerHTML(item)}
            ${item.example ? `
              <div class="memory__answer-example">
                <span class="cn">${esc(item.example)}</span>
                <span class="mono">${esc(item.examplePinyin)}</span>
                <p>${esc(item.exampleEn)}</p>
              </div>` : ""}
          </div>
        </div>`;

      controls.innerHTML = `
        <div class="memory__revealbar">
          <button class="btn btn--ghost" type="button" data-reveal>Reveal ${icons.arrow}</button>
        </div>
        <div class="memory__ratings" id="memRatings" hidden>${ratingsHTML(item)}</div>
        <div class="memory__hint">
          <span><kbd>Space</kbd> reveal</span>
          <span><kbd>1</kbd>–<kbd>4</kbd> rate</span>
          <span><kbd>P</kbd> play</span>
        </div>`;

      if (item.exercise === "relation") {
        try {
          state.detail = await get(`/api/words/${item.id}`);
          if (state.revealed) updateAnswer(item);
        } catch (_e) { /* the fallback answer already says the word stands alone */ }
      }

      if (item.exercise === "audio") {
        setTimeout(() => {
          const player = stage.querySelector("[data-play]");
          if (player) {
            player.classList.add("is-playing");
            playCue(item);
            setTimeout(() => player.classList.remove("is-playing"), 1400);
          }
        }, 260);
      }
    };

    const updateAnswer = (item) => {
      const answer = stage.querySelector("#memAnswer");
      if (!answer) return;
      const content = answer.querySelectorAll(".memory__answer-main, .mono, .lede, .tag, .memory__answer-example");
      const wrapper = document.createElement("div");
      wrapper.innerHTML = answerHTML(item);
      if (item.exercise === "relation") {
        content.forEach((node, i) => {
          if (wrapper.children[i]) node.replaceWith(wrapper.children[i].cloneNode(true));
          else node.remove();
        });
      }
    };

    const reveal = () => {
      if (state.revealed) return;
      state.revealed = true;
      stage.querySelector("#memAnswer")?.classList.add("is-on");
      const ratings = controls.querySelector("#memRatings");
      if (ratings) ratings.hidden = false;
      controls.querySelector("[data-reveal]")?.setAttribute("hidden", "");
      const item = queue[state.index];
      if (item && item.exercise === "relation" && !state.detail) {
        get(`/api/words/${item.id}`).then((detail) => {
          state.detail = detail;
          const answer = stage.querySelector("#memAnswer");
          if (answer && state.revealed) {
            const holder = document.createElement("div");
            holder.innerHTML = answerHTML(item);
            [...answer.querySelectorAll(".memory__answer-main, .mono, .lede, .tag")].forEach((n) => n.remove());
            [...holder.children].forEach((n) => answer.append(n));
          }
        }).catch(() => {});
      }
    };

    const rate = async (grade) => {
      if (!state.revealed || state.busy) return;
      state.busy = true;
      const item = queue[state.index];
      try {
        await post("/api/review/grade", { wordId: item.id, grade });
        state.results.push(grade);
        state.words.push(item.hanzi);
        setDue(Math.max(0, (boot()?.metrics?.due || 1) - 1));
      } catch (error) {
        toast(error.message);
      }
      state.index += 1;
      state.busy = false;
      if (state.index >= queue.length) finish();
      else renderCard();
    };

    const finish = async () => {
      stopSpeech();
      const good = state.results.filter((g) => g >= 2).length;
      const total = state.results.length;
      const duration = Math.round((Date.now() - state.startedAt) / 1000);
      try {
        await post("/api/session", {
          mode: "memory", score: good, correct: good, total,
          meta: { duration }, startedAt: new Date(state.startedAt).toISOString(),
        });
      } catch (_e) { /* the review itself is already saved */ }

      stage.innerHTML = `
        <div class="memory__summary">
          <span class="eyebrow eyebrow--accent">Session closed</span>
          <h2>What you recalled<br><em>stays.</em></h2>
          <div class="memory__summary-grid">
            <div><b>${total}</b><span>words reviewed</span></div>
            <div><b>${good}</b><span>recalled</span></div>
            <div><b>${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}</b><span>minutes</span></div>
          </div>
          <div class="memory__summary-words">${state.words.map((w) => `<span>${esc(w)}</span>`).join("")}</div>
          <p class="lede" style="text-align:center">${good === total ? "Every thread held. Return tomorrow, not sooner." : "Some threads loosened. They will return before they break."}</p>
          <div class="row" style="gap:.6rem;flex-wrap:wrap;justify-content:center">
            <a class="btn" href="#/cosmos">Follow a new thread ${icons.arrow}</a>
            <a class="btn btn--ghost" href="#/archive">See the archive</a>
          </div>
        </div>`;
      controls.innerHTML = "";
      segments.innerHTML = queue.map(() => `<span class="memory__segment is-done"></span>`).join("");
      count.textContent = `${total} reviewed`;
    };

    const onKey = (event) => {
      if (event.target.matches("input, textarea")) return;
      if (event.code === "Space") {
        event.preventDefault();
        reveal();
      } else if (event.key >= "1" && event.key <= "4") {
        rate(Number(event.key) - 1);
      } else if (event.key.toLowerCase() === "p") {
        const item = queue[state.index];
        if (item && state.index < queue.length) playCue(item);
      }
    };
    document.addEventListener("keydown", onKey);

    stage.addEventListener("click", (event) => {
      const player = event.target.closest("[data-play], .speaker");
      if (player) {
        player.classList.add("is-playing");
        playCue(queue[state.index]);
        setTimeout(() => player.classList.remove("is-playing"), 1400);
        return;
      }
      const save = event.target.closest("[data-save]");
      if (save) {
        post(`/api/words/${queue[state.index].id}/save`).then((res) => {
          toast(res.saved ? "Saved to archive" : "Removed from archive");
        }).catch((error) => toast(error.message));
      }
    });

    controls.addEventListener("click", (event) => {
      if (event.target.closest("[data-reveal]")) reveal();
      const gradeButton = event.target.closest("[data-grade]");
      if (gradeButton) rate(Number(gradeButton.dataset.grade));
    });
    controls.addEventListener("click", (event) => {
      const player = event.target.closest(".speaker");
      if (player) playCue(queue[state.index]);
    });

    await renderCard();

    return () => {
      document.removeEventListener("keydown", onKey);
      stopSpeech();
    };
  },
};
