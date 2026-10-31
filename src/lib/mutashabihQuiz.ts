/** Mutashabih lens: fill the word where an ayah parts from a similar one, then name its surah. */
import type { MutashabihQuizFile, UnitSummary } from "./types";

export interface SurahChoice {
	n: number;
	name: string;
	phonetic: string;
}

export interface WordingChoice {
	/** Uthmani words; empty when the ayah has no word at the blank. */
	text: string;
	/** The ayahs that read this wording at the blank. */
	refs: { sura: number; verse: number; phonetic: string }[];
}

export interface MutashabihQuestion {
	id: string;
	sura: number;
	suraName: string;
	suraPhonetic: string;
	verse: { v: number };
	words: string[];
	/** First blanked word; with `length` 0 the blank sits before this word. */
	at: number;
	length: number;
	wordings: WordingChoice[];
	/** Index into `wordings` of the ayah's own wording. */
	answer: number;
	surahs: SurahChoice[];
}

/** The quiz bank with surah names from the manifest; entries naming an unknown surah are dropped. */
export function toMutashabihQuestions(
	file: MutashabihQuizFile,
	units: UnitSummary[],
): MutashabihQuestion[] {
	const byNumber = new Map(units.map((u) => [u.n, u]));
	const choice = (n: number): SurahChoice | null => {
		const unit = byNumber.get(n);
		return unit ? { n, name: unit.name, phonetic: unit.phonetic } : null;
	};
	return file.questions.flatMap((q) => {
		const own = choice(q.s);
		const surahs = q.surahs.map(choice);
		if (!own || surahs.includes(null)) return [];
		return [
			{
				id: q.id,
				sura: q.s,
				suraName: own.name,
				suraPhonetic: own.phonetic,
				verse: { v: q.v },
				words: q.w,
				at: q.at,
				length: q.len,
				wordings: q.opts.map((o) => ({
					text: o.a,
					refs: o.refs.map(([sura, verse]) => ({
						sura,
						verse,
						phonetic: byNumber.get(sura)?.phonetic ?? "",
					})),
				})),
				answer: q.ans,
				surahs: surahs as SurahChoice[],
			},
		];
	});
}

export type AyahPiece =
	| { kind: "word"; index: number; text: string }
	| { kind: "blank"; text: string | null };

/**
 * The ayah as words around one blank. `fill` is shown in the blank: the reader's
 * pick before checking, the ayah's own wording after; null leaves it empty.
 */
export function ayahWithBlank(
	q: MutashabihQuestion,
	fill: string | null,
): AyahPiece[] {
	const word = (text: string, index: number): AyahPiece => ({
		kind: "word",
		index,
		text,
	});
	return [
		...q.words.slice(0, q.at).map(word),
		{ kind: "blank", text: fill },
		...q.words
			.slice(q.at + q.length)
			.map((t, i) => word(t, q.at + q.length + i)),
	];
}
