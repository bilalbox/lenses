import type { ReactNode } from "react";
import { formatIrabText } from "../lib/formatIrab";
import { useI18n } from "../lib/i18n/I18nContext";
import type { ReaderPrefs } from "../lib/readerPrefs";
import type {
	AsbabNarration,
	Manifest,
	MutashabihMatch,
	RhetoricEntry,
	Verse,
} from "../lib/types";
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
	readerPrefs: ReaderPrefs;
	fetchedTranslation: string;
	irabOpen: boolean;
	onIrabToggle: (open: boolean) => void;
	mutashabihMatches: MutashabihMatch[];
	mutashabihOpen: boolean;
	onMutashabihToggle: (open: boolean) => void;
	tab?: string;
	target?: string;
	onSelect: (word: number, segment?: number) => void;
	onNavigate?: (
		sura: number,
		verse: number,
		word?: number,
		params?: Record<string, string>,
	) => void;
	verseAsbab: AsbabNarration[];
	asbabOpen: boolean;
	onAsbabToggle: (open: boolean) => void;
	classicalBalagha?: RhetoricEntry;
	balaghaOpen: boolean;
	onBalaghaToggle: (open: boolean) => void;
	nahwPanel?: ReactNode;
}

export function VerseSecondaryLayers({
	manifest,
	sura,
	verse,
	readerPrefs,
	fetchedTranslation,
	irabOpen,
	onIrabToggle,
	mutashabihMatches,
	mutashabihOpen,
	onMutashabihToggle,
	tab,
	target,
	onSelect,
	onNavigate,
	verseAsbab,
	asbabOpen,
	onAsbabToggle,
	classicalBalagha,
	balaghaOpen,
	onBalaghaToggle,
	nahwPanel,
}: Props) {
	const { locale, t } = useI18n();
	const showClassicalIrab = readerPrefs.irab && Boolean(verse.ir);
	const showNahw = Boolean(nahwPanel);
	const showIrabDrawer = showClassicalIrab || showNahw;

	return (
		<>
			{readerPrefs.meaning ? (
				<VerseMeaningPanel
					verse={verse}
					locale={locale}
					fetchedTranslation={fetchedTranslation}
				/>
			) : null}

			{showIrabDrawer ? (
				<details
					className="verse-layer irab-block"
					open={irabOpen}
					onToggle={(event) => onIrabToggle(event.currentTarget.open)}
				>
					<summary>
						<span className="verse-layer-title">{t.verse.irabTitle}</span>
						<span className="verse-layer-meta">
							{showClassicalIrab
								? t.common.tafsirCenterSource
								: t.verse.treebankNoorBayan}
						</span>
					</summary>
					<div className="verse-layer-body">
						{showClassicalIrab && verse.ir ? (
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
									{formatIrabText(verse.ir)}
								</div>
							</>
						) : null}
						{showNahw ? (
							<div
								className={`irab-nahw-embed${showClassicalIrab ? " has-classical" : ""}`}
							>
								{nahwPanel}
							</div>
						) : null}
					</div>
				</details>
			) : null}

			{readerPrefs.mutashabih && mutashabihMatches.length > 0 ? (
				<details
					className="verse-layer mutashabih-block"
					open={mutashabihOpen}
					onToggle={(event) => onMutashabihToggle(event.currentTarget.open)}
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
									target: `${sura}:${verse.v}`,
								})
							}
						/>
					</div>
				</details>
			) : readerPrefs.mutashabih && (tab === "mutashabih" || mutashabihOpen) ? (
				<div className="mutashabih-empty-card" role="status">
					<p>{t.verse.mutashabihEmptyState}</p>
				</div>
			) : null}

			{readerPrefs.asbab && verseAsbab.length > 0 ? (
				<details
					className="verse-layer asbab-block"
					open={asbabOpen}
					onToggle={(event) => onAsbabToggle(event.currentTarget.open)}
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

			{readerPrefs.balagha && classicalBalagha ? (
				<details
					className="verse-layer balagha-block"
					open={balaghaOpen}
					onToggle={(event) => onBalaghaToggle(event.currentTarget.open)}
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
						<ClassicalBalaghaSection entry={classicalBalagha} />
					</div>
				</details>
			) : null}
		</>
	);
}
