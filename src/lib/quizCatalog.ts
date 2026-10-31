/** Answer vocabulary for the quiz: roles, cases, signs, ṣarf classes and structures, with their labels. */
import type { Locale } from "./i18n/types";

export type QuizRelation =
	| "subj"
	| "obj"
	| "pass"
	| "subjx"
	| "pred"
	| "predx"
	| "gen"
	| "poss"
	| "adj"
	| "app"
	| "conj"
	| "circ"
	| "cog"
	| "spec";

export type QuizCase = "NOM" | "ACC" | "GEN";

export type QuizSign =
	| "damma"
	| "fatha"
	| "kasra"
	| "muqaddara"
	| "niyaba_haraka"
	| "ya"
	| "waw"
	| "alif"
	| "mabni";

export interface RoleMeta {
	code: QuizRelation;
	ar: string;
	en: string;
	id: string;
	family: "core" | "nom" | "clause";
	/** Learner-facing heading the role is listed under in the quiz picker. */
	group: RoleGroup;
	governorLabel: {
		ar: string;
		en: string;
		id: string;
	};
	governorPrompt: {
		ar: string;
		en: string;
		id: string;
	};
	defaultCase?: QuizCase;
}

export const QUIZ_ROLES: RoleMeta[] = [
	{
		code: "subj",
		ar: "فاعل",
		en: "Doer (Fāʿil)",
		id: "Pelaku (Fāʿil)",
		family: "core",
		group: "pillars",
		governorLabel: {
			ar: "الفعل العامل",
			en: "Governing Verb (Fiʿl)",
			id: "Fi'il Pengampu",
		},
		governorPrompt: {
			ar: "اختر الفعل الذي رَفَع هذا الفاعل من الآية",
			en: "Select the verb (fiʿl) in the ayah for which this word is the fāʿil",
			id: "Pilih kata kerja (fi'il) pada ayat yang menjadi pengampu fa'il ini",
		},
		defaultCase: "NOM",
	},
	{
		code: "pass",
		ar: "نائب فاعل",
		en: "Passive Subject (Nāʾib Fāʿil)",
		id: "Na'ibul Fa'il (Subjek Pasif)",
		family: "core",
		group: "pillars",
		governorLabel: {
			ar: "الفعل المبني للمجهول",
			en: "Passive Verb (Fiʿl Majhūl)",
			id: "Fi'il Majhul",
		},
		governorPrompt: {
			ar: "اختر الفعل المبني للمجهول (أو الوصف) الذي رَفَع نائب الفاعل",
			en: "Select the passive verb that raised this nāʾib fāʿil",
			id: "Pilih kata kerja pasif (fi'il majhul) yang merafa'kan na'ibul fa'il ini",
		},
		defaultCase: "NOM",
	},
	{
		code: "obj",
		ar: "مفعول به",
		en: "Direct Object (Mafʿūl bihi)",
		id: "Objek (Mafʿūl bih)",
		family: "core",
		group: "complements",
		governorLabel: {
			ar: "الفعل المتعدي",
			en: "Transitive Verb (Fiʿl)",
			id: "Fi'il Transitif",
		},
		governorPrompt: {
			ar: "اختر الفعل الذي نَصَب هذا المفعول به",
			en: "Select the verb (fiʿl) that acts upon this mafʿūl bihi",
			id: "Pilih fi'il yang menashabkan maf'ul bih ini",
		},
		defaultCase: "ACC",
	},
	{
		code: "subjx",
		ar: "مبتدأ / اسم ناسخ",
		en: "Subject / Ism Nāsikh",
		id: "Mubtada' / Isim Nasikh",
		family: "core",
		group: "pillars",
		governorLabel: {
			ar: "الناسخ أو المسند",
			en: "Nāsikh or Predicate Head",
			id: "Amil Nasikh / Khabar",
		},
		governorPrompt: {
			ar: "اختر الحرف الناسخ أو الفعل الناسخ أو الركن المرتبط به",
			en: "Select the governing particle/verb (e.g., inna/kāna) or linked pillar",
			id: "Pilih partikel/fi'il nasikh (inna/kana) yang mengampunya",
		},
	},
	{
		code: "pred",
		ar: "خبر",
		en: "Predicate (Khabar)",
		id: "Predikat (Khabar)",
		family: "core",
		group: "pillars",
		governorLabel: {
			ar: "المبتدأ أو الناسخ",
			en: "Subject (Mubtadaʾ) or Nāsikh",
			id: "Mubtada' atau Nasikh",
		},
		governorPrompt: {
			ar: "اختر المبتدأ أو الناسخ الذي أُخبر عنه بهذا الخبر",
			en: "Select the mubtadaʾ or nāsikh for which this is the khabar",
			id: "Pilih mubtada' atau nasikh dari khabar ini",
		},
	},
	{
		code: "poss",
		ar: "مضاف إليه",
		en: "Annexed Noun (Muḍāf ilayhi)",
		id: "Mudhaf Ilaih",
		family: "nom",
		group: "genitives",
		governorLabel: {
			ar: "المضاف",
			en: "Annexed Head (Muḍāf)",
			id: "Kata Sandaran (Muḍāf)",
		},
		governorPrompt: {
			ar: "اختر الاسم المضاف الذي جَرّ هذا المضاف إليه",
			en: "Select the first noun of annexation (muḍāf) governing this word",
			id: "Pilih isim mudhaf di depannya yang memajrurkan kata ini",
		},
		defaultCase: "GEN",
	},
	{
		code: "gen",
		ar: "اسم مجرور",
		en: "Prepositional Genitive (Majrūr)",
		id: "Isim Majrur",
		family: "nom",
		group: "genitives",
		governorLabel: {
			ar: "حرف الجر",
			en: "Preposition (Ḥarf Jarr)",
			id: "Huruf Jar",
		},
		governorPrompt: {
			ar: "اختر حرف الجر العامل في هذا الاسم",
			en: "Select the preposition (ḥarf jarr) governing this noun",
			id: "Pilih huruf jar yang memajrurkan isim ini",
		},
		defaultCase: "GEN",
	},
	{
		code: "adj",
		ar: "نعت (صفة)",
		en: "Adjective Follower (Naʿt)",
		id: "Sifat (Naʿt)",
		family: "nom",
		group: "followers",
		governorLabel: {
			ar: "المنعوت (الموصوف)",
			en: "Described Noun (Manʿūt)",
			id: "Kata yang Disifati (Manʿūt)",
		},
		governorPrompt: {
			ar: "اختر المنعوت الذي يتبعه هذا النعت في الإعراب",
			en: "Select the described noun (manʿūt) that this naʿt follows",
			id: "Pilih kata benda (man'ut) yang diikuti oleh na'at ini",
		},
	},
	{
		code: "app",
		ar: "بدل",
		en: "Apposition (Badal)",
		id: "Badal (Pengganti/Penjelas)",
		family: "nom",
		group: "followers",
		governorLabel: {
			ar: "المبدل منه",
			en: "Antecedent Noun (Mubdal minhu)",
			id: "Mubdal Minhu",
		},
		governorPrompt: {
			ar: "اختر المبدل منه الذي يتبعه هذا البدل في الإعراب",
			en: "Select the antecedent word (mubdal minhu) that this badal clarifies",
			id: "Pilih kata sebelumnya (mubdal minhu) yang dijelaskan oleh badal ini",
		},
	},
	{
		code: "conj",
		ar: "معطوف",
		en: "Conjoined (Maʿṭūf)",
		id: "Kata Sambung (Maʿṭūf)",
		family: "clause",
		group: "followers",
		governorLabel: {
			ar: "المعطوف عليه",
			en: "Conjoined Head (Maʿṭūf ʿalayhi)",
			id: "Ma'thuf 'Alaih",
		},
		governorPrompt: {
			ar: "اختر المعطوف عليه الذي يتبعه هذا الاسم في الإعراب",
			en: "Select the earlier word (maʿṭūf ʿalayhi) this word is conjoined to",
			id: "Pilih kata sebelumnya (ma'thuf 'alaih) yang diikuti i'rabnya",
		},
	},
	{
		code: "circ",
		ar: "حال",
		en: "Circumstantial (Ḥāl)",
		id: "Keterangan Keadaan (Ḥāl)",
		family: "clause",
		group: "complements",
		governorLabel: {
			ar: "عامل الحال / صاحبها",
			en: "Verbal Governor / Owner of State",
			id: "Amil / Shahibul Hal",
		},
		governorPrompt: {
			ar: "اختر الفعل أو العامل الذي نَصَب هذه الحال",
			en: "Select the verb or governing word for which this word describes the state (ḥāl)",
			id: "Pilih kata kerja atau pengampu yang menashabkan hal ini",
		},
		defaultCase: "ACC",
	},
	{
		code: "cog",
		ar: "مفعول مطلق",
		en: "Cognate Accusative (Mafʿūl Muṭlaq)",
		id: "Maf'ul Muthlaq",
		family: "nom",
		group: "complements",
		governorLabel: {
			ar: "الفعل المؤكَّد",
			en: "Cognate Verb (Fiʿl)",
			id: "Fi'il yang Ditegaskan",
		},
		governorPrompt: {
			ar: "اختر الفعل الذي أُخذ منه هذا المصدر ونُصب مفعولاً مطلقاً",
			en: "Select the verb emphasized or specified by this cognate maṣdar",
			id: "Pilih kata kerja yang ditegaskan oleh maf'ul muthlaq ini",
		},
		defaultCase: "ACC",
	},
	{
		code: "spec",
		ar: "تمييز",
		en: "Specification (Tamyīz)",
		id: "Tamyiz (Penjelas)",
		family: "nom",
		group: "complements",
		governorLabel: {
			ar: "المميَّز / العامل",
			en: "Clarified Head (Mumayyaz)",
			id: "Kata yang Dijelaskan (Mumayyaz)",
		},
		governorPrompt: {
			ar: "اختر الكلمة أو الفعل الذي أزال هذا التمييز إبهامه",
			en: "Select the word or verb whose ambiguity this tamyīz resolves",
			id: "Pilih kata atau fi'il yang diperjelas maknanya oleh tamyiz ini",
		},
		defaultCase: "ACC",
	},
];

