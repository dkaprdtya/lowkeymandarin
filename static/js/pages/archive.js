// Lowkey Mandarin — Your Archive
// The long view: what has been discovered, retained, and revisited.

import { get } from "../core/api.js";
import { esc, icons, formatDate, categoryLabel } from "../core/ui.js";
import { requireAccount } from "../core/gate.js";

const KIND_LABEL = {
  concept: "CONCEPT",
  dialogue: "SCENE",
  challenge: "GAME",
  session: "SESSION",
};

const MODE_LABEL = {
  memory: "Memory Studio",
  living: "Living Mandarin",
  sound: "Sound Archive",
  lab: "Hanzi Lab",
};

function sparkline(activity) {
  const width = 720;
  const height = 132;
  const max = Math.max(1, ...activity.map((d) => d.count));
  const gap = 3;
  const bar = (width - gap * (activity.length - 1)) / activity.length;
  const bars = activity.map((day, i) => {
    const h = day.count === 0 ? 2 : Math.max(4, (day.count / max) * (height - 22));
    const x = i * (bar + gap);
    const y = height - 12 - h;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bar.toFixed(1)}" height="${h.toFixed(1)}"
      fill="${day.count ? "var(--ink)" : "var(--line)"}" />
      <title>${day.day}: ${day.count} review${day.count === 1 ? "" : "s"}</title>`;
  }).join("");
  return `
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="Review activity for the last 28 days">
      ${bars}
      <line x1="0" y1="${height - 11.5}" x2="${width}" y2="${height - 11.5}" stroke="var(--line-strong)" stroke-width="1"/>
    </svg>
    <div class="spark__labels">
      <span>${activity[0]?.day.slice(5) || ""}</span>
      <span>28 DAYS OF REVIEW</span>
      <span>${activity[activity.length - 1]?.day.slice(5) || ""}</span>
    </div>`;
}

export default {
  route: "archive",
  index: "08",
  name: "Your Archive",
  async render(view) {
    if (!(await requireAccount(view, "Your Archive reads the progress saved to your account."))) return;
    const data = await get("/api/archive");
    const m = data.metrics;
    const categories = Object.entries(data.categories)
      .sort((a, b) => b[1].discovered - a[1].discovered || b[1].total - a[1].total);
    const sessions = data.sessions || [];
    const timeline = data.timeline || [];
    const saved = data.saved || [];

    const reviewed = sessions.reduce((n, s) => n + s.count, 0);
    const answered = sessions.reduce((n, s) => n + s.total, 0);
    const correct = sessions.reduce((n, s) => n + s.correct, 0);
    const accuracy = answered ? Math.round((correct / answered) * 100) : 0;

    view.innerHTML = `
      <section class="page">
        <header class="page-head">
          <div>
            <span class="eyebrow eyebrow--accent">Your Archive / 学习档案</span>
            <h1 class="page-head__title" style="margin-top:.7rem">A record of<br>what <em>stayed.</em></h1>
          </div>
          <div class="page-head__aside">
            <p>Not a score. A map of attention: which words you opened, which ones held, which ones loosened and came back. The archive is written by your sessions.</p>
            <div class="page-head__stats">
              <div class="page-head__stat"><b>${String(m.discovered).padStart(2, "0")}</b><span>words opened</span></div>
              <div class="page-head__stat"><b>${String(m.retained).padStart(2, "0")}</b><span>retained</span></div>
              <div class="page-head__stat"><b>${String(m.due).padStart(2, "0")}</b><span>due now</span></div>
            </div>
          </div>
        </header>

        <div class="archive__metrics" aria-label="Archive totals">
          <div class="archive__metric">
            <b>${String(m.words).padStart(2, "0")}</b>
            <span>vocabulary in the field</span>
            <small>${m.discovered} opened · ${m.words - m.discovered} still unseen</small>
          </div>
          <div class="archive__metric">
            <b>${m.retention}%</b>
            <span>retention</span>
            <small>${m.retained} words reviewed at least twice</small>
          </div>
          <div class="archive__metric">
            <b>${String(reviewed).padStart(2, "0")}</b>
            <span>sessions recorded</span>
            <small>${accuracy}% mean accuracy across answered prompts</small>
          </div>
          <div class="archive__metric">
            <b>${String(saved.length).padStart(2, "0")}</b>
            <span>saved words</span>
            <small>kept deliberately, outside the schedule</small>
          </div>
        </div>

        <div class="archive__layout">
          <div class="stack stack--6">
            <section aria-labelledby="coverage-title">
              <div class="archive__panelhead">
                <h2 id="coverage-title">Coverage by cluster</h2>
                <span class="mono" style="color:var(--grey)">${categories.length} CLUSTERS</span>
              </div>
              <div class="coverage">
                ${categories.map(([cat, c]) => {
                  const pct = Math.round((c.discovered / Math.max(1, c.total)) * 100);
                  return `
                    <div class="coverage__row">
                      <span class="coverage__label">${esc(categoryLabel(cat))}</span>
                      <div class="meter" style="height:8px" role="img" aria-label="${esc(cat)}: ${c.discovered} of ${c.total} words opened">
                        <div class="meter__fill ${pct === 100 ? "meter__fill--accent" : ""}" style="width:${pct}%"></div>
                      </div>
                      <span class="coverage__num">${String(c.discovered).padStart(2, "0")}/${String(c.total).padStart(2, "0")}</span>
                    </div>`;
                }).join("")}
              </div>
            </section>

            <section aria-labelledby="activity-title">
              <div class="archive__panelhead">
                <h2 id="activity-title">Review rhythm</h2>
                <span class="mono" style="color:var(--grey)">LAST 28 DAYS</span>
              </div>
              <div class="spark">${sparkline(data.activity)}</div>
            </section>

            <section aria-labelledby="timeline-title">
              <div class="archive__panelhead">
                <h2 id="timeline-title">Traces</h2>
                <span class="mono" style="color:var(--grey)">${timeline.length} RECORDS</span>
              </div>
              <div class="timeline-list">
                ${timeline.length ? timeline.map((item) => `
                  <div class="timeline-list__item">
                    <span class="timeline-list__date">${formatDate(item.created_at)}</span>
                    <span class="timeline-list__kind">${esc(KIND_LABEL[item.kind] || item.kind.toUpperCase())}</span>
                    <span class="timeline-list__title">
                      ${esc(item.title)}
                      ${item.detail ? `<span class="timeline-list__detail">${esc(item.detail)}</span>` : ""}
                    </span>
                    <span class="mono" style="color:var(--grey)">${esc(String(item.ref).slice(0, 8))}</span>
                  </div>`).join("") : `
                  <div class="empty" style="margin-top:1rem">
                    <div class="empty__glyph">档</div>
                    <p>The archive starts with the first word you open.</p>
                    <p style="margin-top:.8rem"><a class="btn btn--sm" href="#/cosmos">Open the cosmos ${icons.arrow}</a></p>
                  </div>`}
              </div>
            </section>
          </div>

          <aside class="stack stack--6">
            <section aria-labelledby="saved-title">
              <div class="archive__panelhead">
                <h2 id="saved-title">Kept words</h2>
                <span class="mono" style="color:var(--grey)">${String(saved.length).padStart(2, "0")}</span>
              </div>
              ${saved.length ? `
                <div class="savedwords">
                  ${saved.map((w) => `
                    <a class="savedword" href="#/cosmos?word=${w.id}" title="${esc(w.meaning)}">
                      <span class="cn">${esc(w.hanzi)}</span>
                      <span class="mono">${esc(w.pinyin)}</span>
                    </a>`).join("")}
                </div>` : `
                <p class="small" style="border-top:1px solid var(--line);padding-top:.8rem">
                  Nothing saved yet. Use the save control inside the cosmos inspector to keep a word here.
                </p>`}
            </section>

            <section aria-labelledby="sessions-title">
              <div class="archive__panelhead">
                <h2 id="sessions-title">Session log</h2>
                <span class="mono" style="color:var(--grey)">${reviewed} TOTAL</span>
              </div>
              ${sessions.length ? `
                <div class="sessions">
                  ${sessions.map((s) => `
                    <div class="sessions__row">
                      <span class="mono" style="color:var(--vermilion-text)">${esc(MODE_LABEL[s.mode] || s.mode.toUpperCase())}</span>
                      <span>${s.count} session${s.count === 1 ? "" : "s"}</span>
                      <span class="mono">${s.total ? Math.round((s.correct / s.total) * 100) : 0}%</span>
                      <span class="mono">${formatDate(s.last)}</span>
                    </div>`).join("")}
                </div>` : `
                <p class="small" style="border-top:1px solid var(--line);padding-top:.8rem">
                  No session yet. Memory Studio, a Living scene, or a listening check will appear here.
                </p>`}
            </section>

            <section class="panel panel--flush" style="padding:1.1rem;border:1px solid var(--line)">
              <span class="eyebrow">Read the numbers honestly</span>
              <p style="font-size:.8125rem;color:var(--ink-70);margin-top:.5rem;line-height:1.5">
                Retention counts words you reviewed at least twice — not words you saw once. A word that lapses is
                still part of the archive; the lapse is information, not a loss.
              </p>
              <div class="row" style="gap:.5rem;margin-top:.9rem;flex-wrap:wrap">
                <a class="btn btn--sm" href="#/memory">Review what is due ${icons.arrow}</a>
                <a class="btn btn--sm btn--ghost" href="#/cosmos">Explore</a>
              </div>
            </section>
          </aside>
        </div>
      </section>`;
  },
};
