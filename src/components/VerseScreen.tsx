import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { loadSurah, loadVerseTranslation } from "../lib/api";
import { useI18n } from "../lib/i18n/I18nContext";
import { normalizeDigits } from "../lib/i18n/format";
import { formatIrabText } from "../lib/formatIrab";
import type { Manifest, SurahFile, Verse } from "../lib/types";
import { useRhetoric } from "../lib/rhetoric";
import { DependencyTree } from "./DependencyTree";
import { WordSheet } from "./WordSheet";

interface Props {
  manifest: Manifest;
  sura: number;
  verseNumber: number;
  wordNumber?: number;
  onNavigate: (sura: number, verse: number, word?: number) => void;
  onSearchRoot: (root: string) => void;
  onSearchLemma: (lemma: string) => void;
}

export function VerseScreen({
  manifest,
  sura,
  verseNumber,
  wordNumber,
  onNavigate,
  onSearchRoot,
  onSearchLemma,
}: Props) {
  const { t } = useI18n();
  const [file, setFile] = useState<SurahFile | null>(null);
  const [error, setError] = useState("");
  const [jump, setJump] = useState(`${sura}:${verseNumber}`);
  const [segment, setSegment] = useState<number | undefined>(undefined);

  useEffect(() => {
    let cancel = false;
    setError("");
    loadSurah(sura)
      .then((next) => {
        if (!cancel) setFile(next);
      })
      .catch((reason: unknown) => {
        if (!cancel) setError(reason instanceof Error ? reason.message : "Could not load this surah.");
      });
    return () => {
      cancel = true;
    };
  }, [sura]);

  useEffect(() => {
    setJump(`${sura}:${verseNumber}`);
    setSegment(undefined);
  }, [sura, verseNumber, wordNumber]);

  const unit = manifest.units.find((item) => item.n === sura);
  const verse = file?.verses.find((item) => item.v === verseNumber) ?? null;
  const word = verse?.w.find((item) => item.n === wordNumber);

  const goJump = (event: FormEvent) => {
    event.preventDefault();
    const raw = normalizeDigits(jump).trim();
    const match = raw.match(/^(\d{1,3})\s*[:\u061b]\s*(\d{1,3})$/);
    if (!match) return;
    onNavigate(Number(match[1]), Number(match[2]));
  };

  const step = useCallback(
    (delta: number) => {
      if (!unit || !file) return;
      let nextVerse = verseNumber + delta;
      let nextSura = sura;
      if (nextVerse < 1) {
        nextSura = sura === 1 ? 114 : sura - 1;
        nextVerse = manifest.units.find((item) => item.n === nextSura)?.verses ?? 1;
      } else if (nextVerse > unit.verses) {
        nextSura = sura === 114 ? 1 : sura + 1;
        nextVerse = 1;
      }
      onNavigate(nextSura, nextVerse);
    },
    [file, manifest.units, onNavigate, sura, unit, verseNumber],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.key === "ArrowLeft") step(1);
      if (event.key === "ArrowRight") step(-1);
      if (event.key === "Escape") onNavigate(sura, verseNumber);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNavigate, step, sura, verseNumber]);

  return (
    <div className={`stage${word ? " has-sheet" : ""}`}>
      <div className="reading">
        <div className="verse-toolbar">
          <button type="button" onClick={() => step(-1)} aria-label={t.common.previous}>
            {t.common.previous}
          </button>
          <form onSubmit={goJump}>
            <label>
              {t.common.verse}
              <input
                value={jump}
                onChange={(event) => setJump(event.target.value)}
                inputMode="numeric"
                aria-label={t.common.chapterAndVerse}
              />
            </label>
            <button type="submit">{t.common.open}</button>
          </form>
          <button type="button" onClick={() => step(1)} aria-label={t.common.next}>
            {t.common.next}
          </button>
        </div>

        {error ? (
          <p className="banner error">{error}</p>
        ) : !verse || !unit ? (
          <div className="skeleton" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        ) : (
          <div key={`${sura}-${verseNumber}`} className="anim-soft-enter">
            <VerseBody
              unitName={unit.name}
              phonetic={unit.phonetic}
              title={unit.title}
              revelation={unit.rev}
              sura={sura}
              verse={verse}
              selected={word?.n}
              selectedSegment={segment}
              onSelect={(wordIndex, segmentIndex) => {
                setSegment(segmentIndex);
                onNavigate(sura, verse.v, wordIndex);
              }}
            />
          </div>
        )}
      </div>
      {verse && word ? (
        <WordSheet
          sura={sura}
          verse={verse}
          word={word}
          segmentIndex={segment}
          onSelectSegment={setSegment}
          onClose={() => onNavigate(sura, verse.v)}
          onSearchRoot={onSearchRoot}
          onSearchLemma={onSearchLemma}
        />
      ) : null}
    </div>
  );
}

