import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CHOICE_GROUPS,
  DEFAULT_CHOICE_ID,
  IMAGE_COLOR_KEYS,
  isKnownChoice,
  resolveColor,
} from "../../src/js/embed-color/choices.js";

const allChoices = CHOICE_GROUPS.flatMap((group) => group.choices);
const fullColors = Object.fromEntries(IMAGE_COLOR_KEYS.map((key) => [key, "#bd41a4"]));

describe("CHOICE_GROUPS", () => {
  it("has unique ids", () => {
    const ids = allChoices.map((choice) => choice.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("gives every choice a label and description", () => {
    for (const choice of allChoices) {
      assert.ok(choice.label, choice.id);
      assert.ok(choice.description, choice.id);
    }
  });

  it("includes the default choice", () => {
    assert.ok(isKnownChoice(DEFAULT_CHOICE_ID));
  });

  it("produces a valid hex for every choice", () => {
    for (const choice of allChoices) {
      assert.match(resolveColor(fullColors, choice.id), /^#[0-9a-f]{6}$/, choice.id);
    }
  });
});

describe("resolveColor", () => {
  it("returns null before an image is analyzed", () => {
    assert.equal(resolveColor(undefined, "Accent"), null);
  });

  it("returns the image color directly for image choices", () => {
    assert.equal(resolveColor({ Dark: "#123456" }, "Dark"), "#123456");
  });

  it("falls back to the main color when the chosen one is missing", () => {
    assert.equal(resolveColor({ Main: "#123456", Light: "#eeeeee" }, "Secondary"), "#123456");
  });

  it("builds harmonies from the accent color", () => {
    assert.equal(resolveColor({ Accent: "#ff0000", Main: "#00ff00" }, "Complementary"), "#00ffff");
  });

  it("uses the main color when there is no accent", () => {
    assert.equal(resolveColor({ Main: "#ff0000" }, "Complementary"), "#00ffff");
  });

  it("falls back to the default choice for unknown ids", () => {
    assert.equal(resolveColor({ Accent: "#ff0000" }, "Vibrant"), "#ff0000");
  });

  it("returns null when the image produced no colors", () => {
    assert.equal(resolveColor({}, "Tint"), null);
  });
});
