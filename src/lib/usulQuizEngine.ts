import {
	getTaxonomyNode,
	nodesForCategory,
	USULI_TAXONOMY_NODES,
} from "./usulTaxonomy";
import type { UsuliShahid, UsuliTaxonomyId } from "./usulTypes";

export interface IdentifyDalalahOption {
	id: UsuliTaxonomyId;
	labelAr: string;
}

export interface IdentifyDalalahDrill {
	mode: "IDENTIFY_DALALAH";
	shahidId: string;
	verseKey: string;
	ayahNumber: number;
	wordStart: number;
	wordEnd: number;
	shahidPhraseAr: string;
	questionAr: string;
	correctTaxonomyId: UsuliTaxonomyId;
	options: IdentifyDalalahOption[];
}

export interface SpotTheQarinahOption {
	labelAr: string;
	isCorrect: boolean;
}

export interface SpotTheQarinahDrill {
	mode: "SPOT_THE_QARINAH";
	shahidId: string;
	verseKey: string;
	ayahNumber: number;
	wordStart: number;
	wordEnd: number;
	shahidPhraseAr: string;
	questionAr: string;
	defaultDalalahAr: string;
	actualDalalahAr: string;
	hasQarinahSarifah: boolean;
	qarinahTextAr: string | null;
	qarinahVerseKey: string | null;
	options: SpotTheQarinahOption[];
}

export interface LocateShahidSpanDrill {
	mode: "LOCATE_SHAHID_SPAN";
	shahidId: string;
	verseKey: string;
	ayahNumber: number;
	wordStart: number;
	wordEnd: number;
	promptAr: string;
	taxonomyNameAr: string;
	derivedFiqhRulingAr: string;
}

export interface UsuliKhilafOption {
	labelAr: string;
	isCorrect: boolean;
}

export interface UsuliKhilafDrill {
	mode: "USULI_KHILAF_DRILL";
	shahidId: string;
	verseKey: string;
	ayahNumber: number;
	wordStart: number;
	wordEnd: number;
	shahidPhraseAr: string;
	questionAr: string;
	khilafUsuliAr: string;
	derivedFiqhRulingAr: string;
	options: UsuliKhilafOption[];
}

export function validateSpanClick(
	wordIndex: number,
	wordStart: number,
	wordEnd: number,
): boolean {
	return wordIndex >= wordStart && wordIndex <= wordEnd;
}

export function generateIdentifyDalalahDrill(
	shahid: UsuliShahid,
): IdentifyDalalahDrill {
	const correctNode = getTaxonomyNode(shahid.taxonomyId);
	const sameCategory = nodesForCategory(shahid.categoryGroup).filter(
		(n) => n.id !== shahid.taxonomyId,
	);
	const otherNodes = Object.values(USULI_TAXONOMY_NODES).filter(
		(n) =>
			n.id !== shahid.taxonomyId && n.categoryGroup !== shahid.categoryGroup,
	);

	const distractorPool = [...sameCategory, ...otherNodes];
	const selectedDistractors = distractorPool.slice(0, 3);

	const options: IdentifyDalalahOption[] = [
		{ id: correctNode.id, labelAr: correctNode.nameAr },
		...selectedDistractors.map((d) => ({ id: d.id, labelAr: d.nameAr })),
	];

	return {
		mode: "IDENTIFY_DALALAH",
		shahidId: shahid.id,
		verseKey: shahid.verseKey,
		ayahNumber: shahid.ayahNumber,
		wordStart: shahid.wordStart,
		wordEnd: shahid.wordEnd,
		shahidPhraseAr: shahid.shahidPhraseAr,
		questionAr: "ما نوع الدلالة الأصولية في الموضع المحدد من الآية؟",
		correctTaxonomyId: shahid.taxonomyId,
		options,
	};
}

