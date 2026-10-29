import { useI18n } from "../lib/i18n/I18nContext";
import type { RhetoricEntry } from "../lib/types";

interface Props {
	entry: RhetoricEntry;
	showStudioLink?: boolean;
}

export function ClassicalBalaghaSection({
	entry,
	showStudioLink = false,
}: Props) {
	const { locale, t } = useI18n();

	return (
		<div className="balagha-section-body">
			<div className="rhetoric-formula-grid balagha-inline-formula">
				<div className="rhetoric-formula-box is-sub">
					<span className="rhetoric-formula-role">
						{t.verse.balaghaBranchLabel}
					</span>
					<span className="rhetoric-formula-val">{entry.branchAr}</span>
					<span className="rhetoric-formula-sub">{entry.branchEn}</span>
				</div>
				<span className="rhetoric-formula-arrow">➔</span>
				<div className="rhetoric-formula-box is-veh">
					<span className="rhetoric-formula-role">
						{t.verse.balaghaDeviceLabel}
					</span>
					<span className="rhetoric-formula-val">{entry.deviceAr}</span>
					<span className="rhetoric-formula-sub">{entry.deviceEn}</span>
				</div>
			</div>

			{entry.highlightArabic ? (
				<p className="balagha-highlight" lang="ar" dir="rtl">
					{entry.highlightArabic}
				</p>
			) : null}

			{entry.subtypes.length > 0 ? (
				<div className="rhetoric-stage-subtypes">
					{entry.subtypes.map((st) => (
						<span key={st} className="rhetoric-tag-pill">
							{st}
						</span>
					))}
				</div>
			) : null}

			{entry.scholarlyNote ? (
				<blockquote className="balagha-note">
					<p lang="ar" dir="rtl">
						{entry.scholarlyNote.text}
					</p>
					<footer>{entry.scholarlyNote.source}</footer>
				</blockquote>
			) : null}

			{showStudioLink ? (
				<a
					href={`#/rhetoric/${entry.sura}/${entry.verse}`}
					className="balagha-studio-link"
				>
					{locale === "ar" ? (
						<span className="verse-balagha-icon">بلاغة</span>
					) : null}{" "}
					{t.verse.balaghaStudioLink} ↗
				</a>
			) : null}
		</div>
	);
}
