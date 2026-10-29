import { lazy, type ReactNode, Suspense, useEffect, useState } from "react";
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	GearIcon,
	SearchIcon,
} from "./components/Icons";
import { SettingsModal } from "./components/SettingsModal";
import { VerseScreen } from "./components/VerseScreen";
import { loadManifest, loadVerses } from "./lib/api";
import { stripDiacritics } from "./lib/arabic";
import { openingPath, rememberVerse } from "./lib/home";
import { normalizeDigits } from "./lib/i18n/format";
import { useI18n } from "./lib/i18n/I18nContext";
import {
	type LibraryProgress,
	startLibrary,
	watchLibrary,
} from "./lib/library";
import {
	loadReaderPrefs,
	type ReaderLayerKey,
	type ReaderPrefs,
	saveReaderPrefs,
} from "./lib/readerPrefs";
import { parseRoute } from "./lib/route";
import { type ExampleQuery, searchVerses, type VerseHit } from "./lib/search";
import type { Manifest, Route } from "./lib/types";

const ExampleSearch = lazy(() =>
	import("./components/ExampleSearch").then((m) => ({
		default: m.ExampleSearch,
	})),
);
const SourcesPage = lazy(() =>
	import("./components/SourcesPage").then((m) => ({ default: m.SourcesPage })),
);
const SurahIndex = lazy(() =>
	import("./components/SurahIndex").then((m) => ({ default: m.SurahIndex })),
);
const QuizScreen = lazy(() =>
	import("./components/QuizScreen").then((m) => ({ default: m.QuizScreen })),
);
const RhetoricScreen = lazy(() =>
	import("./components/RhetoricScreen").then((m) => ({
		default: m.RhetoricScreen,
	})),
);
const MunasabatScreen = lazy(() =>
	import("./components/MunasabatScreen").then((m) => ({
		default: m.MunasabatScreen,
	})),
);

const QUIZ_HIDE_DIACRITICS_KEY = "lenses-quiz-hide-diacritics";

function highlight(text: string, needle: string) {
	if (needle.length < 2) return text;
	const parts: (string | ReactNode)[] = [];
	let cursor = 0;
	const lower = text.toLowerCase();
	const target = needle.toLowerCase();
	while (cursor < text.length) {
		const at = lower.indexOf(target, cursor);
		if (at < 0) {
			parts.push(text.slice(cursor));
			break;
		}
		if (at > cursor) parts.push(text.slice(cursor, at));
		parts.push(<mark key={at}>{text.slice(at, at + target.length)}</mark>);
		cursor = at + target.length;
	}
	return parts;
}

function go(path: string) {
	if (location.hash !== `#${path}`) location.hash = path;
}

function AppPages({
	manifest,
	route,
	readerPrefs,
	seed,
	quizHideDiacritics,
	openSearch,
}: {
	manifest: Manifest;
	route: Route;
	readerPrefs: ReaderPrefs;
	seed?: Partial<ExampleQuery>;
	quizHideDiacritics: boolean;
	openSearch: (next?: Partial<ExampleQuery>) => void;
}) {
	if (route.page === "verse") {
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
					const q = params ? `?${new URLSearchParams(params).toString()}` : "";
					go(word ? `/${sura}/${verse}/${word}${q}` : `/${sura}/${verse}${q}`);
				}}
				onSearchRoot={(root) => openSearch({ root })}
				onSearchLemma={(lemma) => openSearch({ lemma })}
			/>
		);
	}
	if (route.page === "search") {
		return (
			<ExampleSearch
				initial={seed}
				onOpen={(sura, verse, word) => go(`/${sura}/${verse}/${word}`)}
			/>
		);
	}
	if (route.page === "surahs") {
		return (
			<SurahIndex manifest={manifest} onOpen={(sura) => go(`/${sura}/1`)} />
		);
	}
	if (route.page === "sources") {
		return <SourcesPage manifest={manifest} />;
	}
	if (route.page === "quiz") {
		return (
			<QuizScreen
				manifest={manifest}
				onOpenInReader={(sura, verse, word) =>
					go(word ? `/${sura}/${verse}/${word}` : `/${sura}/${verse}`)
				}
				onOpenSearch={openSearch}
				hideDiacritics={quizHideDiacritics}
			/>
		);
	}
	if (route.page === "rhetoric") {
		return (
			<RhetoricScreen
				targetSura={route.sura}
				targetVerse={route.verse}
				onOpenVerse={(sura, verse, word) =>
					go(word ? `/${sura}/${verse}/${word}` : `/${sura}/${verse}`)
				}
			/>
		);
	}
	if (route.page === "munasabat") {
		return (
			<MunasabatScreen
				manifest={manifest}
				targetSura={route.sura}
				onOpenVerse={(sura, verse) => go(`/${sura}/${verse}`)}
				onSelectSurah={(sura) => go(`/munasabat/${sura}`)}
			/>
		);
	}
	return null;
}

