/** The mutashabih lens: fill the word where an ayah parts from a similar one, then name its surah. */
import { useI18n } from "../../lib/i18n/I18nContext";
import {
	ayahWithBlank,
	type MutashabihQuestion,
} from "../../lib/mutashabihQuiz";
import { progress, type WizardStep } from "../../lib/quizSession";
import type { QuizCrumb } from "../QuizChrome";
import { QuizStepHead } from "../QuizChrome";
import {
	currentStep,
	type LensProps,
	missingLabels,
	QuizFrame,
} from "./QuizFrame";
import {
	type Choice,
	ChoiceGrid,
	FormulaPart,
	FormulaPreview,
	RevealCard,
	StepBody,
	SubmitBar,
	VerdictChip,
} from "./QuizParts";

type Show = (text: string) => string;

export function MutashabihLens(props: LensProps<MutashabihQuestion>) {
	const { t } = useI18n();
	const copy = t.quiz.mutashabih;
	const { question: q, session, dispatch, show } = props;
	const draft = session.drafts.mutashabih;
	const complete = session.verdict !== null;
	const step = currentStep(session);
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
	const wordingChoices: Choice[] = q.wordings.map((w, i) => ({
		code: String(i),
		ar: wordingLabel(w.text),
	}));
	const surahChoices: Choice[] = q.surahs.map((s) => ({
		code: String(s.n),
		ar: s.name,
		sub: s.phonetic,
	}));

	return (
		<QuizFrame
			lens="mutashabih"
			questionKey={q.id}
			props={props}
			crumbs={crumbs}
			ayah={
				<AyahLine
					question={q}
					fill={fill}
					complete={complete}
					show={show}
					noWord={copy.noWord}
				/>
			}
			// Naming the surah is step 2, so the reference stays hidden until checked.
			place={
				complete
					? { phonetic: q.suraPhonetic, sura: q.sura, verse: q.verse.v }
					: null
			}
			onOpenReader={() =>
				props.onOpenInReader(
					q.sura,
					q.verse.v,
					q.length > 0 ? q.at + 1 : undefined,
				)
			}
		>
			<StepBody>
				{step === 1 ? (
					<>
						<QuizStepHead
							title={copy.wordingQuestion}
							hint={copy.wordingHint}
							backLabel={t.quiz.backButton}
						/>
						<ChoiceGrid
							pressed
							choices={wordingChoices}
							value={draft.wording === null ? null : String(draft.wording)}
							onPick={(code) =>
								dispatch({
									type: "answer",
									field: "wording",
									value: Number(code),
									step: 2,
								})
							}
						/>
					</>
				) : null}
				{step === 2 ? (
					<>
						<QuizStepHead
							title={copy.surahQuestion}
							backLabel={t.quiz.backButton}
							onBack={() => goTo(1)}
						/>
						<ChoiceGrid
							pressed
							choices={surahChoices}
							value={draft.surah === null ? null : String(draft.surah)}
							onPick={(code) =>
								dispatch({
									type: "answer",
									field: "surah",
									value: Number(code),
									step: 3,
								})
							}
						/>
					</>
				) : null}
				{step === 3 && !complete ? (
					<MutashabihCheck
						{...props}
						wording={picked ? wordingLabel(picked.text) : null}
						surah={pickedSurah?.name ?? null}
						onEdit={goTo}
					/>
				) : null}
				{complete ? (
					<MutashabihReveal {...props} wordingLabel={wordingLabel} />
				) : null}
			</StepBody>
		</QuizFrame>
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
							{piece.text === null ? "\u2003\u2003" : null}
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

function MutashabihCheck({
	session,
	onSubmit,
	wording,
	surah,
	onEdit,
}: LensProps<MutashabihQuestion> & {
	wording: string | null;
	surah: string | null;
	onEdit: (step: WizardStep) => void;
}) {
	const { t } = useI18n();
	const copy = t.quiz.mutashabih;
	return (
		<>
			<QuizStepHead
				title={copy.reviewTitle}
				backLabel={t.quiz.editButton}
				onBack={() => onEdit(2)}
			/>
			<FormulaPreview>
				<FormulaPart
					step={1}
					label={copy.fieldWording}
					value={wording}
					onEdit={onEdit}
				/>
				{" · "}
				<FormulaPart
					step={2}
					label={copy.fieldSurah}
					value={surah}
					onEdit={onEdit}
				/>
			</FormulaPreview>
			<p className="quiz-wizard-subprompt">{t.quiz.formulaEditHint}</p>
			<SubmitBar
				missing={missingLabels(session, {
					wording: copy.fieldWording,
					surah: copy.fieldSurah,
				})}
				label={copy.submitButton}
				onSubmit={onSubmit}
			/>
		</>
	);
}

/** Verdict per step, then every wording with the ayahs that read it; each ayah opens in the reader. */
function MutashabihReveal({
	question: q,
	session,
	onOpenInReader,
	onNext,
	wordingLabel,
}: LensProps<MutashabihQuestion> & { wordingLabel: (text: string) => string }) {
	const { t, formatNumber } = useI18n();
	const copy = t.quiz.mutashabih;
	const fields = session.verdict?.fields ?? {};
	const draft = session.drafts.mutashabih;
	const own = q.wordings[q.answer];
	const ownFirst = q.wordings
		.map((w, i) => ({ w, i }))
		.sort((x, y) => Number(y.i === q.answer) - Number(x.i === q.answer));
	const mineWording =
		draft.wording === null
			? null
			: wordingLabel(q.wordings[draft.wording]?.text ?? "");
	const mineSurah = q.surahs.find((s) => s.n === draft.surah)?.name;

	return (
		<RevealCard
			correct={session.verdict?.allCorrect ?? false}
			title={copy.placesHeading}
			chips={
				<>
					<VerdictChip
						ok={fields.wording ?? false}
						picked={mineWording}
						answer={wordingLabel(own?.text ?? "")}
					/>
					<VerdictChip
						ok={fields.surah ?? false}
						picked={mineSurah}
						answer={q.suraName}
					/>
				</>
			}
			onNext={onNext}
		>
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
		</RevealCard>
	);
}
