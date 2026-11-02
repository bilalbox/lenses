/**
 * The page around a grammar lens (iʿrāb, ṣarf): the quiz frame
 * with the ayah as tappable words, each marked for the current step.
 */
import type { ReactNode, RefObject } from "react";
import { useI18n } from "../../lib/i18n/I18nContext";
import type { QuizQuestion, SarfQuestion } from "../../lib/quizBank";
import type { Word } from "../../lib/types";
import type { QuizCrumb } from "../QuizChrome";
import { type LensProps, QuizFrame } from "./QuizFrame";

export type GrammarLens = "irab" | "sarf";
type GrammarQuestion = QuizQuestion | SarfQuestion;

/** How one ayah word shows in the current step. */
export interface TokenMarks {
	target: boolean;
	head: boolean;
	/** The right answer, revealed after a wrong pick. */
	hint: boolean;
	/** Tapping it answers the current step. */
	candidate: boolean;
}

function tokenClass(marks: TokenMarks): string {
	return [
		"quiz-word-token",
		marks.target ? "is-target" : "",
		marks.head ? "is-head" : "",
		marks.hint ? "is-correct-head-hint" : "",
		marks.candidate ? "is-governor-candidate" : "",
	]
		.filter(Boolean)
		.join(" ");
}

function AyahToken({
	word,
	marks,
	show,
	buttonRef,
	onTap,
}: {
	word: Word;
	marks: TokenMarks;
	show: (text: string) => string;
	buttonRef?: RefObject<HTMLButtonElement | null>;
	onTap: () => void;
}) {
	const marked = marks.target || marks.head;
	return (
		<button
			ref={buttonRef}
			type="button"
			className={tokenClass(marks)}
			onClick={onTap}
		>
			<span className="quiz-word-arabic">{show(word.a)}</span>
			{marked && (
				<span
					className={`quiz-token-mark ${marks.target ? "mark-target" : ""} ${marks.head ? "mark-head" : ""}`}
					aria-hidden="true"
				/>
			)}
		</button>
	);
}

export function GrammarFrame({
	lens,
	props,
	crumbs,
	marks,
	picking,
	onTapWord,
	children,
}: {
	lens: GrammarLens;
	props: LensProps<GrammarQuestion>;
	crumbs: QuizCrumb[];
	marks: (word: Word) => TokenMarks;
	/** The current step is answered by tapping a word in the ayah. */
	picking: boolean;
	/** A tap on an ayah word before the verdict. */
	onTapWord?: (wordNum: number) => void;
	children: ReactNode;
}) {
	const { formatNumber } = useI18n();
	const { question: q, session } = props;
	const tap = (wordNum: number) => {
		if (session.verdict === null) onTapWord?.(wordNum);
	};

	return (
		<QuizFrame
			lens={lens}
			questionKey={`${lens}:${q.id}`}
			props={props}
			crumbs={crumbs}
			picking={picking}
			place={{ phonetic: q.suraPhonetic, sura: q.sura, verse: q.verse.v }}
			onOpenReader={() =>
				props.onOpenInReader(q.sura, q.verse.v, q.targetWord.n)
			}
			ayah={
				<p className="verse-line quiz-wizard-verse-line" dir="rtl" lang="ar">
					{q.verse.w.map((w) => (
						<AyahToken
							key={w.n}
							word={w}
							marks={marks(w)}
							show={props.show}
							buttonRef={
								w.n === q.targetWord.n ? props.targetBtnRef : undefined
							}
							onTap={() => tap(w.n)}
						/>
					))}
					<span className="ayah-mark">{formatNumber(q.verse.v)}</span>
				</p>
			}
		>
			{children}
		</QuizFrame>
	);
}
