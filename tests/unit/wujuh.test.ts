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

	it("finds a particle's entry by its lemma", () => {
		const particles: WujuhFile = {
			"~fiY": [{ h: "في", s: [{ l: "مع", c: [[7, 38, 4, "", "فِىٓ", ""]] }] }],
		};
		const fi: Segment = { k: "m", a: "فِىٓ", p: "P", l: "fiY", la: "فِى" };
		const views = wujuhFor(particles, fi, 7, 38, 4);
		expect(views.map((v) => [v.entry.h, v.here])).toEqual([["في", 0]]);
	});

	it("lists a particle's senses where he does not cite it", () => {
		const particles: WujuhFile = {
			"~*uw": [
				{ h: "ذات", s: [{ l: "الخصومة", c: [[8, 1, 12, "", "ذَاتَ", ""]] }] },
			],
		};
		const dhu: Segment = { k: "m", a: "ذَاتِ", p: "N", l: "*uw", la: "ذُو" };
		const views = wujuhFor(particles, dhu, 3, 119, 9);
		expect(views.map((v) => [v.entry.h, v.here])).toEqual([["ذات", -1]]);
	});

	it("shows nothing for another word of the same root", () => {
		const amam: Segment = { ...umma, la: "أَمَام" };
		expect(wujuhFor(file, amam, 18, 79, 9)).toEqual([]);
	});
});
