import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseInvested, parseShop, parseWishlist } from "../../src/js/sphere-advisor/parse.js";

const MMSZ = `2beat's harem

Total invested: 202,800

Rain Carradine 20,000 sp - 1 (x5), 2 (x5), 3 (x5), 4 (x5), 5 (x5), 6, 7, 8, 9, 10
Kirby 17,000 :sp: - 1 (x5), 3 (x5), 4 (x5), 5 (x5), 6, 7, 8, 9, 10
2B 5,200 sp - 4, 5 (x5), 9, 10
Loki (Loki Laufeyson) 1,000 sp - 10`;

describe("parseInvested", () => {
  it("reads every character's perks and levels", () => {
    const invested = parseInvested(MMSZ);
    assert.deepEqual(Object.keys(invested), [
      "Rain Carradine",
      "Kirby",
      "2B",
      "Loki (Loki Laufeyson)",
    ]);
    assert.deepEqual(invested["2B"], { 4: 1, 5: 5, 9: 1, 10: 1 });
    assert.equal(invested.Kirby[2], undefined);
  });

  it("reads the raw markdown with custom emoji", () => {
    const invested = parseInvested("**Gojo** 1,000 <:sp:1437140700604137554> - 9");
    assert.deepEqual(invested, { Gojo: { 9: 1 } });
  });
});

describe("parseShop", () => {
  it("reads levels in order and the balance", () => {
    const text = "You have 1,035 :sp:\n[LVL 2]  a\n[MAX]  b\n[**LVL 0**]  c";
    assert.deepEqual(parseShop(text), { levels: [2, 10, 0], balance: 1035 });
  });
});

describe("parseWishlist", () => {
  it("marks the owned wishes and keeps names as Discord shows them", () => {
    assert.deepEqual(
      parseWishlist("Satoru Gojo ✅ ⭐\nRoronoa Zoro\n+\\L.L./+\nNaruto Uzumaki ✅"),
      [
        { name: "Satoru Gojo", mine: true, star: true },
        { name: "Roronoa Zoro", mine: false, star: false },
        { name: "+\\L.L./+", mine: false, star: false },
        { name: "Naruto Uzumaki", mine: true, star: false },
      ],
    );
  });

  it("unescapes names pasted as markdown", () => {
    assert.deepEqual(parseWishlist("**+\\\\L.L./+** ✅"), [
      { name: "+\\L.L./+", mine: true, star: false },
    ]);
  });
});
