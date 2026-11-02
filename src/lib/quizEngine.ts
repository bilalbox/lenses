/**
 * Builds the grammar quiz's questions from surah morphology and the NoorBayan
 * treebank. Runs ahead of time (`pnpm data:quiz` writes `quizBank.json`); the
 * quiz screen only hydrates that bank.
 */
import { stripDiacritics } from "./arabic";
import {
	type ChoiceOption,
	classChoice,
	type GrammarPools,
	type QuizQuestion,
	rootChoice,
	type SarfQuestion,
	spaceRootLetters,
	stripHarakat,
	structureChoice,
	waznChoice,
} from "./quizBank";
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
	SyntaxWord,
	Verse,
	Word,
} from "./types";

interface ExtractedIrabMeta {
	grammaticalCase: QuizCase;
	sign: QuizSign;
	detailAr: string;
	stemRole: QuizRelation | "SKIP" | null;
	isMultiKhabar: boolean;
	hasElidedGovernor: boolean;
}

const mentions =
	(...phrases: string[]) =>
	(beforeAlama: string) =>
		phrases.some((phrase) => beforeAlama.includes(phrase));

const NASIKH_SUBJECT_RE =
	/اسم\s+(?:الجللاله\s+|الجلالة\s+)?(?:﴿)?(?:ان|إن|أن|كان|يكون|يكاد|ليت|لعل|لا|اصبح|أصبح|اضحى|أضحى|ظل|بات|صار|ليس|ما|عسى|كاد|لكن)/;

/**
 * The role named before «وعلامة …» in a classical iʿrāb clause, first match
 * wins; "SKIP" for roles the quiz does not ask.
 */
const STEM_ROLE_RULES: [
	QuizRelation | "SKIP",
	(beforeAlama: string, fullStemClause: string) => boolean,
][] = [
	[
		"SKIP",
		mentions("مجرور لفظا", "مفعول معه", "منادى", "نزع الخافض", "حذف الجار"),
	],
	[
		"adv",
		(before, full) =>
			mentions("ظرف زمان", "ظرف مكان", "نائب عن ظرف", "نايب عن ظرف")(before) ||
			full.startsWith("ظرف "),
	],
	[
		"emph",
		(before) => before.includes("توكيد") && !before.includes("حرف توكيد"),
	],
	["prp", mentions("مفعول لأجله", "مفعول لاجله", "مفعول له")],
	["exc", mentions("مستثنى")],
	["pass", mentions("نايب فاعل", "نائب فاعل")],
	[
		"cog",
		mentions("مفعول مطلق", "نايب عن المفعول المطلق", "نائب عن المفعول المطلق"),
	],
	["obj", mentions("مفعول به")],
	["poss", mentions("مضاف اليه", "مضاف إليه")],
	["gen", mentions("اسم مجرور", "مجرور ب", "اسم الجلالة مجرور")],
	["conj", mentions("معطوف")],
	["adj", mentions("نعت", "صفة")],
	["app", mentions("بدل", "عطف بيان")],
	["circ", mentions("حال")],
	["spec", mentions("تمييز")],
	["pred", mentions("خبر")],
	[
		"subjx",
		(before) =>
			mentions("مبتدا", "مبتدأ")(before) || NASIKH_SUBJECT_RE.test(before),
	],
	["subj", (before) => before.replace(/اسم الفاعل/g, "").includes("فاعل")],
];

function parseStemRoleFromClause(
	beforeAlama: string,
	fullStemClause: string,
): QuizRelation | "SKIP" | null {
	return (
		STEM_ROLE_RULES.find(([, test]) =>
			test(beforeAlama, fullStemClause),
		)?.[0] ?? null
	);
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
		"prp",
		"emph",
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
	if (rel === "exp") return "exc";
	return normalizeRelation(rel);
}

