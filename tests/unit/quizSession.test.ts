import { describe, expect, it } from "vitest";
import type { MutashabihQuestion } from "../../src/lib/mutashabihQuiz";
import type {
	QuizPools,
	QuizQuestion,
	SarfQuestion,
	UsulQuestion,
} from "../../src/lib/quizBank";
import {
	activeQuestion,
	initQuizSession,
	progress,
	type QuizSessionEvent,
	type QuizSessionState,
	reduceQuizSession,
} from "../../src/lib/quizSession";
import type { Verse, Word } from "../../src/lib/types";

const word = (n: number) => ({ n }) as Word;
const verse = (v: number) => ({ v }) as Verse;

function irab(id: string, sura: number, v: number): QuizQuestion {
	return {
		id,
		sura,
		verse: verse(v),
		targetWord: word(2),
		headWord: word(1),
		relation: "subj",
		grammaticalCase: "NOM",
		sign: "damma",
	} as QuizQuestion;
}

const sarf = {
	id: "s1",
	sura: 1,
	verse: verse(1),
	rootRaw: "ك ت ب",
	wazn: "فَعَلَ",
	classCode: "c",
	structureCode: "st",
} as SarfQuestion;

const mutashabih = {
	id: "m1",
	sura: 2,
	verse: { v: 49 },
	answer: 1,
} as MutashabihQuestion;

const usulMock: UsulQuestion = {
	id: "u1",
	sura: 2,
	suraName: "البقرة",
	suraPhonetic: "Al-Baqarah",
	verse: verse(43),
	shahid: {
		id: "u1",
		verseKey: "2:43",
		ayahNumber: 43,
		wordStart: 1,
		wordEnd: 4,
		shahidPhraseAr: "وَأَقِيمُوا الصَّلَاةَ",
		taxonomyId: "AMR_WUJUB",
		categoryGroup: "AMR_NAHY",
		linguisticTriggerAr: "صيغة أمر",
		defaultDalalahAr: "الوجوب",
		actualDalalahAr: "الوجوب",
		hasQarinahSarifah: false,
		qarinahTextAr: null,
		qarinahVerseKey: null,
		wajhAlDilalahAr: "أمر للوجوب",
		derivedFiqhRulingAr: "وجوب الصلاة",
		khilafUsuliAr: null,
		classicalSources: [],
		extractionStage: "GOLDEN_SEED",
		isCanonicalShahid: true,
	},
};

const pools: QuizPools = {
	irab: [irab("a", 1, 1), irab("b", 1, 1), irab("c", 2, 5)],
	sarf: [sarf],
	mutashabih: [mutashabih],
	usul: [usulMock],
};

function run(...events: QuizSessionEvent[]): QuizSessionState {
	return events.reduce(
		(state, event) => reduceQuizSession(state, event, pools),
		initQuizSession(),
	);
}

const fullIrab: QuizSessionEvent[] = [
	{ type: "answer", field: "relation", value: "subj" },
	{ type: "answer", field: "headWordNum", value: 1 },
	{ type: "answer", field: "grammaticalCase", value: "NOM" },
	{ type: "answer", field: "sign", value: "damma" },
];

describe("quizSession: seeding and questions", () => {
	it("seeds one random question per lens", () => {
		const state = run({
			type: "seed",
			random: { irab: 0.99, sarf: 0, mutashabih: 0.5, usul: 0 },
		});
		expect(state.seeded).toBe(true);
		expect(state.indices).toEqual({
			irab: 2,
			sarf: 0,
			mutashabih: 0,
			usul: 0,
		});
		expect(activeQuestion(state, pools)?.id).toBe("c");
	});

	it("moves to a question from another ayah when one exists", () => {
		// a and b share 1:1, so from a the only other-ayah choice is c
		for (const random of [0, 0.5, 0.99]) {
			expect(activeQuestion(run({ type: "next", random }), pools)?.id).toBe(
				"c",
			);
		}
	});

	it("re-picks a rebuilt pool's question and clears its half-answered draft", () => {
		const state = run(fullIrab[0]!, {
			type: "repool",
			lens: "irab",
			random: 0.99,
		});
		expect(activeQuestion(state, pools)?.id).toBe("c");
		expect(state.drafts.irab.relation).toBeNull();
		expect(state.step).toBe(1);
	});

	it("re-picks a background lens's question without touching the current one", () => {
		const state = run(fullIrab[0]!, {
			type: "repool",
			lens: "sarf",
			random: 0,
		});
		expect(state.indices.sarf).toBe(0);
		expect(state.drafts.irab.relation).toBe("subj");
	});

	it("stays put when the lens has a single question", () => {
		const state = run({ type: "selectLens", lens: "sarf" });
		expect(
			run({ type: "selectLens", lens: "sarf" }, { type: "next", random: 0.3 }),
		).toEqual(state);
	});
});

