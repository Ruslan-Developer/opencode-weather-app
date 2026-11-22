import { beforeEach, describe, expect, test } from "bun:test";
import {
  clearDefaultCityIfRemoved,
  saveSettings,
} from "../../src/storage/settingsStorage.ts";
import { CONFIG_PATH } from "../../src/storage/configFile.ts";
import { resetConfigFile } from "../helpers/config.ts";
import { makeCity, makeConfig } from "../helpers/fixtures.ts";

beforeEach(resetConfigFile);

const madrid = makeCity();

describe("clearDefaultCityIfRemoved", () => {
  test("clears the default city when the removed name matches (case-insensitive)", () => {
    const config = makeConfig({ defaultCity: "MADRID" });
    clearDefaultCityIfRemoved(config, "Madrid");
    expect(config.defaultCity).toBeNull();
  });

  test("keeps the default city when a different one was removed", () => {
    const config = makeConfig({ defaultCity: "Madrid" });
    clearDefaultCityIfRemoved(config, "Lima");
    expect(config.defaultCity).toBe("Madrid");
  });

  test("does nothing when no default city is set", () => {
    const config = makeConfig();
    clearDefaultCityIfRemoved(config, "Madrid");
    expect(config.defaultCity).toBeNull();
  });
});

describe("saveSettings", () => {
  test("persists the whole shared state (settings and cities)", async () => {
    const config = makeConfig({
      cities: [madrid],
      defaultCity: "Madrid",
      unit: "fahrenheit",
    });
    await saveSettings(config);
    const raw = await Bun.file(CONFIG_PATH).json();
    expect(raw).toEqual({
      cities: [madrid],
      defaultCity: "Madrid",
      unit: "fahrenheit",
    });
  });
});
