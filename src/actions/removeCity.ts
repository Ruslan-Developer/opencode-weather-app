/**
 * Action: remove a saved city by index and clear the default city
 * when it was the one removed. Persists once at the end.
 */

import { removeCityAt, saveCities } from "../storage/citiesStorage.ts";
import { clearDefaultCityIfRemoved } from "../storage/settingsStorage.ts";
import type { City } from "../types/City.ts";
import type { Config } from "../types/Config.ts";

/**
 * Removes the city at a 0-based index and returns it, or undefined
 * when the index is out of range.
 */
export async function removeCity(
  config: Config,
  index: number,
): Promise<City | undefined> {
  const removed = removeCityAt(config, index);
  if (removed !== undefined) {
    clearDefaultCityIfRemoved(config, removed.name);
  }
  await saveCities(config);
  return removed;
}
