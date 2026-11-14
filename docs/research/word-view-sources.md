# Word view: occurrence counts, dictionaries, translations

Research notes for three additions to the word sheet (`/#/{sura}/{verse}/{word}`):

1. a count of how often the word occurs in the Qur'an,
2. classical dictionary entries for the word's root, and
3. word-level translations in English and Indonesian.

Lenses is non-profit and MIT-licensed. Each data source below was checked for
redistribution, non-commercial (NC), ShareAlike (SA), and no-derivatives (ND)
terms. Checked 2026-11-09. These notes are not legal advice.

## Decisions

| Need                  | Source                                                            | Status                                                                     |
| --------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Counts                | Our own `words.json` (QAC morphology)                             | Built from data we already ship. No new source.                            |
| English word gloss    | QAC word-by-word (`kaisdukes/quranic-corpus-api`)                 | Adopted. Shipped verbatim with credit.                                     |
| English dictionary    | Lane's _Arabic–English Lexicon_ (Perseus TEI)                     | Adopted. Perseus terms below.                                              |
| Arabic dictionary     | Ibn Fāris, _Maqāyīs al-Lugha_; al-Rāghib, _al-Mufradāt_ (OpenITI) | Adopted. Main text only.                                                   |
| Senses per verse      | al-Dāmaghānī, _al-Wujūh wa-l-Naẓāʾir_ (OpenITI)                   | Planned. See below.                                                        |
| Indonesian word gloss | —                                                                 | **Open.** No openly licensed source exists. Kemenag/LPMQ needs permission. |

## Sources and terms

### Quranic Arabic Corpus word-by-word English

- Data: `src/main/resources/data/translation/word-by-word.txt` in
  `kaisdukes/quranic-corpus-api`. One gloss per corpus word, in corpus order
  (77,429 lines).
- Terms: corpus.quran.com describes the corpus as "available under the GNU
  public license with terms of use". The corpus download terms say "Permission is
  granted to copy and distribute verbatim copies of this file, but CHANGING IT
  IS NOT ALLOWED", and the annotation "can be used in any website or
  application, provided its source (the Quranic Arabic Corpus) is clearly
  indicated". The repository itself has no LICENSE file.
- Origin (corpus contact page): derived from work compiled by Shehnaz Shaikh and
  Kausar Khatri, revised against standard English translations.
- How we use it: each gloss is stored byte-for-byte on its word (`e`), with
  parentheses and punctuation kept. Credit goes in the Sources page and in
  NOTICES.txt.
- Open item: confirm with the corpus maintainers. The same "no changes" clause
  covers the morphology we already ship as derived data.

### Lane's Lexicon (Perseus Digital Library)

- Data: Perseus TEI XML, with XML fixes from `laneslexicon/lexicon_xml`. That
  repo has no license of its own, and its files keep the Perseus availability
  statement.
- Primary terms, taken from each file's `<availability>` block. These replace the
  "CC BY-SA 3.0" that downstream sites report:

  > This text may be freely distributed, subject to the following restrictions:
  > You credit Perseus, as follows, whenever you use the document: "Text provided
  > by Perseus Digital Library, with funding from The U.S. Department of
  > Education and The Max Planck Society." You leave this availability statement
  > intact. You offer Perseus any modifications you make.

- What we change: Buckwalter→Arabic conversion, which ports the
  `convertString` rules of `laneslexicon/lexicon_parser/lane.pl`; reduction to
  plain text and italic and Arabic runs; and keeping only the roots that occur
  in the Qur'an. **These are modifications, so we should offer them to Perseus**
  (one email linking the build script is enough).
- Coverage: Lane finished the work only up to ق. Lane-Poole completed the last
  letters from Lane's notes, so entries from ك onward are thin.

### OpenITI: Maqāyīs al-Lugha and al-Mufradāt

- Release license: CC BY-NC-SA 4.0 (OpenITI corpus release on Zenodo). That is
  fine for a non-profit project. The derived lexicon files are therefore
  BY-NC-SA data, kept apart from the MIT code and labelled as such.
- Versions:
  - `0395IbnFarisQazwini.MucjamMaqayis.Shamela0021710-ara1`, ed. ʿAbd al-Salām
    Hārūn, Dār al-Fikr, 1979.
  - `0502RaghibIsbahani.Mufradat.Shamela0023636-ara1`, ed. Ṣafwān al-Dāwūdī.
- **Main text only:** the classical texts are public domain, and a modern
  editor's apparatus may not be. The build:
  - keeps only the dictionary range (Mufradāt: from `كتاب الألف` up to the
    index section);
  - drops the editor's introduction and indexes;
  - strips footnote markers (`«n»`), page markers, and manuscript markers. The
    OpenITI text already omits the footnote bodies.
  - The Dāwūdī edition's `[…]` insertions come from other manuscripts of the
    Mufradāt and are kept.

### Rejected or deferred

- **QUL #92 English / #96 Indonesian word-by-word:** QUL's licence page says
  "We don't have copyright information for this resource." Provenance is
  unknown (Quran Academy traces the Indonesian set to GreentechApps). Not used.
- **Quran.com / Quran Foundation API:** needs credentials, and the provenance of
  its word-by-word data isn't stated. Not used.
- **Kemenag (LPMQ) terjemah perkata:** the authoritative Indonesian set, ©
  LPMQ Kemenag RI. API access is requested by letter to the head of LPMQ.
  **Next step:** send that request, describing Lenses as a non-profit, MIT,
  educational project.
- **Badawi & Abdel Haleem, _Dictionary of Qur'anic Usage_:** © Brill. Not used.

## Counts

Counts come from `words.json` rows at build time. For each lemma and each root:
occurrences, distinct verses, and distinct surahs. They ship as
`wordStats.json`. The sheet leads with the lemma count and shows the root count
next to it. Each count links to a search filtered the same way, so the number
shown equals the number of results.

