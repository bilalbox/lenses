import { useCallback, useEffect, useRef, useState } from "react";
import { kindGloss } from "../lib/glossary";
import { useI18n } from "../lib/i18n/I18nContext";
import { useVerseLayer } from "../lib/layers";
import type { ExampleQuery } from "../lib/search";
import type { QiraatRule, Verse, Word, WordQiraat } from "../lib/types";
import { primaryStem } from "../lib/wordStats";
import { CloseIcon } from "./Icons";
import { Tabs } from "./Tabs";
import { WordCounts } from "./WordCounts";
import { WordLexicon } from "./WordLexicon";
import {
	WordGloss,
	WordIrab,
	WordMeaning,
	WordSarf,
} from "./WordSheetSections";
import { WordWujuh } from "./WordWujuh";

interface Props {
	sura: number;
	verse: Verse;
	word: Word;
	/** Reader pref: when off the qirāʾāt file is not fetched. */
	qiraatEnabled: boolean;
	segmentIndex?: number;
	onSelectSegment: (index: number) => void;
	onClose: () => void;
	onSearch: (query: Partial<ExampleQuery>) => void;
}

export function WordSheet({
	sura,
	verse,
	word,
	qiraatEnabled,
	segmentIndex,
	onSelectSegment,
	onClose,
	onSearch,
}: Props) {
	const { locale, t, formatNumber } = useI18n();
	const stem = word.s.find((segment) => segment.k === "m") ?? word.s[0];
	const selected = word.s.find((_, index) => index === segmentIndex) ?? stem;
	const [expanded, setExpanded] = useState(false);
	const [closing, setClosing] = useState(false);
	const touchY = useRef<number | null>(null);
	const closingTimerRef = useRef<number | null>(null);
	const sheetRef = useRef<HTMLElement | null>(null);
	const triggerRef = useRef<HTMLElement | null>(null);
	// A surah without a qirāʾāt file just shows no variants.
	const { data: verseQiraat } = useVerseLayer("qiraat", sura, verse.v, {
		enabled: qiraatEnabled,
	});
	const wordQiraat =
		verseQiraat?.words.find((item) => item.w === word.n) ?? null;

	useEffect(() => {
		triggerRef.current = document.activeElement as HTMLElement | null;
	}, []);

	const handleClose = useCallback(() => {
		if (closing) return;
		const isMobile = window.matchMedia("(max-width: 1099px)").matches;
		if (!isMobile) {
			onClose();
			triggerRef.current?.focus?.();
			return;
		}
		setClosing(true);
		closingTimerRef.current = window.setTimeout(() => {
			onClose();
			triggerRef.current?.focus?.();
		}, 200);
	}, [closing, onClose]);

	// Below 1100px the sheet docks over the lower screen without blocking the
	// verse, so neighbouring words stay tappable. Focus moves in once on open.
	useEffect(() => {
		if (window.matchMedia("(max-width: 1099px)").matches) {
			sheetRef.current?.focus({ preventScroll: true });
		}
	}, []);

	useEffect(() => {
		if (!word) return;
		setClosing(false);
		if (closingTimerRef.current) {
			clearTimeout(closingTimerRef.current);
		}
	}, [word]);

	useEffect(() => {
		return () => {
			if (closingTimerRef.current) {
				clearTimeout(closingTimerRef.current);
			}
		};
	}, []);

	// Escape key dismiss with exit animation
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.stopPropagation();
				handleClose();
			}
		};
		window.addEventListener("keydown", onKeyDown, { capture: true });
		return () =>
			window.removeEventListener("keydown", onKeyDown, { capture: true });
	}, [handleClose]);

	if (!selected) return null;
	const primary = primaryStem(word);
	const chips = (
		<div className="chips" dir="rtl">
			{word.s.map((segment, index) => (
				<button
					key={`${segment.a}-${index}`}
					type="button"
					className={`chip kind-${segment.k}${segment === selected ? " is-on" : ""}`}
					onClick={() => onSelectSegment(index)}
				>
					<b lang="ar">{segment.a}</b>
					<small lang="ar">{kindGloss(segment.k, locale).name}</small>
				</button>
			))}
		</div>
	);

	return (
		<aside
			ref={sheetRef}
			className={`sheet${expanded ? " is-expanded" : ""}${closing ? " is-closing" : ""}`}
			aria-label={t.sheet.analysisAria(word.n)}
			tabIndex={-1}
		>
			<button
				type="button"
				className="sheet-handle"
				aria-label={expanded ? t.sheet.collapseAria : t.sheet.expandAria}
				onClick={() => setExpanded((value) => !value)}
				onTouchStart={(event) => {
					touchY.current = event.touches[0]?.clientY ?? null;
				}}
				onTouchEnd={(event) => {
					const start = touchY.current;
					touchY.current = null;
					const end = event.changedTouches[0]?.clientY;
					if (start === null || end === undefined) return;
					const delta = end - start;
					if (delta > 48) {
						if (expanded) setExpanded(false);
						else handleClose();
					} else if (delta < -48) setExpanded(true);
				}}
				onTouchCancel={() => {
					touchY.current = null;
				}}
			/>
			<header className="sheet-head">
				<p className="sheet-ref">
					{formatNumber(sura)}:{formatNumber(verse.v)}:{formatNumber(word.n)}
				</p>
				<button
					type="button"
					className="icon-button"
					onClick={handleClose}
					aria-label={t.sheet.closeAria}
				>
					<CloseIcon />
				</button>
			</header>
			<div className="sheet-title" dir="rtl">
				<h2 className="sheet-word" lang="ar">
					{word.a}
				</h2>
				<WordGloss word={word} />
			</div>
			{chips}
			<Tabs
				storageKey="lenses-sheet-tab"
				label={t.sheet.tabsAria}
				items={[
					{
						key: "here",
						label: t.sheet.tabHere,
						content: (
							<>
								<WordMeaning word={word} />
								<WordWujuh
									sura={sura}
									verse={verse.v}
									word={word.n}
									stem={primary}
									part="answer"
								/>
								<WordIrab word={word} />
								<WordSarf word={word} />
								{wordQiraat ? (
									<WordQiraatSection wordQiraat={wordQiraat} />
								) : null}
							</>
						),
					},
					{
						key: "across",
						label: t.sheet.tabAcross,
						content: (
							<>
								<WordCounts stem={primary} onSearch={onSearch} />
								<WordWujuh
									sura={sura}
									verse={verse.v}
									word={word.n}
									stem={primary}
									part="list"
								/>
								<WordLexicon stem={primary} openFirst={false} />
							</>
						),
					},
				]}
			/>
		</aside>
	);
}

