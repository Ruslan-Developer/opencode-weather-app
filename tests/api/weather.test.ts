import { afterEach, describe, expect, test } from "bun:test";
import {
  describeWeatherCode,
  fetchDailyForecast,
  fetchTemperature,
} from "../../src/api/weather.ts";
import { ApiError } from "../../src/api/apiError.ts";
import {
  installFetchMock,
  jsonResponse,
  restoreFetch,
  textResponse,
} from "../helpers/fetchMock.ts";

afterEach(restoreFetch);

const LAT = 40.416775;
const LON = -3.70379;

describe("fetchTemperature", () => {
  test("requests the current temperature for the coordinates and unit", async () => {
    let requestedUrl = "";
    installFetchMock((url) => {
      requestedUrl = url;
      return jsonResponse({ current: { temperature_2m: 21.5 } });
    });

    expect(await fetchTemperature(LAT, LON, "celsius")).toBe(21.5);
    expect(requestedUrl).toBe(
      "https://api.open-meteo.com/v1/forecast" +
        `?latitude=${LAT}&longitude=${LON}` +
        "&current=temperature_2m&temperature_unit=celsius",
    );
  });

  test("throws an ApiError when no temperature is reported", async () => {
    installFetchMock(() => jsonResponse({ current: {} }));
    try {
      await fetchTemperature(LAT, LON, "celsius");
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).message).toBe(
        "Forecast API did not return a temperature",
      );
    }
  });

  test("throws an ApiError on an HTTP failure", async () => {
    installFetchMock(() => textResponse(500, "oops"));
    try {
      await fetchTemperature(LAT, LON, "celsius");
      expect.unreachable();
    } catch (error) {
      expect((error as ApiError).message).toBe(
        "Forecast API responded with status 500",
      );
    }
  });
});

describe("fetchDailyForecast", () => {
  const fullPayload = {
    daily: {
      time: ["2026-11-22", "2026-11-23", "2026-11-24"],
      temperature_2m_max: [18, 19, 20],
      temperature_2m_min: [7, 8, 9],
      weather_code: [0, 61, null],
    },
  };

  test("requests the daily fields for 7 days with auto timezone", async () => {
    let requestedUrl = "";
    installFetchMock((url) => {
      requestedUrl = url;
      return jsonResponse(fullPayload);
    });

    await fetchDailyForecast(LAT, LON, "celsius");
    expect(requestedUrl).toBe(
      "https://api.open-meteo.com/v1/forecast" +
        `?latitude=${LAT}&longitude=${LON}` +
        "&daily=temperature_2m_max,temperature_2m_min,weather_code" +
        "&forecast_days=7&temperature_unit=celsius&timezone=auto",
    );
  });

  test("maps each day to its max/min and weather code", async () => {
    installFetchMock(() => jsonResponse(fullPayload));
    expect(await fetchDailyForecast(LAT, LON, "celsius")).toEqual([
      { date: "2026-11-22", max: 18, min: 7, code: 0 },
      { date: "2026-11-23", max: 19, min: 8, code: 61 },
      { date: "2026-11-24", max: 20, min: 9, code: null },
    ]);
  });

  test("skips days with missing max/min temperatures", async () => {
    installFetchMock(() =>
      jsonResponse({
        daily: {
          time: ["2026-11-22", "2026-11-23"],
          temperature_2m_max: [18],
          temperature_2m_min: [7, 8],
          weather_code: [0, 3],
        },
      }),
    );

    expect(await fetchDailyForecast(LAT, LON, "celsius")).toEqual([
      { date: "2026-11-22", max: 18, min: 7, code: 0 },
    ]);
  });

  test("honors a custom number of days and unit", async () => {
    let requestedUrl = "";
    installFetchMock((url) => {
      requestedUrl = url;
      return jsonResponse(fullPayload);
    });

    await fetchDailyForecast(LAT, LON, "fahrenheit", 3);
    expect(requestedUrl).toContain("forecast_days=3");
    expect(requestedUrl).toContain("temperature_unit=fahrenheit");
  });

  test("throws an ApiError when the daily block is missing or empty", async () => {
    installFetchMock(() => jsonResponse({ daily: {} }));
    try {
      await fetchDailyForecast(LAT, LON, "celsius");
      expect.unreachable();
    } catch (error) {
      expect((error as ApiError).message).toBe(
        "Forecast API did not return a daily forecast",
      );
    }

    installFetchMock(() =>
      jsonResponse({
        daily: { time: [], temperature_2m_max: [], temperature_2m_min: [] },
      }),
    );
    try {
      await fetchDailyForecast(LAT, LON, "celsius");
      expect.unreachable();
    } catch (error) {
      expect((error as ApiError).message).toBe(
        "Forecast API did not return a daily forecast",
      );
    }
  });

  test("throws an ApiError when every day is incomplete", async () => {
    installFetchMock(() =>
      jsonResponse({
        daily: {
          time: ["2026-11-22"],
          temperature_2m_max: [],
          temperature_2m_min: [7],
        },
      }),
    );
    try {
      await fetchDailyForecast(LAT, LON, "celsius");
      expect.unreachable();
    } catch (error) {
      expect((error as ApiError).message).toBe(
        "Forecast API returned an empty daily forecast",
      );
    }
  });

  test("throws an ApiError on an HTTP failure", async () => {
    installFetchMock(() => textResponse(502, "bad gateway"));
    try {
      await fetchDailyForecast(LAT, LON, "celsius");
      expect.unreachable();
    } catch (error) {
      expect((error as ApiError).message).toBe(
        "Forecast API responded with status 502",
      );
    }
  });
});

describe("describeWeatherCode", () => {
  test("maps known WMO codes to Spanish descriptions", () => {
    expect(describeWeatherCode(0)).toBe("Despejado");
    expect(describeWeatherCode(3)).toBe("Nublado");
    expect(describeWeatherCode(45)).toBe("Niebla");
    expect(describeWeatherCode(61)).toBe("Lluvia ligera");
    expect(describeWeatherCode(71)).toBe("Nevada ligera");
    expect(describeWeatherCode(95)).toBe("Tormenta");
    expect(describeWeatherCode(99)).toBe("Tormenta con granizo fuerte");
  });

  test("falls back to an unknown-weather description", () => {
    expect(describeWeatherCode(42)).toBe("Tiempo desconocido");
  });
});
