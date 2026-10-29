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
		rhetoricNav: "البلاغة",
		munasabatNav: "المناسبات",
		previous: "السابق",
		next: "التالي",
		search: "بحث",
		offlineReady: "متاح دون اتصال",
		savingOffline: (done: number, total: number) =>
			`جارٍ حفظ القرآن للعمل دون اتصال، ${formatNum(Math.max(done, 1), "ar")} من ${formatNum(total, "ar")}.`,
		chapterAndVerse: "السورة والآية",
		open: "فتح",
		verse: "الآية",
		tanzilSource: "تنزيل",
		tafsirCenterSource: "مركز تفسير للدراسات القرآنية",
		corpusSource: "المدونة القرآنية",
	},
	quiz: {
		pageTitle: "تمارين النحو والصرف",
		lensesAria: "عدسات الاختبار",
		stepsAria: "خطوات الاختبار",
		streakLabel: "تتابع",
		skipButton: "↻ تخطي",
		openReader: (sura: number, verse: number) =>
			`القارئ ${formatNum(sura, "ar")}:${formatNum(verse, "ar")} ↗`,
		stepRoleCrumb: "الموقع",
		stepCaseCrumb: "الحالة",
		stepSignCrumb: "العلامة",
		stepCheckCrumb: "تحقق",
		targetBadge: "المطلوب",
		headBadge: "العامل",
		legendTarget: (wordAr: string) => `المطلوب · ${wordAr}`,
		legendHead: (roleLabel: string, wordAr: string) =>
			`${roleLabel} · ${wordAr}`,
		pickGovernorHint: "اضغط كلمة في الآية لتعيين العامل",
		step1Eyebrow: "الخطوة ١ من ٤ · الموقع الإعرابي",
		step1Question: (wordAr: string) => `ما الموقع الإعرابي لكلمة ${wordAr}؟`,
		step2Eyebrow: (govLabel: string) => `الخطوة ٢ من ٤ · اختر ${govLabel}`,
		step2Question: (govAr: string, wordAr: string) =>
			`أي كلمة في الآية هي ${govAr} لـ ${wordAr}؟`,
		step2Hint:
			"اختر الكلمة من القائمة أدناه أو اضغط عليها مباشرة في الآية أعلاه",
		step3Eyebrow: "الخطوة ٣ من ٤ · الحالة الإعرابية",
		step3Question: (wordAr: string) => `ما الحالة الإعرابية لكلمة ${wordAr}؟`,
		step4Eyebrow: "الخطوة ٤ من ٤ · علامة الإعراب",
		step4Question: (wordAr: string) => `ما علامة إعراب ${wordAr}؟`,
		step5Eyebrow: "جاهز للتحقق · مراجعة الإعراب",
		step5Title: (wordAr: string) => `راجع صياغة إعرابك لكلمة ${wordAr}`,
		backButton: "→ رجوع",
		editButton: "→ تعديل",
		revealButton: "إظهار الحل",
		submitButton: "تحقق واعرض الإعراب الكامل",
		nextButton: "سؤال جديد ←",
		exactMatchEyebrow: "إجابة صحيحة · أحسنت",
		reviewEyebrow: "مراجعة الإعراب · التصويب",
		classicalHeading: (wordAr: string) => `الإعراب التفصيلي لكلمة ${wordAr}`,
		notSet: "غير محدد",
		incompleteAlert: "اضغط على الخطوة الناقصة أعلاه لإكمال الإعراب:",
	},
	settings: {
		title: "الإعدادات",
		buttonAria: "الإعدادات",
		languageSection: "اللغة",
		themeSection: "المظهر",
		themeLight: "فاتح",
		themeDark: "داكن",
		quizSection: "الاختبار",
		quizDiacriticsLabel: "إخفاء التشكيل في الاختبارات",
		quizDiacriticsDescription: "عرض آيات القرآن بدون حركات لتحدٍّ أصعب.",
		featuresSection: "الميزات",
		featuresSectionHint:
			"تبقى الاستوديوهات الاختيارية معطّلة حتى تفعّلها. إيقاف الميزة يخفيها دون حذف البيانات المحمّلة.",
		features: {
			rhetoricStudio: "مختبر البلاغة",
			munasabat: "المناسبات",
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
			balagha: "البلاغة الكلاسيكية",
		},
		featureOffTitle: (feature: string) => `${feature} معطّل`,
		featureOffBody:
			"فعّل هذه الميزة من الإعدادات لفتحها. إيقافها لاحقاً لا يحذف شيئاً.",
		featureOffOpenSettings: "فتح الإعدادات",
		sourcesLink: "مصادر البيانات",
		sourcesDescription: "استكشف مصادر البيانات اللغوية وتراخيصها.",
		installApp: "تثبيت التطبيق",
		closeAria: "إغلاق الإعدادات",
	},
	verse: {
		meccan: "مكية",
		madinan: "مدنية",
		verseMeaningTitle: "تفسير الآية",
		verseMeaningSub: "المختصر في التفسير · QuranEnc",
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
		firstClause: "أنت في الجملة الأولى.",
		lastClause: "أنت في الجملة الأخيرة.",
		clauseNoteContinues: "تتصل هذه الجملة بآية مجاورة.",
		noTreeTitle: "لا توجد شجرة إعراب لهذه الآية.",
		classicalIrabShort: "إعراب",
		surahGoalLabel: "مقصد السورة",
		revelationOrder: (seq: number) => `ترتيب النزول #${formatNum(seq, "ar")}`,
		asbabBadge: (count: number) => `سبب النزول (${formatNum(count, "ar")})`,
		asbabDrawerTitle: "أسباب النزول (المحرر في أسباب نزول القرآن)",
		asbabSectionTitle: "أسباب النزول",
		balaghaBadge: "البلاغة الكلاسيكية",
		balaghaSectionTitle: "البلاغة الكلاسيكية",
		balaghaStudioLink: "فتح في مختبر البلاغة",
		balaghaBranchLabel: "الفرع",
		balaghaDeviceLabel: "الفن",
		nahwTabTitle: "النحو وشجرة الإعراب",
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
		structureBadge: (count: number) =>
			`بنية السورة (${formatNum(count, "ar")})`,
		structureSectionTitle: "المناسبات وبنية السورة",
		structureEmptyState: "لا توجد بنية حلقية مسجّلة لهذه السورة.",
		structurePivotLabel: "المحور والمركز",
		structureOpeningHemisphere: "نصف الافتتاح",
		structureClosingHemisphere: "نصف الختام",
		structureJumpToBlock: "الانتقال إلى هذا المقطع",
		structureVerseRange: (start: number, end: number) =>
			start === end
				? `آية ${formatNum(start, "ar")}`
				: `الآيات ${formatNum(start, "ar")}–${formatNum(end, "ar")}`,
		structurePairHint:
			"ركّز على مقطع أو مرّر المؤشر فوقه ليُضاء قرينه المتناظر عبر الطيّة.",
		munasabatCardTitle: "المناسبات · مناسبة السور",
		munasabatBridgeBadge: "جسر موضوعي",
		munasabatSuyutiLabel: "السيوطي",
		munasabatSuyutiWork: "تناسق الدرر",
		munasabatBiqaiLabel: "البقاعي",
		munasabatBiqaiWork: "نظم الدرر",
		munasabatJumpNext: (name: string, number: string) =>
			`الانتقال إلى ${name} (${number}) ↗`,
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
		qiraatTitle: "القراءات العشر المتواترة",
		qiraatIsolation: "عند الوقف والانفراد",
		qiraatWasl: "عند الوصل والدرج",
		qiraatSemanticNote: "التوجيه الدلالي واللغوي",
	},
	surahs: {
		countEyebrow: (count: number) => `${formatNum(count, "ar")} سورة`,
		pageTitle: "تصفح القرآن الكريم",
		metaLinksLabel: "طبقات السورة",
		structureLink: "البنية",
		munasabatLink: "المناسبات",
		balaghaLink: "البلاغة",
		balaghaLinkTitle: (count: number) =>
			`${formatNum(count, "ar")} تحليل بلاغي في استوديو البلاغة`,
	},
	munasabat: {
		pageTitle: "مختبر المناسبات وبنية السور",
		lead: "استكشف التركيب الدائري لكل سورة والروابط الكلاسيكية التي تصلها بما قبلها وبعدها.",
		surahPickerLabel: "السورة",
		emptyState: "لا تتوفر بيانات بنية لهذه السورة.",
		openInReader: (sura: number, verse: number) =>
			`فتح ${formatNum(sura, "ar")}:${formatNum(verse, "ar")} في القارئ ↗`,
	},
	rhetoric: {
		datasetsAria: "مجموعات البلاغة",
		filterSurahAria: "تصفية حسب السورة",
		searchAria: "تصفية الآيات والشواهد",
	},
	examples: {
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
	},
	sources: {
		pageTitle: "المصادر المعتمدة في هذا الإصدار",
		intro:
			"تطبيق عدسات هو قارئ تحليلي يجمع دراسات قرآنية منشورة بترخيص مفتوح. النص القرآني محفوظ دون أدنى تبديل. تُنسب كل طبقة إعرابية لمصدرها، ويمكن عرض أكثر من طبقة في آن واحد.",
		coverageHeading: "تغطية شجرة النحو والإعراب",
		coverageBody: (
			words: number,
			syntaxVerses: number,
			partialText: string,
			chStart: number,
			chEnd: number,
		) =>
			chStart && chEnd
				? `يغطي التحليل الصرفي كامل كلمات القرآن البالغة ${formatNum(words, "ar")} كلمة. وتشمل شجرة الإعراب ${formatNum(syntaxVerses, "ar")} آية${partialText}. السور ${formatNum(chStart, "ar")}–${formatNum(chEnd, "ar")} لم تكتمل شجرتها في هذا التصدير بعد. يتوفر الإعراب والصرف من مركز تفسير لجميع الكلمات.`
				: `يغطي التحليل الصرفي كامل كلمات القرآن البالغة ${formatNum(words, "ar")} كلمة. وتشمل شجرة الإعراب الكاملة (نور البيان) جميع سور القرآن الكريم الـ 114 (${formatNum(syntaxVerses, "ar")} آية) بنسبة 100% بكامل علاقات التبعية والأقواس التركيبية للجمل وأشباه الجمل. يتوفر الإعراب والصرف من مركز تفسير لجميع الكلمات.`,
		rhetoricCoverageHeading: "تغطية مختبر البلاغة والتراكيب",
		rhetoricCoverageBody: (versesCount: number, surasCount: number) =>
			`يغطي مختبر البلاغة ${formatNum(versesCount, "ar")} شاهداً تحليلياً في ${formatNum(surasCount, "ar")} سورة، تشمل تشريح التشبيه التمثيلي والمفرد وفق معادلة الأركان الأربعة (ناشر وآخرون 2026)، وبلاغة الحذف والتقدير النحوي المسند (إطار إيجاز الحذف 2025)، وشواهد البلاغة الكبرى في المعاني والبيان والبديع.`,
		partialSnippet: (syntax: number, total: number, surah: number) =>
			`، بما فيها ${formatNum(syntax, "ar")} من أصل ${formatNum(total, "ar")} آية في سورة ${formatNum(surah, "ar")}`,
		licenseLabel: "الترخيص:",
		kinds: {
			morphology: "الصرف والاشتقاق",
			syntax: "شجرة الإعراب",
			text: "النص القرآني",
			"classical-irab": "الإعراب القديم",
			tafsir: "التفسير",
			translation: "الترجمة",
			rhetoric: "علم البلاغة",
			asbab: "أسباب النزول",
			qiraat: "القراءات العشر",
		},
		items: {
			"qac-morphology": {
				title: "الصرف والتحليل المورفولوجي 0.4 (المدونة النحوية)",
				attribution:
					"قيس دوكس والمدونة النحوية للقرآن الكريم (Quranic Arabic Corpus)",
				description:
					"تفكيك الكلمات إلى سوابق وجذور وجذوع ولواحق، مع تحديد الخصائص الصرفية والإعرابية لكل كلمة في القرآن.",
				license: "رخصة جنو العمومية (GPL)، مع حرية الاستخدام شريطة عزو المصدر.",
			},
			"qac-syntax": {
				title: "شجرة الإعراب القرآني وبنى التبعية النحوية",
				attribution:
					"قيس دوكس، المدونة النحوية للقرآن الكريم (kaisdukes/quranic-corpus-api)",
				description:
					"رسوم بيانية لشجرة الإعراب وعلاقات التبعية التركيبية المستخرجة من شجرة الإعراب القرآني.",
				license: "شروط المدونة النحوية: الإشارة لموقع corpus.quran.com.",
			},
			"noorbayan-syntax": {
				title: "شجرة الإعراب القرآني الكاملة (نور البيان)",
				attribution:
					"فريق نور البيان، بالبناء على المدونة النحوية للدكتور قيس دوكس رحمه الله، وتدقيق الموسوعة القرآنية (Quranpedia)",
				description:
					"شجرة إعراب وتبعية نحوية كاملة وشاملة لجميع آيات القرآن الكريم الـ 6,236 في 114 سورة، تشمل روابط العامل والمعمول والأقواس التركيبية للجمل وأشباه الجمل.",
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
					"الوصف الصرفي التراثي والإعراب المفصل لكل كلمة، وإعراب الجمل للآيات من قاعدة بيانات مركز تفسير.",
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
					"صحيح إنترناشونال (إميلي السامي، ماري كينيدي، أمة الله بانتلي)، عبر Tanzil.net وQuranEnc.com",
				description:
					"ترجمة إنجليزية دقيقة تراعي البناء النحوي والسياق، تُستعرض بجوار النص العربي لدراسة النظم والأسلوب.",
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
			"rhetoric-tashbih": {
				title: "بيانات التشبيه والتمثيل البلاغي في القرآن",
				attribution:
					"ناشر وآخرون (2026)، 'قاعدة بيانات التشبيه في القرآن الكريم' (arXiv:2601.19972)",
				description:
					"تفكيك تحليلي متقدم لأركان التشبيه الأربعة (المشبه، أداة التشبيه، المشبه به، وجه الشبه) وتصنيف التشبيه التمثيلي المركب.",
				license: "رخصة أكاديمية مفتوحة (arXiv:2601.19972).",
			},
			"rhetoric-hadhf": {
				title: "بيانات إيجاز الحذف والبلاغة التركيبية",
				attribution:
					"هشام الدين أحمد ونور فرحانة أحمد غفار (2026) / إطار إيجاز الحذف (EEF 2025)، استناداً إلى دلائل الإعجاز لعبد القاهر الجرجاني وكتب الإعراب",
				description:
					"فهرسة مواضع الحذف البلاغي (حذف المفعول، المضاف، وجواب الشرط، والقول) مع بيان التقدير النحوي والسر البلاغي.",
				license: "توزيع مفتوح للأغراض التعليمية والبحثية.",
			},
			"classical-balagha": {
				title: "شواهد أمهات كتب البلاغة القرآنية",
				attribution:
					"أمهات المصادر: الجرجاني (دلائل الإعجاز)، الزمخشري (الكشاف)، السكاكي (مفتاح العلوم)، السيوطي (الإتقان)",
				description:
					"تحليل بلاغي لأهم الشواهد والأساليب القرآنية الموزعة على علوم البلاغة الثلاثة: المعاني (الالتفات، القصر)، والبيان (الاستعارة، الكناية)، والبديع (الجناس، الطباق).",
				license: "ملك عام / التراث الإسلامي الخالد.",
			},
		},
	},
};
