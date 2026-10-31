import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SIGNS_BY_CASE } from "../../src/lib/quizCatalog";
import { extractQuizPools, type QuizSource } from "../../src/lib/quizEngine";

const dataDir = path.resolve("public/data/quran");

function loadSource(n: number): QuizSource {
	const file = (kind: string) =>
		path.join(dataDir, kind, `${String(n).padStart(3, "0")}.json`);
	const syntaxPath = file("syntax");
	return {
		surah: JSON.parse(fs.readFileSync(file("surah"), "utf-8")),
		syntax: fs.existsSync(syntaxPath)
			? JSON.parse(fs.readFileSync(syntaxPath, "utf-8"))
			: undefined,
	};
}

describe("integration: quiz sign picker", () => {
	it("never filters out the correct sign for a question's case", () => {
		const sources = Array.from({ length: 114 }, (_, i) => loadSource(i + 1));
		const { irab } = extractQuizPools(sources);
		expect(irab.length).toBeGreaterThan(0);
		const outside = irab
			.filter((q) => !SIGNS_BY_CASE[q.grammaticalCase].includes(q.sign))
			.map((q) => `${q.id} ${q.grammaticalCase} ${q.sign}`);
		expect(outside).toEqual([]);
	}, 120_000);
});
