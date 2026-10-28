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

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement ||
				(e.target as HTMLElement).isContentEditable
			) {
				return;
			}
			const step = e.key === "ArrowLeft" ? 1 : e.key === "ArrowRight" ? -1 : 0;
			if (!step) return;
			const nextIndex =
				(currentIndex + step + variants.length) % variants.length;
			const next = variants[nextIndex];
			if (next) onSelect(next.id);
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [currentIndex, variants, onSelect]);

	const cycle = (step: number) => {
		const nextIndex = (currentIndex + step + variants.length) % variants.length;
		const next = variants[nextIndex];
		if (next) onSelect(next.id);
	};

	return (
		<aside
			className="prototype-floating-bar"
			aria-label="Prototype Variant Switcher"
		>
			<button
				type="button"
				className="prototype-switcher-btn"
				onClick={() => cycle(-1)}
				aria-label="Previous Variant"
			>
				◀
			</button>

			<div className="prototype-switcher-pills">
				{variants.map((v) => {
					const isSelected = v.id === current;
					return (
						<button
							key={v.id}
							type="button"
							className={`prototype-switcher-pill${isSelected ? " is-on" : ""}`}
							onClick={() => onSelect(v.id)}
							title={v.description}
						>
							{v.id}: {v.name}
						</button>
					);
				})}
			</div>

			<button
				type="button"
				className="prototype-switcher-btn"
				onClick={() => cycle(1)}
				aria-label="Next Variant"
			>
				▶
			</button>

			<span className="prototype-switcher-desc">{active?.description}</span>
		</aside>
	);
}
