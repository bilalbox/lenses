import { describe, expect, it } from "vitest";
import {
	featureLines,
	formGloss,
	kindGloss,
	phraseGloss,
	posGloss,
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

	it("classifies relations into families", () => {
		expect(relationFamily("subj")).toBe("core");
		expect(relationFamily("obj")).toBe("core");
		expect(relationFamily("poss")).toBe("nom");
		expect(relationFamily("conj")).toBe("clause");
		expect(relationFamily("other")).toBe("particle");
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
