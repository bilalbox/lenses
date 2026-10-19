/** First-visit opening verse. Al-Hashr 59:18 — look ahead at what one has sent forth. */
export const homeVerse = { sura: 59, verse: 18 } as const;

const LAST_VERSE_KEY = "lenses-last-verse";

export type VerseRef = { sura: number; verse: number };

/** Last viewed verse when present; otherwise the first-visit default (59:18). */
export function getOpeningVerse(): VerseRef {
  try {
    const raw = localStorage.getItem(LAST_VERSE_KEY);
    if (raw) {
      const match = raw.trim().match(/^(\d{1,3}):(\d{1,3})$/);
      if (match) {
        const sura = Number(match[1]);
        const verse = Number(match[2]);
        if (sura >= 1 && sura <= 114 && verse >= 1) return { sura, verse };
      }
    }
  } catch {
    // localStorage may fail in private browsing mode
  }
  return { sura: homeVerse.sura, verse: homeVerse.verse };
}

export function openingPath(): string {
  const { sura, verse } = getOpeningVerse();
  return `/${sura}/${verse}`;
}

export function rememberVerse(sura: number, verse: number) {
  if (sura < 1 || sura > 114 || verse < 1) return;
  try {
    localStorage.setItem(LAST_VERSE_KEY, `${sura}:${verse}`);
  } catch {
    // localStorage may fail in private browsing mode
  }
}
