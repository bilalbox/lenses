/** The ṣarf lens: name the target word's root, measure, class and structure. */
import { formatIrabText } from "../../lib/formatIrab";
import { useI18n } from "../../lib/i18n/I18nContext";
import type { Locale } from "../../lib/i18n/types";
import type { ChoiceOption, SarfQuestion } from "../../lib/quizBank";
import { SARF_CLASSES, SARF_STRUCTURES } from "../../lib/quizCatalog";
import {
	type DraftField,
	progress,
	type QuizSessionState,
	type WizardStep,
} from "../../lib/quizSession";
import type { ExampleQuery } from "../../lib/search";
import type { QuizCrumb } from "../QuizChrome";
import { QuizStepHead } from "../QuizChrome";
import { GrammarFrame, type TokenMarks } from "./GrammarFrame";
import { currentStep, type LensProps, missingLabels } from "./QuizFrame";
import {
	type Choice,
	ChoiceGrid,
	ChoiceList,
	FormulaPart,
	FormulaPreview,
	InfoChip,
	RevealCard,
	StepBody,
	SubmitBar,
	VerdictChip,
} from "./QuizParts";

type SarfField = DraftField<"sarf">;

const spaced = (root: string) => root.split("").join(" ");
const classAr = (code: string) => SARF_CLASSES[code]?.ar;
const structureAr = (code: string) => SARF_STRUCTURES[code]?.ar;

type T = ReturnType<typeof useI18n>["t"];

/** Step headings, by step; the verb and noun steps 3–4 ask different things. */
const TITLES: Record<1 | 2 | 3 | 4, (q: SarfQuestion, t: T) => string> = {
	1: (q, t) => t.quiz.sarf.rootQuestion(q.targetWord.a),
	2: (q, t) => t.quiz.sarf.waznQuestion(q.headAr),
	3: (q, t) =>
		(q.kind === "verb"
			? t.quiz.sarf.verbClassQuestion
			: t.quiz.sarf.nounClassQuestion)(q.headAr),
	4: (q, t) =>
		(q.kind === "verb"
			? t.quiz.sarf.verbStructureQuestion
			: t.quiz.sarf.nounStructureQuestion)(q.headAr),
};

/** A crumb's label: the answer once picked, else the field name. */
function crumbLabel(
	value: string | null | undefined,
	locale: Locale,
	field: string,
): { label: string; isAr: boolean } {
	return {
		label: value || field,
		isAr: Boolean(value || locale === "ar"),
	};
}

function crumbsOf(
	session: QuizSessionState,
	locale: Locale,
	t: T,
): QuizCrumb[] {
	const d = session.drafts.sarf;
	const cls = d.classCode && (classAr(d.classCode) || d.classCode);
	const str =
		d.structureCode && (structureAr(d.structureCode) || d.structureCode);
	return [
		{
			stepNum: 1,
			...crumbLabel(d.root && spaced(d.root), locale, t.quiz.fieldRoot),
			filled: Boolean(d.root),
		},
		{
			stepNum: 2,
			...crumbLabel(d.wazn, locale, t.quiz.fieldWazn),
			filled: Boolean(d.wazn),
		},
		{
			stepNum: 3,
			...crumbLabel(cls, locale, t.quiz.fieldClass),
			filled: Boolean(d.classCode),
		},
		{
			stepNum: 4,
			...crumbLabel(str, locale, t.quiz.fieldStructure),
			filled: Boolean(d.structureCode),
		},
		{
			stepNum: 5,
			label: t.quiz.stepCheckCrumb,
			filled: progress(session).filled === 5,
		},
	];
}

const choicesOf = (options: ChoiceOption[], locale: Locale): Choice[] =>
	options.map((o) => ({ code: o.code, ar: o.ar, sub: o.sub[locale] }));

/** The four choice steps: the field each answers, its options, and the card layout. */
const STEPS: {
	field: SarfField;
	options: (q: SarfQuestion) => ChoiceOption[];
	layout: typeof ChoiceGrid;
}[] = [
	{ field: "root", options: (q) => q.rootOptions, layout: ChoiceGrid },
	{ field: "wazn", options: (q) => q.waznOptions, layout: ChoiceGrid },
	{ field: "classCode", options: (q) => q.classOptions, layout: ChoiceList },
	{
		field: "structureCode",
		options: (q) => q.structureOptions,
		layout: ChoiceList,
	},
];

export function SarfLens({
	onOpenSearch,
	...props
}: LensProps<SarfQuestion> & {
	onOpenSearch?: (seed: Partial<ExampleQuery>) => void;
}) {
	const { locale, t } = useI18n();
	const { question: q, session, dispatch } = props;
	const step = currentStep(session);
	const goTo = (next: WizardStep) => dispatch({ type: "goToStep", step: next });
	const noMarks = (w: { n: number }): TokenMarks => ({
		target: w.n === q.targetWord.n,
		head: false,
		hint: false,
		candidate: false,
	});

	return (
		<GrammarFrame
			lens="sarf"
			props={props}
			crumbs={crumbsOf(session, locale, t)}
			marks={noMarks}
			picking={false}
		>
			{step < 5 ? (
				<SarfChoiceStep {...props} step={step as 1 | 2 | 3 | 4} onEdit={goTo} />
			) : (
				<StepBody>
					{session.verdict ? (
						<SarfReveal {...props} onOpenSearch={onOpenSearch} />
					) : (
						<SarfCheck {...props} onEdit={goTo} />
					)}
				</StepBody>
			)}
		</GrammarFrame>
	);
}

