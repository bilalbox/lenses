import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
	arcTouches,
	layoutSentence,
	sentenceOfWord,
	TOKEN_WIDTH,
} from "../../src/lib/noorBayan";
import type {
	SurahSyntaxFile,
	SyntaxSentence,
	SyntaxToken,
} from "../../src/lib/types";

const SURA = 2;
const VERSE = 58;

/** One token per word; `head` is the head's word number in this verse, or a [verse, word] pair for a carried head. */
function sentence(
	words: {
		w: number;
		rel?: string;
		head?: number | [number, number] | null;
		const?: SyntaxToken["const"];
	}[],
	carried?: SyntaxSentence["carried"],
): SyntaxSentence {
	return {
		id: 1,
		carried,
		words: words.map(({ w, rel = "fa", head = null, const: c }) => ({
			w,
			text: `w${w}`,
			tokens: [
				{
					tok: 1,
					text: `t${w}`,
					pos: "N",
					rel,
					rel_ar: `r${w}`,
					head:
						head === null
							? null
							: Array.isArray(head)
								? [SURA, head[0], head[1], 1]
								: [SURA, VERSE, head, 1],
					const: c,
				},
			],
		})),
	};
}

describe("noorBayan: token placement", () => {
	it("keeps a minimum width and centres tokens right-to-left", () => {
		const layout = layoutSentence(
			sentence([
				{ w: 1, rel: "root" },
				{ w: 2, head: 1 },
			]),
			SURA,
			VERSE,
		);
		expect(layout.width).toBe(640);
		const [first, second] = layout.tokens;
		expect(first?.x).toBe(48 + (TOKEN_WIDTH + 18) + TOKEN_WIDTH / 2);
		expect(second?.x).toBe(48 + TOKEN_WIDTH / 2);
	});

	it("grows with the token count past the minimum", () => {
		const words = Array.from({ length: 8 }, (_, i) => ({
			w: i + 1,
			rel: i === 0 ? "root" : "fa",
			head: i === 0 ? null : 1,
		}));
		const layout = layoutSentence(sentence(words), SURA, VERSE);
		expect(layout.width).toBe(48 * 2 + 8 * TOKEN_WIDTH + 7 * 18);
	});

	it("marks headless, non-root, related tokens as muqaddar", () => {
		const layout = layoutSentence(
			sentence([
				{ w: 1, rel: "root" },
				{ w: 2, head: null },
				{ w: 3, rel: "NonRel" },
			]),
			SURA,
			VERSE,
		);
		expect(layout.tokens.map((t) => t.muqaddar)).toEqual([false, true, false]);
	});
});

describe("noorBayan: arcs", () => {
	it("draws one arc per in-sentence head, skipping roots and NonRel", () => {
		const layout = layoutSentence(
			sentence([
				{ w: 1, rel: "root" },
				{ w: 2, head: 1 },
				{ w: 3, rel: "NonRel", head: 1 },
				{ w: 4, head: 2 },
			]),
			SURA,
			VERSE,
		);
		expect(layout.arcs.map((a) => [a.dep, a.head])).toEqual([
			[1, 0],
			[3, 1],
		]);
		expect(layout.arcs[0]?.label).toBe("r2");
	});

	it("treats a token headed by itself as the root", () => {
		const layout = layoutSentence(
			sentence([
				{ w: 1, head: 1 },
				{ w: 2, head: 1 },
			]),
			SURA,
			VERSE,
		);
		expect(layout.arcs).toHaveLength(1);
	});

	it("raises longer arcs and pushes the baseline below the tallest", () => {
		const layout = layoutSentence(
			sentence([
				{ w: 1, rel: "root" },
				{ w: 2, head: 1 },
				{ w: 3 },
				{ w: 4 },
				{ w: 5, head: 1 },
			]),
			SURA,
			VERSE,
		);
		const [short, long] = layout.arcs;
		// span 1 → 78, span 4 → 162 above the baseline
		expect(layout.baseline).toBe(162 + 45);
		expect(short?.topY).toBe(layout.baseline - 78);
		expect(long?.topY).toBe(layout.baseline - 162);
		expect(
			long?.path.startsWith(
				`M ${layout.tokens[4]?.x} ${layout.baseline - 35} C`,
			),
		).toBe(true);
	});

	it("caps arc height", () => {
		const words = Array.from({ length: 12 }, (_, i) => ({
			w: i + 1,
			rel: i === 0 ? "root" : "fa",
			head: i === 11 ? 1 : null,
		}));
		const layout = layoutSentence(sentence(words), SURA, VERSE);
		expect(layout.baseline - (layout.arcs[0]?.topY ?? 0)).toBe(220);
	});

	it("aims a carried head at the right edge without moving the baseline", () => {
		const layout = layoutSentence(
			sentence(
				[
					{ w: 1, rel: "root" },
					{ w: 2, head: [57, 9] },
				],
				[{ s: SURA, v: 57, w: 9, text: "carried" }],
			),
			SURA,
			VERSE,
		);
		const arc = layout.arcs[0];
		expect(arc?.head).toBeNull();
		expect(arc?.carriedText).toBe("carried");
		expect(arc?.midX).toBe(((layout.tokens[1]?.x ?? 0) + (640 - 24)) / 2);
		expect(layout.baseline).toBe(70 + 45);
		expect(arc?.topY).toBe(layout.baseline - 60);
	});

	it("drops an arc whose head is neither in the sentence nor carried", () => {
		const layout = layoutSentence(
			sentence([
				{ w: 1, rel: "root" },
				{ w: 2, head: [57, 9] },
			]),
			SURA,
			VERSE,
		);
		expect(layout.arcs).toHaveLength(0);
	});
});

