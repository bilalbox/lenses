import { useState } from "react";
import type { ProtoSentence, ProtoToken } from "./treeData";

interface Props {
	sentence: ProtoSentence;
	onSelectToken?: (token: ProtoToken) => void;
}

export function VariantFoldablePhraseTree({ sentence, onSelectToken }: Props) {
	// Set of folded constituent IDs
	const [foldedIds, setFoldedIds] = useState<Set<number>>(new Set());
	const [selectedTokenId, setSelectedTokenId] = useState<number | null>(null);

	const toggleFold = (id: number) => {
		setFoldedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	// Determine which tokens are collapsed inside folded constituents
	const foldedTokens = new Map<number, number>(); // tokenId -> constituentId
	for (const c of sentence.constituents) {
		if (foldedIds.has(c.id)) {
			for (let tid = c.startToken; tid <= c.endToken; tid++) {
				foldedTokens.set(tid, c.id);
			}
		}
	}

	// Visible units in the row: either single tokens, or a folded constituent card
	type DisplayUnit =
		| { type: "token"; token: ProtoToken; origIndex: number }
		| {
				type: "folded";
				constituentId: number;
				tokens: ProtoToken[];
				headToken: ProtoToken;
		  };

	const units: DisplayUnit[] = [];
	const seenTokens = new Set<number>();

	sentence.tokens.forEach((tok, idx) => {
		if (seenTokens.has(tok.id)) return;
		const cid = foldedTokens.get(tok.id);
		if (cid !== undefined) {
			const c = sentence.constituents.find((item) => item.id === cid)!;
			const cTokens = sentence.tokens.filter(
				(t) => t.id >= c.startToken && t.id <= c.endToken,
			);
			for (const ct of cTokens) seenTokens.add(ct.id);
			const headTok = cTokens.find((t) => t.id === c.headToken) || cTokens[0]!;
			units.push({
				type: "folded",
				constituentId: cid,
				tokens: cTokens,
				headToken: headTok,
			});
		} else {
			seenTokens.add(tok.id);
			units.push({ type: "token", token: tok, origIndex: idx });
		}
	});

	const unitWidth = 110;
	const gap = 20;
	const padX = 40;
	const totalWidth =
		padX * 2 + units.length * unitWidth + (units.length - 1) * gap;

	const getUnitX = (unitIndex: number) => {
		const rtlIndex = units.length - 1 - unitIndex;
		return padX + rtlIndex * (unitWidth + gap) + unitWidth / 2;
	};

	const wordBaselineY = 200;

	return (
		<div
			className="variant-foldable-phrase-tree"
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
							color: "#2563eb",
							background: "rgba(37, 99, 235, 0.08)",
							padding: "4px 8px",
							borderRadius: "6px",
						}}
					>
						Variant C: Foldable Phrase Tree (التراكيب التفاعلية القابلة للطي)
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

			{/* Constituent toggles header bar */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "8px",
					marginBottom: "20px",
					padding: "8px 12px",
					background: "#f8fafc",
					borderRadius: "8px",
					fontSize: "12px",
					fontFamily: "var(--arabic-ui)",
				}}
			>
				<span style={{ fontWeight: 600, color: "#475569" }}>
					التراكيب والعبارات (اضغط للطي/البسط):
				</span>
				{sentence.constituents.map((c) => {
					const isFolded = foldedIds.has(c.id);
					return (
						<button
							key={c.id}
							type="button"
							onClick={() => toggleFold(c.id)}
							style={{
								border: "1px solid",
								borderColor: isFolded ? "#2563eb" : "#cbd5e1",
								background: isFolded ? "#eff6ff" : "#ffffff",
								color: isFolded ? "#1d4ed8" : "#334155",
								fontWeight: isFolded ? 700 : 500,
								padding: "4px 10px",
								borderRadius: "9999px",
								cursor: "pointer",
								display: "flex",
								alignItems: "center",
								gap: "4px",
								fontFamily: "var(--arabic-ui)",
							}}
						>
							<span>{isFolded ? "⊞" : "⊟"}</span>
							<span>{c.labelAr}</span>
						</button>
					);
				})}
			</div>

			<svg
				width={totalWidth}
				height="360"
				style={{ display: "block", margin: "0 auto" }}
				role="img"
				aria-label="Foldable Phrase Tree"
			>
				<title>Foldable Phrase Tree</title>
				{/* Nodes in Row */}
				{units.map((unit, uIdx) => {
					const x = getUnitX(uIdx);

					if (unit.type === "token") {
						const isSelected = selectedTokenId === unit.token.id;
						return (
							<g
								key={`tok-${unit.token.id}`}
								cursor="pointer"
								onClick={() => {
									setSelectedTokenId(unit.token.id);
									onSelectToken?.(unit.token);
								}}
							>
								<rect
									x={x - unitWidth / 2}
									y={wordBaselineY - 35}
									width={unitWidth}
									height="80"
									rx="10"
									fill={isSelected ? "#eff6ff" : "#ffffff"}
									stroke={isSelected ? "#2563eb" : "#e2e8f0"}
									strokeWidth={isSelected ? 2 : 1}
								/>
								<text
									x={x}
									y={wordBaselineY + 8}
									textAnchor="middle"
									fontSize="24"
									fontFamily="var(--arabic)"
									fontWeight="600"
									fill="#0f172a"
								>
									{unit.token.t}
								</text>
								<rect
									x={x - 32}
									y={wordBaselineY + 20}
									width="64"
									height="18"
									rx="9"
									fill="rgba(37, 99, 235, 0.08)"
								/>
								<text
									x={x}
									y={wordBaselineY + 33}
									textAnchor="middle"
									fontSize="10"
									fontWeight="600"
									fill="#2563eb"
									fontFamily="var(--arabic-ui)"
								>
									{unit.token.posAr}
								</text>
							</g>
						);
					}

					// Folded Phrase Card
					const c = sentence.constituents.find(
						(item) => item.id === unit.constituentId,
					)!;
					return (
						<g
							key={`c-${c.id}`}
							cursor="pointer"
							onClick={() => toggleFold(c.id)}
						>
							<rect
								x={x - unitWidth / 2}
								y={wordBaselineY - 35}
								width={unitWidth}
								height="80"
								rx="10"
								fill="#eff6ff"
								stroke="#2563eb"
								strokeWidth="2"
								strokeDasharray="4 2"
							/>
							<text
								x={x}
								y={wordBaselineY - 5}
								textAnchor="middle"
								fontSize="11"
								fontWeight="700"
								fill="#1d4ed8"
								fontFamily="var(--arabic-ui)"
							>
								{c.labelAr}
							</text>
							<text
								x={x}
								y={wordBaselineY + 22}
								textAnchor="middle"
								fontSize="16"
								fontFamily="var(--arabic)"
								fill="#1e293b"
							>
								{unit.tokens.map((t) => t.t).join(" ")}
							</text>
						</g>
					);
				})}
			</svg>
		</div>
	);
}
