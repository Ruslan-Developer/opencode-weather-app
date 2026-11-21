/**
 * A saved city: geocoding-resolved coordinates plus display metadata.
 */

export interface City {
  name: string;
  country: string | null;
  latitude: number;
  longitude: number;
}

/**
 * Type guard for cities read from the persisted config file.
 * `country` may be missing in configs written by older versions.
 */
export function isCity(value: unknown): value is City {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.name === "string" &&
    typeof record.latitude === "number" &&
    typeof record.longitude === "number" &&
    (record.country === undefined ||
      record.country === null ||
      typeof record.country === "string")
  );
}
