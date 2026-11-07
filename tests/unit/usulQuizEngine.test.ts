import { describe, expect, it } from "vitest";
import {
	generateIdentifyDalalahDrill,
	generateKhilafDrill,
	generateLocateSpanDrill,
	generateSpotTheQarinahDrill,
	validateSpanClick,
} from "../../src/lib/usulQuizEngine";
import type { UsuliShahid } from "../../src/lib/usulTypes";

const GOLDEN_SHAWAHID: UsuliShahid[] = [
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
			"صيغة أمر مطلقة عريت عن القرينة الصارفة فتفيد الوجوب، ولفظ الصلاة مجمل بيّنته السنة",
		derivedFiqhRulingAr: "وجوب الصلاة والزكاة",
		khilafUsuliAr: null,
		classicalSources: ["المستصفى للغزالي"],
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
			"صيغة الأمر (فاكتبوه) مصروفة عن الوجوب إلى الندب بقرينة الآية التالية",
		derivedFiqhRulingAr: "استحباب توثيق الديون بالكتابة",
		khilafUsuliAr: "وجوب الكتابة عند داود الظاهري والجمهور على الندب",
		classicalSources: ["أحكام القرآن للجصاص"],
		extractionStage: "GOLDEN_SEED",
		isCanonicalShahid: true,
	},
	{
		id: "2-228-2-5-khabar-bimaana-amr",
		verseKey: "2:228",
		ayahNumber: 228,
		wordStart: 2,
		wordEnd: 5,
		shahidPhraseAr: "يَتَرَبَّصْنَ بِأَنفُسِهِنَّ ثَلَاثَةَ قُرُوءٍ",
		taxonomyId: "KHABAR_BIMAANA_AMR",
		categoryGroup: "AMR_NAHY",
		linguisticTriggerAr: "جملة خبرية لفظاً إنشائية معنى",
		defaultDalalahAr: "الخبر",
		actualDalalahAr: "الوجوب",
		hasQarinahSarifah: true,
		qarinahTextAr: "سياق التشريع والحدود",
		qarinahVerseKey: "2:228",
		wajhAlDilalahAr:
			"يتربصن جملة خبرية يراد بها الإنشاء تأكيداً للأمر، والقرء مشترك لفظي",
		derivedFiqhRulingAr: "وجوب تربص المطلقة ثلاثة قروء",
		khilafUsuliAr:
			"الاشتراك اللفظي في (قروء) هل يحمل على الأطهار (الشافعية والمالكية) أو الحيض (الحنفية والحنابلة)",
		classicalSources: ["الإحكام للآمدي", "المستصفى للغزالي"],
		extractionStage: "GOLDEN_SEED",
		isCanonicalShahid: true,
	},
];

const s0 = GOLDEN_SHAWAHID[0];
const s1 = GOLDEN_SHAWAHID[1];
const s2 = GOLDEN_SHAWAHID[2];
if (!s0 || !s1 || !s2) throw new Error("Mock shawahid missing");

describe("Usuli Quiz Engine (4 Drill Modes)", () => {
	it("Mode 1 (IDENTIFY_DALALAH): produces question with 1 correct option and 3 plausible distractors", () => {
		const drill = generateIdentifyDalalahDrill(s1);
		expect(drill.mode).toBe("IDENTIFY_DALALAH");
		expect(drill.verseKey).toBe("2:282");
		expect(drill.correctTaxonomyId).toBe("AMR_NADB");
		expect(drill.options).toHaveLength(4);

		// Exactly one option is the correct taxonomy ID
		const correctMatches = drill.options.filter((o) => o.id === "AMR_NADB");
		expect(correctMatches).toHaveLength(1);

		// All 4 options are unique
		const ids = new Set(drill.options.map((o) => o.id));
		expect(ids.size).toBe(4);
	});

	it("Mode 2 (SPOT_THE_QARINAH): detects default vs shifted operative rulings", () => {
		// Shahid with qarinah sarifah (shifted: Wujub -> Nadb)
		const drillShifted = generateSpotTheQarinahDrill(s1);
		expect(drillShifted.mode).toBe("SPOT_THE_QARINAH");
		expect(drillShifted.hasQarinahSarifah).toBe(true);
		expect(drillShifted.qarinahVerseKey).toBe("2:283");
		const correctShifted = drillShifted.options.find((o) => o.isCorrect);
		expect(correctShifted?.labelAr).toContain("الندب");

		// Shahid without qarinah (stays on original default: Wujub)
		const drillUnshifted = generateSpotTheQarinahDrill(s0);
		expect(drillUnshifted.hasQarinahSarifah).toBe(false);
		const correctUnshifted = drillUnshifted.options.find((o) => o.isCorrect);
		expect(correctUnshifted?.labelAr).toContain("الوجوب");
	});

	it("Mode 3 (LOCATE_SHAHID_SPAN): validates click coordinates against token bounds", () => {
		const drill = generateLocateSpanDrill(s0);
		expect(drill.mode).toBe("LOCATE_SHAHID_SPAN");
		expect(drill.wordStart).toBe(1);
		expect(drill.wordEnd).toBe(4);

		// Words 1..4 are inside the span
		expect(validateSpanClick(1, drill.wordStart, drill.wordEnd)).toBe(true);
		expect(validateSpanClick(4, drill.wordStart, drill.wordEnd)).toBe(true);

		// Word 5 (outside span) fails
		expect(validateSpanClick(5, drill.wordStart, drill.wordEnd)).toBe(false);
		expect(validateSpanClick(0, drill.wordStart, drill.wordEnd)).toBe(false);
	});

	it("Mode 4 (USULI_KHILAF_DRILL): generates khilaf questions for shawahid with non-null khilaf", () => {
		const drill = generateKhilafDrill(s2);
		expect(drill).not.toBeNull();
		expect(drill?.mode).toBe("USULI_KHILAF_DRILL");
		expect(drill?.khilafUsuliAr).toContain("الاشتراك اللفظي");
		expect(drill?.options.length).toBeGreaterThanOrEqual(2);
		expect(drill?.options.filter((o) => o.isCorrect)).toHaveLength(1);

		// Fails gracefully (returns null) if shahid has no khilafUsuliAr
		const drillNull = generateKhilafDrill(s0);
		expect(drillNull).toBeNull();
	});
});
