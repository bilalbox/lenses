import {
	type FormEvent,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { normalizeDigits } from "../lib/i18n/format";
import { useI18n } from "../lib/i18n/I18nContext";
import { findVerse, useLayer } from "../lib/layers";
import { sentenceOfWord } from "../lib/noorBayan";
import { useReaderLayers } from "../lib/readerLayers";
import type { ReaderPrefs } from "../lib/readerPrefs";
import type { Manifest, Verse, VerseRef, VerseSyntax } from "../lib/types";
import { NoorBayanTree } from "./NoorBayanTree";
import { VerseSecondaryLayers } from "./VerseSecondaryLayers";
import { WordSheet } from "./WordSheet";

interface Props {
	manifest: Manifest;
	sura: number;
	verseNumber: number;
	wordNumber?: number;
	tab?: string;
	target?: VerseRef;
	readerPrefs: ReaderPrefs;
	onNavigate: (
		sura: number,
		verse: number,
		word?: number,
		params?: Record<string, string>,
	) => void;
	onSearchRoot: (root: string) => void;
}

export function VerseScreen({
	manifest,
	sura,
	verseNumber,
	wordNumber,
	tab,
	target,
	readerPrefs,
	onNavigate,
	onSearchRoot,
}: Props) {
	const { t } = useI18n();
	const { data: file, error } = useLayer("surah", sura);
	const [jump, setJump] = useState(`${sura}:${verseNumber}`);
	const [segment, setSegment] = useState<number | undefined>(undefined);

	useEffect(() => {
		if (wordNumber !== undefined || sura || verseNumber) {
			setJump(`${sura}:${verseNumber}`);
			setSegment(undefined);
		}
	}, [sura, verseNumber, wordNumber]);

	const unit = manifest.units.find((item) => item.n === sura);
	const verse = (file && findVerse(file, verseNumber)) ?? null;
	const word = verse?.w.find((item) => item.n === wordNumber);

	const goJump = (event: FormEvent) => {
		event.preventDefault();
		const raw = normalizeDigits(jump).trim();
		const match = raw.match(/^(\d{1,3})\s*[:\u061b]\s*(\d{1,3})$/);
		if (!match) return;
		onNavigate(Number(match[1]), Number(match[2]));
	};

	const step = useCallback(
		(delta: number) => {
			if (!unit || !file) return;
			let nextVerse = verseNumber + delta;
			let nextSura = sura;
			if (nextVerse < 1) {
				nextSura = sura === 1 ? 114 : sura - 1;
				nextVerse =
					manifest.units.find((item) => item.n === nextSura)?.verses ?? 1;
			} else if (nextVerse > unit.verses) {
				nextSura = sura === 114 ? 1 : sura + 1;
				nextVerse = 1;
			}
			onNavigate(nextSura, nextVerse);
		},
		[file, manifest.units, onNavigate, sura, unit, verseNumber],
	);

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement | null;
			if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
				return;
			if (event.key === "ArrowLeft") step(1);
			if (event.key === "ArrowRight") step(-1);
			if (event.key === "Escape") onNavigate(sura, verseNumber);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onNavigate, step, sura, verseNumber]);

	return (
		<div className={`stage${word ? " has-sheet" : ""}`}>
			<div className="reading">
				<div className="verse-toolbar">
					<button
						type="button"
						onClick={() => step(-1)}
						aria-label={t.common.previous}
					>
						{t.common.previous}
					</button>
					<form onSubmit={goJump}>
						<label>
							{t.common.verse}
							<input
								value={jump}
								onChange={(event) => setJump(event.target.value)}
								inputMode="numeric"
								aria-label={t.common.chapterAndVerse}
							/>
						</label>
						<button type="submit">{t.common.open}</button>
					</form>
					<button
						type="button"
						onClick={() => step(1)}
						aria-label={t.common.next}
					>
						{t.common.next}
					</button>
				</div>

				{error ? (
					<p className="banner error">{error}</p>
				) : !verse || !unit ? (
					<div className="skeleton" aria-hidden="true">
						<span />
						<span />
						<span />
					</div>
				) : (
					<div key={`${sura}-${verseNumber}`} className="anim-soft-enter">
						<VerseBody
							manifest={manifest}
							unitName={unit.name}
							phonetic={unit.phonetic}
							title={unit.title}
							revelation={unit.rev}
							sura={sura}
							verse={verse}
							selected={word?.n}
							onSelect={(wordIndex, segmentIndex) => {
								setSegment(segmentIndex);
								onNavigate(sura, verse.v, wordIndex);
							}}
							goal={unit.goal || file?.goal}
							revSeq={unit.revSeq}
							surahClass={unit.surahClass}
							tab={tab}
							target={target}
							readerPrefs={readerPrefs}
							onNavigate={onNavigate}
						/>
					</div>
				)}
			</div>
			{verse && word ? (
				<WordSheet
					sura={sura}
					verse={verse}
					word={word}
					qiraatEnabled={readerPrefs.qiraat}
					segmentIndex={segment}
					onSelectSegment={setSegment}
					onClose={() => onNavigate(sura, verse.v)}
					onSearchRoot={onSearchRoot}
				/>
			) : null}
		</div>
	);
}

