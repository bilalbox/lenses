/**
 * The quiz's question pools: the precomputed grammar bank hydrated against the
 * quiz surahs (curated first, the rest in the background), and the mutashabih
 * bank. Loading more surahs only appends, so pool indices stay put.
 */
import { useEffect, useMemo, useState } from "react";
import { loadLayer } from "../../lib/layers";
import { toMutashabihQuestions } from "../../lib/mutashabihQuiz";
import {
	CURATED_SURAHS,
	EXTENDED_QUIZ_SURAHS,
	type GrammarPools,
	hydrateQuizPools,
	type QuizBankFile,
	type QuizPools,
	type UsulQuestion,
} from "../../lib/quizBank";
import { QUIZ_ROLES } from "../../lib/quizCatalog";
import type { Manifest, MutashabihQuizFile, SurahFile } from "../../lib/types";
import type { UsuliShahid } from "../../lib/usulTypes";

const NO_GRAMMAR: GrammarPools = { irab: [], sarf: [] };
const OFFERED_ROLES = new Set(QUIZ_ROLES.map((role) => role.code));

export function useQuizPools(manifest: Manifest): {
	pools: QuizPools;
	loading: boolean;
} {
	const [loadedFiles, setLoadedFiles] = useState<SurahFile[]>([]);
	const [grammarBank, setGrammarBank] = useState<QuizBankFile | null>(null);
	const [loading, setLoading] = useState(true);
	const [mutashabihBank, setMutashabihBank] =
		useState<MutashabihQuizFile | null>(null);
	const [usulBank, setUsulBank] = useState<UsuliShahid[] | null>(null);
	const [surah2, setSurah2] = useState<SurahFile | null>(null);

	// Wave 1: Load CURATED_SURAHS immediately for fast initial paint
	useEffect(() => {
		if (!manifest) return;
		let cancel = false;
		Promise.all([
			Promise.all(CURATED_SURAHS.map((n) => loadLayer("surah", n))),
			// Each bank is one file; without one only its lenses are empty.
			loadLayer("quizBank").catch(() => null),
			loadLayer("mutashabihQuiz").catch(() => null),
			loadLayer("usul", 2).catch(() => null),
			loadLayer("surah", 2).catch(() => null),
		])
			.then(([files, bank, mutashabih, usul, s2]) => {
				if (cancel) return;
				setLoadedFiles(files);
				setGrammarBank(bank);
				setMutashabihBank(mutashabih);
				setUsulBank(usul ? usul.shawahid : null);
				setSurah2(s2);
				setLoading(false);

				// Wave 2: Load EXTENDED_QUIZ_SURAHS in the background for deeper variety
				void Promise.all(
					EXTENDED_QUIZ_SURAHS.map((n) =>
						loadLayer("surah", n).catch(() => null),
					),
				).then((more) => {
					if (cancel) return;
					const validMore = more.filter((f): f is SurahFile => f !== null);
					if (validMore.length > 0) {
						setLoadedFiles((prev) => {
							const seen = new Set(prev.map((p) => p.n));
							return [...prev, ...validMore.filter((f) => !seen.has(f.n))];
						});
					}
				});
			})
			.catch(() => {
				if (!cancel) setLoading(false);
			});
		return () => {
			cancel = true;
		};
	}, [manifest]);

	const grammarPools = useMemo(
		() =>
			grammarBank ? hydrateQuizPools(grammarBank, loadedFiles) : NO_GRAMMAR,
		[grammarBank, loadedFiles],
	);
	const usulPool = useMemo<UsulQuestion[]>(() => {
		if (!usulBank) return [];
		return usulBank.map((s) => {
			const verse = surah2?.verses.find((v) => v.v === s.ayahNumber) ?? {
				v: s.ayahNumber,
				ar: s.shahidPhraseAr,
				en: "",
				w: [],
			};
			return {
				id: s.id,
				sura: 2,
				suraName: surah2?.name ?? "البقرة",
				suraPhonetic: surah2?.phonetic ?? "Al-Baqarah",
				verse,
				shahid: s,
			};
		});
	}, [usulBank, surah2]);

	const pools = useMemo<QuizPools>(() => {
		return {
			...grammarPools,
			irab: grammarPools.irab.filter((q) => OFFERED_ROLES.has(q.relation)),
			mutashabih: mutashabihBank
				? toMutashabihQuestions(mutashabihBank, manifest.units)
				: [],
			usul: usulPool,
		};
	}, [grammarPools, mutashabihBank, manifest.units, usulPool]);

	return { pools, loading };
}
