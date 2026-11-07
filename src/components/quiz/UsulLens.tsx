/**
 * The Usul al-Fiqh & Dalalat al-Alfaz lens for the quiz screen:
 * 4 interactive drill modes with full Quranic ayah integration and instant Usuli feedback.
 */
import { useMemo, useState } from "react";
import { useI18n } from "../../lib/i18n/I18nContext";
import type { UsulQuestion } from "../../lib/quizBank";
import {
	generateIdentifyDalalahDrill,
	generateKhilafDrill,
	generateLocateSpanDrill,
	generateSpotTheQarinahDrill,
	type IdentifyDalalahDrill,
	type LocateShahidSpanDrill,
	type SpotTheQarinahDrill,
	type UsuliKhilafDrill,
	validateSpanClick,
} from "../../lib/usulQuizEngine";
import type { QuizCrumb } from "../QuizChrome";
import { type LensProps, QuizFrame } from "./QuizFrame";
import { StepBody } from "./QuizParts";

type DrillMode =
	| "IDENTIFY_DALALAH"
	| "SPOT_THE_QARINAH"
	| "LOCATE_SHAHID_SPAN"
	| "USULI_KHILAF_DRILL";

type DrillItem =
	| IdentifyDalalahDrill
	| SpotTheQarinahDrill
	| LocateShahidSpanDrill
	| UsuliKhilafDrill;

interface OptionChoice {
	key: string | number;
	label: string;
	isCorrect: boolean;
}

function getDrillOptions(drill: DrillItem): OptionChoice[] {
	if (drill.mode === "IDENTIFY_DALALAH") {
		return drill.options.map((opt) => ({
			key: opt.id,
			label: opt.labelAr,
			isCorrect: opt.id === drill.correctTaxonomyId,
		}));
	}
	if (
		drill.mode === "SPOT_THE_QARINAH" ||
		drill.mode === "USULI_KHILAF_DRILL"
	) {
		return drill.options.map((opt, idx) => ({
			key: idx,
			label: opt.labelAr,
			isCorrect: Boolean(opt.isCorrect),
		}));
	}
	return [];
}

function getDrillPrompt(drill: DrillItem): string {
	if (drill.mode === "LOCATE_SHAHID_SPAN") {
		return drill.promptAr;
	}
	return drill.questionAr;
}

interface UsulAyahBoxProps {
	question: UsulQuestion;
	drillMode: DrillMode;
	selectedToken: number | null;
	spanResult: boolean | null;
	show: (text: string) => string;
	onTokenClick: (wordNum: number) => void;
}

function UsulAyahBox({
	question: q,
	drillMode,
	selectedToken,
	spanResult,
	show,
	onTokenClick,
}: UsulAyahBoxProps) {
	const words = q.verse.w;
	const isLocate = drillMode === "LOCATE_SHAHID_SPAN";

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
				const isPicked = selectedToken === w.n;
				let wordClass = "quiz-word";

				if (isLocate) {
					wordClass += " is-clickable-token";
					if (isPicked && spanResult !== null) {
						wordClass += spanResult ? " is-correct" : " is-incorrect";
					}
				} else if (isTarget) {
					wordClass += " is-target";
				}

				return (
					<button
						key={`${q.id}-w-${w.n}`}
						type="button"
						className={wordClass}
						onClick={() => onTokenClick(w.n)}
						aria-label={w.a}
					>
						{show(w.a)}
					</button>
				);
			})}
		</p>
	);
}

interface UsulDrillModeBarProps {
	mode: DrillMode;
	hasQarinah: boolean;
	hasKhilaf: boolean;
	onSelectMode: (mode: DrillMode) => void;
}

