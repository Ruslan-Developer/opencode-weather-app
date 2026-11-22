import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { addCity, isCitySaved, searchCity } from "../../src/actions/addCity.ts";
import { CONFIG_PATH } from "../../src/storage/configFile.ts";
import { resetConfigFile } from "../helpers/config.ts";
import {
  installFetchMock,
  jsonResponse,
  restoreFetch,
  textResponse,
} from "../helpers/fetchMock.ts";
import { makeCity, makeConfig, makeGeocodingResult } from "../helpers/fixtures.ts";

afterEach(restoreFetch);
beforeEach(resetConfigFile);

describe("searchCity", () => {
  test("returns the geocoding matches", async () => {
    installFetchMock(() => jsonResponse({ results: [makeGeocodingResult()] }));
    expect(await searchCity("Madrid")).toEqual({
      results: [makeGeocodingResult()],
      error: null,
    });
  });

  test("captures geocoding API errors", async () => {
    installFetchMock(() => textResponse(503, "unavailable"));
    const outcome = await searchCity("Madrid");
    expect(outcome.results).toBeNull();
    expect(outcome.error).toBe("Geocoding API responded with status 503");
  });
});

describe("isCitySaved", () => {
  test("is case-insensitive", () => {
    const config = makeConfig({ cities: [makeCity()] });
    expect(isCitySaved(config, "madrid")).toBe(true);
    expect(isCitySaved(config, "Lima")).toBe(false);
  });
});

describe("addCity", () => {
  test("appends the city, persists it and returns it (dropping admin1)", async () => {
    const config = makeConfig();
    const city = await addCity(config, makeGeocodingResult());
    expect(city).toEqual(makeCity());
    expect(config.cities).toEqual([city]);

    const raw = await Bun.file(CONFIG_PATH).json();
    expect(raw.cities).toEqual([city]);
  });
});
