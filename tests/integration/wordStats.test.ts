import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { countExamples, type ExampleQuery } from "../../src/lib/search";
import type { SurahFile, WordIndex, WordStats } from "../../src/lib/types";

const dataDir = path.resolve("public/data/quran");
const read = <T>(file: string): T =>
	JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf-8")) as T;

const empty: ExampleQuery = {
	root: "",
	lemma: "",
	pos: "",
	form: "",
	relation: "",
};

describe("integration: word counts and glosses", () => {
	const index = read<WordIndex>("words.json");
	const stats = read<WordStats>("wordStats.json");

	it("counts النّاس as the corpus does", () => {
		expect(stats.lemmas["n~aAs"]).toEqual([241, 225, 53]);
		expect(stats.roots.nws).toEqual([241, 225, 53]);
	});

	it("shows the same number the matching search returns", () => {
		// Case twins (nws/nwS, Hmd/hmd) are where a case-blind match would drift.
		for (const root of ["nws", "nwS", "Hmd", "hmd", "ktb", "rHm", "qwl"]) {
			expect(countExamples(index, { ...empty, root }), root).toBe(
				stats.roots[root]?.[0],
			);
		}
		for (const lemma of ["n~aAs", "qaAla", "hal", "kita`b"]) {
			expect(countExamples(index, { ...empty, lemma }), lemma).toBe(
				stats.lemmas[lemma]?.[0],
			);
		}
	});

	it("gives every word its corpus English gloss", () => {
		for (const n of ["001", "002", "114"]) {
			const surah = read<SurahFile>(`surah/${n}.json`);
			for (const verse of surah.verses) {
				for (const word of verse.w) {
					expect(word.e, `${n}:${verse.v}:${word.n}`).toBeTruthy();
				}
			}
		}
		const fatiha = read<SurahFile>("surah/001.json");
		expect(fatiha.verses[0]?.w[0]?.e).toBe("In (the) name");
	});
});
