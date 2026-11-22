/**
 * Disk helper for tests that go through persistence: deletes the
 * isolated test-home config file so each test starts from scratch.
 */

import { unlink } from "node:fs/promises";
import { CONFIG_PATH } from "../../src/storage/configFile.ts";

export async function resetConfigFile(): Promise<void> {
  try {
    await unlink(CONFIG_PATH);
  } catch {
    // No config file yet: nothing to reset.
  }
}
