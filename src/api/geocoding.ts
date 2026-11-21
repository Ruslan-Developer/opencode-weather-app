/**
 * Open-Meteo Geocoding API (no API key required).
 * Resolves a city name to latitude/longitude.
 */

import { ApiError } from "./apiError.ts";
import type { GeocodingResult } from "../types/Weather.ts";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

interface GeocodingResponse {
  results?: GeocodingResult[];
}

/**
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
