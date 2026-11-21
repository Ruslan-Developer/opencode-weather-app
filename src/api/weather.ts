/**
 * Open-Meteo Forecast API (no API key required).
 * Fetches the current temperature and the daily forecast
 * (max/min + WMO weather codes) for given coordinates.
 */

import { ApiError } from "./apiError.ts";
import type { DailyForecastDay, TemperatureUnit } from "../types/Weather.ts";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

interface ForecastResponse {
  current?: {
    temperature_2m?: number;
  };
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    weather_code?: number[];
  };
}

/**
 * Fetches the current temperature (in the requested unit) for coordinates.
 */
export async function fetchTemperature(
  latitude: number,
  longitude: number,
  unit: TemperatureUnit,
): Promise<number> {
  const url =
    `${FORECAST_URL}?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m&temperature_unit=${unit}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new ApiError(`Forecast API responded with status ${response.status}`);
  }

  const data = (await response.json()) as ForecastResponse;
  const temperature = data.current?.temperature_2m;
  if (temperature === undefined) {
    throw new ApiError("Forecast API did not return a temperature");
  }
  return temperature;
}

/** WMO weather interpretation codes -> short Spanish description. */
const WEATHER_CODES: Record<number, string> = {
  0: "Despejado",
  1: "Mayormente despejado",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Niebla",
  48: "Niebla con escarcha",
  51: "Llovizna ligera",
  53: "Llovizna",
  55: "Llovizna intensa",
  56: "Llovizna helada ligera",
  57: "Llovizna helada",
  61: "Lluvia ligera",
  63: "Lluvia",
  65: "Lluvia intensa",
  66: "Lluvia helada ligera",
  67: "Lluvia helada",
  71: "Nevada ligera",
  73: "Nevada",
  75: "Nevada intensa",
  77: "Cinarra",
  80: "Chubascos ligeros",
  81: "Chubascos",
  82: "Chubascos violentos",
  85: "Chubascos de nieve ligeros",
  86: "Chubascos de nieve",
  95: "Tormenta",
  96: "Tormenta con granizo",
  99: "Tormenta con granizo fuerte",
};

/** Maps a WMO weather code to a short Spanish description. */
export function describeWeatherCode(code: number): string {
  return WEATHER_CODES[code] ?? "Tiempo desconocido";
}

/**
 * Daily forecast variant: max/min temperature (and weather code)
 * for the next `days` days for the given coordinates.
 */
export async function fetchDailyForecast(
  latitude: number,
  longitude: number,
  unit: TemperatureUnit,
  days = 7,
): Promise<DailyForecastDay[]> {
  const url =
    `${FORECAST_URL}?latitude=${latitude}&longitude=${longitude}` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
    `&forecast_days=${days}&temperature_unit=${unit}&timezone=auto`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new ApiError(`Forecast API responded with status ${response.status}`);
  }

  const data = (await response.json()) as ForecastResponse;
  const time = data.daily?.time;
  const max = data.daily?.temperature_2m_max;
  const min = data.daily?.temperature_2m_min;
  const codes = data.daily?.weather_code;
  if (
    time === undefined || max === undefined || min === undefined ||
    time.length === 0
  ) {
    throw new ApiError("Forecast API did not return a daily forecast");
  }

  const forecast: DailyForecastDay[] = [];
  for (let i = 0; i < time.length; i++) {
    const maxTemp = max[i];
    const minTemp = min[i];
    if (maxTemp === undefined || minTemp === undefined) continue;
    forecast.push({
      date: time[i] ?? "",
      max: maxTemp,
      min: minTemp,
      code: codes?.[i] ?? null,
    });
  }

  if (forecast.length === 0) {
    throw new ApiError("Forecast API returned an empty daily forecast");
  }
  return forecast;
}