/** A NoorBayan relation as a quiz role; `link` (متعلق) on a ẓarf token is the ẓarf role. */
function tokenRelation(tok: SyntaxToken): QuizRelation | null {
	if (tok.rel.toLowerCase() === "link")
		return tok.pos.startsWith("ظرف") ? "adv" : null;
	return normalizeNoorBayanRelation(tok.rel);
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
		const relation = tokenRelation(tok);
		if (!head || !relation) continue;
		// A noun inside its own word (الإيمان in بالإيمان) is asked as the
		// whole jārr-majrūr phrase instead; see phraseQuestion.
		if (head[2] === word) continue;
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

/** Derivations of a noun that a jārr-majrūr can attach to: the participles and the maṣdar. */
const VERB_LIKE_DERIV = new Set(["ACT-PCPL", "PASS-PCPL", "VN"]);

/** A verb, adjective or verb-like noun: the words a jārr-majrūr is taught to attach to. */
function canBearPhrase(word: Word): boolean {
	const main = word.s.find((seg) => seg.k === "m");
	if (!main) return false;
	return (
		main.p === "V" ||
		main.p === "ADJ" ||
		VERB_LIKE_DERIV.has(main.f?.deriv ?? "")
	);
}

/**
 * The mutaʿallaq of a word that opens with a joined preposition governing the
 * rest of it (بِالْإِيمَانِ، عَلَيْهِمْ), when the treebank attaches it (`link`)
 * to another word of the same ayah. Elided (مَحْذُوف) attachments have no head.
 */
function phraseHead(sura: number, verse: number, word: SyntaxWord) {
	const [prep, ...rest] = word.tokens;
	const head = prep?.head;
	if (prep?.pos !== "حرف جر" || prep.rel.toLowerCase() !== "link") return null;
	if (!head || head[0] !== sura || head[1] !== verse || head[2] === word.w)
		return null;
	const governsRest = rest.some(
		(t) => t.rel === "gen" && t.head?.[2] === word.w && t.head[3] === prep.tok,
	);
	return governsRest ? head[2] : null;
}

/**
 * Whether a phrase's classical iʿrāb agrees on its mutaʿallaq. Most leave it
 * unnamed; one that names another word (or an attachment to no word, بمعنى
 * النفي) contradicts the treebank.
 */
function classicalAgreesOnAttachment(irab: string, head: Word): boolean {
	const bare = stripDiacritics(irab);
	if (!bare.includes("متعلق")) return true;
	const named = bare.match(/متعلق\S* ب\S*?﴿([^﴾]+)﴾/)?.[1];
	return Boolean(named && stripDiacritics(head.a).includes(named.trim()));
}

/**
 * A joined jārr-majrūr asked as one phrase: its role is the phrase itself and
 * its governor the word it attaches to. It takes no case or sign of its own.
 */
function phraseQuestion(
	file: SurahFile,
	verse: Verse,
	sentence: SyntaxSentence,
	word: SyntaxWord,
): QuizQuestion | null {
	const headNum = phraseHead(file.n, verse.v, word);
	const targetWord = verse.w.find((w) => w.n === word.w);
	const headWord = verse.w.find((w) => w.n === headNum);
	const classical = stripDiacritics(targetWord?.i ?? "");
	if (!targetWord?.i || !classical.includes("حرف جر") || !headWord) return null;
	if (!canBearPhrase(headWord)) return null;
	if (!classicalAgreesOnAttachment(targetWord.i, headWord)) return null;
	const clause = new Set(sentence.words.map((w) => w.w));
	return {
		id: `${file.n}:${verse.v}:${targetWord.n}:pp`,
		sura: file.n,
		suraName: file.name,
		suraPhonetic: file.phonetic,
		verse,
		targetWord,
		headWord,
		relation: "pp",
		grammaticalCase: null,
		sign: null,
		signDetailAr: "",
		classicalIrab: targetWord.i,
		clauseWords: verse.w.filter((w) => clause.has(w.n)),
	};
}

/** iʿrāb questions from the NoorBayan treebank, reconciled with each word's classical iʿrāb. */
function extractIrabQuestions(
	file: SurahFile,
	syntax: SurahSyntaxFile,
): QuizQuestion[] {
	const questions: QuizQuestion[] = [];
	const byVerse = new Map(syntax.verses.map((v) => [v.v, v]));
	for (const verse of file.verses)
		for (const sentence of byVerse.get(verse.v)?.sentences ?? []) {
			for (const c of noorBayanCandidates(sentence, file.n, verse.v))
				pushUnique(questions, reconcileIrab(file, verse, c));
			for (const word of sentence.words)
				pushUnique(questions, phraseQuestion(file, verse, sentence, word));
		}
	return questions;
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

function sharedLettersCount(a: Set<string>, b: Set<string>): number {
	let count = 0;
	for (const ch of a) if (b.has(ch)) count++;
	return count;
}

const sortedLetters = (root: string) => root.split("").sort().join("");

/**
 * Roots close to each root (same length, ≥2 shared letters), and the anagrams
 * among them, in pool order. Many words share a root, so each is worked out once.
 */
function nearRootsIndex(roots: string[]) {
	const letters = new Map(roots.map((r) => [r, new Set(r)]));
	const cache = new Map<string, { near: string[]; anagrams: string[] }>();
	return (root: string) => {
		const hit = cache.get(root);
		if (hit) return hit;
		const own = letters.get(root) ?? new Set(root);
		const near = roots.filter(
			(r) =>
				r !== root &&
				r.length === root.length &&
				sharedLettersCount(letters.get(r) ?? new Set(r), own) >= 2,
		);
		const signature = sortedLetters(root);
		const anagrams = near.filter((r) => sortedLetters(r) === signature);
		const entry = { near, anagrams };
		cache.set(root, entry);
		return entry;
	};
}

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

/** Every quiz pool for the loaded surahs: iʿrāb from NoorBayan, ṣarf from morphology. */
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
	const nearRoots = nearRootsIndex(rootArray);
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
		const { near, anagrams } = nearRoots(correctRaw);
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
		return allFour.map(rootChoice);
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
			(w) => waznChoice(w, kind),
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

			const classOptions = seededShuffle(
				[classCode, ...classFoils],
				`${id}:clsOrd`,
			).map(classChoice);
			const structureOptions = seededShuffle(
				[structureCode, ...structFoils],
				`${id}:strOrd`,
			).map(structureChoice);

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

	return {
		irab: irabPool(sources),
		sarf: sarfQuestions,
	};
}
