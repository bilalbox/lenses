import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { stripDiacritics } from "../../src/lib/arabic";
import {
	getCaseMeta,
	getLensLabel,
	getRoleMeta,
	getSignMeta,
	isPhraseRole,
	type QuizCase,
	type QuizRelation,
	type QuizSign,
	signsForCase,
} from "../../src/lib/quizCatalog";
import { extractQuizPools } from "../../src/lib/quizEngine";
import type { SurahFile, SurahSyntaxFile } from "../../src/lib/types";

describe("quizEngine: metadata lookup", () => {
	it("returns correct metadata for grammatical roles", () => {
		const subj = getRoleMeta("subj");
		expect(subj.code).toBe("subj");
		expect(subj.ar).toBe("فاعل");
		expect(subj.defaultCase).toBe("NOM");

		const obj = getRoleMeta("obj");
		expect(obj.code).toBe("obj");
		expect(obj.ar).toBe("مفعول به");
		expect(obj.defaultCase).toBe("ACC");

		const poss = getRoleMeta("poss");
		expect(poss.code).toBe("poss");
		expect(poss.ar).toBe("مضاف إليه");
		expect(poss.defaultCase).toBe("GEN");
	});

	it("returns correct metadata for grammatical cases", () => {
		const nom = getCaseMeta("NOM");
		expect(nom.code).toBe("NOM");
		expect(nom.ar).toBe("مرفوع");

		const acc = getCaseMeta("ACC");
		expect(acc.code).toBe("ACC");
		expect(acc.ar).toBe("منصوب");

		const gen = getCaseMeta("GEN");
		expect(gen.code).toBe("GEN");
		expect(gen.ar).toBe("مجرور");
	});

	it("returns correct metadata for declension signs", () => {
		const damma = getSignMeta("damma");
		expect(damma.code).toBe("damma");
		expect(damma.ar).toBe("الضمة الظاهرة");
		expect(damma.category).toBe("primary");

		const fatha = getSignMeta("fatha");
		expect(fatha.code).toBe("fatha");
		expect(fatha.ar).toBe("الفتحة الظاهرة");
		expect(fatha.category).toBe("primary");

		const kasra = getSignMeta("kasra");
		expect(kasra.code).toBe("kasra");
		expect(kasra.ar).toBe("الكسرة الظاهرة");
		expect(kasra.category).toBe("primary");

		const waw = getSignMeta("waw");
		expect(waw.code).toBe("waw");
		expect(waw.category).toBe("secondary");
	});

	it("falls back gracefully on unknown role/case/sign", () => {
		// Typescript bypass to test runtime resilience
		const unknownRole = getRoleMeta("unknown_role" as QuizRelation);
		expect(unknownRole).toBeDefined();
		expect(unknownRole.code).toBe("subj");

		const unknownCase = getCaseMeta("UNKNOWN" as QuizCase);
		expect(unknownCase).toBeDefined();
		expect(unknownCase.code).toBe("NOM");

		const unknownSign = getSignMeta("unknown_sign" as QuizSign);
		expect(unknownSign).toBeDefined();
		expect(unknownSign.code).toBe("damma");
	});

	it("returns localized lens labels", () => {
		expect(getLensLabel("irab", "en")).toEqual({
			title: "Iʿrāb Syntax",
			badge: "إعراب",
		});
		expect(getLensLabel("irab", "ar")).toEqual({
			title: "النحو والإعراب",
			badge: "إعراب",
		});
		expect(getLensLabel("irab", "id")).toEqual({
			title: "Sintaksis Iʿrāb",
			badge: "إعراب",
		});

		expect(getLensLabel("sarf", "en")).toEqual({
			title: "Ṣarf & Mīzān",
			badge: "صرف",
		});
		expect(getLensLabel("sarf", "ar")).toEqual({
			title: "الميزان الصرفي",
			badge: "صرف",
		});
	});

	it("filters signs by case", () => {
		expect(signsForCase(null)).toHaveLength(8);
		expect(signsForCase("NOM")).toHaveLength(4);
		expect(isPhraseRole("pp")).toBe(true);
		expect(isPhraseRole("subj")).toBe(false);
	});
});

