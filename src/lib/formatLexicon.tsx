import type { ReactNode } from "react";
import type { LaneEntry, LaneRun } from "./types";

const ROMAN_FORMS: Record<string, string> = {
	"1": "I",
	"2": "II",
	"3": "III",
	"4": "IV",
	"5": "V",
	"6": "VI",
	"7": "VII",
	"8": "VIII",
	"9": "IX",
	"10": "X",
};

export function formatVerbForm(form: string): string {
	return ROMAN_FORMS[form] ? `Form ${ROMAN_FORMS[form]}` : `Form ${form}`;
}

const PRINCIPLE_RE =
	/^([^.؛\n]+(?:أصل|أصلان|ثلاثة أصول|أربعة أصول|خمسة أصول|أصول|ليس بشيء|ليس بأصل|معظم بابه)[^.؛\n]*[.؛]?)/;

const MAQAYIS_SECTION_SPLIT =
	/(?=\s*(?:ومن الباب|ومن ذلك|ومما يشذ|ومما شذ|والباب كله))\s*/;

const MAQAYIS_BRANCH_LEAD =
	/^(ومن الباب الآخر|ومن الباب أيضا|ومن الباب|ومن ذلك|ومما يشذ|ومما شذ|والباب كله)[:\s]*/;

function formatArabicInlineText(text: string, keyPrefix: string): ReactNode {
	// Parse inline tokens: Quran citations, tafsir leads, authority leads
	const tokens: ReactNode[] = [];
	let lastIdx = 0;

	// Combine matching for {ayah} [ref] and [ref]
	const tokenPattern =
		/\{([^}]+)\}(?:\s*\[([^\]]+)\])?|\[([^\]]+[/:][^\]]+)\]|\b(أي|وقيل|ومعناه)[:\s]+|\b(قال رسول الله صلى الله عليه وسلم|قال الخليل|قال ابن الأعرابي)[:\s]+/g;

	let match: RegExpExecArray | null;
	while (true) {
		match = tokenPattern.exec(text);
		if (!match) break;
		if (match.index > lastIdx) {
			tokens.push(text.slice(lastIdx, match.index));
		}

		if (match[1] !== undefined) {
			// Quran cite in braces {ayah} [ref]
			const ayah = match[1].trim();
			const ref = match[2]?.trim();
			tokens.push(
				<span key={`q-${match.index}`} className="lexicon-quran-wrap">
					<span className="lexicon-quran-quote" lang="ar">
						﴿{ayah}﴾
					</span>
					{ref ? <span className="lexicon-ayah-badge">[{ref}]</span> : null}
				</span>,
			);
		} else if (match[3] !== undefined) {
			// Bracketed verse reference [Surah/ Ayah]
			const cleanRef = match[3].replace("/", ":").replace(/\s+/g, " ").trim();
			tokens.push(
				<span key={`ref-${match.index}`} className="lexicon-ayah-badge">
					[{cleanRef}]
				</span>,
			);
		} else if (match[4] !== undefined) {
			// Tafsir marker: أي:
			tokens.push(
				<strong key={`t-${match.index}`} className="lexicon-tafsir-lead">
					{match[4]}:{" "}
				</strong>,
			);
		} else if (match[5] !== undefined) {
			// Authority: قال الخليل:
			tokens.push(
				<strong key={`a-${match.index}`} className="lexicon-authority">
					{match[5]}:{" "}
				</strong>,
			);
		}

		lastIdx = tokenPattern.lastIndex;
	}

	if (lastIdx < text.length) {
		tokens.push(text.slice(lastIdx));
	}

	return <span key={keyPrefix}>{tokens}</span>;
}

/** Formats Maqāyīs al-Lugha paragraphs with opening principle cards, branch sections, and Quran citations. */
export function formatMaqayis(paragraphs: string[]): ReactNode {
	if (paragraphs.length === 0) return null;
	const fullText = paragraphs.join("\n\n");

	let principleText: string | null = null;
	let remainingText = fullText;

	const principleMatch = fullText.match(PRINCIPLE_RE);
	if (principleMatch?.[1]) {
		principleText = principleMatch[1].trim();
		const matchLen = principleMatch[0].length;
		remainingText = fullText
			.slice((principleMatch.index ?? 0) + matchLen)
			.trim();
	}

	const sections = remainingText
		.split(MAQAYIS_SECTION_SPLIT)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);

	return (
		<div className="prose lexicon-prose maqayis-prose" dir="rtl" lang="ar">
			{principleText ? (
				<div className="maqayis-principle-card">
					<div className="lexicon-card-header">
						<span className="lexicon-badge is-gold">الأصل الدلالي</span>
					</div>
					<p className="maqayis-principle-text" lang="ar" dir="rtl">
						{principleText}
					</p>
				</div>
			) : null}

			{sections.map((section, secIdx) => {
				const leadMatch = section.match(MAQAYIS_BRANCH_LEAD);
				let lead: string | null = null;
				let body = section;
				if (leadMatch?.[1]) {
					lead = leadMatch[1];
					body = section.slice(leadMatch[0].length).trim();
				}

				return (
					<p key={secIdx} className="maqayis-section">
						{lead ? (
							<strong className="lexicon-branch-lead">{lead}: </strong>
						) : null}
						{formatArabicInlineText(body, `maq-${secIdx}`)}
					</p>
				);
			})}
		</div>
	);
}

