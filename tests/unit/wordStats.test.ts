import { describe, expect, it } from "vitest";
import type { Word, WordStats } from "../../src/lib/types";
import { primaryStem, wordCounts } from "../../src/lib/wordStats";

const stats: WordStats = {
	roots: { nws: [241, 225, 53] },
	lemmas: { "n~aAs": [241, 225, 53], min: [3226, 2680, 113] },
};

describe("wordStats", () => {
	it("counts a word by its first stem that has a root", () => {
		const word: Word = {
			n: 2,
			a: "وَمِنَ ٱلنَّاسِ",
			s: [
				{ k: "p", a: "وَ", p: "REM" },
				{ k: "m", a: "مِنَ", p: "P", l: "min" },
				{ k: "m", a: "نَّاسِ", p: "N", l: "n~aAs", r: "nws" },
			],
		};
		const stem = primaryStem(word);
		expect(stem?.l).toBe("n~aAs");
		expect(wordCounts(stats, stem)).toEqual({
			lemma: [241, 225, 53],
			root: [241, 225, 53],
		});
	});

	it("falls back to the first stem for a word with no root", () => {
		const word: Word = {
			n: 1,
			a: "مِنَ",
			s: [{ k: "m", a: "مِنَ", p: "P", l: "min" }],
		};
		expect(wordCounts(stats, primaryStem(word))).toEqual({
			lemma: [3226, 2680, 113],
			root: undefined,
		});
	});

	it("returns nothing before the stats load", () => {
		expect(wordCounts(undefined, { k: "m", a: "x", p: "N" })).toEqual({});
	});
});
