import type { LexemeCount, Segment, Word, WordStats } from "./types";

/**
 * The stem a word is counted and searched by: its first stem with a root,
 * else its first stem. Mirrors `primary_stem` in scripts/build_data.py, which
 * picks the root and lemma of each `words.json` row.
 */
export function primaryStem(word: Word): Segment | undefined {
	const stems = word.s.filter((segment) => segment.k === "m");
	return stems.find((segment) => segment.r) ?? stems[0];
}

export interface WordCounts {
	lemma?: LexemeCount;
	root?: LexemeCount;
}

export function wordCounts(
	stats: WordStats | undefined,
	stem: Segment | undefined,
): WordCounts {
	if (!stats || !stem) return {};
	return {
		lemma: stem.l ? stats.lemmas[stem.l] : undefined,
		root: stem.r ? stats.roots[stem.r] : undefined,
	};
}
