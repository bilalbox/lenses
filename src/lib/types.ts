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
	/** Quranic Arabic Corpus word-by-word English gloss, stored verbatim. */
	e?: string;
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
		wujuhRoots?: number;
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

/** Plain English, or [1, italic English] / [2, Arabic] in Lane's text. */
export type LaneRun = string | [1 | 2, string];

export interface LaneEntry {
	/** Headword, in Arabic script. */
	h: string;
	/** Verb form number Lane gives the entry. */
	f?: string;
	t: LaneRun[];
}

/** `lexicon/{slug}.json`: the dictionaries' entries for one corpus root. */
export interface LexiconFile {
	/** Buckwalter root key. */
	r: string;
	/** Lane's Lexicon: first page and entries. */
	lane?: { p: number; e: LaneEntry[] };
	/** Ibn Fāris, Maqāyīs al-Lugha: paragraphs. */
	maqayis?: string[];
	/** al-Rāghib, al-Mufradāt: paragraphs. */
	mufradat?: string[];
}

/** A verse al-Dāmaghānī cites: sura, verse, word, then the words before, the word, the words after. */
export type WujuhCite = [number, number, number, string, string, string];

export interface WujuhSense {
	/** The sense, in al-Dāmaghānī's words. */
	l: string;
	c: WujuhCite[];
}

export interface WujuhEntry {
	/** Headword as al-Dāmaghānī heads the entry. */
	h: string;
	s: WujuhSense[];
}

/** `wujuh.json`: al-Dāmaghānī's entries, keyed by Buckwalter root, or for a
 * particle by `~` and its Buckwalter lemma (`~fiY`). */
export type WujuhFile = Record<string, WujuhEntry[]>;

/** Occurrences, distinct verses, distinct surahs. */
export type LexemeCount = [number, number, number];

/** Counts per root and per lemma, keyed by Buckwalter key (`wordStats.json`). */
export interface WordStats {
	roots: Record<string, LexemeCount>;
	lemmas: Record<string, LexemeCount>;
}

export type VerseRef = { sura: number; verse: number };

export interface Route {
	page: "verse" | "search" | "surahs" | "sources" | "quiz";
	sura: number;
	verse: number;
	word?: number;
	tab?: string;
	/** Counterpart ayah a Mutashābih jump came from (`?target=2:58`). */
	target?: VerseRef;
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

export interface IrabEntry {
	id: number;
	title: string;
	bab: string;
	page: number;
	body: string[];
	citations: [number, number][];
}

export interface IrabAppendixVerse {
	sura: number;
	verse: number;
	text: string;
	words: { w: string; i: string }[];
	sentences: string[];
	notes: string[];
}

export interface IrabDictionaryFile {
	metadata: {
		title: string;
		author: string;
		reviewer: string;
		entriesCount: number;
		citationsCount: number;
		appendixVersesCount: number;
	};
	entries: IrabEntry[];
	byWord: Record<string, number[]>;
	byVerse: Record<string, number[]>;
	appendix: Record<string, IrabAppendixVerse>;
}
