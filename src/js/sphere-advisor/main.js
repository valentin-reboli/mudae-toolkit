import { parseInvested, parseShop, parseWishlist } from "./parse.js";
import { PATHS } from "./paths.js";
import {
  ALL_PERKS,
  DIFFICULTIES,
  LOW_LEVEL_COSTS,
  SphereState,
  dailyGain,
  describe,
  groupSteps,
  isUnnamed,
  nextItem,
  planFor,
  remainingCost,
  shoppingList,
} from "./plan.js";
import { byId, escapeHtml } from "../utils/dom.js";
import { readSetting, writeSetting } from "../utils/storage.js";

const INPUT_KEY = "sphere-advisor:inputs";
const PATH_KEY = "sphere-advisor:path";
const FIELDS = ["mmsz", "shop", "wl", "balance", "owned", "rate"];
const SHOP_FIELDS = ALL_PERKS.map((p) => `shop${p}`);
const fmt = (n) => Math.round(n).toLocaleString("en-US");

function days(d) {
  if (d < 1) return "under a day";
  if (d < 2) return "about 1 day";
  if (d < 60) return `about ${Math.round(d)} days`;
  return d < 730 ? `about ${Math.round(d / 30)} months` : `about ${(d / 365).toFixed(1)} years`;
}

let path = DIFFICULTIES.includes(readSetting(PATH_KEY, "")) ? readSetting(PATH_KEY, "") : "expert";
let plan = planFor(path);

byId("paths").innerHTML = PATHS.map(
  (p, i) => `<label class="path" data-path="${p.id}">
    <input type="radio" name="path" value="${p.id}" />
    <span class="path-top">
      <span class="path-name">${p.name}</span>
      <span class="path-rec-tag">Recommended</span>
      <span class="path-radio" aria-hidden="true"></span>
    </span>
    <span class="path-meter" aria-label="Difficulty ${i + 1} of ${PATHS.length}">${PATHS.map(
      (_, j) => `<i class="${j <= i ? "on" : ""}"></i>`,
    ).join("")}</span>
    <span class="path-farm">${p.farm}</span>
    <span class="path-label">Select if:</span>
    <ul class="path-reqs">${p.requires.map((r) => `<li>${r}</li>`).join("")}</ul>
    <span class="path-status"></span>
  </label>`,
).join("");

const WL_HINTS = {
  easy: "Not needed on the Easy path: ouroperk 10 goes on any character you own.",
  medium: "Not needed on the Medium path: ouroperk 10 goes on any character you own.",
  hard: "Owned wishlist characters get ouroperk 9, starwishes (⭐) first.",
  expert:
    "Owned wishlist characters get ouroperks 9, 5 and 8, starwishes (⭐) first, and later they get full upgrades.",
};

function showPath() {
  const index = DIFFICULTIES.indexOf(path);
  const chosen = PATHS[index];
  for (const el of byId("paths").querySelectorAll(".path")) {
    const i = DIFFICULTIES.indexOf(el.dataset.path);
    el.classList.toggle("chosen", i === index);
    el.classList.toggle("included", i < index);
    el.querySelector("input").checked = i === index;
    el.querySelector(".path-status").textContent =
      i === index ? "Your path" : i < index ? "Included" : "Not included";
  }
  byId("path-summary").innerHTML = `Your plan follows ${PATHS.slice(0, index + 1)
    .map((q) => `<span class="chip">${q.name}</span>`)
    .join('<span class="arrow">→</span>')}<span class="count">${plan.length} steps</span>`;
  byId("path-notes").hidden = !chosen.notes.length;
  byId("path-notes").innerHTML =
    `<summary>More about the ${chosen.name} path</summary><div class="notes-body">${chosen.notes
      .map((n) => `<p>${n}</p>`)
      .join("")}</div>`;
  byId("wl-hint").textContent = WL_HINTS[path];
  byId("plan-path").textContent = `${chosen.name} path`;
}

byId("shop-levels").innerHTML = ALL_PERKS.map(
  (p) => `<label>shop perk ${p}<input type="number" min="0" max="10" id="shop${p}" /></label>`,
).join("");

function save() {
  const values = Object.fromEntries([...FIELDS, ...SHOP_FIELDS].map((f) => [f, byId(f).value]));
  writeSetting(INPUT_KEY, JSON.stringify(values));
}

