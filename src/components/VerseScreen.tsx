import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { loadSurah } from "../lib/api";
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
    const match = jump.trim().match(/^(\d{1,3})\s*:\s*(\d{1,3})$/);
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
          <button type="button" onClick={() => step(-1)} aria-label="Previous verse">
            Previous
          </button>
          <form onSubmit={goJump}>
            <label>
              Verse
              <input
                value={jump}
                onChange={(event) => setJump(event.target.value)}
                inputMode="numeric"
                aria-label="Chapter and verse"
              />
            </label>
            <button type="submit">Open</button>
          </form>
          <button type="button" onClick={() => step(1)} aria-label="Next verse">
            Next
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
  title,
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
  const graphs = verse.g ?? [];
  const frozen = selected !== undefined;
  const narrow = useNarrow();
  const [zoom, setZoom] = useState(1);
  const [clauseIndex, setClauseIndex] = useState(0);
  const [irabOpen, setIrabOpen] = useState(false);
  const membership = useMemo(() => clauseMembership(graphs, sura, verse.v), [graphs, sura, verse.v]);
  const segments = useMemo(() => groupWords(verse.w, membership), [verse.w, membership]);
  useEffect(() => {
    setClauseIndex(0);
    setZoom(1);
    setIrabOpen(false);
  }, [sura, verse.v]);
  const show = narrow ? graphs.filter((_, index) => index === clauseIndex) : graphs;
  const openClause = (index: number) => {
    setClauseIndex(index);
    if (!narrow) document.getElementById(`clause-${index}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <>
      <header className="verse-title">
        <p className="eyebrow">
          {revelation === "Madinah" ? "Madinan" : "Meccan"} · {phonetic}
        </p>
        <h1>
          <span lang="ar">{unitName}</span>
          <small>
            {sura}:{verse.v} · {title}
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
        <span className="ayah-mark">{verse.v}</span>
      </p>
      <p className="source-line">Arabic text from Tanzil, CC BY-ND 3.0, unchanged.</p>
      <details className="mukhtasar">
        <summary>
          <span>Al-Mukhtasar</span>
          <small>English · Tafsir Center for Quranic Studies · QuranEnc.com</small>
        </summary>
        <p lang="en" dir="ltr">
          {verse.en}
        </p>
        {verse.ef ? <p className="mukhtasar-note" lang="en" dir="ltr">{verse.ef}</p> : null}
      </details>
      {verse.mk ? (
        <details className="mukhtasar">
          <summary>
            <span>Al-Mukhtasar</span>
            <small>الإندونيسية · Tafsir Center for Quranic Studies · QuranEnc.com · V1.0.0</small>
          </summary>
          <p lang="id" dir="ltr">
            {verse.mk}
          </p>
          {verse.mf ? <p className="mukhtasar-note" lang="id" dir="ltr">{verse.mf}</p> : null}
        </details>
      ) : null}
      {verse.ir ? (
        <details className="irab-block" open={irabOpen} onToggle={(event) => setIrabOpen(event.currentTarget.open)}>
          <summary>إعراب الجملة</summary>
          <p className="source-line">Tafsir Center for Quranic Studies, CC BY 4.0. A second analysis, beside the corpus tree.</p>
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
                    {index + 1}
                  </button>
                ))}
              </nav>
            ) : null}
            <div className="zoom-controls" dir="ltr">
              <button type="button" aria-label="تصغير" onClick={() => setZoom((value) => Math.max(1, value / 1.2))}>−</button>
              <button type="button" onClick={() => setZoom(1)}>ملاءمة</button>
              <button type="button" aria-label="تكبير" onClick={() => setZoom((value) => Math.min(4, value * 1.2))}>+</button>
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
            <div className="clause-stepper" dir="rtl">
              <button type="button" onClick={() => setClauseIndex((value) => Math.max(0, value - 1))} disabled={clauseIndex === 0}>
                السابق
              </button>
              <span>الجملة {clauseIndex + 1} من {graphs.length}</span>
              <button type="button" onClick={() => setClauseIndex((value) => Math.min(graphs.length - 1, value + 1))} disabled={clauseIndex === graphs.length - 1}>
                التالي
              </button>
              {verse.ir ? (
                <button type="button" onClick={() => setIrabOpen((value) => !value)}>إعراب</button>
              ) : null}
            </div>
          ) : null}
        </>
      ) : (
        <div className="banner">
          <strong>No dependency tree for this verse.</strong>
          <p>
            The Quranic Arabic Corpus treebank in this edition covers {syntaxVerses === 0 ? "none of" : `${syntaxVerses} of ${verseCount} verses in`} this surah.
            Morphology and the classical iʿrāb below are still available. Annotated chapters are 1–8, part of 9, and 59–114.
          </p>
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
