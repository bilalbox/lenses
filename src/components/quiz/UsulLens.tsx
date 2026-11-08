/**
 * The Usul al-Fiqh & Dalalat al-Alfaz lens for the quiz screen:
 * A structured 5-step Usuli reasoning wizard (Span -> Dalalah -> Qarinah -> Ruling -> Review)
 * matching the sequential progression of the grammar and morphology quizzes.
 */
import { useMemo } from "react";
import { useI18n } from "../../lib/i18n/I18nContext";
import type { UsulQuestion } from "../../lib/quizBank";
import {
	generateIdentifyDalalahDrill,
	generateKhilafDrill,
	validateSpanClick,
} from "../../lib/usulQuizEngine";
import { getTaxonomyNode } from "../../lib/usulTaxonomy";
import type { UsuliTaxonomyId } from "../../lib/usulTypes";
import type { QuizCrumb } from "../QuizChrome";
import { currentStep, type LensProps, QuizFrame } from "./QuizFrame";
import { StepBody, SubmitBar } from "./QuizParts";

interface StepOption {
	id: string | number;
	label: string;
	value: string | number;
}

function makeQarinahOptions(q: UsulQuestion): StepOption[] {
	if (q.shahid.hasQarinahSarifah) {
		return [
			{
				id: "shifted",
				label: `مصروفة عن أصلها إلى (${q.shahid.actualDalalahAr}) بقرينة صارفة`,
				value: "SHIFTED",
			},
			{
				id: "unshifted",
				label: `باقية على أصلها المفيد لـ(${q.shahid.defaultDalalahAr}) لعدم القرينة الصارفة`,
				value: "UNSHIFTED",
			},
			{
				id: "mujmal",
				label: "صيغة مجملة لا دلالة لها بذاتها وتحتاج بياناً مستقلاً",
				value: "MUJMAL",
			},
			{
				id: "mansukh",
				label: "منسوخة الحكم تلاوة وعملاً باتفاق الأصوليين",
				value: "MANSUKH",
			},
		];
	}
	return [
		{
			id: "unshifted",
			label: `عريت عن القرائن الصارفة فبقيت على أصل مقتضاها (${q.shahid.defaultDalalahAr})`,
			value: "UNSHIFTED",
		},
		{
			id: "shifted",
			label: "مصروفة عن أصلها إلى الندب أو الإباحة بقرينة سياقية",
			value: "SHIFTED",
		},
		{
			id: "takhsis",
			label: "مخصوصة بمخصص متصل أو منفصل عن عمومها",
			value: "TAKHSIS",
		},
		{
			id: "insha",
			label: "جملة خبرية أريد بها الإنشاء تأكيداً للحكم",
			value: "INSHA",
		},
	];
}

function makeRulingOptions(q: UsulQuestion, seed: string): StepOption[] {
	if (q.shahid.khilafUsuliAr) {
		const khilaf = generateKhilafDrill(q.shahid, seed);
		if (khilaf) {
			return khilaf.options.map((opt, idx) => ({
				id: idx,
				label: opt.labelAr,
				value: opt.isCorrect ? q.shahid.derivedFiqhRulingAr : `WRONG_${idx}`,
			}));
		}
	}
	return [
		{
			id: "correct",
			label: q.shahid.derivedFiqhRulingAr,
			value: q.shahid.derivedFiqhRulingAr,
		},
		{
			id: "alt1",
			label: "الإباحة والتخيير دون حرج على المكلف",
			value: "ALT_IBAHAH",
		},
		{
			id: "alt2",
			label: "الكراهة التنزيهية دون تأثيم للمخالف",
			value: "ALT_KARAHAH",
		},
		{
			id: "alt3",
			label: "التوقف لتعارض الأدلة حتى يرد البيان",
			value: "ALT_TAWAQQUF",
		},
	];
}

