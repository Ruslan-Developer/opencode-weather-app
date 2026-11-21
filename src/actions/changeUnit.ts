/**
 * Action: change the temperature unit and persist.
 */

import { saveSettings } from "../storage/settingsStorage.ts";
import type { Config } from "../types/Config.ts";
import type { TemperatureUnit } from "../types/Weather.ts";

export async function setUnit(
  config: Config,
  unit: TemperatureUnit,
): Promise<void> {
  config.unit = unit;
  await saveSettings(config);
}
