// Lowkey Mandarin — application entry
// Registers the rooms, boots the shared chrome, and owns the search palette.

import { register, resolve } from "./core/router.js";
import { loadBoot } from "./core/store.js";
import { get } from "./core/api.js";
import { esc, categoryLabel, debounce, toast } from "./core/ui.js";

import home from "./pages/home.js";
import ladder from "./pages/ladder.js";
import cosmos from "./pages/cosmos.js";
import memory from "./pages/memory.js";
import living, { scenePage } from "./pages/living.js";
import lab, { charPage } from "./pages/lab.js";
import sound from "./pages/sound.js";
import challenge, { gamePage } from "./pages/challenge.js";
import archive from "./pages/archive.js";
import account from "./pages/account.js";
import { help, contact, dataPage, legalPage } from "./pages/legal.js";

// --------------------------------------------------------------------------
// Routes
// --------------------------------------------------------------------------
register("/", home);
register("/ladder", ladder);
register("/cosmos", cosmos);
register("/memory", memory);
register("/living", living);
register("/living/:slug", scenePage);
register("/lab", lab);
register("/lab/:char", charPage);
register("/sound", sound);
register("/challenge", challenge);
register("/challenge/:game", gamePage);
register("/archive", archive);
register("/account", account);
register("/help", help);
register("/privacy", legalPage("privacy"));
register("/terms", legalPage("terms"));
register("/cookies", legalPage("cookies"));
register("/disclaimer", legalPage("disclaimer"));
register("/copyright", legalPage("copyright"));
register("/contact", contact);
register("/data", dataPage);

const DEFAULT_DESCRIPTION = document.querySelector('meta[name="description"]')?.content || "";
const DESCRIPTIONS = {
  home: DEFAULT_DESCRIPTION,
  ladder: "Climb HSK 1–5 rung by rung, with an HSK 6 preview, grammar notes and a 60% discovery gate. Or review the whole archive in efficiency mode.",
  cosmos: "Explore 2,594 HSK 1–5 words as a navigable graph of synonyms, opposites, time words, collocations and shared characters.",
  memory: "Spaced review with six exercise types, honest scheduling and keyboard controls. Review what is fading, not what is easy.",
  living: "Short Mandarin dialogues set in everyday rooms: order coffee, meet a friend, find a classroom, and practise the reply.",
  lab: "Take a Chinese character apart: strokes, radicals, components, origin notes and the words that contain it.",
  sound: "See tone contours while you hear them, compare minimal pairs and take an eight-round listening check.",
  challenge: "Four short Mandarin games built from your vocabulary and its connections: association, reconstruction, tone and memory.",
  archive: "A record of what stayed: HSK coverage, retention, a 28-day review rhythm, saved words and session history.",
  account: "Sign in or create a free Lowkey Mandarin account to save reviews, saved words and discoveries. Export or delete your data at any time.",
  help: "A three-minute guide to Lowkey Mandarin: what each room does, keyboard shortcuts and honest answers to common questions.",
  privacy: "How Lowkey Mandarin stores account and study data on this server's SQLite database, with no analytics and no advertising.",
  terms: "The terms for using Lowkey Mandarin, an independent and free Mandarin study archive with optional accounts.",
  cookies: "Lowkey Mandarin sets two first-party cookies for sign-in and request protection. Read what browser storage it uses.",
  disclaimer: "Lowkey Mandarin is an independent study aid, not an official HSK course, examination authority or translation service.",
  copyright: "Copyright and licensing for Lowkey Mandarin: original content, open-source dependencies and font licences.",
  contact: "Lowkey Mandarin is a personal portfolio project and a free Mandarin study archive. Contact the author on Instagram for corrections, bugs and feedback.",
  data: "Export your account and study data as JSON, or clear the browser preferences this site stores.",
};

// --------------------------------------------------------------------------
// Rail: slim by default, expandable, remembered between visits
// --------------------------------------------------------------------------
const RAIL_KEY = "hanzi-flow:rail";