function load() {
  try {
    const values = JSON.parse(readSetting(INPUT_KEY, "{}"));
    for (const [field, value] of Object.entries(values)) if (byId(field)) byId(field).value = value;
    // the saved levels and balance may have been edited by hand after the paste
    byId("shop").dataset.last = byId("shop").value;
  } catch {
    // nothing saved, or saved by an older version
  }
}

function setStatus(id, text, ok) {
  byId(id).textContent = text;
  byId(id).classList.toggle("bad", !ok);
}

function readInputs() {
  const mmszText = byId("mmsz").value;
  const invested = parseInvested(mmszText);
  const count = Object.keys(invested).length;
  if (!mmszText.trim()) setStatus("mmsz-status", "", true);
  else if (count)
    setStatus(
      "mmsz-status",
      `✓ ${count} character${count === 1 ? "" : "s"} with spheres in them`,
      true,
    );
  else if (/harem/i.test(mmszText)) setStatus("mmsz-status", "✓ no characters with spheres", true);
  else setStatus("mmsz-status", "No character line found. Paste the DM as it is.", false);

  const shopText = byId("shop").value;
  const shopRead = parseShop(shopText);
  const changed = byId("shop").dataset.last !== shopText;
  byId("shop").dataset.last = shopText;
  if (changed && shopRead.levels.length) {
    shopRead.levels.forEach((level, i) => (byId(`shop${i + 1}`).value = level));
  }
  if (changed && shopRead.balance !== null) byId("balance").value = shopRead.balance;
  if (!shopText.trim()) setStatus("shop-status", "", true);
  else if (shopRead.levels.length >= 10) {
    const balance = shopRead.balance === null ? "" : `, ${fmt(shopRead.balance)} spheres`;
    setStatus("shop-status", `✓ levels read${balance}`, true);
  } else {
    setStatus(
      "shop-status",
      `Read ${shopRead.levels.length} of 10 levels. Check them below.`,
      false,
    );
  }
  const shop = Object.fromEntries(
    ALL_PERKS.map((p) => [p, Math.min(10, Math.max(0, +byId(`shop${p}`).value || 0))]),
  );

  const wlText = byId("wl").value;
  const wishlist = parseWishlist(wlText);
  const owned = wishlist.some((w) => w.mine);
  if (!wlText.trim()) setStatus("wl-status", "", true);
  else if (owned) setStatus("wl-status", `✓ ${wishlist.length} wishes read`, true);
  else setStatus("wl-status", `${wishlist.length} wishes read, none marked ✅`, false);

  const started = mmszText.trim() || shopText.trim() || byId("shop1").value;
  return {
    started,
    state: new SphereState(invested, wishlist, +byId("owned").value || 0, shop),
    balance: +byId("balance").value || 0,
    rate: +byId("rate").value || 0,
  };
}

function stepLine(group) {
  const first = group[0];
  const n = group.length;
  const cost = `<span class="muted">· ${fmt(group.reduce((sum, s) => sum + s.cost, 0))} spheres</span>`;
  if (first.kind === "shop") {
    const times = n > 1 ? ` ${n} times` : "";
    return `Send <code>$shop</code>, then click <b>shop perk ${first.perk}</b>${times} (to level ${group.at(-1).level}) ${cost}`;
  }
  if (isUnnamed(first.name)) {
    const who = `${n} more character${n > 1 ? "s" : ""}`;
    return `<b>Ouroperk 10 on ${who}</b> without it: send <code>$opz-10z+</code> (it lists your characters without ouroperk 10), pick one, then click <b>ouroperk 10</b> ${cost}`;
  }
  return `Send <code>$opp ${escapeHtml(first.name)}</code>, then click ${clicks(group)} ${cost}`;
}

// "ouroperk 9", "ouroperk 5 5 times (level 0 → MAX)", ... for one character's clicks
function clicks(steps) {
  const parts = [];
  // a full upgrade takes levels of several perks in turn; one entry per perk reads better
  for (const step of steps) {
    const same = parts.find((part) => part.perk === step.perk);
    if (same) same.steps.push(step);
    else parts.push({ perk: step.perk, steps: [step] });
  }
  const text = parts.map(({ perk, steps: done }) => {
    const label = `<b>ouroperk ${perk}</b>`;
    if (perk >= 6) return label;
    const n = done.length;
    const to = done.at(-1).level;
    const end = to >= LOW_LEVEL_COSTS.length ? "MAX" : to;
    return `${label}${n > 1 ? ` ${n} times` : ""} (level ${to - n} → ${end})`;
  });
  const full = steps.some((step) => step.item.kind === "full")
    ? ' <span class="muted">(full upgrade)</span>'
    : "";
  return (text.length > 1 ? `${text.slice(0, -1).join(", ")} and ${text.at(-1)}` : text[0]) + full;
}

