// The sphere upgrade plan, the same one the mudae-auto-roller alts follow
// (DEFAULT_PLAN in mudae_bot/spheres.py): the upgrade chart, all four columns, top to bottom.
// planFor() keeps the columns up to a chosen difficulty.

export const DEFAULT_PLAN = [
  "op9 x10", "shop2 lvl1", "op10 x100", "shop9 lvl1", "op9 x11", "shop2 lvl2",
  "op5 x6", "op8 x6", "shop5 lvl1", "op5 x10", "op8 x10", "op5 x11", "op8 x11", "shop5 lvl2",
  "shop9 lvl2", "op9 x12", "op5 x12", "op8 x12", "shop2 lvl3", "shop5 lvl3", "op10 x200",
  "shop9 lvl3", "op9 x13", "op5 x13", "op8 x13", "full x10", "full x13", "shop5 lvl4", "shop2 lvl4",
  "shop9 lvl4", "op9 x14", "full x14", "shop5 lvl5", "shop10 lvl1", "shop2 lvl5", "shop5 lvl6",
  "shop5 lvl7", "shop2 lvl6", "op10 x300", "shop9 lvl5", "op9 x15", "full x15", "shop5 lvl8",
  "shop2 lvl7", "shop9 lvl6", "op9 x16", "full x16", "shop5 lvl9", "shop9 lvl7", "op9 x17",
  "full x17", "shop5 lvl10", "shop10 lvl2", "shop9 lvl8", "shop9 lvl9", "shop9 lvl10",
]; // prettier-ignore

// Perks 1-5 have 5 levels ("(x5)" in $mmsz=z! is maxed), perks 6-10 one level at 1,000.
export const LOW_LEVEL_COSTS = [200, 400, 600, 800, 1000];
const LOW_MAX = LOW_LEVEL_COSTS.length;
export const ALL_PERKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// "op10 x100" = perk 10 on 100 characters, "op5 x6" = perk 5 maxed on 6,
// "full x10" = every perk maxed on 10, "shop2 lvl2" = shop perk 2 at level 2
export function parseItem(text) {
  const m = text
    .trim()
    .toLowerCase()
    .match(/^(?:(op|shop)(\d{1,2})\s+(x|lvl)(\d+)|(full)\s+x(\d+))$/);
  if (!m) throw new Error(`bad plan item: ${text}`);
  const item = m[5]
    ? { kind: "full", perk: 0, target: +m[6] }
    : { kind: m[1], perk: +m[2], target: +m[4] };
  const unit = m[5] ? "x" : m[3];
  const perkOk = item.kind === "full" || (item.perk >= 1 && item.perk <= 10);
  const unitOk = unit === (item.kind === "shop" ? "lvl" : "x");
  const targetOk = item.target >= 1 && (item.kind !== "shop" || item.target <= 10);
  if (!perkOk || !unitOk || !targetOk) throw new Error(`bad plan item: ${text}`);
  return item;
}

export const PLAN = DEFAULT_PLAN.map(parseItem);

// The chart's columns, left to right. A path includes its own column and every one to its left.
export const DIFFICULTIES = ["easy", "medium", "hard", "expert"];

// Which column a plan item belongs to: perk 10 (easy), the shop 2 megasphere (medium),
// the perk 9 click farm (hard), and the perk 5+8 farm with full upgrades and shop 5/10 (expert)
export function difficultyOf(item) {
  if (item.kind === "op" && item.perk === 10) return "easy";
  if (item.kind === "shop" && item.perk === 2) return "medium";
  if (item.perk === 9) return "hard";
  return "expert";
}

export function planFor(difficulty) {
  const max = DIFFICULTIES.indexOf(difficulty);
  if (max < 0) throw new Error(`unknown difficulty: ${difficulty}`);
  return PLAN.filter((item) => DIFFICULTIES.indexOf(difficultyOf(item)) <= max);
}

export function describe(item) {
  if (item.kind === "full") return `full upgrade on ${item.target} owned wishlist characters`;
  if (item.kind === "shop") return `shop perk ${item.perk} up to level ${item.target}`;
  const who = item.perk === 10 ? "of your characters" : "owned wishlist characters";
  return `ouroperk ${item.perk} on ${item.target} ${who}`;
}

