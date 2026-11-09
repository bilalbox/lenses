import type { ReactNode } from "react";
import { useI18n } from "../lib/i18n/I18nContext";
import { useLexicon } from "../lib/layers";
import { laneEntriesFor } from "../lib/lexicon";
import type { LaneEntry, LaneRun, Segment } from "../lib/types";

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
	const { locale, t } = useI18n();
	const { data } = useLexicon(stem?.r);
	// Lane is an English dictionary; the Arabic and Indonesian views show the Arabic ones.
	const lane = locale === "en" ? data?.lane : undefined;
	if (!data || data.r !== stem?.r) return null;

	return (
		<section className="sheet-lexicon">
			<h3 className="sheet-section-label">{t.sheet.dictionaries}</h3>
			{data.maqayis ? (
				<Drawer title={t.sheet.maqayisTitle} open={openFirst}>
					<ArabicParagraphs paragraphs={data.maqayis} />
				</Drawer>
			) : null}
			{data.mufradat ? (
				<Drawer title={t.sheet.mufradatTitle}>
					<ArabicParagraphs paragraphs={data.mufradat} />
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

function ArabicParagraphs({ paragraphs }: { paragraphs: string[] }) {
	return (
		<div className="prose lexicon-prose" dir="rtl" lang="ar">
			{paragraphs.map((text, index) => (
				<p key={index}>{text}</p>
			))}
		</div>
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
	if (word.length === 0) return <LaneList entries={rest} />;
	return (
		<>
			<h4 className="lexicon-subhead">{t.sheet.laneThisWord}</h4>
			<LaneList entries={word} />
			{rest.length > 0 ? (
				<details className="lexicon-more">
					<summary>{t.sheet.laneOtherEntries(rest.length)}</summary>
					<LaneList entries={rest} />
				</details>
			) : null}
		</>
	);
}

function LaneList({ entries }: { entries: LaneEntry[] }) {
	return (
		<div className="lane-entries" dir="ltr" lang="en">
			{entries.map((entry, index) => (
				<p key={index} className="lane-entry">
					{entry.f ? <span className="lane-form">{entry.f}</span> : null}
					<b className="lane-ar" lang="ar" dir="rtl">
						{entry.h}
					</b>{" "}
					<LaneText runs={entry.t} />
				</p>
			))}
		</div>
	);
}

function LaneText({ runs }: { runs: LaneRun[] }) {
	return (
		<>
			{runs.map((run, index) => {
				if (typeof run === "string") return run;
				const [kind, text] = run;
				return kind === 1 ? (
					<em key={index}>{text}</em>
				) : (
					<span key={index} className="lane-ar" lang="ar" dir="rtl">
						{text}
					</span>
				);
			})}
		</>
	);
}
