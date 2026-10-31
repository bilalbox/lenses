import { useReducer } from "react";
import { useI18n } from "../lib/i18n/I18nContext";
import { useVerseLayer } from "../lib/layers";
import { surahTitle } from "../lib/manifest";
import {
	counterpartSelectionReducer,
	type HoveredWord,
	initCounterpartSelection,
	isLinked,
} from "../lib/mutashabihNav";
import type {
	Manifest,
	MutashabihMatch,
	VerseRef,
	Word,
	WordDiffStatus,
	WordDiffToken,
} from "../lib/types";

interface Props {
	manifest?: Manifest;
	sura: number;
	verseNumber: number;
	verseWords: Word[];
	matches: MutashabihMatch[];
	/** Remount (key) per ayah + target; selection is initialised from it once. */
	initialTarget?: VerseRef;
	onSelectWord: (wordNumber: number) => void;
	onNavigateAyah: (sura: number, verse: number) => void;
}

function getDiffStatusTooltip(
	status: WordDiffStatus,
	t: ReturnType<typeof useI18n>["t"],
): string {
	switch (status) {
		case "exact":
			return t.verse.mutashabihLegendExact;
		case "haraka":
			return t.verse.mutashabihLegendHaraka;
		case "diff":
			return t.verse.mutashabihLegendDiff;
		case "extra":
			return t.verse.mutashabihLegendExtra;
	}
}

export function MutashabihSection({
	manifest,
	sura,
	verseNumber,
	verseWords,
	matches,
	initialTarget,
	onSelectWord,
	onNavigateAyah,
}: Props) {
	const { locale, t, formatNumber } = useI18n();
	const [selection, dispatch] = useReducer(
		counterpartSelectionReducer,
		initialTarget,
		(target) => initCounterpartSelection(matches, target),
	);
	const { active: activeIdx, hovered } = selection;

	const activeMatch = matches[activeIdx] ?? matches[0];

	// Words of the active counterpart; never the previous counterpart's while loading.
	const { data: targetVerse } = useVerseLayer(
		"surah",
		activeMatch?.sura ?? sura,
		activeMatch?.ayah ?? verseNumber,
	);

	if (!activeMatch) return null;

	const srcSurahTitle = surahTitle(manifest, sura, locale);
	const targetSurahTitle = surahTitle(manifest, activeMatch.sura, locale);
	const isJumpOrigin =
		initialTarget?.sura === activeMatch.sura &&
		initialTarget.verse === activeMatch.ayah;

	return (
		<section
			className="mutashabih-section"
			aria-label={t.verse.mutashabihSectionTitle}
		>
			<div className="mutashabih-header-row">
				{matches.length > 1 ? (
					<div
						className="mutashabih-counterpart-pills"
						role="tablist"
						aria-label={t.verse.mutashabihCounterpartAyah}
					>
						{matches.map((m, idx) => {
							const isSelected = idx === activeIdx;
							const pillSurah = surahTitle(manifest, m.sura, locale);
							return (
								<button
									key={`${m.sura}:${m.ayah}`}
									id={`mutashabih-tab-${m.sura}-${m.ayah}`}
									type="button"
									role="tab"
									aria-selected={isSelected}
									aria-controls="mutashabih-panel"
									className={`mutashabih-pill ${isSelected ? "is-active" : ""}`}
									onClick={() => dispatch({ type: "select", index: idx })}
									onKeyDown={(e) => {
										if (e.key === "ArrowRight") {
											dispatch({ type: "step", delta: 1 });
										} else if (e.key === "ArrowLeft") {
											dispatch({ type: "step", delta: -1 });
										}
									}}
								>
									<span className="mutashabih-pill-surah">{pillSurah}</span>
									<span className="mutashabih-pill-coord">
										{formatNumber(m.sura)}:{formatNumber(m.ayah)}
									</span>
									<span className="mutashabih-pill-score">
										{formatNumber(Math.round(m.score * 100))}%
									</span>
								</button>
							);
						})}
					</div>
				) : (
					<div className="mutashabih-single-counterpart-label">
						<span className="mutashabih-pill-surah">{targetSurahTitle}</span>
						<span className="mutashabih-pill-coord">
							{formatNumber(activeMatch.sura)}:{formatNumber(activeMatch.ayah)}
						</span>
					</div>
				)}
				<span className="mutashabih-match-badge">
					{t.verse.mutashabihMatchScore(Math.round(activeMatch.score * 100))}
				</span>
			</div>

			<div
				id="mutashabih-panel"
				className="mutashabih-comparison-grid"
				role="tabpanel"
				aria-labelledby={`mutashabih-tab-${activeMatch.sura}-${activeMatch.ayah}`}
			>
				<div className="mutashabih-card is-source">
					<div className="mutashabih-card-header">
						<span className="mutashabih-verse-tag">
							{t.verse.mutashabihCurrentAyah}
						</span>
						<div className="mutashabih-coord-cluster">
							<span className="mutashabih-surah-tag">{srcSurahTitle}</span>
							<strong className="mutashabih-coord-tag">
								{formatNumber(sura)}:{formatNumber(verseNumber)}
							</strong>
						</div>
					</div>
					<VerseTokensBox
						words={verseWords}
						tokens={activeMatch.srcTokens}
						hovered={hovered}
						onHover={(w) =>
							dispatch({
								type: "hover",
								hovered: w === null ? null : { word: w, isTarget: false },
							})
						}
						onSelectWord={onSelectWord}
						isTarget={false}
					/>
				</div>

				<div className="mutashabih-card is-target">
					<div className="mutashabih-card-header">
						<span className="mutashabih-verse-tag">
							{t.verse.mutashabihCounterpartAyah}
						</span>
						<div className="mutashabih-target-actions">
							<div className="mutashabih-coord-cluster">
								<span className="mutashabih-surah-tag">{targetSurahTitle}</span>
								<strong className="mutashabih-coord-tag">
									{formatNumber(activeMatch.sura)}:
									{formatNumber(activeMatch.ayah)}
								</strong>
							</div>
							<button
								type="button"
								className={`mutashabih-jump-btn ${isJumpOrigin ? "is-return" : ""}`}
								onClick={() =>
									onNavigateAyah(activeMatch.sura, activeMatch.ayah)
								}
								title={
									isJumpOrigin
										? t.verse.mutashabihReturnToAyah(
												`${formatNumber(activeMatch.sura)}:${formatNumber(activeMatch.ayah)}`,
											)
										: t.verse.mutashabihJumpToAyah
								}
							>
								{isJumpOrigin ? "↩ " : "↗ "}
								{isJumpOrigin
									? t.verse.mutashabihReturnToAyah(
											`${formatNumber(activeMatch.sura)}:${formatNumber(activeMatch.ayah)}`,
										)
									: t.verse.mutashabihJumpToAyah}
							</button>
						</div>
					</div>
					<VerseTokensBox
						words={targetVerse?.w ?? []}
						tokens={activeMatch.targetTokens}
						hovered={hovered}
						onHover={(w) =>
							dispatch({
								type: "hover",
								hovered: w === null ? null : { word: w, isTarget: true },
							})
						}
						onSelectWord={() => {}}
						isTarget={true}
					/>
				</div>
			</div>

			<div className="mutashabih-legend" aria-hidden="true">
				<span className="legend-item is-exact">
					<span className="legend-swatch swatch-exact" />
					{t.verse.mutashabihLegendExact}
				</span>
				<span className="legend-item is-haraka">
					<span className="legend-swatch swatch-haraka" />
					{t.verse.mutashabihLegendHaraka}
				</span>
				<span className="legend-item is-diff">
					<span className="legend-swatch swatch-diff" />
					{t.verse.mutashabihLegendDiff}
				</span>
				<span className="legend-item is-extra">
					<span className="legend-swatch swatch-extra" />
					{t.verse.mutashabihLegendExtra}
				</span>
			</div>

			{activeMatch.dabt && (
				<div className="mutashabih-exegesis-card is-dabt">
					<div className="exegesis-header">
						<h2 className="exegesis-heading">{t.verse.mutashabihDabtTitle}</h2>
					</div>
					<p className="exegesis-text" lang="ar" dir="rtl">
						{activeMatch.dabt}
					</p>
				</div>
			)}

			{activeMatch.tawjih && (
				<div className="mutashabih-exegesis-card is-tawjih">
					<div className="exegesis-header">
						<h2 className="exegesis-heading">
							{t.verse.mutashabihTawjihTitle}
						</h2>
					</div>
					<p className="exegesis-text" lang="ar" dir="rtl">
						{activeMatch.tawjih}
					</p>
				</div>
			)}

			{activeMatch.noteEn && (
				<div className="mutashabih-exegesis-card is-note-en">
					<p className="exegesis-text-en" lang="en" dir="ltr">
						{activeMatch.noteEn}
					</p>
				</div>
			)}
		</section>
	);
}

