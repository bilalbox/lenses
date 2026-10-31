/** Quiz chrome shared by every lens: lens tabs, the meta bar, and the step strip. */
import type { CSSProperties, ReactNode } from "react";
import { useI18n } from "../lib/i18n/I18nContext";
import { getLensLabel, type QuizLens } from "../lib/quizCatalog";
import type { QuizSessionState, WizardStep } from "../lib/quizSession";

export const LENS_ORDER: QuizLens[] = [
	"irab",
	"sarf",
	"examples",
	"mutashabih",
];

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

/** Where the ayah is (null hides it, e.g. while it is being asked), plus streak, score and skip. */
export function QuizMetaBar({
	place,
	onOpenReader,
	session,
	onSkip,
}: {
	place: { phonetic: string; sura: number; verse: number } | null;
	onOpenReader: () => void;
	session: Pick<QuizSessionState, "streak" | "score">;
	onSkip: () => void;
}) {
	const { t, formatNumber } = useI18n();
	const { streak, score } = session;
	return (
		<div className="quiz-wizard-meta-bar">
			<div className="quiz-wizard-surah-tag">
				{place ? (
					<span className="quiz-wizard-ref">
						{place.phonetic} {formatNumber(place.sura)}:
						{formatNumber(place.verse)}
					</span>
				) : null}
			</div>

			<div className="quiz-wizard-stats">
				<span className="quiz-wizard-stat" title={t.quiz.streakLabel}>
					<strong>{formatNumber(streak)}</strong>
					<small>{t.quiz.streakLabel}</small>
				</span>
				{score.attempts > 0 ? (
					<span
						className="quiz-wizard-stat quiz-wizard-stat-score"
						title="Solved / attempts"
					>
						<strong>
							{formatNumber(score.solved)}
							<span className="quiz-stat-sep">/</span>
							{formatNumber(score.attempts)}
						</strong>
					</span>
				) : null}
				{place ? (
					<button
						type="button"
						className="quiz-wizard-skip quiz-wizard-reader"
						onClick={onOpenReader}
					>
						{t.quiz.openReader(place.sura, place.verse)}
					</button>
				) : null}
				<button type="button" className="quiz-wizard-skip" onClick={onSkip}>
					{t.quiz.skipButton}
				</button>
			</div>
		</div>
	);
}

export interface QuizCrumb {
	stepNum: WizardStep;
	label: string;
	isAr?: boolean;
	filled: boolean;
}

/** Progress bar and one tappable pill per step; the last pill is the check step. */
export function QuizProgressStrip({
	crumbs,
	filled,
	total,
	activeStep,
	onGoTo,
}: {
	crumbs: QuizCrumb[];
	filled: number;
	total: number;
	activeStep: WizardStep;
	onGoTo: (step: WizardStep) => void;
}) {
	const { t, formatNumber } = useI18n();
	const steps = { "--quiz-steps": crumbs.length } as CSSProperties;
	return (
		<div className="quiz-wizard-progress-strip">
			<div className="quiz-progress-track" aria-hidden="true">
				<div
					className="quiz-progress-fill"
					style={{ width: `${Math.round((filled / total) * 100)}%` }}
				/>
			</div>
			<div
				className="quiz-wizard-breadcrumbs"
				style={steps}
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
