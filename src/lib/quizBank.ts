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
import type { UsuliShahid } from "./usulTypes";

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

export interface UsulQuestion {
	id: string;
	sura: number;
	suraName: string;
	suraPhonetic: string;
	verse: Verse;
	shahid: UsuliShahid;
}

export interface QuizPools {
	irab: QuizQuestion[];
	sarf: SarfQuestion[];
	mutashabih: MutashabihQuestion[];
	usul?: UsulQuestion[];
}

/** The pools built from surah morphology and treebanks; mutashabih and usul come from their own banks. */
export type GrammarPools = Omit<QuizPools, "mutashabih" | "usul">;

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

export interface QuizBankFile {
	version: 1;
	/** Surahs the bank was built from, in the order their questions appear. */
	surahs: number[];
	irab: IrabEntry[];
	sarf: SarfEntry[];
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
	};
}
