import { formatIrabText } from "../lib/formatIrab";
import { useI18n } from "../lib/i18n/I18nContext";
import { getCitationsForVerse } from "../lib/irabDictionary";
import { useLayer } from "../lib/layers";
import type { Verse } from "../lib/types";

interface Props {
	sura: number;
	verse: Verse;
}

/**
 * Displays entries from al-Khatib's "al-Mu'jam al-Mufassal fi al-I'rab"
 * that cite this verse as a grammatical proof text.
 */
export function VerseIrabCitations({ sura, verse }: Props) {
	const { t } = useI18n();
	const { data } = useLayer("irabDictionary");

	const citations = getCitationsForVerse(data, sura, verse.v);
	if (citations.length === 0) return null;

	return (
		<details className="verse-layer irab-citation-block">
			<summary>
				<span className="verse-layer-title">{t.verse.irabCitationTitle}</span>
				<span className="verse-layer-meta">
					{t.verse.irabCitationBadge(citations.length)}
				</span>
			</summary>
			<div className="verse-layer-body" dir="rtl">
				<p className="source-line">{t.verse.irabCitationSource}</p>
				<p className="irab-citation-intro">
					{t.verse.irabCitationIntro(`${sura}:${verse.v}`)}
				</p>
				<div className="irab-citation-cards">
					{citations.map((entry) => (
						<article key={entry.id} className="irab-citation-card">
							<h4 className="irab-citation-head" lang="ar">
								ـ {entry.title} ـ{" "}
								<small className="irab-citation-meta">
									({entry.bab} · {t.sheet.irabReferenceSource(entry.page)})
								</small>
							</h4>
							<div className="prose irab-prose">
								{entry.body.map((para, idx) => (
									<p key={idx}>{formatIrabText(para)}</p>
								))}
							</div>
						</article>
					))}
				</div>
			</div>
		</details>
	);
}
