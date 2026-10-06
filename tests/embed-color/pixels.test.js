import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { collectPixels, dominantColor, meanColor } from "../../src/js/embed-color/pixels.js";

// builds rgba data from [pixel, count] pairs
function rgba(...runs) {
  return runs.flatMap(([pixel, count]) => Array.from({ length: count }, () => pixel)).flat();
}

describe("collectPixels", () => {
  it("drops transparent pixels", () => {
    assert.deepEqual(collectPixels(rgba([[200, 0, 0, 255], 1], [[0, 200, 0, 0], 1])), [
      [200, 0, 0],
    ]);
  });

  it("drops plain white/black background pixels", () => {
    const pixels = collectPixels(rgba([[255, 255, 255, 255], 5], [[200, 0, 0, 255], 5]));
    assert.deepEqual(pixels, Array(5).fill([200, 0, 0]));
  });

  it("keeps the background when it is nearly the whole image", () => {
    const pixels = collectPixels(rgba([[255, 255, 255, 255], 99], [[200, 0, 0, 255], 1]));
    assert.equal(pixels.length, 100);
  });
});

describe("meanColor", () => {
  it("averages channels", () => {
    assert.deepEqual(
      meanColor([
        [0, 0, 0],
        [100, 50, 200],
      ]),
      [50, 25, 100],
    );
  });

  it("returns null for no pixels", () => {
    assert.equal(meanColor([]), null);
  });
});

describe("dominantColor", () => {
  it("returns the color covering the most area", () => {
    const pixels = [...Array(70).fill([200, 30, 30]), ...Array(30).fill([30, 30, 200])];
    assert.deepEqual(dominantColor(pixels).map(Math.round), [200, 30, 30]);
  });

  it("returns null for no pixels", () => {
    assert.equal(dominantColor([]), null);
  });
});
