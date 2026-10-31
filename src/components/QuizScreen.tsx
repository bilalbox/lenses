import {
	useCallback,
	useEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
} from "react";
import { stripTashkeel } from "../lib/arabic";
import { formatIrabText, formatWordIrabText } from "../lib/formatIrab";
import { useI18n } from "../lib/i18n/I18nContext";
import { loadLayer } from "../lib/layers";
import {
	getCaseMeta,
	getLensLabel,
	getRoleMeta,
	getSignMeta,
	QUIZ_CASES,
	QUIZ_ROLES,
	QUIZ_SIGNS,
	type QuizLens,
	SARF_CLASSES,
	SARF_STRUCTURES,
} from "../lib/quizCatalog";
import {
	CURATED_SURAHS,
	EXTENDED_QUIZ_SURAHS,
	type ExampleHuntQuestion,
	extractQuizPools,
	type QuizPools,
	type QuizQuestion,
	type QuizSource,
	type SarfQuestion,
} from "../lib/quizEngine";
import {
	activeQuestion,
	type DraftField,
	initQuizSession,
	maxStep,
	progress,
	type QuizSessionEvent,
	type QuizSessionState,
	reduceQuizSession,
	type WizardStep,
} from "../lib/quizSession";
import type { ExampleQuery } from "../lib/search";
import type { Manifest } from "../lib/types";

const LENS_ORDER: QuizLens[] = ["irab", "sarf", "examples"];

