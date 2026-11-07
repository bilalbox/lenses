import { describe, expect, it } from "vitest";
import { drawersForTab, nextDrawers } from "../../src/lib/readerLayers";
import { parseRoute, retiredPageRedirect } from "../../src/lib/route";

describe("readerLayers: drawers on arrival", () => {
	it("opens nothing without a deep link", () => {
		expect(drawersForTab()).toEqual({
			irab: false,
			mutashabih: false,
			asbab: false,
			usul: false,
		});
	});

	it("opens only the deep-linked drawer", () => {
		for (const tab of ["mutashabih", "asbab", "usul"] as const) {
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
		expect(nextDrawers(toggled, "mutashabih")).toEqual({
			tab: "mutashabih",
			drawers: drawersForTab("mutashabih"),
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
	});

	it("prefers an explicit tab over legacy flags", () => {
		expect(parseRoute("#/2/58?tab=mutashabih&asbab=1").tab).toBe("mutashabih");
	});
});

describe("route: links to removed pages open the reader", () => {
	it("opens the linked verse for an old balāghah link", () => {
		expect(parseRoute("#/rhetoric/2/58")).toMatchObject({
			page: "verse",
			sura: 2,
			verse: 58,
		});
		expect(parseRoute("#/balagha/36/39")).toMatchObject({
			page: "verse",
			sura: 36,
			verse: 39,
		});
	});

	it("opens a surah's first verse for an old munāsabāt link", () => {
		for (const head of ["munasabat", "munasabaat", "structure"])
			expect(parseRoute(`#/${head}/5`)).toMatchObject({
				page: "verse",
				sura: 5,
				verse: 1,
			});
	});

	it("rewrites an old link to the reader path, and leaves other links alone", () => {
		expect(retiredPageRedirect("#/rhetoric/2/58")).toBe("/2/58");
		expect(retiredPageRedirect("#/munasabat/5")).toBe("/5/1");
		expect(retiredPageRedirect("#/2/58")).toBeNull();
		expect(retiredPageRedirect("#/quiz")).toBeNull();
	});

	it("falls back to the opening verse without a surah", () => {
		expect(parseRoute("#/munasabat").page).toBe("verse");
		expect(parseRoute("#/rhetoric/999").page).toBe("verse");
	});
});
