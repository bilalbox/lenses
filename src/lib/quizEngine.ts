import type { Locale } from "./i18n/types";
import type { ExampleQuery } from "./search";
import type { SurahFile, Verse, Word } from "./types";

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

export interface QuizQuestion {
  id: string;
  sura: number;
  suraName: string;
  suraPhonetic: string;
  verse: Verse;
  targetWord: Word;
  headWord: Word;
  relation: QuizRelation;
  /** Canonical normalized role (e.g. predx -> pred for display if needed, or distinct) */
  grammaticalCase: QuizCase;
  sign: QuizSign;
  signDetailAr: string;
  classicalIrab: string;
  clauseWords: Word[];
  /** True when the question involves an advanced role or a secondary/estimated declension sign */
  isAdvanced: boolean;
}

export interface RoleMeta {
  code: QuizRelation;
  ar: string;
  en: string;
  id: string;
  family: "core" | "nom" | "clause";
  tier?: "core" | "advanced";
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
    tier: "core",
    governorLabel: { ar: "الفعل العامل", en: "Governing Verb (Fiʿl)", id: "Fi'il Pengampu" },
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
    tier: "advanced",
    governorLabel: { ar: "الفعل المبني للمجهول", en: "Passive Verb (Fiʿl Majhūl)", id: "Fi'il Majhul" },
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
    tier: "core",
    governorLabel: { ar: "الفعل المتعدي", en: "Transitive Verb (Fiʿl)", id: "Fi'il Transitif" },
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
    tier: "core",
    governorLabel: { ar: "الناسخ أو المسند", en: "Nāsikh or Predicate Head", id: "Amil Nasikh / Khabar" },
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
    tier: "core",
    governorLabel: { ar: "المبتدأ أو الناسخ", en: "Subject (Mubtadaʾ) or Nāsikh", id: "Mubtada' atau Nasikh" },
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
    tier: "core",
    governorLabel: { ar: "المضاف", en: "Annexed Head (Muḍāf)", id: "Kata Sandaran (Muḍāf)" },
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
    tier: "core",
    governorLabel: { ar: "حرف الجر", en: "Preposition (Ḥarf Jarr)", id: "Huruf Jar" },
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
    tier: "core",
    governorLabel: { ar: "المنعوت (الموصوف)", en: "Described Noun (Manʿūt)", id: "Kata yang Disifati (Manʿūt)" },
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
    tier: "advanced",
    governorLabel: { ar: "المبدل منه", en: "Antecedent Noun (Mubdal minhu)", id: "Mubdal Minhu" },
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
    tier: "core",
    governorLabel: { ar: "المعطوف عليه", en: "Conjoined Head (Maʿṭūf ʿalayhi)", id: "Ma'thuf 'Alaih" },
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
    tier: "advanced",
    governorLabel: { ar: "عامل الحال / صاحبها", en: "Verbal Governor / Owner of State", id: "Amil / Shahibul Hal" },
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
    tier: "advanced",
    governorLabel: { ar: "الفعل المؤكَّد", en: "Cognate Verb (Fiʿl)", id: "Fi'il yang Ditegaskan" },
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
    tier: "advanced",
    governorLabel: { ar: "المميَّز / العامل", en: "Clarified Head (Mumayyaz)", id: "Kata yang Dijelaskan (Mumayyaz)" },
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

/** Fast initial surahs loaded immediately on quiz open */
export const CURATED_SURAHS = [1, 59, 67, 78, 87, 93, 94, 97, 103, 108, 109, 110, 112, 113, 114];

/** Additional treebank-annotated surahs loaded in the background for deeper variety */
export const EXTENDED_QUIZ_SURAHS = [62, 63, 64, 68, 71, 72, 73, 74, 75, 76, 79, 80, 81, 82, 83, 84, 85, 86, 88, 89, 90, 91, 92, 95, 96, 98, 99, 100, 101, 102];

const HARAKAT_RE = /[\u064B-\u0652\u0670\u0640\u06E1\u06E5\u06E6]/g;

function stripHarakat(text: string): string {
  return text.replace(HARAKAT_RE, "");
}

interface ExtractedIrabMeta {
  grammaticalCase: QuizCase;
  sign: QuizSign;
  detailAr: string;
  stemRole: QuizRelation | "SKIP" | null;
  isMultiKhabar: boolean;
  hasElidedGovernor: boolean;
}

function parseStemRoleFromClause(beforeAlama: string, fullStemClause: string): QuizRelation | "SKIP" | null {
  if (
    beforeAlama.includes("مجرور لفظا") ||
    beforeAlama.includes("ظرف زمان") ||
    beforeAlama.includes("ظرف مكان") ||
    beforeAlama.includes("نائب عن ظرف") ||
    beforeAlama.includes("نايب عن ظرف") ||
    (beforeAlama.includes("توكيد") && !beforeAlama.includes("حرف توكيد")) ||
    beforeAlama.includes("مفعول لأجله") ||
    beforeAlama.includes("مفعول له") ||
    beforeAlama.includes("مفعول معه") ||
    beforeAlama.includes("منادى") ||
    beforeAlama.includes("مستثنى") ||
    beforeAlama.includes("نزع الخافض") ||
    beforeAlama.includes("حذف الجار") ||
    fullStemClause.startsWith("ظرف ")
  ) {
    return "SKIP";
  }

  if (beforeAlama.includes("نايب فاعل") || beforeAlama.includes("نائب فاعل")) return "pass";
  if (
    beforeAlama.includes("مفعول مطلق") ||
    beforeAlama.includes("نايب عن المفعول المطلق") ||
    beforeAlama.includes("نائب عن المفعول المطلق")
  ) {
    return "cog";
  }
  if (beforeAlama.includes("مفعول به")) return "obj";
  if (beforeAlama.includes("مضاف اليه") || beforeAlama.includes("مضاف إليه")) return "poss";
  if (
    beforeAlama.includes("اسم مجرور") ||
    beforeAlama.includes("مجرور ب") ||
    beforeAlama.includes("اسم الجلالة مجرور")
  ) {
    return "gen";
  }
  if (beforeAlama.includes("معطوف")) return "conj";
  if (beforeAlama.includes("نعت") || beforeAlama.includes("صفة")) return "adj";
  if (beforeAlama.includes("بدل") || beforeAlama.includes("عطف بيان")) return "app";
  if (beforeAlama.includes("حال")) return "circ";
  if (beforeAlama.includes("تمييز")) return "spec";
  if (beforeAlama.includes("خبر")) return "pred";
  if (
    beforeAlama.includes("مبتدا") ||
    beforeAlama.includes("مبتدأ") ||
    /اسم\s+(?:الجللاله\s+|الجلالة\s+)?(?:﴿)?(?:ان|إن|أن|كان|يكون|يكاد|ليت|لعل|لا|اصبح|أصبح|اضحى|أضحى|ظل|بات|صار|ليس|ما|عسى|كاد|لكن)/.test(
      beforeAlama,
    )
  ) {
    return "subjx";
  }
  if (beforeAlama.replace(/اسم الفاعل/g, "").includes("فاعل")) return "subj";
  return null;
}

function extractIrabMeta(irab: string, fallbackCase: QuizCase): ExtractedIrabMeta | null {
  if (!irab) return null;
  const clauses = irab
    .split(/[،.]/)
    .map((s) => s.trim())
    .filter(Boolean);

  let stemClauseBare = "";
  for (const c of clauses) {
    const bare = stripHarakat(c).replace(/\s+/g, " ");
    if (/علامة\s+(رفعه|نصبه|جره)/.test(bare)) {
      stemClauseBare = bare;
      break;
    }
  }

  if (!stemClauseBare) {
    return null;
  }

  const m = stemClauseBare.match(/^(.*?)علامة\s+(رفعه|نصبه|جره)\s+(.+)$/);
  if (!m) return null;

  const beforeAlama = m[1].trim();
  const caseWord = m[2];
  const signClause = m[3].trim();

  const grammaticalCase: QuizCase =
    caseWord === "رفعه"
      ? "NOM"
      : caseWord === "نصبه"
        ? "ACC"
        : caseWord === "جره"
          ? "GEN"
          : fallbackCase;

  const stemRole = parseStemRoleFromClause(beforeAlama, stemClauseBare);
  const isMultiKhabar =
    stemRole === "pred" &&
    (beforeAlama.includes("ثان") || beforeAlama.includes("ثالث") || beforeAlama.includes("رابع"));
  const hasElidedGovernor =
    stemClauseBare.includes("لفعل محذوف") ||
    stemClauseBare.includes("لمبتدإ محذوف") ||
    stemClauseBare.includes("لمبتدا محذوف");

  if (signClause.includes("ممنوع من الصرف")) {
    return {
      grammaticalCase,
      sign: "niyaba_haraka",
      detailAr: signClause.includes("المقدرة")
        ? "الفتحة المقدرة نيابة عن الكسرة (ممنوع من الصرف)"
        : "الفتحة نيابة عن الكسرة (ممنوع من الصرف)",
      stemRole,
      isMultiKhabar,
      hasElidedGovernor,
    };
  }
  if (grammaticalCase === "ACC" && signClause.startsWith("الكسرة")) {
    return {
      grammaticalCase,
      sign: "niyaba_haraka",
      detailAr: "الكسرة نيابة عن الفتحة (جمع مؤنث سالم)",
      stemRole,
      isMultiKhabar,
      hasElidedGovernor,
    };
  }
  if (signClause.startsWith("الضمة المقدرة")) {
    return {
      grammaticalCase,
      sign: "muqaddara",
      detailAr: "الضمة المقدرة",
      stemRole,
      isMultiKhabar,
      hasElidedGovernor,
    };
  }
  if (signClause.startsWith("الفتحة المقدرة")) {
    return {
      grammaticalCase,
      sign: "muqaddara",
      detailAr: "الفتحة المقدرة",
      stemRole,
      isMultiKhabar,
      hasElidedGovernor,
    };
  }
  if (signClause.startsWith("الكسرة المقدرة")) {
    return {
      grammaticalCase,
      sign: "muqaddara",
      detailAr: "الكسرة المقدرة",
      stemRole,
      isMultiKhabar,
      hasElidedGovernor,
    };
  }
  if (signClause.startsWith("الياء")) {
    return {
      grammaticalCase,
      sign: "ya",
      detailAr: "الياء (نيابة عن الحركة)",
      stemRole,
      isMultiKhabar,
      hasElidedGovernor,
    };
  }
  if (signClause.startsWith("الواو")) {
    return {
      grammaticalCase,
      sign: "waw",
      detailAr: "الواو (جمع مذكر سالم / الأسماء الخمسة)",
      stemRole,
      isMultiKhabar,
      hasElidedGovernor,
    };
  }
  if (signClause.startsWith("الألف") || signClause.startsWith("الالف")) {
    return {
      grammaticalCase,
      sign: "alif",
      detailAr: "الألف (مثنى / الأسماء الخمسة)",
      stemRole,
      isMultiKhabar,
      hasElidedGovernor,
    };
  }
  if (signClause.startsWith("الضمة")) {
    return {
      grammaticalCase,
      sign: "damma",
      detailAr: "الضمة الظاهرة",
      stemRole,
      isMultiKhabar,
      hasElidedGovernor,
    };
  }
  if (signClause.startsWith("الفتحة") || signClause.startsWith("ال فتحة")) {
    return {
      grammaticalCase,
      sign: "fatha",
      detailAr: "الفتحة الظاهرة",
      stemRole,
      isMultiKhabar,
      hasElidedGovernor,
    };
  }
  if (signClause.startsWith("الكسرة")) {
    return {
      grammaticalCase,
      sign: "kasra",
      detailAr: "الكسرة الظاهرة",
      stemRole,
      isMultiKhabar,
      hasElidedGovernor,
    };
  }

  return null;
}

function normalizeRelation(raw: string): QuizRelation | null {
  if (raw === "predx") return "pred";
  const valid: QuizRelation[] = [
    "subj",
    "pass",
    "obj",
    "subjx",
    "pred",
    "gen",
    "poss",
    "adj",
    "app",
    "conj",
    "circ",
    "cog",
    "spec",
  ];
  return valid.includes(raw as QuizRelation) ? (raw as QuizRelation) : null;
}

export function extractQuizQuestionsFromSurah(file: SurahFile): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  for (const verse of file.verses) {
    if (!verse.g || verse.g.length === 0) continue;

    for (const graph of verse.g) {
      // Collect words in this clause graph
      const clauseWordNums = new Set<number>();
      for (const node of graph.nodes) {
        if (node.t === "seg" && node.s === file.n && node.v === verse.v && node.w) {
          clauseWordNums.add(node.w);
        }
      }
      const clauseWords = verse.w.filter((w) => clauseWordNums.has(w.n));

      for (const edge of graph.edges) {
        const depNode = graph.nodes[edge.d];
        const headNode = graph.nodes[edge.h];
        if (!depNode || !headNode) continue;
        if (depNode.t !== "seg" || headNode.t !== "seg") continue;
        if (depNode.s !== file.n || depNode.v !== verse.v) continue;
        if (headNode.s !== file.n || headNode.v !== verse.v) continue;
        if (!depNode.w || !headNode.w || depNode.w === headNode.w) continue;

        const tbRelation = normalizeRelation(edge.r);
        if (!tbRelation) continue;

        const targetWord = verse.w.find((w) => w.n === depNode.w);
        let headWord = verse.w.find((w) => w.n === headNode.w);
        if (!targetWord || !headWord || !targetWord.i) continue;

        // Avoid words whose stem is a pronoun or مبني where sign is not standard declension
        if (targetWord.i.includes("مَبْنِيٌّ") && !targetWord.i.includes("وَعَلَامَةُ")) {
          continue;
        }

        const segIndex = depNode.si ?? 0;
        const seg = targetWord.s[segIndex] ?? targetWord.s.find((s) => s.k === "m") ?? targetWord.s[0];
        const rawCase = seg?.f?.case as QuizCase | undefined;
        if (!rawCase || !["NOM", "ACC", "GEN"].includes(rawCase)) continue;

        const meta = extractIrabMeta(targetWord.i, rawCase);
        if (!meta || meta.stemRole === "SKIP") continue;

        let relation: QuizRelation = tbRelation;
        if (meta.stemRole && meta.stemRole !== tbRelation) {
          if (meta.hasElidedGovernor) {
            continue;
          }
          if (
            (tbRelation === "app" && meta.stemRole === "adj") ||
            ((tbRelation === "obj" || tbRelation === "circ") && meta.stemRole === "cog") ||
            (tbRelation === "gen" && meta.stemRole === "poss") ||
            (tbRelation === "subj" && meta.stemRole === "subjx") ||
            ((tbRelation === "obj" || tbRelation === "cog") && meta.stemRole === "circ") ||
            ((tbRelation === "spec" || tbRelation === "circ") && meta.stemRole === "obj")
          ) {
            relation = meta.stemRole;
          } else if (tbRelation === "adj" && meta.stemRole === "pred" && meta.isMultiKhabar) {
            // Walk up the adj chain to find the governing mubtada / nasikh
            let curNodeIdx = edge.h;
            let resolvedHead: Word | undefined;
            for (let depth = 0; depth < 5; depth++) {
              const parentEdge = graph.edges.find((e) => e.d === curNodeIdx);
              if (!parentEdge) break;
              const pRel = normalizeRelation(parentEdge.r);
              const pHeadNode = graph.nodes[parentEdge.h];
              if (pRel === "pred" && pHeadNode?.t === "seg" && pHeadNode.s === file.n && pHeadNode.v === verse.v && pHeadNode.w) {
                resolvedHead = verse.w.find((w) => w.n === pHeadNode.w);
                break;
              }
              if (pRel === "adj") {
                curNodeIdx = parentEdge.h;
              } else {
                break;
              }
            }
            if (!resolvedHead || resolvedHead.n === targetWord.n) continue;
            headWord = resolvedHead;
            relation = "pred";
          } else {
            // Incompatible syntactic analysis between treebank and classical i'rab
            continue;
          }
        }

        const id = `${file.n}:${verse.v}:${targetWord.n}:${relation}`;
        if (questions.some((q) => q.id === id)) continue;

        const isSecondarySign = !["damma", "fatha", "kasra"].includes(meta.sign);
        const isAdvancedRole = ["pass", "circ", "cog", "app", "spec", "subjx", "pred"].includes(relation);

        questions.push({
          id,
          sura: file.n,
          suraName: file.name,
          suraPhonetic: file.phonetic,
          verse,
          targetWord,
          headWord,
          relation,
          grammaticalCase: meta.grammaticalCase,
          sign: meta.sign,
          signDetailAr: meta.detailAr,
          classicalIrab: targetWord.i,
          clauseWords: clauseWords.length > 0 ? clauseWords : verse.w,
          isAdvanced: isSecondarySign || isAdvancedRole,
        });
      }
    }
  }

