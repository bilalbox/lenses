import { useState } from "react";
import type { ProtoSentence, ProtoToken } from "./treeData";

interface Props {
	sentence: ProtoSentence;
	onSelectToken?: (token: ProtoToken) => void;
}

export function VariantClassicalBracketed({ sentence, onSelectToken }: Props) {
	const [activeTokenId, setActiveTokenId] = useState<number | null>(null);

	const tokenWidth = 110;
	const gap = 20;
	const padX = 40;
	const totalWidth =
		padX * 2 +
		sentence.tokens.length * tokenWidth +
		(sentence.tokens.length - 1) * gap;

	// In RTL, token 1 is at the far right.
	const getTokenX = (tokenIndex: number) => {
		const rtlIndex = sentence.tokens.length - 1 - tokenIndex;
		return padX + rtlIndex * (tokenWidth + gap) + tokenWidth / 2;
	};

	const wordBaselineY = 220;

	// Build arcs from dependent to head
	const arcs = sentence.tokens
		.filter((tok) => tok.rel !== "NonRel" && tok.head !== null && !tok.isRoot)
		.map((depTok) => {
			const depIdx = sentence.tokens.findIndex((t) => t.id === depTok.id);
			const headIdx = sentence.tokens.findIndex((t) => t.id === depTok.head);
			const depX = getTokenX(depIdx);
			const headX = getTokenX(headIdx);
			const span = Math.abs(depIdx - headIdx);
			const arcHeight = 45 + span * 35;
			const topY = wordBaselineY - arcHeight;
			const startX = depX;
			const endX = headX;
			const path = `M ${startX} ${wordBaselineY - 35} C ${startX} ${topY}, ${endX} ${topY}, ${endX} ${wordBaselineY - 35}`;
			const isHighlighted =
				activeTokenId === depTok.id || activeTokenId === depTok.head;

			return {
				id: depTok.id,
				depX,
				headX,
				midX: (depX + headX) / 2,
				topY,
				path,
				relAr: depTok.relAr,
				isHighlighted,
			};
		});

	// Render constituent brackets below the words
	const bracketTierHeight = 32;
	const constituentsWithTier = sentence.constituents.map((c, index) => {
		const startIdx = sentence.tokens.findIndex((t) => t.id === c.startToken);
		const endIdx = sentence.tokens.findIndex((t) => t.id === c.endToken);
		const x1 = getTokenX(startIdx) + tokenWidth / 2 - 8;
		const x2 = getTokenX(endIdx) - tokenWidth / 2 + 8;
		const left = Math.min(x1, x2);
		const right = Math.max(x1, x2);
		const y = wordBaselineY + 80 + index * bracketTierHeight;

		return {
			...c,
			left,
			right,
			width: right - left,
			y,
		};
	});

	const svgHeight =
		wordBaselineY + 100 + sentence.constituents.length * bracketTierHeight + 40;

	return (
		<div
			className="variant-classical-bracketed"
			style={{
				padding: "24px",
				background: "var(--card-bg, #ffffff)",
				borderRadius: "16px",
				border: "1px solid var(--border-color, #e5e7eb)",
				boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
				direction: "rtl",
				overflowX: "auto",
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: "16px",
					borderBottom: "1px solid var(--border-color, #f3f4f6)",
					paddingBottom: "12px",
				}}
			>
				<div>
					<span
						style={{
							fontSize: "12px",
							fontWeight: 700,
							letterSpacing: "0.05em",
							textTransform: "uppercase",
							color: "var(--teal, #008080)",
							background: "rgba(0, 128, 128, 0.08)",
							padding: "4px 8px",
							borderRadius: "6px",
						}}
					>
						Variant A: Classical Bracketed (الأقواس النحوية التراثية)
					</span>
					<h3
						style={{
							margin: "6px 0 2px 0",
							fontSize: "18px",
							fontFamily: "var(--arabic)",
						}}
					>
						{sentence.text}
					</h3>
					<p
						style={{
							margin: 0,
							fontSize: "13px",
							color: "var(--text-muted, #6b7280)",
							direction: "ltr",
							textAlign: "right",
						}}
					>
						{sentence.translation}
					</p>
				</div>
				<div style={{ fontSize: "12px", color: "var(--text-muted, #9ca3af)" }}>
					{sentence.sura}:{sentence.verse}
				</div>
			</div>

			<svg
				width={totalWidth}
				height={svgHeight}
				style={{ display: "block", margin: "0 auto" }}
				role="img"
				aria-label="Classical Bracketed Dependency Tree"
			>
				<title>Classical Bracketed Dependency Tree</title>
				<defs>
					<marker
						id="arrowhead-a"
						markerWidth="7"
						markerHeight="5"
						refX="5"
						refY="2.5"
						orient="auto"
					>
						<polygon points="0 0, 7 2.5, 0 5" fill="var(--teal, #008080)" />
					</marker>
					<marker
						id="arrowhead-active-a"
						markerWidth="7"
						markerHeight="5"
						refX="5"
						refY="2.5"
						orient="auto"
					>
						<polygon points="0 0, 7 2.5, 0 5" fill="var(--gold, #d97706)" />
					</marker>
				</defs>

				{/* Dependency Arcs */}
				{arcs.map((arc) => (
					<g key={arc.id}>
						<path
							d={arc.path}
							fill="none"
							stroke={
								arc.isHighlighted
									? "var(--gold, #d97706)"
									: "var(--teal, #008080)"
							}
							strokeWidth={arc.isHighlighted ? 2.5 : 1.75}
							strokeDasharray={arc.headX === 0 ? "4 4" : "none"}
							markerEnd={
								arc.isHighlighted
									? "url(#arrowhead-active-a)"
									: "url(#arrowhead-a)"
							}
						/>
						{/* Relation Label Pill */}
						<rect
							x={arc.midX - 44}
							y={arc.topY - 14}
							width="88"
							height="22"
							rx="11"
							fill={arc.isHighlighted ? "#fffbeb" : "#ffffff"}
							stroke={
								arc.isHighlighted
									? "var(--gold, #d97706)"
									: "var(--teal, #008080)"
							}
							strokeWidth="1.2"
						/>
						<text
							x={arc.midX}
							y={arc.topY + 1}
							textAnchor="middle"
							fontSize="11"
							fontWeight={arc.isHighlighted ? "700" : "500"}
							fill={
								arc.isHighlighted
									? "var(--gold-dark, #b45309)"
									: "var(--teal-dark, #005959)"
							}
							fontFamily="var(--arabic-ui)"
						>
							{arc.relAr}
						</text>
					</g>
				))}

				{/* Elliptical Governor Badge */}
				{sentence.tokens
					.filter((t) => t.head === null && t.muqaddar)
					.map((tok) => {
						const idx = sentence.tokens.findIndex((t) => t.id === tok.id);
						const x = getTokenX(idx);
						return (
							<g key={`muqaddar-${tok.id}`}>
								<line
									x1={x}
									y1={wordBaselineY - 35}
									x2={x}
									y2={wordBaselineY - 95}
									stroke="#9ca3af"
									strokeDasharray="3 3"
									strokeWidth="1.5"
								/>
								<rect
									x={x - 45}
									y={wordBaselineY - 120}
									width="90"
									height="26"
									rx="6"
									fill="#f3f4f6"
									stroke="#9ca3af"
									strokeDasharray="3 3"
								/>
								<text
									x={x}
									y={wordBaselineY - 103}
									textAnchor="middle"
									fontSize="12"
									fontWeight="600"
									fill="#4b5563"
									fontFamily="var(--arabic-ui)"
								>
									محذوف: {tok.muqaddar}
								</text>
							</g>
						);
					})}

				{/* Word & Token Nodes */}
				{sentence.tokens.map((tok, index) => {
					const x = getTokenX(index);
					const isHovered = activeTokenId === tok.id;
					return (
						<g
							key={tok.id}
							cursor="pointer"
							onMouseEnter={() => setActiveTokenId(tok.id)}
							onMouseLeave={() => setActiveTokenId(null)}
							onClick={() => onSelectToken?.(tok)}
						>
							<rect
								x={x - tokenWidth / 2}
								y={wordBaselineY - 35}
								width={tokenWidth}
								height="80"
								rx="10"
								fill={isHovered ? "#f0fdfa" : "#ffffff"}
								stroke={
									isHovered
										? "var(--teal, #008080)"
										: "var(--border-color, #e5e7eb)"
								}
								strokeWidth={isHovered ? 2 : 1}
							/>
							{/* Uthmani Token Text */}
							<text
								x={x}
								y={wordBaselineY + 8}
								textAnchor="middle"
								fontSize="24"
								fontFamily="var(--arabic)"
								fontWeight="600"
								fill="var(--text-color, #111827)"
							>
								{tok.t}
							</text>
							{/* POS Badge */}
							<rect
								x={x - 35}
								y={wordBaselineY + 22}
								width="70"
								height="18"
								rx="9"
								fill="rgba(0, 128, 128, 0.08)"
							/>
							<text
								x={x}
								y={wordBaselineY + 35}
								textAnchor="middle"
								fontSize="10"
								fontWeight="600"
								fill="var(--teal, #008080)"
								fontFamily="var(--arabic-ui)"
							>
								{tok.posAr}
							</text>
						</g>
					);
				})}

				{/* Phrasal Constituent Brackets (Below Words) */}
				{constituentsWithTier.map((c) => {
					const bracketY = c.y;
					const cornerSize = 8;
					// Draw bracket path: left tick up, horizontal bar, right tick up
					const bracketPath = `M ${c.left} ${bracketY - cornerSize} L ${c.left} ${bracketY} L ${c.right} ${bracketY} L ${c.right} ${bracketY - cornerSize}`;
					const midX = (c.left + c.right) / 2;

					return (
						<g key={c.id}>
							<path
								d={bracketPath}
								fill="none"
								stroke="var(--teal, #008080)"
								strokeWidth="1.75"
							/>
							<rect
								x={midX - 70}
								y={bracketY - 10}
								width="140"
								height="20"
								rx="10"
								fill="#f0fdfa"
								stroke="var(--teal, #008080)"
								strokeWidth="1"
							/>
							<text
								x={midX}
								y={bracketY + 4}
								textAnchor="middle"
								fontSize="11"
								fontWeight="600"
								fill="var(--teal, #008080)"
								fontFamily="var(--arabic-ui)"
							>
								{c.labelAr}
							</text>
						</g>
					);
				})}
			</svg>
		</div>
	);
}
