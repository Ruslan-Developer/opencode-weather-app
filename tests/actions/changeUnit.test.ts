import { beforeEach, describe, expect, test } from "bun:test";
import { setUnit } from "../../src/actions/changeUnit.ts";
import { CONFIG_PATH } from "../../src/storage/configFile.ts";
import { resetConfigFile } from "../helpers/config.ts";
import { makeConfig } from "../helpers/fixtures.ts";

beforeEach(resetConfigFile);

describe("setUnit", () => {
  test("changes the unit and persists it", async () => {
    const config = makeConfig();
    await setUnit(config, "fahrenheit");

    expect(config.unit).toBe("fahrenheit");
    const raw = await Bun.file(CONFIG_PATH).json();
    expect(raw.unit).toBe("fahrenheit");
  });
});
