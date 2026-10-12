import { type Locale, LOCALES } from "./types";

export const STORAGE_KEY = "lenses-lang";

export function detectBrowserLocale(): Locale {
  const candidates: string[] = [];
  if (typeof navigator !== "undefined") {
    if (navigator.languages) candidates.push(...navigator.languages);
    if (navigator.language) candidates.push(navigator.language);
  }
  for (const candidate of candidates) {
    const code = candidate.toLowerCase().split("-")[0];
    if (code === "ar") return "ar";
    if (code === "id" || code === "in") return "id";
    if (code === "en") return "en";
  }
  return "en";
}

export function getInitialLocale(): Locale {
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && stored in LOCALES) return stored;
  }
  return detectBrowserLocale();
}
