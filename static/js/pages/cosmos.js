// Lowkey Mandarin — Word Cosmos
// A word-first connection browser: pick a word, read its links, follow one.

import { get } from "../core/api.js";
import { esc, debounce } from "../core/ui.js";

const TYPE_LABELS = {
  synonym: "Synonym",
  antonym: "Antonym",
  time: "Time",
  semantic: "Semantic",
  collocation: "Expression",
  sentence: "Sentence",
  component: "Component",
};

// All seven clear 4.5:1 against the ivory page, including the 9–10 px labels.
const TYPE_COLORS = {
  synonym: "#65700f",
  antonym: "#b03119",
  time: "#8a5b00",
  semantic: "#376a9b",
  collocation: "#6b3d8a",
  sentence: "#256349",
  component: "#5f5c54",
};

const CATEGORY_ORDER = ["time", "people", "food", "travel", "study", "nature", "feeling", "action", "general"];

const CATEGORY_LABELS = {
  time: "Time",
  people: "People",
  food: "Food",
  travel: "Travel",
  study: "Study",
  nature: "Nature",
  feeling: "Feeling",
  action: "Action",
  general: "Everyday",
};

const PAGE_SIZE = 24;

export default {
  route: "cosmos",
  index: "03",
  name: "Word Cosmos",

  async render(view, params) {
    const data = await get("/api/graph");
    const byId = new Map(data.nodes.map((node) => [node.id, node]));
    const edges = data.edges.filter((edge) => byId.has(edge.source) && byId.has(edge.target));

    // One adjacency list makes both directions readable: every edge is shown
    // from the word you are looking at, whichever way it was stored.
    const adjacency = new Map();
    for (const edge of edges) {
      const a = byId.get(edge.source);
      const b = byId.get(edge.target);
      if (!adjacency.has(a.id)) adjacency.set(a.id, []);
      if (!adjacency.has(b.id)) adjacency.set(b.id, []);
      adjacency.get(a.id).push({ edge, other: b });
      adjacency.get(b.id).push({ edge, other: a });
    }

    const categories = CATEGORY_ORDER.filter((category) => data.nodes.some((node) => node.category === category));
    let category = "all";
    let query = "";
    let limit = PAGE_SIZE;
    let selectedId = [...data.nodes]
      .sort((a, b) => b.degree - a.degree || a.hsk - b.hsk)
      .at(0)?.id ?? null;

    view.innerHTML = `
      <section class="page cosmos" aria-label="Word Cosmos connection browser">
        <header class="cosmos__head">
          <div>
            <p class="eyebrow">Word Cosmos / 词网</p>
            <h1>Word Cosmos.</h1>
            <p class="cosmos__lede">Pick a word. Read its links. Follow one. ${data.nodes.length} words and ${data.edges.length} connections, without a map to learn first.</p>
          </div>
          <label class="field cosmos__search">
            <span class="field__mark" aria-hidden="true">找</span>
            <input id="cosmosSearch" type="search" placeholder="Search a word…" aria-label="Search all words">
          </label>
        </header>

        <div class="cosmos__cats" id="cosmosCats" role="group" aria-label="Filter by category">
          <button class="chip is-active" type="button" data-cat="all">All</button>
          ${categories.map((item) => `<button class="chip" type="button" data-cat="${item}">${CATEGORY_LABELS[item] || item}</button>`).join("")}
        </div>

        <div class="cosmos__layout">
          <div class="cosmos__listcol">
            <div class="cosmos__listhead">
              <span class="eyebrow">Words</span>
              <span class="mono" id="cosmosCount"></span>
            </div>
            <div class="cosmos__list" id="cosmosList"></div>
            <button class="cosmos__more" id="cosmosMore" type="button" hidden>Show more words</button>
          </div>

          <div class="cosmos__detail" id="cosmosDetail" aria-live="polite"></div>
        </div>
      </section>`;

    const list = view.querySelector("#cosmosList");
    const count = view.querySelector("#cosmosCount");
    const more = view.querySelector("#cosmosMore");
    const detail = view.querySelector("#cosmosDetail");
    const search = view.querySelector("#cosmosSearch");

    const visibleWords = () => {
      const needle = query.trim().toLowerCase();
      const words = data.nodes.filter((node) => {
        if (category !== "all" && node.category !== category) return false;
        if (!needle) return true;
        return `${node.hanzi} ${node.pinyin} ${node.meaning}`.toLowerCase().includes(needle);
      });
      words.sort((a, b) => {
        if (needle) {
          const exact = Number(b.hanzi === query.trim()) - Number(a.hanzi === query.trim());
          if (exact) return exact;
        }
        return b.degree - a.degree || a.hsk - b.hsk || a.hanzi.localeCompare(b.hanzi);
      });
      return words;
    };

    const renderList = () => {
      const words = visibleWords();
      const shown = words.slice(0, limit);
      count.textContent = `${shown.length} / ${words.length}`;

      list.innerHTML = shown.length
        ? shown.map((node) => `
            <button class="cosmos__word${node.id === selectedId ? " is-active" : ""}" type="button" data-word="${node.id}">
              <span class="cosmos__word-hanzi">${esc(node.hanzi)}</span>
              <span class="cosmos__word-main">
                <b>${esc(node.pinyin)}</b>
                <span>${esc(node.meaning)}</span>
              </span>
              <span class="cosmos__word-meta">HSK ${node.hsk} · ${node.degree} links</span>
            </button>`).join("")
        : `<p class="cosmos__empty">No word matches that search.</p>`;

      more.hidden = words.length <= limit;
    };

    const renderDetail = () => {
      const node = byId.get(selectedId);
      if (!node) {
        detail.innerHTML = `
          <div class="cosmos__detail-empty">
            <strong>Start anywhere.</strong>
            Pick a word on the left. Its synonyms, opposites, time words, expressions and shared components appear here. Follow a link to move through the archive.
          </div>`;
        return;
      }

      const relations = adjacency.get(node.id) || [];
      const grouped = new Map();
      const seen = new Set();
      for (const relation of relations) {
        // Some pairs carry the same relation twice, once in each direction.
        const key = `${relation.edge.type}:${relation.other.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (!grouped.has(relation.edge.type)) grouped.set(relation.edge.type, []);
        grouped.get(relation.edge.type).push(relation);
      }
      for (const group of grouped.values()) {
        group.sort((a, b) => b.edge.strength - a.edge.strength || a.other.hsk - b.other.hsk);
      }
      const order = Object.keys(TYPE_LABELS).filter((type) => grouped.has(type));

      detail.innerHTML = `
        <div class="cosmos__detail-word">
          <span class="cosmos__detail-hanzi">${esc(node.hanzi)}</span>
          <div>
            <span class="cosmos__detail-pinyin">${esc(node.pinyin)}</span>
            <h2 class="cosmos__detail-meaning">${esc(node.meaning)}</h2>
          </div>
        </div>
        <div class="cosmos__detail-tags">
          <span class="tag">${esc((CATEGORY_LABELS[node.category] || node.category).toUpperCase())}</span>
          <span class="tag">HSK ${node.hsk}</span>
          <span class="tag">${node.progress.discovered ? "DISCOVERED" : "UNOPENED"}</span>
        </div>
        ${node.example ? `
          <div class="cosmos__example">
            <span class="cn">${esc(node.example)}</span>
            <span class="mono">${esc(node.examplePinyin)}</span>
            <p>${esc(node.exampleEn)}</p>
          </div>` : ""}
        <div class="cosmos__groups">
          ${order.map((type) => `
            <section class="cosmos__group">
              <h3><span style="color:${TYPE_COLORS[type]}">${TYPE_LABELS[type]}</span><span>${grouped.get(type).length}</span></h3>
              ${grouped.get(type).map((relation) => `
                <button class="cosmos__connection" type="button" data-word="${relation.other.id}">
                  <span class="cosmos__connection-hanzi">${esc(relation.other.hanzi)}</span>
                  <span class="cosmos__connection-body">
                    <span>${esc(relation.other.meaning)}</span>
                    ${relation.edge.note ? `<span class="cosmos__connection-note">${esc(relation.edge.note)}</span>` : ""}
                  </span>
                  <span class="cosmos__connection-arrow" aria-hidden="true">→</span>
                </button>`).join("")}
            </section>`).join("")}
        </div>`;
    };

    const select = (id, scroll) => {
      selectedId = id;
      renderList();
      renderDetail();
      if (scroll && window.matchMedia("(max-width: 900px)").matches) {
        detail.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    list.addEventListener("click", (event) => {
      const button = event.target.closest("[data-word]");
      if (button) select(Number(button.dataset.word), true);
    });

    detail.addEventListener("click", (event) => {
      const button = event.target.closest("[data-word]");
      if (button) select(Number(button.dataset.word), true);
    });

    more.addEventListener("click", () => {
      limit += PAGE_SIZE;
      renderList();
    });

    view.querySelectorAll("[data-cat]").forEach((chip) => {
      chip.addEventListener("click", () => {
        category = chip.dataset.cat;
        limit = PAGE_SIZE;
        view.querySelectorAll("[data-cat]").forEach((item) => item.classList.toggle("is-active", item === chip));
        renderList();
      });
    });

    search.addEventListener("input", debounce(() => {
      query = search.value;
      limit = PAGE_SIZE;
      renderList();
    }, 90));

    if (params.word && byId.has(Number(params.word))) selectedId = Number(params.word);
    renderList();
    renderDetail();
  },
};
