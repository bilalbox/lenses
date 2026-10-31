import { stripDiacritics } from "./arabic";
import type { MutashabihQuestion } from "./mutashabihQuiz";
import {
	type QuizCase,
	type QuizRelation,
	type QuizSign,
	SARF_CLASSES,
	SARF_STRUCTURES,
} from "./quizCatalog";
import type { ExampleQuery } from "./search";
import type {
	SurahFile,
	SurahSyntaxFile,
	SyntaxSentence,
	SyntaxToken,
	Verse,
	Word,
} from "./types";

export interface QuizQuestion {
	id: string;
	sura: number;
	suraName: string;
	suraPhonetic: string;
	verse: Verse;
	targetWord: Word;
	headWord: Word;
	relation: QuizRelation;
	/** Canonical normalized role (e.g. predx -> pred for display if needed, or distinct) */
	grammaticalCase: QuizCase;
	sign: QuizSign;
	signDetailAr: string;
	classicalIrab: string;
	clauseWords: Word[];
}

/** Fast initial surahs loaded immediately on quiz open */
export const CURATED_SURAHS = [
	1, 59, 67, 78, 87, 93, 94, 97, 103, 108, 109, 110, 112, 113, 114,
];

/** Additional treebank-annotated surahs loaded in the background for deeper variety */
export const EXTENDED_QUIZ_SURAHS = [
	62, 63, 64, 68, 71, 72, 73, 74, 75, 76, 79, 80, 81, 82, 83, 84, 85, 86, 88,
	89, 90, 91, 92, 95, 96, 98, 99, 100, 101, 102,
];

const HARAKAT_RE = /[\u064B-\u0652\u0670\u0640\u06E1\u06E5\u06E6]/g;

function stripHarakat(text: string): string {
	return text.replace(HARAKAT_RE, "");
}

interface ExtractedIrabMeta {
	grammaticalCase: QuizCase;
	sign: QuizSign;
	detailAr: string;
	stemRole: QuizRelation | "SKIP" | null;
	isMultiKhabar: boolean;
	hasElidedGovernor: boolean;
}

function parseStemRoleFromClause(
	beforeAlama: string,
	fullStemClause: string,
): QuizRelation | "SKIP" | null {
	if (
		beforeAlama.includes("مجرور لفظا") ||
		beforeAlama.includes("ظرف زمان") ||
		beforeAlama.includes("ظرف مكان") ||
		beforeAlama.includes("نائب عن ظرف") ||
		beforeAlama.includes("نايب عن ظرف") ||
		(beforeAlama.includes("توكيد") && !beforeAlama.includes("حرف توكيد")) ||
		beforeAlama.includes("مفعول لأجله") ||
		beforeAlama.includes("مفعول له") ||
		beforeAlama.includes("مفعول معه") ||
		beforeAlama.includes("منادى") ||
		beforeAlama.includes("مستثنى") ||
		beforeAlama.includes("نزع الخافض") ||
		beforeAlama.includes("حذف الجار") ||
		fullStemClause.startsWith("ظرف ")
	) {
		return "SKIP";
	}

	if (beforeAlama.includes("نايب فاعل") || beforeAlama.includes("نائب فاعل"))
		return "pass";
	if (
		beforeAlama.includes("مفعول مطلق") ||
		beforeAlama.includes("نايب عن المفعول المطلق") ||
		beforeAlama.includes("نائب عن المفعول المطلق")
	) {
		return "cog";
	}
	if (beforeAlama.includes("مفعول به")) return "obj";
	if (beforeAlama.includes("مضاف اليه") || beforeAlama.includes("مضاف إليه"))
		return "poss";
	if (
		beforeAlama.includes("اسم مجرور") ||
		beforeAlama.includes("مجرور ب") ||
		beforeAlama.includes("اسم الجلالة مجرور")
	) {
		return "gen";
	}
	if (beforeAlama.includes("معطوف")) return "conj";
	if (beforeAlama.includes("نعت") || beforeAlama.includes("صفة")) return "adj";
	if (beforeAlama.includes("بدل") || beforeAlama.includes("عطف بيان"))
		return "app";
	if (beforeAlama.includes("حال")) return "circ";
	if (beforeAlama.includes("تمييز")) return "spec";
	if (beforeAlama.includes("خبر")) return "pred";
	if (
		beforeAlama.includes("مبتدا") ||
		beforeAlama.includes("مبتدأ") ||
		/اسم\s+(?:الجللاله\s+|الجلالة\s+)?(?:﴿)?(?:ان|إن|أن|كان|يكون|يكاد|ليت|لعل|لا|اصبح|أصبح|اضحى|أضحى|ظل|بات|صار|ليس|ما|عسى|كاد|لكن)/.test(
			beforeAlama,
		)
	) {
		return "subjx";
	}
	if (beforeAlama.replace(/اسم الفاعل/g, "").includes("فاعل")) return "subj";
	return null;
}

