import { describe, expect, test } from "bun:test";
import { isCity } from "../../src/types/City.ts";
import { makeCity } from "../helpers/fixtures.ts";

describe("isCity", () => {
  test("accepts a fully populated city", () => {
    expect(isCity(makeCity())).toBe(true);
  });

  test("accepts a null country", () => {
    expect(isCity(makeCity({ country: null }))).toBe(true);
  });

  test("accepts a missing country (configs from older versions)", () => {
    expect(
      isCity({ name: "Legacy", latitude: 1, longitude: 2 }),
    ).toBe(true);
  });

  test("rejects non-string names", () => {
    expect(isCity(makeCity({ name: 123 as unknown as string }))).toBe(false);
  });

  test("rejects non-numeric coordinates", () => {
    expect(isCity(makeCity({ latitude: "40" as unknown as number }))).toBe(
      false,
    );
    expect(isCity(makeCity({ longitude: "nan" as unknown as number }))).toBe(
      false,
    );
  });

  test("rejects cities without coordinates", () => {
    expect(isCity({ name: "No coords", latitude: 1 })).toBe(false);
  });

  test("rejects a non-string country", () => {
    expect(isCity(makeCity({ country: 5 as unknown as string }))).toBe(false);
  });

  test("rejects non-object values", () => {
    expect(isCity(null)).toBe(false);
    expect(isCity("Madrid")).toBe(false);
    expect(isCity(42)).toBe(false);
    expect(isCity([])).toBe(false);
  });
});