export interface CaseMeta {
	code: QuizCase;
	ar: string;
	en: string;
	id: string;
	shortDesc: { ar: string; en: string; id: string };
}

export const QUIZ_CASES: CaseMeta[] = [
	{
		code: "NOM",
		ar: "مرفوع",
		en: "Marfūʿ (Nominative)",
		id: "Marfūʿ (Rafa')",
		shortDesc: {
			ar: "حالة الرفع (الفاعل، نائب الفاعل، المبتدأ، الخبر، التابع للمرفوع)",
			en: "State of rafʿ — subjects, passive subjects, predicates, and nominative followers",
			id: "Kedudukan rafa' — subjek, na'ibul fa'il, predikat, atau pengikut marfu'",
		},
	},
	{
		code: "ACC",
		ar: "منصوب",
		en: "Manṣūb (Accusative)",
		id: "Manṣūb (Nashab)",
		shortDesc: {
			ar: "حالة النصب (المفاعيل، الحال، التمييز، اسم إنّ، خبر كان، التابع للمنصوب)",
			en: "State of naṣb — objects, ḥāl, tamyīz, ism inna, khabar kāna, and accusative followers",
			id: "Kedudukan nashab — objek, hal, tamyiz, isim inna, khabar kana, atau pengikut manshub",
		},
	},
	{
		code: "GEN",
		ar: "مجرور",
		en: "Majrūr (Genitive)",
		id: "Majrūr (Jar)",
		shortDesc: {
			ar: "حالة الجر (المسبوق بحرف جر، المضاف إليه، التابع للمجرور)",
			en: "State of jarr — after prepositions, in iḍāfa, and genitive followers",
			id: "Kedudukan jar — setelah huruf jar, mudhaf ilaih, atau pengikut majrur",
		},
	},
];

