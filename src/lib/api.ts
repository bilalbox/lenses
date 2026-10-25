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
