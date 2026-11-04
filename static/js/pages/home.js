// Lowkey Mandarin — Origin (home)
// A short entry page: one promise, one primary action, three steps, four rooms.

import { loadBoot } from "../core/store.js";
import { esc, icons, revealOnScroll } from "../core/ui.js";

const ROOMS = [
  {
    route: "ladder",
    glyph: "阶",
    tag: "PATH",
    title: "The Ladder",
    text: "Climb HSK 1–5 rung by rung, with an HSK 6 preview, grammar notes at each level and a 60% discovery gate. Or switch to efficiency mode and review the whole archive.",
  },
  {
    route: "cosmos",
    glyph: "网",
    tag: "GRAPH",
    title: "Word Cosmos",
    text: "A navigable field of meaning. Follow a synonym, an opposite, a time word or a shared component from one word to the next.",
  },
  {
    route: "memory",
    glyph: "记",
    tag: "REVIEW",
    title: "Memory Studio",
    text: "One word, one screen, one decision. The queue is ordered by what is closest to fading, not by what is easiest.",
  },
  {
    route: "living",
    glyph: "境",
    tag: "SCENES",
    title: "Living Mandarin",
    text: "Order coffee, meet a friend, find a classroom. Short dialogues you move through, with pinyin and translation on demand.",
  },
];

const STEPS = [
  ["Pick a level", "Open the ladder. HSK 1 is the right default unless you already know the basics.", "ladder"],
  ["Meet the words", "Read a word, its example and its neighbours in the cosmos. Save what matters.", "cosmos"],
  ["Review what fades", "Memory Studio brings words back at the right moment. A few minutes is enough.", "memory"],
];

