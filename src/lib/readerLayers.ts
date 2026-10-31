import { useCallback, useEffect, useMemo, useState } from "react";
import type { Locale } from "./i18n/types";
import { useLayer, useVerseLayer } from "./layers";
import { type ReaderPrefs, rhetoricFetchEnabled } from "./readerPrefs";
import { useRhetoric } from "./rhetoric";
import { loadVerseTranslation } from "./translation";
import type {
	AsbabNarration,
	MutashabihMatch,
	RhetoricEntry,
	Verse,
	VerseSyntax,
} from "./types";

/** Reader layers shown as collapsible drawers under the ayah. */
export type DrawerKey = "irab" | "mutashabih" | "asbab" | "balagha";
export type Drawers = Record<DrawerKey, boolean>;

/**
 * Drawers open on arrival: only the deep-linked one (`tab=`); iʿrāb starts closed.
 * The verse body remounts per ayah, so this is also the reset on navigation.
 */
export function drawersForTab(tab?: string): Drawers {
	return {
		irab: false,
		mutashabih: tab === "mutashabih",
		asbab: tab === "asbab",
		balagha: tab === "balagha",
	};
}

/**
 * Every reader layer for one ayah, already gated by its pref: a layer that is
 * off fetches nothing and comes back empty.
 */
export interface ReaderLayers {
	meaning: { enabled: boolean; translation: string };
	irab: { classical: string | undefined };
	nahw: { enabled: boolean; loading: boolean; syntax: VerseSyntax | null };
	mutashabih: {
		enabled: boolean;
		loading: boolean;
		matches: MutashabihMatch[];
	};
	asbab: { narrations: AsbabNarration[] };
	balagha: { entry: RhetoricEntry | undefined; studioLink: boolean };
	drawers: Drawers;
	setDrawer: (key: DrawerKey, open: boolean) => void;
}

const NO_MATCHES: MutashabihMatch[] = [];
const NO_NARRATIONS: AsbabNarration[] = [];

/** Translation for the meaning layer: preloaded rhetoric text first, then QuranEnc. */
function useVerseTranslation(
	enabled: boolean,
	sura: number,
	verse: number,
	preloaded: RhetoricEntry | undefined,
	locale: Locale,
): string {
	const [translation, setTranslation] = useState("");

	useEffect(() => {
		if (!enabled || locale === "ar") {
			setTranslation("");
			return;
		}
		const known =
			locale === "id" ? preloaded?.indonesianAyah : preloaded?.englishAyah;
		if (known) {
			setTranslation(known);
			return;
		}
		const key = locale === "id" ? "indonesian_sabiq" : "english_saheeh";
		let cancelled = false;
		loadVerseTranslation(key, sura, verse).then((text) => {
			if (!cancelled) setTranslation(text);
		});
		return () => {
			cancelled = true;
		};
	}, [enabled, locale, sura, verse, preloaded]);

	return translation;
}

export interface DrawerState {
	tab: string | undefined;
	drawers: Drawers;
}

/**
 * Drawer state as seen under `tab`, optionally after the reader toggles one.
 * A new deep-link tab discards earlier toggles and starts from its defaults.
 */
export function nextDrawers(
	state: DrawerState,
	tab: string | undefined,
	toggle?: { key: DrawerKey; open: boolean },
): DrawerState {
	const drawers = state.tab === tab ? state.drawers : drawersForTab(tab);
	if (!toggle) return state.tab === tab ? state : { tab, drawers };
	return { tab, drawers: { ...drawers, [toggle.key]: toggle.open } };
}

function useDrawers(tab?: string) {
	const [state, setState] = useState<DrawerState>(() => ({
		tab,
		drawers: drawersForTab(tab),
	}));
	const setDrawer = useCallback(
		(key: DrawerKey, open: boolean) =>
			setState((current) => nextDrawers(current, tab, { key, open })),
		[tab],
	);
	// Answer a new tab on the same render rather than one render late.
	return { drawers: nextDrawers(state, tab).drawers, setDrawer };
}

export function useReaderLayers(
	prefs: ReaderPrefs,
	sura: number,
	verse: Verse,
	locale: Locale,
	tab?: string,
): ReaderLayers {
	const asbab = useLayer("asbab", { enabled: prefs.asbab });
	const syntax = useVerseLayer("syntax", sura, verse.v, {
		enabled: prefs.nahw,
	});
	const mutashabih = useVerseLayer("mutashabih", sura, verse.v, {
		enabled: prefs.mutashabih,
	});
	const { entries: rhetoric } = useRhetoric(rhetoricFetchEnabled(prefs));
	const verseRhetoric = useMemo(
		() => rhetoric.filter((e) => e.sura === sura && e.verse === verse.v),
		[rhetoric, sura, verse.v],
	);
	const translation = useVerseTranslation(
		prefs.meaning,
		sura,
		verse.v,
		verseRhetoric[0],
		locale,
	);
	const { drawers, setDrawer } = useDrawers(tab);

	return {
		meaning: { enabled: prefs.meaning, translation },
		irab: { classical: prefs.irab ? verse.ir : undefined },
		nahw: {
			enabled: prefs.nahw,
			loading: syntax.loading,
			syntax: syntax.data ?? null,
		},
		mutashabih: {
			enabled: prefs.mutashabih,
			loading: mutashabih.loading,
			matches: mutashabih.data?.matches ?? NO_MATCHES,
		},
		asbab: {
			narrations: asbab.data?.[`${sura}:${verse.v}`] ?? NO_NARRATIONS,
		},
		balagha: {
			entry: prefs.balagha
				? verseRhetoric.find((e) => e.dataset === "classical-balagha")
				: undefined,
			studioLink: prefs.rhetoricStudio,
		},
		drawers,
		setDrawer,
	};
}
