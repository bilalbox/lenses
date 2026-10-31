import type { SyntaxSentence } from "./types";

/** Width of one token box; tokens sit right-to-left in reading order. */
export const TOKEN_WIDTH = 104;
const TOKEN_GAP = 18;
const PAD_X = 48;
const MIN_WIDTH = 640;
const MIN_ARC_HEIGHT = 70;
const CARRIED_ARC_HEIGHT = 60;
const BASELINE_BELOW_ARCS = 45;
/** Arcs leave and land this far above the baseline (the token box top). */
const ARC_FOOT = 35;
const BRACKET_TIER = 36;

export interface LaidToken {
	id: string;
	wordNum: number;
	text: string;
	pos: string;
	relAr?: string;
	/** Centre x of the token box. */
	x: number;
	/** No head and not a root: an elided (مقدَّر) token drawn with a محذوف tag. */
	muqaddar: boolean;
}

export interface LaidArc {
	id: string;
	/** Token index of the dependent. */
	dep: number;
	/** Token index of the head; null when the head is a word carried from an earlier sentence. */
	head: number | null;
	midX: number;
	topY: number;
	path: string;
	label: string;
	carriedText?: string;
}

export interface LaidConstituent {
	key: string;
	label: string;
	tier: number;
	left: number;
	right: number;
	bracketY: number;
	midX: number;
	pillWidth: number;
}

export interface SentenceLayout {
	width: number;
	height: number;
	/** y of the token text baseline; every row is drawn relative to it. */
	baseline: number;
	tokens: LaidToken[];
	arcs: LaidArc[];
	constituents: LaidConstituent[];
}

type Head = [number, number, number, number];

interface Flat extends LaidToken {
	tokNum: number;
	head: Head | null;
	rel: string;
	isRoot: boolean;
	constituent?: SyntaxSentence["words"][number]["tokens"][number]["const"];
}

function arcHeight(span: number) {
	return Math.min(220, 50 + span * 28);
}

function flatten(
	sentence: SyntaxSentence,
	sura: number,
	verse: number,
): Omit<Flat, "x">[] {
	const list: Omit<Flat, "x">[] = [];
	for (const word of sentence.words) {
		for (const tok of word.tokens) {
			const isRoot =
				tok.rel === "root" ||
				(tok.head !== null &&
					tok.head[0] === sura &&
					tok.head[1] === verse &&
					tok.head[2] === word.w &&
					tok.head[3] === tok.tok);
			list.push({
				id: `${sura}:${verse}:${word.w}:${tok.tok}`,
				wordNum: word.w,
				tokNum: tok.tok,
				text: tok.text,
				pos: tok.pos,
				rel: tok.rel,
				relAr: tok.rel_ar,
				head: tok.head,
				isRoot,
				muqaddar: tok.head === null && !isRoot && tok.rel !== "NonRel",
				constituent: tok.const,
			});
		}
	}
	return list;
}

interface PendingArc extends Omit<LaidArc, "topY" | "path"> {
	x1: number;
	x2: number;
	height: number;
}

function buildArcs(
	tokens: Flat[],
	sentence: SyntaxSentence,
	width: number,
): PendingArc[] {
	const arcs: PendingArc[] = [];
	tokens.forEach((dep, depIdx) => {
		if (dep.rel === "NonRel" || dep.isRoot || dep.head === null) return;
		const head = dep.head;
		const label = dep.relAr || dep.rel;
		const headIdx = tokens.findIndex(
			(t) => t.wordNum === head[2] && t.tokNum === head[3],
		);
		if (headIdx !== -1) {
			const x1 = dep.x;
			const x2 = tokens[headIdx]?.x ?? x1;
			arcs.push({
				id: `${dep.id}->${head.join(":")}`,
				dep: depIdx,
				head: headIdx,
				x1,
				x2,
				midX: (x1 + x2) / 2,
				height: arcHeight(Math.abs(depIdx - headIdx)),
				label,
			});
			return;
		}
		// Head sits in a word carried over from a previous verse: aim at the right
		// edge, where the earlier context comes from in RTL.
		const carried = sentence.carried?.find(
			(c) => c.v === head[1] && c.w === head[2],
		);
		if (!carried) return;
		const x2 = width - PAD_X / 2;
		arcs.push({
			id: `${dep.id}->carried:${carried.w}`,
			dep: depIdx,
			head: null,
			x1: dep.x,
			x2,
			midX: (dep.x + x2) / 2,
			height: CARRIED_ARC_HEIGHT,
			label,
			carriedText: carried.text,
		});
	});
	return arcs;
}

interface Span {
	key: string;
	label: string;
	lo: number;
	hi: number;
	tier: number;
}

