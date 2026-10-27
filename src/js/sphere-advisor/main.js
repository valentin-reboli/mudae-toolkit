import { parseInvested, parseShop, parseWishlist } from "./parse.js";
import {
  ALL_PERKS,
  LOW_LEVEL_COSTS,
  PLAN,
  SphereState,
  describe,
  groupSteps,
  isUnnamed,
  nextItem,
  remainingCost,
  shoppingList,
} from "./plan.js";
import { byId, escapeHtml } from "../utils/dom.js";
import { readSetting, writeSetting } from "../utils/storage.js";

const INPUT_KEY = "sphere-advisor:inputs";
const FIELDS = ["mmsz", "shop", "wl", "balance", "owned", "rate"];
const SHOP_FIELDS = ALL_PERKS.map((p) => `shop${p}`);
const PERK_NAMES = {
  1: "wishlist spawn",
  2: "kakera value",
  3: "+1 kakera button",
  4: "keys",
  5: "spheres per kakera",
  6: "wish spawn",
  7: "chaos kakera",
  8: "4 kakera buttons",
  9: "sphere button",
  10: "first $oh",
};

const fmt = (n) => Math.round(n).toLocaleString("en-US");

function days(d) {
  if (d < 1) return "under a day";
  if (d < 2) return "about 1 day";
  if (d < 60) return `about ${Math.round(d)} days`;
  return d < 730 ? `about ${Math.round(d / 30)} months` : `about ${(d / 365).toFixed(1)} years`;
}

byId("shop-levels").innerHTML = ALL_PERKS.map(
  (p) => `<label>shop ${p}<input type="number" min="0" max="10" id="shop${p}" /></label>`,
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
  else if (count) setStatus("mmsz-status", `✓ ${count} characters with spheres in them`, true);
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
  const mine = wishlist.filter((w) => w.mine).map((w) => w.name);
  if (!wlText.trim()) setStatus("wl-status", "", true);
  else if (mine.length) {
    setStatus("wl-status", `✓ ${wishlist.length} wishes, you own ${mine.join(", ")}`, true);
  } else setStatus("wl-status", `${wishlist.length} wishes, none marked ✅`, false);

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
    return `<code>$shop</code> → click <b>shop ${first.perk}</b>${times} (to level ${group.at(-1).level}) ${cost}`;
  }
  if (isUnnamed(first.name)) {
    const who = `${n} more character${n > 1 ? "s" : ""}`;
    return `<b>Perk 10 on ${who}</b> without it: <code>$op</code>, pick one, click <b>perk 10</b> ${cost}`;
  }
  const full = first.item.kind === "full" ? ' <span class="muted">(full upgrade)</span>' : "";
  const last = group.at(-1).level;
  const what =
    first.perk >= 6
      ? `click <b>perk ${first.perk}</b>`
      : `click <b>perk ${first.perk}</b> ${n} time${n > 1 ? "s" : ""} (level ${last - n} → ${last >= LOW_LEVEL_COSTS.length ? "MAX" : last})`;
  return `<code>$opp ${escapeHtml(first.name)}</code> → ${what}${full} ${cost}`;
}

