import { describe, expect, it } from "vitest";
import { laneEntriesFor, lexiconSlug, lexiconUrl } from "../../src/lib/lexicon";
import type { LaneEntry } from "../../src/lib/types";

describe("lexicon", () => {
	it("gives case twins distinct, case-insensitive-safe file names", () => {
		const roots = ["nws", "nwS", "Hmd", "hmd", "$Er", "E*b"];
		const slugs = roots.map(lexiconSlug);
		expect(slugs).toEqual(["nws", "nws2", "h2md", "hmd", "ce2r", "e2ob"]);
		expect(new Set(slugs.map((s) => s.toLowerCase())).size).toBe(roots.length);
		expect(lexiconUrl("nwS")).toBe("/data/quran/lexicon/nws2.json");
	});

	it("puts Lane's entries for the word's lemma first", () => {
		const entries: LaneEntry[] = [
			{ h: "نَاسَ", f: "1", t: ["aor. "] },
			{ h: "نَاسٌ", t: ["is applied to ", [1, "Men,"]] },
		];
		const { word, rest } = laneEntriesFor(entries, "نَّاس");
		expect(word.map((e) => e.h)).toEqual(["نَاسٌ"]);
		expect(rest.map((e) => e.h)).toEqual(["نَاسَ"]);
		expect(laneEntriesFor(entries, undefined).rest).toHaveLength(2);
	});
});
