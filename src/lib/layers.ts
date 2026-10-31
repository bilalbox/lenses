import { useEffect, useState } from "react";
import type {
	AsbabData,
	Manifest,
	MutashabihQuizFile,
	RhetoricEntry,
	SurahFile,
	SurahMutashabihFile,
	SurahQiraatFile,
	SurahStructureFile,
	SurahSyntaxFile,
	TransitionsFile,
	VerseRow,
	WordIndex,
} from "./types";

/** One file for the whole corpus, at `/data/quran/{kind}.json`. */
interface CorpusLayers {
	manifest: Manifest;
	verses: VerseRow[];
	words: WordIndex;
	rhetoric: RhetoricEntry[];
	asbab: AsbabData;
	transitions: TransitionsFile;
	mutashabihQuiz: MutashabihQuizFile;
}

/** One file per surah, at `/data/quran/{kind}/{nnn}.json`. */
interface SurahLayers {
	surah: SurahFile;
	syntax: SurahSyntaxFile;
	qiraat: SurahQiraatFile;
	mutashabih: SurahMutashabihFile;
	structure: SurahStructureFile;
}

type CorpusLayer = keyof CorpusLayers;
type SurahLayer = keyof SurahLayers;

/** Surah layers whose file is a `verses: [{ v, … }]` list. */
type VerseLayer = {
	[K in SurahLayer]: SurahLayers[K] extends { verses: { v: number }[] }
		? K
		: never;
}[SurahLayer];
type VerseEntry<K extends VerseLayer> = SurahLayers[K]["verses"][number];

export function layerUrl(kind: CorpusLayer | SurahLayer, sura?: number) {
	return sura === undefined
		? `/data/quran/${kind}.json`
		: `/data/quran/${kind}/${String(sura).padStart(3, "0")}.json`;
}

// In-flight and settled requests share one entry per URL; a failure evicts it
// so the next caller retries instead of inheriting the rejection.
const requests = new Map<string, Promise<unknown>>();
const settled = new Map<string, unknown>();

async function getJson<T>(url: string): Promise<T> {
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Could not load ${url} (${response.status})`);
	}
	return response.json() as Promise<T>;
}

function request<T>(url: string): Promise<T> {
	const cached = requests.get(url);
	if (cached) return cached as Promise<T>;
	const pending = getJson<T>(url).then(
		(file) => {
			settled.set(url, file);
			return file;
		},
		(reason: unknown) => {
			requests.delete(url);
			throw reason;
		},
	);
	requests.set(url, pending);
	return pending;
}

export function loadLayer<K extends CorpusLayer>(
	kind: K,
): Promise<CorpusLayers[K]>;
export function loadLayer<K extends SurahLayer>(
	kind: K,
	sura: number,
): Promise<SurahLayers[K]>;
export function loadLayer(kind: CorpusLayer | SurahLayer, sura?: number) {
	return request(layerUrl(kind, sura));
}

const verseIndexes = new WeakMap<object, Map<number, unknown>>();

/** The entry for verse `v`, indexed once per file. */
export function findVerse<E extends { v: number }>(
	file: { verses: E[] },
	v: number,
): E | undefined {
	let index = verseIndexes.get(file);
	if (!index) {
		index = new Map(file.verses.map((entry) => [entry.v, entry]));
		verseIndexes.set(file, index);
	}
	return index.get(v) as E | undefined;
}

export interface LayerState<T> {
	data: T | undefined;
	loading: boolean;
	error: string;
}

interface LayerOptions {
	/** When false nothing is fetched and no data is returned. Defaults to true. */
	enabled?: boolean;
}

const IDLE: LayerState<never> = { data: undefined, loading: false, error: "" };

function stateFor<T>(url: string | null): LayerState<T> {
	if (!url) return IDLE;
	if (settled.has(url)) {
		return { data: settled.get(url) as T, loading: false, error: "" };
	}
	return { data: undefined, loading: true, error: "" };
}

function useRequest<T>(url: string | null): LayerState<T> {
	const [state, setState] = useState(() => ({ url, ...stateFor<T>(url) }));

	useEffect(() => {
		if (!url || settled.has(url)) return;
		let cancelled = false;
		request<T>(url).then(
			(data) => {
				if (!cancelled) setState({ url, data, loading: false, error: "" });
			},
			(reason: unknown) => {
				if (!cancelled)
					setState({
						url,
						data: undefined,
						loading: false,
						error: reason instanceof Error ? reason.message : String(reason),
					});
			},
		);
		return () => {
			cancelled = true;
		};
	}, [url]);

	// A new URL answers from the cache (or as loading) on the same render,
	// never with the previous URL's data.
	if (state.url !== url) return stateFor<T>(url);
	return state;
}

export function useLayer<K extends CorpusLayer>(
	kind: K,
	options?: LayerOptions,
): LayerState<CorpusLayers[K]>;
export function useLayer<K extends SurahLayer>(
	kind: K,
	sura: number,
	options?: LayerOptions,
): LayerState<SurahLayers[K]>;
export function useLayer(
	kind: CorpusLayer | SurahLayer,
	suraOrOptions?: number | LayerOptions,
	maybeOptions?: LayerOptions,
): LayerState<unknown> {
	const sura = typeof suraOrOptions === "number" ? suraOrOptions : undefined;
	const options =
		typeof suraOrOptions === "number" ? maybeOptions : suraOrOptions;
	const enabled = options?.enabled ?? true;
	return useRequest(enabled ? layerUrl(kind, sura) : null);
}

/** One verse's entry from a per-surah layer; `data` is undefined while loading or when the verse has none. */
export function useVerseLayer<K extends VerseLayer>(
	kind: K,
	sura: number,
	verse: number,
	options?: LayerOptions,
): LayerState<VerseEntry<K>> {
	const state = useLayer(kind, sura, options);
	const file = state.data as { verses: VerseEntry<K>[] } | undefined;
	return { ...state, data: file ? findVerse(file, verse) : undefined };
}
