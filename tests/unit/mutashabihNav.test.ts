import { describe, expect, it } from "vitest";
import { surahTitle } from "../../src/lib/manifest";
import {
	counterpartSelectionReducer,
	initCounterpartSelection,
	isLinked,
} from "../../src/lib/mutashabihNav";
import { parseRoute, verseRefParam } from "../../src/lib/route";
import type {
	Manifest,
	MutashabihMatch,
	WordDiffToken,
} from "../../src/lib/types";

describe("mutashabihNav: symmetric counterpart hovering", () => {
	// Sample tokens between 2:58 and 7:161
	const srcTokens: WordDiffToken[] = [
		{ w: 1, s: "diff", cw: 1 }, // وإذ قلنا vs وإذ قيل
		{ w: 2, s: "diff", cw: 2 },
		{ w: 3, s: "exact", cw: 3 }, // ادخلوا
		{ w: 4, s: "exact", cw: 4 }, // هذه
		{ w: 5, s: "exact", cw: 5 }, // القرية
		{ w: 6, s: "exact", cw: 6 }, // فكلوا
		{ w: 7, s: "exact", cw: 7 }, // منها
		{ w: 8, s: "diff", cw: 8 }, // حيث
		{ w: 9, s: "diff", cw: 9 }, // شئتم
		{ w: 10, s: "extra" }, // رغدا (only in 2:58)
		{ w: 11, s: "exact", cw: 10 }, // وادخلوا
	];

	const targetTokens: WordDiffToken[] = [
		{ w: 1, s: "diff", cw: 1 },
		{ w: 2, s: "diff", cw: 2 },
		{ w: 3, s: "exact", cw: 3 },
		{ w: 4, s: "exact", cw: 4 },
		{ w: 5, s: "exact", cw: 5 },
		{ w: 6, s: "exact", cw: 6 },
		{ w: 7, s: "exact", cw: 7 },
		{ w: 8, s: "diff", cw: 8 },
		{ w: 9, s: "diff", cw: 9 },
		{ w: 10, s: "exact", cw: 11 }, // وادخلوا
	];

	const linked = (
		word: number,
		tokens: WordDiffToken[],
		onTargetCard: boolean,
		hovered: { word: number; isTarget: boolean } | null,
	) =>
		isLinked(
			hovered,
			word,
			tokens.find((t) => t.w === word),
			onTargetCard,
		);

	it("highlights nothing without a hover", () => {
		expect(linked(3, srcTokens, false, null)).toBe(false);
	});

	it("highlights source word directly on source card hover", () => {
		const hovered = { word: 3, isTarget: false };
		expect(linked(3, srcTokens, false, hovered)).toBe(true);
		expect(linked(4, srcTokens, false, hovered)).toBe(false);
	});

	it("symmetrically highlights counterpart word on target card when source is hovered", () => {
		const hovered = { word: 3, isTarget: false };
		expect(linked(3, targetTokens, true, hovered)).toBe(true);
		expect(linked(4, targetTokens, true, hovered)).toBe(false);
	});

	it("symmetrically highlights counterpart word on source card when target is hovered", () => {
		const hovered = { word: 10, isTarget: true }; // target word 10 (وادخلوا)
		expect(linked(11, srcTokens, false, hovered)).toBe(true);
		expect(linked(10, srcTokens, false, hovered)).toBe(false); // رغدا has no cw
	});

	it("handles extra words without counterparts gracefully", () => {
		const hovered = { word: 10, isTarget: false }; // رغدا
		expect(linked(10, srcTokens, false, hovered)).toBe(true);
		for (const tok of targetTokens) {
			expect(linked(tok.w, targetTokens, true, hovered)).toBe(false);
		}
	});
});

