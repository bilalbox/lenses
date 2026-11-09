import { stripDiacritics } from "./arabic";
import type { Segment, WujuhCite, WujuhEntry, WujuhFile } from "./types";

export interface WujuhView {
	entry: WujuhEntry;
	/** Index of the sense al-Dāmaghānī gives this occurrence, or -1. */
	here: number;
}

const bare = (text: string) => stripDiacritics(text).replace(/\s/g, "");

export function isCite(
	cite: WujuhCite,
	sura: number,
	verse: number,
	word: number,
) {
	return cite[0] === sura && cite[1] === verse && cite[2] === word;
}

/**
 * The entries of the word's root that are about this word: one that cites
 * this very occurrence, or one headed by the word's lemma or by its root
 * letters. Another word of the same root (أَمَام under أمة) gets none.
 */
export function wujuhFor(
	file: WujuhFile | undefined,
	stem: Segment | undefined,
	sura: number,
	verse: number,
	word: number,
): WujuhView[] {
	const entries = stem?.r ? file?.[stem.r] : undefined;
	if (!entries || !stem) return [];
	const names = new Set(
		[stem.la, stem.ra].filter((n): n is string => Boolean(n)).map(bare),
	);
	return entries
		.map((entry) => ({
			entry,
			here: entry.s.findIndex((sense) =>
				sense.c.some((cite) => isCite(cite, sura, verse, word)),
			),
		}))
		.filter((view) => view.here >= 0 || names.has(bare(view.entry.h)));
}
