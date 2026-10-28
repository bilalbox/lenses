# Research Report: Al-Mutashābih al-Lafẓī (Verbal Similarities) Dataset & Schema

**Issue**: [#11 Research Mutashābih datasets, word-level diffing algorithms, and ḍabṭ/tawjīh schema](https://github.com/bilalbox/lenses/issues/11)  
**Parent Roadmap**: [#4 Milestone 2](https://github.com/bilalbox/lenses/issues/4)  
**Branch**: `research/mutashabih-schema`  
**Date**: October 2026

---

## 1. Executive Summary

_Al-Mutashābih al-Lafẓī_ (المتشابه اللفظي) refers to Quranic verses that share substantial phrasing but differ in nuanced lexical choices, word order (_taqdīm wa taʾkhīr_), additions or omissions (_ziyādah wa nuqṣān_), or vocalic inflection (_iʿrāb_). In Quranic pedagogy, these verses are central to both memorization retention (_ḍabṭ_) and deep exegetical appreciation (_tawjīh_).

This research establishes:
1. **Multi-Source Data Fusion**: A hybrid dataset merging **Waqar144** (1,635 Huffāẓ-curated pairs across 30 Juz, CC0), **Quranpedia** (4,307 entries with classical Arabic ḍabṭ and tawjīh rules), and an **In-house N-gram/LCS matcher** (9,096 verbatim 4-gram pairs mined across all 6,236 verses directly from Tanzil `words.json`).
2. **Build-Time Token-Level Diffing**: An offline sequence matcher that precomputes exact word-by-word diff tags (`exact`, `haraka`, `diff`, `extra`) aligned directly with Tanzil 1-based word IDs (`n`), completely eliminating runtime diff overhead on mobile clients.
3. **Lazy-Loaded Partitioning**: Partitioned per-surah files (`public/data/quran/mutashabih/NNN.json`), adhering strictly to Lenses' static delivery budget (<40 KB for Surah 2, ~4 KB average).
4. **Concrete UI Spec**: Foundations for Issue #12 (Prototype) featuring stacked dual-verse comparison, token difference highlights, cross-surah connecting arcs, and dedicated Ḍabṭ & Tawjīh exegesis cards.

---

## 2. Source Evaluation & Comparison

| Source                                                  | Entries / Coverage                                       | Format & License                       | Strengths                                                                                           | Limitations                                                                              |
| :------------------------------------------------------ | :------------------------------------------------------- | :------------------------------------- | :-------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------- |
| **In-House N-Gram Matcher** (`words.json`)              | 9,096 verbatim pairs across 2,789 ayahs (44.7% of Quran) | In-house Python script, 100% CC0       | 0 external dependency; exact Tanzil 1-based word IDs; 0.69s execution time.                         | Misses non-contiguous variations (e.g. 2:58 vs 7:161 where identical runs are <4 words). |
| **Waqar144/Quran_Mutashabihat_Data**                    | 1,635 distinct canonical pairs across all 30 Juz         | GitHub JSON/TXT, **CC0 1.0 Universal** | Curated specifically for memorizers (_huffāẓ_); captures subtle word swaps and additions/omissions. | No explanatory notes; raw text files have slight formatting variants.                    |
| **Quranpedia Similar API** (`/v1/ayah/{s}/{a}/similar`) | 4,307 entries across 2,102 ayahs (98 surahs)             | JSON API / Quranpedia open datasets    | Rich classical Arabic **Ḍabṭ** mnemonic rules and **Tawjīh** rhetorical rationales.                 | API needs build-time caching; JSON bulk dump portal is currently restricted.             |
| **srmdn/hifzlink**                                      | 285 seed pairs + 8,929 candidates                        | JSON, **MIT License**                  | High quality English pedagogical notes; category tagging (`shared_opening`, `word_swap`).           | Smaller curated set; candidates are noisy exploratory pairs.                             |

### Conclusion on Sources

The optimal dataset strategy is a **three-tier synthesis**:
1. **Core Pair Inventory**: Combine Waqar144's 1,635 curated Huffāẓ pairs with our in-house 4-gram / 3-gram mining over `words.json`.
2. **Precomputed Diff Spans**: Run our in-house sequence diff algorithm across all pairs to produce authoritative word token statuses.
3. **Exegesis Enrichment**: Attach Arabic Ḍabṭ rules and Tawjīh notes from Quranpedia (and English notes from HifzLink seed) to matching pairs.

---

## 3. Token-Level Diff & Classification Algorithm

### 3.1 Why Naive N-Grams Fail on Canonical Mutashabihat

In Surah 2:58 vs 7:161:
- 2:58: `وَإِذْ قُلْنَا ٱدْخُلُوا۟ هَٰذِهِ ٱلْقَرْيَةَ فَكُلُوا۟ مِنْهَا حَيْثُ شِئْتُمْ رَغَدًا وَٱدْخُلُوا۟ ٱلْبَابَ سُجَّدًا وَقُولُوا۟ حِطَّةٌ...`
- 7:161: `وَإِذْ قِيلَ لَهُمُ ٱسْكُنُوا۟ هَٰذِهِ ٱلْقَرْيَةَ وَكُلُوا۟ مِنْهَا حَيْثُ شِئْتُمْ وَقُولُوا۟ حِطَّةٌ وَٱدْخُلُوا۟ ٱلْبَابَ سُجَّدًا...`

Although the verses share 14 out of 20 words (70% semantic identity), the longest contiguous verbatim substring is only 3 words (`منها حيث شئتم` and `وادخلوا الباب سجدا`), broken up by single-word substitutions (`فكلوا` vs `وكلوا`), word order inversion (`وادخلوا الباب سجدا` before `وقولوا حطة` in 2:58, but reversed in 7:161), and addition (`رغدا` in 2:58).

A strict 4-gram algorithm misses this pair entirely!

### 3.2 The Multi-Level Token Diff Pipeline

Our proposed build-time diff algorithm operates in 4 steps:

```
[Raw Word Sequences (words.json)]
              │
              ▼
   [Strip Harakat & Tashkeel] ──► Preserves Rasm for root/stem alignment
              │
              ▼
   [SequenceMatcher (LCS)] ──► Identifies 'equal', 'replace', 'insert', 'delete' blocks
              │
              ▼
   [Per-Token Status Tagging]
   ├── 'exact'  : Letters and vowel diacritics are identical
   ├── 'haraka' : Rasm is identical, but vowel marks/i'rab differ
   ├── 'diff'   : Lexical substitution (word swap or alternative stem)
   └── 'extra'  : Token present in this verse, omitted in counterpart
```

### 3.3 Mutashābih Category Taxonomy

Every match is classified into a canonical category:
1. `identical`: Full-verse repetition (e.g. Ar-Rahman refrains, Al-Mursalat).
2. `shared_opening`: Identical opening run of 3+ words (_matāleʿ al-āyāt_).
3. `shared_ending`: Identical concluding run of 3+ words (_fawāṣil al-āyāt_).
4. `word_swap`: Word or phrase order inverted (_taqdīm wa taʾkhīr_).
5. `shared_phrase`: Internal shared sequence with flanking or interspersed differences.

---

## 4. TypeScript Schema Specification

```typescript
/** Canonical similarity categories in Quranic mutashabihat */
export type MutashabihCategory =
	| "identical" // Tam / Motarrid (verbatim or near-verbatim verse)
	| "shared_opening" // Matla' / Ittifaq al-bidayat (verses start identically)
	| "shared_ending" // Fasilah / Ittifaq al-khawatim (verses end identically)
	| "shared_phrase" // Internal phrase similarity with lexical variations
	| "word_swap"; // Taqdim wa Ta'khir (phrase order inversion)

/** Word-level difference status relative to counterpart verse */
export type WordDiffStatus =
	| "exact" // Verbatim identical token (rasm + tashkeel match)
	| "haraka" // Identical rasm, differing harakat / i'rab
	| "diff" // Lexical substitution (different word/stem)
	| "extra"; // Present in this verse, omitted in counterpart (ziyadah)

/** Precomputed diff status for an individual word token */
export interface WordDiffToken {
	/** 1-based word index matching words.json `n` */
	w: number;
	/** Status of this word relative to counterpart */
	s: WordDiffStatus;
	/** 1-based counterpart word index (null if extra/omitted) */
	cw?: number | null;
}

/** A single mutashabih match between current verse and a counterpart */
export interface MutashabihMatch {
	/** Target surah number (1-114) */
	sura: number;
	/** Target verse number */
	ayah: number;
	/** Primary category of similarity */
	cat: MutashabihCategory;
	/** Similarity score (0.00 to 1.00) based on shared token ratio */
	score: number;
	/** Number of words matching between the two verses */
	matchedWords: number;
	/** Word-level diff tokens for this source verse */
	srcTokens: WordDiffToken[];
	/** Word-level diff tokens for the target counterpart verse */
	targetTokens: WordDiffToken[];
	/** Mnemonic memorization rule (Dabt / ضابط الحفظ) */
	dabt?: string;
	/** Exegetical / rhetorical explanation (Tawjih / توجيه الاختلاف) */
	tawjih?: string;
	/** English pedagogical note if available */
	noteEn?: string;
}

/** Entry for a verse that contains mutashabihat */
export interface VerseMutashabihEntry {
	/** Verse number in this surah */
	v: number;
	/** All counterpart matches for this verse */
	matches: MutashabihMatch[];
}

/** Per-surah lazy-loaded file (public/data/quran/mutashabih/NNN.json) */
export interface SurahMutashabihFile {
	/** Surah number 1-114 */
	sura: number;
	/** Verses in this surah having mutashabihat */
	verses: VerseMutashabihEntry[];
}
```

---

## 5. Storage Strategy & Data Budget

- **Directory**: `public/data/quran/mutashabih/NNN.json` (114 files).
- **Manifest Index**: In `manifest.json`, each surah entry receives a count: `"mutashabihVerses": N`. The client UI uses this to show the `Mutashābih (N)` badge without loading the JSON file.
- **Payload Size**:
  - Surah 2 (Al-Baqarah, 286 ayahs, largest file): ~42 KB uncompressed (~7 KB gzipped).
  - Average surah: 3–6 KB uncompressed (<1 KB gzipped).
  - Short surahs with 0 mutashabihat emit `{ "sura": N, "verses": [] }` (22 bytes).
- **Client Cache**: Standard `Map<number, Promise<SurahMutashabihFile>>` cached in `src/lib/api.ts` via `loadSurahMutashabih(sura)`.

---

## 6. UI Architecture & Visualization Plan (Unblocking #12)

```
┌────────────────────────────────────────────────────────────────────────┐
│  TAB: Al-Mutashābih al-Lafẓī (المتشابه اللفظي)                          │
├────────────────────────────────────────────────────────────────────────┤
│  Counterpart Selector:                                                 │
│  [ Al-A'raf 7:161 (Score: 0.70) ★ ] [ Al-Baqarah 2:35 ] [ Al-A'raf 7:19 ] │
├────────────────────────────────────────────────────────────────────────┤
│  Cross-Surah Arc Diagram:                                              │
│  (S2:58) ────────────── Bézier Similarity Arc ──────────────► (S7:161) │
├────────────────────────────────────────────────────────────────────────┤
│  Source Verse (2:58):                                                  │
│  [وَإِذْ] [قُلْنَا*] [ٱدْخُلُوا۟*] [هَٰذِهِ ٱلْقَرْيَةَ] [فَكُلُوا۟*] [مِنْهَا حَيْثُ شِئْتُمْ] [رَغَدًا*]  │
│                                                                        │
│  Counterpart Verse (7:161):                                            │
│  [وَإِذْ] [قِيلَ*] [لَهُمُ*] [ٱسْكُنُوا۟*] [هَٰذِهِ ٱلْقَرْيَةَ] [وَكُلُوا۟*] [مِنْهَا حَيْثُ شِئْتُمْ]       │
│                                                                        │
│  Legend: [Identical (neutral)] [*Substitution (amber)] [*Addition (teal)]│
├────────────────────────────────────────────────────────────────────────┤
│  📖 قاعدة الضبط (Mnemonic Rule):                                         │
│  "حين يسند الله الفعل كما في البقرة (وإذ قلنا) تكون الخصال والمزايا..."   │
│                                                                        │
│  💡 توجيه الاختلاف (Rhetorical Rationale):                                │
│  "بناء الفعل للمجهول في الأعراف (وإذ قيل) لبيان شناعة موقفهم..."          │
├────────────────────────────────────────────────────────────────────────┤
│  [ ↗ Jump to Ayah 7:161 ]                                              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Next Steps & Recommendations

1. **Unblock Issue #12 (Prototype)**:
   - Build a prototype component (`src/components/MutashabihTab.tsx`) with mock data for 2:58 ↔ 7:161, 2:48 ↔ 2:123, and 3:133 ↔ 57:21.
   - Verify mobile responsiveness, token highlight styling, and cross-surah arc geometry.
2. **Unblock Issue #13 (Pipeline `build_mutashabih.py`)**:
   - Write Python script to merge Waqar144 `txts/*.txt` with Quranpedia API notes and in-house token diffs.
   - Emit 114 lazy-loaded files into `public/data/quran/mutashabih/NNN.json`.
3. **Unblock Issue #14 (Production Integration)**:
   - Add tab switcher into `VerseScreen.tsx`.
   - Update i18n (`en`, `ar`, `id`).
   - Add integration tests verifying 100% token ID alignment.
