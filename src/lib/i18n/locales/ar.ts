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
		firstClause: "أنت في الجملة الأولى.",
		lastClause: "أنت في الجملة الأخيرة.",
		clauseNoteContinues: "تتصل هذه الجملة بآية مجاورة.",
		noTreeTitle: "لا توجد شجرة إعراب لهذه الآية.",
		classicalIrabShort: "إعراب",
	},
	sheet: {
		analysisAria: (wordNumber: number) =>
			`تحليل الكلمة ${formatNum(wordNumber, "ar")}`,
		closeAria: "إغلاق التحليل",
		expandAria: "توسيع التحليل",
		collapseAria: "طي التحليل",
		corpusMorphology: "الصرف والتحليل النحوي",
		classicalIrab: "الإعراب المفرد",
		sarf: "الصرف والبنية",
		wordMeaning: "معنى الكلمة",
		partOfSpeech: "النوع",
		root: "الجذر",
		lemma: "الأصل المعجمي",
		searchThisRoot: "ابحث عن هذا الجذر",
		searchThisLemma: "ابحث عن هذا الأصل",
		basePatternHint: "الوزن الأصلي فَعَلَ لا يُعلّم غالباً.",
		impliedEstimated: "مقدَّر",
	},
	surahs: {
		countEyebrow: (count: number) => `${formatNum(count, "ar")} سورة`,
		pageTitle: "تصفح القرآن الكريم",
		coverageTreebank: "شجرة النحو",
		coverageMorphology: "الصرف والإعراب",
		coverageTrees: (syntax: number, total: number) =>
			`${formatNum(syntax, "ar")}/${formatNum(total, "ar")} شجرة`,
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
			`يغطي التحليل الصرفي كامل كلمات القرآن البالغة ${formatNum(words, "ar")} كلمة. وتشمل شجرة الإعراب ${formatNum(syntaxVerses, "ar")} آية${partialText}. السور ${formatNum(chStart, "ar")}–${formatNum(chEnd, "ar")} لم تكتمل شجرتها في هذا التصدير بعد. يتوفر الإعراب والصرف من مركز تفسير لجميع الكلمات.`,
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
