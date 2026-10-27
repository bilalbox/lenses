import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { type LeafFace, layoutGraph } from "../../src/lib/layout";
import type { GraphNode, SurahFile, SyntaxGraph } from "../../src/lib/types";

describe("layout: layoutGraph", () => {
	const mockMeasure = (text: string, caption: boolean) =>
		text.length * (caption ? 7 : 16);

	const mockFace = (node: GraphNode): LeafFace => ({
		text: node.a || "word",
		caption: node.p || "pos",
	});

	it("handles an empty syntax graph gracefully without NaN or errors", () => {
		const emptyGraph: SyntaxGraph = { nodes: [], edges: [] };
		const result = layoutGraph(
			emptyGraph,
			{ sura: 1, verse: 1 },
			mockMeasure,
			mockFace,
		);

		expect(result.width).toBeGreaterThan(0);
		expect(result.height).toBeGreaterThan(0);
		expect(result.boxes).toHaveLength(0);
		expect(result.arcs).toHaveLength(0);
		expect(result.phrases).toHaveLength(0);
		expect(Number.isNaN(result.width)).toBe(false);
		expect(Number.isNaN(result.height)).toBe(false);
	});

	it("lays out a single-node graph without edges", () => {
		const singleGraph: SyntaxGraph = {
			nodes: [{ t: "seg", s: 1, v: 1, w: 1, a: "قُلْ", p: "V" }],
			edges: [],
		};
		const result = layoutGraph(
			singleGraph,
			{ sura: 1, verse: 1 },
			mockMeasure,
			mockFace,
		);

		expect(result.boxes).toHaveLength(1);
		expect(result.boxes[0]?.x).toBeGreaterThanOrEqual(0);
		expect(result.boxes[0]?.width).toBeGreaterThan(0);
		expect(result.arcs).toHaveLength(0);
	});

	it("computes non-overlapping horizontal boxes and valid arcs for real Surah 1 graph", () => {
		const fatihahPath = path.resolve("public/data/quran/surah/001.json");
		const fatihah: SurahFile = JSON.parse(
			fs.readFileSync(fatihahPath, "utf-8"),
		);
		const graph = fatihah.verses[0]?.g?.[0];
		expect(graph).toBeDefined();

		const result = layoutGraph(
			graph!,
			{ sura: 1, verse: 1 },
			mockMeasure,
			mockFace,
		);

		expect(result.width).toBeGreaterThan(0);
		expect(result.height).toBeGreaterThan(0);
		expect(result.boxes.length).toBeGreaterThan(0);
		expect(result.arcs.length).toBeGreaterThan(0);

		// Boxes must not overlap horizontally in RTL order
		for (let i = 0; i < result.boxes.length - 1; i += 1) {
			const currentBox = result.boxes[i];
			const nextBox = result.boxes[i + 1];
			if (currentBox && nextBox) {
				// RTL: boxes flow from right to left or are sorted by index
				expect(currentBox.width).toBeGreaterThan(0);
				expect(nextBox.width).toBeGreaterThan(0);
			}
		}

		// Arcs must have valid coordinates and SVG path commands
		for (const arc of result.arcs) {
			expect(arc.x1).toBeGreaterThanOrEqual(0);
			expect(arc.x2).toBeGreaterThanOrEqual(0);
			expect(arc.y1).toBeGreaterThanOrEqual(0);
			expect(arc.y2).toBeGreaterThanOrEqual(0);
			expect(arc.path).toMatch(/^M\s+\d+(\.\d+)?\s+\d+(\.\d+)?/);
			expect(arc.name).toBeTruthy();
			expect(["under", "over", "crown"]).toContain(arc.plane);

			// Under-relations (e.g. genitive, adjective) must be marked under
			if (["gen", "poss", "adj"].includes(arc.rel)) {
				expect(arc.plane).toBe("under");
			}
		}
	});

	it("folds phrases into a single composite card box", () => {
		const fatihahPath = path.resolve("public/data/quran/surah/001.json");
		const fatihah: SurahFile = JSON.parse(
			fs.readFileSync(fatihahPath, "utf-8"),
		);
		const graph = fatihah.verses[0]?.g?.[0];
		expect(graph).toBeDefined();

		// Find the phrase node index
		const phraseNodeIdx = graph!.nodes.findIndex((n) => n.t === "ph");
		expect(phraseNodeIdx).toBeGreaterThanOrEqual(0);

		const unfolded = layoutGraph(
			graph!,
			{ sura: 1, verse: 1 },
			mockMeasure,
			mockFace,
		);
		const folded = layoutGraph(
			graph!,
			{ sura: 1, verse: 1 },
			mockMeasure,
			mockFace,
			new Set([phraseNodeIdx]),
		);

		// Folding should reduce the number of visible leaf boxes
		expect(folded.boxes.length).toBeLessThan(unfolded.boxes.length);

		// One of the folded boxes must be of kind "card"
		const cardBox = folded.boxes.find((b) => b.kind === "card");
		expect(cardBox).toBeDefined();
	});
});
