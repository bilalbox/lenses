export interface ProtoToken {
	id: number;
	w: number;
	t: string;
	pos: string;
	posAr: string;
	head: number | null; // null = elliptical governor
	rel: string;
	relAr: string;
	isRoot?: boolean;
	muqaddar?: string; // e.g. "أبتدئ" or "كائن"
}

export interface ProtoConstituent {
	id: number;
	labelAr: string;
	labelEn: string;
	startToken: number;
	endToken: number;
	headToken: number;
	category: "PP" | "VS" | "NS" | "SC" | "ANNEX";
}

export interface ProtoSentence {
	sura: number;
	verse: number;
	text: string;
	translation: string;
	tokens: ProtoToken[];
	constituents: ProtoConstituent[];
	carried?: { surah: number; ayah: number; word: number; text: string }[];
}

export const SAMPLE_SENTENCES: ProtoSentence[] = [
	{
		sura: 1,
		verse: 1,
		text: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
		translation:
			"In the name of Allah, the Entirely Merciful, the Especially Merciful.",
		tokens: [
			{
				id: 1,
				w: 1,
				t: "بِـ",
				pos: "P",
				posAr: "حرف جر",
				head: 2,
				rel: "link",
				relAr: "متعلق بمحذوف",
			},
			{
				id: 2,
				w: 1,
				t: "سْمِ",
				pos: "N",
				posAr: "اسم مجرور",
				head: null,
				rel: "Obj",
				relAr: "شبه جملة في محل نصب مفعول به",
				muqaddar: "أَبْتَدِئُ",
			},
			{
				id: 3,
				w: 2,
				t: "ٱللَّهِ",
				pos: "PN",
				posAr: "علم / لفظ الجلالة",
				head: 2,
				rel: "Poss",
				relAr: "مضاف إليه",
			},
			{
				id: 4,
				w: 3,
				t: "ٱلـ",
				pos: "DET",
				posAr: "أداة تعريف",
				head: 4,
				rel: "NonRel",
				relAr: "غير إعرابي",
			},
			{
				id: 5,
				w: 3,
				t: "رَّحْمَٰنِ",
				pos: "ADJ",
				posAr: "نعت",
				head: 3,
				rel: "Adj",
				relAr: "نعت أول",
			},
			{
				id: 6,
				w: 4,
				t: "ٱلـ",
				pos: "DET",
				posAr: "أداة تعريف",
				head: 6,
				rel: "NonRel",
				relAr: "غير إعرابي",
			},
			{
				id: 7,
				w: 4,
				t: "رَّحِيمِ",
				pos: "ADJ",
				posAr: "نعت",
				head: 3,
				rel: "Adj",
				relAr: "نعت ثانٍ",
			},
		],
		constituents: [
			{
				id: 1,
				labelAr: "شبه جملة (جار ومجرور)",
				labelEn: "Prepositional Phrase",
				startToken: 1,
				endToken: 2,
				headToken: 2,
				category: "PP",
			},
			{
				id: 2,
				labelAr: "مركب إضافي",
				labelEn: "Genitive Annexation",
				startToken: 2,
				endToken: 3,
				headToken: 2,
				category: "ANNEX",
			},
		],
	},
	{
		sura: 1,
		verse: 2,
		text: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ",
		translation: "[All] praise is [due] to Allah, Lord of the worlds.",
		tokens: [
			{
				id: 1,
				w: 1,
				t: "ٱلْـ",
				pos: "DET",
				posAr: "أداة تعريف",
				head: 1,
				rel: "NonRel",
				relAr: "غير إعرابي",
			},
			{
				id: 2,
				w: 1,
				t: "حَمْدُ",
				pos: "N",
				posAr: "اسم مرفوع",
				head: 2,
				isRoot: true,
				rel: "Subj",
				relAr: "مبتدأ",
			},
			{
				id: 3,
				w: 2,
				t: "لِـ",
				pos: "P",
				posAr: "حرف جر",
				head: 4,
				rel: "link",
				relAr: "متعلق بالخبر",
			},
			{
				id: 4,
				w: 2,
				t: "لَّهِ",
				pos: "PN",
				posAr: "لفظ الجلالة مجرور",
				head: 2,
				rel: "Pred",
				relAr: "شبه جملة خبر",
			},
			{
				id: 5,
				w: 3,
				t: "رَبِّ",
				pos: "N",
				posAr: "بدل / نعت مجرور",
				head: 4,
				rel: "Adj",
				relAr: "نعت / بدل",
			},
			{
				id: 6,
				w: 4,
				t: "ٱلْـ",
				pos: "DET",
				posAr: "أداة تعريف",
				head: 6,
				rel: "NonRel",
				relAr: "غير إعرابي",
			},
			{
				id: 7,
				w: 4,
				t: "عَٰلَمِينَ",
				pos: "N",
				posAr: "مضاف إليه مجرور بالياء",
				head: 5,
				rel: "Poss",
				relAr: "مضاف إليه",
			},
		],
		constituents: [
			{
				id: 1,
				labelAr: "جملة اسمية",
				labelEn: "Nominal Sentence",
				startToken: 1,
				endToken: 7,
				headToken: 2,
				category: "NS",
			},
			{
				id: 2,
				labelAr: "شبه جملة (جار ومجرور)",
				labelEn: "Prepositional Phrase",
				startToken: 3,
				endToken: 4,
				headToken: 4,
				category: "PP",
			},
			{
				id: 3,
				labelAr: "مركب إضافي",
				labelEn: "Genitive Annexation",
				startToken: 5,
				endToken: 7,
				headToken: 5,
				category: "ANNEX",
			},
		],
	},
];
