import type { Manifest } from "./types";

/** Arabic surah name in the Arabic UI, transliteration otherwise; `S{n}` before the manifest loads. */
export function surahTitle(
	manifest: Manifest | undefined,
	sura: number,
	locale: string,
): string {
	const unit = manifest?.units.find((u) => u.n === sura);
	if (!unit) return `S${sura}`;
	return locale === "ar" ? unit.name : unit.phonetic;
}

/** A surah's name for display: Arabic in the Arabic UI, the transliteration otherwise. */
export function surahLabel(
	unit: { name: string; phonetic: string },
	locale: string,
): string {
	return locale === "ar" ? unit.name : unit.phonetic;
}

/** The verse `delta` steps away, wrapping across surah boundaries and from 114 back to 1. */
export function adjacentVerse(
	manifest: Manifest,
	sura: number,
	verse: number,
	delta: number,
): { sura: number; verse: number } | null {
	const unit = manifest.units.find((item) => item.n === sura);
	if (!unit) return null;
	const next = verse + delta;
	if (next < 1) {
		const prevSura = sura === 1 ? 114 : sura - 1;
		const prevVerses =
			manifest.units.find((item) => item.n === prevSura)?.verses ?? 1;
		return { sura: prevSura, verse: prevVerses };
	}
	if (next > unit.verses)
		return { sura: sura === 114 ? 1 : sura + 1, verse: 1 };
	return { sura, verse: next };
}
