# AGENTS.md

Weather CLI app (Spanish-language README). Bun runtime, Open-Meteo public APIs, no framework.

## State of the repo

- The app is implemented and working. The README describes user-facing behavior; keep it in sync when behavior changes.
- Structure (layered per `references/file-system.md`: `actions/` never do console I/O; `presentation/` owns it):
  - `src/index.ts` — entrypoint: loads config, runs the menu loop until "Salir" (9) or EOF, then saves and `process.exit(0)` (needed because `Bun.stdin.stream()` keeps the event loop alive on a TTY).
  - `src/presentation/menu.ts` — menu rendering and the interactive flow behind each option (1 default-city weather, 2 all cities, 3 search/add with multi-result disambiguation picker, 4 remove, 5 set default, 6 7-day forecast — number picks a city, Enter uses the default, 8 unit settings, 9 exit; 7 is an unused gap, don't renumber). Flows collect input, call actions and print results.
  - `src/presentation/input.ts` — the line reader (`ask()` built on `Bun.stdin.stream()`, works on TTY and piped input), number parsing (`parseCityIndex`), the geocoding-match picker and yes/no confirmations.
  - `src/presentation/output.ts` — all user-facing printing helpers (weather lines, numbered city lists, forecast lines, ok/error messages).
  - `src/actions/` — one module per user action (`getWeather`, `getForecast`, `addCity`, `removeCity`, `setDefaultCity`, `listCities`, `changeUnit`); they orchestrate storage + api, mutate the shared `Config` and return data/results (errors included). Never print or read input.
  - `src/storage/` — `configFile.ts` is the only module that touches the disk: JSON persistence at `~/.weather-cli.json` (`Bun.file`/`Bun.write`); loader validates fields and falls back to defaults on corrupt config instead of crashing. `citiesStorage.ts` (saved cities: lookups, list mutations) and `settingsStorage.ts` (default city + unit, `loadConfig` re-export) are the public API over that single shared file; every save persists the whole state.
  - `src/api/` — Open-Meteo two-step flow: `geocoding.ts` (`geocoding-api.open-meteo.com/v1/search`) for lat/lon, then `weather.ts` (`api.open-meteo.com/v1/forecast`) — current temperature via `fetchTemperature` and max/min + WMO weather codes for 7 days via `fetchDailyForecast` (descriptions via `describeWeatherCode`). No API key. Errors surface as `ApiError` (`apiError.ts`).
  - `src/types/` — shared types and contracts: `City.ts` (with the `isCity` guard), `Config.ts`, `Weather.ts` (API/result types), `MenuOption.ts`.
  - `src/utils/` — `colors.ts` — hand-rolled ANSI helpers, no chalk. Menu options are color-coded per option (cyan/blue weather, green add, red remove, magenta default, yellow settings, gray exit); `yellow` also marks temperatures, `green`/`red` also ok/error messages. `styled(codes, text)` combines style+color pairs (e.g. forecast descriptions are italic and severity-colored: cyan clear, gray overcast, bright blue rain, bright white snow, bright red storm). Auto-disabled when stdout is not a TTY or `NO_COLOR` is set; preserve that when touching output. Also `format.ts` (pure formatters: dates, temperatures, labels) and `constants.ts` (`LINE`, `UNIT_SYMBOL`).
  - `tests/` — Bun test suite (`bun test`), mirroring `src/` per layer. `helpers/isolateHome.ts` is a `bunfig.toml` preload that redirects `os.homedir()` to a temp dir, so tests read/write an isolated `.weather-cli.json` (never the real one); `helpers/fetchMock.ts` swaps `globalThis.fetch` (each file registers `afterEach(restoreFetch)`); `helpers/fixtures.ts` builds cities/configs/geocoding results. All network is mocked — no test hits the real Open-Meteo APIs. `menu.ts` interactive flows are untested (no TTY simulation).
- Known limitations (tracked in `ideas-revision.md`): no loading indicators for async work, no `~/.config/weather-cli/` migration for the binary.

## Commands

- `bun install` — only supported installer (`bun.lock`); do not use npm/pnpm/yarn.
- `bun run typecheck` — runs `bun check` (Bun 1.4 built-in checker, backed by the native TypeScript 7 peer dep). It typechecks, it does not emit.
- `bun run test` — runs the test suite (`bun test`); tests live in `tests/`.
- `bun run build` — release gate: `typecheck` + `test` + `compile`; the binary is only built when both pass. Use it instead of plain `compile`.
- `bun run start` / `bun run dev` — run the CLI (`dev` adds `--watch`).
- `bun run compile` — standalone binary to `dist/weather` (`dist/weather.exe` on Windows). `dist/` is gitignored; re-run after changes, the committed binary does not exist.
- No lint, formatter, or CI exists.

## tsconfig constraints that change how you write code

- `verbatimModuleSyntax` — type-only imports must use `import type`.
- `noUncheckedIndexedAccess` — indexing arrays/records yields `T | undefined`; handle it (menu/argv parsing especially).
- `allowImportingTsExtensions` + `noEmit` — import local files with explicit `.ts` extensions; code is run directly by Bun, never compiled to JS.
- `types: ["bun"]` — use Bun/Web APIs (`Bun.file`, `fetch`, `Bun.write`) freely; Node APIs only if typed via `bun-types`.

## Conventions

- Code, comments, and identifiers in English; user-facing CLI text and README in Spanish.
- Dependencies are intentionally minimal (only `@types/bun` + `typescript`). Prefer `fetch` and Bun built-ins over adding packages.
