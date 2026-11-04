// Lowkey Mandarin — help and legal pages
// Plain-language pages that describe what this deployment actually does.
// Edit the text below to match your own deployment before publishing.

import { get } from "../core/api.js";
import { esc, toast } from "../core/ui.js";

// Portfolio identity. Change these two values to point the contact page at you.
const PORTFOLIO = Object.freeze({
  instagramHandle: "dkaprdtya",
  instagramUrl: "https://www.instagram.com/dkaprdtya/",
});

const UPDATED = "4 November 2026";

function contactBlock(email) {
  const instagram = `Instagram: @${PORTFOLIO.instagramHandle}`;
  return email ? `Email: ${email}. ${instagram}.` : `${instagram}.`;
}

function paragraph(text) {
  // Backticks mark code spans in the source strings; everything is escaped.
  return String(text)
    .split("`")
    .map((part, index) => (index % 2 === 1 ? `<code>${esc(part)}</code>` : esc(part)))
    .join("");
}

const LEGAL = {  privacy: {
    title: "Privacy",
    cn: "隐私",
    lede: "What this archive stores, where it lives, and what it never collects.",
    sections: [
      ["Short version", [
        "Lowkey Mandarin is a study archive for Mandarin Chinese. Reading the vocabulary, scenes, sounds and character pages needs no account. To save reviews, saved words and discoveries you create an account with an email address and a password.",
        "Study progress belongs to that account and is stored on the server that hosts this copy. There is no advertising, no analytics and no cloud sync to another provider.",
      ]],
      ["What is stored", [
        "Account: email address, a one-way password hash, display name, account creation and update times, and study settings such as chosen HSK level and pace.",
        "Study data: review dates, intervals, confidence, saved words, discovered words and scenes, study session summaries and challenge scores. All of it is linked to your account id.",
        "Sign-in security: a session identifier, a security token, expiry and last-seen times, and the IP address and browser string used to sign in. This exists only to protect the account and is removed when the session ends.",
      ]],
      ["Where it lives", [
        "Server: a private database controlled by the operator of this copy. It is not part of the public website and is not readable by other visitors.",
        "Browser: two cookies, `hanzi_session` and `hanzi_csrf`, keep you signed in and protect state-changing requests. Two `localStorage` entries remember whether the desktop navigation is expanded (`hanzi-flow:rail`) and whether the first-visit note was dismissed (`hanzi-flow:welcomed`). See the Cookie Policy.",
      ]],
      ["What is not collected", [
        "No analytics, tracking pixels, advertising identifiers, fingerprinting, heatmaps, session recording or cross-site profiling.",
        "No payment details, phone number, postal address, contacts or precise location. The app never asks for them.",
      ]],
      ["Third-party requests", [
        "Google Fonts is used for typography. When the page loads, your browser contacts Google and sends routine request data such as your IP address and browser user agent. Google's own privacy terms apply to that request.",
        "Hanzi Writer is loaded from jsDelivr only when you open Hanzi Lab, for optional stroke-order animation. Opening the rest of the app does not contact jsDelivr.",
        "Pronunciation uses your browser's Web Speech API. Depending on your browser and operating system, the voice may be generated locally or by the platform vendor. Lowkey Mandarin does not receive or store that audio.",
      ]],
      ["Retention", [
        "A sign-in session lasts up to 30 days, then expires. Password-reset links expire after one hour and can be used once.",
        "Study data stays until you delete the account or the operator removes the database. There is no automatic expiry of study data and no background profiling.",
      ]],
      ["Your rights", [
        "You can export a JSON copy of your account and study data from the account page. You can delete the account and all linked study data there; deletion requires your password and the word DELETE.",
        "If Indonesian law applies (UU No. 27 Tahun 2022 on Personal Data Protection), you may have rights to information, access, correction, deletion, withdrawal of consent, objection, and restriction of processing. Similar rights may exist in other jurisdictions.",
        "To exercise a right that the account page does not cover, contact the operator of this deployment. This page is a practical description, not legal advice.",
      ]],
      ["Security", [
        "Passwords are stored as one-way hashes, so the operator cannot read them. Sign-in uses a HttpOnly cookie, and access to the database is limited to the operator.",
        "No service is completely secure. If you find a security problem, use the contact channel for this copy. Do not send your password.",
      ]],
      ["Children", [
        "The archive is a general-audience study tool and is not directed at children under 13. Accounts are not intended for children under 13. Contact the operator if a child has created one and it should be removed.",
      ]],
      ["Changes", [
        `This policy was last updated on ${UPDATED}. Material changes are shown here with a new date.`,
      ]],
    ],
  },

  terms: {
    title: "Terms",
    cn: "条款",
    lede: "The simple agreement for using this independent study archive.",
    sections: [
      ["Acceptance", [
        "By using Lowkey Mandarin you agree to these terms. If you do not agree, do not use the site.",
      ]],
      ["What this is", [
        "Lowkey Mandarin is an independent educational study aid for Mandarin Chinese vocabulary, characters, listening and situational practice. It is free to browse. Saving progress requires a free account.",
        "The project is not affiliated with, endorsed by, or connected to HSK, Chinese Testing International (CTI), Hanban, or any official language-testing body.",
      ]],
      ["Accounts", [
        "You must provide a valid email address and choose a password of at least 10 characters. Keep the password private; you are responsible for activity under your account.",
        "One person should use one account. Do not create accounts to evade rate limits, abuse the service or impersonate someone else.",
        "You may delete your account at any time from the account page. Deletion removes the account and its study data and cannot be undone.",
      ]],
      ["Your use", [
        "You may use the archive for personal study. Do not attempt to disrupt the service, bypass rate limits, attack the host, scrape the whole database for redistribution, or use the site to break the law.",
        "You are responsible for your own device, browser, network and study decisions.",
      ]],
      ["Content and accuracy", [
        "Vocabulary, example sentences, grammar notes and scene dialogue are written for this project and reviewed on a best-effort basis. Language content may contain mistakes, simplifications or regional variation.",
        "The archive is not a dictionary, translation service, examination authority or source of professional advice. Verify important information independently.",
      ]],
      ["Availability", [
        "The site is offered as-is. It may be changed, interrupted, moved or discontinued at any time. There is no service-level agreement, uptime guarantee or support commitment.",
        "Progress is stored on the hosting machine. If that machine or database is lost, progress may be lost. Keep your own backups by exporting the data if it matters to you.",
      ]],
      ["Intellectual property", [
        "The interface, code, written lessons and example sentences are protected by copyright. See the Copyright Notice for details and the licence status of third-party components.",
        "Your own study data belongs to you. You may export it from the account page.",
      ]],
      ["Liability", [
        "To the extent permitted by applicable law, the operator is not liable for indirect or consequential loss, lost progress, lost data, exam outcomes, or decisions made using the site.",
        "Nothing in these terms excludes liability that cannot lawfully be excluded.",
      ]],
      ["Governing law", [
        "These terms are governed by the laws of the Republic of Indonesia. Any dispute is handled by the courts that have jurisdiction over the operator, unless mandatory consumer law provides otherwise.",
      ]],
      ["Changes and contact", [
        `These terms were last updated on ${UPDATED}. Continued use after a change means you accept the revised terms.`,
        "Questions: see the Contact page.",
      ]],
    ],
  },

  cookies: {
    title: "Cookies",
    cn: "Cookie",
    lede: "Two first-party cookies keep an account signed in. Nothing else is tracked.",
    sections: [
      ["Cookies", [
        "`hanzi_session` is set after sign-in. It holds a random session token and is HttpOnly, SameSite=Lax, and Secure when the site runs over HTTPS. It lasts up to 30 days or until you sign out.",
        "`hanzi_csrf` holds a random token that the page sends back in a header on state-changing requests. It is readable by the page by design and contains no personal data.",
        "There is no consent cookie, advertising cookie, analytics cookie or cross-site tracking cookie.",
      ]],
      ["Local storage", [
        "`hanzi-flow:rail` remembers whether the desktop side navigation is expanded. `hanzi-flow:welcomed` remembers that the first-visit note was dismissed. Neither is sent to the server and neither contains personal data.",
        "You can remove both at any time from the Your Data page or through your browser's site-data controls. Clearing site data also signs you out.",
      ]],
      ["Third-party requests", [
        "Google Fonts and jsDelivr receive normal HTTP request data when their resources load. They are not used to set advertising or analytics cookies by this app. Their own policies apply to their services.",
        "If a future version adds analytics, advertising or embedded media, this page and the Privacy Policy must be updated first.",
      ]],
    ],
  },

  disclaimer: {
    title: "Disclaimer",
    cn: "声明",
    lede: "An independent study aid, not an official course or examination authority.",
    sections: [
      ["Educational purpose", [
        "Lowkey Mandarin is an independent educational project for learning Mandarin vocabulary and related skills. It is not a school, examination centre, translation service or professional advisory service.",
      ]],
      ["No affiliation", [
        "Lowkey Mandarin is not affiliated with HSK, Chinese Testing International, Hanban, any university, or any government body. References to HSK levels describe approximate vocabulary coverage for study convenience. They are not official certification.",
      ]],
      ["No guarantees", [
        "Using the archive does not guarantee a particular exam score, fluency level, retention outcome or admission result. Individual results depend on many factors outside this project.",
      ]],
      ["Accuracy", [
        "Language content is checked on a best-effort basis but may contain errors, simplifications or differences from a particular textbook or regional usage. Verify anything important with a qualified teacher or authoritative reference.",
      ]],
      ["Audio and device behaviour", [
        "Pronunciation and tone playback depend on your browser, operating system and installed voices. Output can vary between devices. The tone contour is a visual aid, not a studio recording.",
      ]],
      ["External resources", [
        "The optional Hanzi Writer library and Google Fonts are provided by third parties. Their availability, accuracy and policies are outside this project's control.",
      ]],
      ["Not legal or professional advice", [
        "The legal pages describe this project's practices in plain language. They are not legal advice and do not create a lawyer-client relationship.",
      ]],
    ],
  },

  copyright: {
    title: "Copyright",
    cn: "版权",
    lede: "What is original here, what is licensed, and what you may reuse.",
    sections: [
      ["Project content", [
        "The interface design, source code, written explanations, grammar notes, scene dialogue and example sentences are original work created for Lowkey Mandarin, unless stated otherwise. They are protected by copyright.",
        "You may read, study and use the site for personal learning. Do not republish substantial portions, mirror the database, or present the project's content as your own without written permission.",
      ]],
      ["Chinese language facts", [
        "Individual characters, words and their dictionary meanings are linguistic facts and are not owned by this project. The selection, ordering, explanations and example sentences that make up this archive are the original editorial work.",
      ]],
      ["Third-party software and fonts", [
        "Flask and its Python dependencies are used under their respective open-source licences (BSD-family). Hanzi Writer is used under the MIT licence and is loaded from jsDelivr only in Hanzi Lab.",
        "Instrument Serif, Inter, IBM Plex Mono, Noto Serif SC and Noto Sans SC are served by Google Fonts and are licensed under the SIL Open Font License. They are not sold or sublicensed by this project.",
        "The full inventory, versions and required attribution are recorded in `LICENSES.md` in the project repository.",
      ]],
      ["No scraped dictionary content", [
        "The vocabulary list and examples were authored for this project rather than copied from a proprietary dictionary, textbook or competitor. If you believe something infringes your rights, contact the operator with the specific material and a basis for the claim.",
      ]],
      ["Your data", [
        "Study progress and exported data belong to you. The project claims no ownership over them.",
      ]],
    ],
  },

  data: {
    title: "Your data",
    cn: "数据",
    lede: "See what is stored, take a copy, or delete the account.",
    sections: [
      ["What you can do here", [
        "Download a JSON copy of the account and study data held by this deployment. The export includes the account email, display name, settings, words, progress, discoveries, saved words, session summaries and challenge results.",
        "Clear the browser preferences this site stores. This does not touch your study progress or sign you out.",
      ]],
      ["Export", [
        "The export needs a signed-in account. It is generated from the database on request and downloaded directly to your device. No copy is sent anywhere else.",
        "It contains no password, password hash, session token, CSRF token, IP address or analytics identifier.",
      ]],
      ["Deleting the account", [
        "Open the account page and use “Delete my account”. You must enter the current password and type DELETE. The account row and all linked progress, discoveries, sessions and challenge results are removed.",
        "Deletion is immediate and cannot be undone. Download an export first if you may want the data later.",
        "If you cannot sign in, contact the operator of this deployment. They may be able to remove the account after verifying that it belongs to you.",
      ]],
    ],
  },
};

