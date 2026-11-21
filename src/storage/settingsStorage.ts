/**
 * Persistence of settings (default city and temperature unit).
 * The underlying file also holds the cities, so every save
 * persists the whole state.
 */

import type { Config } from "../types/Config.ts";
import type { TemperatureUnit } from "../types/Weather.ts";

export { loadConfig } from "./configFile.ts";
import { saveConfig } from "./configFile.ts";

/** Persists the shared state (settings and cities live in one file). */
export async function saveSettings(config: Config): Promise<void> {
  await saveConfig(config);
}

/** Clears the default city when the city removed from the list was the default. */
export function clearDefaultCityIfRemoved(
  config: Config,
  removedName: string,
): void {
  if (
    config.defaultCity !== null &&
    removedName.toLowerCase() === config.defaultCity.toLowerCase()
  ) {
    config.defaultCity = null;
  }
}
