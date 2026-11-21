/**
 * Interactive menu: rendering, input handling and the action behind
 * each option (user-facing text in Spanish, per README).
 */

import {
  blue,
  cyan,
  gray,
  green,
  magenta,
  red,
  yellow,
} from "./colors.ts";
import { ApiError, fetchTemperature, geocodeCity } from "./api.ts";
import type { City, Config } from "./storage.ts";
import { findCityIndex, saveConfig } from "./storage.ts";

const LINE = "════════════════════════════════════════";
const UNIT_SYMBOL = { celsius: "°C", fahrenheit: "°F" } as const;

// ---- Input helpers ------------------------------------------------------
// Line reader built on Bun.stdin.stream() so it works both on a TTY and
// with redirected/piped input.

const decoder = new TextDecoder();
let buffer = "";
let stdinIterator: AsyncIterator<Uint8Array> | null = null;
let stdinClosed = false;

function getStdinIterator(): AsyncIterator<Uint8Array> {
  if (stdinIterator === null) {
    stdinIterator = Bun.stdin.stream()[Symbol.asyncIterator]();
  }
  return stdinIterator;
}

/** True once the input stream has reached EOF (no more input will arrive). */
export function isInputClosed(): boolean {
  return stdinClosed;
}

export async function ask(prompt: string): Promise<string> {
  process.stdout.write(prompt);

  if (stdinClosed) {
    return "";
  }

  while (!buffer.includes("\n")) {
    const next = await getStdinIterator().next();
    if (next.done === true) {
      stdinClosed = true;
      const remaining = buffer;
      buffer = "";
      return remaining.replace(/\r$/, "");
    }
    buffer += decoder.decode(next.value, { stream: true });
  }

  const newlineIndex = buffer.indexOf("\n");
  const line = buffer.slice(0, newlineIndex);
  buffer = buffer.slice(newlineIndex + 1);
  return line.replace(/\r$/, "");
}

export function closeMenu(): void {
  buffer = "";
  if (stdinIterator !== null) {
    // Release the underlying stdin stream so it does not keep the
    // event loop alive after the menu loop has ended.
    void stdinIterator.return?.(undefined);
    stdinIterator = null;
  }
}

// ---- Rendering ----------------------------------------------------------

/** Renders one menu line: the whole option in its semantic color. */
function option(
  number: string,
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
  console.log(option("8", `Ajustes (${UNIT_SYMBOL[config.unit]})`, yellow));
  console.log(option("9", "Salir", gray));
  console.log(cyan(LINE));
}

function listCities(config: Config): void {
  config.cities.forEach((city, index) => {
    const region = city.country ? ` — ${city.country}` : "";
    console.log(`  ${index + 1}. ${city.name}${region}`);
  });
}

// ---- Option 1 / 2: weather ----------------------------------------------

function cityNameLabel(city: City): string {
  return city.country ? `${city.name} (${city.country})` : city.name;
}