  return questions;
}

export function getRoleMeta(code: QuizRelation): RoleMeta {
  return QUIZ_ROLES.find((r) => r.code === code) ?? QUIZ_ROLES[0];
}

export function getCaseMeta(code: QuizCase): CaseMeta {
  return QUIZ_CASES.find((c) => c.code === code) ?? QUIZ_CASES[0];
}

export function getSignMeta(code: QuizSign): SignMeta {
  return QUIZ_SIGNS.find((s) => s.code === code) ?? QUIZ_SIGNS[0];
}

function spaceRootLetters(text: string): string {
  const bare = stripHarakat(text).replace(/\s+/g, "");
  return [...bare].join(" ");
}

export type QuizLens = "irab" | "sarf" | "examples";

interface ChoiceOption {
  code: string;
  ar: string;
  sub: { ar: string; en: string; id: string };
}

export interface SarfQuestion {
  id: string;
  sura: number;
  suraName: string;
  suraPhonetic: string;
  verse: Verse;
  targetWord: Word;
  headAr: string;
  kind: "verb" | "noun";
  rootRaw: string;
  rootSpaced: string;
  wazn: string;
  classCode: string;
  structureCode: string;
  rootOptions: ChoiceOption[];
  waznOptions: ChoiceOption[];
  classOptions: ChoiceOption[];
  structureOptions: ChoiceOption[];
  asl?: string;
  singular?: string;
  classicalSarf: string;
  classicalMeaning?: string;
  searchSeed: Partial<ExampleQuery>;
}