function paintRail(open) {
  const shell = document.getElementById("shell");
  const toggle = document.getElementById("railToggle");
  if (!shell || !toggle) return;
  shell.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("title", open ? "Collapse navigation" : "Expand navigation");
  toggle.setAttribute("aria-label", open ? "Collapse navigation" : "Expand navigation");
  const label = toggle.querySelector(".rail__collapse-label");
  if (label) label.textContent = open ? "Collapse" : "Expand";
}

function initRail() {
  let open = false;
  try {
    open = localStorage.getItem(RAIL_KEY) === "open";
  } catch (_e) { /* storage may be blocked; stay slim */ }
  paintRail(open);

  const toggle = document.getElementById("railToggle");
  if (!toggle) return;
  toggle.addEventListener("click", () => {
    const next = !document.getElementById("shell")?.classList.contains("is-open");
    paintRail(next);
    try {
      localStorage.setItem(RAIL_KEY, next ? "open" : "closed");
    } catch (_e) { /* not fatal */ }
  });
}

// --------------------------------------------------------------------------
// Mobile "More" sheet
// --------------------------------------------------------------------------
const MORE_ROUTES = new Set(["living", "lab", "sound", "challenge", "archive", "account", "help", "privacy", "terms", "cookies", "disclaimer", "copyright", "contact", "data"]);

