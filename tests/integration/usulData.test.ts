import * as fs from "node:fs";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { getTaxonomyNode } from "../../src/lib/usulTaxonomy";
import {
	type SurahUsulFile,
	UsuliShahidSchema,
	type UsuliTaxonomyNode,
} from "../../src/lib/usulTypes";

const ROOT = path.resolve(__dirname, "../..");
const USUL_002_PATH = path.join(ROOT, "public/data/quran/usul/002.json");
const SURAH_002_PATH = path.join(ROOT, "public/data/quran/surah/002.json");
const TAXONOMY_PATH = path.join(ROOT, "public/data/quran/usulTaxonomy.json");

describe("integration: Usul al-Fiqh & Dalalat al-Alfaz Dataset (Surah Al-Baqarah)", () => {
	it("validates all taxonomy nodes in usulTaxonomy.json", () => {
		const raw = fs.readFileSync(TAXONOMY_PATH, "utf-8");
		const nodes: UsuliTaxonomyNode[] = JSON.parse(raw);

		expect(nodes.length).toBe(25);
		for (const node of nodes) {
			expect(node.id).toBeDefined();
			expect(node.nameAr).toBeDefined();
			expect(node.descriptionAr).toBeDefined();
			expect(getTaxonomyNode(node.id)).toBeDefined();
		}
	});

	it("validates the full Surah 2 Usul dataset against UsuliShahidSchema", () => {
		const raw = fs.readFileSync(USUL_002_PATH, "utf-8");
		const file: SurahUsulFile = JSON.parse(raw);

		expect(file.surah).toBe(2);
		expect(file.shawahid.length).toBeGreaterThanOrEqual(8);

		const categoryGroups = new Set(file.shawahid.map((s) => s.categoryGroup));
		expect(categoryGroups.size).toBe(5);

		for (const item of file.shawahid) {
			const parsed = UsuliShahidSchema.parse(item);
			expect(parsed.ayahNumber).toBeGreaterThanOrEqual(1);
			expect(parsed.ayahNumber).toBeLessThanOrEqual(286);
			expect(parsed.wordStart).toBeGreaterThanOrEqual(1);
			expect(parsed.wordEnd).toBeGreaterThanOrEqual(parsed.wordStart);
		}
	});

	it("contains all 8 canonical Golden Seed shawahid with precise coordinates", () => {
		const raw = fs.readFileSync(USUL_002_PATH, "utf-8");
		const file: SurahUsulFile = JSON.parse(raw);

		const expectedGolden = [
			{ verseKey: "2:43", taxonomyId: "AMR_WUJUB", wordStart: 1, wordEnd: 4 },
			{
				verseKey: "2:187",
				taxonomyId: "AMR_IBAHAH",
				wordStart: 31,
				wordEnd: 37,
			},
			{
				verseKey: "2:196",
				taxonomyId: "DALALAT_IQTIDA",
				wordStart: 45,
				wordEnd: 50,
			},
			{
				verseKey: "2:221",
				taxonomyId: "NAHY_TAHRIM",
				wordStart: 1,
				wordEnd: 5,
			},
			{
				verseKey: "2:228",
				taxonomyId: "KHABAR_BIMAANA_AMR",
				wordStart: 2,
				wordEnd: 5,
			},
			{
				verseKey: "2:233",
				taxonomyId: "ISHARAT_NASS",
				wordStart: 11,
				wordEnd: 15,
			},
			{
				verseKey: "2:275",
				taxonomyId: "IBARAT_NASS",
				wordStart: 21,
				wordEnd: 25,
			},
			{ verseKey: "2:282", taxonomyId: "AMR_NADB", wordStart: 4, wordEnd: 10 },
		];

		for (const exp of expectedGolden) {
			const found = file.shawahid.find(
				(s) =>
					s.verseKey === exp.verseKey &&
					s.taxonomyId === exp.taxonomyId &&
					s.isCanonicalShahid === true,
			);
			expect(
				found,
				`Missing golden seed for ${exp.verseKey} (${exp.taxonomyId})`,
			).toBeDefined();
			expect(found?.wordStart).toBe(exp.wordStart);
			expect(found?.wordEnd).toBe(exp.wordEnd);
		}
	});

	it("cross-references all word coordinates with Surah 2 tokens", () => {
		const usulRaw = fs.readFileSync(USUL_002_PATH, "utf-8");
		const usulFile: SurahUsulFile = JSON.parse(usulRaw);

		const surahRaw = fs.readFileSync(SURAH_002_PATH, "utf-8");
		const surahFile = JSON.parse(surahRaw);
		const verseMap = new Map<number, { w: Array<{ n: number; a: string }> }>(
			surahFile.verses.map(
				(v: { v: number; w: Array<{ n: number; a: string }> }) => [v.v, v],
			),
		);

		for (const item of usulFile.shawahid) {
			const verse = verseMap.get(item.ayahNumber);
			expect(verse, `Verse 2:${item.ayahNumber} not found`).toBeDefined();
			if (!verse) continue;

			expect(
				item.wordStart,
				`wordStart out of range in ${item.verseKey}`,
			).toBeGreaterThanOrEqual(1);
			expect(
				item.wordEnd,
				`wordEnd out of range in ${item.verseKey}`,
			).toBeLessThanOrEqual(verse.w.length);
		}
	});
});