export interface SignMeta {
	code: QuizSign;
	ar: string;
	arSub: string;
	en: string;
	id: string;
	category: "primary" | "secondary";
}

export const QUIZ_SIGNS: SignMeta[] = [
	{
		code: "damma",
		ar: "الضمة الظاهرة",
		arSub: "علامة رفع أصلية (ـُ)",
		en: "Visible Ḍamma (ـُ)",
		id: "Dhammah Zhahirah (ـُ)",
		category: "primary",
	},
	{
		code: "fatha",
		ar: "الفتحة الظاهرة",
		arSub: "علامة نصب أصلية (ـَ)",
		en: "Visible Fatḥa (ـَ)",
		id: "Fathah Zhahirah (ـَ)",
		category: "primary",
	},
	{
		code: "kasra",
		ar: "الكسرة الظاهرة",
		arSub: "علامة جر أصلية (ـِ)",
		en: "Visible Kasra (ـِ)",
		id: "Kasrah Zhahirah (ـِ)",
		category: "primary",
	},
	{
		code: "muqaddara",
		ar: "حركة مقدرة",
		arSub: "للتعذر أو الثقل أو المناسبة",
		en: "Estimated Vowel (Muqaddara)",
		id: "Harakat Muqaddarah",
		category: "secondary",
	},
	{
		code: "niyaba_haraka",
		ar: "حركة فرعية (نيابة)",
		arSub: "الفتحة في الممنوع من الصرف أو الكسرة في جمع المؤنث",
		en: "Secondary Vowel (Diptote / Fem. Pl.)",
		id: "Harakat Pengganti (Ghairu Munsharif / Jamak Muannats)",
		category: "secondary",
	},
	{
		code: "ya",
		ar: "الياء",
		arSub: "في المثنى وجمع المذكر السالم والأسماء الخمسة",
		en: "Al-Yāʾ (Dual / Sound Pl.)",
		id: "Huruf Yāʾ (Mutsanna / Jamak)",
		category: "secondary",
	},
	{
		code: "waw",
		ar: "الواو",
		arSub: "في جمع المذكر السالم والأسماء الخمسة",
		en: "Al-Wāw (Sound Masc. Pl. / 5 Nouns)",
		id: "Huruf Wāw (Jamak Mudzakkar / Asmaul Khamsah)",
		category: "secondary",
	},
	{
		code: "alif",
		ar: "الألف",
		arSub: "في المثنى والأسماء الخمسة",
		en: "Al-Alif (Dual / Five Nouns)",
		id: "Huruf Alif (Mutsanna / Asmaul Khamsah)",
		category: "secondary",
	},
];

