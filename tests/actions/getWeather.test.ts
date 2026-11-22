import { afterEach, describe, expect, test } from "bun:test";
import {
  getAllWeather,
  getDefaultWeather,
  resolveDefaultCity,
} from "../../src/actions/getWeather.ts";
import {
  installFetchMock,
  jsonResponse,
  restoreFetch,
  textResponse,
} from "../helpers/fetchMock.ts";
import { makeCity, makeConfig } from "../helpers/fixtures.ts";

afterEach(restoreFetch);

const madrid = makeCity();
const lima = makeCity({ name: "Lima", country: "Perú", latitude: -12.046373, longitude: -77.042754 });

describe("resolveDefaultCity", () => {
  test("returns undefined when no default city is set", () => {
    expect(resolveDefaultCity(makeConfig({ cities: [madrid] }))).toBeUndefined();
  });

  test("returns the saved city matching the default name", () => {
    const config = makeConfig({ cities: [madrid, lima], defaultCity: "lima" });
    expect(resolveDefaultCity(config)).toBe(lima);
  });

  test("returns undefined when the default city is no longer saved", () => {
    const config = makeConfig({ cities: [lima], defaultCity: "Madrid" });
    expect(resolveDefaultCity(config)).toBeUndefined();
  });
});

describe("getDefaultWeather", () => {
  test("returns null when there is no usable default city", async () => {
    expect(await getDefaultWeather(makeConfig({ cities: [madrid] }))).toBeNull();
    expect(await getDefaultWeather(makeConfig({ defaultCity: "Madrid" }))).toBeNull();
  });

  test("returns the temperature for the default city", async () => {
    installFetchMock(() => jsonResponse({ current: { temperature_2m: 21.5 } }));
    const config = makeConfig({ cities: [madrid], defaultCity: "Madrid" });
    expect(await getDefaultWeather(config)).toEqual({
      city: madrid,
      temperature: 21.5,
      error: null,
    });
  });

  test("captures API errors instead of throwing", async () => {
    installFetchMock(() => textResponse(503, "unavailable"));
    const config = makeConfig({ cities: [madrid], defaultCity: "Madrid" });
    const outcome = await getDefaultWeather(config);
    expect(outcome?.temperature).toBeNull();
    expect(outcome?.error).toBe("Forecast API responded with status 503");
  });
});

describe("getAllWeather", () => {
  test("returns outcomes in the order the cities were saved", async () => {
    installFetchMock(() => jsonResponse({ current: { temperature_2m: 20 } }));
    const outcomes = await getAllWeather(makeConfig({ cities: [madrid, lima] }));
    expect(outcomes).toHaveLength(2);
    expect(outcomes[0]?.city).toBe(madrid);
    expect(outcomes[1]?.city).toBe(lima);
  });

  test("collects a per-city error without aborting the rest", async () => {
    installFetchMock((url) =>
      url.includes("latitude=-12.046373")
        ? textResponse(500, "oops")
        : jsonResponse({ current: { temperature_2m: 20 } }),
    );

    const outcomes = await getAllWeather(makeConfig({ cities: [madrid, lima] }));
    expect(outcomes[0]).toEqual({ city: madrid, temperature: 20, error: null });
    expect(outcomes[1]?.temperature).toBeNull();
    expect(outcomes[1]?.error).toBe("Forecast API responded with status 500");
  });

  test("requests the configured temperature unit", async () => {
    const urls: string[] = [];
    installFetchMock((url) => {
      urls.push(url);
      return jsonResponse({ current: { temperature_2m: 70 } });
    });

    await getAllWeather(makeConfig({ cities: [madrid], unit: "fahrenheit" }));
    expect(urls[0]).toContain("temperature_unit=fahrenheit");
  });
});
