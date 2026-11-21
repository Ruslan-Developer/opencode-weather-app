/**
 * Interactive menu: rendering and the interactive flow behind each
 * option. Flows collect input, run actions and print results
 * (user-facing text in Spanish, per README).
 */

import {
  blue,
  cyan,
  gray,
  green,
  magenta,
  red,
  yellow,
} from "../utils/colors.ts";
import { LINE, UNIT_SYMBOL } from "../utils/constants.ts";
import { geocodingResultLabel } from "../utils/format.ts";
import {
  getAllWeather,
  getDefaultWeather,
  resolveDefaultCity,
} from "../actions/getWeather.ts";
import { getDailyForecast } from "../actions/getForecast.ts";
import { addCity, isCitySaved, searchCity } from "../actions/addCity.ts";
import { removeCity } from "../actions/removeCity.ts";
import { setDefaultCity } from "../actions/setDefaultCity.ts";
import { getSavedCities } from "../actions/listCities.ts";
import { setUnit } from "../actions/changeUnit.ts";
import { ask, confirm, parseCityIndex, pickResult } from "./input.ts";
import {
  printError,
  printForecastDay,
  printForecastHeader,
  printNumberedCities,
  printSuccess,
  printWeather,
  printWeatherError,
} from "./output.ts";
import type { City } from "../types/City.ts";
import type { Config } from "../types/Config.ts";
import type { MenuOption } from "../types/MenuOption.ts";

/** Renders one menu line: the whole option in its semantic color. */
function option(
  number: MenuOption,
  label: string,
  color: (text: string) => string,
): string {
  return `  ${color(`${number}. ${label}`)}`;
}

export function renderMenu(config: Config): void {
  console.log(cyan(LINE));
  console.log(cyan("         WEATHER CLI"));
  console.log(cyan(LINE));
  console.log(option("1", "Clima de ciudad default", cyan));
  console.log(option("2", `Clima de todas las ciudades (${config.cities.length})`, blue));
  console.log(option("3", "Buscar y agregar ciudad", green));
  console.log(option("4", "Eliminar ciudad", red));
  console.log(option("5", "Establecer ciudad default", magenta));
  console.log(option("6", "Pronóstico 7 días", cyan));
  console.log(option("8", `Ajustes (${UNIT_SYMBOL[config.unit]})`, yellow));
  console.log(option("9", "Salir", gray));
  console.log(cyan(LINE));
}

// ---- Option 1 / 2: weather ----------------------------------------------

async function showDefaultWeather(config: Config): Promise<void> {
  const outcome = await getDefaultWeather(config);
  if (outcome === null) {
    console.log("  No hay ciudad default establecida. Usa la opción 5.");
    return;
  }
  if (outcome.error !== null) {
    printWeatherError(outcome.city, outcome.error);
    return;
  }
  printWeather(outcome.city, outcome.temperature, config.unit);
}

async function showAllWeather(config: Config): Promise<void> {
  if (getSavedCities(config).length === 0) {
    console.log("  No hay ciudades guardadas. Usa la opción 3 para agregar.");
    return;
  }
  for (const outcome of await getAllWeather(config)) {
    if (outcome.error !== null) {
      printWeatherError(outcome.city, outcome.error);
    } else {
      printWeather(outcome.city, outcome.temperature, config.unit);
    }
  }
}

// ---- Option 6: 7-day forecast ---------------------------------------------

async function showDailyForecast(config: Config): Promise<void> {
  if (config.cities.length === 0) {
    console.log("  No hay ciudades guardadas. Usa la opción 3 para agregar.");
    return;
  }

  printNumberedCities(config.cities);
  const input = (
    await ask(
      `  Número de la ciudad (1-${config.cities.length}) o Enter para la default: `,
    )
  ).trim();

  let city: City | undefined;
  if (input === "") {
    city = resolveDefaultCity(config);
  } else {
    const index = parseCityIndex(input, config.cities.length);
    if (index === null) {
      printError("  Número no válido.");
      return;
    }
    city = config.cities[index];
  }

  if (city === undefined) {
    console.log("  No hay ciudad default establecida. Usa la opción 5.");
    return;
  }

  const result = await getDailyForecast(config, city);
  if (result.error !== null) {
    printError(`  No se pudo obtener el pronóstico de ${city.name}: ${result.error}`);
    return;
  }

  printForecastHeader(city, config.unit);
  for (const day of result.forecast) {
    printForecastDay(day);
  }
}

