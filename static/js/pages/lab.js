// Lowkey Mandarin — Hanzi Lab
// Character anatomy, stroke order (Hanzi Writer when online) and tracing.

import { get, post } from "../core/api.js";
import { esc, icons, toast } from "../core/ui.js";

const WRITER_CDN = "https://cdn.jsdelivr.net/npm/hanzi-writer@3.5.0/dist/hanzi-writer.min.js";
let writerLoader = null;

function loadHanziWriter() {
  if (window.HanziWriter) return Promise.resolve(window.HanziWriter);
  if (writerLoader) return writerLoader;
  writerLoader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = WRITER_CDN;
    script.async = true;
    const timer = setTimeout(() => reject(new Error("offline")), 4500);
    script.onload = () => {
      clearTimeout(timer);
      if (window.HanziWriter) resolve(window.HanziWriter);
      else reject(new Error("missing"));
    };
    script.onerror = () => {
      clearTimeout(timer);
      reject(new Error("offline"));
    };
    document.head.append(script);
  }).catch((error) => {
    writerLoader = null;
    throw error;
  });
  return writerLoader;
}

export default {
  route: "lab",
  index: "05",
  name: "Hanzi Lab",
  async render(view) {
    const { chars } = await get("/api/lab");
    view.innerHTML = `
      <section class="page">
        <header class="page-head">
          <div>
            <span class="eyebrow eyebrow--accent">Hanzi Lab / 汉字实验室</span>
            <h1 class="page-head__title" style="margin-top:.7rem">Take the<br>character <em>apart.</em></h1>
          </div>
          <div class="page-head__aside">
            <p>Every character is a small machine: a radical, a sound, a picture of something older. Open one and see how it is built.</p>
            <div class="page-head__stats">
              <div class="page-head__stat"><b>${String(chars.length).padStart(2, "0")}</b><span>characters open</span></div>
              <div class="page-head__stat"><b>${chars.reduce((n, c) => n + c.strokes, 0)}</b><span>strokes in the lab</span></div>
            </div>
          </div>
        </header>

        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1px;background:var(--line);border:1px solid var(--line);margin-top:1.5rem">
          ${chars.map((c) => `
            <a href="#/lab/${encodeURIComponent(c.char)}" class="panel" style="border:0;display:flex;flex-direction:column;gap:1rem;min-height:220px;justify-content:space-between;padding:1rem">
              <span class="row row--between">
                <span class="mono" style="color:var(--grey)">${c.strokes} STROKES</span>
                <span class="mono" style="color:var(--vermilion-text)">${esc(c.radical)}</span>
              </span>
              <span style="font-family:var(--font-cn);font-weight:900;font-size:5.5rem;line-height:.9">${esc(c.char)}</span>
              <span class="stack" style="gap:.1rem">
                <span class="mono" style="color:var(--vermilion-text)">${esc(c.pinyin)}</span>
                <span style="font-size:.8125rem;color:var(--ink-70)">${esc(c.meaning)}</span>
              </span>
            </a>`).join("")}
        </div>
        <p class="eyebrow" style="margin-top:2rem;color:var(--grey)">Stroke order data loads from Hanzi Writer when online · tracing always works offline</p>
      </section>`;
  },
};

