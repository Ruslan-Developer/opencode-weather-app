/**
 * Test double for `globalThis.fetch`: the Open-Meteo API modules call
 * bare `fetch`, so swapping the global keeps the network tests offline.
 * Install per test and restore afterwards — each API/action test file
 * registers `afterEach(restoreFetch)`.
 */

type FetchHandler = (
  url: string,
  init?: RequestInit,
) => Response | Promise<Response>;

const originalFetch = globalThis.fetch;

/** Replaces `fetch` with a handler that receives the requested URL. */
export function installFetchMock(handler: FetchHandler): void {
  globalThis.fetch = (async (
    input: string | URL | Request,
    init?: RequestInit,
  ) => {
    const url = typeof input === "string"
      ? input
      : input instanceof URL
      ? input.href
      : input.url;
    return handler(url, init);
  }) as typeof fetch;
}

/** Restores the real `fetch`. Register with `afterEach`. */
export function restoreFetch(): void {
  globalThis.fetch = originalFetch;
}

/** JSON response helper (Open-Meteo style payload). */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Non-2xx response helper to trigger the ApiError paths. */
export function textResponse(status: number, body = ""): Response {
  return new Response(body, { status });
}
