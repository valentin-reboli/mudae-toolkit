import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { pickImageColors } from "../../src/js/embed-color/palette.js";

const repeat = (pixel, count) => Array.from({ length: count }, () => pixel);

describe("pickImageColors", () => {
  // mostly dull blue, a smaller patch of bright red, a little white
  const pixels = [
    ...repeat([60, 70, 110], 60),
    ...repeat([230, 20, 30], 25),
    ...repeat([235, 235, 230], 15),
  ];

  it("picks the vivid color as the accent even if it's not the biggest", () => {
    assert.equal(pickImageColors(pixels).Accent, "#e6141e");
  });

  it("picks the biggest color as main", () => {
    assert.equal(pickImageColors(pixels).Main, "#3c466e");
  });

  it("picks a clearly different color as secondary", () => {
    assert.equal(pickImageColors(pixels).Secondary, "#e6141e");
  });

  it("picks the lightest and darkest colors", () => {
    const colors = pickImageColors(pixels);
    assert.equal(colors.Light, "#ebebe6");
    assert.equal(colors.Dark, "#3c466e");
  });

  it("ignores tiny specks for accent", () => {
    const colors = pickImageColors([...repeat([90, 90, 100], 99), [255, 0, 0]]);
    assert.notEqual(colors.Accent, "#ff0000");
  });

  it("uses the edges as background and skips it for the character color", () => {
    const green = [40, 160, 60];
    const purple = [120, 50, 160];
    const colors = pickImageColors(
      [...repeat(green, 70), ...repeat(purple, 30)],
      repeat(green, 40),
    );
    assert.equal(colors.Background, "#28a03c");
    assert.equal(colors.Main, "#28a03c");
    assert.equal(colors.Character, "#7832a0");
  });

  it("has no secondary color for a single-color image", () => {
    assert.equal(pickImageColors(repeat([10, 120, 200], 50)).Secondary, undefined);
  });

  it("returns nothing for an empty image", () => {
    assert.deepEqual(pickImageColors([]), {});
  });
});
