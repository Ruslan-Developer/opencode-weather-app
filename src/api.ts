/**
 * HTTP calls to the public Open-Meteo APIs (no API key required).
 *
 * Flow (two steps, per README):
 *  1. Geocoding API  -> resolve a city name to latitude/longitude
 *  2. Forecast API   -> fetch the current temperature for those coordinates
 */

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export type TemperatureUnit = "celsius" | "fahrenheit";

export interface GeocodingResult {
  name: string;
  country: string | null;
  admin1: string | null;
  latitude: number;
  longitude: number;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
}

interface ForecastResponse {
  current?: {
    temperature_2m?: number;
  };
}

export class ApiError extends Error {}

/**
 * Step 1: Geocoding API.
 * Resolves a city name to coordinates. Returns matching results (may be empty).
 * Defaults to 5 results so ambiguous names can be disambiguated by the user.
 */
export async function geocodeCity(
  name: string,
  count = 5,
): Promise<GeocodingResult[]> {
  const url =
    `${GEOCODING_URL}?name=${encodeURIComponent(name)}` +
    `&count=${count}&language=es&format=json`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new ApiError(`Geocoding API responded with status ${response.status}`);
  }

  const data = (await response.json()) as GeocodingResponse;
  const results = data.results ?? [];
  return results.map((result) => ({
    name: result.name,
    country: result.country ?? null,
    admin1: result.admin1 ?? null,
    latitude: result.latitude,
    longitude: result.longitude,
  }));
}

/**
 * Step 2: Forecast API.
 * Fetches the current temperature (in the requested unit) for coordinates.
 */
export async function fetchTemperature(
  latitude: number,
  longitude: number,
  unit: TemperatureUnit,
): Promise<number> {
  const url =
    `${FORECAST_URL}?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m&temperature_unit=${unit}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new ApiError(`Forecast API responded with status ${response.status}`);
  }

  const data = (await response.json()) as ForecastResponse;
  const temperature = data.current?.temperature_2m;
  if (temperature === undefined) {
    throw new ApiError("Forecast API did not return a temperature");
  }
  return temperature;
}
