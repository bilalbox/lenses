import { homeVerse } from "./home";
import { layerUrl } from "./layers";
import type { Manifest } from "./types";

export interface LibraryProgress {
	done: number;
	total: number;
}

const listeners = new Set<(progress: LibraryProgress) => void>();
let latest: LibraryProgress | null = null;
let started = false;

function publish(progress: LibraryProgress) {
	latest = progress;
	for (const listener of listeners) listener(progress);
}

export function watchLibrary(listener: (progress: LibraryProgress) => void) {
	listeners.add(listener);
	if (latest && latest.done < latest.total) listener(latest);
	return () => {
		listeners.delete(listener);
	};
}

/** Download the corpus into the service worker cache without blocking the open verse. */
export function startLibrary(manifest: Manifest) {
	if (started) return;
	started = true;
	void fill(manifest);
}

async function fill(manifest: Manifest) {
	const surahs = manifest.units.map((unit) => unit.n);
	surahs.sort((a, b) => {
		if (a === homeVerse.sura) return -1;
		if (b === homeVerse.sura) return 1;
		return a - b;
	});
	const urls = [
		...surahs.map((sura) => layerUrl("surah", sura)),
		layerUrl("verses"),
		layerUrl("words"),
	];
	let cursor = 0;
	let done = 0;
	const total = urls.length;
	publish({ done, total });

	if ("serviceWorker" in navigator) {
		await Promise.race([
			navigator.serviceWorker.ready,
			new Promise((resolve) => setTimeout(resolve, 4000)),
		]);
	}
	void navigator.storage?.persist?.();

	async function worker() {
		for (;;) {
			const index = cursor;
			cursor += 1;
			if (index >= urls.length) return;
			const url = urls[index];
			if (!url) return;
			try {
				const response = await fetch(url);
				if (!response.ok) throw new Error(String(response.status));
				await response.arrayBuffer();
			} catch {
				// A later visit retries. The open verse does not depend on this queue.
			}
			done += 1;
			publish({ done, total });
		}
	}

	await Promise.all([worker(), worker(), worker()]);
}
