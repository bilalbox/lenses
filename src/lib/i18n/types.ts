export type Locale = "en" | "ar" | "id";
export type Direction = "ltr" | "rtl";

export interface LocaleInfo {
  code: Locale;
  label: string; // Autonym: "English", "العربية", "Bahasa Indonesia"
  dir: Direction;
}

export const LOCALES: Record<Locale, LocaleInfo> = {
  en: { code: "en", label: "English", dir: "ltr" },
  ar: { code: "ar", label: "العربية", dir: "rtl" },
  id: { code: "id", label: "Bahasa Indonesia", dir: "ltr" },
};

export interface Translations {
  common: {
    appNameAr: string;
    appNameEn: string;
    searchPlaceholder: string;
    searchAria: string;
    versesCount: (count: number) => string;
    noVersesMatch: string;
    surahsNav: string;
    examplesNav: string;
    previous: string;
    next: string;
    search: string;
    offlineReady: string;
    savingOffline: (done: number, total: number) => string;
    chapterAndVerse: string;
    open: string;
    verse: string;
  };
  settings: {
    title: string;
    buttonAria: string;
    languageSection: string;
    themeSection: string;
    themeLight: string;
    themeDark: string;
    sourcesLink: string;
    sourcesDescription: string;
    installApp: string;
    closeAria: string;
  };
  verse: {
    meccan: string;
    madinan: string;
    arabicTextAttribution: string;
    mukhtasarEnTitle: string;
    mukhtasarEnSub: string;
    mukhtasarIdTitle: string;
    mukhtasarIdSub: string;
    mukhtasarArTitle: string;
    mukhtasarArSub: string;
    irabTitle: string;
    irabAttribution: string;
    fitZoom: string;
    zoomInAria: string;
    zoomOutAria: string;
    clauseCount: (index: number, total: number) => string;
    clauseNoteContinues: string;
    noTreeTitle: string;
    noTreeDesc: (syntaxCount: number, verseCount: number) => string;
    classicalIrabShort: string;
  };
  sheet: {
    analysisAria: (wordNumber: number) => string;
    closeAria: string;
    expandAria: string;
    collapseAria: string;
    corpusMorphology: string;
    classicalIrab: string;
    sarf: string;
    wordMeaning: string;
    partOfSpeech: string;
    root: string;
    lemma: string;
    searchThisRoot: string;
    searchThisLemma: string;
    basePatternHint: string;
    impliedEstimated: string;
  };
  surahs: {
    countEyebrow: (count: number) => string;
    pageTitle: string;
    statsIntro: (syntaxVerses: number, totalVerses: number) => string;
    coverageTreebank: string;
    coverageMorphology: string;
    coverageTrees: (syntax: number, total: number) => string;
  };
  examples: {
    eyebrow: string;
    pageTitle: string;
    lead: string;
    presetHal: string;
    presetAfala: string;
    presetFaala: string;
    presetFail: string;
    presetHalState: string;
    filterRoot: string;
    filterLemma: string;
    filterPos: string;
    filterForm: string;
    filterRelation: string;
    anyOption: string;
    wordsFound: (count: number, limit: number) => string;
    noWordsMatch: string;
    showMore: string;
    chooseCriteriaHint: string;
  };
  sources: {
    eyebrow: string;
    pageTitle: string;
    intro: string;
    coverageHeading: string;
    coverageBody: (words: number, syntaxVerses: number, partialText: string, chStart: number, chEnd: number) => string;
    tafsirAppHeading: string;
    tafsirAppBody: string;
    noticesHint: string;
  };
}
