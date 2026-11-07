import {
	getTaxonomyNode,
	nodesForCategory,
	USULI_TAXONOMY_NODES,
} from "./usulTaxonomy";
import type {
	UsuliShahid,
	UsuliSpanAnchor,
	UsuliTaxonomyId,
} from "./usulTypes";

export function extractSpanAnchor(shahid: UsuliShahid): UsuliSpanAnchor {
	return {
		shahidId: shahid.id,
		verseKey: shahid.verseKey,
		ayahNumber: shahid.ayahNumber,
		wordStart: shahid.wordStart,
		wordEnd: shahid.wordEnd,
		shahidPhraseAr: shahid.shahidPhraseAr,
	};
}

export interface IdentifyDalalahOption {
	id: UsuliTaxonomyId;
	labelAr: string;
}

export interface IdentifyDalalahDrill extends UsuliSpanAnchor {
	mode: "IDENTIFY_DALALAH";
	questionAr: string;
	correctTaxonomyId: UsuliTaxonomyId;
	options: IdentifyDalalahOption[];
}

export interface SpotTheQarinahOption {
	labelAr: string;
	isCorrect: boolean;
}

export interface SpotTheQarinahDrill extends UsuliSpanAnchor {
	mode: "SPOT_THE_QARINAH";
	questionAr: string;
	defaultDalalahAr: string;
	actualDalalahAr: string;
	hasQarinahSarifah: boolean;
	qarinahTextAr: string | null;
	qarinahVerseKey: string | null;
	options: SpotTheQarinahOption[];
}

export interface LocateShahidSpanDrill extends UsuliSpanAnchor {
	mode: "LOCATE_SHAHID_SPAN";
	promptAr: string;
	taxonomyNameAr: string;
	derivedFiqhRulingAr: string;
}

export interface UsuliKhilafOption {
	labelAr: string;
	isCorrect: boolean;
}

export interface UsuliKhilafDrill extends UsuliSpanAnchor {
	mode: "USULI_KHILAF_DRILL";
	questionAr: string;
	khilafUsuliAr: string;
	derivedFiqhRulingAr: string;
	options: UsuliKhilafOption[];
}

function hashCode(str: string): number {
	let h = 0;
	for (let i = 0; i < str.length; i++) {
		h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
	}
	return h >>> 0;
}

export function shuffle<T>(items: readonly T[], seed?: string | number): T[] {
	const out = [...items];
	let s = typeof seed === "number" ? seed : seed ? hashCode(seed) : 0;
	for (let i = out.length - 1; i > 0; i--) {
		let j: number;
		if (seed !== undefined) {
			s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
			j = s % (i + 1);
		} else {
			j = Math.floor(Math.random() * (i + 1));
		}
		const tmp = out[i];
		const target = out[j];
		if (tmp !== undefined && target !== undefined) {
			out[i] = target;
			out[j] = tmp;
		}
	}
	return out;
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
	seed?: string,
): IdentifyDalalahDrill {
	const correctNode = getTaxonomyNode(shahid.taxonomyId);
	const sameCategory = nodesForCategory(shahid.categoryGroup).filter(
		(n) => n.id !== shahid.taxonomyId,
	);
	const otherNodes = Object.values(USULI_TAXONOMY_NODES).filter(
		(n) =>
			n.id !== shahid.taxonomyId && n.categoryGroup !== shahid.categoryGroup,
	);

	const distractorPool = shuffle(
		[...sameCategory, ...otherNodes],
		seed ? `${seed}:pool` : undefined,
	);
	const selectedDistractors = distractorPool.slice(0, 3);

	const options: IdentifyDalalahOption[] = shuffle(
		[
			{ id: correctNode.id, labelAr: correctNode.nameAr },
			...selectedDistractors.map((d) => ({ id: d.id, labelAr: d.nameAr })),
		],
		seed ? `${seed}:opts` : undefined,
	);

	return {
		mode: "IDENTIFY_DALALAH",
		...extractSpanAnchor(shahid),
		questionAr: "ما نوع الدلالة الأصولية في الموضع المحدد من الآية؟",
		correctTaxonomyId: shahid.taxonomyId,
		options,
	};
}

export function generateSpotTheQarinahDrill(
	shahid: UsuliShahid,
	seed?: string,
): SpotTheQarinahDrill {
	const defaultImport = shahid.defaultDalalahAr;
	const actualImport = shahid.actualDalalahAr;
	const isShifted = shahid.hasQarinahSarifah;

	const rawOptions: SpotTheQarinahOption[] = isShifted
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

	const options = shuffle(rawOptions, seed);

	return {
		mode: "SPOT_THE_QARINAH",
		...extractSpanAnchor(shahid),
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
		...extractSpanAnchor(shahid),
		promptAr: `اضغط على اللفظ الذي استدل به الأصوليون على: [${taxonomyNode.nameAr}] لاستنباط: [${shahid.derivedFiqhRulingAr}]`,
		taxonomyNameAr: taxonomyNode.nameAr,
		derivedFiqhRulingAr: shahid.derivedFiqhRulingAr,
	};
}

export function generateKhilafDrill(
	shahid: UsuliShahid,
	seed?: string,
): UsuliKhilafDrill | null {
	if (!shahid.khilafUsuliAr) {
		return null;
	}

	const rawOptions: UsuliKhilafOption[] = [
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

	const options = shuffle(rawOptions, seed);

	return {
		mode: "USULI_KHILAF_DRILL",
		...extractSpanAnchor(shahid),
		questionAr: `ما هو تحرير الخلاف الأصولي ووجه الدلالة في قوله تعالى: ﴿${shahid.shahidPhraseAr}﴾؟`,
		khilafUsuliAr: shahid.khilafUsuliAr,
		derivedFiqhRulingAr: shahid.derivedFiqhRulingAr,
		options,
	};
}
