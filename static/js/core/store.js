// Lowkey Mandarin — shared boot state

import { get } from "./api.js";

let cache = null;
let inflight = null;

export async function loadBoot(force = false) {
  if (cache && !force) return cache;
  if (inflight && !force) return inflight;
  inflight = get("/api/bootstrap")
    .then((data) => {
      cache = data;
      paintChrome();
      return data;
    })
    .finally(() => { inflight = null; });
  return inflight;
}

export function boot() {
  return cache;
}

export function setDue(count) {
  if (!cache) return;
  cache.metrics.due = count;
  paintChrome();
}

export function paintChrome() {
  if (!cache) return;
  const due = document.querySelectorAll("#railDue");
  due.forEach((node) => { node.textContent = cache.metrics.due; });
  const tag = document.getElementById("topbarTag");
  if (tag) {
    const ladder = cache.ladder;
    if (ladder && ladder.pace === "efficiency") {
      tag.textContent = `EFFICIENCY · ${cache.metrics.concepts}/${cache.metrics.totalWords}`;
    } else if (ladder && ladder.current) {
      tag.textContent = `HSK ${ladder.current.hsk} · ${ladder.current.discovered}/${ladder.current.total}`;
    } else {
      tag.textContent = cache.exploration
        ? `EXPLORATION ${String(cache.metrics.concepts).padStart(2, "0")}`
        : "";
    }
  }

  const account = document.getElementById("topbarAccount");
  if (account) {
    const name = cache.authenticated ? (cache.profile?.name || "Account") : "Sign in";
    account.textContent = name;
    account.title = cache.authenticated ? "Open your account" : "Sign in or create an account";
  }
}