const MUFRADAT_CITE_SPLIT =
	/(?=(?:وقوله تعالى|وقوله|وقال تعالى|قال تعالى|قال الله تعالى|كقوله|نحو قوله)\s*:)/g;

/** Formats al-Mufradāt fī Gharīb al-Qur'ān entries with headword definition cards and structured verse expositions. */
export function formatMufradat(paragraphs: string[]): ReactNode {
	if (paragraphs.length === 0) return null;
	const fullText = paragraphs.join("\n\n");

	const rawBlocks = fullText
		.split(MUFRADAT_CITE_SPLIT)
		.map((b) => b.trim().replace(/^[،,؛;\s]+/, ""))
		.filter((b) => b.length > 0);

	if (rawBlocks.length === 0) return null;

	const [leadBlock, ...verseBlocks] = rawBlocks;

	return (
		<div className="prose lexicon-prose mufradat-prose" dir="rtl" lang="ar">
			{leadBlock ? (
				<div className="mufradat-lead-card">
					<div className="lexicon-card-header">
						<span className="lexicon-badge is-teal">التعريف اللغوي</span>
					</div>
					<p className="mufradat-lead-text" lang="ar" dir="rtl">
						{formatArabicInlineText(leadBlock, "muf-lead")}
					</p>
				</div>
			) : null}

			{verseBlocks.map((block, idx) => (
				<p key={idx} className="mufradat-block">
					{formatArabicInlineText(block, `muf-blk-${idx}`)}
				</p>
			))}
		</div>
	);
}

interface LaneSubsense {
	marker: string | null;
	runs: LaneRun[];
}

interface LaneSense {
	marker: string | null;
	subsenses: LaneSubsense[];
}

type SenseToken =
	| { kind: "text"; text: string }
	| { kind: "major"; marker: string }
	| { kind: "sub"; marker: string };

function tokenizeLaneRun(run: string): SenseToken[] {
	const tokens: SenseToken[] = [];
	const regex = /(?:―\s*)?(-A\d+-)|(?:―\s*)?(-b\d+-)|(―\s+)/g;
	let last = 0;
	let match: RegExpExecArray | null;

	while (true) {
		match = regex.exec(run);
		if (!match) break;
		if (match.index > last) {
			const text = run.slice(last, match.index);
			if (text) tokens.push({ kind: "text", text });
		}
		if (match[1]) {
			tokens.push({ kind: "major", marker: match[1].replace(/-/g, "") });
		} else if (match[2]) {
			tokens.push({ kind: "sub", marker: match[2].replace(/-/g, "") });
		} else if (match[3]) {
			tokens.push({ kind: "sub", marker: "―" });
		}
		last = regex.lastIndex;
	}
	if (last < run.length) {
		const text = run.slice(last);
		if (text) tokens.push({ kind: "text", text });
	}
	return tokens;
}

class LaneSenseBuilder {
	senses: LaneSense[] = [];
	currentSense: LaneSense = {
		marker: null,
		subsenses: [{ marker: null, runs: [] }],
	};

	pushRun(r: LaneRun) {
		const curr = this.currentSense.subsenses;
		const lastSub = curr[curr.length - 1];
		if (lastSub) {
			lastSub.runs.push(r);
		}
	}

	startMajor(marker: string) {
		const curr = this.currentSense;
		if (
			curr.subsenses[0]?.runs.length ||
			curr.subsenses.length > 1 ||
			this.senses.length > 0
		) {
			this.senses.push(curr);
		}
		this.currentSense = { marker, subsenses: [{ marker: null, runs: [] }] };
	}

	startSub(marker: string) {
		this.currentSense.subsenses.push({ marker, runs: [] });
	}

