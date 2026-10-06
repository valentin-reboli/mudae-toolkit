import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildAhkScript, toAhkString } from "../../src/js/lib/autohotkey.js";

describe("toAhkString", () => {
  it("escapes quotes, backticks and semicolons", () => {
    assert.equal(toAhkString('a "b" `c`; d'), '"a `"b`" ``c```; d"');
  });
});

describe("buildAhkScript", () => {
  it("lists every command and uses the delay", () => {
    const script = buildAhkScript(["$ec Rem $ #111111", "$ec Ram $ #222222"], { delayMs: 3500 });
    assert.match(script, /"\$ec Rem \$ #111111",\n {2}"\$ec Ram \$ #222222"/);
    assert.match(script, /sleep\(3500\)/);
    assert.match(script, /^#Requires AutoHotkey v2\.0/);
  });
});
