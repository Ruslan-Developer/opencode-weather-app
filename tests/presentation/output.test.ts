import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  printError,
  printForecastDay,
  printForecastHeader,
  printNumberedCities,
  printSuccess,
  printWeather,
  printWeatherError,
} from "../../src/presentation/output.ts";
import { makeCity } from "../helpers/fixtures.ts";

// Colors may wrap substrings with ANSI codes (depending on TTY/NO_COLOR
// at import time), so assertions target plain substrings that survive
// either mode.

const madrid = makeCity();
const lima = makeCity({ name: "Lima", country: "Perú", latitude: -12.046373, longitude: -77.042754 });

let logs: string[];
const originalLog = console.log;

beforeEach(() => {
  logs = [];
  console.log = (...args: unknown[]) => {
    logs.push(args.map((arg) => String(arg)).join(" "));
  };
});

afterEach(() => {
  console.log = originalLog;
});

describe("printNumberedCities", () => {
  test("prints a 1-based numbered list with the region when known", () => {
    printNumberedCities([madrid, lima]);
    expect(logs).toEqual([
      "  1. Madrid — España",
      "  2. Lima — Perú",
    ]);
  });
});

describe("printWeather", () => {
  test("prints one weather line with the city label and temperature", () => {
    printWeather(madrid, 21.5, "celsius");
    expect(logs).toHaveLength(1);
    expect(logs[0]).toContain("Madrid (España):");
    expect(logs[0]).toContain("21.5 °C");
  });
});

describe("printWeatherError", () => {
  test("prints the failed city and the error message", () => {
    printWeatherError(lima, "Forecast API responded with status 500");
    expect(logs).toHaveLength(1);
    expect(logs[0]).toContain("Lima");
    expect(logs[0]).toContain("Forecast API responded with status 500");
  });
});

describe("printForecastHeader", () => {
  test("prints the city and unit symbol", () => {
    printForecastHeader(madrid, "celsius");
    expect(logs[0]).toContain("Pronóstico 7 días — Madrid (España) (°C):");
  });
});

describe("printForecastDay", () => {
  test("prints the weekday, max/min temperatures and description", () => {
    printForecastDay({ date: "2026-11-22", max: 18, min: 7, code: 0 });
    expect(logs[0]).toContain("dom 22/11:");
    expect(logs[0]).toContain("18° / 7°");
    expect(logs[0]).toContain("Despejado");
  });

  test("omits the description when no weather code is reported", () => {
    printForecastDay({ date: "2026-11-23", max: 19, min: 8, code: null });
    expect(logs[0]).toContain("lun 23/11:");
    expect(logs[0]).not.toContain("Desconocido");
  });
});

describe("printError / printSuccess", () => {
  test("print the given messages", () => {
    printError("algo ha fallado");
    printSuccess("ciudad añadida");
    expect(logs[0]).toContain("algo ha fallado");
    expect(logs[1]).toContain("ciudad añadida");
  });
});