// --------------------------------------------------------------------------
// Help
// --------------------------------------------------------------------------
const HELP_STEPS = [
  ["Pick a rung", "Open The Ladder and choose HSK 1. The HSK track limits review to that level and below; Efficiency mode draws from the whole archive.", "ladder", "Go to the ladder"],
  ["Meet the words", "Open Word Cosmos, click any node, and follow a relation. Every word carries an example sentence, a category and a place in the graph.", "cosmos", "Open the cosmos"],
  ["Review what fades", "Memory Studio asks one question at a time and schedules the next review from your answer. A few minutes a day is enough.", "memory", "Start a review"],
];

const ROOMS = [
  ["阶", "The Ladder", "An HSK 1–5 path with an HSK 6 preview, grammar notes and a 60% discovery gate.", "ladder"],
  ["记", "Memory Studio", "Spaced review with six exercise types and honest scheduling. Account required.", "memory"],
  ["网", "Word Cosmos", "A force-directed map of 2,594 words and 4,200+ typed connections.", "cosmos"],
  ["境", "Living Mandarin", "Short dialogues set in a café, a classroom and other everyday rooms.", "living"],
  ["字", "Hanzi Lab", "Character anatomy, stroke order and the words that contain a character.", "lab"],
  ["声", "Sound Archive", "Tone contours, listening checks and device-spoken examples.", "sound"],
  ["战", "Challenge Room", "Four short games built from your vocabulary and its connections.", "challenge"],
  ["档", "Your Archive", "Coverage, retention, a 28-day rhythm, saved words and traces.", "archive"],
];

