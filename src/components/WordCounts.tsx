import { spaceLetters } from "../lib/arabic";
import { useI18n } from "../lib/i18n/I18nContext";
import { useLayer } from "../lib/layers";
import type { ExampleQuery } from "../lib/search";
import type { LexemeCount, Segment } from "../lib/types";
import { wordCounts } from "../lib/wordStats";

interface Props {
	stem: Segment | undefined;
	onSearch: (query: Partial<ExampleQuery>) => void;
}

/** How often the word's lemma and root occur, each linked to the matching search. */
export function WordCounts({ stem, onSearch }: Props) {
	const { t } = useI18n();
	const { data: stats } = useLayer("wordStats");
	const { lemma, root } = wordCounts(stats, stem);
	const rootValue = stem?.ra || stem?.r || "";
	if (!stem || (!lemma && !rootValue)) return null;

	return (
		<section>
			<h3 className="sheet-section-label">{t.sheet.inQuran}</h3>
			{lemma && stem.l ? (
				<CountRow
					label={stem.la || stem.l}
					count={lemma}
					action={t.sheet.searchThisWord}
					onSearch={() => onSearch({ lemma: stem.l })}
				/>
			) : null}
			{rootValue ? (
				<CountRow
					label={spaceLetters(rootValue)}
					count={root}
					action={t.sheet.searchThisRoot}
					onSearch={() => onSearch({ root: rootValue })}
				/>
			) : null}
		</section>
	);
}

interface RowProps {
	label: string;
	count: LexemeCount | undefined;
	action: string;
	onSearch: () => void;
}

function CountRow({ label, count, action, onSearch }: RowProps) {
	const { t } = useI18n();
	return (
		<div className="sheet-root-action">
			<span className="fact-metric" lang="ar" dir="rtl">
				{label}
			</span>
			{count ? (
				<span className="sheet-count">{t.sheet.occurrences(...count)}</span>
			) : null}
			<button type="button" className="text-button" onClick={onSearch}>
				{action}
			</button>
		</div>
	);
}
