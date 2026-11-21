/**
 * Console output helpers: weather/city/forecast lines and ok/error
 * messages. Colors come from utils/colors.ts.
 */

import { describeWeatherCode } from "../api/weather.ts";
import {
  green,
  red,
  styled,
  weatherCodeStyle,
  yellow,
} from "../utils/colors.ts";
import { UNIT_SYMBOL } from "../utils/constants.ts";
import { cityLabel, formatTemperature, weekdayLabel } from "../utils/format.ts";
import type { City } from "../types/City.ts";
import type { DailyForecastDay, TemperatureUnit } from "../types/Weather.ts";

/** Prints the numbered list of saved cities (picker style). */
export function printNumberedCities(cities: City[]): void {
  cities.forEach((city, index) => {
    const region = city.country ? ` — ${city.country}` : "";
    console.log(`  ${index + 1}. ${city.name}${region}`);
  });
}

/** Prints one current-weather line: "City (Country): 12.4 °C". */
export function printWeather(
  city: City,
  temperature: number,
  unit: TemperatureUnit,
): void {
  console.log(
    `  ${cityLabel(city)}: ${yellow(formatTemperature(temperature, unit))}`,
  );
}

/** Error line for a failed weather lookup of one city. */
export function printWeatherError(city: City, message: string): void {
  printError(`  No se pudo obtener el clima de ${city.name}: ${message}`);
}

/** Prints the 7-day forecast header for a city. */
export function printForecastHeader(city: City, unit: TemperatureUnit): void {
  console.log(`  Pronóstico 7 días — ${cityLabel(city)} (${UNIT_SYMBOL[unit]}):`);
}

/** Prints one forecast line: "día dd/mm: max° / min°  <descripción>". */
export function printForecastDay(day: DailyForecastDay): void {
  const temps = yellow(`${day.max}° / ${day.min}°`);
  const description = day.code === null
    ? ""
    : `  ${styled(weatherCodeStyle(day.code), describeWeatherCode(day.code))}`;
  console.log(`    ${weekdayLabel(day.date)}: ${temps}${description}`);
}

/** Error message (red). */
export function printError(message: string): void {
  console.log(red(message));
}

/** Success message (green). */
export function printSuccess(message: string): void {
  console.log(green(message));
}
