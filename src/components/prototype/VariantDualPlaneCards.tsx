import { useState } from "react";
import type { ProtoSentence, ProtoToken } from "./treeData";

interface Props {
	sentence: ProtoSentence;
	onSelectToken?: (token: ProtoToken) => void;
}

const MODIFIER_RELS = new Set(["Poss", "Adj", "link", "gen"]);

export function VariantDualPlaneCards({ sentence, onSelectToken }: Props) {
	const [hoveredTokenId, setHoveredTokenId] = useState<number | null>(null);

	const tokenWidth = 100;
	const gap = 24;
	const padX = 40;
	const totalWidth =
		padX * 2 +
		sentence.tokens.length * tokenWidth +
		(sentence.tokens.length - 1) * gap;

	const getTokenX = (tokenIndex: number) => {
		const rtlIndex = sentence.tokens.length - 1 - tokenIndex;
		return padX + rtlIndex * (tokenWidth + gap) + tokenWidth / 2;
	};

	const wordCenterY = 200;

	// Over Arcs (Clausal functions: Subj, Pred, Obj, etc.)
	const overArcs = sentence.tokens
		.filter(
			(tok) =>
				tok.rel !== "NonRel" &&
				tok.head !== null &&
				!tok.isRoot &&
				!MODIFIER_RELS.has(tok.rel),
		)
		.map((depTok) => {
			const depIdx = sentence.tokens.findIndex((t) => t.id === depTok.id);
			const headIdx = sentence.tokens.findIndex((t) => t.id === depTok.head);
			const depX = getTokenX(depIdx);
			const headX = getTokenX(headIdx);
			const span = Math.abs(depIdx - headIdx);
			const arcHeight = 40 + span * 30;
			const topY = wordCenterY - 45 - arcHeight;
			const path = `M ${depX} ${wordCenterY - 45} C ${depX} ${topY}, ${headX} ${topY}, ${headX} ${wordCenterY - 45}`;
			const isHighlighted =
				hoveredTokenId === depTok.id || hoveredTokenId === depTok.head;

			return {
				id: depTok.id,
				midX: (depX + headX) / 2,
				topY,
				path,
				relAr: depTok.relAr,
				isHighlighted,
			};
		});

	// Under Arcs (Modifiers: Poss, Adj, link, gen)
	const underArcs = sentence.tokens
		.filter(
			(tok) =>
				tok.rel !== "NonRel" &&
				tok.head !== null &&
				!tok.isRoot &&
				MODIFIER_RELS.has(tok.rel),
		)
		.map((depTok) => {
			const depIdx = sentence.tokens.findIndex((t) => t.id === depTok.id);
			const headIdx = sentence.tokens.findIndex((t) => t.id === depTok.head);
			const depX = getTokenX(depIdx);
			const headX = getTokenX(headIdx);
			const span = Math.abs(depIdx - headIdx);
			const arcDepth = 35 + span * 25;
			const botY = wordCenterY + 45 + arcDepth;
			const path = `M ${depX} ${wordCenterY + 45} C ${depX} ${botY}, ${headX} ${botY}, ${headX} ${wordCenterY + 45}`;
			const isHighlighted =
				hoveredTokenId === depTok.id || hoveredTokenId === depTok.head;

			return {
				id: depTok.id,
				midX: (depX + headX) / 2,
				botY,
				path,
				relAr: depTok.relAr,
				isHighlighted,
			};
		});

	return (
		<div
			className="variant-dual-plane-cards"
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
							color: "var(--gold-dark, #b45309)",
							background: "rgba(217, 119, 6, 0.08)",
							padding: "4px 8px",
							borderRadius: "6px",
						}}
					>
						Variant B: Dual-Plane Cards (ثنائية المستوى الإعرابي)
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
				height="420"
				style={{ display: "block", margin: "0 auto" }}
				role="img"
				aria-label="Dual-Plane Dependency Tree"
			>
				<title>Dual-Plane Dependency Tree</title>
				<defs>
					<marker
						id="arrowhead-b-top"
						markerWidth="6"
						markerHeight="4"
						refX="5"
						refY="2"
						orient="auto"
					>
						<polygon points="0 0, 6 2, 0 4" fill="var(--teal, #0d9488)" />
					</marker>
					<marker
						id="arrowhead-b-bot"
						markerWidth="6"
						markerHeight="4"
						refX="5"
						refY="2"
						orient="auto"
					>
						<polygon points="0 0, 6 2, 0 4" fill="var(--gold, #d97706)" />
					</marker>
				</defs>

				{/* Constituent Background Grouping Containers */}
				{sentence.constituents.map((c) => {
					const startIdx = sentence.tokens.findIndex(
						(t) => t.id === c.startToken,
					);
					const endIdx = sentence.tokens.findIndex((t) => t.id === c.endToken);
					const x1 = getTokenX(startIdx) + tokenWidth / 2 + 6;
					const x2 = getTokenX(endIdx) - tokenWidth / 2 - 6;
					const left = Math.min(x1, x2);
					const right = Math.max(x1, x2);
					const width = right - left;

					return (
						<g key={`bg-${c.id}`}>
							<rect
								x={left}
								y={wordCenterY - 48}
								width={width}
								height="96"
								rx="12"
								fill="rgba(13, 148, 136, 0.04)"
								stroke="rgba(13, 148, 136, 0.2)"
								strokeWidth="1.2"
								strokeDasharray="4 4"
							/>
							<rect
								x={left + width / 2 - 40}
								y={wordCenterY - 58}
								width="80"
								height="18"
								rx="9"
								fill="#ffffff"
								stroke="rgba(13, 148, 136, 0.3)"
								strokeWidth="1"
							/>
							<text
								x={left + width / 2}
								y={wordCenterY - 45}
								textAnchor="middle"
								fontSize="10"
								fontWeight="600"
								fill="var(--teal, #0d9488)"
								fontFamily="var(--arabic-ui)"
							>
								{c.labelAr}
							</text>
						</g>
					);
				})}

				{/* Top Arcs (Major Clausal) */}
				{overArcs.map((arc) => (
					<g key={`over-${arc.id}`}>
						<path
							d={arc.path}
							fill="none"
							stroke={
								arc.isHighlighted
									? "var(--gold, #d97706)"
									: "var(--teal, #0d9488)"
							}
							strokeWidth={arc.isHighlighted ? 2.5 : 1.75}
							markerEnd="url(#arrowhead-b-top)"
						/>
						<rect
							x={arc.midX - 40}
							y={arc.topY - 12}
							width="80"
							height="20"
							rx="10"
							fill="#ffffff"
							stroke="var(--teal, #0d9488)"
							strokeWidth="1"
						/>
						<text
							x={arc.midX}
							y={arc.topY + 2}
							textAnchor="middle"
							fontSize="10"
							fontWeight="600"
							fill="var(--teal-dark, #115e59)"
							fontFamily="var(--arabic-ui)"
						>
							{arc.relAr}
						</text>
					</g>
				))}

				{/* Word / Token Nodes */}
				{sentence.tokens.map((tok, index) => {
					const x = getTokenX(index);
					const isHovered = hoveredTokenId === tok.id;
					return (
						<g
							key={tok.id}
							cursor="pointer"
							onMouseEnter={() => setHoveredTokenId(tok.id)}
							onMouseLeave={() => setHoveredTokenId(null)}
							onClick={() => onSelectToken?.(tok)}
						>
							<rect
								x={x - tokenWidth / 2}
								y={wordCenterY - 40}
								width={tokenWidth}
								height="80"
								rx="10"
								fill={isHovered ? "#fef3c7" : "#ffffff"}
								stroke={
									isHovered
										? "var(--gold, #d97706)"
										: "var(--border-color, #e5e7eb)"
								}
								strokeWidth={isHovered ? 2 : 1}
							/>
							<text
								x={x}
								y={wordCenterY + 5}
								textAnchor="middle"
								fontSize="20"
								fontFamily="var(--arabic)"
								fontWeight="600"
								fill="var(--text-color, #111827)"
							>
								{tok.t}
							</text>
							<text
								x={x}
								y={wordCenterY + 28}
								textAnchor="middle"
								fontSize="10"
								fill="var(--text-muted, #6b7280)"
								fontFamily="var(--arabic-ui)"
							>
								{tok.posAr}
							</text>
						</g>
					);
				})}

				{/* Bottom Arcs (Modifiers) */}
				{underArcs.map((arc) => (
					<g key={`under-${arc.id}`}>
						<path
							d={arc.path}
							fill="none"
							stroke={
								arc.isHighlighted
									? "var(--teal, #0d9488)"
									: "var(--gold, #d97706)"
							}
							strokeWidth={arc.isHighlighted ? 2.5 : 1.75}
							markerEnd="url(#arrowhead-b-bot)"
						/>
						<rect
							x={arc.midX - 35}
							y={arc.botY - 8}
							width="70"
							height="18"
							rx="9"
							fill="#ffffff"
							stroke="var(--gold, #d97706)"
							strokeWidth="1"
						/>
						<text
							x={arc.midX}
							y={arc.botY + 5}
							textAnchor="middle"
							fontSize="10"
							fontWeight="600"
							fill="var(--gold-dark, #b45309)"
							fontFamily="var(--arabic-ui)"
						>
							{arc.relAr}
						</text>
					</g>
				))}
			</svg>
		</div>
	);
}
