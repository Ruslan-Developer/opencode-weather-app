/**
 * Pure data formatters: dates, temperatures and display labels.
 * No console I/O and no coloring — callers apply colors themselves.
 */

import { UNIT_SYMBOL } from "./constants.ts";
import type { City } from "../types/City.ts";
import type { GeocodingResult, TemperatureUnit } from "../types/Weather.ts";

const WEEKDAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"] as const;

/** Formats an ISO date (yyyy-mm-dd) as "día dd/mm", local (no UTC shift). */
export function weekdayLabel(isoDate: string): string {
  const [year = 1970, month = 1, day = 1] =
    isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = WEEKDAYS[date.getDay()] ?? "";
  return `${weekday} ${day}/${month}`;
}

/** Formats a temperature with its unit symbol, e.g. "12.4 °C". */
export function formatTemperature(
  temperature: number,
  unit: TemperatureUnit,
): string {
  return `${temperature} ${UNIT_SYMBOL[unit]}`;
}

/** Display label for a city, including its country when known. */
export function cityLabel(city: City): string {
  return city.country ? `${city.name} (${city.country})` : city.name;
}

/** Display label for a geocoding result: "name — region, country". */
export function geocodingResultLabel(result: GeocodingResult): string {
  const region = [result.admin1, result.country].filter(Boolean).join(", ");
  return region === "" ? result.name : `${result.name} — ${region}`;
}
