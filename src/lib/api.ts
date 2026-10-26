import type { Manifest, SurahFile, VerseRow, WordIndex } from "./types";
import type { RhetoricEntry } from "./rhetoric";

const surahs = new Map<number, SurahFile>();
let manifestPromise: Promise<Manifest> | null = null;
let versesPromise: Promise<VerseRow[]> | null = null;
let wordsPromise: Promise<WordIndex> | null = null;
let rhetoricPromise: Promise<RhetoricEntry[]> | null = null;

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load ${url} (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export function loadManifest(): Promise<Manifest> {
  manifestPromise ??= getJson<Manifest>("/data/quran/manifest.json");
  return manifestPromise;
}

export function loadSurah(n: number): Promise<SurahFile> {
  const cached = surahs.get(n);
  if (cached) return Promise.resolve(cached);
  const pending = getJson<SurahFile>(`/data/quran/surah/${String(n).padStart(3, "0")}.json`).then((file) => {
    surahs.set(n, file);
    return file;
  });
  return pending;
}

export function loadVerses(): Promise<VerseRow[]> {
  versesPromise ??= getJson<VerseRow[]>("/data/quran/verses.json");
  return versesPromise;
}

export function loadWordIndex(): Promise<WordIndex> {
  wordsPromise ??= getJson<WordIndex>("/data/quran/words.json");
  return wordsPromise;
}

export function loadRhetoric(): Promise<RhetoricEntry[]> {
  rhetoricPromise ??= getJson<RhetoricEntry[]>("/data/quran/rhetoric.json");
  return rhetoricPromise;
}

const translationCache = new Map<string, Promise<string>>();

export function loadVerseTranslation(
  key: "english_saheeh" | "indonesian_sabiq",
  sura: number,
  aya: number,
): Promise<string> {
  const cacheKey = `${key}:${sura}:${aya}`;
  const cached = translationCache.get(cacheKey);
  if (cached) return cached;

  // Check persistent storage first (instant & offline-capable)
  try {
    const stored = localStorage.getItem(`lenses-tr:${cacheKey}`);
    if (stored) {
      const resolved = Promise.resolve(stored);
      translationCache.set(cacheKey, resolved);
      return resolved;
    }
  } catch {
    // Ignore localStorage errors
  }

  const promise = fetch(`https://quranenc.com/api/v1/translation/aya/${key}/${sura}/${aya}`)
    .then((res) => {
      if (!res.ok) throw new Error("Translation fetch failed");
      return res.json();
    })
    .then((data) => {
      const text = data?.result?.translation;
      if (typeof text === "string" && text.trim()) {
        const cleaned = text.trim();
        try {
          localStorage.setItem(`lenses-tr:${cacheKey}`, cleaned);
        } catch {
          // Ignore quota errors
        }
        return cleaned;
      }
      return "";
    })
    .catch(() => "");

  translationCache.set(cacheKey, promise);
  return promise;
}
