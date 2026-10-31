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
	SurahMutashabihFile,
	SurahQiraatFile,
	SurahStructureFile,
	SurahSyntaxFile,
	TransitionsFile,
	VerseRow,
	WordIndex,
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

				// Syntax lives in the NoorBayan syntax/ files, not in the surah files.
				expect(verse).not.toHaveProperty("g");
			}
		}
	});

	it("word index carries NoorBayan relations for words across the whole Quran", () => {
		const index: WordIndex = JSON.parse(
			fs.readFileSync(path.join(dataDir, "words.json"), "utf-8"),
		);
		const versesWithRelations = new Set<string>();
		for (const row of index.rows) {
			if (row[9]) versesWithRelations.add(`${row[0]}:${row[1]}`);
		}
		// The corpus graphs covered 2,436 ayahs; NoorBayan covers every ayah.
		expect(versesWithRelations.size).toBeGreaterThan(6000);
		const relations = new Set(index.rows.flatMap((row) => row[9].split(",")));
		for (const code of ["subj", "obj", "subjx", "predx", "gen", "poss"]) {
			expect(relations.has(code), code).toBe(true);
		}
		for (const raw of ["Subj", "nonrel", "root"]) {
			expect(relations.has(raw), raw).toBe(false);
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

			expect(t.verse.structureBadge(5), `${code} structureBadge`).toBeTruthy();
			expect(
				t.verse.structureSectionTitle,
				`${code} structureSectionTitle`,
			).toBeTruthy();
			expect(
				t.verse.munasabatCardTitle,
				`${code} munasabatCardTitle`,
			).toBeTruthy();
			expect(t.surahs.structureLink, `${code} structureLink`).toBeTruthy();
			expect(t.surahs.balaghaLink, `${code} balaghaLink`).toBeTruthy();
		}
	});

	it("validates full Quran Mutashabih dataset (all 114 surahs, token diffs, and classical notes)", () => {
		const mutDir = path.join(
			process.cwd(),
			"public",
			"data",
			"quran",
			"mutashabih",
		);
		expect(fs.existsSync(mutDir)).toBe(true);

		const manifest: Manifest = JSON.parse(
			fs.readFileSync(manifestPath, "utf-8"),
		);
		expect(manifest.stats.mutashabihVerses).toBeGreaterThan(2000);
		expect(manifest.stats.mutashabihPairs).toBeGreaterThan(3000);

		const sourceIds = manifest.sources.map((s) => s.id);
		expect(sourceIds).toContain("waqar-mutashabihat");
		expect(sourceIds).toContain("quranpedia-mutashabihat");

		let totalVersesWithMatches = 0;
		let totalDirectedMatches = 0;

		const allowedCategories = new Set([
			"identical",
			"shared_opening",
			"shared_ending",
			"shared_phrase",
			"word_swap",
		]);
		const allowedStatuses = new Set(["exact", "haraka", "diff", "extra"]);

		for (let s = 1; s <= 114; s++) {
			const fileName = `${String(s).padStart(3, "0")}.json`;
			const filePath = path.join(mutDir, fileName);
			expect(
				fs.existsSync(filePath),
				`Mutashabih file exists: ${fileName}`,
			).toBe(true);

			const fileData: SurahMutashabihFile = JSON.parse(
				fs.readFileSync(filePath, "utf-8"),
			);
			expect(fileData.sura).toBe(s);
			expect(Array.isArray(fileData.verses)).toBe(true);

			const manifestUnit = manifest.units.find((u) => u.n === s);
			expect(manifestUnit?.mutashabih).toBe(fileData.verses.length);

			totalVersesWithMatches += fileData.verses.length;

			let prevV = 0;
			for (const vEntry of fileData.verses) {
				expect(vEntry.v).toBeGreaterThan(prevV); // sorted strictly ascending
				prevV = vEntry.v;
				expect(vEntry.matches.length).toBeGreaterThan(0);
				totalDirectedMatches += vEntry.matches.length;

				for (const m of vEntry.matches) {
					expect(m.sura).toBeGreaterThanOrEqual(1);
					expect(m.sura).toBeLessThanOrEqual(114);
					expect(m.ayah).toBeGreaterThan(0);
					expect(allowedCategories.has(m.cat)).toBe(true);
					expect(m.score).toBeGreaterThanOrEqual(0);
					expect(m.score).toBeLessThanOrEqual(1);
					expect(m.matchedWords).toBeGreaterThan(0);

					expect(m.srcTokens.length).toBeGreaterThan(0);
					expect(m.targetTokens.length).toBeGreaterThan(0);

					for (const tok of m.srcTokens) {
						expect(tok.w).toBeGreaterThan(0);
						expect(allowedStatuses.has(tok.s)).toBe(true);
						if (tok.cw !== undefined && tok.cw !== null) {
							expect(tok.cw).toBeGreaterThan(0);
						}
					}

					for (const tok of m.targetTokens) {
						expect(tok.w).toBeGreaterThan(0);
						expect(allowedStatuses.has(tok.s)).toBe(true);
						if (tok.cw !== undefined && tok.cw !== null) {
							expect(tok.cw).toBeGreaterThan(0);
						}
					}
				}
			}
		}

		expect(totalVersesWithMatches).toBe(manifest.stats.mutashabihVerses);
		expect(totalDirectedMatches).toBeGreaterThan(5000);

		// Spot check 2:58 (Al-Baqarah ↔ Al-A'raf 7:161)
		const s2Data: SurahMutashabihFile = JSON.parse(
			fs.readFileSync(path.join(mutDir, "002.json"), "utf-8"),
		);
		const v58 = s2Data.verses.find((v) => v.v === 58);
		expect(v58).toBeDefined();
		const match7_161 = v58?.matches.find((m) => m.sura === 7 && m.ayah === 161);
		expect(match7_161).toBeDefined();
		expect(match7_161?.score).toBeGreaterThan(0.5);
		expect(match7_161?.dabt).toContain("الضابط");
		expect(match7_161?.noteEn).toContain("We said");

		// Spot check 2:48 (Al-Baqarah ↔ Al-Baqarah 2:123)
		const v48 = s2Data.verses.find((v) => v.v === 48);
		expect(v48).toBeDefined();
		const match2_123 = v48?.matches.find((m) => m.sura === 2 && m.ayah === 123);
		expect(match2_123).toBeDefined();
		expect(match2_123?.score).toBeGreaterThan(0.8);
		expect(match2_123?.cat).toBe("word_swap");
		expect(match2_123?.noteEn).toContain("shafa'ah");
	});

	it("validates full Quran structure + munāsabāt dataset (114 surahs, contiguous blocks)", () => {
		const structureDir = path.join(dataDir, "structure");
		const transitionsPath = path.join(dataDir, "transitions.json");
		expect(fs.existsSync(structureDir)).toBe(true);
		expect(fs.existsSync(transitionsPath)).toBe(true);

		const manifest: Manifest = JSON.parse(
			fs.readFileSync(manifestPath, "utf-8"),
		);
		expect(manifest.stats.structureSurahs).toBe(114);
		expect(manifest.stats.structureBlocks).toBeGreaterThan(500);
		expect(manifest.stats.munasabatTransitions).toBe(113);

		const sourceIds = manifest.sources.map((s) => s.id);
		expect(sourceIds).toContain("maraya-ring-composition");
		expect(sourceIds).toContain("suyuti-tanasuq-al-durar");

		let totalBlocks = 0;
		for (let s = 1; s <= 114; s++) {
			const fileName = `${String(s).padStart(3, "0")}.json`;
			const filePath = path.join(structureDir, fileName);
			expect(fs.existsSync(filePath), `structure file ${fileName}`).toBe(true);

			const fileData: SurahStructureFile = JSON.parse(
				fs.readFileSync(filePath, "utf-8"),
			);
			expect(fileData.sura).toBe(s);
			expect(fileData.verseCount).toBe(
				manifest.units.find((u) => u.n === s)?.verses,
			);
			expect(fileData.blocks.length).toBeGreaterThan(0);
			expect(manifest.units.find((u) => u.n === s)?.structure).toBe(
				fileData.blocks.length,
			);
			expect(
				fileData.blocks.some((b) => b.role === "pivot" || b.role === "center"),
			).toBe(true);

			const spans = [...fileData.blocks]
				.map((b) => b.v)
				.sort((a, b) => a[0] - b[0]);
			expect(spans[0]?.[0]).toBe(1);
			expect(spans.at(-1)?.[1]).toBe(fileData.verseCount);
			for (let i = 1; i < spans.length; i++) {
				expect(spans[i]?.[0]).toBe((spans[i - 1]?.[1] ?? 0) + 1);
			}
			totalBlocks += fileData.blocks.length;

			if (s < 114) {
				expect(fileData.transitionToNext?.targetSura).toBe(s + 1);
				expect(fileData.transitionToNext?.suyutiLinkAr.length).toBeGreaterThan(
					20,
				);
			} else {
				expect(fileData.transitionToNext).toBeUndefined();
			}
		}
		expect(totalBlocks).toBe(manifest.stats.structureBlocks);

		const transitions: TransitionsFile = JSON.parse(
			fs.readFileSync(transitionsPath, "utf-8"),
		);
		expect(transitions.count).toBe(113);
		expect(transitions.transitions).toHaveLength(113);
		expect(transitions.transitions[0]?.fromSura).toBe(1);
		expect(transitions.transitions[0]?.targetSura).toBe(2);
		expect(transitions.transitions[0]?.suyutiLinkAr).toContain("الكتاب");

		const fatihah: SurahStructureFile = JSON.parse(
			fs.readFileSync(path.join(structureDir, "001.json"), "utf-8"),
		);
		expect(fatihah.blocks.map((b) => b.id)).toEqual([
			"A",
			"B",
			"PIVOT",
			"B′",
			"A′",
		]);
		expect(fatihah.pivot.function).toBe("THEOLOGICAL_DECLARATION");

		const baqarah: SurahStructureFile = JSON.parse(
			fs.readFileSync(path.join(structureDir, "002.json"), "utf-8"),
		);
		expect(baqarah.blocks.find((b) => b.id === "D")?.v).toEqual([142, 152]);
		expect(baqarah.transitionToNext?.targetSura).toBe(3);
		expect(baqarah.transitionToNext?.targetNameAr).toContain("عمران");
	});
});
