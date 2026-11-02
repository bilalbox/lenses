/**
 * The iʿrāb lens: name the target word's role, governor, case and sign. A
 * joined jārr-majrūr (بِالْإِيمَانِ) is named by its role and mutaʿallaq alone.
 */
import type { ReactNode } from "react";
import { stripDiacritics } from "../../lib/arabic";
import { formatWordIrabText } from "../../lib/formatIrab";
import { useI18n } from "../../lib/i18n/I18nContext";
import type { Locale } from "../../lib/i18n/types";
import type { QuizQuestion } from "../../lib/quizBank";
import {
	getCaseMeta,
	getRoleMeta,
	getSignMeta,
	isPhraseRole,
	QUIZ_CASES,
	type QuizRelation,
	ROLE_GROUPS,
	rolesFor,
	signsForCase,
} from "../../lib/quizCatalog";
import {
	type DraftField,
	type IrabDraft,
	progress,
	type QuizSessionState,
	type WizardStep,
} from "../../lib/quizSession";
import type { Word } from "../../lib/types";
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
	RevealCard,
	StepBody,
	SubmitBar,
	VerdictChip,
} from "./QuizParts";

type IrabField = DraftField<"irab">;

/** How a governor reads in the ayah; the target never governs itself. */
function governorText(
	question: QuizQuestion,
	wordNum: number,
): string | undefined {
	if (wordNum === question.targetWord.n) return undefined;
	return question.verse.w.find((w) => w.n === wordNum)?.a;
}

/** Whether a word can govern the target: any word of the ayah but the target. */
function canGovern(question: QuizQuestion, wordNum: number): boolean {
	return wordNum !== question.targetWord.n;
}

/** The step after the governor: case, or the check step once a phrase role is picked. */
function afterGovernor(draft: IrabDraft): WizardStep {
	return isPhraseRole(draft.relation) ? 5 : 3;
}

interface Heads {
	/** The picked governor as it reads, once one is picked. */
	picked?: string;
	/** The correct governor as it reads. */
	answer: string;
}

function headsOf(question: QuizQuestion, draft: IrabDraft): Heads {
	return {
		picked:
			draft.headWordNum === null
				? undefined
				: governorText(question, draft.headWordNum),
		answer: governorText(question, question.headWord.n) ?? question.headWord.a,
	};
}

function crumbsOf(
	session: QuizSessionState,
	heads: Heads,
	show: (text: string) => string,
	t: ReturnType<typeof useI18n>["t"],
): QuizCrumb[] {
	const d = session.drafts.irab;
	const { filled, total } = progress(session);
	const crumbs: QuizCrumb[] = [
		{
			stepNum: 1,
			label: d.relation ? getRoleMeta(d.relation).ar : t.quiz.stepRoleCrumb,
			isAr: Boolean(d.relation),
			filled: Boolean(d.relation),
		},
		{
			stepNum: 2,
			label: heads.picked ? show(heads.picked) : t.quiz.headBadge,
			isAr: Boolean(heads.picked),
			filled: Boolean(d.headWordNum),
		},
		{
			stepNum: 3,
			label: d.grammaticalCase
				? getCaseMeta(d.grammaticalCase).ar
				: t.quiz.stepCaseCrumb,
			isAr: Boolean(d.grammaticalCase),
			filled: Boolean(d.grammaticalCase),
		},
		{
			stepNum: 4,
			label: d.sign ? getSignMeta(d.sign).ar : t.quiz.stepSignCrumb,
			isAr: Boolean(d.sign),
			filled: Boolean(d.sign),
		},
		{
			stepNum: 5,
			label: t.quiz.stepCheckCrumb,
			filled: filled === total,
		},
	];
	// A phrase has no case or sign: its wizard is role, mutaʿallaq, check.
	return isPhraseRole(d.relation)
		? crumbs.filter((c) => c.stepNum !== 3 && c.stepNum !== 4)
		: crumbs;
}

