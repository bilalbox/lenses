import { describe, expect, it } from "vitest";
import {
	featureLines,
	formGloss,
	kindGloss,
	POS,
	phraseGloss,
	posFamily,
	posGloss,
	RELATIONS,
	relationFamily,
	relationGloss,
} from "../../src/lib/glossary";

describe("glossary", () => {
	it("resolves POS glosses across locales with English fallback", () => {
		const en = posGloss("N", "en");
		expect(en.name).toBe("اسم");
		expect(en.about).toContain("A name of a person");

		const ar = posGloss("N", "ar");
		expect(ar.about).toContain("اسم يدل على ذات");

		const unknown = posGloss("UNKNOWN_POS", "en");
		expect(unknown.name).toBe("UNKNOWN_POS");
	});

	it("resolves relation, form, phrase, and kind glosses", () => {
		expect(relationGloss("subj", "en").about).toBeTruthy();
		expect(formGloss("II", "en").about).toBeTruthy();
		expect(phraseGloss("PP", "en").about).toBeTruthy();
		expect(kindGloss("p", "en").about).toBeTruthy();
	});

	it("classifies relations and POS into families without Arabic label overlap", () => {
		expect(relationFamily("subj")).toBe("core");
		expect(relationFamily("obj")).toBe("core");
		expect(relationFamily("poss")).toBe("nom");
		expect(relationFamily("state")).toBe("nom");
		expect(relationFamily("conj")).toBe("clause");
		expect(relationFamily("other")).toBe("particle");

		expect(posFamily("N")).toBe("word");
		expect(posFamily("NEG")).toBe("particle");
		expect(posFamily("CIRC")).toBe("clitic");

		const posNames = new Set(Object.values(POS).map((entry) => entry.name));
		const nonParticleRelNames = Object.entries(RELATIONS)
			.filter(([code]) => relationFamily(code) !== "particle")
			.map(([, entry]) => entry.name);
		for (const name of nonParticleRelNames) {
			expect(posNames.has(name), name).toBe(false);
		}
		expect(posGloss("CIRC").name).not.toBe(relationGloss("circ").name);
	});

	it("builds feature lines from morphological features object", () => {
		const lines = featureLines(
			{
				form: "II",
				asp: "PERF",
				voice: "ACT",
				gen: "M",
				num: "S",
				per: 3,
			},
			"en",
		);
		expect(lines.length).toBeGreaterThan(0);
		expect(lines.some((l) => l.key === "form")).toBe(true);
		expect(lines.some((l) => l.key === "asp")).toBe(true);
	});
});
