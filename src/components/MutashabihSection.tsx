import { useEffect, useState } from "react";
import { loadSurah } from "../lib/api";
import { useI18n } from "../lib/i18n/I18nContext";
import type {
	MutashabihCategory,
	MutashabihMatch,
	Word,
	WordDiffStatus,
	WordDiffToken,
} from "../lib/types";

interface Props {
	sura: number;
	verseNumber: number;
	verseWords: Word[];
	matches: MutashabihMatch[];
	onSelectWord: (wordNumber: number) => void;
	onNavigateAyah: (sura: number, verse: number) => void;
}

export function MutashabihSection({
	sura,
	verseNumber,
	verseWords,
	matches,
	onSelectWord,
	onNavigateAyah,
}: Props) {
	const { t, formatNumber } = useI18n();
	const [activeIdx, setActiveIdx] = useState(0);
	const [hoveredWord, setHoveredWord] = useState<number | null>(null);
	const [targetWords, setTargetWords] = useState<Word[] | null>(null);

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
							return (
								<button
									key={`${m.sura}:${m.ayah}`}
									type="button"
									role="tab"
									aria-selected={isSelected}
									className={`mutashabih-pill ${isSelected ? "is-active" : ""}`}
									onClick={() => {
										setActiveIdx(idx);
										setHoveredWord(null);
									}}
								>
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
				category={activeMatch.cat}
			/>

			<div className="mutashabih-comparison-grid">
				<div className="mutashabih-card is-source">
					<div className="mutashabih-card-header">
						<span className="mutashabih-verse-tag">
							{t.verse.mutashabihCurrentAyah}
						</span>
						<strong className="mutashabih-coord-tag">
							{formatNumber(sura)}:{formatNumber(verseNumber)}
						</strong>
					</div>
					<VerseTokensBox
						words={verseWords}
						tokens={activeMatch.srcTokens}
						hoveredWord={hoveredWord}
						onHoverWord={setHoveredWord}
						onSelectWord={onSelectWord}
						isCounterpart={false}
					/>
				</div>

				<div className="mutashabih-card is-target">
					<div className="mutashabih-card-header">
						<span className="mutashabih-verse-tag">
							{t.verse.mutashabihCounterpartAyah}
						</span>
						<div className="mutashabih-target-actions">
							<strong className="mutashabih-coord-tag">
								{formatNumber(activeMatch.sura)}:
								{formatNumber(activeMatch.ayah)}
							</strong>
							<button
								type="button"
								className="mutashabih-jump-btn"
								onClick={() =>
									onNavigateAyah(activeMatch.sura, activeMatch.ayah)
								}
								title={t.verse.mutashabihJumpToAyah}
							>
								↗ {t.verse.mutashabihJumpToAyah}
							</button>
						</div>
					</div>
					<VerseTokensBox
						words={targetWords ?? []}
						tokens={activeMatch.targetTokens}
						hoveredWord={hoveredWord}
						onHoverWord={setHoveredWord}
						onSelectWord={() => {}}
						isCounterpart={true}
					/>
				</div>
			</div>

			<div className="mutashabih-legend" aria-hidden="true">
				<span className="legend-item is-exact">
					<span className="legend-swatch swatch-exact" />
					{t.verse.mutashabihLegendExact}
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
						<h4>{t.verse.mutashabihDabtTitle}</h4>
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
						<h4>{t.verse.mutashabihTawjihTitle}</h4>
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
	hoveredWord,
	onHoverWord,
	onSelectWord,
	isCounterpart,
}: {
	words: Word[];
	tokens: WordDiffToken[];
	hoveredWord: number | null;
	onHoverWord: (w: number | null) => void;
	onSelectWord: (w: number) => void;
	isCounterpart: boolean;
}) {
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
				const cw = tok?.cw ?? null;

				const isLinkedHover =
					hoveredWord !== null &&
					(isCounterpart
						? cw === hoveredWord
						: w.n === hoveredWord || tok?.cw === hoveredWord);

				return (
					<button
						key={w.n}
						type="button"
						className={`mutashabih-word-chip status-${status} ${
							isLinkedHover ? "is-linked-hover" : ""
						}`}
						onClick={() => !isCounterpart && onSelectWord(w.n)}
						onMouseEnter={() => onHoverWord(w.n)}
						onMouseLeave={() => onHoverWord(null)}
						onFocus={() => onHoverWord(w.n)}
						onBlur={() => onHoverWord(null)}
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
	category,
}: {
	srcSura: number;
	targetSura: number;
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
				<title>Cross-surah similarity arc</title>
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
					S{formatNumber(srcSura)}
				</text>
				{srcSura !== targetSura && (
					<text
						x={x2}
						y={baselineY + 9}
						className="arc-coord-label"
						textAnchor="middle"
					>
						S{formatNumber(targetSura)}
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
