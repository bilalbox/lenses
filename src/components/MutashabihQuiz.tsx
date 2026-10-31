/** The mutashabih lens: fill the word where an ayah parts from a similar one, then name its surah. */
import type { Dispatch } from "react";
import { stripTashkeel } from "../lib/arabic";
import { useI18n } from "../lib/i18n/I18nContext";
import { ayahWithBlank, type MutashabihQuestion } from "../lib/mutashabihQuiz";
import type { QuizLens } from "../lib/quizCatalog";
import {
	maxStep,
	progress,
	type QuizSessionEvent,
	type QuizSessionState,
	type WizardStep,
} from "../lib/quizSession";
import {
	type QuizCrumb,
	QuizLensSwitcher,
	QuizMetaBar,
	QuizProgressStrip,
	QuizStepHead,
} from "./QuizChrome";

type Show = (text: string) => string;

export function MutashabihQuiz({
	question: q,
	session,
	dispatch,
	hideDiacritics,
	onOpenInReader,
	onSelectLens,
	onNext,
}: {
	question: MutashabihQuestion;
	session: QuizSessionState;
	dispatch: Dispatch<QuizSessionEvent>;
	hideDiacritics: boolean;
	onOpenInReader: (sura: number, verse: number, word?: number) => void;
	onSelectLens: (lens: QuizLens) => void;
	onNext: () => void;
}) {
	const { t } = useI18n();
	const copy = t.quiz.mutashabih;
	const show: Show = hideDiacritics ? stripTashkeel : (text) => text;
	const draft = session.drafts.mutashabih;
	const complete = session.verdict !== null;
	const step: WizardStep = complete ? maxStep("mutashabih") : session.step;
	const picked = draft.wording === null ? null : q.wordings[draft.wording];
	const pickedSurah = q.surahs.find((s) => s.n === draft.surah) ?? null;
	const { filled, total } = progress(session);
	const goTo = (next: WizardStep) => dispatch({ type: "goToStep", step: next });
	const wordingLabel = (text: string) => (text ? show(text) : copy.noWord);

	const crumbs: QuizCrumb[] = [
		{
			stepNum: 1,
			label: picked ? wordingLabel(picked.text) : copy.fieldWording,
			isAr: Boolean(picked),
			filled: picked !== null,
		},
		{
			stepNum: 2,
			label: pickedSurah ? pickedSurah.name : copy.fieldSurah,
			isAr: Boolean(pickedSurah),
			filled: pickedSurah !== null,
		},
		{ stepNum: 3, label: t.quiz.stepCheckCrumb, filled: filled === total },
	];
	const own = q.wordings[q.answer];
	const fill = complete ? (own?.text ?? null) : (picked?.text ?? null);
	const openAyah = () =>
		onOpenInReader(q.sura, q.verse.v, q.length > 0 ? q.at + 1 : undefined);

	return (
		<div className="quiz-wizard-viewport anim-soft-enter">
			<h1 className="quiz-page-title">{t.quiz.pageTitle}</h1>
			<section className="quiz-wizard-top" aria-label={t.common.verse}>
				<QuizLensSwitcher lens="mutashabih" onSelect={onSelectLens} />
				<div key={q.id} className="quiz-wizard-ayah-box anim-soft-enter">
					<AyahLine
						question={q}
						fill={fill}
						complete={complete}
						show={show}
						noWord={copy.noWord}
					/>
				</div>
			</section>

			<section
				id="quiz-lens-panel"
				className="quiz-wizard-bottom"
				role="tabpanel"
				aria-labelledby="quiz-lens-tab-mutashabih"
				aria-live="polite"
			>
				{/* Naming the surah is step 2, so the reference stays hidden until checked. */}
				<QuizMetaBar
					place={
						complete
							? { phonetic: q.suraPhonetic, sura: q.sura, verse: q.verse.v }
							: null
					}
					onOpenReader={openAyah}
					session={session}
					onSkip={onNext}
				/>
				<QuizProgressStrip
					crumbs={crumbs}
					filled={filled}
					total={total}
					activeStep={step}
					onGoTo={goTo}
				/>
				<div
					id="quiz-step-panel"
					key={`${q.id}-step-${step}`}
					className={`quiz-wizard-pane anim-${session.animDir}`}
					role="tabpanel"
					aria-labelledby={`quiz-step-tab-${step}`}
				>
					<div className="quiz-wizard-step-body">
						{step === 1 ? (
							<ChoiceStep
								title={copy.wordingQuestion}
								hint={copy.wordingHint}
								choices={q.wordings.map((w, i) => ({
									key: i,
									label: wordingLabel(w.text),
									selected: draft.wording === i,
								}))}
								onPick={(i) =>
									dispatch({
										type: "answer",
										field: "wording",
										value: i,
										step: 2,
									})
								}
							/>
						) : null}
						{step === 2 ? (
							<ChoiceStep
								title={copy.surahQuestion}
								onBack={() => goTo(1)}
								choices={q.surahs.map((s) => ({
									key: s.n,
									label: s.name,
									sub: s.phonetic,
									selected: draft.surah === s.n,
								}))}
								onPick={(n) =>
									dispatch({
										type: "answer",
										field: "surah",
										value: n,
										step: 3,
									})
								}
							/>
						) : null}
						{step === 3 && !complete ? (
							<CheckStep
								wording={picked ? wordingLabel(picked.text) : null}
								surah={pickedSurah?.name ?? null}
								missing={session.missing.length > 0}
								onEdit={goTo}
								onSubmit={() => dispatch({ type: "submit" })}
							/>
						) : null}
						{complete ? (
							<Reveal
								question={q}
								session={session}
								wordingLabel={wordingLabel}
								onOpenInReader={onOpenInReader}
								onNext={onNext}
							/>
						) : null}
					</div>
				</div>
			</section>
		</div>
	);
}