export interface ExampleHuntQuestion {
  id: string;
  sura: number;
  suraName: string;
  suraPhonetic: string;
  verse: Verse;
  targetWord: Word;
  facetTitle: { ar: string; en: string; id: string };
  facetHint: { ar: string; en: string; id: string };
  facetCategory: "form" | "deriv" | "syntax" | "plural";
  targetWazn: string;
  targetRootSpaced: string;
  classicalSarf: string;
  classicalIrab?: string;
  classicalMeaning?: string;
  searchSeed: Partial<ExampleQuery>;
}

export const SARF_CLASSES: Record<string, { ar: string; arSub: string; en: string; id: string; kind: "verb" | "noun" }> = {
  "نَصَرَ يَنْصُرُ": { ar: "باب نَصَرَ يَنْصُرُ", arSub: "ثلاثي مجرد · فَعَلَ يَفْعُلُ", en: "Form I · faʿala yafʿulu (u-vowel)", id: "Bab nashara yanshuru (fathah-dhammah)", kind: "verb" },
  "ضَرَبَ يَضْرِبُ": { ar: "باب ضَرَبَ يَضْرِبُ", arSub: "ثلاثي مجرد · فَعَلَ يَفْعِلُ", en: "Form I · faʿala yafʿilu (i-vowel)", id: "Bab dharaba yadhribu (fathah-kasrah)", kind: "verb" },
  "فَتَحَ يَفْتَحُ": { ar: "باب فَتَحَ يَفْتَحُ", arSub: "ثلاثي مجرد · فَعَلَ يَفْعَلُ", en: "Form I · faʿala yafʿalu (a-vowel)", id: "Bab fataha yaftahu (fathah-fathah)", kind: "verb" },
  "عَلِمَ يَعْلَمُ": { ar: "باب عَلِمَ يَعْلَمُ", arSub: "ثلاثي مجرد · فَعِلَ يَفْعَلُ", en: "Form I · faʿila yafʿalu (stative)", id: "Bab 'alima ya'lamu (kasrah-fathah)", kind: "verb" },
  "شَرُفَ يَشْرُفُ": { ar: "باب شَرُفَ يَشْرُفُ", arSub: "ثلاثي مجرد · فَعُلَ يَفْعُلُ", en: "Form I · faʿula yafʿulu (innate quality)", id: "Bab syarufa yasyrufu (dhammah-dhammah)", kind: "verb" },
  "وَرِثَ يَرِثُ": { ar: "باب وَرِثَ يَرِثُ (حَسِبَ يَحْسِبُ)", arSub: "ثلاثي مجرد · فَعِلَ يَفْعِلُ", en: "Form I · faʿila yafʿilu", id: "Bab waritsa yaritsu (kasrah-kasrah)", kind: "verb" },
  "أَفْعَلَ": { ar: "باب أَفْعَلَ", arSub: "ثلاثي مزيد بالهمزة (للتعدية غالباً)", en: "Form IV · Afʿala (causative)", id: "Wazan IV · Af'ala (kausatif/transitif)", kind: "verb" },
  "فَعَّلَ": { ar: "باب فَعَّلَ", arSub: "ثلاثي مزيد بتضعيف العين (للتكثير)", en: "Form II · Faʿʿala (intensive/causative)", id: "Wazan II · Fa''ala (intensif/transitif)", kind: "verb" },
  "فَاعَلَ": { ar: "باب فَاعَلَ", arSub: "ثلاثي مزيد بالألف (للمشاركة)", en: "Form III · Fāʿala (mutual/associative)", id: "Wazan III · Fa'ala (resiprokal)", kind: "verb" },
  "افْتَعَلَ": { ar: "باب افْتَعَلَ", arSub: "خماسي مزيد بالألف والتاء", en: "Form VIII · Iftaʿala (reflexive/middle)", id: "Wazan VIII · Ifta'ala (refleksif)", kind: "verb" },
  "تَفَعَّلَ": { ar: "باب تَفَعَّلَ", arSub: "خماسي مزيد بالتاء والتضعيف", en: "Form V · Tafaʿʿala (reflexive of II)", id: "Wazan V · Tafa''ala (refleksif pola II)", kind: "verb" },
  "تَفَاعَلَ": { ar: "باب تَفَاعَلَ", arSub: "خماسي مزيد بالتاء والألف (للتشارك)", en: "Form VI · Tafāʿala (mutual reflexive)", id: "Wazan VI · Tafa'ala (saling/refleksif)", kind: "verb" },
  "انْفَعَلَ": { ar: "باب انْفَعَلَ", arSub: "خماسي مزيد بالألف والنون (للمطاوعة)", en: "Form VII · Infaʿala (mediopassive)", id: "Wazan VII · Infa'ala (mutawa'ah/pasif)", kind: "verb" },
  "اسْتَفْعَلَ": { ar: "باب اسْتَفْعَلَ", arSub: "سداسي مزيد بالسين والتاء (للطلب)", en: "Form X · Istafʿala (seeking/deeming)", id: "Wazan X · Istaf'ala (memohon/mencari)", kind: "verb" },
  "اسم فاعل": { ar: "اسم فاعل", arSub: "مشتق يدل على من قام بالفعل", en: "Active Participle (Ism Fāʿil)", id: "Isim Fa'il (Partisipel Aktif)", kind: "noun" },
  "اسم مفعول": { ar: "اسم مفعول", arSub: "مشتق يدل على من وقع عليه الفعل", en: "Passive Participle (Ism Mafʿūl)", id: "Isim Maf'ul (Partisipel Pasif)", kind: "noun" },
  "صفة مشبهة": { ar: "صفة مشبهة", arSub: "مشتق يدل على ثبوت الصفة في صاحبها", en: "Assimilated Adjective (Ṣifa Mushabbaha)", id: "Sifat Musyabbahah (Sifat Tetap)", kind: "noun" },
  "صيغة مبالغة": { ar: "صيغة مبالغة", arSub: "مشتق يدل على الكثرة والمبالغة في الوصف", en: "Intensive Noun (Ṣīghat Mubālagha)", id: "Shighah Mubalaghah (Bentuk Intensif)", kind: "noun" },
  "أفعل التفضيل": { ar: "أفعل التفضيل", arSub: "مشتق يدل على المشاركة والزيادة في الصفة", en: "Elative / Comparative (Ism Tafḍīl)", id: "Isim Tafdhil (Komparatif/Superlatif)", kind: "noun" },
  "مصدر": { ar: "مصدر (حدث)", arSub: "ما دلّ على الحدث مجرداً من الزمان", en: "Verbal Noun (Maṣdar)", id: "Masdar (Nomina Verbal)", kind: "noun" },
  "اسم مكان / زمان": { ar: "اسم مكان أو زمان", arSub: "مشتق يدل على موضع الفعل أو زمانه", en: "Noun of Place or Time (Ism Makān/Zamān)", id: "Isim Makan / Zaman (Tempat/Waktu)", kind: "noun" },
  "اسم جامد": { ar: "اسم جامد", arSub: "اسم غير مأخوذ من فعل (ذات أو معنى)", en: "Primitive / Underived Noun (Jāmid)", id: "Isim Jamid (Bukan Kata Turunan)", kind: "noun" },
};

