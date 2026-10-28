import { useEffect } from "react";

export interface VariantOption {
	id: string;
	name: string;
	description: string;
}

interface Props {
	variants: VariantOption[];
	current: string;
	onSelect: (id: string) => void;
}

export function PrototypeSwitcher({ variants, current, onSelect }: Props) {
	const currentIndex = variants.findIndex((v) => v.id === current);
	const active = variants[Math.max(currentIndex, 0)];

	const cycle = (step: number) => {
		const nextIndex = (currentIndex + step + variants.length) % variants.length;
		const next = variants[nextIndex];
		if (next) onSelect(next.id);
	};

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement ||
				(e.target as HTMLElement).isContentEditable
			) {
				return;
			}
			if (e.key === "ArrowLeft") {
				cycle(1);
			} else if (e.key === "ArrowRight") {
				cycle(-1);
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	});

	return (
		<aside
			className="prototype-floating-bar"
			aria-label="Prototype Variant Switcher"
			style={{
				position: "fixed",
				bottom: "24px",
				left: "50%",
				transform: "translateX(-50%)",
				zIndex: 9999,
				display: "flex",
				alignItems: "center",
				gap: "8px",
				padding: "6px 12px",
				background: "rgba(18, 22, 28, 0.94)",
				color: "#ffffff",
				borderRadius: "9999px",
				boxShadow:
					"0 12px 32px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.15)",
				backdropFilter: "blur(12px)",
				fontFamily: "system-ui, sans-serif",
				fontSize: "13px",
			}}
		>
			<button
				type="button"
				onClick={() => cycle(-1)}
				aria-label="Previous Variant"
				style={{
					background: "transparent",
					border: "none",
					color: "#ffffff",
					cursor: "pointer",
					padding: "4px 8px",
					borderRadius: "6px",
					display: "flex",
					alignItems: "center",
				}}
			>
				◀
			</button>

			<div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
				{variants.map((v) => {
					const isSelected = v.id === current;
					return (
						<button
							key={v.id}
							type="button"
							onClick={() => onSelect(v.id)}
							title={v.description}
							style={{
								border: "none",
								background: isSelected
									? "var(--gold, #d4af37)"
									: "rgba(255, 255, 255, 0.12)",
								color: isSelected ? "#12161c" : "#ffffff",
								fontWeight: isSelected ? 700 : 500,
								padding: "4px 10px",
								borderRadius: "9999px",
								cursor: "pointer",
								transition: "all 120ms ease",
							}}
						>
							{v.id}: {v.name}
						</button>
					);
				})}
			</div>

			<button
				type="button"
				onClick={() => cycle(1)}
				aria-label="Next Variant"
				style={{
					background: "transparent",
					border: "none",
					color: "#ffffff",
					cursor: "pointer",
					padding: "4px 8px",
					borderRadius: "6px",
					display: "flex",
					alignItems: "center",
				}}
			>
				▶
			</button>

			<span
				style={{
					borderLeft: "1px solid rgba(255, 255, 255, 0.2)",
					paddingLeft: "8px",
					color: "rgba(255, 255, 255, 0.7)",
					fontSize: "11px",
				}}
			>
				{active?.description}
			</span>
		</aside>
	);
}