describe("quizSession: answering and submitting", () => {
	it("reports every empty required field by key", () => {
		const state = run(
			{ type: "answer", field: "relation", value: "subj" },
			{ type: "submit" },
		);
		expect(state.missing).toEqual(["headWordNum", "grammaticalCase", "sign"]);
		expect(state.verdict).toBeNull();
		expect(state.score.attempts).toBe(0);
	});

	it("grades each field once and records a win", () => {
		const state = run(...fullIrab, { type: "submit" });
		expect(state.verdict).toEqual({
			fields: {
				relation: true,
				headWordNum: true,
				grammaticalCase: true,
				sign: true,
			},
			allCorrect: true,
		});
		expect(state.streak).toBe(1);
		expect(state.score).toEqual({ solved: 1, attempts: 1 });
	});

	it("marks the wrong field and resets the streak", () => {
		const won = run(
			...fullIrab,
			{ type: "submit" },
			{ type: "next", random: 0 },
		);
		const lost = [
			{ type: "answer", field: "relation", value: "subj" },
			{ type: "answer", field: "headWordNum", value: 3 },
			{ type: "answer", field: "grammaticalCase", value: "NOM" },
			{ type: "answer", field: "sign", value: "damma" },
			{ type: "submit" },
		] as QuizSessionEvent[];
		const state = lost.reduce((s, e) => reduceQuizSession(s, e, pools), won);
		expect(state.verdict?.fields.headWordNum).toBe(false);
		expect(state.verdict?.allCorrect).toBe(false);
		expect(state.streak).toBe(0);
		expect(state.score).toEqual({ solved: 1, attempts: 2 });
	});

	it("counts one outcome per question even after re-editing", () => {
		const state = run(
			{ type: "answer", field: "relation", value: "obj" },
			...fullIrab.slice(1),
			{ type: "submit" },
			{ type: "goToStep", step: 1 },
			{ type: "answer", field: "relation", value: "subj" },
			{ type: "submit" },
		);
		expect(state.verdict?.allCorrect).toBe(true);
		expect(state.score).toEqual({ solved: 0, attempts: 1 });
	});

	it("ignores fields from another lens", () => {
		const state = run({ type: "answer", field: "wazn", value: "x" });
		expect(state.drafts.sarf.wazn).toBeNull();
	});

	it("tracks progress across the wizard steps", () => {
		expect(progress(run())).toEqual({ filled: 1, total: 5 });
		expect(progress(run(...fullIrab.slice(0, 2)))).toEqual({
			filled: 3,
			total: 5,
		});
	});
});

describe("quizSession: case and sign stay compatible", () => {
	it("clears a sign the newly chosen case cannot take", () => {
		const state = run(
			{ type: "answer", field: "grammaticalCase", value: "NOM" },
			{ type: "answer", field: "sign", value: "waw" },
			{ type: "answer", field: "grammaticalCase", value: "GEN" },
		);
		expect(state.drafts.irab.sign).toBeNull();
	});

	it("keeps a sign both cases share", () => {
		const state = run(
			{ type: "answer", field: "grammaticalCase", value: "NOM" },
			{ type: "answer", field: "sign", value: "muqaddara" },
			{ type: "answer", field: "grammaticalCase", value: "ACC" },
		);
		expect(state.drafts.irab.sign).toBe("muqaddara");
	});
});

describe("quizSession: a jārr-majrūr phrase asks role and mutaʿallaq only", () => {
	const phrase = {
		...irab("pp", 59, 1),
		relation: "pp",
		grammaticalCase: null,
		sign: null,
	} as QuizQuestion;
	const phrasePools: QuizPools = { ...pools, irab: [phrase] };
	const runPhrase = (...events: QuizSessionEvent[]) =>
		events.reduce(
			(state, event) => reduceQuizSession(state, event, phrasePools),
			initQuizSession(),
		);
	const pickPhrase: QuizSessionEvent = {
		type: "answer",
		field: "relation",
		value: "pp",
	};

	it("clears a drafted case and sign once the phrase role is picked", () => {
		const state = runPhrase(
			{ type: "answer", field: "relation", value: "gen" },
			{ type: "answer", field: "grammaticalCase", value: "GEN" },
			{ type: "answer", field: "sign", value: "kasra" },
			pickPhrase,
		);
		expect(state.drafts.irab).toMatchObject({
			relation: "pp",
			grammaticalCase: null,
			sign: null,
		});
	});

	it("submits with role and mutaʿallaq, and grades it correct", () => {
		const state = runPhrase(
			pickPhrase,
			{ type: "answer", field: "headWordNum", value: 1 },
			{ type: "submit" },
		);
		expect(state.missing).toEqual([]);
		expect(state.verdict?.allCorrect).toBe(true);
		expect(progress(state)).toEqual({ filled: 3, total: 3 });
	});

	it("requires case and sign again when the role goes back to a single word", () => {
		const state = runPhrase(
			pickPhrase,
			{ type: "answer", field: "relation", value: "gen" },
			{ type: "answer", field: "headWordNum", value: 1 },
			{ type: "submit" },
		);
		expect(state.missing).toEqual(["grammaticalCase", "sign"]);
	});

	it("marks a single-word analysis of a phrase wrong", () => {
		const state = runPhrase(
			{ type: "answer", field: "relation", value: "gen" },
			{ type: "answer", field: "headWordNum", value: 1 },
			{ type: "answer", field: "grammaticalCase", value: "GEN" },
			{ type: "answer", field: "sign", value: "kasra" },
			{ type: "submit" },
		);
		expect(state.verdict?.allCorrect).toBe(false);
		expect(state.verdict?.fields.relation).toBe(false);
	});
});