const SHORTCUTS = [
  ["Ctrl / Cmd + K", "Open vocabulary search"],
  ["↑ / ↓, Enter", "Move through search results and open one"],
  ["Esc", "Close search or a game"],
  ["Space", "Reveal an answer in Memory Studio"],
  ["1–4", "Rate recall or answer a game question"],
  ["P", "Replay audio in Memory Studio"],
];

export function legalPage(slug) {
  const page = LEGAL[slug];
  return {
    route: slug,
    index: "—",
    name: page.title,
    async render(view) {
      let email = "";
      try {
        const site = await get("/api/site");
        email = site.contactEmail || "";
      } catch (_error) { /* contact stays unavailable */ }
      const contact = esc(contactBlock(email));

      view.innerHTML = `
        <section class="page legal">
          <header class="page-head">
            <div>
              <span class="eyebrow eyebrow--accent">${esc(page.cn)} / ${esc(page.title.toUpperCase())}</span>
              <h1 class="page-head__title" style="margin-top:.55rem">${esc(page.title)}</h1>
            </div>
            <div class="page-head__aside">
              <p>${esc(page.lede)}</p>
              <span class="mono" style="color:var(--grey)">UPDATED ${UPDATED.toUpperCase()}</span>
            </div>
          </header>
          <div class="legal__body">
            ${page.sections.map(([heading, blocks]) => `
              <section class="legal__section">
                <h2>${esc(heading)}</h2>
                ${blocks.map((block) => `<p>${paragraph(block)}</p>`).join("")}
              </section>`).join("")}
            <section class="legal__section">
              <h2>Contact</h2>
              <p>${contact}</p>
            </section>
          </div>
          <div class="legal__foot">
            <a class="btn btn--ghost btn--sm" href="#/help">How it works</a>
            <a class="btn btn--quiet btn--sm" href="#/privacy">Privacy</a>
            <a class="btn btn--quiet btn--sm" href="#/terms">Terms</a>
            <a class="btn btn--quiet btn--sm" href="#/data">Your data</a>
          </div>
        </section>`;
    },
  };
}