export type RoleGroup = "pillars" | "complements" | "genitives" | "followers";

/** Headings for the role picker, in display order; each role sits under its `group`. */
export const ROLE_GROUPS: { code: RoleGroup; label: Record<Locale, string> }[] =
	[
		{
			code: "pillars",
			label: {
				ar: "أركان الجملة",
				en: "Sentence pillars",
				id: "Pilar kalimat",
			},
		},
		{
			code: "complements",
			label: {
				ar: "المفاعيل والمكمّلات",
				en: "Objects & complements",
				id: "Objek & pelengkap",
			},
		},
		{
			code: "genitives",
			label: {
				ar: "الجرّ والإضافة",
				en: "Genitive & annexation",
				id: "Jar & idhafah",
			},
		},
		{
			code: "followers",
			label: { ar: "التوابع", en: "Followers", id: "Tawābiʿ" },
		},
	];

/**
 * Signs that can mark each case. Every question in the dataset falls inside this
 * table (checked in tests), so narrowing the sign picker never hides the answer.
 */
export const SIGNS_BY_CASE: Record<QuizCase, readonly QuizSign[]> = {
	NOM: ["damma", "waw", "alif", "muqaddara"],
	ACC: ["fatha", "ya", "alif", "niyaba_haraka", "muqaddara"],
	GEN: ["kasra", "ya", "niyaba_haraka", "muqaddara"],
};

/** The sign choices for a chosen case; every sign while no case is chosen. */
export function signsForCase(grammaticalCase: QuizCase | null): SignMeta[] {
	if (!grammaticalCase) return QUIZ_SIGNS;
	const allowed = SIGNS_BY_CASE[grammaticalCase];
	return QUIZ_SIGNS.filter((s) => allowed.includes(s.code));
}

export function getRoleMeta(code: QuizRelation): RoleMeta {
	return QUIZ_ROLES.find((r) => r.code === code) ?? QUIZ_ROLES[0]!;
}

export function getCaseMeta(code: QuizCase): CaseMeta {
	return QUIZ_CASES.find((c) => c.code === code) ?? QUIZ_CASES[0]!;
}

export function getSignMeta(code: QuizSign): SignMeta {
	return QUIZ_SIGNS.find((s) => s.code === code) ?? QUIZ_SIGNS[0]!;
}

export type QuizLens = "irab" | "sarf" | "examples" | "mutashabih";

export const SARF_CLASSES: Record<
	string,
	{ ar: string; arSub: string; en: string; id: string; kind: "verb" | "noun" }
