import type { ReactElement, ReactNode } from "react";
import { stripDiacritics } from "./arabic";
import type { Word } from "./types";

export interface FormatIrabOptions {
	words?: Word[];
	selectedWord?: number;
	onSelectWord?: (word: number, segment?: number) => void;
}

const EMBED_IRAB_LINE =
	/^(.*?(?:وهو\s*(?:\(\(|:|:\(\()\s*))([^:\n]{1,60})([:：])\s*(.*)$/;
const NORMAL_IRAB_LINE = /^((?:\(\(|«|"|\s)*)([^:\n]{1,60})([:：])\s*(.*)$/;
const QUOTE_LINE_RE = /^[.{]*\{(.*)\}[.]*$/;
const AYAH_NUM_SUFFIX = /\s*\((\d+)\)\s*$/;

function norm(text?: string): string {
	if (!text) return "";
	return stripDiacritics(
		text
			.replace(/و\u0670/g, "ا")
			.replace(/\u06e6/g, "ي")
			.replace(/\u06e5/g, "و"),
	)
		.replace(/[ءأإآٱ]/g, "ا")
		.replace(/[\s\-_ـ]/g, "")
		.trim();
}

function normAlif(text?: string): string {
	if (!text) return "";
	return norm(text.replace(/\u0670/g, "ا"));
}

function normBare(text?: string): string {
	if (!text) return "";
	return norm(text.replace(/\u0670/g, ""));
}

export interface WordSearchEntry {
	word: Word;
	index: number;
	exactKeys: Set<string>;
	segmentKeys: Set<string>;
}

export function buildWordIndex(words: Word[]): WordSearchEntry[] {
	return words.map((w, index) => {
		const exactKeys = new Set<string>();
		const segmentKeys = new Set<string>();

		const k1 = normBare(w.a);
		const k2 = normAlif(w.a);
		if (k1) exactKeys.add(k1);
		if (k2) exactKeys.add(k2);

		if (w.s) {
			for (const seg of w.s) {
				const sa1 = normBare(seg.a);
				const sa2 = normAlif(seg.a);
				const sla1 = normBare(seg.la);
				const sla2 = normAlif(seg.la);
				if (sa1) segmentKeys.add(sa1);
				if (sa2) segmentKeys.add(sa2);
				if (sla1) segmentKeys.add(sla1);
				if (sla2) segmentKeys.add(sla2);
			}
		}

		return { word: w, index, exactKeys, segmentKeys };
	});
}

function findExact(
	k1: string,
	k2: string,
	entries: WordSearchEntry[],
	from: number,
	to: number,
): WordSearchEntry | null {
	for (let i = from; i < to; i++) {
		const e = entries[i];
		if (e && (e.exactKeys.has(k1) || e.exactKeys.has(k2))) return e;
	}
	return null;
}

function findSegment(
	k1: string,
	k2: string,
	entries: WordSearchEntry[],
	from: number,
	to: number,
): WordSearchEntry | null {
	for (let i = from; i < to; i++) {
		const e = entries[i];
		if (e && (e.segmentKeys.has(k1) || e.segmentKeys.has(k2))) return e;
	}
	return null;
}

function findContained(
	k1: string,
	k2: string,
	entries: WordSearchEntry[],
	from: number,
	to: number,
): WordSearchEntry | null {
	for (let i = from; i < to; i++) {
		const e = entries[i];
		if (!e) continue;
		for (const key of e.exactKeys) {
			if (key.length >= 2 && (k1.includes(key) || k2.includes(key))) return e;
		}
	}
	return null;
}

export function matchTargetWord(
	target: string,
	entries: WordSearchEntry[],
	startIdx: number,
): WordSearchEntry | null {
	const t1 = normBare(target);
	const t2 = normAlif(target);
	if (!t1 && !t2) return null;

	return (
		findExact(t1, t2, entries, startIdx, entries.length) ??
		findSegment(t1, t2, entries, startIdx, entries.length) ??
		findContained(t1, t2, entries, startIdx, entries.length) ??
		findExact(t1, t2, entries, 0, startIdx) ??
		findSegment(t1, t2, entries, 0, startIdx)
	);
}

function splitWordEnclosure(rawWord: string): {
	prefix: string;
	word: string;
	suffix: string;
} {
	const matchFull = rawWord.match(/^(\(\(+|«|"|\{|﴿)(.*?)(\)\)+|»|"|\}|﴾)$/);
	if (
		matchFull &&
		matchFull[1] !== undefined &&
		matchFull[2] !== undefined &&
		matchFull[3] !== undefined
	) {
		return {
			prefix: matchFull[1],
			word: matchFull[2].trim(),
			suffix: matchFull[3],
		};
	}
	const matchStart = rawWord.match(/^(\(\(+|«|"|\{|﴿)(.*)$/);
	if (
		matchStart &&
		matchStart[1] !== undefined &&
		matchStart[2] !== undefined
	) {
		return {
			prefix: matchStart[1],
			word: matchStart[2].trim(),
			suffix: "",
		};
	}
	return { prefix: "", word: rawWord, suffix: "" };
}

function renderTargetWord(
	word: string,
	matchedWordNum: number | undefined,
	selectedWord: number | undefined,
	onSelectWord: ((word: number, segment?: number) => void) | undefined,
): ReactNode {
	if (matchedWordNum !== undefined && onSelectWord) {
		const isSelected = selectedWord === matchedWordNum;
		return (
			<button
				type="button"
				className={`irab-target-word${isSelected ? " is-on" : ""}`}
				aria-pressed={isSelected}
				onClick={(event) => {
					onSelectWord(matchedWordNum);
					const button = event.currentTarget;
					if (typeof requestAnimationFrame === "function") {
						requestAnimationFrame(() =>
							button.scrollIntoView({ block: "nearest" }),
						);
					}
				}}
			>
				{word}
			</button>
		);
	}
	return <strong className="irab-target-word">{word}</strong>;
}

function renderQuoteLine(
	trimmed: string,
	lineIdx: number,
	isLastLine: boolean,
	entries: WordSearchEntry[],
	selectedWord: number | undefined,
	onSelectWord: ((word: number, segment?: number) => void) | undefined,
): ReactElement | null {
	const quoteMatch = trimmed.match(QUOTE_LINE_RE);
	if (!quoteMatch) return null;

	const inside = quoteMatch[1] ?? "";
	const numMatch = inside.match(AYAH_NUM_SUFFIX);
	const ayahNumber = numMatch?.[1];
	const wordsText = numMatch
		? inside.slice(0, numMatch.index).trim()
		: inside.trim();
	const tokens = wordsText.split(/\s+/).filter(Boolean);

	if (tokens.length === 0) return null;

	let lastMatchedIdx = 0;
	return (
		<span key={`quote-${lineIdx}`} className="irab-line irab-quote-line">
			{"{"}
			{tokens.map((token, tokIdx) => {
				let matchedNum: number | undefined;
				if (tokens.length === entries.length) {
					matchedNum = entries[tokIdx]?.word.n;
				} else {
					const matched = matchTargetWord(token, entries, lastMatchedIdx);
					if (matched) {
						lastMatchedIdx = matched.index;
						matchedNum = matched.word.n;
					}
				}

				const isSelected =
					matchedNum !== undefined && selectedWord === matchedNum;

				return (
					<span key={`tok-${lineIdx}-${tokIdx}-${token}`}>
						{tokIdx > 0 ? " " : ""}
						{matchedNum !== undefined && onSelectWord ? (
							<button
								type="button"
								className={`irab-quote-word${isSelected ? " is-on" : ""}`}
								aria-pressed={isSelected}
								onClick={(event) => {
									onSelectWord(matchedNum);
									const button = event.currentTarget;
									if (typeof requestAnimationFrame === "function") {
										requestAnimationFrame(() =>
											button.scrollIntoView({ block: "nearest" }),
										);
									}
								}}
							>
								{token}
							</button>
						) : (
							token
						)}
					</span>
				);
			})}
			{ayahNumber ? ` (${ayahNumber})` : ""}
			{"}"}
			{!isLastLine ? "\n" : null}
		</span>
	);
}

interface ParseState {
	currentWordIdx: number;
}

function formatColonLine(
	rawMatch: RegExpMatchArray,
	lineIdx: number,
	isLastLine: boolean,
	keyPrefix: string,
	state: ParseState,
	entries: WordSearchEntry[],
	options?: FormatIrabOptions,
): ReactNode {
	const [, lead = "", rawWord = "", colon = "", analysis = ""] = rawMatch;
	const { prefix, word, suffix } = splitWordEnclosure(rawWord.trim());
	const matched =
		entries.length > 0 && word.split(/\s+/).length <= 3
			? matchTargetWord(word, entries, state.currentWordIdx)
			: null;
	if (matched) {
		state.currentWordIdx = matched.index;
	}
	return (
		<span key={`${keyPrefix}-${lineIdx}-${rawWord}`} className="irab-line">
			{lead}
			{prefix}
			{renderTargetWord(
				word,
				matched?.word.n,
				options?.selectedWord,
				options?.onSelectWord,
			)}
			{suffix}
			<span className="irab-colon">{colon}</span> {analysis}
			{!isLastLine ? "\n" : null}
		</span>
	);
}

function formatSingleLine(
	trimmed: string,
	lineIdx: number,
	isLastLine: boolean,
	state: ParseState,
	entries: WordSearchEntry[],
	options?: FormatIrabOptions,
): ReactNode {
	if (lineIdx === 0 && entries.length > 0) {
		const quoteElement = renderQuoteLine(
			trimmed,
			lineIdx,
			isLastLine,
			entries,
			options?.selectedWord,
			options?.onSelectWord,
		);
		if (quoteElement !== null) return quoteElement;
	}

	const embedMatch = trimmed.match(EMBED_IRAB_LINE);
	if (embedMatch) {
		return formatColonLine(
			embedMatch,
			lineIdx,
			isLastLine,
			"embed",
			state,
			entries,
			options,
		);
	}

	const normMatch = trimmed.match(NORMAL_IRAB_LINE);
	if (normMatch) {
		return formatColonLine(
			normMatch,
			lineIdx,
			isLastLine,
			"norm",
			state,
			entries,
			options,
		);
	}

	return (
		<span key={`line-${lineIdx}-${trimmed.slice(0, 8)}`} className="irab-line">
			{trimmed}
			{!isLastLine ? "\n" : null}
		</span>
	);
}

/**
 * Formats multi-line classical sentence i'rab or word-level analysis text.
 * Words before colons (such as `حَقَّ: فعل ماض...`) are rendered with
 * strong bold styling (or clickable buttons when words and onSelectWord are provided)
 * to demarcate the target word from its analysis.
 */
export function formatIrabText(
	text: string,
	options?: FormatIrabOptions,
): ReactNode {
	const lines = text.split("\n");
	const entries = options?.words ? buildWordIndex(options.words) : [];
	const state: ParseState = { currentWordIdx: 0 };

	return lines.map((line, lineIdx) => {
		const trimmed = line.trim();
		if (!trimmed) return "\n";
		return formatSingleLine(
			trimmed,
			lineIdx,
			lineIdx === lines.length - 1,
			state,
			entries,
			options,
		);
	});
}

const BRACKETED_TOKEN = /(\([^)]+\)|﴿[^﴾]+﴾)/;

/**
 * Formats word-level morphology/i'rab text where grammatical segments
 * are bracketed (e.g. `(الْبَاءُ) حَرْفُ جَرٍّ... وَ﴿اسْمِ﴾ اسْمٌ مَجْرُورٌ...`).
 */
export function formatWordIrabText(text: string): ReactNode {
	if (text.includes(":") || text.includes("：")) {
		return formatIrabText(text);
	}

	const parts = text.split(BRACKETED_TOKEN);
	return parts.map((part, idx) => {
		if (!part) return null;
		if (
			(part.startsWith("(") && part.endsWith(")")) ||
			(part.startsWith("﴿") && part.endsWith("﴾"))
		) {
			const open = part[0];
			const close = part[part.length - 1];
			const inner = part.slice(1, -1);
			return (
				<span key={idx}>
					{open}
					<strong className="irab-target-word">{inner}</strong>
					{close}
				</span>
			);
		}
		return <span key={idx}>{part}</span>;
	});
}