function UsulAyahWords({
	question: q,
	step,
	pickedWord,
	show,
	onSelectWord,
}: {
	question: UsulQuestion;
	step: number;
	pickedWord: number | null;
	show: (text: string) => string;
	onSelectWord: (wordNum: number) => void;
}) {
	const words = q.verse.w;
	if (!words || words.length === 0) {
		return (
			<p className="quiz-wizard-ayah" dir="rtl" lang="ar">
				<span className="quiz-word is-target">
					{show(q.shahid.shahidPhraseAr)}
				</span>
			</p>
		);
	}

	return (
		<p className="quiz-wizard-ayah" dir="rtl" lang="ar">
			{words.map((w) => {
				const isTarget = w.n >= q.shahid.wordStart && w.n <= q.shahid.wordEnd;
				const isPicked = pickedWord === w.n;
				let wordClass = "quiz-word";

				if (step === 1) {
					wordClass += " is-clickable-token";
					if (isPicked) {
						wordClass += isTarget ? " is-correct" : " is-incorrect";
					}
				} else if (isTarget) {
					wordClass += " is-target";
				}

				return (
					<button
						key={`${q.id}-w-${w.n}`}
						type="button"
						className={wordClass}
						onClick={() => onSelectWord(w.n)}
						aria-label={w.a}
					>
						{show(w.a)}
					</button>
				);
			})}
		</p>
	);
}

function UsulStepPrompt({
	title,
	subtitle,
	phrase,
	show,
}: {
	title: string;
	subtitle?: string;
	phrase?: string;
	show: (text: string) => string;
}) {
	return (
		<div className="usul-drill-question-box">
			<h3 className="usul-drill-prompt">{title}</h3>
			{subtitle && <p className="quiz-wizard-pick-hint">{subtitle}</p>}
			{phrase && (
				<div className="usul-drill-phrase-quote">﴿{show(phrase)}﴾</div>
			)}
		</div>
	);
}

function UsulStepOptionsList({
	options,
	selected,
	onSelect,
}: {
	options: StepOption[];
	selected: string | number | null;
	onSelect: (opt: StepOption) => void;
}) {
	return (
		<div className="usul-quiz-options">
			{options.map((opt) => (
				<button
					key={opt.id}
					type="button"
					className={`usul-quiz-option ${selected === opt.value ? "is-active" : ""}`}
					onClick={() => onSelect(opt)}
				>
					{opt.label}
				</button>
			))}
		</div>
	);
}

function UsulReviewStep({
	question: q,
	verdict,
	onEditStep,
	onNext,
	onOpenReader,
}: {
	question: UsulQuestion;
	verdict: boolean;
	onEditStep: (step: 1 | 2 | 3 | 4) => void;
	onNext: () => void;
	onOpenReader: () => void;
}) {
	const taxonomy = getTaxonomyNode(q.shahid.taxonomyId);
	return (
		<div className="usul-drill-feedback-card anim-soft-enter">
			<div
				className={`usul-feedback-status ${verdict ? "is-success" : "is-error"}`}
			>
				{verdict ? (
					<span>✓ تحرير أصولي متكامل وصحيح! أحسنت الاستنباط</span>
				) : (
					<span>راجع تفاصيل التحرير الأصولي المعتمد للموضع</span>
				)}
			</div>

			<div className="usul-badge-group" style={{ marginBottom: "1rem" }}>
				<button
					type="button"
					className="usul-tab-btn is-active"
					onClick={() => onEditStep(1)}
					title="تعديل موضع الشاهد"
				>
					١. الشاهد: ﴿{q.shahid.shahidPhraseAr}﴾ ✎
				</button>
				<button
					type="button"
					className="usul-tab-btn is-active"
					onClick={() => onEditStep(2)}
					title="تعديل نوع الدلالة"
				>
					٢. الدلالة: {taxonomy.nameAr} ✎
				</button>
				<button
					type="button"
					className="usul-tab-btn is-active"
					onClick={() => onEditStep(3)}
					title="تعديل فحص القرينة"
				>
					٣. {q.shahid.hasQarinahSarifah ? "مصروف بقرينة" : "عريت عن قرينة"} ✎
				</button>
				<button
					type="button"
					className="usul-tab-btn is-active"
					onClick={() => onEditStep(4)}
					title="تعديل الحكم المستنبط"
				>
					٤. الحكم الشرعي ✎
				</button>
			</div>

			<div className="usul-details-grid">
				<div className="usul-detail-item">
					<span className="usul-detail-label">الصيغة الموجبة:</span>
					<span className="usul-detail-value">
						{q.shahid.linguisticTriggerAr}
					</span>
				</div>
				<div className="usul-detail-item">
					<span className="usul-detail-label">وجه الدلالة:</span>
					<span className="usul-detail-value">{q.shahid.wajhAlDilalahAr}</span>
				</div>
				<div className="usul-detail-item">
					<span className="usul-detail-label">الحكم المستنبط:</span>
					<span className="usul-detail-value">
						{q.shahid.derivedFiqhRulingAr}
					</span>
				</div>
				{q.shahid.qarinahTextAr && (
					<div className="usul-detail-item">
						<span className="usul-detail-label">القرينة الصارفة:</span>
						<span className="usul-detail-value">
							﴿{q.shahid.qarinahTextAr}﴾{" "}
							{q.shahid.qarinahVerseKey ? `(${q.shahid.qarinahVerseKey})` : ""}
						</span>
					</div>
				)}
				{q.shahid.khilafUsuliAr && (
					<div className="usul-detail-item">
						<span className="usul-detail-label">محل الخلاف الأصولي:</span>
						<span className="usul-detail-value">{q.shahid.khilafUsuliAr}</span>
					</div>
				)}
				{q.shahid.classicalSources.length > 0 && (
					<div className="usul-detail-item">
						<span className="usul-detail-label">المراجع الأصولية:</span>
						<span className="usul-detail-value">
							{q.shahid.classicalSources.join(" · ")}
						</span>
					</div>
				)}
			</div>

			<div className="usul-drill-action-row">
				<button type="button" className="usul-drill-next-btn" onClick={onNext}>
					السؤال التالي ➔
				</button>
				<button
					type="button"
					className="usul-drill-reader-btn"
					onClick={onOpenReader}
				>
					فتح الآية في المصحف ↗
				</button>
			</div>
		</div>
	);
}