function extractIrabMeta(
	irab: string,
	fallbackCase: QuizCase,
): ExtractedIrabMeta | null {
	if (!irab) return null;
	const clauses = irab
		.split(/[،.]/)
		.map((s) => s.trim())
		.filter(Boolean);

	let stemClauseBare = "";
	for (const c of clauses) {
		const bare = stripHarakat(c).replace(/\s+/g, " ");
		if (/علامة\s+(رفعه|نصبه|جره)/.test(bare)) {
			stemClauseBare = bare;
			break;
		}
	}

	if (!stemClauseBare) {
		return null;
	}

	const m = stemClauseBare.match(/^(.*?)علامة\s+(رفعه|نصبه|جره)\s+(.+)$/);
	if (!m?.[1] || !m[2] || !m[3]) return null;

	const beforeAlama = m[1].trim();
	const caseWord = m[2];
	const signClause = m[3].trim();

	const grammaticalCase: QuizCase =
		caseWord === "رفعه"
			? "NOM"
			: caseWord === "نصبه"
				? "ACC"
				: caseWord === "جره"
					? "GEN"
					: fallbackCase;

	const stemRole = parseStemRoleFromClause(beforeAlama, stemClauseBare);
	const isMultiKhabar =
		stemRole === "pred" &&
		(beforeAlama.includes("ثان") ||
			beforeAlama.includes("ثالث") ||
			beforeAlama.includes("رابع"));
	const hasElidedGovernor =
		stemClauseBare.includes("لفعل محذوف") ||
		stemClauseBare.includes("لمبتدإ محذوف") ||
		stemClauseBare.includes("لمبتدا محذوف");

	if (signClause.includes("ممنوع من الصرف")) {
		return {
			grammaticalCase,
			sign: "niyaba_haraka",
			detailAr: signClause.includes("المقدرة")
				? "الفتحة المقدرة نيابة عن الكسرة (ممنوع من الصرف)"
				: "الفتحة نيابة عن الكسرة (ممنوع من الصرف)",
			stemRole,
			isMultiKhabar,
			hasElidedGovernor,
		};
	}
	if (grammaticalCase === "ACC" && signClause.startsWith("الكسرة")) {
		return {
			grammaticalCase,
			sign: "niyaba_haraka",
			detailAr: "الكسرة نيابة عن الفتحة (جمع مؤنث سالم)",
			stemRole,
			isMultiKhabar,
			hasElidedGovernor,
		};
	}
	if (signClause.startsWith("الضمة المقدرة")) {
		return {
			grammaticalCase,
			sign: "muqaddara",
			detailAr: "الضمة المقدرة",
			stemRole,
			isMultiKhabar,
			hasElidedGovernor,
		};
	}
	if (signClause.startsWith("الفتحة المقدرة")) {
		return {
			grammaticalCase,
			sign: "muqaddara",
			detailAr: "الفتحة المقدرة",
			stemRole,
			isMultiKhabar,
			hasElidedGovernor,
		};
	}
	if (signClause.startsWith("الكسرة المقدرة")) {
		return {
			grammaticalCase,
			sign: "muqaddara",
			detailAr: "الكسرة المقدرة",
			stemRole,
			isMultiKhabar,
			hasElidedGovernor,
		};
	}
	if (signClause.startsWith("الياء")) {
		return {
			grammaticalCase,
			sign: "ya",
			detailAr: "الياء (نيابة عن الحركة)",
			stemRole,
			isMultiKhabar,
			hasElidedGovernor,
		};
	}
	if (signClause.startsWith("الواو")) {
		return {
			grammaticalCase,
			sign: "waw",
			detailAr: "الواو (جمع مذكر سالم / الأسماء الخمسة)",
			stemRole,
			isMultiKhabar,
			hasElidedGovernor,
		};
	}
	if (signClause.startsWith("الألف") || signClause.startsWith("الالف")) {
		return {
			grammaticalCase,
			sign: "alif",
			detailAr: "الألف (مثنى / الأسماء الخمسة)",
			stemRole,
			isMultiKhabar,
			hasElidedGovernor,
		};
	}
	if (signClause.startsWith("الضمة")) {
		return {
			grammaticalCase,
			sign: "damma",
			detailAr: "الضمة الظاهرة",
			stemRole,
			isMultiKhabar,
			hasElidedGovernor,
		};
	}
	if (signClause.startsWith("الفتحة") || signClause.startsWith("ال فتحة")) {
		return {
			grammaticalCase,
			sign: "fatha",
			detailAr: "الفتحة الظاهرة",
			stemRole,
			isMultiKhabar,
			hasElidedGovernor,
		};
	}
	if (signClause.startsWith("الكسرة")) {
		return {
			grammaticalCase,
			sign: "kasra",
			detailAr: "الكسرة الظاهرة",
			stemRole,
			isMultiKhabar,
			hasElidedGovernor,
		};
	}

	return null;
}

function normalizeRelation(raw: string): QuizRelation | null {
	if (raw === "predx") return "pred";
	const valid: QuizRelation[] = [
		"subj",
		"pass",
		"obj",
		"subjx",
		"pred",
		"gen",
		"poss",
		"adj",
		"app",
		"conj",
		"circ",
		"cog",
		"spec",
	];
	return valid.includes(raw as QuizRelation) ? (raw as QuizRelation) : null;
}

/** One dependent → head pair from a treebank, before checking it against the classical iʿrāb. */
interface IrabCandidate {
	targetWordNum: number;
	headWordNum: number;
	/** Treebank relation, already mapped onto the quiz vocabulary. */
	relation: QuizRelation;
	/** Index into the target word's morphology segments. */
	segIndex: number;
	clauseWordNums: Set<number>;
	/** For a multi-khabar adj chain: the word of the mubtada / nāsikh it ultimately predicates. */
	predicateHead: () => number | undefined;
}

/**
 * Treebank relations a word's classical role may refine; the classical role
 * wins. Any other disagreement drops the question.
 */
