export type ReaderLayerKey =
	| "meaning"
	| "irab"
	| "nahw"
	| "mutashabih"
	| "asbab"
	| "balagha";

export type FeaturePrefKey = "rhetoricStudio" | "munasabat";

export type ReaderPrefKey = ReaderLayerKey | FeaturePrefKey;

export type ReaderPrefs = Record<ReaderPrefKey, boolean>;

export const READER_LAYER_KEYS: ReaderLayerKey[] = [
	"meaning",
	"irab",
	"nahw",
	"mutashabih",
	"asbab",
	"balagha",
];

export const FEATURE_PREF_KEYS: FeaturePrefKey[] = [
	"rhetoricStudio",
	"munasabat",
];

export const ALL_READER_PREF_KEYS: ReaderPrefKey[] = [
	...READER_LAYER_KEYS,
	...FEATURE_PREF_KEYS,
];

export const DEFAULT_READER_PREFS: ReaderPrefs = {
	meaning: true,
	irab: true,
	nahw: false,
	mutashabih: false,
	asbab: false,
	balagha: false,
	rhetoricStudio: false,
	munasabat: false,
};

const STORAGE_KEY = "lenses-reader-prefs";

export function rhetoricFetchEnabled(prefs: ReaderPrefs): boolean {
	return prefs.balagha || prefs.rhetoricStudio;
}

export function loadReaderPrefs(): ReaderPrefs {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return { ...DEFAULT_READER_PREFS };
		const parsed = JSON.parse(raw) as Partial<ReaderPrefs>;
		const next = { ...DEFAULT_READER_PREFS };
		for (const key of ALL_READER_PREF_KEYS) {
			if (typeof parsed[key] === "boolean") next[key] = parsed[key];
		}
		return next;
	} catch {
		return { ...DEFAULT_READER_PREFS };
	}
}

export function saveReaderPrefs(prefs: ReaderPrefs): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
	} catch {
		// private browsing / quota
	}
}