export default {
  route: "home",
  index: "00",
  name: "Origin",
  async render(view) {
    const data = await loadBoot(true);
    const m = data.metrics;
    const ladder = data.ladder || {};
    const rung = ladder.current;
    const efficiency = ladder.pace === "efficiency";

    const coverage = Math.round((m.concepts / Math.max(1, m.totalWords)) * 100);
    const progress = efficiency ? coverage : (rung?.progress || 0);
    const pathName = efficiency
      ? "Efficiency · whole archive"
      : rung ? `HSK ${rung.hsk} · ${rung.title}` : "HSK ladder";
    const primaryCta = efficiency
      ? "Continue in the ladder"
      : rung ? `${rung.discovered ? "Continue" : "Begin"} HSK ${rung.hsk}` : "Set your path";
    const dueText = m.due === 1 ? "1 word due now" : `${m.due} words due now`;
    const signedIn = Boolean(data.authenticated);
    const guestName = "Start with HSK 1";
    const totalWords = m.totalWords.toLocaleString("en-US");
    const totalEdges = (m.edges || 0).toLocaleString("en-US");

    let seen = true;
    try { seen = Boolean(localStorage.getItem("hanzi-flow:welcomed")); } catch (_error) { /* storage blocked */ }

    view.innerHTML = `
      <section class="home">
        ${seen ? "" : `
          <aside class="welcome" id="welcome" aria-label="New visitor note">
            <p><span class="welcome__mark" aria-hidden="true">新</span> First visit? <a href="#/help">The two-minute guide</a> explains the eight rooms and where to start.</p>
            <button type="button" class="welcome__close" id="welcomeClose" aria-label="Dismiss introduction">×</button>
          </aside>`}

        <header class="hero2">
          <div class="hero2__copy">
            <span class="eyebrow eyebrow--accent">Independent Mandarin archive · HSK 1–5 complete</span>
            <h1 class="hero2__title">Learning is by<br><em>discovery.</em></h1>
            <p class="lede hero2__lede">${signedIn
              ? `Welcome back. ${totalWords} words are open, and your place in the archive is saved.`
              : `Learn ${totalWords} words as a network of meanings, sounds and situations. All of it is open. No streaks, no coins, no locked doors.`}</p>
            <div class="hero2__actions">
              ${signedIn
                ? `<a class="btn" href="#/ladder">${esc(primaryCta)} ${icons.arrow}</a>
                   <a class="btn btn--ghost" href="#/memory">Open Memory Studio</a>`
                : `<a class="btn" href="#/ladder">${guestName} ${icons.arrow}</a>
                   <a class="btn btn--ghost" href="#/account">Create a free account</a>`}
            </div>
            <p class="hero2__note">${signedIn
              ? `Signed in as <strong>${esc(data.profile?.name || "you")}</strong>. Progress, review and archive are private to this account.`
              : `Reading needs no account. <a href="#/account">A free account</a> adds your progress, review queue and archive.`}</p>
            <dl class="hero2__facts">
              ${signedIn ? `
                <div><dt>Discovered</dt><dd>${m.concepts}</dd></div>
                <div><dt>Due now</dt><dd>${m.due}</dd></div>
                <div><dt>Retained</dt><dd>${m.retained}</dd></div>
                <div><dt>Connected</dt><dd>${m.connected}</dd></div>` : `
                <div><dt>Vocabulary</dt><dd>${totalWords}</dd></div>
                <div><dt>HSK levels</dt><dd>1–5</dd></div>
                <div><dt>Connections</dt><dd>${totalEdges}</dd></div>
                <div><dt>Price</dt><dd>Free</dd></div>`}
            </dl>
          </div>

          <div class="hero2__mark" aria-hidden="true">
            <span class="hero2__rings"></span>
            <span class="hero2__glyph">汉</span>
            <span class="hero2__word hero2__word--1"><b>时间</b> shíjiān · time</span>
            <span class="hero2__word hero2__word--2"><b>今天</b> jīntiān · today</span>
            <span class="hero2__word hero2__word--3"><b>朋友</b> péngyou · friend</span>
          </div>
        </header>

        <section class="discovery" aria-labelledby="discovery-title">
          <div class="discovery__copy">
            <span class="eyebrow eyebrow--accent" id="discovery-title">Learn by discovery</span>
            <h2>Follow the thread,<br>not the list.</h2>
            <p>A word is never alone. Open 今天 and you meet 明天, then 未来, then the grammar that holds time together. The graph is the lesson.</p>
            <a class="btn btn--ghost" href="#/cosmos">Open Word Cosmos ${icons.arrow}</a>
          </div>
          <div class="discovery__chain" aria-label="An example path through connected words">
            <a class="discovery__node" href="#/cosmos"><b>今天</b><span>jīntiān · today</span></a>
            <span class="discovery__link" aria-hidden="true">→</span>
            <a class="discovery__node" href="#/cosmos"><b>明天</b><span>míngtiān · tomorrow</span></a>
            <span class="discovery__link" aria-hidden="true">→</span>
            <a class="discovery__node" href="#/cosmos"><b>未来</b><span>wèilái · future</span></a>
            <span class="discovery__link" aria-hidden="true">→</span>
            <a class="discovery__node" href="#/cosmos"><b>时间</b><span>shíjiān · time</span></a>
          </div>
        </section>

        <section class="start" aria-labelledby="start-title">
          <div class="start__intro">
            <span class="eyebrow" id="start-title">Start here</span>
            <h2>Three steps.<br>No maze.</h2>
            <p>${signedIn
              ? "Everything shares one archive. Visit the rooms in any order; your progress follows you."
              : "Everything shares one archive. Browse it freely; a free account keeps your place."}</p>
          </div>
          <ol class="start__steps">
            ${STEPS.map(([title, text, route], i) => `
              <li class="start__step">
                <span class="start__num">${String(i + 1).padStart(2, "0")}</span>
                <h3>${esc(title)}</h3>
                <p>${esc(text)}</p>
                <a class="mono" href="#/${route}">Open →</a>
              </li>`).join("")}
          </ol>
        </section>

        ${signedIn ? `
        <section class="next" aria-labelledby="next-title">
          <div class="next__main">
            <span class="eyebrow eyebrow--accent" id="next-title">Your next step</span>
            <h2 class="next__title">${dueText}.</h2>
            <p class="next__text">${esc(pathName)}. ${efficiency
              ? "Review draws from every HSK level."
              : rung && rung.cleared
                ? `Rung cleared. HSK ${ladder.next ? ladder.next.hsk : rung.hsk} is available when you are ready.`
                : "A rung clears at 60% discovered; every word stays reviewable afterwards."}</p>
            <div class="next__meter">
              <div class="meter" role="img" aria-label="${progress}% of the current path discovered">
                <div class="meter__fill" style="width:${Math.min(100, progress)}%"></div>
              </div>
              <span class="mono">${progress}% discovered · ${m.retained} retained</span>
            </div>
          </div>
          <div class="next__actions">
            <a class="btn" href="#/memory">Review ${m.due ? `(${m.due})` : "words"} ${icons.arrow}</a>
            <a class="btn btn--ghost" href="#/ladder">Open the ladder</a>
            <a class="btn btn--quiet btn--sm" href="#/archive">See the whole archive</a>
          </div>
        </section>` : `
        <section class="next next--guest" aria-labelledby="next-title">
          <div class="next__main">
            <span class="eyebrow eyebrow--accent" id="next-title">Free account · optional</span>
            <h2 class="next__title">Keep what you discover.</h2>
            <p class="next__text">Every word, scene and character page is open without signing in. An account adds a private record of your work.</p>
            <ul class="next__list">
              <li><strong>Memory Studio</strong> brings words back when they are about to fade.</li>
              <li><strong>Your archive</strong> lists every word you opened or saved.</li>
              <li><strong>Export and deletion</strong> keep the data yours, always.</li>
            </ul>
          </div>
          <div class="next__actions">
            <a class="btn" href="#/account">Create a free account ${icons.arrow}</a>
            <a class="btn btn--ghost" href="#/ladder">Browse the ladder</a>
            <a class="btn btn--quiet btn--sm" href="#/account">Sign in instead</a>
          </div>
        </section>`}

        <section class="rooms" aria-labelledby="rooms-title">
          <div class="rooms__head">
            <div class="stack stack--2">
              <span class="eyebrow" id="rooms-title">The rooms</span>
              <h2>Choose by curiosity.</h2>
            </div>
            <a class="btn btn--quiet" href="#/help">Full guide ${icons.arrow}</a>
          </div>
          <div class="rooms__grid">
            ${ROOMS.map((room) => `
              <a class="roomcard" href="#/${room.route}">
                <span class="roomcard__top">
                  <span class="roomcard__glyph" aria-hidden="true">${room.glyph}</span>
                  <span class="roomcard__tag">${room.tag}</span>
                </span>
                <span class="roomcard__title">${esc(room.title)}</span>
                <span class="roomcard__text">${esc(room.text)}</span>
                <span class="roomcard__go">Enter ${icons.arrow}</span>
              </a>`).join("")}
          </div>
          <p class="rooms__also">
            Also inside:
            <a href="#/lab">Hanzi Lab</a> ·
            <a href="#/sound">Sound Archive</a> ·
            <a href="#/challenge">Challenge Room</a> ·
            <a href="#/archive">Your Archive</a>
          </p>
        </section>

        <section class="homefaq" aria-labelledby="homefaq-title">
          <div class="homefaq__intro">
            <span class="eyebrow" id="homefaq-title">Questions</span>
            <h2>Before you start.</h2>
            <p>Free to browse, no payment, no tracking. The longer answers live in the guide.</p>
          </div>
          <div class="faq">
            <details>
              <summary>Is Lowkey Mandarin free?</summary>
              <p>Yes. There are no ads, subscriptions, microtransactions or locked lessons.</p>
            </details>
            <details>
              <summary>Do I need an account?</summary>
              <p>Not to read. Every word, scene, sound set and character page is open. An account is only needed to save reviews, saved words and discoveries. Sign-up takes an email and a password.</p>
            </details>
            <details>
              <summary>Is this an official HSK course?</summary>
              <p>No. HSK labels describe approximate vocabulary coverage. The project is independent and not affiliated with any testing body.</p>
            </details>
            <details>
              <summary>Can I take my data with me?</summary>
              <p>Yes. Download a JSON export from the account page at any time, and delete the account and its data whenever you want.</p>
            </details>
          </div>
        </section>

        <footer class="home__end">
          <p class="display">“Don't memorize. <em>Discover.</em>”</p>
          <div class="row" style="gap:.5rem;flex-wrap:wrap">
            <a class="btn btn--ghost btn--sm" href="#/help">How it works</a>
            <a class="btn btn--quiet btn--sm" href="#/cosmos">Browse the cosmos</a>
          </div>
        </footer>
      </section>`;

    view.querySelector("#welcomeClose")?.addEventListener("click", () => {
      try { localStorage.setItem("hanzi-flow:welcomed", "1"); } catch (_error) { /* not fatal */ }
      view.querySelector("#welcome")?.remove();
    });

    revealOnScroll(view);
  },
};