	finish(): LaneSense[] {
		if (
			this.currentSense.subsenses[0]?.runs.length ||
			this.senses.length === 0
		) {
			this.senses.push(this.currentSense);
		}
		return this.senses;
	}
}

function decomposeLaneRuns(runs: LaneRun[]): LaneSense[] {
	const builder = new LaneSenseBuilder();
	for (const run of runs) {
		if (typeof run !== "string") {
			builder.pushRun(run);
			continue;
		}
		for (const tok of tokenizeLaneRun(run)) {
			if (tok.kind === "text") builder.pushRun(tok.text);
			else if (tok.kind === "major") builder.startMajor(tok.marker);
			else builder.startSub(tok.marker);
		}
	}
	return builder.finish();
}

const LANE_INLINE_PATTERN =
	/(\[?\bKur[.,]?\s+[ivxlc\d]+[.,:\s]+[ivxlc\d]+[.]?\]?)|(\((?:assumed\s+)?tropical:\))|(\((?:(?:S|K|TA|Msb|Mgh|Az|Lh|ISd|Lth|MF|A|Z|Bd|Har|KL|PS|IAar|M|Ham)(?:[,\s/;&.:*]|&c|\b)+)+\))/gi;

function renderLaneInlineString(text: string, keyPrefix: string): ReactNode {
	const elements: ReactNode[] = [];
	let last = 0;
	let m: RegExpExecArray | null;

	while (true) {
		m = LANE_INLINE_PATTERN.exec(text);
		if (!m) break;
		if (m.index > last) {
			elements.push(text.slice(last, m.index));
		}

		if (m[1]) {
			elements.push(
				<span key={`k-${m.index}`} className="lane-quran-cite">
					{m[1]}
				</span>,
			);
		} else if (m[2]) {
			// (tropical:) and (assumed tropical:) designate majāz (metaphorical/figurative sense).
			// Omitted to keep Lane's prose clean and readable without distracting badges.
		} else if (m[3]) {
			elements.push(
				<span key={`s-${m.index}`} className="lane-source">
					{m[3]}
				</span>,
			);
		}

		last = LANE_INLINE_PATTERN.lastIndex;
	}

	if (last < text.length) {
		elements.push(text.slice(last));
	}

	return <span key={keyPrefix}>{elements}</span>;
}

function renderLaneRuns(runs: LaneRun[]): ReactNode {
	return runs.map((run, idx) => {
		if (typeof run === "string") {
			return renderLaneInlineString(run, `r-${idx}`);
		}
		const [kind, text] = run;
		return kind === 1 ? (
			<em key={`em-${idx}`} className="lane-em">
				{text}
			</em>
		) : (
			<span key={`ar-${idx}`} className="lane-ar" lang="ar" dir="rtl">
				{text}
			</span>
		);
	});
}

/** Formats a single Lane lexicon entry into articulated sense cards, source tags, and register badges. */
export function formatLaneEntry(
	entry: LaneEntry,
	entryIndex: number,
): ReactNode {
	const senses = decomposeLaneRuns(entry.t);
	const multiSense = senses.length > 1;

	return (
		<article key={entryIndex} className="lane-entry-card">
			<header className="lane-entry-head">
				<b className="lane-ar-head" lang="ar" dir="rtl">
					{entry.h}
				</b>
				{entry.f ? (
					<span className="lane-form-badge">{formatVerbForm(entry.f)}</span>
				) : null}
			</header>

			<div className="lane-senses-list">
				{senses.map((sense, sIdx) => (
					<div key={sIdx} className="lane-sense-card">
						{sense.subsenses.map((sub, bIdx) => (
							<div
								key={bIdx}
								className={
									sub.marker && sub.marker !== "―"
										? "lane-subsense"
										: "lane-main-sense"
								}
							>
								{multiSense && bIdx === 0 ? (
									<span className="lane-sense-num" title={`Sense ${sIdx + 1}`}>
										§{sIdx + 1}
									</span>
								) : null}
								{sub.marker && sub.marker !== "―" ? (
									<span className="lane-subsense-badge">{sub.marker}</span>
								) : null}
								{renderLaneRuns(sub.runs)}
							</div>
						))}
					</div>
				))}
			</div>
		</article>
	);
}

/** Formats an array of Lane lexicon entries with structured sense cards. */
export function formatLaneEntries(entries: LaneEntry[]): ReactNode {
	return (
		<div className="lane-entries" dir="ltr" lang="en">
			{entries.map((entry, idx) => formatLaneEntry(entry, idx))}
		</div>
	);
}
