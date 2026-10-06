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
    assert.equal(resolveColor(undefined, "Vibrant"), null);
  });

  it("returns the image color directly for image choices", () => {
    assert.equal(resolveColor({ Muted: "#123456" }, "Muted"), "#123456");
  });

  it("falls back to another image color when the chosen one is missing", () => {
    assert.equal(resolveColor({ Dominant: "#123456" }, "LightVibrant"), "#123456");
  });

  it("builds harmonies from the vibrant color", () => {
    assert.equal(resolveColor({ Vibrant: "#ff0000" }, "Complementary"), "#00ffff");
  });

  it("uses the dominant color when there is no vibrant one", () => {
    assert.equal(resolveColor({ Dominant: "#ff0000" }, "Complementary"), "#00ffff");
  });

  it("falls back to the default choice for unknown ids", () => {
    assert.equal(resolveColor({ Vibrant: "#ff0000" }, "Nope"), "#ff0000");
  });

  it("returns null when the image produced no colors", () => {
    assert.equal(resolveColor({}, "Tint"), null);
  });
});
