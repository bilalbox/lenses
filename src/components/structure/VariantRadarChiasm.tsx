import { useState } from "react";
import type { StructureBlock, SurahStructureFile } from "../../lib/types";
import { getRoleTheme } from "./StructureColors";
import { splitHemispheres } from "./structureLayout";

interface Props {
	structure: SurahStructureFile;
}

const CX = 220;
const CY = 220;
const SIZE = 440;

/** Variant C — Hierarchical Concentric Rings / Radar Chiasm */
export function VariantRadarChiasm({ structure }: Props) {
	const [activeId, setActiveId] = useState<string | null>(null);
	const { opening, pivot, closing } = splitHemispheres(structure.blocks);
	const depth = Math.max(opening.length, 1);
	const nodes = placeNodes(opening, closing, depth);

	return (
		<div className="structure-variant structure-variant-c">
			<svg
				viewBox={`0 0 ${SIZE} ${SIZE}`}
				className="structure-svg structure-radar-svg"
				role="img"
				aria-label={`Radar chiasm for ${structure.nameEn}`}
			>
				<title>{structure.nameEn} hierarchical concentric rings</title>
				{Array.from({ length: depth }, (_, i) => {
					const r = 48 + (depth - i) * 36;
					return (
						<circle
							key={`ring-${r}`}
							cx={CX}
							cy={CY}
							r={r}
							fill="none"
							stroke="var(--line)"
							strokeWidth={1}
							opacity={0.7}
						/>
					);
				})}

				{nodes.map((node) => {
					const partner = nodes.find((n) => n.block.id === node.block.pairId);
					if (!partner || node.side !== "open") return null;
					const lit =
						activeId == null ||
						node.block.id === activeId ||
						partner.block.id === activeId;
					const theme = getRoleTheme(node.block.role);
					return (
						<line
							key={`bridge-${node.block.id}`}
							x1={node.x}
							y1={node.y}
							x2={partner.x}
							y2={partner.y}
							stroke={theme.color}
							strokeWidth={lit ? 2.2 : 1}
							opacity={lit ? 0.85 : 0.18}
						/>
					);
				})}

				<circle
					cx={CX}
					cy={CY}
					r={34}
					fill="color-mix(in srgb, var(--gold) 22%, var(--paper))"
					stroke="var(--gold)"
					strokeWidth={2}
				/>
				<text
					x={CX}
					y={CY - 4}
					textAnchor="middle"
					className="structure-svg-label"
					fill="var(--gold)"
					fontWeight={700}
				>
					{pivot?.id ?? "★"}
				</text>
				<text
					x={CX}
					y={CY + 14}
					textAnchor="middle"
					className="structure-svg-label"
					fill="var(--gold)"
					fontSize={9}
				>
					{structure.pivot.verse}
				</text>

				{nodes.map((node) => {
					const theme = getRoleTheme(node.block.role);
					const lit =
						activeId == null ||
						node.block.id === activeId ||
						node.block.pairId === activeId;
					return (
						<g
							key={node.block.id}
							onMouseEnter={() => setActiveId(node.block.id)}
							onMouseLeave={() => setActiveId(null)}
							onClick={() =>
								setActiveId((cur) =>
									cur === node.block.id ? null : node.block.id,
								)
							}
							style={{ cursor: "pointer" }}
							opacity={lit ? 1 : 0.3}
						>
							<circle
								cx={node.x}
								cy={node.y}
								r={16}
								fill={theme.bg}
								stroke={theme.border}
								strokeWidth={node.block.id === activeId ? 2.4 : 1.4}
							/>
							<text
								x={node.x}
								y={node.y + 4}
								textAnchor="middle"
								className="structure-svg-label"
								fill={theme.color}
								fontWeight={700}
							>
								{node.block.id}
							</text>
						</g>
					);
				})}
			</svg>

			<ul className="structure-block-legend is-compact">
				{structure.blocks.map((block) => {
					const theme = getRoleTheme(block.role);
					return (
						<li key={block.id}>
							<button
								type="button"
								className={`structure-legend-chip${block.id === activeId ? " is-on" : ""}`}
								style={{
									borderColor: theme.border,
									background: theme.bg,
									color: theme.color,
								}}
								onMouseEnter={() => setActiveId(block.id)}
								onMouseLeave={() => setActiveId(null)}
							>
								<strong>{block.id}</strong>
								<em>{block.label}</em>
							</button>
						</li>
					);
				})}
			</ul>
		</div>
	);
}

interface RadarNode {
	block: StructureBlock;
	side: "open" | "close";
	x: number;
	y: number;
}

function placeNodes(
	opening: StructureBlock[],
	closing: StructureBlock[],
	depth: number,
): RadarNode[] {
	const nodes: RadarNode[] = [];
	for (let i = 0; i < opening.length; i++) {
		const block = opening[i]!;
		const ring = depth - i;
		const r = 48 + ring * 36;
		const angle = Math.PI + (Math.PI / 2) * ((i + 1) / (opening.length + 1));
		nodes.push({
			block,
			side: "open",
			x: CX + Math.cos(angle) * r,
			y: CY + Math.sin(angle) * r,
		});
	}
	for (let i = 0; i < closing.length; i++) {
		const block = closing[i]!;
		const mirrorIdx = closing.length - 1 - i;
		const ring = depth - Math.min(mirrorIdx, depth - 1);
		const r = 48 + ring * 36;
		const angle =
			-Math.PI / 2 + (Math.PI / 2) * ((i + 1) / (closing.length + 1));
		nodes.push({
			block,
			side: "close",
			x: CX + Math.cos(angle) * r,
			y: CY + Math.sin(angle) * r,
		});
	}
	return nodes;
}