Buckwalter is case-sensitive (`s` س vs `S` ص), and 278 roots have a twin that
differs only in case (`nws`/`nwS`). Lexeme matching in search compares
case-sensitively for this reason. Root dictionary files use a slug that
lowercase filesystems can't collide (see `lexiconSlug`).

## al-Dāmaghānī's al-Wujūh wa-l-Naẓāʾir

Source: `0478IbnMuhammadDamghani.QamusQuran.ShamAY0034085-ara1` (OpenITI,
CC BY-NC-SA 4.0; ed. ʿAbd al-ʿAzīz Sayyid al-Ahl). Built by `pnpm data:wujuh`
(`scripts/build_wujuh.py`) into `public/data/quran/wujuh.json`.

For each word, the book lists the distinct senses (_wujūh_) it takes across the
Qur'an, with the verses for each sense:

```
# أم ة على تسعة أوجه
# عصبة . ملة . سنين . قوم . إمام . …
# فوجه منها : امة مسلمة لك يعني عصبة . قوله تعالى في سورة
~~البقرة " ومن ذريتنا امة مسلمة لك " يعني عصبة …
# الثاني : امة يعني ملة . قوله تعالى في سورة البقرة " كان الناس امة
~~واحدة " يعني ملة . مثلها في سورة المؤمنون " …
```

### How the build reads it

- **Entries.** An entry starts at `<headword> على <N> أوجه`. The headword is
  written as spaced letter groups (`أم ة`, `ب ح ر`), and the entry declares its
  sense count.
- **Senses.** Each sense is found by looking for the next ordinal in turn
  (فوجه منها / منهما, الثاني, الثالث …). The colon after the ordinal is often
  missing in the later part of the book. A second "فوجه منها" marks an entry
  whose heading was not recognized, so the sense before it is cut there.
- **Keeping entries.** An entry is kept only when it has exactly the number of
  senses it declares. Otherwise two senses may have merged, and their verses
  would be filed under the wrong one.
- **Sense names.** A sense's name is the words after its first يعني or بمعنى,
  in the book's own spelling. The summary line at the top of each entry matches
  the sense blocks in only about a quarter of entries, so it is not used.
- **Surahs.** Each citation is `في سورة <name> " <unvowelled fragment> "`.
  Later citations in a chain (مثلها, نظيرها, كقوله) may omit the surah. Old
  surah names are resolved by an alias table: الملائكة → 35, حم السجدة → 41,
  بني إسرائيل → 17, and so on.
- **Verses.** The fragment is compared against runs of each verse's words in
  that surah, with alif and hamza dropped so that Uthmani وَٰحِدَة and plain
  واحدة agree. A citation is placed only when exactly one verse fits and that
  verse holds a word of the entry's root. A repeated phrase that fits several
  verses is left out.
- **Words.** The cited word is the word of the root inside the quoted run,
  stored with three vowelled words either side for the excerpt.

### Results (2026-11-09)

- Entries: 283 of 378 kept, covering 263 roots.
- Citations: 1,172 of 1,457 placed on a word.
- Entries left out (no root found, or senses that did not parse cleanly) and
  citations left out (no surah, or not exactly one verse) are listed in
  `data/cache/review/wujuh-unmatched.json`.
- A hand check of 30 random placements found the highlighted word to be the
  headword in about 28. The doubtful ones are words where the source entry
  itself mixes neighbouring roots.

### In the word sheet

The "Senses in the Qurʾān" section came out of a three-way UI prototype. The
chosen design blends three of them:

- **Headline answer.** When al-Dāmaghānī cites this occurrence, the section
  opens with "In this verse: ملة, sense 2 of 9". Otherwise it says the word has
  N senses and this verse is not among his examples. Senses are never guessed
  for verses he does not cite.
- **List of senses.** An accordion of all senses, each with its verse count.
  This verse's sense is marked and open.
- **Excerpts.** Inside each sense, the cited verses appear as vowelled
  excerpts with the word highlighted. Each links to that word.

An entry shows only for its own word: the one that cites this occurrence, or
the one headed by the word's lemma or root. Another word of the same root (أمام
under أمة) shows nothing.

## Build results (2026-11-09)

`pnpm data:lexicon` (`scripts/build_lexicon.py`) writes 1,622 root files
(about 29 MB in total; median 12 KB, largest 160 KB). Coverage of the
corpus's 1,642 roots:

| Dictionary | Roots         | Notes                                                                                          |
| ---------- | ------------- | ---------------------------------------------------------------------------------------------- |
| Lane       | 1,567 (95.4%) | Perseus has no text for Lane's Supplement, so roots such as `ntq`, `nsy` and `jhl` are absent. |
| Maqāyīs    | 1,515 (92.3%) | A few headings are missing from this digitization, e.g. (بقر) and (عون).                       |
| Mufradāt   | 1,429 (87.0%) | Two-letter headings used twice (أب: grass, then father) are left unmatched.                    |

Matching rules:

- Exact root letters first, with every hamza written as ا.
- When that fails, a heading may be read as a doubled root, or as a weak root
  whose bare ا or final و/ى/ي stands for another weak letter. A medial و is
  never read as ي, and a hamza never as a weak letter.
- Maqāyīs takes such a reading only where Ibn Fāris says "والحرف المعتل".
  Mufradāt takes one only where al-Rāghib opens the entry with a word of that
  root.
- Every second-pass assignment was read by hand on 2026-11-09.

Mufradāt entries that open with the tail of the entry before (an OpenITI tag
slip) start at their first paragraph that names the root; three that never
name it are dropped. Headings that match no root, trimmed entries and dropped
entries are listed in `data/cache/review/lexicon-unmatched.json`.
