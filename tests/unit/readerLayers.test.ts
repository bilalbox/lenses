import { describe, expect, it } from "vitest";
import { drawersForTab, nextDrawers } from "../../src/lib/readerLayers";
import { parseRoute } from "../../src/lib/route";

describe("readerLayers: drawers on arrival", () => {
	it("opens nothing without a deep link", () => {
		expect(drawersForTab()).toEqual({
			irab: false,
			mutashabih: false,
			asbab: false,
			balagha: false,
		});
	});

	it("opens only the deep-linked drawer", () => {
		for (const tab of ["mutashabih", "asbab", "balagha"] as const) {
			const drawers = drawersForTab(tab);
			expect(drawers[tab], tab).toBe(true);
			expect(
				Object.values(drawers).filter(Boolean),
				`${tab} opens alone`,
			).toHaveLength(1);
		}
	});

	it("keeps iʿrāb closed and ignores unknown tabs", () => {
		expect(Object.values(drawersForTab("irab")).some(Boolean)).toBe(false);
		expect(Object.values(drawersForTab("nope")).some(Boolean)).toBe(false);
	});
});

describe("readerLayers: drawer transitions", () => {
	const arrived = { tab: "asbab", drawers: drawersForTab("asbab") };

	it("keeps state when the tab is unchanged", () => {
		expect(nextDrawers(arrived, "asbab")).toBe(arrived);
	});

	it("toggles a drawer and keeps the others", () => {
		const next = nextDrawers(arrived, "asbab", { key: "irab", open: true });
		expect(next.drawers).toEqual({ ...drawersForTab("asbab"), irab: true });
		const closed = nextDrawers(next, "asbab", { key: "asbab", open: false });
		expect(closed.drawers.asbab).toBe(false);
		expect(closed.drawers.irab).toBe(true);
	});

	it("resets to the new tab's defaults when the deep link changes", () => {
		const toggled = nextDrawers(arrived, "asbab", { key: "irab", open: true });
		expect(nextDrawers(toggled, "balagha")).toEqual({
			tab: "balagha",
			drawers: drawersForTab("balagha"),
		});
	});

	it("applies a toggle on top of the new tab's defaults", () => {
		const toggled = nextDrawers(arrived, "asbab", { key: "irab", open: true });
		const next = nextDrawers(toggled, "mutashabih", {
			key: "asbab",
			open: true,
		});
		expect(next).toEqual({
			tab: "mutashabih",
			drawers: { ...drawersForTab("mutashabih"), asbab: true },
		});
	});
});

describe("readerLayers: deep-link tab from the route", () => {
	it("reads an explicit tab", () => {
		expect(parseRoute("#/2/58?tab=asbab").tab).toBe("asbab");
	});

	it("maps legacy flag params to a tab", () => {
		expect(parseRoute("#/2/58?asbab=1").tab).toBe("asbab");
		expect(parseRoute("#/2/58?mutashabih=1").tab).toBe("mutashabih");
		expect(parseRoute("#/2/58?balagha=1").tab).toBe("balagha");
	});

	it("prefers an explicit tab over legacy flags", () => {
		expect(parseRoute("#/2/58?tab=balagha&asbab=1").tab).toBe("balagha");
	});
});
