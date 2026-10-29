import { useEffect, useState } from "react";
import { loadSurah } from "../lib/api";
import { useI18n } from "../lib/i18n/I18nContext";
import type {
	Manifest,
	MutashabihCategory,
	MutashabihMatch,
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
	initialTarget?: string;
	onSelectWord: (wordNumber: number) => void;
	onNavigateAyah: (sura: number, verse: number) => void;
}

function getSurahTitle(
	manifest: Manifest | undefined,
	suraId: number,
	locale: string,
): string {
	const unit = manifest?.units.find((u) => u.n === suraId);
	if (!unit) return `S${suraId}`;
	return locale === "ar" ? unit.name : unit.phonetic;
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
	const [activeIdx, setActiveIdx] = useState(0);
	const [hovered, setHovered] = useState<{
		word: number;
		isTarget: boolean;
	} | null>(null);
	const [targetWords, setTargetWords] = useState<Word[] | null>(null);

	// When initialTarget changes (e.g. jumped from counterpart "2:58"), auto-select that match
	useEffect(() => {
		if (!initialTarget) return;
		const [pSura, pAyah] = initialTarget.split(":").map(Number);
		if (!pSura || !pAyah) return;
		const idx = matches.findIndex((m) => m.sura === pSura && m.ayah === pAyah);
		if (idx >= 0) {
			setActiveIdx(idx);
		}
	}, [initialTarget, matches]);

	const activeMatch = matches[activeIdx] ?? matches[0];

	// Load target verse words dynamically for the active counterpart
	useEffect(() => {
		if (!activeMatch) return;
		let cancelled = false;
		loadSurah(activeMatch.sura)
			.then((surahFile) => {
				if (cancelled) return;
				const found = surahFile.verses.find((v) => v.v === activeMatch.ayah);
				setTargetWords(found?.w ?? []);
			})
			.catch(() => {
				if (!cancelled) setTargetWords([]);
			});
		return () => {
			cancelled = true;
		};
	}, [activeMatch]);

	if (!activeMatch) return null;

	const srcSurahTitle = getSurahTitle(manifest, sura, locale);
	const targetSurahTitle = getSurahTitle(manifest, activeMatch.sura, locale);
	const isJumpOrigin =
		Boolean(initialTarget) &&
		initialTarget === `${activeMatch.sura}:${activeMatch.ayah}`;

	return (
		<section
			className="mutashabih-section"
			aria-label={t.verse.mutashabihSectionTitle}
		>
			<div className="mutashabih-header-row">
				{matches.length > 1 ? (
					<div className="mutashabih-counterpart-pills" role="tablist">
						{matches.map((m, idx) => {
							const isSelected = idx === activeIdx;
							const pillSurah = getSurahTitle(manifest, m.sura, locale);
							return (
								<button
									key={`${m.sura}:${m.ayah}`}
									type="button"
									role="tab"
									aria-selected={isSelected}
									className={`mutashabih-pill ${isSelected ? "is-active" : ""}`}
									onClick={() => {
										setActiveIdx(idx);
										setHovered(null);
									}}
									onKeyDown={(e) => {
										if (e.key === "ArrowRight") {
											setActiveIdx((idx + 1) % matches.length);
											setHovered(null);
										} else if (e.key === "ArrowLeft") {
											setActiveIdx((idx - 1 + matches.length) % matches.length);
											setHovered(null);
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

			<MutashabihArc
				srcSura={sura}
				targetSura={activeMatch.sura}
				srcTitle={srcSurahTitle}
				targetTitle={targetSurahTitle}
				category={activeMatch.cat}
			/>

			<div className="mutashabih-comparison-grid">
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
							setHovered(w === null ? null : { word: w, isTarget: false })
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
						words={targetWords ?? []}
						tokens={activeMatch.targetTokens}
						hovered={hovered}
						onHover={(w) =>
							setHovered(w === null ? null : { word: w, isTarget: true })
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
						<span className="exegesis-icon" aria-hidden="true">
							📿
						</span>
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
						<span className="exegesis-icon" aria-hidden="true">
							💡
						</span>
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
	hovered: { word: number; isTarget: boolean } | null;
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

				const isDirectHover =
					hovered !== null &&
					hovered.isTarget === isTarget &&
					hovered.word === w.n;
				const isCounterpartHover =
					hovered !== null &&
					hovered.isTarget !== isTarget &&
					tok?.cw === hovered.word;
				const isLinkedHover = isDirectHover || isCounterpartHover;

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

function MutashabihArc({
	srcSura,
	targetSura,
	srcTitle,
	targetTitle,
	category,
}: {
	srcSura: number;
	targetSura: number;
	srcTitle: string;
	targetTitle: string;
	category: MutashabihCategory;
}) {
	const { t, formatNumber } = useI18n();
	const width = 560;
	const height = 56;
	const baselineY = 46;

	const x1 = Math.round(20 + ((srcSura - 1) / 113) * (width - 40));
	const x2 = Math.round(20 + ((targetSura - 1) / 113) * (width - 40));

	const leftX = Math.min(x1, x2);
	const rightX = Math.max(x1, x2);
	const midX = (leftX + rightX) / 2;
	const span = Math.abs(x2 - x1);

	// Arc height proportional to distance, capped
	const arcPeak = Math.max(
		8,
		baselineY - Math.min(36, Math.max(16, span * 0.25)),
	);

	const pathD = `M ${x1} ${baselineY} C ${x1} ${arcPeak}, ${x2} ${arcPeak}, ${x2} ${baselineY}`;
	const distance = Math.abs(targetSura - srcSura);

	const categoryLabel = getCategoryLabel(category, t);

	return (
		<div className="mutashabih-arc-wrapper" aria-hidden="true">
			<svg
				viewBox={`0 0 ${width} ${height}`}
				className="mutashabih-arc-svg"
				preserveAspectRatio="xMidYMid meet"
			>
				<title>{`Cross-surah similarity arc: ${categoryLabel}`}</title>
				{/* Mushaf Track Line */}
				<line
					x1={20}
					y1={baselineY}
					x2={width - 20}
					y2={baselineY}
					className="mushaf-track-line"
				/>

				{/* Connecting Bézier Arc */}
				<path d={pathD} className="mutashabih-curve-path" />

				{/* Source and Target Pins */}
				<circle cx={x1} cy={baselineY} r={4.5} className="arc-pin is-source" />
				<circle cx={x2} cy={baselineY} r={4.5} className="arc-pin is-target" />

				{/* Category / Distance Pill above arc */}
				<g transform={`translate(${midX}, ${Math.max(10, arcPeak - 2)})`}>
					<text className="arc-center-label" textAnchor="middle">
						{categoryLabel}
						{distance > 0
							? ` · ${t.verse.mutashabihSurahDistance(distance)}`
							: ""}
					</text>
				</g>

				<text
					x={x1}
					y={baselineY + 9}
					className="arc-coord-label"
					textAnchor="middle"
				>
					{`${srcTitle} (${formatNumber(srcSura)})`}
				</text>
				{srcSura !== targetSura && (
					<text
						x={x2}
						y={baselineY + 9}
						className="arc-coord-label"
						textAnchor="middle"
					>
						{`${targetTitle} (${formatNumber(targetSura)})`}
					</text>
				)}
			</svg>
		</div>
	);
}

function getCategoryLabel(
	cat: MutashabihCategory,
	t: ReturnType<typeof useI18n>["t"],
): string {
	switch (cat) {
		case "identical":
			return t.verse.mutashabihCategoryIdentical;
		case "shared_opening":
			return t.verse.mutashabihCategoryOpening;
		case "shared_ending":
			return t.verse.mutashabihCategoryEnding;
		case "word_swap":
			return t.verse.mutashabihCategorySwap;
		default:
			return t.verse.mutashabihCategoryPhrase;
	}
}
