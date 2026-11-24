import * as assert from "node:assert/strict";
import { test } from "node:test";
import { lineOf, toLspPosition, toProtocolPosition } from "../src/positions";

test("ASCII columns differ from LSP characters only by the 1-based offset", () => {
  assert.deepEqual(toProtocolPosition("int x;", { line: 2, character: 4 }), {
    line: 3,
    column: 5,
  });
  assert.deepEqual(toLspPosition("int x;", { line: 3, column: 5 }), {
    line: 2,
    character: 4,
  });
});

test("a character outside the BMP counts as one scalar value but two UTF-16 units", () => {
  const line = "a😀b";
  assert.deepEqual(toProtocolPosition(line, { line: 0, character: 3 }), {
    line: 1,
    column: 3,
  });
  assert.deepEqual(toLspPosition(line, { line: 1, column: 3 }), {
    line: 0,
    character: 3,
  });
});

test("the end of a line is a valid column", () => {
  assert.deepEqual(toLspPosition("ab", { line: 1, column: 3 }), {
    line: 0,
    character: 2,
  });
});

test("a column past the end of the line throws", () => {
  assert.throws(() => toLspPosition("ab", { line: 1, column: 4 }), RangeError);
});

test("lineOf splits on every kind of line break", () => {
  const text = "one\r\ntwo\nthree\rfour";
  assert.equal(lineOf(text, 1), "two");
  assert.equal(lineOf(text, 3), "four");
  assert.throws(() => lineOf(text, 4), RangeError);
});
