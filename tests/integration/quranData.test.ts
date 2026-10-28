import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ar } from "../../src/lib/i18n/locales/ar";
import { en } from "../../src/lib/i18n/locales/en";
import { id } from "../../src/lib/i18n/locales/id";
import type {
	AsbabData,
	Manifest,
	SurahFile,
	SurahQiraatFile,
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

	it("validates Asbab al-Nuzul dataset integrity (201 ayahs, 326 narrations)", () => {
		const asbabPath = path.join(dataDir, "asbab.json");
		expect(fs.existsSync(asbabPath)).toBe(true);

		const asbab: AsbabData = JSON.parse(fs.readFileSync(asbabPath, "utf-8"));
		const keys = Object.keys(asbab);
		expect(keys).toHaveLength(201);

		let totalNarrations = 0;
		for (const [key, narrations] of Object.entries(asbab)) {
			expect(key).toMatch(/^\d+:\d+$/);
			expect(narrations.length).toBeGreaterThan(0);
			totalNarrations += narrations.length;

			for (const nar of narrations) {
				expect(nar.id).toBeGreaterThan(0);
				expect(nar.text).toBeTruthy();
				expect(nar.takhrij).toBeDefined();
				expect(["sahih", "hasan", "daif", "other"]).toContain(nar.grade);
			}
		}

		expect(totalNarrations).toBe(326);

		// Spot check 2:89
		const baqarah89 = asbab["2:89"];
		expect(baqarah89).toBeDefined();
		expect(baqarah89).toHaveLength(2);
		expect(baqarah89?.[0]?.text).toContain("ابن عباس");
		expect(baqarah89?.[0]?.grade).toBe("hasan");
	});

	it("validates Surah Maqasid, revelationSeq, and surahClass in manifest and surah files", () => {
		const manifest: Manifest = JSON.parse(
			fs.readFileSync(manifestPath, "utf-8"),
		);

		expect(manifest.stats.asbabVerses).toBe(201);
		expect(manifest.stats.qiraatWords).toBe(29605);
		expect(manifest.stats.qiraatVerses).toBe(5948);

		const revSeqs = new Set<number>();
		for (const unit of manifest.units) {
			expect(unit.goal).toBeTruthy();
			expect(unit.revSeq).toBeGreaterThan(0);
			expect(unit.revSeq).toBeLessThanOrEqual(114);
			expect(unit.surahClass).toBeTruthy();
			if (unit.revSeq) revSeqs.add(unit.revSeq);
		}

		// Full 1..114 permutation
		expect(revSeqs.size).toBe(114);

		// Check Surah 1 in file
		const fatihahFile: SurahFile = JSON.parse(
			fs.readFileSync(path.join(dataDir, "surah", "001.json"), "utf-8"),
		);
		expect(fatihahFile.goal).toBe("تحقيق العبودية الخالصة لله تعالى.");
		expect(fatihahFile.revSeq).toBe(5);
		expect(fatihahFile.surahClass).toBe("المثاني");
	});

	it("validates per-word canonical Qira'at files across all 114 surahs", () => {
		const qiraatDir = path.join(dataDir, "qiraat");
		expect(fs.existsSync(qiraatDir)).toBe(true);

		// Spot check Surah 1 (Al-Fatihah)
		const fatihahQiraatPath = path.join(qiraatDir, "001.json");
		expect(fs.existsSync(fatihahQiraatPath)).toBe(true);

		const fatihahQiraat: SurahQiraatFile = JSON.parse(
			fs.readFileSync(fatihahQiraatPath, "utf-8"),
		);
		expect(fatihahQiraat.surah).toBe(1);

		// Ayah 4 Word 1 (Maliki vs Maliki)
		const v4 = fatihahQiraat.verses.find((v) => v.v === 4);
		expect(v4).toBeDefined();
		const w1 = v4?.words.find((w) => w.w === 1);
		expect(w1).toBeDefined();
		expect(w1?.q?.length).toBeGreaterThan(0);
		expect(w1?.note).toContain("المِلْك");

		// Spot check Surah 2 (Al-Baqarah)
		const baqarahQiraatPath = path.join(qiraatDir, "002.json");
		expect(fs.existsSync(baqarahQiraatPath)).toBe(true);
		const baqarahQiraat: SurahQiraatFile = JSON.parse(
			fs.readFileSync(baqarahQiraatPath, "utf-8"),
		);
		expect(baqarahQiraat.surah).toBe(2);
		expect(baqarahQiraat.verses.length).toBeGreaterThan(0);
	});

	it("verifies i18n locales support Surah Maqasid, Asbab, Nahw, and Qiraat", () => {
		const locales = { en, ar, id };
		for (const [code, t] of Object.entries(locales)) {
			expect(t.verse.surahGoalLabel, `${code} surahGoalLabel`).toBeTruthy();
			expect(
				t.verse.revelationOrder(1),
				`${code} revelationOrder`,
			).toBeTruthy();
			expect(t.verse.asbabBadge(2), `${code} asbabBadge`).toBeTruthy();
			expect(t.verse.asbabDrawerTitle, `${code} asbabDrawerTitle`).toBeTruthy();
			expect(t.verse.nahwTabTitle, `${code} nahwTabTitle`).toBeTruthy();
			expect(
				t.verse.treebankNoorBayan,
				`${code} treebankNoorBayan`,
			).toBeTruthy();

			expect(t.sheet.qiraatTitle, `${code} qiraatTitle`).toBeTruthy();
			expect(t.sheet.qiraatIsolation, `${code} qiraatIsolation`).toBeTruthy();
			expect(t.sheet.qiraatWasl, `${code} qiraatWasl`).toBeTruthy();
			expect(
				t.sheet.qiraatSemanticNote,
				`${code} qiraatSemanticNote`,
			).toBeTruthy();

			expect(
				t.verse.mutashabihBadge(3),
				`${code} mutashabihBadge`,
			).toBeTruthy();
			expect(
				t.verse.mutashabihSectionTitle,
				`${code} mutashabihSectionTitle`,
			).toBeTruthy();
			expect(
				t.verse.mutashabihDabtTitle,
				`${code} mutashabihDabtTitle`,
			).toBeTruthy();
			expect(
				t.verse.mutashabihTawjihTitle,
				`${code} mutashabihTawjihTitle`,
			).toBeTruthy();
			expect(
				t.verse.mutashabihJumpToAyah,
				`${code} mutashabihJumpToAyah`,
			).toBeTruthy();
		}
	});

	it("validates sample Mutashabih files (Surahs 2, 7, 3)", () => {
		const mutDir = path.join(
			process.cwd(),
			"public",
			"data",
			"quran",
			"mutashabih",
		);
		expect(fs.existsSync(mutDir)).toBe(true);

		const baqarahMutPath = path.join(mutDir, "002.json");
		expect(fs.existsSync(baqarahMutPath)).toBe(true);
		const baqarahMut = JSON.parse(fs.readFileSync(baqarahMutPath, "utf-8"));
		expect(baqarahMut.sura).toBe(2);
		expect(baqarahMut.verses.length).toBeGreaterThan(0);

		// Check 2:58
		const v58 = baqarahMut.verses.find((v: { v: number }) => v.v === 58);
		expect(v58).toBeDefined();
		expect(v58.matches.length).toBeGreaterThan(0);
		const match7_161 = v58.matches.find(
			(m: { sura: number; ayah: number }) => m.sura === 7 && m.ayah === 161,
		);
		expect(match7_161).toBeDefined();
		expect(match7_161.score).toBeGreaterThan(0.5);
		expect(match7_161.dabt).toContain("الضابط");
		expect(match7_161.srcTokens.length).toBeGreaterThan(0);
		expect(match7_161.targetTokens.length).toBeGreaterThan(0);
	});
});
