import { formatNum } from "../format";
import type { Translations } from "../types";

export const ar: Translations = {
	common: {
		appNameAr: "عدسات",
		appNameEn: "Lenses",
		searchPlaceholder: "سورة:آية، أو كلمة",
		searchAria: "ابحث في الآيات",
		versesCount: (count: number) => {
			const n = formatNum(count, "ar");
			if (count === 1) return "آية واحدة";
			if (count === 2) return "آيتان";
			if (count >= 3 && count <= 10) return `${n} آيات`;
			return `${n} آية`;
		},
		noVersesMatch: "لا توجد آيات مطابقة.",
		surahsNav: "السور",
		examplesNav: "أمثلة",
		quizNav: "اختبار",
		previous: "السابق",
		next: "التالي",
		search: "بحث",
		offlineReady: "متاح دون اتصال",
		savingOffline: (done: number, total: number) =>
			`جارٍ حفظ القرآن للعمل دون اتصال، ${formatNum(Math.max(done, 1), "ar")} من ${formatNum(total, "ar")}.`,
		chapterAndVerse: "السورة والآية",
		open: "فتح",
		verse: "الآية",
		tafsirCenterSource: "مركز تفسير للدراسات القرآنية",
		corpusSource: "المدونة القرآنية",
	},
	quiz: {
		pageTitle: "تمارين النحو والصرف",
		lensesAria: "عدسات الاختبار",
		stepsAria: "خطوات الاختبار",
		streakLabel: "تتابع",
		scoreLabel: "الصحيح / المحاولات",
		skipButton: "↻ تخطي",
		openReader: (sura: number, verse: number) =>
			`القارئ ${formatNum(sura, "ar")}:${formatNum(verse, "ar")} ↗`,
		stepRoleCrumb: "الموقع",
		stepCaseCrumb: "الحالة",
		stepSignCrumb: "العلامة",
		stepCheckCrumb: "تحقق",
		fieldRoot: "المادة",
		fieldWazn: "الوزن",
		fieldClass: "الباب/المشتق",
		fieldStructure: "البنية",
		targetBadge: "المطلوب",
		headBadge: "العامل",
		legendTarget: (wordAr: string) => `المطلوب · ${wordAr}`,
		legendHead: (roleLabel: string, wordAr: string) =>
			`${roleLabel} · ${wordAr}`,
		pickGovernorHint: "اختر كلمة مما يلي، أو اضغطها في الآية أعلاه.",
		step1Eyebrow: "الخطوة ١ من ٤ · الموقع الإعرابي",
		step1Question: (wordAr: string) => `ما الموقع الإعرابي لكلمة ${wordAr}؟`,
		step2Eyebrow: (govLabel: string) => `الخطوة ٢ من ٤ · اختر ${govLabel}`,
		step2Question: (govAr: string, wordAr: string) =>
			`أي كلمة في الآية هي ${govAr} لـ ${wordAr}؟`,
		step3Eyebrow: "الخطوة ٣ من ٤ · الحالة الإعرابية",
		step3Question: (wordAr: string) => `ما الحالة الإعرابية لكلمة ${wordAr}؟`,
		step4Eyebrow: "الخطوة ٤ من ٤ · علامة الإعراب",
		step4Question: (wordAr: string) => `ما علامة إعراب ${wordAr}؟`,
		step5Eyebrow: "جاهز للتحقق · مراجعة الإعراب",
		step5Title: (wordAr: string) => `راجع صياغة إعرابك لكلمة ${wordAr}`,
		backButton: "→ رجوع",
		editButton: "→ تعديل",
		submitButton: "تحقق واعرض الإعراب الكامل",
		nextButton: "سؤال جديد ←",
		exactMatchEyebrow: "إجابة صحيحة · أحسنت",
		reviewEyebrow: "تصويب",
		classicalHeading: (wordAr: string) => `الإعراب التفصيلي لكلمة ${wordAr}`,
		formulaEditHint: "اضغط على أي جزء لتعديله.",
		incompleteAlert: "اضغط على الخطوة الناقصة أعلاه لإكمال الإعراب:",
		mutashabih: {
			fieldWording: "اللفظ",
			fieldSurah: "السورة",
			wordingQuestion: "بأي لفظ تكتمل هذه الآية؟",
			wordingHint: "كل خيار هو لفظ آية متشابهة في هذا الموضع.",
			noWord: "لا شيء هنا",
			surahQuestion: "في أي سورة هذه الآية؟",
			reviewTitle: "راجع إجابتك",
			submitButton: "تحقق",
			placesHeading: "مواضع كل لفظ",
			thisAyah: "هذه الآية",
		},
		sarf: {
			rootQuestion: (wordAr: string) =>
				`ما المادة المعجمية (الجذر) لكلمة ﴿${wordAr}﴾؟`,
			waznQuestion: (wordAr: string) => `ما الوزن الصرفي لـ ﴿${wordAr}﴾؟`,
			verbClassQuestion: (wordAr: string) =>
				`من أي باب صرفي جاء الفعل ﴿${wordAr}﴾؟`,
			nounClassQuestion: (wordAr: string) =>
				`ما نوع الاسم ﴿${wordAr}﴾ من حيث الاشتقاق؟`,
			verbStructureQuestion: (wordAr: string) =>
				`ما نوع الفعل ﴿${wordAr}﴾ من حيث الصحة والاعتلال؟`,
			nounStructureQuestion: (wordAr: string) =>
				`ما بنية الاسم ﴿${wordAr}﴾ من حيث الإفراد والجمع؟`,
			reviewTitle: (wordAr: string) => `راجع التحليل الصرفي لـ ﴿${wordAr}﴾`,
			submitButton: "تحقق واكشف التحليل الصرفي",
			revealHeading: (wordAr: string) => `التحليل الصرفي الكامل لـ ﴿${wordAr}﴾`,
			rootInExamples: (root: string) => `شواهد الجذر (${root}) ↗`,
		},
	},
	settings: {
		title: "الإعدادات",
		buttonAria: "الإعدادات",
		languageSection: "اللغة",
		themeSection: "المظهر",
		themeLight: "فاتح",
		themeDark: "داكن",
		quizSection: "الاختبار",
		quizPrefs: {
			hideDiacritics: {
				label: "إخفاء التشكيل في الاختبارات",
				description: "عرض آيات القرآن بدون حركات لتحدٍّ أصعب.",
			},
			extendedRoles: {
				label: "مواقع إعرابية إضافية",
				description:
					"أضف الجار والمجرور (شبه الجملة) والظرف والمستثنى والمفعول لأجله والتوكيد إلى مواقع الإعراب، واسأل عنها حيث وردت.",
			},
		},
		readerSection: "طبقات القارئ",
		readerSectionHint:
			"أخفِ الطبقات التي لا تدرسها. الطبقات المعطّلة تُزال من شاشة الآية ولا تُحمَّل حتى تُفعَّل.",
		readerLayers: {
			meaning: "تفسير الآية",
			irab: "إعراب الجملة",
			nahw: "النحو وشجرة الإعراب",
			mutashabih: "المتشابه اللفظي",
			asbab: "أسباب النزول",
			qiraat: "القراءات العشر في بطاقة الكلمة",
		},
		sourcesLink: "مصادر البيانات",
		sourcesDescription: "استكشف مصادر البيانات اللغوية وتراخيصها.",
		installApp: "تثبيت التطبيق",
		closeAria: "إغلاق الإعدادات",
	},
	verse: {
		meccan: "مكية",
		madinan: "مدنية",
		verseMeaningTitle: "تفسير الآية",
		translationBadge: "الترجمة",
		tafsirBadge: "التفسير (المختصر)",
		mukhtasarEnTitle: "المختصر في التفسير",
		mukhtasarEnSub: "الإنجليزية · QuranEnc",
		mukhtasarIdTitle: "المختصر في التفسير",
		mukhtasarIdSub: "الإندونيسية · QuranEnc",
		mukhtasarArTitle: "المختصر في التفسير",
		mukhtasarArSub: "العربية · QuranEnc",
		irabTitle: "إعراب الآية",
		clauseCount: (index: number, total: number) =>
			`الجملة ${formatNum(index + 1, "ar")} من ${formatNum(total, "ar")}`,
		clausesAria: "الجمل",
		noTreeTitle: "لا توجد شجرة إعراب لهذه الآية.",
		classicalIrabShort: "إعراب",
		surahGoalLabel: "مقصد السورة",
		surahDetails: "تفاصيل السورة",
		revelationOrder: (seq: number) => `ترتيب النزول #${formatNum(seq, "ar")}`,
		asbabBadge: (count: number) => `سبب النزول (${formatNum(count, "ar")})`,
		asbabDrawerTitle: "أسباب النزول (المحرر في أسباب نزول القرآن)",
		asbabSectionTitle: "أسباب النزول",
		nahwTabTitle: "النحو وشجرة الإعراب",
		irabViewsAria: "عرض الإعراب",
		irabDiagram: "المشجّر",
		irabClassical: "الإعراب",
		treebankNoorBayan: "شجرة نور البيان القرآنية",
		mutashabihBadge: (count: number) =>
			`المتشابه اللفظي (${formatNum(count, "ar")})`,
		mutashabihSectionTitle: "المتشابه اللفظي ونظائر الآيات",
		mutashabihCounterpartAyah: "الآية المقابلة",
		mutashabihCurrentAyah: "الآية الحالية",
		mutashabihMatchScore: (percent: number) =>
			`نسبة التطابق: ${formatNum(percent, "ar")}٪`,
		mutashabihDabtTitle: "قاعدة الضبط والحفظ",
		mutashabihTawjihTitle: "توجيه الاختلاف والبلاغة",
		mutashabihJumpToAyah: "الانتقال إلى الآية",
		mutashabihCategoryIdentical: "متشابه تام",
		mutashabihCategoryOpening: "اتفاق المطالع",
		mutashabihCategoryEnding: "اتفاق الفواصل",
		mutashabihCategoryPhrase: "تشابه عبارة",
		mutashabihCategorySwap: "تقديم وتأخير",
		mutashabihLegendExact: "متطابق",
		mutashabihLegendHaraka: "اختلاف تشكيل / حركة",
		mutashabihLegendDiff: "اختلاف لفظي",
		mutashabihLegendExtra: "زيادة أو نقصان",
		mutashabihSurahDistance: (count: number) =>
			`البعد: ${formatNum(count, "ar")} سور`,
		mutashabihEmptyState: "لا توجد مواضع متشابه لفظي مسجلة لهذه الآية.",
		mutashabihReturnToAyah: (coord: string) => `العودة إلى ${coord}`,
	},
	sheet: {
		analysisAria: (wordNumber: number) =>
			`تحليل الكلمة ${formatNum(wordNumber, "ar")}`,
		closeAria: "إغلاق التحليل",
		expandAria: "توسيع التحليل",
		collapseAria: "طي التحليل",
		classicalIrab: "الإعراب المفرد",
		sarf: "الصرف والبنية",
		wordMeaning: "معنى الكلمة",
		searchThisRoot: "ابحث عن هذا الجذر",
		searchThisWord: "ابحث عن هذه الكلمة",
		inQuran: "في القرآن",
		occurrences: (count: number, verses: number, surahs: number) =>
			`عدد المرات: ${formatNum(count, "ar")} · الآيات: ${formatNum(verses, "ar")} · السور: ${formatNum(surahs, "ar")}`,
		wordGlossSource: "بالإنجليزية · المدوّنة القرآنية العربية",
		dictionaries: "المعاجم",
		maqayisTitle: "مقاييس اللغة لابن فارس",
		mufradatTitle: "المفردات في غريب القرآن للراغب الأصفهاني",
		laneTitle: "معجم لين العربي الإنجليزي",
		laneThisWord: "هذه الكلمة",
		laneOtherEntries: (count: number) =>
			`مواد أخرى من الجذر (${formatNum(count, "ar")})`,
		lanePage: (page: number) => `ص ${formatNum(page, "ar")}`,
		tabsAria: "تحليل الكلمة",
		tabHere: "في هذه الآية",
		tabAcross: "في القرآن كله",
		wujuhTitle: "وجوه الكلمة في القرآن للدامغاني",
		wujuhSeparator: "، ",
		wujuhInThisVerse: "في هذه الآية",
		wujuhSenseOf: (sense: number, total: number) =>
			`الوجه ${formatNum(sense, "ar")} من ${formatNum(total, "ar")}`,
		wujuhNotCited: (total: number) =>
			`عدد الأوجه: ${formatNum(total, "ar")}. وليست هذه الآية من شواهد الدامغاني.`,
		wujuhThisVerse: "هذه الآية",
		wujuhUnnamedSense: (sense: number) => `الوجه ${formatNum(sense, "ar")}`,
		wujuhNoVerses: "لم يُعثر على موضع شاهد هذا الوجه.",
		qiraatTitle: "القراءات العشر المتواترة",
		qiraatIsolation: "عند الوقف والانفراد",
		qiraatWasl: "عند الوصل والدرج",
		qiraatSemanticNote: "التوجيه الدلالي واللغوي",
	},
	surahs: {
		countEyebrow: (count: number) => `${formatNum(count, "ar")} سورة`,
		pageTitle: "تصفح القرآن الكريم",
	},
	examples: {
		rootPlaceholder: "علم",
		lemmaPlaceholder: "هَل",
		pageTitle: "استكشف الأنماط النحوية",
		lead: "ابحث في متن المدونة بالجذر، أو اللفظ المعجمي، أو نوع الكلمة، أو الوزن الصرفي، أو العلاقة الإعرابية.",
		presetHal: "استفهام هل",
		presetAfala: "أَفْعَلَ من نزل",
		presetFaala: "فَعَّلَ من علم",
		presetFail: "فاعل",
		presetHalState: "حال",
		filterRoot: "الجذر",
		filterLemma: "الأصل المعجمي",
		filterPos: "النوع",
		filterForm: "الوزن",
		filterRelation: "العلاقة النحوية",
		anyOption: "الكل",
		noOptionMatch: "لا نتائج مطابقة",
		clearFilter: (label: string) => `مسح ${label}`,
		wordsFound: (count: number, limit: number) => {
			const n = formatNum(count, "ar");
			const wordText =
				count === 1
					? "كلمة"
					: count === 2
						? "كلمتان"
						: count <= 10
							? "كلمات"
							: "كلمة";
			return `${n} ${wordText}${count > limit ? ` · عُرض منها ${formatNum(limit, "ar")}` : ""}`;
		},
		noWordsMatch: "لا توجد كلمات مطابقة لهذا الجمع من المعايير.",
		showMore: "عرض المزيد",
		chooseCriteriaHint:
			"اختر جذراً أو أصلاً أو نوعاً أو وزناً أو علاقة نحوية لبدء البحث.",
		moreFilters: "خيارات بحث أخرى",
		fewerFilters: "خيارات أقل",
	},
	sources: {
		pageTitle: "المصادر المعتمدة في هذا الإصدار",
		intro:
			"تطبيق عدسات هو قارئ تحليلي يجمع دراسات قرآنية منشورة بترخيص مفتوح. النص القرآني محفوظ دون أدنى تبديل. تُنسب كل طبقة إعرابية لمصدرها، ويمكن عرض أكثر من طبقة في آن واحد.",
		coverageHeading: "تغطية المتن والطبقات التحليلية",
		coverageBody: (stats) =>
			`يغطي التحليل الصرفي والإعراب المفرد والصرف ومعاني الكلمات من مركز تفسير كامل كلمات القرآن البالغة ${formatNum(stats.words, "ar")} كلمة في جميع السور الـ ١١٤ (${formatNum(stats.syntaxVerses, "ar")} آية)، مع مقاصد السور والمختصر في التفسير بالعربية والإنجليزية والإندونيسية. وتشمل شجرة الإعراب الكاملة (نور البيان) جميع الآيات (${formatNum(stats.syntaxGraphs, "ar")} جملة تركيبية)، وتغطي القراءات العشر ${formatNum(stats.qiraatWords ?? 0, "ar")} كلمة في ${formatNum(stats.qiraatVerses ?? 0, "ar")} آية، ويرصد المتشابه اللفظي ${formatNum(stats.mutashabihPairs ?? 0, "ar")} نظير في ${formatNum(stats.mutashabihVerses ?? 0, "ar")} آية، وتوثق أسباب النزول المحررة ${formatNum(stats.asbabVerses ?? 0, "ar")} آية.`,
		licenseLabel: "الترخيص:",
		kinds: {
			morphology: "الصرف والاشتقاق",
			syntax: "شجرة الإعراب",
			text: "النص القرآني",
			"classical-irab": "الإعراب والصرف",
			tafsir: "التفسير",
			translation: "الترجمة",
			asbab: "أسباب النزول",
			qiraat: "القراءات العشر",
			mutashabih: "المتشابه اللفظي",
			"word-translation": "ترجمة الكلمات",
			dictionary: "المعاجم",
		},
		items: {
			"openiti-wujuh": {
				title: "إصلاح الوجوه والنظائر للدامغاني",
				attribution:
					"الحسين بن محمد الدامغاني (ت 478هـ)، النص الرقمي من مدونة OpenITI (تحقيق عبد العزيز سيد الأهل)",
				description:
					"الأوجه التي تأتي عليها الكلمة في القرآن وشواهد كل وجه، مربوطة بمواضع الكلمات.",
				license: "CC BY-NC-SA 4.0 (إصدار مدونة OpenITI)",
			},
			"qac-word-by-word": {
				title: "ترجمة كلمات القرآن إلى الإنجليزية (المدونة القرآنية العربية)",
				attribution:
					"قيس دوكس والمدونة القرآنية العربية، عن عمل شهناز شيخ وكوثر خطري",
				description:
					"ترجمة إنجليزية لكل كلمة من كلمات القرآن، تُعرض كما هي في بطاقة الكلمة.",
				license:
					"رخصة جنو العمومية (GPL) مع شروط المدونة: النقل الحرفي ونسبة المصدر.",
			},
			"lane-lexicon": {
				title: "معجم لين العربي الإنجليزي",
				attribution:
					"إدوارد وليم لين (1863-1893). Text provided by Perseus Digital Library, with funding from The U.S. Department of Education and The Max Planck Society.",
				description:
					"مواد معجم لين لكل جذر قرآني، بعد تحويل نقحرة بيرسيوس إلى الحرف العربي.",
				license:
					"شروط بيرسيوس: حرية النشر مع نسبة النص إلى بيرسيوس، وإبقاء بيان الإتاحة، وعرض التعديلات عليهم.",
			},
			"openiti-maqayis": {
				title: "معجم مقاييس اللغة لابن فارس",
				attribution:
					"ابن فارس (ت 395هـ)، النص الرقمي من مدونة OpenITI (تحقيق عبد السلام هارون، 1979)",
				description: "الأصل الذي يرجع إليه كل جذر، من متن الكتاب وحده.",
				license: "CC BY-NC-SA 4.0 (إصدار مدونة OpenITI)",
			},
			"openiti-mufradat": {
				title: "المفردات في غريب القرآن للراغب الأصفهاني",
				attribution:
					"الراغب الأصفهاني (ت 502هـ)، النص الرقمي من مدونة OpenITI (تحقيق صفوان الداودي)",
				description: "معاني كل جذر في القرآن، من متن الكتاب وحده.",
				license: "CC BY-NC-SA 4.0 (إصدار مدونة OpenITI)",
			},
			"qac-morphology": {
				title: "الصرف والتحليل المورفولوجي 0.4 (المدونة النحوية)",
				attribution:
					"قيس دوكس والمدونة النحوية للقرآن الكريم (Quranic Arabic Corpus)",
				description:
					"تفكيك الكلمات إلى سوابق وجذور وجذوع ولواحق، مع تحديد الخصائص الصرفية والإعرابية لكل كلمة في القرآن.",
				license: "رخصة جنو العمومية (GPL)، مع حرية الاستخدام شريطة عزو المصدر.",
			},
			"noorbayan-syntax": {
				title: "شجرة الإعراب القرآني الكاملة (نور البيان)",
				attribution:
					"فريق نور البيان، بالبناء على المدونة النحوية للدكتور قيس دوكس رحمه الله، وتدقيق الموسوعة القرآنية (Quranpedia)",
				description:
					"شجرة إعراب وتبعية نحوية كاملة وشاملة لجميع آيات القرآن الكريم الـ 6,236 في 114 سورة، تشمل روابط العامل والمعمول والأقواس التركيبية للجمل وأشباه الجمل، وتُبنى عليها فهارس الشواهد وتمارين الإعراب.",
				license: "رخصة إم آي تي (MIT License).",
			},
			"asbab-muharrar": {
				title: "المحرر في أسباب نزول القرآن من خلال الكتب التسعة",
				attribution:
					"د. خالد بن سليمان المزيني (مركز تفسير للدراسات القرآنية / دار ابن الجوزي)",
				description:
					"تحرير وتخريج علمي محكم لأسباب النزول من أمهات كتب الحديث التسعة، مع نقد الأسانيد وبيان درجات الروايات صحة وضعفاً.",
				license: "رخصة المشاع الإبداعي CC BY 4.0.",
			},
			"canonical-qiraat": {
				title: "القراءات العشر المتواترة وتوجيهها الدلالي",
				attribution:
					"مركز تفسير للدراسات القرآنية، بالاستناد إلى كتاب النشر في القراءات العشر لابن الجزري",
				description:
					"فرش وتوجيه القراءات العشر المتواترة من طريقي الشاطبية والدرة لكل كلمة قرآنية، مع بيان الفروق اللغوية والتفسيرية.",
				license: "رخصة المشاع الإبداعي CC BY 4.0.",
			},
			tanzil: {
				title: "مصحف تنزيل بالرسم العثماني",
				attribution: "مشروع تنزيل (Tanzil Project)",
				description:
					"النص القرآني المطابق للرسم العثماني الموثق من مشروع تنزيل برواية حفص عن عاصم، محفوظ دون أدنى تبديل.",
				license: "رخصة المشاع الإبداعي CC BY-ND 3.0.",
			},
			"english-mokhtasar": {
				title: "المختصر في تفسير القرآن الكريم (إنجليزي)",
				attribution: "مركز تفسير للدراسات القرآنية، عبر QuranEnc.com",
				description:
					"الترجمة التفسيرية الإنجليزية لكتاب المختصر في تفسير القرآن الكريم عبر منصة QuranEnc.",
				license: "شروط إعادة النشر من QuranEnc: نقل النص التام وعزو المصدر.",
			},
			"tafsir-center": {
				title: "التحليل اللغوي لمركز تفسير (إعراب وصرف)",
				attribution: "مركز تفسير للدراسات القرآنية",
				description:
					"الإعراب المفصل والوصف الصرفي التراثي ومعاني المفردات لكل كلمة، مع إعراب الجمل للآيات ومقاصد السور وترتيب نزولها من قاعدة بيانات مركز تفسير.",
				license: "رخصة المشاع الإبداعي المفتوحة CC BY 4.0.",
			},
			"indonesian-mokhtasar": {
				title: "المختصر في تفسير القرآن الكريم (إندونيسي)",
				attribution: "مركز تفسير للدراسات القرآنية، عبر QuranEnc.com",
				description:
					"الترجمة الإندونيسية لكتاب المختصر في تفسير القرآن الكريم، الإصدار V1.0.0 (23 يناير 2017).",
				license:
					"شروط إعادة النشر من QuranEnc: ذكر رقم الإصدار والمحافظة على النص الأصلي.",
			},
			"arabic-mokhtasar": {
				title: "المختصر في تفسير القرآن الكريم (عربي)",
				attribution:
					"جماعة من علماء التفسير برعاية مركز تفسير للدراسات القرآنية، عبر QuranEnc.com",
				description:
					"التفسير الميسر المعتمد والمحرر بعناية بالغة، يُعرض نصه بنقاء تام دون اختصار.",
				license: "شروط إعادة النشر من QuranEnc: النص الأصلي وعزو المصدر.",
			},
			"saheeh-international": {
				title: "ترجمة صحيح إنترناشونال (إنجليزي)",
				attribution:
					"صحيح إنترناشونال (إميلي السامي، ماري كينيدي، أمة الله بانتلي)، عبر QuranEnc.com",
				description:
					"ترجمة إنجليزية دقيقة تراعي البناء النحوي والسياق، تُعرض في طبقة تفسير الآية بجوار النص العربي.",
				license:
					"استخدام تعليمي وبحثي متاح مع نسبة الفضل إلى صحيح إنترناشونال.",
			},
			"indonesian-sabiq": {
				title: "ترجمة القرآن الكريم باللغة الإندونيسية (دار سابق)",
				attribution: "دار سابق (بإشراف مركز رواد للترجمة)، عبر QuranEnc.com",
				description:
					"ترجمة معاصرة ودقيقة لمعاني القرآن الكريم باللغة الإندونيسية تتميز بالإيجاز والوضوح والتدقيق الدوري.",
				license: "توزيع مفتوح وفق شروط منصة QuranEnc.",
			},
			"waqar-mutashabihat": {
				title: "مجموعة بيانات المتشابه اللفظي (نظائر الحفّاظ)",
				attribution: "وقار ١٤٤ (Quran_Mutashabihat_Data)",
				description:
					"أزواج الآيات المتشابهة لفظياً عبر الأجزاء الثلاثين لتثبيت الحفظ والضبط.",
				license: "مشاع إبداعي صفر CC0 1.0 (ملك عام).",
			},
			"quranpedia-mutashabihat": {
				title: "المتشابه اللفظي وضوابط الحفظ من الموسوعة القرآنية",
				attribution: "الموسوعة القرآنية (Quranpedia.net)",
				description:
					"ضوابط الحفظ التراثية وتوجيه الفروق اللفظية والبلاغية بين الآيات المتشابهة.",
				license: "متاح للاستخدام في التطبيقات والأدوات البحثية مع عزو المصدر.",
			},
		},
	},
};