// ---- Option 3: search and add -------------------------------------------

async function addCityFlow(config: Config): Promise<void> {
  const name = (await ask("  Nombre de la ciudad: ")).trim();
  if (name === "") {
    printError("  Nombre vacío, cancelado.");
    return;
  }

  const search = await searchCity(name);
  if (search.error !== null) {
    printError(`  Error al buscar la ciudad: ${search.error}`);
    return;
  }
  const results = search.results;

  if (results.length === 0) {
    printError(`  No se encontró ninguna ciudad llamada "${name}".`);
    return;
  }

  // Single match: skip the picker. Several matches: let the user choose.
  const result = results.length === 1 ? results[0] : await pickResult(results);
  if (result === undefined) {
    console.log("  Ciudad no agregada.");
    return;
  }

  console.log(
    `  Encontrada: ${geocodingResultLabel(result)} (${result.latitude}, ${result.longitude})`,
  );

  if (isCitySaved(config, result.name)) {
    printError("  Esa ciudad ya está guardada.");
    return;
  }

  if (!(await confirm("  ¿Agregarla? (s/n): "))) {
    console.log("  Ciudad no agregada.");
    return;
  }

  const city = await addCity(config, result);
  printSuccess(`  ${city.name} agregada correctamente.`);
}

// ---- Options 4 / 5: remove / set default ---------------------------------

async function removeCityFlow(config: Config): Promise<void> {
  if (config.cities.length === 0) {
    console.log("  No hay ciudades guardadas.");
    return;
  }

  printNumberedCities(config.cities);
  const input = (await ask(`  Número a eliminar (1-${config.cities.length}): `)).trim();
  const index = parseCityIndex(input, config.cities.length);
  if (index === null) {
    printError("  Número no válido.");
    return;
  }

  const removed = await removeCity(config, index);
  if (removed === undefined) {
    printError("  Número no válido.");
  } else {
    printSuccess(`  ${removed.name} eliminada.`);
  }
}

async function setDefaultCityFlow(config: Config): Promise<void> {
  if (config.cities.length === 0) {
    console.log("  No hay ciudades guardadas.");
    return;
  }

  printNumberedCities(config.cities);
  const input = (await ask(`  Número de la default (1-${config.cities.length}): `)).trim();
  const index = parseCityIndex(input, config.cities.length);
  if (index === null) {
    printError("  Número no válido.");
    return;
  }

  const city = config.cities[index];
  if (city === undefined) {
    printError("  Número no válido.");
    return;
  }

  await setDefaultCity(config, city);
  printSuccess(`  ${city.name} es ahora la ciudad default.`);
}

// ---- Option 8: settings ---------------------------------------------------

async function changeUnitFlow(config: Config): Promise<void> {
  console.log(`  Unidad actual: ${yellow(UNIT_SYMBOL[config.unit])}`);
  console.log("  1. °C (celsius)");
  console.log("  2. °F (fahrenheit)");
  const input = (await ask("  Elige la unidad: ")).trim();
  const unit = input === "1" ? "celsius" : input === "2" ? "fahrenheit" : null;
  if (unit === null) {
    printError("  Opción no válida.");
    return;
  }

  await setUnit(config, unit);
  printSuccess(`  Unidad cambiada a ${UNIT_SYMBOL[unit]}.`);
}

// ---- Dispatch -------------------------------------------------------------

export async function handleOption(
  config: Config,
  rawOption: string,
): Promise<void> {
  switch (rawOption) {
    case "1":
      await showDefaultWeather(config);
      break;
    case "2":
      await showAllWeather(config);
      break;
    case "3":
      await addCityFlow(config);
      break;
    case "4":
      await removeCityFlow(config);
      break;
    case "5":
      await setDefaultCityFlow(config);
      break;
    case "6":
      await showDailyForecast(config);
      break;
    case "8":
      await changeUnitFlow(config);
      break;
    default:
      printError("  Opción no válida.");
  }
}
