/**
 * Shared test data builders: a fixed city (Madrid), a default config
 * and a geocoding match. Every field can be overridden per test.
 */

import type { City } from "../../src/types/City.ts";
import type { Config } from "../../src/types/Config.ts";
import type { GeocodingResult } from "../../src/types/Weather.ts";

/** A saved city with fixed coordinates; override any field per test. */
export function makeCity(overrides: Partial<City> = {}): City {
  return {
    name: "Madrid",
    country: "España",
    latitude: 40.416775,
    longitude: -3.70379,
    ...overrides,
  };
}

/** An empty default config (no cities, no default, celsius). */
export function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    cities: [],
    defaultCity: null,
    unit: "celsius",
    ...overrides,
  };
}

/** A geocoding match for the fixed city, including its region. */
export function makeGeocodingResult(
  overrides: Partial<GeocodingResult> = {},
): GeocodingResult {
  return {
    name: "Madrid",
    country: "España",
    admin1: "Comunidad de Madrid",
    latitude: 40.416775,
    longitude: -3.70379,
    ...overrides,
  };
}
