/**
 * The grammar quiz's question bank: the question shapes the quiz screen asks,
 * the compact file they are stored in (`quizBank.json`, built ahead of time by
 * `pnpm data:quiz`), and hydration of that file against the loaded surahs.
 */
import type { MutashabihQuestion } from "./mutashabihQuiz";
import {
	type QuizCase,
	type QuizRelation,
	type QuizSign,
	SARF_CLASSES,
	SARF_STRUCTURES,
} from "./quizCatalog";
import type { ExampleQuery } from "./search";
import type { SurahFile, Verse, Word } from "./types";

/** Fast initial surahs loaded immediately on quiz open */
export const CURATED_SURAHS = [
	1, 59, 67, 78, 87, 93, 94, 97, 103, 108, 109, 110, 112, 113, 114,
];

/** Additional treebank-annotated surahs loaded in the background for deeper variety */
export const EXTENDED_QUIZ_SURAHS = [
	62, 63, 64, 68, 71, 72, 73, 74, 75, 76, 79, 80, 81, 82, 83, 84, 85, 86, 88,
	89, 90, 91, 92, 95, 96, 98, 99, 100, 101, 102,
];

export interface QuizQuestion {
	id: string;
	sura: number;
	suraName: string;
	suraPhonetic: string;
	verse: Verse;
	targetWord: Word;
	headWord: Word;
	relation: QuizRelation;
	/** Null for a jārr-majrūr phrase (`pp`), which takes no case of its own. */
	grammaticalCase: QuizCase | null;
	sign: QuizSign | null;
	signDetailAr: string;
	classicalIrab: string;
	clauseWords: Word[];
}

export interface ChoiceOption {
	code: string;
	ar: string;
	sub: { ar: string; en: string; id: string };
}

export interface SarfQuestion {
	id: string;
	sura: number;
	suraName: string;
	suraPhonetic: string;
	verse: Verse;
	targetWord: Word;
	headAr: string;
	kind: "verb" | "noun";
	rootRaw: string;
	rootSpaced: string;
	wazn: string;
	classCode: string;
	structureCode: string;
	rootOptions: ChoiceOption[];
	waznOptions: ChoiceOption[];
	classOptions: ChoiceOption[];
	structureOptions: ChoiceOption[];
	asl?: string;
	singular?: string;
	classicalSarf: string;
	classicalMeaning?: string;
	searchSeed: Partial<ExampleQuery>;
}

export type FacetCategory = "form" | "deriv" | "syntax" | "plural";

export interface ExampleHuntQuestion {
	id: string;
	sura: number;
	suraName: string;
	suraPhonetic: string;
	verse: Verse;
	targetWord: Word;
	facetCode: FacetCode;
	facetTitle: { ar: string; en: string; id: string };
	facetHint: { ar: string; en: string; id: string };
	facetCategory: FacetCategory;
	targetWazn: string;
	targetRootSpaced: string;
	classicalSarf: string;
	classicalIrab?: string;
	classicalMeaning?: string;
	searchSeed: Partial<ExampleQuery>;
}

export interface QuizPools {
	irab: QuizQuestion[];
	sarf: SarfQuestion[];
	examples: ExampleHuntQuestion[];
	mutashabih: MutashabihQuestion[];
}

/** The pools built from surah morphology and treebanks; mutashabih comes from its own bank. */
export type GrammarPools = Omit<QuizPools, "mutashabih">;

const HARAKAT_RE = /[ً-ْٰـۡۥۦ]/g;

export function stripHarakat(text: string): string {
	return text.replace(HARAKAT_RE, "");
}

export function spaceRootLetters(text: string): string {
	const bare = stripHarakat(text).replace(/\s+/g, "");
	return [...bare].join(" ");
}

export function rootChoice(root: string): ChoiceOption {
	const spaced = spaceRootLetters(root);
	return {
		code: root,
		ar: spaced,
		sub: {
			ar: `مادة (${root})`,
			en: `Root (${spaced})`,
			id: `Akar kata (${spaced})`,
		},
	};
}

export function waznChoice(wazn: string, kind: "verb" | "noun"): ChoiceOption {
	return {
		code: wazn,
		ar: wazn,
		sub: {
			ar: kind === "verb" ? "ميزان الفعل" : "ميزان الاسم",
			en:
				kind === "verb" ? "Verbal measure (mīzān)" : "Nominal measure (mīzān)",
			id: kind === "verb" ? "Wazan fi'il" : "Wazan isim",
		},
	};
}

function catalogChoice(
	code: string,
	entry: { ar: string; arSub: string; en: string; id: string },
): ChoiceOption {
	return {
		code,
		ar: entry.ar,
		sub: { ar: entry.arSub, en: entry.en, id: entry.id },
	};
}