function VerseBody({
	manifest,
	unitName,
	phonetic,
	revelation,
	sura,
	verse,
	selected,
	onSelect,
	goal,
	revSeq,
	surahClass,
	tab,
	target,
	readerPrefs,
	onNavigate,
}: {
	manifest: Manifest;
	unitName: string;
	phonetic: string;
	title: string;
	revelation: string;
	sura: number;
	verse: Verse;
	selected?: number;
	onSelect: (word: number, segment?: number) => void;
	goal?: string;
	revSeq?: number;
	surahClass?: string;
	tab?: string;
	target?: VerseRef;
	readerPrefs: ReaderPrefs;
	onNavigate?: (
		sura: number,
		verse: number,
		word?: number,
		params?: Record<string, string>,
	) => void;
}) {
	const { locale, t, formatNumber } = useI18n();
	// One clause index for the ayah line and the NoorBayan tree.
	const [clauseIndex, setClauseIndex] = useState(0);
	const layers = useReaderLayers(readerPrefs, sura, verse, locale, tab);
	const verseAsbab = layers.asbab.narrations;

	const scrollToLayer = useCallback((selector: string) => {
		window.setTimeout(() => {
			document
				.querySelector(selector)
				?.scrollIntoView({ behavior: "smooth", block: "start" });
		}, 50);
	}, []);

	const { drawers, setDrawer } = layers;
	const handleOpenAsbab = useCallback(() => {
		const next = !drawers.asbab;
		setDrawer("asbab", next);
		if (next) scrollToLayer(".asbab-block");
	}, [drawers.asbab, setDrawer, scrollToLayer]);

	const sentences = layers.nahw.syntax?.sentences;
	const membership = useMemo(
		() => sentenceOfWord(sentences ?? []),
		[sentences],
	);
	const segments = useMemo(
		() => groupWords(verse.w, membership),
		[verse.w, membership],
	);
	return (
		<>
			<VerseHeaderCard
				unitName={unitName}
				phonetic={phonetic}
				revelation={revelation}
				sura={sura}
				verseNumber={verse.v}
				goal={goal}
				revSeq={revSeq}
				surahClass={surahClass}
				showAsbab={readerPrefs.asbab && verseAsbab.length > 0}
				asbabCount={verseAsbab.length}
				asbabOpen={drawers.asbab}
				onOpenAsbab={handleOpenAsbab}
			/>
			<p className="verse-line" dir="rtl" lang="ar">
				{segments.map((segment) =>
					segment.clause === null ? (
						segment.words.map((word) => (
							<button
								key={word.n}
								type="button"
								className={selected === word.n ? "is-on" : ""}
								onClick={() => onSelect(word.n)}
							>
								{word.a}
							</button>
						))
					) : (
						<span
							key={segment.words[0]?.n ?? segment.clause}
							className={`verse-span${segment.clause === clauseIndex ? " is-current" : ""}`}
						>
							{segment.words.map((word) => (
								<button
									key={word.n}
									type="button"
									className={selected === word.n ? "is-on" : ""}
									onClick={() => {
										onSelect(word.n);
										setClauseIndex(segment.clause as number);
									}}
								>
									{word.a}
								</button>
							))}
						</span>
					),
				)}
				<span className="ayah-mark">{formatNumber(verse.v)}</span>
			</p>
			<p className="source-line">
				{t.common.tanzilSource} ·{" "}
				<a href="https://tanzil.net/" target="_blank" rel="noreferrer">
					tanzil.net
				</a>
			</p>

			<VerseSecondaryLayers
				manifest={manifest}
				sura={sura}
				verse={verse}
				layers={layers}
				target={target}
				onSelect={onSelect}
				onNavigate={onNavigate}
				nahwPanel={
					layers.nahw.enabled ? (
						<NahwSyntaxSection
							verseSyntax={layers.nahw.syntax}
							loading={layers.nahw.loading}
							sura={sura}
							verse={verse}
							selected={selected}
							clauseIndex={clauseIndex}
							onSelectClause={setClauseIndex}
							onSelectWord={onSelect}
						/>
					) : null
				}
			/>
		</>
	);
}

