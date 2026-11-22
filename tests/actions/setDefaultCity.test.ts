import { beforeEach, describe, expect, test } from "bun:test";
import { setDefaultCity } from "../../src/actions/setDefaultCity.ts";
import { CONFIG_PATH } from "../../src/storage/configFile.ts";
import { resetConfigFile } from "../helpers/config.ts";
import { makeCity, makeConfig } from "../helpers/fixtures.ts";

beforeEach(resetConfigFile);

describe("setDefaultCity", () => {
  test("sets the default city and persists it", async () => {
    const config = makeConfig({ cities: [makeCity()] });
    await setDefaultCity(config, makeCity());

    expect(config.defaultCity).toBe("Madrid");
    const raw = await Bun.file(CONFIG_PATH).json();
    expect(raw.defaultCity).toBe("Madrid");
  });
});
