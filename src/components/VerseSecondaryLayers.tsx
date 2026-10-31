import type { ReactNode } from "react";
import { formatIrabText } from "../lib/formatIrab";
import { useI18n } from "../lib/i18n/I18nContext";
import type { ReaderLayers } from "../lib/readerLayers";
import { verseRefParam } from "../lib/route";
import type { Manifest, Verse, VerseRef } from "../lib/types";
import { AsbabSection } from "./AsbabSection";
import { ClassicalBalaghaSection } from "./ClassicalBalaghaSection";
import { MutashabihSection } from "./MutashabihSection";

interface MeaningProps {
	verse: Verse;
	locale: string;
	fetchedTranslation: string;
}

function VerseMeaningPanel({
	verse,
	locale,
	fetchedTranslation,
}: MeaningProps) {
	const { t } = useI18n();
	return (
		<details className="verse-layer verse-meaning-block">
			<summary>
				<span className="verse-layer-title">{t.verse.verseMeaningTitle}</span>
				<span className="verse-layer-meta">
					{t.verse.verseMeaningSub} · QuranEnc
				</span>
			</summary>
			<div className="verse-layer-body">
				{locale === "en" && (
					<div className="verse-meaning-content">
						{fetchedTranslation ? (
							<div className="verse-meaning-section is-translation">
								<div className="verse-meaning-section-header">
									<span className="verse-meaning-badge">
										{t.verse.translationBadge}
									</span>
									<small className="source-line">
										Saheeh International ·{" "}
										<a
											href="https://quranenc.com/en/browse/english_saheeh"
											target="_blank"
											rel="noreferrer"
										>
											quranenc.com
										</a>
									</small>
								</div>
								<p className="verse-meaning-text" lang="en" dir="ltr">
									{fetchedTranslation}
								</p>
							</div>
						) : null}

						{verse.en ? (
							<div className="verse-meaning-section is-tafsir">
								<div className="verse-meaning-section-header">
									<span className="verse-meaning-badge">
										{t.verse.tafsirBadge}
									</span>
									<small className="source-line">
										Tafsir Center ·{" "}
										<a
											href="https://quranenc.com/en/browse/english_mokhtasar"
											target="_blank"
											rel="noreferrer"
										>
											quranenc.com
										</a>
									</small>
								</div>
								<p className="verse-meaning-prose" lang="en" dir="ltr">
									{verse.en}
								</p>
								{verse.ef ? (
									<p className="mukhtasar-note" lang="en" dir="ltr">
										{verse.ef}
									</p>
								) : null}
							</div>
						) : null}
					</div>
				)}

				{locale === "id" && (
					<div className="verse-meaning-content">
						{fetchedTranslation ? (
							<div className="verse-meaning-section is-translation">
								<div className="verse-meaning-section-header">
									<span className="verse-meaning-badge">
										{t.verse.translationBadge}
									</span>
									<small className="source-line">
										Terjemahan Sabiq (PT. Sabiq) ·{" "}
										<a
											href="https://quranenc.com/en/browse/indonesian_sabiq"
											target="_blank"
											rel="noreferrer"
										>
											quranenc.com
										</a>
									</small>
								</div>
								<p className="verse-meaning-text" lang="id" dir="ltr">
									{fetchedTranslation}
								</p>
							</div>
						) : null}

						{verse.mk ? (
							<div className="verse-meaning-section is-tafsir">
								<div className="verse-meaning-section-header">
									<span className="verse-meaning-badge">
										{t.verse.tafsirBadge}
									</span>
									<small className="source-line">
										Pusat Tafsir ·{" "}
										<a
											href="https://quranenc.com/en/browse/indonesian_mokhtasar"
											target="_blank"
											rel="noreferrer"
										>
											quranenc.com
										</a>
									</small>
								</div>
								<p className="verse-meaning-prose" lang="id" dir="ltr">
									{verse.mk}
								</p>
								{verse.mf ? (
									<p className="mukhtasar-note" lang="id" dir="ltr">
										{verse.mf}
									</p>
								) : null}
							</div>
						) : null}
					</div>
				)}

				{locale === "ar" && (
					<div className="verse-meaning-content">
						{verse.ma ? (
							<div className="verse-meaning-section is-tafsir">
								<p className="prose-ar" lang="ar" dir="rtl">
									{verse.ma}
								</p>
								{verse.af ? (
									<p className="mukhtasar-note" lang="ar" dir="rtl">
										{verse.af}
									</p>
								) : null}
							</div>
						) : null}
					</div>
				)}
			</div>
		</details>
	);
}

