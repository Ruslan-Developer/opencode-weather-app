import { beforeEach, describe, expect, test } from "bun:test";
import { removeCity } from "../../src/actions/removeCity.ts";
import { CONFIG_PATH } from "../../src/storage/configFile.ts";
import { resetConfigFile } from "../helpers/config.ts";
import { makeCity, makeConfig } from "../helpers/fixtures.ts";

beforeEach(resetConfigFile);

const madrid = makeCity();
const lima = makeCity({ name: "Lima", country: "Perú", latitude: -12.046373, longitude: -77.042754 });

describe("removeCity", () => {
  test("removes the city at the index and persists the state", async () => {
    const config = makeConfig({ cities: [madrid, lima], defaultCity: "Madrid" });
    expect(await removeCity(config, 1)).toBe(lima);
    expect(config.cities).toEqual([madrid]);

    const raw = await Bun.file(CONFIG_PATH).json();
    expect(raw.cities).toEqual([madrid]);
    expect(raw.defaultCity).toBe("Madrid");
  });

  test("clears the default city when it was the one removed", async () => {
    const config = makeConfig({ cities: [madrid, lima], defaultCity: "madrid" });
    await removeCity(config, 0);
    expect(config.defaultCity).toBeNull();
  });

  test("returns undefined for an out-of-range index (state still persisted)", async () => {
    const config = makeConfig({ cities: [madrid] });
    expect(await removeCity(config, 5)).toBeUndefined();
    expect(config.cities).toEqual([madrid]);
    expect(await Bun.file(CONFIG_PATH).exists()).toBe(true);
  });
});
