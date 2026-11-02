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
import {
	currentStep,
	GrammarFrame,
	type LensProps,
	missingLabels,
	type TokenMarks,
} from "./GrammarFrame";
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
type Show = (text: string) => string;

const spaced = (root: string) => root.split("").join(" ");
const classAr = (code: string) => SARF_CLASSES[code]?.ar;
const structureAr = (code: string) => SARF_STRUCTURES[code]?.ar;

/** Step headings, by step; the verb and noun steps 3–4 ask different things. */
const TITLES: Record<
	1 | 2 | 3 | 4,
	(q: SarfQuestion, locale: Locale, show: Show) => string
> = {
	1: (q, locale, show) => {
		const w = show(q.targetWord.a);
		if (locale === "ar") return `ما المادة المعجمية (الجذر) لكلمة ﴿${w}﴾؟`;
		if (locale === "id") return `Apa akar kata (maddah) dari ${w}?`;
		return `What is the lexical root (māddah) of ${w}?`;
	},
	2: (q, locale, show) => {
		const w = show(q.headAr);
		if (locale === "ar") return `ما الوزن الصرفي لـ ﴿${w}﴾؟`;
		if (locale === "id") return `Apa wazan sharaf dari ${w}?`;
		return `What is the morphological pattern (wazn) of ${w}?`;
	},
	3: (q, locale, show) => {
		const w = show(q.headAr);
		if (q.kind === "verb")
			return locale === "ar"
				? `من أي باب صرفي جاء الفعل ﴿${w}﴾؟`
				: `Which verbal bāb / form does ${w} belong to?`;
		return locale === "ar"
			? `ما نوع الاسم ﴿${w}﴾ من حيث الاشتقاق؟`
			: `What derivational class is the noun ${w}?`;
	},
	4: (q, locale, show) => {
		const w = show(q.headAr);
		if (q.kind === "verb")
			return locale === "ar"
				? `ما نوع الفعل ﴿${w}﴾ من حيث الصحة والاعتلال؟`
				: `How is ${w} classified by root soundness?`;
		return locale === "ar"
			? `ما بنية الاسم ﴿${w}﴾ من حيث الإفراد والجمع؟`
			: `What is the number / plural structure of ${w}?`;
	},
};

/** A crumb's label: the answer once picked, else the field name. */
function crumbLabel(
	value: string | null | undefined,
	locale: Locale,
	ar: string,
	en: string,
): { label: string; isAr: boolean } {
	return {
		label: value || (locale === "ar" ? ar : en),
		isAr: Boolean(value || locale === "ar"),
	};
}

function crumbsOf(
	session: QuizSessionState,
	locale: Locale,
	checkLabel: string,
): QuizCrumb[] {
	const d = session.drafts.sarf;
	const cls = d.classCode && (classAr(d.classCode) || d.classCode);
	const str =
		d.structureCode && (structureAr(d.structureCode) || d.structureCode);
	return [
		{
			stepNum: 1,
			...crumbLabel(d.root && spaced(d.root), locale, "المادة", "Root"),
			filled: Boolean(d.root),
		},
		{
			stepNum: 2,
			...crumbLabel(d.wazn, locale, "الوزن", "Wazn"),
			filled: Boolean(d.wazn),
		},
		{
			stepNum: 3,
			...crumbLabel(cls, locale, "الباب/المشتق", "Class"),
			filled: Boolean(d.classCode),
		},
		{
			stepNum: 4,
			...crumbLabel(str, locale, "البنية", "Structure"),
			filled: Boolean(d.structureCode),
		},
		{
			stepNum: 5,
			label: checkLabel,
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
			crumbs={crumbsOf(session, locale, t.quiz.stepCheckCrumb)}
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
	show,
	step,
	onEdit,
}: LensProps<SarfQuestion> & {
	step: 1 | 2 | 3 | 4;
	onEdit: (step: WizardStep) => void;
}) {
	const { locale, t } = useI18n();
	const { field, options, layout: Layout } = STEPS[step - 1]!;
	const focus = show(step === 1 ? q.targetWord.a : q.headAr);
	const back = step > 1 ? ((step - 1) as WizardStep) : undefined;
	return (
		<StepBody>
			<QuizStepHead
				title={TITLES[step](q, locale, show)}
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
	show,
	onSubmit,
	onEdit,
}: LensProps<SarfQuestion> & { onEdit: (step: WizardStep) => void }) {
	const { locale, t } = useI18n();
	const d = session.drafts.sarf;
	const labels: Record<SarfField, string> = {
		root: t.quiz.fieldRoot,
		wazn: t.quiz.fieldWazn,
		classCode: t.quiz.fieldClass,
		structureCode: t.quiz.fieldStructure,
	};
	const word = show(q.targetWord.a);
	return (
		<>
			<QuizStepHead
				title={
					locale === "ar"
						? `راجع التحليل الصرفي لـ ﴿${word}﴾`
						: `Review your morphological profile for ${word}`
				}
				focus={word}
				backLabel={t.quiz.editButton}
				onBack={() => onEdit(4)}
			/>

			<FormulaPreview>
				<strong className="formula-target">{show(q.headAr)}:</strong>{" "}
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
				label={
					locale === "ar"
						? "تحقق واكشف التحليل الصرفي"
						: "Submit & Reveal Classical Ṣarf"
				}
				onSubmit={onSubmit}
			/>
		</>
	);
}

function SarfReveal({
	question: q,
	session,
	show,
	onNext,
	onOpenSearch,
}: LensProps<SarfQuestion> & {
	onOpenSearch?: (seed: Partial<ExampleQuery>) => void;
}) {
	const { locale } = useI18n();
	const d = session.drafts.sarf;
	const ok = (field: SarfField) => session.verdict?.fields[field] ?? false;
	const word = show(q.targetWord.a);
	return (
		<RevealCard
			correct={session.verdict?.allCorrect ?? false}
			title={
				locale === "ar"
					? `التحليل الصرفي الكامل لـ ﴿${word}﴾`
					: `Classical Ṣarf for ${word}`
			}
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
							label:
								locale === "ar"
									? `شواهد الجذر (${q.rootSpaced}) ↗`
									: `Root (${q.rootSpaced}) in Examples ↗`,
							onClick: () => onOpenSearch(q.searchSeed),
						}
					: undefined
			}
		/>
	);
}
