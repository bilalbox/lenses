import type { Translations } from "../types";
import { formatNum } from "../format";

export const ar: Translations = {
  common: {
    appNameAr: "العدسات",
    appNameEn: "Lenses",
    searchPlaceholder: "سورة:آية، أو كلمة",
    searchAria: "ابحث في الآيات",
    versesCount: (count: number) => {
      const n = formatNum(count, "ar");
      if (count === 1) return "آية واحدة";
      if (count === 2) return "آيتان";
      if (count >= 3 && count <= 10) return `${n} آيات`;
      return `${n} آية`;
    },
    noVersesMatch: "لا توجد آيات مطابقة.",
    surahsNav: "السور",
    examplesNav: "أمثلة",
    previous: "السابق",
    next: "التالي",
    search: "بحث",
    offlineReady: "متاح دون اتصال",
    savingOffline: (done: number, total: number) =>
      `جارٍ حفظ القرآن للعمل دون اتصال، ${formatNum(Math.max(done, 1), "ar")} من ${formatNum(total, "ar")}.`,
    chapterAndVerse: "السورة والآية",
    open: "فتح",
    verse: "الآية",
    tanzilSource: "تنزيل",
    tafsirCenterSource: "مركز تفسير للدراسات القرآنية",
    corpusSource: "المدونة القرآنية",
  },
  settings: {
    title: "الإعدادات",
    buttonAria: "الإعدادات",
    languageSection: "اللغة",
    themeSection: "المظهر",
    themeLight: "فاتح",
    themeDark: "داكن",
    sourcesLink: "البيانات والتراخيص",
    sourcesDescription: "استكشف مصادر البيانات اللغوية، التراخيص، وإحصائيات التغطية النحوية.",
    installApp: "تثبيت التطبيق",
    closeAria: "إغلاق الإعدادات",
  },
  verse: {
    meccan: "مكية",
    madinan: "مدنية",
    mukhtasarEnTitle: "المختصر في التفسير",
    mukhtasarEnSub: "الإنجليزية · QuranEnc",
    mukhtasarIdTitle: "المختصر في التفسير",
    mukhtasarIdSub: "الإندونيسية · QuranEnc",
    mukhtasarArTitle: "المختصر في التفسير",
    mukhtasarArSub: "العربية · QuranEnc",
    irabTitle: "إعراب الآية",
    fitZoom: "ملاءمة",
    zoomInAria: "تكبير",
    zoomOutAria: "تصغير",
    clauseCount: (index: number, total: number) => `الجملة ${formatNum(index + 1, "ar")} من ${formatNum(total, "ar")}`,
    clauseNoteContinues: "تتصل هذه الجملة بآية مجاورة.",
    noTreeTitle: "لا توجد شجرة إعراب لهذه الآية.",
    classicalIrabShort: "إعراب",
  },
  sheet: {
    analysisAria: (wordNumber: number) => `تحليل الكلمة ${formatNum(wordNumber, "ar")}`,
    closeAria: "إغلاق التحليل",
    expandAria: "توسيع التحليل",
    collapseAria: "طي التحليل",
    corpusMorphology: "الصرف والتحليل النحوي",
    classicalIrab: "الإعراب المفرد",
    sarf: "الصرف والبنية",
    wordMeaning: "معنى الكلمة",
    partOfSpeech: "النوع",
    root: "الجذر",
    lemma: "الأصل المعجمي",
    searchThisRoot: "ابحث عن هذا الجذر",
    searchThisLemma: "ابحث عن هذا الأصل",
    basePatternHint: "الوزن الأصلي فَعَلَ لا يُعلّم غالباً.",
    impliedEstimated: "مقدَّر",
  },
  surahs: {
    countEyebrow: (count: number) => `${formatNum(count, "ar")} سورة`,
    pageTitle: "تصفح القرآن الكريم",
    coverageTreebank: "شجرة النحو",
    coverageMorphology: "الصرف والإعراب",
    coverageTrees: (syntax: number, total: number) => `${formatNum(syntax, "ar")}/${formatNum(total, "ar")} شجرة`,
  },
  examples: {
    eyebrow: "البحث في الأنماط",
    pageTitle: "استكشف الأنماط النحوية",
    lead: "ابحث في متن المدونة بالجذر، أو اللفظ المعجمي، أو نوع الكلمة، أو الوزن الصرفي، أو العلاقة الإعرابية.",
    presetHal: "استفهام هل",
    presetAfala: "أَفْعَلَ من نزل",
    presetFaala: "فَعَّلَ من علم",
    presetFail: "فاعل",
    presetHalState: "حال",
    filterRoot: "الجذر",
    filterLemma: "الأصل المعجمي",
    filterPos: "النوع",
    filterForm: "الوزن",
    filterRelation: "العلاقة النحوية",
    anyOption: "الكل",
    wordsFound: (count: number, limit: number) => {
      const n = formatNum(count, "ar");
      const wordText = count === 1 ? "كلمة" : count === 2 ? "كلمتان" : count <= 10 ? "كلمات" : "كلمة";
      return `${n} ${wordText}${count > limit ? ` · عُرض منها ${formatNum(limit, "ar")}` : ""}`;
    },
    noWordsMatch: "لا توجد كلمات مطابقة لهذا الجمع من المعايير.",
    showMore: "عرض المزيد",
    chooseCriteriaHint: "اختر جذراً أو أصلاً أو نوعاً أو وزناً أو علاقة نحوية لبدء البحث.",
  },
  sources: {
    eyebrow: "البيانات والتراخيص",
    pageTitle: "المصادر المعتمدة في هذا الإصدار",
    intro:
      "تطبيق العدسات هو قارئ تحليلي يجمع دراسات قرآنية منشورة بترخيص مفتوح. النص القرآني محفوظ دون أدنى تبديل. تُنسب كل طبقة إعرابية لمصدرها، ويمكن عرض أكثر من طبقة في آن واحد.",
    coverageHeading: "نطاق التغطية",
    coverageBody: (words: number, syntaxVerses: number, partialText: string, chStart: number, chEnd: number) =>
      `يغطي التحليل الصرفي كامل كلمات القرآن البالغة ${formatNum(words, "ar")} كلمة. وتشمل شجرة الإعراب ${formatNum(syntaxVerses, "ar")} آية${partialText}. السور ${formatNum(chStart, "ar")}–${formatNum(chEnd, "ar")} لم تكتمل شجرتها في هذا التصدير بعد. يتوفر الإعراب والصرف من مركز تفسير لجميع الكلمات.`,
  },
};