// --------------------------------------------------------------------------
// Contact
// --------------------------------------------------------------------------
export const contact = {
  route: "contact",
  index: "—",
  name: "Contact",
  async render(view) {
    let email = "";
    try {
      const site = await get("/api/site");
      email = site.contactEmail || "";
    } catch (_error) { /* unavailable */ }

    const instagramUrl = esc(PORTFOLIO.instagramUrl);
    const instagramHandle = esc(`@${PORTFOLIO.instagramHandle}`);

    view.innerHTML = `
      <section class="page legal">
        <header class="page-head">
          <div>
            <span class="eyebrow eyebrow--accent">联系 / CONTACT</span>
            <h1 class="page-head__title" style="margin-top:.55rem">A personal<br><em>portfolio.</em></h1>
          </div>
          <div class="page-head__aside">
            <p>Lowkey Mandarin is a personal portfolio project, free to use and made for learning Mandarin.</p>
            <span class="mono" style="color:var(--grey)">FREE · NO ADS · BUILT TO LEARN</span>
          </div>
        </header>

        <div class="legal__body">
          <section class="legal__section">
            <h2>About this project</h2>
            <p>This is a personal portfolio project by <a href="${instagramUrl}" target="_blank" rel="noopener noreferrer"><strong>${instagramHandle}</strong></a>. It is free to use and made for studying Mandarin. Every HSK 1–5 list, the HSK 6 preview, the scenes and the character lab are open without an account.</p>
            <p>You are welcome to use the site for your own learning, show it to other learners, or study how it is built. The interface and written lessons are still the author's work; see the <a href="#/copyright">Copyright Notice</a> before republishing large parts.</p>
          </section>

          <section class="legal__section">
            <h2>Say hello</h2>
            <p>Questions, corrections, bug reports or portfolio feedback: <a href="${instagramUrl}" target="_blank" rel="noopener noreferrer"><strong>${instagramHandle}</strong> on Instagram</a>.</p>
            ${email ? `<p>Email: <a href="mailto:${esc(email)}"><strong>${esc(email)}</strong></a></p>` : ""}
            <p>There is no support hotline, live chat or guaranteed response time. This is an independent project, not a company help desk.</p>
          </section>

          <section class="legal__section">
            <h2>Useful reports</h2>
            <p>For a content correction, include the word or page, what is wrong, and a reliable source if you have one.</p>
            <p>For a technical problem, include the page, your browser and device, what you expected, and what happened. Screenshots are optional.</p>
            <p>Do not send passwords, identity documents, payment details or other sensitive personal data. The app does not need them.</p>
          </section>

          <section class="legal__section">
            <h2>Privacy and deletion requests</h2>
            <p>You can export or delete your account and study data yourself from the <a href="#/account">account page</a>. If you cannot sign in, send a message on Instagram and describe the account email address.</p>
            <p>Do not send your password. The author does not need it and should never ask for it.</p>
          </section>

          <section class="legal__section">
            <h2>Copyright</h2>
            <p>Report alleged infringement with the specific material, its location, and the basis of your claim. See the Copyright Notice.</p>
          </section>
        </div>

        <div class="legal__foot">
          <a class="btn btn--ghost btn--sm" href="#/privacy">Privacy</a>
          <a class="btn btn--quiet btn--sm" href="#/copyright">Copyright</a>
          <a class="btn btn--quiet btn--sm" href="#/data">Your data</a>
        </div>
      </section>`;
  },
};