function caseChoices(locale: Locale): Choice[] {
	return QUIZ_CASES.map((c) => ({
		code: c.code,
		ar: c.ar,
		sub: c.shortDesc[locale],
		gloss: locale !== "ar" ? (locale === "id" ? c.id : c.en) : undefined,
	}));
}

function signChoices(draft: IrabDraft, locale: Locale): Choice[] {
	const subOf = (s: { arSub: string; id: string; en: string }) =>
		locale === "ar" ? s.arSub : locale === "id" ? s.id : s.en;
	return signsForCase(draft.grammaticalCase).map((s) => ({
		code: s.code,
		ar: s.ar,
		sub: subOf(s),
	}));
}

export function IrabLens({
	extendedRoles,
	...props
}: LensProps<QuizQuestion> & { extendedRoles: boolean }) {
	const { locale, t } = useI18n();
	const { question: q, session, dispatch, show } = props;
	const draft = session.drafts.irab;
	const step = currentStep(session);
	const heads = headsOf(q, draft);
	const targetAr = show(q.targetWord.a);
	const answer = (
		field: IrabField,
		value: string | number,
		next?: WizardStep,
	) => dispatch({ type: "answer", field, value, step: next });
	const goTo = (next: WizardStep) => dispatch({ type: "goToStep", step: next });
	const complete = session.verdict !== null;

	const marks = (w: Word): TokenMarks => ({
		target: w.n === q.targetWord.n,
		head: draft.headWordNum === w.n,
		hint:
			complete && draft.headWordNum !== q.headWord.n && w.n === q.headWord.n,
		candidate: step === 2 && canGovern(q, w.n),
	});
	const onTapWord = (wordNum: number) => {
		if (canGovern(q, wordNum))
			answer(
				"headWordNum",
				wordNum,
				step === 2 ? afterGovernor(draft) : undefined,
			);
	};
	const governorLabel = getRoleMeta(draft.relation ?? q.relation).governorLabel;

	return (
		<GrammarFrame
			lens="irab"
			props={props}
			crumbs={crumbsOf(session, heads, show, t)}
			marks={marks}
			picking={step === 2}
			onTapWord={onTapWord}
		>
			{step === 1 && (
				<StepBody>
					<QuizStepHead
						title={t.quiz.step1Question(targetAr)}
						focus={targetAr}
					/>
					<RolePicker
						extended={extendedRoles}
						value={draft.relation}
						locale={locale}
						onPick={(code) => answer("relation", code, 2)}
					/>
				</StepBody>
			)}

			{step === 2 && (
				<StepBody>
					<QuizStepHead
						title={t.quiz.step2Question(governorLabel.ar, targetAr)}
						focus={targetAr}
						hint={t.quiz.pickGovernorHint}
						backLabel={t.quiz.backButton}
						onBack={() => goTo(1)}
					/>
					<GovernorPicker
						question={q}
						value={draft.headWordNum}
						format={show}
						onPick={(n) => answer("headWordNum", n, afterGovernor(draft))}
					/>
				</StepBody>
			)}

			{step === 3 && (
				<StepBody>
					<QuizStepHead
						title={t.quiz.step3Question(targetAr)}
						focus={targetAr}
						backLabel={t.quiz.backButton}
						onBack={() => goTo(2)}
					/>
					<ChoiceList
						choices={caseChoices(locale)}
						value={draft.grammaticalCase}
						onPick={(code) => answer("grammaticalCase", code, 4)}
					/>
				</StepBody>
			)}

			{step === 4 && (
				<StepBody>
					<QuizStepHead
						title={t.quiz.step4Question(targetAr)}
						focus={targetAr}
						backLabel={t.quiz.backButton}
						onBack={() => goTo(3)}
					/>
					<ChoiceGrid
						choices={signChoices(draft, locale)}
						value={draft.sign}
						onPick={(code) => answer("sign", code, 5)}
					/>
				</StepBody>
			)}

			{step === 5 && (
				<StepBody>
					{complete ? (
						<IrabReveal {...props} heads={heads} />
					) : (
						<IrabCheck {...props} heads={heads} onEdit={goTo} />
					)}
				</StepBody>
			)}
		</GrammarFrame>
	);
}

