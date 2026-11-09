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
	const [isMobileModal, setIsMobileModal] = useState(
		() =>
			typeof window !== "undefined" &&
			window.matchMedia("(max-width: 1099px)").matches,
	);
	const touchY = useRef(0);
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

	// Focus trap while the sheet is the modal dialog (≤1099px)
	useEffect(() => {
		const media = window.matchMedia("(max-width: 1099px)");
		const sheetEl = sheetRef.current;
		if (!sheetEl) return;

		const FOCUSABLE =
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

		const bind = () => {
			if (!media.matches) return undefined;
			const focusable = sheetEl.querySelectorAll<HTMLElement>(FOCUSABLE);
			focusable[0]?.focus();
			const onKey = (event: KeyboardEvent) => {
				if (event.key !== "Tab") return;
				const elements = sheetEl.querySelectorAll<HTMLElement>(FOCUSABLE);
				if (elements.length === 0) return;
				const first = elements[0];
				const last = elements[elements.length - 1];
				if (event.shiftKey && document.activeElement === first) {
					event.preventDefault();
					last?.focus();
				} else if (!event.shiftKey && document.activeElement === last) {
					event.preventDefault();
					first?.focus();
				}
			};
			window.addEventListener("keydown", onKey);
			return () => window.removeEventListener("keydown", onKey);
		};

		let unbind = bind();
		const onChange = () => {
			unbind?.();
			unbind = bind();
		};
		media.addEventListener("change", onChange);
		return () => {
			unbind?.();
			media.removeEventListener("change", onChange);
		};
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

	// Track mobile modal mode + lock body scroll
	useEffect(() => {
		const media = window.matchMedia("(max-width: 1099px)");
		const update = () => {
			setIsMobileModal(media.matches);
			document.body.style.overflow = media.matches ? "hidden" : "";
		};
		update();
		media.addEventListener("change", update);
		return () => {
			document.body.style.overflow = "";
			media.removeEventListener("change", update);
		};
	}, []);

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
		<div
			className={`sheet-backdrop${closing ? " is-closing" : ""}`}
			onClick={handleClose}
			role="presentation"
		>
			<aside
				ref={sheetRef}
				className={`sheet${expanded ? " is-expanded" : ""}${closing ? " is-closing" : ""}`}
				role="dialog"
				aria-modal={isMobileModal ? true : undefined}
				aria-label={t.sheet.analysisAria(word.n)}
				onClick={(event) => event.stopPropagation()}
			>
				<button
					type="button"
					className="sheet-handle"
					aria-label={expanded ? t.sheet.collapseAria : t.sheet.expandAria}
					onClick={() => setExpanded((value) => !value)}
					onTouchStart={(event) => {
						touchY.current = event.touches[0]?.clientY ?? 0;
					}}
					onTouchEnd={(event) => {
						const end = event.changedTouches[0]?.clientY ?? touchY.current;
						const delta = end - touchY.current;
						if (delta > 48) handleClose();
						else if (delta < -48) setExpanded(true);
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
				<p className="sheet-word" dir="rtl" lang="ar">
					{word.a}
				</p>
				<WordGloss word={word} />
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
		</div>
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
