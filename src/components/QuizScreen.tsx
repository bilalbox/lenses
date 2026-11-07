/**
 * The quiz page: loads the question pools, runs the quiz session, and hands
 * the active question to its lens view.
 */
import { useCallback, useEffect, useReducer, useRef } from "react";
import { stripTashkeel } from "../lib/arabic";
import type { MutashabihQuestion } from "../lib/mutashabihQuiz";
import type { QuizQuestion, SarfQuestion, UsulQuestion } from "../lib/quizBank";
import type { QuizLens } from "../lib/quizCatalog";
import {
	activeQuestion,
	initQuizSession,
	type QuizSessionEvent,
	type QuizSessionState,
	reduceQuizSession,
} from "../lib/quizSession";
import type { ExampleQuery } from "../lib/search";
import type { Manifest } from "../lib/types";
import { IrabLens } from "./quiz/IrabLens";
import { MutashabihLens } from "./quiz/MutashabihLens";
import type { LensProps } from "./quiz/QuizFrame";
import { SarfLens } from "./quiz/SarfLens";
import { UsulLens } from "./quiz/UsulLens";
import { useQuizPools } from "./quiz/useQuizPools";

export function QuizScreen({
	manifest,
	initialLens,
	onOpenInReader,
	onOpenSearch,
	hideDiacritics = false,
	extendedRoles = false,
}: {
	manifest: Manifest;
	initialLens?: QuizLens;
	onOpenInReader: (sura: number, verse: number, word?: number) => void;
	onOpenSearch?: (seed: Partial<ExampleQuery>) => void;
	hideDiacritics?: boolean;
	/** Also ask the extended iʿrāb roles (ẓarf, mustathnā, …). */
	extendedRoles?: boolean;
}) {
	const { pools: quizPools, loading } = useQuizPools(manifest, extendedRoles);
	// The reducer reads the pools of the latest render.
	const pools = useRef(quizPools);
	pools.current = quizPools;
	const [session, dispatch] = useReducer(
		(state: QuizSessionState, event: QuizSessionEvent) =>
			reduceQuizSession(state, event, pools.current),
		initialLens,
		(initLens) => initQuizSession(initLens),
	);
	const { lens } = session;

	useEffect(() => {
		if (initialLens && initialLens !== session.lens) {
			dispatch({ type: "selectLens", lens: initialLens });
		}
	}, [initialLens, session.lens]);
	const targetBtnRef = useRef<HTMLButtonElement | null>(null);
	const ayahBoxRef = useRef<HTMLDivElement | null>(null);
	const { irab: irabPool, sarf: sarfPool } = quizPools;

	// Turning the extended roles on or off reorders the iʿrāb pool, so the
	// current index would land on another question: pick afresh.
	const shownRoles = useRef(extendedRoles);
	useEffect(() => {
		if (shownRoles.current === extendedRoles) return;
		shownRoles.current = extendedRoles;
		dispatch({ type: "repool", lens: "irab", random: Math.random() });
	}, [extendedRoles]);

	// Always open quiz on a random verse (once curated pools are ready).
	useEffect(() => {
		if (session.seeded || loading) return;
		if (irabPool.length === 0 && sarfPool.length === 0) return;
		const raf = requestAnimationFrame(() => {
			dispatch({
				type: "seed",
				random: {
					irab: Math.random(),
					sarf: Math.random(),
					mutashabih: Math.random(),
					usul: Math.random(),
				},
			});
		});
		return () => cancelAnimationFrame(raf);
	}, [irabPool.length, loading, session.seeded, sarfPool.length]);

	const question = activeQuestion(session, pools.current);
	const questionId = question?.id;

	useEffect(() => {
		if (questionId || lens) {
			targetBtnRef.current?.scrollIntoView({
				behavior: "smooth",
				block: "nearest",
				inline: "center",
			});
		}
	}, [questionId, lens]);

	const handleSelectLens = (nextLens: QuizLens) =>
		dispatch({ type: "selectLens", lens: nextLens });
	const handleNextRandom = () =>
		dispatch({ type: "next", random: Math.random() });
	const handleSubmit = useCallback(() => dispatch({ type: "submit" }), []);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
				e.preventDefault();
				handleSubmit();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [handleSubmit]);

	useEffect(() => {
		if (lens || questionId) {
			ayahBoxRef.current?.scrollTo({ top: 0 });
		}
	}, [lens, questionId]);

	if (loading || !session.seeded || !question) {
		return (
			<div className="skeleton page-skeleton" aria-hidden="true">
				<span />
				<span />
				<span />
			</div>
		);
	}

	const shared: Omit<LensProps<never>, "question"> = {
		session,
		dispatch,
		show: (text) => (hideDiacritics ? stripTashkeel(text) : text),
		onSubmit: handleSubmit,
		onNext: handleNextRandom,
		onSelectLens: handleSelectLens,
		onOpenInReader,
		targetBtnRef,
		ayahBoxRef,
	};
	if (lens === "usul")
		return <UsulLens {...shared} question={question as UsulQuestion} />;
	if (lens === "mutashabih")
		return (
			<MutashabihLens {...shared} question={question as MutashabihQuestion} />
		);
	if (lens === "irab")
		return (
			<IrabLens
				{...shared}
				question={question as QuizQuestion}
				extendedRoles={extendedRoles}
			/>
		);
	return (
		<SarfLens
			{...shared}
			question={question as SarfQuestion}
			onOpenSearch={onOpenSearch}
		/>
	);
}
