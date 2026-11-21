/**
 * Persistence of saved cities: lookups and list mutations over the
 * shared config state, plus the save operation. The underlying file
 * also holds the settings, so every save persists the whole state.
 */

import { saveConfig } from "./configFile.ts";
import type { City } from "../types/City.ts";
import type { Config } from "../types/Config.ts";

/** Case-insensitive index of a city by name; -1 when not found. */
export function findCityIndex(config: Config, name: string): number {
  return config.cities.findIndex(
    (city) => city.name.toLowerCase() === name.toLowerCase(),
  );
}

/** Case-insensitive city lookup by name. */
export function findCityByName(
  config: Config,
  name: string,
): City | undefined {
  const index = findCityIndex(config, name);
  return index === -1 ? undefined : config.cities[index];
}

/** Appends a city to the saved list (not persisted until saved). */
export function appendCity(config: Config, city: City): void {
  config.cities.push(city);
}

/**
 * Removes the city at a 0-based index and returns it, or undefined
 * when the index is out of range (not persisted until saved).
 */
export function removeCityAt(config: Config, index: number): City | undefined {
  const [removed] = config.cities.splice(index, 1);
  return removed;
}

/** Persists the shared state (cities and settings live in one file). */
export async function saveCities(config: Config): Promise<void> {
  await saveConfig(config);
}