async function showWeatherFor(city: City, config: Config): Promise<void> {
  try {
    const temperature = await fetchTemperature(
      city.latitude,
      city.longitude,
      config.unit,
    );
    console.log(
      `  ${cityNameLabel(city)}: ${yellow(`${temperature} ${UNIT_SYMBOL[config.unit]}`)}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(red(`  No se pudo obtener el clima de ${city.name}: ${message}`));
  }
}

async function showDefaultWeather(config: Config): Promise<void> {
  const defaultName = config.defaultCity;
  if (defaultName === null) {
    console.log("  No hay ciudad default establecida. Usa la opción 5.");
    return;
  }

  const city = config.cities.find(
    (candidate) => candidate.name.toLowerCase() === defaultName.toLowerCase(),
  );
  if (city === undefined) {
    console.log("  No hay ciudad default establecida. Usa la opción 5.");
    return;
  }
  await showWeatherFor(city, config);
}

async function showAllWeather(config: Config): Promise<void> {
  if (config.cities.length === 0) {
    console.log("  No hay ciudades guardadas. Usa la opción 3 para agregar.");
    return;
  }
  for (const city of config.cities) {
    await showWeatherFor(city, config);
  }
}

// ---- Option 3: search and add -------------------------------------------

async function addCity(config: Config): Promise<void> {
  const name = (await ask("  Nombre de la ciudad: ")).trim();
  if (name === "") {
    console.log(red("  Nombre vacío, cancelado."));
    return;
  }

  let results;
  try {
    results = await geocodeCity(name);
  } catch (error) {
    const message = error instanceof ApiError ? error.message : String(error);
    console.log(red(`  Error al buscar la ciudad: ${message}`));
    return;
  }

  const result = results[0];
  if (result === undefined) {
    console.log(red(`  No se encontró ninguna ciudad llamada "${name}".`));
    return;
  }

  const region = [result.admin1, result.country].filter(Boolean).join(", ");
  const label = region === "" ? result.name : `${result.name} — ${region}`;
  console.log(
    `  Encontrada: ${label} (${result.latitude}, ${result.longitude})`,
  );

  if (findCityIndex(config, result.name) !== -1) {
    console.log(red("  Esa ciudad ya está guardada."));
    return;
  }

  const confirm = (await ask("  ¿Agregarla? (s/n): ")).trim().toLowerCase();
  if (confirm !== "s" && confirm !== "si" && confirm !== "sí") {
    console.log("  Ciudad no agregada.");
    return;
  }

  const city: City = {
    name: result.name,
    country: result.country,
    latitude: result.latitude,
    longitude: result.longitude,
  };
  config.cities.push(city);
  await saveConfig(config);
  console.log(green(`  ${city.name} agregada correctamente.`));
}

// ---- Options 4 / 5: remove / set default ---------------------------------

function parseCityIndex(
  input: string,
  cities: City[],
): number | null {
  const number = Number.parseInt(input, 10);
  if (
    Number.isNaN(number) ||
    number < 1 ||
    number > cities.length
  ) {
    return null;
  }
  return number - 1;
}

async function removeCity(config: Config): Promise<void> {
  if (config.cities.length === 0) {
    console.log("  No hay ciudades guardadas.");
    return;
  }

  listCities(config);
  const input = (await ask(`  Número a eliminar (1-${config.cities.length}): `)).trim();
  const index = parseCityIndex(input, config.cities);
  if (index === null) {
    console.log(red("  Número no válido."));
    return;
  }

  const [removed] = config.cities.splice(index, 1);
  if (removed !== undefined && config.defaultCity !== null &&
      removed.name.toLowerCase() === config.defaultCity.toLowerCase()) {
    config.defaultCity = null;
  }
  await saveConfig(config);
  console.log(
    removed === undefined
      ? red("  Número no válido.")
      : green(`  ${removed.name} eliminada.`),
  );
}

async function setDefaultCity(config: Config): Promise<void> {
  if (config.cities.length === 0) {
    console.log("  No hay ciudades guardadas.");
    return;
  }

  listCities(config);
  const input = (await ask(`  Número de la default (1-${config.cities.length}): `)).trim();
  const index = parseCityIndex(input, config.cities);
  if (index === null) {
    console.log(red("  Número no válido."));
    return;
  }

  const city = config.cities[index];
  if (city === undefined) {
    console.log(red("  Número no válido."));
    return;
  }

  config.defaultCity = city.name;
  await saveConfig(config);
  console.log(green(`  ${city.name} es ahora la ciudad default.`));
}

// ---- Option 8: settings ---------------------------------------------------

async function changeUnit(config: Config): Promise<void> {
  console.log(`  Unidad actual: ${yellow(UNIT_SYMBOL[config.unit])}`);
  console.log("  1. °C (celsius)");
  console.log("  2. °F (fahrenheit)");
  const input = (await ask("  Elige la unidad: ")).trim();
  const unit = input === "1" ? "celsius" : input === "2" ? "fahrenheit" : null;
  if (unit === null) {
    console.log(red("  Opción no válida."));
    return;
  }

  config.unit = unit;
  await saveConfig(config);
  console.log(green(`  Unidad cambiada a ${UNIT_SYMBOL[unit]}.`));
}

// ---- Dispatch -------------------------------------------------------------

export async function handleOption(
  config: Config,
  option: string,
): Promise<void> {
  switch (option) {
    case "1":
      await showDefaultWeather(config);
      break;
    case "2":
      await showAllWeather(config);
      break;
    case "3":
      await addCity(config);
      break;
    case "4":
      await removeCity(config);
      break;
    case "5":
      await setDefaultCity(config);
      break;
    case "8":
      await changeUnit(config);
      break;
    default:
      console.log(red("  Opción no válida."));
  }
}
