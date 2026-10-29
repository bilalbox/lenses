import { useEffect, useState } from "react";
import { loadRhetoric } from "./api";
import type {
	HadhfDetails,
	RhetoricBranch,
	RhetoricDatasetKey,
	RhetoricEntry,
	TashbihDetails,
} from "./types";

export type {
	HadhfDetails,
	RhetoricBranch,
	RhetoricDatasetKey,
	RhetoricEntry,
	TashbihDetails,
};

let memoryCache: RhetoricEntry[] | null = null;
let fetchPromise: Promise<RhetoricEntry[]> | null = null;

export function getRhetoricEntriesAsync(): Promise<RhetoricEntry[]> {
	if (memoryCache) return Promise.resolve(memoryCache);
	fetchPromise ??= loadRhetoric().then((data) => {
		memoryCache = data;
		return data;
	});
	return fetchPromise;
}

export function useRhetoric(enabled = true) {
	const [entries, setEntries] = useState<RhetoricEntry[]>(
		() => memoryCache || [],
	);
	const [loading, setLoading] = useState<boolean>(
		() => enabled && !memoryCache,
	);
	const [error, setError] = useState<string>("");

	useEffect(() => {
		if (!enabled) {
			if (memoryCache) setEntries(memoryCache);
			setLoading(false);
			return;
		}
		if (memoryCache) {
			setEntries(memoryCache);
			setLoading(false);
			return;
		}
		let cancelled = false;
		setLoading(true);
		getRhetoricEntriesAsync()
			.then((data) => {
				if (!cancelled) {
					setEntries(data);
					setLoading(false);
				}
			})
			.catch((err) => {
				if (!cancelled) {
					setError(
						err instanceof Error ? err.message : "Failed to load rhetoric data",
					);
					setLoading(false);
				}
			});
		return () => {
			cancelled = true;
		};
	}, [enabled]);

	return { entries, loading, error };
}

// Deprecated empty fallback for legacy synchronous references
export const RHETORIC_ENTRIES: RhetoricEntry[] = [];
