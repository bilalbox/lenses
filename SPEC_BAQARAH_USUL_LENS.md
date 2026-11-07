# Engineering Handoff: Usul al-Fiqh & Dalalat al-Alfaz Lens Spike (Surah Al-Baqarah)

**Target Repository:** `https://github.com/bilalbox/lenses`  
**Scope:** Vertical slice scoped to **Surah Al-Baqarah (Surah 2, Ayahs 1–286)**

---

## 0. Mandatory Phase 0: Codebase Reconnaissance (Read Before Writing)

You are working inside an **existing repository (`bilalbox/lenses`)**. Do **NOT** scaffold a standalone greenfield project or introduce conflicting build tools, linters, or runtimes. Before writing any code, inspect the repository and map the following:

1. **Stack & Tooling Audit:**
   - Inspect `package.json`, `tsconfig.json`, linter/formatter configs (e.g., Biome/ESLint), and deployment configs (e.g., Cloudflare Workers/Pages, Vite, static/Wasm SQLite, or D1).
   - Identify the existing test runner (e.g., Vitest, Bun test, Playwright) so all verification tests use the repo's native harness.
2. **Existing "Lens" Abstraction & Data Contract:**
   - Locate how existing lenses are defined, registered, typed, and rendered across the codebase.
   - Check how Quranic coordinates (`surah`, `ayah`, `word`, or `segment`) and Arabic text (Uthmani vs. Simple/Normalized) are currently stored and referenced.
3. **Reuse Over Duplication:**
   - If `lenses` already stores verse texts, word tokens, or morphological segments, **foreign-key / reference the existing verse and word IDs** rather than creating duplicate Quran text tables.
   - Match the repository's storage pattern:
     - If the repo uses **SQLite / D1 / SQLite-Wasm**, add the tables and FTS5 virtual table via the repo's migration pattern.
     - If the repo uses **static JSON / indexed TypeScript bundles**, emit the compiled Surah 2 artifact into the repo's existing data directory alongside an in-memory search/filter index.

Produce a brief `PLAN.md` summarizing how this spike maps onto `lenses`'s existing folder structure before executing Phase 1.

---

## 1. Architectural Concept: The "Usuli Lens" (`dalalat-al-alfaz`)