function VerseBody({
  unitName,
  phonetic,
  revelation,
  sura,
  verse,
  selected,
  selectedSegment,
  onSelect,
}: {
  unitName: string;
  phonetic: string;
  title: string;
  revelation: string;
  sura: number;
  verse: Verse;
  selected?: number;
  selectedSegment?: number;
  onSelect: (word: number, segment?: number) => void;
}) {
  const { locale, t, formatNumber } = useI18n();
  const graphs = verse.g ?? [];
  const frozen = selected !== undefined;
  const narrow = useNarrow();
  const [clauseIndex, setClauseIndex] = useState(0);
  const [clauseEdgeHint, setClauseEdgeHint] = useState("");
  const [irabOpen, setIrabOpen] = useState(locale === "ar");
  const membership = useMemo(() => clauseMembership(graphs, sura, verse.v), [graphs, sura, verse.v]);
  const segments = useMemo(() => groupWords(verse.w, membership), [verse.w, membership]);
  useEffect(() => {
    setClauseIndex(0);
    setClauseEdgeHint("");
    setIrabOpen(locale === "ar");
  }, [sura, verse.v, locale]);
  useEffect(() => {
    if (!clauseEdgeHint) return;
    const timer = window.setTimeout(() => setClauseEdgeHint(""), 2200);
    return () => window.clearTimeout(timer);
  }, [clauseEdgeHint]);
  const show = narrow ? graphs.filter((_, index) => index === clauseIndex) : graphs;
  const openClause = (index: number) => {
    setClauseIndex(index);
    setClauseEdgeHint("");
    if (!narrow) document.getElementById(`clause-${index}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const stepClause = (delta: number) => {
    const next = clauseIndex + delta;
    if (next < 0) {
      setClauseEdgeHint(t.verse.firstClause);
      return;
    }
    if (next >= graphs.length) {
      setClauseEdgeHint(t.verse.lastClause);
      return;
    }
    openClause(next);
  };
  const { entries: rhetoricEntries } = useRhetoric();
  const rhetoricEntry = useMemo(
    () => rhetoricEntries.find((e) => e.sura === sura && e.verse === verse.v),
    [rhetoricEntries, sura, verse.v],
  );
  const hasBalagha = Boolean(rhetoricEntry);

  const [fetchedTranslation, setFetchedTranslation] = useState<string>("");

  useEffect(() => {
    if (locale === "ar") {
      setFetchedTranslation("");
      return;
    }
    const key = locale === "id" ? "indonesian_sabiq" : "english_saheeh";
    const preloaded = locale === "id" ? rhetoricEntry?.indonesianAyah : rhetoricEntry?.englishAyah;
    if (preloaded) {
      setFetchedTranslation(preloaded);
      return;
    }
    let cancelled = false;
    loadVerseTranslation(key, sura, verse.v).then((text) => {
      if (!cancelled) setFetchedTranslation(text);
    });
    return () => {
      cancelled = true;
    };
  }, [locale, sura, verse.v, rhetoricEntry]);
  return (
    <>
      <header className="verse-title">
        <div className="verse-title-header-row">
          <h1>
            <span lang="ar">{unitName}</span>
            <small>
              {revelation === "Madinah" ? t.verse.madinan : t.verse.meccan} · {formatNumber(sura)}:{formatNumber(verse.v)} · {phonetic}
            </small>
          </h1>
          {hasBalagha && (
            <a
              href={`#/rhetoric/${sura}/${verse.v}`}
              className="verse-balagha-deep-link"
              title="Open Rhetoric Studio for this verse"
            >
              <span className="verse-balagha-icon">بلاغة</span> · Rhetoric Studio ↗
            </a>
          )}
        </div>
      </header>
      <p className="verse-line" dir="rtl" lang="ar">
        {segments.map((segment) =>
          segment.clause === null ? (
            segment.words.map((word) => (
              <button key={word.n} type="button" className={selected === word.n ? "is-on" : ""} onClick={() => onSelect(word.n)}>
                {word.a}
              </button>
            ))
          ) : (
            <span key={segment.words[0].n} className={`verse-span${segment.clause === clauseIndex ? " is-current" : ""}`}>
              {segment.words.map((word) => (
                <button
                  key={word.n}
                  type="button"
                  className={selected === word.n ? "is-on" : ""}
                  onClick={() => {
                    onSelect(word.n);
                    openClause(segment.clause as number);
                  }}
                >
                  {word.a}
                </button>
              ))}
            </span>
          ),
        )}
        <span className="ayah-mark">{formatNumber(verse.v)}</span>
      </p>
      <p className="source-line">
        {t.common.tanzilSource} ·{" "}
        <a href="https://tanzil.net/" target="_blank" rel="noreferrer">
          tanzil.net
        </a>
      </p>

      {/* Combined Single Language Tab: Meaning & Commentary */}
      <details className="mukhtasar verse-meaning-block" open>
        <summary>
          <span>{t.verse.verseMeaningTitle}</span>
          <small>{t.verse.verseMeaningSub} · QuranEnc</small>
        </summary>

        {/* 1. English Mode: Saheeh International literal translation + English Al-Mukhtasar */}
        {locale === "en" && (
          <div className="verse-meaning-content">
            {fetchedTranslation && (
              <div className="verse-meaning-section is-translation">
                <div className="verse-meaning-section-header">
                  <span className="verse-meaning-badge">{t.verse.translationBadge}</span>
                  <small className="source-line">
                    Saheeh International ·{" "}
                    <a href="https://quranenc.com/en/browse/english_saheeh" target="_blank" rel="noreferrer">
                      quranenc.com
                    </a>
                  </small>
                </div>
                <p className="verse-meaning-text" lang="en" dir="ltr">
                  {fetchedTranslation}
                </p>
              </div>
            )}

            {verse.en && (
              <div className="verse-meaning-section is-tafsir">
                <div className="verse-meaning-section-header">
                  <span className="verse-meaning-badge">{t.verse.tafsirBadge}</span>
                  <small className="source-line">
                    Tafsir Center ·{" "}
                    <a href="https://quranenc.com/en/browse/english_mokhtasar" target="_blank" rel="noreferrer">
                      quranenc.com
                    </a>
                  </small>
                </div>
                <p className="verse-meaning-prose" lang="en" dir="ltr">
                  {verse.en}
                </p>
                {verse.ef && (
                  <p className="mukhtasar-note" lang="en" dir="ltr">
                    {verse.ef}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2. Indonesian Mode: PT. Sabiq direct translation + Indonesian Al-Mukhtasar */}
        {locale === "id" && (
          <div className="verse-meaning-content">
            {fetchedTranslation && (
              <div className="verse-meaning-section is-translation">
                <div className="verse-meaning-section-header">
                  <span className="verse-meaning-badge">{t.verse.translationBadge}</span>
                  <small className="source-line">
                    Terjemahan Sabiq (PT. Sabiq) ·{" "}
                    <a href="https://quranenc.com/en/browse/indonesian_sabiq" target="_blank" rel="noreferrer">
                      quranenc.com
                    </a>
                  </small>
                </div>
                <p className="verse-meaning-text" lang="id" dir="ltr">
                  {fetchedTranslation}
                </p>
              </div>
            )}

            {verse.mk && (
              <div className="verse-meaning-section is-tafsir">
                <div className="verse-meaning-section-header">
                  <span className="verse-meaning-badge">{t.verse.tafsirBadge}</span>
                  <small className="source-line">
                    Pusat Tafsir ·{" "}
                    <a href="https://quranenc.com/en/browse/indonesian_mokhtasar" target="_blank" rel="noreferrer">
                      quranenc.com
                    </a>
                  </small>
                </div>
                <p className="verse-meaning-prose" lang="id" dir="ltr">
                  {verse.mk}
                </p>
                {verse.mf && (
                  <p className="mukhtasar-note" lang="id" dir="ltr">
                    {verse.mf}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. Arabic Mode: Just Arabic Al-Mukhtasar (no translation needed) */}
        {locale === "ar" && (
          <div className="verse-meaning-content">
            {verse.ma && (
              <div className="verse-meaning-section is-tafsir">
                <p className="prose-ar" lang="ar" dir="rtl">
                  {verse.ma}
                </p>
                {verse.af && (
                  <p className="mukhtasar-note" lang="ar" dir="rtl">
                    {verse.af}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </details>

      {verse.ir ? (
        <details className="irab-block" open={irabOpen} onToggle={(event) => setIrabOpen(event.currentTarget.open)}>
          <summary>{t.verse.irabTitle}</summary>
          <p className="source-line">
            {t.common.tafsirCenterSource} ·{" "}
            <a href="https://tafsir.net/" target="_blank" rel="noreferrer">
              tafsir.net
            </a>
          </p>
          <div className="prose irab-prose" dir="rtl" lang="ar">
            {formatIrabText(verse.ir)}
          </div>
        </details>
      ) : null}

      {graphs.length ? (
        <>
          {graphs.length > 1 ? (
            <div className="tree-tools">
              <nav className="clause-outline" dir="rtl" aria-label="Clauses">
                {graphs.map((_, index) => (
                  <button key={index} type="button" className={index === clauseIndex ? "is-on" : ""} onClick={() => openClause(index)}>
                    {formatNumber(index + 1)}
                  </button>
                ))}
              </nav>
            </div>
          ) : null}
          {show.map((graph) => {
            const index = graphs.indexOf(graph);
            return (
              <DependencyTree
                key={index}
                graph={graph}
                index={index}
                total={graphs.length}
                sura={sura}
                verse={verse.v}
                words={verse.w}
                selectedWord={selected}
                selectedSegment={selectedSegment}
                frozen={frozen}
                current={index === clauseIndex}
                onSelectWord={(nextSura, nextVerse, word, segmentIndex) => {
                  if (nextSura === sura && nextVerse === verse.v) onSelect(word, segmentIndex);
                  else window.location.hash = `#/${nextSura}/${nextVerse}/${word}`;
                }}
              />
            );
          })}
          {narrow && graphs.length > 1 ? (
            <div className="clause-stepper">
              <button type="button" onClick={() => stepClause(-1)} aria-label={t.common.previous}>
                {t.common.previous}
              </button>
              <span className={clauseEdgeHint ? "is-edge-hint" : ""} role="status">
                {clauseEdgeHint || t.verse.clauseCount(clauseIndex, graphs.length)}
              </span>
              <button type="button" onClick={() => stepClause(1)} aria-label={t.common.next}>
                {t.common.next}
              </button>
              {verse.ir ? (
                <button type="button" onClick={() => setIrabOpen((value) => !value)}>{t.verse.classicalIrabShort}</button>
              ) : null}
            </div>
          ) : null}
        </>
      ) : (
        <div className="banner">
          <strong>{t.verse.noTreeTitle}</strong>
        </div>
      )}
    </>
  );
}

function useNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 720px)");
    const apply = () => setNarrow(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
  return narrow;
}

function clauseMembership(graphs: NonNullable<Verse["g"]>, sura: number, verse: number) {
  const membership = new Map<number, number>();
  graphs.forEach((graph, index) => {
    for (const node of graph.nodes) {
      if (node.s === sura && node.v === verse && node.w && !membership.has(node.w)) membership.set(node.w, index);
    }
  });
  return membership;
}

function groupWords(words: Verse["w"], membership: Map<number, number>) {
  const segments: { clause: number | null; words: Verse["w"] }[] = [];
  for (const word of words) {
    const clause = membership.get(word.n) ?? null;
    const last = segments[segments.length - 1];
    if (last && last.clause === clause) last.words.push(word);
    else segments.push({ clause, words: [word] });
  }
  return segments;
}
