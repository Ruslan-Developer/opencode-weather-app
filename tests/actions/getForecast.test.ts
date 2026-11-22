import { afterEach, describe, expect, test } from "bun:test";
import { getDailyForecast } from "../../src/actions/getForecast.ts";
import {
  installFetchMock,
  jsonResponse,
  restoreFetch,
  textResponse,
} from "../helpers/fetchMock.ts";
import { makeCity, makeConfig } from "../helpers/fixtures.ts";

afterEach(restoreFetch);

const madrid = makeCity();

describe("getDailyForecast", () => {
  test("returns the daily forecast for the city", async () => {
    installFetchMock(() =>
      jsonResponse({
        daily: {
          time: ["2026-11-22"],
          temperature_2m_max: [18],
          temperature_2m_min: [7],
          weather_code: [0],
        },
      }),
    );

    const config = makeConfig({ cities: [madrid] });
    expect(await getDailyForecast(config, madrid)).toEqual({
      forecast: [{ date: "2026-11-22", max: 18, min: 7, code: 0 }],
      error: null,
    });
  });

  test("captures API errors instead of throwing", async () => {
    installFetchMock(() => textResponse(500, "oops"));
    const config = makeConfig({ cities: [madrid] });
    const outcome = await getDailyForecast(config, madrid);
    expect(outcome.forecast).toBeNull();
    expect(outcome.error).toBe("Forecast API responded with status 500");
  });
});
