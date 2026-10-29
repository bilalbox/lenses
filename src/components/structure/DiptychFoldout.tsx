import { useState } from "react";
import { useI18n } from "../../lib/i18n/I18nContext";
import type { StructureBlock, SurahStructureFile } from "../../lib/types";
import { getRoleTheme } from "./StructureColors";
import { blockContainingVerse, splitHemispheres } from "./structureLayout";

interface Props {
	structure: SurahStructureFile;
	currentVerse?: number;
	onSelectBlock?: (block: StructureBlock) => void;
}

/** Production Diptych Foldout — Variant B from the ring-composition prototype. */
export function DiptychFoldout({
	structure,
	currentVerse,
	onSelectBlock,
}: Props) {
	const { t } = useI18n();
	const [activeId, setActiveId] = useState<string | null>(null);
	const { opening, pivot, closing } = splitHemispheres(structure.blocks);
	const closingMirrored = [...closing].reverse();
	const currentBlock =
		currentVerse != null
			? blockContainingVerse(structure.blocks, currentVerse)
			: null;

	return (
		<div className="structure-variant structure-variant-b">
			<div className="diptych-stage">
				<section
					className="diptych-hemisphere is-open"
					aria-label={t.verse.structureOpeningHemisphere}
				>
					<header>
						<span>{t.verse.structureOpeningHemisphere}</span>
						<small>A →</small>
					</header>
					<ol>
						{opening.map((block) => (
							<DiptychPanel
								key={block.id}
								block={block}
								activeId={activeId}
								isCurrent={currentBlock?.id === block.id}
								onHover={setActiveId}
								onSelect={onSelectBlock}
								side="open"
							/>
						))}
					</ol>
				</section>

				<section
					className="diptych-keystone"
					aria-label={t.verse.structurePivotLabel}
				>
					<div className="diptych-keystone-inner">
						<span className="diptych-star" aria-hidden="true">
							★
						</span>
						<strong>{pivot?.id ?? "PIVOT"}</strong>
						<p lang="ar" dir="rtl">
							{pivot?.labelAr ?? structure.pivot.verse}
						</p>
						<small>
							{pivot?.label ?? t.verse.structurePivotLabel} ·{" "}
							{t.verse.structureVerseRange(
								pivot ? pivot.v[0] : Number(structure.pivot.verse) || 0,
								pivot ? pivot.v[1] : Number(structure.pivot.verse) || 0,
							)}
						</small>
						<em>{structure.pivot.function.replaceAll("_", " ")}</em>
						{pivot && onSelectBlock ? (
							<button
								type="button"
								className="diptych-keystone-jump"
								onClick={() => onSelectBlock(pivot)}
							>
								{t.verse.structureJumpToBlock}
							</button>
						) : null}
					</div>
				</section>

				<section
					className="diptych-hemisphere is-close"
					aria-label={t.verse.structureClosingHemisphere}
				>
					<header>
						<span>{t.verse.structureClosingHemisphere}</span>
						<small>← A′</small>
					</header>
					<ol>
						{closingMirrored.map((block) => (
							<DiptychPanel
								key={block.id}
								block={block}
								activeId={activeId}
								isCurrent={currentBlock?.id === block.id}
								onHover={setActiveId}
								onSelect={onSelectBlock}
								side="close"
							/>
						))}
					</ol>
				</section>
			</div>

			<p className="diptych-hint">{t.verse.structurePairHint}</p>
		</div>
	);
}

function DiptychPanel({
	block,
	activeId,
	isCurrent,
	onHover,
	onSelect,
	side,
}: {
	block: StructureBlock;
	activeId: string | null;
	isCurrent: boolean;
	onHover: (id: string | null) => void;
	onSelect?: (block: StructureBlock) => void;
	side: "open" | "close";
}) {
	const { t } = useI18n();
	const theme = getRoleTheme(block.role);
	const isPair =
		activeId != null && (block.id === activeId || block.pairId === activeId);
	const dim = activeId != null && !isPair;

	return (
		<li>
			<button
				type="button"
				className={`diptych-panel is-${side}${isPair ? " is-on" : ""}${isCurrent ? " is-current" : ""}`}
				style={{
					borderColor: theme.border,
					background: theme.bg,
					opacity: dim ? 0.35 : 1,
				}}
				onMouseEnter={() => onHover(block.id)}
				onMouseLeave={() => onHover(null)}
				onFocus={() => onHover(block.id)}
				onBlur={() => onHover(null)}
				onClick={() => onSelect?.(block)}
				aria-current={isCurrent ? "true" : undefined}
				title={t.verse.structureJumpToBlock}
			>
				<span className="diptych-id" style={{ color: theme.color }}>
					{block.id}
				</span>
				<span className="diptych-range">
					{t.verse.structureVerseRange(block.v[0], block.v[1])}
				</span>
				<span className="diptych-label">{block.label}</span>
				{block.labelAr ? (
					<span className="diptych-label-ar" lang="ar" dir="rtl">
						{block.labelAr}
					</span>
				) : null}
				{block.pairId ? (
					<span className="diptych-pair">↔ {block.pairId}</span>
				) : null}
			</button>
		</li>
	);
}