Within `lenses`, **Dalalat al-Alfaz & Shawahid Usuliyyah** functions as an analytical lens layered over Quranic spans:
- **Anchor:** A specific token span (`verseKey: "2:282"`, `wordStart: 12`, `wordEnd: 12`, `phrase: "فَاكْتُبُوهُ"`).
- **Lens Overlay:** Maps the span to its _Usuli_ classification (`AMR_NADB`), grammatical trigger (`صيغة الأمر`), default vs. operative implication (`الوجوب -> الندب`), shifting contextual clue (`القرينة الصارفة` in `2:283`), and legal derivation (`وجه الدلالة`).
- **Interactive Modes:**
  1. **Explore / Search Mode:** Filter Surah Al-Baqarah verses through the Usuli lens by category (e.g., _Al-Amr wal-Nahy_, _Al-'Amm wal-Khass_, _Al-Mantooq wal-Mafhum_), presence of a _Qarinah Sarifah_, or full-text search across _Wajh al-Dilalah_.
  2. **Quiz / Drill Mode:** Auto-generate interactive multiple-choice and span-selection drills directly from the lens metadata.

---

## 2. Domain Data Model & Zod Schemas

Add these schemas to the appropriate types/schema module in `lenses` (adapting naming conventions to match existing lenses):

```typescript
import { z } from "zod";

export const UsuliCategoryGroupSchema = z.enum([
	"AMR_NAHY", // الأمر والنهي
	"AMM_KHASS", // العام والخاص والتخصيص
	"MUTLAQ_MUQAYYAD", // المطلق والمقيد
	"MANTOOQ_MAFHUM", // المنطوق والمفهوم / طرق الدلالة
	"WAADIH_MUBHAM", // الواضح والمبهم (النص، الظاهر، المجمل، المشترك)
]);

export const UsuliTaxonomyIdSchema = z.enum([
	// الأمر والنهي
	"AMR_WUJUB", // الأمر المطلق المفيد للوجوب
	"AMR_NADB", // الأمر المصروف إلى الندب بقرينة
	"AMR_IBAHAH", // الأمر المصروف إلى الإباحة (كالأمر بعد الحظر)
	"AMR_IRSHAD", // الأمر المصروف إلى الإرشاد
	"KHABAR_BIMAANA_AMR", // الجملة الخبرية المراد بها الإنشاء
	"NAHY_TAHRIM", // النهي المطلق المفيد للتحريم والفساد
	"NAHY_KARAHAH", // النهي المصروف إلى الكراهة بقرينة
	// العام والخاص
	"AMM_BAQI", // العام الباقي على عمومه
	"AMM_MAKHSUS_MUTTASIL", // العام المخصوص بمخصص متصل (استثناء/شرط/صفة/غاية)
	"AMM_MAKHSUS_MUNFASIL", // العام المخصوص بمخصص منفصل (بالقرآن أو السنة)
	"AMM_MURAD_KHUSUS", // العام الذي أريد به الخصوص
	// المطلق والمقيد
	"MUTLAQ_BAQI", // المطلق الجاري على إطلاقه
	"MUTLAQ_MAHMUL_MUQAYYAD", // المطلق المحمول على المقيد
	// المنطوق والمفهوم وطرق الدلالة
	"IBARAT_NASS", // عبارة النص / المنطوق الصريح
	"ISHARAT_NASS", // إشارة النص (اللازم غير المقصود أصالة)
	"MAFHUM_MUWAFAQAH", // مفهوم الموافقة / فحوى الخطاب (دلالة النص)
	"MAFHUM_MUKHALAFAH_SIFAH", // مفهوم المخالفة - الصفة
	"MAFHUM_MUKHALAFAH_SHART", // مفهوم المخالفة - الشرط
	"MAFHUM_MUKHALAFAH_GHAYAH", // مفهوم المخالفة - الغاية (حتى / إلى)
	"MAFHUM_MUKHALAFAH_ADAD", // مفهوم المخالفة - العدد
	"MAFHUM_MUKHALAFAH_HASR", // مفهوم الحصر (إنما / التقديم)
	"DALALAT_IQTIDA", // دلالة الاقتضاء (تقدير محذوف لتصحيح الكلام شرعاً)
	// الوضوح والإجمال
	"NASS_ZAHIR", // النص والظاهر
	"MUSHTARAK_LAFZI", // المشترك اللفظي
	"MUJMAL_MUBAYYAN", // المجمل المبين بالسنة أو السياق
]);

export const UsuliShahidSchema = z.object({
	id: z.string(),
	verseKey: z.string().regex(/^2:([1-9]|[1-9]\d|1\d\d|2[0-7]\d|28[0-6])$/),
	ayahNumber: z.number().int().min(1).max(286),
	wordStart: z.number().int().min(1),
	wordEnd: z.number().int().min(1),
	shahidPhraseAr: z.string(),
	taxonomyId: UsuliTaxonomyIdSchema,
	categoryGroup: UsuliCategoryGroupSchema,

	// Linguistic & Usuli Reasoning
	linguisticTriggerAr: z.string(),
	defaultDalalahAr: z.string(),
	actualDalalahAr: z.string(),
	hasQarinahSarifah: z.boolean(),
	qarinahTextAr: z.string().nullable(),
	qarinahVerseKey: z.string().nullable(),
	wajhAlDilalahAr: z.string(),
	derivedFiqhRulingAr: z.string(),
	khilafUsuliAr: z.string().nullable(),
	classicalSources: z.array(z.string()),

	// Metadata
	extractionStage: z.enum([
		"STAGE1_RULE_ONLY",
		"STAGE2_LLM_VERIFIED",
		"GOLDEN_SEED",
	]),
	isCanonicalShahid: z.boolean(),
});

export type UsuliShahid = z.infer<typeof UsuliShahidSchema>;
```

### Optional SQLite / D1 DDL (If `lenses` uses SQLite/D1/Wasm)

If the repo uses relational storage, create the migration using the following tables (adapting foreign keys to the repo's existing `verses` or `words` tables):

```sql
CREATE TABLE IF NOT EXISTS usuli_taxonomy (
    id TEXT PRIMARY KEY,
    category_group TEXT NOT NULL,
    school_framework TEXT NOT NULL, -- 'SHARED' | 'JUMHUR' | 'HANAFI'
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_ar TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS usuli_shawahid (
    id TEXT PRIMARY KEY,
    verse_key TEXT NOT NULL,
    ayah_number INTEGER NOT NULL,
    word_start INTEGER NOT NULL,
    word_end INTEGER NOT NULL,
    shahid_phrase_ar TEXT NOT NULL,
    taxonomy_id TEXT NOT NULL REFERENCES usuli_taxonomy(id),
    category_group TEXT NOT NULL,
    linguistic_trigger_ar TEXT NOT NULL,
    default_dalalah_ar TEXT NOT NULL,
    actual_dalalah_ar TEXT NOT NULL,
    has_qarinah_sarifah INTEGER NOT NULL DEFAULT 0,
    qarinah_text_ar TEXT,
    qarinah_verse_key TEXT,
    wajh_al_dilalah_ar TEXT NOT NULL,
    derived_fiqh_ruling_ar TEXT NOT NULL,
    khilaf_usuli_ar TEXT,
    classical_sources_json TEXT NOT NULL,
    extraction_stage TEXT NOT NULL,
    is_canonical_shahid INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_usuli_shawahid_verse ON usuli_shawahid(verse_key);
CREATE INDEX idx_usuli_shawahid_taxonomy ON usuli_shawahid(taxonomy_id, category_group);

CREATE VIRTUAL TABLE IF NOT EXISTS usuli_shawahid_fts USING fts5(
    verse_key,
    shahid_phrase_ar,
    wajh_al_dilalah_ar,
    derived_fiqh_ruling_ar,
    qarinah_text_ar,
    content='usuli_shawahid',
    tokenize='unicode61 remove_diacritics 2'
);
```

---

## 3. Build-Time Data Pipeline (`scripts/usul-baqarah-spike/`)

Keep heavy morphological ingestion and LLM extraction in offline build/CLI scripts so the runtime application in `lenses` stays lightweight and instant.

### Step 1: Morphology Ingestion (Surah 2 Only)

1. Check if `lenses` already includes Quranic Arabic Corpus (QAC) morphological data.
2. If not, fetch `https://raw.githubusercontent.com/mustafa0x/quran-morphology/master/quran-morphology.txt` and filter for `^2:` (`2:1:1:1` to `2:286:*:*`).
3. Parse each 4-part location (`surah:ayah:word:segment`), POS tag, mood (`IMP`, `JUS`, `IND`, `SUBJ`), state (`DEF`, `INDEF`), root, and lemma.

### Step 2: Stage 1 Deterministic Syntactic Candidate Scanner

Run a deterministic pass over Surah 2's morphological segments to emit candidate spans:

- **`CAND_AMR`:** Verbs (`POS=V`) with `MOOD=IMP`, or `MOOD=JUS` preceded by prefix `l:AMR+` (_Lam al-Amr_, e.g., `فَلْيَكْتُب`, `وَلْيُمْلِلِ` in `2:282`). Exclude or flag `AMR_DUA` when preceded/followed by vocative `رَبَّنَا`.
- **`CAND_NAHY`:** Prohibitive particle (`POS=PRO`, `لا الناهية`) immediately followed by `POS=V` + `MOOD=JUS` (e.g., `لَا تَأْكُلُوا`, `وَلَا تَنكِحُوا`).
- **`CAND_AMM_NAKIRA_SIYAQ`:** Negation (`NEG`) or Condition (`COND`) particle followed within 5 words by an indefinite noun (`POS=N`, `STATE=INDEF`) — capturing _النكرة في سياق النفي أو الشرط_.
- **`CAND_AMM_SHART_MAWSUL`:** General particles/pronouns (`مَن`, `مَا`, `كُلّ`, `جَمِيع`, `الَّذِينَ`, `الْمُطلَّقَاتُ`, `الْوَالِدَاتُ`) and plural nouns with definite prefix `DET` (`أل الاستغراقية`).
- **`CAND_TAKHSIS_MUTTASIL`:** Exception particle `EXP` (`إِلَّا`), conditional clauses (`إِنْ`, `إِذَا`), or limit prepositions (`حَتَّىٰ`, `إِلَىٰ`) attached to a general ruling or command.

### Step 3: Stage 2 Structured Usuli Enrichment

Pass the Stage 1 candidate spans (along with surrounding verse context `ayah - 1` to `ayah + 1` to capture cross-verse _Qara'in_ like `2:282 -> 2:283`) through an LLM structured extraction step validated against `UsuliShahidSchema`.

- Use the following Arabic Usuli prompt instruction:
> "أنت خبير في أصول الفقه ودلالات الألفاظ وتفسير آيات الأحكام (كأحكام القرآن للجصاص وابن العربي والكيا الهراسي، والمستصفى للغزالي، والإحكام للآمدي، وإرشاد الفحول للشوكاني). حلل الآية والمواضع الصرفية المرشحة من سورة البقرة، واستخرج الشواهد الأصولية ودلالات الألفاظ مع تحرير (وجه الدلالة) و(القرينة الصارفة إن وجدت) و(الخلاف الأصولي) وفق المخطط المحدد."

---

## 4. Search & Quiz Engine Integration in `lenses`

Expose two core modules that connect the Usuli lens data to the `lenses` UI/API:

### 4.1 Lens Search & Filter API

- **Text Search:** Normalizes Arabic input (stripping _tashkeel_ `\u064B-\u065F` and unifying _alif_ variants `أ, إ, آ, ٱ -> ا`) and searches across `shahidPhraseAr`, `wajhAlDilalahAr`, `derivedFiqhRulingAr`, and `qarinahTextAr`.
- **Facet Filters:**
- `categoryGroup` (`AMR_NAHY`, `AMM_KHASS`, `MUTLAQ_MUQAYYAD`, `MANTOOQ_MAFHUM`, `WAADIH_MUBHAM`)
- `taxonomyId`
- `hasQarinahSarifah` (`boolean` — isolates shifted commands/prohibitions and restricted generalities)
- `isCanonicalShahid` (`boolean` — filters for classic textbook proof texts)

### 4.2 Deterministic Quiz Engine (4 Drill Modes)

Generate interactive quiz items directly from `UsuliShahid[]` records:

1. **`IDENTIFY_DALALAH` (تحديد نوع الدلالة):**

- Renders the verse with `[wordStart..wordEnd]` highlighted in the UI.
- Asks: _"ما نوع الدلالة الأصولية في الموضع المحدد من الآية؟"_
- Generates 1 correct `taxonomyId` label + 3 plausible distractors sampled from the same or adjacent `categoryGroup`.

2. **`SPOT_THE_QARINAH` (تمييز دلالة الأمر/النهي والقرينة الصارفة):**

- Targets records in `AMR_NAHY`.
- Asks what the imperative/prohibition indicates (`الوجوب`, `الندب`, `الإباحة`, `التحريم`) and requires identifying whether it remains on its default import (`الأصل`) or is shifted by a `qarinahTextAr`.

3. **`LOCATE_SHAHID_SPAN` (تحديد موضع الشاهد من الآية):**

- Renders the verse with clickable word tokens (reusing `lenses`'s existing word/ayah rendering component if available).
- Prompts: *"اضغط على اللفظ الذي استدل به الأصوليون على: [name_ar] لاستنباط: [derivedFiqhRulingAr]"*
- Validates that the clicked token index falls within `[wordStart, wordEnd]`.

4. **`USULI_KHILAF_DRILL` (تحرير وجه الدلالة والخلاف الأصولي):**

- Targets canonical verses where `khilafUsuliAr !== null` (e.g., Jumhur vs. Hanafi classification of `2:233` or `2:275`, or lexical polysemy in `2:228`).

---

## 5. Golden Seed & Automated Verification Suite

Seed these **8 canonical Surah Al-Baqarah Shawahid** first and write automated tests (using `lenses`'s native test runner) verifying that search, lens rendering, and all 4 quiz modes pass against them:

| Verse   | Shahid Phrase                             | `taxonomyId`                              | Wajh al-Dilalah & Qarinah Summary                                                                                                                     |
| ------- | ----------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2:43`  | `وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ`              | `AMR_WUJUB` / `MUJMAL_MUBAYYAN`           | صيغة أمر مطلقة عريت عن القرينة الصارفة فتفيد الوجوب، ولفظ (الصلاة والزكاة) مجمل في هيئته ومقداره بيّنته السنة.                                          |
| `2:187` | `وَكُلُوا وَاشْرَبُوا حَتَّىٰ يَتَبَيَّنَ لَكُمُ الْخَيْطُ الْأَبْيَضُ` | `AMR_IBAHAH` / `MAFHUM_MUKHALAFAH_GHAYAH` | الأمر في (كلوا واشربوا) ورد بعد الحظر فيفيد الإباحة، وقوله (حتى يتبين) غاية تفيد بمفهوم المخالفة تحريم الأكل والشرب عند طلوع الفجر.                      |
| `2:196` | `فَمَن لَّمْ يَجِدْ فَصِيَامُ ثَلَاثَةِ أَيَّامٍ`              | `DALALAT_IQTIDA` / `MUTLAQ_BAQI`          | دلالة اقتضاء بتقدير واجب محذوف (فعليه صيام) لتصحيح الكلام شرعاً، ولفظ (ثلاثة أيام) مطلق عن قيد التتابع عند الجمهور.                                       |
| `2:221` | `وَلَا تَنكِحُوا الْمُشْرِكَاتِ حَتَّىٰ يُؤْمِنَّ`             | `NAHY_TAHRIM` / `AMM_MAKHSUS_MUNFASIL`    | نهي مطلق يفيد التحريم وفساد العقد، ولفظ (المشركات) جمع محلى بأل يفيد العموم، خُص منه نساء أهل الكتاب بآية المائدة (5:5).                               |
| `2:228` | `يَتَرَبَّصْنَ بِأَنفُسِهِنَّ ثَلَاثَةَ قُرُوءٍ`                | `KHABAR_BIMAANA_AMR` / `MUSHTARAK_LAFZI`  | (يتربصن) جملة خبرية يراد بها الإنشاء (الأمر بالوجوب)، ولفظ (قروء) مشترك لفظي متردد بين الطهر والحيض.                                                    |
| `2:233` | `وَعَلَى الْمَوْلُودِ لَهُ رِزْقُهُنَّ وَكِسْوَتُهُنَّ`           | `ISHARAT_NASS`                            | سيقت الآية لبيان وجوب النفقة على الأب (عبارة النص)، ودلت بإشارة النص (بلام الاختصاص في: له) على أن النسب للأب.                                             |
| `2:275` | `وَأَحَلَّ اللَّهُ الْبَيْعَ وَحَرَّمَ الرِّبَا`              | `IBARAT_NASS` / `AMM_MAKHSUS_MUNFASIL`    | دلت بعبارة النص على التفرقة بين البيع والربا، وبإشارة النص على حل البيع وتحريم الربا، و(البيع) مفرد محلى بأل يفيد العموم وخُصت منه البيوع المنهي عنها. |
| `2:282` | `إِذَا تَدَايَنتُم بِدَيْنٍ إِلَىٰ أَجَلٍ مُّسَمًّى فَاكْتُبُوهُ`   | `AMR_NADB`                                | صيغة الأمر (فاكتبوه) مصروفة عن الوجوب إلى الندب والإرشاد بقرينة الآية التالية (`2:283`): ﴿فَإِنْ أَمِنَ بَعْضُكُم بَعْضًا فَلْيُؤَدِّ الَّذِي اؤْتُمِنَ أَمَانَتَهُ﴾.                   |

---

## 6. Definition of Done Checklist

- [ ] **Phase 0 Complete:** Existing `lenses` architecture audited; no duplicate build/test dependencies introduced.
- [ ] **Data Layer Integrated:** Surah Al-Baqarah morphological segments, taxonomy nodes, and the Golden Seed + enriched _Ayat al-Ahkam_ Shawahid load cleanly into `lenses`'s data store.
- [ ] **Lens Registered:** The Usuli lens (`dalalat-al-alfaz`) renders over Surah 2 verses in the existing UI/API, highlighting `[wordStart..wordEnd]` spans and displaying the _Wajh al-Dilalah_ and _Qarinah_ breakdown.
- [ ] **Quiz Engine Operational:** All 4 quiz drill modes generate valid, randomized questions from Surah 2 data.
- [ ] **Automated Verification:** Native unit/integration tests pass for all 8 Golden Shawahid, Arabic normalized search, and quiz distractor generation.