export function App() {
	const { t, dir } = useI18n();
	const [route, setRoute] = useState(() => parseRoute(location.hash));
	const [manifest, setManifest] = useState<Manifest | null>(null);
	const [error, setError] = useState("");
	const [theme, setTheme] = useState(
		() => document.documentElement.dataset.theme || "light",
	);
	const [quizHideDiacritics, setQuizHideDiacritics] = useState(
		() => localStorage.getItem(QUIZ_HIDE_DIACRITICS_KEY) === "1",
	);
	const [readerPrefs, setReaderPrefs] = useState<ReaderPrefs>(() =>
		loadReaderPrefs(),
	);
	const [query, setQuery] = useState("");
	const [hits, setHits] = useState<VerseHit[]>([]);
	const [hitTotal, setHitTotal] = useState(0);
	const [searchOpen, setSearchOpen] = useState(false);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [seed, setSeed] = useState<Partial<ExampleQuery> | undefined>(
		undefined,
	);
	const [install, setInstall] = useState<BeforeInstallPromptEvent | null>(null);
	const [library, setLibrary] = useState<LibraryProgress | null>(null);

	useEffect(() => {
		if (!location.hash) location.replace(`#${openingPath()}`);
		const onHash = () => setRoute(parseRoute(location.hash));
		window.addEventListener("hashchange", onHash);
		return () => window.removeEventListener("hashchange", onHash);
	}, []);

	useEffect(() => {
		if (route.page === "verse") rememberVerse(route.sura, route.verse);
	}, [route.page, route.sura, route.verse]);

	useEffect(() => {
		loadManifest()
			.then(setManifest)
			.catch((reason: unknown) =>
				setError(
					reason instanceof Error
						? reason.message
						: "Could not load the catalog.",
				),
			);
	}, []);

	useEffect(() => {
		return watchLibrary((progress) => {
			setLibrary(progress);
			if (progress.total > 0 && progress.done >= progress.total) {
				window.setTimeout(() => {
					setLibrary((current) =>
						current && current.done >= current.total ? null : current,
					);
				}, 2600);
			}
		});
	}, []);

	useEffect(() => {
		if (manifest) startLibrary(manifest);
	}, [manifest]);

	useEffect(() => {
		const onScroll = () =>
			document.documentElement.classList.toggle(
				"is-scrolled",
				window.scrollY > 28,
			);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	useEffect(() => {
		if (route) setSearchOpen(false);
	}, [route]);

	useEffect(() => {
		const onPrompt = (event: Event) => {
			event.preventDefault();
			setInstall(event as BeforeInstallPromptEvent);
		};
		window.addEventListener("beforeinstallprompt", onPrompt);
		return () => window.removeEventListener("beforeinstallprompt", onPrompt);
	}, []);

	useEffect(() => {
		const trimmed = query.trim();
		if (trimmed.length < 1) {
			setHits([]);
			return;
		}
		let cancel = false;
		loadVerses()
			.then((rows) => {
				if (cancel) return;
				const found = searchVerses(rows, trimmed);
				setHits(found.hits);
				setHitTotal(found.total);
			})
			.catch(() => {
				if (!cancel) setHits([]);
			});
		return () => {
			cancel = true;
		};
	}, [query]);

	useEffect(() => {
		if (route.page === "verse" && route.tab === "structure") {
			go(`/munasabat/${route.sura}`);
		}
	}, [route.page, route.tab, route.sura]);

	const selectTheme = (next: "light" | "dark") => {
		document.documentElement.dataset.theme = next;
		localStorage.setItem("lenses-theme", next);
		setTheme(next);
		const themeColorMeta = document.querySelector('meta[name="theme-color"]');
		if (themeColorMeta) {
			themeColorMeta.setAttribute(
				"content",
				next === "dark" ? "#101311" : "#0f6e66",
			);
		}
	};

	const toggleQuizHideDiacritics = (next: boolean) => {
		setQuizHideDiacritics(next);
		localStorage.setItem(QUIZ_HIDE_DIACRITICS_KEY, next ? "1" : "0");
	};

	const toggleReaderLayer = (key: ReaderLayerKey, next: boolean) => {
		setReaderPrefs((prev) => {
			const updated = { ...prev, [key]: next };
			saveReaderPrefs(updated);
			return updated;
		});
	};

	const stepVerse = (delta: number) => {
		if (!manifest) return;
		const unit = manifest.units.find((item) => item.n === route.sura);
		if (!unit) return;
		let nextVerse = route.verse + delta;
		let nextSura = route.sura;
		if (nextVerse < 1) {
			nextSura = route.sura === 1 ? 114 : route.sura - 1;
			nextVerse =
				manifest.units.find((item) => item.n === nextSura)?.verses ?? 1;
		} else if (nextVerse > unit.verses) {
			nextSura = route.sura === 114 ? 1 : route.sura + 1;
			nextVerse = 1;
		}
		go(`/${nextSura}/${nextVerse}`);
	};

	const openHit = (hit: VerseHit) => {
		setSearchOpen(false);
		setQuery("");
		go(`/${hit.sura}/${hit.verse}`);
	};

	const openSearch = (next: Partial<ExampleQuery> = {}) => {
		setSeed(next);
		go("/search");
		setSearchOpen(false);
	};

	return (
		<div className="app">
			<header className="topbar">
				<a
					className="mark"
					href={`#${route.page === "verse" ? `/${route.sura}/${route.verse}` : openingPath()}`}
				>
					<span className="mark-ar" lang="ar">
						{t.common.appNameAr}
					</span>
					<span className="mark-en">{t.common.appNameEn}</span>
				</a>
				<div className={`finder${searchOpen ? " is-open" : ""}`}>
					<input
						value={query}
						dir="auto"
						placeholder={t.common.searchPlaceholder}
						aria-label={t.common.searchAria}
						onChange={(event) => {
							setQuery(event.target.value);
							setSearchOpen(true);
						}}
						onFocus={() => setSearchOpen(true)}
						onKeyDown={(event) => {
							if (event.key === "Enter" && hits[0]) {
								event.preventDefault();
								openHit(hits[0]);
							}
							if (event.key === "Escape") setSearchOpen(false);
						}}
					/>
					{searchOpen && query.trim() ? (
						<ul className="finder-results">
							{hits.length ? (
								<li className="finder-count">
									{t.common.versesCount(hitTotal)}
								</li>
							) : (
								<li className="finder-empty">{t.common.noVersesMatch}</li>
							)}
							{hits.map((hit) => (
								<li key={`${hit.sura}:${hit.verse}`}>
									<button type="button" onClick={() => openHit(hit)}>
										<b>
											{hit.sura}:{hit.verse}
										</b>
										<span className="hit-ar" lang="ar" dir="rtl">
											{highlight(hit.arabic, stripDiacritics(query))}
										</span>
										<span className="hit-en">{hit.english}</span>
									</button>
								</li>
							))}
						</ul>
					) : null}
				</div>
				<nav>
					<a
						href="#/surahs"
						aria-current={route.page === "surahs" ? "page" : undefined}
					>
						{t.common.surahsNav}
					</a>
					<a
						href="#/search"
						aria-current={route.page === "search" ? "page" : undefined}
					>
						{t.common.examplesNav}
					</a>
					<a
						href="#/quiz"
						aria-current={route.page === "quiz" ? "page" : undefined}
					>
						{t.common.quizNav}
					</a>
					<a
						href="#/rhetoric"
						aria-current={route.page === "rhetoric" ? "page" : undefined}
					>
						{t.common.rhetoricNav}
					</a>
					<a
						href="#/munasabat"
						aria-current={route.page === "munasabat" ? "page" : undefined}
					>
						{t.common.munasabatNav}
					</a>
					<button
						type="button"
						className="icon-button settings-toggle-button"
						onClick={() => setSettingsOpen(true)}
						aria-label={t.settings.buttonAria}
					>
						<GearIcon />
					</button>
				</nav>
			</header>
			<main>
				{library ? (
					<p className="library-status" role="status">
						{library.done >= library.total
							? t.common.offlineReady
							: t.common.savingOffline(library.done, library.total)}
					</p>
				) : null}
				{error ? <p className="banner error">{error}</p> : null}
				{!manifest && !error ? (
					<div className="skeleton page-skeleton" aria-hidden="true">
						<span />
						<span />
						<span />
					</div>
				) : null}
				<Suspense
					fallback={
						<div className="skeleton page-skeleton" aria-hidden="true">
							<span />
							<span />
							<span />
						</div>
					}
				>
					{manifest ? (
						<AppPages
							manifest={manifest}
							route={route}
							readerPrefs={readerPrefs}
							seed={seed}
							quizHideDiacritics={quizHideDiacritics}
							openSearch={openSearch}
						/>
					) : null}
				</Suspense>
			</main>
			{route.page !== "quiz" && route.page !== "munasabat" ? (
				<nav className="dock" aria-label={t.common.verse}>
					<button type="button" onClick={() => stepVerse(-1)}>
						{dir === "rtl" ? <ChevronRightIcon /> : <ChevronLeftIcon />}
						<span>{t.common.previous}</span>
					</button>
					<form
						onSubmit={(event) => {
							event.preventDefault();
							const raw = (
								event.currentTarget.elements.namedItem(
									"jump",
								) as HTMLInputElement
							).value;
							const input = normalizeDigits(raw);
							const match = input
								.trim()
								.match(/^(\d{1,3})\s*[:\u061b]\s*(\d{1,3})$/);
							if (match) go(`/${Number(match[1])}/${Number(match[2])}`);
						}}
					>
						<input
							name="jump"
							aria-label={t.common.chapterAndVerse}
							defaultValue={`${route.sura}:${route.verse}`}
							key={`${route.sura}:${route.verse}`}
						/>
					</form>
					<button type="button" onClick={() => stepVerse(1)}>
						<span>{t.common.next}</span>
						{dir === "rtl" ? <ChevronLeftIcon /> : <ChevronRightIcon />}
					</button>
					<button
						type="button"
						onClick={() => {
							setSearchOpen(true);
							window.scrollTo({ top: 0 });
							requestAnimationFrame(() =>
								document
									.querySelector<HTMLInputElement>(".finder input")
									?.focus(),
							);
						}}
					>
						<SearchIcon />
						<span>{t.common.search}</span>
					</button>
				</nav>
			) : null}
			<SettingsModal
				isOpen={settingsOpen}
				onClose={() => setSettingsOpen(false)}
				theme={theme}
				onSelectTheme={selectTheme}
				quizHideDiacritics={quizHideDiacritics}
				onToggleQuizHideDiacritics={toggleQuizHideDiacritics}
				readerPrefs={readerPrefs}
				onToggleReaderLayer={toggleReaderLayer}
				canInstall={Boolean(install)}
				onInstall={() => {
					if (install) {
						void install.prompt();
						setInstall(null);
					}
				}}
			/>
		</div>
	);
}

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
}
