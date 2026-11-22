import { afterEach, describe, expect, test } from "bun:test";
import { geocodeCity } from "../../src/api/geocoding.ts";
import { ApiError } from "../../src/api/apiError.ts";
import {
  installFetchMock,
  jsonResponse,
  restoreFetch,
  textResponse,
} from "../helpers/fetchMock.ts";
import { makeGeocodingResult } from "../helpers/fixtures.ts";

afterEach(restoreFetch);

describe("geocodeCity", () => {
  test("builds the search URL with the encoded name and defaults", async () => {
    let requestedUrl = "";
    installFetchMock((url) => {
      requestedUrl = url;
      return jsonResponse({ results: [] });
    });

    await geocodeCity("New York");
    expect(requestedUrl).toBe(
      "https://geocoding-api.open-meteo.com/v1/search" +
        "?name=New%20York&count=5&language=es&format=json",
    );
  });

  test("honors a custom result count", async () => {
    let requestedUrl = "";
    installFetchMock((url) => {
      requestedUrl = url;
      return jsonResponse({ results: [] });
    });

    await geocodeCity("Madrid", 3);
    expect(requestedUrl).toContain("count=3");
  });

  test("maps results and defaults missing country/admin1 to null", async () => {
    installFetchMock(() =>
      jsonResponse({
        results: [
          { name: "Madrid", latitude: 40.416775, longitude: -3.70379 },
          makeGeocodingResult(),
        ],
      }),
    );

    expect(await geocodeCity("madrid")).toEqual([
      {
        name: "Madrid",
        country: null,
        admin1: null,
        latitude: 40.416775,
        longitude: -3.70379,
      },
      makeGeocodingResult(),
    ]);
  });

  test("returns an empty list when the API reports no results", async () => {
    installFetchMock(() => jsonResponse({}));
    expect(await geocodeCity("xyzzy")).toEqual([]);
  });

  test("throws an ApiError on an HTTP failure", async () => {
    installFetchMock(() => textResponse(503, "unavailable"));
    try {
      await geocodeCity("Madrid");
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).message).toBe(
        "Geocoding API responded with status 503",
      );
    }
  });
});
