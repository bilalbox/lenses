import { describe, expect, it } from "vitest";
import { surahLabel, surahTitle } from "../../src/lib/manifest";
import type { Manifest } from "../../src/lib/types";

describe("manifest", () => {
	const mockManifest = {
		units: [
			{
				n: 1,
				name: "الفاتحة",
				phonetic: "Al-Fatihah",
				title: "The Opening",
				rev: "Meccan",
				verses: 7,
				syntax: 7,
			},
			{
				n: 114,
				name: "الناس",
				phonetic: "An-Nas",
				title: "Mankind",
				rev: "Meccan",
				verses: 6,
				syntax: 6,
			},
		],
	} as unknown as Manifest;

	it("returns Arabic name in Arabic locale and phonetic otherwise", () => {
		expect(surahTitle(mockManifest, 1, "ar")).toBe("الفاتحة");
		expect(surahTitle(mockManifest, 1, "en")).toBe("Al-Fatihah");
		expect(surahTitle(mockManifest, 1, "id")).toBe("Al-Fatihah");
	});

	it("falls back to S{n} when unit is not in manifest or manifest is undefined", () => {
		expect(surahTitle(mockManifest, 2, "ar")).toBe("S2");
		expect(surahTitle(undefined, 1, "en")).toBe("S1");
	});

	it("formats surahLabel correctly by locale", () => {
		const unit = { name: "الفاتحة", phonetic: "Al-Fatihah" };
		expect(surahLabel(unit, "ar")).toBe("الفاتحة");
		expect(surahLabel(unit, "en")).toBe("Al-Fatihah");
	});
});