export const SARF_STRUCTURES: Record<string, { ar: string; arSub: string; en: string; id: string; kind: "verb" | "noun" }> = {
  "صحيح سالم": { ar: "صحيح سالم", arSub: "خلت أصوله من الهمز والتضعيف والعلة", en: "Sound Root (Ṣaḥīḥ Sālim — no weak/hamza/geminate)", id: "Shahih Salim (Tanpa huruf illat/hamzah/tadh'if)", kind: "verb" },
  "صحيح مهموز": { ar: "صحيح مهموز", arSub: "أحد حروفه الأصلية همزة", en: "Hamzated Sound Root (Mahmūz)", id: "Shahih Mahmuz (Berhuruf akar hamzah)", kind: "verb" },
  "صحيح مضعف": { ar: "صحيح مضعف", arSub: "عينه ولامه من جنس واحد", en: "Geminate Root (Muḍaʿʿaf — 2nd & 3rd identical)", id: "Shahih Mudha''af (Ain & Lam fi'il kembar)", kind: "verb" },
  "معتل مثال": { ar: "معتل مثال (الفاء)", arSub: "فاؤه حرف علة (واو أو ياء)", en: "Assimilated Weak 1st Radical (Mithāl — و/ي)", id: "Mu'tal Mitsal (Huruf illat di awal/fa' fi'il)", kind: "verb" },
  "معتل أجوف": { ar: "معتل أجوف (العين)", arSub: "عينه حرف علة (مثل: قَالَ، كَانَ)", en: "Hollow Weak 2nd Radical (Ajwaf — و/ي)", id: "Mu'tal Ajwaf (Huruf illat di tengah/'ain fi'il)", kind: "verb" },
  "معتل ناقص": { ar: "معتل ناقص (اللام)", arSub: "لامه حرف علة (مثل: دَعَا، هَدَى)", en: "Defective Weak 3rd Radical (Nāqiṣ — و/ي)", id: "Mu'tal Naqish (Huruf illat di akhir/lam fi'il)", kind: "verb" },
  "معتل لفيف": { ar: "معتل لفيف (حرفا علة)", arSub: "اجتمع في أصوله حرفا علة (مقرون أو مفروق)", en: "Doubly Weak Root (Lafīf — two weak radicals)", id: "Mu'tal Lafif (Dua huruf illat dalam akar)", kind: "verb" },
  "مفرد": { ar: "مفرد", arSub: "ما دلّ على واحد أو واحدة", en: "Singular Noun (Mufrad)", id: "Mufrad (Tunggal)", kind: "noun" },
  "مثنى": { ar: "مثنى", arSub: "ما دلّ على اثنين بزيادة ألف ونون أو ياء ونون", en: "Dual Noun (Muthannā)", id: "Mutsanna (Dual)", kind: "noun" },
  "جمع مذكر سالم": { ar: "جمع مذكر سالم", arSub: "ما جُمع بواو ونون أو ياء ونون", en: "Sound Masculine Plural (-ūna / -īna)", id: "Jamak Mudzakkar Salim", kind: "noun" },
  "جمع مؤنث سالم": { ar: "جمع مؤنث سالم", arSub: "ما جُمع بألف وتاء مزيدتين", en: "Sound Feminine Plural (-āt)", id: "Jamak Muannats Salim", kind: "noun" },
  "جمع تكسير للقلة": { ar: "جمع تكسير للقلة", arSub: "تغيرت صورة مفرده (أَفْعَال / أَفْعُل / أَفْعِلَة / فِعْلَة)", en: "Broken Plural of Paucity (Jamʿ Qilla)", id: "Jamak Taksir Qillah (أفعال / أفعل / أفعلة / فعلة)", kind: "noun" },
  "جمع تكسير للكثرة": { ar: "جمع تكسير للكثرة", arSub: "تغيرت فيه بنية المفرد لأوزان الكثرة", en: "Broken Plural of Multitude (Jamʿ Kathra)", id: "Jamak Taksir Katsrah (Pola internal berubah)", kind: "noun" },
};