function groupWords(words: Verse["w"], membership: Map<number, number>) {
	const segments: { clause: number | null; words: Verse["w"] }[] = [];
	for (const word of words) {
		const clause = membership.get(word.n) ?? null;
		const last = segments[segments.length - 1];
		if (last && last.clause === clause) last.words.push(word);
		else segments.push({ clause, words: [word] });
	}
	return segments;
}

function VerseHeaderCard({
	unitName,
	phonetic,
	revelation,
	sura,
	verseNumber,
	goal,
	revSeq,
	surahClass,
	showAsbab,
	asbabCount,
	asbabOpen,
	onOpenAsbab,
}: {
	unitName: string;
	phonetic: string;
	revelation: string;
	sura: number;
	verseNumber: number;
	goal?: string;
	revSeq?: number;
	surahClass?: string;
	showAsbab: boolean;
	asbabCount: number;
	asbabOpen: boolean;
	onOpenAsbab: () => void;
}) {
	const { t, formatNumber } = useI18n();
	const revelationLabel =
		revelation === "Madinah" ? t.verse.madinan : t.verse.meccan;
	const metaParts = [
		revelationLabel,
		`${formatNumber(sura)}:${formatNumber(verseNumber)}`,
		phonetic,
		goal ? t.verse.surahGoalLabel : null,
		revSeq ? t.verse.revelationOrder(revSeq) : null,
	].filter(Boolean);

	return (
		<header className="verse-title">
			<div className="verse-title-header-row">
				<h1>
					<span lang="ar">{unitName}</span>
					<small>
						{metaParts.join(" · ")}
						{surahClass ? (
							<>
								{" · "}
								<span lang="ar">{surahClass}</span>
							</>
						) : null}
					</small>
				</h1>
				{showAsbab ? (
					<div className="verse-actions-header">
						<button
							type="button"
							className={`asbab-badge-button${asbabOpen ? " is-active" : ""}`}
							onClick={onOpenAsbab}
							title={t.verse.asbabSectionTitle}
						>
							{t.verse.asbabBadge(asbabCount)}
						</button>
					</div>
				) : null}
			</div>

			{goal ? (
				<p className="maqasid-goal-text" lang="ar" dir="rtl">
					{goal}
				</p>
			) : null}
		</header>
	);
}

function NahwSyntaxSection({
	verseSyntax,
	loading,
	sura,
	verse,
	selected,
	clauseIndex,
	onSelectClause,
	onSelectWord,
}: {
	verseSyntax: VerseSyntax | null;
	loading: boolean;
	sura: number;
	verse: Verse;
	selected?: number;
	clauseIndex: number;
	onSelectClause: (index: number) => void;
	onSelectWord: (word: number, segment?: number) => void;
}) {
	const { t } = useI18n();

	if (verseSyntax?.sentences && verseSyntax.sentences.length > 0) {
		const activeSentence =
			verseSyntax.sentences[clauseIndex] ?? verseSyntax.sentences[0]!;
		return (
			<section className="noorbayan-nahw-section">
				<div className="noorbayan-nahw-header">
					<div>
						<h2 className="noorbayan-nahw-title">{t.verse.nahwTabTitle}</h2>
						<p className="source-line">
							{t.verse.treebankNoorBayan} ·{" "}
							<a
								href="https://github.com/NoorBayan/Quranic-Treebank"
								target="_blank"
								rel="noreferrer"
							>
								NoorBayan
							</a>
						</p>
					</div>

					{verseSyntax.sentences.length > 1 && (
						<nav
							className="noorbayan-clause-outline"
							dir="rtl"
							aria-label={t.verse.clausesAria}
						>
							{verseSyntax.sentences.map((sent, idx) => (
								<button
									key={sent.id}
									type="button"
									className={`noorbayan-clause-btn${idx === clauseIndex ? " is-active" : ""}`}
									onClick={() => onSelectClause(idx)}
								>
									{t.verse.clauseCount(idx, verseSyntax.sentences.length)}
								</button>
							))}
						</nav>
					)}
				</div>

				<NoorBayanTree
					sentence={activeSentence}
					sura={sura}
					verseNumber={verse.v}
					selectedWord={selected}
					onSelectWord={(wordNum) => onSelectWord(wordNum)}
				/>
			</section>
		);
	}

	if (loading) {
		return (
			<div className="skeleton" aria-hidden="true">
				<span />
				<span />
				<span />
			</div>
		);
	}

	return (
		<div className="banner">
			<strong>{t.verse.noTreeTitle}</strong>
		</div>
	);
}
