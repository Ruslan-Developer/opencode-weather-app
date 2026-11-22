import { beforeEach, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { CONFIG_PATH, loadConfig, saveConfig } from "../../src/storage/configFile.ts";
import type { City } from "../../src/types/City.ts";
import type { Config } from "../../src/types/Config.ts";
import { resetConfigFile } from "../helpers/config.ts";
import { makeCity } from "../helpers/fixtures.ts";
import { TEST_HOME } from "../helpers/isolateHome.ts";

beforeEach(resetConfigFile);

const DEFAULTS: Config = { cities: [], defaultCity: null, unit: "celsius" };

describe("CONFIG_PATH", () => {
  test("resolves inside the isolated test home, not the real one", () => {
    expect(CONFIG_PATH).toBe(join(TEST_HOME, ".weather-cli.json"));
  });
});

describe("loadConfig", () => {
  test("returns defaults when the config file does not exist", async () => {
    expect(await Bun.file(CONFIG_PATH).exists()).toBe(false);
    expect(await loadConfig()).toEqual(DEFAULTS);
  });

  test("returns defaults when the file is corrupted JSON", async () => {
    await Bun.write(CONFIG_PATH, "{ not valid json ]");
    expect(await loadConfig()).toEqual(DEFAULTS);
  });

  test("round-trips a config saved with saveConfig", async () => {
    const config: Config = {
      cities: [
        makeCity(),
        makeCity({ name: "Lima", country: "Perú", latitude: -12.046373, longitude: -77.042754 }),
      ],
      defaultCity: "Madrid",
      unit: "fahrenheit",
    };
    await saveConfig(config);
    expect(await loadConfig()).toEqual(config);
  });

  test("filters invalid city entries and coerces invalid fields", async () => {
    await Bun.write(CONFIG_PATH, JSON.stringify({
      cities: [
        makeCity(),
        { name: "no coordinates" },
        "not a city",
        null,
        { name: "Legacy", latitude: 1, longitude: 2 },
      ],
      defaultCity: 42,
      unit: "kelvin",
    }));

    const loaded = await loadConfig();
    expect(loaded.cities).toEqual([
      makeCity(),
      { name: "Legacy", latitude: 1, longitude: 2 } as City,
    ]);
    expect(loaded.defaultCity).toBeNull();
    expect(loaded.unit).toBe("celsius");
  });

  test("accepts a valid fahrenheit unit and string default city", async () => {
    await Bun.write(CONFIG_PATH, JSON.stringify({
      cities: [],
      defaultCity: "Madrid",
      unit: "fahrenheit",
    }));

    const loaded = await loadConfig();
    expect(loaded.defaultCity).toBe("Madrid");
    expect(loaded.unit).toBe("fahrenheit");
  });
});
