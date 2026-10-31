import type { QuizCase, QuizLens, QuizRelation, QuizSign } from "./quizCatalog";
import type { QuizPools } from "./quizEngine";

export interface IrabDraft {
	relation: QuizRelation | null;
	headWordNum: number | null;
	grammaticalCase: QuizCase | null;
	sign: QuizSign | null;
}

export interface SarfDraft {
	root: string | null;
	wazn: string | null;
	classCode: string | null;
	structureCode: string | null;
}

export interface ExamplesDraft {
	spottedWordNum: number | null;
}

export interface Drafts {
	irab: IrabDraft;
	sarf: SarfDraft;
	examples: ExamplesDraft;
}

type Questions = { [L in QuizLens]: QuizPools[L][number] };

/** A field of one lens's draft; every field is required and graded. */
export type DraftField<L extends QuizLens = QuizLens> = L extends QuizLens
	? keyof Drafts[L] & string
	: never;

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export interface Verdict {
	fields: Partial<Record<DraftField, boolean>>;
	allCorrect: boolean;
	/** The answer was shown rather than worked out; never rendered as a win. */
	revealed: boolean;
}

export interface QuizSessionState {
	lens: QuizLens;
	indices: Record<QuizLens, number>;
	seeded: boolean;
	drafts: Drafts;
	step: WizardStep;
	animDir: "forward" | "backward";
	/** Required fields left empty on the last submit; empty once all are answered. */
	missing: DraftField[];
	/** Set by a complete submit or a reveal; cleared when the reader edits again. */
	verdict: Verdict | null;
	/** The current question's outcome is already in the score. */
	recorded: boolean;
	streak: number;
	score: { solved: number; attempts: number };
}

export type QuizSessionEvent =
	| { type: "seed"; random: Record<QuizLens, number> }
	| { type: "selectLens"; lens: QuizLens }
	| {
			type: "answer";
			field: DraftField;
			value: string | number;
			/** Advance the wizard to this step after answering. */
			step?: WizardStep;
	  }
	| { type: "goToStep"; step: WizardStep }
	| { type: "submit" }
	| { type: "reveal" }
	| { type: "next"; random: number };

interface LensSpec<L extends QuizLens> {
	fields: DraftField<L>[];
	empty: () => Drafts[L];
	answer: (question: Questions[L]) => Drafts[L];
}

const LENSES: { [L in QuizLens]: LensSpec<L> } = {
	irab: {
		fields: ["relation", "headWordNum", "grammaticalCase", "sign"],
		empty: () => ({
			relation: null,
			headWordNum: null,
			grammaticalCase: null,
			sign: null,
		}),
		answer: (q) => ({
			relation: q.relation,
			headWordNum: q.headWord.n,
			grammaticalCase: q.grammaticalCase,
			sign: q.sign,
		}),
	},
	sarf: {
		fields: ["root", "wazn", "classCode", "structureCode"],
		empty: () => ({
			root: null,
			wazn: null,
			classCode: null,
			structureCode: null,
		}),
		answer: (q) => ({
			root: q.rootRaw,
			wazn: q.wazn,
			classCode: q.classCode,
			structureCode: q.structureCode,
		}),
	},
	examples: {
		fields: ["spottedWordNum"],
		empty: () => ({ spottedWordNum: null }),
		answer: (q) => ({ spottedWordNum: q.targetWord.n }),
	},
};

function emptyDrafts(): Drafts {
	return {
		irab: LENSES.irab.empty(),
		sarf: LENSES.sarf.empty(),
		examples: LENSES.examples.empty(),
	};
}

/** Last wizard step: the check step. */
export function maxStep(lens: QuizLens): WizardStep {
	return lens === "examples" ? 2 : 5;
}

export function initQuizSession(): QuizSessionState {
	return {
		lens: "irab",
		indices: { irab: 0, sarf: 0, examples: 0 },
		seeded: false,
		drafts: emptyDrafts(),
		step: 1,
		animDir: "forward",
		missing: [],
		verdict: null,
		recorded: false,
		streak: 0,
		score: { solved: 0, attempts: 0 },
	};
}

export function activeQuestion(
	state: QuizSessionState,
	pools: QuizPools,
): Questions[QuizLens] | null {
	const pool: Questions[QuizLens][] = pools[state.lens];
	return pool[state.indices[state.lens] % Math.max(pool.length, 1)] ?? null;
}

function draftOf(state: QuizSessionState): Record<string, unknown> {
	return state.drafts[state.lens] as unknown as Record<string, unknown>;
}

