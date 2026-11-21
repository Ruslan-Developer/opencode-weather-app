/**
 * Full application state persisted in the config file. It is loaded
 * once at startup and shared by reference across the layers.
 */

import type { City } from "./City.ts";
import type { TemperatureUnit } from "./Weather.ts";

export interface Config {
  cities: City[];
  defaultCity: string | null;
  unit: TemperatureUnit;
}
