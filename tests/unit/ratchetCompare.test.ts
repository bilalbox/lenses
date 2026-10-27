import { describe, expect, it } from "vitest";
import {
	type BaselineFile,
	compareFindings,
	type Finding,
	isCiEnv,
	rewriteBaseline,
} from "../../scripts/ratchets/compare";

describe("ratchet: compareFindings", () => {
	const emptyBaseline: BaselineFile = { version: 1, findings: [] };

	it("passes when baseline and current findings match exactly", () => {
		const baseline: BaselineFile = {
			version: 1,
			findings: [
				{ id: "rule-a", score: 10, note: "acknowledged" },
				{ id: "rule-b", score: 15 },
			],
		};
		const current: Finding[] = [
			{ id: "rule-a", score: 10 },
			{ id: "rule-b", score: 15 },
		];

		const res = compareFindings(baseline, current);
		expect(res.ok).toBe(true);
		expect(res.novel).toHaveLength(0);
		expect(res.stale).toHaveLength(0);
		expect(res.regressions).toHaveLength(0);
	});

	it("flags novel findings absent from baseline", () => {
		const current: Finding[] = [{ id: "new-violation", score: 20 }];
		const res = compareFindings(emptyBaseline, current);

		expect(res.ok).toBe(false);
		expect(res.novel).toEqual(["new-violation"]);
	});

	it("flags stale baseline rows that no longer reproduce (shrink requirement)", () => {
		const baseline: BaselineFile = {
			version: 1,
			findings: [{ id: "fixed-issue", score: 10 }],
		};
		const current: Finding[] = [];

		const res = compareFindings(baseline, current);
		expect(res.ok).toBe(false);
		expect(res.stale).toEqual(["fixed-issue"]);
	});

	it("flags score regressions when complexity score increases", () => {
		const baseline: BaselineFile = {
			version: 1,
			findings: [{ id: "fn-complex", score: 15 }],
		};
		const current: Finding[] = [{ id: "fn-complex", score: 22 }];

		const res = compareFindings(baseline, current);
		expect(res.ok).toBe(false);
		expect(res.regressions).toEqual([
			{ id: "fn-complex", baseline: 15, current: 22 },
		]);
	});

	it("allows score improvements (shrink) without failing", () => {
		const baseline: BaselineFile = {
			version: 1,
			findings: [{ id: "fn-complex", score: 20 }],
		};
		// Complexity reduced from 20 to 12
		const current: Finding[] = [{ id: "fn-complex", score: 12 }];

		const res = compareFindings(baseline, current);
		// Lower score is not a regression, so regressions is empty
		expect(res.regressions).toHaveLength(0);
		// Because it's still present, novel and stale are empty
		expect(res.ok).toBe(true);
	});
});

describe("ratchet: rewriteBaseline", () => {
	it("updates baseline preserving notes and issues for surviving IDs", () => {
		const prev: BaselineFile = {
			version: 1,
			findings: [
				{
					id: "surviving-issue",
					score: 15,
					note: "Existing debt",
					issue: 42,
				},
				{ id: "removed-issue", score: 10, note: "Now resolved" },
			],
		};
		const current: Finding[] = [
			{ id: "surviving-issue", score: 14 },
			{ id: "new-issue", score: 8 },
		];

		const updated = rewriteBaseline(prev, current);
		expect(updated.version).toBe(1);
		expect(updated.findings).toHaveLength(2);

		const surviving = updated.findings.find((f) => f.id === "surviving-issue");
		expect(surviving?.score).toBe(14);
		expect(surviving?.note).toBe("Existing debt");
		expect(surviving?.issue).toBe(42);

		const novel = updated.findings.find((f) => f.id === "new-issue");
		expect(novel?.score).toBe(8);
		expect(novel?.note).toContain("--update");
	});
});

describe("ratchet: isCiEnv", () => {
	it("detects CI environment flags", () => {
		expect(isCiEnv({ CI: "true" })).toBe(true);
		expect(isCiEnv({ CI: "1" })).toBe(true);
		expect(isCiEnv({ CI: "false" })).toBe(false);
		expect(isCiEnv({ CI: "0" })).toBe(false);
		expect(isCiEnv({})).toBe(false);
	});
});
