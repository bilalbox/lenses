import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadSurah } from "../lib/api";
import { stripTashkeel } from "../lib/arabic";
import { formatIrabText, formatWordIrabText } from "../lib/formatIrab";
import { useI18n } from "../lib/i18n/I18nContext";
import {
	CURATED_SURAHS,
	EXTENDED_QUIZ_SURAHS,
	type ExampleHuntQuestion,
	extractQuizPools,
	extractQuizQuestionsFromSurah,
	getCaseMeta,
	getLensLabel,
	getRoleMeta,
	getSignMeta,
	QUIZ_CASES,
	QUIZ_ROLES,
	QUIZ_SIGNS,
	type QuizCase,
	type QuizLens,
	type QuizQuestion,
	type QuizRelation,
	type QuizSign,
	SARF_CLASSES,
	SARF_STRUCTURES,
	type SarfQuestion,
} from "../lib/quizEngine";
import type { ExampleQuery } from "../lib/search";
import type { Manifest, SurahFile } from "../lib/types";

interface IrabDraft {
	relation: QuizRelation | null;
	headWordNum: number | null;
	grammaticalCase: QuizCase | null;
	sign: QuizSign | null;
}

interface SarfDraft {
	root: string | null;
	wazn: string | null;
	classCode: string | null;
	structureCode: string | null;
}

interface ExamplesDraft {
	spottedWordNum: number | null;
}

type WizardStep = 1 | 2 | 3 | 4 | 5;

const LENS_ORDER: QuizLens[] = ["irab", "sarf", "examples"];

