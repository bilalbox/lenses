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

/** Where a word's entries are filed: its root, or for a particle (في, لعل)
 * its lemma, as `~` and the lemma. */
export function wujuhKey(stem: Segment | undefined): string | undefined {
	if (stem?.r) return stem.r;
	return stem?.l ? `~${stem.l}` : undefined;
}

/**
 * The entries of the word's root (or particle) that are about this word: one
 * that cites this very occurrence, or one headed by the word's lemma or by
 * its root letters. Another word of the same root (أَمَام under أمة) gets none.
 */
export function wujuhFor(
	file: WujuhFile | undefined,
	stem: Segment | undefined,
	sura: number,
	verse: number,
	word: number,
): WujuhView[] {
	const key = wujuhKey(stem);
	const entries = key ? file?.[key] : undefined;
	if (!entries || !stem) return [];
	const names = new Set(
		[stem.la, stem.ra].filter((n): n is string => Boolean(n)).map(bare),
	);
	// Filed under a lemma, an entry is about that very word; under a root,
	// only one headed by the word (أمة, not أمام) is.
	const ofLemma = key?.startsWith("~") ?? false;
	return entries
		.map((entry) => ({
			entry,
			here: entry.s.findIndex((sense) =>
				sense.c.some((cite) => isCite(cite, sura, verse, word)),
			),
		}))
		.filter(
			(view) => ofLemma || view.here >= 0 || names.has(bare(view.entry.h)),
		);
}
