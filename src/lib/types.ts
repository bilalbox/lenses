export interface Features {
	form?: string;
	asp?: string;
	voice?: string;
	mood?: string;
	per?: number;
	gen?: string;
	num?: string;
	case?: string;
	state?: string;
	deriv?: string;
	sp?: string;
}

export interface Segment {
	k: "p" | "m" | "s";
	a: string;
	p: string;
	l?: string;
	la?: string;
	r?: string;
	ra?: string;
	g?: string;
	f?: Features;
}

export interface Word {
	n: number;
	a: string;
	s: Segment[];
	i?: string;
	sf?: string;
	m?: string;
}

export interface Verse {
	v: number;
	ar: string;
	/** English Al-Mukhtasar paragraph, stored verbatim. */
	en: string;
	/** Footnote supplied with the English paragraph, when QuranEnc sends one. */
	ef?: string;
	w: Word[];
	ir?: string;
	/** Indonesian Al-Mukhtasar paragraph, stored verbatim. */
	mk?: string;
	/** Footnote supplied with that paragraph, when QuranEnc sends one. */
	mf?: string;
	/** Arabic Al-Mukhtasar paragraph, stored verbatim from QuranEnc. */
	ma?: string;
	/** Footnote supplied with the Arabic paragraph, when QuranEnc sends one. */
	af?: string;
}

export interface SurahFile {
	n: number;
	name: string;
	phonetic: string;
	title: string;
	rev: string;
	goal?: string;
	revSeq?: number;
	surahClass?: string;
	verses: Verse[];
}

export interface UnitSummary {
	n: number;
	name: string;
	phonetic: string;
	title: string;
	rev: string;
	verses: number;
	syntax: number;
	revSeq?: number;
	goal?: string;
	surahClass?: string;
	mutashabih?: number;
	structure?: number;
}

export interface SourceMeta {
	id: string;
	title: string;
	kind: string;
	attribution: string;
	description?: string;
	license: string;
	url: string;
}

export interface Manifest {
	id: string;
	title: string;
	language: string;
	units: UnitSummary[];
	stats: {
		verses: number;
		words: number;
		syntaxVerses: number;
		syntaxGraphs: number;
		partialChapters: { n: number; syntax: number; verses: number }[];
		chaptersWithoutSyntax: number[];
		asbabVerses?: number;
		qiraatWords?: number;
		qiraatVerses?: number;
		mutashabihVerses?: number;
		mutashabihPairs?: number;
		structureSurahs?: number;
		structureBlocks?: number;
		munasabatTransitions?: number;
	};
	sources: SourceMeta[];
}

export type WordRow = [
	number,
	number,
	number,
	string,
	number,
	number,
	string,
	string,
	string,
	string,
];

export interface Lexeme {
	b: string;
	a: string;
	g?: string;
}

export interface WordIndex {
	roots: Lexeme[];
	lemmas: Lexeme[];
	rows: WordRow[];
}

export type VerseRow = [number, number, string, string];

export type VerseRef = { sura: number; verse: number };

export interface Route {
	page:
		| "verse"
		| "search"
		| "surahs"
		| "sources"
		| "quiz"
		| "rhetoric"
		| "munasabat";
	sura: number;
	verse: number;
	word?: number;
	tab?: string;
	/** Counterpart ayah a Mutashābih jump came from (`?target=2:58`). */
	target?: VerseRef;
}

export type RhetoricDatasetKey =
	| "dataset-a-tashbih"
	| "dataset-b-hadhf"
	| "classical-balagha";

export type RhetoricBranch = "maani" | "bayan" | "badi";

export interface TashbihDetails {
	tamthili: boolean; // composite multi-element scene analogy
	adat: string; // e.g. "كَمَثَلِ", "كَـ", "كَأَنَّ", or "none (محذوفة)"
	adatType: "mursal" | "muakkad";
	mushabbah: string; // the subject compared
	mushabbahBihi: string; // the vehicle compared to
	wajh: string; // point of similarity
	wajhType: "mufassal" | "mujmal";
	baligh: boolean; // tool & wajh omitted
	classificationAr: string; // e.g. "تمثيلي مرسل مجمل", "بليغ"
	classificationEn: string;
}

export interface HadhfDetails {
	category: "ism" | "harf" | "fil" | "jumlah";
	categoryAr: string; // "حذف اسم / مفعول / مضاف" | "حذف حرف" | "حذف فعل" | "حذف جملة / جواب شرط"
	slotAr: string; // "حذف المفعول به" | "حذف المضاف" | "حذف جواب الشرط" | "حذف مقول القول"
	slotEn: string;
	taqdirAr: string; // e.g. "[مَا قَدَّمَتْهُ مِنْ عَمَلٍ]"
	taqdirEn: string; // e.g. "[Whatever deeds she put forward]"
	omissionMarker: string; // context phrase with [ ] marker
	purposeAr: string; // e.g. "للتعميم والشمول واستيعاب سائر الأعمال"
	purposeEn: string; // e.g. "Universal generalization to encompass all deeds without limitation"
}

