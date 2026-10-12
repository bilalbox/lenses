import { useEffect, useMemo, useState } from "react";
import { loadVerses, loadWordIndex } from "../lib/api";
import { stripDiacritics } from "../lib/arabic";
import { FORMS, POS, RELATIONS, type Gloss, relationGloss } from "../lib/glossary";
import { countExamples, exampleFacets, featureSummary, searchExamples, type ExampleQuery } from "../lib/search";
import type { VerseRow, WordIndex } from "../lib/types";

const empty: ExampleQuery = { root: "", lemma: "", pos: "", form: "", relation: "" };

const presets: { label: string; query: ExampleQuery }[] = [
  { label: "استفهام هل", query: { ...empty, lemma: "hal", pos: "INTG" } },
  { label: "أَفْعَلَ من نزل", query: { ...empty, root: "نزل", pos: "V", form: "IV" } },
  { label: "فَعَّلَ من علم", query: { ...empty, root: "علم", pos: "V", form: "II" } },
  { label: "فاعل", query: { ...empty, relation: "subj" } },
  { label: "حال", query: { ...empty, relation: "circ" } },
];

interface Props {
  initial?: Partial<ExampleQuery>;
  onOpen: (sura: number, verse: number, word: number) => void;
}

export function ExampleSearch({ initial, onOpen }: Props) {
  const [index, setIndex] = useState<WordIndex | null>(null);
  const [verses, setVerses] = useState<VerseRow[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState<ExampleQuery>({ ...empty, ...initial });
  const [limit, setLimit] = useState(40);

  useEffect(() => {
    if (initial) setQuery({ ...empty, ...initial });
  }, [initial]);

  useEffect(() => {
    loadWordIndex()
      .then(setIndex)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load the index."));
    loadVerses().then(setVerses).catch(() => setVerses(null));
  }, []);

  const active = Boolean(query.root || query.lemma || query.pos || query.form || query.relation);
  const total = useMemo(() => (index && active ? countExamples(index, query) : 0), [index, query, active]);
  const facets = useMemo(() => (index && active ? exampleFacets(index, query) : { lemmas: [], forms: [] }), [index, query, active]);
  const verseOf = useMemo(() => {
    const map = new Map<string, string>();
    verses?.forEach((row) => map.set(`${row[0]}:${row[1]}`, row[2]));
    return map;
  }, [verses]);

  const hits = useMemo(() => (index && active ? searchExamples(index, query, limit) : []), [index, query, limit, active]);
  const set = (patch: Partial<ExampleQuery>) => {
    setLimit(40);
    setQuery((current) => ({ ...current, ...patch }));
  };

  return (
    <div className="search-page">
      <header className="page-intro">
        <p className="eyebrow">Example search</p>
        <h1>Find the pattern</h1>
        <p className="search-lead">
          Search the corpus by root, lemma, part of speech, verb form, or the syntactic relation the word fills. Results open the verse, with its tree when the treebank includes it.
        </p>
      </header>
      <div className="presets" dir="rtl" lang="ar">
        {presets.map((preset) => (
          <button key={preset.label} type="button" onClick={() => set(preset.query)}>
            {preset.label}
          </button>
        ))}
      </div>
      <form
        className="filters"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <label>
          Root
          <input value={query.root} onChange={(event) => set({ root: event.target.value })} placeholder="علم or Elm" />
        </label>
        <label>
          Lemma
          <input value={query.lemma} onChange={(event) => set({ lemma: event.target.value })} placeholder="hal" />
        </label>
        <label>
          Part of speech
          <select dir="rtl" lang="ar" value={query.pos} onChange={(event) => set({ pos: event.target.value })}>
            <option value="">Any</option>
            {glossOptions(POS).map((option) => (
              <option key={option.value} value={option.value}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Verb form
          <select dir="rtl" lang="ar" value={query.form} onChange={(event) => set({ form: event.target.value })}>
            <option value="">Any</option>
            {Object.entries(FORMS).map(([form, gloss]) => (
              <option key={form} value={form}>
                {gloss.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Relation
          <select dir="rtl" lang="ar" value={query.relation} onChange={(event) => set({ relation: event.target.value })}>
            <option value="">Any</option>
            {glossOptions(RELATIONS).map((option) => (
              <option key={option.value} value={option.value}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
      </form>
      {error ? <p className="banner error">{error}</p> : null}
      {!index && !error ? (
        <div className="skeleton" aria-hidden="true">
          <span />
          <span />
        </div>
      ) : null}
      {index && !active ? <p className="hint">Choose a root, a lemma, a part of speech, a form, or a relation.</p> : null}
      {active ? (
        <>
          <p className="result-count">
            <strong>{total}</strong>
            <span>{total === 1 ? "word" : "words"}{total > hits.length ? ` · showing ${hits.length}` : ""}</span>
          </p>
          {facets.forms.length > 1 || facets.lemmas.length > 1 ? (
            <div className="facets" dir="rtl">
              {facets.forms.map((facet) => (
                <button key={facet.key} type="button" className={query.form === facet.key ? "is-on" : ""} onClick={() => set({ form: query.form === facet.key ? "" : facet.key })}>
                  <b lang="ar">{FORMS[facet.key]?.name ?? facet.label}</b>
                  <small>{facet.count}</small>
                </button>
              ))}
              {facets.lemmas.map((facet) => (
                <button key={facet.key} type="button" className={query.lemma === facet.key ? "is-on" : ""} onClick={() => set({ lemma: query.lemma === facet.key ? "" : facet.key })}>
                  <b lang="ar">{facet.label}</b>
                  <small>{facet.count}</small>
                </button>
              ))}
            </div>
          ) : null}
          {total === 0 ? <p className="hint">No words match this combination.</p> : null}
          <ol className="results">
            {hits.map((hit) => {
              const snippet = verseOf.get(`${hit.sura}:${hit.verse}`) ?? "";
              const needle = stripDiacritics(hit.arabic);
              return (
                <li key={`${hit.sura}:${hit.verse}:${hit.word}`}>
                  <button type="button" onClick={() => onOpen(hit.sura, hit.verse, hit.word)}>
                    <span className="loc">
                      {hit.sura}:{hit.verse}:{hit.word}
                    </span>
                    <span className="hit-ar" lang="ar" dir="rtl">
                      {hit.arabic}
                    </span>
                    <span className="hit-snippet" lang="ar" dir="rtl">
                      {markSnippet(snippet, needle)}
                    </span>
                    <span className="hit-meta">
                      <span dir="rtl" lang="ar">
                        {POS[hit.pos]?.name ?? hit.pos}
                        {featureSummary(hit.features) ? ` · ${featureSummary(hit.features)}` : ""}
                        {hit.relations.length
                          ? ` · ${[...new Set(hit.relations.map((code) => relationGloss(code).name))].join("، ")}`
                          : ""}
                      </span>
                      {hit.gloss ? ` · ${hit.gloss}` : ""}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          {hits.length < total ? (
            <button type="button" className="more" onClick={() => setLimit((value) => value + 40)}>
              Show more
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function glossOptions(table: Record<string, Gloss>) {
  const grouped = new Map<string, string[]>();
  for (const [code, gloss] of Object.entries(table)) {
    grouped.set(gloss.name, [...(grouped.get(gloss.name) ?? []), code]);
  }
  return [...grouped.entries()].map(([name, codes]) => ({ name, value: codes.join(",") }));
}

function markSnippet(text: string, needle: string) {
  if (!text || needle.length < 1) return text;
  const at = text.indexOf(needle);
  if (at < 0) return text;
  const from = Math.max(0, at - 18);
  const to = Math.min(text.length, at + needle.length + 18);
  const slice = text.slice(from, to);
  const start = at - from;
  return (
    <>
      {from > 0 ? "…" : ""}
      {slice.slice(0, start)}
      <mark>{slice.slice(start, start + needle.length)}</mark>
      {slice.slice(start + needle.length)}
      {to < text.length ? "…" : ""}
    </>
  );
}
