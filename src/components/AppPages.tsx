import { lazy, type ReactNode } from "react";
import { useI18n } from "../lib/i18n/I18nContext";
import { type ReaderPrefs, rhetoricFetchEnabled } from "../lib/readerPrefs";
import type { ExampleQuery } from "../lib/search";
import type { Manifest, Route } from "../lib/types";
import { FeatureOffPanel } from "./FeatureOffPanel";
import { VerseScreen } from "./VerseScreen";

const ExampleSearch = lazy(() =>
	import("./ExampleSearch").then((m) => ({
		default: m.ExampleSearch,
	})),
);
const SourcesPage = lazy(() =>
	import("./SourcesPage").then((m) => ({ default: m.SourcesPage })),
);
const SurahIndex = lazy(() =>
	import("./SurahIndex").then((m) => ({ default: m.SurahIndex })),
);
const QuizScreen = lazy(() =>
	import("./QuizScreen").then((m) => ({ default: m.QuizScreen })),
);
const RhetoricScreen = lazy(() =>
	import("./RhetoricScreen").then((m) => ({
		default: m.RhetoricScreen,
	})),
);
const MunasabatScreen = lazy(() =>
	import("./MunasabatScreen").then((m) => ({
		default: m.MunasabatScreen,
	})),
);

export function navigateHash(path: string) {
	if (location.hash !== `#${path}`) location.hash = path;
}

function openVersePath(sura: number, verse: number, word?: number) {
	navigateHash(word ? `/${sura}/${verse}/${word}` : `/${sura}/${verse}`);
}

function gatedFeature(
	enabled: boolean,
	featureName: string,
	openSettings: () => void,
	screen: ReactNode,
): ReactNode {
	if (enabled) return screen;
	return (
		<FeatureOffPanel featureName={featureName} onOpenSettings={openSettings} />
	);
}

interface Props {
	manifest: Manifest;
	route: Route;
	readerPrefs: ReaderPrefs;
	seed?: Partial<ExampleQuery>;
	quizHideDiacritics: boolean;
	openSearch: (next?: Partial<ExampleQuery>) => void;
	openSettings: () => void;
}

export function AppPages({
	manifest,
	route,
	readerPrefs,
	seed,
	quizHideDiacritics,
	openSearch,
	openSettings,
}: Props) {
	const { t } = useI18n();

	switch (route.page) {
		case "verse":
			return (
				<VerseScreen
					manifest={manifest}
					sura={route.sura}
					verseNumber={route.verse}
					wordNumber={route.word}
					tab={route.tab}
					target={route.target}
					readerPrefs={readerPrefs}
					onNavigate={(sura, verse, word, params) => {
						const q = params
							? `?${new URLSearchParams(params).toString()}`
							: "";
						navigateHash(
							word ? `/${sura}/${verse}/${word}${q}` : `/${sura}/${verse}${q}`,
						);
					}}
					onSearchRoot={(root) => openSearch({ root })}
				/>
			);
		case "search":
			return (
				<ExampleSearch
					initial={seed}
					rhetoricEnabled={rhetoricFetchEnabled(readerPrefs)}
					onOpen={openVersePath}
				/>
			);
		case "surahs":
			return (
				<SurahIndex
					manifest={manifest}
					showMunasabat={readerPrefs.munasabat}
					showRhetoricStudio={readerPrefs.rhetoricStudio}
					onOpen={(sura) => navigateHash(`/${sura}/1`)}
				/>
			);
		case "sources":
			return (
				<SourcesPage
					manifest={manifest}
					rhetoricEnabled={rhetoricFetchEnabled(readerPrefs)}
				/>
			);
		case "quiz":
			return (
				<QuizScreen
					manifest={manifest}
					onOpenInReader={openVersePath}
					onOpenSearch={openSearch}
					hideDiacritics={quizHideDiacritics}
				/>
			);
		case "rhetoric":
			return gatedFeature(
				readerPrefs.rhetoricStudio,
				t.settings.features.rhetoricStudio,
				openSettings,
				<RhetoricScreen
					targetSura={route.sura}
					targetVerse={route.verse}
					onOpenVerse={openVersePath}
				/>,
			);
		case "munasabat":
			return gatedFeature(
				readerPrefs.munasabat,
				t.settings.features.munasabat,
				openSettings,
				<MunasabatScreen
					manifest={manifest}
					targetSura={route.sura}
					onOpenVerse={(sura, verse) => openVersePath(sura, verse)}
					onSelectSurah={(sura) => navigateHash(`/munasabat/${sura}`)}
				/>,
			);
		default:
			return null;
	}
}