describe("mutashabihNav: counterpart selection", () => {
	const sampleMatches: MutashabihMatch[] = [
		{
			sura: 7,
			ayah: 161,
			score: 0.92,
			matchedWords: 12,
			cat: "shared_opening",
			srcTokens: [],
			targetTokens: [],
		},
		{
			sura: 2,
			ayah: 123,
			score: 0.88,
			matchedWords: 9,
			cat: "word_swap",
			srcTokens: [],
			targetTokens: [],
		},
	];

	it("defaults to the best match when no target is given", () => {
		expect(initCounterpartSelection(sampleMatches)).toEqual({
			active: 0,
			count: 2,
			hovered: null,
		});
	});

	it("selects the target counterpart when it is among the matches", () => {
		expect(
			initCounterpartSelection(sampleMatches, { sura: 2, verse: 123 }).active,
		).toBe(1);
		expect(
			initCounterpartSelection(sampleMatches, { sura: 7, verse: 161 }).active,
		).toBe(0);
	});

	it("falls back to the best match when the target matches no counterpart", () => {
		expect(
			initCounterpartSelection(sampleMatches, { sura: 99, verse: 99 }).active,
		).toBe(0);
	});

	it("steps with wraparound and clears the hover", () => {
		const start = {
			...initCounterpartSelection(sampleMatches),
			hovered: { word: 3, isTarget: false },
		};
		const back = counterpartSelectionReducer(start, {
			type: "step",
			delta: -1,
		});
		expect(back).toEqual({ active: 1, count: 2, hovered: null });
		expect(
			counterpartSelectionReducer(back, { type: "step", delta: 1 }).active,
		).toBe(0);
	});

	it("selects by index, ignoring out-of-range indices", () => {
		const start = initCounterpartSelection(sampleMatches);
		expect(
			counterpartSelectionReducer(start, { type: "select", index: 1 }).active,
		).toBe(1);
		expect(
			counterpartSelectionReducer(start, { type: "select", index: 5 }),
		).toBe(start);
	});

	it("tracks the hovered word", () => {
		const hovered = { word: 4, isTarget: true };
		const next = counterpartSelectionReducer(
			initCounterpartSelection(sampleMatches),
			{ type: "hover", hovered },
		);
		expect(next.hovered).toEqual(hovered);
		expect(next.active).toBe(0);
	});
});

describe("mutashabihNav: target query param", () => {
	it("round-trips through the verse route", () => {
		const target = { sura: 2, verse: 58 };
		const route = parseRoute(
			`#/7/161?tab=mutashabih&target=${verseRefParam(target)}`,
		);
		expect(route).toMatchObject({
			page: "verse",
			sura: 7,
			verse: 161,
			tab: "mutashabih",
			target,
		});
	});

	it("accepts the legacy counterpart param", () => {
		expect(parseRoute("#/7/161?counterpart=2:58").target).toEqual({
			sura: 2,
			verse: 58,
		});
	});

	it("drops malformed or out-of-range targets", () => {
		for (const bad of ["2", "2:", "abc", "0:5", "115:1", "2:0"]) {
			expect(parseRoute(`#/7/161?target=${bad}`).target, bad).toBeUndefined();
		}
	});
});

describe("manifest: surah title resolution", () => {
	const mockManifest: Manifest = {
		id: "quran-standard",
		title: "Quran Corpus",
		language: "ar",
		stats: {
			verses: 6236,
			words: 77429,
			syntaxVerses: 6236,
			syntaxGraphs: 11596,
			partialChapters: [],
			chaptersWithoutSyntax: [],
		},
		units: [
			{
				n: 1,
				name: "الفاتحة",
				phonetic: "Al-Faatiha",
				title: "The Opening",
				rev: "Makkah",
				verses: 7,
				syntax: 7,
			},
			{
				n: 2,
				name: "البقرة",
				phonetic: "Al-Baqara",
				title: "The Cow",
				rev: "Madinah",
				verses: 286,
				syntax: 286,
			},
			{
				n: 7,
				name: "الأعراف",
				phonetic: "Al-A'raaf",
				title: "The Heights",
				rev: "Makkah",
				verses: 206,
				syntax: 206,
			},
		],
		sources: [],
	};

	it("resolves Arabic name when locale is 'ar'", () => {
		expect(surahTitle(mockManifest, 7, "ar")).toBe("الأعراف");
		expect(surahTitle(mockManifest, 2, "ar")).toBe("البقرة");
	});

	it("resolves Phonetic transliteration when locale is not 'ar'", () => {
		expect(surahTitle(mockManifest, 7, "en")).toBe("Al-A'raaf");
		expect(surahTitle(mockManifest, 2, "id")).toBe("Al-Baqara");
	});

	it("falls back to S{id} when surah is not in manifest", () => {
		expect(surahTitle(mockManifest, 999, "en")).toBe("S999");
		expect(surahTitle(undefined, 2, "en")).toBe("S2");
	});
});
