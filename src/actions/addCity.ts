/**
 * Action: search a city via the Geocoding API and add it to the
 * saved list. Orchestrates geocoding + cities storage; errors are
 * returned, never printed.
 */

import { ApiError } from "../api/apiError.ts";
import { geocodeCity } from "../api/geocoding.ts";
import { appendCity, findCityIndex, saveCities } from "../storage/citiesStorage.ts";
import type { City } from "../types/City.ts";
import type { Config } from "../types/Config.ts";
import type { GeocodingResult, SearchOutcome } from "../types/Weather.ts";

/** Searches a city by name; returns the matches (may be empty). */
export async function searchCity(name: string): Promise<SearchOutcome> {
  try {
    return { results: await geocodeCity(name), error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : String(error);
    return { results: null, error: message };
  }
}

/** True when a city with that name (case-insensitive) is already saved. */
export function isCitySaved(config: Config, name: string): boolean {
  return findCityIndex(config, name) !== -1;
}

/** Builds the city from a geocoding result, saves it and returns it. */
export async function addCity(
  config: Config,
  result: GeocodingResult,
): Promise<City> {
  const city: City = {
    name: result.name,
    country: result.country,
    latitude: result.latitude,
    longitude: result.longitude,
  };
  appendCity(config, city);
  await saveCities(config);
  return city;
}
