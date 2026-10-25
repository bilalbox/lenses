import { useEffect, useMemo, useState } from "react";
import { loadVerses, loadWordIndex } from "../lib/api";
import { stripDiacritics } from "../lib/arabic";
import { FORMS, POS, RELATIONS, formGloss, posGloss, relationGloss } from "../lib/glossary";
import type { Locale } from "../lib/i18n/types";
import { countExamples, exampleFacets, featureSummary, searchExamples, type ExampleQuery } from "../lib/search";
import { useI18n } from "../lib/i18n/I18nContext";
import { useRhetoric } from "../lib/rhetoric";
import type { VerseRow, WordIndex } from "../lib/types";

const empty: ExampleQuery = { root: "", lemma: "", pos: "", form: "", relation: "" };

interface FilterOption {
  name: string;
  value: string;
  about: string;
}

interface Props {
  initial?: Partial<ExampleQuery>;
  onOpen: (sura: number, verse: number, word: number) => void;
}

export function ExampleSearch({ initial, onOpen }: Props) {
  const { locale, t, formatNumber } = useI18n();
  const { entries: rhetoricEntries } = useRhetoric();
  const [index, setIndex] = useState<WordIndex | null>(null);
  const [verses, setVerses] = useState<VerseRow[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState<ExampleQuery>({ ...empty, ...initial });
  const [limit, setLimit] = useState(40);

  const presets = useMemo(
    () => [
      { label: t.examples.presetHal, query: { ...empty, lemma: "hal", pos: "INTG" } },
      { label: t.examples.presetAfala, query: { ...empty, root: "نزل", pos: "V", form: "IV" } },
      { label: t.examples.presetFaala, query: { ...empty, root: "علم", pos: "V", form: "II" } },
      { label: t.examples.presetFail, query: { ...empty, relation: "subj" } },
      { label: t.examples.presetHalState, query: { ...empty, relation: "circ" } },
    ],
    [t],
  );

  const posOptions = useMemo(() => glossOptions(POS, locale, posGloss), [locale]);
  const formOptions = useMemo(
    () =>
      Object.entries(FORMS).map(([value, gloss]) => ({
        name: gloss.name,
        value,
        about: formGloss(value, locale).about,
      })),
    [locale],
  );
  const relationOptions = useMemo(() => glossOptions(RELATIONS, locale, relationGloss), [locale]);

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

  const pickFilter = (key: "pos" | "form" | "relation", value: string) => {
    set({ [key]: value === "" || query[key] === value ? "" : value });
  };

  return (
    <div className="search-page anim-soft-enter">
      <header className="page-intro">
        <p className="eyebrow">{t.examples.eyebrow}</p>
        <h1>{t.examples.pageTitle}</h1>
        <p className="search-lead">{t.examples.lead}</p>
      </header>
      <div className="presets" dir="rtl" lang="ar">
        {presets.map((preset) => (
          <button key={preset.label} type="button" onClick={() => set(preset.query)}>
            {preset.label}
          </button>
        ))}
        <a href="#/rhetoric" className="preset-rhetoric-chip">
          شواهد البلاغة (تشبيه / حذف) ↗
        </a>
      </div>
      <form
        className="filters"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <label className="filter-text">
          {t.examples.filterRoot}
          <input value={query.root} onChange={(event) => set({ root: event.target.value })} placeholder="علم or Elm" />
        </label>
        <label className="filter-text">
          {t.examples.filterLemma}
          <input value={query.lemma} onChange={(event) => set({ lemma: event.target.value })} placeholder="hal" />
        </label>

        <FilterCardField
          label={t.examples.filterPos}
          anyLabel={t.examples.anyOption}
          options={posOptions}
          value={query.pos}
          onPick={(value) => pickFilter("pos", value)}
        />
        <FilterCardField
          label={t.examples.filterForm}
          anyLabel={t.examples.anyOption}
          options={formOptions}
          value={query.form}
          onPick={(value) => pickFilter("form", value)}
        />
        <FilterCardField
          label={t.examples.filterRelation}
          anyLabel={t.examples.anyOption}
          options={relationOptions}
          value={query.relation}
          onPick={(value) => pickFilter("relation", value)}
        />
      </form>
      {error ? <p className="banner error">{error}</p> : null}
      {!index && !error ? (
        <div className="skeleton" aria-hidden="true">
          <span />
          <span />
        </div>
      ) : null}
      {index && !active ? <p className="hint">{t.examples.chooseCriteriaHint}</p> : null}
      {active ? (
        <>
          <p className="result-count">
            <strong>{formatNumber(total)}</strong>
            <span>{t.examples.wordsFound(total, hits.length)}</span>
          </p>
          {facets.forms.length > 1 || facets.lemmas.length > 1 ? (
            <div className="facets" dir="rtl">
              {facets.forms.map((facet) => (
                <button key={facet.key} type="button" className={query.form === facet.key ? "is-on" : ""} onClick={() => set({ form: query.form === facet.key ? "" : facet.key })}>
                  <b lang="ar">{FORMS[facet.key]?.name ?? facet.label}</b>
                  <small>{formatNumber(facet.count)}</small>
                </button>
              ))}
              {facets.lemmas.map((facet) => (
                <button key={facet.key} type="button" className={query.lemma === facet.key ? "is-on" : ""} onClick={() => set({ lemma: query.lemma === facet.key ? "" : facet.key })}>
                  <b lang="ar">{facet.label}</b>
                  <small>{formatNumber(facet.count)}</small>
                </button>
              ))}
            </div>
          ) : null}
          {total === 0 ? <p className="hint">{t.examples.noWordsMatch}</p> : null}
          <ol className="results">
            {hits.map((hit) => {
              const snippet = verseOf.get(`${hit.sura}:${hit.verse}`) ?? "";
              const needle = stripDiacritics(hit.arabic);
              const hasBalagha = rhetoricEntries.some((e) => e.sura === hit.sura && e.verse === hit.verse);
              return (
                <li key={`${hit.sura}:${hit.verse}:${hit.word}`}>
                  <button type="button" onClick={() => onOpen(hit.sura, hit.verse, hit.word)}>
                    <span className="loc">
                      {formatNumber(hit.sura)}:{formatNumber(hit.verse)}:{formatNumber(hit.word)}
                      {hasBalagha && <span className="loc-balagha-tag">بلاغة</span>}
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
                          ? ` · ${[...new Set(hit.relations.map((code) => relationGloss(code, locale).name))].join("، ")}`
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
              {t.examples.showMore}
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function FilterCardField({
  label,
  anyLabel,
  options,
  value,
  onPick,
}: {
  label: string;
  anyLabel: string;
  options: FilterOption[];
  value: string;
  onPick: (value: string) => void;
}) {
  return (
    <fieldset className="filter-field">
      <legend>{label}</legend>
      <div className="filter-cards" dir="rtl" role="listbox" aria-label={label} aria-multiselectable="false">
        <button
          type="button"
          role="option"
          aria-selected={value === ""}
          className={`filter-card${value === "" ? " is-on" : ""}`}
          onClick={() => onPick("")}
        >
          <b>{anyLabel}</b>
        </button>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={value === option.value}
            className={`filter-card${value === option.value ? " is-on" : ""}`}
            onClick={() => onPick(option.value)}
          >
            <b lang="ar">{option.name}</b>
            {option.about ? <small>{option.about}</small> : null}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function glossOptions(
  table: Record<string, { name: string }>,
  locale: Locale,
  glossFn: (code: string, locale: Locale) => { name: string; about: string },
): FilterOption[] {
  const grouped = new Map<string, string[]>();
  for (const [code, gloss] of Object.entries(table)) {
    grouped.set(gloss.name, [...(grouped.get(gloss.name) ?? []), code]);
  }
  return [...grouped.entries()].map(([name, codes]) => ({
    name,
    value: codes.join(","),
    about: glossFn(codes[0], locale).about,
  }));
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
