import { describe, expect, it } from "vitest";
import { ar } from "../../src/lib/i18n/locales/ar";
import { en } from "../../src/lib/i18n/locales/en";
import { id } from "../../src/lib/i18n/locales/id";
import type {
	Manifest,
	MutashabihMatch,
	WordDiffStatus,
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

	function isLinked(
		wordIndex: number,
		tokens: WordDiffToken[],
		isTargetCard: boolean,
		hovered: { word: number; isTarget: boolean } | null,
	): boolean {
		if (!hovered) return false;
		if (hovered.isTarget === isTargetCard) {
			return hovered.word === wordIndex;
		}
		const tok = tokens.find((t) => t.w === wordIndex);
		return tok?.cw === hovered.word;
	}

	it("highlights source word directly on source card hover", () => {
		const hovered = { word: 3, isTarget: false };
		expect(isLinked(3, srcTokens, false, hovered)).toBe(true);
		expect(isLinked(4, srcTokens, false, hovered)).toBe(false);
	});

	it("symmetrically highlights counterpart word on target card when source is hovered", () => {
		const hovered = { word: 3, isTarget: false };
		// On target card, word 3 points to cw: 3
		expect(isLinked(3, targetTokens, true, hovered)).toBe(true);
		expect(isLinked(4, targetTokens, true, hovered)).toBe(false);
	});

	it("symmetrically highlights counterpart word on source card when target is hovered", () => {
		const hovered = { word: 10, isTarget: true }; // target word 10 (وادخلوا)
		// On source card, word 11 points to cw: 10
		expect(isLinked(11, srcTokens, false, hovered)).toBe(true);
		expect(isLinked(10, srcTokens, false, hovered)).toBe(false); // word 10 is 'رغدا' without cw
	});

	it("handles extra words without counterparts gracefully", () => {
		// Hovering 'رغدا' (source word 10, no cw)
		const hovered = { word: 10, isTarget: false };
		expect(isLinked(10, srcTokens, false, hovered)).toBe(true);
		// No word on target card should link to source word 10
		for (const tok of targetTokens) {
			expect(isLinked(tok.w, targetTokens, true, hovered)).toBe(false);
		}
	});
});

describe("mutashabihNav: target coordination resolution", () => {
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

	function resolveActiveIndex(
		matches: MutashabihMatch[],
		targetParam?: string,
	): number {
		if (!targetParam) return 0;
		const [s, a] = targetParam.split(":").map(Number);
		const idx = matches.findIndex((m) => m.sura === s && m.ayah === a);
		return Math.max(idx, 0);
	}

	it("defaults to index 0 when no targetParam is provided", () => {
		expect(resolveActiveIndex(sampleMatches)).toBe(0);
	});

	it("selects matching counterpart when targetParam matches", () => {
		expect(resolveActiveIndex(sampleMatches, "2:123")).toBe(1);
		expect(resolveActiveIndex(sampleMatches, "7:161")).toBe(0);
	});

	it("falls back to 0 when targetParam does not match any counterpart", () => {
		expect(resolveActiveIndex(sampleMatches, "99:99")).toBe(0);
	});
});

describe("mutashabihNav: i18n completeness across locales", () => {
	const locales = [
		{ key: "en", bundle: en },
		{ key: "ar", bundle: ar },
		{ key: "id", bundle: id },
	] as const;

	const statuses: WordDiffStatus[] = ["exact", "haraka", "diff", "extra"];

	it("provides localized legend labels and non-empty strings in all 3 languages", () => {
		for (const { key, bundle } of locales) {
			expect(
				bundle.verse.mutashabihLegendExact.length,
				`exact in ${key}`,
			).toBeGreaterThan(0);
			expect(
				bundle.verse.mutashabihLegendHaraka.length,
				`haraka in ${key}`,
			).toBeGreaterThan(0);
			expect(
				bundle.verse.mutashabihLegendDiff.length,
				`diff in ${key}`,
			).toBeGreaterThan(0);
			expect(
				bundle.verse.mutashabihLegendExtra.length,
				`extra in ${key}`,
			).toBeGreaterThan(0);
			expect(
				bundle.verse.mutashabihEmptyState.length,
				`empty in ${key}`,
			).toBeGreaterThan(0);
			expect(
				bundle.verse.mutashabihReturnToAyah("2:58"),
				`return in ${key}`,
			).toContain("2:58");
		}
	});

	it("covers all 4 diff status categories", () => {
		expect(statuses).toEqual(["exact", "haraka", "diff", "extra"]);
	});
});

describe("mutashabihNav: manifest surah title resolution", () => {
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

	function getSurahTitle(
		manifest: Manifest | undefined,
		suraId: number,
		locale: string,
	): string {
		const unit = manifest?.units.find((u) => u.n === suraId);
		if (!unit) return `S${suraId}`;
		return locale === "ar" ? unit.name : unit.phonetic;
	}

	it("resolves Arabic name when locale is 'ar'", () => {
		expect(getSurahTitle(mockManifest, 7, "ar")).toBe("الأعراف");
		expect(getSurahTitle(mockManifest, 2, "ar")).toBe("البقرة");
	});

	it("resolves Phonetic transliteration when locale is not 'ar'", () => {
		expect(getSurahTitle(mockManifest, 7, "en")).toBe("Al-A'raaf");
		expect(getSurahTitle(mockManifest, 2, "id")).toBe("Al-Baqara");
	});

	it("falls back to S{id} when surah is not in manifest", () => {
		expect(getSurahTitle(mockManifest, 999, "en")).toBe("S999");
	});
});