// --------------------------------------------------------------------------
// Your data: legal description plus real export and preference controls
// --------------------------------------------------------------------------
function downloadJson(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const day = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `lowkey-mandarin-export-${day}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export const dataPage = {
  route: "data",
  index: "—",
  name: "Your data",
  async render(view) {
    const page = LEGAL.data;
    view.innerHTML = `
      <section class="page legal">
        <header class="page-head">
          <div>
            <span class="eyebrow eyebrow--accent">${esc(page.cn)} / YOUR DATA</span>
            <h1 class="page-head__title" style="margin-top:.55rem">${esc(page.title)}</h1>
          </div>
          <div class="page-head__aside">
            <p>${esc(page.lede)}</p>
            <span class="mono" style="color:var(--grey)">UPDATED ${UPDATED.toUpperCase()}</span>
          </div>
        </header>

        <section class="data__panel" aria-label="Data controls">
          <div class="data__action">
            <div>
              <h2>Download a copy</h2>
              <p>One JSON file with your account and study data. Requires a signed-in account. Nothing is sent anywhere else.</p>
            </div>
            <button class="btn" type="button" id="dataExport">Download JSON</button>
          </div>
          <div class="data__action">
            <div>
              <h2>Clear browser preferences</h2>
              <p>Removes the remembered navigation state and the dismissed first-visit note. Study progress and sign-in are not affected.</p>
            </div>
            <button class="btn btn--ghost" type="button" id="dataClear">Clear preferences</button>
          </div>
        </section>

        <div class="legal__body">
          ${page.sections.map(([heading, blocks]) => `
            <section class="legal__section">
              <h2>${esc(heading)}</h2>
              ${blocks.map((block) => `<p>${paragraph(block)}</p>`).join("")}
            </section>`).join("")}
        </div>

        <div class="legal__foot">
          <a class="btn btn--ghost btn--sm" href="#/archive">Open your archive</a>
          <a class="btn btn--quiet btn--sm" href="#/privacy">Privacy</a>
          <a class="btn btn--quiet btn--sm" href="#/contact">Contact</a>
        </div>
      </section>`;

    view.querySelector("#dataExport")?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      try {
        const payload = await get("/api/export");
        downloadJson(payload);
        toast("Export downloaded.");
      } catch (error) {
        if (error.status === 401) {
          toast("Sign in to export your data.");
          location.hash = "#/account?next=%2Fdata";
          return;
        }
        toast(error.message || "The export could not be prepared.");
      } finally {
        button.disabled = false;
      }
    });

    view.querySelector("#dataClear")?.addEventListener("click", () => {
      try {
        localStorage.removeItem("hanzi-flow:rail");
        localStorage.removeItem("hanzi-flow:welcomed");
        toast("Browser preferences cleared.");
      } catch (_error) {
        toast("This browser blocks local storage.");
      }
    });
  },
};

// --------------------------------------------------------------------------
// Help page
// --------------------------------------------------------------------------
export const help = {
  route: "help",
  index: "10",
  name: "How it works",
  async render(view) {
    let email = "";
    try {
      const site = await get("/api/site");
      email = site.contactEmail || "";
    } catch (_error) { /* optional */ }
    const contact = esc(contactBlock(email));

    view.innerHTML = `
      <section class="page help">
        <header class="page-head">
          <div>
            <span class="eyebrow eyebrow--accent">指南 / START HERE</span>
            <h1 class="page-head__title" style="margin-top:.55rem">Three minutes<br>to <em>begin.</em></h1>
          </div>
          <div class="page-head__aside">
            <p>Lowkey Mandarin has eight rooms and one shared archive. You do not need to visit them in order. Start with the ladder, then follow whatever you are curious about.</p>
            <a class="btn" href="#/ladder">Start with HSK 1</a>
          </div>
        </header>

        <section class="help__steps" aria-label="First steps">
          ${HELP_STEPS.map(([title, text, route, cta], i) => `
            <article class="help__step">
              <span class="help__step-num">${String(i + 1).padStart(2, "0")}</span>
              <h2>${esc(title)}</h2>
              <p>${esc(text)}</p>
              <a class="mono" href="#/${route}">${esc(cta)} →</a>
            </article>`).join("")}
        </section>

        <section class="help__section" aria-labelledby="rooms-title">
          <div class="section-head">
            <div class="stack stack--2">
              <span class="eyebrow" id="rooms-title">The eight rooms</span>
              <h2>Choose by curiosity.</h2>
            </div>
            <span class="mono" style="color:var(--grey)">NO LOCKED DOORS</span>
          </div>
          <div class="help__rooms">
            ${ROOMS.map(([glyph, title, text, route]) => `
              <a class="help__room" href="#/${route}">
                <span class="help__room-glyph" aria-hidden="true">${glyph}</span>
                <span class="help__room-body">
                  <b>${esc(title)}</b>
                  <span>${esc(text)}</span>
                </span>
                <span class="arrow" aria-hidden="true">→</span>
              </a>`).join("")}
          </div>
        </section>

        <section class="help__section help__split" aria-labelledby="keys-title">
          <div>
            <span class="eyebrow" id="keys-title">Keyboard</span>
            <h2 class="help__h2">Fast when you want it.</h2>
            <p class="help__text">Every room is usable with a keyboard. Focus rings are visible, and reduced-motion preferences are respected.</p>
          </div>
          <dl class="help__keys">
            ${SHORTCUTS.map(([key, meaning]) => `<div><dt><kbd>${esc(key)}</kbd></dt><dd>${esc(meaning)}</dd></div>`).join("")}
          </dl>
        </section>

        <section class="help__section" aria-labelledby="faq-title">
          <div class="section-head">
            <div class="stack stack--2">
              <span class="eyebrow" id="faq-title">Questions</span>
              <h2>Answered plainly.</h2>
            </div>
          </div>
          <div class="faq">
            <details>
              <summary>Is it really free?</summary>
              <p>Yes. There are no ads, subscriptions, microtransactions or locked lessons. Browsing needs no payment and no account.</p>
            </details>
            <details>
              <summary>Do I need an account?</summary>
              <p>Only to save progress. Reading the vocabulary, cosmos, scenes, sounds and character pages is open. Sign-up needs an email address and a password of at least 10 characters.</p>
            </details>
            <details>
              <summary>Does my progress sync between devices?</summary>
              <p>Yes, while you are signed in to the same account. Progress is stored with the account on this deployment. Signing in elsewhere on the same server loads the same archive.</p>
            </details>
            <details>
              <summary>Is this an official HSK course?</summary>
              <p>No. HSK labels describe approximate vocabulary coverage. Lowkey Mandarin is independent and not affiliated with any testing body.</p>
            </details>
            <details>
              <summary>Why does a rung clear at 60%?</summary>
              <p>Sixty percent is enough to move forward without pretending that recognition equals mastery. You can keep reviewing every word after climbing.</p>
            </details>
            <details>
              <summary>Does it work offline?</summary>
              <p>Not as a web app. The interface and database run on the host, so the host must be reachable. Fonts and stroke-order data have local fallbacks when a CDN is unavailable.</p>
            </details>
          </div>
        </section>

        <section class="help__section help__note">
          <p><strong>One honest limitation.</strong> This is a study aid, not a teacher. It can show you a character, a sentence and a connection; it cannot correct your accent or certify your level.</p>
          <div class="row" style="gap:.5rem;flex-wrap:wrap">
            <a class="btn btn--ghost btn--sm" href="#/memory">Open Memory Studio</a>
            <a class="btn btn--quiet btn--sm" href="#/contact">Contact</a>
          </div>
          <p class="small" style="margin-top:1rem">${contact}</p>
        </section>
      </section>`;
  },
};