describe("noorBayan: constituents", () => {
	const phrase = (label: string, from: number, to: number) => ({
		label,
		from: [from, 1] as [number, number],
		to: [to, 1] as [number, number],
	});

	it("dedupes spans and stacks a longer overlapping span on a higher tier", () => {
		const inner = phrase("جار ومجرور", 2, 3);
		const outer = phrase("جملة", 1, 3);
		const layout = layoutSentence(
			sentence([
				{ w: 1, rel: "root", const: outer },
				{ w: 2, head: 1, const: inner },
				{ w: 3, head: 2, const: inner },
			]),
			SURA,
			VERSE,
		);
		expect(layout.constituents.map((c) => [c.label, c.tier])).toEqual([
			["جار ومجرور", 0],
			["جملة", 1],
		]);
		const [first, second] = layout.constituents;
		expect(second?.bracketY).toBe((first?.bracketY ?? 0) + 36);
		expect(layout.height).toBe(layout.baseline + 65 + 2 * 36 + 20);
	});

	it("keeps disjoint spans on the same tier", () => {
		const layout = layoutSentence(
			sentence([
				{ w: 1, rel: "root", const: phrase("a", 1, 2) },
				{ w: 2, head: 1 },
				{ w: 3, head: 1, const: phrase("b", 3, 4) },
				{ w: 4, head: 3 },
			]),
			SURA,
			VERSE,
		);
		expect(layout.constituents.map((c) => c.tier)).toEqual([0, 0]);
	});

	it("reserves less height when there are no constituents", () => {
		const layout = layoutSentence(
			sentence([{ w: 1, rel: "root" }]),
			SURA,
			VERSE,
		);
		expect(layout.height).toBe(layout.baseline + 65 + 40);
	});
});

describe("noorBayan: hover and clause membership", () => {
	const layout = layoutSentence(
		sentence([
			{ w: 1, rel: "root" },
			{ w: 2, head: 1 },
			{ w: 3, head: 1 },
		]),
		SURA,
		VERSE,
	);
	const id = (index: number) => layout.tokens[index]?.id ?? "";

	it("lights an arc from its dependent or its head", () => {
		const arc = layout.arcs[0];
		if (!arc) throw new Error("expected an arc");
		expect(arcTouches(arc, layout.tokens, null)).toBe(false);
		expect(arcTouches(arc, layout.tokens, id(1))).toBe(true);
		expect(arcTouches(arc, layout.tokens, id(0))).toBe(true);
		expect(arcTouches(arc, layout.tokens, id(2))).toBe(false);
	});

	it("maps each word to the first sentence containing it", () => {
		const a = sentence([{ w: 1 }, { w: 2 }]);
		const b = sentence([{ w: 2 }, { w: 3 }]);
		expect([...sentenceOfWord([a, b])]).toEqual([
			[1, 0],
			[2, 0],
			[3, 1],
		]);
	});
});

describe("noorBayan: real treebank sentences", () => {
	const file = JSON.parse(
		fs.readFileSync(
			path.join(process.cwd(), "public/data/quran/syntax/002.json"),
			"utf8",
		),
	) as SurahSyntaxFile;

	it("produces finite geometry with arcs inside the canvas", () => {
		for (const verse of file.verses.slice(0, 60)) {
			for (const s of verse.sentences) {
				const layout = layoutSentence(s, 2, verse.v);
				expect(Number.isFinite(layout.height)).toBe(true);
				for (const arc of layout.arcs) {
					expect(arc.topY).toBeGreaterThan(0);
					expect(arc.midX).toBeGreaterThan(0);
					expect(arc.midX).toBeLessThan(layout.width);
					if (arc.head !== null) expect(arc.head).not.toBe(arc.dep);
				}
				for (const c of layout.constituents) {
					expect(c.left).toBeLessThanOrEqual(c.right);
					expect(c.bracketY).toBeLessThan(layout.height);
				}
			}
		}
	});
});