export function UsulLens(props: LensProps<UsulQuestion>) {
	const { question: q, session, dispatch, show } = props;
	const { t } = useI18n();
	const draft = session.drafts.usul;
	const step = currentStep(session);

	const goTo = (next: 1 | 2 | 3 | 4 | 5) =>
		dispatch({ type: "goToStep", step: next });

	// Step 2 Dalalah options
	const dalalahDrill = useMemo(
		() => generateIdentifyDalalahDrill(q.shahid, `${q.id}-step2`),
		[q.shahid, q.id],
	);
	const dalalahOptions: StepOption[] = useMemo(
		() =>
			dalalahDrill.options.map((opt) => ({
				id: opt.id,
				label: opt.labelAr,
				value: opt.id,
			})),
		[dalalahDrill],
	);

	// Step 3 Qarinah options
	const qarinahOptions = useMemo(() => makeQarinahOptions(q), [q]);

	// Step 4 Ruling options
	const rulingOptions = useMemo(
		() => makeRulingOptions(q, `${q.id}-step4`),
		[q],
	);

	const handleTokenClick = (wordNum: number) => {
		if (step !== 1) return;
		const valid = validateSpanClick(
			wordNum,
			q.shahid.wordStart,
			q.shahid.wordEnd,
		);
		dispatch({
			type: "answer",
			field: "pickedWord",
			value: valid ? q.shahid.wordStart : wordNum,
			step: 2,
		});
	};

	const handleSelectDalalah = (opt: StepOption) => {
		dispatch({
			type: "answer",
			field: "dalalah",
			value: opt.value,
			step: 3,
		});
	};

	const handleSelectQarinah = (opt: StepOption) => {
		dispatch({
			type: "answer",
			field: "qarinah",
			value: opt.value,
			step: 4,
		});
	};

	const handleSelectRuling = (opt: StepOption) => {
		dispatch({
			type: "answer",
			field: "ruling",
			value: opt.value,
			step: 5,
		});
		dispatch({ type: "submit" });
	};

	const crumbs: QuizCrumb[] = [
		{
			stepNum: 1,
			label: draft.pickedWord !== null ? "الشاهد محدد" : "١. موضع الشاهد",
			filled: draft.pickedWord !== null,
		},
		{
			stepNum: 2,
			label: draft.dalalah
				? getTaxonomyNode(draft.dalalah as UsuliTaxonomyId).nameAr
				: "٢. نوع الدلالة",
			filled: draft.dalalah !== null,
		},
		{
			stepNum: 3,
			label: draft.qarinah
				? draft.qarinah === "SHIFTED"
					? "مصروف بقرينة"
					: "عريت عن قرينة"
				: "٣. فحص القرينة",
			filled: draft.qarinah !== null,
		},
		{
			stepNum: 4,
			label: draft.ruling !== null ? "الحكم محدد" : "٤. الحكم الأصولي",
			filled: draft.ruling !== null,
		},
		{
			stepNum: 5,
			label: t.quiz.stepCheckCrumb,
			filled: session.verdict !== null,
		},
	];

	return (
		<QuizFrame
			lens="usul"
			questionKey={`${q.id}-step-${step}`}
			props={props}
			crumbs={crumbs}
			picking={step === 1}
			ayah={
				<UsulAyahWords
					question={q}
					step={step}
					pickedWord={draft.pickedWord}
					show={show}
					onSelectWord={handleTokenClick}
				/>
			}
			place={{ phonetic: q.suraPhonetic, sura: q.sura, verse: q.verse.v }}
			onOpenReader={() =>
				props.onOpenInReader(q.sura, q.verse.v, q.shahid.wordStart)
			}
		>
			<StepBody>
				{step === 1 && (
					<>
						<UsulStepPrompt
							title="الخطوة الأولى: عيّن موضع الشاهد الأصولي"
							subtitle="انقر على الكلمة في مربع الآية الكريمة بالأعلى لتحديد موضع الشاهد لقاعدة الدلالة."
							phrase={q.shahid.shahidPhraseAr}
							show={show}
						/>
						<div
							className="usul-drill-action-row"
							style={{ justifyContent: "center" }}
						>
							<button
								type="button"
								className="usul-drill-next-btn"
								onClick={() =>
									dispatch({
										type: "answer",
										field: "pickedWord",
										value: q.shahid.wordStart,
										step: 2,
									})
								}
							>
								تأكيد موضع الشاهد والانتقال للدلالة ➔
							</button>
						</div>
					</>
				)}

				{step === 2 && (
					<>
						<UsulStepPrompt
							title="الخطوة الثانية: حدّد نوع الدلالة الأصولية"
							subtitle="ما نوع الدلالة الأصولية لهذا الموضع المختار؟"
							phrase={q.shahid.shahidPhraseAr}
							show={show}
						/>
						<UsulStepOptionsList
							options={dalalahOptions}
							selected={draft.dalalah}
							onSelect={handleSelectDalalah}
						/>
					</>
				)}

				{step === 3 && (
					<>
						<UsulStepPrompt
							title="الخطوة الثالثة: فحص القرينة الصارفة ومجرى الدلالة"
							subtitle="هل عريت الصيغة عن القرائن الصارفة أم صرفت عن مقتضاها الأصلي؟"
							phrase={q.shahid.shahidPhraseAr}
							show={show}
						/>
						<UsulStepOptionsList
							options={qarinahOptions}
							selected={draft.qarinah}
							onSelect={handleSelectQarinah}
						/>
					</>
				)}

				{step === 4 && (
					<>
						<UsulStepPrompt
							title="الخطوة الرابعة: الحكم الشرعي المستنبط والتوجيه الأصولي"
							subtitle={
								q.shahid.khilafUsuliAr
									? "ما وجه الخلاف الأصولي وثمرته الفقهية في هذا الموضع؟"
									: "ما هو الحكم الفقهي المستنبط من مقتضى هذه الدلالة؟"
							}
							phrase={q.shahid.shahidPhraseAr}
							show={show}
						/>
						<UsulStepOptionsList
							options={rulingOptions}
							selected={draft.ruling}
							onSelect={handleSelectRuling}
						/>
					</>
				)}

				{step === 5 && (
					<UsulReviewStep
						question={q}
						verdict={Boolean(session.verdict?.allCorrect)}
						onEditStep={goTo}
						onNext={props.onNext}
						onOpenReader={() =>
							props.onOpenInReader(q.sura, q.verse.v, q.shahid.wordStart)
						}
					/>
				)}

				{step < 5 && (
					<SubmitBar
						missing={session.missing}
						label="تحقيق ومراجعة الاستنباط"
						onSubmit={props.onSubmit}
					/>
				)}
			</StepBody>
		</QuizFrame>
	);
}
