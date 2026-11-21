/**
 * Console input: the line reader (built on Bun.stdin.stream() so it
 * works on a TTY and with redirected/piped input) plus small
 * parse/pick/confirm helpers.
 */

import { printError } from "./output.ts";
import { geocodingResultLabel } from "../utils/format.ts";
import type { GeocodingResult } from "../types/Weather.ts";

const decoder = new TextDecoder();
let buffer = "";
let stdinIterator: AsyncIterator<Uint8Array> | null = null;
let stdinClosed = false;

function getStdinIterator(): AsyncIterator<Uint8Array> {
  if (stdinIterator === null) {
    stdinIterator = Bun.stdin.stream()[Symbol.asyncIterator]();
  }
  return stdinIterator;
}

/** True once the input stream has reached EOF (no more input will arrive). */
export function isInputClosed(): boolean {
  return stdinClosed;
}

export async function ask(prompt: string): Promise<string> {
  process.stdout.write(prompt);

  if (stdinClosed) {
    return "";
  }

  while (!buffer.includes("\n")) {
    const next = await getStdinIterator().next();
    if (next.done === true) {
      stdinClosed = true;
      const remaining = buffer;
      buffer = "";
      return remaining.replace(/\r$/, "");
    }
    buffer += decoder.decode(next.value, { stream: true });
  }

  const newlineIndex = buffer.indexOf("\n");
  const line = buffer.slice(0, newlineIndex);
  buffer = buffer.slice(newlineIndex + 1);
  return line.replace(/\r$/, "");
}

/**
 * Releases the underlying stdin stream so it does not keep the
 * event loop alive after the menu loop has ended.
 */
export function closeInput(): void {
  buffer = "";
  if (stdinIterator !== null) {
    void stdinIterator.return?.(undefined);
    stdinIterator = null;
  }
}

/** Parses a 1-based numeric choice; null when invalid or out of range. */
export function parseCityIndex(
  input: string,
  count: number,
): number | null {
  const number = Number.parseInt(input, 10);
  if (
    Number.isNaN(number) ||
    number < 1 ||
    number > count
  ) {
    return null;
  }
  return number - 1;
}

/** Asks the user to pick one of several geocoding matches. */
export async function pickResult(
  results: GeocodingResult[],
): Promise<GeocodingResult | undefined> {
  console.log(`  Se encontraron ${results.length} coincidencias:`);
  results.forEach((result, index) => {
    console.log(`  ${index + 1}. ${geocodingResultLabel(result)}`);
  });

  const input =
    (await ask(`  Elige una (1-${results.length}) o Enter para cancelar: `))
      .trim();
  if (input === "") {
    return undefined;
  }
  const index = parseCityIndex(input, results.length);
  if (index === null) {
    printError("  Número no válido.");
    return undefined;
  }
  return results[index];
}

/** Yes/no confirmation: "s", "si" or "sí" means yes. */
export async function confirm(prompt: string): Promise<boolean> {
  const answer = (await ask(prompt)).trim().toLowerCase();
  return answer === "s" || answer === "si" || answer === "sí";
}