function initMoreSheet() {
  const sheet = document.getElementById("moreSheet");
  const opener = document.getElementById("moreOpen");
  if (!sheet || !opener) return;

  const panel = sheet.querySelector(".sheet__panel");
  let lastFocus = null;

  const close = (restore = true) => {
    if (sheet.hidden) return;
    sheet.hidden = true;
    opener.setAttribute("aria-expanded", "false");
    document.body.classList.remove("is-sheet-open");
    if (restore && lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    lastFocus = null;
  };

  const open = () => {
    const active = document.activeElement;
    lastFocus = active && active !== document.body ? active : opener;
    sheet.hidden = false;
    opener.setAttribute("aria-expanded", "true");
    document.body.classList.add("is-sheet-open");
    panel?.querySelector("a, button")?.focus();
  };

  opener.addEventListener("click", () => (sheet.hidden ? open() : close()));

  sheet.querySelectorAll("[data-more-close]").forEach((node) => {
    node.addEventListener("click", () => close());
  });
  sheet.querySelectorAll(".sheet__body a").forEach((node) => {
    node.addEventListener("click", () => close(false));
  });

  sheet.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab" || !panel) return;
    const focusable = Array.from(panel.querySelectorAll("a[href], button:not([disabled])"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.matchMedia("(min-width: 961px)").addEventListener("change", (event) => {
    if (event.matches) close(false);
  });

  document.addEventListener("hanzi:route", (event) => {
    const route = event.detail?.page?.route;
    opener.classList.toggle("is-active", MORE_ROUTES.has(route));
    if (!sheet.hidden) close(false);
    const description = DESCRIPTIONS[route];
    if (description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", description);
    }
  });
}

// --------------------------------------------------------------------------
// Search palette
// --------------------------------------------------------------------------
function initPalette() {
  const palette = document.getElementById("palette");
  const input = document.getElementById("paletteInput");
  const results = document.getElementById("paletteResults");
  const opener = document.getElementById("searchOpen");
  if (!palette || !input || !results) return;

  let items = [];
  let active = -1;
  let lastFocus = null;
  let requestId = 0;

  const paintSelection = () => {
    const nodes = results.querySelectorAll(".palette__item");
    nodes.forEach((node, i) => {
      const on = i === active;
      node.classList.toggle("is-active", on);
      node.setAttribute("aria-selected", String(on));
      if (on) node.scrollIntoView({ block: "nearest" });
    });
  };

  const paintEmpty = (message) => {
    items = [];
    active = -1;
    results.innerHTML = `<p class="palette__empty mono">${esc(message)}</p>`;
  };

  const paintItems = (words) => {
    items = words;
    active = words.length ? 0 : -1;
    if (!words.length) {
      paintEmpty("No word matches. Try a character, a pinyin syllable, or an English meaning.");
      return;
    }
    results.innerHTML = words
      .map((w, i) => `
        <a class="palette__item" href="#/cosmos?word=${w.id}" data-index="${i}" role="option"
           aria-selected="${i === 0 ? "true" : "false"}" id="paletteItem${i}">
          <span class="palette__hanzi" aria-hidden="true">${esc(w.hanzi)}</span>
          <span class="palette__meta">
            <span class="palette__pinyin">${esc(w.pinyin)}</span>
            <span class="palette__meaning">${esc(w.meaning)}</span>
          </span>
          <span class="palette__cat">${esc(categoryLabel(w.category))}</span>
        </a>`)
      .join("");
    active = 0;
    paintSelection();
    input.setAttribute("aria-activedescendant", "paletteItem0");
  };

  const search = debounce(async (query) => {
    const id = ++requestId;
    if (!query.trim()) {
      paintEmpty("Type a character, pinyin or meaning. Results open in the cosmos.");
      return;
    }
    try {
      const { words } = await get(`/api/words?q=${encodeURIComponent(query.trim())}`);
      if (id !== requestId) return;
      paintItems(words.slice(0, 8));
    } catch (error) {
      if (id !== requestId) return;
      paintEmpty(error.message);
    }
  }, 160);

  const open = () => {
    lastFocus = document.activeElement;
    palette.hidden = false;
    input.setAttribute("aria-expanded", "true");
    paintEmpty("Type a character, pinyin or meaning. Results open in the cosmos.");
    input.value = "";
    requestId += 1;
    input.focus();
  };

  const close = () => {
    if (palette.hidden) return;
    palette.hidden = true;
    input.setAttribute("aria-expanded", "false");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    lastFocus = null;
  };

  const choose = (index) => {
    const item = items[index];
    if (!item) return;
    location.hash = `#/cosmos?word=${item.id}`;
    close();
  };

  opener?.addEventListener("click", open);
  input.addEventListener("input", () => search(input.value));
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-expanded", "false");
  input.setAttribute("aria-controls", "paletteResults");
  input.setAttribute("aria-autocomplete", "list");
  results.setAttribute("role", "listbox");

  palette.querySelectorAll("[data-palette-close]").forEach((node) => {
    node.addEventListener("click", close);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!items.length) return;
      event.preventDefault();
      const delta = event.key === "ArrowDown" ? 1 : -1;
      active = (active + delta + items.length) % items.length;
      paintSelection();
      input.setAttribute("aria-activedescendant", `paletteItem${active}`);
    } else if (event.key === "Enter") {
      if (active >= 0) {
        event.preventDefault();
        choose(active);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  });

  results.addEventListener("click", (event) => {
    const item = event.target.closest("[data-index]");
    if (!item) return;
    event.preventDefault();
    choose(Number(item.dataset.index));
  });

  results.addEventListener("mousemove", (event) => {
    const item = event.target.closest("[data-index]");
    if (!item) return;
    const index = Number(item.dataset.index);
    if (index !== active) {
      active = index;
      paintSelection();
    }
  });

  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if ((event.metaKey || event.ctrlKey) && key === "k") {
      event.preventDefault();
      if (palette.hidden) open();
      else close();
    } else if (event.key === "Escape" && !palette.hidden) {
      event.preventDefault();
      close();
    }
  });

  palette.hidden = true;
}

// --------------------------------------------------------------------------
// Boot
// --------------------------------------------------------------------------
async function boot() {
  initRail();
  initMoreSheet();
  initPalette();

  // An expired session or a guest action that needs saving: send the visitor to
  // the account page, then return them to the room they were using.
  document.addEventListener("hanzi:authrequired", () => {
    if (location.hash.startsWith("#/account")) return;
    const next = encodeURIComponent((location.hash || "#/").replace(/^#/, ""));
    toast("Sign in to save this progress.");
    location.hash = `#/account?next=${next}`;
    loadBoot(true).catch(() => {});
  });

  try {
    await loadBoot();
  } catch (error) {
    console.error("Boot state unavailable:", error);
  }

  window.addEventListener("hashchange", () => { resolve(); });
  await resolve();
}

boot();
