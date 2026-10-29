import { describe, expect, it } from "vitest";
import {
	blockContainingVerse,
	splitHemispheres,
} from "../../src/components/structure/structureLayout";
import { ar } from "../../src/lib/i18n/locales/ar";
import { en } from "../../src/lib/i18n/locales/en";
import { id } from "../../src/lib/i18n/locales/id";
import type { StructureBlock } from "../../src/lib/types";

const fatihaBlocks: StructureBlock[] = [
	{
		id: "A",
		v: [1, 3],
		role: "outer_frame_open",
		label: "Praise of the Lord",
		pairId: "A′",
	},
	{
		id: "B",
		v: [4, 4],
		role: "body",
		label: "Lord of Judgment",
		pairId: "B′",
	},
	{
		id: "PIVOT",
		v: [5, 5],
		role: "pivot",
		label: "Worship and reliance",
	},
	{
		id: "B′",
		v: [6, 6],
		role: "body",
		label: "Prayer for guidance",
		pairId: "B",
	},
	{
		id: "A′",
		v: [7, 7],
		role: "outer_frame_close",
		label: "The three paths",
		pairId: "A",
	},
];

describe("structureNav: diptych hemisphere split", () => {
	it("splits Al-Fātiḥah into opening / pivot / closing around the pivot role", () => {
		const { opening, pivot, closing } = splitHemispheres(fatihaBlocks);
		expect(pivot?.id).toBe("PIVOT");
		expect(opening.map((b) => b.id)).toEqual(["A", "B"]);
		expect(closing.map((b) => b.id)).toEqual(["B′", "A′"]);
	});

	it("falls back to a midpoint when no pivot role is present", () => {
		const blocks: StructureBlock[] = [
			{ id: "A", v: [1, 2], role: "body", label: "a" },
			{ id: "B", v: [3, 4], role: "body", label: "b" },
			{ id: "C", v: [5, 6], role: "body", label: "c" },
		];
		const { opening, pivot, closing } = splitHemispheres(blocks);
		expect(pivot).toBeNull();
		expect(opening.map((b) => b.id)).toEqual(["A"]);
		expect(closing.map((b) => b.id)).toEqual(["C"]);
	});
});

describe("structureNav: current-verse block highlight", () => {
	it("finds the block containing the active verse", () => {
		expect(blockContainingVerse(fatihaBlocks, 2)?.id).toBe("A");
		expect(blockContainingVerse(fatihaBlocks, 5)?.id).toBe("PIVOT");
		expect(blockContainingVerse(fatihaBlocks, 7)?.id).toBe("A′");
	});

	it("returns null when the verse is outside all blocks", () => {
		expect(blockContainingVerse(fatihaBlocks, 99)).toBeNull();
	});
});

describe("structureNav: i18n keys for structure / munāsabāt", () => {
	const locales = { en, ar, id };

	it("exposes structure and munāsabāt strings in ar/en/id", () => {
		for (const [code, t] of Object.entries(locales)) {
			expect(t.verse.structureBadge(5), `${code} structureBadge`).toBeTruthy();
			expect(
				t.verse.structureSectionTitle,
				`${code} structureSectionTitle`,
			).toBeTruthy();
			expect(
				t.verse.structureEmptyState,
				`${code} structureEmptyState`,
			).toBeTruthy();
			expect(
				t.verse.structureOpeningHemisphere,
				`${code} structureOpeningHemisphere`,
			).toBeTruthy();
			expect(
				t.verse.structureClosingHemisphere,
				`${code} structureClosingHemisphere`,
			).toBeTruthy();
			expect(
				t.verse.munasabatCardTitle,
				`${code} munasabatCardTitle`,
			).toBeTruthy();
			expect(
				t.verse.munasabatJumpNext("Al-Baqarah", "2"),
				`${code} munasabatJumpNext`,
			).toContain("2");
			expect(t.surahs.structureLink, `${code} structureLink`).toBeTruthy();
			expect(t.surahs.balaghaLink, `${code} balaghaLink`).toBeTruthy();
		}
	});
});
