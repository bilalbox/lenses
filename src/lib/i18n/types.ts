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
    quizNav: string;
    rhetoricNav: string;
    previous: string;
    next: string;
    search: string;
    offlineReady: string;
    savingOffline: (done: number, total: number) => string;
    chapterAndVerse: string;
    open: string;
    verse: string;
    tanzilSource: string;
    tafsirCenterSource: string;
    corpusSource: string;
  };
  quiz: {
    streakLabel: string;
    skipButton: string;
    openReader: (sura: number, verse: number) => string;
    stepRoleCrumb: string;
    stepCaseCrumb: string;
    stepSignCrumb: string;
    stepCheckCrumb: string;
    targetBadge: string;
    headBadge: string;
    legendTarget: (wordAr: string) => string;
    legendHead: (roleLabel: string, wordAr: string) => string;
    pickGovernorHint: string;
    step1Eyebrow: string;
    step1Question: (wordAr: string) => string;
    step2Eyebrow: (govLabel: string) => string;
    step2Question: (govAr: string, wordAr: string) => string;
    step2Hint: string;
    step3Eyebrow: string;
    step3Question: (wordAr: string) => string;
    step4Eyebrow: string;
    step4Question: (wordAr: string) => string;
    step5Eyebrow: string;
    step5Title: (wordAr: string) => string;
    backButton: string;
    editButton: string;
    revealButton: string;
    submitButton: string;
    nextButton: string;
    exactMatchEyebrow: string;
    reviewEyebrow: string;
    classicalHeading: (wordAr: string) => string;
    notSet: string;
    incompleteAlert: string;
  };
  settings: {
    title: string;
    buttonAria: string;
    languageSection: string;
    themeSection: string;
    themeLight: string;
    themeDark: string;
    quizSection: string;
    quizDiacriticsLabel: string;
    quizDiacriticsDescription: string;
    sourcesLink: string;
    sourcesDescription: string;
    installApp: string;
    closeAria: string;
  };
  verse: {
    meccan: string;
    madinan: string;
    verseMeaningTitle: string;
    verseMeaningSub: string;
    translationBadge: string;
    tafsirBadge: string;
    mukhtasarEnTitle: string;
    mukhtasarEnSub: string;
    mukhtasarIdTitle: string;
    mukhtasarIdSub: string;
    mukhtasarArTitle: string;
    mukhtasarArSub: string;
    irabTitle: string;
    clauseCount: (index: number, total: number) => string;
    firstClause: string;
    lastClause: string;
    clauseNoteContinues: string;
    noTreeTitle: string;
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
  };
}
