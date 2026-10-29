import { useEffect, useMemo, useState } from "react";
import { loadSurahStructure } from "../lib/api";
import { useI18n } from "../lib/i18n/I18nContext";
import type { Manifest, SurahStructureFile } from "../lib/types";
import { StructureSection } from "./structure/StructureSection";

interface Props {
	manifest: Manifest;
	targetSura?: number;
	onOpenVerse: (sura: number, verse: number) => void;
	onSelectSurah: (sura: number) => void;
}

export function MunasabatScreen({
	manifest,
	targetSura,
	onOpenVerse,
	onSelectSurah,
}: Props) {
	const { locale, t, formatNumber } = useI18n();
	const initialSura =
		targetSura && targetSura >= 1 && targetSura <= 114 ? targetSura : 1;
	const [sura, setSura] = useState(initialSura);
	const [structure, setStructure] = useState<SurahStructureFile | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		if (targetSura && targetSura >= 1 && targetSura <= 114) {
			setSura(targetSura);
		}
	}, [targetSura]);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError("");
		loadSurahStructure(sura)
			.then((data) => {
				if (!cancelled) {
					setStructure(data);
					setLoading(false);
				}
			})
			.catch((reason: unknown) => {
				if (!cancelled) {
					setStructure(null);
					setLoading(false);
					setError(
						reason instanceof Error ? reason.message : t.munasabat.emptyState,
					);
				}
			});
		return () => {
			cancelled = true;
		};
	}, [sura, t.munasabat.emptyState]);

	const unitsWithStructure = useMemo(
		() =>
			manifest.units.filter(
				(unit) => unit.structure != null && unit.structure > 0,
			),
		[manifest.units],
	);

	const selectSurah = (next: number) => {
		setSura(next);
		onSelectSurah(next);
	};

	return (
		<div className="munasabat-page anim-soft-enter">
			<header className="page-intro">
				<h1>{t.munasabat.pageTitle}</h1>
				<p className="search-lead">{t.munasabat.lead}</p>
			</header>

			<div className="munasabat-toolbar">
				<label className="munasabat-surah-picker">
					<span>{t.munasabat.surahPickerLabel}</span>
					<select
						value={sura}
						aria-label={t.munasabat.surahPickerLabel}
						onChange={(event) => selectSurah(Number(event.target.value))}
					>
						{unitsWithStructure.map((unit) => (
							<option key={unit.n} value={unit.n}>
								{formatNumber(unit.n)}.{" "}
								{locale === "ar" ? unit.name : unit.phonetic}
								{unit.structure ? ` (${formatNumber(unit.structure)})` : ""}
							</option>
						))}
					</select>
				</label>
			</div>

			{loading ? (
				<div className="skeleton page-skeleton" aria-hidden="true">
					<span />
					<span />
					<span />
				</div>
			) : null}

			{error ? <p className="banner error">{error}</p> : null}

			{!loading && structure && structure.blocks.length > 0 ? (
				<StructureSection
					structure={structure}
					currentVerse={structure.blocks[0]?.v[0] ?? 1}
					onSelectBlock={(block) => onOpenVerse(sura, block.v[0])}
					onJumpSurah={(target) => selectSurah(target)}
				/>
			) : null}

			{!loading && (!structure || structure.blocks.length === 0) && !error ? (
				<p className="munasabat-empty" role="status">
					{t.munasabat.emptyState}
				</p>
			) : null}
		</div>
	);
}
