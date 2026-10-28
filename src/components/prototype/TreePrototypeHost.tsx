import { useEffect, useState } from "react";
import { PrototypeSwitcher, type VariantOption } from "./PrototypeSwitcher";
import { SAMPLE_SENTENCES } from "./treeData";
import { VariantClassicalBracketed } from "./VariantClassicalBracketed";
import { VariantDualPlaneCards } from "./VariantDualPlaneCards";
import { VariantFoldablePhraseTree } from "./VariantFoldablePhraseTree";

const VARIANTS: VariantOption[] = [
	{
		id: "A",
		name: "Classical Bracketed",
		description: "Overhead dependency arcs + nested constituent brackets below",
	},
	{
		id: "B",
		name: "Dual-Plane Cards",
		description:
			"Clausal overhead arcs + modifier under-arcs + constituent cards",
	},
	{
		id: "C",
		name: "Foldable Tree",
		description: "Interactive collapsible phrase tags with dynamic aggregation",
	},
];

export function TreePrototypeHost() {
	const getInitialVariant = () => {
		const params = new URLSearchParams(window.location.search);
		return params.get("variant") || "A";
	};

	const [variant, setVariant] = useState(getInitialVariant);
	const [sentenceIndex, setSentenceIndex] = useState(0);

	const handleSelectVariant = (newVariant: string) => {
		setVariant(newVariant);
		const url = new URL(window.location.href);
		url.searchParams.set("variant", newVariant);
		window.history.replaceState({}, "", url.toString());
	};

	useEffect(() => {
		const onPopState = () => {
			const params = new URLSearchParams(window.location.search);
			setVariant(params.get("variant") || "A");
		};
		window.addEventListener("popstate", onPopState);
		return () => window.removeEventListener("popstate", onPopState);
	}, []);

	const sentence = SAMPLE_SENTENCES[sentenceIndex]!;

	return (
		<div className="prototype-host-container" style={{ margin: "24px 0" }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: "12px",
					padding: "8px 16px",
					background: "var(--card-bg, #f9fafb)",
					borderRadius: "8px",
					border: "1px dashed var(--gold, #d97706)",
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
					<span style={{ fontSize: "16px" }}>🧪</span>
					<span
						style={{
							fontSize: "13px",
							fontWeight: 700,
							color: "var(--gold-dark, #b45309)",
						}}
					>
						NoorBayan Dependency Tree Prototype (Ticket #7)
					</span>
				</div>
				<div style={{ display: "flex", gap: "6px" }}>
					{SAMPLE_SENTENCES.map((s, idx) => (
						<button
							key={`${s.sura}:${s.verse}`}
							type="button"
							onClick={() => setSentenceIndex(idx)}
							style={{
								padding: "4px 10px",
								fontSize: "12px",
								fontWeight: sentenceIndex === idx ? 700 : 500,
								background:
									sentenceIndex === idx ? "var(--teal, #0d9488)" : "#ffffff",
								color:
									sentenceIndex === idx
										? "#ffffff"
										: "var(--text-color, #1f2937)",
								border: "1px solid var(--border-color, #d1d5db)",
								borderRadius: "6px",
								cursor: "pointer",
							}}
						>
							{s.sura}:{s.verse}
						</button>
					))}
				</div>
			</div>

			{variant === "A" && <VariantClassicalBracketed sentence={sentence} />}
			{variant === "B" && <VariantDualPlaneCards sentence={sentence} />}
			{variant === "C" && <VariantFoldablePhraseTree sentence={sentence} />}

			<PrototypeSwitcher
				variants={VARIANTS}
				current={variant}
				onSelect={handleSelectVariant}
			/>
		</div>
	);
}