// One line per character: every click on it in a row needs a single $opp
function lines(steps) {
  const out = [];
  for (const group of groupSteps(steps)) {
    const prev = out.at(-1)?.[0];
    const named = group[0].kind === "op" && !isUnnamed(group[0].name);
    if (named && prev?.kind === "op" && prev.name === group[0].name) out.at(-1).push(...group);
    else out.push([...group]);
  }
  return out;
}

function renderResult({ state, balance, rate }) {
  const { steps, left, next, sim } = shoppingList(state, balance, plan);
  let html = "<h2>What to buy</h2>";
  if (steps.length) {
    const count = `${steps.length} upgrade${steps.length > 1 ? "s" : ""}`;
    html += `<div class="summary">You can buy <b>${count}</b> now for <b>${fmt(balance - left)}</b> spheres. In this order:</div>`;
    html += `<ol class="buys">${lines(steps)
      .map((g) => `<li>${stepLine(g)}</li>`)
      .join("")}</ol>`;
  }
  if (next) {
    let what;
    let how;
    if (next.item.kind === "shop") {
      what = `shop perk ${next.item.perk} level ${(sim.shop[next.item.perk] || 0) + 1}`;
      how = `send <code>$shop</code>, then click <b>shop perk ${next.item.perk}</b>`;
    } else {
      const [name, perk] = next.target;
      const level = perk < 6 ? ` level ${sim.level(name, perk) + 1}` : "";
      const who = isUnnamed(name) ? "another character" : escapeHtml(name);
      const full = next.item.kind === "full" ? " (full upgrade)" : "";
      what = `ouroperk ${perk}${level} on ${who}${full}`;
      how = isUnnamed(name)
        ? `send <code>$opz-10z+</code> (it lists your characters without ouroperk 10), pick one, then click <b>ouroperk ${perk}</b>`
        : `send <code>$opp ${escapeHtml(name)}</code>, then click <b>ouroperk ${perk}</b>`;
    }
    const short = next.cost - left;
    const eta = rate ? ` · ${days(short / rate)}` : "";
    html += `<div class="save">${steps.length ? "Then save up" : "Save up"} for <b>${what}</b>: ${fmt(next.cost)} spheres.
      <div>When you have it: ${how}.</div>
      <div class="muted">${fmt(left)} / ${fmt(next.cost)} · ${fmt(short)} to go${eta}</div>
      <div class="bar"><i style="width:${Math.min(100, (left / next.cost) * 100)}%"></i></div></div>`;
  } else {
    const waiting = plan.find((item) => !sim.reached(item));
    html += waiting
      ? `<div class="done">Everything you can buy is done. Next waits for more characters: <b>${describe(waiting)}</b>.</div>`
      : `<div class="done">✅ The whole ${PATHS[DIFFICULTIES.indexOf(path)].name} path is done.</div>`;
  }

  const total = remainingCost(state, false, plan);
  const now = remainingCost(state, true, plan);
  const reached = plan.filter((item) => state.reached(item)).length;
  const eta = rate && now > balance ? ` (${days((now - balance) / rate)})` : "";
  html += `<h2 style="margin-top:18px">Progress</h2>
    <div class="muted">${reached} of ${plan.length} plan steps done</div>
    <div class="bar"><i style="width:${(reached / plan.length) * 100}%"></i></div>
    <p class="muted">${fmt(now)} spheres for everything you can buy with the characters you own now${eta}.
    ${total > now ? `${fmt(total - now)} more as you get more characters.` : ""}</p>`;
  if (!byId("owned").value) {
    html += `<p class="muted">Enter how many characters you own (step 4) so ouroperk 10 counts them all.</p>`;
  }
  byId("result").innerHTML = html;
}

// One plan step: what to upgrade, and on how many characters or up to which level
function stepParts(item) {
  if (item.kind === "shop") return [`Shop perk ${item.perk}`, `up to level ${item.target}`];
  const what = item.kind === "full" ? "Full upgrade" : `Ouroperk ${item.perk}`;
  const who = item.perk === 10 ? "of your characters" : "owned wishlist characters";
  return [what, `on ${item.target} ${who}`];
}