/** The ayah with its blank; once checked, an ayah with no word at the blank closes up. */
function AyahLine({
	question,
	fill,
	complete,
	show,
	noWord,
}: {
	question: MutashabihQuestion;
	fill: string | null;
	complete: boolean;
	show: Show;
	noWord: string;
}) {
	const { formatNumber } = useI18n();
	return (
		<p className="verse-line quiz-wizard-verse-line" dir="rtl" lang="ar">
			{ayahWithBlank(question, fill).map((piece) => {
				if (piece.kind === "word")
					return (
						<span key={piece.index} className="quiz-word-token">
							<span className="quiz-word-arabic">{show(piece.text)}</span>
						</span>
					);
				if (complete && piece.text === "") return null;
				return (
					<span
						key="blank"
						className={`quiz-word-token quiz-mt-blank ${complete ? "is-target" : piece.text === null ? "" : "is-head"}`}
					>
						<span className="quiz-word-arabic">
							{piece.text === null ? "  " : null}
							{piece.text ? show(piece.text) : null}
							{piece.text === "" ? <small>{noWord}</small> : null}
						</span>
					</span>
				);
			})}
			{complete ? (
				<span className="ayah-mark">{formatNumber(question.verse.v)}</span>
			) : null}
		</p>
	);
}

function ChoiceStep({
	title,
	hint,
	onBack,
	choices,
	onPick,
}: {
	title: string;
	hint?: string;
	onBack?: () => void;
	choices: { key: number; label: string; sub?: string; selected: boolean }[];
	onPick: (key: number) => void;
}) {
	const { t } = useI18n();
	return (
		<>
			<QuizStepHead
				title={title}
				hint={hint}
				backLabel={t.quiz.backButton}
				onBack={onBack}
			/>
			<div className="quiz-wizard-sign-grid">
				{choices.map((c) => (
					<button
						key={c.key}
						type="button"
						aria-pressed={c.selected}
						className={`quiz-sign-card quiz-wizard-sign-card${c.selected ? " is-selected" : ""}`}
						onClick={() => onPick(c.key)}
					>
						<div>
							<strong lang="ar">{c.label}</strong>
							{c.sub ? <small>{c.sub}</small> : null}
						</div>
					</button>
				))}
			</div>
		</>
	);
}

function CheckStep({
	wording,
	surah,
	missing,
	onEdit,
	onSubmit,
}: {
	wording: string | null;
	surah: string | null;
	missing: boolean;
	onEdit: (step: WizardStep) => void;
	onSubmit: () => void;
}) {
	const { t } = useI18n();
	const copy = t.quiz.mutashabih;
	const missingLabels = [
		wording === null ? copy.fieldWording : null,
		surah === null ? copy.fieldSurah : null,
	].filter(Boolean);
	return (
		<>
			<QuizStepHead
				title={copy.reviewTitle}
				backLabel={t.quiz.editButton}
				onBack={() => onEdit(2)}
			/>
			<p className="quiz-wizard-formula-preview" dir="rtl" lang="ar">
				<AnswerPart
					step={1}
					label={copy.fieldWording}
					value={wording}
					onEdit={onEdit}
				/>
				{" · "}
				<AnswerPart
					step={2}
					label={copy.fieldSurah}
					value={surah}
					onEdit={onEdit}
				/>
			</p>
			<p className="quiz-wizard-subprompt">{t.quiz.formulaEditHint}</p>
			{missing && missingLabels.length > 0 ? (
				<div className="quiz-inline-error" role="alert">
					<strong>{t.quiz.incompleteAlert}</strong> {missingLabels.join(" · ")}
				</div>
			) : null}
			<div className="quiz-wizard-actions sticky-actions">
				<button type="button" className="quiz-submit-btn" onClick={onSubmit}>
					<span>{copy.submitButton}</span>
				</button>
			</div>
		</>
	);
}