function UsulDrillModeBar({
	mode,
	hasQarinah,
	hasKhilaf,
	onSelectMode,
}: UsulDrillModeBarProps) {
	return (
		<div className="usul-drill-tabs" role="tablist" aria-label="أنماط التدريب">
			<button
				type="button"
				role="tab"
				aria-selected={mode === "IDENTIFY_DALALAH"}
				className={`usul-pill-btn ${mode === "IDENTIFY_DALALAH" ? "is-active" : ""}`}
				onClick={() => onSelectMode("IDENTIFY_DALALAH")}
			>
				١. تحديد الدلالة
			</button>
			<button
				type="button"
				role="tab"
				aria-selected={mode === "SPOT_THE_QARINAH"}
				className={`usul-pill-btn ${mode === "SPOT_THE_QARINAH" ? "is-active" : ""}`}
				onClick={() => onSelectMode("SPOT_THE_QARINAH")}
				title={hasQarinah ? undefined : "الآية عريت عن القرائن الصارفة"}
			>
				٢. رصد القرينة {hasQarinah ? "" : "⚪"}
			</button>
			<button
				type="button"
				role="tab"
				aria-selected={mode === "LOCATE_SHAHID_SPAN"}
				className={`usul-pill-btn ${mode === "LOCATE_SHAHID_SPAN" ? "is-active" : ""}`}
				onClick={() => onSelectMode("LOCATE_SHAHID_SPAN")}
			>
				٣. تعيين موضع الشاهد
			</button>
			<button
				type="button"
				role="tab"
				aria-selected={mode === "USULI_KHILAF_DRILL"}
				className={`usul-pill-btn ${mode === "USULI_KHILAF_DRILL" ? "is-active" : ""}`}
				onClick={() => onSelectMode("USULI_KHILAF_DRILL")}
				title={hasKhilaf ? undefined : "لا خلاف أصولي مشهور مسجل في الموضع"}
			>
				٤. تحرير الخلاف {hasKhilaf ? "" : "⚪"}
			</button>
		</div>
	);
}

interface UsulFeedbackCardProps {
	question: UsulQuestion;
	isCorrect: boolean;
	onNext: () => void;
	onOpenReader: () => void;
}

