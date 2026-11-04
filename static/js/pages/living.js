// Lowkey Mandarin — Living Mandarin
// Scenario index + cinematic dialogue player with branching choices.

import { get, post } from "../core/api.js";
import { esc, icons, toast, speakerButton } from "../core/ui.js";
import { speak } from "../core/audio.js";

const ACCENTS = {
  vermilion: "linear-gradient(150deg,#ed6048,#8d2f22)",
  lime: "linear-gradient(150deg,#dceb72,#7d8c35)",
  graphite: "linear-gradient(150deg,#4a4a4a,#151515)",
};

export default {
  route: "living",
  index: "04",
  name: "Living Mandarin",
  async render(view) {
    const { scenarios } = await get("/api/scenarios");
    const completed = scenarios.filter((s) => s.completed).length;

    view.innerHTML = `
      <section class="page">
        <header class="page-head">
          <div>
            <span class="eyebrow eyebrow--accent">Living Mandarin / 生活汉语</span>
            <h1 class="page-head__title" style="margin-top:.7rem">Language happens<br>in <em>rooms.</em></h1>
          </div>
          <div class="page-head__aside">
            <p>Four situations, four small pressure systems. Order, greet, ask, navigate. The grammar arrives because you need it, not before.</p>
            <div class="page-head__stats">
              <div class="page-head__stat"><b>${String(scenarios.length).padStart(2, "0")}</b><span>scenes</span></div>
              <div class="page-head__stat"><b>${String(completed).padStart(2, "0")}</b><span>completed</span></div>
              <div class="page-head__stat"><b>${scenarios.reduce((n, s) => n + s.lineCount, 0)}</b><span>spoken lines</span></div>
            </div>
          </div>
        </header>

        <div class="scenes" style="margin-top:1.5rem">
          ${scenarios.map((scene, i) => `
            <a class="scene-row" href="#/living/${scene.slug}" data-reveal>
              <span class="scene-row__num">${String(i + 1).padStart(2, "0")}</span>
              <span class="scene-row__title">
                <span class="cn">${esc(scene.hanzi)}</span>
                <span class="en">${esc(scene.title)}</span>
              </span>
              <span class="scene-row__setting">${esc(scene.setting)}<br><span style="color:var(--grey)">${esc(scene.description)}</span></span>
              <span class="scene-row__meta">
                <span class="tag">${scene.level === 1 ? "HSK 1–2" : "HSK 2–3"}</span>
                ${scene.completed ? '<span class="tag tag--lime">VISITED</span>' : ""}
                <span class="scene-row__swatch" style="background:${ACCENTS[scene.accent] || ACCENTS.vermilion}" data-glyph="${esc(scene.hanzi.slice(-1))}" aria-hidden="true"></span>
                <span class="mono" style="color:var(--vermilion-text)">ENTER →</span>
              </span>
            </a>`).join("")}
        </div>

        <p class="eyebrow" style="margin-top:2rem;color:var(--grey)">Headphones recommended · every line is spoken by your browser's Chinese voice</p>
      </section>`;

    view.querySelectorAll("[data-reveal]").forEach((n) => n.classList.add("is-in"));
  },
};

