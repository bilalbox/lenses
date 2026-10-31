import { useState } from "react";
import { arcTouches, layoutSentence, TOKEN_WIDTH } from "../lib/noorBayan";
import type { SyntaxSentence } from "../lib/types";

interface Props {
	sentence: SyntaxSentence;
	sura: number;
	verseNumber: number;
	selectedWord?: number;
	onSelectWord?: (wordNumber: number) => void;
}

export function NoorBayanTree({
	sentence,
	sura,
	verseNumber,
	selectedWord,
	onSelectWord,
}: Props) {
	const [hoveredTokenId, setHoveredTokenId] = useState<string | null>(null);
	const { width, height, baseline, tokens, arcs, constituents } =
		layoutSentence(sentence, sura, verseNumber);
	const muqaddarTokens = tokens.filter((tok) => tok.muqaddar);

	return (
		<div className="noorbayan-tree-container" dir="rtl">
			<div className="noorbayan-tree-header">
				<div className="noorbayan-tree-title-row">
					<span className="noorbayan-badge">
						شجرة الإعراب النحوي · نور البيان
					</span>
					{sentence.carried && sentence.carried.length > 0 && (
						<span className="noorbayan-carried-badge">
							عائد إلى جملة سابقة:{" "}
							{sentence.carried.map((c) => c.text).join("، ")}
						</span>
					)}
				</div>
			</div>

			<div className="noorbayan-tree-canvas-scroll">
				<svg
					width={width}
					height={height}
					viewBox={`0 0 ${width} ${height}`}
					className="noorbayan-tree-svg"
					role="img"
				>
					<title>شجرة إعراب الآية</title>
					<defs>
						<marker
							id="nb-arrow-default"
							markerWidth="8"
							markerHeight="6"
							refX="6"
							refY="3"
							orient="auto"
						>
							<polygon points="0 0, 8 3, 0 6" fill="var(--teal, #0f6e66)" />
						</marker>
						<marker
							id="nb-arrow-active"
							markerWidth="8"
							markerHeight="6"
							refX="6"
							refY="3"
							orient="auto"
						>
							<polygon points="0 0, 8 3, 0 6" fill="var(--gold, #9a6432)" />
						</marker>
					</defs>

					{/* Layer 1: connector lines only (behind fills) */}
					{arcs.map((arc) => {
						const isHighlighted = arcTouches(arc, tokens, hoveredTokenId);
						return (
							<path
								key={`arc-line-${arc.id}`}
								d={arc.path}
								fill="none"
								stroke={
									isHighlighted
										? "var(--gold, #9a6432)"
										: "var(--teal, #0f6e66)"
								}
								strokeWidth={isHighlighted ? 2.5 : 1.75}
								strokeDasharray={arc.head === null ? "4 4" : "none"}
								markerEnd={
									isHighlighted
										? "url(#nb-arrow-active)"
										: "url(#nb-arrow-default)"
								}
								className="noorbayan-arc-line"
							/>
						);
					})}

					{muqaddarTokens.map((tok) => {
						const x = tok.x;
						return (
							<line
								key={`muqaddar-line-${tok.id}`}
								x1={x}
								y1={baseline - 35}
								x2={x}
								y2={baseline - 95}
								stroke="var(--muted, #6f675e)"
								strokeDasharray="3 3"
								strokeWidth="1.5"
							/>
						);
					})}

					{constituents.map((c) => {
						const { left, right, bracketY } = c;
						const cornerSize = 7;
						const bracketPath = `M ${left} ${bracketY - cornerSize} L ${left} ${bracketY} L ${right} ${bracketY} L ${right} ${bracketY - cornerSize}`;
						return (
							<path
								key={`bracket-line-${c.key}`}
								d={bracketPath}
								fill="none"
								stroke="var(--teal, #0f6e66)"
								strokeWidth="1.5"
								strokeLinecap="round"
							/>
						);
					})}

					{/* Layer 2: opaque fills (nodes + pills) so lines never cross text */}
					{tokens.map((tok) => {
						const x = tok.x;
						const isWordSelected = selectedWord === tok.wordNum;
						const isHovered = hoveredTokenId === tok.id;
						const isActive = isHovered || isWordSelected;

						return (
							<g
								key={tok.id}
								className={`noorbayan-token-node${isActive ? " is-active" : ""}`}
								cursor="pointer"
								onMouseEnter={() => setHoveredTokenId(tok.id)}
								onMouseLeave={() => setHoveredTokenId(null)}
								onClick={() => onSelectWord?.(tok.wordNum)}
							>
								<rect
									x={x - TOKEN_WIDTH / 2}
									y={baseline - 35}
									width={TOKEN_WIDTH}
									height="76"
									rx="8"
									fill={
										isActive
											? "var(--gold-soft, #f6ead7)"
											: "var(--paper, #fffdf8)"
									}
									stroke={
										isActive ? "var(--gold, #9a6432)" : "var(--line, #e3d9c8)"
									}
									strokeWidth={isActive ? 2 : 1}
									className="noorbayan-node-bg"
								/>

								<text
									x={x}
									y={baseline + 5}
									textAnchor="middle"
									fontSize="21"
									fontFamily="var(--arabic)"
									fontWeight="600"
									fill={
										tok.text ? "var(--ink, #1c1915)" : "var(--muted, #6f675e)"
									}
									className="noorbayan-token-text"
								>
									{tok.text || "[مقدَّر]"}
								</text>

								<rect
									x={x - 38}
									y={baseline + 18}
									width="76"
									height="17"
									rx="8.5"
									fill="color-mix(in srgb, var(--teal) 12%, transparent)"
								/>
								<text
									x={x}
									y={baseline + 30}
									textAnchor="middle"
									fontSize="10"
									fontWeight="600"
									fill="var(--teal, #0f6e66)"
									className="noorbayan-pos-text"
								>
									{tok.pos}
								</text>
							</g>
						);
					})}

					{arcs.map((arc) => {
						const isHighlighted = arcTouches(arc, tokens, hoveredTokenId);
						return (
							<g key={`arc-label-${arc.id}`} className="noorbayan-arc-group">
								<rect
									x={arc.midX - 42}
									y={arc.topY - 13}
									width="84"
									height="22"
									rx="11"
									fill={
										isHighlighted
											? "var(--gold-soft, #f6ead7)"
											: "var(--paper, #fffdf8)"
									}
									stroke={
										isHighlighted
											? "var(--gold, #9a6432)"
											: "var(--teal, #0f6e66)"
									}
									strokeWidth="1.2"
									className="noorbayan-rel-pill-bg"
								/>
								<text
									x={arc.midX}
									y={arc.topY + 2}
									textAnchor="middle"
									fontSize="11"
									fontWeight={isHighlighted ? "700" : "500"}
									fill={
										isHighlighted
											? "var(--gold-ink, #6e451c)"
											: "var(--teal, #0f6e66)"
									}
									className="noorbayan-rel-pill-text"
								>
									{arc.label}
								</text>
							</g>
						);
					})}

					{muqaddarTokens.map((tok) => {
						const x = tok.x;
						const pillWidth = 96;
						return (
							<g
								key={`muqaddar-${tok.id}`}
								className="noorbayan-muqaddar-group"
							>
								<rect
									x={x - pillWidth / 2}
									y={baseline - 118}
									width={pillWidth}
									height="24"
									rx="6"
									fill="var(--bg-2, #e7e0d2)"
									stroke="var(--muted, #6f675e)"
									strokeDasharray="3 3"
									strokeWidth="1.2"
								/>
								<text
									x={x}
									y={baseline - 102}
									textAnchor="middle"
									fontSize="11"
									fontWeight="600"
									fill="var(--ink, #1c1915)"
								>
									{tok.relAr ? `محذوف (${tok.relAr})` : "محذوف"}
								</text>
							</g>
						);
					})}

					{constituents.map((c) => {
						const { bracketY, midX, pillWidth } = c;
						return (
							<g key={c.key} className="noorbayan-constituent-group">
								<rect
									x={midX - pillWidth / 2}
									y={bracketY - 10}
									width={pillWidth}
									height="20"
									rx="10"
									fill="var(--paper, #fffdf8)"
									stroke="var(--teal, #0f6e66)"
									strokeWidth="1"
								/>
								<text
									x={midX}
									y={bracketY + 4}
									textAnchor="middle"
									fontSize="11"
									fontWeight="600"
									fill="var(--teal, #0f6e66)"
								>
									{c.label}
								</text>
							</g>
						);
					})}
				</svg>
			</div>
		</div>
	);
}
