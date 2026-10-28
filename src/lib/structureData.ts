import type { SurahStructureFile } from "./types";

const FIXTURES: Record<number, SurahStructureFile> = {
	1: {
		sura: 1,
		nameAr: "الفاتحة",
		nameEn: "Al-Fatiha",
		verseCount: 7,
		family: {
			id: 3,
			name: "Compressed crystal",
			description: "A tightly woven surah — one idea, one center",
		},
		pivot: {
			verse: "5",
			offset: 0.2143,
			centerLogic: "single_concentration",
			function: "THEOLOGICAL_DECLARATION",
		},
		form: "compressed",
		semantic: "concentrated",
		blocks: [
			{
				id: "A",
				v: [1, 3],
				role: "outer_frame_open",
				label: "Praise of the Lord",
				labelAr: "الحمد والثناء على الله تعالى",
				pairId: "A′",
			},
			{
				id: "B",
				v: [4, 4],
				role: "body",
				label: "Lord of Judgment",
				labelAr: "مَلِك يوم الدين والحساب",
				pairId: "B′",
			},
			{
				id: "PIVOT",
				v: [5, 5],
				role: "pivot",
				label: "Worship and reliance",
				labelAr: "إخلاص العبادة والاستعانة (إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ)",
			},
			{
				id: "B′",
				v: [6, 6],
				role: "body",
				label: "Prayer for guidance",
				labelAr: "طلب الهداية إلى الصراط المستقيم",
				pairId: "B",
			},
			{
				id: "A′",
				v: [7, 7],
				role: "outer_frame_close",
				label: "The three paths",
				labelAr: "بيان الصراط ومسارب الناس الثلاثة",
				pairId: "A",
			},
		],
		transitionToNext: {
			targetSura: 2,
			targetNameAr: "البقرة",
			targetNameEn: "Al-Baqarah",
			suyutiLinkAr:
				"افتتاح سورة البقرة بقوله: {ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ} إشارة إلى {الصِّرَاطَ الْمُسْتَقِيمَ} في قوله في ختام الفاتحة: {اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ}، فكأنه لما قال العبد: اهدنا الصراط المستقيم، قيل له: هذا الصراط الذي سألتموه هو ذلك الكتاب الذي لا ريب فيه.",
			suyutiLinkEn:
				"The opening of Al-Baqarah ('That is the Book wherein is no doubt, a guidance for the God-fearing') directly answers the closing petition of Al-Fātiḥah ('Guide us to the straight path'): as if when the servant asks for guidance to the straight path, it is answered: 'This path you have asked for is this very Book without doubt.'",
			biqaiSummaryAr:
				"سورة الفاتحة تضمنت الإقرار بالربوبية وطلب الهداية، وسورة البقرة تضمنت قواعد الدين وإقامة البرهان على هذا المقصد العظيم.",
			biqaiSummaryEn:
				"Al-Fātiḥah establishes the covenant of servanthood and petition for guidance; Al-Baqarah delivers the foundational legislative pillars and proofs of that very guidance.",
		},
	},
	2: {
		sura: 2,
		nameAr: "البقرة",
		nameEn: "Al-Baqarah",
		verseCount: 286,
		family: {
			id: 5,
			name: "Distributed field",
			description: "A surah unfolding across a wide, varied landscape",
		},
		pivot: {
			verse: "142–152 (axis: v.143)",
			offset: -0.0017,
			centerLogic: "single_concentration",
			function: "COMMAND_LEGISLATION",
		},
		form: "distributed",
		semantic: "diffuse",
		blocks: [
			{
				id: "A",
				v: [1, 20],
				role: "frame",
				label: "Three responses to revelation",
				labelAr: "أصناف الناس الثلاثة تجاه الوحي",
				pairId: "A′",
			},
			{
				id: "B",
				v: [21, 39],
				role: "body",
				label: "Adam and mankind's beginning",
				labelAr: "استخلاف آدم وبداية البشرية",
				pairId: "B′",
			},
			{
				id: "C",
				v: [40, 103],
				role: "body",
				label: "Israel's covenant failure",
				labelAr: "مواثيق بني إسرائيل والابتلاءات",
				pairId: "C′",
			},
			{
				id: "C₀",
				v: [104, 141],
				role: "body",
				label: "Speech discipline & Abrahamic legacy",
				labelAr: "أدب الخطاب والملة الإبراهيمية",
				pairId: "C₀′",
			},
			{
				id: "D",
				v: [142, 152],
				role: "pivot",
				label: "The Qiblah pivot & Ummah Wasaṭ (v. 143)",
				labelAr: "تحويل القبلة والأمة الوسط (وَكَذَٰلِكَ جَعَلْنَاكُمْ أُمَّةً وَسَطًا)",
			},
			{
				id: "C₀′",
				v: [153, 177],
				role: "body",
				label: "Community formation & trials",
				labelAr: "بناء المجتمع والابتلاء بالصبر",
				pairId: "C₀",
			},
			{
				id: "C′",
				v: [178, 253],
				role: "body",
				label: "Law, social order, and struggle",
				labelAr: "التشريع والحدود والأحكام الاجتماعية والجهاد",
				pairId: "C",
			},
			{
				id: "B′",
				v: [254, 260],
				role: "body",
				label: "Divine authority and faith (Āyat al-Kursī)",
				labelAr: "آية الكرسي والتوحيد واليقين بالبعث",
				pairId: "B",
			},
			{
				id: "A′",
				v: [261, 286],
				role: "frame",
				label: "The final covenant & prayer",
				labelAr: "الإنفاق في سبيل الله وخاتمة الدعاء والميثاق",
				pairId: "A",
			},
		],
		transitionToNext: {
			targetSura: 3,
			targetNameAr: "آل عمران",
			targetNameEn: "Ali 'Imran",
			suyutiLinkAr:
				"سورة البقرة بمنزلة إقامة الدليل على الحكم، وسورة آل عمران بمنزلة الجواب عن شبهات الخصوم. كما أن خطاب أهل الكتاب في البقرة أكثره لليهود، وخطاب أهل الكتاب في آل عمران أكثره للنصارى (وفد نجران).",
			suyutiLinkEn:
				"Al-Baqarah establishes the primary evidence and foundation of divine legislation, while Āl 'Imrān answers and dismantles the theological doubts of adversaries. Furthermore, the address to the People of the Book in Al-Baqarah addresses the Jews, while Āl 'Imrān primarily addresses the Christians (the delegation of Najrān).",
			biqaiSummaryAr:
				"البقرة أصلت الإيمان بالغيب والشرائع، وآل عمران حصنت المؤمنين ضد الشبهات وثبتت الأقدام في معركة أحد.",
			biqaiSummaryEn:
				"Al-Baqarah rooted faith in the unseen and divine ordinances, while Āl 'Imrān fortified believers against ideological polemics and adversity at Uḥud.",
		},
	},
	18: {
		sura: 18,
		nameAr: "الكَهْف",
		nameEn: "Al-Kahf",
		verseCount: 110,
		family: {
			id: 1,
			name: "Narrative pillar",
			description:
				"A long narrative surah turning through episodic storytelling and 4 quests",
		},
		pivot: {
			verse: "54",
			offset: -0.0091,
			centerLogic: "single_concentration",
			function: "THEOLOGICAL_DECLARATION",
		},
		form: "distributed",
		semantic: "diffuse",
		blocks: [
			{
				id: "A",
				v: [1, 8],
				role: "frame",
				label: "The Book with no deviance",
				labelAr: "حمد الله على إنزال الكتاب قيماً بلا عوج",
				pairId: "A′",
			},
			{
				id: "N1",
				v: [9, 26],
				role: "narrative_1",
				label: "People of the Cave (Trial of Faith)",
				labelAr: "قصة أصحاب الكهف (فتنة الدين)",
				pairId: "N4",
			},
			{
				id: "T1",
				v: [27, 31],
				role: "transition_1",
				label: "No changer of His words",
				labelAr: "الاعتصام بالوحي ومجالسة الصالحين",
				pairId: "T3",
			},
			{
				id: "N2",
				v: [32, 44],
				role: "narrative_2",
				label: "Two gardens — pride and humility (Trial of Wealth)",
				labelAr: "صاحب الجنتين (فتنة المال)",
				pairId: "N3",
			},
			{
				id: "T2",
				v: [45, 53],
				role: "transition_2",
				label: "This world like passing rain",
				labelAr: "مثل الحياة الدنيا وحشر القيامة وسجود الملائكة",
			},
			{
				id: "D",
				v: [54, 54],
				role: "pivot",
				label: "Humanity's tendency to dispute (Axis v. 54)",
				labelAr: "تصريف الأمثال وجدل الإنسان (المحور المركزي)",
			},
			{
				id: "T3",
				v: [55, 59],
				role: "transition_3",
				label: "Nothing prevents belief",
				labelAr: "مصير المكذبين وإمهال القرى الظالمة",
				pairId: "T1",
			},
			{
				id: "N3",
				v: [60, 82],
				role: "narrative_3",
				label: "Moses and the wise servant (Trial of Knowledge)",
				labelAr: "موسى والخضر عليهما السلام (فتنة العلم)",
				pairId: "N2",
			},
			{
				id: "N4",
				v: [83, 98],
				role: "narrative_4",
				label: "Dhul-Qarnayn and the barrier (Trial of Power)",
				labelAr: "ذو القرنين ويأجوج ومأجوج (فتنة السلطان والقوة)",
				pairId: "N1",
			},
			{
				id: "A′",
				v: [99, 110],
				role: "frame",
				label: "The Horn blown & righteous reward",
				labelAr: "نفخ الصور وحسن مآل المتقين وإخلاص العمل",
				pairId: "A",
			},
		],
		transitionToNext: {
			targetSura: 19,
			targetNameAr: "مريم",
			targetNameEn: "Maryam",
			suyutiLinkAr:
				"سورة الكهف اشتملت على جملة من الأعاجيب: قصة أصحاب الكهف وبقاءهم ثلاثمائة سنين، وقصة موسى والخضر، وخبر ذي القرنين؛ فناسب أن تعقب بسورة مريم المشتملة على عجب ولادة يحيى من شيخين هرمين، وولادة عيسى من غير أب.",
			suyutiLinkEn:
				"Surah Al-Kahf featured miraculous marvels: the Sleepers remaining 300 years, the esoteric encounters of Moses and Khidr, and Dhū al-Qarnayn's barrier; it was most fittingly succeeded by Surah Maryam, which unfolds the miracles of John's birth to elderly parents and Jesus's birth without a father.",
			biqaiSummaryAr:
				"الكهف حصنت الأمة من أعظم أربع فتن، ومريم بينت الرحمة الربانية وتنزيه الله عن الولد والشريك.",
			biqaiSummaryEn:
				"Al-Kahf shielded against humanity's greatest trials, and Maryam proclaimed divine mercy and the transcendence of God above having a son or partner.",
		},
	},
};

export async function loadSurahStructure(
	sura: number,
): Promise<SurahStructureFile | null> {
	try {
		const padded = String(sura).padStart(3, "0");
		const res = await fetch(`/data/quran/structure/${padded}.json`);
		if (res.ok) {
			return (await res.json()) as SurahStructureFile;
		}
	} catch {
		// fallback to fixture
	}
	return FIXTURES[sura] ?? null;
}
