/**
 * Weather CLI — entrypoint.
 * Runs the interactive menu loop until the user picks "Salir" (9)
 * or the input stream closes.
 */

import { green } from "./utils/colors.ts";
import { ask, closeInput, isInputClosed } from "./presentation/input.ts";
import { handleOption, renderMenu } from "./presentation/menu.ts";
import { loadConfig, saveSettings } from "./storage/settingsStorage.ts";

const config = await loadConfig();

try {
  while (true) {
    renderMenu(config);
    const option = (await ask("  Selecciona una opción: ")).trim();
    console.log("");

    if (option === "9" || isInputClosed()) {
      break;
    }

    await handleOption(config, option);

    if (isInputClosed()) {
      break;
    }
    await ask("\n  Pulsa Enter para continuar...");
    console.log("");
  }
} finally {
  closeInput();
}

await saveSettings(config);
console.log(green("  ¡Hasta luego!"));
// Bun.stdin.stream() keeps the event loop alive while the stream is open
// (always the case on an interactive TTY), so exit explicitly.
process.exit(0);
