import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { loadSurah } from "../lib/api";
import { useI18n } from "../lib/i18n/I18nContext";
import { normalizeDigits } from "../lib/i18n/format";
import type { Manifest, SurahFile, Verse } from "../lib/types";
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
          <VerseBody
            unitName={unit.name}
            phonetic={unit.phonetic}
            title={unit.title}
            revelation={unit.rev}
            sura={sura}
            verse={verse}
            syntaxVerses={unit.syntax}
            verseCount={unit.verses}
            selected={word?.n}
            selectedSegment={segment}
            onSelect={(wordIndex, segmentIndex) => {
              setSegment(segmentIndex);
              onNavigate(sura, verse.v, wordIndex);
            }}
          />
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
  syntaxVerses,
  verseCount,
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
  syntaxVerses: number;
  verseCount: number;
  selected?: number;
  selectedSegment?: number;
  onSelect: (word: number, segment?: number) => void;
}) {
  const { locale, t, formatNumber } = useI18n();
  const graphs = verse.g ?? [];
  const frozen = selected !== undefined;
  const narrow = useNarrow();
  const [zoom, setZoom] = useState(1);
  const [clauseIndex, setClauseIndex] = useState(0);
  const [irabOpen, setIrabOpen] = useState(locale === "ar");
  const membership = useMemo(() => clauseMembership(graphs, sura, verse.v), [graphs, sura, verse.v]);
  const segments = useMemo(() => groupWords(verse.w, membership), [verse.w, membership]);
  useEffect(() => {
    setClauseIndex(0);
    setZoom(1);
    setIrabOpen(locale === "ar");
  }, [sura, verse.v, locale]);
  const show = narrow ? graphs.filter((_, index) => index === clauseIndex) : graphs;
  const openClause = (index: number) => {
    setClauseIndex(index);
    if (!narrow) document.getElementById(`clause-${index}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <>
      <header className="verse-title">
        <p className="eyebrow">
          {revelation === "Madinah" ? t.verse.madinan : t.verse.meccan} · {phonetic}
        </p>
        <h1>
          <span lang="ar">{unitName}</span>
          <small>
            {formatNumber(sura)}:{formatNumber(verse.v)} · {phonetic}
          </small>
        </h1>
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
      <p className="source-line">{t.verse.arabicTextAttribution}</p>

      {/* Tafsir sections prioritized by active locale */}
      {(() => {
        const mukhtasars = [
          {
            key: "ar",
            text: verse.ma,
            note: verse.af,
            lang: "ar",
            dir: "rtl" as const,
            title: t.verse.mukhtasarArTitle,
            sub: t.verse.mukhtasarArSub,
            className: "prose-ar",
          },
          {
            key: "en",
            text: verse.en,
            note: verse.ef,
            lang: "en",
            dir: "ltr" as const,
            title: t.verse.mukhtasarEnTitle,
            sub: t.verse.mukhtasarEnSub,
          },
          {
            key: "id",
            text: verse.mk,
            note: verse.mf,
            lang: "id",
            dir: "ltr" as const,
            title: t.verse.mukhtasarIdTitle,
            sub: t.verse.mukhtasarIdSub,
          },
        ];
        const ordered = [
          ...mukhtasars.filter((m) => m.key === locale),
          ...mukhtasars.filter((m) => m.key !== locale),
        ];
        return ordered.map((m) =>
          m.text ? (
            <details key={m.key} className="mukhtasar" open={locale === m.key}>
              <summary>
                <span>{m.title}</span>
                <small>{m.sub}</small>
              </summary>
              <p lang={m.lang} dir={m.dir} className={m.className}>
                {m.text}
              </p>
              {m.note ? (
                <p className="mukhtasar-note" lang={m.lang} dir={m.dir}>
                  {m.note}
                </p>
              ) : null}
            </details>
          ) : null,
        );
      })()}

      {verse.ir ? (
        <details className="irab-block" open={irabOpen} onToggle={(event) => setIrabOpen(event.currentTarget.open)}>
          <summary>{t.verse.irabTitle}</summary>
          <p className="source-line">{t.verse.irabAttribution}</p>
          <div className="prose" dir="rtl" lang="ar">
            {verse.ir}
          </div>
        </details>
      ) : null}

      {graphs.length ? (
        <>
          <div className="tree-tools">
            {graphs.length > 1 ? (
              <nav className="clause-outline" dir="rtl" aria-label="Clauses">
                {graphs.map((_, index) => (
                  <button key={index} type="button" className={index === clauseIndex ? "is-on" : ""} onClick={() => openClause(index)}>
                    {formatNumber(index + 1)}
                  </button>
                ))}
              </nav>
            ) : null}
            <div className="zoom-controls" dir="ltr">
              <button type="button" aria-label={t.verse.zoomOutAria} onClick={() => setZoom((value) => Math.max(1, value / 1.2))}>−</button>
              <button type="button" onClick={() => setZoom(1)}>{t.verse.fitZoom}</button>
              <button type="button" aria-label={t.verse.zoomInAria} onClick={() => setZoom((value) => Math.min(4, value * 1.2))}>+</button>
            </div>
          </div>
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
                zoom={zoom}
                current={index === clauseIndex}
                onZoom={setZoom}
                onSelectWord={(nextSura, nextVerse, word, segmentIndex) => {
                  if (nextSura === sura && nextVerse === verse.v) onSelect(word, segmentIndex);
                  else window.location.hash = `#/${nextSura}/${nextVerse}/${word}`;
                }}
              />
            );
          })}
          {narrow && graphs.length > 1 ? (
            <div className="clause-stepper">
              <button type="button" onClick={() => setClauseIndex((value) => Math.max(0, value - 1))} disabled={clauseIndex === 0}>
                {t.common.previous}
              </button>
              <span>{t.verse.clauseCount(clauseIndex, graphs.length)}</span>
              <button type="button" onClick={() => setClauseIndex((value) => Math.min(graphs.length - 1, value + 1))} disabled={clauseIndex === graphs.length - 1}>
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
          <p>{t.verse.noTreeDesc(syntaxVerses, verseCount)}</p>
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
