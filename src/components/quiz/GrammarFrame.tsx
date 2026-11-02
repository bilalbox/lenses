/**
 * The page around a grammar lens (iʿrāb, ṣarf, pattern hunt): the lens
 * switcher, the ayah with its tappable words, the place and score bar, the
 * step crumbs, and the animated pane the lens fills with its current step.
 */
import type { Dispatch, ReactNode, RefObject } from "react";
import { useI18n } from "../../lib/i18n/I18nContext";
import type {
	ExampleHuntQuestion,
	QuizQuestion,
	SarfQuestion,
} from "../../lib/quizBank";
import type { QuizLens } from "../../lib/quizCatalog";
import {
	maxStep,
	progress,
	type QuizSessionEvent,
	type QuizSessionState,
	type WizardStep,
} from "../../lib/quizSession";
import type { Word } from "../../lib/types";
import {
	type QuizCrumb,
	QuizLensSwitcher,
	QuizMetaBar,
	QuizProgressStrip,
} from "../QuizChrome";

export type GrammarLens = "irab" | "sarf" | "examples";
type GrammarQuestion = QuizQuestion | SarfQuestion | ExampleHuntQuestion;

/** What the screen hands every grammar lens. */
export interface LensProps<Q extends GrammarQuestion> {
	question: Q;
	session: QuizSessionState;
	dispatch: Dispatch<QuizSessionEvent>;
	/** How Quranic text renders (diacritics on or off). */
	show: (text: string) => string;
	onSubmit: () => void;
	onNext: () => void;
	onSelectLens: (lens: QuizLens) => void;
	onOpenInReader: (sura: number, verse: number, word?: number) => void;
	/** The target word's button, scrolled into view on each question. */
	targetBtnRef: RefObject<HTMLButtonElement | null>;
	/** The ayah box, scrolled to the top on each question. */
	ayahBoxRef: RefObject<HTMLDivElement | null>;
}

/** How one ayah word shows in the current step. */
export interface TokenMarks {
	target: boolean;
	head: boolean;
	/** The right answer, revealed after a wrong pick. */
	hint: boolean;
	/** Tapping it answers the current step. */
	candidate: boolean;
}

/** The wizard step on screen: the check step once a verdict is in. */
export function currentStep(session: QuizSessionState): WizardStep {
	return session.verdict ? maxStep(session.lens) : session.step;
}

/** Labels of the fields left empty on the last submit. */
export function missingLabels(
	session: QuizSessionState,
	labels: Partial<Record<string, string>>,
): string[] {
	return session.missing.map((field) => labels[field] ?? field);
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
	const { t, formatNumber } = useI18n();
	const { question: q, session } = props;
	const step = currentStep(session);
	const { filled, total } = progress(session);
	const tap = (wordNum: number) => {
		if (session.verdict === null) onTapWord?.(wordNum);
	};

	return (
		<div className="quiz-wizard-viewport anim-soft-enter">
			<h1 className="quiz-page-title">{t.quiz.pageTitle}</h1>
			<section className="quiz-wizard-top" aria-label={t.common.verse}>
				<QuizLensSwitcher lens={lens} onSelect={props.onSelectLens} />

				<div
					key={`${lens}:${q.id}`}
					ref={props.ayahBoxRef}
					className={`quiz-wizard-ayah-box anim-soft-enter ${picking ? "is-picking-governor" : ""}`}
				>
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
				</div>
			</section>

			<section
				id="quiz-lens-panel"
				className="quiz-wizard-bottom"
				role="tabpanel"
				aria-labelledby={`quiz-lens-tab-${lens}`}
				aria-live="polite"
			>
				<QuizMetaBar
					place={{ phonetic: q.suraPhonetic, sura: q.sura, verse: q.verse.v }}
					onOpenReader={() =>
						props.onOpenInReader(q.sura, q.verse.v, q.targetWord.n)
					}
					session={session}
					onSkip={props.onNext}
				/>

				<QuizProgressStrip
					crumbs={crumbs}
					filled={filled}
					total={total}
					activeStep={step}
					onGoTo={(next) => props.dispatch({ type: "goToStep", step: next })}
				/>

				<div
					id="quiz-step-panel"
					key={`${lens}:${q.id}-step-${step}`}
					className={`quiz-wizard-pane anim-${session.animDir}`}
					role="tabpanel"
					aria-labelledby={`quiz-step-tab-${step}`}
				>
					{children}
				</div>
			</section>
		</div>
	);
}