const CLASSICAL_REFINES: Partial<Record<QuizRelation, QuizRelation[]>> = {
	adj: ["app"],
	cog: ["obj", "circ"],
	poss: ["gen"],
	subjx: ["subj"],
	circ: ["obj", "cog"],
	obj: ["spec", "circ"],
};

/** Role and head the question asks for, or null when treebank and classical iʿrāb disagree. */
function reconcileRole(
	c: IrabCandidate,
	meta: ExtractedIrabMeta,
): { relation: QuizRelation; headWordNum: number } | null {
	const tb = c.relation;
	const role = meta.stemRole;
	if (!role || role === tb) return { relation: tb, headWordNum: c.headWordNum };
	if (meta.hasElidedGovernor) return null;
	if (CLASSICAL_REFINES[role as QuizRelation]?.includes(tb))
		return { relation: role as QuizRelation, headWordNum: c.headWordNum };
	if (tb === "adj" && role === "pred" && meta.isMultiKhabar) {
		const head = c.predicateHead();
		if (head === undefined || head === c.targetWordNum) return null;
		return { relation: "pred", headWordNum: head };
	}
	return null;
}

/**
 * Whether a نعت's classical iʿrāb (`نَعْتٌ لِـ﴿سَبْعَ﴾ …`) names a different word
 * of this ayah as the described noun than the treebank's head. Only the opening
 * mention counts: later ones are about attachment or clause position. A mention
 * that matches no word here (another verse) is not a contradiction.
 */
function classicalNamesOtherHead(irab: string, verse: Verse, head: Word) {
	const named = irab.match(/^نَعْتٌ لِـ?﴿([^﴾]+)﴾/)?.[1];
	if (!named) return false;
	const bare = stripDiacritics(named);
	const matches = verse.w.filter((w) => stripDiacritics(w.a) === bare);
	return matches.length > 0 && !matches.some((w) => w.n === head.n);
}

/**
 * Turn a treebank pair into a question when it agrees with the word's classical
 * iʿrāb; disagreeing or unsupported analyses are dropped.
 */
function reconcileIrab(
	file: SurahFile,
	verse: Verse,
	c: IrabCandidate,
): QuizQuestion | null {
	const targetWord = verse.w.find((w) => w.n === c.targetWordNum);
	if (!targetWord?.i) return null;

	// Avoid words whose stem is a pronoun or مبني where sign is not standard declension
	if (targetWord.i.includes("مَبْنِيٌّ") && !targetWord.i.includes("وَعَلَامَةُ")) {
		return null;
	}

	const seg =
		targetWord.s[c.segIndex] ??
		targetWord.s.find((s) => s.k === "m") ??
		targetWord.s[0];
	const rawCase = seg?.f?.case as QuizCase | undefined;
	if (!rawCase || !["NOM", "ACC", "GEN"].includes(rawCase)) return null;

	const meta = extractIrabMeta(targetWord.i, rawCase);
	if (!meta || meta.stemRole === "SKIP") return null;
	const role = reconcileRole(c, meta);
	const headWord = role && verse.w.find((w) => w.n === role.headWordNum);
	if (!role || !headWord) return null;
	if (classicalNamesOtherHead(targetWord.i, verse, headWord)) return null;

	const clauseWords = verse.w.filter((w) => c.clauseWordNums.has(w.n));
	return {
		id: `${file.n}:${verse.v}:${targetWord.n}:${role.relation}`,
		sura: file.n,
		suraName: file.name,
		suraPhonetic: file.phonetic,
		verse,
		targetWord,
		headWord,
		relation: role.relation,
		grammaticalCase: meta.grammaticalCase,
		sign: meta.sign,
		signDetailAr: meta.detailAr,
		classicalIrab: targetWord.i,
		clauseWords: clauseWords.length > 0 ? clauseWords : verse.w,
	};
}

function pushUnique(questions: QuizQuestion[], q: QuizQuestion | null) {
	if (q && !questions.some((other) => other.id === q.id)) questions.push(q);
}

/** NoorBayan codes (`Subj`, `subj<<in>>`, `pred <<kan>>`) onto the quiz vocabulary. */
function normalizeNoorBayanRelation(raw: string): QuizRelation | null {
	const rel = raw.toLowerCase().replace(/\s+/g, "");
	if (rel.startsWith("subj<<")) return "subjx";
	if (rel.startsWith("pred<<")) return "pred";
	return normalizeRelation(rel);
}

type TokenHead = NonNullable<SyntaxToken["head"]>;

/** Up an adj chain of NoorBayan tokens to the head of the `pred` relation it hangs from. */
function noorBayanPredicateHead(
	tokens: Map<string, SyntaxToken>,
	start: TokenHead,
	local: (head: SyntaxToken["head"]) => TokenHead | null,
): number | undefined {
	let cur = tokens.get(`${start[2]}:${start[3]}`);
	for (let depth = 0; depth < 5 && cur; depth++) {
		const rel = normalizeNoorBayanRelation(cur.rel);
		const head = local(cur.head);
		if (!head) return undefined;
		if (rel === "pred") return head[2];
		if (rel !== "adj") return undefined;
		cur = tokens.get(`${head[2]}:${head[3]}`);
	}
	return undefined;
}

