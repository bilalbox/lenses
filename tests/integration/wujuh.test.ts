import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { SurahFile, WujuhFile } from "../../src/lib/types";

const dataDir = path.resolve("public/data/quran");
const read = <T>(file: string): T =>
	JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf-8")) as T;

describe("integration: al-Dāmaghānī's senses", () => {
	const file = read<WujuhFile>("wujuh.json");

	it("covers a few hundred roots", () => {
		expect(Object.keys(file).length).toBeGreaterThan(200);
	});

	it("places 2:213 under the sense ملة for أمة", () => {
		const umma = file.Amm?.find((entry) => entry.h === "أمة");
		const milla = umma?.s.find((sense) => sense.l === "ملة");
		expect(milla?.c.map((c) => c.slice(0, 3))).toContainEqual([2, 213, 3]);
	});

	it("gives every sense of الناس an example, from the text without quotation marks", () => {
		const nas = file.nws?.find((entry) => entry.h === "نوس");
		expect(nas?.s).toHaveLength(9);
		for (const sense of nas?.s ?? [])
			expect(sense.c.length, sense.l).toBeGreaterThan(0);
	});

	it("files particles by lemma", () => {
		expect(file["~fiY"]?.[0]?.h).toBe("في");
	});

	it("quotes each cited word exactly as the surah file has it", () => {
		const surahs = new Map<number, SurahFile>();
		for (const entries of Object.values(file)) {
			for (const sense of entries.flatMap((entry) => entry.s)) {
				for (const [sura, verse, word, , hit] of sense.c) {
					if (!surahs.has(sura)) {
						surahs.set(
							sura,
							read(`surah/${String(sura).padStart(3, "0")}.json`),
						);
					}
					const words = surahs.get(sura)?.verses.find((v) => v.v === verse)?.w;
					expect(words?.[word - 1]?.a, `${sura}:${verse}:${word}`).toBe(hit);
				}
			}
		}
	});
});
