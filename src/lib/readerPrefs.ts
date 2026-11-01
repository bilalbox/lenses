export type ReaderLayerKey =
	| "meaning"
	| "irab"
	| "nahw"
	| "mutashabih"
	| "asbab"
	| "qiraat";

/** The reader's layer switches; every pref is one layer under the ayah. */
export type ReaderPrefs = Record<ReaderLayerKey, boolean>;

export const READER_LAYER_KEYS: ReaderLayerKey[] = [
	"meaning",
	"irab",
	"nahw",
	"mutashabih",
	"asbab",
	"qiraat",
];

export const DEFAULT_READER_PREFS: ReaderPrefs = {
	meaning: true,
	irab: true,
	nahw: false,
	mutashabih: false,
	asbab: false,
	qiraat: false,
};

const STORAGE_KEY = "lenses-reader-prefs";

export function loadReaderPrefs(): ReaderPrefs {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return { ...DEFAULT_READER_PREFS };
		const parsed = JSON.parse(raw) as Partial<ReaderPrefs>;
		const next = { ...DEFAULT_READER_PREFS };
		// Keys of removed layers (balagha, rhetoricStudio, munasabat) are dropped.
		for (const key of READER_LAYER_KEYS) {
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
