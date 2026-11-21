/**
 * Persistence for saved cities, the default city and the temperature unit.
 * Stored as JSON in the user's home directory so the compiled binary
 * works from any folder.
 */

import { homedir } from "node:os";
import { join } from "node:path";

export interface City {
  name: string;
  country: string | null;
  latitude: number;
  longitude: number;
}

export interface Config {
  cities: City[];
  defaultCity: string | null;
  unit: "celsius" | "fahrenheit";
}

const CONFIG_PATH = join(homedir(), ".weather-cli.json");

const DEFAULT_CONFIG: Config = {
  cities: [],
  defaultCity: null,
  unit: "celsius",
};

function isCity(value: unknown): value is City {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.name === "string" &&
    typeof record.latitude === "number" &&
    typeof record.longitude === "number" &&
    (record.country === undefined ||
      record.country === null ||
      typeof record.country === "string")
  );
}

export async function loadConfig(): Promise<Config> {
  const file = Bun.file(CONFIG_PATH);
  if (!(await file.exists())) {
    return { cities: [], defaultCity: null, unit: "celsius" };
  }

  try {
    const raw = (await file.json()) as Record<string, unknown>;
    return {
      cities: Array.isArray(raw.cities)
        ? raw.cities.filter(isCity)
        : [...DEFAULT_CONFIG.cities],
      defaultCity:
        typeof raw.defaultCity === "string" ? raw.defaultCity : null,
      unit: raw.unit === "fahrenheit" ? "fahrenheit" : "celsius",
    };
  } catch {
    // Corrupted config: start fresh rather than crash.
    return { cities: [], defaultCity: null, unit: "celsius" };
  }
}

export async function saveConfig(config: Config): Promise<void> {
  await Bun.write(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`);
}

export function findCityIndex(config: Config, name: string): number {
  return config.cities.findIndex(
    (city) => city.name.toLowerCase() === name.toLowerCase(),
  );
}