export const scenePage = {
  route: "living",
  index: "04",
  name: "Living Mandarin",
  async render(view, params) {
    view.innerHTML = `<section class="page"><div class="loading">Entering the scene</div></section>`;
    let scene;
    try {
      scene = await get(`/api/scenarios/${params.slug}`);
    } catch (error) {
      view.innerHTML = `
        <section class="page">
          <p class="eyebrow eyebrow--accent">Scene not found</p>
          <h1 class="page-head__title" style="margin:.6rem 0 1rem">This room is locked.</h1>
          <p class="lede">${esc(error.message)}</p>
          <p style="margin-top:1.5rem"><a class="btn" href="#/living">Back to the scenes ${icons.arrow}</a></p>
        </section>`;
      return;
    }

    const state = {
      shown: 1,
      answered: {},
      correct: 0,
      choices: scene.choices.length,
      feedback: [],
      showPinyin: true,
      showEnglish: false,
      finished: false,
      saved: false,
      start: Date.now(),
    };

    view.innerHTML = `
      <section class="scene">
        <div class="scene__art" data-glyph="${esc(scene.hanzi.slice(-1))}">
          <span class="scene__line scene__line--1"></span>
          <span class="scene__line scene__line--2"></span>
        </div>

        <div class="scene__top">
          <div class="row" style="gap:1.5rem;align-items:flex-start">
            <a class="scene__back" href="#/living">← All scenes</a>
            <div class="scene__heading">
              <span class="cn">${esc(scene.hanzi)}</span>
              <span class="en">${esc(scene.title)}</span>
            </div>
          </div>
          <div class="scene__tools">
            <button class="chip chip--light is-active" type="button" data-toggle="pinyin" aria-pressed="true">Pinyin</button>
            <button class="chip chip--light" type="button" data-toggle="english" aria-pressed="false">Translation</button>
            <button class="chip chip--light" type="button" data-replay aria-label="Replay the last line">${icons.speaker}</button>
          </div>
        </div>

        <div class="scene__body">
          <div class="scene__transcript" id="sceneTranscript" aria-live="polite"></div>
          <aside class="scene__side">
            <div class="scene__progress">
              <span class="mono">SCENE PROGRESS</span>
              <div class="meter meter--dark"><div class="meter__fill meter__fill--lime" id="sceneMeter" style="width:0%"></div></div>
            </div>
            <div>
              <h3>Useful phrases</h3>
              <div style="margin-top:.5rem">
                ${scene.phrases.map((p) => `
                  <div class="scene__phrase">
                    <span class="cn">${esc(p.hanzi)}</span>
                    <span class="mono">${esc(p.pinyin)}</span>
                    <span class="en">${esc(p.en)}</span>
                  </div>`).join("")}
              </div>
            </div>
            <div class="scene__phrase" style="border-top-color:var(--ivory-20)">
              <span class="mono" style="color:var(--ivory-55)">SETTING</span>
              <span class="en" style="line-height:1.5">${esc(scene.setting)}</span>
            </div>
          </aside>
        </div>

        <div id="sceneFinish"></div>
      </section>`;

    const transcript = view.querySelector("#sceneTranscript");
    const meter = view.querySelector("#sceneMeter");
    const finishBox = view.querySelector("#sceneFinish");

    const feedbackFor = (index) => state.feedback.filter((f) => f.index === index);

    const render = () => {
      const lines = scene.dialogue.slice(0, state.shown);
      const activeChoice = scene.choices.find((c) => c.after === state.shown - 1 && !(state.shown - 1 in state.answered));

      transcript.innerHTML = `
        ${lines.map((line, i) => `
          <div class="scene__lineitem ${line.who === "You" ? "scene__lineitem--you" : ""}">
            <span class="scene__who">${esc(line.who)}</span>
            <div class="scene__speech">
              <span class="scene__hanzi" style="font-family:var(--font-cn)">${esc(line.hanzi)}</span>
              <span class="scene__pinyin" ${state.showPinyin ? "" : "hidden"}>${esc(line.pinyin)}</span>
              <span class="scene__en ${state.showEnglish ? "" : "is-hidden"}">${esc(line.en)}</span>
              ${line.cue ? `<span class="scene__cue"><span>${esc(line.cue)}</span></span>` : ""}
            </div>
            ${speakerButton({ class: "speaker--dark", data: `data-speak="${i}"`, label: `Play line ${i + 1}` })}
          </div>`).join("")}
        ${feedbackFor(state.shown - 1).map((entry) => `
          <div class="scene__feedback">
            <b class="${entry.correct ? "is-good" : ""}">${entry.correct ? "That fits the situation" : "Not quite — here is what they say"}</b>
            <span class="cn">${esc(entry.hanzi)}</span>
            ${entry.en ? `<span class="en">${esc(entry.en)}</span>` : ""}
          </div>`).join("")}
        ${activeChoice ? `
          <div class="scene__choices">
            <h3>${esc(activeChoice.prompt)}</h3>
            ${activeChoice.options.map((option, oi) => `
              <button class="scene__choice" type="button" data-choice="${scene.choices.indexOf(activeChoice)}:${oi}">
                <span class="cn">${esc(option.hanzi)}</span>
                <span class="mono">${esc(option.pinyin)}</span>
                <span class="en">${esc(option.en)}</span>
              </button>`).join("")}
          </div>` : ""}
        ${!activeChoice && state.shown < scene.dialogue.length ? `
          <div class="scene__next">
            <button class="btn" type="button" data-next>Continue the scene ${icons.arrow}</button>
            <span class="scene__next-note">Line ${state.shown} of ${scene.dialogue.length}</span>
          </div>` : ""}
        ${state.shown === scene.dialogue.length && !activeChoice ? "" : ""}`;

      meter.style.width = `${Math.round((state.shown / scene.dialogue.length) * 100)}%`;
      view.querySelectorAll(".scene__choice").forEach((button) => {
        const [ci, oi] = button.dataset.choice.split(":").map(Number);
        if (state.answered[scene.choices[ci].after] != null) {
          const chosen = state.answered[scene.choices[ci].after];
          button.disabled = true;
          button.classList.toggle("is-correct", oi === scene.choices[ci].options.findIndex((o) => o.correct));
          button.classList.toggle("is-wrong", oi === chosen && !scene.choices[ci].options[oi].correct);
        }
      });

      if (state.shown === scene.dialogue.length && !activeChoice) showFinish();
    };

    const showFinish = () => {
      if (state.finished) return;
      state.finished = true;
      finishBox.innerHTML = `
        <div class="scene__finish">
          <span class="eyebrow eyebrow--accent">Scene complete</span>
          <span class="cn">${esc(scene.hanzi)}</span>
          <h2>You moved through it.</h2>
          <div class="row" style="gap:1.5rem;justify-content:center">
            <span class="mono" style="color:var(--ivory-70)">${state.correct}/${state.choices} choices</span>
            <span class="mono" style="color:var(--ivory-70)">${scene.phrases.length} phrases collected</span>
          </div>
          <div class="row" style="gap:.6rem;flex-wrap:wrap;justify-content:center">
            <button class="btn btn--lime" type="button" data-complete>Save the scene</button>
            <a class="btn btn--invert" href="#/living">Choose another room ${icons.arrow}</a>
          </div>
          <p class="mono" id="sceneSaved" style="color:var(--ivory-55);font-size:.5625rem;letter-spacing:.1em"></p>
        </div>`;
      meter.style.width = "100%";
      finishBox.querySelector("[data-complete]").addEventListener("click", async (event) => {
        if (state.saved) return;
        const button = event.currentTarget;
        button.disabled = true;
        try {
          await post(`/api/scenarios/${scene.slug}/complete`, {
            correct: state.correct,
            choices: state.choices,
            score: state.correct,
          });
          state.saved = true;
          button.textContent = "Saved to archive";
          const note = finishBox.querySelector("#sceneSaved");
          if (note) note.textContent = "THIS SCENE IS NOW PART OF YOUR ARCHIVE";
          toast("Scene saved to your archive");
        } catch (error) {
          toast(error.message);
          button.disabled = false;
        }
      });
    };

    const advance = () => {
      const activeChoice = scene.choices.find((c) => c.after === state.shown - 1 && !(state.shown - 1 in state.answered));
      if (activeChoice) return;
      if (state.shown < scene.dialogue.length) {
        state.shown += 1;
        render();
        transcript.lastElementChild?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    };

    const choose = (choiceIndex, optionIndex) => {
      const choice = scene.choices[choiceIndex];
      if (!choice || state.answered[choice.after] != null) return;
      const option = choice.options[optionIndex];
      state.answered[choice.after] = optionIndex;
      if (option.correct) state.correct += 1;
      const reply = option.reply || "";
      const separator = reply.indexOf(":") >= 0 ? ":" : "：";
      const [who, ...rest] = reply.split(separator);
      state.feedback.push({
        index: choice.after,
        correct: Boolean(option.correct),
        hanzi: rest.join(separator).trim() || option.hanzi,
        en: "",
      });
      speak(option.hanzi, { rate: 0.78 });
      render();
      transcript.querySelector(".scene__feedback")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    };

    transcript.addEventListener("click", (event) => {
      const next = event.target.closest("[data-next]");
      if (next) { advance(); return; }
      const choice = event.target.closest("[data-choice]");
      if (choice) {
        const [ci, oi] = choice.dataset.choice.split(":").map(Number);
        choose(ci, oi);
        return;
      }
      const speakBtn = event.target.closest("[data-speak]");
      if (speakBtn) {
        const line = scene.dialogue[Number(speakBtn.dataset.speak)];
        if (line) speak(line.hanzi, { rate: 0.76 });
        speakBtn.classList.add("is-playing");
        setTimeout(() => speakBtn.classList.remove("is-playing"), 1400);
      }
    });

    view.querySelectorAll("[data-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.dataset.toggle === "pinyin") {
          state.showPinyin = !state.showPinyin;
          button.classList.toggle("is-active", state.showPinyin);
          button.setAttribute("aria-pressed", String(state.showPinyin));
        } else {
          state.showEnglish = !state.showEnglish;
          button.classList.toggle("is-active", state.showEnglish);
          button.setAttribute("aria-pressed", String(state.showEnglish));
        }
        render();
      });
    });

    view.querySelector("[data-replay]").addEventListener("click", () => {
      const line = scene.dialogue[state.shown - 1];
      if (line) speak(line.hanzi, { rate: 0.76 });
    });

    const onKey = (event) => {
      if (event.target.matches("input, textarea")) return;
      if (event.key === "Enter" || event.code === "Space") {
        event.preventDefault();
        advance();
      }
    };
    document.addEventListener("keydown", onKey);

    render();

    return () => {
      document.removeEventListener("keydown", onKey);
      stopSpeechSafe();
      post("/api/session", {
        mode: "living",
        score: state.correct,
        correct: state.correct,
        total: state.choices,
        meta: { slug: scene.slug, duration: Math.round((Date.now() - state.start) / 1000) },
        startedAt: new Date(state.start).toISOString(),
      }).catch(() => {});
    };
  },
};

function stopSpeechSafe() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}
