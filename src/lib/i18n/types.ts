import type { QuizPrefKey } from "../quizPrefs";
import type { Manifest } from "../types";

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
		previous: string;
		next: string;
		search: string;
		offlineReady: string;
		savingOffline: (done: number, total: number) => string;
		chapterAndVerse: string;
		open: string;
		verse: string;
		tafsirCenterSource: string;
		corpusSource: string;
	};
	quiz: {
		pageTitle: string;
		lensesAria: string;
		stepsAria: string;
		streakLabel: string;
		scoreLabel: string;
		skipButton: string;
		openReader: (sura: number, verse: number) => string;
		stepRoleCrumb: string;
		stepCaseCrumb: string;
		stepSignCrumb: string;
		stepCheckCrumb: string;
		fieldRoot: string;
		fieldWazn: string;
		fieldClass: string;
		fieldStructure: string;
		targetBadge: string;
		headBadge: string;
		legendTarget: (wordAr: string) => string;
		legendHead: (roleLabel: string, wordAr: string) => string;
		pickGovernorHint: string;
		step1Eyebrow: string;
		step1Question: (wordAr: string) => string;
		step2Eyebrow: (govLabel: string) => string;
		step2Question: (govAr: string, wordAr: string) => string;
		step3Eyebrow: string;
		step3Question: (wordAr: string) => string;
		step4Eyebrow: string;
		step4Question: (wordAr: string) => string;
		step5Eyebrow: string;
		step5Title: (wordAr: string) => string;
		backButton: string;
		editButton: string;
		submitButton: string;
		nextButton: string;
		exactMatchEyebrow: string;
		reviewEyebrow: string;
		classicalHeading: (wordAr: string) => string;
		formulaEditHint: string;
		incompleteAlert: string;
		mutashabih: {
			fieldWording: string;
			fieldSurah: string;
			wordingQuestion: string;
			wordingHint: string;
			noWord: string;
			surahQuestion: string;
			reviewTitle: string;
			submitButton: string;
			placesHeading: string;
			thisAyah: string;
		};
		sarf: {
			rootQuestion: (wordAr: string) => string;
			waznQuestion: (wordAr: string) => string;
			verbClassQuestion: (wordAr: string) => string;
			nounClassQuestion: (wordAr: string) => string;
			verbStructureQuestion: (wordAr: string) => string;
			nounStructureQuestion: (wordAr: string) => string;
			reviewTitle: (wordAr: string) => string;
			submitButton: string;
			revealHeading: (wordAr: string) => string;
			rootInExamples: (root: string) => string;
		};
	};
	settings: {
		title: string;
		buttonAria: string;
		languageSection: string;
		themeSection: string;
		themeLight: string;
		themeDark: string;
		quizSection: string;
		quizPrefs: Record<QuizPrefKey, { label: string; description: string }>;
		readerSection: string;
		readerSectionHint: string;
		readerLayers: {
			meaning: string;
			irab: string;
			nahw: string;
			mutashabih: string;
			asbab: string;
			qiraat: string;
		};
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
		clausesAria: string;
		noTreeTitle: string;
		classicalIrabShort: string;
		surahGoalLabel: string;
		revelationOrder: (seq: number) => string;
		asbabBadge: (count: number) => string;
		asbabDrawerTitle: string;
		asbabSectionTitle: string;
		nahwTabTitle: string;
		treebankNoorBayan: string;
		irabViewsAria: string;
		irabDiagram: string;
		irabClassical: string;
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
		mutashabihLegendHaraka: string;
		mutashabihLegendDiff: string;
		mutashabihLegendExtra: string;
		mutashabihSurahDistance: (count: number) => string;
		mutashabihEmptyState: string;
		mutashabihReturnToAyah: (coord: string) => string;
	};
	sheet: {
		analysisAria: (wordNumber: number) => string;
		closeAria: string;
		expandAria: string;
		collapseAria: string;
		classicalIrab: string;
		sarf: string;
		wordMeaning: string;
		searchThisRoot: string;
		searchThisWord: string;
		inQuran: string;
		/** Occurrences, distinct verses, distinct surahs. */
		occurrences: (count: number, verses: number, surahs: number) => string;
		wordGlossSource: string;
		dictionaries: string;
		maqayisTitle: string;
		mufradatTitle: string;
		laneTitle: string;
		laneThisWord: string;
		laneOtherEntries: (count: number) => string;
		tabsAria: string;
		tabHere: string;
		tabAcross: string;
		wujuhTitle: string;
		/** Between the headword and what follows it. */
		wujuhSeparator: string;
		wujuhInThisVerse: string;
		wujuhSenseOf: (sense: number, total: number) => string;
		wujuhNotCited: (total: number) => string;
		wujuhThisVerse: string;
		wujuhUnnamedSense: (sense: number) => string;
		wujuhNoVerses: string;
		lanePage: (page: number) => string;
		qiraatTitle: string;
		qiraatIsolation: string;
		qiraatWasl: string;
		qiraatSemanticNote: string;
	};
	surahs: {
		countEyebrow: (count: number) => string;
		pageTitle: string;
	};
	examples: {
		rootPlaceholder: string;
		lemmaPlaceholder: string;
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
		noOptionMatch: string;
		clearFilter: (label: string) => string;
		wordsFound: (count: number, limit: number) => string;
		noWordsMatch: string;
		showMore: string;
		chooseCriteriaHint: string;
	};
	sources: {
		pageTitle: string;
		intro: string;
		coverageHeading: string;
		coverageBody: (stats: Manifest["stats"]) => string;
		licenseLabel: string;
		kinds: Record<string, string>;
		items: Record<string, SourceItemTranslation>;
	};
}