function noorBayanCandidates(
	sentence: SyntaxSentence,
	sura: number,
	verse: number,
): IrabCandidate[] {
	const clauseWordNums = new Set(sentence.words.map((w) => w.w));
	const local = (head: SyntaxToken["head"]) =>
		head !== null && head[0] === sura && head[1] === verse ? head : null;
	const tokens = new Map<string, SyntaxToken>();
	const flat = sentence.words.flatMap((word) =>
		word.tokens.map((tok) => {
			tokens.set(`${word.w}:${tok.tok}`, tok);
			return { word: word.w, tok };
		}),
	);
	const candidates: IrabCandidate[] = [];
	for (const { word, tok } of flat) {
		const head = local(tok.head);
		const relation = normalizeNoorBayanRelation(tok.rel);
		if (!head || !relation || head[2] === word) continue;
		candidates.push({
			targetWordNum: word,
			headWordNum: head[2],
			relation,
			segIndex: tok.tok - 1,
			clauseWordNums,
			predicateHead: () => noorBayanPredicateHead(tokens, head, local),
		});
	}
	return candidates;
}

/** iʿrāb questions from the NoorBayan treebank, reconciled with each word's classical iʿrāb. */
function extractIrabQuestions(
	file: SurahFile,
	syntax: SurahSyntaxFile,
): QuizQuestion[] {
	const questions: QuizQuestion[] = [];
	const byVerse = new Map(syntax.verses.map((v) => [v.v, v]));
	for (const verse of file.verses)
		for (const sentence of byVerse.get(verse.v)?.sentences ?? [])
			for (const c of noorBayanCandidates(sentence, file.n, verse.v))
				pushUnique(questions, reconcileIrab(file, verse, c));
	return questions;
}

function spaceRootLetters(text: string): string {
	const bare = stripHarakat(text).replace(/\s+/g, "");
	return [...bare].join(" ");
}

interface ChoiceOption {
	code: string;
	ar: string;
	sub: { ar: string; en: string; id: string };
}

export interface SarfQuestion {
	id: string;
	sura: number;
	suraName: string;
	suraPhonetic: string;
	verse: Verse;
	targetWord: Word;
	headAr: string;
	kind: "verb" | "noun";
	rootRaw: string;
	rootSpaced: string;
	wazn: string;
	classCode: string;
	structureCode: string;
	rootOptions: ChoiceOption[];
	waznOptions: ChoiceOption[];
	classOptions: ChoiceOption[];
	structureOptions: ChoiceOption[];
	asl?: string;
	singular?: string;
	classicalSarf: string;
	classicalMeaning?: string;
	searchSeed: Partial<ExampleQuery>;
}

export interface ExampleHuntQuestion {
	id: string;
	sura: number;
	suraName: string;
	suraPhonetic: string;
	verse: Verse;
	targetWord: Word;
	facetTitle: { ar: string; en: string; id: string };
	facetHint: { ar: string; en: string; id: string };
	facetCategory: "form" | "deriv" | "syntax" | "plural";
	targetWazn: string;
	targetRootSpaced: string;
	classicalSarf: string;
	classicalIrab?: string;
	classicalMeaning?: string;
	searchSeed: Partial<ExampleQuery>;
}

const BLOCK_RE = /\{([^}]*)\}:\s*([^{]*)/g;
const PAREN_RE = /\(([^)]*)\)/;

