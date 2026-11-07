import { useI18n } from "../lib/i18n/I18nContext";
import { getTaxonomyNode, USULI_CATEGORY_LABELS } from "../lib/usulTaxonomy";
import type { UsuliShahid } from "../lib/usulTypes";

interface Props {
	shawahid: UsuliShahid[];
	onSelectWord?: (wordIndex: number) => void;
	onNavigateAyah?: (sura: number, ayah: number) => void;
}

export function UsulSection({ shawahid, onSelectWord, onNavigateAyah }: Props) {
	const { t, formatNumber } = useI18n();

	if (shawahid.length === 0) {
		return <p className="asbab-empty">{t.verse.noTreeTitle}</p>;
	}

	return (
		<div className="usul-section-body" dir="rtl" lang="ar">
			{shawahid.map((item, index) => {
				const taxonomy = getTaxonomyNode(item.taxonomyId);
				const category = USULI_CATEGORY_LABELS[item.categoryGroup];
				const qarinahVerse = item.qarinahVerseKey
					? item.qarinahVerseKey.split(":")
					: null;

				return (
					<article key={item.id} className="usul-card">
						<div className="usul-card-header">
							<div className="usul-badge-group">
								<span className="usul-cat-badge">{category.ar}</span>
								<span className="usul-tax-badge">{taxonomy.nameAr}</span>
								{item.isCanonicalShahid ? (
									<span className="usul-canonical-badge">شاهد أصيل</span>
								) : null}
							</div>
							<span className="usul-index-meta">
								شاهد #{formatNumber(index + 1)}
							</span>
						</div>

						<div className="usul-phrase-row">
							<button
								type="button"
								className="usul-phrase-btn"
								onClick={() => onSelectWord?.(item.wordStart)}
								title={`تحديد موضع الشاهد في الآية (الكلمات ${formatNumber(item.wordStart)}–${formatNumber(item.wordEnd)})`}
							>
								<span className="usul-phrase-quote">
									﴿{item.shahidPhraseAr}﴾
								</span>
								<span className="usul-span-coords">
									[الكلمات {formatNumber(item.wordStart)}–
									{formatNumber(item.wordEnd)}]
								</span>
							</button>
						</div>

						<div className="usul-details-grid">
							<div className="usul-detail-item">
								<span className="usul-detail-label">الصيغة الموجبة:</span>
								<span className="usul-detail-value">
									{item.linguisticTriggerAr}
								</span>
							</div>

							<div className="usul-detail-item">
								<span className="usul-detail-label">مجرى الدلالة:</span>
								{item.hasQarinahSarifah ? (
									<span className="usul-detail-value is-shifted">
										{item.defaultDalalahAr} ➔{" "}
										<strong>{item.actualDalalahAr}</strong> (بقرينة صارفة)
									</span>
								) : (
									<span className="usul-detail-value">
										{item.actualDalalahAr} (على الأصل عريت عن الصارف)
									</span>
								)}
							</div>

							{item.hasQarinahSarifah && item.qarinahTextAr ? (
								<div className="usul-qarinah-box">
									<div className="usul-qarinah-head">
										<span className="usul-qarinah-label">القرينة الصارفة:</span>
										{qarinahVerse && onNavigateAyah ? (
											<button
												type="button"
												className="usul-nav-verse-btn"
												onClick={() =>
													onNavigateAyah(
														Number(qarinahVerse[0]),
														Number(qarinahVerse[1]),
													)
												}
											>
												انتقل إلى الآية {item.qarinahVerseKey} ↗
											</button>
										) : null}
									</div>
									<p className="usul-qarinah-text">﴿{item.qarinahTextAr}﴾</p>
								</div>
							) : null}

							<div className="usul-wajh-box">
								<span className="usul-detail-label">وجه الدلالة:</span>
								<p className="usul-prose-text">{item.wajhAlDilalahAr}</p>
							</div>

							<div className="usul-ruling-box">
								<span className="usul-detail-label">
									الحكم الفقهي المستنبط:
								</span>
								<p className="usul-prose-text">{item.derivedFiqhRulingAr}</p>
							</div>

							{item.khilafUsuliAr ? (
								<div className="usul-khilaf-box">
									<span className="usul-detail-label">
										تحرير الخلاف الأصولي:
									</span>
									<p className="usul-prose-text">{item.khilafUsuliAr}</p>
								</div>
							) : null}

							{item.classicalSources.length > 0 ? (
								<div className="usul-sources-row">
									<span className="usul-detail-label">
										أمهات المصادر الأصولية:
									</span>
									<div className="usul-source-tags">
										{item.classicalSources.map((source) => (
											<span key={source} className="usul-source-tag">
												{source}
											</span>
										))}
									</div>
								</div>
							) : null}
						</div>
					</article>
				);
			})}
		</div>
	);
}