function fieldLabels(
	q: QuizQuestion,
	locale: Locale,
	t: ReturnType<typeof useI18n>["t"],
): Record<IrabField, string> {
	return {
		relation: t.quiz.stepRoleCrumb,
		headWordNum: getRoleMeta(q.relation).governorLabel[locale],
		grammaticalCase: t.quiz.stepCaseCrumb,
		sign: t.quiz.stepSignCrumb,
	};
}

function IrabCheck({
	question: q,
	session,
	show,
	onSubmit,
	heads,
	onEdit,
}: LensProps<QuizQuestion> & {
	heads: Heads;
	onEdit: (step: WizardStep) => void;
}) {
	const { locale, t } = useI18n();
	const d = session.drafts.irab;
	const labels = fieldLabels(q, locale, t);
	const targetAr = show(q.targetWord.a);
	const phrase = isPhraseRole(d.relation);
	const head = (
		<FormulaPart
			step={2}
			label={labels.headWordNum}
			value={heads.picked && show(heads.picked)}
			onEdit={onEdit}
		/>
	);
	return (
		<>
			<QuizStepHead
				title={t.quiz.step5Title(targetAr)}
				focus={targetAr}
				backLabel={t.quiz.editButton}
				onBack={() => onEdit(phrase ? 2 : 4)}
			/>

			<FormulaPreview>
				<strong className="formula-target">{show(q.targetWord.a)}:</strong>{" "}
				<FormulaPart
					step={1}
					label={labels.relation}
					value={d.relation && getRoleMeta(d.relation).ar}
					onEdit={onEdit}
				/>{" "}
				{phrase ? (
					<>
						<span>متعلقان بـ</span> {head}
					</>
				) : (
					<CaseAndSign draft={d} labels={labels} head={head} onEdit={onEdit} />
				)}
				.
			</FormulaPreview>
			<p className="quiz-wizard-subprompt">{t.quiz.formulaEditHint}</p>

			<SubmitBar
				missing={missingLabels(session, labels)}
				label={t.quiz.submitButton}
				onSubmit={onSubmit}
			/>
		</>
	);
}

/** The rest of a word's formula: لـ governor, case, and وعلامة إعرابه sign. */
function CaseAndSign({
	draft,
	labels,
	head,
	onEdit,
}: {
	draft: IrabDraft;
	labels: Record<IrabField, string>;
	head: ReactNode;
	onEdit: (step: WizardStep) => void;
}) {
	return (
		<>
			<span>لـ</span> {head}{" "}
			<FormulaPart
				step={3}
				label={labels.grammaticalCase}
				value={draft.grammaticalCase && getCaseMeta(draft.grammaticalCase).ar}
				onEdit={onEdit}
			/>{" "}
			<span>وعلامة إعرابه</span>{" "}
			<FormulaPart
				step={4}
				label={labels.sign}
				value={draft.sign && getSignMeta(draft.sign).ar}
				onEdit={onEdit}
			/>
		</>
	);
}

/** Case and sign verdicts; a phrase question asks neither, so it shows none. */
function CaseAndSignChips({
	question: q,
	draft,
	ok,
}: {
	question: QuizQuestion;
	draft: IrabDraft;
	ok: (field: IrabField) => boolean;
}) {
	if (!q.grammaticalCase || !q.sign) return null;
	return (
		<>
			<VerdictChip
				ok={ok("grammaticalCase")}
				picked={draft.grammaticalCase && getCaseMeta(draft.grammaticalCase).ar}
				answer={getCaseMeta(q.grammaticalCase).ar}
			/>
			<VerdictChip
				ok={ok("sign")}
				picked={draft.sign && getSignMeta(draft.sign).ar}
				answer={q.signDetailAr}
			/>
		</>
	);
}

