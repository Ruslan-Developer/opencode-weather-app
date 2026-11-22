/**
 * Preload for `bun test` (registered in bunfig.toml -> [test] preload).
 *
 * `configFile.ts` resolves CONFIG_PATH from `os.homedir()` at import
 * time, so this must run before any test file (and its imports) loads:
 * it redirects the home directory to a fresh temp folder, making every
 * test read and write an isolated `.weather-cli.json` instead of the
 * user's real config.
 */

import { mkdtempSync } from "node:fs";
import * as os from "node:os";
import { join } from "node:path";
import { mock } from "bun:test";

export const TEST_HOME = mkdtempSync(
  join(os.tmpdir(), "weather-cli-tests-"),
);

// Env fallback for anything resolving the home directory later on.
process.env["USERPROFILE"] = TEST_HOME;
process.env["HOME"] = TEST_HOME;

mock.module("node:os", () => ({
  ...os,
  homedir: () => TEST_HOME,
  default: { ...os, homedir: () => TEST_HOME },
}));
