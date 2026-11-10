import { lazy } from "react";
import type { ReaderPrefs } from "../lib/readerPrefs";
import type { ExampleQuery } from "../lib/search";
import type { Manifest, Route } from "../lib/types";
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

export function navigateHash(path: string) {
	if (location.hash !== `#${path}`) location.hash = path;
}

function openVersePath(sura: number, verse: number, word?: number) {
	navigateHash(word ? `/${sura}/${verse}/${word}` : `/${sura}/${verse}`);
}

interface Props {
	manifest: Manifest;
	route: Route;
	readerPrefs: ReaderPrefs;
	seed?: Partial<ExampleQuery>;
	openSearch: (next?: Partial<ExampleQuery>) => void;
}

export function AppPages({
	manifest,
	route,
	readerPrefs,
	seed,
	openSearch,
}: Props) {
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
					onSearch={openSearch}
				/>
			);
		case "search":
			return <ExampleSearch initial={seed} onOpen={openVersePath} />;
		case "surahs":
			return (
				<SurahIndex
					manifest={manifest}
					onOpen={(sura) => navigateHash(`/${sura}/1`)}
				/>
			);
		case "sources":
			return <SourcesPage manifest={manifest} />;
		case "quiz":
			return (
				<QuizScreen
					manifest={manifest}
					onOpenInReader={openVersePath}
					onOpenSearch={openSearch}
				/>
			);
		default:
			return null;
	}
}
