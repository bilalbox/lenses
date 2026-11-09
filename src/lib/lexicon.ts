import { stripDiacritics } from "./arabic";
import type { LaneEntry } from "./types";

// Uppercase Buckwalter letters get a "2" so `nws` (نوس) and `nwS` (نوص) stay
// apart on case-insensitive filesystems; `$` and `*` are not URL-safe.
// Mirrors `lexicon_slug` in scripts/build_lexicon.py.
const SLUG_SYMBOLS: Record<string, string> = { $: "c", "*": "o" };

export function lexiconSlug(root: string): string {
	let out = "";
	for (const ch of root) {
		const symbol = SLUG_SYMBOLS[ch];
		if (symbol) out += symbol;
		else if (ch !== ch.toLowerCase()) out += `${ch.toLowerCase()}2`;
		else out += ch;
	}
	return out;
}

export function lexiconUrl(root: string): string {
	return `/data/quran/lexicon/${lexiconSlug(root)}.json`;
}

/**
 * A headword with its vowels, minus what differs between the corpus's Uthmani
 * lemma and Lane's spelling: tanwīn, shadda, sukūn, dagger alif, alif wasla.
 * Keeps the verb نَاسَ apart from the noun نَاسٌ, which bare letters would not.
 */
function vowelled(text: string): string {
	return text.replace(/[ً-ٍّْۡ]/g, "").replace(/[ٰٱ]/g, "ا");
}

/** Lane's entries split into those headed by the word's lemma and the rest of the root. */
export function laneEntriesFor(
	entries: LaneEntry[],
	lemma: string | undefined,
): { word: LaneEntry[]; rest: LaneEntry[] } {
	if (!lemma) return { word: [], rest: entries };
	const exact = entries.filter(
		(entry) => vowelled(entry.h) === vowelled(lemma),
	);
	const bare = stripDiacritics(lemma);
	const word = exact.length
		? exact
		: entries.filter((entry) => stripDiacritics(entry.h) === bare);
	return { word, rest: entries.filter((entry) => !word.includes(entry)) };
}
