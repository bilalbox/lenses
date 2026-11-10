import { describe, expect, it } from "vitest";
import { ar } from "../../src/lib/i18n/locales/ar";
import { en } from "../../src/lib/i18n/locales/en";
import { id } from "../../src/lib/i18n/locales/id";

describe("i18n locales", () => {
	const locales = [
		{ code: "ar", t: ar },
		{ code: "en", t: en },
		{ code: "id", t: id },
	];

	it("formats versesCount across singular, dual, plural, and large counts", () => {
		for (const { code, t } of locales) {
			for (const count of [0, 1, 2, 5, 11, 100]) {
				const str = t.common.versesCount(count);
				expect(typeof str, `${code} versesCount(${count})`).toBe("string");
				expect(str.length).toBeGreaterThan(0);
			}
		}
	});

	it("formats clauseCount across different counts and words", () => {
		for (const { code, t } of locales) {
			for (const count of [1, 2, 5, 12]) {
				for (const words of [1, 2, 4, 15]) {
					const str = t.verse.clauseCount(count, words);
					expect(typeof str, `${code} clauseCount(${count}, ${words})`).toBe(
						"string",
					);
					expect(str.length).toBeGreaterThan(0);
				}
			}
		}
	});

	it("formats savingOffline progress", () => {
		for (const { code, t } of locales) {
			const str = t.common.savingOffline(5, 114);
			expect(typeof str, `${code} savingOffline`).toBe("string");
			expect(str.length).toBeGreaterThan(0);
		}
	});

	it("formats quiz messages and questions", () => {
		for (const { code, t } of locales) {
			expect(t.quiz.openReader(2, 255), `${code} openReader`).toBeTruthy();
			expect(t.quiz.legendTarget("كلمة"), `${code} legendTarget`).toBeTruthy();
			expect(
				t.quiz.legendHead("فاعل", "كلمة"),
				`${code} legendHead`,
			).toBeTruthy();
			expect(
				t.quiz.step1Question("كلمة"),
				`${code} step1Question`,
			).toBeTruthy();
			expect(t.quiz.step2Eyebrow("فاعل"), `${code} step2Eyebrow`).toBeTruthy();
			expect(
				t.quiz.step2Question("فاعل", "كلمة"),
				`${code} step2Question`,
			).toBeTruthy();
			expect(
				t.quiz.step3Question("كلمة"),
				`${code} step3Question`,
			).toBeTruthy();
			expect(
				t.quiz.step4Question("كلمة"),
				`${code} step4Question`,
			).toBeTruthy();
			expect(t.quiz.step5Title("كلمة"), `${code} step5Title`).toBeTruthy();
			expect(
				t.quiz.classicalHeading("كلمة"),
				`${code} classicalHeading`,
			).toBeTruthy();
			expect(
				t.quiz.sarf.rootQuestion("علم"),
				`${code} rootQuestion`,
			).toBeTruthy();
			expect(
				t.quiz.sarf.waznQuestion("فعل"),
				`${code} waznQuestion`,
			).toBeTruthy();
			expect(
				t.quiz.sarf.verbClassQuestion("فعل"),
				`${code} verbClassQuestion`,
			).toBeTruthy();
			expect(
				t.quiz.sarf.nounClassQuestion("اسم"),
				`${code} nounClassQuestion`,
			).toBeTruthy();
			expect(
				t.quiz.sarf.verbStructureQuestion("بنية"),
				`${code} verbStructureQuestion`,
			).toBeTruthy();
			expect(
				t.quiz.sarf.nounStructureQuestion("بنية"),
				`${code} nounStructureQuestion`,
			).toBeTruthy();
			expect(
				t.quiz.sarf.reviewTitle("مراجعة"),
				`${code} reviewTitle`,
			).toBeTruthy();
			expect(
				t.quiz.sarf.revealHeading("كشف"),
				`${code} revealHeading`,
			).toBeTruthy();
			expect(
				t.quiz.sarf.rootInExamples("علم"),
				`${code} rootInExamples`,
			).toBeTruthy();
			expect(
				t.quiz.mutashabih.dabtHeading,
				`${code} mutashabih dabtHeading`,
			).toBeTruthy();
			expect(
				t.quiz.mutashabih.tawjihHeading,
				`${code} mutashabih tawjihHeading`,
			).toBeTruthy();
		}
	});

	it("formats word sheet dictionary and wujuh strings", () => {
		for (const { code, t } of locales) {
			expect(t.sheet.analysisAria(1), `${code} analysisAria`).toBeTruthy();
			expect(t.sheet.occurrences(10, 5, 2), `${code} occurrences`).toBeTruthy();
			expect(
				t.sheet.laneOtherEntries(3),
				`${code} laneOtherEntries`,
			).toBeTruthy();
			expect(t.sheet.lanePage(42), `${code} lanePage`).toBeTruthy();
			expect(t.sheet.wujuhSenseOf(1, 4), `${code} wujuhSenseOf`).toBeTruthy();
			expect(t.sheet.wujuhNotCited(4), `${code} wujuhNotCited`).toBeTruthy();
			expect(
				t.sheet.wujuhUnnamedSense(2),
				`${code} wujuhUnnamedSense`,
			).toBeTruthy();
		}
	});

	it("formats verse and mutashabih metadata strings", () => {
		const mockStats = {
			verses: 6236,
			words: 77430,
			syntaxVerses: 6236,
			syntaxGraphs: 6236,
			partialChapters: [],
			chaptersWithoutSyntax: [],
		};
		for (const { code, t } of locales) {
			expect(
				t.verse.revelationOrder(5),
				`${code} revelationOrder`,
			).toBeTruthy();
			expect(t.verse.asbabBadge(2), `${code} asbabBadge`).toBeTruthy();
			expect(
				t.verse.mutashabihBadge(3),
				`${code} mutashabihBadge`,
			).toBeTruthy();
			expect(
				t.verse.mutashabihMatchScore(90),
				`${code} mutashabihMatchScore`,
			).toBeTruthy();
			expect(
				t.verse.mutashabihSurahDistance(10),
				`${code} mutashabihSurahDistance`,
			).toBeTruthy();
			expect(
				t.verse.mutashabihReturnToAyah("2:1"),
				`${code} mutashabihReturnToAyah`,
			).toBeTruthy();
			expect(t.surahs.countEyebrow(114), `${code} countEyebrow`).toBeTruthy();
			expect(t.examples.clearFilter("اسم"), `${code} clearFilter`).toBeTruthy();
			expect(t.examples.wordsFound(15, 80), `${code} wordsFound`).toBeTruthy();
			expect(
				t.sources.coverageBody(mockStats),
				`${code} coverageBody`,
			).toBeTruthy();
		}
	});
});
