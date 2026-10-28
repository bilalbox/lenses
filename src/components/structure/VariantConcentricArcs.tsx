import { useState } from "react";
import type { SurahStructureFile } from "../../lib/types";
import { getRoleTheme } from "./StructureColors";
import { buildPairArcs, LAYOUT, layoutBlocks } from "./structureLayout";

interface Props {
	structure: SurahStructureFile;
}

/** Variant A — Concentric Symmetrical Arcs + Proportional Ayah Strip */
export function VariantConcentricArcs({ structure }: Props) {
	const [activeId, setActiveId] = useState<string | null>(null);
	const geoms = layoutBlocks(structure.blocks, structure.verseCount);
	const arcs = buildPairArcs(geoms);
	const pivot = geoms.find(
		(g) => g.block.role === "pivot" || g.block.role === "center",
	);
	const active = geoms.find((g) => g.block.id === activeId);
	const partnerId = active?.block.pairId;

	return (
		<div className="structure-variant structure-variant-a">
			<svg
				viewBox={`0 0 ${LAYOUT.WIDTH} ${LAYOUT.HEIGHT}`}
				className="structure-svg"
				role="img"
				aria-label={`Ring composition arcs for ${structure.nameEn}`}
			>
				<title>{structure.nameEn} concentric symmetrical arcs</title>
				{arcs.map((arc) => {
					const lit =
						activeId != null &&
						(arc.left.block.id === activeId ||
							arc.right.block.id === activeId ||
							arc.left.block.id === partnerId ||
							arc.right.block.id === partnerId);
					const theme = getRoleTheme(arc.left.block.role);
					return (
						<path
							key={`${arc.left.block.id}-${arc.right.block.id}`}
							d={arc.path}
							fill="none"
							stroke={theme.color}
							strokeWidth={lit ? 2.8 : 1.6}
							opacity={activeId == null || lit ? 0.9 : 0.22}
							className="structure-arc"
						/>
					);
				})}

				{pivot && (
					<g className="structure-pivot-axis">
						<line
							x1={pivot.xCenter}
							y1={24}
							x2={pivot.xCenter}
							y2={LAYOUT.BAR_Y + 28}
							stroke="var(--gold)"
							strokeWidth={1.5}
							strokeDasharray="4 4"
							opacity={0.85}
						/>
						<circle
							cx={pivot.xCenter}
							cy={LAYOUT.BASELINE - 8}
							r={9}
							fill="var(--gold)"
							opacity={0.95}
						/>
						<text
							x={pivot.xCenter}
							y={18}
							textAnchor="middle"
							className="structure-svg-label"
							fill="var(--gold)"
						>
							★ {structure.pivot.verse}
						</text>
					</g>
				)}

				{geoms.map((g) => {
					const theme = getRoleTheme(g.block.role);
					const lit =
						activeId == null ||
						g.block.id === activeId ||
						g.block.id === partnerId;
					return (
						<g key={g.block.id}>
							<rect
								x={g.xStart}
								y={LAYOUT.BAR_Y}
								width={g.width}
								height={28}
								rx={5}
								fill={theme.bg}
								stroke={theme.border}
								strokeWidth={g.block.id === activeId ? 2.2 : 1}
								opacity={lit ? 1 : 0.35}
								className="structure-block-bar"
								onMouseEnter={() => setActiveId(g.block.id)}
								onMouseLeave={() => setActiveId(null)}
								onClick={() =>
									setActiveId((cur) => (cur === g.block.id ? null : g.block.id))
								}
								style={{ cursor: "pointer" }}
							/>
							<text
								x={g.xCenter}
								y={LAYOUT.BAR_Y + 18}
								textAnchor="middle"
								className="structure-svg-label"
								fill={theme.color}
								opacity={lit ? 1 : 0.4}
								pointerEvents="none"
							>
								{g.block.id}
							</text>
						</g>
					);
				})}
			</svg>

			<BlockLegend
				structure={structure}
				activeId={activeId}
				onHover={setActiveId}
			/>
		</div>
	);
}

function BlockLegend({
	structure,
	activeId,
	onHover,
}: {
	structure: SurahStructureFile;
	activeId: string | null;
	onHover: (id: string | null) => void;
}) {
	return (
		<ul className="structure-block-legend">
			{structure.blocks.map((block) => {
				const theme = getRoleTheme(block.role);
				const lit =
					activeId == null ||
					block.id === activeId ||
					block.pairId === activeId ||
					structure.blocks.find((b) => b.id === activeId)?.pairId === block.id;
				return (
					<li key={block.id}>
						<button
							type="button"
							className={`structure-legend-chip${block.id === activeId ? " is-on" : ""}`}
							style={{
								borderColor: theme.border,
								background: theme.bg,
								color: theme.color,
								opacity: lit ? 1 : 0.4,
							}}
							onMouseEnter={() => onHover(block.id)}
							onMouseLeave={() => onHover(null)}
							onClick={() => onHover(activeId === block.id ? null : block.id)}
						>
							<strong>{block.id}</strong>
							<span>
								vv. {block.v[0]}–{block.v[1]}
							</span>
							<em>{block.label}</em>
						</button>
					</li>
				);
			})}
		</ul>
	);
}
