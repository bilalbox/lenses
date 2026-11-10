import { describe, expect, it } from "vitest";
import {
	getAppendixVerse,
	getCitationsForVerse,
	getEntriesForWord,
	normalizeArabic,
} from "../../src/lib/irabDictionary";
import type { IrabDictionaryFile, Segment, Word } from "../../src/lib/types";

const mockDict: IrabDictionaryFile = {
	metadata: {
		title: "المعجم المفصل في الإعراب",
		author: "طاهر يوسف الخطيب",
		reviewer: "د. إميل بديع يعقوب",
		entriesCount: 3,
		citationsCount: 2,
		appendixVersesCount: 1,
	},
	entries: [
		{
			id: 0,
			title: "إلّا",
			bab: "باب الهمزة",
			page: 52,
			body: ["تأتي على أربعة أوجه: أ ـ حرف استثناء..."],
			citations: [[2, 187]],
		},
		{
			id: 1,
			title: "ألا",
			bab: "باب الهمزة",
			page: 50,
			body: ["حرف استفتاح وتحضيض..."],
			citations: [],
		},
		{
			id: 2,
			title: "حتّى",
			bab: "باب الحاء",
			page: 156,
			body: ["تأتي على أربعة أوجه..."],
			citations: [[97, 5]],
		},
	],
	byWord: {
		الا: [0, 1],
		حتي: [2],
	},
	byVerse: {
		"2:187": [0],
		"97:5": [2],
	},
	appendix: {
		"1:1": {
			sura: 1,
			verse: 1,
			text: "بِسْمِ اللهِ الرَّحْمنِ الرَّحِيمِ",
			words: [
				{ w: "بسم", i: "الباء حرف جر مبني على الكسر." },
				{ w: "الله", i: "لفظ الجلالة مضاف إليه مجرور." },
			],
			sentences: ["وجملة بسم الله الرحمن الرحيم ابتدائية."],
			notes: ["(1) لا محل له من الإعراب."],
		},
	},
};

describe("normalizeArabic", () => {
	it("normalizes dagger alifs and strips diacritics", () => {
		expect(normalizeArabic("سُبْحَٰنَ")).toBe("سبحان");
		expect(normalizeArabic("إِلَّا")).toBe("الا");
		expect(normalizeArabic("حَتَّىٰ")).toBe("حتي");
	});

	it("folds hamza variants and alif maqsura", () => {
		expect(normalizeArabic("أَآإءؤئ")).toBe("اااااا");
		expect(normalizeArabic("عَلَى")).toBe("علي");
	});
});

describe("getEntriesForWord", () => {
	it("returns matching entries for word and prioritizes exact title", () => {
		const word: Word = {
			n: 1,
			a: "إِلَّا",
			s: [{ k: "m", a: "إِلَّا", la: "إِلَّا", p: "P" }],
		};
		const segment: Segment = word.s[0]!;
		const matches = getEntriesForWord(mockDict, word, segment);
		expect(matches.length).toBe(2);
		expect(matches[0]?.title).toBe("إلّا");
		expect(matches[1]?.title).toBe("ألا");
	});

	it("returns empty array when no match or dict is undefined", () => {
		const word: Word = {
			n: 1,
			a: "كتاب",
			s: [{ k: "m", a: "كتاب", p: "N" }],
		};
		expect(getEntriesForWord(mockDict, word)).toEqual([]);
		expect(getEntriesForWord(undefined, word)).toEqual([]);
	});
});

describe("getCitationsForVerse", () => {
	it("returns entries that cite the given verse", () => {
		const citations = getCitationsForVerse(mockDict, 2, 187);
		expect(citations.length).toBe(1);
		expect(citations[0]?.title).toBe("إلّا");
	});

	it("returns empty array for uncited verses", () => {
		expect(getCitationsForVerse(mockDict, 114, 1)).toEqual([]);
		expect(getCitationsForVerse(undefined, 2, 187)).toEqual([]);
	});
});

describe("getAppendixVerse", () => {
	it("returns Dr. Ya'qub's model parse for supported verses", () => {
		const model = getAppendixVerse(mockDict, 1, 1);
		expect(model).toBeDefined();
		expect(model?.words.length).toBe(2);
		expect(model?.words[0]?.w).toBe("بسم");
	});

	it("returns undefined for unsupported verses", () => {
		expect(getAppendixVerse(mockDict, 3, 1)).toBeUndefined();
		expect(getAppendixVerse(undefined, 1, 1)).toBeUndefined();
	});
});
