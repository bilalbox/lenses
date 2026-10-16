import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadSurah } from "../lib/api";
import { formatWordIrabText } from "../lib/formatIrab";
import { useI18n } from "../lib/i18n/I18nContext";
import {
  CURATED_SURAHS,
  QUIZ_CASES,
  QUIZ_ROLES,
  QUIZ_SIGNS,
  extractQuizQuestionsFromSurah,
  getCaseMeta,
  getRoleMeta,
  getSignMeta,
  type QuizCase,
  type QuizQuestion,
  type QuizRelation,
  type QuizSign,
} from "../lib/quizEngine";
import type { Manifest } from "../lib/types";

interface AnswerDraft {
  relation: QuizRelation | null;
  headWordNum: number | null;
  grammaticalCase: QuizCase | null;
  sign: QuizSign | null;
}

interface ValidationFeedback {
  submitted: boolean;
  isComplete: boolean;
  missingFields: string[];
  relationCorrect: boolean;
  headCorrect: boolean;
  caseCorrect: boolean;
  signCorrect: boolean;
  allCorrect: boolean;
}

type WizardStep = 1 | 2 | 3 | 4 | 5;

export function QuizScreen({
  manifest,
  onOpenInReader,
}: {
  manifest: Manifest;
  onOpenInReader: (sura: number, verse: number, word?: number) => void;
}) {
  const { locale, t, formatNumber } = useI18n();
  const [pool, setPool] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scopeMode, setScopeMode] = useState<"word" | "ayah">("word");
  const [completedWordIds, setCompletedWordIds] = useState<Set<string>>(() => new Set());
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState({ solved: 0, attempts: 0 });

  const [step, setStep] = useState<WizardStep>(1);
  const [animDir, setAnimDir] = useState<"forward" | "backward">("forward");
  const [draft, setDraft] = useState<AnswerDraft>({
    relation: null,
    headWordNum: null,
    grammaticalCase: null,
    sign: null,
  });
  const [feedback, setFeedback] = useState<ValidationFeedback | null>(null);
  const targetBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let cancel = false;
    Promise.all(CURATED_SURAHS.map((n) => loadSurah(n)))
      .then((files) => {
        if (cancel) return;
        const extracted: QuizQuestion[] = [];
        for (const f of files) {
          extracted.push(...extractQuizQuestionsFromSurah(f));
        }
        const sorted = [...extracted].sort((a, b) => {
          const aIsHome = a.sura === 59 && a.verse.v === 18 ? -1 : 0;
          const bIsHome = b.sura === 59 && b.verse.v === 18 ? -1 : 0;
          if (aIsHome !== bIsHome) return aIsHome - bIsHome;
          return 0;
        });
        const preferredIdx = sorted.findIndex((q) => q.sura === 59 && q.verse.v === 18 && q.relation === "subj");
        if (preferredIdx > 0) {
          const [fav] = sorted.splice(preferredIdx, 1);
          sorted.unshift(fav);
        }
        setPool(sorted);
        setLoading(false);
      })
      .catch(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [manifest]);

  const question = pool[currentIndex] ?? null;

  const ayahQuestions = useMemo(() => {
    if (!question) return [];
    return pool.filter((q) => q.sura === question.sura && q.verse.v === question.verse.v);
  }, [pool, question]);

  // Keep the highlighted target word scrolled into view inside the pinned ayah container
  useEffect(() => {
    targetBtnRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [question?.id]);

  const resetForQuestion = useCallback(() => {
    setDraft({
      relation: null,
      headWordNum: null,
      grammaticalCase: null,
      sign: null,
    });
    setFeedback(null);
    setAnimDir("forward");
    setStep(1);
  }, []);

  const handleUpdateDraft = useCallback((patch: Partial<AnswerDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setFeedback(null);
  }, []);

  const handleSelectTargetWord = useCallback(
    (targetQ: QuizQuestion) => {
      const idx = pool.findIndex((q) => q.id === targetQ.id);
      if (idx >= 0) {
        setCurrentIndex(idx);
        resetForQuestion();
      }
    },
    [pool, resetForQuestion],
  );

  const handleNextRandom = useCallback(() => {
    if (pool.length <= 1) return;
    if (scopeMode === "ayah" && question) {
      const nextInAyah = ayahQuestions.find((q) => q.id !== question.id && !completedWordIds.has(q.id));
      if (nextInAyah) {
        handleSelectTargetWord(nextInAyah);
        return;
      }
    }
    const otherAyahPool = pool.filter((q) => !question || q.sura !== question.sura || q.verse.v !== question.verse.v);
    const source = otherAyahPool.length > 0 ? otherAyahPool : pool;
    const picked = source[Math.floor(Math.random() * source.length)];
    const nextIdx = pool.findIndex((q) => q.id === picked.id);
    setCurrentIndex(nextIdx >= 0 ? nextIdx : 0);
    resetForQuestion();
  }, [ayahQuestions, completedWordIds, handleSelectTargetWord, pool, question, resetForQuestion, scopeMode]);

  const handleSubmit = useCallback(() => {
    if (!question) return;
    const missing: string[] = [];
    if (!draft.relation) missing.push(t.quiz.stepRoleCrumb);
    if (!draft.headWordNum) missing.push(getRoleMeta(question.relation).governorLabel[locale]);
    if (!draft.grammaticalCase) missing.push(t.quiz.stepCaseCrumb);
    if (!draft.sign) missing.push(t.quiz.stepSignCrumb);

    if (missing.length > 0) {
      setFeedback({
        submitted: true,
        isComplete: false,
        missingFields: missing,
        relationCorrect: false,
        headCorrect: false,
        caseCorrect: false,
        signCorrect: false,
        allCorrect: false,
      });
      return;
    }

    const relationCorrect = draft.relation === question.relation;
    const headCorrect = draft.headWordNum === question.headWord.n;
    const caseCorrect = draft.grammaticalCase === question.grammaticalCase;
    const signCorrect = draft.sign === question.sign;
    const allCorrect = relationCorrect && headCorrect && caseCorrect && signCorrect;

    setFeedback({
      submitted: true,
      isComplete: true,
      missingFields: [],
      relationCorrect,
      headCorrect,
      caseCorrect,
      signCorrect,
      allCorrect,
    });

    if (allCorrect) {
      setCompletedWordIds((prev) => new Set(prev).add(question.id));
      setStreak((s) => s + 1);
      setScore((prev) => ({ solved: prev.solved + 1, attempts: prev.attempts + 1 }));
    } else {
      setStreak(0);
      setScore((prev) => ({ ...prev, attempts: prev.attempts + 1 }));
    }
  }, [draft, locale, question, t.quiz]);

  const handleRevealAnswer = useCallback(() => {
    if (!question) return;
    setDraft({
      relation: question.relation,
      headWordNum: question.headWord.n,
      grammaticalCase: question.grammaticalCase,
      sign: question.sign,
    });
    setFeedback({
      submitted: true,
      isComplete: true,
      missingFields: [],
      relationCorrect: true,
      headCorrect: true,
      caseCorrect: true,
      signCorrect: true,
      allCorrect: true,
    });
    setCompletedWordIds((prev) => new Set(prev).add(question.id));
    setAnimDir("forward");
    setStep(5);
  }, [question]);

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

  if (loading || !question) {
    return (
      <div className="skeleton page-skeleton" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    );
  }

  const activeRoleMeta = draft.relation ? getRoleMeta(draft.relation) : getRoleMeta(question.relation);
  const effectiveStep: WizardStep = feedback?.submitted && feedback.isComplete ? 5 : step;

  const goToStep = (next: WizardStep) => {
    setAnimDir(next >= effectiveStep ? "forward" : "backward");
    setStep(next);
  };

  // Endowed progress: starts at 20% (Step 1 of 5 anchored)
  const filledSteps =
    1 +
    (draft.relation ? 1 : 0) +
    (draft.headWordNum ? 1 : 0) +
    (draft.grammaticalCase ? 1 : 0) +
    (draft.sign ? 1 : 0);
  const progressPct = Math.round((filledSteps / 5) * 100);

  const selectedHeadWord = question.verse.w.find((w) => w.n === draft.headWordNum) ?? null;

  const selectRelationAndAdvance = (rel: QuizRelation) => {
    handleUpdateDraft({ relation: rel });
    setAnimDir("forward");
    setStep(2);
  };

  const selectHeadAndAdvance = (headNum: number) => {
    handleUpdateDraft({ headWordNum: headNum });
    setAnimDir("forward");
    setStep(3);
  };

  const selectCaseAndAdvance = (c: QuizCase) => {
    handleUpdateDraft({ grammaticalCase: c });
    setAnimDir("forward");
    setStep(4);
  };

  const selectSignAndAdvance = (s: QuizSign) => {
    handleUpdateDraft({ sign: s });
    setAnimDir("forward");
    setStep(5);
  };

  const solvedInAyahCount = ayahQuestions.filter((q) => completedWordIds.has(q.id)).length;

  const crumbRoleLabel = draft.relation ? getRoleMeta(draft.relation).ar : t.quiz.stepRoleCrumb;
  const crumbHeadLabel = selectedHeadWord
    ? selectedHeadWord.a
    : activeRoleMeta.governorLabel[locale];
  const crumbCaseLabel = draft.grammaticalCase ? getCaseMeta(draft.grammaticalCase).ar : t.quiz.stepCaseCrumb;
  const crumbSignLabel = draft.sign ? getSignMeta(draft.sign).ar : t.quiz.stepSignCrumb;

  return (
    <div className="quiz-wizard-viewport anim-soft-enter">
      {/* ====================================================================
       * TOP PANE (Top 40% of screen): Pinned Ayah & Progress Context
       * ==================================================================== */}
      <section className="quiz-wizard-top" aria-label={t.common.verse}>
        <div className="quiz-wizard-meta-bar">
          <div className="quiz-wizard-surah-tag">
            <span className="eyebrow quiz-wizard-ref">
              {question.suraPhonetic} {formatNumber(question.sura)}:{formatNumber(question.verse.v)}
            </span>
            <div className="segmented-group quiz-wizard-mode-pill" role="group" aria-label="Quiz scope">
              <button
                type="button"
                className={`segmented-item${scopeMode === "word" ? " is-active" : ""}`}
                onClick={() => setScopeMode("word")}
              >
                {t.quiz.modeSingleWord}
              </button>
              <button
                type="button"
                className={`segmented-item${scopeMode === "ayah" ? " is-active" : ""}`}
                onClick={() => setScopeMode("ayah")}
              >
                {t.quiz.modeFullAyah(solvedInAyahCount, ayahQuestions.length)}
              </button>
            </div>
          </div>

          <div className="quiz-wizard-stats">
            <span className="quiz-wizard-stat" title={t.quiz.streakLabel}>
              <strong>{formatNumber(streak)}</strong>
              <small>{t.quiz.streakLabel}</small>
            </span>
            {score.attempts > 0 ? (
              <span className="quiz-wizard-stat quiz-wizard-stat-score" title="Solved / attempts">
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
              onClick={() => onOpenInReader(question.sura, question.verse.v, question.targetWord.n)}
            >
              {t.quiz.openReader(question.sura, question.verse.v)}
            </button>
            <button type="button" className="quiz-wizard-skip" onClick={handleNextRandom}>
              {t.quiz.skipButton}
            </button>
          </div>
        </div>

        {/* Endowed Progress Bar + Interactive Step Breadcrumb Pills */}
        <div className="quiz-wizard-progress-strip">
          <div className="quiz-progress-track" aria-hidden="true">
            <div className="quiz-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="quiz-wizard-breadcrumbs" role="tablist" aria-label="Quiz steps">
            <button
              type="button"
              role="tab"
              aria-selected={effectiveStep === 1}
              title={crumbRoleLabel}
              className={`quiz-crumb ${effectiveStep === 1 ? "is-active" : ""} ${draft.relation ? "is-filled" : ""}`}
              onClick={() => goToStep(1)}
            >
              <span className="quiz-crumb-num">{formatNumber(1)}</span>
              <span className="quiz-crumb-text" lang={draft.relation ? "ar" : undefined}>
                {crumbRoleLabel}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={effectiveStep === 2}
              title={crumbHeadLabel}
              className={`quiz-crumb ${effectiveStep === 2 ? "is-active" : ""} ${draft.headWordNum ? "is-filled" : ""}`}
              onClick={() => goToStep(2)}
            >
              <span className="quiz-crumb-num">{formatNumber(2)}</span>
              <span className="quiz-crumb-text" lang={selectedHeadWord ? "ar" : undefined}>
                {selectedHeadWord ? selectedHeadWord.a : t.quiz.headBadge}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={effectiveStep === 3}
              title={crumbCaseLabel}
              className={`quiz-crumb ${effectiveStep === 3 ? "is-active" : ""} ${draft.grammaticalCase ? "is-filled" : ""}`}
              onClick={() => goToStep(3)}
            >
              <span className="quiz-crumb-num">{formatNumber(3)}</span>
              <span className="quiz-crumb-text" lang={draft.grammaticalCase ? "ar" : undefined}>
                {crumbCaseLabel}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={effectiveStep === 4}
              title={crumbSignLabel}
              className={`quiz-crumb ${effectiveStep === 4 ? "is-active" : ""} ${draft.sign ? "is-filled" : ""}`}
              onClick={() => goToStep(4)}
            >
              <span className="quiz-crumb-num">{formatNumber(4)}</span>
              <span className="quiz-crumb-text" lang={draft.sign ? "ar" : undefined}>
                {crumbSignLabel}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={effectiveStep === 5}
              title={t.quiz.stepCheckCrumb}
              className={`quiz-crumb ${effectiveStep === 5 ? "is-active" : ""} ${filledSteps === 5 ? "is-filled" : ""}`}
              onClick={() => goToStep(5)}
            >
              <span className="quiz-crumb-num">✓</span>
              <span className="quiz-crumb-text">{t.quiz.stepCheckCrumb}</span>
            </button>
          </div>
        </div>

        {/* Pinned Mushaf Ayah Box — remount on question change for soft enter (matches step slides) */}
        <div
          key={question.id}
          className={`quiz-wizard-ayah-box anim-soft-enter ${effectiveStep === 2 ? "is-picking-governor" : ""}`}
        >
          {scopeMode === "ayah" && (
            <div className="quiz-wizard-word-tabs" dir="rtl">
              {ayahQuestions.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  className={`quiz-wizard-word-tab${q.id === question.id ? " is-current" : ""}${completedWordIds.has(q.id) ? " is-done" : ""}`}
                  onClick={() => handleSelectTargetWord(q)}
                >
                  <span lang="ar">{q.targetWord.a}</span>
                  {completedWordIds.has(q.id) && <small aria-hidden="true">✓</small>}
                </button>
              ))}
            </div>
          )}

          {effectiveStep === 2 ? (
            <p className="quiz-wizard-pick-hint" role="status">
              {t.quiz.pickGovernorHint}
            </p>
          ) : null}

          <p className="verse-line quiz-wizard-verse-line" dir="rtl" lang="ar">
            {question.verse.w.map((w) => {
              const isTarget = w.n === question.targetWord.n;
              const isHead = draft.headWordNum === w.n;
              const isCorrectHeadHint = Boolean(
                feedback?.submitted && feedback.isComplete && !feedback.headCorrect && w.n === question.headWord.n,
              );
              return (
                <button
                  key={w.n}
                  ref={isTarget ? targetBtnRef : undefined}
                  type="button"
                  aria-label={
                    isTarget
                      ? t.quiz.legendTarget(w.a)
                      : isHead
                        ? t.quiz.legendHead(activeRoleMeta.governorLabel[locale], w.a)
                        : w.a
                  }
                  className={[
                    "quiz-word-token",
                    isTarget ? "is-target" : "",
                    isHead ? "is-head" : "",
                    isCorrectHeadHint ? "is-correct-head-hint" : "",
                    effectiveStep === 2 && !isTarget ? "is-governor-candidate" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => {
                    if (isTarget) return;
                    if (effectiveStep === 2) {
                      selectHeadAndAdvance(w.n);
                    } else {
                      handleUpdateDraft({ headWordNum: w.n });
                    }
                  }}
                >
                  <span className="quiz-word-arabic">{w.a}</span>
                  {(isTarget || isHead) && (
                    <span
                      className={`quiz-token-mark ${isTarget ? "mark-target" : ""} ${isHead ? "mark-head" : ""}`}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
            <span className="ayah-mark">{formatNumber(question.verse.v)}</span>
          </p>

          <div className="quiz-wizard-legend">
            <span className="quiz-legend-item is-target">
              <span className="quiz-legend-swatch" aria-hidden="true" />
              <span className="quiz-legend-copy">
                <small>{t.quiz.targetBadge}</small>
                <strong lang="ar">{question.targetWord.a}</strong>
              </span>
            </span>
            {selectedHeadWord ? (
              <span className="quiz-legend-item is-head">
                <span className="quiz-legend-swatch" aria-hidden="true" />
                <span className="quiz-legend-copy">
                  <small>{activeRoleMeta.governorLabel[locale]}</small>
                  <strong lang="ar">{selectedHeadWord.a}</strong>
                </span>
              </span>
            ) : null}
          </div>
        </div>
      </section>

      {/* ====================================================================
       * BOTTOM PANE (Bottom 60% of screen): Single-Step Animated Wizard
       * ==================================================================== */}
      <section className="quiz-wizard-bottom" aria-live="polite">
        <div key={`${question.id}-step-${effectiveStep}`} className={`quiz-wizard-pane anim-${animDir}`}>
          {/* STEP 1: Syntactic Role */}
          {effectiveStep === 1 && (
            <div className="quiz-wizard-step-body">
              <header className="quiz-wizard-step-head">
                <div>
                  <span className="eyebrow">{t.quiz.step1Eyebrow}</span>
                  <h2>{t.quiz.step1Question(question.targetWord.a)}</h2>
                </div>
                <button type="button" className="quiz-text-reveal" onClick={handleRevealAnswer}>
                  {t.quiz.revealButton}
                </button>
              </header>

              <div className="quiz-wizard-grid-roles">
                {QUIZ_ROLES.map((r) => {
                  const active = draft.relation === r.code;
                  return (
                    <button
                      key={r.code}
                      type="button"
                      className={`quiz-rich-card family-${r.family}${active ? " is-selected" : ""}`}
                      onClick={() => selectRelationAndAdvance(r.code)}
                    >
                      <div className="quiz-rich-top">
                        <strong lang="ar">{r.ar}</strong>
                        <span className="quiz-rich-dot" />
                      </div>
                      <small>{locale === "id" ? r.id : locale === "ar" ? r.governorLabel.ar : r.en}</small>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Governing / Linked Word */}
          {effectiveStep === 2 && (
            <div className="quiz-wizard-step-body">
              <header className="quiz-wizard-step-head">
                <div>
                  <span className="eyebrow">{t.quiz.step2Eyebrow(activeRoleMeta.governorLabel[locale])}</span>
                  <h2>{t.quiz.step2Question(activeRoleMeta.governorLabel.ar, question.targetWord.a)}</h2>
                  <p className="quiz-wizard-subprompt">{t.quiz.step2Hint}</p>
                </div>
                <button type="button" className="quiz-back-link" onClick={() => goToStep(1)}>
                  {t.quiz.backButton}
                </button>
              </header>

              <div className="quiz-wizard-gov-grid" dir="rtl">
                {question.verse.w
                  .filter((w) => w.n !== question.targetWord.n)
                  .map((w) => {
                    const active = draft.headWordNum === w.n;
                    return (
                      <button
                        key={w.n}
                        type="button"
                        className={`quiz-gov-chip quiz-wizard-gov-chip${active ? " is-selected" : ""}`}
                        onClick={() => selectHeadAndAdvance(w.n)}
                      >
                        <b lang="ar">{w.a}</b>
                        <small>#{formatNumber(w.n)}</small>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* STEP 3: Grammatical Case */}
          {effectiveStep === 3 && (
            <div className="quiz-wizard-step-body">
              <header className="quiz-wizard-step-head">
                <div>
                  <span className="eyebrow">{t.quiz.step3Eyebrow}</span>
                  <h2>{t.quiz.step3Question(question.targetWord.a)}</h2>
                </div>
                <button type="button" className="quiz-back-link" onClick={() => goToStep(2)}>
                  {t.quiz.backButton}
                </button>
              </header>

              <div className="quiz-wizard-case-list">
                {QUIZ_CASES.map((c) => {
                  const active = draft.grammaticalCase === c.code;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      className={`quiz-case-card quiz-wizard-case-card${active ? " is-selected" : ""}`}
                      onClick={() => selectCaseAndAdvance(c.code)}
                    >
                      <div className="quiz-case-row">
                        <strong lang="ar">{c.ar}</strong>
                        <span>{locale === "id" ? c.id : c.en}</span>
                      </div>
                      <small>{c.shortDesc[locale]}</small>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Declension Sign */}
          {effectiveStep === 4 && (
            <div className="quiz-wizard-step-body">
              <header className="quiz-wizard-step-head">
                <div>
                  <span className="eyebrow">{t.quiz.step4Eyebrow}</span>
                  <h2>{t.quiz.step4Question(question.targetWord.a)}</h2>
                </div>
                <button type="button" className="quiz-back-link" onClick={() => goToStep(3)}>
                  {t.quiz.backButton}
                </button>
              </header>

              <div className="quiz-wizard-sign-grid">
                {QUIZ_SIGNS.map((s) => {
                  const active = draft.sign === s.code;
                  return (
                    <button
                      key={s.code}
                      type="button"
                      className={`quiz-sign-card quiz-wizard-sign-card${active ? " is-selected" : ""}`}
                      onClick={() => selectSignAndAdvance(s.code)}
                    >
                      <span className="quiz-sign-symbol" lang="ar">
                        {s.symbol}
                      </span>
                      <div>
                        <strong lang="ar">{s.ar}</strong>
                        <small>{locale === "id" ? s.id : s.en}</small>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: Synthesized Review, Submit & Classical I'rab Reveal */}
          {effectiveStep === 5 && (
            <div className="quiz-wizard-step-body">
              {!feedback?.submitted || !feedback.isComplete ? (
                <>
                  <header className="quiz-wizard-step-head">
                    <div>
                      <span className="eyebrow">{t.quiz.step5Eyebrow}</span>
                      <h2>{t.quiz.step5Title(question.targetWord.a)}</h2>
                    </div>
                    <button type="button" className="quiz-back-link" onClick={() => goToStep(4)}>
                      {t.quiz.editButton}
                    </button>
                  </header>

                  {/* Assembled Arabic Formula Card */}
                  <div className="quiz-wizard-formula-preview" dir="rtl" lang="ar">
                    <strong className="formula-target">{question.targetWord.a}:</strong>{" "}
                    <span>{draft.relation ? getRoleMeta(draft.relation).ar : "—"}</span>{" "}
                    <span>{selectedHeadWord ? `لـ ${selectedHeadWord.a}` : "—"}</span>{" "}
                    <span>{draft.grammaticalCase ? getCaseMeta(draft.grammaticalCase).ar : "—"}</span>{" "}
                    <span>وعلامة إعرابه</span>{" "}
                    <span>{draft.sign ? getSignMeta(draft.sign).ar : "—"}</span>.
                  </div>

                  {/* Interactive 4-chip summary */}
                  <div className="quiz-wizard-summary-grid">
                    <button type="button" className="quiz-summary-tile" onClick={() => goToStep(1)}>
                      <small>
                        {formatNumber(1)} · {t.quiz.stepRoleCrumb}
                      </small>
                      <strong lang="ar">{draft.relation ? getRoleMeta(draft.relation).ar : t.quiz.notSet}</strong>
                    </button>
                    <button type="button" className="quiz-summary-tile" onClick={() => goToStep(2)}>
                      <small>
                        {formatNumber(2)} · {activeRoleMeta.governorLabel[locale]}
                      </small>
                      <strong lang="ar">{selectedHeadWord ? selectedHeadWord.a : t.quiz.notSet}</strong>
                    </button>
                    <button type="button" className="quiz-summary-tile" onClick={() => goToStep(3)}>
                      <small>
                        {formatNumber(3)} · {t.quiz.stepCaseCrumb}
                      </small>
                      <strong lang="ar">
                        {draft.grammaticalCase ? getCaseMeta(draft.grammaticalCase).ar : t.quiz.notSet}
                      </strong>
                    </button>
                    <button type="button" className="quiz-summary-tile" onClick={() => goToStep(4)}>
                      <small>
                        {formatNumber(4)} · {t.quiz.stepSignCrumb}
                      </small>
                      <strong lang="ar">{draft.sign ? getSignMeta(draft.sign).ar : t.quiz.notSet}</strong>
                    </button>
                  </div>

                  {feedback?.submitted && !feedback.isComplete && (
                    <div className="quiz-inline-error" role="alert">
                      <strong>{t.quiz.incompleteAlert}</strong> {feedback.missingFields.join(" · ")}
                    </div>
                  )}

                  <div className="quiz-wizard-actions sticky-actions">
                    <button type="button" className="quiz-submit-btn" onClick={handleSubmit}>
                      <span>{t.quiz.submitButton}</span>
                    </button>
                    <button type="button" className="quiz-secondary-btn" onClick={handleRevealAnswer}>
                      {t.quiz.revealButton}
                    </button>
                  </div>
                </>
              ) : (
                /* Revealed Classical Analysis State */
                <div className={`quiz-wizard-reveal-card ${feedback.allCorrect ? "is-correct" : "is-review"}`}>
                  <header className="quiz-solution-head">
                    <div className="quiz-solution-copy">
                      <span className="eyebrow">
                        {feedback.allCorrect ? t.quiz.exactMatchEyebrow : t.quiz.reviewEyebrow}
                      </span>
                      <h3>{t.quiz.classicalHeading(question.targetWord.a)}</h3>
                    </div>
                  </header>

                  <div className="quiz-wizard-verdict-strip">
                    <span className={`quiz-verdict-chip ${feedback.relationCorrect ? "ok" : "err"}`} lang="ar">
                      {feedback.relationCorrect
                        ? `✓ ${getRoleMeta(question.relation).ar}`
                        : `✗ ${getRoleMeta(question.relation).ar}`}
                    </span>
                    <span className={`quiz-verdict-chip ${feedback.headCorrect ? "ok" : "err"}`} lang="ar">
                      {feedback.headCorrect
                        ? `✓ ${question.headWord.a}`
                        : `✗ ${getRoleMeta(question.relation).governorLabel.ar}: ${question.headWord.a}`}
                    </span>
                    <span className={`quiz-verdict-chip ${feedback.caseCorrect ? "ok" : "err"}`} lang="ar">
                      {feedback.caseCorrect
                        ? `✓ ${getCaseMeta(question.grammaticalCase).ar}`
                        : `✗ ${getCaseMeta(question.grammaticalCase).ar}`}
                    </span>
                    <span className={`quiz-verdict-chip ${feedback.signCorrect ? "ok" : "err"}`} lang="ar">
                      {feedback.signCorrect
                        ? `✓ ${getSignMeta(question.sign).ar}`
                        : `✗ ${getSignMeta(question.sign).ar}`}
                    </span>
                  </div>

                  <p className="prose irab-prose quiz-wizard-irab-prose" dir="rtl" lang="ar">
                    {formatWordIrabText(question.classicalIrab)}
                  </p>

                  <div className="quiz-wizard-actions sticky-actions">
                    <button type="button" className="quiz-next-cta" onClick={handleNextRandom}>
                      {t.quiz.nextButton}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
