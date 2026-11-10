import type { ReactNode } from "react";
import {
	formatLaneEntries,
	formatMaqayis,
	formatMufradat,
} from "../lib/formatLexicon";
import { useI18n } from "../lib/i18n/I18nContext";
import { useLexicon } from "../lib/layers";
import { laneEntriesFor } from "../lib/lexicon";
import type { LaneEntry, Segment } from "../lib/types";

// Perseus asks for this exact credit wherever Lane's text is used.
const PERSEUS_CREDIT =
	"Text provided by Perseus Digital Library, with funding from The U.S. Department of Education and The Max Planck Society.";

interface Props {
	stem: Segment | undefined;
	/** Open the first dictionary (Maqāyīs) by default; true unless a layout says otherwise. */
	openFirst?: boolean;
}

/** Classical dictionary entries for the word's root, one drawer per dictionary. */
export function WordLexicon({ stem, openFirst = true }: Props) {
	const { t } = useI18n();
	const { data } = useLexicon(stem?.r);
	const lane = data?.lane;
	if (!data || data.r !== stem?.r) return null;

	return (
		<section className="sheet-lexicon">
			<h3 className="sheet-section-label">{t.sheet.dictionaries}</h3>
			{data.maqayis ? (
				<Drawer title={t.sheet.maqayisTitle} open={openFirst}>
					{formatMaqayis(data.maqayis)}
				</Drawer>
			) : null}
			{data.mufradat ? (
				<Drawer title={t.sheet.mufradatTitle}>
					{formatMufradat(data.mufradat)}
				</Drawer>
			) : null}
			{lane ? (
				<Drawer title={t.sheet.laneTitle}>
					<LaneEntries entries={lane.e} lemma={stem.la} />
					<p className="source-line">
						{t.sheet.lanePage(lane.p)} · {PERSEUS_CREDIT} ·{" "}
						<a
							href="https://github.com/laneslexicon/lexicon_xml"
							target="_blank"
							rel="noreferrer"
						>
							lexicon_xml
						</a>
					</p>
				</Drawer>
			) : null}
		</section>
	);
}

function Drawer({
	title,
	open,
	children,
}: {
	title: string;
	open?: boolean;
	children: ReactNode;
}) {
	return (
		<details className="verse-layer lexicon-drawer" open={open}>
			<summary>
				<span className="verse-layer-title">{title}</span>
			</summary>
			<div className="verse-layer-body">{children}</div>
		</details>
	);
}

function LaneEntries({
	entries,
	lemma,
}: {
	entries: LaneEntry[];
	lemma: string | undefined;
}) {
	const { t } = useI18n();
	const { word, rest } = laneEntriesFor(entries, lemma);
	if (word.length === 0) return <>{formatLaneEntries(rest)}</>;
	return (
		<>
			<h4 className="lexicon-subhead">{t.sheet.laneThisWord}</h4>
			{formatLaneEntries(word)}
			{rest.length > 0 ? (
				<details className="lexicon-more">
					<summary>{t.sheet.laneOtherEntries(rest.length)}</summary>
					{formatLaneEntries(rest)}
				</details>
			) : null}
		</>
	);
}
