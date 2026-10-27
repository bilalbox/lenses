# Lenses (عدسات) — agent instructions

## Definition of Done (Mandatory Gate)

Before considering any code change or task done (even when not pushing), **always run `pnpm gate:fast` first**.

Do not declare completion with only piecemeal checks (`biome`, bare `tsc --noEmit`, or a single lint script). `pnpm gate:fast` bundles:

1. `biome check` (format + lint)
2. `lint:graph` (`rev-dep` — cycles, orphans, unused exports/deps, duplicates)
3. `lint:complexity` (Biome cognitive-complexity shrink-only ratchet)
4. `typecheck` (`tsc -b`)
5. `lint:py` (`ruff`, `basedpyright`, `tach`, `vulture`)

`pnpm gate` = `pnpm gate:fast && pnpm test` (CI and pre-push).

A task is not complete until `pnpm gate:fast` passes cleanly.

## Architecture

- Client: `src/` (Vite + React 19 SPA, SVG dependency tree, quiz engine, rhetoric studio).
- Data: `public/data/quran/` (static JSON files for surahs, morphology, iʿrāb, rhetoric).
- Pipeline: `scripts/` (Python ingestion, dataset building, validation).