describe("quizSession: wizard navigation and lenses", () => {
	it("advances on answer and steps back to edit after a verdict", () => {
		const answered = run({
			type: "answer",
			field: "relation",
			value: "subj",
			step: 2,
		});
		expect(answered).toMatchObject({ step: 2, animDir: "forward" });
		const checked = run(...fullIrab, { type: "submit" });
		const back = reduceQuizSession(
			checked,
			{ type: "goToStep", step: 2 },
			pools,
		);
		expect(back).toMatchObject({ step: 2, animDir: "backward", verdict: null });
	});

	it("switching lens resets drafts but keeps the score", () => {
		const state = run(
			...fullIrab,
			{ type: "submit" },
			{ type: "selectLens", lens: "mutashabih" },
		);
		expect(state.lens).toBe("mutashabih");
		expect(state.drafts.irab.relation).toBeNull();
		expect(state).toMatchObject({ step: 1, verdict: null, recorded: false });
		expect(state.score.solved).toBe(1);
		expect(activeQuestion(state, pools)?.id).toBe("m1");
	});

	it("reopens step when going back to an earlier step after submit", () => {
		const submitted = run(...fullIrab, { type: "submit" });
		expect(submitted.verdict).not.toBeNull();
		const back = run(
			...fullIrab,
			{ type: "submit" },
			{ type: "goToStep", step: 1 },
		);
		expect(back.step).toBe(1);
		expect(back.verdict).toBeNull();
	});

	it("grades the mutashabih lens on wording and surah in three steps", () => {
		const opened = run({ type: "selectLens", lens: "mutashabih" });
		expect(progress(opened)).toEqual({ filled: 1, total: 3 });
		const state = run(
			{ type: "selectLens", lens: "mutashabih" },
			{ type: "answer", field: "wording", value: 1, step: 2 },
			{ type: "answer", field: "surah", value: 7, step: 3 },
			{ type: "submit" },
		);
		expect(state.verdict).toEqual({
			fields: { wording: true, surah: false },
			allCorrect: false,
		});
		expect(state.score).toEqual({ solved: 0, attempts: 1 });
	});

	it("grades the ṣarf lens field by field", () => {
		const state = run(
			{ type: "selectLens", lens: "sarf" },
			{ type: "answer", field: "root", value: "ك ت ب" },
			{ type: "answer", field: "wazn", value: "فَاعِل" },
			{ type: "answer", field: "classCode", value: "c" },
			{ type: "answer", field: "structureCode", value: "st" },
			{ type: "submit" },
		);
		expect(state.verdict?.fields).toEqual({
			root: true,
			wazn: false,
			classCode: true,
			structureCode: true,
		});
	});

	it("grades the usul lens step-by-step through span, dalalah, qarinah, and ruling", () => {
		const state = run(
			{ type: "selectLens", lens: "usul" },
			{ type: "answer", field: "pickedWord", value: 1, step: 2 },
			{ type: "answer", field: "dalalah", value: "AMR_WUJUB", step: 3 },
			{ type: "answer", field: "qarinah", value: "UNSHIFTED", step: 4 },
			{ type: "answer", field: "ruling", value: "وجوب الصلاة", step: 5 },
			{ type: "submit" },
		);
		expect(state.lens).toBe("usul");
		expect(state.verdict).toEqual({
			fields: {
				pickedWord: true,
				dalalah: true,
				qarinah: true,
				ruling: true,
			},
			allCorrect: true,
		});
		expect(state.score).toEqual({ solved: 1, attempts: 1 });
		expect(state.streak).toBe(1);
	});
});
