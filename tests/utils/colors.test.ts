import { describe, expect, test } from "bun:test";
import {
  blue,
  cyan,
  gray,
  green,
  magenta,
  red,
  styled,
  weatherCodeStyle,
  yellow,
} from "../../src/utils/colors.ts";

/**
 * colors.ts captures `enabled` (TTY + NO_COLOR) at import time, and
 * tests may run in either mode (interactive terminal or piped output),
 * so the plain-text/ANSI assertions below are conditional on the same
 * condition the module uses. The pure WMO-code mapping is asserted
 * unconditionally.
 */
const colorsEnabled =
  process.stdout.isTTY === true && process.env["NO_COLOR"] === undefined;

describe("weatherCodeStyle", () => {
  test("maps WMO codes to severity styles", () => {
    // Clear
    expect(weatherCodeStyle(0)).toBe("3;36");
    expect(weatherCodeStyle(2)).toBe("3;36");
    // Overcast / fog
    expect(weatherCodeStyle(3)).toBe("3;90");
    expect(weatherCodeStyle(45)).toBe("3;90");
    expect(weatherCodeStyle(48)).toBe("3;90");
    // Drizzle / rain
    expect(weatherCodeStyle(51)).toBe("3;94");
    expect(weatherCodeStyle(67)).toBe("3;94");
    expect(weatherCodeStyle(80)).toBe("3;94");
    expect(weatherCodeStyle(82)).toBe("3;94");
    // Snow
    expect(weatherCodeStyle(71)).toBe("3;97");
    expect(weatherCodeStyle(77)).toBe("3;97");
    expect(weatherCodeStyle(85)).toBe("3;97");
    expect(weatherCodeStyle(86)).toBe("3;97");
    // Storm
    expect(weatherCodeStyle(95)).toBe("3;91");
    expect(weatherCodeStyle(99)).toBe("3;91");
    // Unmapped codes fall back to gray
    expect(weatherCodeStyle(42)).toBe("3;90");
    expect(weatherCodeStyle(68)).toBe("3;90");
  });
});

describe("color helpers", () => {
  test("wrap text with the matching ANSI codes when enabled", () => {
    if (!colorsEnabled) return;
    expect(cyan("hola")).toBe("\x1b[36mhola\x1b[0m");
    expect(blue("hola")).toBe("\x1b[34mhola\x1b[0m");
    expect(magenta("hola")).toBe("\x1b[35mhola\x1b[0m");
    expect(gray("hola")).toBe("\x1b[90mhola\x1b[0m");
    expect(yellow("hola")).toBe("\x1b[33mhola\x1b[0m");
    expect(green("hola")).toBe("\x1b[32mhola\x1b[0m");
    expect(red("hola")).toBe("\x1b[31mhola\x1b[0m");
    expect(styled("3;36", "hola")).toBe("\x1b[3;36mhola\x1b[0m");
  });

  test("return the plain text when disabled", () => {
    if (colorsEnabled) return;
    expect(cyan("hola")).toBe("hola");
    expect(blue("hola")).toBe("hola");
    expect(magenta("hola")).toBe("hola");
    expect(gray("hola")).toBe("hola");
    expect(yellow("hola")).toBe("hola");
    expect(green("hola")).toBe("hola");
    expect(red("hola")).toBe("hola");
    expect(styled("3;36", "hola")).toBe("hola");
  });
});