function AnswerPart({
	step,
	label,
	value,
	onEdit,
}: {
	step: WizardStep;
	label: string;
	value: string | null;
	onEdit: (step: WizardStep) => void;
}) {
	return (
		<button
			type="button"
			className={`quiz-formula-part${value ? "" : " is-empty"}`}
			aria-label={`${label}: ${value ?? "—"}`}
			title={label}
			onClick={() => onEdit(step)}
		>
			{value ?? "—"}
		</button>
	);
}

/** Verdict per step, then every wording with the ayahs that read it; each ayah opens in the reader. */
function Reveal({
	question: q,
	session,
	wordingLabel,
	onOpenInReader,
	onNext,
}: {
	question: MutashabihQuestion;
	session: QuizSessionState;
	wordingLabel: (text: string) => string;
	onOpenInReader: (sura: number, verse: number) => void;
	onNext: () => void;
}) {
	const { t, formatNumber } = useI18n();
	const copy = t.quiz.mutashabih;
	const fields = session.verdict?.fields ?? {};
	const allOk = session.verdict?.allCorrect ?? false;
	const draft = session.drafts.mutashabih;
	const own = q.wordings[q.answer];
	const ownFirst = q.wordings
		.map((w, i) => ({ w, i }))
		.sort((x, y) => Number(y.i === q.answer) - Number(x.i === q.answer));
	const chip = (ok: boolean | undefined, mine: string, right: string) =>
		ok ? `✓ ${right}` : `✗ ${mine} ← ✓ ${right}`;
	const mineWording =
		draft.wording === null
			? "—"
			: wordingLabel(q.wordings[draft.wording]?.text ?? "");
	const mineSurah = q.surahs.find((s) => s.n === draft.surah)?.name ?? "—";

	return (
		<div
			className={`quiz-wizard-reveal-card ${allOk ? "is-correct" : "is-review"}`}
		>
			<header className="quiz-solution-head">
				<div className="quiz-solution-copy">
					<h3>{copy.placesHeading}</h3>
				</div>
				<span
					className={`quiz-verdict-status-pill ${allOk ? "is-correct" : "is-review"}`}
				>
					{allOk ? t.quiz.exactMatchEyebrow : t.quiz.reviewEyebrow}
				</span>
			</header>

			<div className="quiz-wizard-verdict-strip">
				<span
					className={`quiz-verdict-chip ${fields.wording ? "ok" : "err"}`}
					lang="ar"
				>
					{chip(fields.wording, mineWording, wordingLabel(own?.text ?? ""))}
				</span>
				<span
					className={`quiz-verdict-chip ${fields.surah ? "ok" : "err"}`}
					lang="ar"
				>
					{chip(fields.surah, mineSurah, q.suraName)}
				</span>
			</div>

			<ul className="quiz-mt-places">
				{ownFirst.map(({ w, i }) => (
					<li key={w.text} className={i === q.answer ? "is-own" : undefined}>
						<strong lang="ar" dir="rtl">
							{wordingLabel(w.text)}
						</strong>
						<span className="quiz-mt-refs">
							{w.refs.map((r) => (
								<button
									key={`${r.sura}:${r.verse}`}
									type="button"
									className="quiz-mt-ref"
									onClick={() => onOpenInReader(r.sura, r.verse)}
								>
									{r.phonetic} {formatNumber(r.sura)}:{formatNumber(r.verse)}
									{i === q.answer ? ` · ${copy.thisAyah}` : ""}
								</button>
							))}
						</span>
					</li>
				))}
			</ul>

			<div className="quiz-wizard-actions sticky-actions">
				<button type="button" className="quiz-next-cta" onClick={onNext}>
					{t.quiz.nextButton}
				</button>
			</div>
		</div>
	);
}
