import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	DEFAULT_READER_PREFS,
	loadReaderPrefs,
	saveReaderPrefs,
} from "../../src/lib/readerPrefs";

const store = new Map<string, string>();

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
});

describe("readerPrefs", () => {
	it("defaults every reader layer to enabled", () => {
		expect(loadReaderPrefs()).toEqual(DEFAULT_READER_PREFS);
		expect(Object.values(DEFAULT_READER_PREFS).every(Boolean)).toBe(true);
	});

	it("persists and reloads toggles, ignoring unknown keys", () => {
		saveReaderPrefs({
			...DEFAULT_READER_PREFS,
			meaning: false,
			balagha: false,
		});
		const loaded = loadReaderPrefs();
		expect(loaded.meaning).toBe(false);
		expect(loaded.balagha).toBe(false);
		expect(loaded.nahw).toBe(true);
	});
});
