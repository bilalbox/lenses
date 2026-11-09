import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadVerseTranslation } from "../../src/lib/translation";

const store = new Map<string, string>();

describe("loadVerseTranslation", () => {
	beforeEach(() => {
		store.clear();
		Object.defineProperty(globalThis, "localStorage", {
			configurable: true,
			value: {
				getItem: (key: string) => store.get(key) ?? null,
				setItem: (key: string, value: string) => {
					store.set(key, value);
				},
				removeItem: (key: string) => {
					store.delete(key);
				},
			},
		});
	});

	afterEach(() => {
		store.clear();
		vi.unstubAllGlobals();
	});

	it("returns cached translation from localStorage if available", async () => {
		store.set("lenses-tr:english_saheeh:1:1", "In the name of Allah");
		const text = await loadVerseTranslation("english_saheeh", 1, 1);
		expect(text).toBe("In the name of Allah");
	});

	it("fetches and caches translation on network success", async () => {
		const mockFetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				result: { translation: "All praise is due to Allah" },
			}),
		});
		vi.stubGlobal("fetch", mockFetch);

		const text = await loadVerseTranslation("english_saheeh", 1, 2);
		expect(text).toBe("All praise is due to Allah");
		expect(store.get("lenses-tr:english_saheeh:1:2")).toBe(
			"All praise is due to Allah",
		);

		// Second call should return in-memory cached promise without re-fetching
		const cached = await loadVerseTranslation("english_saheeh", 1, 2);
		expect(cached).toBe("All praise is due to Allah");
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it("resolves to empty string on network failure", async () => {
		const mockFetch = vi.fn().mockRejectedValue(new Error("Network offline"));
		vi.stubGlobal("fetch", mockFetch);

		const text = await loadVerseTranslation("indonesian_sabiq", 99, 99);
		expect(text).toBe("");
	});
});