export interface RhetoricEntry {
	id: string;
	sura: number;
	verse: number;
	surahNameAr: string;
	surahNameEn: string;
	dataset: RhetoricDatasetKey;
	datasetBadge: string;
	branch: RhetoricBranch;
	branchAr: string;
	branchEn: string;
	deviceAr: string;
	deviceEn: string;
	subtypes: string[];
	arabicAyah: string;
	englishAyah: string;
	indonesianAyah: string;
	highlightArabic: string;
	tashbih?: TashbihDetails;
	hadhf?: HadhfDetails;
	scholarlyNote?: {
		source: string;
		text: string;
	};
}

export interface SyntaxConstituent {
	label: string;
	from: [number, number];
	to: [number, number];
}

export interface SyntaxToken {
	tok: number;
	text: string;
	pos: string;
	rel: string;
	rel_ar?: string;
	head: [number, number, number, number] | null;
	const?: SyntaxConstituent;
}

export interface SyntaxWord {
	w: number;
	text: string;
	tokens: SyntaxToken[];
}

export interface SyntaxCarriedWord {
	s: number;
	v: number;
	w: number;
	text: string;
}

export interface SyntaxSentence {
	id: number;
	words: SyntaxWord[];
	carried?: SyntaxCarriedWord[];
}

export interface VerseSyntax {
	v: number;
	sentences: SyntaxSentence[];
}

export interface SurahSyntaxFile {
	surah: number;
	verses: VerseSyntax[];
}

export interface AsbabNarration {
	id: number;
	text: string;
	takhrij: string;
	grade: "sahih" | "hasan" | "daif" | "other";
	gradeLabel: string;
}

export type AsbabData = Record<string, AsbabNarration[]>;

export interface QiraatRule {
	readers: string[];
	rule: string;
}

export interface WordQiraat {
	w: number;
	q?: QiraatRule[];
	wasl?: QiraatRule[];
	note?: string;
}

export interface AyahQiraat {
	v: number;
	words: WordQiraat[];
}

export interface SurahQiraatFile {
	surah: number;
	verses: AyahQiraat[];
}

export type MutashabihCategory =
	| "identical"
	| "shared_opening"
	| "shared_ending"
	| "shared_phrase"
	| "word_swap";

export type WordDiffStatus = "exact" | "haraka" | "diff" | "extra";

export interface WordDiffToken {
	w: number;
	s: WordDiffStatus;
	cw?: number | null;
}

export interface MutashabihMatch {
	sura: number;
	ayah: number;
	cat: MutashabihCategory;
	score: number;
	matchedWords: number;
	srcTokens: WordDiffToken[];
	targetTokens: WordDiffToken[];
	dabt?: string;
	tawjih?: string;
	noteEn?: string;
}

export interface VerseMutashabihEntry {
	v: number;
	matches: MutashabihMatch[];
}

export interface SurahMutashabihFile {
	sura: number;
	verses: VerseMutashabihEntry[];
}

/** One wording for a quiz blank, with the ayahs (`[sura, ayah]`) that use it. */
export interface MutashabihQuizOption {
	/** Uthmani words; empty when the ayah has no word at the blank. */
	a: string;
	refs: [number, number][];
}

/** A blank where an ayah's wording parts from a similar ayah. */
export interface MutashabihQuizEntry {
	id: string;
	s: number;
	v: number;
	/** The ayah's Uthmani words. */
	w: string[];
	/** Index of the first blanked word; with `len` 0 the blank sits before it. */
	at: number;
	len: number;
	opts: MutashabihQuizOption[];
	/** Index of the ayah's own wording in `opts`. */
	ans: number;
	/** Surah choices, the ayah's own among them. */
	surahs: number[];
}

export interface MutashabihQuizFile {
	version: number;
	questions: MutashabihQuizEntry[];
}

export type StructureRole =
	| "outer_frame_open"
	| "outer_frame_close"
	| "inner_frame_open"
	| "inner_frame_close"
	| "frame"
	| "body"
	| "pivot"
	| "center"
	| "center_flank_left"
	| "center_flank_right"
	| "close"
	| "narrative_1"
	| "narrative_2"
	| "narrative_3"
	| "narrative_4"
	| "narrative_5"
	| "narrative_6"
	| "narrative_7"
	| "transition_1"
	| "transition_2"
	| "transition_3"
	| "seam"
	| "hinge"
	| "addendum";

export interface StructureBlock {
	id: string;
	v: [number, number];
	role: StructureRole;
	label: string;
	labelAr?: string;
	pairId?: string;
}

export interface SurahStructureFile {
	sura: number;
	nameAr: string;
	nameEn: string;
	verseCount: number;
	family: {
		id: number;
		name: string;
		description: string;
	};
	pivot: {
		verse: string;
		offset: number;
		centerLogic: "single_concentration" | "compound_seam";
		function: string;
	};
	form: "compressed" | "distributed";
	semantic: "concentrated" | "diffuse" | "transitional";
	blocks: StructureBlock[];
	transitionToNext?: {
		targetSura: number;
		targetNameAr: string;
		targetNameEn: string;
		suyutiLinkAr: string;
		suyutiLinkEn: string;
		biqaiSummaryAr?: string;
		biqaiSummaryEn?: string;
	};
}

export interface TransitionsFile {
	count: number;
	transitions: Array<{
		fromSura: number;
		targetSura: number;
		targetNameAr: string;
		targetNameEn: string;
		suyutiLinkAr: string;
		suyutiLinkEn: string;
		biqaiSummaryAr?: string;
		biqaiSummaryEn?: string;
	}>;
}
