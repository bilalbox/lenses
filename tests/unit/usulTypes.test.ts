import { describe, expect, it } from "vitest";
import {
	UsuliCategoryGroupSchema,
	UsuliShahidSchema,
	UsuliTaxonomyIdSchema,
} from "../../src/lib/usulTypes";

describe("Usuli Zod Schemas", () => {
	it("validates all 5 UsuliCategoryGroupSchema enum members", () => {
		const groups = [
			"AMR_NAHY",
			"AMM_KHASS",
			"MUTLAQ_MUQAYYAD",
			"MANTOOQ_MAFHUM",
			"WAADIH_MUBHAM",
		];
		for (const g of groups) {
			expect(UsuliCategoryGroupSchema.parse(g)).toBe(g);
		}
		expect(() => UsuliCategoryGroupSchema.parse("INVALID_GROUP")).toThrow();
	});

	it("validates the 24 canonical UsuliTaxonomyIdSchema members", () => {
		const expectedTaxonomyIds = [
			"AMR_WUJUB",
			"AMR_NADB",
			"AMR_IBAHAH",
			"AMR_IRSHAD",
			"KHABAR_BIMAANA_AMR",
			"NAHY_TAHRIM",
			"NAHY_KARAHAH",
			"AMM_BAQI",
			"AMM_MAKHSUS_MUTTASIL",
			"AMM_MAKHSUS_MUNFASIL",
			"AMM_MURAD_KHUSUS",
			"MUTLAQ_BAQI",
			"MUTLAQ_MAHMUL_MUQAYYAD",
			"IBARAT_NASS",
			"ISHARAT_NASS",
			"MAFHUM_MUWAFAQAH",
			"MAFHUM_MUKHALAFAH_SIFAH",
			"MAFHUM_MUKHALAFAH_SHART",
			"MAFHUM_MUKHALAFAH_GHAYAH",
			"MAFHUM_MUKHALAFAH_ADAD",
			"MAFHUM_MUKHALAFAH_HASR",
			"DALALAT_IQTIDA",
			"NASS_ZAHIR",
			"MUSHTARAK_LAFZI",
			"MUJMAL_MUBAYYAN",
		];
		expect(expectedTaxonomyIds.length).toBe(25);
		for (const id of expectedTaxonomyIds) {
			expect(UsuliTaxonomyIdSchema.parse(id)).toBe(id);
		}
		expect(() => UsuliTaxonomyIdSchema.parse("NON_EXISTENT_ID")).toThrow();
	});

	it("validates a golden UsuliShahid record", () => {
		const golden = {
			id: "2-282-10-10-amr-nadb",
			verseKey: "2:282",
			ayahNumber: 282,
			wordStart: 10,
			wordEnd: 10,
			shahidPhraseAr: "فَاكْتُبُوهُ",
			taxonomyId: "AMR_NADB",
			categoryGroup: "AMR_NAHY",
			linguisticTriggerAr: "صيغة الأمر",
			defaultDalalahAr: "الوجوب",
			actualDalalahAr: "الندب",
			hasQarinahSarifah: true,
			qarinahTextAr: "فَإِنْ أَمِنَ بَعْضُكُم بَعْضًا فَلْيُؤَدِّ الَّذِي اؤْتُمِنَ أَمَانَتَهُ",
			qarinahVerseKey: "2:283",
			wajhAlDilalahAr:
				"صيغة الأمر (فاكتبوه) مصروفة عن الوجوب إلى الندب والإرشاد بقرينة آية الرهن التالية",
			derivedFiqhRulingAr: "استحباب كتابة الديون وتوثيقها وليس بواجب",
			khilafUsuliAr:
				"ذهب داود الظاهري وابن حزم إلى وجوب الكتابة ظاهراً، والجمهور على الندب",
			classicalSources: ["أحكام القرآن للجصاص", "المستصفى للغزالي"],
			extractionStage: "GOLDEN_SEED",
			isCanonicalShahid: true,
		};
		const parsed = UsuliShahidSchema.parse(golden);
		expect(parsed.verseKey).toBe("2:282");
		expect(parsed.hasQarinahSarifah).toBe(true);
	});

	it("rejects verseKey not in Surah Al-Baqarah range 2:1-2:286", () => {
		const base = {
			id: "test",
			verseKey: "1:1",
			ayahNumber: 1,
			wordStart: 1,
			wordEnd: 1,
			shahidPhraseAr: "بسم الله",
			taxonomyId: "AMR_WUJUB",
			categoryGroup: "AMR_NAHY",
			linguisticTriggerAr: "صيغة أمر",
			defaultDalalahAr: "الوجوب",
			actualDalalahAr: "الوجوب",
			hasQarinahSarifah: false,
			qarinahTextAr: null,
			qarinahVerseKey: null,
			wajhAlDilalahAr: "وجه الدلالة",
			derivedFiqhRulingAr: "الحكم",
			khilafUsuliAr: null,
			classicalSources: [],
			extractionStage: "GOLDEN_SEED",
			isCanonicalShahid: true,
		};
		expect(() => UsuliShahidSchema.parse(base)).toThrow();
		expect(() =>
			UsuliShahidSchema.parse({ ...base, verseKey: "2:287" }),
		).toThrow();
		expect(() =>
			UsuliShahidSchema.parse({ ...base, verseKey: "2:0" }),
		).toThrow();
	});
});
