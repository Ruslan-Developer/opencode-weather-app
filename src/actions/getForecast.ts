/**
 * Action: 7-day forecast for a city. Orchestrates the forecast API
 * and returns the daily list; errors are returned, never printed.
 */

import { fetchDailyForecast } from "../api/weather.ts";
import type { City } from "../types/City.ts";
import type { Config } from "../types/Config.ts";
import type { ForecastOutcome } from "../types/Weather.ts";

export async function getDailyForecast(
  config: Config,
  city: City,
): Promise<ForecastOutcome> {
  try {
    const forecast = await fetchDailyForecast(
      city.latitude,
      city.longitude,
      config.unit,
    );
    return { forecast, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { forecast: null, error: message };
  }
}