function VerseTokensBox({
	words,
	tokens,
	hovered,
	onHover,
	onSelectWord,
	isTarget,
}: {
	words: Word[];
	tokens: WordDiffToken[];
	hovered: HoveredWord | null;
	onHover: (w: number | null) => void;
	onSelectWord: (w: number) => void;
	isTarget: boolean;
}) {
	const { t } = useI18n();
	if (words.length === 0) {
		return (
			<div className="mutashabih-loading-tokens">
				<span className="skeleton-line" />
			</div>
		);
	}

	const tokenMap = new Map<number, WordDiffToken>();
	for (const tok of tokens) {
		tokenMap.set(tok.w, tok);
	}

	return (
		<div className="mutashabih-tokens-flow" dir="rtl">
			{words.map((w) => {
				const tok = tokenMap.get(w.n);
				const status: WordDiffStatus = tok?.s ?? "exact";

				const isLinkedHover = isLinked(hovered, w.n, tok, isTarget);

				const chipTooltip = getDiffStatusTooltip(status, t);

				return (
					<button
						key={w.n}
						type="button"
						className={`mutashabih-word-chip status-${status} ${
							isLinkedHover ? "is-linked-hover" : ""
						}`}
						title={chipTooltip}
						onClick={() => !isTarget && onSelectWord(w.n)}
						onMouseEnter={() => onHover(w.n)}
						onMouseLeave={() => onHover(null)}
						onFocus={() => onHover(w.n)}
						onBlur={() => onHover(null)}
					>
						<span className="word-text" lang="ar">
							{w.a}
						</span>
					</button>
				);
			})}
		</div>
	);
}
