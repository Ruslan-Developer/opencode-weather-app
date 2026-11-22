import { beforeEach, describe, expect, test } from "bun:test";
import {
  appendCity,
  findCityByName,
  findCityIndex,
  removeCityAt,
  saveCities,
} from "../../src/storage/citiesStorage.ts";
import { CONFIG_PATH } from "../../src/storage/configFile.ts";
import { resetConfigFile } from "../helpers/config.ts";
import { makeCity, makeConfig } from "../helpers/fixtures.ts";

beforeEach(resetConfigFile);

const madrid = makeCity();
const lima = makeCity({ name: "Lima", country: "Perú", latitude: -12.046373, longitude: -77.042754 });

describe("findCityIndex / findCityByName", () => {
  test("match case-insensitively", () => {
    const config = makeConfig({ cities: [madrid, lima] });
    expect(findCityIndex(config, "lima")).toBe(1);
    expect(findCityIndex(config, "LIMA")).toBe(1);
    expect(findCityByName(config, "MaDrId")).toBe(madrid);
  });

  test("return -1 / undefined when the city is not saved", () => {
    const config = makeConfig({ cities: [madrid] });
    expect(findCityIndex(config, "Lima")).toBe(-1);
    expect(findCityByName(config, "Lima")).toBeUndefined();
  });
});

describe("appendCity", () => {
  test("pushes the city into the saved list (in memory)", () => {
    const config = makeConfig();
    appendCity(config, madrid);
    expect(config.cities).toEqual([madrid]);
  });
});

describe("removeCityAt", () => {
  test("removes the city at a 0-based index and returns it", () => {
    const config = makeConfig({ cities: [madrid, lima] });
    expect(removeCityAt(config, 0)).toBe(madrid);
    expect(config.cities).toEqual([lima]);
  });

  test("returns undefined when the index is out of range", () => {
    const config = makeConfig({ cities: [madrid] });
    expect(removeCityAt(config, 5)).toBeUndefined();
    expect(config.cities).toEqual([madrid]);
  });
});

describe("saveCities", () => {
  test("persists the whole shared state (cities and settings)", async () => {
    const config = makeConfig({
      cities: [madrid],
      defaultCity: "Madrid",
      unit: "fahrenheit",
    });
    await saveCities(config);
    const raw = await Bun.file(CONFIG_PATH).json();
    expect(raw).toEqual({
      cities: [madrid],
      defaultCity: "Madrid",
      unit: "fahrenheit",
    });
  });
});