> = {
	"نَصَرَ يَنْصُرُ": {
		ar: "باب نَصَرَ يَنْصُرُ",
		arSub: "ثلاثي مجرد · فَعَلَ يَفْعُلُ",
		en: "Form I · faʿala yafʿulu (u-vowel)",
		id: "Bab nashara yanshuru (fathah-dhammah)",
		kind: "verb",
	},
	"ضَرَبَ يَضْرِبُ": {
		ar: "باب ضَرَبَ يَضْرِبُ",
		arSub: "ثلاثي مجرد · فَعَلَ يَفْعِلُ",
		en: "Form I · faʿala yafʿilu (i-vowel)",
		id: "Bab dharaba yadhribu (fathah-kasrah)",
		kind: "verb",
	},
	"فَتَحَ يَفْتَحُ": {
		ar: "باب فَتَحَ يَفْتَحُ",
		arSub: "ثلاثي مجرد · فَعَلَ يَفْعَلُ",
		en: "Form I · faʿala yafʿalu (a-vowel)",
		id: "Bab fataha yaftahu (fathah-fathah)",
		kind: "verb",
	},
	"عَلِمَ يَعْلَمُ": {
		ar: "باب عَلِمَ يَعْلَمُ",
		arSub: "ثلاثي مجرد · فَعِلَ يَفْعَلُ",
		en: "Form I · faʿila yafʿalu (stative)",
		id: "Bab 'alima ya'lamu (kasrah-fathah)",
		kind: "verb",
	},
	"شَرُفَ يَشْرُفُ": {
		ar: "باب شَرُفَ يَشْرُفُ",
		arSub: "ثلاثي مجرد · فَعُلَ يَفْعُلُ",
		en: "Form I · faʿula yafʿulu (innate quality)",
		id: "Bab syarufa yasyrufu (dhammah-dhammah)",
		kind: "verb",
	},
	"وَرِثَ يَرِثُ": {
		ar: "باب وَرِثَ يَرِثُ (حَسِبَ يَحْسِبُ)",
		arSub: "ثلاثي مجرد · فَعِلَ يَفْعِلُ",
		en: "Form I · faʿila yafʿilu",
		id: "Bab waritsa yaritsu (kasrah-kasrah)",
		kind: "verb",
	},
	أَفْعَلَ: {
		ar: "باب أَفْعَلَ",
		arSub: "ثلاثي مزيد بالهمزة (للتعدية غالباً)",
		en: "Form IV · Afʿala (causative)",
		id: "Wazan IV · Af'ala (kausatif/transitif)",
		kind: "verb",
	},
	فَعَّلَ: {
		ar: "باب فَعَّلَ",
		arSub: "ثلاثي مزيد بتضعيف العين (للتكثير)",
		en: "Form II · Faʿʿala (intensive/causative)",
		id: "Wazan II · Fa''ala (intensif/transitif)",
		kind: "verb",
	},
	فَاعَلَ: {
		ar: "باب فَاعَلَ",
		arSub: "ثلاثي مزيد بالألف (للمشاركة)",
		en: "Form III · Fāʿala (mutual/associative)",
		id: "Wazan III · Fa'ala (resiprokal)",
		kind: "verb",
	},
	افْتَعَلَ: {
		ar: "باب افْتَعَلَ",
		arSub: "خماسي مزيد بالألف والتاء",
		en: "Form VIII · Iftaʿala (reflexive/middle)",
		id: "Wazan VIII · Ifta'ala (refleksif)",
		kind: "verb",
	},
	تَفَعَّلَ: {
		ar: "باب تَفَعَّلَ",
		arSub: "خماسي مزيد بالتاء والتضعيف",
		en: "Form V · Tafaʿʿala (reflexive of II)",
		id: "Wazan V · Tafa''ala (refleksif pola II)",
		kind: "verb",
	},
	تَفَاعَلَ: {
		ar: "باب تَفَاعَلَ",
		arSub: "خماسي مزيد بالتاء والألف (للتشارك)",
		en: "Form VI · Tafāʿala (mutual reflexive)",
		id: "Wazan VI · Tafa'ala (saling/refleksif)",
		kind: "verb",
	},
	انْفَعَلَ: {
		ar: "باب انْفَعَلَ",
		arSub: "خماسي مزيد بالألف والنون (للمطاوعة)",
		en: "Form VII · Infaʿala (mediopassive)",
		id: "Wazan VII · Infa'ala (mutawa'ah/pasif)",
		kind: "verb",
	},
	اسْتَفْعَلَ: {
		ar: "باب اسْتَفْعَلَ",
		arSub: "سداسي مزيد بالسين والتاء (للطلب)",
		en: "Form X · Istafʿala (seeking/deeming)",
		id: "Wazan X · Istaf'ala (memohon/mencari)",
		kind: "verb",
	},
	"اسم فاعل": {
		ar: "اسم فاعل",
		arSub: "مشتق يدل على من قام بالفعل",
		en: "Active Participle (Ism Fāʿil)",
		id: "Isim Fa'il (Partisipel Aktif)",
		kind: "noun",
	},
	"اسم مفعول": {
		ar: "اسم مفعول",
		arSub: "مشتق يدل على من وقع عليه الفعل",
		en: "Passive Participle (Ism Mafʿūl)",
		id: "Isim Maf'ul (Partisipel Pasif)",
		kind: "noun",
	},
	"صفة مشبهة": {
		ar: "صفة مشبهة",
		arSub: "مشتق يدل على ثبوت الصفة في صاحبها",
		en: "Assimilated Adjective (Ṣifa Mushabbaha)",
		id: "Sifat Musyabbahah (Sifat Tetap)",
		kind: "noun",
	},
	"صيغة مبالغة": {
		ar: "صيغة مبالغة",
		arSub: "مشتق يدل على الكثرة والمبالغة في الوصف",
		en: "Intensive Noun (Ṣīghat Mubālagha)",
		id: "Shighah Mubalaghah (Bentuk Intensif)",
		kind: "noun",
	},
	"أفعل التفضيل": {
		ar: "أفعل التفضيل",
		arSub: "مشتق يدل على المشاركة والزيادة في الصفة",
		en: "Elative / Comparative (Ism Tafḍīl)",
		id: "Isim Tafdhil (Komparatif/Superlatif)",
		kind: "noun",
	},
	مصدر: {
		ar: "مصدر (حدث)",
		arSub: "ما دلّ على الحدث مجرداً من الزمان",
		en: "Verbal Noun (Maṣdar)",
		id: "Masdar (Nomina Verbal)",
		kind: "noun",
	},
	"اسم مكان / زمان": {
		ar: "اسم مكان أو زمان",
		arSub: "مشتق يدل على موضع الفعل أو زمانه",
		en: "Noun of Place or Time (Ism Makān/Zamān)",
		id: "Isim Makan / Zaman (Tempat/Waktu)",
		kind: "noun",
	},
	"اسم جامد": {
		ar: "اسم جامد",
		arSub: "اسم غير مأخوذ من فعل (ذات أو معنى)",
		en: "Primitive / Underived Noun (Jāmid)",
		id: "Isim Jamid (Bukan Kata Turunan)",
		kind: "noun",
	},
};

