# AGENTS.md

Weather CLI app (Spanish-language README). Bun runtime, Open-Meteo public APIs, no framework.

## State of the repo

- The app is implemented and working. The README describes user-facing behavior; keep it in sync when behavior changes.
- Structure:
  - `index.ts` — entrypoint: loads config, runs the menu loop until "Salir" (9) or EOF, then saves and `process.exit(0)` (needed because `Bun.stdin.stream()` keeps the event loop alive on a TTY).
  - `src/menu.ts` — menu rendering, the line reader (`ask()` built on `Bun.stdin.stream()`, works on TTY and piped input) and the action behind each option (1 default-city weather, 2 all cities, 3 search/add, 4 remove, 5 set default, 6 7-day forecast, 8 unit settings, 9 exit; 7 is an unused gap, don't renumber).
  - `src/api.ts` — Open-Meteo two-step flow: geocoding (`geocoding-api.open-meteo.com/v1/search`) for lat/lon, then forecast (`api.open-meteo.com/v1/forecast`) — current temperature via `fetchTemperature` and max/min + WMO weather codes for 7 days via `fetchDailyForecast` (descriptions via `describeWeatherCode`). No API key. Errors surface as `ApiError`.
  - `src/storage.ts` — JSON persistence at `~/.weather-cli.json` (`Bun.file`/`Bun.write`); loader validates fields and falls back to defaults on corrupt config instead of crashing.
  - `src/colors.ts` — hand-rolled ANSI helpers, no chalk. Menu options are color-coded per option (cyan/blue weather, green add, red remove, magenta default, yellow settings, gray exit); `yellow` also marks temperatures, `green`/`red` also ok/error messages. `styled(codes, text)` combines style+color pairs (e.g. forecast descriptions are italic and severity-colored: cyan clear, gray overcast, bright blue rain, bright white snow, bright red storm). Auto-disabled when stdout is not a TTY or `NO_COLOR` is set; preserve that when touching output.
- Known limitations (tracked in `ideas-revision.md`): no tests, no loading indicators for async work, no `~/.config/weather-cli/` migration for the binary.

## Commands

- `bun install` — only supported installer (`bun.lock`); do not use npm/pnpm/yarn.
- `bun run typecheck` — the only verification gate; runs `bun check` (Bun 1.4 built-in checker, backed by the native TypeScript 7 peer dep). It typechecks, it does not emit.
- `bun run start` / `bun run dev` — run the CLI (`dev` adds `--watch`).
- `bun run compile` — standalone binary to `dist/weather` (`dist/weather.exe` on Windows). `dist/` is gitignored; re-run after changes, the committed binary does not exist.
- No lint, formatter, test script, or CI exists. `bun test` works if tests are added, but there are none yet; don't claim tests pass unless you add them.

## tsconfig constraints that change how you write code

- `verbatimModuleSyntax` — type-only imports must use `import type`.
- `noUncheckedIndexedAccess` — indexing arrays/records yields `T | undefined`; handle it (menu/argv parsing especially).
- `allowImportingTsExtensions` + `noEmit` — import local files with explicit `.ts` extensions; code is run directly by Bun, never compiled to JS.
- `types: ["bun"]` — use Bun/Web APIs (`Bun.file`, `fetch`, `Bun.write`) freely; Node APIs only if typed via `bun-types`.

## Conventions

- Code, comments, and identifiers in English; user-facing CLI text and README in Spanish.
- Dependencies are intentionally minimal (only `@types/bun` + `typescript`). Prefer `fetch` and Bun built-ins over adding packages.
