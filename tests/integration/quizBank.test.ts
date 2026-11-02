import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildQuizBank, QUIZ_BANK_PATH } from "../../scripts/build_quiz_bank";
import {
	CURATED_SURAHS,
	hydrateQuizPools,
	type QuizBankFile,
	toQuizBank,
} from "../../src/lib/quizBank";
import { getRoleMeta, QUIZ_ROLES } from "../../src/lib/quizCatalog";
import { extractQuizPools, type QuizSource } from "../../src/lib/quizEngine";
import type { SurahFile } from "../../src/lib/types";

const dataDir = path.resolve("public/data/quran");
const read = (kind: string, n: number) =>
	JSON.parse(
		fs.readFileSync(
			path.join(dataDir, kind, `${String(n).padStart(3, "0")}.json`),
			"utf-8",
		),
	);
const committed: QuizBankFile = JSON.parse(
	fs.readFileSync(QUIZ_BANK_PATH, "utf-8"),
);
const surahs: SurahFile[] = committed.surahs.map((n) => read("surah", n));

describe("integration: precomputed quiz bank", () => {
	it("matches a fresh build (run `pnpm data:quiz` after changing extraction or data)", () => {
		expect(buildQuizBank()).toEqual(committed);
	}, 60_000);

	it("hydrates back to exactly the extracted questions", () => {
		const sources: QuizSource[] = [1, 59, 78].map((n) => ({
			surah: read("surah", n),
			syntax: read("syntax", n),
		}));
		const pools = extractQuizPools(sources);
		const bank = toQuizBank(pools, [1, 59, 78]);
		const files = sources.map((s) => s.surah);
		expect(hydrateQuizPools(bank, files)).toEqual(pools);
	});

	it("only appends when more surahs load, so pool indices stay put", () => {
		const curated = new Set(CURATED_SURAHS);
		const first = hydrateQuizPools(
			committed,
			surahs.filter((s) => curated.has(s.n)),
		);
		const all = hydrateQuizPools(committed, surahs);
		for (const lens of ["irab", "sarf", "examples"] as const) {
			expect(first[lens].length).toBeGreaterThan(0);
			expect(all[lens].slice(0, first[lens].length)).toEqual(first[lens]);
		}
	});

	it("asks only roles the picker offers, the extended ones flagged", () => {
		const codes = new Set(QUIZ_ROLES.map((r) => r.code));
		const relations = new Set(committed.irab.map((q) => q.rel));
		for (const rel of relations) expect(codes.has(rel)).toBe(true);
		const extendedCodes = QUIZ_ROLES.filter((r) => r.extended).map(
			(r) => r.code,
		);
		expect(extendedCodes).toEqual(["pp", "adv", "prp", "exc", "emph"]);
		expect(getRoleMeta("subj").extended).toBeUndefined();
	});
});
