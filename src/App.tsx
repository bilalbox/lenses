import { useEffect, useState, type ReactNode } from "react";
import { stripDiacritics } from "./lib/arabic";
import { loadManifest, loadVerses } from "./lib/api";
import { homePath, homeVerse } from "./lib/home";
import { startLibrary, watchLibrary, type LibraryProgress } from "./lib/library";
import { searchVerses, type ExampleQuery, type VerseHit } from "./lib/search";
import type { Manifest, Route } from "./lib/types";
import { useI18n } from "./lib/i18n/I18nContext";
import { normalizeDigits } from "./lib/i18n/format";
import { ExampleSearch } from "./components/ExampleSearch";
import { SourcesPage } from "./components/SourcesPage";
import { SurahIndex } from "./components/SurahIndex";
import { VerseScreen } from "./components/VerseScreen";
import { SettingsModal } from "./components/SettingsModal";
import { GearIcon, SearchIcon, ChevronLeftIcon, ChevronRightIcon } from "./components/Icons";

function parseRoute(hash: string): Route {
  const parts = (hash.replace(/^#/, "") || homePath).split("/").filter(Boolean);
  if (parts[0] === "search") return { page: "search", ...homeVerse };
  if (parts[0] === "surahs") return { page: "surahs", ...homeVerse };
  if (parts[0] === "sources") return { page: "sources", ...homeVerse };
  const sura = Number(parts[0]);
  const verse = Number(parts[1]);
  const word = parts[2] ? Number(parts[2]) : undefined;
  if (!sura || !verse) return { page: "verse", ...homeVerse };
  return { page: "verse", sura, verse, word };
}

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

export function App() {
  const { t, dir } = useI18n();
  const [route, setRoute] = useState(() => parseRoute(location.hash));
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || "light");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<VerseHit[]>([]);
  const [hitTotal, setHitTotal] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [seed, setSeed] = useState<Partial<ExampleQuery> | undefined>(undefined);
  const [install, setInstall] = useState<BeforeInstallPromptEvent | null>(null);
  const [library, setLibrary] = useState<LibraryProgress | null>(null);

  useEffect(() => {
    if (!location.hash) location.replace(`#${homePath}`);
    const onHash = () => setRoute(parseRoute(location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    loadManifest()
      .then(setManifest)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load the catalog."));
  }, []);

  useEffect(() => {
    return watchLibrary((progress) => {
      setLibrary(progress);
      if (progress.total > 0 && progress.done >= progress.total) {
        window.setTimeout(() => {
          setLibrary((current) => (current && current.done >= current.total ? null : current));
        }, 2600);
      }
    });
  }, []);

  useEffect(() => {
    if (manifest) startLibrary(manifest);
  }, [manifest]);

  useEffect(() => {
    const onScroll = () => document.documentElement.classList.toggle("is-scrolled", window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setSearchOpen(false);
  }, [route.page, route.sura, route.verse, route.word]);

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

  const selectTheme = (next: "light" | "dark") => {
    document.documentElement.dataset.theme = next;
    localStorage.setItem("lenses-theme", next);
    setTheme(next);
  };

  const stepVerse = (delta: number) => {
    if (!manifest) return;
    const unit = manifest.units.find((item) => item.n === route.sura);
    if (!unit) return;
    let nextVerse = route.verse + delta;
    let nextSura = route.sura;
    if (nextVerse < 1) {
      nextSura = route.sura === 1 ? 114 : route.sura - 1;
      nextVerse = manifest.units.find((item) => item.n === nextSura)?.verses ?? 1;
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

  const openSearch = (next: Partial<ExampleQuery>) => {
    setSeed(next);
    go("/search");
    setSearchOpen(false);
  };

  return (
    <div className="app">
      <header className="topbar">
        <a className="mark" href={`#${homePath}`}>
          <span className="mark-ar" lang="ar">{t.common.appNameAr}</span>
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
                <li className="finder-count">{t.common.versesCount(hitTotal)}</li>
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
          <a href="#/surahs" aria-current={route.page === "surahs" ? "page" : undefined}>
            {t.common.surahsNav}
          </a>
          <a href="#/search" aria-current={route.page === "search" ? "page" : undefined}>
            {t.common.examplesNav}
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
        {manifest && route.page === "verse" ? (
          <VerseScreen
            manifest={manifest}
            sura={route.sura}
            verseNumber={route.verse}
            wordNumber={route.word}
            onNavigate={(sura, verse, word) => go(word ? `/${sura}/${verse}/${word}` : `/${sura}/${verse}`)}
            onSearchRoot={(root) => openSearch({ root })}
            onSearchLemma={(lemma) => openSearch({ lemma })}
          />
        ) : null}
        {manifest && route.page === "search" ? (
          <ExampleSearch initial={seed} onOpen={(sura, verse, word) => go(`/${sura}/${verse}/${word}`)} />
        ) : null}
        {manifest && route.page === "surahs" ? <SurahIndex manifest={manifest} onOpen={(sura) => go(`/${sura}/1`)} /> : null}
        {manifest && route.page === "sources" ? <SourcesPage manifest={manifest} /> : null}
      </main>
      <nav className="dock" aria-label={t.common.verse}>
        <button type="button" onClick={() => stepVerse(-1)}>
          {dir === "rtl" ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          <span>{t.common.previous}</span>
        </button>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const raw = (event.currentTarget.elements.namedItem("jump") as HTMLInputElement).value;
            const input = normalizeDigits(raw);
            const match = input.trim().match(/^(\d{1,3})\s*[:\u061b]\s*(\d{1,3})$/);
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
            requestAnimationFrame(() => document.querySelector<HTMLInputElement>(".finder input")?.focus());
          }}
        >
          <SearchIcon />
          <span>{t.common.search}</span>
        </button>
      </nav>
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        onSelectTheme={selectTheme}
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
