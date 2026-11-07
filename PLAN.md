# Implementation Plan: Usul al-Fiqh & Dalalat al-Alfaz Lens Spike (Surah Al-Baqarah)

## 0. Reconnaissance & Architecture Mapping

### Stack & Tooling Audit

- **Runtime & UI**: Vite + React 19 SPA, TypeScript (`tsconfig.base.json`, `tsconfig.app.json`, `tsconfig.test.json`).
- **Quality Gates**: `pnpm gate:fast` (Biome 2.6.3, `rev-dep` dependency graph check, Biome complexity ratchet, `tsc -b`, Python linting via `ruff`, `basedpyright`, `tach`, `vulture`).
- **Test Runner**: Vitest 5.0.5 for TypeScript (`vitest run`), pytest for Python (`pytest -q`).
- **Deployment**: Static build output deployed via Cloudflare Workers / Pages (`wrangler deploy`).
- **Data Architecture**: Static JSON files loaded on demand via `/data/quran/{layer}.json` or `/data/quran/{layer}/{surah:03d}.json` with in-memory caching in `src/lib/layers.ts`.

### Existing Quranic Coordinates & Storage Layer

- **Surahs**: Numbered 1–114.
- **Ayahs**: `v: number` (1-indexed).
- **Words**: `w: Word[]` where `n: number` (1-indexed token coordinate within ayah).
- **Segments**: `s: Segment[]` with `k` ("p" prefix, "m" main/stem, "s" suffix), `p` (POS), `a` (Arabic text), and grammatical features `f` (`mood`, `case`, `state`, etc.).
- **Morphological Data**: Fully pre-ingested in `public/data/quran/surah/002.json` and cached in `data/cache/quranic-corpus-morphology-0.4.txt`.

### Reuse Over Duplication

- No duplicate Quranic text or word token tables created.
- Shawahid records reference existing coordinates (`verseKey: "2:X"`, `ayahNumber: X`, `wordStart`, `wordEnd`).
- Arabic normalization uses `stripDiacritics` from `src/lib/arabic.ts`.
- Taxonomy definitions are centrally stored in `public/data/quran/usulTaxonomy.json` and typed via Zod in `src/lib/usulTypes.ts`.
- Per-surah Usuli data is stored at `public/data/quran/usul/002.json` and integrated with `src/lib/layers.ts` and `src/lib/readerLayers.ts`.

---

## 1. Module & Directory Structure

```
src/
  lib/
    usulTypes.ts          # Zod schemas (UsuliShahidSchema, UsuliTaxonomyIdSchema, etc.) & types
    usulTaxonomy.ts       # 24 canonical taxonomy node definitions & category groupings
    usulSearch.ts         # Normalized search & facet filtering
    usulQuizEngine.ts     # 4 drill generators: IDENTIFY_DALALAH, SPOT_THE_QARINAH, LOCATE_SHAHID_SPAN, USULI_KHILAF_DRILL
    readerLayers.ts       # Added "usul" drawer state and reader integration
    layers.ts             # Added "usul" layer loading (/data/quran/usul/{nnn}.json)
  components/
    UsulSection.tsx       # Collapsible reader drawer displaying Usuli shawahid, spans, and rulings
    VerseSecondaryLayers.tsx # Integrated UsulSection into verse drawer stack
public/data/quran/
  usulTaxonomy.json       # 24 Usuli taxonomy nodes metadata
  usul/
    002.json              # Surah 2 Usuli Shawahid file (Golden Seed + Stage 1 candidates)
scripts/
  usul_baqarah_spike.py   # Deterministic candidate scanner over Surah 2 morphology + pipeline emitter
tests/
  unit/
    usulTypes.test.ts     # Schema validation and invariants
    usulSearch.test.ts    # Normalized Arabic search and facet filtering
    usulQuizEngine.test.ts# Drill generation and distractor logic for all 4 modes
  integration/
    usulData.test.ts      # Integrity tests for Surah 2 usul dataset and Golden Seed
```

---

## 2. Proposed TDD Seams

In accordance with the repository's test conventions and TDD discipline:

1. **Seam 1: Domain Schemas & Taxonomy (`src/lib/usulTypes.ts` & `src/lib/usulTaxonomy.ts`)**
   - _Public Interface_: `UsuliShahidSchema.parse()`, `UsuliTaxonomyIdSchema.parse()`, `getTaxonomyNode(id)`
   - _Catches_: Invalid coordinates, malformed data, schema regressions.
   - _Misses_: Search filtering logic, DOM rendering.

2. **Seam 2: Normalized Search & Facet Filters (`src/lib/usulSearch.ts`)**
   - _Public Interface_: `searchUsuliShawahid(shawahid, query)`
   - _Catches_: Arabic tashkeel / alif normalization mismatches, facet filter bugs (`categoryGroup`, `hasQarinahSarifah`, `isCanonicalShahid`), multi-word matching.
   - _Misses_: Network layer, UI presentation.

3. **Seam 3: Usuli Quiz Engine (`src/lib/usulQuizEngine.ts`)**
   - _Public Interface_: `generateIdentifyDalalahDrill()`, `generateSpotTheQarinahDrill()`, `generateLocateSpanDrill()`, `generateKhilafDrill()`
   - _Catches_: Distractor collisions, invalid category sampling, span hit-test failures, empty options.
   - _Misses_: React DOM event propagation.

4. **Seam 4: Dataset Integrity (`tests/integration/usulData.test.ts`)**
   - _Public Interface_: Ingest and validate `public/data/quran/usul/002.json` and `public/data/quran/usulTaxonomy.json`.
   - _Catches_: Missing Golden Seed records, out-of-range word indices against Surah 2 tokens, corrupt JSON formatting.
   - _Misses_: Interactive user input.

5. **Seam 5: UI Layer Integration (`src/components/UsulSection.tsx`)**
   - _Public Interface_: Rendering active ayah's Usuli shawahid with span indicators, qarinah links, and collapsible drawer.
   - _Catches_: Missing prop crashes, broken drawer toggles, span highlight rendering.
   - _Misses_: Browser layout/viewport responsive styling.
