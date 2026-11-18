# AGENTS.md

Weather CLI app (Spanish-language README). Bun runtime, Open-Meteo public APIs, no framework.

## State of the repo

- `index.ts` is still the `bun init` stub (`console.log("Hello via Bun!")`). The README is the spec, not a description of existing behavior.
- README spec: interactive menu (default-city weather, weather for all saved cities, add/search city, remove city, set default city, °C settings) plus a standalone binary as the final deliverable.
- Planned API flow is two steps, not one: geocoding (`geocoding-api.open-meteo.com/v1/search`) to get lat/lon, then forecast (`api.open-meteo.com/v1/forecast`). No API key.
- Nothing is implemented yet for persistence, the menu, or HTTP fetching. Don't assume helpers exist.

## Commands

- `bun install` — only supported installer (`bun.lock`); do not use npm/pnpm/yarn.
- `bun run typecheck` — the only verification gate; runs `bun check` (Bun 1.4 built-in checker, backed by the native TypeScript 7 peer dep). It typechecks, it does not emit.
- `bun run index.ts` — run the CLI.
- No lint, formatter, test script, or CI exists. `bun test` works if tests are added, but there are none yet; don't claim tests pass unless you add them.
- No build/package script yet. For the standalone binary deliverable, `bun build --compile ./index.ts` is the Bun mechanism; add a script rather than inventing another bundler. Build output dirs `dist/` and `out/` are gitignored.

## tsconfig constraints that change how you write code

- `verbatimModuleSyntax` — type-only imports must use `import type`.
- `noUncheckedIndexedAccess` — indexing arrays/records yields `T | undefined`; handle it (menu/argv parsing especially).
- `allowImportingTsExtensions` + `noEmit` — import local files with explicit `.ts` extensions; code is run directly by Bun, never compiled to JS.
- `types: ["bun"]` — use Bun/Web APIs (`Bun.file`, `fetch`, `Bun.write`) freely; Node APIs only if typed via `bun-types`.

## Conventions

- Code, comments, and identifiers in English; user-facing CLI text and README in Spanish.
- Dependencies are intentionally minimal (only `@types/bun` + `typescript`). Prefer `fetch` and Bun built-ins over adding packages.
