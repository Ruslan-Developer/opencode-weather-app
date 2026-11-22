import { describe, expect, test } from "bun:test";
import { parseCityIndex } from "../../src/presentation/input.ts";

// Only the pure helper is tested here: ask()/confirm()/pickResult()
// read the process stdin stream, which cannot be driven in-process.

describe("parseCityIndex", () => {
  test("converts a 1-based choice to a 0-based index", () => {
    expect(parseCityIndex("1", 3)).toBe(0);
    expect(parseCityIndex("3", 3)).toBe(2);
  });

  test("returns null for invalid or out-of-range choices", () => {
    expect(parseCityIndex("0", 3)).toBeNull();
    expect(parseCityIndex("4", 3)).toBeNull();
    expect(parseCityIndex("-1", 3)).toBeNull();
    expect(parseCityIndex("abc", 3)).toBeNull();
    expect(parseCityIndex("", 3)).toBeNull();
  });

  test("returns null when the list is empty", () => {
    expect(parseCityIndex("1", 0)).toBeNull();
  });
});
