import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	getOpeningVerse,
	homeVerse,
	openingPath,
	rememberVerse,
} from "../../src/lib/home";

const store = new Map<string, string>();

describe("home verse navigation", () => {
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

	it("defaults to homeVerse (59:18) on first visit", () => {
		expect(getOpeningVerse()).toEqual({
			sura: homeVerse.sura,
			verse: homeVerse.verse,
		});
		expect(openingPath()).toBe(`/${homeVerse.sura}/${homeVerse.verse}`);
	});

	it("remembers and restores a valid last visited verse", () => {
		rememberVerse(2, 255);
		expect(getOpeningVerse()).toEqual({ sura: 2, verse: 255 });
		expect(openingPath()).toBe("/2/255");
	});

	it("ignores out-of-range verses when remembering", () => {
		rememberVerse(0, 1);
		expect(getOpeningVerse()).toEqual({
			sura: homeVerse.sura,
			verse: homeVerse.verse,
		});

		rememberVerse(115, 1);
		expect(getOpeningVerse()).toEqual({
			sura: homeVerse.sura,
			verse: homeVerse.verse,
		});

		rememberVerse(1, 0);
		expect(getOpeningVerse()).toEqual({
			sura: homeVerse.sura,
			verse: homeVerse.verse,
		});
	});

	it("handles malformed stored verse gracefully", () => {
		store.set("lenses-last-verse", "invalid:data");
		expect(getOpeningVerse()).toEqual({
			sura: homeVerse.sura,
			verse: homeVerse.verse,
		});
	});

	it("handles localStorage errors gracefully", () => {
		Object.defineProperty(globalThis, "localStorage", {
			configurable: true,
			value: {
				getItem: () => {
					throw new Error("storage quota or security error");
				},
				setItem: () => {
					throw new Error("storage quota or security error");
				},
			},
		});

		expect(() => rememberVerse(2, 1)).not.toThrow();
		expect(getOpeningVerse()).toEqual({
			sura: homeVerse.sura,
			verse: homeVerse.verse,
		});
	});
});