function UsulFeedbackCard({
	question: q,
	isCorrect,
	onNext,
	onOpenReader,
}: UsulFeedbackCardProps) {
	return (
		<div className="usul-drill-feedback-card anim-soft-enter">
			<div
				className={`usul-feedback-status ${isCorrect ? "is-success" : "is-error"}`}
			>
				{isCorrect ? (
					<span>✓ إجابة صحيحة ومحررة أصولياً</span>
				) : (
					<span>✗ إجابة غير دقيقة</span>
				)}
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
	const [drillMode, setDrillMode] = useState<DrillMode>("IDENTIFY_DALALAH");
	const [selectedOption, setSelectedOption] = useState<string | number | null>(
		null,
	);
	const [selectedToken, setSelectedToken] = useState<number | null>(null);
	const [spanResult, setSpanResult] = useState<boolean | null>(null);

	const drill = useMemo<DrillItem>(() => {
		const seed = `${q.id}-${drillMode}`;
		switch (drillMode) {
			case "IDENTIFY_DALALAH":
				return generateIdentifyDalalahDrill(q.shahid, seed);
			case "SPOT_THE_QARINAH":
				return generateSpotTheQarinahDrill(q.shahid, seed);
			case "LOCATE_SHAHID_SPAN":
				return generateLocateSpanDrill(q.shahid);
			case "USULI_KHILAF_DRILL":
				return (
					generateKhilafDrill(q.shahid, seed) ??
					generateIdentifyDalalahDrill(q.shahid, seed)
				);
		}
	}, [q.shahid, drillMode, q.id]);

	const options = useMemo(() => getDrillOptions(drill), [drill]);

	const handleSelectMode = (nextMode: DrillMode) => {
		setDrillMode(nextMode);
		setSelectedOption(null);
		setSelectedToken(null);
		setSpanResult(null);
	};

	const handleTokenClick = (wordNum: number) => {
		if (drillMode !== "LOCATE_SHAHID_SPAN") return;
		setSelectedToken(wordNum);
		const valid = validateSpanClick(
			wordNum,
			q.shahid.wordStart,
			q.shahid.wordEnd,
		);
		setSpanResult(valid);
		dispatch({
			type: "answer",
			field: "option",
			value: valid ? "CORRECT" : "WRONG",
		});
		dispatch({ type: "submit" });
	};

	const handleOptionSelect = (
		optionId: string | number,
		isCorrect: boolean,
	) => {
		setSelectedOption(optionId);
		dispatch({
			type: "answer",
			field: "option",
			value: isCorrect ? q.shahid.taxonomyId : "WRONG",
		});
		dispatch({ type: "submit" });
	};

	const isAnswered =
		selectedOption !== null || spanResult !== null || session.verdict !== null;
	const isCorrectAnswer =
		spanResult === true ||
		(selectedOption !== null &&
			Boolean(options.find((o) => o.key === selectedOption)?.isCorrect));

	const crumbs: QuizCrumb[] = [
		{
			stepNum: 1,
			label:
				drillMode === "IDENTIFY_DALALAH"
					? "تحديد الدلالة"
					: drillMode === "SPOT_THE_QARINAH"
						? "رصد القرينة"
						: drillMode === "LOCATE_SHAHID_SPAN"
							? "موضع الشاهد"
							: "الخلاف الأصولي",
			filled: true,
		},
		{
			stepNum: 2,
			label: t.quiz.stepCheckCrumb,
			filled: isAnswered,
		},
	];

	return (
		<QuizFrame
			lens="usul"
			questionKey={`${q.id}-${drillMode}`}
			props={props}
			crumbs={crumbs}
			picking={drillMode === "LOCATE_SHAHID_SPAN"}
			ayah={
				<UsulAyahBox
					question={q}
					drillMode={drillMode}
					selectedToken={selectedToken}
					spanResult={spanResult}
					show={show}
					onTokenClick={handleTokenClick}
				/>
			}
			place={{ phonetic: q.suraPhonetic, sura: q.sura, verse: q.verse.v }}
			onOpenReader={() =>
				props.onOpenInReader(q.sura, q.verse.v, q.shahid.wordStart)
			}
		>
			<StepBody>
				<UsulDrillModeBar
					mode={drillMode}
					hasQarinah={q.shahid.hasQarinahSarifah}
					hasKhilaf={q.shahid.khilafUsuliAr !== null}
					onSelectMode={handleSelectMode}
				/>

				<div className="usul-drill-question-box">
					<h3 className="usul-drill-prompt">{getDrillPrompt(drill)}</h3>
					<div className="usul-drill-phrase-quote">
						﴿{show(drill.shahidPhraseAr)}﴾
					</div>
				</div>

				{drill.mode === "LOCATE_SHAHID_SPAN" ? (
					<div className="usul-span-instruction">
						<p className="quiz-wizard-pick-hint">
							انقر على الكلمة في مربع الآية بالأعلى لتحديد موضع الشاهد الأصولي.
						</p>
					</div>
				) : (
					<div className="usul-quiz-options">
						{options.map((opt) => {
							const isSelected = selectedOption === opt.key;
							let btnClass = "usul-quiz-option";
							if (isAnswered) {
								if (opt.isCorrect) btnClass += " is-correct";
								else if (isSelected) btnClass += " is-incorrect";
							}

							return (
								<button
									key={opt.label}
									type="button"
									className={btnClass}
									disabled={isAnswered}
									onClick={() => handleOptionSelect(opt.key, opt.isCorrect)}
								>
									{opt.label}
								</button>
							);
						})}
					</div>
				)}

				{isAnswered && (
					<UsulFeedbackCard
						question={q}
						isCorrect={isCorrectAnswer}
						onNext={props.onNext}
						onOpenReader={() =>
							props.onOpenInReader(q.sura, q.verse.v, q.shahid.wordStart)
						}
					/>
				)}
			</StepBody>
		</QuizFrame>
	);
}
