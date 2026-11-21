/**
 * Weather-domain types: API-facing contracts and the result shapes
 * returned by the weather/geocoding actions.
 */

import type { City } from "./City.ts";

export type TemperatureUnit = "celsius" | "fahrenheit";

export interface GeocodingResult {
  name: string;
  country: string | null;
  admin1: string | null;
  latitude: number;
  longitude: number;
}

export interface DailyForecastDay {
  /** ISO date (yyyy-mm-dd), local to the city's timezone. */
  date: string;
  max: number;
  min: number;
  /** WMO weather interpretation code, or null if not reported. */
  code: number | null;
}

/** Current-weather result for one city: a temperature or an error message. */
export type WeatherOutcome =
  | { city: City; temperature: number; error: null }
  | { city: City; temperature: null; error: string };

/** Forecast result for one city: the daily list or an error message. */
export type ForecastOutcome =
  | { forecast: DailyForecastDay[]; error: null }
  | { forecast: null; error: string };

/** Geocoding search result: the matching cities or an error message. */
export type SearchOutcome =
  | { results: GeocodingResult[]; error: null }
  | { results: null; error: string };
