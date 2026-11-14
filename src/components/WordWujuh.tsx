import { useId, useState } from "react";
import { useI18n } from "../lib/i18n/I18nContext";
import { useLayer } from "../lib/layers";
import type { Segment, WujuhCite, WujuhSense } from "../lib/types";
import { isCite, type WujuhView, wujuhFor } from "../lib/wujuh";

interface Props {
	sura: number;
	verse: number;
	word: number;
	stem: Segment | undefined;
	/** Only the headline answer, or only the list of senses; both when omitted. */
	part?: "answer" | "list";
}

type Part = Props["part"];
type Position = [number, number, number];

/**
 * al-Dāmaghānī's senses for the word: the one he gives this verse first, then
 * every sense as a row that opens onto the verses he cites for it.
 */
export function WordWujuh({ sura, verse, word, stem, part }: Props) {
	const { t } = useI18n();
	const { data } = useLayer("wujuh");
	const all = wujuhFor(data, stem, sura, verse, word);
	const views = part === "answer" ? all.filter((view) => view.here >= 0) : all;
	if (views.length === 0) return null;
	const at: Position = [sura, verse, word];

	return (
		<section className="sheet-wujuh">
			{part === "answer" ? null : (
				<h3 className="sheet-section-label">{t.sheet.wujuhTitle}</h3>
			)}
			{views.map((view) => (
				<WujuhEntryView
					key={`${view.entry.h}-${view.entry.s.length}`}
					view={view}
					at={at}
					part={part}
				/>
			))}
		</section>
	);
}

function WujuhEntryView({
	view,
	at,
	part,
}: {
	view: WujuhView;
	at: Position;
	part: Part;
}) {
	const { t } = useI18n();
	const { entry, here } = view;
	const total = entry.s.length;
	const answer = here >= 0 ? entry.s[here] : undefined;
	return (
		<div className="wujuh-entry">
			{answer && part === "list" ? null : answer ? (
				<div className="wujuh-answer">
					{part === "answer" ? null : (
						<p className="wujuh-answer-label">{t.sheet.wujuhInThisVerse}</p>
					)}
					<p className="wujuh-answer-sense" lang="ar" dir="rtl">
						{answer.l || t.sheet.wujuhUnnamedSense(here + 1)}
					</p>
					<p className="wujuh-answer-meta">
						<bdi lang="ar">{entry.h}</bdi>
						{t.sheet.wujuhSeparator}
						{t.sheet.wujuhSenseOf(here + 1, total)}
					</p>
				</div>
			) : (
				<p className="wujuh-uncited">
					<bdi lang="ar" className="wujuh-headword">
						{entry.h}
					</bdi>
					{t.sheet.wujuhSeparator}
					{t.sheet.wujuhNotCited(total)}
				</p>
			)}
			{part === "answer" ? null : (
				<ol className="wujuh-senses" dir="rtl">
					{entry.s.map((sense, index) => (
						<SenseRow
							// Keyed by position too, so a new word opens its own sense.
							key={`${at.join(":")}-${index}`}
							sense={sense}
							number={index + 1}
							isHere={index === here}
							at={at}
						/>
					))}
				</ol>
			)}
		</div>
	);
}

function SenseRow({
	sense,
	number,
	isHere,
	at,
}: {
	sense: WujuhSense;
	number: number;
	isHere: boolean;
	at: Position;
}) {
	const { t, formatNumber } = useI18n();
	const [open, setOpen] = useState(isHere);
	const bodyId = useId();
	return (
		<li className={`wujuh-sense${isHere ? " is-here" : ""}`}>
			<button
				type="button"
				className="wujuh-sense-head"
				aria-expanded={open}
				aria-controls={bodyId}
				onClick={() => setOpen((value) => !value)}
			>
				<span className="wujuh-sense-number">{formatNumber(number)}</span>
				<span className="wujuh-sense-label" lang="ar">
					{sense.l || t.sheet.wujuhUnnamedSense(number)}
				</span>
				{isHere ? (
					<span className="wujuh-badge">{t.sheet.wujuhThisVerse}</span>
				) : null}
				<span className="wujuh-sense-count">
					{formatNumber(sense.c.length)}
				</span>
			</button>
			{open ? (
				<ul id={bodyId} className="wujuh-cites">
					{sense.c.length === 0 ? (
						<li className="wujuh-none">{t.sheet.wujuhNoVerses}</li>
					) : (
						sense.c.map((cite) => (
							<CiteRow
								key={`${cite[0]}:${cite[1]}:${cite[2]}`}
								cite={cite}
								at={at}
							/>
						))
					)}
				</ul>
			) : null}
		</li>
	);
}

function CiteRow({ cite, at }: { cite: WujuhCite; at: Position }) {
	const { formatNumber } = useI18n();
	const [sura, verse, word, before, hit, after] = cite;
	const current = isCite(cite, ...at);
	const body = (
		<>
			<span className="wujuh-cite-ref" dir="ltr">
				{formatNumber(sura)}:{formatNumber(verse)}
			</span>
			<span className="wujuh-cite-text" lang="ar">
				{before ? `${before} ` : ""}
				<mark>{hit}</mark>
				{after ? ` ${after}` : ""}
			</span>
		</>
	);
	return (
		<li>
			{current ? (
				<span className="wujuh-cite is-current" aria-current="true">
					{body}
				</span>
			) : (
				<a className="wujuh-cite" href={`#/${sura}/${verse}/${word}`}>
					{body}
				</a>
			)}
		</li>
	);
}
