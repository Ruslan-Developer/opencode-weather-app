import { describe, expect, test } from "bun:test";
import { getSavedCities } from "../../src/actions/listCities.ts";
import { makeCity, makeConfig } from "../helpers/fixtures.ts";

const madrid = makeCity();
const lima = makeCity({ name: "Lima", country: "Perú", latitude: -12.046373, longitude: -77.042754 });

describe("getSavedCities", () => {
  test("returns the saved cities in insertion order", () => {
    const config = makeConfig({ cities: [madrid, lima] });
    expect(getSavedCities(config)).toEqual([madrid, lima]);
  });

  test("returns an empty list when no city is saved", () => {
    expect(getSavedCities(makeConfig())).toEqual([]);
  });
});