/** Distinct constituent spans, shortest first, each on the lowest tier clear of shorter overlapping spans. */
function tierConstituents(tokens: Flat[]): Span[] {
	const byKey = new Map<string, Span>();
	for (const tok of tokens) {
		const c = tok.constituent;
		if (!c) continue;
		const key = `${c.label}:${c.from[0]}:${c.from[1]}:${c.to[0]}:${c.to[1]}`;
		if (byKey.has(key)) continue;
		const start = tokens.findIndex(
			(t) => t.wordNum === c.from[0] && t.tokNum === c.from[1],
		);
		const end = tokens.findIndex(
			(t) => t.wordNum === c.to[0] && t.tokNum === c.to[1],
		);
		if (start === -1 || end === -1) continue;
		byKey.set(key, {
			key,
			label: c.label,
			lo: Math.min(start, end),
			hi: Math.max(start, end),
			tier: 0,
		});
	}
	const spans = [...byKey.values()].sort((a, b) => a.hi - a.lo - (b.hi - b.lo));
	spans.forEach((span, i) => {
		for (const prev of spans.slice(0, i)) {
			if (span.lo <= prev.hi && span.hi >= prev.lo)
				span.tier = Math.max(span.tier, prev.tier + 1);
		}
	});
	return spans;
}

/** Geometry for one NoorBayan sentence: tokens RTL, arcs above, constituent brackets below. */
export function layoutSentence(
	sentence: SyntaxSentence,
	sura: number,
	verse: number,
): SentenceLayout {
	const flat = flatten(sentence, sura, verse);
	const count = flat.length;
	const width = Math.max(
		MIN_WIDTH,
		PAD_X * 2 + count * TOKEN_WIDTH + Math.max(0, count - 1) * TOKEN_GAP,
	);
	const tokens: Flat[] = flat.map((tok, index) => ({
		...tok,
		x:
			PAD_X + (count - 1 - index) * (TOKEN_WIDTH + TOKEN_GAP) + TOKEN_WIDTH / 2,
	}));

	const pending = buildArcs(tokens, sentence, width);
	// Carried arcs have a fixed height and do not push the baseline down.
	const tallest = Math.max(
		MIN_ARC_HEIGHT,
		...pending.filter((a) => a.head !== null).map((a) => a.height),
	);
	const baseline = tallest + BASELINE_BELOW_ARCS;
	const foot = baseline - ARC_FOOT;
	const arcs: LaidArc[] = pending.map(({ x1, x2, height, ...arc }) => {
		const topY = baseline - height;
		return {
			...arc,
			topY,
			path: `M ${x1} ${foot} C ${x1} ${topY}, ${x2} ${topY}, ${x2} ${foot}`,
		};
	});

	const spans = tierConstituents(tokens);
	const constituents = spans.map((span) => {
		const x1 = (tokens[span.lo]?.x ?? 0) + TOKEN_WIDTH / 2 - 8;
		const x2 = (tokens[span.hi]?.x ?? 0) - TOKEN_WIDTH / 2 + 8;
		const left = Math.min(x1, x2);
		const right = Math.max(x1, x2);
		return {
			key: span.key,
			label: span.label,
			tier: span.tier,
			left,
			right,
			bracketY: baseline + 60 + span.tier * BRACKET_TIER,
			midX: (left + right) / 2,
			pillWidth: Math.min(130, Math.max(80, right - left - 20)),
		};
	});
	const maxTier = Math.max(0, ...spans.map((s) => s.tier));
	const height =
		baseline +
		65 +
		(constituents.length > 0 ? (maxTier + 1) * BRACKET_TIER + 20 : 40);

	return {
		width,
		height,
		baseline,
		tokens: tokens.map(({ id, wordNum, text, pos, relAr, x, muqaddar }) => ({
			id,
			wordNum,
			text,
			pos,
			relAr,
			x,
			muqaddar,
		})),
		arcs,
		constituents,
	};
}

/** An arc lights up when the hovered token is its dependent or (in-sentence) head. */
export function arcTouches(
	arc: LaidArc,
	tokens: LaidToken[],
	hoveredId: string | null,
): boolean {
	if (hoveredId === null) return false;
	if (tokens[arc.dep]?.id === hoveredId) return true;
	return arc.head !== null && tokens[arc.head]?.id === hoveredId;
}

/** Word number → index of the first sentence that contains it. */
export function sentenceOfWord(
	sentences: SyntaxSentence[],
): Map<number, number> {
	const membership = new Map<number, number>();
	sentences.forEach((sentence, index) => {
		for (const word of sentence.words) {
			if (!membership.has(word.w)) membership.set(word.w, index);
		}
	});
	return membership;
}