/** Fields answered so far, plus the always-filled first step, out of the wizard's steps. */
export function progress(state: QuizSessionState): {
	filled: number;
	total: number;
} {
	const draft = draftOf(state);
	const fields: string[] = LENSES[state.lens].fields;
	return {
		filled: 1 + fields.filter((f) => draft[f] !== null).length,
		total: fields.length + 1,
	};
}

function grade(
	state: QuizSessionState,
	question: Questions[QuizLens],
	revealed: boolean,
): Verdict {
	const spec = LENSES[state.lens] as LensSpec<QuizLens>;
	const correct = spec.answer(question as never) as unknown as Record<
		string,
		unknown
	>;
	const draft = draftOf(state);
	const fields: Verdict["fields"] = {};
	for (const field of spec.fields)
		fields[field] = draft[field] === correct[field];
	return {
		fields,
		allCorrect: !revealed && Object.values(fields).every(Boolean),
		revealed,
	};
}

function record(state: QuizSessionState, won: boolean): QuizSessionState {
	if (state.recorded) return state;
	return {
		...state,
		recorded: true,
		streak: won ? state.streak + 1 : 0,
		score: {
			solved: state.score.solved + (won ? 1 : 0),
			attempts: state.score.attempts + 1,
		},
	};
}

/** Fresh drafts and wizard for a new question or lens; the score carries over. */
function restart(state: QuizSessionState): QuizSessionState {
	return {
		...state,
		drafts: emptyDrafts(),
		step: 1,
		animDir: "forward",
		missing: [],
		verdict: null,
		recorded: false,
	};
}

/** A random question of the current lens from a different ayah when one exists. */
function nextIndex(
	state: QuizSessionState,
	pools: QuizPools,
	random: number,
): number | null {
	const pool: Questions[QuizLens][] = pools[state.lens];
	const current = activeQuestion(state, pools);
	if (pool.length <= 1 || !current) return null;
	const elsewhere = pool.filter(
		(q) => q.sura !== current.sura || q.verse.v !== current.verse.v,
	);
	const source = elsewhere.length > 0 ? elsewhere : pool;
	const picked = source[Math.floor(random * source.length)];
	return Math.max(picked ? pool.indexOf(picked) : 0, 0);
}

export function reduceQuizSession(
	state: QuizSessionState,
	event: QuizSessionEvent,
	pools: QuizPools,
): QuizSessionState {
	switch (event.type) {
		case "seed": {
			const pick = (lens: QuizLens) =>
				Math.floor(event.random[lens] * pools[lens].length);
			return {
				...state,
				seeded: true,
				indices: {
					irab: pick("irab"),
					sarf: pick("sarf"),
					examples: pick("examples"),
				},
			};
		}
		case "selectLens":
			if (event.lens === state.lens) return state;
			return restart({ ...state, lens: event.lens });
		case "answer": {
			if (!(LENSES[state.lens].fields as string[]).includes(event.field))
				return state;
			const drafts = {
				...state.drafts,
				[state.lens]: {
					...state.drafts[state.lens],
					[event.field]: event.value,
				},
			};
			return {
				...state,
				drafts,
				missing: [],
				verdict: null,
				...(event.step
					? { step: event.step, animDir: "forward" as const }
					: {}),
			};
		}
		case "goToStep": {
			const current = state.verdict ? maxStep(state.lens) : state.step;
			const reopen = state.verdict !== null && event.step < maxStep(state.lens);
			return {
				...state,
				step: event.step,
				animDir: event.step >= current ? "forward" : "backward",
				verdict: reopen ? null : state.verdict,
			};
		}
		case "submit": {
			const question = activeQuestion(state, pools);
			if (!question) return state;
			const draft = draftOf(state);
			const missing = LENSES[state.lens].fields.filter(
				(f) => draft[f] === null,
			);
			if (missing.length > 0) return { ...state, missing, verdict: null };
			const verdict = grade(state, question, false);
			return record({ ...state, missing: [], verdict }, verdict.allCorrect);
		}
		case "reveal": {
			const question = activeQuestion(state, pools);
			if (!question) return state;
			const spec = LENSES[state.lens] as LensSpec<QuizLens>;
			const revealed = {
				...state,
				drafts: {
					...state.drafts,
					[state.lens]: spec.answer(question as never),
				},
				missing: [],
				step: maxStep(state.lens),
				animDir: "forward" as const,
			};
			return record(
				{ ...revealed, verdict: grade(revealed, question, true) },
				false,
			);
		}
		case "next": {
			const index = nextIndex(state, pools, event.random);
			if (index === null) return state;
			return restart({
				...state,
				indices: { ...state.indices, [state.lens]: index },
			});
		}
	}
}
