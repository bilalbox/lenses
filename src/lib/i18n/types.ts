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

export interface SourceItemTranslation {
	title?: string;
	attribution?: string;
	description?: string;
	license?: string;
}

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
		surahGoalLabel: string;
		revelationOrder: (seq: number) => string;
		asbabBadge: (count: number) => string;
		asbabDrawerTitle: string;
		nahwTabTitle: string;
		treebankNoorBayan: string;
		mutashabihBadge: (count: number) => string;
		mutashabihSectionTitle: string;
		mutashabihCounterpartAyah: string;
		mutashabihCurrentAyah: string;
		mutashabihMatchScore: (percent: number) => string;
		mutashabihDabtTitle: string;
		mutashabihTawjihTitle: string;
		mutashabihJumpToAyah: string;
		mutashabihCategoryIdentical: string;
		mutashabihCategoryOpening: string;
		mutashabihCategoryEnding: string;
		mutashabihCategoryPhrase: string;
		mutashabihCategorySwap: string;
		mutashabihLegendExact: string;
		mutashabihLegendDiff: string;
		mutashabihLegendExtra: string;
		mutashabihSurahDistance: (count: number) => string;
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
		qiraatTitle: string;
		qiraatIsolation: string;
		qiraatWasl: string;
		qiraatSemanticNote: string;
	};
	surahs: {
		countEyebrow: (count: number) => string;
		pageTitle: string;
		coverageTreebank: string;
		coverageMorphology: string;
		coverageTrees: (syntax: number, total: number) => string;
	};
	examples: {
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
		pageTitle: string;
		intro: string;
		coverageHeading: string;
		coverageBody: (
			words: number,
			syntaxVerses: number,
			partialText: string,
			chStart: number,
			chEnd: number,
		) => string;
		partialSnippet: (syntax: number, total: number, surah: number) => string;
		rhetoricCoverageHeading: string;
		rhetoricCoverageBody: (versesCount: number, surasCount: number) => string;
		licenseLabel: string;
		kinds: Record<string, string>;
		items: Record<string, SourceItemTranslation>;
	};
}
