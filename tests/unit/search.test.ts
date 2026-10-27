import { describe, expect, it } from "vitest";
import {
	countExamples,
	type ExampleQuery,
	searchExamples,
	searchVerses,
} from "../../src/lib/search";
import type { VerseRow, WordIndex } from "../../src/lib/types";

describe("search: searchVerses", () => {
	const mockVerses: VerseRow[] = [
		[
			1,
			1,
			"بسم الله الرحمن الرحيم",
			"In the name of Allah, the Entirely Merciful, the Especially Merciful.",
		],
		[
			1,
			2,
			"الحمد لله رب العلمين",
			"All praise is due to Allah, Lord of the worlds.",
		],
		[
			59,
			18,
			"يأيها الذين ءامنوا اتقوا الله ولتنظر نفس ما قدمت لغد",
			"O you who have believed, fear Allah. And let every soul look to what it has put forth for tomorrow.",
		],
	];

	it("returns empty results for whitespace or empty query", () => {
		expect(searchVerses(mockVerses, "")).toEqual({ hits: [], total: 0 });
		expect(searchVerses(mockVerses, "   ")).toEqual({ hits: [], total: 0 });
	});

	it("jumps directly to chapter:verse when formatted with colon", () => {
		const res = searchVerses(mockVerses, "59:18");
		expect(res.hits).toHaveLength(1);
		expect(res.hits[0]?.sura).toBe(59);
		expect(res.hits[0]?.verse).toBe(18);
		expect(res.total).toBe(1);
	});

	it("supports Arabic semicolon (؛) in chapter:verse jumps", () => {
		const res = searchVerses(mockVerses, "1؛2");
		expect(res.hits).toHaveLength(1);
		expect(res.hits[0]?.sura).toBe(1);
		expect(res.hits[0]?.verse).toBe(2);
	});

	it("searches English tafsir text case-insensitively", () => {
		const res = searchVerses(mockVerses, "fear allah");
		expect(res.hits).toHaveLength(1);
		expect(res.hits[0]?.sura).toBe(59);
		expect(res.hits[0]?.verse).toBe(18);
	});

	it("searches Arabic text whether query includes diacritics or not", () => {
		// Bare letters without tashkeel
		const bareRes = searchVerses(mockVerses, "الحمد");
		expect(bareRes.hits).toHaveLength(1);
		expect(bareRes.hits[0]?.sura).toBe(1);
		expect(bareRes.hits[0]?.verse).toBe(2);

		// Query WITH diacritics/tashkeel matches normalized verse row
		const tashkeelRes = searchVerses(mockVerses, "ٱلْحَمْدُ");
		expect(tashkeelRes.hits).toHaveLength(1);
		expect(tashkeelRes.hits[0]?.sura).toBe(1);
		expect(tashkeelRes.hits[0]?.verse).toBe(2);
	});

	it("deduplicates exact jump results from keyword search", () => {
		// "1:1" jumps to 1:1, and "1:1" is not re-added
		const res = searchVerses(mockVerses, "1:1");
		expect(res.hits).toHaveLength(1);
		expect(res.total).toBe(1);
	});

	it("respects the limit parameter and tracks total matches", () => {
		// "Allah" appears in all 3 verses
		const res = searchVerses(mockVerses, "Allah", 2);
		expect(res.hits).toHaveLength(2);
		expect(res.total).toBe(3);
	});
});

describe("search: searchExamples & countExamples", () => {
	const mockIndex: WordIndex = {
		roots: [
			{ a: "سمو", b: "smw" },
			{ a: "اله", b: "Alh" },
			{ a: "رحم", b: "rHm" },
		],
		lemmas: [
			{ a: "ٱسْم", b: "{som", g: "name" },
			{ a: "ٱللَّه", b: "All~ah", g: "Allah" },
			{ a: "رَحْمَٰن", b: "raHoma`n", g: "Most Gracious" },
			{ a: "رَحِيم", b: "raHiym", g: "Most Merciful" },
		],
		rows: [
			// sura, verse, word, arabic, rootIdx, lemmaIdx, pos, poses, features, rels
			[1, 1, 1, "بِسْمِ", 0, 0, "N", "P,N", "GEN", "gen"],
			[1, 1, 2, "ٱللَّهِ", 1, 1, "PN", "PN", "GEN", "poss"],
			[1, 1, 3, "ٱلرَّحْمَٰنِ", 2, 2, "ADJ", "ADJ", "GEN", "adj"],
			[1, 1, 4, "ٱلرَّحِيمِ", 2, 3, "ADJ", "ADJ", "GEN", "adj"],
		],
	};

	const baseQuery: ExampleQuery = {
		root: "",
		lemma: "",
		pos: "",
		form: "",
		relation: "",
	};

	it("filters examples by root (Arabic or Buckwalter)", () => {
		// Query root with Arabic letters
		const arabicHits = searchExamples(mockIndex, {
			...baseQuery,
			root: "رحم",
		});
		expect(arabicHits).toHaveLength(2);
		expect(arabicHits[0]?.arabic).toBe("ٱلرَّحْمَٰنِ");
		expect(arabicHits[1]?.arabic).toBe("ٱلرَّحِيمِ");

		// Query root with Buckwalter
		const bwHits = searchExamples(mockIndex, { ...baseQuery, root: "rHm" });
		expect(bwHits).toHaveLength(2);
	});

	it("filters examples by part of speech", () => {
		const nounHits = searchExamples(mockIndex, { ...baseQuery, pos: "N" });
		expect(nounHits).toHaveLength(1);
		expect(nounHits[0]?.arabic).toBe("بِسْمِ");

		const adjHits = searchExamples(mockIndex, { ...baseQuery, pos: "ADJ" });
		expect(adjHits).toHaveLength(2);
	});

	it("filters examples by syntactic relation", () => {
		const possHits = searchExamples(mockIndex, {
			...baseQuery,
			relation: "poss",
		});
		expect(possHits).toHaveLength(1);
		expect(possHits[0]?.arabic).toBe("ٱللَّهِ");
	});

	it("counts total matching examples accurately", () => {
		const count = countExamples(mockIndex, { ...baseQuery, root: "رحم" });
		expect(count).toBe(2);

		const zeroCount = countExamples(mockIndex, {
			...baseQuery,
			root: "غير_موجود",
		});
		expect(zeroCount).toBe(0);
	});
});
