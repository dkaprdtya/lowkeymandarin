// Lowkey Mandarin — hash router

import { esc } from "./ui.js";

const routes = [];
let activeCleanup = null;
let activePage = null;

export function register(pattern, page) {
  const keys = [];
  const regex = new RegExp(
    "^" + pattern
      .replace(/\/:([a-zA-Z]+)/g, (_m, key) => { keys.push(key); return "/([^/]+)"; })
      .replace(/\/$/, "") + "/?$",
  );
  routes.push({ pattern, regex, keys, page });
}

export function parseHash() {
  const raw = location.hash.replace(/^#/, "") || "/";
  const [path, qs] = raw.split("?");
  return {
    path: path || "/",
    params: new URLSearchParams(qs || ""),
  };
}

export function navigate(path, { replace = false } = {}) {
  const target = `#${path}`;
  if (location.hash === target) {
    resolve();
    return;
  }
  if (replace) location.replace(target);
  else location.hash = target;
}

export async function resolve() {
  const { path, params } = parseHash();
  const view = document.getElementById("view");
  if (!view) return;

  let match = null;
  for (const route of routes) {
    const found = route.regex.exec(path);
    if (found) {
      match = { route, values: found.slice(1) };
      break;
    }
  }
  if (!match) {
    navigate("/", { replace: true });
    return;
  }

  if (typeof activeCleanup === "function") {
    try { activeCleanup(); } catch (_e) { /* page teardown should never break navigation */ }
  }
  activeCleanup = null;
  activePage = match.route.page;

  const options = {};
  match.route.keys.forEach((key, i) => { options[key] = decodeURIComponent(match.values[i]); });
  if (params.get("word")) options.word = params.get("word");
  options.query = params;

  view.innerHTML = "";
  view.scrollTop = 0;
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });

  try {
    const result = await activePage.render(view, options);
    if (typeof result === "function") activeCleanup = result;
  } catch (error) {
    console.error(error);
    view.innerHTML = `
      <section class="page">
        <p class="eyebrow eyebrow--accent">Connection interrupted</p>
        <h1 class="page-head__title" style="margin:.6rem 0 1rem">This room did not load.</h1>
        <p class="lede">${esc(error.message)}</p>
        <p style="margin-top:1.5rem"><button class="btn" id="routeRecovery" type="button">Return to origin <span class="arrow">→</span></button></p>
      </section>`;
    view.querySelector("#routeRecovery")?.addEventListener("click", () => navigate("/"));
  }
  updateNav(activePage);
  updateMeta(activePage);
  document.dispatchEvent(new CustomEvent("hanzi:route", { detail: { page: activePage, path } }));
}

export function updateMeta(page) {
  document.title = `${page.name} — GO STUDY`;
  if (page.description) {
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", page.description);
  }
}

export function updateNav(page) {
  const key = page.route;
  document.querySelectorAll("[data-route]").forEach((node) => {
    const isActive = node.dataset.route === key;
    node.classList.toggle("is-active", isActive);
    if (isActive) node.setAttribute("aria-current", "page");
    else node.removeAttribute("aria-current");
  });
  const crumbIndex = document.getElementById("crumbIndex");
  const crumbName = document.getElementById("crumbName");
  if (crumbIndex) crumbIndex.textContent = page.index;
  if (crumbName) crumbName.textContent = page.name.toUpperCase();
}

export function currentPage() {
  return activePage;
}