export function generateSpotTheQarinahDrill(
	shahid: UsuliShahid,
): SpotTheQarinahDrill {
	const defaultImport = shahid.defaultDalalahAr;
	const actualImport = shahid.actualDalalahAr;
	const isShifted = shahid.hasQarinahSarifah;

	const options: SpotTheQarinahOption[] = isShifted
		? [
				{
					labelAr: `مصروف عن أصله إلى (${actualImport}) بقرينة صارفة`,
					isCorrect: true,
				},
				{
					labelAr: `باقٍ على أصله المفيد لـ(${defaultImport}) دون قرينة`,
					isCorrect: false,
				},
				{
					labelAr: "صيغة مبهمة مجملة لا دلالة فيها إلا ببيان مستقل",
					isCorrect: false,
				},
				{
					labelAr: "منسوخ حكماً وتلاوة باتفاق الأصوليين",
					isCorrect: false,
				},
			]
		: [
				{
					labelAr: `باقٍ على أصله المفيد لـ(${defaultImport}) لعدم وجود قرينة صارفة`,
					isCorrect: true,
				},
				{
					labelAr: "مصروف إلى الندب بقرينة تخفيف ومشقة",
					isCorrect: false,
				},
				{
					labelAr: "مصروف إلى الإباحة لوروده بعد الحظر",
					isCorrect: false,
				},
				{
					labelAr: "متردد بين الوجوب والندب لا ترجيح فيه",
					isCorrect: false,
				},
			];

	return {
		mode: "SPOT_THE_QARINAH",
		shahidId: shahid.id,
		verseKey: shahid.verseKey,
		ayahNumber: shahid.ayahNumber,
		wordStart: shahid.wordStart,
		wordEnd: shahid.wordEnd,
		shahidPhraseAr: shahid.shahidPhraseAr,
		questionAr:
			"ميّز دلالة الصيغة المحددة: هل بقيت على مقتضاها الأصلي أم صُرِفت بقرينة؟",
		defaultDalalahAr: defaultImport,
		actualDalalahAr: actualImport,
		hasQarinahSarifah: isShifted,
		qarinahTextAr: shahid.qarinahTextAr,
		qarinahVerseKey: shahid.qarinahVerseKey,
		options,
	};
}

export function generateLocateSpanDrill(
	shahid: UsuliShahid,
): LocateShahidSpanDrill {
	const taxonomyNode = getTaxonomyNode(shahid.taxonomyId);
	return {
		mode: "LOCATE_SHAHID_SPAN",
		shahidId: shahid.id,
		verseKey: shahid.verseKey,
		ayahNumber: shahid.ayahNumber,
		wordStart: shahid.wordStart,
		wordEnd: shahid.wordEnd,
		promptAr: `اضغط على اللفظ الذي استدل به الأصوليون على: [${taxonomyNode.nameAr}] لاستنباط: [${shahid.derivedFiqhRulingAr}]`,
		taxonomyNameAr: taxonomyNode.nameAr,
		derivedFiqhRulingAr: shahid.derivedFiqhRulingAr,
	};
}

export function generateKhilafDrill(
	shahid: UsuliShahid,
): UsuliKhilafDrill | null {
	if (!shahid.khilafUsuliAr) {
		return null;
	}

	const options: UsuliKhilafOption[] = [
		{
			labelAr: `وجه الخلاف: ${shahid.khilafUsuliAr}`,
			isCorrect: true,
		},
		{
			labelAr:
				"اتفاق المذاهب الأربعة على الحكم ودلالة اللفظ قطعية لا نزاع فيها",
			isCorrect: false,
		},
		{
			labelAr: "حكم خاص بالصدر الأول من الصحابة لا مدخل للقياس والاجتهاد فيه",
			isCorrect: false,
		},
	];

	return {
		mode: "USULI_KHILAF_DRILL",
		shahidId: shahid.id,
		verseKey: shahid.verseKey,
		ayahNumber: shahid.ayahNumber,
		wordStart: shahid.wordStart,
		wordEnd: shahid.wordEnd,
		shahidPhraseAr: shahid.shahidPhraseAr,
		questionAr: `ما هو تحرير الخلاف الأصولي ووجه الدلالة في قوله تعالى: ﴿${shahid.shahidPhraseAr}﴾؟`,
		khilafUsuliAr: shahid.khilafUsuliAr,
		derivedFiqhRulingAr: shahid.derivedFiqhRulingAr,
		options,
	};
}