export const opCost = (perk, level = 0) =>
  perk >= 6 ? 1000 : LOW_LEVEL_COSTS[Math.min(level, LOW_MAX - 1)];
const costToMax = (perk, level = 0) =>
  perk >= 6 ? 1000 : LOW_LEVEL_COSTS.slice(level).reduce((a, b) => a + b, 0);
export const shopCost = (level) => 4000 * level;

// Characters the user owns but whose names we don't know (only counted for perk 10)
export const isUnnamed = (name) => name.startsWith("~other");

export class SphereState {
  // invested: parseInvested(); wishlist: parseWishlist(); shop: { perk: level }
  constructor(invested = {}, wishlist = [], ownedCount = 0, shop = {}) {
    this.done = {}; // name -> Set of perks done
    this.levels = {}; // name -> { perk: level } for perks 1-5 not maxed
    for (const [name, perks] of Object.entries(invested)) {
      this.done[name] = new Set();
      for (const [perk, level] of Object.entries(perks)) {
        if (+perk >= 6 || level >= LOW_MAX) this.done[name].add(+perk);
        else (this.levels[name] ||= {})[perk] = level;
      }
    }
    // Owned wishlist characters: ✅ on $wls, starwishes (⭐) first since they can be rolled every
    // day, then any with perk 9 (a claimed wish may leave the list)
    const mine = wishlist.filter((w) => w.mine);
    const wl = [...mine.filter((w) => w.star), ...mine.filter((w) => !w.star)].map((w) => w.name);
    for (const name of Object.keys(invested)) {
      if (this.has(name, 9) && !wl.includes(name)) wl.push(name);
    }
    this.wl = wl;
    this.owned = [...wl, ...Object.keys(invested).filter((n) => !wl.includes(n))];
    for (let i = this.owned.length; i < ownedCount; i++) this.owned.push(`~other ${i}`);
    this.shop = { ...shop };
  }

  clone() {
    const copy = Object.create(SphereState.prototype);
    copy.done = Object.fromEntries(Object.entries(this.done).map(([k, v]) => [k, new Set(v)]));
    copy.levels = Object.fromEntries(Object.entries(this.levels).map(([k, v]) => [k, { ...v }]));
    copy.wl = [...this.wl];
    copy.owned = [...this.owned];
    copy.shop = { ...this.shop };
    return copy;
  }

  has(name, perk) {
    return Boolean(this.done[name]?.has(perk));
  }

  level(name, perk) {
    return this.levels[name]?.[perk] || 0;
  }

  isFull(name) {
    return ALL_PERKS.every((p) => this.has(name, p));
  }

  // all owned characters for perk 10, the owned wishlist characters for the rest
  pool(perk) {
    return perk === 10 ? this.owned : this.wl;
  }

  // the next character to get this perk (perk 0: a full upgrade)
  candidate(perk) {
    if (perk === 0) return this.pool(0).find((n) => !this.isFull(n)) ?? null;
    return this.pool(perk).find((n) => !this.has(n, perk)) ?? null;
  }

  count(item) {
    if (item.kind === "full") return this.pool(0).filter((n) => this.isFull(n)).length;
    return this.pool(item.perk).filter((n) => this.has(n, item.perk)).length;
  }

  reached(item) {
    if (item.kind === "shop") return (this.shop[item.perk] || 0) >= item.target;
    return this.count(item) >= item.target;
  }

  // an op or full item that needs more characters than the user owns, all of them done
  waiting(item) {
    return item.kind !== "shop" && this.candidate(item.perk) === null;
  }

  // [character, perk] to click next; a full upgrade takes the cheapest missing perk first
  nextBuy(item) {
    const name = this.candidate(item.perk);
    if (name === null) return null;
    if (item.kind === "op") return [name, item.perk];
    const missing = ALL_PERKS.filter((p) => !this.has(name, p));
    const cost = (p) => opCost(p, this.level(name, p));
    missing.sort((a, b) => cost(a) - cost(b) || a - b);
    return [name, missing[0]];
  }

