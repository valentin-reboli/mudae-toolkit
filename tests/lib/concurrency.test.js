import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { runWithConcurrency } from "../../src/js/lib/concurrency.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 1));

describe("runWithConcurrency", () => {
  it("processes every item without exceeding the limit", async () => {
    let running = 0;
    let peak = 0;
    const seen = [];
    await runWithConcurrency([1, 2, 3, 4, 5, 6, 7], 3, async (item) => {
      running++;
      peak = Math.max(peak, running);
      await tick();
      seen.push(item);
      running--;
    });
    assert.deepEqual(seen.sort(), [1, 2, 3, 4, 5, 6, 7]);
    assert.equal(peak, 3);
  });

  it("stops picking up items once cancelled", async () => {
    const seen = [];
    await runWithConcurrency(
      [1, 2, 3, 4],
      1,
      async (item) => {
        seen.push(item);
      },
      { isCancelled: () => seen.length >= 2 },
    );
    assert.deepEqual(seen, [1, 2]);
  });

  it("handles an empty list", async () => {
    await runWithConcurrency([], 4, async () => assert.fail("should not run"));
  });
});
