import { useCallback, useEffect, useRef, useState } from "react";
import { featureLines, kindGloss, posGloss, relationGloss } from "../lib/glossary";
import { spaceLetters } from "../lib/arabic";
import { formatIrabText, formatWordIrabText } from "../lib/formatIrab";
import { useI18n } from "../lib/i18n/I18nContext";
import type { SyntaxGraph, Verse, Word } from "../lib/types";
import { CloseIcon } from "./Icons";

interface Props {
  sura: number;
  verse: Verse;
  word: Word;
  segmentIndex?: number;
  onSelectSegment: (index: number) => void;
  onClose: () => void;
  onSearchRoot: (root: string) => void;
  onSearchLemma: (lemma: string) => void;
}

export function WordSheet({
  sura,
  verse,
  word,
  segmentIndex,
  onSelectSegment,
  onClose,
  onSearchRoot,
  onSearchLemma,
}: Props) {
  const { locale, t, formatNumber } = useI18n();
  const stem = word.s.find((segment) => segment.k === "m") ?? word.s[0];
  const selected =
    word.s.find((_, index) => index === segmentIndex) ?? stem;
  const implied = impliedDependents(verse.g ?? [], sura, verse.v, word.n);
  const [expanded, setExpanded] = useState(false);
  const [closing, setClosing] = useState(false);
  const touchY = useRef(0);
  const closingTimerRef = useRef<number | null>(null);

  const handleClose = useCallback(() => {
    if (closing) return;
    const isMobile = window.matchMedia("(max-width: 1099px)").matches;
    if (!isMobile) {
      onClose();
      return;
    }
    setClosing(true);
    closingTimerRef.current = window.setTimeout(() => {
      onClose();
    }, 200);
  }, [closing, onClose]);

  useEffect(() => {
    setClosing(false);
    if (closingTimerRef.current) {
      clearTimeout(closingTimerRef.current);
    }
  }, [word]);

  useEffect(() => {
    return () => {
      if (closingTimerRef.current) {
        clearTimeout(closingTimerRef.current);
      }
    };
  }, []);

  // Escape key dismiss with exit animation
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        handleClose();
      }
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [handleClose]);

  // Lock body scroll on mobile
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1099px)");
    const updateLock = () => {
      if (media.matches) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    };
    updateLock();
    media.addEventListener("change", updateLock);
    return () => {
      document.body.style.overflow = "";
      media.removeEventListener("change", updateLock);
    };
  }, []);

  return (
    <div
      className={`sheet-backdrop${closing ? " is-closing" : ""}`}
      onClick={handleClose}
      role="presentation"
    >
      <aside
        className={`sheet${expanded ? " is-expanded" : ""}${closing ? " is-closing" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={t.sheet.analysisAria(word.n)}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="sheet-handle"
          aria-label={expanded ? t.sheet.collapseAria : t.sheet.expandAria}
          onClick={() => setExpanded((value) => !value)}
          onTouchStart={(event) => {
            touchY.current = event.touches[0]?.clientY ?? 0;
          }}
          onTouchEnd={(event) => {
            const end = event.changedTouches[0]?.clientY ?? touchY.current;
            const delta = end - touchY.current;
            if (delta > 48) handleClose();
            else if (delta < -48) setExpanded(true);
          }}
        />
        <header className="sheet-head">
          <p className="eyebrow sheet-ref">
            {formatNumber(sura)}:{formatNumber(verse.v)}:{formatNumber(word.n)}
          </p>
          <button
            type="button"
            className="icon-button"
            onClick={handleClose}
            aria-label={t.sheet.closeAria}
          >
            <CloseIcon />
          </button>
        </header>
      <p className="sheet-word" dir="rtl" lang="ar">
        {word.a}
      </p>
      <div className="chips" dir="rtl">
        {word.s.map((segment, index) => (
          <button
            key={`${segment.a}-${index}`}
            type="button"
            className={`chip kind-${segment.k}${segment === selected ? " is-on" : ""}`}
            onClick={() => onSelectSegment(index)}
          >
            <b lang="ar">{segment.a}</b>
            <small lang="ar">{kindGloss(segment.k, locale).name}</small>
          </button>
        ))}
      </div>

      <section>
        <h3 className="sheet-section-label">{t.sheet.corpusMorphology}</h3>
        <p className="source-line">
          {t.common.corpusSource} ·{" "}
          <a href="https://corpus.quran.com/" target="_blank" rel="noreferrer">
            corpus.quran.com
          </a>
        </p>
        <dl className="facts">
          <div>
            <dt>{t.sheet.partOfSpeech}</dt>
            <dd>
              <strong className="fact-metric" lang="ar" dir="rtl">{posGloss(selected.p, locale).name}</strong>
              <span>{posGloss(selected.p, locale).about}</span>
            </dd>
          </div>
          {selected.r ? (
            <div>
            <dt>{t.sheet.root}</dt>
            <dd>
              <strong className="fact-metric" lang="ar">{spaceLetters(selected.ra || selected.r)}</strong>
              <span className="translit">{selected.r}</span>
              <button type="button" className="text-button" onClick={() => onSearchRoot(selected.ra || selected.r || "")}>
                {t.sheet.searchThisRoot}
              </button>
            </dd>
            </div>
          ) : null}
          {selected.l ? (
            <div>
            <dt>{t.sheet.lemma}</dt>
            <dd>
              <strong className="fact-metric" lang="ar">{selected.la}</strong>
              {selected.g ? <span>{selected.g}</span> : null}
              <span className="translit">{selected.l}</span>
              <button type="button" className="text-button" onClick={() => onSearchLemma(selected.l || "")}>
                {t.sheet.searchThisLemma}
              </button>
            </dd>
            </div>
          ) : null}
          {featureLines(selected.f ?? {}, locale).map((line) => (
            <div key={line.key}>
              <dt>{line.label}</dt>
              <dd>
                <strong className="fact-metric" lang="ar" dir="rtl">{line.name}</strong>
                <span>{line.about}</span>
              </dd>
            </div>
          ))}
        </dl>
        {selected.p === "V" && !selected.f?.form ? (
          <p className="hint">{t.sheet.basePatternHint}</p>
        ) : null}
        {implied.length ? (
          <ul className="implied">
            {implied.map((item, index) => (
              <li key={`${item.rel}-${index}`}>
                <span lang="ar" dir="rtl">{t.sheet.impliedEstimated} {item.arabic} · {relationGloss(item.rel, locale).name}</span> {relationGloss(item.rel, locale).about}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {word.i ? (
        <section>
          <h3 className="sheet-section-label">{t.sheet.classicalIrab}</h3>
          <p className="source-line">
            {t.common.tafsirCenterSource} ·{" "}
            <a href="https://tafsir.net/" target="_blank" rel="noreferrer">
              tafsir.net
            </a>
          </p>
          <p className="prose irab-prose sheet-metric-prose" dir="rtl" lang="ar">
            {formatWordIrabText(word.i)}
          </p>
        </section>
      ) : null}
      {word.sf ? (
        <section>
          <h3 className="sheet-section-label">{t.sheet.sarf}</h3>
          <p className="source-line">
            {t.common.tafsirCenterSource} ·{" "}
            <a href="https://tafsir.net/" target="_blank" rel="noreferrer">
              tafsir.net
            </a>
          </p>
          <p className="prose irab-prose sheet-metric-prose" dir="rtl" lang="ar">
            {formatIrabText(word.sf)}
          </p>
        </section>
      ) : null}
      {word.m ? (
        <section>
          <h3 className="sheet-section-label">{t.sheet.wordMeaning}</h3>
          <p className="prose sheet-metric-prose" dir="rtl" lang="ar">
            {word.m}
          </p>
        </section>
      ) : null}
      </aside>
    </div>
  );
}

function impliedDependents(graphs: SyntaxGraph[], sura: number, verse: number, word: number) {
  const found: { arabic: string; rel: string }[] = [];
  for (const graph of graphs) {
    graph.edges.forEach((edge) => {
      const dependent = graph.nodes[edge.d];
      const head = graph.nodes[edge.h];
      if (
        dependent?.t === "elide" &&
        head?.s === sura &&
        head.v === verse &&
        head.w === word
      ) {
        const arabic = dependent.a || "—";
        if (!found.some((item) => item.arabic === arabic && item.rel === edge.r)) {
          found.push({ arabic, rel: edge.r });
        }
      }
    });
  }
  return found;
}