function SarfChoiceStep({
	question: q,
	session,
	dispatch,
	step,
	onEdit,
}: LensProps<SarfQuestion> & {
	step: 1 | 2 | 3 | 4;
	onEdit: (step: WizardStep) => void;
}) {
	const { locale, t } = useI18n();
	const { field, options, layout: Layout } = STEPS[step - 1]!;
	const focus = step === 1 ? q.targetWord.a : q.headAr;
	const back = step > 1 ? ((step - 1) as WizardStep) : undefined;
	return (
		<StepBody>
			<QuizStepHead
				title={TITLES[step](q, t)}
				focus={focus}
				{...(back
					? { backLabel: t.quiz.backButton, onBack: () => onEdit(back) }
					: {})}
			/>
			<Layout
				choices={choicesOf(options(q), locale)}
				value={session.drafts.sarf[field]}
				onPick={(code) =>
					dispatch({
						type: "answer",
						field,
						value: code,
						step: (step + 1) as WizardStep,
					})
				}
			/>
		</StepBody>
	);
}

function SarfCheck({
	question: q,
	session,
	onSubmit,
	onEdit,
}: LensProps<SarfQuestion> & { onEdit: (step: WizardStep) => void }) {
	const { t } = useI18n();
	const d = session.drafts.sarf;
	const labels: Record<SarfField, string> = {
		root: t.quiz.fieldRoot,
		wazn: t.quiz.fieldWazn,
		classCode: t.quiz.fieldClass,
		structureCode: t.quiz.fieldStructure,
	};
	const word = q.targetWord.a;
	return (
		<>
			<QuizStepHead
				title={t.quiz.sarf.reviewTitle(word)}
				focus={word}
				backLabel={t.quiz.editButton}
				onBack={() => onEdit(4)}
			/>

			<FormulaPreview>
				<strong className="formula-target">{q.headAr}:</strong>{" "}
				<span>من مادة</span>{" "}
				<FormulaPart
					step={1}
					label={labels.root}
					value={d.root?.split("").join(" ")}
					onEdit={onEdit}
				/>
				، <span>على وزن</span>{" "}
				<FormulaPart
					step={2}
					label={labels.wazn}
					value={d.wazn}
					onEdit={onEdit}
				/>
				،{" "}
				<FormulaPart
					step={3}
					label={labels.classCode}
					value={d.classCode && (classAr(d.classCode) ?? d.classCode)}
					onEdit={onEdit}
				/>
				،{" "}
				<FormulaPart
					step={4}
					label={labels.structureCode}
					value={
						d.structureCode && (structureAr(d.structureCode) ?? d.structureCode)
					}
					onEdit={onEdit}
				/>
				.
			</FormulaPreview>
			<p className="quiz-wizard-subprompt">{t.quiz.formulaEditHint}</p>

			<SubmitBar
				missing={missingLabels(session, labels)}
				label={t.quiz.sarf.submitButton}
				onSubmit={onSubmit}
			/>
		</>
	);
}

function SarfReveal({
	question: q,
	session,
	onNext,
	onOpenSearch,
}: LensProps<SarfQuestion> & {
	onOpenSearch?: (seed: Partial<ExampleQuery>) => void;
}) {
	const { t } = useI18n();
	const d = session.drafts.sarf;
	const ok = (field: SarfField) => session.verdict?.fields[field] ?? false;
	const word = q.targetWord.a;
	return (
		<RevealCard
			correct={session.verdict?.allCorrect ?? false}
			title={t.quiz.sarf.revealHeading(word)}
			chips={
				<>
					<VerdictChip
						ok={ok("root")}
						picked={d.root && spaced(d.root)}
						answer={`المادة: ${q.rootSpaced}`}
					/>
					<VerdictChip
						ok={ok("wazn")}
						picked={d.wazn}
						answer={`الوزن: ${q.wazn}`}
					/>
					<VerdictChip
						ok={ok("classCode")}
						picked={d.classCode && (classAr(d.classCode) || d.classCode)}
						answer={`${classAr(q.classCode)}`}
					/>
					<VerdictChip
						ok={ok("structureCode")}
						picked={
							d.structureCode &&
							(structureAr(d.structureCode) || d.structureCode)
						}
						answer={`${structureAr(q.structureCode)}`}
					/>
					{q.singular ? <InfoChip>مفرده: {q.singular}</InfoChip> : null}
					{q.asl ? <InfoChip>أصله: {q.asl}</InfoChip> : null}
				</>
			}
			prose={formatIrabText(q.classicalSarf)}
			meaning={q.classicalMeaning}
			onNext={onNext}
			secondary={
				onOpenSearch
					? {
							label: t.quiz.sarf.rootInExamples(q.rootSpaced),
							onClick: () => onOpenSearch(q.searchSeed),
						}
					: undefined
			}
		/>
	);
}
