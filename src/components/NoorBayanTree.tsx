import { useCallback, useMemo, useState } from "react";
import type { SyntaxConstituent, SyntaxSentence } from "../lib/types";

interface Props {
	sentence: SyntaxSentence;
	sura: number;
	verseNumber: number;
	selectedWord?: number;
	onSelectWord?: (wordNumber: number) => void;
}

interface FlatToken {
	id: string; // key
	wordNum: number;
	tokNum: number;
	wordText: string;
	text: string;
	pos: string;
	rel: string;
	relAr?: string;
	head: [number, number, number, number] | null;
	isRoot: boolean;
	isNonRel: boolean;
	constituent?: SyntaxConstituent;
}

interface Arc {
	id: string;
	depIdx: number;
	headIdx: number;
	depX: number;
	headX: number;
	midX: number;
	topY: number;
	path: string;
	relAr: string;
	isCarried: boolean;
	carriedText?: string;
}

export function NoorBayanTree({
	sentence,
	sura,
	verseNumber,
	selectedWord,
	onSelectWord,
}: Props) {
	const [hoveredTokenId, setHoveredTokenId] = useState<string | null>(null);

	// 1. Flatten all tokens in sequential word order
	const flatTokens: FlatToken[] = useMemo(() => {
		const list: FlatToken[] = [];
		for (const word of sentence.words) {
			for (const tok of word.tokens) {
				const isRoot =
					tok.rel === "root" ||
					(tok.head !== null &&
						tok.head[0] === sura &&
						tok.head[1] === verseNumber &&
						tok.head[2] === word.w &&
						tok.head[3] === tok.tok);
				const isNonRel = tok.rel === "NonRel";

				list.push({
					id: `${sura}:${verseNumber}:${word.w}:${tok.tok}`,
					wordNum: word.w,
					tokNum: tok.tok,
					wordText: word.text,
					text: tok.text,
					pos: tok.pos,
					rel: tok.rel,
					relAr: tok.rel_ar,
					head: tok.head,
					isRoot,
					isNonRel,
					constituent: tok.const,
				});
			}
		}
		return list;
	}, [sentence.words, sura, verseNumber]);

	const tokenCount = flatTokens.length;
	const tokenWidth = 104;
	const tokenGap = 18;
	const padX = 48;
	const totalWidth = Math.max(
		640,
		padX * 2 + tokenCount * tokenWidth + Math.max(0, tokenCount - 1) * tokenGap,
	);

	// In RTL, the first token (reading order) is on the right
	const getTokenX = useCallback(
		(tokenIndex: number) => {
			const rtlIndex = tokenCount - 1 - tokenIndex;
			return padX + rtlIndex * (tokenWidth + tokenGap) + tokenWidth / 2;
		},
		[tokenCount],
	);

	// 2. Build Dependency Arcs
	const { arcs, maxArcHeight } = useMemo(() => {
		let maxArcH = 70;
		const result: Arc[] = [];

		flatTokens.forEach((depTok, depIdx) => {
			if (depTok.isNonRel || depTok.isRoot || depTok.head === null) return;

			const headWord = depTok.head[2];
			const headTokNum = depTok.head[3];
			const headIdx = flatTokens.findIndex(
				(t) => t.wordNum === headWord && t.tokNum === headTokNum,
			);

			if (headIdx !== -1) {
				const depX = getTokenX(depIdx);
				const headX = getTokenX(headIdx);
				const span = Math.abs(depIdx - headIdx);
				const arcHeight = Math.min(220, 50 + span * 28);
				if (arcHeight > maxArcH) maxArcH = arcHeight;

				result.push({
					id: `${depTok.id}->${depTok.head.join(":")}`,
					depIdx,
					headIdx,
					depX,
					headX,
					midX: (depX + headX) / 2,
					topY: 0, // calculated below with wordBaselineY
					path: "", // calculated below with wordBaselineY
					relAr: depTok.relAr || depTok.rel,
					isCarried: false,
				});
			} else if (sentence.carried && sentence.carried.length > 0) {
				// Head is in carried words from a previous verse
				const carriedWord = sentence.carried.find(
					(c) => c.v === depTok.head?.[1] && c.w === depTok.head?.[2],
				);
				if (carriedWord) {
					const depX = getTokenX(depIdx);
					// Point towards the right edge where previous context came from
					const headX = totalWidth - padX / 2;
					result.push({
						id: `${depTok.id}->carried:${carriedWord.w}`,
						depIdx,
						headIdx: -1,
						depX,
						headX,
						midX: (depX + headX) / 2,
						topY: 0,
						path: "",
						relAr: depTok.relAr || depTok.rel,
						isCarried: true,
						carriedText: carriedWord.text,
					});
				}
			}
		});

		return { arcs: result, maxArcHeight: maxArcH };
	}, [flatTokens, getTokenX, sentence.carried, totalWidth]);

	const wordBaselineY = maxArcHeight + 45;

	// Populate arc paths with wordBaselineY
	const finalArcs = useMemo(() => {
		return arcs.map((arc) => {
			const span = arc.headIdx === -1 ? 1 : Math.abs(arc.depIdx - arc.headIdx);
			const arcHeight = arc.isCarried ? 60 : Math.min(220, 50 + span * 28);
			const topY = wordBaselineY - arcHeight;
			const path = `M ${arc.depX} ${wordBaselineY - 35} C ${arc.depX} ${topY}, ${arc.headX} ${topY}, ${arc.headX} ${wordBaselineY - 35}`;
			return {
				...arc,
				topY,
				path,
			};
		});
	}, [arcs, wordBaselineY]);

	// 3. Extract and Tier Constituents (Phrasal Brackets below words)
	const { constituents, maxTier } = useMemo(() => {
		const list = extractDistinctConstituents(flatTokens);
		return assignConstituentTiers(list);
	}, [flatTokens]);

	const bracketTierHeight = 36;
	const svgHeight =
		wordBaselineY +
		65 +
		(constituents.length > 0 ? (maxTier + 1) * bracketTierHeight + 20 : 40);

	const muqaddarTokens = useMemo(
		() => flatTokens.filter((t) => t.head === null && !t.isRoot && !t.isNonRel),
		[flatTokens],
	);

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
					width={totalWidth}
					height={svgHeight}
					viewBox={`0 0 ${totalWidth} ${svgHeight}`}
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
					{finalArcs.map((arc) => {
						const isHighlighted = arcIsHighlighted(
							arc,
							hoveredTokenId,
							flatTokens,
						);
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
								strokeDasharray={arc.isCarried ? "4 4" : "none"}
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
						const idx = flatTokens.findIndex((t) => t.id === tok.id);
						const x = getTokenX(idx);
						return (
							<line
								key={`muqaddar-line-${tok.id}`}
								x1={x}
								y1={wordBaselineY - 35}
								x2={x}
								y2={wordBaselineY - 95}
								stroke="var(--muted, #6f675e)"
								strokeDasharray="3 3"
								strokeWidth="1.5"
							/>
						);
					})}

					{constituents.map((c) => {
						const { left, right, bracketY } = constituentGeom(
							c,
							getTokenX,
							tokenWidth,
							wordBaselineY,
							bracketTierHeight,
						);
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
					{flatTokens.map((tok, index) => {
						const x = getTokenX(index);
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
									x={x - tokenWidth / 2}
									y={wordBaselineY - 35}
									width={tokenWidth}
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
									y={wordBaselineY + 5}
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
									y={wordBaselineY + 18}
									width="76"
									height="17"
									rx="8.5"
									fill="color-mix(in srgb, var(--teal) 12%, transparent)"
								/>
								<text
									x={x}
									y={wordBaselineY + 30}
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

					{finalArcs.map((arc) => {
						const isHighlighted = arcIsHighlighted(
							arc,
							hoveredTokenId,
							flatTokens,
						);
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
									{arc.relAr}
								</text>
							</g>
						);
					})}

					{muqaddarTokens.map((tok) => {
						const idx = flatTokens.findIndex((t) => t.id === tok.id);
						const x = getTokenX(idx);
						const pillWidth = 96;
						return (
							<g
								key={`muqaddar-${tok.id}`}
								className="noorbayan-muqaddar-group"
							>
								<rect
									x={x - pillWidth / 2}
									y={wordBaselineY - 118}
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
									y={wordBaselineY - 102}
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
						const { bracketY, midX, pillWidth } = constituentGeom(
							c,
							getTokenX,
							tokenWidth,
							wordBaselineY,
							bracketTierHeight,
						);
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

interface DistinctConst {
	key: string;
	label: string;
	fromW: number;
	fromTok: number;
	toW: number;
	toTok: number;
	startIdx: number;
	endIdx: number;
	span: number;
	tier: number;
}

function arcIsHighlighted(
	arc: Arc,
	hoveredTokenId: string | null,
	flatTokens: FlatToken[],
): boolean {
	return (
		hoveredTokenId !== null &&
		(flatTokens[arc.depIdx]?.id === hoveredTokenId ||
			(arc.headIdx !== -1 && flatTokens[arc.headIdx]?.id === hoveredTokenId))
	);
}

function constituentGeom(
	c: DistinctConst,
	getTokenX: (tokenIndex: number) => number,
	tokenWidth: number,
	wordBaselineY: number,
	bracketTierHeight: number,
) {
	const x1 = getTokenX(c.startIdx) + tokenWidth / 2 - 8;
	const x2 = getTokenX(c.endIdx) - tokenWidth / 2 + 8;
	const left = Math.min(x1, x2);
	const right = Math.max(x1, x2);
	const bracketY = wordBaselineY + 60 + c.tier * bracketTierHeight;
	const midX = (left + right) / 2;
	const pillWidth = Math.min(130, Math.max(80, right - left - 20));
	return { left, right, bracketY, midX, pillWidth };
}

function extractDistinctConstituents(flatTokens: FlatToken[]): DistinctConst[] {
	const map = new Map<string, DistinctConst>();
	for (const tok of flatTokens) {
		if (!tok.constituent) continue;
		const c = tok.constituent;
		const key = `${c.label}:${c.from[0]}:${c.from[1]}:${c.to[0]}:${c.to[1]}`;
		if (!map.has(key)) {
			const startIdx = flatTokens.findIndex(
				(t) => t.wordNum === c.from[0] && t.tokNum === c.from[1],
			);
			const endIdx = flatTokens.findIndex(
				(t) => t.wordNum === c.to[0] && t.tokNum === c.to[1],
			);
			if (startIdx !== -1 && endIdx !== -1) {
				map.set(key, {
					key,
					label: c.label,
					fromW: c.from[0],
					fromTok: c.from[1],
					toW: c.to[0],
					toTok: c.to[1],
					startIdx,
					endIdx,
					span: Math.abs(endIdx - startIdx) + 1,
					tier: 0,
				});
			}
		}
	}
	return Array.from(map.values()).sort((a, b) => a.span - b.span);
}

function assignConstituentTiers(list: DistinctConst[]): {
	constituents: DistinctConst[];
	maxTier: number;
} {
	let highestTier = 0;
	for (let i = 0; i < list.length; i++) {
		let tier = 0;
		const current = list[i];
		if (!current) continue;
		const cMin = Math.min(current.startIdx, current.endIdx);
		const cMax = Math.max(current.startIdx, current.endIdx);

		for (let j = 0; j < i; j++) {
			const prev = list[j];
			if (!prev) continue;
			const pMin = Math.min(prev.startIdx, prev.endIdx);
			const pMax = Math.max(prev.startIdx, prev.endIdx);
			if (cMin <= pMax && cMax >= pMin) {
				tier = Math.max(tier, prev.tier + 1);
			}
		}
		current.tier = tier;
		if (tier > highestTier) highestTier = tier;
	}
	return { constituents: list, maxTier: highestTier };
}
