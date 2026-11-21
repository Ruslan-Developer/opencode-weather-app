/**
 * Minimal ANSI color helpers (no external dependency).
 *
 * Color roles used across the CLI:
 *  - menu:    each option has its own semantic color (see renderMenu)
 *  - yellow:  temperatures, unit symbols and the settings option
 *  - green:   success confirmations and the add-city option
 *  - red:     errors, invalid input and the remove-city option
 *
 * Codes are disabled when stdout is not a TTY or NO_COLOR is set,
 * so piped/redirected output stays clean.
 */

const enabled =
  process.stdout.isTTY === true && process.env["NO_COLOR"] === undefined;

function wrap(codes: string, text: string): string {
  return enabled ? `\x1b[${codes}m${text}\x1b[0m` : text;
}

/**
 * Generic style combiner: `styled("3;36", text)` renders text in
 * italic cyan. Used when a role needs a style + color pair that has
 * no dedicated helper.
 */
export function styled(codes: string, text: string): string {
  return wrap(codes, text);
}

export function cyan(text: string): string {
  return wrap("36", text);
}

export function blue(text: string): string {
  return wrap("34", text);
}

export function magenta(text: string): string {
  return wrap("35", text);
}

export function gray(text: string): string {
  return wrap("90", text);
}

export function yellow(text: string): string {
  return wrap("33", text);
}

export function green(text: string): string {
  return wrap("32", text);
}

export function red(text: string): string {
  return wrap("31", text);
}
