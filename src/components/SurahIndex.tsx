import { useI18n } from "../lib/i18n/I18nContext";
import type { Manifest } from "../lib/types";

interface Props {
	manifest: Manifest;
	onOpen: (sura: number) => void;
}

export function SurahIndex({ manifest, onOpen }: Props) {
	const { t, formatNumber } = useI18n();
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
							</div>
						</li>
					);
				})}
			</ol>
		</div>
	);
}
