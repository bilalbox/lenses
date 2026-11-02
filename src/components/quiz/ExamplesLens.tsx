/** The pattern hunt lens: spot the ayah word that fits a grammatical pattern. */
import { formatIrabText } from "../../lib/formatIrab";
import { useI18n } from "../../lib/i18n/I18nContext";
import type { Locale } from "../../lib/i18n/types";
import type { ExampleHuntQuestion } from "../../lib/quizBank";
import { progress, type QuizSessionState } from "../../lib/quizSession";
import type { ExampleQuery } from "../../lib/search";
import type { Word } from "../../lib/types";
import type { QuizCrumb } from "../QuizChrome";
import { QuizStepHead } from "../QuizChrome";
import { GrammarFrame, type TokenMarks } from "./GrammarFrame";
import { currentStep, type LensProps, missingLabels } from "./QuizFrame";
import {
	FormulaPart,
	FormulaPreview,
	InfoChip,
	RevealCard,
	StepBody,
	SubmitBar,
	VerdictChip,
} from "./QuizParts";

function spottedWord(q: ExampleHuntQuestion, session: QuizSessionState) {
	const n = session.drafts.examples.spottedWordNum;
	return q.verse.w.find((w) => w.n === n) ?? null;
}

function crumbsOf(
	session: QuizSessionState,
	spotted: Word | null,
	show: (text: string) => string,
	locale: Locale,
	t: ReturnType<typeof useI18n>["t"],
): QuizCrumb[] {
	const spotCrumb = t.quiz.examples.spotCrumb;
	return [
		{
			stepNum: 1,
			label: spotted ? show(spotted.a) : spotCrumb,
			isAr: Boolean(spotted || locale === "ar"),
			filled: Boolean(session.drafts.examples.spottedWordNum),
		},
		{
			stepNum: 2,
			label: t.quiz.stepCheckCrumb,
			filled: progress(session).filled === 2,
		},
	];
}

export function ExamplesLens({
	onOpenSearch,
	...props
}: LensProps<ExampleHuntQuestion> & {
	onOpenSearch?: (seed: Partial<ExampleQuery>) => void;
}) {
	const { locale, t } = useI18n();
	const { question: q, session, dispatch, show } = props;
	const step = currentStep(session);
	const complete = session.verdict !== null;
	const spotted = spottedWord(q, session);
	const picked = session.drafts.examples.spottedWordNum;

	const marks = (w: Word): TokenMarks => ({
		target: complete && w.n === q.targetWord.n,
		head: picked === w.n,
		hint: complete && picked !== q.targetWord.n && w.n === q.targetWord.n,
		candidate: step === 1,
	});

	return (
		<GrammarFrame
			lens="examples"
			props={props}
			crumbs={crumbsOf(session, spotted, show, locale, t)}
			marks={marks}
			picking={step === 1}
			onTapWord={(n) =>
				dispatch({
					type: "answer",
					field: "spottedWordNum",
					value: n,
					step: step === 1 ? 2 : undefined,
				})
			}
		>
			{step === 1 && (
				<StepBody>
					<QuizStepHead
						title={t.quiz.examples.spotQuestion(q.facetTitle[locale])}
						hint={q.facetHint[locale]}
					/>
				</StepBody>
			)}

			{step === 2 && (
				<StepBody>
					{complete ? (
						<ExamplesReveal
							{...props}
							spotted={spotted}
							onOpenSearch={onOpenSearch}
						/>
					) : (
						<ExamplesCheck {...props} spotted={spotted} />
					)}
				</StepBody>
			)}
		</GrammarFrame>
	);
}

function ExamplesCheck({
	question: q,
	session,
	dispatch,
	show,
	onSubmit,
	spotted,
}: LensProps<ExampleHuntQuestion> & { spotted: Word | null }) {
	const { locale, t } = useI18n();
	const labels = { spottedWordNum: t.quiz.fieldSpotted };
	const goTo = () => dispatch({ type: "goToStep", step: 1 });
	return (
		<>
			<QuizStepHead
				title={t.quiz.examples.reviewTitle(q.facetTitle[locale])}
				backLabel={t.quiz.editButton}
				onBack={goTo}
			/>

			<FormulaPreview>
				<strong className="formula-target">{q.facetTitle.ar}:</strong>{" "}
				<FormulaPart
					step={1}
					label={labels.spottedWordNum}
					value={spotted && `﴿${show(spotted.a)}﴾`}
					onEdit={goTo}
				/>
			</FormulaPreview>

			<SubmitBar
				missing={missingLabels(session, labels)}
				label={t.quiz.examples.submitButton}
				onSubmit={onSubmit}
			/>
		</>
	);
}

function ExamplesReveal({
	question: q,
	session,
	show,
	onNext,
	spotted,
	onOpenSearch,
}: LensProps<ExampleHuntQuestion> & {
	spotted: Word | null;
	onOpenSearch?: (seed: Partial<ExampleQuery>) => void;
}) {
	const { t } = useI18n();
	const correct = session.verdict?.allCorrect ?? false;
	const word = show(q.targetWord.a);
	const prose =
		q.facetCategory === "syntax" && q.classicalIrab
			? q.classicalIrab
			: q.classicalSarf;
	return (
		<RevealCard
			correct={correct}
			title={t.quiz.examples.revealHeading(word)}
			chips={
				<>
					<VerdictChip
						ok={correct}
						picked={spotted && show(spotted.a)}
						answer={`الشاهد: ${word}`}
					/>
					<InfoChip>الوزن: {q.targetWazn}</InfoChip>
					<InfoChip>المادة: {q.targetRootSpaced}</InfoChip>
				</>
			}
			prose={formatIrabText(prose)}
			meaning={q.classicalMeaning}
			onNext={onNext}
			secondary={
				onOpenSearch
					? {
							label: t.quiz.examples.explorePattern,
							onClick: () => onOpenSearch(q.searchSeed),
						}
					: undefined
			}
		/>
	);
}
