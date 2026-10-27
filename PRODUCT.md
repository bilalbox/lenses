# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Intermediate students of Quranic Arabic working across English, Arabic, and Indonesian who are bridging textbook grammar (_naḥw_), morphology (_ṣarf_), and rhetoric (_balāghah_) with real Quranic verses. They open Lenses to inspect how words, clauses, and rhetorical figures function in context and to test their analytical fluency through structured drills.

## Product Purpose

Lenses (عدسات) is an installable, offline-capable reader and study companion for Quranic Arabic grammar and rhetoric. It lets learners open any verse, tap any word, and inspect multiple scholarly analytical layers side by side—morphological segmentation, syntactic dependency graphs, classical _iʿrāb_ and _ṣarf_, and curated rhetorical (_balāghah_) breakdowns—while reinforcing comprehension through corpus-wide example search and interactive multi-step grammar drills. Success means a learner can move fluidly from reading a verse to understanding its grammatical structure, finding parallel constructions across the Quran, and practicing active analysis without leaving the text.

## Positioning

Unlike single-source lookup tools that isolate either computational treebanks (such as `corpus.quran.com`) or classical Arabic-only compendia (such as `tafsir.app`), Lenses unifies the Quranic Arabic Corpus morphology and dependency treebank with the Tafsir Center's classical _iʿrāb_ and _ṣarf_, academic and classical _balāghah_ datasets, corpus-wide grammatical search, and interactive _iʿrāb_/_ṣarf_ drills in a fast, zero-backend offline web application localized across English, Arabic, and Indonesian.

## Operating Context

- Used during focused Quranic study, grammar review, and self-testing on both desktop and mobile browsers, or installed as a standalone Progressive Web App (PWA).
- Operates across three interface and commentary languages—English (`en`), Arabic (`ar`, RTL), and Indonesian (`id`)—while keeping classical Arabic grammatical terminology primary in the analytical layers.
- Built on React 19, TypeScript, and Vite, deployed as static assets on Cloudflare Workers (`wrangler.jsonc`), with a Python data pipeline (`scripts/build_data.py`, `scripts/build_rhetoric_dataset.py`) that compiles upstream scholarly datasets into static JSON (`public/data/quran/`).
- Pre-caches the application shell via a service worker and progressively caches all 114 surah files in the background after initial load so the entire library works offline.

## Capabilities and Constraints

- **Verse Reader (`#/<sura>/<verse>[/<word>]`):** Displays verbatim Uthmani script, verse-level translations (Saheeh International in English, PT. Sabiq in Indonesian) and _Al-Mukhtasar_ tafsir (English, Indonesian, Arabic), verse-level classical _iʿrāb_, interactive SVG syntactic dependency graphs (with segment nodes, implied pronouns, definite article attachments, and cross-verse boundary indicators), and a word inspection sheet (_WordSheet_) showing segment breakdown, root, lemma, part of speech, classical _iʿrāb_, _ṣarf_, and concise word meaning.
- **Surah Index (`#/surahs`) & Global Verse Finder:** Browse all 114 surahs with syntax coverage indicators, jump directly by `chapter:verse`, or search verses in Arabic (with or without diacritics) and English.
- **Example Search (`#/search`):** Corpus-wide grammatical concordancer (`words.json`) filtering all 77,429 words by root, lemma, part of speech, verb form, or syntactic relation.
- **Grammar & Morphology Drills (`#/quiz`):** Multi-step interactive wizard testing three analytical lenses on real verses—_Iʿrāb_ (syntactic role, head word, grammatical case, inflection sign), _Ṣarf_ (root, _wazn_/pattern, morphological class, structure), and _Example Hunt_ (spotting words in a verse matching a target grammatical criterion)—with an optional setting to strip diacritics (_tashkīl_) for unvocalized reading practice.
- **Rhetoric / Balāghah Explorer (`#/rhetoric` or `#/balagha`):** Structured anatomical breakdowns across three curated datasets: Quranic Similes (_Tashbīh & Tamthīl_), Elliptical Eloquence (_Ḥadhf & Iʿjāz_ with reconstructed _taqdīr_), and Classical Balāghah Masterpieces (_ʿIlm al-Maʿānī_, _ʿIlm al-Bayān_, _ʿIlm al-Badīʿ_).
- **Sources & Provenance (`#/sources`):** Documents dataset coverage and open-license attributions for every upstream source.
- **Non-negotiable Text & Coverage Integrity:**
  - The Tanzil Uthmani Quranic text (CC BY-ND 3.0) and QuranEnc _Al-Mukhtasar_ texts must remain verbatim and unedited.
  - Chapters 10–58 have no dependency treebank annotation in the published Quranic Arabic Corpus graphs (and Chapter 9 is partial at 91/129 verses); the product must state this coverage boundary honestly rather than fabricating trees.
  - Classical _iʿrāb_ and _ṣarf_ fields attach only where token alignment between the corpus tokenization and the Tafsir Center _rasm_ succeeds cleanly.
  - Unlicensed third-party aggregations (such as `tafsir.app`) must not be scraped or redistributed; every redistributed dataset must carry an explicit open license and credit in `public/data/NOTICES.txt` and `#/sources`.