/** The classical iʿrāb, with a phrase's mutaʿallaq added when the word's own iʿrāb leaves it out. */
function revealProse(q: QuizQuestion, headAnswer: string): ReactNode {
	const named = stripDiacritics(q.classicalIrab).includes("متعلق");
	if (!isPhraseRole(q.relation) || named)
		return formatWordIrabText(q.classicalIrab);
	return formatWordIrabText(
		`${q.classicalIrab} وَالْجَارُّ وَالْمَجْرُورُ مُتَعَلِّقَانِ بِـ﴿${headAnswer}﴾.`,
	);
}

function IrabReveal({
	question: q,
	session,
	show,
	onNext,
	heads,
}: LensProps<QuizQuestion> & { heads: Heads }) {
	const { t } = useI18n();
	const d = session.drafts.irab;
	const ok = (field: IrabField) => session.verdict?.fields[field] ?? false;
	const role = getRoleMeta(q.relation);
	const headAnswer = show(heads.answer);
	return (
		<RevealCard
			correct={session.verdict?.allCorrect ?? false}
			title={t.quiz.classicalHeading(show(q.targetWord.a))}
			chips={
				<>
					<VerdictChip
						ok={ok("relation")}
						picked={d.relation && getRoleMeta(d.relation).ar}
						answer={role.ar}
					/>
					<VerdictChip
						ok={ok("headWordNum")}
						picked={heads.picked && show(heads.picked)}
						answer={headAnswer}
						wrongAnswer={`${role.governorLabel.ar}: ${headAnswer}`}
					/>
					<CaseAndSignChips question={q} draft={d} ok={ok} />
				</>
			}
			prose={revealProse(q, headAnswer)}
			onNext={onNext}
		/>
	);
}

/** The roles under learner-facing headings, so the list scans in four short groups. */
function RolePicker({
	extended,
	value,
	locale,
	onPick,
}: {
	/** Offer the extended roles too. */
	extended: boolean;
	value: QuizRelation | null;
	locale: Locale;
	onPick: (code: QuizRelation) => void;
}) {
	return (
		<div className="quiz-role-groups">
			{ROLE_GROUPS.map((group) => (
				<section key={group.code} className="quiz-role-group">
					<h3 className="quiz-role-group-title">{group.label[locale]}</h3>
					<div className="quiz-wizard-grid-roles">
						{rolesFor(extended)
							.filter((r) => r.group === group.code)
							.map((r) => (
								<button
									key={r.code}
									type="button"
									aria-pressed={value === r.code}
									className={`quiz-rich-card family-${r.family}${value === r.code ? " is-selected" : ""}`}
									onClick={() => onPick(r.code)}
								>
									<div className="quiz-rich-top">
										<strong lang="ar">{r.ar}</strong>
										<span className="quiz-rich-dot" />
									</div>
									<small>
										{locale === "ar" ? r.governorLabel.ar : r[locale]}
									</small>
								</button>
							))}
					</div>
				</section>
			))}
		</div>
	);
}

/**
 * The ayah's words as answer cards for the governor step; the ayah above takes
 * taps too. The target word is offered only as its joined preposition (بِـ).
 */
function GovernorPicker({
	question,
	value,
	format,
	onPick,
}: {
	question: QuizQuestion;
	value: number | null;
	/** How the ayah renders a word (diacritics on or off). */
	format: (text: string) => string;
	onPick: (wordNum: number) => void;
}) {
	return (
		<div className="quiz-governor-grid" dir="rtl">
			{question.verse.w.map((w) => {
				const text = governorText(question, w.n);
				if (!text) return null;
				return (
					<button
						key={w.n}
						type="button"
						lang="ar"
						aria-pressed={value === w.n}
						className={`quiz-governor-card${value === w.n ? " is-selected" : ""}`}
						onClick={() => onPick(w.n)}
					>
						{format(text)}
					</button>
				);
			})}
		</div>
	);
}