interface Props {
	manifest: Manifest;
	sura: number;
	verse: Verse;
	layers: ReaderLayers;
	target?: VerseRef;
	onSelect: (word: number, segment?: number) => void;
	onNavigate?: (
		sura: number,
		verse: number,
		word?: number,
		params?: Record<string, string>,
	) => void;
	nahwPanel?: ReactNode;
}

export function VerseSecondaryLayers({
	manifest,
	sura,
	verse,
	layers,
	target,
	onSelect,
	onNavigate,
	nahwPanel,
}: Props) {
	const { locale, t } = useI18n();
	const { drawers, setDrawer } = layers;
	const classicalIrab = layers.irab.classical;
	const mutashabihMatches = layers.mutashabih.matches;
	const verseAsbab = layers.asbab.narrations;
	const classicalBalagha = layers.balagha.entry;
	const showNahw = Boolean(nahwPanel);

	return (
		<>
			{layers.meaning.enabled ? (
				<VerseMeaningPanel
					verse={verse}
					locale={locale}
					fetchedTranslation={layers.meaning.translation}
				/>
			) : null}

			{classicalIrab || showNahw ? (
				<details
					className="verse-layer irab-block"
					open={drawers.irab}
					onToggle={(event) => setDrawer("irab", event.currentTarget.open)}
				>
					<summary>
						<span className="verse-layer-title">{t.verse.irabTitle}</span>
						<span className="verse-layer-meta">
							{classicalIrab
								? t.common.tafsirCenterSource
								: t.verse.treebankNoorBayan}
						</span>
					</summary>
					<div className="verse-layer-body">
						{classicalIrab ? (
							<>
								<p className="source-line">
									{t.common.tafsirCenterSource} ·{" "}
									<a
										href="https://tafsir.net/"
										target="_blank"
										rel="noreferrer"
									>
										tafsir.net
									</a>
								</p>
								<div className="prose irab-prose" dir="rtl" lang="ar">
									{formatIrabText(classicalIrab)}
								</div>
							</>
						) : null}
						{showNahw ? (
							<div
								className={`irab-nahw-embed${classicalIrab ? " has-classical" : ""}`}
							>
								{nahwPanel}
							</div>
						) : null}
					</div>
				</details>
			) : null}

			{mutashabihMatches.length > 0 ? (
				<details
					className="verse-layer mutashabih-block"
					open={drawers.mutashabih}
					onToggle={(event) =>
						setDrawer("mutashabih", event.currentTarget.open)
					}
				>
					<summary>
						<span className="verse-layer-title">
							{t.verse.mutashabihSectionTitle}
						</span>
						<span className="verse-layer-meta">
							{t.verse.mutashabihBadge(mutashabihMatches.length)}
						</span>
					</summary>
					<div className="verse-layer-body">
						<MutashabihSection
							key={`${sura}:${verse.v}:${target?.sura}:${target?.verse}`}
							manifest={manifest}
							sura={sura}
							verseNumber={verse.v}
							verseWords={verse.w}
							matches={mutashabihMatches}
							initialTarget={target}
							onSelectWord={onSelect}
							onNavigateAyah={(targetSura, targetAyah) =>
								onNavigate?.(targetSura, targetAyah, 1, {
									tab: "mutashabih",
									target: verseRefParam({ sura, verse: verse.v }),
								})
							}
						/>
					</div>
				</details>
			) : layers.mutashabih.enabled &&
				!layers.mutashabih.loading &&
				drawers.mutashabih ? (
				<div className="mutashabih-empty-card" role="status">
					<p>{t.verse.mutashabihEmptyState}</p>
				</div>
			) : null}

			{verseAsbab.length > 0 ? (
				<details
					className="verse-layer asbab-block"
					open={drawers.asbab}
					onToggle={(event) => setDrawer("asbab", event.currentTarget.open)}
				>
					<summary>
						<span className="verse-layer-title">
							{t.verse.asbabSectionTitle}
						</span>
						<span className="verse-layer-meta">
							{t.verse.asbabBadge(verseAsbab.length)}
						</span>
					</summary>
					<div className="verse-layer-body">
						<AsbabSection narrations={verseAsbab} />
					</div>
				</details>
			) : null}

			{classicalBalagha ? (
				<details
					className="verse-layer balagha-block"
					open={drawers.balagha}
					onToggle={(event) => setDrawer("balagha", event.currentTarget.open)}
				>
					<summary>
						<span className="verse-layer-title">
							{t.verse.balaghaSectionTitle}
						</span>
						<span className="verse-layer-meta">
							{classicalBalagha.deviceAr}
						</span>
					</summary>
					<div className="verse-layer-body">
						<ClassicalBalaghaSection
							entry={classicalBalagha}
							showStudioLink={layers.balagha.studioLink}
						/>
					</div>
				</details>
			) : null}
		</>
	);
}
