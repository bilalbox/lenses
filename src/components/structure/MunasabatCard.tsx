import type { SurahStructureFile } from "../../lib/types";

interface Props {
	structure: SurahStructureFile;
	onJump?: (sura: number) => void;
}

export function MunasabatCard({ structure, onJump }: Props) {
	const link = structure.transitionToNext;
	if (!link) return null;

	return (
		<section className="munasabat-card" aria-label="Inter-surah munāsabāt">
			<header className="munasabat-card-head">
				<div>
					<p className="munasabat-eyebrow">Munāsabāt · مناسبة السور</p>
					<h3>
						{structure.nameEn} → {link.targetNameEn}
					</h3>
					<p className="munasabat-ar-names" lang="ar" dir="rtl">
						{structure.nameAr} ← {link.targetNameAr}
					</p>
				</div>
				<span className="munasabat-bridge-badge">Thematic bridge</span>
			</header>

			<div className="munasabat-exegesis">
				<article className="munasabat-quote is-suyuti">
					<header>
						<span className="munasabat-source-badge">Tanāsuq al-Durar</span>
						<small>al-Suyūṭī</small>
					</header>
					<p lang="ar" dir="rtl" className="munasabat-quote-ar">
						{link.suyutiLinkAr}
					</p>
					<p className="munasabat-quote-en">{link.suyutiLinkEn}</p>
				</article>

				{(link.biqaiSummaryAr || link.biqaiSummaryEn) && (
					<article className="munasabat-quote is-biqai">
						<header>
							<span className="munasabat-source-badge">Naẓm al-Durar</span>
							<small>al-Biqāʿī</small>
						</header>
						{link.biqaiSummaryAr && (
							<p lang="ar" dir="rtl" className="munasabat-quote-ar">
								{link.biqaiSummaryAr}
							</p>
						)}
						{link.biqaiSummaryEn && (
							<p className="munasabat-quote-en">{link.biqaiSummaryEn}</p>
						)}
					</article>
				)}
			</div>

			<div className="munasabat-actions">
				<button
					type="button"
					className="munasabat-jump"
					onClick={() => onJump?.(link.targetSura)}
				>
					Jump to {link.targetNameEn} ({link.targetSura}) ↗
				</button>
			</div>
		</section>
	);
}
