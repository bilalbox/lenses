# عدسات (Lenses)

Lenses is a small, installable reader for Quranic Arabic grammar. Open a verse, tap a word, and see three layers at once: the Quranic Arabic Corpus morphology, a dependency tree for the clauses the treebank covers, and classical iʿrāb from the Tafsir Center.

The default verse is Al-Hashr 59:18 (`#/59/18`). Its meaning is a reminder to look at what one has sent ahead, and the surah file is much smaller than Al-Baqarah.

## Run it

```bash
pnpm install
pnpm dev
```

The dev server listens on [http://127.0.0.1:43123](http://127.0.0.1:43123). The derived JSON is already in `public/data/quran/`, so the app runs without rebuilding the data.

```bash
pnpm build    # typecheck and production build
pnpm preview  # serve the production build
pnpm lint
pnpm data:all # rebuild every JSON file from the upstream sources, in order
```

A production build registers a service worker. The shell is precached. Fonts and surah files are cached as they are fetched, and after the first verse appears the app keeps downloading the rest of the library in the background. A later visit, including an offline one, reads from that cache. Use the browser install prompt, or the Install button when the browser offers one.

## Deploy

The production build is a static site. [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/) serves it. `public/_headers` caches fingerprinted files in `/assets/` for a year and tells the browser to revalidate `index.html`.

```bash
pnpm install
pnpm deploy            # production
pnpm deploy:preview    # branch Preview (does not replace production)
```

`pnpm deploy` builds and runs `wrangler deploy`. `pnpm deploy:preview` builds and runs `wrangler preview`, which publishes an isolated Preview URL under the same Worker without promoting production traffic. Both need a Cloudflare account. The config is `wrangler.jsonc`, with single-page fallback so a refresh still opens the app. Secrets stay out of that file — use Wrangler secrets / `.env` if you add any later.

## What you can do

- Jump to `chapter:verse`, browse the 114 surahs, or search the Arabic (with or without diacritics) and the English Al-Mukhtasar.
- Tap a word for its segments, root, lemma, and part of speech. Grammatical terms are in Arabic.
- Read the NoorBayan dependency tree for that verse, clause by clause. Arcs, relation labels, and constituent brackets are Arabic, the arc points at the head, and words can be tapped. Heads carried over from an earlier verse are drawn dashed.
- Search examples by root, lemma, part of speech, verb form, or syntactic relation.
- Switch between light and dark. Arrow keys move to the next and previous verse.

## Data and licenses

`pnpm data:all` runs the pipeline scripts in `scripts/` in order: `build_data.py` (surah files, verse and word indexes, the manifest's core), then the syntax, structure, mutashābih, `quran.db` enrichment, and rhetoric builds. Each downloads public files into `data/cache/` (gitignored) and writes compact JSON through `scripts/pipeline.py`, which also owns `manifest.json` and `public/data/NOTICES.txt`: every script edits only its own keys and notice sections, so any script can be rerun on its own. Nothing scrapes corpus.quran.com or tafsir.app.

| Source                                                                                   | What it contributes                                    | License                                                                                                                                                                        |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Quranic Arabic Corpus morphology 0.4](https://corpus.quran.com/download/)               | Segments, roots, lemmas, features for all 77,429 words | GPL. The file’s own terms allow use in an application when the corpus is credited and linked.                                                                                  |
| [The Quranic Treebank (NoorBayan)](https://github.com/NoorBayan/Quranic), via Quranpedia | Dependency and constituent trees, word relations       | MIT. Builds on the Quranic Arabic Corpus of Kais Dukes.                                                                                                                        |
| Tanzil Uthmani text, via the same repository                                             | Arabic Quran text, stored verbatim                     | CC BY-ND 3.0. The text is not edited.                                                                                                                                          |
| [English Al-Mukhtasar](https://quranenc.com/api/v1/translation/sura/english_mokhtasar/1) | Verse tafsir in English                                | QuranEnc `english_mokhtasar`. Issued by the Tafsir Center for Quranic Studies. Text is stored verbatim. The public edition list does not give this key its own version number. |
| [Indonesian Al-Mukhtasar](https://quranenc.com/en/browse/indonesian_mokhtasar)           | Verse tafsir in Indonesian                             | QuranEnc `indonesian_mokhtasar`, edition V1.0.0 (23 January 2017). Issued by the Tafsir Center for Quranic Studies. Text is stored verbatim.                                   |
| [Tafsir Center `quran.db`](https://huggingface.co/datasets/tafsircenter/tafsir-mcp-data) | Word iʿrāb, ṣarf, short meanings, verse iʿrāb          | CC BY 4.0. Credit the Tafsir Center for Quranic Studies.                                                                                                                       |

Application code is MIT (`LICENSE`). The morphology-derived JSON is a derivative of the GPL morphology file and keeps that notice.

### Treebank coverage

The NoorBayan treebank covers all 6,236 verses of the 114 surahs. Its per-word relations also drive the syntactic-relation filter in example search and the iʿrāb quiz.

### tafsir.app

[tafsir.app](https://tafsir.app/) (الباحث القرآني) aggregates classical tafsirs and iʿrāb books, including _al-Jadwal_, al-Daʿās, al-Naḥḥās, and _al-Durr al-Maṣūn_. No public repository or open license for that site or its data was found, so Lenses does not copy it.

The extra source in this version is the Tafsir Center linguistic database, which is explicitly CC BY 4.0. A verse can show the NoorBayan tree and the Center’s verse iʿrāb together. A word can show corpus morphology, the Center’s iʿrāb, ṣarf, and a short meaning, each labeled with its source. Full tafsir books stored in the same database are not redistributed.

Word alignment between the corpus tokenization and the Center’s rasm is done in the build. Verses that do not align cleanly still keep the corpus layer; the classical fields are attached only where the tokens match.

## Layout

```
src/components/   verse screen, dependency tree, word sheet, example search
src/lib/          data layers, search, Arabic normalization, glossary, tree layout, quiz
public/data/quran surah JSON, syntax/structure/mutashabih/qiraat layers, indexes, manifest
scripts/          data pipeline (pipeline.py shared IO, build_*.py per source)
```

Surah files are loaded one at a time. Verse search uses `verses.json`. Example search uses `words.json`.

## License

Application code is MIT — see [LICENSE](LICENSE). Quranic text, morphology, syntax, translation, and classical iʿrāb are **not** covered by that license; see [public/data/NOTICES.txt](public/data/NOTICES.txt) and the table above.