function QiraatRuleList({ rules }: { rules: QiraatRule[] }) {
	return (
		<div className="qiraat-rules-list">
			{rules.map((rule, idx) => (
				<div key={idx} className="qiraat-rule-item">
					<div className="qiraat-readers-row">
						{rule.readers.map((reader, rIdx) => (
							<span key={rIdx} className="qiraat-reader-pill">
								{reader}
							</span>
						))}
					</div>
					<p className="qiraat-rule-text" lang="ar">
						{rule.rule}
					</p>
				</div>
			))}
		</div>
	);
}

function WordQiraatSection({ wordQiraat }: { wordQiraat: WordQiraat }) {
	const { t } = useI18n();
	const hasQ = wordQiraat.q && wordQiraat.q.length > 0;
	const hasWasl = wordQiraat.wasl && wordQiraat.wasl.length > 0;
	if (!hasQ && !hasWasl && !wordQiraat.note) return null;

	return (
		<section className="qiraat-section" dir="rtl">
			<h3 className="sheet-section-label">{t.sheet.qiraatTitle}</h3>
			<p className="source-line" dir="ltr">
				Al-Qirāʾāt al-ʿAshr ·{" "}
				<a href="https://quran.db" target="_blank" rel="noreferrer">
					qurandb
				</a>
			</p>

			{hasQ && wordQiraat.q ? (
				<div className="qiraat-mode-block">
					<h4 className="qiraat-mode-heading">{t.sheet.qiraatIsolation}</h4>
					<QiraatRuleList rules={wordQiraat.q} />
				</div>
			) : null}

			{hasWasl && wordQiraat.wasl ? (
				<div className="qiraat-mode-block">
					<h4 className="qiraat-mode-heading">{t.sheet.qiraatWasl}</h4>
					<QiraatRuleList rules={wordQiraat.wasl} />
				</div>
			) : null}

			{wordQiraat.note ? (
				<div className="qiraat-note-card">
					<h5 className="qiraat-note-heading">{t.sheet.qiraatSemanticNote}</h5>
					<p className="qiraat-note-text" lang="ar">
						{wordQiraat.note}
					</p>
				</div>
			) : null}
		</section>
	);
}
