import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { lexiconSlug } from "../../src/lib/lexicon";
import type { LexiconFile, Manifest, WordIndex } from "../../src/lib/types";

const dataDir = path.resolve("public/data/quran");
const lexiconDir = path.join(dataDir, "lexicon");
const read = <T>(file: string): T =>
	JSON.parse(fs.readFileSync(file, "utf-8")) as T;

describe("integration: per-root dictionary files", () => {
	const files = fs.readdirSync(lexiconDir);
	const roots = new Set(
		read<WordIndex>(path.join(dataDir, "words.json")).roots.map((r) => r.b),
	);

	it("names every file by the same slug the client requests", () => {
		expect(files.length).toBeGreaterThan(1500);
		for (const name of files) {
			const file = read<LexiconFile>(path.join(lexiconDir, name));
			expect(roots.has(file.r), name).toBe(true);
			expect(name, file.r).toBe(`${lexiconSlug(file.r)}.json`);
			expect(file.lane || file.maqayis || file.mufradat, name).toBeTruthy();
		}
	});

	it("serves النّاس from all three dictionaries", () => {
		const nws = read<LexiconFile>(path.join(lexiconDir, "nws.json"));
		expect(nws.maqayis?.[0]).toContain("النون والواو والسين أصل");
		expect(nws.mufradat?.[0]).toMatch(/^الناس/);
		expect(nws.lane?.e.some((entry) => entry.h === "نَاسٌ")).toBe(true);
	});

	it("credits Perseus verbatim and labels OpenITI's license", () => {
		const manifest = read<Manifest>(path.join(dataDir, "manifest.json"));
		const byId = new Map(manifest.sources.map((s) => [s.id, s]));
		expect(byId.get("lane-lexicon")?.attribution).toContain(
			"Text provided by Perseus Digital Library, with funding from The U.S. Department of Education and The Max Planck Society.",
		);
		for (const id of ["openiti-maqayis", "openiti-mufradat"]) {
			expect(byId.get(id)?.license, id).toContain("CC BY-NC-SA 4.0");
		}
	});
});
