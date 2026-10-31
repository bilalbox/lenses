import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Layers = typeof import("../../src/lib/layers");

function jsonResponse(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), { status });
}

// Each test gets a fresh module so the request cache starts empty.
let layers: Layers;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(async () => {
	vi.resetModules();
	fetchMock = vi.fn();
	vi.stubGlobal("fetch", fetchMock);
	layers = await import("../../src/lib/layers");
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("layers: URLs", () => {
	it("builds corpus and zero-padded per-surah URLs", () => {
		expect(layers.layerUrl("asbab")).toBe("/data/quran/asbab.json");
		expect(layers.layerUrl("syntax", 2)).toBe("/data/quran/syntax/002.json");
		expect(layers.layerUrl("surah", 114)).toBe("/data/quran/surah/114.json");
	});
});

describe("layers: request cache", () => {
	it("shares one request between concurrent callers", async () => {
		fetchMock.mockResolvedValue(jsonResponse({ surah: 2, verses: [] }));
		const [a, b] = await Promise.all([
			layers.loadLayer("syntax", 2),
			layers.loadLayer("syntax", 2),
		]);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(a).toBe(b);
	});

	it("serves settled files without refetching", async () => {
		fetchMock.mockResolvedValue(jsonResponse({ "2:58": [] }));
		await layers.loadLayer("asbab");
		await layers.loadLayer("asbab");
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it("keys per-surah files by surah", async () => {
		fetchMock.mockImplementation(async (url: string) => jsonResponse({ url }));
		await layers.loadLayer("qiraat", 1);
		await layers.loadLayer("qiraat", 2);
		expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
			"/data/quran/qiraat/001.json",
			"/data/quran/qiraat/002.json",
		]);
	});

	it("evicts a failed request so the next call retries", async () => {
		fetchMock
			.mockResolvedValueOnce(jsonResponse({}, 503))
			.mockResolvedValueOnce(jsonResponse({ surah: 3, verses: [] }));
		await expect(layers.loadLayer("syntax", 3)).rejects.toThrow(
			"Could not load /data/quran/syntax/003.json (503)",
		);
		await expect(layers.loadLayer("syntax", 3)).resolves.toEqual({
			surah: 3,
			verses: [],
		});
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it("evicts on network errors too", async () => {
		fetchMock
			.mockRejectedValueOnce(new TypeError("offline"))
			.mockResolvedValueOnce(jsonResponse([]));
		await expect(layers.loadLayer("rhetoric")).rejects.toThrow("offline");
		await expect(layers.loadLayer("rhetoric")).resolves.toEqual([]);
	});
});

describe("layers: findVerse", () => {
	const file = {
		verses: [
			{ v: 1, text: "a" },
			{ v: 2, text: "b" },
			{ v: 7, text: "c" },
		],
	};

	it("finds a verse entry by number", () => {
		expect(layers.findVerse(file, 7)).toEqual({ v: 7, text: "c" });
	});

	it("returns undefined for a verse without an entry", () => {
		expect(layers.findVerse(file, 3)).toBeUndefined();
	});

	it("returns the same entry object the file holds", () => {
		expect(layers.findVerse(file, 2)).toBe(file.verses[1]);
	});
});
