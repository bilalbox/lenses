import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	DEFAULT_READER_PREFS,
	loadReaderPrefs,
	rhetoricFetchEnabled,
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
	it("defaults meaning and iʿrāb on; other layers and features off", () => {
		expect(loadReaderPrefs()).toEqual(DEFAULT_READER_PREFS);
		expect(DEFAULT_READER_PREFS.meaning).toBe(true);
		expect(DEFAULT_READER_PREFS.irab).toBe(true);
		expect(DEFAULT_READER_PREFS.nahw).toBe(false);
		expect(DEFAULT_READER_PREFS.mutashabih).toBe(false);
		expect(DEFAULT_READER_PREFS.asbab).toBe(false);
		expect(DEFAULT_READER_PREFS.balagha).toBe(false);
		expect(DEFAULT_READER_PREFS.rhetoricStudio).toBe(false);
		expect(DEFAULT_READER_PREFS.munasabat).toBe(false);
	});

	it("persists and reloads toggles, filling missing keys from defaults", () => {
		saveReaderPrefs({
			...DEFAULT_READER_PREFS,
			meaning: false,
			balagha: true,
		});
		const loaded = loadReaderPrefs();
		expect(loaded.meaning).toBe(false);
		expect(loaded.balagha).toBe(true);
		expect(loaded.nahw).toBe(false);
		expect(loaded.rhetoricStudio).toBe(false);
	});

	it("keeps previously stored layer values when defaults change under them", () => {
		store.set(
			"lenses-reader-prefs",
			JSON.stringify({
				meaning: true,
				irab: true,
				nahw: true,
				mutashabih: true,
				asbab: true,
				balagha: true,
			}),
		);
		const loaded = loadReaderPrefs();
		expect(loaded.nahw).toBe(true);
		expect(loaded.mutashabih).toBe(true);
		expect(loaded.rhetoricStudio).toBe(false);
		expect(loaded.munasabat).toBe(false);
	});

	it("gates rhetoric fetch on balāghah layer or studio", () => {
		expect(rhetoricFetchEnabled(DEFAULT_READER_PREFS)).toBe(false);
		expect(
			rhetoricFetchEnabled({ ...DEFAULT_READER_PREFS, balagha: true }),
		).toBe(true);
		expect(
			rhetoricFetchEnabled({ ...DEFAULT_READER_PREFS, rhetoricStudio: true }),
		).toBe(true);
	});
});