export const SARF_STRUCTURES: Record<
	string,
	{ ar: string; arSub: string; en: string; id: string; kind: "verb" | "noun" }
> = {
	"صحيح سالم": {
		ar: "صحيح سالم",
		arSub: "خلت أصوله من الهمز والتضعيف والعلة",
		en: "Sound Root (Ṣaḥīḥ Sālim — no weak/hamza/geminate)",
		id: "Shahih Salim (Tanpa huruf illat/hamzah/tadh'if)",
		kind: "verb",
	},
	"صحيح مهموز": {
		ar: "صحيح مهموز",
		arSub: "أحد حروفه الأصلية همزة",
		en: "Hamzated Sound Root (Mahmūz)",
		id: "Shahih Mahmuz (Berhuruf akar hamzah)",
		kind: "verb",
	},
	"صحيح مضعف": {
		ar: "صحيح مضعف",
		arSub: "عينه ولامه من جنس واحد",
		en: "Geminate Root (Muḍaʿʿaf — 2nd & 3rd identical)",
		id: "Shahih Mudha''af (Ain & Lam fi'il kembar)",
		kind: "verb",
	},
	"معتل مثال": {
		ar: "معتل مثال (الفاء)",
		arSub: "فاؤه حرف علة (واو أو ياء)",
		en: "Assimilated Weak 1st Radical (Mithāl — و/ي)",
		id: "Mu'tal Mitsal (Huruf illat di awal/fa' fi'il)",
		kind: "verb",
	},
	"معتل أجوف": {
		ar: "معتل أجوف (العين)",
		arSub: "عينه حرف علة (مثل: قَالَ، كَانَ)",
		en: "Hollow Weak 2nd Radical (Ajwaf — و/ي)",
		id: "Mu'tal Ajwaf (Huruf illat di tengah/'ain fi'il)",
		kind: "verb",
	},
	"معتل ناقص": {
		ar: "معتل ناقص (اللام)",
		arSub: "لامه حرف علة (مثل: دَعَا، هَدَى)",
		en: "Defective Weak 3rd Radical (Nāqiṣ — و/ي)",
		id: "Mu'tal Naqish (Huruf illat di akhir/lam fi'il)",
		kind: "verb",
	},
	"معتل لفيف": {
		ar: "معتل لفيف (حرفا علة)",
		arSub: "اجتمع في أصوله حرفا علة (مقرون أو مفروق)",
		en: "Doubly Weak Root (Lafīf — two weak radicals)",
		id: "Mu'tal Lafif (Dua huruf illat dalam akar)",
		kind: "verb",
	},
	مفرد: {
		ar: "مفرد",
		arSub: "ما دلّ على واحد أو واحدة",
		en: "Singular Noun (Mufrad)",
		id: "Mufrad (Tunggal)",
		kind: "noun",
	},
	مثنى: {
		ar: "مثنى",
		arSub: "ما دلّ على اثنين بزيادة ألف ونون أو ياء ونون",
		en: "Dual Noun (Muthannā)",
		id: "Mutsanna (Dual)",
		kind: "noun",
	},
	"جمع مذكر سالم": {
		ar: "جمع مذكر سالم",
		arSub: "ما جُمع بواو ونون أو ياء ونون",
		en: "Sound Masculine Plural (-ūna / -īna)",
		id: "Jamak Mudzakkar Salim",
		kind: "noun",
	},
	"جمع مؤنث سالم": {
		ar: "جمع مؤنث سالم",
		arSub: "ما جُمع بألف وتاء مزيدتين",
		en: "Sound Feminine Plural (-āt)",
		id: "Jamak Muannats Salim",
		kind: "noun",
	},
	"جمع تكسير للقلة": {
		ar: "جمع تكسير للقلة",
		arSub: "تغيرت صورة مفرده (أَفْعَال / أَفْعُل / أَفْعِلَة / فِعْلَة)",
		en: "Broken Plural of Paucity (Jamʿ Qilla)",
		id: "Jamak Taksir Qillah (أفعال / أفعل / أفعلة / فعلة)",
		kind: "noun",
	},
	"جمع تكسير للكثرة": {
		ar: "جمع تكسير للكثرة",
		arSub: "تغيرت فيه بنية المفرد لأوزان الكثرة",
		en: "Broken Plural of Multitude (Jamʿ Kathra)",
		id: "Jamak Taksir Katsrah (Pola internal berubah)",
		kind: "noun",
	},
};

export function getLensLabel(
	lens: QuizLens,
	locale: Locale,
): { title: string; badge: string } {
	const map: Record<
		QuizLens,
		Record<Locale, { title: string; badge: string }>
	> = {
		irab: {
			en: { title: "Iʿrāb Syntax", badge: "إعراب" },
			ar: { title: "النحو والإعراب", badge: "إعراب" },
			id: { title: "Sintaksis Iʿrāb", badge: "إعراب" },
		},
		sarf: {
			en: { title: "Ṣarf & Mīzān", badge: "صرف" },
			ar: { title: "الميزان الصرفي", badge: "صرف" },
			id: { title: "Sharaf & Wazan", badge: "صرف" },
		},
		examples: {
			en: { title: "Pattern Hunt", badge: "شواهد" },
			ar: { title: "شواهد وأنماط", badge: "شواهد" },
			id: { title: "Lacak Pola", badge: "شواهد" },
		},
		mutashabih: {
			en: { title: "Similar Verses", badge: "متشابه" },
			ar: { title: "المتشابه اللفظي", badge: "متشابه" },
			id: { title: "Ayat Mirip", badge: "متشابه" },
		},
	};
	return map[lens][locale];
}
