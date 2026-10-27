import { describe, expect, it } from "vitest";
import {
	fromBuckwalter,
	hasArabic,
	normalizeQuery,
	spaceLetters,
	stripDiacritics,
	stripTashkeel,
	toBuckwalter,
} from "../../src/lib/arabic";
import { formatNum, normalizeDigits } from "../../src/lib/i18n/format";

describe("arabic: stripDiacritics & stripTashkeel", () => {
	it("strips harakat, tanween, dagger alifs, and normalizes alif variants", () => {
		// Al-Fatihah 1:1
		const bismillah = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
		expect(stripDiacritics(bismillah)).toBe("بسم الله الرحمن الرحيم");

		// Hamza variants, taa marbuta, and alif maqsura
		expect(stripDiacritics("أَنْعَمْتَ")).toBe("انعمت");
		expect(stripDiacritics("إِيَّاكَ")).toBe("اياك");
		expect(stripDiacritics("الْجَنَّةِ")).toBe("الجنه");
		expect(stripDiacritics("هُدًى")).toBe("هدي");
	});

	it("stripTashkeel removes vowels while preserving distinct letter shapes", () => {
		const text = "بِسْمِ ٱللَّهِ هُدًى الْجَنَّةِ";
		const stripped = stripTashkeel(text);
		// ٱ, ى, ة should remain intact; harakat removed
		expect(stripped).toBe("بسم ٱلله هدى الجنة");
	});
});

describe("arabic: Buckwalter transliteration", () => {
	it("transliterates standard consonants from Buckwalter to Arabic", () => {
		expect(fromBuckwalter("bsm")).toBe("بسم");
		expect(fromBuckwalter("Allh")).toBe("الله");
		expect(fromBuckwalter("ql")).toBe("قل");
	});

	it("transliterates short vowels accurately in Buckwalter", () => {
		// a = fatha, u = damma, i = kasra
		expect(fromBuckwalter("qul")).toBe("قُل");
		expect(fromBuckwalter("bismi")).toBe("بِسمِ");
	});

	it("transliterates Arabic text to Buckwalter", () => {
		expect(toBuckwalter("بسم")).toBe("bsm");
		expect(toBuckwalter("الله")).toBe("Allh");
	});

	it("leaves unmapped characters unchanged", () => {
		// 'c', '1', '2', '3' are not in Buckwalter map
		expect(fromBuckwalter("c 123")).toBe("c 123");
	});
});

describe("arabic: query normalization & letter spacing", () => {
	it("normalizes queries by trimming, collapsing spaces, and stripping diacritics", () => {
		expect(normalizeQuery("   بِسْمِ    ٱللَّهِ  ")).toBe("بسم الله");
		expect(normalizeQuery(" AL-HAMDU ")).toBe("al-hamdu");
	});

	it("detects Arabic text presence", () => {
		expect(hasArabic("بِسْمِ")).toBe(true);
		expect(hasArabic("hello world")).toBe(false);
		expect(hasArabic("verse 1:1 (الحمد)")).toBe(true);
	});

	it("spaces bare letters of an Arabic string", () => {
		expect(spaceLetters("كَتَبَ")).toBe("ك ت ب");
		expect(spaceLetters("ٱلرَّحْمَٰنِ")).toBe("ا ل ر ح م ن");
	});
});

describe("i18n: digit normalization & number formatting", () => {
	it("converts Eastern Arabic numerals to ASCII digits", () => {
		expect(normalizeDigits("١٢٣٤٥٦٧٨٩٠")).toBe("1234567890");
		expect(normalizeDigits("سورة ٥٩:١٨")).toBe("سورة 59:18");
	});

	it("converts Persian numerals to ASCII digits", () => {
		expect(normalizeDigits("۱۲۳۴۵۶۷۸۹۰")).toBe("1234567890");
	});

	it("leaves ASCII digits unchanged", () => {
		expect(normalizeDigits("59:18")).toBe("59:18");
	});

	it("formats numbers per locale", () => {
		expect(formatNum(18, "en")).toBe("18");
		expect(formatNum(18, "id")).toBe("18");
		expect(formatNum(18, "ar")).toBe("١٨");
	});
});
