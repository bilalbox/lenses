import { useEffect, useMemo, useState } from "react";
import { stripDiacritics } from "../lib/arabic";
import {
	FORMS,
	formGloss,
	POS,
	type PosFamily,
	posFamily,
	posGloss,
	RELATIONS,
	type RelationFamily,
	relationFamily,
	relationGloss,
} from "../lib/glossary";
import { useI18n } from "../lib/i18n/I18nContext";
import type { Locale } from "../lib/i18n/types";
import { useLayer } from "../lib/layers";
import {
	countExamples,
	type ExampleHit,
	type ExampleQuery,
	exampleFacets,
	type Facet,
	featureSummary,
	searchExamples,
} from "../lib/search";
import { Combobox, type ComboboxOption } from "./Combobox";
import { ChevronRightIcon } from "./Icons";

const empty: ExampleQuery = {
	root: "",
	lemma: "",
	pos: "",
	form: "",
	relation: "",
};

type FilterOption = ComboboxOption;

/** Verb form only means something for verbs, so its row waits for a verb POS. */
const isVerbPos = (pos: string) => pos.split(",").includes("V");

interface Props {
	initial?: Partial<ExampleQuery>;
	onOpen: (sura: number, verse: number, word: number) => void;
}

export function ExampleSearch({ initial, onOpen }: Props) {
	const { locale, t, formatNumber } = useI18n();
	const { data: index, error } = useLayer("words");
	const { data: verses } = useLayer("verses");
	const [query, setQuery] = useState<ExampleQuery>({ ...empty, ...initial });
	const [limit, setLimit] = useState(40);
	const advancedActive = Boolean(
		query.lemma || query.pos || query.form || query.relation,
	);
	// Root is the common entry point; the finer filters wait behind a toggle
	// and open by themselves when a preset or quiz link fills one.
	const [moreOpen, setMoreOpen] = useState(advancedActive);
	useEffect(() => {
		if (advancedActive) setMoreOpen(true);
	}, [advancedActive]);

	const presets = useMemo(
		() => [
			{
				label: t.examples.presetHal,
				query: { ...empty, lemma: "hal", pos: "INTG" },
			},
			{
				label: t.examples.presetAfala,
				query: { ...empty, root: "نزل", pos: "V", form: "IV" },
			},
			{
				label: t.examples.presetFaala,
				query: { ...empty, root: "علم", pos: "V", form: "II" },
			},
			{ label: t.examples.presetFail, query: { ...empty, relation: "subj" } },
			{
				label: t.examples.presetHalState,
				query: { ...empty, relation: "circ" },
			},
		],
		[t],
	);

	const posOptions = useMemo(() => {
		const groups: PosFamily[] = ["word", "particle", "clitic"];
		return groups.flatMap((group) =>
			Object.keys(POS)
				.filter((code) => posFamily(code) === group)
				.map((code) => {
					const gloss = posGloss(code, locale);
					return {
						name: gloss.name,
						value: code,
						about: gloss.about,
						group: t.examples.posGroups[group],
					};
				}),
		);
	}, [locale, t]);
	const formOptions = useMemo(
		() =>
			Object.entries(FORMS).map(([value, gloss]) => ({
				name: gloss.name,
				value,
				about: formGloss(value, locale).about,
			})),
		[locale],
	);
	const relationOptions = useMemo(() => {
		const groups: Exclude<RelationFamily, "particle">[] = [
			"core",
			"nom",
			"clause",
		];
		return groups.flatMap((group) =>
			Object.keys(RELATIONS)
				.filter((code) => relationFamily(code) === group)
				.map((code) => {
					const gloss = relationGloss(code, locale);
					return {
						name: gloss.name,
						value: code,
						about: gloss.about,
						group: t.examples.relationGroups[group],
					};
				}),
		);
	}, [locale, t]);

	useEffect(() => {
		if (initial) setQuery({ ...empty, ...initial });
	}, [initial]);

	const active = Boolean(
		query.root || query.lemma || query.pos || query.form || query.relation,
	);
	const total = useMemo(
		() => (index && active ? countExamples(index, query) : 0),
		[index, query, active],
	);
	const facets = useMemo(
		() =>
			index && active
				? exampleFacets(index, query)
				: { lemmas: [], forms: [], poses: [], relations: [] },
		[index, query, active],
	);
	const verseOf = useMemo(() => {
		const map = new Map<string, string>();
		verses?.forEach((row) => {
			map.set(`${row[0]}:${row[1]}`, row[2]);
		});
		return map;
	}, [verses]);

	const hits = useMemo(
		() => (index && active ? searchExamples(index, query, limit) : []),
		[index, query, limit, active],
	);
	const set = (patch: Partial<ExampleQuery>) => {
		setLimit(40);
		setQuery((current) => ({ ...current, ...patch }));
	};

	const pickPos = (pos: string) =>
		set(isVerbPos(pos) ? { pos } : { pos, form: "" });
	const pickForm = (value: string) =>
		set({ form: value === "" || query.form === value ? "" : value });
	const showForm = isVerbPos(query.pos) || Boolean(query.form);

	return (
		<div className="search-page anim-soft-enter">
			<header className="page-intro">
				<h1>{t.examples.pageTitle}</h1>
				<p className="search-lead">{t.examples.lead}</p>
			</header>
			<div className="presets">
				{presets.map((preset) => (
					<button
						key={preset.label}
						type="button"
						onClick={() => set(preset.query)}
					>
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
				<label className="filter-text">
					{t.examples.filterRoot}
					<input
						value={query.root}
						onChange={(event) => set({ root: event.target.value })}
						placeholder={t.examples.rootPlaceholder}
					/>
				</label>
				<button
					type="button"
					className="filters-toggle"
					aria-expanded={moreOpen}
					aria-controls="example-filters-more"
					onClick={() => setMoreOpen((open) => !open)}
				>
					{moreOpen ? t.examples.fewerFilters : t.examples.moreFilters}
					<ChevronRightIcon className="filters-toggle-chevron" />
				</button>
				<div
					id="example-filters-more"
					className="filters-more"
					hidden={!moreOpen}
				>
					<label className="filter-text">
						{t.examples.filterLemma}
						<input
							value={query.lemma}
							onChange={(event) => set({ lemma: event.target.value })}
							placeholder={t.examples.lemmaPlaceholder}
						/>
					</label>

					<Combobox
						label={t.examples.filterPos}
						hint={t.examples.posHint}
						options={withCurrent(posOptions, query.pos, POS)}
						value={query.pos}
						placeholder={t.examples.anyOption}
						emptyText={t.examples.noOptionMatch}
						clearLabel={t.examples.clearFilter(t.examples.filterPos)}
						onChange={pickPos}
					/>
					<Combobox
						label={t.examples.filterRelation}
						hint={t.examples.relationHint}
						options={withCurrent(relationOptions, query.relation, RELATIONS)}
						value={query.relation}
						placeholder={t.examples.anyOption}
						emptyText={t.examples.noOptionMatch}
						clearLabel={t.examples.clearFilter(t.examples.filterRelation)}
						onChange={(relation) => set({ relation })}
					/>
					{showForm ? (
						<FormChips
							label={t.examples.filterForm}
							anyLabel={t.examples.anyOption}
							options={formOptions}
							value={query.form}
							onPick={pickForm}
						/>
					) : null}
				</div>
			</form>
			{error ? <p className="banner error">{error}</p> : null}
			{!index && !error ? (
				<div className="skeleton" aria-hidden="true">
					<span />
					<span />
				</div>
			) : null}
			{index && !active ? (
				<p className="hint">{t.examples.chooseCriteriaHint}</p>
			) : null}
			{active ? (
				<>
					<p className="result-count">
						<strong>{formatNumber(total)}</strong>
						<span>{t.examples.wordsFound(total, hits.length)}</span>
					</p>
					<SearchFacets
						facets={facets}
						query={query}
						showForm={showForm}
						locale={locale}
						formatNumber={formatNumber}
						labels={t.examples}
						onPickPos={(pos) => pickPos(query.pos === pos ? "" : pos)}
						onPickForm={pickForm}
						onPickRelation={(relation) =>
							set({ relation: query.relation === relation ? "" : relation })
						}
						onPickLemma={(lemma) =>
							set({ lemma: query.lemma === lemma ? "" : lemma })
						}
					/>
					{total === 0 ? (
						<p className="hint">{t.examples.noWordsMatch}</p>
					) : null}
					<ol className="results">
						{hits.map((hit) => {
							const snippet = verseOf.get(`${hit.sura}:${hit.verse}`) ?? "";
							const needle = stripDiacritics(hit.arabic);
							return (
								<li key={`${hit.sura}:${hit.verse}:${hit.word}`}>
									<button
										type="button"
										onClick={() => onOpen(hit.sura, hit.verse, hit.word)}
									>
										<span className="loc">
											{formatNumber(hit.sura)}:{formatNumber(hit.verse)}:
											{formatNumber(hit.word)}
										</span>
										<span className="hit-ar" lang="ar" dir="rtl">
											{hit.arabic}
										</span>
										<span className="hit-snippet" lang="ar" dir="rtl">
											{markSnippet(snippet, needle)}
										</span>
										<HitMeta hit={hit} locale={locale} />
									</button>
								</li>
							);
						})}
					</ol>
					{hits.length < total ? (
						<button
							type="button"
							className="more"
							onClick={() => setLimit((value) => value + 40)}
						>
							{t.examples.showMore}
						</button>
					) : null}
				</>
			) : null}
		</div>
	);
}

function FormChips({
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
			<div className="filter-chips" dir="rtl">
				{[{ name: anyLabel, value: "", about: "" }, ...options].map(
					(option) => (
						<button
							key={option.value}
							type="button"
							aria-pressed={value === option.value}
							title={option.about || undefined}
							className={`filter-chip${value === option.value ? " is-on" : ""}`}
							onClick={() => onPick(option.value)}
						>
							<b lang={option.value ? "ar" : undefined}>{option.name}</b>
							{option.value ? <small>{option.value}</small> : null}
						</button>
					),
				)}
			</div>
		</fieldset>
	);
}

/**
 * Presets and quiz links can filter by a code group that is not one of the
 * listed options (e.g. "N,ADJ"); list it too so the active filter stays visible.
 */
function withCurrent(
	options: FilterOption[],
	value: string,
	table: Record<string, { name: string }>,
): FilterOption[] {
	if (!value || options.some((o) => o.value === value)) return options;
	const name = [
		...new Set(value.split(",").map((code) => table[code]?.name ?? code)),
	].join(" / ");
	return [{ name, value, about: "" }, ...options];
}

function SearchFacets({
	facets,
	query,
	showForm,
	locale,
	formatNumber,
	labels,
	onPickPos,
	onPickForm,
	onPickRelation,
	onPickLemma,
}: {
	facets: {
		poses: Facet[];
		forms: Facet[];
		relations: Facet[];
		lemmas: Facet[];
	};
	query: ExampleQuery;
	showForm: boolean;
	locale: Locale;
	formatNumber: (n: number) => string;
	labels: {
		facetPos: string;
		facetForm: string;
		facetRelation: string;
		facetLemma: string;
	};
	onPickPos: (key: string) => void;
	onPickForm: (key: string) => void;
	onPickRelation: (key: string) => void;
	onPickLemma: (key: string) => void;
}) {
	const groups: Array<{
		title: string;
		active: string;
		items: Facet[];
		labelOf: (facet: Facet) => string;
		onPick: (key: string) => void;
	}> = [];
	if (!query.pos && facets.poses.length > 1) {
		groups.push({
			title: labels.facetPos,
			active: query.pos,
			items: facets.poses,
			labelOf: (f) => posGloss(f.key, locale).name,
			onPick: onPickPos,
		});
	}
	if (!showForm && facets.forms.length > 1) {
		groups.push({
			title: labels.facetForm,
			active: query.form,
			items: facets.forms,
			labelOf: (f) => FORMS[f.key]?.name ?? f.label,
			onPick: onPickForm,
		});
	}
	if (!query.relation && facets.relations.length > 1) {
		groups.push({
			title: labels.facetRelation,
			active: query.relation,
			items: facets.relations,
			labelOf: (f) => relationGloss(f.key, locale).name,
			onPick: onPickRelation,
		});
	}
	if (facets.lemmas.length > 1) {
		groups.push({
			title: labels.facetLemma,
			active: query.lemma,
			items: facets.lemmas,
			labelOf: (f) => f.label,
			onPick: onPickLemma,
		});
	}
	if (groups.length === 0) return null;
	return (
		<div className="facet-groups">
			{groups.map((group) => (
				<div key={group.title} className="facet-group">
					<span className="facet-group-label">{group.title}</span>
					<div className="facets" dir="rtl">
						{group.items.map((facet) => (
							<button
								key={facet.key}
								type="button"
								className={group.active === facet.key ? "is-on" : ""}
								onClick={() => group.onPick(facet.key)}
							>
								<b lang="ar">{group.labelOf(facet)}</b>
								<small>{formatNumber(facet.count)}</small>
							</button>
						))}
					</div>
				</div>
			))}
		</div>
	);
}

function HitMeta({ hit, locale }: { hit: ExampleHit; locale: Locale }) {
	const feat = featureSummary(hit.features);
	const roles = [
		...new Set(
			hit.relations
				.filter((code) => relationFamily(code) !== "particle")
				.map((code) => relationGloss(code, locale).name),
		),
	];
	return (
		<span className="hit-meta">
			<span className="hit-tag hit-tag-pos" dir="rtl" lang="ar">
				{posGloss(hit.pos, locale).name}
				{feat ? ` · ${feat}` : ""}
			</span>
			{roles.length ? (
				<span className="hit-tag hit-tag-rel" dir="rtl" lang="ar">
					{roles.join("، ")}
				</span>
			) : null}
			{hit.gloss ? <span className="hit-gloss">{hit.gloss}</span> : null}
		</span>
	);
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