function hashCode(str: string): number {
	let h = 2166136261;
	for (let i = 0; i < str.length; i++) {
		h ^= str.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

function seededShuffle<T>(items: T[], seedStr: string): T[] {
	const out = [...items];
	let seed = hashCode(seedStr) || 1;
	for (let i = out.length - 1; i > 0; i--) {
		seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
		const j = seed % (i + 1);
		const tmp = out[i]!;
		out[i] = out[j]!;
		out[j] = tmp;
	}
	return out;
}

function extractParen(text: string): string {
	const m = text.match(PAREN_RE);
	return m?.[1] ? m[1].trim() : "";
}

interface ParsedSarfBlock {
	headAr: string;
	kind: "verb" | "noun";
	wazn: string;
	rootRaw: string;
	bab?: string;
	deriv?: string;
	weakClass?: string;
	numberClass?: string;
	asl?: string;
	singular?: string;
}

function normalizeWeakClass(cleanPart: string): string | undefined {
	if (cleanPart.startsWith("صحيح سالم")) return "صحيح سالم";
	if (cleanPart.startsWith("صحيح مهموز")) return "صحيح مهموز";
	if (cleanPart.startsWith("صحيح مضعف")) return "صحيح مضعف";
	if (cleanPart.startsWith("معتل مثال") || cleanPart.startsWith("مثال "))
		return "معتل مثال";
	if (
		cleanPart.startsWith("معتل أجوف") ||
		cleanPart.startsWith("أجوف ") ||
		cleanPart.startsWith("اجوف ")
	)
		return "معتل أجوف";
	if (cleanPart.startsWith("معتل ناقص") || cleanPart.startsWith("ناقص "))
		return "معتل ناقص";
	if (cleanPart.startsWith("معتل لفيف") || cleanPart.startsWith("لفيف "))
		return "معتل لفيف";
	return undefined;
}

function normalizeDerivClass(cleanPart: string): string | undefined {
	if (cleanPart.startsWith("اسم فاعل")) return "اسم فاعل";
	if (cleanPart.startsWith("اسم مفعول")) return "اسم مفعول";
	if (cleanPart.startsWith("صفة مشبهة")) return "صفة مشبهة";
	if (cleanPart.startsWith("صيغة مبالغة")) return "صيغة مبالغة";
	if (cleanPart.startsWith("أفعل التفضيل")) return "أفعل التفضيل";
	if (cleanPart.startsWith("مصدر")) return "مصدر";
	if (cleanPart.startsWith("اسم مكان") || cleanPart.startsWith("اسم زمان"))
		return "اسم مكان / زمان";
	return undefined;
}

function parseSarfFromWord(word: Word): ParsedSarfBlock | null {
	const sf = word.sf;
	if (!sf) return null;
	BLOCK_RE.lastIndex = 0;
	for (;;) {
		const match = BLOCK_RE.exec(sf);
		if (!match) break;
		const match1 = match[1];
		const match2 = match[2];
		if (!match1 || !match2) continue;
		const headAr = match1.trim();
		const rawParts = match2
			.split("،")
			.map((s) => s.replace(/^[.\s]+|[.\s]+$/g, ""))
			.filter(Boolean);
		if (rawParts.length === 0) continue;

		const cleanParts = rawParts.map((p) => stripHarakat(p));
		const first = cleanParts[0];
		if (!first) continue;
		let kind: "verb" | "noun" | null = null;
		if (first.startsWith("فعل")) kind = "verb";
		else if (first === "اسم") kind = "noun";
		if (!kind) continue;

		let wazn = "";
		let rootRaw = "";
		let bab: string | undefined;
		let deriv: string | undefined;
		let isJamid = false;
		let weakClass: string | undefined;
		let numberClass: string | undefined;
		let asl: string | undefined;
		let singular: string | undefined;

		for (let i = 0; i < rawParts.length; i++) {
			const raw = rawParts[i];
			const clean = cleanParts[i];
			if (!raw || !clean) continue;
			if (clean.startsWith("على وزن:")) {
				wazn = extractParen(raw);
			} else if (clean.startsWith("من مادة:")) {
				rootRaw = stripHarakat(extractParen(raw)).replace(/\s+/g, "");
			} else if (clean.startsWith("من باب:")) {
				const b = extractParen(raw);
				if (b && SARF_CLASSES[b]) bab = b;
			} else if (clean.startsWith("أصله:")) {
				asl = extractParen(raw);
			} else if (clean.startsWith("مفرده:")) {
				singular = extractParen(raw);
			} else if (clean === "جامد") {
				isJamid = true;
			} else if (
				clean in SARF_STRUCTURES &&
				SARF_STRUCTURES[clean]?.kind === "noun"
			) {
				numberClass = clean;
			}

			if (!weakClass) {
				weakClass = normalizeWeakClass(clean);
			}
			if (!deriv) {
				deriv = normalizeDerivClass(clean);
			}
		}

		if (kind === "noun" && !deriv && isJamid) {
			deriv = "اسم جامد";
		}
		if (!wazn || !rootRaw || rootRaw.length < 2) continue;

		return {
			headAr,
			kind,
			wazn,
			rootRaw,
			bab,
			deriv,
			weakClass,
			numberClass,
			asl,
			singular,
		};
	}
	return null;
}

function sharedLettersCount(a: string, b: string): number {
	const setB = new Set(b.split(""));
	let count = 0;
	for (const ch of new Set(a.split(""))) {
		if (setB.has(ch)) count++;
	}
	return count;
}

export interface QuizPools {
	irab: QuizQuestion[];
	sarf: SarfQuestion[];
	examples: ExampleHuntQuestion[];
	mutashabih: MutashabihQuestion[];
}

/** The pools built from surah morphology and treebanks; mutashabih comes from its own bank. */
type GrammarPools = Omit<QuizPools, "mutashabih">;

/** One surah's morphology, with its NoorBayan treebank when loaded (needed for iʿrāb questions). */
export interface QuizSource {
	surah: SurahFile;
	syntax?: SurahSyntaxFile;
}

function irabPool(sources: QuizSource[]): QuizQuestion[] {
	const questions: QuizQuestion[] = [];
	for (const { surah, syntax } of sources)
		if (syntax) questions.push(...extractIrabQuestions(surah, syntax));
	return questions;
}

/** Every quiz pool for the loaded surahs: iʿrāb from NoorBayan, ṣarf and examples from morphology. */
export function extractQuizPools(sources: QuizSource[]): GrammarPools {
	const files = sources.map((source) => source.surah);
	interface RawEntry {
		sura: number;
		suraName: string;
		suraPhonetic: string;
		verse: Verse;
		word: Word;
		parsed: ParsedSarfBlock;
	}

	const entries: RawEntry[] = [];
	const allRoots = new Set<string>();
	const verbWazns = new Set<string>();
	const nounWazns = new Set<string>();

	for (const file of files) {
		for (const verse of file.verses) {
			for (const word of verse.w) {
				const parsed = parseSarfFromWord(word);
				if (!parsed) continue;
				entries.push({
					sura: file.n,
					suraName: file.name,
					suraPhonetic: file.phonetic,
					verse,
					word,
					parsed,
				});
				if (parsed.rootRaw.length >= 3) {
					allRoots.add(parsed.rootRaw);
				}
				if (parsed.kind === "verb") verbWazns.add(parsed.wazn);
				else nounWazns.add(parsed.wazn);
			}
		}
	}

	const rootArray = Array.from(allRoots);
	const verbWaznArray = Array.from(verbWazns);
	const nounWaznArray = Array.from(nounWazns);
	const verbClassKeys = Object.keys(SARF_CLASSES).filter(
		(k) => SARF_CLASSES[k]?.kind === "verb",
	);
	const nounClassKeys = Object.keys(SARF_CLASSES).filter(
		(k) => SARF_CLASSES[k]?.kind === "noun",
	);
	const verbStructKeys = Object.keys(SARF_STRUCTURES).filter(
		(k) => SARF_STRUCTURES[k]?.kind === "verb",
	);
	const nounStructKeys = Object.keys(SARF_STRUCTURES).filter(
		(k) => SARF_STRUCTURES[k]?.kind === "noun",
	);

	function buildRootOptions(
		correctRaw: string,
		seedId: string,
	): ChoiceOption[] {
		const near = rootArray.filter(
			(r) =>
				r !== correctRaw &&
				r.length === correctRaw.length &&
				sharedLettersCount(r, correctRaw) >= 2,
		);
		const anagrams = near.filter(
			(r) =>
				r.split("").sort().join("") === correctRaw.split("").sort().join(""),
		);
		const picked: string[] = [];
		const seen = new Set<string>([correctRaw]);
		for (const pool of [
			seededShuffle(anagrams, `${seedId}:anag`),
			seededShuffle(near, `${seedId}:near`),
			seededShuffle(rootArray, `${seedId}:all`),
		]) {
			for (const cand of pool) {
				if (!seen.has(cand)) {
					seen.add(cand);
					picked.push(cand);
					if (picked.length === 3) break;
				}
			}
			if (picked.length === 3) break;
		}

		const allFour = seededShuffle([correctRaw, ...picked], `${seedId}:roots`);
		return allFour.map((r) => ({
			code: r,
			ar: spaceRootLetters(r),
			sub: {
				ar: `مادة (${r})`,
				en: `Root (${spaceRootLetters(r)})`,
				id: `Akar kata (${spaceRootLetters(r)})`,
			},
		}));
	}

	function buildWaznOptions(
		correctWazn: string,
		kind: "verb" | "noun",
		seedId: string,
	): ChoiceOption[] {
		const pool = kind === "verb" ? verbWaznArray : nounWaznArray;
		const cleanTarget = stripHarakat(correctWazn);
		const sameSkeleton = pool.filter(
			(w) => w !== correctWazn && stripHarakat(w) === cleanTarget,
		);
		const similarLen = pool.filter(
			(w) =>
				w !== correctWazn &&
				Math.abs(stripHarakat(w).length - cleanTarget.length) <= 1,
		);
		const picked: string[] = [];
		const seen = new Set<string>([correctWazn]);
		for (const src of [
			seededShuffle(sameSkeleton, `${seedId}:sk`),
			seededShuffle(similarLen, `${seedId}:len`),
			seededShuffle(pool, `${seedId}:wz`),
		]) {
			for (const w of src) {
				if (!seen.has(w)) {
					seen.add(w);
					picked.push(w);
					if (picked.length === 3) break;
				}
			}
			if (picked.length === 3) break;
		}
		return seededShuffle([correctWazn, ...picked], `${seedId}:waznOrder`).map(
			(w) => ({
				code: w,
				ar: w,
				sub: {
					ar: kind === "verb" ? "ميزان الفعل" : "ميزان الاسم",
					en:
						kind === "verb"
							? "Verbal measure (mīzān)"
							: "Nominal measure (mīzān)",
					id: kind === "verb" ? "Wazan fi'il" : "Wazan isim",
				},
			}),
		);
	}

	const sarfQuestions: SarfQuestion[] = [];

	for (const entry of entries) {
		const { sura, suraName, suraPhonetic, verse, word, parsed } = entry;
		const stemSeg = word.s.find((s) => s.k === "m") ?? word.s[0];
		const searchSeed: Partial<ExampleQuery> = {
			root: parsed.rootRaw,
			...(stemSeg?.f?.form ? { form: stemSeg.f.form, pos: "V" } : {}),
		};

		const classCode = parsed.kind === "verb" ? parsed.bab : parsed.deriv;
		const structureCode =
			parsed.kind === "verb" ? parsed.weakClass : parsed.numberClass;

		if (
			classCode &&
			structureCode &&
			SARF_CLASSES[classCode] &&
			SARF_STRUCTURES[structureCode] &&
			// Skip ultra-repetitive jamid singular nouns unless they have an asl or plural
			!(
				parsed.kind === "noun" &&
				classCode === "اسم جامد" &&
				structureCode === "مفرد" &&
				!parsed.asl
			)
		) {
			const id = `sarf:${sura}:${verse.v}:${word.n}`;
			const classPool = parsed.kind === "verb" ? verbClassKeys : nounClassKeys;
			const structPool =
				parsed.kind === "verb" ? verbStructKeys : nounStructKeys;

			const classFoils = seededShuffle(
				classPool.filter((k) => k !== classCode),
				`${id}:cls`,
			).slice(0, 3);
			const structFoils = seededShuffle(
				structPool.filter((k) => k !== structureCode),
				`${id}:str`,
			).slice(0, 3);

			const classOptions: ChoiceOption[] = seededShuffle(
				[classCode, ...classFoils],
				`${id}:clsOrd`,
			).map((k) => {
				const cls = SARF_CLASSES[k]!;
				return {
					code: k,
					ar: cls.ar,
					sub: {
						ar: cls.arSub,
						en: cls.en,
						id: cls.id,
					},
				};
			});

			const structureOptions: ChoiceOption[] = seededShuffle(
				[structureCode, ...structFoils],
				`${id}:strOrd`,
			).map((k) => {
				const str = SARF_STRUCTURES[k]!;
				return {
					code: k,
					ar: str.ar,
					sub: {
						ar: str.arSub,
						en: str.en,
						id: str.id,
					},
				};
			});

			sarfQuestions.push({
				id,
				sura,
				suraName,
				suraPhonetic,
				verse,
				targetWord: word,
				headAr: parsed.headAr,
				kind: parsed.kind,
				rootRaw: parsed.rootRaw,
				rootSpaced: spaceRootLetters(parsed.rootRaw),
				wazn: parsed.wazn,
				classCode,
				structureCode,
				rootOptions: buildRootOptions(parsed.rootRaw, id),
				waznOptions: buildWaznOptions(parsed.wazn, parsed.kind, id),
				classOptions,
				structureOptions,
				asl: parsed.asl,
				singular: parsed.singular,
				classicalSarf: word.sf || "",
				classicalMeaning: word.m,
				searchSeed,
			});
		}
	}

	// Build ExampleHuntQuestion pool (Ayah Pattern Spotter)
	interface FacetRule {
		code: string;
		category: "form" | "deriv" | "syntax" | "plural";
		title: { ar: string; en: string; id: string };
		hint: { ar: string; en: string; id: string };
		matches: (w: Word, p: ParsedSarfBlock | null) => boolean;
		seed: (p: ParsedSarfBlock) => Partial<ExampleQuery>;
	}

	const FACET_RULES: FacetRule[] = [
		{
			code: "form_VIII",
			category: "form",
			title: {
				ar: "فعل مزيد على باب (افْتَعَلَ)",
				en: "Form VIII Verb (Iftaʿala)",
				id: "Fi'il Mazid Wazan VIII (Ifta'ala)",
			},
			hint: {
				ar: "فعل خماسي مزيد بالألف والتاء (مثل: اتَّقُوا، ابتغوا، استمعوا)",
				en: "A 5-letter verb augmented with alif and infixed tāʾ (often assimilated, like ittaqū)",
				id: "Fi'il lima huruf dengan tambahan alif dan ta' (sering mengalami idgham seperti ittaqu)",
			},
			matches: (_w, p) => p?.kind === "verb" && p.bab === "افْتَعَلَ",
			seed: () => ({ pos: "V", form: "VIII" }),
		},
		{
			code: "form_IV",
			category: "form",
			title: {
				ar: "فعل مزيد على باب (أَفْعَلَ)",
				en: "Form IV Verb (Afʿala)",
				id: "Fi'il Mazid Wazan IV (Af'ala)",
			},
			hint: {
				ar: "فعل رباعي مزيد بالهمزة في أوله يفيد التعدية غالباً (مثل: آمَنُوا، أَنزَلَ، يُخْرِبُونَ)",
				en: "A causative 4-letter verb augmented with hamza (often elided in the imperfect)",
				id: "Fi'il empat huruf dengan tambahan hamzah (sering dibuang pada mudhari')",
			},
			matches: (_w, p) => p?.kind === "verb" && p.bab === "أَفْعَلَ",
			seed: () => ({ pos: "V", form: "IV" }),
		},
		{
			code: "form_X",
			category: "form",
			title: {
				ar: "فعل مزيد على باب (اسْتَفْعَلَ)",
				en: "Form X Verb (Istafʿala)",
				id: "Fi'il Mazid Wazan X (Istaf'ala)",
			},
			hint: {
				ar: "فعل سداسي مزيد بالسين والتاء يدل على الطلب أو الصيرورة (مثل: نَسْتَعِينُ، اسْتَغْفِرْ)",
				en: "A 6-letter verb with sīn and tāʾ expressing seeking or requesting",
				id: "Fi'il enam huruf dengan tambahan sin dan ta' yang bermakna memohon/mencari",
			},
			matches: (_w, p) => p?.kind === "verb" && p.bab === "اسْتَفْعَلَ",
			seed: () => ({ pos: "V", form: "X" }),
		},
		{
			code: "form_II_V",
			category: "form",
			title: {
				ar: "فعل مضعف العين (فَعَّلَ / تَفَعَّلَ)",
				en: "Geminate-Stem Verb · Form II / V (Faʿʿala / Tafaʿʿala)",
				id: "Fi'il Bertadh'if Ain · Wazan II / V (Fa''ala / Tafa''ala)",
			},
			hint: {
				ar: "فعل مزيد بتضعيف عينه للتكثير أو التدرج (مثل: قَدَّمَتْ، سَبِّحْ، يَتَفَكَّرُونَ)",
				en: "A verb augmented by doubling its middle radical for intensity or gradation",
				id: "Fi'il dengan penggandaan huruf tengah ('ain fi'il) untuk intensitas",
			},
			matches: (_w, p) =>
				p?.kind === "verb" && (p.bab === "فَعَّلَ" || p.bab === "تَفَعَّلَ"),
			seed: (p) => ({ pos: "V", form: p.bab === "تَفَعَّلَ" ? "V" : "II" }),
		},
		{
			code: "deriv_fail",
			category: "deriv",
			title: {
				ar: "اسم فاعل (مشتق يدل على من قام بالفعل)",
				en: "Active Participle (Ism Fāʿil)",
				id: "Isim Fa'il (Partisipel Aktif)",
			},
			hint: {
				ar: "يصاغ من الثلاثي على (فَاعِل) ومن غيره بضم أوله وكسر ما قبل آخره",
				en: "Formed on fāʿil (Form I) or with prefix mu- and kasra before the final radical",
				id: "Dibentuk dengan pola fa'il (tsulatsi) atau awalan mu- dengan kasrah sebelum akhir",
			},
			matches: (_w, p) => p?.kind === "noun" && p.deriv === "اسم فاعل",
			seed: (p) => ({ root: p.rootRaw, pos: "N,ADJ" }),
		},
		{
			code: "deriv_sifa_mubalagha",
			category: "deriv",
			title: {
				ar: "صفة مشبهة أو صيغة مبالغة",
				en: "Intensive or Assimilated Adjective (Ṣifa Mushabbaha / Mubālagha)",
				id: "Sifat Musyabbahah atau Shighah Mubalaghah",
			},
			hint: {
				ar: "وصف يدل على الثبوت أو الكثرة (على أوزان مثل: فَعِيل، فَعُول، فَعَّال، فَعْلَان)",
				en: "Describes an enduring or intensive attribute (patterns like faʿīl, faʿūl, faʿʿāl)",
				id: "Kata sifat yang menunjukkan ketetapan atau intensitas tinggi (seperti fa'il, fa'ul, fa''al)",
			},
			matches: (_w, p) =>
				p?.kind === "noun" &&
				(p.deriv === "صفة مشبهة" || p.deriv === "صيغة مبالغة"),
			seed: (p) => ({ root: p.rootRaw }),
		},
		{
			code: "deriv_tafdil",
			category: "deriv",
			title: {
				ar: "أفعل التفضيل (اسم تفضيل)",
				en: "Elative / Superlative Noun (Ism Tafḍīl)",
				id: "Isim Tafdhil (Komparatif / Superlatif)",
			},
			hint: {
				ar: "اسم مشتق على وزن (أَفْعَل) أو (فُعْلَى) أو (خَيْر / شَرّ) يدل على الزيادة في الصفة",
				en: "Pattern afʿal / fuʿlā (or khayr / sharr) indicating superiority in a quality",
				id: "Wazan af'al / fu'la (atau khair / syarr) yang menunjukkan makna lebih/paling",
			},
			matches: (_w, p) => p?.kind === "noun" && p.deriv === "أفعل التفضيل",
			seed: (p) => ({ root: p.rootRaw }),
		},
		{
			code: "plural_taksir",
			category: "plural",
			title: {
				ar: "جمع تكسير (تغيرت فيه صورة المفرد)",
				en: "Broken Plural (Jamʿ Taksīr)",
				id: "Jamak Taksir (Jamak Tak Beraturan)",
			},
			hint: {
				ar: "جمع تتغير فيه بنية المفرد على أوزان مثل: أَفْعَال، فُعُول، فِعَال، فَوَاعِل، قُرَى",
				en: "A plural formed by shifting the internal vowel/consonant pattern rather than adding -ūna/-āt",
				id: "Bentuk jamak dengan perubahan pola internal dari bentuk mufradnya",
			},
			matches: (_w, p) =>
				p?.kind === "noun" &&
				(p.numberClass === "جمع تكسير للقلة" ||
					p.numberClass === "جمع تكسير للكثرة"),
			seed: (p) => ({ root: p.rootRaw, pos: "N" }),
		},
		{
			code: "syntax_mansubat",
			category: "syntax",
			title: {
				ar: "منصوب بياني (حال أو تمييز أو مفعول مطلق)",
				en: "Adverbial Accusative (Ḥāl, Tamyīz, or Mafʿūl Muṭlaq)",
				id: "Manshub Keterangan (Hal, Tamyiz, atau Maf'ul Muthlaq)",
			},
			hint: {
				ar: "اسم منصوب يبين الهيئة (حال)، أو يزيل الإبهام (تمييز)، أو يؤكد الفعل بمصدره (مفعول مطلق)",
				en: "An accusative noun describing state (ḥāl), specification (tamyīz), or cognate emphasis",
				id: "Isim manshub yang menjelaskan keadaan (hal), rincian (tamyiz), atau penegasan (maf'ul muthlaq)",
			},
			matches: (w) => {
				const cleanI = stripHarakat(w.i || "");
				return (
					cleanI.includes("حال منصوب") ||
					cleanI.includes("تمييز منصوب") ||
					cleanI.includes("مفعول مطلق")
				);
			},
			seed: (p) => ({ root: p.rootRaw, relation: "circ,spec,cog" }),
		},
	];

	const exampleQuestions: ExampleHuntQuestion[] = [];
	for (const file of files) {
		for (const verse of file.verses) {
			if (verse.w.length < 3 || verse.w.length > 26) continue;
			const parsedMap = new Map<number, ParsedSarfBlock | null>();
			for (const w of verse.w) {
				parsedMap.set(w.n, parseSarfFromWord(w));
			}

			for (const rule of FACET_RULES) {
				const matchingWords = verse.w.filter((w) =>
					rule.matches(w, parsedMap.get(w.n) ?? null),
				);
				if (matchingWords.length !== 1) continue;
				const targetWord = matchingWords[0];
				if (!targetWord) continue;
				const parsed = parsedMap.get(targetWord.n);
				if (!parsed) continue;

				const id = `ex:${file.n}:${verse.v}:${targetWord.n}:${rule.code}`;

				exampleQuestions.push({
					id,
					sura: file.n,
					suraName: file.name,
					suraPhonetic: file.phonetic,
					verse,
					targetWord,
					facetTitle: rule.title,
					facetHint: rule.hint,
					facetCategory: rule.category,
					targetWazn: parsed.wazn,
					targetRootSpaced: spaceRootLetters(parsed.rootRaw),
					classicalSarf: targetWord.sf || "",
					classicalIrab: targetWord.i,
					classicalMeaning: targetWord.m,
					searchSeed: rule.seed(parsed),
				});
			}
		}
	}

	return {
		irab: irabPool(sources),
		sarf: sarfQuestions,
		examples: exampleQuestions,
	};
}
