/**
 * Action: current weather for the default city and for all saved
 * cities. Orchestrates the cities storage and the forecast API and
 * returns per-city outcomes; errors are returned, never printed.
 */

import { fetchTemperature } from "../api/weather.ts";
import { findCityByName } from "../storage/citiesStorage.ts";
import type { City } from "../types/City.ts";
import type { Config } from "../types/Config.ts";
import type { WeatherOutcome } from "../types/Weather.ts";

/**
 * The saved city matching the configured default city, or undefined
 * when no default is set (or it is no longer saved).
 */
export function resolveDefaultCity(config: Config): City | undefined {
  const defaultName = config.defaultCity;
  if (defaultName === null) return undefined;
  return findCityByName(config, defaultName);
}

/**
 * Current weather for the default city, or null when there is no
 * usable default (not set, or no longer saved).
 */
export async function getDefaultWeather(
  config: Config,
): Promise<WeatherOutcome | null> {
  const city = resolveDefaultCity(config);
  if (city === undefined) return null;
  return measureWeather(city, config);
}

/** Current weather for every saved city, in the order they were added. */
export async function getAllWeather(config: Config): Promise<WeatherOutcome[]> {
  const outcomes: WeatherOutcome[] = [];
  for (const city of config.cities) {
    outcomes.push(await measureWeather(city, config));
  }
  return outcomes;
}

async function measureWeather(city: City, config: Config): Promise<WeatherOutcome> {
  try {
    const temperature = await fetchTemperature(
      city.latitude,
      city.longitude,
      config.unit,
    );
    return { city, temperature, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { city, temperature: null, error: message };
  }
}
