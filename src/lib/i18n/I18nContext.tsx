import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import { getInitialLocale, STORAGE_KEY } from "./detection";
import { formatNum } from "./format";
import { ar } from "./locales/ar";
import { en } from "./locales/en";
import { id } from "./locales/id";
import {
	type Direction,
	LOCALES,
	type Locale,
	type Translations,
} from "./types";

const DICTIONARIES: Record<Locale, Translations> = { en, ar, id };

export interface I18nContextValue {
	locale: Locale;
	dir: Direction;
	t: Translations;
	setLocale: (next: Locale) => void;
	formatNumber: (n: number) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
	const [locale, setLocaleState] = useState<Locale>(() => getInitialLocale());

	const setLocale = (next: Locale) => {
		setLocaleState(next);
		try {
			localStorage.setItem(STORAGE_KEY, next);
		} catch {
			// localStorage may fail in private browsing mode
		}
		document.documentElement.lang = next;
		document.documentElement.dir = LOCALES[next].dir;
	};

	useEffect(() => {
		document.documentElement.lang = locale;
		document.documentElement.dir = LOCALES[locale].dir;
	}, [locale]);

	const value: I18nContextValue = {
		locale,
		dir: LOCALES[locale].dir,
		t: DICTIONARIES[locale],
		setLocale,
		formatNumber: (n: number) => formatNum(n, locale),
	};

	return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
	const ctx = useContext(I18nContext);
	if (!ctx) {
		throw new Error("useI18n must be used within an I18nProvider");
	}
	return ctx;
}
