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

export interface GraphNode {
	t: "seg" | "slot" | "elide" | "ref" | "ph";
	s?: number;
	v?: number;
	w?: number;
	si?: number;
	a?: string | null;
	p?: string;
	from?: number;
	to?: number;
	slot?: boolean;
}

export interface GraphEdge {
	r: string;
	d: number;
	h: number;
}

export interface SyntaxGraph {
	nodes: GraphNode[];
	edges: GraphEdge[];
	x?: boolean;
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
	g?: SyntaxGraph[];
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

export interface Route {
	page: "verse" | "search" | "surahs" | "sources" | "quiz" | "rhetoric";
	sura: number;
	verse: number;
	word?: number;
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