function renderResult({ state, balance, rate }) {
  const { steps, left, next, sim } = shoppingList(state, balance);
  let html = "<h2>What to buy</h2>";
  if (steps.length) {
    const count = `${steps.length} upgrade${steps.length > 1 ? "s" : ""}`;
    html += `<div class="summary">You can buy <b>${count}</b> now for <b>${fmt(balance - left)}</b> spheres. In this order:</div>`;
    html += `<ol class="buys">${groupSteps(steps)
      .map((g) => `<li>${stepLine(g)}</li>`)
      .join("")}</ol>`;
    html += `<p class="muted">Mudae shows no confirmation: the button changes price or says MAX. Paste a fresh <code>$mmsz=z!</code> and <code>$shop</code> afterwards to check.</p>`;
  }
  if (next) {
    let what;
    if (next.item.kind === "shop") {
      what = `shop ${next.item.perk} level ${(sim.shop[next.item.perk] || 0) + 1}`;
    } else {
      const [name, perk] = next.target;
      const level = perk < 6 ? ` level ${sim.level(name, perk) + 1}` : "";
      const who = isUnnamed(name) ? "another character" : escapeHtml(name);
      const full = next.item.kind === "full" ? " (full upgrade)" : "";
      what = `perk ${perk}${level} on ${who}${full}`;
    }
    const short = next.cost - left;
    const eta = rate ? ` · ${days(short / rate)}` : "";
    html += `<div class="save">${steps.length ? "Then save up" : "Save up"} for <b>${what}</b>: ${fmt(next.cost)} spheres.
      <div class="muted">${fmt(left)} / ${fmt(next.cost)} · ${fmt(short)} to go${eta}</div>
      <div class="bar"><i style="width:${Math.min(100, (left / next.cost) * 100)}%"></i></div></div>`;
  } else {
    const waiting = PLAN.find((item) => !sim.reached(item));
    html += waiting
      ? `<div class="done">Everything you can buy is done. Next waits for more characters: <b>${describe(waiting)}</b>.</div>`
      : `<div class="done">✅ The whole plan is done.</div>`;
  }

  const total = remainingCost(state);
  const now = remainingCost(state, true);
  const reached = PLAN.filter((item) => state.reached(item)).length;
  const eta = rate && now > balance ? ` (${days((now - balance) / rate)})` : "";
  html += `<h2 style="margin-top:18px">Progress</h2>
    <div class="muted">${reached} of ${PLAN.length} plan steps done</div>
    <div class="bar"><i style="width:${(reached / PLAN.length) * 100}%"></i></div>
    <p class="muted">${fmt(now)} spheres for everything you can buy with the characters you own now${eta}.
    ${total > now ? `${fmt(total - now)} more as you claim wishlist characters (perk 9 and full upgrades go up to 17 of them).` : ""}</p>`;
  if (!byId("owned").value) {
    html += `<p class="muted">Enter how many characters you own (step 4) so perk 10 counts them all.</p>`;
  }
  byId("result").innerHTML = html;
}

function renderCharacters(state) {
  if (!state.wl.length) {
    byId("characters").innerHTML = `<h2>Wishlist characters</h2>
      <p class="muted">Paste <code>$wl</code> (step 3) to see the characters that get perks 9, 5, 8 and full upgrades.</p>`;
    return;
  }
  const cell = (name, p) => {
    if (state.has(name, p)) return '<td class="p ok">✓</td>';
    const level = state.level(name, p);
    return level ? `<td class="p part">${level}</td>` : '<td class="p no">·</td>';
  };
  const head = ALL_PERKS.map((p) => `<th class="p" title="${PERK_NAMES[p]}">${p}</th>`).join("");
  const rows = state.wl
    .map((name, i) => {
      const cells = ALL_PERKS.map((p) => cell(name, p)).join("");
      return `<tr><td>${i + 1}. ${escapeHtml(name)}</td>${cells}</tr>`;
    })
    .join("");
  const perk10 = state.owned.filter((n) => state.has(n, 10)).length;
  byId("characters").innerHTML = `<h2>Wishlist characters</h2>
    <p class="hint">In upgrade order. ✓ done; a number is the level of a perk 1-5 not maxed yet.</p>
    <div style="overflow-x:auto"><table class="perks"><tr><th>Character</th>${head}</tr>${rows}</table></div>
    <p class="muted">Perk 10 on ${perk10} of ${state.owned.length} characters you own.</p>`;
}

function renderPlan(state) {
  const current = state ? nextItem(state) : null;
  byId("plan").innerHTML = PLAN.map((item) => {
    let cls = "";
    if (state?.reached(item)) cls = "reached";
    else if (item === current) cls = "current";
    else if (state?.waiting(item)) cls = "waiting";
    const mark = { reached: "✓ ", current: "▸ ", waiting: "… " }[cls] ?? "";
    const have =
      state && item.kind !== "shop" && cls !== "reached" ? ` (${state.count(item)})` : "";
    return `<li class="${cls}">${mark}${describe(item)}${have}</li>`;
  }).join("");
}

function render() {
  const inputs = readInputs();
  save();
  if (!inputs.started) {
    byId("result").innerHTML =
      '<h2>What to buy</h2><p class="muted">Paste at least <code>$mmsz=z!</code> and <code>$shop</code> to start.</p>';
    byId("characters").innerHTML = "";
    renderPlan(null);
    return;
  }
  renderResult(inputs);
  renderCharacters(inputs.state);
  renderPlan(inputs.state);
}

load();
for (const field of [...FIELDS, ...SHOP_FIELDS]) byId(field).addEventListener("input", render);
byId("clear").addEventListener("click", () => {
  for (const field of [...FIELDS, ...SHOP_FIELDS]) byId(field).value = "";
  render();
});
render();
