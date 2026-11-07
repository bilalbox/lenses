import { describe, expect, it } from "vitest";
import { searchUsuliShawahid } from "../../src/lib/usulSearch";
import type { UsuliShahid } from "../../src/lib/usulTypes";

const MOCK_SHAWAHID: UsuliShahid[] = [
	{
		id: "2-43-1-4-amr-wujub",
		verseKey: "2:43",
		ayahNumber: 43,
		wordStart: 1,
		wordEnd: 4,
		shahidPhraseAr: "وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ",
		taxonomyId: "AMR_WUJUB",
		categoryGroup: "AMR_NAHY",
		linguisticTriggerAr: "صيغة أمر مطلقة",
		defaultDalalahAr: "الوجوب",
		actualDalalahAr: "الوجوب",
		hasQarinahSarifah: false,
		qarinahTextAr: null,
		qarinahVerseKey: null,
		wajhAlDilalahAr:
			"صيغة أمر مطلقة عريت عن القرينة الصارفة فتفيد الوجوب، ولفظ الصلاة مجمل",
		derivedFiqhRulingAr: "وجوب إقامة الصلاة وإيتاء الزكاة فرض عين",
		khilafUsuliAr: null,
		classicalSources: ["المستصفى للغزالي"],
		extractionStage: "GOLDEN_SEED",
		isCanonicalShahid: true,
	},
	{
		id: "2-187-31-37-amr-ibahah",
		verseKey: "2:187",
		ayahNumber: 187,
		wordStart: 31,
		wordEnd: 37,
		shahidPhraseAr: "وَكُلُوا وَاشْرَبُوا حَتَّىٰ يَتَبَيَّنَ لَكُمُ الْخَيْطُ الْأَبْيَضُ",
		taxonomyId: "AMR_IBAHAH",
		categoryGroup: "AMR_NAHY",
		linguisticTriggerAr: "أمر بعد الحظر مع غاية",
		defaultDalalahAr: "الوجوب",
		actualDalalahAr: "الإباحة",
		hasQarinahSarifah: true,
		qarinahTextAr: "أُحِلَّ لَكُمْ لَيْلَةَ الصِّيَامِ الرَّفَثُ",
		qarinahVerseKey: "2:187",
		wajhAlDilalahAr:
			"الأمر في (كلوا واشربوا) ورد بعد الحظر فيفيد الإباحة، و(حتى) غاية تفيد التحريم عند الفجر",
		derivedFiqhRulingAr:
			"إباحة الأكل والشرب في ليل الصيام حتى طلوع الفجر الثاني",
		khilafUsuliAr:
			"الجمهور على أن الأمر بعد الحظر للإباحة وخالف بعضهم فقال بالوجوب",
		classicalSources: ["أحكام القرآن لابن العربي", "المستصفى"],
		extractionStage: "GOLDEN_SEED",
		isCanonicalShahid: true,
	},
	{
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
			"صيغة الأمر (فاكتبوه) مصروفة عن الوجوب إلى الندب والإرشاد بقرينة الآية التالية",
		derivedFiqhRulingAr: "استحباب توثيق الديون بالكتابة",
		khilafUsuliAr: "وجوب الكتابة عند الظاهرية والندب عند الأئمة الأربعة",
		classicalSources: ["أحكام القرآن للجصاص"],
		extractionStage: "GOLDEN_SEED",
		isCanonicalShahid: true,
	},
	{
		id: "2-221-1-5-nahy-tahrim",
		verseKey: "2:221",
		ayahNumber: 221,
		wordStart: 1,
		wordEnd: 5,
		shahidPhraseAr: "وَلَا تَنكِحُوا الْمُشْرِكَاتِ حَتَّىٰ يُؤْمِنَّ",
		taxonomyId: "NAHY_TAHRIM",
		categoryGroup: "AMR_NAHY",
		linguisticTriggerAr: "لا الناهية الجازمة للفعل",
		defaultDalalahAr: "التحريم والفساد",
		actualDalalahAr: "التحريم والفساد",
		hasQarinahSarifah: false,
		qarinahTextAr: null,
		qarinahVerseKey: null,
		wajhAlDilalahAr:
			"نهي مطلق يفيد التحريم وفساد العقد، ولفظ (المشركات) عام خص بآية المائدة",
		derivedFiqhRulingAr: "تحريم نكاح المشركات وبطلان العقد",
		khilafUsuliAr: null,
		classicalSources: ["تفسير القرطبي"],
		extractionStage: "STAGE1_RULE_ONLY",
		isCanonicalShahid: false,
	},
];

describe("Usuli Search and Facet Filtering", () => {
	it("returns all shawahid when query is empty", () => {
		const results = searchUsuliShawahid(MOCK_SHAWAHID, {});
		expect(results).toHaveLength(4);
	});

	it("filters by normalized Arabic text search across wajh, phrase, and rulings", () => {
		// With diacritics in query: "فَاكْتُبُوهُ"
		const r1 = searchUsuliShawahid(MOCK_SHAWAHID, { text: "فَاكْتُبُوهُ" });
		expect(r1).toHaveLength(1);
		expect(r1[0]?.id).toBe("2-282-10-10-amr-nadb");

		// Without diacritics and alternate alif: "فاكتبوه"
		const r2 = searchUsuliShawahid(MOCK_SHAWAHID, { text: "فاكتبوه" });
		expect(r2).toHaveLength(1);
		expect(r2[0]?.id).toBe("2-282-10-10-amr-nadb");

		// Search across derived ruling: "توثيق"
		const r3 = searchUsuliShawahid(MOCK_SHAWAHID, { text: "توثيق" });
		expect(r3).toHaveLength(1);
		expect(r3[0]?.id).toBe("2-282-10-10-amr-nadb");

		// Search across wajh al-dilalah: "الحظر"
		const r4 = searchUsuliShawahid(MOCK_SHAWAHID, { text: "الحظر" });
		expect(r4).toHaveLength(1);
		expect(r4[0]?.id).toBe("2-187-31-37-amr-ibahah");
	});

	it("filters by categoryGroup and taxonomyId", () => {
		const r1 = searchUsuliShawahid(MOCK_SHAWAHID, { taxonomyId: "AMR_IBAHAH" });
		expect(r1).toHaveLength(1);
		expect(r1[0]?.taxonomyId).toBe("AMR_IBAHAH");

		const r2 = searchUsuliShawahid(MOCK_SHAWAHID, {
			categoryGroup: "AMM_KHASS",
		});
		expect(r2).toHaveLength(0);
	});

	it("filters by hasQarinahSarifah flag", () => {
		const shifted = searchUsuliShawahid(MOCK_SHAWAHID, {
			hasQarinahSarifah: true,
		});
		expect(shifted).toHaveLength(2);
		expect(shifted.map((s) => s.id)).toEqual([
			"2-187-31-37-amr-ibahah",
			"2-282-10-10-amr-nadb",
		]);

		const unshifted = searchUsuliShawahid(MOCK_SHAWAHID, {
			hasQarinahSarifah: false,
		});
		expect(unshifted).toHaveLength(2);
	});

	it("filters by isCanonicalShahid", () => {
		const canonical = searchUsuliShawahid(MOCK_SHAWAHID, {
			isCanonicalShahid: true,
		});
		expect(canonical).toHaveLength(3);
	});
});
