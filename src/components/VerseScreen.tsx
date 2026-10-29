import {
	type FormEvent,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import {
	loadAsbab,
	loadSurah,
	loadSurahMutashabih,
	loadSurahSyntax,
	loadVerseTranslation,
} from "../lib/api";
import { normalizeDigits } from "../lib/i18n/format";
import { useI18n } from "../lib/i18n/I18nContext";
import type { ReaderPrefs } from "../lib/readerPrefs";
import { useRhetoric } from "../lib/rhetoric";
import type {
	AsbabData,
	Manifest,
	SurahFile,
	SurahMutashabihFile,
	SurahSyntaxFile,
	SyntaxGraph,
	Verse,
	VerseSyntax,
} from "../lib/types";
import { DependencyTree } from "./DependencyTree";
import { NoorBayanTree } from "./NoorBayanTree";
import { VerseSecondaryLayers } from "./VerseSecondaryLayers";
import { WordSheet } from "./WordSheet";

interface Props {
	manifest: Manifest;
	sura: number;
	verseNumber: number;
	wordNumber?: number;
	tab?: string;
	target?: string;
	readerPrefs: ReaderPrefs;
	onNavigate: (
		sura: number,
		verse: number,
		word?: number,
		params?: Record<string, string>,
	) => void;
	onSearchRoot: (root: string) => void;
	onSearchLemma: (lemma: string) => void;
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
	onSearchLemma,
}: Props) {
	const { t } = useI18n();
	const [file, setFile] = useState<SurahFile | null>(null);
	const [error, setError] = useState("");
	const [jump, setJump] = useState(`${sura}:${verseNumber}`);
	const [segment, setSegment] = useState<number | undefined>(undefined);

	useEffect(() => {
		let cancel = false;
		setError("");
		loadSurah(sura)
			.then((next) => {
				if (!cancel) setFile(next);
			})
			.catch((reason: unknown) => {
				if (!cancel)
					setError(
						reason instanceof Error
							? reason.message
							: "Could not load this surah.",
					);
			});
		return () => {
			cancel = true;
		};
	}, [sura]);

	useEffect(() => {
		if (wordNumber !== undefined || sura || verseNumber) {
			setJump(`${sura}:${verseNumber}`);
			setSegment(undefined);
		}
	}, [sura, verseNumber, wordNumber]);

	const unit = manifest.units.find((item) => item.n === sura);
	const verse = file?.verses.find((item) => item.v === verseNumber) ?? null;
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
							selectedSegment={segment}
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
					segmentIndex={segment}
					onSelectSegment={setSegment}
					onClose={() => onNavigate(sura, verse.v)}
					onSearchRoot={onSearchRoot}
					onSearchLemma={onSearchLemma}
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
	selectedSegment,
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
	selectedSegment?: number;
	onSelect: (word: number, segment?: number) => void;
	goal?: string;
	revSeq?: number;
	surahClass?: string;
	tab?: string;
	target?: string;
	readerPrefs: ReaderPrefs;
	onNavigate?: (
		sura: number,
		verse: number,
		word?: number,
		params?: Record<string, string>,
	) => void;
}) {
	const { locale, t, formatNumber } = useI18n();
	const graphs = verse.g ?? [];
	const frozen = selected !== undefined;
	const narrow = useNarrow();
	const [clauseIndex, setClauseIndex] = useState(0);
	const [clauseEdgeHint, setClauseEdgeHint] = useState("");
	const [irabOpen, setIrabOpen] = useState(false);

	const [asbabData, setAsbabData] = useState<AsbabData | null>(null);
	const [syntaxFile, setSyntaxFile] = useState<SurahSyntaxFile | null>(null);
	const [mutashabihFile, setMutashabihFile] =
		useState<SurahMutashabihFile | null>(null);
	const [asbabOpen, setAsbabOpen] = useState(
		() => tab === "asbab" || window.location.search.includes("asbab=1"),
	);
	const [mutashabihOpen, setMutashabihOpen] = useState(
		() => tab === "mutashabih",
	);
	const [balaghaOpen, setBalaghaOpen] = useState(() => tab === "balagha");
	const [syntaxClauseIndex, setSyntaxClauseIndex] = useState(0);

	useEffect(() => {
		if (tab === "mutashabih") setMutashabihOpen(true);
		if (tab === "asbab") setAsbabOpen(true);
		if (tab === "balagha") setBalaghaOpen(true);
	}, [tab]);

	useEffect(() => {
		let cancelled = false;
		loadSurahMutashabih(sura)
			.then((data) => {
				if (!cancelled) {
					setMutashabihFile(data);
					if (
						tab === "mutashabih" ||
						window.location.search.includes("mutashabih=1")
					) {
						setMutashabihOpen(true);
					}
				}
			})
			.catch(() => {
				if (!cancelled) setMutashabihFile(null);
			});
		return () => {
			cancelled = true;
		};
	}, [sura, tab]);

	useEffect(() => {
		let cancelled = false;
		loadAsbab()
			.then((data) => {
				if (!cancelled) {
					setAsbabData(data);
					if (tab === "asbab" || window.location.search.includes("asbab=1")) {
						setAsbabOpen(true);
					}
				}
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [tab]);

	useEffect(() => {
		let cancelled = false;
		setSyntaxClauseIndex(0);
		loadSurahSyntax(sura)
			.then((data) => {
				if (!cancelled) setSyntaxFile(data);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [sura]);

	const verseAsbab = useMemo(() => {
		if (!asbabData) return [];
		return asbabData[`${sura}:${verse.v}`] ?? [];
	}, [asbabData, sura, verse.v]);

	const verseSyntax = useMemo(() => {
		if (!syntaxFile) return null;
		return syntaxFile.verses.find((item) => item.v === verse.v) ?? null;
	}, [syntaxFile, verse.v]);

	const verseMutashabih = useMemo(() => {
		if (!mutashabihFile) return null;
		return mutashabihFile.verses.find((item) => item.v === verse.v) ?? null;
	}, [mutashabihFile, verse.v]);

	const mutashabihMatches = verseMutashabih?.matches ?? [];

	const scrollToLayer = useCallback((selector: string) => {
		window.setTimeout(() => {
			document
				.querySelector(selector)
				?.scrollIntoView({ behavior: "smooth", block: "start" });
		}, 50);
	}, []);

	const handleOpenAsbab = useCallback(() => {
		setAsbabOpen((open) => {
			const next = !open;
			if (next) scrollToLayer(".asbab-block");
			return next;
		});
	}, [scrollToLayer]);

	const membership = useMemo(
		() => clauseMembership(graphs, sura, verse.v),
		[graphs, sura, verse.v],
	);
	const segments = useMemo(
		() => groupWords(verse.w, membership),
		[verse.w, membership],
	);
	useEffect(() => {
		if (sura || verse.v) {
			setClauseIndex(0);
			setClauseEdgeHint("");
			setIrabOpen(false);
			setMutashabihOpen(tab === "mutashabih");
			setAsbabOpen(tab === "asbab");
			setBalaghaOpen(tab === "balagha");
		}
	}, [sura, verse.v, tab]);
	useEffect(() => {
		if (!clauseEdgeHint) return;
		const timer = window.setTimeout(() => setClauseEdgeHint(""), 2200);
		return () => window.clearTimeout(timer);
	}, [clauseEdgeHint]);
	const openClause = (index: number) => {
		setClauseIndex(index);
		setClauseEdgeHint("");
		if (!narrow)
			document
				.getElementById(`clause-${index}`)
				?.scrollIntoView({ behavior: "smooth", block: "start" });
	};
	const stepClause = (delta: number) => {
		const next = clauseIndex + delta;
		if (next < 0) {
			setClauseEdgeHint(t.verse.firstClause);
			return;
		}
		if (next >= graphs.length) {
			setClauseEdgeHint(t.verse.lastClause);
			return;
		}
		openClause(next);
	};
	const { entries: rhetoricEntries } = useRhetoric();
	const classicalBalagha = useMemo(
		() =>
			rhetoricEntries.find(
				(e) =>
					e.dataset === "classical-balagha" &&
					e.sura === sura &&
					e.verse === verse.v,
			),
		[rhetoricEntries, sura, verse.v],
	);
	const rhetoricForTranslation = useMemo(
		() => rhetoricEntries.find((e) => e.sura === sura && e.verse === verse.v),
		[rhetoricEntries, sura, verse.v],
	);

	const [fetchedTranslation, setFetchedTranslation] = useState<string>("");

	useEffect(() => {
		if (locale === "ar") {
			setFetchedTranslation("");
			return;
		}
		const key = locale === "id" ? "indonesian_sabiq" : "english_saheeh";
		const preloaded =
			locale === "id"
				? rhetoricForTranslation?.indonesianAyah
				: rhetoricForTranslation?.englishAyah;
		if (preloaded) {
			setFetchedTranslation(preloaded);
			return;
		}
		let cancelled = false;
		loadVerseTranslation(key, sura, verse.v).then((text) => {
			if (!cancelled) setFetchedTranslation(text);
		});
		return () => {
			cancelled = true;
		};
	}, [locale, sura, verse.v, rhetoricForTranslation]);
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
				asbabOpen={asbabOpen}
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
										openClause(segment.clause as number);
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
				readerPrefs={readerPrefs}
				fetchedTranslation={fetchedTranslation}
				irabOpen={irabOpen}
				onIrabToggle={setIrabOpen}
				mutashabihMatches={mutashabihMatches}
				mutashabihOpen={mutashabihOpen}
				onMutashabihToggle={setMutashabihOpen}
				tab={tab}
				target={target}
				onSelect={onSelect}
				onNavigate={onNavigate}
				verseAsbab={verseAsbab}
				asbabOpen={asbabOpen}
				onAsbabToggle={setAsbabOpen}
				classicalBalagha={classicalBalagha}
				balaghaOpen={balaghaOpen}
				onBalaghaToggle={setBalaghaOpen}
				nahwPanel={
					readerPrefs.nahw ? (
						<NahwSyntaxSection
							verseSyntax={verseSyntax}
							graphs={graphs}
							narrow={narrow}
							sura={sura}
							verse={verse}
							selected={selected}
							selectedSegment={selectedSegment}
							frozen={frozen}
							clauseIndex={clauseIndex}
							syntaxClauseIndex={syntaxClauseIndex}
							onSelectClause={openClause}
							onSelectSyntaxClause={setSyntaxClauseIndex}
							onStepClause={stepClause}
							onSelectWord={onSelect}
							clauseEdgeHint={clauseEdgeHint}
						/>
					) : null
				}
			/>
		</>
	);
}

function useNarrow() {
	const [narrow, setNarrow] = useState(false);
	useEffect(() => {
		const query = window.matchMedia("(max-width: 720px)");
		const apply = () => setNarrow(query.matches);
		apply();
		query.addEventListener("change", apply);
		return () => query.removeEventListener("change", apply);
	}, []);
	return narrow;
}

function clauseMembership(
	graphs: NonNullable<Verse["g"]>,
	sura: number,
	verse: number,
) {
	const membership = new Map<number, number>();
	graphs.forEach((graph, index) => {
		for (const node of graph.nodes) {
			if (
				node.s === sura &&
				node.v === verse &&
				node.w &&
				!membership.has(node.w)
			)
				membership.set(node.w, index);
		}
	});
	return membership;
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
		surahClass || null,
	].filter(Boolean);

	return (
		<header className="verse-title">
			<div className="verse-title-header-row">
				<h1>
					<span lang="ar">{unitName}</span>
					<small>{metaParts.join(" · ")}</small>
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
	graphs,
	narrow,
	sura,
	verse,
	selected,
	selectedSegment,
	frozen,
	clauseIndex,
	syntaxClauseIndex,
	onSelectClause,
	onSelectSyntaxClause,
	onStepClause,
	onSelectWord,
	clauseEdgeHint,
}: {
	verseSyntax: VerseSyntax | null;
	graphs: SyntaxGraph[];
	narrow: boolean;
	sura: number;
	verse: Verse;
	selected?: number;
	selectedSegment?: number;
	frozen: boolean;
	clauseIndex: number;
	syntaxClauseIndex: number;
	onSelectClause: (index: number) => void;
	onSelectSyntaxClause: (index: number) => void;
	onStepClause: (delta: number) => void;
	onSelectWord: (word: number, segment?: number) => void;
	clauseEdgeHint: string;
}) {
	const { t, formatNumber } = useI18n();

	if (verseSyntax?.sentences && verseSyntax.sentences.length > 0) {
		const activeSentence =
			verseSyntax.sentences[syntaxClauseIndex] ?? verseSyntax.sentences[0]!;
		return (
			<section className="noorbayan-nahw-section">
				<div className="noorbayan-nahw-header">
					<div>
						<h3 className="noorbayan-nahw-title">{t.verse.nahwTabTitle}</h3>
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
							aria-label="Clauses"
						>
							{verseSyntax.sentences.map((sent, idx) => (
								<button
									key={sent.id}
									type="button"
									className={`noorbayan-clause-btn${idx === syntaxClauseIndex ? " is-active" : ""}`}
									onClick={() => onSelectSyntaxClause(idx)}
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

	if (!graphs.length) {
		return (
			<div className="banner">
				<strong>{t.verse.noTreeTitle}</strong>
			</div>
		);
	}

	const show = narrow
		? graphs.filter((_, index) => index === clauseIndex)
		: graphs;

	return (
		<>
			{graphs.length > 1 ? (
				<div className="tree-tools">
					<nav className="clause-outline" dir="rtl" aria-label="Clauses">
						{graphs.map((_, index) => (
							<button
								key={index}
								type="button"
								className={index === clauseIndex ? "is-on" : ""}
								onClick={() => onSelectClause(index)}
							>
								{formatNumber(index + 1)}
							</button>
						))}
					</nav>
				</div>
			) : null}
			{show.map((graph) => {
				const index = graphs.indexOf(graph);
				return (
					<DependencyTree
						key={index}
						graph={graph}
						index={index}
						total={graphs.length}
						sura={sura}
						verse={verse.v}
						words={verse.w}
						selectedWord={selected}
						selectedSegment={selectedSegment}
						frozen={frozen}
						current={index === clauseIndex}
						onSelectWord={(nextSura, nextVerse, word, segmentIndex) => {
							if (nextSura === sura && nextVerse === verse.v)
								onSelectWord(word, segmentIndex);
							else window.location.hash = `#/${nextSura}/${nextVerse}/${word}`;
						}}
					/>
				);
			})}
			{narrow && graphs.length > 1 ? (
				<div className="clause-stepper">
					<button
						type="button"
						onClick={() => onStepClause(-1)}
						aria-label={t.common.previous}
					>
						{t.common.previous}
					</button>
					<span className={clauseEdgeHint ? "is-edge-hint" : ""} role="status">
						{clauseEdgeHint || t.verse.clauseCount(clauseIndex, graphs.length)}
					</span>
					<button
						type="button"
						onClick={() => onStepClause(1)}
						aria-label={t.common.next}
					>
						{t.common.next}
					</button>
				</div>
			) : null}
		</>
	);
}
