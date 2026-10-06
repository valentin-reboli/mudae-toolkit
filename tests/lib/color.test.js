import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BLACK,
  WHITE,
  hexToRgb,
  hslToRgb,
  mix,
  normalizeHex,
  readableTextColor,
  rgbToHex,
  rgbToHsl,
  rotateHue,
} from "../../src/js/lib/color.js";

describe("normalizeHex", () => {
  it("accepts 6-digit hex with or without #", () => {
    assert.equal(normalizeHex("#AABBCC"), "#aabbcc");
    assert.equal(normalizeHex("aabbcc"), "#aabbcc");
  });

  it("expands 3-digit hex", () => {
    assert.equal(normalizeHex("#abc"), "#aabbcc");
  });

  it("rejects invalid input", () => {
    assert.equal(normalizeHex("#12345"), null);
    assert.equal(normalizeHex("red"), null);
    assert.equal(normalizeHex(undefined), null);
  });
});

describe("hex/rgb conversion", () => {
  it("round-trips", () => {
    assert.deepEqual(hexToRgb("#ff8000"), [255, 128, 0]);
    assert.equal(rgbToHex([255, 128, 0]), "#ff8000");
  });

  it("clamps and rounds channels", () => {
    assert.equal(rgbToHex([300, -5, 127.6]), "#ff0080");
  });
});

describe("hsl conversion", () => {
  it("round-trips pure colors", () => {
    for (const hex of ["#ff0000", "#00ff00", "#0000ff", "#808080"]) {
      assert.equal(rgbToHex(hslToRgb(rgbToHsl(hexToRgb(hex)))), hex);
    }
  });
});

describe("rotateHue", () => {
  it("returns the complement at 180°", () => {
    assert.equal(rotateHue("#ff0000", 180), "#00ffff");
  });

  it("handles negative and wrapping angles", () => {
    assert.equal(rotateHue("#ff0000", -120), rotateHue("#ff0000", 240));
    assert.equal(rotateHue("#ff0000", 360), "#ff0000");
  });
});

describe("mix", () => {
  it("blends toward the target", () => {
    assert.equal(mix("#000000", WHITE, 0.5), "#808080");
    assert.equal(mix("#ffffff", BLACK, 0), "#ffffff");
  });
});

describe("readableTextColor", () => {
  it("uses black on light and white on dark backgrounds", () => {
    assert.equal(readableTextColor("#ffffff"), "#000000");
    assert.equal(readableTextColor("#202020"), "#ffffff");
  });
});
