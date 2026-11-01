import { getOpeningVerse, openingPath } from "./home";
import type { Route, VerseRef } from "./types";

const SIMPLE_PAGES = new Set(["quiz", "search", "surahs", "sources"] as const);

type SimplePage = "quiz" | "search" | "surahs" | "sources";

function parseTab(params: URLSearchParams): string | undefined {
	const explicit = params.get("tab");
	if (explicit) return explicit;
	// Legacy flag params (`?asbab=1`) predate `tab=`.
	for (const legacy of ["mutashabih", "asbab"]) {
		if (params.has(legacy)) return legacy;
	}
	return undefined;
}

/** `2:58` ↔ `{ sura: 2, verse: 58 }`; the format of the `target` query param. */
export function verseRefParam(ref: VerseRef): string {
	return `${ref.sura}:${ref.verse}`;
}

function parseVerseRef(value: string | null): VerseRef | undefined {
	const match = value?.trim().match(/^(\d{1,3}):(\d{1,3})$/);
	if (!match) return undefined;
	const sura = Number(match[1]);
	const verse = Number(match[2]);
	if (sura < 1 || sura > 114 || verse < 1) return undefined;
	return { sura, verse };
}

/** Pages that were removed; their old links open the same surah and verse in the reader. */
const RETIRED_PAGES = new Set([
	"rhetoric",
	"balagha",
	"munasabat",
	"munasabaat",
	"structure",
]);

/** The reader path an old link to a removed page should show instead, if it is one. */
export function retiredPageRedirect(hash: string): string | null {
	const head = hash.replace(/^#\/?/, "").split(/[/?]/)[0] ?? "";
	if (!RETIRED_PAGES.has(head)) return null;
	const route = parseRoute(hash);
	return `/${route.sura}/${route.verse}`;
}

function retiredPageRoute(parts: string[], fallback: VerseRef): Route | null {
	if (!parts[0] || !RETIRED_PAGES.has(parts[0])) return null;
	const sura = Number(parts[1]);
	if (!sura || sura < 1 || sura > 114) return { page: "verse", ...fallback };
	return { page: "verse", sura, verse: Number(parts[2]) || 1 };
}

export function parseRoute(hash: string): Route {
	const fallback = getOpeningVerse();
	const queryIndex = hash.indexOf("?");
	const queryString = queryIndex >= 0 ? hash.slice(queryIndex + 1) : "";
	const cleanHash =
		(queryIndex >= 0 ? hash.slice(0, queryIndex) : hash).replace(/^#/, "") ||
		openingPath();
	const parts = cleanHash.split("/").filter(Boolean);
	const params = new URLSearchParams(queryString);
	const tab = parseTab(params);
	const target = parseVerseRef(
		params.get("target") ?? params.get("counterpart"),
	);
	const head = parts[0];

	if (head && (SIMPLE_PAGES as Set<string>).has(head)) {
		return { page: head as SimplePage, ...fallback, tab, target };
	}

	const retired = retiredPageRoute(parts, fallback);
	if (retired) return retired;

	const sura = Number(parts[0]);
	const verse = Number(parts[1]);
	const word = parts[2] ? Number(parts[2]) : undefined;
	if (!sura || !verse) return { page: "verse", ...fallback, tab, target };
	return { page: "verse", sura, verse, word, tab, target };
}