export function classChoice(code: string): ChoiceOption {
	return catalogChoice(code, SARF_CLASSES[code]!);
}

export function structureChoice(code: string): ChoiceOption {
	return catalogChoice(code, SARF_STRUCTURES[code]!);
}

interface FacetMeta {
	category: FacetCategory;
	title: { ar: string; en: string; id: string };
	hint: { ar: string; en: string; id: string };
}

/** What the Pattern Hunt asks the reader to spot; the matching rules live with extraction. */
export const EXAMPLE_FACETS = {
	form_VIII: {
		category: "form",
		title: {
			ar: "فعل مزيد على باب (افْتَعَلَ)",
			en: "Form VIII Verb (Iftaʿala)",
			id: "Fi'il Mazid Wazan VIII (Ifta'ala)",
		},
		hint: {
			ar: "فعل خماسي مزيد بالألف والتاء (مثل: اتَّقُوا، ابتغوا، استمعوا)",
			en: "A 5-letter verb augmented with alif and infixed tāʾ (often assimilated, like ittaqū)",
			id: "Fi'il lima huruf dengan tambahan alif dan ta' (sering mengalami idgham seperti ittaqu)",
		},
	},
	form_IV: {
		category: "form",
		title: {
			ar: "فعل مزيد على باب (أَفْعَلَ)",
			en: "Form IV Verb (Afʿala)",
			id: "Fi'il Mazid Wazan IV (Af'ala)",
		},
		hint: {
			ar: "فعل رباعي مزيد بالهمزة في أوله يفيد التعدية غالباً (مثل: آمَنُوا، أَنزَلَ، يُخْرِبُونَ)",
			en: "A causative 4-letter verb augmented with hamza (often elided in the imperfect)",
			id: "Fi'il empat huruf dengan tambahan hamzah (sering dibuang pada mudhari')",
		},
	},
	form_X: {
		category: "form",
		title: {
			ar: "فعل مزيد على باب (اسْتَفْعَلَ)",
			en: "Form X Verb (Istafʿala)",
			id: "Fi'il Mazid Wazan X (Istaf'ala)",
		},
		hint: {
			ar: "فعل سداسي مزيد بالسين والتاء يدل على الطلب أو الصيرورة (مثل: نَسْتَعِينُ، اسْتَغْفِرْ)",
			en: "A 6-letter verb with sīn and tāʾ expressing seeking or requesting",
			id: "Fi'il enam huruf dengan tambahan sin dan ta' yang bermakna memohon/mencari",
		},
	},
	form_II_V: {
		category: "form",
		title: {
			ar: "فعل مضعف العين (فَعَّلَ / تَفَعَّلَ)",
			en: "Geminate-Stem Verb · Form II / V (Faʿʿala / Tafaʿʿala)",
			id: "Fi'il Bertadh'if Ain · Wazan II / V (Fa''ala / Tafa''ala)",
		},
		hint: {
			ar: "فعل مزيد بتضعيف عينه للتكثير أو التدرج (مثل: قَدَّمَتْ، سَبِّحْ، يَتَفَكَّرُونَ)",
			en: "A verb augmented by doubling its middle radical for intensity or gradation",
			id: "Fi'il dengan penggandaan huruf tengah ('ain fi'il) untuk intensitas",
		},
	},
	deriv_fail: {
		category: "deriv",
		title: {
			ar: "اسم فاعل (مشتق يدل على من قام بالفعل)",
			en: "Active Participle (Ism Fāʿil)",
			id: "Isim Fa'il (Partisipel Aktif)",
		},
		hint: {
			ar: "يصاغ من الثلاثي على (فَاعِل) ومن غيره بضم أوله وكسر ما قبل آخره",
			en: "Formed on fāʿil (Form I) or with prefix mu- and kasra before the final radical",
			id: "Dibentuk dengan pola fa'il (tsulatsi) atau awalan mu- dengan kasrah sebelum akhir",
		},
	},
	deriv_sifa_mubalagha: {
		category: "deriv",
		title: {
			ar: "صفة مشبهة أو صيغة مبالغة",
			en: "Intensive or Assimilated Adjective (Ṣifa Mushabbaha / Mubālagha)",
			id: "Sifat Musyabbahah atau Shighah Mubalaghah",
		},
		hint: {
			ar: "وصف يدل على الثبوت أو الكثرة (على أوزان مثل: فَعِيل، فَعُول، فَعَّال، فَعْلَان)",
			en: "Describes an enduring or intensive attribute (patterns like faʿīl, faʿūl, faʿʿāl)",
			id: "Kata sifat yang menunjukkan ketetapan atau intensitas tinggi (seperti fa'il, fa'ul, fa''al)",
		},
	},
	deriv_tafdil: {
		category: "deriv",
		title: {
			ar: "أفعل التفضيل (اسم تفضيل)",
			en: "Elative / Superlative Noun (Ism Tafḍīl)",
			id: "Isim Tafdhil (Komparatif / Superlatif)",
		},
		hint: {
			ar: "اسم مشتق على وزن (أَفْعَل) أو (فُعْلَى) أو (خَيْر / شَرّ) يدل على الزيادة في الصفة",
			en: "Pattern afʿal / fuʿlā (or khayr / sharr) indicating superiority in a quality",
			id: "Wazan af'al / fu'la (atau khair / syarr) yang menunjukkan makna lebih/paling",
		},
	},
	plural_taksir: {
		category: "plural",
		title: {
			ar: "جمع تكسير (تغيرت فيه صورة المفرد)",
			en: "Broken Plural (Jamʿ Taksīr)",
			id: "Jamak Taksir (Jamak Tak Beraturan)",
		},
		hint: {
			ar: "جمع تتغير فيه بنية المفرد على أوزان مثل: أَفْعَال، فُعُول، فِعَال، فَوَاعِل، قُرَى",
			en: "A plural formed by shifting the internal vowel/consonant pattern rather than adding -ūna/-āt",
			id: "Bentuk jamak dengan perubahan pola internal dari bentuk mufradnya",
		},
	},
	syntax_mansubat: {
		category: "syntax",
		title: {
			ar: "منصوب بياني (حال أو تمييز أو مفعول مطلق)",
			en: "Adverbial Accusative (Ḥāl, Tamyīz, or Mafʿūl Muṭlaq)",
			id: "Manshub Keterangan (Hal, Tamyiz, atau Maf'ul Muthlaq)",
		},
		hint: {
			ar: "اسم منصوب يبين الهيئة (حال)، أو يزيل الإبهام (تمييز)، أو يؤكد الفعل بمصدره (مفعول مطلق)",
			en: "An accusative noun describing state (ḥāl), specification (tamyīz), or cognate emphasis",
			id: "Isim manshub yang menjelaskan keadaan (hal), rincian (tamyiz), atau penegasan (maf'ul muthlaq)",
		},
	},
} satisfies Record<string, FacetMeta>;

