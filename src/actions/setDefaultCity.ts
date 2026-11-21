/**
 * Action: establish the default city among the saved ones and persist.
 */

import { saveSettings } from "../storage/settingsStorage.ts";
import type { City } from "../types/City.ts";
import type { Config } from "../types/Config.ts";

export async function setDefaultCity(
  config: Config,
  city: City,
): Promise<void> {
  config.defaultCity = city.name;
  await saveSettings(config);
}