## Brand Commitments

- **Name:** Bilingual identity—**عدسات** (Arabic) and **Lenses** (English).
- **Default Opening Verse:** Opens to Surah Al-Hashr `59:18` when no prior reading position is stored in `localStorage`.

## Evidence on Hand

- Derived static corpus data in [`public/data/quran/`](file:///home/bilal/mycode/lenses/public/data/quran/): [`manifest.json`](file:///home/bilal/mycode/lenses/public/data/quran/manifest.json), [`verses.json`](file:///home/bilal/mycode/lenses/public/data/quran/verses.json), [`words.json`](file:///home/bilal/mycode/lenses/public/data/quran/words.json), [`rhetoric.json`](file:///home/bilal/mycode/lenses/public/data/quran/rhetoric.json), and 114 per-surah JSON files covering 77,429 words, 2,436 syntax-annotated verses (7,373 dependency graphs), and 53 curated rhetoric entries across 34 surahs.
- License and provenance record in [`public/data/NOTICES.txt`](file:///home/bilal/mycode/lenses/public/data/NOTICES.txt) covering Quranic Arabic Corpus (0.4 morphology and syntax graphs), Tanzil Uthmani text (CC BY-ND 3.0), Tafsir Center linguistic database (CC BY 4.0), QuranEnc _Al-Mukhtasar_ (AR/EN/ID) and translations (Saheeh International, PT. Sabiq), Nashir et al. (2026) Quranic Simile Dataset (`arXiv:2601.19972`), Elliptical Eloquence Framework (EEF 2025), and classical _balāghah_ treatises (_Dalāʾil al-Iʿjāz_, _Al-Kashshāf_, _Miftāḥ al-ʿUlūm_, _Al-Itqān_).
- No user accounts, telemetry, testimonials, or commercial pricing exist; future work must not fabricate social proof or unverified scholarly claims.

## Product Principles

1. **Scholarly fidelity over extrapolation:** Present every linguistic layer with explicit provenance, keep canonical texts verbatim, and surface coverage boundaries honestly rather than guessing or synthesizing missing annotations.
2. **Layered depth on demand:** Keep the Quranic verse central and scannable while letting learners progressively pivot between word morphology, clause dependency graphs, classical _iʿrāb_, and rhetorical structure.
3. **Classical terminology with trilingual scaffolding:** Anchor grammatical and rhetorical concepts in their authentic Arabic terms (_naḥw_, _ṣarf_, _balāghah_) while supporting comprehension across English, Arabic, and Indonesian interfaces.
4. **Practice anchored in real revelation:** Connect passive reference reading directly to active recall—drilling _iʿrāb_, _ṣarf_, and grammatical pattern recognition on real verses and linking every drill or search hit back to the full reader.
5. **Self-contained offline reliability:** Keep the entire corpus, search index, and study tools fast, installable, and usable offline without server-side runtime dependencies.
