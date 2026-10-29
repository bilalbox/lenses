import { useI18n } from "../lib/i18n/I18nContext";
import type { AsbabNarration } from "../lib/types";

interface Props {
	narrations: AsbabNarration[];
}

export function AsbabSection({ narrations }: Props) {
	const { t, formatNumber } = useI18n();

	if (narrations.length === 0) {
		return <p className="asbab-empty">{t.verse.noTreeTitle}</p>;
	}

	return (
		<div className="asbab-section-body">
			{narrations.map((item, index) => (
				<article key={item.id} className="asbab-card">
					<div className="asbab-card-top">
						<span className="asbab-card-num">
							رواية #{formatNumber(index + 1)}
						</span>
						<span
							className={`asbab-grade-badge grade-${item.grade}`}
							title={item.gradeLabel}
						>
							{item.gradeLabel || item.grade}
						</span>
					</div>

					<p className="asbab-narration-text" lang="ar">
						{item.text}
					</p>

					{item.takhrij ? (
						<div className="asbab-takhrij-block">
							<div className="asbab-takhrij-label">التخريج والحكم:</div>
							<p className="asbab-takhrij-text" lang="ar">
								{item.takhrij}
							</p>
						</div>
					) : null}
				</article>
			))}

			<footer className="asbab-footer">
				<p className="asbab-citation">
					المصدر: <strong>المحرر في أسباب نزول القرآن</strong> — أ.د. خالد بن
					سليمان المزيني
				</p>
			</footer>
		</div>
	);
}
