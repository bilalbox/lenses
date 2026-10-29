import { useMemo } from "react";
import { useI18n } from "../lib/i18n/I18nContext";
import { useRhetoric } from "../lib/rhetoric";
import type { Manifest } from "../lib/types";

interface Props {
	manifest: Manifest;
	onOpen: (sura: number) => void;
}

export function SurahIndex({ manifest, onOpen }: Props) {
	const { t, formatNumber } = useI18n();
	const { entries: rhetoricEntries } = useRhetoric();
	const rhetoricBySura = useMemo(() => {
		const map = new Map<number, { count: number; firstVerse: number }>();
		for (const entry of rhetoricEntries) {
			const existing = map.get(entry.sura);
			if (existing) {
				existing.count += 1;
			} else {
				map.set(entry.sura, { count: 1, firstVerse: entry.verse });
			}
		}
		return map;
	}, [rhetoricEntries]);

	return (
		<div className="surah-page anim-soft-enter">
			<header className="page-intro">
				<h1>{t.surahs.pageTitle}</h1>
				<p className="page-intro-count">
					{t.surahs.countEyebrow(manifest.units.length)}
				</p>
			</header>
			<ol className="surah-grid">
				{manifest.units.map((unit) => {
					const rhetoric = rhetoricBySura.get(unit.n);
					const hasStructure = unit.structure != null && unit.structure > 0;
					const hasBalagha = rhetoric != null && rhetoric.count > 0;
					return (
						<li key={unit.n} className="surah-item">
							<div className="surah-card">
								<span className="num">{formatNumber(unit.n)}</span>
								<button
									type="button"
									className="surah-card-btn"
									onClick={() => onOpen(unit.n)}
									aria-label={`${unit.name} (${unit.phonetic})`}
								>
									<span className="names">
										<b lang="ar">{unit.name}</b>
										<small>
											{unit.phonetic} ·{" "}
											{unit.rev === "Madinah"
												? t.verse.madinan
												: t.verse.meccan}
										</small>
									</span>
								</button>
								{(hasStructure || hasBalagha) && (
									<nav
										className="surah-meta"
										aria-label={t.surahs.metaLinksLabel}
									>
										{hasStructure ? (
											<a
												href={`#/${unit.n}/1?tab=structure`}
												className="surah-meta-link"
												title={t.verse.structureSectionTitle}
											>
												{t.surahs.structureLink}
											</a>
										) : null}
										{hasStructure && hasBalagha ? (
											<span className="surah-meta-sep" aria-hidden="true">
												·
											</span>
										) : null}
										{hasBalagha && rhetoric ? (
											<a
												href={`#/rhetoric/${unit.n}/${rhetoric.firstVerse}`}
												className="surah-meta-link"
												title={t.surahs.balaghaLinkTitle(rhetoric.count)}
											>
												{t.surahs.balaghaLink}
											</a>
										) : null}
									</nav>
								)}
							</div>
						</li>
					);
				})}
			</ol>
		</div>
	);
}
