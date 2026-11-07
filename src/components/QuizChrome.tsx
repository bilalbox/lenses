/** Quiz chrome shared by every lens: lens tabs, the ayah's place, and the step rail. */
import type { ReactNode } from "react";
import { useI18n } from "../lib/i18n/I18nContext";
import { getLensLabel, type QuizLens } from "../lib/quizCatalog";
import type { QuizSessionState, WizardStep } from "../lib/quizSession";

export const LENS_ORDER: QuizLens[] = ["irab", "sarf", "mutashabih", "usul"];

export function QuizLensSwitcher({
	lens,
	onSelect,
}: {
	lens: QuizLens;
	onSelect: (lens: QuizLens) => void;
}) {
	const { locale, t } = useI18n();
	return (
		<div
			className="quiz-lens-switcher"
			role="tablist"
			aria-label={t.quiz.lensesAria}
		>
			{LENS_ORDER.map((l) => {
				const info = getLensLabel(l, locale);
				const active = lens === l;
				return (
					<button
						key={l}
						id={`quiz-lens-tab-${l}`}
						type="button"
						role="tab"
						aria-selected={active}
						aria-controls="quiz-lens-panel"
						className={`quiz-lens-tab${active ? " is-active" : ""}`}
						onClick={() => onSelect(l)}
					>
						<span className="quiz-lens-badge" lang="ar">
							{info.badge}
						</span>
						<span className="quiz-lens-title">{info.title}</span>
					</button>
				);
			})}
		</div>
	);
}

/** The ayah's place under the verse, doubling as the link into the reader. */
export function QuizPlace({
	place,
	onOpenReader,
}: {
	place: { phonetic: string; sura: number; verse: number };
	onOpenReader: () => void;
}) {
	const { t, formatNumber } = useI18n();
	const label = t.quiz.openReader(place.sura, place.verse);
	return (
		<button
			type="button"
			className="quiz-wizard-place"
			onClick={onOpenReader}
			title={label}
			aria-label={label}
		>
			<span className="quiz-wizard-ref">
				{place.phonetic} {formatNumber(place.sura)}:{formatNumber(place.verse)}
			</span>
			<span aria-hidden="true">↗</span>
		</button>
	);
}

export interface QuizCrumb {
	stepNum: WizardStep;
	label: string;
	isAr?: boolean;
	filled: boolean;
}

/** One tappable dot per step; the active one spells out its label, the last is the check step. */
function QuizSteps({
	crumbs,
	activeStep,
	onGoTo,
}: {
	crumbs: QuizCrumb[];
	activeStep: WizardStep;
	onGoTo: (step: WizardStep) => void;
}) {
	const { t, formatNumber } = useI18n();
	return (
		<div
			className="quiz-wizard-breadcrumbs"
			role="tablist"
			aria-label={t.quiz.stepsAria}
		>
			{crumbs.map((b, idx) => (
				<button
					key={b.stepNum}
					id={`quiz-step-tab-${b.stepNum}`}
					type="button"
					role="tab"
					aria-selected={activeStep === b.stepNum}
					aria-controls="quiz-step-panel"
					title={b.label}
					className={`quiz-crumb ${activeStep === b.stepNum ? "is-active" : ""} ${b.filled ? "is-filled" : ""}`}
					onClick={() => onGoTo(b.stepNum)}
				>
					<span className="quiz-crumb-num">
						{idx === crumbs.length - 1 ? "✓" : formatNumber(idx + 1)}
					</span>
					<span className="quiz-crumb-text" lang={b.isAr ? "ar" : undefined}>
						{b.label}
					</span>
				</button>
			))}
		</div>
	);
}

/** Streak, and solved / attempts once there is an attempt. */
function QuizScore({
	session,
}: {
	session: Pick<QuizSessionState, "streak" | "score">;
}) {
	const { t, formatNumber } = useI18n();
	const { streak, score } = session;
	return (
		<span className="quiz-wizard-score">
			<span className="quiz-wizard-stat" title={t.quiz.streakLabel}>
				<strong>{formatNumber(streak)}</strong>
				<small>{t.quiz.streakLabel}</small>
			</span>
			{score.attempts > 0 ? (
				<span className="quiz-wizard-stat" title={t.quiz.scoreLabel}>
					<strong>
						{formatNumber(score.solved)}
						<span className="quiz-stat-sep">/</span>
						{formatNumber(score.attempts)}
					</strong>
				</span>
			) : null}
		</span>
	);
}

/** The single control row above each step: step dots, score and skip, with progress ruled under it. */
export function QuizRail({
	crumbs,
	filled,
	total,
	activeStep,
	onGoTo,
	session,
	onSkip,
}: {
	crumbs: QuizCrumb[];
	filled: number;
	total: number;
	activeStep: WizardStep;
	onGoTo: (step: WizardStep) => void;
	session: Pick<QuizSessionState, "streak" | "score">;
	onSkip: () => void;
}) {
	const { t } = useI18n();
	return (
		<div className="quiz-wizard-rail">
			<QuizSteps crumbs={crumbs} activeStep={activeStep} onGoTo={onGoTo} />
			<div className="quiz-wizard-stats">
				<QuizScore session={session} />
				<button type="button" className="quiz-wizard-skip" onClick={onSkip}>
					{t.quiz.skipButton}
				</button>
			</div>
			<div className="quiz-progress-track" aria-hidden="true">
				<div
					className="quiz-progress-fill"
					style={{ width: `${Math.round((filled / total) * 100)}%` }}
				/>
			</div>
		</div>
	);
}

/** The question text with each occurrence of `focus` (the word being asked about) set apart. */
function emphasize(text: string, focus: string | undefined): ReactNode {
	if (!focus || !text.includes(focus)) return text;
	return text.split(focus).flatMap((part, i) =>
		i === 0
			? [part]
			: [
					<span key={i} className="quiz-question-focus" lang="ar">
						{focus}
					</span>,
					part,
				],
	);
}

/** A step's question, set large so it reads before the options under it. */
export function QuizStepHead({
	title,
	focus,
	hint,
	backLabel,
	onBack,
}: {
	title: string;
	/** Arabic word in `title` to emphasize. */
	focus?: string;
	hint?: string;
	backLabel?: string;
	onBack?: () => void;
}) {
	return (
		<header className="quiz-wizard-step-head">
			<h2 className="quiz-question">{emphasize(title, focus)}</h2>
			{onBack ? (
				<button type="button" className="quiz-back-link" onClick={onBack}>
					{backLabel}
				</button>
			) : null}
			{hint ? <p className="quiz-wizard-subprompt">{hint}</p> : null}
		</header>
	);
}
