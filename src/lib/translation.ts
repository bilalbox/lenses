const translationCache = new Map<string, Promise<string>>();

/** Per-ayah translation from QuranEnc, cached in memory and localStorage; resolves to "" on failure. */
export function loadVerseTranslation(
	key: "english_saheeh" | "indonesian_sabiq",
	sura: number,
	aya: number,
): Promise<string> {
	const cacheKey = `${key}:${sura}:${aya}`;
	const cached = translationCache.get(cacheKey);
	if (cached) return cached;

	// Check persistent storage first (instant & offline-capable)
	try {
		const stored = localStorage.getItem(`lenses-tr:${cacheKey}`);
		if (stored) {
			const resolved = Promise.resolve(stored);
			translationCache.set(cacheKey, resolved);
			return resolved;
		}
	} catch {
		// Ignore localStorage errors
	}

	const promise = fetch(
		`https://quranenc.com/api/v1/translation/aya/${key}/${sura}/${aya}`,
	)
		.then((res) => {
			if (!res.ok) throw new Error("Translation fetch failed");
			return res.json() as Promise<{ result?: { translation?: unknown } }>;
		})
		.then((data) => {
			const text = data?.result?.translation;
			if (typeof text === "string" && text.trim()) {
				const cleaned = text.trim();
				try {
					localStorage.setItem(`lenses-tr:${cacheKey}`, cleaned);
				} catch {
					// Ignore quota errors
				}
				return cleaned;
			}
			return "";
		})
		.catch(() => "");

	translationCache.set(cacheKey, promise);
	return promise;
}
