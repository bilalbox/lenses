import { useI18n } from "../../lib/i18n/I18nContext";
import type { SurahStructureFile } from "../../lib/types";

interface Props {
	structure: SurahStructureFile;
	onJump?: (sura: number) => void;
}

export function MunasabatCard({ structure, onJump }: Props) {
	const { t, formatNumber } = useI18n();
	const link = structure.transitionToNext;
	if (!link) return null;

	return (
		<section className="munasabat-card" aria-label={t.verse.munasabatCardTitle}>
			<header className="munasabat-card-head">
				<div>
					<p className="munasabat-eyebrow">{t.verse.munasabatCardTitle}</p>
					<h3>
						{structure.nameEn} → {link.targetNameEn}
					</h3>
					<p className="munasabat-ar-names" lang="ar" dir="rtl">
						{structure.nameAr} ← {link.targetNameAr}
					</p>
				</div>
				<span className="munasabat-bridge-badge">
					{t.verse.munasabatBridgeBadge}
				</span>
			</header>

			<div className="munasabat-exegesis">
				<article className="munasabat-quote is-suyuti">
					<header>
						<span className="munasabat-source-badge">
							{t.verse.munasabatSuyutiWork}
						</span>
						<small>{t.verse.munasabatSuyutiLabel}</small>
					</header>
					<p lang="ar" dir="rtl" className="munasabat-quote-ar">
						{link.suyutiLinkAr}
					</p>
					<p className="munasabat-quote-en">{link.suyutiLinkEn}</p>
				</article>

				{(link.biqaiSummaryAr || link.biqaiSummaryEn) && (
					<article className="munasabat-quote is-biqai">
						<header>
							<span className="munasabat-source-badge">
								{t.verse.munasabatBiqaiWork}
							</span>
							<small>{t.verse.munasabatBiqaiLabel}</small>
						</header>
						{link.biqaiSummaryAr ? (
							<p lang="ar" dir="rtl" className="munasabat-quote-ar">
								{link.biqaiSummaryAr}
							</p>
						) : null}
						{link.biqaiSummaryEn ? (
							<p className="munasabat-quote-en">{link.biqaiSummaryEn}</p>
						) : null}
					</article>
				)}
			</div>

			<div className="munasabat-actions">
				<button
					type="button"
					className="munasabat-jump"
					onClick={() => onJump?.(link.targetSura)}
				>
					{t.verse.munasabatJumpNext(
						link.targetNameEn,
						formatNumber(link.targetSura),
					)}
				</button>
			</div>
		</section>
	);
}
