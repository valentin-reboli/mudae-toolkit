import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseInvested } from "../../src/js/sphere-advisor/parse.js";
import {
  PLAN,
  SphereState,
  dailyGain,
  groupSteps,
  itemCost,
  nextItem,
  parseItem,
  planFor,
  remainingCost,
  shoppingList,
} from "../../src/js/sphere-advisor/plan.js";

const SHOPS = 4000 * (28 + 55 + 55 + 3); // shop2 to 7, shop9 and shop5 to 10, shop10 to 2

describe("plan", () => {
  it("parses every item", () => {
    assert.equal(PLAN.length, 56);
    assert.deepEqual(parseItem("full x10"), { kind: "full", perk: 0, target: 10 });
    assert.deepEqual(parseItem("shop2 lvl2"), { kind: "shop", perk: 2, target: 2 });
    assert.throws(() => parseItem("op11 x2"));
  });

  it("starts with perk 9 and passes over what waits for characters", () => {
    const state = new SphereState({}, [{ name: "A", mine: true }], 3);
    assert.deepEqual(nextItem(state), parseItem("op9 x10"));
    assert.deepEqual(state.nextBuy(nextItem(state)), ["A", 9]);
    state.mark("A", 9);
    assert.deepEqual(nextItem(state), parseItem("shop2 lvl1"));
    assert.equal(itemCost(nextItem(state), state), 4000);
  });

  it("costs the whole plan like the bot does", () => {
    // perk 9 on 17, perk 10 on 300, perks 5 and 8 on 13, then the rest of 17 (3,000 per maxed perk 1-5)
    const ops = 17000 + 300000 + 13 * 4000 + 13 * (4 * 3000 + 2000) + 4 * (4 * 3000 + 3000 + 3000);
    assert.equal(remainingCost(new SphereState()), ops + SHOPS);
  });

  it("counts only owned characters when asked", () => {
    const state = new SphereState({ A: { 9: 1, 1: 2 } }, [{ name: "A", mine: true }], 3);
    const fullA = 3000 - 600 + 3 * 3000 + 2000;
    assert.equal(remainingCost(state, true), 3 * 1000 + 4000 + fullA + SHOPS);
  });

  it("treats (x5) as maxed", () => {
    const state = new SphereState(
      parseInvested("Rain 20,000 sp - 1 (x5), 2 (x5), 3 (x5), 4 (x5), 5 (x5), 6, 7, 8, 9, 10"),
    );
    assert.ok(state.isFull("Rain"));
  });

  it("buys a full upgrade's cheapest missing perk first", () => {
    const state = new SphereState({ A: { 5: 5, 6: 1, 7: 1, 8: 1, 9: 1, 10: 1, 2: 3 } }, [
      { name: "A", mine: true },
    ]);
    const full = parseItem("full x1");
    assert.deepEqual(state.nextBuy(full), ["A", 1]);
    state.levels.A[1] = 4;
    assert.deepEqual(state.nextBuy(full), ["A", 3]);
  });
});

describe("dailyGain", () => {
  it("gives every chart row's gain, split by cost on shared rows", () => {
    assert.equal(dailyGain(parseItem("op9 x10")), 712);
    assert.equal(dailyGain(parseItem("shop9 lvl1")) + dailyGain(parseItem("op9 x11")), 96);
    assert.equal(dailyGain(parseItem("op8 x6")), 457 / 6);
    assert.equal(dailyGain(parseItem("shop9 lvl8")), null);
    const total = PLAN.reduce((sum, item) => sum + (dailyGain(item) ?? 0), 0);
    assert.ok(Math.abs(total - 13172) < 1e-6);
    assert.equal(PLAN.filter((item) => dailyGain(item) === null).length, 3);
  });
});

describe("starwishes", () => {
  it("get the farm perks first", () => {
    const wishes = [
      { name: "A", mine: true, star: false },
      { name: "B", mine: true, star: true },
      { name: "C", mine: false, star: true },
    ];
    const state = new SphereState({}, wishes, 2);
    assert.deepEqual(state.wl, ["B", "A"]);
    assert.deepEqual(state.nextBuy(parseItem("op9 x10")), ["B", 9]);
  });
});

describe("planFor", () => {
  const items = (difficulty) =>
    planFor(difficulty).map((i) => `${i.kind}${i.perk || ""} ${i.target}`);

  it("keeps the chosen column and every one to its left, in chart order", () => {
    assert.deepEqual(items("easy"), ["op10 100", "op10 200", "op10 300"]);
    assert.equal(planFor("medium").length, 10);
    assert.ok(planFor("medium").every((i) => i.perk === 10 || i.perk === 2));
    // the bot's plan before the Expert rows (EASY_TO_HARD_PLAN in mudae_bot/spheres.py)
    assert.equal(planFor("hard").length, 28);
    assert.deepEqual(items("hard").slice(0, 4), ["op9 10", "shop2 1", "op10 100", "shop9 1"]);
    assert.deepEqual(planFor("expert"), PLAN);
    assert.throws(() => planFor("nightmare"));
  });

  it("buys and costs only the chosen path", () => {
    const state = new SphereState({}, [{ name: "A", mine: true }], 3);
    assert.deepEqual(nextItem(state, planFor("easy")), parseItem("op10 x100"));
    assert.deepEqual(nextItem(state, planFor("medium")), parseItem("shop2 lvl1"));
    const { steps } = shoppingList(state, 1500, planFor("easy"));
    assert.deepEqual(
      steps.map((s) => s.perk),
      [10],
    );
    assert.equal(remainingCost(new SphereState(), false, planFor("easy")), 300000);
    assert.equal(remainingCost(new SphereState(), false, planFor("medium")), 300000 + 4000 * 28);
  });
});

describe("shoppingList", () => {
  it("lists every affordable click and the next one to save for", () => {
    const wishlist = [{ name: "Gojo", mine: true }];
    const state = new SphereState({ Gojo: { 9: 1, 10: 1 } }, wishlist, 1, { 2: 2, 9: 1 });
    const { steps, left, next } = shoppingList(state, 4000);
    // perk 5 levels 1 to 4 (2,000), then perk 5 level 5 costs 1,000
    assert.deepEqual(
      steps.map((s) => [s.name, s.perk, s.level, s.cost]),
      [
        ["Gojo", 5, 1, 200],
        ["Gojo", 5, 2, 400],
        ["Gojo", 5, 3, 600],
        ["Gojo", 5, 4, 800],
        ["Gojo", 5, 5, 1000],
        ["Gojo", 8, undefined, 1000],
      ],
    );
    assert.equal(left, 0);
    assert.deepEqual(next.item, parseItem("shop5 lvl1"));
    assert.equal(groupSteps(steps).length, 2);
  });

  it("groups perk 10 on characters it doesn't know by name", () => {
    const state = new SphereState({}, [], 5, { 2: 1 });
    const { steps } = shoppingList(state, 3000);
    assert.equal(steps.length, 3);
    assert.equal(groupSteps(steps).length, 1);
  });
});