/** A quiz surah's morphology plus its treebank; a missing treebank only costs the iʿrāb questions. */
async function loadQuizSource(n: number): Promise<QuizSource> {
	const [surah, syntax] = await Promise.all([
		loadLayer("surah", n),
		loadLayer("syntax", n).catch(() => undefined),
	]);
	return { surah, syntax };
}

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
	const [loadedFiles, setLoadedFiles] = useState<QuizSource[]>([]);
	const [loading, setLoading] = useState(true);

	const pools = useRef<QuizPools>({ irab: [], sarf: [], examples: [] });
	const [session, dispatch] = useReducer(
		(state: QuizSessionState, event: QuizSessionEvent) =>
			reduceQuizSession(state, event, pools.current),
		undefined,
		initQuizSession,
	);
	const { lens, drafts, verdict, streak, score } = session;
	const irabDraft = drafts.irab;
	const sarfDraft = drafts.sarf;
	const exDraft = drafts.examples;
	const targetBtnRef = useRef<HTMLButtonElement | null>(null);
	const ayahBoxRef = useRef<HTMLDivElement | null>(null);

	// Wave 1: Load CURATED_SURAHS immediately for fast initial paint
	useEffect(() => {
		if (!manifest) return;
		let cancel = false;
		Promise.all(CURATED_SURAHS.map(loadQuizSource))
			.then((sources) => {
				if (cancel) return;
				setLoadedFiles(sources);
				setLoading(false);

				// Wave 2: Load EXTENDED_QUIZ_SURAHS in the background for deeper variety
				void Promise.all(
					EXTENDED_QUIZ_SURAHS.map((n) => loadQuizSource(n).catch(() => null)),
				).then((more) => {
					if (cancel) return;
					const validMore = more.filter((f): f is QuizSource => f !== null);
					if (validMore.length > 0) {
						setLoadedFiles((prev) => {
							const seen = new Set(prev.map((p) => p.surah.n));
							return [
								...prev,
								...validMore.filter((f) => !seen.has(f.surah.n)),
							];
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

	const quizPools = useMemo(() => extractQuizPools(loadedFiles), [loadedFiles]);
	pools.current = quizPools;
	const { irab: irabPool, sarf: sarfPool, examples: examplesPool } = quizPools;

	// Always open quiz on a random verse (once curated pools are ready).
	useEffect(() => {
		if (session.seeded || loading) return;
		if (
			irabPool.length === 0 &&
			sarfPool.length === 0 &&
			examplesPool.length === 0
		)
			return;
		const raf = requestAnimationFrame(() => {
			dispatch({
				type: "seed",
				random: {
					irab: Math.random(),
					sarf: Math.random(),
					examples: Math.random(),
				},
			});
		});
		return () => cancelAnimationFrame(raf);
	}, [
		examplesPool.length,
		irabPool.length,
		loading,
		session.seeded,
		sarfPool.length,
	]);

	const question = activeQuestion(session, pools.current);
	const irabQuestion =
		lens === "irab" ? (question as QuizQuestion | null) : null;
	const sarfQuestion =
		lens === "sarf" ? (question as SarfQuestion | null) : null;
	const exQuestion =
		lens === "examples" ? (question as ExampleHuntQuestion | null) : null;

	const activeQ = question;

	useEffect(() => {
		if (activeQ?.id || lens) {
			targetBtnRef.current?.scrollIntoView({
				behavior: "smooth",
				block: "nearest",
				inline: "center",
			});
		}
	}, [activeQ?.id, lens]);

	const handleSelectLens = (nextLens: QuizLens) =>
		dispatch({ type: "selectLens", lens: nextLens });
	const handleNextRandom = () =>
		dispatch({ type: "next", random: Math.random() });
	const handleSubmit = useCallback(() => dispatch({ type: "submit" }), []);
	const handleRevealAnswer = () => dispatch({ type: "reveal" });

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
		if (lens || activeQ?.id) {
			ayahBoxRef.current?.scrollTo({ top: 0 });
		}
	}, [lens, activeQ?.id]);

	if (loading || !session.seeded || !activeQ) {
		return (
			<div className="skeleton page-skeleton" aria-hidden="true">
				<span />
				<span />
				<span />
			</div>
		);
	}

	const isComplete = verdict !== null;
	const effectiveStep: WizardStep = isComplete ? maxStep(lens) : session.step;
	const animDir = session.animDir;
	const goToStep = (next: WizardStep) =>
		dispatch({ type: "goToStep", step: next });
	const { filled: filledSteps, total: totalSteps } = progress(session);
	const fieldLabels: Record<DraftField, string> = {
		relation: t.quiz.stepRoleCrumb,
		headWordNum: irabQuestion
			? getRoleMeta(irabQuestion.relation).governorLabel[locale]
			: t.quiz.headBadge,
		grammaticalCase: t.quiz.stepCaseCrumb,
		sign: t.quiz.stepSignCrumb,
		root: t.quiz.fieldRoot,
		wazn: t.quiz.fieldWazn,
		classCode: t.quiz.fieldClass,
		structureCode: t.quiz.fieldStructure,
		spottedWordNum: t.quiz.fieldSpotted,
	};
	const missingLabels = session.missing.map((field) => fieldLabels[field]);
	const ok = (field: DraftField) => verdict?.fields[field] ?? false;
	const allOk = verdict?.allCorrect ?? false;
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
			<h1 className="quiz-page-title">{t.quiz.pageTitle}</h1>
			{/* ====================================================================
			 * TOP PANE: Lens Switcher + Pinned Mushaf Ayah
			 * ==================================================================== */}
			<section className="quiz-wizard-top" aria-label={t.common.verse}>
				{/* 3-Lens Switcher */}
				<div
					className="quiz-lens-switcher"
					role="tablist"
					aria-label={t.quiz.lensesAria}
				>
					{LENS_ORDER.map((l) => {
						const info = getLensLabel(l, locale);
						const active = lens === l;
						return (
							<button
								key={l}
								id={`quiz-lens-tab-${l}`}
								type="button"
								role="tab"
								aria-selected={active}
								aria-controls="quiz-lens-panel"
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
					key={`${lens}:${activeQ.id}`}
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
						{activeQ.verse.w.map((w) => {
							const isTarget =
								lens === "examples"
									? isComplete && w.n === activeQ.targetWord.n
									: w.n === activeQ.targetWord.n;
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
									ref={w.n === activeQ.targetWord.n ? targetBtnRef : undefined}
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
											if (w.n === activeQ.targetWord.n) return;
											dispatch({
												type: "answer",
												field: "headWordNum",
												value: w.n,
												step: effectiveStep === 2 ? 3 : undefined,
											});
										} else if (lens === "examples") {
											dispatch({
												type: "answer",
												field: "spottedWordNum",
												value: w.n,
												step: effectiveStep === 1 ? 2 : undefined,
											});
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
						<span className="ayah-mark">{formatNumber(activeQ.verse.v)}</span>
					</p>
				</div>
			</section>

			{/* ====================================================================
			 * BOTTOM PANE: Single-Step Animated Wizard Deck per Lens
			 * ==================================================================== */}
			<section
				id="quiz-lens-panel"
				className="quiz-wizard-bottom"
				role="tabpanel"
				aria-labelledby={`quiz-lens-tab-${lens}`}
				aria-live="polite"
			>
				<div className="quiz-wizard-meta-bar">
					<div className="quiz-wizard-surah-tag">
						<span className="quiz-wizard-ref">
							{activeQ.suraPhonetic} {formatNumber(activeQ.sura)}:
							{formatNumber(activeQ.verse.v)}
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
									activeQ.sura,
									activeQ.verse.v,
									activeQ.targetWord.n,
								)
							}
						>
							{t.quiz.openReader(activeQ.sura, activeQ.verse.v)}
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
						aria-label={t.quiz.stepsAria}
					>
						{breadcrumbs.map((b, idx) => {
							const isLast = idx === breadcrumbs.length - 1;
							return (
								<button
									key={b.stepNum}
									id={`quiz-step-tab-${b.stepNum}`}
									type="button"
									role="tab"
									aria-selected={effectiveStep === b.stepNum}
									aria-controls="quiz-step-panel"
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
					id="quiz-step-panel"
					key={`${lens}:${activeQ.id}-step-${effectiveStep}`}
					className={`quiz-wizard-pane anim-${animDir}`}
					role="tabpanel"
					aria-labelledby={`quiz-step-tab-${effectiveStep}`}
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
														dispatch({
															type: "answer",
															field: "relation",
															value: r.code,
															step: 2,
														});
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
															dispatch({
																type: "answer",
																field: "headWordNum",
																value: w.n,
																step: 3,
															});
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
														dispatch({
															type: "answer",
															field: "grammaticalCase",
															value: c.code,
															step: 4,
														});
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
														dispatch({
															type: "answer",
															field: "sign",
															value: s.code,
															step: 5,
														});
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

											{missingLabels.length > 0 && (
												<div className="quiz-inline-error" role="alert">
													<strong>{t.quiz.incompleteAlert}</strong>{" "}
													{missingLabels.join(" · ")}
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
											const relOk = ok("relation");
											const headOk = ok("headWordNum");
											const caseOk = ok("grammaticalCase");
											const signOk = ok("sign");

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
														dispatch({
															type: "answer",
															field: "root",
															value: opt.code,
															step: 2,
														});
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
														dispatch({
															type: "answer",
															field: "wazn",
															value: opt.code,
															step: 3,
														});
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
														dispatch({
															type: "answer",
															field: "classCode",
															value: opt.code,
															step: 4,
														});
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
														dispatch({
															type: "answer",
															field: "structureCode",
															value: opt.code,
															step: 5,
														});
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

											{missingLabels.length > 0 && (
												<div className="quiz-inline-error" role="alert">
													<strong>{t.quiz.incompleteAlert}</strong>{" "}
													{missingLabels.join(" · ")}
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
											const rootOk = ok("root");
											const waznOk = ok("wazn");
											const clsOk = ok("classCode");
											const strOk = ok("structureCode");

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
														dispatch({
															type: "answer",
															field: "spottedWordNum",
															value: w.n,
															step: 2,
														});
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

											{missingLabels.length > 0 && (
												<div className="quiz-inline-error" role="alert">
													<strong>{t.quiz.incompleteAlert}</strong>{" "}
													{missingLabels.join(" · ")}
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
											const spotOk = allOk;
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
