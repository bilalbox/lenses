import type {
	IrabAppendixVerse,
	IrabDictionaryFile,
	IrabEntry,
	Segment,
	Word,
} from "./types";

/**
 * Normalizes Arabic text for dictionary lookup:
 * - Maps dagger alif to regular alif
 * - Strips tashkeel, tatweel, punctuation, whitespace
 * - Folds hamza variants (أ, إ, آ, ء, ؤ, ئ -> ا)
 * - Folds alif maqsura (ى -> ي) and ta marbuta (ة -> ه)
 */
export function normalizeArabic(s: string): string {
	return s
		.replace(/[ىي]\u0670/g, "ي")
		.replace(/\u0670/g, "ا")
		.replace(/[\u064B-\u065F\u0640\u0671\s()«».,:_\-—?؟!\u200c\u200d]/g, "")
		.replace(/[أإآءؤئ]/g, "ا")
		.replace(/ى/g, "ي")
		.replace(/ة/g, "ه");
}

/**
 * Look up dictionary entries matching a given word or segment.
 */
export function getEntriesForWord(
	dict: IrabDictionaryFile | undefined,
	word: Word | undefined,
	segment?: Segment,
): IrabEntry[] {
	if (!dict || !word) return [];

	const rawKeys: string[] = [];
	if (segment?.la) rawKeys.push(segment.la);
	if (segment?.a) rawKeys.push(segment.a);
	if (word.a) rawKeys.push(word.a);

	const seenIds = new Set<number>();
	const entries: IrabEntry[] = [];

	for (const raw of rawKeys) {
		const key = normalizeArabic(raw);
		if (key.length < 2) continue;

		const ids = dict.byWord[key];
		if (!ids) continue;

		for (const id of ids) {
			if (!seenIds.has(id)) {
				seenIds.add(id);
				const entry = dict.entries[id];
				if (entry) entries.push(entry);
			}
		}
	}

	// Prioritize exact normalized title matches
	const targetNorms = new Set(rawKeys.map(normalizeArabic));
	entries.sort((a, b) => {
		const aExact = targetNorms.has(normalizeArabic(a.title)) ? 0 : 1;
		const bExact = targetNorms.has(normalizeArabic(b.title)) ? 0 : 1;
		if (aExact !== bExact) return aExact - bExact;
		return a.id - b.id;
	});

	return entries;
}

/**
 * Look up dictionary entries that cite the given verse as a grammatical proof text.
 */
export function getCitationsForVerse(
	dict: IrabDictionaryFile | undefined,
	sura: number,
	verse: number,
): IrabEntry[] {
	if (!dict) return [];
	const ids = dict.byVerse[`${sura}:${verse}`];
	if (!ids || ids.length === 0) return [];

	return ids
		.map((id) => dict.entries[id])
		.filter((e): e is IrabEntry => e !== undefined);
}

/**
 * Look up Dr. Émile Badīʿ Yaʿqūb's model parsing for verses in Surah 1 & 2:1-25.
 */
export function getAppendixVerse(
	dict: IrabDictionaryFile | undefined,
	sura: number,
	verse: number,
): IrabAppendixVerse | undefined {
	if (!dict?.appendix) return undefined;
	return dict.appendix[`${sura}:${verse}`];
}
