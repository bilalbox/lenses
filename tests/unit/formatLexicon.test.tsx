import { describe, expect, it } from "vitest";
import {
	formatLaneEntries,
	formatLaneEntry,
	formatMaqayis,
	formatMufradat,
	formatVerbForm,
} from "../../src/lib/formatLexicon";
import type { LaneEntry } from "../../src/lib/types";

describe("formatLexicon", () => {
	describe("formatVerbForm", () => {
		it("converts standard form digits to Roman numerals", () => {
			expect(formatVerbForm("1")).toBe("Form I");
			expect(formatVerbForm("2")).toBe("Form II");
			expect(formatVerbForm("5")).toBe("Form V");
			expect(formatVerbForm("10")).toBe("Form X");
		});

		it("falls back to Form {n} for non-standard form values", () => {
			expect(formatVerbForm("11")).toBe("Form 11");
		});
	});

	describe("formatMaqayis", () => {
		it("returns null on empty input", () => {
			expect(formatMaqayis([])).toBeNull();
		});

		it("elevates the opening root principle into a distinct principle card", () => {
			const paragraphs = [
				"الكاف والتاء والباء أصل صحيح واحد يدل على جمع شيء إلى شيء. من ذلك الكتاب والكتابة.",
			];
			const node = formatMaqayis(paragraphs);
			expect(node).not.toBeNull();
		});

		it("formats citations and text containing poetry seamlessly as flowing prose", () => {
			const paragraphs = [
				"الراء والحاء والميم أصل يدل على الرقة. قال الشاعر: فجاء بها ما شئت من لطمية ... يدوم الفرات فوقها ويموج",
			];
			const node = formatMaqayis(paragraphs);
			expect(node).not.toBeNull();
		});

		it("formats Quranic citations in brackets", () => {
			const paragraphs = [
				"ومن الباب الكتاب وهو الفرض. قال الله تعالى: {كتب عليكم الصيام} [البقرة: 183] ، ويقال للحكم: الكتاب.",
			];
			const node = formatMaqayis(paragraphs);
			expect(node).not.toBeNull();
		});
	});

	describe("formatMufradat", () => {
		it("returns null on empty input", () => {
			expect(formatMufradat([])).toBeNull();
		});

		it("formats headword definition and Quran citations", () => {
			const paragraphs = [
				"الكتب: ضم أديم إلى أديم بالخياطة. كقوله: الم ذلك الكتاب [البقرة/ 1- 2] أي: المحكم.",
			];
			const node = formatMufradat(paragraphs);
			expect(node).not.toBeNull();
		});
	});

	describe("formatLaneEntries", () => {
		it("formats an entry with multiple senses, sub-senses, and source citations", () => {
			const entry: LaneEntry = {
				h: "كَتَبَهُ",
				f: "1",
				t: [
					"aor. , inf. n. ",
					[2, "كَتْبٌ"],
					" (S, K); (Msb;) He wrote it. ― -b2- ",
					[2, "كَتَبَ عَنْهُ"],
					" He wrote what he heard. -A2- ",
					[2, "كَتَبَ"],
					" (tropical:) He decreed. (Kur, ii. 173.)",
				],
			};

			const node = formatLaneEntry(entry, 0);
			expect(node).not.toBeNull();

			const listNode = formatLaneEntries([entry]);
			expect(listNode).not.toBeNull();
		});

		it("handles entries without form numbers or sub-senses gracefully", () => {
			const entry: LaneEntry = {
				h: "كِتَابٌ",
				t: ["A thing in which, or on which, one writes: a book."],
			};
			const node = formatLaneEntry(entry, 0);
			expect(node).not.toBeNull();
		});
	});
});
