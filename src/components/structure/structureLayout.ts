import type { StructureBlock } from "../../lib/types";

/** Split contiguous Maraya blocks into opening / pivot / closing for the Diptych. */
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

/** Block that contains the given 1-based verse, if any. */
export function blockContainingVerse(
	blocks: StructureBlock[],
	verse: number,
): StructureBlock | null {
	return (
		blocks.find((block) => verse >= block.v[0] && verse <= block.v[1]) ?? null
	);
}
