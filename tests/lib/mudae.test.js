import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { embedColorCommand, parseHaremLine, parseHaremList } from "../../src/js/lib/mudae.js";

describe("parseHaremLine", () => {
  it("parses name, series, current color and image", () => {
    assert.deepEqual(
      parseHaremLine("Rem - Re:Zero (#3A5F9A) - https://mudae.net/uploads/1/a.png"),
      {
        input: "Rem - Re:Zero (#3A5F9A) - https://mudae.net/uploads/1/a.png",
        name: "Rem",
        series: "Re:Zero",
        oldColor: "#3a5f9a",
        imageUrl: "https://mudae.net/uploads/1/a.png",
      },
    );
  });

  it("parses lines with keys", () => {
    const entry = parseHaremLine(
      "Arthur Morgan · :bronzekey:  (1) - https://mudae.net/uploads/8551096/p8vFKvB~MPY4bnR.png",
    );
    assert.equal(entry.name, "Arthur Morgan");
    assert.equal(entry.imageUrl, "https://mudae.net/uploads/8551096/p8vFKvB~MPY4bnR.png");
    assert.equal(entry.oldColor, null);
  });

  it("parses kakera values without mistaking them for the name", () => {
    const entry = parseHaremLine(
      "Rem - Re:Zero (#3a5f9a) 120 ka - https://mudae.net/uploads/1/a.png",
    );
    assert.equal(entry.name, "Rem");
    assert.equal(entry.imageUrl, "https://mudae.net/uploads/1/a.png");
  });

  it("treats a URL in the series slot as the image", () => {
    const entry = parseHaremLine("Rem - https://mudae.net/uploads/1/a.png");
    assert.equal(entry.series, undefined);
    assert.equal(entry.imageUrl, "https://mudae.net/uploads/1/a.png");
  });

  it("rewrites imgur page links to direct image links", () => {
    const entry = parseHaremLine("Rem - https://imgur.com/abc123.png");
    assert.equal(entry.imageUrl, "https://i.imgur.com/abc123.png");
  });

  it("reports lines without an image", () => {
    assert.equal(parseHaremLine("Rem - Re:Zero").error, "No image URL found");
  });
});

describe("parseHaremList", () => {
  it("skips blank lines and trims zero-width spaces", () => {
    const entries = parseHaremList(
      "\n\u200BRem - https://a.png\u200B\n\n  \nRam - https://b.png\n",
    );
    assert.deepEqual(
      entries.map((entry) => entry.name),
      ["Rem", "Ram"],
    );
  });
});

describe("embedColorCommand", () => {
  it("formats the $ec command", () => {
    assert.equal(embedColorCommand("Rem", "#3a5f9a"), "$ec Rem $ #3a5f9a");
  });
});
