import { useEffect, useState } from "react";
import { loadSurahStructure } from "../../lib/structureData";
import type { SurahStructureFile } from "../../lib/types";
import { MunasabatCard } from "../structure/MunasabatCard";
import { VariantConcentricArcs } from "../structure/VariantConcentricArcs";
import { VariantDiptychFoldout } from "../structure/VariantDiptychFoldout";
import { VariantRadarChiasm } from "../structure/VariantRadarChiasm";
import { PrototypeSwitcher, type VariantOption } from "./PrototypeSwitcher";

const VARIANTS: VariantOption[] = [
	{
		id: "A",
		name: "Concentric Arcs",
		description:
			"Bézier mirror arcs over a proportional ayah strip + gold pivot",
	},
	{
		id: "B",
		name: "Diptych Foldout",
		description: "Opening/closing hemispheres meeting at a pivot keystone",
	},
	{
		id: "C",
		name: "Radar Chiasm",
		description: "Concentric rings with radial bridges between paired blocks",
	},
];

const SAMPLE_SURAHS = [
	{ n: 1, label: "1 · Al-Fātiḥah" },
	{ n: 2, label: "2 · Al-Baqarah" },
	{ n: 18, label: "18 · Al-Kahf" },
];

function readVariantParam(): string {
	const params = new URLSearchParams(window.location.search);
	const hashQuery = window.location.hash.split("?")[1] ?? "";
	const hashParams = new URLSearchParams(hashQuery);
	return params.get("variant") || hashParams.get("variant") || "A";
}

interface Props {
	currentSura?: number;
	onJumpSurah?: (sura: number) => void;
}

/**
 * Three variants of the Munāsabāt / Ring Composition visualizer, switchable via
 * `?variant=` on the existing verse route. Ticket #16 prototype — throwaway.
 */
export function StructurePrototypeHost({ currentSura, onJumpSurah }: Props) {
	const initialSura =
		currentSura && SAMPLE_SURAHS.some((s) => s.n === currentSura)
			? currentSura
			: 1;

	const [variant, setVariant] = useState(readVariantParam);
	const [sura, setSura] = useState(initialSura);
	const [structure, setStructure] = useState<SurahStructureFile | null>(null);

	useEffect(() => {
		const sync = () => setVariant(readVariantParam());
		window.addEventListener("hashchange", sync);
		window.addEventListener("popstate", sync);
		return () => {
			window.removeEventListener("hashchange", sync);
			window.removeEventListener("popstate", sync);
		};
	}, []);

	useEffect(() => {
		if (currentSura && SAMPLE_SURAHS.some((s) => s.n === currentSura)) {
			setSura(currentSura);
		}
	}, [currentSura]);

	useEffect(() => {
		let cancel = false;
		loadSurahStructure(sura).then((data) => {
			if (!cancel) setStructure(data);
		});
		return () => {
			cancel = true;
		};
	}, [sura]);

	const handleSelectVariant = (next: string) => {
		setVariant(next);
		const [path, query = ""] = window.location.hash
			.replace(/^#/, "")
			.split("?");
		const params = new URLSearchParams(query);
		params.set("variant", next);
		window.history.replaceState({}, "", `#${path}?${params.toString()}`);
	};

	if (!structure) {
		return (
			<div className="structure-prototype-host">
				<p className="structure-loading">Loading structure fixtures…</p>
			</div>
		);
	}

	return (
		<div className="structure-prototype-host">
			<div className="structure-prototype-banner">
				<div>
					<span className="structure-prototype-mark">PROTOTYPE</span>
					<strong>Ring Composition & Munāsabāt · Ticket #16</strong>
					<small>
						{structure.family.name} · {structure.form} · pivot offset{" "}
						{structure.pivot.offset}
					</small>
				</div>
				<div className="structure-surah-pills">
					{SAMPLE_SURAHS.map((sample) => (
						<button
							key={sample.n}
							type="button"
							className={sura === sample.n ? "is-on" : ""}
							onClick={() => setSura(sample.n)}
						>
							{sample.label}
						</button>
					))}
				</div>
			</div>

			<header className="structure-prototype-title">
				<h2 lang="ar" dir="rtl">
					{structure.nameAr}
				</h2>
				<p>
					{structure.nameEn} · {structure.verseCount} ayahs ·{" "}
					{structure.family.description}
				</p>
			</header>

			{variant === "A" && <VariantConcentricArcs structure={structure} />}
			{variant === "B" && <VariantDiptychFoldout structure={structure} />}
			{variant === "C" && <VariantRadarChiasm structure={structure} />}

			<MunasabatCard
				structure={structure}
				onJump={(target) => {
					onJumpSurah?.(target);
				}}
			/>

			<details className="structure-state-dump">
				<summary>Prototype state</summary>
				<pre>
					{JSON.stringify(
						{
							variant,
							sura: structure.sura,
							blocks: structure.blocks.map((b) => b.id),
							pivot: structure.pivot,
							transitionTo: structure.transitionToNext?.targetSura,
						},
						null,
						2,
					)}
				</pre>
			</details>

			{import.meta.env.DEV && (
				<PrototypeSwitcher
					variants={VARIANTS}
					current={variant}
					onSelect={handleSelectVariant}
				/>
			)}
		</div>
	);
}
