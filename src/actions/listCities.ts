/**
 * Action: the saved cities, in the order they were added.
 */

import type { City } from "../types/City.ts";
import type { Config } from "../types/Config.ts";

export function getSavedCities(config: Config): City[] {
  return config.cities;
}