function renderPlan(state) {
  const current = state ? nextItem(state, plan) : null;
  byId("plan").innerHTML = plan
    .map((item, i) => {
      const [what, target] = stepParts(item);
      let cls = "";
      let status = "";
      if (state?.reached(item)) {
        cls = "reached";
        status = "✓";
      } else if (item === current) {
        cls = "current";
        status = '<span class="pill">next</span>';
      } else if (state?.waiting(item)) {
        cls = "waiting";
        status = `<span title="Waits until you claim more characters">${state.count(item)} of ${item.target} · waits</span>`;
      } else if (state && item.kind === "shop") {
        status = `now level ${state.shop[item.perk] || 0}`;
      } else if (state) {
        status = `${state.count(item)} of ${item.target} done`;
      }
      const gain = dailyGain(item);
      const daily = gain === null ? "" : `+${fmt(gain)}/day`;
      return `<li class="${cls}"><span class="n">${i + 1}</span><span class="what">${what} <span class="target">${target}</span></span><span class="gain">${daily}</span><span class="status">${status}</span></li>`;
    })
    .join("");
  // bring the next step into view when it changes, without moving the page
  const key = `${path}:${current ? plan.indexOf(current) : -1}`;
  if (key !== lastShown) {
    lastShown = key;
    const box = byId("plan-scroll");
    const li = byId("plan").querySelector(".current");
    box.scrollTop = li ? li.offsetTop - box.clientHeight / 3 : 0;
  }
  updateScrollCue();
}

let lastShown = "";

// fades and a "scroll" line while there are steps out of view
function updateScrollCue() {
  const box = byId("plan-scroll");
  const above = box.scrollTop > 2;
  const below = box.scrollTop + box.clientHeight < box.scrollHeight - 2;
  box.classList.toggle("more-above", above);
  box.classList.toggle("more-below", below);
  byId("plan-more").hidden = !(above || below);
  byId("plan-more").textContent = below
    ? `↓ Scroll for more · ${plan.length} steps in all`
    : `↑ Scroll up for earlier steps · ${plan.length} steps in all`;
}

// Hard needs 10+ characters you can roll every day: the owned wishlist characters on $wls.
// Medium otherwise; Expert's keys and $kt level aren't in any paste, and Easy is part of Medium.
const HARD_MIN = 10;

function showRecommended(state) {
  const owned = state.wl.length;
  const rec = owned >= HARD_MIN ? "hard" : "medium";
  for (const el of byId("paths").querySelectorAll(".path")) {
    el.classList.toggle("recommended", el.dataset.path === rec);
  }
  let why;
  if (rec === "hard") {
    why = `<b>Hard</b> is recommended: you own ${owned} wishlist characters, and it needs ${HARD_MIN}+ you can roll every day.`;
  } else if (!byId("wl").value.trim()) {
    why = `<b>Medium</b> is recommended for most players. Paste <code>$wls</code> below to check if you qualify for Hard.`;
  } else {
    why = `<b>Medium</b> is recommended: you own ${owned} wishlist character${owned === 1 ? "" : "s"}, and Hard needs ${HARD_MIN}+.`;
  }
  byId("path-rec").innerHTML =
    `${why} Expert can't be checked from the pastes, so pick it yourself if you meet its requirements.`;
}

function render() {
  const inputs = readInputs();
  save();
  showRecommended(inputs.state);
  if (!inputs.started) {
    byId("result").innerHTML =
      '<h2>What to buy</h2><p class="muted">Paste at least <code>$mmsz=z!</code> and <code>$shop</code> to start.</p>';
    renderPlan(null);
    return;
  }
  renderResult(inputs);
  renderPlan(inputs.state);
}

load();
showPath();
byId("plan-scroll").addEventListener("scroll", updateScrollCue, { passive: true });
window.addEventListener("resize", updateScrollCue);
byId("paths").addEventListener("change", (event) => {
  path = event.target.value;
  plan = planFor(path);
  writeSetting(PATH_KEY, path);
  showPath();
  render();
});
for (const field of [...FIELDS, ...SHOP_FIELDS]) byId(field).addEventListener("input", render);
byId("clear").addEventListener("click", () => {
  for (const field of [...FIELDS, ...SHOP_FIELDS]) byId(field).value = "";
  render();
});
render();