export type FacetCode = keyof typeof EXAMPLE_FACETS;

// ---------------------------------------------------------------------------
// The bank file
// ---------------------------------------------------------------------------

/** Surah, verse, word. */
type WordRef = [number, number, number];

interface IrabEntry {
	at: WordRef;
	/** Governor's word number: another word of the ayah. */
	head: number;
	rel: QuizRelation;
	/** Absent for a jārr-majrūr phrase. */
	case?: QuizCase;
	sign?: QuizSign;
	detail: string;
	clause: number[];
}

interface SarfEntry {
	at: WordRef;
	headAr: string;
	kind: "verb" | "noun";
	root: string;
	wazn: string;
	cls: string;
	str: string;
	/** Option codes in display order, answer included. */
	roots: string[];
	wazns: string[];
	classes: string[];
	structures: string[];
	asl?: string;
	singular?: string;
	seed: Partial<ExampleQuery>;
}

interface ExampleEntry {
	at: WordRef;
	facet: FacetCode;
	wazn: string;
	root: string;
	seed: Partial<ExampleQuery>;
}

export interface QuizBankFile {
	version: 1;
	/** Surahs the bank was built from, in the order their questions appear. */
	surahs: number[];
	irab: IrabEntry[];
	sarf: SarfEntry[];
	examples: ExampleEntry[];
}

const refOf = (q: {
	sura: number;
	verse: Verse;
	targetWord: Word;
}): WordRef => [q.sura, q.verse.v, q.targetWord.n];

const codes = (options: ChoiceOption[]) => options.map((o) => o.code);

