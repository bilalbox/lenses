import { useState } from "react";
import type { StructureBlock, SurahStructureFile } from "../../lib/types";
import { getRoleTheme } from "./StructureColors";
import { splitHemispheres } from "./structureLayout";

interface Props {
	structure: SurahStructureFile;
}

/** Variant B — Nested Diptych / Mirror Foldout */
export function VariantDiptychFoldout({ structure }: Props) {
	const [activeId, setActiveId] = useState<string | null>(null);
	const { opening, pivot, closing } = splitHemispheres(structure.blocks);
	const closingMirrored = [...closing].reverse();

	return (
		<div className="structure-variant structure-variant-b">
			<div className="diptych-stage">
				<section className="diptych-hemisphere is-open" aria-label="Opening">
					<header>
						<span>Opening hemisphere</span>
						<small>A → inward</small>
					</header>
					<ol>
						{opening.map((block) => (
							<DiptychPanel
								key={block.id}
								block={block}
								activeId={activeId}
								onHover={setActiveId}
								side="open"
							/>
						))}
					</ol>
				</section>

				<section className="diptych-keystone" aria-label="Pivot keystone">
					<div className="diptych-keystone-inner">
						<span className="diptych-star">★</span>
						<strong>{pivot?.id ?? "PIVOT"}</strong>
						<p lang="ar" dir="rtl">
							{pivot?.labelAr ?? structure.pivot.verse}
						</p>
						<small>
							{pivot?.label ?? "Central axis"} · vv.{" "}
							{pivot ? `${pivot.v[0]}–${pivot.v[1]}` : structure.pivot.verse}
						</small>
						<em>{structure.pivot.function.replaceAll("_", " ")}</em>
					</div>
				</section>

				<section className="diptych-hemisphere is-close" aria-label="Closing">
					<header>
						<span>Closing hemisphere</span>
						<small>mirrored ← A′</small>
					</header>
					<ol>
						{closingMirrored.map((block) => (
							<DiptychPanel
								key={block.id}
								block={block}
								activeId={activeId}
								onHover={setActiveId}
								side="close"
							/>
						))}
					</ol>
				</section>
			</div>

			<p className="diptych-hint">
				Hover a panel to light its symmetrical partner across the fold.
			</p>
		</div>
	);
}

function DiptychPanel({
	block,
	activeId,
	onHover,
	side,
}: {
	block: StructureBlock;
	activeId: string | null;
	onHover: (id: string | null) => void;
	side: "open" | "close";
}) {
	const theme = getRoleTheme(block.role);
	const isPair =
		activeId != null && (block.id === activeId || block.pairId === activeId);
	const dim = activeId != null && !isPair;

	return (
		<li>
			<button
				type="button"
				className={`diptych-panel is-${side}${isPair ? " is-on" : ""}`}
				style={{
					borderColor: theme.border,
					background: theme.bg,
					opacity: dim ? 0.35 : 1,
				}}
				onMouseEnter={() => onHover(block.id)}
				onMouseLeave={() => onHover(null)}
				onClick={() => onHover(activeId === block.id ? null : block.id)}
			>
				<span className="diptych-id" style={{ color: theme.color }}>
					{block.id}
				</span>
				<span className="diptych-range">
					vv. {block.v[0]}–{block.v[1]}
				</span>
				<span className="diptych-label">{block.label}</span>
				{block.labelAr && (
					<span className="diptych-label-ar" lang="ar" dir="rtl">
						{block.labelAr}
					</span>
				)}
				{block.pairId && <span className="diptych-pair">↔ {block.pairId}</span>}
			</button>
		</li>
	);
}
