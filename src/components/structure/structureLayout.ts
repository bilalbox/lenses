import type { StructureBlock } from "../../lib/types";

export interface BlockGeom {
	block: StructureBlock;
	xCenter: number;
	xStart: number;
	xEnd: number;
	width: number;
}

export interface PairArc {
	left: BlockGeom;
	right: BlockGeom;
	peakY: number;
	path: string;
}

const WIDTH = 800;
const PAD = 28;
const BASELINE = 168;

export function verseCenterX(
	start: number,
	end: number,
	verseCount: number,
): number {
	const mid = (start + end) / 2;
	if (verseCount <= 1) return WIDTH / 2;
	return PAD + ((mid - 1) / (verseCount - 1)) * (WIDTH - 2 * PAD);
}

export function verseEdgeX(verse: number, verseCount: number): number {
	if (verseCount <= 1) return WIDTH / 2;
	return PAD + ((verse - 1) / (verseCount - 1)) * (WIDTH - 2 * PAD);
}

export function layoutBlocks(
	blocks: StructureBlock[],
	verseCount: number,
): BlockGeom[] {
	return blocks.map((block) => {
		const xStart = verseEdgeX(block.v[0], verseCount);
		const xEnd = verseEdgeX(block.v[1], verseCount);
		const width = Math.max(xEnd - xStart, 14);
		return {
			block,
			xCenter: verseCenterX(block.v[0], block.v[1], verseCount),
			xStart,
			xEnd: xStart + width,
			width,
		};
	});
}

export function buildPairArcs(geoms: BlockGeom[]): PairArc[] {
	const byId = new Map(geoms.map((g) => [g.block.id, g]));
	const seen = new Set<string>();
	const arcs: PairArc[] = [];

	for (const geom of geoms) {
		const pairId = geom.block.pairId;
		if (!pairId || seen.has(geom.block.id)) continue;
		const partner = byId.get(pairId);
		if (!partner) continue;
		seen.add(geom.block.id);
		seen.add(pairId);

		const left = geom.xCenter <= partner.xCenter ? geom : partner;
		const right = left === geom ? partner : geom;
		const span = Math.abs(right.xCenter - left.xCenter);
		const peakLift = Math.min(140, Math.max(24, span * 0.38));
		const peakY = BASELINE - peakLift;
		const path = `M ${left.xCenter} ${BASELINE} C ${left.xCenter} ${peakY}, ${right.xCenter} ${peakY}, ${right.xCenter} ${BASELINE}`;
		arcs.push({ left, right, peakY, path });
	}

	return arcs.sort(
		(a, b) =>
			Math.abs(b.right.xCenter - b.left.xCenter) -
			Math.abs(a.right.xCenter - a.left.xCenter),
	);
}

export function splitHemispheres(blocks: StructureBlock[]): {
	opening: StructureBlock[];
	pivot: StructureBlock | null;
	closing: StructureBlock[];
} {
	const pivot =
		blocks.find((b) => b.role === "pivot" || b.role === "center") ?? null;
	const pivotIdx = pivot
		? blocks.indexOf(pivot)
		: Math.floor(blocks.length / 2);
	return {
		opening: blocks.slice(0, pivotIdx),
		pivot,
		closing: blocks.slice(pivotIdx + 1),
	};
}

export const LAYOUT = { WIDTH, PAD, BASELINE, BAR_Y: 188, HEIGHT: 260 };
