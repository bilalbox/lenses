import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type {
	Manifest,
	SurahFile,
	SurahSyntaxFile,
	VerseRow,
} from "../../src/lib/types";

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

	it("NoorBayan syntax treebank covers 100% of the Quran (all 114 surahs, 6,236 verses)", () => {
		const syntaxDir = path.join(dataDir, "syntax");
		expect(fs.existsSync(syntaxDir)).toBe(true);

		const manifest: Manifest = JSON.parse(
			fs.readFileSync(manifestPath, "utf-8"),
		);
		expect(manifest.stats.syntaxVerses).toBe(6236);
		expect(manifest.stats.syntaxGraphs).toBe(11596);
		expect(manifest.stats.chaptersWithoutSyntax).toHaveLength(0);
		expect(manifest.stats.partialChapters).toHaveLength(0);

		// Every unit has syntax == verses
		for (const unit of manifest.units) {
			expect(unit.syntax).toBe(unit.verses);
		}

		// Spot check sample surahs
		const spotCheckSurahs = [1, 2, 59, 114];
		for (const suraNum of spotCheckSurahs) {
			const padded = String(suraNum).padStart(3, "0");
			const syntaxPath = path.join(syntaxDir, `${padded}.json`);
			expect(fs.existsSync(syntaxPath)).toBe(true);

			const file: SurahSyntaxFile = JSON.parse(
				fs.readFileSync(syntaxPath, "utf-8"),
			);
			expect(file.surah).toBe(suraNum);
			expect(file.verses.length).toBeGreaterThan(0);

			for (const verse of file.verses) {
				expect(verse.v).toBeGreaterThan(0);
				expect(verse.sentences.length).toBeGreaterThan(0);

				for (const sent of verse.sentences) {
					expect(sent.id).toBeGreaterThan(0);
					expect(sent.words.length).toBeGreaterThan(0);

					for (const word of sent.words) {
						expect(word.w).toBeGreaterThan(0);
						expect(word.text).toBeTruthy();
						expect(word.tokens.length).toBeGreaterThan(0);

						for (const tok of word.tokens) {
							expect(tok.tok).toBeGreaterThan(0);
							expect(typeof tok.text).toBe("string");
							expect(tok.pos).toBeTruthy();
							expect(tok.rel).toBeTruthy();

							if (tok.head !== null) {
								expect(tok.head).toHaveLength(4);
								expect(tok.head[0]).toBeGreaterThan(0); // surah
								expect(tok.head[1]).toBeGreaterThan(0); // ayah
								expect(tok.head[2]).toBeGreaterThan(0); // word
								expect(tok.head[3]).toBeGreaterThan(0); // token
							}

							if (tok.const) {
								expect(tok.const.label).toBeTruthy();
								expect(tok.const.from).toHaveLength(2);
								expect(tok.const.to).toHaveLength(2);
							}
						}
					}
				}
			}
		}
	});
});
