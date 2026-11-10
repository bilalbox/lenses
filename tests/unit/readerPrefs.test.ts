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
	it("defaults meaning and iʿrāb on; other layers off", () => {
		expect(loadReaderPrefs()).toEqual(DEFAULT_READER_PREFS);
		expect(DEFAULT_READER_PREFS.meaning).toBe(true);
		expect(DEFAULT_READER_PREFS.irab).toBe(true);
		expect(DEFAULT_READER_PREFS.nahw).toBe(false);
		expect(DEFAULT_READER_PREFS.mutashabih).toBe(false);
		expect(DEFAULT_READER_PREFS.asbab).toBe(false);
		expect(DEFAULT_READER_PREFS.qiraat).toBe(false);
		expect(DEFAULT_READER_PREFS.wujuh).toBe(false);
		expect(DEFAULT_READER_PREFS.khatib).toBe(false);
	});

	it("persists and reloads toggles, filling missing keys from defaults", () => {
		saveReaderPrefs({
			...DEFAULT_READER_PREFS,
			meaning: false,
			asbab: true,
			khatib: true,
		});
		const loaded = loadReaderPrefs();
		expect(loaded.meaning).toBe(false);
		expect(loaded.asbab).toBe(true);
		expect(loaded.khatib).toBe(true);
		expect(loaded.nahw).toBe(false);
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
	});

	it("drops the switches of removed layers saved by older versions", () => {
		store.set(
			"lenses-reader-prefs",
			JSON.stringify({
				meaning: true,
				asbab: true,
				balagha: true,
				rhetoricStudio: true,
				munasabat: true,
			}),
		);
		const loaded = loadReaderPrefs();
		expect(loaded.asbab).toBe(true);
		expect(Object.keys(loaded).sort()).toEqual(
			Object.keys(DEFAULT_READER_PREFS).sort(),
		);
	});

	it("returns default prefs if stored JSON is corrupt", () => {
		store.set("lenses-reader-prefs", "not-json");
		expect(loadReaderPrefs()).toEqual(DEFAULT_READER_PREFS);
	});
});
