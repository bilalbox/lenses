import { describe, expect, it } from "vitest";
import type { Segment, WujuhFile } from "../../src/lib/types";
import { wujuhFor } from "../../src/lib/wujuh";

const file: WujuhFile = {
	Amm: [
		{
			h: "أم",
			s: [{ l: "الأصل", c: [[3, 7, 10, "", "أُمُّ", ""]] }],
		},
		{
			h: "أمة",
			s: [
				{ l: "عصبة", c: [[2, 128, 7, "", "أُمَّةً", ""]] },
				{ l: "ملة", c: [[2, 213, 3, "", "أُمَّةً", ""]] },
			],
		},
	],
};
const umma: Segment = {
	k: "m",
	a: "أُمَّةً",
	p: "N",
	la: "أُمَّة",
	r: "Amm",
	ra: "امم",
};

describe("wujuhFor", () => {
	it("finds the sense al-Dāmaghānī gives this occurrence", () => {
		const views = wujuhFor(file, umma, 2, 213, 3);
		expect(views.map((v) => [v.entry.h, v.here])).toEqual([["أمة", 1]]);
	});

	it("lists the senses, with none marked, for an occurrence he does not cite", () => {
		const views = wujuhFor(file, umma, 2, 143, 3);
		expect(views.map((v) => [v.entry.h, v.here])).toEqual([["أمة", -1]]);
	});

	it("shows nothing for another word of the same root", () => {
		const amam: Segment = { ...umma, la: "أَمَام" };
		expect(wujuhFor(file, amam, 18, 79, 9)).toEqual([]);
	});
});
