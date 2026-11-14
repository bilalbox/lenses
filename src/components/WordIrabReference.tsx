import { formatIrabText } from "../lib/formatIrab";
import { useI18n } from "../lib/i18n/I18nContext";
import { getEntriesForWord } from "../lib/irabDictionary";
import { useLayer } from "../lib/layers";
import type { Segment, Word } from "../lib/types";

interface Props {
	word: Word;
	segment?: Segment;
	onNavigateAyah?: (sura: number, verse: number) => void;
}

/**
 * Displays grammar rules, usage cases (al-wujuh al-i'rabiyyah), and parse models
 * from Tahir Yusuf al-Khatib's "al-Mu'jam al-Mufassal fi al-I'rab" when the
 * current word or segment matches an entry.
 */
export function WordIrabReference({ word, segment, onNavigateAyah }: Props) {
	const { t } = useI18n();
	const { data } = useLayer("irabDictionary");

	const entries = getEntriesForWord(data, word, segment);
	if (entries.length === 0) return null;

	return (
		<section className="sheet-irab-ref" dir="rtl">
			<h3 className="sheet-section-label">{t.sheet.irabReferenceTitle}</h3>
			{entries.map((entry, index) => (
				<details
					key={entry.id}
					className="verse-layer irab-ref-drawer"
					open={index === 0}
				>
					<summary>
						<span className="verse-layer-title" lang="ar">
							{entry.title}
						</span>
						<span className="verse-layer-meta">
							{entry.bab} · {t.sheet.irabReferenceSource(entry.page)}
						</span>
					</summary>
					<div className="verse-layer-body">
						<div className="prose irab-prose sheet-metric-prose">
							{entry.body.map((para, pIdx) => (
								<p key={pIdx}>{formatIrabText(para)}</p>
							))}
						</div>
						{entry.citations.length > 0 ? (
							<div className="irab-ref-citations-box" dir="ltr">
								<span className="irab-ref-citations-label">
									{t.sheet.irabReferenceCitations(entry.citations.length)}:
								</span>
								<div className="irab-ref-citations-list">
									{entry.citations.slice(0, 10).map(([s, v], cIdx) => (
										<a
											key={cIdx}
											href={`#/${s}/${v}`}
											className="irab-ref-cite-chip"
											onClick={(e) => {
												if (onNavigateAyah) {
													e.preventDefault();
													onNavigateAyah(s, v);
												}
											}}
										>
											{s}:{v}
										</a>
									))}
									{entry.citations.length > 10 ? (
										<span className="irab-ref-cite-more">
											+{entry.citations.length - 10}
										</span>
									) : null}
								</div>
							</div>
						) : null}
					</div>
				</details>
			))}
		</section>
	);
}