const BLOCK_RE = /\{([^}]*)\}:\s*([^{]*)/g;
const PAREN_RE = /\(([^)]*)\)/;

function hashCode(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededShuffle<T>(items: T[], seedStr: string): T[] {
  const out = [...items];
  let seed = hashCode(seedStr) || 1;
  for (let i = out.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = seed % (i + 1);
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

function extractParen(text: string): string {
  const m = text.match(PAREN_RE);
  return m ? m[1].trim() : "";
}

interface ParsedSarfBlock {
  headAr: string;
  kind: "verb" | "noun";
  wazn: string;
  rootRaw: string;
  bab?: string;
  deriv?: string;
  weakClass?: string;
  numberClass?: string;
  asl?: string;
  singular?: string;
}

function normalizeWeakClass(cleanPart: string): string | undefined {
  if (cleanPart.startsWith("صحيح سالم")) return "صحيح سالم";
  if (cleanPart.startsWith("صحيح مهموز")) return "صحيح مهموز";
  if (cleanPart.startsWith("صحيح مضعف")) return "صحيح مضعف";
  if (cleanPart.startsWith("معتل مثال") || cleanPart.startsWith("مثال ")) return "معتل مثال";
  if (cleanPart.startsWith("معتل أجوف") || cleanPart.startsWith("أجوف ") || cleanPart.startsWith("اجوف ")) return "معتل أجوف";
  if (cleanPart.startsWith("معتل ناقص") || cleanPart.startsWith("ناقص ")) return "معتل ناقص";
  if (cleanPart.startsWith("معتل لفيف") || cleanPart.startsWith("لفيف ")) return "معتل لفيف";
  return undefined;
}

function normalizeDerivClass(cleanPart: string): string | undefined {
  if (cleanPart.startsWith("اسم فاعل")) return "اسم فاعل";
  if (cleanPart.startsWith("اسم مفعول")) return "اسم مفعول";
  if (cleanPart.startsWith("صفة مشبهة")) return "صفة مشبهة";
  if (cleanPart.startsWith("صيغة مبالغة")) return "صيغة مبالغة";
  if (cleanPart.startsWith("أفعل التفضيل")) return "أفعل التفضيل";
  if (cleanPart.startsWith("مصدر")) return "مصدر";
  if (cleanPart.startsWith("اسم مكان") || cleanPart.startsWith("اسم زمان")) return "اسم مكان / زمان";
  return undefined;
}

function parseSarfFromWord(word: Word): ParsedSarfBlock | null {
  const sf = word.sf;
  if (!sf) return null;
  BLOCK_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = BLOCK_RE.exec(sf)) !== null) {
    const headAr = match[1].trim();
    const rawParts = match[2]
      .split("،")
      .map((s) => s.replace(/^[.\s]+|[.\s]+$/g, ""))
      .filter(Boolean);
    if (rawParts.length === 0) continue;

    const cleanParts = rawParts.map((p) => stripHarakat(p));
    const first = cleanParts[0];
    let kind: "verb" | "noun" | null = null;
    if (first.startsWith("فعل")) kind = "verb";
    else if (first === "اسم") kind = "noun";
    if (!kind) continue;

    let wazn = "";
    let rootRaw = "";
    let bab: string | undefined;
    let deriv: string | undefined;
    let isJamid = false;
    let weakClass: string | undefined;
    let numberClass: string | undefined;
    let asl: string | undefined;
    let singular: string | undefined;

    for (let i = 0; i < rawParts.length; i++) {
      const raw = rawParts[i];
      const clean = cleanParts[i];
      if (clean.startsWith("على وزن:")) {
        wazn = extractParen(raw);
      } else if (clean.startsWith("من مادة:")) {
        rootRaw = stripHarakat(extractParen(raw)).replace(/\s+/g, "");
      } else if (clean.startsWith("من باب:")) {
        const b = extractParen(raw);
        if (b && SARF_CLASSES[b]) bab = b;
      } else if (clean.startsWith("أصله:")) {
        asl = extractParen(raw);
      } else if (clean.startsWith("مفرده:")) {
        singular = extractParen(raw);
      } else if (clean === "جامد") {
        isJamid = true;
      } else if (clean in SARF_STRUCTURES && SARF_STRUCTURES[clean].kind === "noun") {
        numberClass = clean;
      }

      if (!weakClass) {
        weakClass = normalizeWeakClass(clean);
      }
      if (!deriv) {
        deriv = normalizeDerivClass(clean);
      }
    }

    if (kind === "noun" && !deriv && isJamid) {
      deriv = "اسم جامد";
    }
    if (!wazn || !rootRaw || rootRaw.length < 2) continue;

    return {
      headAr,
      kind,
      wazn,
      rootRaw,
      bab,
      deriv,
      weakClass,
      numberClass,
      asl,
      singular,
    };
  }
  return null;
}

function sharedLettersCount(a: string, b: string): number {
  const setB = new Set(b.split(""));
  let count = 0;
  for (const ch of new Set(a.split(""))) {
    if (setB.has(ch)) count++;
  }
  return count;
}

export interface QuizPools {
  sarf: SarfQuestion[];
  examples: ExampleHuntQuestion[];
}

export function extractQuizPools(files: SurahFile[]): QuizPools {
  interface RawEntry {
    sura: number;
    suraName: string;
    suraPhonetic: string;
    verse: Verse;
    word: Word;
    parsed: ParsedSarfBlock;
  }

  const entries: RawEntry[] = [];
  const allRoots = new Set<string>();
  const verbWazns = new Set<string>();
  const nounWazns = new Set<string>();

  for (const file of files) {
    for (const verse of file.verses) {
      for (const word of verse.w) {
        const parsed = parseSarfFromWord(word);
        if (!parsed) continue;
        entries.push({
          sura: file.n,
          suraName: file.name,
          suraPhonetic: file.phonetic,
          verse,
          word,
          parsed,
        });
        if (parsed.rootRaw.length >= 3) {
          allRoots.add(parsed.rootRaw);
        }
        if (parsed.kind === "verb") verbWazns.add(parsed.wazn);
        else nounWazns.add(parsed.wazn);
      }
    }
  }

  const rootArray = Array.from(allRoots);
  const verbWaznArray = Array.from(verbWazns);
  const nounWaznArray = Array.from(nounWazns);
  const verbClassKeys = Object.keys(SARF_CLASSES).filter((k) => SARF_CLASSES[k].kind === "verb");
  const nounClassKeys = Object.keys(SARF_CLASSES).filter((k) => SARF_CLASSES[k].kind === "noun");
  const verbStructKeys = Object.keys(SARF_STRUCTURES).filter((k) => SARF_STRUCTURES[k].kind === "verb");
  const nounStructKeys = Object.keys(SARF_STRUCTURES).filter((k) => SARF_STRUCTURES[k].kind === "noun");

  function buildRootOptions(correctRaw: string, seedId: string): ChoiceOption[] {
    const near = rootArray.filter(
      (r) => r !== correctRaw && r.length === correctRaw.length && sharedLettersCount(r, correctRaw) >= 2,
    );
    const anagrams = near.filter((r) => r.split("").sort().join("") === correctRaw.split("").sort().join(""));
    const picked: string[] = [];
    const seen = new Set<string>([correctRaw]);
    for (const pool of [
      seededShuffle(anagrams, `${seedId}:anag`),
      seededShuffle(near, `${seedId}:near`),
      seededShuffle(rootArray, `${seedId}:all`),
    ]) {
      for (const cand of pool) {
        if (!seen.has(cand)) {
          seen.add(cand);
          picked.push(cand);
          if (picked.length === 3) break;
        }
      }
      if (picked.length === 3) break;
    }

    const allFour = seededShuffle([correctRaw, ...picked], `${seedId}:roots`);
    return allFour.map((r) => ({
      code: r,
      ar: spaceRootLetters(r),
      sub: {
        ar: `مادة (${r})`,
        en: `Root (${spaceRootLetters(r)})`,
        id: `Akar kata (${spaceRootLetters(r)})`,
      },
    }));
  }

  function buildWaznOptions(correctWazn: string, kind: "verb" | "noun", seedId: string): ChoiceOption[] {
    const pool = kind === "verb" ? verbWaznArray : nounWaznArray;
    const cleanTarget = stripHarakat(correctWazn);
    const sameSkeleton = pool.filter((w) => w !== correctWazn && stripHarakat(w) === cleanTarget);
    const similarLen = pool.filter(
      (w) => w !== correctWazn && Math.abs(stripHarakat(w).length - cleanTarget.length) <= 1,
    );
    const picked: string[] = [];
    const seen = new Set<string>([correctWazn]);
    for (const src of [
      seededShuffle(sameSkeleton, `${seedId}:sk`),
      seededShuffle(similarLen, `${seedId}:len`),
      seededShuffle(pool, `${seedId}:wz`),
    ]) {
      for (const w of src) {
        if (!seen.has(w)) {
          seen.add(w);
          picked.push(w);
          if (picked.length === 3) break;
        }
      }
      if (picked.length === 3) break;
    }
    return seededShuffle([correctWazn, ...picked], `${seedId}:waznOrder`).map((w) => ({
      code: w,
      ar: w,
      sub: {
        ar: kind === "verb" ? "ميزان الفعل" : "ميزان الاسم",
        en: kind === "verb" ? "Verbal measure (mīzān)" : "Nominal measure (mīzān)",
        id: kind === "verb" ? "Wazan fi'il" : "Wazan isim",
      },
    }));
  }

  const sarfQuestions: SarfQuestion[] = [];

  for (const entry of entries) {
    const { sura, suraName, suraPhonetic, verse, word, parsed } = entry;
    const stemSeg = word.s.find((s) => s.k === "m") ?? word.s[0];
    const searchSeed: Partial<ExampleQuery> = {
      root: parsed.rootRaw,
      ...(stemSeg?.f?.form ? { form: stemSeg.f.form, pos: "V" } : {}),
    };

    const classCode = parsed.kind === "verb" ? parsed.bab : parsed.deriv;
    const structureCode = parsed.kind === "verb" ? parsed.weakClass : parsed.numberClass;

    if (
      classCode &&
      structureCode &&
      SARF_CLASSES[classCode] &&
      SARF_STRUCTURES[structureCode] &&
      // Skip ultra-repetitive jamid singular nouns unless they have an asl or plural
      !(parsed.kind === "noun" && classCode === "اسم جامد" && structureCode === "مفرد" && !parsed.asl)
    ) {
      const id = `sarf:${sura}:${verse.v}:${word.n}`;
      const classPool = parsed.kind === "verb" ? verbClassKeys : nounClassKeys;
      const structPool = parsed.kind === "verb" ? verbStructKeys : nounStructKeys;

      const classFoils = seededShuffle(
        classPool.filter((k) => k !== classCode),
        `${id}:cls`,
      ).slice(0, 3);
      const structFoils = seededShuffle(
        structPool.filter((k) => k !== structureCode),
        `${id}:str`,
      ).slice(0, 3);

      const classOptions: ChoiceOption[] = seededShuffle([classCode, ...classFoils], `${id}:clsOrd`).map((k) => ({
        code: k,
        ar: SARF_CLASSES[k].ar,
        sub: {
          ar: SARF_CLASSES[k].arSub,
          en: SARF_CLASSES[k].en,
          id: SARF_CLASSES[k].id,
        },
      }));

      const structureOptions: ChoiceOption[] = seededShuffle([structureCode, ...structFoils], `${id}:strOrd`).map(
        (k) => ({
          code: k,
          ar: SARF_STRUCTURES[k].ar,
          sub: {
            ar: SARF_STRUCTURES[k].arSub,
            en: SARF_STRUCTURES[k].en,
            id: SARF_STRUCTURES[k].id,
          },
        }),
      );

      sarfQuestions.push({
        id,
        sura,
        suraName,
        suraPhonetic,
        verse,
        targetWord: word,
        headAr: parsed.headAr,
        kind: parsed.kind,
        rootRaw: parsed.rootRaw,
        rootSpaced: spaceRootLetters(parsed.rootRaw),
        wazn: parsed.wazn,
        classCode,
        structureCode,
        rootOptions: buildRootOptions(parsed.rootRaw, id),
        waznOptions: buildWaznOptions(parsed.wazn, parsed.kind, id),
        classOptions,
        structureOptions,
        asl: parsed.asl,
        singular: parsed.singular,
        classicalSarf: word.sf || "",
        classicalMeaning: word.m,
        searchSeed,
      });
    }
  }

  // Build ExampleHuntQuestion pool (Ayah Pattern Spotter)
  interface FacetRule {
    code: string;
    category: "form" | "deriv" | "syntax" | "plural";
    title: { ar: string; en: string; id: string };
    hint: { ar: string; en: string; id: string };
    matches: (w: Word, p: ParsedSarfBlock | null) => boolean;
    seed: (p: ParsedSarfBlock) => Partial<ExampleQuery>;
  }

  const FACET_RULES: FacetRule[] = [
    {
      code: "form_VIII",
      category: "form",
      title: {
        ar: "فعل مزيد على باب (افْتَعَلَ)",
        en: "Form VIII Verb (Iftaʿala)",
        id: "Fi'il Mazid Wazan VIII (Ifta'ala)",
      },
      hint: {
        ar: "فعل خماسي مزيد بالألف والتاء (مثل: اتَّقُوا، ابتغوا، استمعوا)",
        en: "A 5-letter verb augmented with alif and infixed tāʾ (often assimilated, like ittaqū)",
        id: "Fi'il lima huruf dengan tambahan alif dan ta' (sering mengalami idgham seperti ittaqu)",
      },
      matches: (_w, p) => p?.kind === "verb" && p.bab === "افْتَعَلَ",
      seed: () => ({ pos: "V", form: "VIII" }),
    },
    {
      code: "form_IV",
      category: "form",
      title: {
        ar: "فعل مزيد على باب (أَفْعَلَ)",
        en: "Form IV Verb (Afʿala)",
        id: "Fi'il Mazid Wazan IV (Af'ala)",
      },
      hint: {
        ar: "فعل رباعي مزيد بالهمزة في أوله يفيد التعدية غالباً (مثل: آمَنُوا، أَنزَلَ، يُخْرِبُونَ)",
        en: "A causative 4-letter verb augmented with hamza (often elided in the imperfect)",
        id: "Fi'il empat huruf dengan tambahan hamzah (sering dibuang pada mudhari')",
      },
      matches: (_w, p) => p?.kind === "verb" && p.bab === "أَفْعَلَ",
      seed: () => ({ pos: "V", form: "IV" }),
    },
    {
      code: "form_X",
      category: "form",
      title: {
        ar: "فعل مزيد على باب (اسْتَفْعَلَ)",
        en: "Form X Verb (Istafʿala)",
        id: "Fi'il Mazid Wazan X (Istaf'ala)",
      },
      hint: {
        ar: "فعل سداسي مزيد بالسين والتاء يدل على الطلب أو الصيرورة (مثل: نَسْتَعِينُ، اسْتَغْفِرْ)",
        en: "A 6-letter verb with sīn and tāʾ expressing seeking or requesting",
        id: "Fi'il enam huruf dengan tambahan sin dan ta' yang bermakna memohon/mencari",
      },
      matches: (_w, p) => p?.kind === "verb" && p.bab === "اسْتَفْعَلَ",
      seed: () => ({ pos: "V", form: "X" }),
    },
    {
      code: "form_II_V",
      category: "form",
      title: {
        ar: "فعل مضعف العين (فَعَّلَ / تَفَعَّلَ)",
        en: "Geminate-Stem Verb · Form II / V (Faʿʿala / Tafaʿʿala)",
        id: "Fi'il Bertadh'if Ain · Wazan II / V (Fa''ala / Tafa''ala)",
      },
      hint: {
        ar: "فعل مزيد بتضعيف عينه للتكثير أو التدرج (مثل: قَدَّمَتْ، سَبِّحْ، يَتَفَكَّرُونَ)",
        en: "A verb augmented by doubling its middle radical for intensity or gradation",
        id: "Fi'il dengan penggandaan huruf tengah ('ain fi'il) untuk intensitas",
      },
      matches: (_w, p) => p?.kind === "verb" && (p.bab === "فَعَّلَ" || p.bab === "تَفَعَّلَ"),
      seed: (p) => ({ pos: "V", form: p.bab === "تَفَعَّلَ" ? "V" : "II" }),
    },
    {
      code: "deriv_fail",
      category: "deriv",
      title: {
        ar: "اسم فاعل (مشتق يدل على من قام بالفعل)",
        en: "Active Participle (Ism Fāʿil)",
        id: "Isim Fa'il (Partisipel Aktif)",
      },
      hint: {
        ar: "يصاغ من الثلاثي على (فَاعِل) ومن غيره بضم أوله وكسر ما قبل آخره",
        en: "Formed on fāʿil (Form I) or with prefix mu- and kasra before the final radical",
        id: "Dibentuk dengan pola fa'il (tsulatsi) atau awalan mu- dengan kasrah sebelum akhir",
      },
      matches: (_w, p) => p?.kind === "noun" && p.deriv === "اسم فاعل",
      seed: (p) => ({ root: p.rootRaw, pos: "N,ADJ" }),
    },
    {
      code: "deriv_sifa_mubalagha",
      category: "deriv",
      title: {
        ar: "صفة مشبهة أو صيغة مبالغة",
        en: "Intensive or Assimilated Adjective (Ṣifa Mushabbaha / Mubālagha)",
        id: "Sifat Musyabbahah atau Shighah Mubalaghah",
      },
      hint: {
        ar: "وصف يدل على الثبوت أو الكثرة (على أوزان مثل: فَعِيل، فَعُول، فَعَّال، فَعْلَان)",
        en: "Describes an enduring or intensive attribute (patterns like faʿīl, faʿūl, faʿʿāl)",
        id: "Kata sifat yang menunjukkan ketetapan atau intensitas tinggi (seperti fa'il, fa'ul, fa''al)",
      },
      matches: (_w, p) => p?.kind === "noun" && (p.deriv === "صفة مشبهة" || p.deriv === "صيغة مبالغة"),
      seed: (p) => ({ root: p.rootRaw }),
    },
    {
      code: "deriv_tafdil",
      category: "deriv",
      title: {
        ar: "أفعل التفضيل (اسم تفضيل)",
        en: "Elative / Superlative Noun (Ism Tafḍīl)",
        id: "Isim Tafdhil (Komparatif / Superlatif)",
      },
      hint: {
        ar: "اسم مشتق على وزن (أَفْعَل) أو (فُعْلَى) أو (خَيْر / شَرّ) يدل على الزيادة في الصفة",
        en: "Pattern afʿal / fuʿlā (or khayr / sharr) indicating superiority in a quality",
        id: "Wazan af'al / fu'la (atau khair / syarr) yang menunjukkan makna lebih/paling",
      },
      matches: (_w, p) => p?.kind === "noun" && p.deriv === "أفعل التفضيل",
      seed: (p) => ({ root: p.rootRaw }),
    },
    {
      code: "plural_taksir",
      category: "plural",
      title: {
        ar: "جمع تكسير (تغيرت فيه صورة المفرد)",
        en: "Broken Plural (Jamʿ Taksīr)",
        id: "Jamak Taksir (Jamak Tak Beraturan)",
      },
      hint: {
        ar: "جمع تتغير فيه بنية المفرد على أوزان مثل: أَفْعَال، فُعُول، فِعَال، فَوَاعِل، قُرَى",
        en: "A plural formed by shifting the internal vowel/consonant pattern rather than adding -ūna/-āt",
        id: "Bentuk jamak dengan perubahan pola internal dari bentuk mufradnya",
      },
      matches: (_w, p) =>
        p?.kind === "noun" &&
        (p.numberClass === "جمع تكسير للقلة" || p.numberClass === "جمع تكسير للكثرة"),
      seed: (p) => ({ root: p.rootRaw, pos: "N" }),
    },
    {
      code: "syntax_mansubat",
      category: "syntax",
      title: {
        ar: "منصوب بياني (حال أو تمييز أو مفعول مطلق)",
        en: "Adverbial Accusative (Ḥāl, Tamyīz, or Mafʿūl Muṭlaq)",
        id: "Manshub Keterangan (Hal, Tamyiz, atau Maf'ul Muthlaq)",
      },
      hint: {
        ar: "اسم منصوب يبين الهيئة (حال)، أو يزيل الإبهام (تمييز)، أو يؤكد الفعل بمصدره (مفعول مطلق)",
        en: "An accusative noun describing state (ḥāl), specification (tamyīz), or cognate emphasis",
        id: "Isim manshub yang menjelaskan keadaan (hal), rincian (tamyiz), atau penegasan (maf'ul muthlaq)",
      },
      matches: (w) => {
        const cleanI = stripHarakat(w.i || "");
        return (
          cleanI.includes("حال منصوب") ||
          cleanI.includes("تمييز منصوب") ||
          cleanI.includes("مفعول مطلق")
        );
      },
      seed: (p) => ({ root: p.rootRaw, relation: "circ,spec,cog" }),
    },
  ];

  const exampleQuestions: ExampleHuntQuestion[] = [];
  for (const file of files) {
    for (const verse of file.verses) {
      if (verse.w.length < 3 || verse.w.length > 26) continue;
      const parsedMap = new Map<number, ParsedSarfBlock | null>();
      for (const w of verse.w) {
        parsedMap.set(w.n, parseSarfFromWord(w));
      }

      for (const rule of FACET_RULES) {
        const matchingWords = verse.w.filter((w) => rule.matches(w, parsedMap.get(w.n) ?? null));
        if (matchingWords.length !== 1) continue;
        const targetWord = matchingWords[0];
        const parsed = parsedMap.get(targetWord.n);
        if (!parsed) continue;

        const id = `ex:${file.n}:${verse.v}:${targetWord.n}:${rule.code}`;

        exampleQuestions.push({
          id,
          sura: file.n,
          suraName: file.name,
          suraPhonetic: file.phonetic,
          verse,
          targetWord,
          facetTitle: rule.title,
          facetHint: rule.hint,
          facetCategory: rule.category,
          targetWazn: parsed.wazn,
          targetRootSpaced: spaceRootLetters(parsed.rootRaw),
          classicalSarf: targetWord.sf || "",
          classicalIrab: targetWord.i,
          classicalMeaning: targetWord.m,
          searchSeed: rule.seed(parsed),
        });
      }
    }
  }

  return {
    sarf: sarfQuestions,
    examples: exampleQuestions,
  };
}

export function getLensLabel(lens: QuizLens, locale: Locale): { title: string; badge: string } {
  const map: Record<QuizLens, Record<Locale, { title: string; badge: string }>> = {
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
  };
  return map[lens][locale];
}
