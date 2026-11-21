/**
 * Low-level persistence for the config file (~/.weather-cli.json).
 * Stored as JSON in the user's home directory so the compiled binary
 * works from any folder. This is the only module that touches the
 * disk; the storage/* public modules build on it.
 */

import { homedir } from "node:os";
import { join } from "node:path";
import { isCity } from "../types/City.ts";
import type { Config } from "../types/Config.ts";

export const CONFIG_PATH = join(homedir(), ".weather-cli.json");

const DEFAULT_CONFIG: Config = {
  cities: [],
  defaultCity: null,
  unit: "celsius",
};

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