export function QuizScreen({
	manifest,
	onOpenInReader,
	onOpenSearch,
	hideDiacritics = false,
}: {
	manifest: Manifest;
	onOpenInReader: (sura: number, verse: number, word?: number) => void;
	onOpenSearch?: (seed: Partial<ExampleQuery>) => void;
	hideDiacritics?: boolean;
}) {
	const { locale, t, formatNumber } = useI18n();
	const quranText = (text: string) =>
		hideDiacritics ? stripTashkeel(text) : text;
	const [loadedFiles, setLoadedFiles] = useState<SurahFile[]>([]);
	const [loading, setLoading] = useState(true);

	const [lens, setLens] = useState<QuizLens>("irab");

	const [indices, setIndices] = useState<Record<QuizLens, number>>({
		irab: 0,
		sarf: 0,
		examples: 0,
	});
	const [poolsSeeded, setPoolsSeeded] = useState(false);

	const [streak, setStreak] = useState(0);
	const [score, setScore] = useState({ solved: 0, attempts: 0 });

	const [step, setStep] = useState<WizardStep>(1);
	const [animDir, setAnimDir] = useState<"forward" | "backward">("forward");

	const [irabDraft, setIrabDraft] = useState<IrabDraft>({
		relation: null,
		headWordNum: null,
		grammaticalCase: null,
		sign: null,
	});
	const [sarfDraft, setSarfDraft] = useState<SarfDraft>({
		root: null,
		wazn: null,
		classCode: null,
		structureCode: null,
	});
	const [exDraft, setExDraft] = useState<ExamplesDraft>({
		spottedWordNum: null,
	});

	const [submitted, setSubmitted] = useState(false);
	const [missingFields, setMissingFields] = useState<string[]>([]);
	const targetBtnRef = useRef<HTMLButtonElement | null>(null);
	const ayahBoxRef = useRef<HTMLDivElement | null>(null);

	// Wave 1: Load CURATED_SURAHS immediately for fast initial paint
	useEffect(() => {
		if (!manifest) return;
		let cancel = false;
		Promise.all(CURATED_SURAHS.map((n) => loadSurah(n)))
			.then((files) => {
				if (cancel) return;
				setLoadedFiles(files);
				setLoading(false);

				// Wave 2: Load EXTENDED_QUIZ_SURAHS in the background for deeper variety
				void Promise.all(
					EXTENDED_QUIZ_SURAHS.map((n) => loadSurah(n).catch(() => null)),
				).then((more) => {
					if (cancel) return;
					const validMore = more.filter((f): f is SurahFile => f !== null);
					if (validMore.length > 0) {
						setLoadedFiles((prev) => {
							const seen = new Set(prev.map((p) => p.n));
							return [...prev, ...validMore.filter((f) => !seen.has(f.n))];
						});
					}
				});
			})
			.catch(() => {
				if (!cancel) setLoading(false);
			});
		return () => {
			cancel = true;
		};
	}, [manifest]);

	const irabPool = useMemo(() => {
		const extracted: QuizQuestion[] = [];
		for (const f of loadedFiles) {
			extracted.push(...extractQuizQuestionsFromSurah(f));
		}
		return extracted;
	}, [loadedFiles]);

	const quizPools = useMemo(() => extractQuizPools(loadedFiles), [loadedFiles]);

	const sarfPool = quizPools.sarf;
	const examplesPool = quizPools.examples;

	// Always open quiz on a random verse (once curated pools are ready).
	useEffect(() => {
		if (poolsSeeded || loading) return;
		if (
			irabPool.length === 0 &&
			sarfPool.length === 0 &&
			examplesPool.length === 0
		)
			return;
		const raf = requestAnimationFrame(() => {
			setIndices({
				irab: irabPool.length ? Math.floor(Math.random() * irabPool.length) : 0,
				sarf: sarfPool.length ? Math.floor(Math.random() * sarfPool.length) : 0,
				examples: examplesPool.length
					? Math.floor(Math.random() * examplesPool.length)
					: 0,
			});
			setPoolsSeeded(true);
		});
		return () => cancelAnimationFrame(raf);
	}, [
		examplesPool.length,
		irabPool.length,
		loading,
		poolsSeeded,
		sarfPool.length,
	]);

	const irabQuestion: QuizQuestion | null =
		irabPool[indices.irab % Math.max(irabPool.length, 1)] ?? null;
	const sarfQuestion: SarfQuestion | null =
		sarfPool[indices.sarf % Math.max(sarfPool.length, 1)] ?? null;
	const exQuestion: ExampleHuntQuestion | null =
		examplesPool[indices.examples % Math.max(examplesPool.length, 1)] ?? null;

	const activeQuestion =
		lens === "irab"
			? irabQuestion
			: lens === "sarf"
				? sarfQuestion
				: exQuestion;

	const resetDrafts = useCallback(() => {
		setIrabDraft({
			relation: null,
			headWordNum: null,
			grammaticalCase: null,
			sign: null,
		});
		setSarfDraft({
			root: null,
			wazn: null,
			classCode: null,
			structureCode: null,
		});
		setExDraft({ spottedWordNum: null });
		setSubmitted(false);
		setMissingFields([]);
		setAnimDir("forward");
		setStep(1);
	}, []);

	useEffect(() => {
		if (activeQuestion?.id || lens) {
			targetBtnRef.current?.scrollIntoView({
				behavior: "smooth",
				block: "nearest",
				inline: "center",
			});
		}
	}, [activeQuestion?.id, lens]);

	const handleSelectLens = (nextLens: QuizLens) => {
		if (nextLens === lens) return;
		setLens(nextLens);
		resetDrafts();
	};

	const handleNextRandom = useCallback(() => {
		const currentPool =
			lens === "irab" ? irabPool : lens === "sarf" ? sarfPool : examplesPool;
		if (currentPool.length <= 1 || !activeQuestion) return;

		const otherAyahPool = currentPool.filter(
			(q) =>
				q.sura !== activeQuestion.sura || q.verse.v !== activeQuestion.verse.v,
		);
		const source = otherAyahPool.length > 0 ? otherAyahPool : currentPool;
		const picked = source[Math.floor(Math.random() * source.length)];
		const nextIdx = picked
			? currentPool.findIndex((q) => q.id === picked.id)
			: 0;
		setIndices((prev) => ({ ...prev, [lens]: Math.max(nextIdx, 0) }));
		resetDrafts();
	}, [activeQuestion, examplesPool, irabPool, lens, resetDrafts, sarfPool]);

	const recordOutcome = useCallback((isAllCorrect: boolean) => {
		if (isAllCorrect) {
			setStreak((s) => s + 1);
			setScore((prev) => ({
				solved: prev.solved + 1,
				attempts: prev.attempts + 1,
			}));
		} else {
			setStreak(0);
			setScore((prev) => ({ ...prev, attempts: prev.attempts + 1 }));
		}
	}, []);

	const handleSubmit = useCallback(() => {
		if (!activeQuestion) return;
		if (lens === "irab" && irabQuestion) {
			const missing: string[] = [];
			if (!irabDraft.relation) missing.push(t.quiz.stepRoleCrumb);
			if (!irabDraft.headWordNum)
				missing.push(getRoleMeta(irabQuestion.relation).governorLabel[locale]);
			if (!irabDraft.grammaticalCase) missing.push(t.quiz.stepCaseCrumb);
			if (!irabDraft.sign) missing.push(t.quiz.stepSignCrumb);
			if (missing.length > 0) {
				setSubmitted(true);
				setMissingFields(missing);
				return;
			}
			const allOk =
				irabDraft.relation === irabQuestion.relation &&
				irabDraft.headWordNum === irabQuestion.headWord.n &&
				irabDraft.grammaticalCase === irabQuestion.grammaticalCase &&
				irabDraft.sign === irabQuestion.sign;
			setSubmitted(true);
			setMissingFields([]);
			recordOutcome(allOk);
			return;
		}

		if (lens === "sarf" && sarfQuestion) {
			const missing: string[] = [];
			if (!sarfDraft.root) missing.push(locale === "ar" ? "المادة" : "Root");
			if (!sarfDraft.wazn) missing.push(locale === "ar" ? "الوزن" : "Wazn");
			if (!sarfDraft.classCode)
				missing.push(locale === "ar" ? "الباب/المشتق" : "Class");
			if (!sarfDraft.structureCode)
				missing.push(locale === "ar" ? "البنية" : "Structure");
			if (missing.length > 0) {
				setSubmitted(true);
				setMissingFields(missing);
				return;
			}
			const allOk =
				sarfDraft.root === sarfQuestion.rootRaw &&
				sarfDraft.wazn === sarfQuestion.wazn &&
				sarfDraft.classCode === sarfQuestion.classCode &&
				sarfDraft.structureCode === sarfQuestion.structureCode;
			setSubmitted(true);
			setMissingFields([]);
			recordOutcome(allOk);
			return;
		}

		if (lens === "examples" && exQuestion) {
			const missing: string[] = [];
			if (!exDraft.spottedWordNum)
				missing.push(locale === "ar" ? "الشاهد في الآية" : "Word in Ayah");
			if (missing.length > 0) {
				setSubmitted(true);
				setMissingFields(missing);
				return;
			}
			const allOk = exDraft.spottedWordNum === exQuestion.targetWord.n;
			setSubmitted(true);
			setMissingFields([]);
			recordOutcome(allOk);
		}
	}, [
		activeQuestion,
		exDraft,
		exQuestion,
		irabDraft,
		irabQuestion,
		lens,
		locale,
		recordOutcome,
		sarfDraft,
		sarfQuestion,
		t.quiz,
	]);

	const handleRevealAnswer = useCallback(() => {
		if (!activeQuestion) return;
		if (lens === "irab" && irabQuestion) {
			setIrabDraft({
				relation: irabQuestion.relation,
				headWordNum: irabQuestion.headWord.n,
				grammaticalCase: irabQuestion.grammaticalCase,
				sign: irabQuestion.sign,
			});
		} else if (lens === "sarf" && sarfQuestion) {
			setSarfDraft({
				root: sarfQuestion.rootRaw,
				wazn: sarfQuestion.wazn,
				classCode: sarfQuestion.classCode,
				structureCode: sarfQuestion.structureCode,
			});
		} else if (lens === "examples" && exQuestion) {
			setExDraft({
				spottedWordNum: exQuestion.targetWord.n,
			});
		}
		setSubmitted(true);
		setMissingFields([]);
		setAnimDir("forward");
		setStep(lens === "examples" ? 2 : 5);
	}, [activeQuestion, exQuestion, irabQuestion, lens, sarfQuestion]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
				e.preventDefault();
				handleSubmit();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [handleSubmit]);

	useEffect(() => {
		if (lens || activeQuestion?.id) {
			ayahBoxRef.current?.scrollTo({ top: 0 });
		}
	}, [lens, activeQuestion?.id]);

	if (loading || !poolsSeeded || !activeQuestion) {
		return (
			<div className="skeleton page-skeleton" aria-hidden="true">
				<span />
				<span />
				<span />
			</div>
		);
	}

	const maxStep: WizardStep = lens === "examples" ? 2 : 5;
	const isComplete = submitted && missingFields.length === 0;
	const effectiveStep: WizardStep = isComplete ? maxStep : step;

	const goToStep = (next: WizardStep) => {
		setAnimDir(next >= effectiveStep ? "forward" : "backward");
		if (isComplete && next < maxStep) {
			setSubmitted(false);
		}
		setStep(next);
	};

	// Compute progress percentage across the active mode's steps
	let filledSteps = 1;
	let totalSteps = 5;
	if (lens === "irab") {
		filledSteps =
			1 +
			(irabDraft.relation ? 1 : 0) +
			(irabDraft.headWordNum ? 1 : 0) +
			(irabDraft.grammaticalCase ? 1 : 0) +
			(irabDraft.sign ? 1 : 0);
	} else if (lens === "sarf") {
		filledSteps =
			1 +
			(sarfDraft.root ? 1 : 0) +
			(sarfDraft.wazn ? 1 : 0) +
			(sarfDraft.classCode ? 1 : 0) +
			(sarfDraft.structureCode ? 1 : 0);
	} else {
		totalSteps = 2;
		filledSteps = 1 + (exDraft.spottedWordNum ? 1 : 0);
	}
	const progressPct = Math.round((filledSteps / totalSteps) * 100);

	const activeRoleMeta =
		(lens === "irab" && irabQuestion
			? irabDraft.relation
				? getRoleMeta(irabDraft.relation)
				: getRoleMeta(irabQuestion.relation)
			: QUIZ_ROLES[0]) ?? QUIZ_ROLES[0]!;
	const selectedHeadWord =
		lens === "irab" && irabQuestion
			? (irabQuestion.verse.w.find((w) => w.n === irabDraft.headWordNum) ??
				null)
			: null;
	const spottedWord =
		lens === "examples" && exQuestion
			? (exQuestion.verse.w.find((w) => w.n === exDraft.spottedWordNum) ?? null)
			: null;

	// Breadcrumb definitions per lens
	const breadcrumbs: {
		stepNum: WizardStep;
		label: string;
		isAr?: boolean;
		filled: boolean;
	}[] =
		lens === "irab"
			? [
					{
						stepNum: 1,
						label: irabDraft.relation
							? getRoleMeta(irabDraft.relation).ar
							: t.quiz.stepRoleCrumb,
						isAr: Boolean(irabDraft.relation),
						filled: Boolean(irabDraft.relation),
					},
					{
						stepNum: 2,
						label: selectedHeadWord
							? quranText(selectedHeadWord.a)
							: t.quiz.headBadge,
						isAr: Boolean(selectedHeadWord),
						filled: Boolean(irabDraft.headWordNum),
					},
					{
						stepNum: 3,
						label: irabDraft.grammaticalCase
							? getCaseMeta(irabDraft.grammaticalCase).ar
							: t.quiz.stepCaseCrumb,
						isAr: Boolean(irabDraft.grammaticalCase),
						filled: Boolean(irabDraft.grammaticalCase),
					},
					{
						stepNum: 4,
						label: irabDraft.sign
							? getSignMeta(irabDraft.sign).ar
							: t.quiz.stepSignCrumb,
						isAr: Boolean(irabDraft.sign),
						filled: Boolean(irabDraft.sign),
					},
					{
						stepNum: 5,
						label: t.quiz.stepCheckCrumb,
						filled: filledSteps === 5,
					},
				]
			: lens === "sarf"
				? [
						{
							stepNum: 1,
							label: sarfDraft.root
								? sarfDraft.root.split("").join(" ")
								: locale === "ar"
									? "المادة"
									: "Root",
							isAr: Boolean(sarfDraft.root || locale === "ar"),
							filled: Boolean(sarfDraft.root),
						},
						{
							stepNum: 2,
							label: sarfDraft.wazn || (locale === "ar" ? "الوزن" : "Wazn"),
							isAr: Boolean(sarfDraft.wazn || locale === "ar"),
							filled: Boolean(sarfDraft.wazn),
						},
						{
							stepNum: 3,
							label:
								(sarfDraft.classCode &&
									SARF_CLASSES[sarfDraft.classCode]?.ar) ||
								sarfDraft.classCode ||
								(locale === "ar" ? "الباب/المشتق" : "Class"),
							isAr: Boolean(sarfDraft.classCode || locale === "ar"),
							filled: Boolean(sarfDraft.classCode),
						},
						{
							stepNum: 4,
							label:
								(sarfDraft.structureCode &&
									SARF_STRUCTURES[sarfDraft.structureCode]?.ar) ||
								sarfDraft.structureCode ||
								(locale === "ar" ? "البنية" : "Structure"),
							isAr: Boolean(sarfDraft.structureCode || locale === "ar"),
							filled: Boolean(sarfDraft.structureCode),
						},
						{
							stepNum: 5,
							label: t.quiz.stepCheckCrumb,
							filled: filledSteps === 5,
						},
					]
				: [
						{
							stepNum: 1,
							label: spottedWord
								? quranText(spottedWord.a)
								: locale === "ar"
									? "الشاهد"
									: "Spot Word",
							isAr: Boolean(spottedWord || locale === "ar"),
							filled: Boolean(exDraft.spottedWordNum),
						},
						{
							stepNum: 2,
							label: t.quiz.stepCheckCrumb,
							filled: filledSteps === 2,
						},
					];

	const isPickingWordInAyah =
		(lens === "irab" && effectiveStep === 2) ||
		(lens === "examples" && effectiveStep === 1);

	return (
		<div className="quiz-wizard-viewport anim-soft-enter">
			{/* ====================================================================
			 * TOP PANE: Lens Switcher + Pinned Mushaf Ayah
			 * ==================================================================== */}
			<section className="quiz-wizard-top" aria-label={t.common.verse}>
				{/* 3-Lens Switcher */}
				<div
					className="quiz-lens-switcher"
					role="tablist"
					aria-label="Quiz Lenses"
				>
					{LENS_ORDER.map((l) => {
						const info = getLensLabel(l, locale);
						const active = lens === l;
						return (
							<button
								key={l}
								type="button"
								role="tab"
								aria-selected={active}
								className={`quiz-lens-tab${active ? " is-active" : ""}`}
								onClick={() => handleSelectLens(l)}
							>
								<span className="quiz-lens-badge" lang="ar">
									{info.badge}
								</span>
								<span className="quiz-lens-title">{info.title}</span>
							</button>
						);
					})}
				</div>

				{/* Pinned Mushaf Ayah Box */}
				<div
					key={`${lens}:${activeQuestion.id}`}
					ref={ayahBoxRef}
					className={`quiz-wizard-ayah-box anim-soft-enter ${isPickingWordInAyah ? "is-picking-governor" : ""}`}
				>
					{lens === "irab" && effectiveStep === 2 ? (
						<p className="quiz-wizard-pick-hint" role="status">
							{t.quiz.pickGovernorHint}
						</p>
					) : null}

					{lens === "examples" && effectiveStep === 1 && exQuestion ? (
						<p className="quiz-wizard-pick-hint" role="status">
							{locale === "ar"
								? `انقر على الكلمة التي تمثل: ${exQuestion.facetTitle.ar}`
								: locale === "id"
									? `Ketuk kata pada ayat yang merupakan: ${exQuestion.facetTitle.id}`
									: `Tap the word in the ayah that matches: ${exQuestion.facetTitle.en}`}
						</p>
					) : null}

					<p className="verse-line quiz-wizard-verse-line" dir="rtl" lang="ar">
						{activeQuestion.verse.w.map((w) => {
							const isTarget =
								lens === "examples"
									? isComplete && w.n === activeQuestion.targetWord.n
									: w.n === activeQuestion.targetWord.n;
							const isHead =
								lens === "irab"
									? irabDraft.headWordNum === w.n
									: lens === "examples"
										? exDraft.spottedWordNum === w.n
										: false;
							const isCorrectHint =
								(lens === "irab" &&
									isComplete &&
									irabQuestion &&
									irabDraft.headWordNum !== irabQuestion.headWord.n &&
									w.n === irabQuestion.headWord.n) ||
								(lens === "examples" &&
									isComplete &&
									exQuestion &&
									exDraft.spottedWordNum !== exQuestion.targetWord.n &&
									w.n === exQuestion.targetWord.n);

							return (
								<button
									key={w.n}
									ref={
										w.n === activeQuestion.targetWord.n
											? targetBtnRef
											: undefined
									}
									type="button"
									className={[
										"quiz-word-token",
										isTarget ? "is-target" : "",
										isHead ? "is-head" : "",
										isCorrectHint ? "is-correct-head-hint" : "",
										isPickingWordInAyah && !isTarget
											? "is-governor-candidate"
											: "",
									]
										.filter(Boolean)
										.join(" ")}
									onClick={() => {
										if (isComplete) return;
										if (lens === "irab") {
											if (w.n === activeQuestion.targetWord.n) return;
											setIrabDraft((prev) => ({ ...prev, headWordNum: w.n }));
											setSubmitted(false);
											if (effectiveStep === 2) {
												setAnimDir("forward");
												setStep(3);
											}
										} else if (lens === "examples") {
											setExDraft({ spottedWordNum: w.n });
											setSubmitted(false);
											if (effectiveStep === 1) {
												setAnimDir("forward");
												setStep(2);
											}
										}
									}}
								>
									<span className="quiz-word-arabic">{quranText(w.a)}</span>
									{(isTarget || isHead) && (
										<span
											className={`quiz-token-mark ${isTarget ? "mark-target" : ""} ${isHead ? "mark-head" : ""}`}
											aria-hidden="true"
										/>
									)}
								</button>
							);
						})}
						<span className="ayah-mark">
							{formatNumber(activeQuestion.verse.v)}
						</span>
					</p>
				</div>
			</section>

			{/* ====================================================================
			 * BOTTOM PANE: Single-Step Animated Wizard Deck per Lens
			 * ==================================================================== */}
			<section className="quiz-wizard-bottom" aria-live="polite">
				<div className="quiz-wizard-meta-bar">
					<div className="quiz-wizard-surah-tag">
						<span className="quiz-wizard-ref">
							{activeQuestion.suraPhonetic} {formatNumber(activeQuestion.sura)}:
							{formatNumber(activeQuestion.verse.v)}
						</span>
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
						<button
							type="button"
							className="quiz-wizard-skip quiz-wizard-reader"
							onClick={() =>
								onOpenInReader(
									activeQuestion.sura,
									activeQuestion.verse.v,
									activeQuestion.targetWord.n,
								)
							}
						>
							{t.quiz.openReader(activeQuestion.sura, activeQuestion.verse.v)}
						</button>
						<button
							type="button"
							className="quiz-wizard-skip"
							onClick={handleNextRandom}
						>
							{t.quiz.skipButton}
						</button>
					</div>
				</div>

				{/* Endowed Progress Bar + Step Breadcrumb Pills */}
				<div className="quiz-wizard-progress-strip">
					<div className="quiz-progress-track" aria-hidden="true">
						<div
							className="quiz-progress-fill"
							style={{ width: `${progressPct}%` }}
						/>
					</div>
					<div
						className={`quiz-wizard-breadcrumbs${lens === "examples" ? " is-two-steps" : ""}`}
						role="tablist"
						aria-label="Quiz steps"
					>
						{breadcrumbs.map((b, idx) => {
							const isLast = idx === breadcrumbs.length - 1;
							return (
								<button
									key={b.stepNum}
									type="button"
									role="tab"
									aria-selected={effectiveStep === b.stepNum}
									title={b.label}
									className={`quiz-crumb ${effectiveStep === b.stepNum ? "is-active" : ""} ${b.filled ? "is-filled" : ""}`}
									onClick={() => goToStep(b.stepNum)}
								>
									<span className="quiz-crumb-num">
										{isLast ? "✓" : formatNumber(idx + 1)}
									</span>
									<span
										className="quiz-crumb-text"
										lang={b.isAr ? "ar" : undefined}
									>
										{b.label}
									</span>
								</button>
							);
						})}
					</div>
				</div>

				<div
					key={`${lens}:${activeQuestion.id}-step-${effectiveStep}`}
					className={`quiz-wizard-pane anim-${animDir}`}
				>
					{/* ================================================================
					 * LENS 1: IʿRĀB SYNTAX WIZARD
					 * ================================================================ */}
					{lens === "irab" && irabQuestion && (
						<>
							{effectiveStep === 1 && (
								<div className="quiz-wizard-step-body">
									<header className="quiz-wizard-step-head">
										<div>
											<h2>
												{t.quiz.step1Question(
													quranText(irabQuestion.targetWord.a),
												)}
											</h2>
										</div>
										<button
											type="button"
											className="quiz-text-reveal"
											onClick={handleRevealAnswer}
										>
											{t.quiz.revealButton}
										</button>
									</header>

									<div className="quiz-wizard-grid-roles">
										{QUIZ_ROLES.map((r) => {
											const active = irabDraft.relation === r.code;
											return (
												<button
													key={r.code}
													type="button"
													className={`quiz-rich-card family-${r.family}${active ? " is-selected" : ""}`}
													onClick={() => {
														setIrabDraft((prev) => ({
															...prev,
															relation: r.code,
														}));
														setSubmitted(false);
														setAnimDir("forward");
														setStep(2);
													}}
												>
													<div className="quiz-rich-top">
														<strong lang="ar">{r.ar}</strong>
														<span className="quiz-rich-dot" />
													</div>
													<small>
														{locale === "id"
															? r.id
															: locale === "ar"
																? r.governorLabel.ar
																: r.en}
													</small>
												</button>
											);
										})}
									</div>
								</div>
							)}

							{effectiveStep === 2 && (
								<div className="quiz-wizard-step-body">
									<header className="quiz-wizard-step-head">
										<div>
											<h2>
												{t.quiz.step2Question(
													activeRoleMeta.governorLabel.ar,
													quranText(irabQuestion.targetWord.a),
												)}
											</h2>
											<p className="quiz-wizard-subprompt">
												{t.quiz.step2Hint}
											</p>
										</div>
										<button
											type="button"
											className="quiz-back-link"
											onClick={() => goToStep(1)}
										>
											{t.quiz.backButton}
										</button>
									</header>

									<div className="quiz-wizard-gov-grid" dir="rtl">
										{irabQuestion.verse.w
											.filter((w) => w.n !== irabQuestion.targetWord.n)
											.map((w) => {
												const active = irabDraft.headWordNum === w.n;
												return (
													<button
														key={w.n}
														type="button"
														className={`quiz-gov-chip quiz-wizard-gov-chip${active ? " is-selected" : ""}`}
														onClick={() => {
															setIrabDraft((prev) => ({
																...prev,
																headWordNum: w.n,
															}));
															setSubmitted(false);
															setAnimDir("forward");
															setStep(3);
														}}
													>
														<b lang="ar">{quranText(w.a)}</b>
														<small>#{formatNumber(w.n)}</small>
													</button>
												);
											})}
									</div>
								</div>
							)}

							{effectiveStep === 3 && (
								<div className="quiz-wizard-step-body">
									<header className="quiz-wizard-step-head">
										<div>
											<h2>
												{t.quiz.step3Question(
													quranText(irabQuestion.targetWord.a),
												)}
											</h2>
										</div>
										<button
											type="button"
											className="quiz-back-link"
											onClick={() => goToStep(2)}
										>
											{t.quiz.backButton}
										</button>
									</header>

									<div className="quiz-wizard-case-list">
										{QUIZ_CASES.map((c) => {
											const active = irabDraft.grammaticalCase === c.code;
											return (
												<button
													key={c.code}
													type="button"
													className={`quiz-case-card quiz-wizard-case-card${active ? " is-selected" : ""}`}
													onClick={() => {
														setIrabDraft((prev) => ({
															...prev,
															grammaticalCase: c.code,
														}));
														setSubmitted(false);
														setAnimDir("forward");
														setStep(4);
													}}
												>
													<div className="quiz-case-row">
														<strong lang="ar">{c.ar}</strong>
														{locale !== "ar" ? (
															<span>{locale === "id" ? c.id : c.en}</span>
														) : null}
													</div>
													<small>{c.shortDesc[locale]}</small>
												</button>
											);
										})}
									</div>
								</div>
							)}

							{effectiveStep === 4 && (
								<div className="quiz-wizard-step-body">
									<header className="quiz-wizard-step-head">
										<div>
											<h2>
												{t.quiz.step4Question(
													quranText(irabQuestion.targetWord.a),
												)}
											</h2>
										</div>
										<button
											type="button"
											className="quiz-back-link"
											onClick={() => goToStep(3)}
										>
											{t.quiz.backButton}
										</button>
									</header>

									<div className="quiz-wizard-sign-grid">
										{QUIZ_SIGNS.map((s) => {
											const active = irabDraft.sign === s.code;
											return (
												<button
													key={s.code}
													type="button"
													className={`quiz-sign-card quiz-wizard-sign-card${active ? " is-selected" : ""}`}
													onClick={() => {
														setIrabDraft((prev) => ({ ...prev, sign: s.code }));
														setSubmitted(false);
														setAnimDir("forward");
														setStep(5);
													}}
												>
													<div>
														<strong lang="ar">{s.ar}</strong>
														<small>
															{locale === "ar"
																? s.arSub
																: locale === "id"
																	? s.id
																	: s.en}
														</small>
													</div>
												</button>
											);
										})}
									</div>
								</div>
							)}

							{effectiveStep === 5 && (
								<div className="quiz-wizard-step-body">
									{!isComplete ? (
										<>
											<header className="quiz-wizard-step-head">
												<div>
													<h2>
														{t.quiz.step5Title(
															quranText(irabQuestion.targetWord.a),
														)}
													</h2>
												</div>
												<button
													type="button"
													className="quiz-back-link"
													onClick={() => goToStep(4)}
												>
													{t.quiz.editButton}
												</button>
											</header>

											<div
												className="quiz-wizard-formula-preview"
												dir="rtl"
												lang="ar"
											>
												<strong className="formula-target">
													{quranText(irabQuestion.targetWord.a)}:
												</strong>{" "}
												<span>
													{irabDraft.relation
														? getRoleMeta(irabDraft.relation).ar
														: "—"}
												</span>{" "}
												<span>
													{selectedHeadWord
														? `لـ ${quranText(selectedHeadWord.a)}`
														: "—"}
												</span>{" "}
												<span>
													{irabDraft.grammaticalCase
														? getCaseMeta(irabDraft.grammaticalCase).ar
														: "—"}
												</span>{" "}
												<span>وعلامة إعرابه</span>{" "}
												<span>
													{irabDraft.sign
														? getSignMeta(irabDraft.sign).ar
														: "—"}
												</span>
												.
											</div>

											<div className="quiz-wizard-summary-grid">
												<button
													type="button"
													className="quiz-summary-tile"
													onClick={() => goToStep(1)}
												>
													<small>
														{formatNumber(1)} · {t.quiz.stepRoleCrumb}
													</small>
													<strong lang="ar">
														{irabDraft.relation
															? getRoleMeta(irabDraft.relation).ar
															: t.quiz.notSet}
													</strong>
												</button>
												<button
													type="button"
													className="quiz-summary-tile"
													onClick={() => goToStep(2)}
												>
													<small>
														{formatNumber(2)} ·{" "}
														{activeRoleMeta.governorLabel[locale]}
													</small>
													<strong lang="ar">
														{selectedHeadWord
															? quranText(selectedHeadWord.a)
															: t.quiz.notSet}
													</strong>
												</button>
												<button
													type="button"
													className="quiz-summary-tile"
													onClick={() => goToStep(3)}
												>
													<small>
														{formatNumber(3)} · {t.quiz.stepCaseCrumb}
													</small>
													<strong lang="ar">
														{irabDraft.grammaticalCase
															? getCaseMeta(irabDraft.grammaticalCase).ar
															: t.quiz.notSet}
													</strong>
												</button>
												<button
													type="button"
													className="quiz-summary-tile"
													onClick={() => goToStep(4)}
												>
													<small>
														{formatNumber(4)} · {t.quiz.stepSignCrumb}
													</small>
													<strong lang="ar">
														{irabDraft.sign
															? getSignMeta(irabDraft.sign).ar
															: t.quiz.notSet}
													</strong>
												</button>
											</div>

											{submitted && missingFields.length > 0 && (
												<div className="quiz-inline-error" role="alert">
													<strong>{t.quiz.incompleteAlert}</strong>{" "}
													{missingFields.join(" · ")}
												</div>
											)}

											<div className="quiz-wizard-actions sticky-actions">
												<button
													type="button"
													className="quiz-submit-btn"
													onClick={handleSubmit}
												>
													<span>{t.quiz.submitButton}</span>
												</button>
												<button
													type="button"
													className="quiz-secondary-btn"
													onClick={handleRevealAnswer}
												>
													{t.quiz.revealButton}
												</button>
											</div>
										</>
									) : (
										(() => {
											const relOk =
												irabDraft.relation === irabQuestion.relation;
											const headOk =
												irabDraft.headWordNum === irabQuestion.headWord.n;
											const caseOk =
												irabDraft.grammaticalCase ===
												irabQuestion.grammaticalCase;
											const signOk = irabDraft.sign === irabQuestion.sign;
											const allOk = relOk && headOk && caseOk && signOk;
											return (
												<div
													className={`quiz-wizard-reveal-card ${allOk ? "is-correct" : "is-review"}`}
												>
													<header className="quiz-solution-head">
														<div className="quiz-solution-copy">
															<h3>
																{t.quiz.classicalHeading(
																	quranText(irabQuestion.targetWord.a),
																)}
															</h3>
														</div>
														<span
															className={`quiz-verdict-status-pill ${allOk ? "is-correct" : "is-review"}`}
														>
															{allOk
																? t.quiz.exactMatchEyebrow
																: t.quiz.reviewEyebrow}
														</span>
													</header>

													<div className="quiz-wizard-verdict-strip">
														<span
															className={`quiz-verdict-chip ${relOk ? "ok" : "err"}`}
															lang="ar"
														>
															{relOk
																? `✓ ${getRoleMeta(irabQuestion.relation).ar}`
																: `✗ ${irabDraft.relation ? getRoleMeta(irabDraft.relation).ar : "—"} ← ✓ ${getRoleMeta(irabQuestion.relation).ar}`}
														</span>
														<span
															className={`quiz-verdict-chip ${headOk ? "ok" : "err"}`}
															lang="ar"
														>
															{headOk
																? `✓ ${quranText(irabQuestion.headWord.a)}`
																: `✗ ${selectedHeadWord ? quranText(selectedHeadWord.a) : "—"} ← ✓ ${getRoleMeta(irabQuestion.relation).governorLabel.ar}: ${quranText(irabQuestion.headWord.a)}`}
														</span>
														<span
															className={`quiz-verdict-chip ${caseOk ? "ok" : "err"}`}
															lang="ar"
														>
															{caseOk
																? `✓ ${getCaseMeta(irabQuestion.grammaticalCase).ar}`
																: `✗ ${irabDraft.grammaticalCase ? getCaseMeta(irabDraft.grammaticalCase).ar : "—"} ← ✓ ${getCaseMeta(irabQuestion.grammaticalCase).ar}`}
														</span>
														<span
															className={`quiz-verdict-chip ${signOk ? "ok" : "err"}`}
															lang="ar"
														>
															{signOk
																? `✓ ${irabQuestion.signDetailAr}`
																: `✗ ${irabDraft.sign ? getSignMeta(irabDraft.sign).ar : "—"} ← ✓ ${irabQuestion.signDetailAr}`}
														</span>
													</div>

													<p
														className="prose irab-prose quiz-wizard-irab-prose"
														dir="rtl"
														lang="ar"
													>
														{formatWordIrabText(irabQuestion.classicalIrab)}
													</p>

													<div className="quiz-wizard-actions sticky-actions">
														<button
															type="button"
															className="quiz-next-cta"
															onClick={handleNextRandom}
														>
															{t.quiz.nextButton}
														</button>
													</div>
												</div>
											);
										})()
									)}
								</div>
							)}
						</>
					)}

					{/* ================================================================
					 * LENS 2: ṢARF & MĪZĀN WIZARD
					 * ================================================================ */}
					{lens === "sarf" && sarfQuestion && (
						<>
							{effectiveStep === 1 && (
								<div className="quiz-wizard-step-body">
									<header className="quiz-wizard-step-head">
										<div>
											<h2>
												{locale === "ar"
													? `ما المادة المعجمية (الجذر) لكلمة ﴿${quranText(sarfQuestion.targetWord.a)}﴾؟`
													: locale === "id"
														? `Apa akar kata (maddah) dari ${quranText(sarfQuestion.targetWord.a)}?`
														: `What is the lexical root (māddah) of ${quranText(sarfQuestion.targetWord.a)}?`}
											</h2>
										</div>
										<button
											type="button"
											className="quiz-text-reveal"
											onClick={handleRevealAnswer}
										>
											{t.quiz.revealButton}
										</button>
									</header>

									<div className="quiz-wizard-sign-grid">
										{sarfQuestion.rootOptions.map((opt) => {
											const active = sarfDraft.root === opt.code;
											return (
												<button
													key={opt.code}
													type="button"
													className={`quiz-sign-card quiz-wizard-sign-card${active ? " is-selected" : ""}`}
													onClick={() => {
														setSarfDraft((prev) => ({
															...prev,
															root: opt.code,
														}));
														setSubmitted(false);
														setAnimDir("forward");
														setStep(2);
													}}
												>
													<div>
														<strong lang="ar">{opt.ar}</strong>
														<small>{opt.sub[locale]}</small>
													</div>
												</button>
											);
										})}
									</div>
								</div>
							)}

							{effectiveStep === 2 && (
								<div className="quiz-wizard-step-body">
									<header className="quiz-wizard-step-head">
										<div>
											<h2>
												{locale === "ar"
													? `ما الوزن الصرفي لـ ﴿${quranText(sarfQuestion.headAr)}﴾؟`
													: locale === "id"
														? `Apa wazan sharaf dari ${quranText(sarfQuestion.headAr)}?`
														: `What is the morphological pattern (wazn) of ${quranText(sarfQuestion.headAr)}?`}
											</h2>
										</div>
										<button
											type="button"
											className="quiz-back-link"
											onClick={() => goToStep(1)}
										>
											{t.quiz.backButton}
										</button>
									</header>

									<div className="quiz-wizard-sign-grid">
										{sarfQuestion.waznOptions.map((opt) => {
											const active = sarfDraft.wazn === opt.code;
											return (
												<button
													key={opt.code}
													type="button"
													className={`quiz-sign-card quiz-wizard-sign-card${active ? " is-selected" : ""}`}
													onClick={() => {
														setSarfDraft((prev) => ({
															...prev,
															wazn: opt.code,
														}));
														setSubmitted(false);
														setAnimDir("forward");
														setStep(3);
													}}
												>
													<div>
														<strong lang="ar">{opt.ar}</strong>
														<small>{opt.sub[locale]}</small>
													</div>
												</button>
											);
										})}
									</div>
								</div>
							)}

							{effectiveStep === 3 && (
								<div className="quiz-wizard-step-body">
									<header className="quiz-wizard-step-head">
										<div>
											<h2>
												{sarfQuestion.kind === "verb"
													? locale === "ar"
														? `من أي باب صرفي جاء الفعل ﴿${quranText(sarfQuestion.headAr)}﴾؟`
														: `Which verbal bāb / form does ${quranText(sarfQuestion.headAr)} belong to?`
													: locale === "ar"
														? `ما نوع الاسم ﴿${quranText(sarfQuestion.headAr)}﴾ من حيث الاشتقاق؟`
														: `What derivational class is the noun ${quranText(sarfQuestion.headAr)}?`}
											</h2>
										</div>
										<button
											type="button"
											className="quiz-back-link"
											onClick={() => goToStep(2)}
										>
											{t.quiz.backButton}
										</button>
									</header>

									<div className="quiz-wizard-case-list">
										{sarfQuestion.classOptions.map((opt) => {
											const active = sarfDraft.classCode === opt.code;
											return (
												<button
													key={opt.code}
													type="button"
													className={`quiz-case-card quiz-wizard-case-card${active ? " is-selected" : ""}`}
													onClick={() => {
														setSarfDraft((prev) => ({
															...prev,
															classCode: opt.code,
														}));
														setSubmitted(false);
														setAnimDir("forward");
														setStep(4);
													}}
												>
													<div className="quiz-case-row">
														<strong lang="ar">{opt.ar}</strong>
													</div>
													<small>{opt.sub[locale]}</small>
												</button>
											);
										})}
									</div>
								</div>
							)}

							{effectiveStep === 4 && (
								<div className="quiz-wizard-step-body">
									<header className="quiz-wizard-step-head">
										<div>
											<h2>
												{sarfQuestion.kind === "verb"
													? locale === "ar"
														? `ما نوع الفعل ﴿${quranText(sarfQuestion.headAr)}﴾ من حيث الصحة والاعتلال؟`
														: `How is ${quranText(sarfQuestion.headAr)} classified by root soundness?`
													: locale === "ar"
														? `ما بنية الاسم ﴿${quranText(sarfQuestion.headAr)}﴾ من حيث الإفراد والجمع؟`
														: `What is the number / plural structure of ${quranText(sarfQuestion.headAr)}?`}
											</h2>
										</div>
										<button
											type="button"
											className="quiz-back-link"
											onClick={() => goToStep(3)}
										>
											{t.quiz.backButton}
										</button>
									</header>

									<div className="quiz-wizard-case-list">
										{sarfQuestion.structureOptions.map((opt) => {
											const active = sarfDraft.structureCode === opt.code;
											return (
												<button
													key={opt.code}
													type="button"
													className={`quiz-case-card quiz-wizard-case-card${active ? " is-selected" : ""}`}
													onClick={() => {
														setSarfDraft((prev) => ({
															...prev,
															structureCode: opt.code,
														}));
														setSubmitted(false);
														setAnimDir("forward");
														setStep(5);
													}}
												>
													<div className="quiz-case-row">
														<strong lang="ar">{opt.ar}</strong>
													</div>
													<small>{opt.sub[locale]}</small>
												</button>
											);
										})}
									</div>
								</div>
							)}

							{effectiveStep === 5 && (
								<div className="quiz-wizard-step-body">
									{!isComplete ? (
										<>
											<header className="quiz-wizard-step-head">
												<div>
													<h2>
														{locale === "ar"
															? `راجع التحليل الصرفي لـ ﴿${quranText(sarfQuestion.targetWord.a)}﴾`
															: `Review your morphological profile for ${quranText(sarfQuestion.targetWord.a)}`}
													</h2>
												</div>
												<button
													type="button"
													className="quiz-back-link"
													onClick={() => goToStep(4)}
												>
													{t.quiz.editButton}
												</button>
											</header>

											<div
												className="quiz-wizard-formula-preview"
												dir="rtl"
												lang="ar"
											>
												<strong className="formula-target">
													{quranText(sarfQuestion.headAr)}:
												</strong>{" "}
												<span>
													من مادة (
													{sarfDraft.root
														? sarfDraft.root.split("").join(" ")
														: "—"}
													)
												</span>
												، <span>على وزن ({sarfDraft.wazn || "—"})</span>،{" "}
												<span>
													{sarfDraft.classCode
														? SARF_CLASSES[sarfDraft.classCode]?.ar
														: "—"}
												</span>
												،{" "}
												<span>
													{sarfDraft.structureCode
														? SARF_STRUCTURES[sarfDraft.structureCode]?.ar
														: "—"}
												</span>
												.
											</div>

											<div className="quiz-wizard-summary-grid">
												<button
													type="button"
													className="quiz-summary-tile"
													onClick={() => goToStep(1)}
												>
													<small>
														{formatNumber(1)} ·{" "}
														{locale === "ar" ? "المادة" : "Root"}
													</small>
													<strong lang="ar">
														{sarfDraft.root
															? sarfDraft.root.split("").join(" ")
															: t.quiz.notSet}
													</strong>
												</button>
												<button
													type="button"
													className="quiz-summary-tile"
													onClick={() => goToStep(2)}
												>
													<small>
														{formatNumber(2)} ·{" "}
														{locale === "ar" ? "الوزن" : "Wazn"}
													</small>
													<strong lang="ar">
														{sarfDraft.wazn || t.quiz.notSet}
													</strong>
												</button>
												<button
													type="button"
													className="quiz-summary-tile"
													onClick={() => goToStep(3)}
												>
													<small>
														{formatNumber(3)} ·{" "}
														{locale === "ar" ? "الباب / المشتق" : "Class"}
													</small>
													<strong lang="ar">
														{sarfDraft.classCode
															? SARF_CLASSES[sarfDraft.classCode]?.ar ||
																sarfDraft.classCode
															: t.quiz.notSet}
													</strong>
												</button>
												<button
													type="button"
													className="quiz-summary-tile"
													onClick={() => goToStep(4)}
												>
													<small>
														{formatNumber(4)} ·{" "}
														{locale === "ar" ? "البنية" : "Structure"}
													</small>
													<strong lang="ar">
														{sarfDraft.structureCode
															? SARF_STRUCTURES[sarfDraft.structureCode]?.ar ||
																sarfDraft.structureCode
															: t.quiz.notSet}
													</strong>
												</button>
											</div>

											{submitted && missingFields.length > 0 && (
												<div className="quiz-inline-error" role="alert">
													<strong>{t.quiz.incompleteAlert}</strong>{" "}
													{missingFields.join(" · ")}
												</div>
											)}

											<div className="quiz-wizard-actions sticky-actions">
												<button
													type="button"
													className="quiz-submit-btn"
													onClick={handleSubmit}
												>
													<span>
														{locale === "ar"
															? "تحقق واكشف التحليل الصرفي"
															: "Submit & Reveal Classical Ṣarf"}
													</span>
												</button>
												<button
													type="button"
													className="quiz-secondary-btn"
													onClick={handleRevealAnswer}
												>
													{t.quiz.revealButton}
												</button>
											</div>
										</>
									) : (
										(() => {
											const rootOk = sarfDraft.root === sarfQuestion.rootRaw;
											const waznOk = sarfDraft.wazn === sarfQuestion.wazn;
											const clsOk =
												sarfDraft.classCode === sarfQuestion.classCode;
											const strOk =
												sarfDraft.structureCode === sarfQuestion.structureCode;
											const allOk = rootOk && waznOk && clsOk && strOk;
											return (
												<div
													className={`quiz-wizard-reveal-card ${allOk ? "is-correct" : "is-review"}`}
												>
													<header className="quiz-solution-head">
														<div className="quiz-solution-copy">
															<h3>
																{locale === "ar"
																	? `التحليل الصرفي الكامل لـ ﴿${quranText(sarfQuestion.targetWord.a)}﴾`
																	: `Classical Ṣarf for ${quranText(sarfQuestion.targetWord.a)}`}
															</h3>
														</div>
														<span
															className={`quiz-verdict-status-pill ${allOk ? "is-correct" : "is-review"}`}
														>
															{allOk
																? t.quiz.exactMatchEyebrow
																: t.quiz.reviewEyebrow}
														</span>
													</header>

													<div className="quiz-wizard-verdict-strip">
														<span
															className={`quiz-verdict-chip ${rootOk ? "ok" : "err"}`}
															lang="ar"
														>
															{rootOk
																? `✓ المادة: ${sarfQuestion.rootSpaced}`
																: `✗ ${sarfDraft.root ? sarfDraft.root.split("").join(" ") : "—"} ← ✓ المادة: ${sarfQuestion.rootSpaced}`}
														</span>
														<span
															className={`quiz-verdict-chip ${waznOk ? "ok" : "err"}`}
															lang="ar"
														>
															{waznOk
																? `✓ الوزن: ${sarfQuestion.wazn}`
																: `✗ ${sarfDraft.wazn || "—"} ← ✓ الوزن: ${sarfQuestion.wazn}`}
														</span>
														<span
															className={`quiz-verdict-chip ${clsOk ? "ok" : "err"}`}
															lang="ar"
														>
															{clsOk
																? `✓ ${SARF_CLASSES[sarfQuestion.classCode]?.ar}`
																: `✗ ${sarfDraft.classCode ? SARF_CLASSES[sarfDraft.classCode]?.ar || sarfDraft.classCode : "—"} ← ✓ ${SARF_CLASSES[sarfQuestion.classCode]?.ar}`}
														</span>
														<span
															className={`quiz-verdict-chip ${strOk ? "ok" : "err"}`}
															lang="ar"
														>
															{strOk
																? `✓ ${SARF_STRUCTURES[sarfQuestion.structureCode]?.ar}`
																: `✗ ${sarfDraft.structureCode ? SARF_STRUCTURES[sarfDraft.structureCode]?.ar || sarfDraft.structureCode : "—"} ← ✓ ${SARF_STRUCTURES[sarfQuestion.structureCode]?.ar}`}
														</span>
														{sarfQuestion.singular ? (
															<span className="quiz-verdict-chip ok" lang="ar">
																مفرده: {sarfQuestion.singular}
															</span>
														) : null}
														{sarfQuestion.asl ? (
															<span className="quiz-verdict-chip ok" lang="ar">
																أصله: {sarfQuestion.asl}
															</span>
														) : null}
													</div>

													<p
														className="prose irab-prose quiz-wizard-irab-prose"
														dir="rtl"
														lang="ar"
													>
														{formatIrabText(sarfQuestion.classicalSarf)}
													</p>

													{sarfQuestion.classicalMeaning ? (
														<p
															className="prose quiz-meaning-note"
															dir="rtl"
															lang="ar"
														>
															<strong>المعنى: </strong>
															{sarfQuestion.classicalMeaning}
														</p>
													) : null}

													<div className="quiz-wizard-actions sticky-actions">
														<button
															type="button"
															className="quiz-next-cta"
															onClick={handleNextRandom}
														>
															{t.quiz.nextButton}
														</button>
														{onOpenSearch ? (
															<button
																type="button"
																className="quiz-secondary-btn"
																onClick={() =>
																	onOpenSearch(sarfQuestion.searchSeed)
																}
															>
																{locale === "ar"
																	? `شواهد الجذر (${sarfQuestion.rootSpaced}) ↗`
																	: `Root (${sarfQuestion.rootSpaced}) in Examples ↗`}
															</button>
														) : null}
													</div>
												</div>
											);
										})()
									)}
								</div>
							)}
						</>
					)}

					{/* ================================================================
					 * LENS 3: EXAMPLES & PATTERN HUNT (/#/search AS A QUIZ)
					 * ================================================================ */}
					{lens === "examples" && exQuestion && (
						<>
							{effectiveStep === 1 && (
								<div className="quiz-wizard-step-body">
									<header className="quiz-wizard-step-head">
										<div>
											<h2>
												{locale === "ar"
													? `أي كلمة في الآية تمثل: «${exQuestion.facetTitle.ar}»؟`
													: locale === "id"
														? `Kata mana pada ayat yang merupakan: "${exQuestion.facetTitle.id}"?`
														: `Which word in the ayah is an example of: "${exQuestion.facetTitle.en}"?`}
											</h2>
											<p className="quiz-wizard-subprompt">
												{exQuestion.facetHint[locale]}
											</p>
										</div>
										<button
											type="button"
											className="quiz-text-reveal"
											onClick={handleRevealAnswer}
										>
											{t.quiz.revealButton}
										</button>
									</header>

									<div className="quiz-wizard-gov-grid" dir="rtl">
										{exQuestion.verse.w.map((w) => {
											const active = exDraft.spottedWordNum === w.n;
											return (
												<button
													key={w.n}
													type="button"
													className={`quiz-gov-chip quiz-wizard-gov-chip${active ? " is-selected" : ""}`}
													onClick={() => {
														setExDraft({ spottedWordNum: w.n });
														setSubmitted(false);
														setAnimDir("forward");
														setStep(2);
													}}
												>
													<b lang="ar">{quranText(w.a)}</b>
													<small>#{formatNumber(w.n)}</small>
												</button>
											);
										})}
									</div>
								</div>
							)}

							{effectiveStep === 2 && (
								<div className="quiz-wizard-step-body">
									{!isComplete ? (
										<>
											<header className="quiz-wizard-step-head">
												<div>
													<h2>
														{locale === "ar"
															? `تحقق من اختيارك لـ «${exQuestion.facetTitle.ar}»`
															: `Confirm your choice for "${exQuestion.facetTitle.en}"`}
													</h2>
												</div>
												<button
													type="button"
													className="quiz-back-link"
													onClick={() => goToStep(1)}
												>
													{t.quiz.editButton}
												</button>
											</header>

											<div
												className="quiz-wizard-formula-preview"
												dir="rtl"
												lang="ar"
											>
												<strong className="formula-target">
													{exQuestion.facetTitle.ar}:
												</strong>{" "}
												<span>
													{spottedWord ? `﴿${quranText(spottedWord.a)}﴾` : "—"}
												</span>
											</div>

											{submitted && missingFields.length > 0 && (
												<div className="quiz-inline-error" role="alert">
													<strong>{t.quiz.incompleteAlert}</strong>{" "}
													{missingFields.join(" · ")}
												</div>
											)}

											<div className="quiz-wizard-actions sticky-actions">
												<button
													type="button"
													className="quiz-submit-btn"
													onClick={handleSubmit}
												>
													<span>
														{locale === "ar"
															? "تحقق واكشف التحليل"
															: "Submit & Reveal Analysis"}
													</span>
												</button>
												<button
													type="button"
													className="quiz-secondary-btn"
													onClick={handleRevealAnswer}
												>
													{t.quiz.revealButton}
												</button>
											</div>
										</>
									) : (
										(() => {
											const spotOk =
												exDraft.spottedWordNum === exQuestion.targetWord.n;
											return (
												<div
													className={`quiz-wizard-reveal-card ${spotOk ? "is-correct" : "is-review"}`}
												>
													<header className="quiz-solution-head">
														<div className="quiz-solution-copy">
															<h3>
																{locale === "ar"
																	? `الشاهد في الآية: ﴿${quranText(exQuestion.targetWord.a)}﴾`
																	: `Spotted Example: ${quranText(exQuestion.targetWord.a)}`}
															</h3>
														</div>
														<span
															className={`quiz-verdict-status-pill ${spotOk ? "is-correct" : "is-review"}`}
														>
															{spotOk
																? t.quiz.exactMatchEyebrow
																: t.quiz.reviewEyebrow}
														</span>
													</header>

													<div className="quiz-wizard-verdict-strip">
														<span
															className={`quiz-verdict-chip ${spotOk ? "ok" : "err"}`}
															lang="ar"
														>
															{spotOk
																? `✓ الشاهد: ${quranText(exQuestion.targetWord.a)}`
																: `✗ ${spottedWord ? quranText(spottedWord.a) : "—"} ← ✓ الشاهد: ${quranText(exQuestion.targetWord.a)}`}
														</span>
														<span className="quiz-verdict-chip ok" lang="ar">
															الوزن: {exQuestion.targetWazn}
														</span>
														<span className="quiz-verdict-chip ok" lang="ar">
															المادة: {exQuestion.targetRootSpaced}
														</span>
													</div>

													<p
														className="prose irab-prose quiz-wizard-irab-prose"
														dir="rtl"
														lang="ar"
													>
														{formatIrabText(
															exQuestion.facetCategory === "syntax" &&
																exQuestion.classicalIrab
																? exQuestion.classicalIrab
																: exQuestion.classicalSarf,
														)}
													</p>

													{exQuestion.classicalMeaning ? (
														<p
															className="prose quiz-meaning-note"
															dir="rtl"
															lang="ar"
														>
															<strong>المعنى: </strong>
															{exQuestion.classicalMeaning}
														</p>
													) : null}

													<div className="quiz-wizard-actions sticky-actions">
														<button
															type="button"
															className="quiz-next-cta"
															onClick={handleNextRandom}
														>
															{t.quiz.nextButton}
														</button>
														{onOpenSearch ? (
															<button
																type="button"
																className="quiz-secondary-btn"
																onClick={() =>
																	onOpenSearch(exQuestion.searchSeed)
																}
															>
																{locale === "ar"
																	? "استكشف هذا النمط في الشواهد ↗"
																	: "Explore Pattern in Examples ↗"}
															</button>
														) : null}
													</div>
												</div>
											);
										})()
									)}
								</div>
							)}
						</>
					)}
				</div>
			</section>
		</div>
	);
}
