// Lowkey Mandarin — account gate for rooms that need saved progress.

import { loadBoot } from "./store.js";
import { esc } from "./ui.js";

export async function requireAccount(view, message = "This room reads and writes your saved progress.") {
  const data = await loadBoot();
  if (data?.authenticated) return true;

  const next = encodeURIComponent((location.hash || "#/").replace(/^#/, ""));
  view.innerHTML = `
    <section class="page account-gate">
      <span class="eyebrow eyebrow--accent">账户 / ACCOUNT</span>
      <h1 class="page-head__title" style="margin:.6rem 0 1rem">Save what<br><em>you learn.</em></h1>
      <p class="lede">${esc(message)} Sign in or create a free account. Browsing the words, scenes and character lab stays open to everyone.</p>
      <div class="row" style="gap:.6rem;flex-wrap:wrap;margin-top:1.5rem">
        <a class="btn" href="#/account?next=${next}">Sign in or register</a>
        <a class="btn btn--ghost" href="#/cosmos">Browse the cosmos</a>
      </div>
    </section>`;
  return false;
}