describe("quizEngine: extraction from Surah data (Al-Fātiḥah fixture)", () => {
	const fatihahPath = path.resolve("public/data/quran/surah/001.json");
	const fatihah: SurahFile = JSON.parse(fs.readFileSync(fatihahPath, "utf-8"));
	const syntax: SurahSyntaxFile = JSON.parse(
		fs.readFileSync(path.resolve("public/data/quran/syntax/001.json"), "utf-8"),
	);

	it("extracts iʿrāb quiz questions from the NoorBayan treebank", () => {
		const { irab: questions } = extractQuizPools([{ surah: fatihah, syntax }]);
		expect(questions.length).toBeGreaterThan(0);

		for (const q of questions) {
			// Invariants:
			expect(q.id).toBeDefined();
			expect(q.sura).toBe(1);
			expect(q.targetWord).toBeDefined();
			expect(q.headWord).toBeDefined();
			// A word never governs itself
			expect(q.targetWord.n).not.toBe(q.headWord.n);

			// A jārr-majrūr phrase has no case or sign; every other role has both
			if (q.relation === "pp") {
				expect(q.grammaticalCase).toBeNull();
				expect(q.sign).toBeNull();
			} else {
				expect(["NOM", "ACC", "GEN"]).toContain(q.grammaticalCase);
				expect(q.sign).toBeTruthy();
				expect(q.signDetailAr).toBeTruthy();
			}

			// Clause words must include both target and head
			const clauseWordNums = q.clauseWords.map((w) => w.n);
			expect(clauseWordNums).toContain(q.targetWord.n);
			expect(clauseWordNums).toContain(q.headWord.n);
		}
	});

	it("asks no iʿrāb questions without a treebank", () => {
		expect(extractQuizPools([{ surah: fatihah }]).irab).toEqual([]);
	});

	it("extracts sarf questions with exactly 4 unique options per dimension and the answer included", () => {
		const pools = extractQuizPools([{ surah: fatihah }]);
		expect(pools.sarf.length).toBeGreaterThan(0);

		for (const sq of pools.sarf) {
			// Invariants for 4-option multiple choice questions
			expect(sq.rootOptions).toHaveLength(4);
			const rootCodes = sq.rootOptions.map((o) => o.code);
			expect(new Set(rootCodes).size).toBe(4);
			expect(rootCodes).toContain(sq.rootRaw);

			expect(sq.waznOptions).toHaveLength(4);
			const waznCodes = sq.waznOptions.map((o) => o.code);
			expect(new Set(waznCodes).size).toBe(4);
			expect(waznCodes).toContain(sq.wazn);

			expect(sq.classOptions).toHaveLength(4);
			const classCodes = sq.classOptions.map((o) => o.code);
			expect(new Set(classCodes).size).toBe(4);
			expect(classCodes).toContain(sq.classCode);

			expect(sq.structureOptions).toHaveLength(4);
			const structCodes = sq.structureOptions.map((o) => o.code);
			expect(new Set(structCodes).size).toBe(4);
			expect(structCodes).toContain(sq.structureCode);
		}
	});
});

describe("quizEngine: iʿrāb questions from NoorBayan (real surahs)", () => {
	const load = <T>(kind: string, n: number): T =>
		JSON.parse(
			fs.readFileSync(
				path.resolve(
					`public/data/quran/${kind}/${String(n).padStart(3, "0")}.json`,
				),
				"utf-8",
			),
		) as T;
	const irabFor = (n: number) =>
		extractQuizPools([
			{
				surah: load<SurahFile>("surah", n),
				syntax: load<SurahSyntaxFile>("syntax", n),
			},
		]).irab;

	it("maps nāsikh subjects onto subjx (اسم إن / كان)", () => {
		const relations = new Set(irabFor(67).map((q) => q.relation));
		expect(relations.has("subjx")).toBe(true);
		expect(relations.has("predx" as QuizRelation)).toBe(false);
	});

	it("drops a نعت whose classical iʿrāb names a different noun than the treebank", () => {
		// 67:3 طِبَاقًا — «نعت لـ﴿سبع﴾», NoorBayan attaches it to سماوات
		expect(irabFor(67).some((q) => q.id === "67:3:5:adj")).toBe(false);
	});

	it("asks a joined jārr-majrūr as one phrase on its mutaʿallaq (لِلَّهِ ← سَبَّحَ)", () => {
		const q = irabFor(59).find((x) => x.id === "59:1:2:pp");
		expect(q).toMatchObject({
			relation: "pp",
			grammaticalCase: null,
			sign: null,
		});
		expect(stripDiacritics(q?.headWord.a ?? "")).toBe("سبح");
	});

	it("asks a preposition joined to a pronoun as a phrase too (عَلَيْهِمْ ← أَنْعَمْتَ)", () => {
		const q = irabFor(1).find((x) => x.id === "1:7:4:pp");
		expect(stripDiacritics(q?.headWord.a ?? "")).toBe("انعمت");
	});

	it("drops a phrase whose classical iʿrāb names another mutaʿallaq", () => {
		// 67:27 بِهِۦ — NoorBayan attaches it to كُنتُم, the classical iʿrāb to ﴿تَدَّعُونَ﴾
		expect(irabFor(67).some((q) => q.id === "67:27:12:pp")).toBe(false);
	});

	it("never asks the noun inside a joined jārr-majrūr on its own (بِسْمِ)", () => {
		const ids = irabFor(1).map((q) => q.id);
		expect(ids).not.toContain("1:1:1:gen");
		// Its mutaʿallaq is elided (مَحْذُوف), so the phrase is not asked either
		expect(ids).not.toContain("1:1:1:pp");
	});

	it("asks the extended roles: ẓarf on its verb, mustathnā on إلا", () => {
		const zarf = irabFor(59).find((q) => q.id === "59:7:21:adv");
		expect(stripDiacritics(zarf?.headWord.a ?? "")).toBe("يكون");
		const exc = irabFor(78).find((q) => q.id === "78:25:2:exc");
		expect(stripDiacritics(exc?.headWord.a ?? "")).toBe("الا");
		expect(exc).toMatchObject({ grammaticalCase: "ACC", sign: "fatha" });
	});

	it("keeps a نعت whose classical iʿrāb agrees with the treebank head", () => {
		const adjs = irabFor(67).filter((q) => q.relation === "adj");
		expect(adjs.length).toBeGreaterThan(0);
	});
});
