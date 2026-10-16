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
  | "circ";

export type QuizCase = "NOM" | "ACC" | "GEN";

export type QuizSign =
  | "damma"
  | "fatha"
  | "kasra"
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
}

export interface RoleMeta {
  code: QuizRelation;
  ar: string;
  en: string;
  id: string;
  family: "core" | "nom" | "clause";
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
    governorLabel: { ar: "الفعل العامل", en: "Governing Verb (Fiʿl)", id: "Fi'il Pengampu" },
    governorPrompt: {
      ar: "اختر الفعل الذي رَفَع هذا الفاعل من الآية",
      en: "Select the verb (fiʿl) in the ayah for which this word is the fāʿil",
      id: "Pilih kata kerja (fi'il) pada ayat yang menjadi pengampu fa'il ini",
    },
    defaultCase: "NOM",
  },
  {
    code: "obj",
    ar: "مفعول به",
    en: "Direct Object (Mafʿūl bihi)",
    id: "Objek (Mafʿūl bih)",
    family: "core",
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
    governorLabel: { ar: "الناسخ أو المسند", en: "Nāsikh or Predicate Head", id: "amil Nasikh / Khabar" },
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
    governorLabel: { ar: "المبتدأ أو الناسخ", en: "Subject (Mubtadaʾ) or Nāsikh", id: "Mubtada' atau Nasikh" },
    governorPrompt: {
      ar: "اختر المبتدأ أو الناسخ الذي أُخبر عنه بهذا الخبر",
      en: "Select the mubtadaʾ or nāsikh for which this is the khabar",
      id: "Pilih mubtada' atau nasikh dari khabar ini",
    },
  },
  {
    code: "adj",
    ar: "نعت (صفة)",
    en: "Adjective Follower (Naʿt)",
    id: "Sifat (Naʿt)",
    family: "nom",
    governorLabel: { ar: "المنعوت (الموصوف)", en: "Described Noun (Manʿūt)", id: "Kata yang Disifati (Manʿūt)" },
    governorPrompt: {
      ar: "اختر المنعوت الذي يتبعه هذا النعت في الإعراب",
      en: "Select the described noun (manʿūt) that this naʿt follows",
      id: "Pilih kata benda (man'ut) yang diikuti oleh na'at ini",
    },
  },
  {
    code: "poss",
    ar: "مضاف إليه",
    en: "Annexed Noun (Muḍāf ilayhi)",
    id: "Mudhaf Ilaih",
    family: "nom",
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
    governorLabel: { ar: "حرف الجر", en: "Preposition (Ḥarf Jarr)", id: "Huruf Jar" },
    governorPrompt: {
      ar: "اختر حرف الجر العامل في هذا الاسم",
      en: "Select the preposition (ḥarf jarr) governing this noun",
      id: "Pilih huruf jar yang memajrurkan isim ini",
    },
    defaultCase: "GEN",
  },
  {
    code: "conj",
    ar: "معطوف",
    en: "Conjoined (Maʿṭūf)",
    id: "Kata Sambung (Maʿṭūf)",
    family: "clause",
    governorLabel: { ar: "المعطوف عليه", en: "Conjoined Head (Maʿṭūf ʿalayhi)", id: "Ma'thuf 'Alaih" },
    governorPrompt: {
      ar: "اختر المعطوف عليه الذي يتبعه هذا الاسم في الإعراب",
      en: "Select the earlier word (maʿṭūf ʿalayhi) this word is conjoined to",
      id: "Pilih kata sebelumnya (ma'thuf 'alaih) yang diikuti i'rabnya",
    },
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
      ar: "حالة الرفع (الفاعل، المبتدأ، الخبر، التابع للمرفوع)",
      en: "State of rafʿ — subjects, predicates, and nominative followers",
      id: "Kedudukan rafa' — subjek, predikat, atau pengikut marfu'",
    },
  },
  {
    code: "ACC",
    ar: "منصوب",
    en: "Manṣūb (Accusative)",
    id: "Manṣūb (Nashab)",
    shortDesc: {
      ar: "حالة النصب (المفعول به، اسم إنّ، الحال، التابع للمنصوب)",
      en: "State of naṣb — objects, ism inna, adverbs, and accusative followers",
      id: "Kedudukan nashab — objek, isim inna, hal, atau pengikut manshub",
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
  en: string;
  id: string;
  symbol: string;
  category: "primary" | "secondary";
}

export const QUIZ_SIGNS: SignMeta[] = [
  {
    code: "damma",
    ar: "الضمة",
    en: "Ḍamma",
    id: "Dhammah",
    symbol: "ـُ",
    category: "primary",
  },
  {
    code: "fatha",
    ar: "الفتحة",
    en: "Fatḥa",
    id: "Fathah",
    symbol: "ـَ",
    category: "primary",
  },
  {
    code: "kasra",
    ar: "الكسرة",
    en: "Kasra",
    id: "Kasrah",
    symbol: "ـِ",
    category: "primary",
  },
  {
    code: "ya",
    ar: "الياء",
    en: "Al-Yāʾ (Dual / Sound Pl.)",
    id: "Huruf Yāʾ",
    symbol: "ـِيـ",
    category: "secondary",
  },
  {
    code: "waw",
    ar: "الواو",
    en: "Al-Wāw (Sound Masc. Pl.)",
    id: "Huruf Wāw",
    symbol: "ـُو",
    category: "secondary",
  },
  {
    code: "alif",
    ar: "الألف",
    en: "Al-Alif (Dual / Five Nouns)",
    id: "Huruf Alif",
    symbol: "ـَا",
    category: "secondary",
  },
];

export const CURATED_SURAHS = [1, 59, 67, 78, 87, 93, 94, 97, 103, 108, 109, 110, 112, 113, 114];

function extractSignFromIrab(irab: string, grammaticalCase: QuizCase): { sign: QuizSign; detailAr: string } | null {
  if (!irab) return null;
  const clean = irab.replace(/\s+/g, " ");

  if (clean.includes("الضَّمَّةُ الْمُقَدَّرَةُ")) {
    return { sign: "damma", detailAr: "الضمة المقدرة" };
  }
  if (clean.includes("الضَّمَّةُ")) {
    return { sign: "damma", detailAr: "الضمة الظاهرة" };
  }
  if (clean.includes("الْفَتْحَةُ الْمُقَدَّرَةُ")) {
    return { sign: "fatha", detailAr: "الفتحة المقدرة" };
  }
  if (clean.includes("الْفَتْحَةُ") || clean.includes("الْ فَتْحَةُ")) {
    return { sign: "fatha", detailAr: "الفتحة الظاهرة" };
  }
  if (clean.includes("الْكَسْرَةُ الْمُقَدَّرَةُ")) {
    return { sign: "kasra", detailAr: "الكسرة المقدرة" };
  }
  if (clean.includes("الْكَسْرَةُ")) {
    return { sign: "kasra", detailAr: "الكسرة الظاهرة" };
  }
  if (clean.includes("الْيَاءُ") && clean.includes("عَلَامَةُ")) {
    return { sign: "ya", detailAr: "الياء (نيابة عن الحركة)" };
  }
  if (clean.includes("الْوَاوُ") && clean.includes("عَلَامَةُ")) {
    return { sign: "waw", detailAr: "الواو (جمع مذكر سالم / الأسماء الخمسة)" };
  }
  if (clean.includes("الْأَلِفُ") && clean.includes("عَلَامَةُ")) {
    return { sign: "alif", detailAr: "الألف (مثنى / الأسماء الخمسة)" };
  }

  // Fallback to primary sign for the case if classical text is concise
  if (grammaticalCase === "NOM") return { sign: "damma", detailAr: "الضمة" };
  if (grammaticalCase === "ACC") return { sign: "fatha", detailAr: "الفتحة" };
  if (grammaticalCase === "GEN") return { sign: "kasra", detailAr: "الكسرة" };
  return null;
}

function normalizeRelation(raw: string): QuizRelation | null {
  if (raw === "predx") return "pred";
  if (raw === "pass") return "subj";
  const valid: QuizRelation[] = ["subj", "obj", "subjx", "pred", "gen", "poss", "adj", "conj"];
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

        const relation = normalizeRelation(edge.r);
        if (!relation) continue;

        const targetWord = verse.w.find((w) => w.n === depNode.w);
        const headWord = verse.w.find((w) => w.n === headNode.w);
        if (!targetWord || !headWord || !targetWord.i) continue;

        // Avoid words whose stem is a pronoun or مبني where sign is not standard declension
        if (targetWord.i.includes("مَبْنِيٌّ") && !targetWord.i.includes("وَعَلَامَةُ")) {
          continue;
        }

        const segIndex = depNode.si ?? 0;
        const seg = targetWord.s[segIndex] ?? targetWord.s.find((s) => s.k === "m") ?? targetWord.s[0];
        const rawCase = seg?.f?.case as QuizCase | undefined;
        if (!rawCase || !["NOM", "ACC", "GEN"].includes(rawCase)) continue;

        const extractedSign = extractSignFromIrab(targetWord.i, rawCase);
        if (!extractedSign) continue;

        const id = `${file.n}:${verse.v}:${targetWord.n}:${relation}`;
        if (questions.some((q) => q.id === id)) continue;

        questions.push({
          id,
          sura: file.n,
          suraName: file.name,
          suraPhonetic: file.phonetic,
          verse,
          targetWord,
          headWord,
          relation,
          grammaticalCase: rawCase,
          sign: extractedSign.sign,
          signDetailAr: extractedSign.detailAr,
          classicalIrab: targetWord.i,
          clauseWords: clauseWords.length > 0 ? clauseWords : verse.w,
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
