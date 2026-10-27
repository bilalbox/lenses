import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { Manifest, SurahFile, VerseRow } from "../../src/lib/types";

describe("integration: Quran dataset integrity", () => {
	const dataDir = path.resolve("public/data/quran");
	const manifestPath = path.join(dataDir, "manifest.json");
	const versesPath = path.join(dataDir, "verses.json");

	it("manifest.json defines all 114 surahs with 6,236 total verses", () => {
		expect(fs.existsSync(manifestPath)).toBe(true);
		const manifest: Manifest = JSON.parse(
			fs.readFileSync(manifestPath, "utf-8"),
		);

		expect(manifest.id).toBe("quran");
		expect(manifest.units).toHaveLength(114);

		let totalVerses = 0;
		manifest.units.forEach((unit, index) => {
			expect(unit.n).toBe(index + 1);
			expect(unit.name).toBeTruthy();
			expect(unit.phonetic).toBeTruthy();
			expect(unit.title).toBeTruthy();
			expect(["Makkah", "Madinah"]).toContain(unit.rev);
			expect(unit.verses).toBeGreaterThan(0);
			totalVerses += unit.verses;
		});

		expect(totalVerses).toBe(6236);
	});

	it("verses.json contains exactly 6,236 searchable verses matching surah/verse numbering", () => {
		expect(fs.existsSync(versesPath)).toBe(true);
		const verses: VerseRow[] = JSON.parse(fs.readFileSync(versesPath, "utf-8"));

		expect(verses).toHaveLength(6236);

		// First verse: Al-Fatihah 1:1
		expect(verses[0]?.[0]).toBe(1);
		expect(verses[0]?.[1]).toBe(1);
		expect(verses[0]?.[2]).toContain("بسم الله");

		// Last verse: An-Nas 114:6
		const last = verses[6235];
		expect(last?.[0]).toBe(114);
		expect(last?.[1]).toBe(6);
	});

	it("validates structural invariants across sample surahs (001, 002, 059, 114)", () => {
		const sampleSurahs = [1, 2, 59, 114];

		for (const suraNum of sampleSurahs) {
			const padded = String(suraNum).padStart(3, "0");
			const surahPath = path.join(dataDir, "surah", `${padded}.json`);
			expect(fs.existsSync(surahPath)).toBe(true);

			const file: SurahFile = JSON.parse(fs.readFileSync(surahPath, "utf-8"));
			expect(file.n).toBe(suraNum);
			expect(file.name).toBeTruthy();
			expect(file.verses.length).toBeGreaterThan(0);

			for (const verse of file.verses) {
				expect(verse.v).toBeGreaterThan(0);
				expect(verse.ar).toBeTruthy();
				expect(verse.en).toBeTruthy();
				expect(verse.w.length).toBeGreaterThan(0);

				for (const word of verse.w) {
					expect(word.n).toBeGreaterThan(0);
					expect(word.a).toBeTruthy();
					expect(word.s.length).toBeGreaterThan(0);

					for (const seg of word.s) {
						expect(["p", "m", "s"]).toContain(seg.k);
						expect(seg.p).toBeTruthy();
					}
				}

				// If syntax graph exists, check edge bounds
				if (verse.g) {
					for (const graph of verse.g) {
						expect(graph.nodes.length).toBeGreaterThan(0);
						for (const edge of graph.edges) {
							expect(edge.d).toBeLessThan(graph.nodes.length);
							expect(edge.h).toBeLessThan(graph.nodes.length);
							expect(edge.r).toBeTruthy();
						}
					}
				}
			}
		}
	});
});
