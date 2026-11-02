/**
 * The page around every quiz lens: the lens switcher, the ayah box, the place
 * and score bar, the step crumbs, and the animated pane holding the current
 * step. Each lens supplies its ayah, crumbs and step.
 */
import type { Dispatch, ReactNode, RefObject } from "react";
import { useI18n } from "../../lib/i18n/I18nContext";
import type { QuizLens } from "../../lib/quizCatalog";
import {
	maxStep,
	progress,
	type QuizSessionEvent,
	type QuizSessionState,
	type WizardStep,
} from "../../lib/quizSession";
import {
	type QuizCrumb,
	QuizLensSwitcher,
	QuizMetaBar,
	QuizProgressStrip,
} from "../QuizChrome";

/** What the screen hands every lens. */
export interface LensProps<Q> {
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

export function QuizFrame({
	lens,
	questionKey,
	props,
	crumbs,
	ayah,
	picking = false,
	place,
	onOpenReader,
	children,
}: {
	lens: QuizLens;
	/** Remounts the ayah and the step pane (and replays their entry) per question. */
	questionKey: string;
	props: LensProps<unknown>;
	crumbs: QuizCrumb[];
	/** The ayah line inside the ayah box. */
	ayah: ReactNode;
	/** The current step is answered by tapping a word in the ayah. */
	picking?: boolean;
	/** Where the ayah is; null while naming its place is part of the question. */
	place: { phonetic: string; sura: number; verse: number } | null;
	onOpenReader: () => void;
	children: ReactNode;
}) {
	const { t } = useI18n();
	const { session } = props;
	const step = currentStep(session);
	const { filled, total } = progress(session);

	return (
		<div className="quiz-wizard-viewport anim-soft-enter">
			<h1 className="quiz-page-title">{t.quiz.pageTitle}</h1>
			<section className="quiz-wizard-top" aria-label={t.common.verse}>
				<QuizLensSwitcher lens={lens} onSelect={props.onSelectLens} />

				<div
					key={questionKey}
					ref={props.ayahBoxRef}
					className={`quiz-wizard-ayah-box anim-soft-enter${picking ? " is-picking-governor" : ""}`}
				>
					{ayah}
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
					place={place}
					onOpenReader={onOpenReader}
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
					key={`${questionKey}-step-${step}`}
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
