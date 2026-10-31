import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { stripTashkeel } from "../../src/lib/arabic";
import {
	ayahWithBlank,
	toMutashabihQuestions,
} from "../../src/lib/mutashabihQuiz";
import type {
	Manifest,
	MutashabihQuizFile,
	SurahFile,
} from "../../src/lib/types";

const dataDir = path.resolve("public/data/quran");
const readJson = <T>(...parts: string[]): T =>
	JSON.parse(fs.readFileSync(path.join(dataDir, ...parts), "utf-8")) as T;

const manifest = readJson<Manifest>("manifest.json");
const bank = readJson<MutashabihQuizFile>("mutashabihQuiz.json");
const questions = toMutashabihQuestions(bank, manifest.units);

const surahs = new Map<number, SurahFile>();
function ayahText(sura: number, verse: number): string {
	let file = surahs.get(sura);
	if (!file) {
		file = readJson<SurahFile>(
			"surah",
			`${String(sura).padStart(3, "0")}.json`,
		);
		surahs.set(sura, file);
	}
	const words = file.verses.find((v) => v.v === verse)?.w ?? [];
	return ` ${words.map((w) => w.a).join(" ")} `;
}

describe("integration: mutashabih quiz bank", () => {
	it("keeps every question, with unique ids", () => {
		expect(questions.length).toBe(bank.questions.length);
		expect(questions.length).toBeGreaterThan(500);
		expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
	});

	it("blanks the ayah's own wording, and the answer key points to it", () => {
		const wrong = questions.filter((q) => {
			const own = q.wordings[q.answer];
			const slot = q.words.slice(q.at, q.at + q.length).join(" ");
			return (
				own?.text !== slot ||
				ayahText(q.sura, q.verse.v).trim() !== q.words.join(" ")
			);
		});
		expect(wrong.map((q) => q.id)).toEqual([]);
	});

	it("takes every option from the ayahs it cites, and no two read alike", () => {
		const bad = questions.flatMap((q) => {
			const keys = q.wordings.map((w) => stripTashkeel(w.text));
			const duplicate = new Set(keys).size !== keys.length;
			const unsourced = q.wordings.some((w) =>
				w.refs.some(
					(r) => w.text && !ayahText(r.sura, r.verse).includes(` ${w.text} `),
				),
			);
			return duplicate || unsourced || q.wordings.length < 2 ? [q.id] : [];
		});
		expect(bad).toEqual([]);
	});

	it("offers the ayah's own surah among at least two distinct surahs", () => {
		const bad = questions.filter((q) => {
			const ns = q.surahs.map((s) => s.n);
			return (
				!ns.includes(q.sura) || new Set(ns).size !== ns.length || ns.length < 2
			);
		});
		expect(bad.map((q) => q.id)).toEqual([]);
	});

	it("puts exactly one blank in the ayah, keeping every other word", () => {
		for (const q of questions.slice(0, 50)) {
			const pieces = ayahWithBlank(q, null);
			expect(pieces.filter((p) => p.kind === "blank")).toHaveLength(1);
			expect(pieces.length).toBe(q.words.length - q.length + 1);
		}
	});
});
