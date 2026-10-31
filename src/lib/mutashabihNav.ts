import type { MutashabihMatch, VerseRef, WordDiffToken } from "./types";

/** A word under the pointer, on the current-ayah card or the counterpart card. */
export interface HoveredWord {
	word: number;
	isTarget: boolean;
}

export interface CounterpartSelection {
	active: number;
	count: number;
	hovered: HoveredWord | null;
}

export type CounterpartEvent =
	| { type: "select"; index: number }
	| { type: "step"; delta: 1 | -1 }
	| { type: "hover"; hovered: HoveredWord | null };

/**
 * Opening selection for one ayah's counterparts: the `target` counterpart when
 * it is among the matches, otherwise the best match (index 0).
 * Mount once per ayah + target so nothing carries over between ayahs.
 */
export function initCounterpartSelection(
	matches: MutashabihMatch[],
	target?: VerseRef,
): CounterpartSelection {
	const idx = target
		? matches.findIndex(
				(m) => m.sura === target.sura && m.ayah === target.verse,
			)
		: -1;
	return { active: Math.max(idx, 0), count: matches.length, hovered: null };
}

export function counterpartSelectionReducer(
	state: CounterpartSelection,
	event: CounterpartEvent,
): CounterpartSelection {
	switch (event.type) {
		case "select":
			if (event.index < 0 || event.index >= state.count) return state;
			return { ...state, active: event.index, hovered: null };
		case "step":
			if (state.count === 0) return state;
			return {
				...state,
				active: (state.active + event.delta + state.count) % state.count,
				hovered: null,
			};
		case "hover":
			return { ...state, hovered: event.hovered };
	}
}

/**
 * Whether a word chip lights up for the current hover: the hovered word itself
 * on its own card, or the word whose diff token points at it (`cw`) on the other.
 */
export function isLinked(
	hovered: HoveredWord | null,
	word: number,
	token: WordDiffToken | undefined,
	onTargetCard: boolean,
): boolean {
	if (!hovered) return false;
	if (hovered.isTarget === onTargetCard) return hovered.word === word;
	return token?.cw === hovered.word;
}
