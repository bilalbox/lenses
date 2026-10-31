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
