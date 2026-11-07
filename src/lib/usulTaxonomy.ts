import type {
	UsuliCategoryGroup,
	UsuliTaxonomyId,
	UsuliTaxonomyNode,
} from "./usulTypes";

export const USULI_CATEGORY_LABELS: Record<
	UsuliCategoryGroup,
	{ ar: string; en: string }
> = {
	AMR_NAHY: { ar: "الأمر والنهي", en: "Commands & Prohibitions" },
	AMM_KHASS: { ar: "العام والخاص", en: "General & Specific" },
	MUTLAQ_MUQAYYAD: { ar: "المطلق والمقيد", en: "Absolute & Qualified" },
	MANTOOQ_MAFHUM: { ar: "المنطوق والمفهوم", en: "Explicit & Implied" },
	WAADIH_MUBHAM: { ar: "الوضوح والإبهام", en: "Clarity & Ambiguity" },
};

export const USULI_TAXONOMY_NODES: Record<UsuliTaxonomyId, UsuliTaxonomyNode> =
	{
		AMR_WUJUB: {
			id: "AMR_WUJUB",
			categoryGroup: "AMR_NAHY",
			schoolFramework: "SHARED",
			nameAr: "الأمر المطلق المفيد للوجوب",
			nameEn: "Absolute Command (Obligation)",
			descriptionAr:
				"صيغة الأمر عند تجردها عن القرائن الصارفة تفيد الوجوب حقيقة عند جماهير الأصوليين.",
		},
		AMR_NADB: {
			id: "AMR_NADB",
			categoryGroup: "AMR_NAHY",
			schoolFramework: "SHARED",
			nameAr: "الأمر المصروف إلى الندب",
			nameEn: "Command Shifted to Recommendation",
			descriptionAr:
				"صيغة أمر صرفتها قرينة سياقية أو خارجية من الوجوب إلى الاستحباب.",
		},
		AMR_IBAHAH: {
			id: "AMR_IBAHAH",
			categoryGroup: "AMR_NAHY",
			schoolFramework: "SHARED",
			nameAr: "الأمر المصروف إلى الإباحة",
			nameEn: "Command Shifted to Permissibility",
			descriptionAr:
				"صيغة أمر تفيد الإباحة، كالأمر الوارد بعد الحظر أو لرفع الحرج.",
		},
		AMR_IRSHAD: {
			id: "AMR_IRSHAD",
			categoryGroup: "AMR_NAHY",
			schoolFramework: "SHARED",
			nameAr: "الأمر للإرشاد",
			nameEn: "Command for Guidance / Worldly Counsel",
			descriptionAr:
				"أمر لمصلحة دنيوية محضة أو توجيه وإرشاد لا ثواب ولا عقاب فيه بذاته.",
		},
		KHABAR_BIMAANA_AMR: {
			id: "KHABAR_BIMAANA_AMR",
			categoryGroup: "AMR_NAHY",
			schoolFramework: "SHARED",
			nameAr: "الجملة الخبرية بمعنى الطلب",
			nameEn: "Declarative Sentence Functioning as Command",
			descriptionAr:
				"صيغة خبرية لفظاً مراد بها الإنشاء والطلب طلباً جازماً تأكيداً للامتثال.",
		},
		NAHY_TAHRIM: {
			id: "NAHY_TAHRIM",
			categoryGroup: "AMR_NAHY",
			schoolFramework: "SHARED",
			nameAr: "النهي المطلق المفيد للتحريم",
			nameEn: "Absolute Prohibition (Haram)",
			descriptionAr:
				"صيغة النهي المطلقة تفيد التحريم وفساد المنهي عنه شرعاً ما لم تقم قرينة صارفة.",
		},
		NAHY_KARAHAH: {
			id: "NAHY_KARAHAH",
			categoryGroup: "AMR_NAHY",
			schoolFramework: "SHARED",
			nameAr: "النهي المصروف إلى الكراهة",
			nameEn: "Prohibition Shifted to Dislike",
			descriptionAr: "نهي صرفته قرينة من التحريم إلى الكراهة التنزيهية.",
		},
		AMM_BAQI: {
			id: "AMM_BAQI",
			categoryGroup: "AMM_KHASS",
			schoolFramework: "SHARED",
			nameAr: "العام الباقي على عمومه",
			nameEn: "General Text Retaining Universality",
			descriptionAr:
				"لفظ عام لم تدخله مخصصات فبقي متناولاً لجميع أفراده قطعاً أو ظناً.",
		},
		AMM_MAKHSUS_MUTTASIL: {
			id: "AMM_MAKHSUS_MUTTASIL",
			categoryGroup: "AMM_KHASS",
			schoolFramework: "SHARED",
			nameAr: "العام المخصوص بمخصص متصل",
			nameEn: "General Restricted by Connected Clause",
			descriptionAr:
				"عام خصص بلفظ لا يستقل بنفسه كالاستثناء أو الشرط أو الصفة أو الغاية.",
		},
		AMM_MAKHSUS_MUNFASIL: {
			id: "AMM_MAKHSUS_MUNFASIL",
			categoryGroup: "AMM_KHASS",
			schoolFramework: "SHARED",
			nameAr: "العام المخصوص بمخصص منفصل",
			nameEn: "General Restricted by Independent Evidence",
			descriptionAr:
				"عام خُص دلالته بدليل مستقل آخر من القرآن أو السنة المتصلة أو الإجماع.",
		},
		AMM_MURAD_KHUSUS: {
			id: "AMM_MURAD_KHUSUS",
			categoryGroup: "AMM_KHASS",
			schoolFramework: "SHARED",
			nameAr: "العام الذي أريد به الخصوص",
			nameEn: "General Wording Intending Particular Scope",
			descriptionAr:
				"لفظ وضع عاماً واستعمل من أول الأمر في فرد أو أفراد مخصوصين بقرينة عقلية أو حالية.",
		},
		MUTLAQ_BAQI: {
			id: "MUTLAQ_BAQI",
			categoryGroup: "MUTLAQ_MUQAYYAD",
			schoolFramework: "SHARED",
			nameAr: "المطلق الجاري على إطلاقه",
			nameEn: "Absolute Retaining Unqualified Scope",
			descriptionAr:
				"اللفظ الدال على الماهية الشائعة في جنسها بلا قيد لفظي ملزم.",
		},
		MUTLAQ_MAHMUL_MUQAYYAD: {
			id: "MUTLAQ_MAHMUL_MUQAYYAD",
			categoryGroup: "MUTLAQ_MUQAYYAD",
			schoolFramework: "SHARED",
			nameAr: "المطلق المحمول على المقيد",
			nameEn: "Absolute Bound to Qualified Occurrence",
			descriptionAr:
				"حمل المطلق على المقيد لاتحادهما في السبب والحكم أو باشتراط القياس.",
		},
		IBARAT_NASS: {
			id: "IBARAT_NASS",
			categoryGroup: "MANTOOQ_MAFHUM",
			schoolFramework: "SHARED",
			nameAr: "عبارة النص (المنطوق الصريح)",
			nameEn: "Explicit Textual Utterance",
			descriptionAr:
				"دلالة اللفظ على المعنى المتبادر المقصود من سياق الكلام أصالة أو تبعاً.",
		},
		ISHARAT_NASS: {
			id: "ISHARAT_NASS",
			categoryGroup: "MANTOOQ_MAFHUM",
			schoolFramework: "SHARED",
			nameAr: "إشارة النص",
			nameEn: "Textual Implication (Necessary Concomitant)",
			descriptionAr:
				"دلالة اللفظ على لازم غير مقصود أصالة من السياق لكنه ملازم للمنطوق عقلاً أو عرفاً.",
		},
		MAFHUM_MUWAFAQAH: {
			id: "MAFHUM_MUWAFAQAH",
			categoryGroup: "MANTOOQ_MAFHUM",
			schoolFramework: "SHARED",
			nameAr: "مفهوم الموافقة (فحوى الخطاب)",
			nameEn: "Congruent Implication (A Fortiori)",
			descriptionAr:
				"ثبوت حكم المنطوق للمسكوت عنه لمساواته له في العلة أو لأولويته بالحكم.",
		},
		MAFHUM_MUKHALAFAH_SIFAH: {
			id: "MAFHUM_MUKHALAFAH_SIFAH",
			categoryGroup: "MANTOOQ_MAFHUM",
			schoolFramework: "JUMHUR",
			nameAr: "مفهوم المخالفة - الصفة",
			nameEn: "Opposite Implication of Attribute",
			descriptionAr:
				"تعليق الحكم على وصف مشتق يفيد انتفاء الحكم عند انتفاء الوصف (حجة عند الجمهور خلافاً للحنفية).",
		},
		MAFHUM_MUKHALAFAH_SHART: {
			id: "MAFHUM_MUKHALAFAH_SHART",
			categoryGroup: "MANTOOQ_MAFHUM",
			schoolFramework: "JUMHUR",
			nameAr: "مفهوم المخالفة - الشرط",
			nameEn: "Opposite Implication of Condition",
			descriptionAr: "تعليق الحكم بأداة شرط يفيد نفي الحكم عند انتفاء الشرط.",
		},
		MAFHUM_MUKHALAFAH_GHAYAH: {
			id: "MAFHUM_MUKHALAFAH_GHAYAH",
			categoryGroup: "MANTOOQ_MAFHUM",
			schoolFramework: "SHARED",
			nameAr: "مفهوم المخالفة - الغاية",
			nameEn: "Opposite Implication of Limit (Until)",
			descriptionAr:
				"دلالة أداة الغاية (حتى أو إلى) على ثبوت نقيض ما قبل الغاية لما بعدها.",
		},
		MAFHUM_MUKHALAFAH_ADAD: {
			id: "MAFHUM_MUKHALAFAH_ADAD",
			categoryGroup: "MANTOOQ_MAFHUM",
			schoolFramework: "JUMHUR",
			nameAr: "مفهوم المخالفة - العدد",
			nameEn: "Opposite Implication of Number",
			descriptionAr:
				"تعليق الحكم بعدد مخصوص يفيد انتفاء الحكم عما زاد أو نقص عنه.",
		},
		MAFHUM_MUKHALAFAH_HASR: {
			id: "MAFHUM_MUKHALAFAH_HASR",
			categoryGroup: "MANTOOQ_MAFHUM",
			schoolFramework: "SHARED",
			nameAr: "مفهوم الحصر والقصر",
			nameEn: "Exclusive Implication (Innama / Word Order)",
			descriptionAr:
				"إثبات الحكم للمذكور ونفيه عما عداه بصيغة حصر كـ(إنما) أو تقديم ما حقه التأخير.",
		},
		DALALAT_IQTIDA: {
			id: "DALALAT_IQTIDA",
			categoryGroup: "MANTOOQ_MAFHUM",
			schoolFramework: "SHARED",
			nameAr: "دلالة الاقتضاء",
			nameEn: "Requisite Presupposition",
			descriptionAr:
				"دلالة الكلام على محذوف يتوقف عليه صدق المتكلم أو صحة الكلام عقلاً أو شرعاً.",
		},
		NASS_ZAHIR: {
			id: "NASS_ZAHIR",
			categoryGroup: "WAADIH_MUBHAM",
			schoolFramework: "SHARED",
			nameAr: "النص والظاهر",
			nameEn: "Unequivocal & Apparent Meaning",
			descriptionAr:
				"اللفظ الذي يحتمل معنى راجحاً مع احتمال غيره مرجوحاً (الظاهر)، أو ما لا يحتمل إلا معنى واحداً (النص).",
		},
		MUSHTARAK_LAFZI: {
			id: "MUSHTARAK_LAFZI",
			categoryGroup: "WAADIH_MUBHAM",
			schoolFramework: "SHARED",
			nameAr: "المشترك اللفظي",
			nameEn: "Lexical Homonym / Polysemy",
			descriptionAr:
				"لفظ واحد وضع لحقيقتين مختلفتين أو أكثر بأوضاع متعددة كلفظ (القرء).",
		},
		MUJMAL_MUBAYYAN: {
			id: "MUJMAL_MUBAYYAN",
			categoryGroup: "WAADIH_MUBHAM",
			schoolFramework: "SHARED",
			nameAr: "المجمل والمبين",
			nameEn: "Summary/Unspecified & Clarified",
			descriptionAr:
				"لفظ لا تتضح دلالته على المراد منه بنفسه بل يتوقف فهم المراد منه على بيان خارجي من الشارع.",
		},
	};

export function getTaxonomyNode(id: UsuliTaxonomyId): UsuliTaxonomyNode {
	return USULI_TAXONOMY_NODES[id];
}

export function listTaxonomyNodes(): UsuliTaxonomyNode[] {
	return Object.values(USULI_TAXONOMY_NODES);
}

export function nodesForCategory(
	group: UsuliCategoryGroup,
): UsuliTaxonomyNode[] {
	return Object.values(USULI_TAXONOMY_NODES).filter(
		(node) => node.categoryGroup === group,
	);
}