  mark(name, perk) {
    (this.done[name] ||= new Set()).add(perk);
    if (this.levels[name]) delete this.levels[name][perk];
  }
}

export function nextItem(state, plan = PLAN) {
  return plan.find((item) => !state.reached(item) && !state.waiting(item)) ?? null;
}

export function itemCost(item, state) {
  if (item.kind === "shop") return shopCost((state.shop[item.perk] || 0) + 1);
  const [name, perk] = state.nextBuy(item);
  return opCost(perk, state.level(name, perk));
}

// One click toward the item, applied to the state
export function buy(item, state) {
  if (item.kind === "shop") {
    state.shop[item.perk] = (state.shop[item.perk] || 0) + 1;
    return { kind: "shop", perk: item.perk, level: state.shop[item.perk] };
  }
  const [name, perk] = state.nextBuy(item);
  if (perk >= 6) {
    state.mark(name, perk);
    return { kind: "op", name, perk, item };
  }
  const level = state.level(name, perk) + 1;
  if (level >= LOW_MAX) state.mark(name, perk);
  else (state.levels[name] ||= {})[perk] = level;
  return { kind: "op", name, perk, level, item };
}

// Every click affordable with this balance, in plan order, and the one to save up for
export function shoppingList(state, balance, plan = PLAN) {
  const sim = state.clone();
  let left = balance;
  const steps = [];
  for (let i = 0; i < 5000; i++) {
    const item = nextItem(sim, plan);
    if (!item) return { steps, left, next: null, sim };
    const cost = itemCost(item, sim);
    if (cost > left) {
      const target = item.kind === "shop" ? null : sim.nextBuy(item);
      return { steps, left, next: { item, cost, target }, sim };
    }
    left -= cost;
    steps.push({ ...buy(item, sim), cost });
  }
  return { steps, left, next: null, sim };
}

// Spheres still needed for the whole plan. reachable: only with the characters owned now;
// otherwise characters claimed later count as fresh ones.
export function remainingCost(state, reachable = false, plan = PLAN) {
  let total = 0;
  const shop = { ...state.shop };
  const done = Object.fromEntries(Object.entries(state.done).map(([k, v]) => [k, new Set(v)]));
  const pool = (perk, size) => {
    const names = state.pool(perk);
    if (reachable || names.length >= size) return names.slice(0, size);
    const extra = Array.from({ length: size - names.length }, (_, i) => `#${state.wl.length + i}`);
    return names.concat(extra);
  };
  const finish = (name, perk) => {
    const have = (done[name] ||= new Set());
    if (have.has(perk)) return 0;
    have.add(perk);
    return costToMax(perk, state.level(name, perk));
  };
  for (const item of plan) {
    if (item.kind === "shop") {
      const level = shop[item.perk] || 0;
      for (let lv = level + 1; lv <= item.target; lv++) total += shopCost(lv);
      shop[item.perk] = Math.max(level, item.target);
      continue;
    }
    if (item.kind === "full") {
      for (const name of pool(0, item.target)) for (const p of ALL_PERKS) total += finish(name, p);
      continue;
    }
    const size = state.pool(item.perk).length + item.target;
    const names = reachable ? state.pool(item.perk) : pool(item.perk, size);
    let have = names.filter((n) => done[n]?.has(item.perk)).length;
    for (const name of names) {
      if (have >= item.target) break;
      const cost = finish(name, item.perk);
      if (cost) {
        total += cost;
        have++;
      }
    }
  }
  return total;
}

// Consecutive clicks on the same thing become one line: levels of one perk on one character,
// levels of one shop perk, or perk 10 on characters we don't know by name
export function groupSteps(steps) {
  const groups = [];
  for (const step of steps) {
    const last = groups.at(-1);
    const prev = last?.[0];
    const same =
      prev?.kind === step.kind &&
      (step.kind === "shop"
        ? prev.perk === step.perk
        : (isUnnamed(step.name) && isUnnamed(prev.name)) ||
          (prev.name === step.name && prev.perk === step.perk && step.perk < 6));
    if (same) last.push(step);
    else groups.push([step]);
  }
  return groups;
}
