import {
	type ReactNode,
	Suspense,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { AppPages, navigateHash } from "./components/AppPages";
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	CloseIcon,
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

/** Publishes an element's live height as a root CSS variable, so fixed layers
 * (word sheet, dock, topbar) can stack against each other without guessing.
 * Returns a callback ref; it re-attaches whenever the element mounts. */
function useHeightVar(name: string) {
	return useCallback(
		(el: HTMLElement | null) => {
			if (!el) return;
			const root = document.documentElement.style;
			const sync = () => root.setProperty(name, `${el.offsetHeight}px`);
			sync();
			const observer = new ResizeObserver(sync);
			observer.observe(el);
			return () => {
				observer.disconnect();
				root.removeProperty(name);
			};
		},
		[name],
	);
}

function isTypingTarget(target: EventTarget | null) {
	const el = target as HTMLElement | null;
	return Boolean(
		el &&
			(["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) ||
				el.isContentEditable),
	);
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
	// Verse stepping only means something in the reader.
	const showDock = route.page === "verse";
	const finderRef = useRef<HTMLDivElement | null>(null);
	const searchToggleRef = useRef<HTMLButtonElement | null>(null);
	const topbarRef = useHeightVar("--topbar-h");
	const dockRef = useHeightVar("--dock-h");

	const focusSearch = useCallback(() => {
		setSearchOpen(true);
		requestAnimationFrame(() => {
			const input = finderRef.current?.querySelector("input");
			input?.focus();
			input?.select();
		});
	}, []);

	const closeSearch = useCallback((returnFocus = false) => {
		setSearchOpen(false);
		if (returnFocus) searchToggleRef.current?.focus();
	}, []);

	// One search, reachable from every screen: "/" or Ctrl/⌘+K focuses it.
	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			const combo =
				(event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
			if (combo || (event.key === "/" && !isTypingTarget(event.target))) {
				event.preventDefault();
				focusSearch();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [focusSearch]);

	// A tap anywhere outside the finder puts it away.
	useEffect(() => {
		if (!searchOpen) return;
		const onPointer = (event: PointerEvent) => {
			const target = event.target as Node;
			if (finderRef.current?.contains(target)) return;
			if (searchToggleRef.current?.contains(target)) return;
			setSearchOpen(false);
		};
		document.addEventListener("pointerdown", onPointer);
		return () => document.removeEventListener("pointerdown", onPointer);
	}, [searchOpen]);

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

	return (
		<div className={`app page-${route.page}`}>
			<header className="topbar" ref={topbarRef}>
				<a
					className="mark"
					href={`#${route.page === "verse" ? `/${route.sura}/${route.verse}` : openingPath()}`}
				>
					{t.common.appName}
				</a>
				<div
					id="finder"
					ref={finderRef}
					className={`finder${searchOpen ? " is-open" : ""}`}
				>
					<SearchIcon className="finder-icon" aria-hidden="true" />
					<input
						type="search"
						enterKeyHint="go"
						aria-keyshortcuts="/ Control+K Meta+K"
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
							if (event.key === "Escape") {
								event.stopPropagation();
								event.currentTarget.blur();
								closeSearch(searchOpen);
							}
						}}
					/>
					<span className="finder-kbd" aria-hidden="true">
						/
					</span>
					<button
						type="button"
						className="icon-button finder-close"
						aria-label={t.common.closeSearchAria}
						onClick={() => closeSearch(true)}
					>
						<CloseIcon />
					</button>
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
						ref={searchToggleRef}
						type="button"
						className={`icon-button search-toggle-button${searchOpen ? " is-on" : ""}`}
						aria-label={t.common.searchAria}
						aria-expanded={searchOpen}
						aria-controls="finder"
						onClick={() => (searchOpen ? closeSearch() : focusSearch())}
					>
						<SearchIcon />
					</button>
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
				<nav className="dock" ref={dockRef} aria-label={t.common.verse}>
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