export const charPage = {
  route: "lab",
  index: "05",
  name: "Hanzi Lab",
  async render(view, params) {
    view.innerHTML = `<section class="page"><div class="loading">Opening the character</div></section>`;
    const char = params.char;
    let data;
    let chars = [];
    try {
      [data, { chars }] = await Promise.all([get(`/api/lab/${encodeURIComponent(char)}`), get("/api/lab")]);
    } catch (error) {
      view.innerHTML = `
        <section class="page">
          <p class="eyebrow eyebrow--accent">Character not found</p>
          <h1 class="page-head__title" style="margin:.6rem 0 1rem">Not in the lab yet.</h1>
          <p class="lede">${esc(error.message)}</p>
          <p style="margin-top:1.5rem"><a class="btn" href="#/lab">Back to the lab ${icons.arrow}</a></p>
        </section>`;
      return;
    }

    view.innerHTML = `
      <section class="page">
        <div class="row row--between" style="padding:1rem 0 .5rem;flex-wrap:wrap;gap:1rem">
          <a class="btn btn--quiet" href="#/lab">← All characters</a>
          <span class="eyebrow">CHARACTER ${String(chars.findIndex((c) => c.char === char) + 1).padStart(2, "0")} / ${String(chars.length).padStart(2, "0")}</span>
        </div>

        <div class="lab__layout">
          <div class="lab__stage">
            <div class="lab__glyphbox" id="labBox">
              <span class="lab__ghost" aria-hidden="true">${esc(data.char)}</span>
              <div class="lab__writer" id="labWriter" aria-label="Stroke order animation for ${esc(data.char)}"></div>
              <span class="lab__fallback" id="labFallback" aria-hidden="true">${esc(data.char)}</span>
              <canvas class="lab__practice" id="labPractice" aria-label="Trace the character with a pointer"></canvas>
            </div>
            <div class="lab__controls">
              <button class="btn btn--sm" type="button" data-mode="stroke">Stroke order</button>
              <button class="btn btn--sm btn--ghost" type="button" data-mode="trace">Trace</button>
              <button class="iconbtn" type="button" data-replay aria-label="Replay strokes">↻</button>
              <span class="lab__status" id="labStatus">Loading stroke data…</span>
            </div>
          </div>

          <div class="lab__info">
            <div class="lab__identity">
              <span class="lab__big">${esc(data.char)}</span>
              <span class="lab__identity-meta">
                <span class="lab__pinyin">${esc(data.pinyin)}</span>
                <span class="lab__meaning">${esc(data.meaning)}</span>
              </span>
            </div>

            <div class="lab__specs">
              <div class="lab__spec"><b>${esc(data.radical)}</b><span>radical</span></div>
              <div class="lab__spec"><b>${data.strokes}</b><span>strokes</span></div>
              <div class="lab__spec"><b style="font-size:1rem;font-family:var(--font-mono);letter-spacing:.04em">${esc(data.structure.replace("-", " "))}</b><span>structure</span></div>
              <div class="lab__spec"><b style="font-family:var(--font-cn);font-size:1.2rem">${esc(data.components.join(" + "))}</b><span>components</span></div>
            </div>

            <p class="lab__origin"><strong>Origin.</strong> ${esc(data.origin)}</p>
            <p class="lab__hint">${esc(data.hint)}</p>

            <div>
              <div class="row row--between" style="margin-bottom:.5rem">
                <span class="eyebrow">Words that carry this character</span>
                <span class="mono" style="color:var(--grey)">${data.words.length}</span>
              </div>
              <div class="lab__words">
                ${data.words.length ? data.words.map((w) => `
                  <a class="lab__word" href="#/cosmos?word=${w.id}">
                    <span class="lab__word-hanzi">${esc(w.hanzi)}</span>
                    <span class="lab__word-body">
                      <span class="lab__word-mean">${esc(w.meaning)}</span>
                      <span class="lab__word-py">${esc(w.pinyin)}</span>
                    </span>
                    <span class="lab__word-go">COSMOS →</span>
                  </a>`).join("") : `<p class="small" style="padding:.75rem 0">This character is not part of a stored word yet.</p>`}
              </div>
            </div>

            <div class="lab__picker" aria-label="Other characters">
              ${chars.map((c) => `<a href="#/lab/${encodeURIComponent(c.char)}" aria-label="${esc(c.pinyin)}, ${esc(c.meaning)}" style="display:grid;place-items:center;width:48px;height:48px;border:1px solid ${c.char === char ? "var(--ink)" : "var(--line)"};background:${c.char === char ? "var(--ink)" : "transparent"};color:${c.char === char ? "var(--ivory)" : "var(--ink-70)"};font-family:var(--font-cn);font-size:1.3rem">${esc(c.char)}</a>`).join("")}
            </div>
          </div>
        </div>
      </section>`;

    const box = view.querySelector("#labBox");
    const writerEl = view.querySelector("#labWriter");
    const fallback = view.querySelector("#labFallback");
    const canvas = view.querySelector("#labPractice");
    const status = view.querySelector("#labStatus");
    const ctx = canvas.getContext("2d");

    let writer = null;
    let mode = "stroke";
    let drawing = false;
    let strokesDrawn = 0;
    let practiceLogged = false;
    let quizActive = false;

    const setStatus = (text) => { status.textContent = text; };

    const sizeCanvas = () => {
      const rect = box.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineWidth = Math.max(4, rect.width * 0.018);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#ed6048";
    };

    const clearTrace = () => {
      const rect = box.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      strokesDrawn = 0;
      practiceLogged = false;
    };

    const logPractice = async () => {
      if (practiceLogged) return;
      practiceLogged = true;
      try {
        await post("/api/session", {
          mode: "lab", score: 1, correct: 1, total: 1,
          meta: { char: data.char, mode },
        });
        toast(`Writing practice logged for ${data.char}`);
      } catch (error) {
        toast(error.message);
      }
    };

    const setMode = (next) => {
      mode = next;
      if (mode === "trace") {
        if (writer) {
          canvas.style.display = "none";
          writerEl.style.display = "block";
          fallback.style.display = "none";
          setStatus("Trace in the grid · start each stroke at the highlighted point");
          startQuiz();
        } else {
          canvas.style.display = "block";
          writerEl.style.display = "none";
          fallback.style.display = "block";
          setStatus("Trace the ghost character with your pointer");
        }
      } else {
        canvas.style.display = "none";
        fallback.style.display = writer ? "none" : "block";
        writerEl.style.display = writer ? "block" : "none";
        cancelQuiz();
        setStatus(writer ? `${data.strokes} strokes · radical ${data.radical}` : "Stroke data offline · trace instead");
        writer?.animateCharacter();
      }
      clearTrace();
      view.querySelectorAll("[data-mode]").forEach((button) => {
        button.classList.toggle("btn--ghost", button.dataset.mode !== mode);
        button.classList.toggle("btn--sm", true);
      });
    };

    const startQuiz = () => {
      if (!writer) return;
      quizActive = true;
      let correct = 0;
      writer.cancelQuiz?.();
      clearTrace();
      writer.quiz({
        showHintAfterMisses: 2,
        highlightOnComplete: true,
        onCorrectStroke: (_stroke, remaining) => {
          correct += 1;
          setStatus(`Stroke ${correct} accepted · ${remaining} remaining`);
        },
        onMistake: (stroke) => {
          setStatus(`Not quite — try the stroke from ${stroke ? "the highlighted start" : "the start"}`);
        },
        onComplete: (summary) => {
          quizActive = false;
          setStatus(`Practice complete · ${summary.totalMistakes === 0 ? "no mistakes" : `${summary.totalMistakes} corrections`}`);
          logPractice();
        },
      });
    };

    const cancelQuiz = () => {
      if (writer && quizActive) {
        try { writer.cancelQuiz(); } catch (_e) { /* writer may be idle */ }
      }
      quizActive = false;
    };

    // Fallback tracing (also available over the writer when in trace mode without quiz)
    const pointerPos = (event) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    canvas.addEventListener("pointerdown", (event) => {
      if (mode !== "trace" || writer) return;
      drawing = true;
      canvas.setPointerCapture(event.pointerId);
      const p = pointerPos(event);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!drawing) return;
      const p = pointerPos(event);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    });
    const endTrace = () => {
      if (!drawing) return;
      drawing = false;
      strokesDrawn += 1;
      setStatus(strokesDrawn ? `${strokesDrawn} stroke${strokesDrawn > 1 ? "s" : ""} traced · ${data.strokes} in the real character` : "Trace the ghost character");
      if (strokesDrawn >= data.strokes) logPractice();
    };
    canvas.addEventListener("pointerup", endTrace);
    canvas.addEventListener("pointercancel", endTrace);

    view.querySelectorAll("[data-mode]").forEach((button) => {
      button.addEventListener("click", () => setMode(button.dataset.mode));
    });
    view.querySelector("[data-replay]").addEventListener("click", () => {
      if (mode === "trace" && writer) startQuiz();
      else writer?.animateCharacter();
    });

    sizeCanvas();
    window.addEventListener("resize", () => { sizeCanvas(); });

    loadHanziWriter().then((HanziWriter) => {
      writer = HanziWriter.create(writerEl, data.char, {
        width: writerEl.clientWidth || 320,
        height: writerEl.clientHeight || 320,
        padding: 10,
        strokeColor: "#151515",
        radicalColor: "#ed6048",
        highlightColor: "#dceb72",
        outlineColor: "rgba(21,21,21,0.12)",
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 260,
        showCharacter: false,
        showOutline: true,
      });
      fallback.style.display = "none";
      setMode("stroke");
      setTimeout(() => {
        if (!writerEl.querySelector("svg")) {
          writer = null;
          setMode("stroke");
        }
      }, 3500);
    }).catch(() => {
      writer = null;
      fallback.style.display = "block";
      writerEl.style.display = "none";
      setMode("trace");
      setStatus("Stroke data offline · trace the ghost character");
    });

    return () => {
      cancelQuiz();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  },
};
