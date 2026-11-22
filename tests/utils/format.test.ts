import { describe, expect, test } from "bun:test";
import {
  cityLabel,
  formatTemperature,
  geocodingResultLabel,
  weekdayLabel,
} from "../../src/utils/format.ts";
import { makeCity, makeGeocodingResult } from "../helpers/fixtures.ts";

describe("weekdayLabel", () => {
  test("formats an ISO date as 'día dd/mm' in Spanish", () => {
    expect(weekdayLabel("2026-11-22")).toBe("dom 22/11");
    expect(weekdayLabel("2026-11-18")).toBe("mié 18/11");
    expect(weekdayLabel("2026-01-01")).toBe("jue 1/1");
  });

  test("does not shift the day across timezones (local Date)", () => {
    // new Date(y, m, d) with local components, so any TZ yields the same label.
    expect(weekdayLabel("2026-03-01")).toBe("dom 1/3");
  });
});

describe("formatTemperature", () => {
  test("appends the unit symbol", () => {
    expect(formatTemperature(21.5, "celsius")).toBe("21.5 °C");
    expect(formatTemperature(70, "fahrenheit")).toBe("70 °F");
  });
});

describe("cityLabel", () => {
  test("includes the country when known", () => {
    expect(cityLabel(makeCity())).toBe("Madrid (España)");
  });

  test("falls back to the plain name", () => {
    expect(cityLabel(makeCity({ country: null }))).toBe("Madrid");
  });
});

describe("geocodingResultLabel", () => {
  test("joins region and country", () => {
    expect(geocodingResultLabel(makeGeocodingResult())).toBe(
      "Madrid — Comunidad de Madrid, España",
    );
  });

  test("uses only the country when there is no region", () => {
    expect(
      geocodingResultLabel(makeGeocodingResult({ admin1: null })),
    ).toBe("Madrid — España");
  });

  test("falls back to the plain name", () => {
    expect(
      geocodingResultLabel(
        makeGeocodingResult({ admin1: null, country: null }),
      ),
    ).toBe("Madrid");
  });
});
