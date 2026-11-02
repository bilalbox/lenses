/** Building blocks shared by the grammar lenses' wizard steps. */
import type { ReactNode } from "react";
import { useI18n } from "../../lib/i18n/I18nContext";
import type { WizardStep } from "../../lib/quizSession";

export interface Choice {
	code: string;
	ar: string;
	/** The line under the Arabic label. */
	sub: string;
	/** A gloss beside the Arabic label (case cards only). */
	gloss?: string;
}

/** Answer cards in a grid, for short labels (roots, measures, signs). */
export function ChoiceGrid({
	choices,
	value,
	onPick,
}: {
	choices: Choice[];
	value: string | null;
	onPick: (code: string) => void;
}) {
	return (
		<div className="quiz-wizard-sign-grid">
			{choices.map((c) => (
				<button
					key={c.code}
					type="button"
					className={`quiz-sign-card quiz-wizard-sign-card${value === c.code ? " is-selected" : ""}`}
					onClick={() => onPick(c.code)}
				>
					<div>
						<strong lang="ar">{c.ar}</strong>
						<small>{c.sub}</small>
					</div>
				</button>
			))}
		</div>
	);
}

/** Answer cards in a list, for labels that need a description (cases, classes). */
export function ChoiceList({
	choices,
	value,
	onPick,
}: {
	choices: Choice[];
	value: string | null;
	onPick: (code: string) => void;
}) {
	return (
		<div className="quiz-wizard-case-list">
			{choices.map((c) => (
				<button
					key={c.code}
					type="button"
					className={`quiz-case-card quiz-wizard-case-card${value === c.code ? " is-selected" : ""}`}
					onClick={() => onPick(c.code)}
				>
					<div className="quiz-case-row">
						<strong lang="ar">{c.ar}</strong>
						{c.gloss !== undefined ? <span>{c.gloss}</span> : null}
					</div>
					<small>{c.sub}</small>
				</button>
			))}
		</div>
	);
}

export function StepBody({ children }: { children: ReactNode }) {
	return <div className="quiz-wizard-step-body">{children}</div>;
}

/** The answers assembled into one Arabic sentence before checking. */
export function FormulaPreview({ children }: { children: ReactNode }) {
	return (
		<p className="quiz-wizard-formula-preview" dir="rtl" lang="ar">
			{children}
		</p>
	);
}

/** One answer inside the assembled formula; tapping it reopens that step. */
export function FormulaPart({
	step,
	label,
	value,
	onEdit,
}: {
	step: WizardStep;
	label: string;
	value: string | null | undefined;
	onEdit: (step: WizardStep) => void;
}) {
	return (
		<button
			type="button"
			className={`quiz-formula-part${value ? "" : " is-empty"}`}
			aria-label={`${label}: ${value || "—"}`}
			title={label}
			onClick={() => onEdit(step)}
		>
			{value || "—"}
		</button>
	);
}

/** Names the fields still empty, then the check button. */
export function SubmitBar({
	missing,
	label,
	onSubmit,
}: {
	/** Labels of the required fields left empty on the last submit. */
	missing: string[];
	label: string;
	onSubmit: () => void;
}) {
	const { t } = useI18n();
	return (
		<>
			{missing.length > 0 && (
				<div className="quiz-inline-error" role="alert">
					<strong>{t.quiz.incompleteAlert}</strong> {missing.join(" · ")}
				</div>
			)}

			<div className="quiz-wizard-actions sticky-actions">
				<button type="button" className="quiz-submit-btn" onClick={onSubmit}>
					<span>{label}</span>
				</button>
			</div>
		</>
	);
}

/** One graded field: the answer when right, the pick and the answer when wrong. */
export function VerdictChip({
	ok,
	picked,
	answer,
	wrongAnswer = answer,
}: {
	ok: boolean;
	/** What the reader picked, as it reads; empty when nothing was picked. */
	picked: string | null | undefined;
	answer: string | undefined;
	/** The answer as shown beside a wrong pick, when it reads differently. */
	wrongAnswer?: string;
}) {
	return (
		<span className={`quiz-verdict-chip ${ok ? "ok" : "err"}`} lang="ar">
			{ok ? `✓ ${answer}` : `✗ ${picked || "—"} ← ✓ ${wrongAnswer}`}
		</span>
	);
}

/** A fact shown with the verdict that was not asked (pattern, singular, …). */
export function InfoChip({ children }: { children: ReactNode }) {
	return (
		<span className="quiz-verdict-chip ok" lang="ar">
			{children}
		</span>
	);
}

/** The classical analysis after checking, with the graded fields and next steps. */
export function RevealCard({
	correct,
	title,
	chips,
	prose,
	meaning,
	onNext,
	secondary,
}: {
	correct: boolean;
	title: string;
	chips: ReactNode;
	prose: ReactNode;
	meaning?: string;
	onNext: () => void;
	/** An extra action beside "next" (e.g. open the pattern in example search). */
	secondary?: { label: string; onClick: () => void };
}) {
	const { t } = useI18n();
	const tone = correct ? "is-correct" : "is-review";
	return (
		<div className={`quiz-wizard-reveal-card ${tone}`}>
			<header className="quiz-solution-head">
				<div className="quiz-solution-copy">
					<h3>{title}</h3>
				</div>
				<span className={`quiz-verdict-status-pill ${tone}`}>
					{correct ? t.quiz.exactMatchEyebrow : t.quiz.reviewEyebrow}
				</span>
			</header>

			<div className="quiz-wizard-verdict-strip">{chips}</div>

			<p
				className="prose irab-prose quiz-wizard-irab-prose"
				dir="rtl"
				lang="ar"
			>
				{prose}
			</p>

			{meaning ? (
				<p className="prose quiz-meaning-note" dir="rtl" lang="ar">
					<strong>المعنى: </strong>
					{meaning}
				</p>
			) : null}

			<div className="quiz-wizard-actions sticky-actions">
				<button type="button" className="quiz-next-cta" onClick={onNext}>
					{t.quiz.nextButton}
				</button>
				{secondary ? (
					<button
						type="button"
						className="quiz-secondary-btn"
						onClick={secondary.onClick}
					>
						{secondary.label}
					</button>
				) : null}
			</div>
		</div>
	);
}
