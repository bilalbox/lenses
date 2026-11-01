/** The reader's quiz settings, kept in localStorage one key per switch. */
export type QuizPrefKey = "hideDiacritics" | "extendedRoles";

export type QuizPrefs = Record<QuizPrefKey, boolean>;

export const QUIZ_PREF_KEYS: QuizPrefKey[] = [
	"hideDiacritics",
	"extendedRoles",
];

const STORAGE_KEYS: Record<QuizPrefKey, string> = {
	hideDiacritics: "lenses-quiz-hide-diacritics",
	extendedRoles: "lenses-quiz-extended-roles",
};

function read(key: QuizPrefKey): boolean {
	try {
		return localStorage.getItem(STORAGE_KEYS[key]) === "1";
	} catch {
		return false;
	}
}

/** Every switch starts off; storage that cannot be read leaves it off. */
export function loadQuizPrefs(): QuizPrefs {
	return {
		hideDiacritics: read("hideDiacritics"),
		extendedRoles: read("extendedRoles"),
	};
}

export function saveQuizPref(key: QuizPrefKey, on: boolean): void {
	try {
		localStorage.setItem(STORAGE_KEYS[key], on ? "1" : "0");
	} catch {
		// Private mode or blocked storage: the switch still holds for this visit.
	}
}