/** The bank file for extracted pools: word references and answer codes only. */
export function toQuizBank(
	pools: GrammarPools,
	surahs: number[],
): QuizBankFile {
	return {
		version: 1,
		surahs,
		irab: pools.irab.map((q) => ({
			at: refOf(q),
			head: q.headWord.n,
			rel: q.relation,
			...(q.grammaticalCase ? { case: q.grammaticalCase } : {}),
			...(q.sign ? { sign: q.sign } : {}),
			detail: q.signDetailAr,
			clause: q.clauseWords.map((w) => w.n),
		})),
		sarf: pools.sarf.map((q) => ({
			at: refOf(q),
			headAr: q.headAr,
			kind: q.kind,
			root: q.rootRaw,
			wazn: q.wazn,
			cls: q.classCode,
			str: q.structureCode,
			roots: codes(q.rootOptions),
			wazns: codes(q.waznOptions),
			classes: codes(q.classOptions),
			structures: codes(q.structureOptions),
			...(q.asl !== undefined ? { asl: q.asl } : {}),
			...(q.singular !== undefined ? { singular: q.singular } : {}),
			seed: q.searchSeed,
		})),
		examples: pools.examples.map((q) => ({
			at: refOf(q),
			facet: q.facetCode,
			wazn: q.targetWazn,
			root: q.targetRootSpaced.replace(/ /g, ""),
			seed: q.searchSeed,
		})),
	};
}

interface Located {
	file: SurahFile;
	verse: Verse;
	word: Word;
}

/** Looks up word references in the loaded surahs; refs into unloaded surahs miss. */
function locator(files: SurahFile[]) {
	const bySurah = new Map(
		files.map((file) => [
			file.n,
			{ file, verses: new Map(file.verses.map((v) => [v.v, v])) },
		]),
	);
	return ([s, v, w]: WordRef): Located | null => {
		const surah = bySurah.get(s);
		const verse = surah?.verses.get(v);
		const word = verse?.w.find((x) => x.n === w);
		return surah && verse && word ? { file: surah.file, verse, word } : null;
	};
}

function place({ file, verse, word }: Located) {
	return {
		sura: file.n,
		suraName: file.name,
		suraPhonetic: file.phonetic,
		verse,
		targetWord: word,
	};
}

function hydrateIrab(e: IrabEntry, at: Located): QuizQuestion | null {
	// A word never governs itself; older banks asked a joined preposition that way.
	const headWord =
		e.head === at.word.n ? null : at.verse.w.find((w) => w.n === e.head);
	if (!headWord) return null;
	const clause = new Set(e.clause);
	return {
		id: `${e.at.join(":")}:${e.rel}`,
		...place(at),
		headWord,
		relation: e.rel,
		grammaticalCase: e.case ?? null,
		sign: e.sign ?? null,
		signDetailAr: e.detail,
		classicalIrab: at.word.i ?? "",
		clauseWords: at.verse.w.filter((w) => clause.has(w.n)),
	};
}

function hydrateSarf(e: SarfEntry, at: Located): SarfQuestion {
	return {
		id: `sarf:${e.at.join(":")}`,
		...place(at),
		headAr: e.headAr,
		kind: e.kind,
		rootRaw: e.root,
		rootSpaced: spaceRootLetters(e.root),
		wazn: e.wazn,
		classCode: e.cls,
		structureCode: e.str,
		rootOptions: e.roots.map(rootChoice),
		waznOptions: e.wazns.map((w) => waznChoice(w, e.kind)),
		classOptions: e.classes.map(classChoice),
		structureOptions: e.structures.map(structureChoice),
		asl: e.asl,
		singular: e.singular,
		classicalSarf: at.word.sf || "",
		classicalMeaning: at.word.m,
		searchSeed: e.seed,
	};
}

function hydrateExample(e: ExampleEntry, at: Located): ExampleHuntQuestion {
	const facet: FacetMeta = EXAMPLE_FACETS[e.facet];
	return {
		id: `ex:${e.at.join(":")}:${e.facet}`,
		...place(at),
		facetCode: e.facet,
		facetTitle: facet.title,
		facetHint: facet.hint,
		facetCategory: facet.category,
		targetWazn: e.wazn,
		targetRootSpaced: spaceRootLetters(e.root),
		classicalSarf: at.word.sf || "",
		classicalIrab: at.word.i,
		classicalMeaning: at.word.m,
		searchSeed: e.seed,
	};
}

function hydrateAll<E extends { at: WordRef }, Q>(
	entries: E[],
	find: (ref: WordRef) => Located | null,
	build: (entry: E, at: Located) => Q | null,
): Q[] {
	const out: Q[] = [];
	for (const entry of entries) {
		const at = find(entry.at);
		const q = at && build(entry, at);
		if (q) out.push(q);
	}
	return out;
}

/**
 * The bank's questions for the loaded surahs, in bank order: loading more
 * surahs (curated first) only appends, so earlier pool indices stay put.
 */
export function hydrateQuizPools(
	bank: QuizBankFile,
	files: SurahFile[],
): GrammarPools {
	const find = locator(files);
	return {
		irab: hydrateAll(bank.irab, find, hydrateIrab),
		sarf: hydrateAll(bank.sarf, find, hydrateSarf),
		examples: hydrateAll(bank.examples, find, hydrateExample),
	};
}
