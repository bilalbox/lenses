import { type ReactNode, Suspense, useEffect, useState } from "react";
import { AppPages, navigateHash } from "./components/AppPages";
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	GearIcon,
	SearchIcon,
} from "./components/Icons";
import { SettingsModal } from "./components/SettingsModal";
import { stripDiacritics } from "./lib/arabic";
import { openingPath, rememberVerse } from "./lib/home";
import { normalizeDigits } from "./lib/i18n/format";
import { useI18n } from "./lib/i18n/I18nContext";
import { loadLayer, useLayer } from "./lib/layers";
import {
	type LibraryProgress,
	startLibrary,
	watchLibrary,
} from "./lib/library";
import { adjacentVerse } from "./lib/manifest";
import {
	loadReaderPrefs,
	type ReaderLayerKey,
	type ReaderPrefs,
	saveReaderPrefs,
} from "./lib/readerPrefs";
import { parseRoute, retiredPageRedirect } from "./lib/route";
import { type ExampleQuery, searchVerses, type VerseHit } from "./lib/search";
import type { Manifest } from "./lib/types";

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

function stepAdjacentVerse(
	manifest: Manifest,
	sura: number,
	verse: number,
	delta: number,
) {
	const next = adjacentVerse(manifest, sura, verse, delta);
	if (next) navigateHash(`/${next.sura}/${next.verse}`);
}

export function App() {
	const { t, dir, formatNumber } = useI18n();
	const [route, setRoute] = useState(() => parseRoute(location.hash));
	const { data: manifest, error } = useLayer("manifest");
	const [theme, setTheme] = useState(
		() => document.documentElement.dataset.theme || "light",
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
		const onHash = () => {
			const redirect = retiredPageRedirect(location.hash);
			if (redirect) location.replace(`#${redirect}`);
			setRoute(parseRoute(location.hash));
		};
		onHash();
		window.addEventListener("hashchange", onHash);
		return () => window.removeEventListener("hashchange", onHash);
	}, []);

	useEffect(() => {
		if (route.page === "verse") rememberVerse(route.sura, route.verse);
	}, [route.page, route.sura, route.verse]);

	useEffect(() => {
		return watchLibrary(setLibrary);
	}, []);

	useEffect(() => {
		if (manifest) startLibrary(manifest);
	}, [manifest]);

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
		loadLayer("verses")
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

	const toggleReaderPref = (key: ReaderLayerKey, next: boolean) => {
		setReaderPrefs((prev) => {
			const updated = { ...prev, [key]: next };
			saveReaderPrefs(updated);
			return updated;
		});
	};

	const openHit = (hit: VerseHit) => {
		setSearchOpen(false);
		setQuery("");
		navigateHash(`/${hit.sura}/${hit.verse}`);
	};

	const openSearch = (next: Partial<ExampleQuery> = {}) => {
		setSeed(next);
		navigateHash("/search");
		setSearchOpen(false);
	};

	// Verse stepping only means something in the reader.
	const showDock = route.page === "verse";

	return (
		<div className={`app page-${route.page}`}>
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
							openSearch={openSearch}
						/>
					) : null}
				</Suspense>
			</main>
			{showDock ? (
				<nav className="dock" aria-label={t.common.verse}>
					<button
						type="button"
						onClick={() =>
							manifest &&
							stepAdjacentVerse(manifest, route.sura, route.verse, -1)
						}
					>
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
							if (match) {
								navigateHash(`/${Number(match[1])}/${Number(match[2])}`);
							}
						}}
					>
						<input
							name="jump"
							aria-label={t.common.chapterAndVerse}
							defaultValue={`${formatNumber(route.sura)}:${formatNumber(route.verse)}`}
							key={`${route.sura}:${route.verse}`}
						/>
					</form>
					<button
						type="button"
						onClick={() =>
							manifest &&
							stepAdjacentVerse(manifest, route.sura, route.verse, 1)
						}
					>
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
				readerPrefs={readerPrefs}
				onToggleReaderPref={toggleReaderPref}
				library={library}
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
