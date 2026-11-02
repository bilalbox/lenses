/**
 * Builds public/data/quran/quizBank.json, the grammar quiz's precomputed
 * questions (iʿrāb, ṣarf) for the quiz surahs.
 *
 * Reads public/data/quran/{surah,syntax}/*.json (run `pnpm data` and
 * `pnpm data:syntax` first). The quiz screen only hydrates this file, so the
 * extraction never runs in the browser.
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
	CURATED_SURAHS,
	EXTENDED_QUIZ_SURAHS,
	type QuizBankFile,
	toQuizBank,
} from "../src/lib/quizBank";
import { extractQuizPools, type QuizSource } from "../src/lib/quizEngine";

const DATA = path.resolve("public/data/quran");
export const QUIZ_BANK_PATH = path.join(DATA, "quizBank.json");

function readSource(n: number): QuizSource {
	const read = <T>(kind: string): T =>
		JSON.parse(
			readFileSync(
				path.join(DATA, kind, `${String(n).padStart(3, "0")}.json`),
				"utf-8",
			),
		) as T;
	return {
		surah: read<QuizSource["surah"]>("surah"),
		syntax: read<QuizSource["syntax"]>("syntax"),
	};
}

/** The bank for the quiz surahs, curated first so the screen's first wave is a prefix. */
export function buildQuizBank(): QuizBankFile {
	const surahs = [...CURATED_SURAHS, ...EXTENDED_QUIZ_SURAHS];
	return toQuizBank(extractQuizPools(surahs.map(readSource)), surahs);
}

function main(): void {
	const bank = buildQuizBank();
	writeFileSync(QUIZ_BANK_PATH, JSON.stringify(bank));
	console.log(
		`quizBank.json: ${bank.irab.length} iʿrāb, ${bank.sarf.length} ṣarf questions`,
	);
}

const entryArg = process.argv[1];
if (entryArg && import.meta.url === pathToFileURL(entryArg).href) {
	main();
}
