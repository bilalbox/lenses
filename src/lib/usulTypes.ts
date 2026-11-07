import { z } from "zod";

export const UsuliCategoryGroupSchema = z.enum([
	"AMR_NAHY", // الأمر والنهي
	"AMM_KHASS", // العام والخاص والتخصيص
	"MUTLAQ_MUQAYYAD", // المطلق والمقيد
	"MANTOOQ_MAFHUM", // المنطوق والمفهوم / طرق الدلالة
	"WAADIH_MUBHAM", // الواضح والمبهم (النص، الظاهر، المجمل، المشترك)
]);

export type UsuliCategoryGroup = z.infer<typeof UsuliCategoryGroupSchema>;

export const UsuliTaxonomyIdSchema = z.enum([
	// الأمر والنهي
	"AMR_WUJUB", // الأمر المطلق المفيد للوجوب
	"AMR_NADB", // الأمر المصروف إلى الندب بقرينة
	"AMR_IBAHAH", // الأمر المصروف إلى الإباحة (كالأمر بعد الحظر)
	"AMR_IRSHAD", // الأمر المصروف إلى الإرشاد
	"KHABAR_BIMAANA_AMR", // الجملة الخبرية المراد بها الإنشاء
	"NAHY_TAHRIM", // النهي المطلق المفيد للتحريم والفساد
	"NAHY_KARAHAH", // النهي المصروف إلى الكراهة بقرينة
	// العام والخاص
	"AMM_BAQI", // العام الباقي على عمومه
	"AMM_MAKHSUS_MUTTASIL", // العام المخصوص بمخصص متصل (استثناء/شرط/صفة/غاية)
	"AMM_MAKHSUS_MUNFASIL", // العام المخصوص بمخصص منفصل (بالقرآن أو السنة)
	"AMM_MURAD_KHUSUS", // العام الذي أريد به الخصوص
	// المطلق والمقيد
	"MUTLAQ_BAQI", // المطلق الجاري على إطلاقه
	"MUTLAQ_MAHMUL_MUQAYYAD", // المطلق المحمول على المقيد
	// المنطوق والمفهوم وطرق الدلالة
	"IBARAT_NASS", // عبارة النص / المنطوق الصريح
	"ISHARAT_NASS", // إشارة النص (اللازم غير المقصود أصالة)
	"MAFHUM_MUWAFAQAH", // مفهوم الموافقة / فحوى الخطاب (دلالة النص)
	"MAFHUM_MUKHALAFAH_SIFAH", // مفهوم المخالفة - الصفة
	"MAFHUM_MUKHALAFAH_SHART", // مفهوم المخالفة - الشرط
	"MAFHUM_MUKHALAFAH_GHAYAH", // مفهوم المخالفة - الغاية (حتى / إلى)
	"MAFHUM_MUKHALAFAH_ADAD", // مفهوم المخالفة - العدد
	"MAFHUM_MUKHALAFAH_HASR", // مفهوم الحصر (إنما / التقديم)
	"DALALAT_IQTIDA", // دلالة الاقتضاء (تقدير محذوف لتصحيح الكلام شرعاً)
	// الوضوح والإجمال
	"NASS_ZAHIR", // النص والظاهر
	"MUSHTARAK_LAFZI", // المشترك اللفظي
	"MUJMAL_MUBAYYAN", // المجمل المبين بالسنة أو السياق
]);

export type UsuliTaxonomyId = z.infer<typeof UsuliTaxonomyIdSchema>;

export const UsuliShahidSchema = z.object({
	id: z.string(),
	verseKey: z.string().regex(/^2:([1-9]|[1-9]\d|1\d\d|2[0-7]\d|28[0-6])$/),
	ayahNumber: z.number().int().min(1).max(286),
	wordStart: z.number().int().min(1),
	wordEnd: z.number().int().min(1),
	shahidPhraseAr: z.string(),
	taxonomyId: UsuliTaxonomyIdSchema,
	categoryGroup: UsuliCategoryGroupSchema,

	// Linguistic & Usuli Reasoning
	linguisticTriggerAr: z.string(),
	defaultDalalahAr: z.string(),
	actualDalalahAr: z.string(),
	hasQarinahSarifah: z.boolean(),
	qarinahTextAr: z.string().nullable(),
	qarinahVerseKey: z.string().nullable(),
	wajhAlDilalahAr: z.string(),
	derivedFiqhRulingAr: z.string(),
	khilafUsuliAr: z.string().nullable(),
	classicalSources: z.array(z.string()),

	// Metadata
	extractionStage: z.enum([
		"STAGE1_RULE_ONLY",
		"STAGE2_LLM_VERIFIED",
		"GOLDEN_SEED",
	]),
	isCanonicalShahid: z.boolean(),
});

export type UsuliShahid = z.infer<typeof UsuliShahidSchema>;

export interface UsuliTaxonomyNode {
	id: UsuliTaxonomyId;
	categoryGroup: UsuliCategoryGroup;
	schoolFramework: "SHARED" | "JUMHUR" | "HANAFI";
	nameAr: string;
	nameEn: string;
	descriptionAr: string;
}

export interface SurahUsulFile {
	surah: number;
	shawahid: UsuliShahid[];
}
