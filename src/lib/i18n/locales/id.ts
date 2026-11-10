import { formatNum } from "../format";
import type { Translations } from "../types";

export const id: Translations = {
	common: {
		appName: "Lensa",
		searchPlaceholder: "Surah:ayat, atau kata",
		searchAria: "Cari ayat",
		closeSearchAria: "Tutup pencarian",
		versesCount: (count: number) => `${formatNum(count, "id")} ayat`,
		noVersesMatch: "Tidak ada ayat yang cocok.",
		surahsNav: "Surah",
		examplesNav: "Contoh",
		quizNav: "Kuis",
		previous: "Sebelumnya",
		next: "Berikutnya",
		search: "Cari",
		offlineReady: "Tersedia offline",
		savingOffline: (done: number, total: number) =>
			`Menyimpan Al-Qur'an secara offline, ${formatNum(Math.max(done, 1), "id")} dari ${formatNum(total, "id")}.`,
		chapterAndVerse: "Surah dan ayat",
		open: "Buka",
		verse: "Ayat",
		tafsirCenterSource: "Markaz Tafsir untuk Studi Al-Qur'an",
		corpusSource: "Quranic Arabic Corpus",
	},
	quiz: {
		pageTitle: "Latihan Nahwu & Sharaf",
		lensesAria: "Lensa kuis",
		stepsAria: "Langkah kuis",
		streakLabel: "beruntun",
		scoreLabel: "benar / percobaan",
		skipButton: "↻ Lewati",
		openReader: (sura: number, verse: number) =>
			`Pembaca ${formatNum(sura, "id")}:${formatNum(verse, "id")} ↗`,
		stepRoleCrumb: "Kedudukan",
		stepCaseCrumb: "I'rab",
		stepSignCrumb: "Tanda",
		stepCheckCrumb: "Periksa",
		fieldRoot: "Akar kata",
		fieldWazn: "Wazan",
		fieldClass: "Bab/Musytaq",
		fieldStructure: "Struktur",
		targetBadge: "Target",
		headBadge: "Pengampu",
		legendTarget: (wordAr: string) => `Target · ${wordAr}`,
		legendHead: (roleLabel: string, wordAr: string) =>
			`${roleLabel} · ${wordAr}`,
		pickGovernorHint:
			"Pilih kata di bawah, atau ketuk langsung pada ayat di atas.",
		step1Eyebrow: "LANGKAH 1 DARI 4 · KEDUDUKAN SINTAKSIS",
		step1Question: (wordAr: string) =>
			`Apa kedudukan i'rab (موقع إعرابي) dari kata ${wordAr}?`,
		step2Eyebrow: (govLabel: string) =>
			`LANGKAH 2 DARI 4 · PILIH ${govLabel.toUpperCase()}`,
		step2Question: (govAr: string, wordAr: string) =>
			`Kata mana pada ayat ini yang menjadi ${govAr} bagi ${wordAr}?`,
		step3Eyebrow: "LANGKAH 3 DARI 4 · HUKUM I'RAB (KASUS)",
		step3Question: (wordAr: string) =>
			`Apa hukum i'rab (الحالة الإعرابية) dari kata ${wordAr}?`,
		step4Eyebrow: "LANGKAH 4 DARI 4 · TANDA I'RAB (ʿALĀMAH)",
		step4Question: (wordAr: string) =>
			`Apa tanda i'rab (علامة الإعراب) pada kata ${wordAr}?`,
		step5Eyebrow: "SIAP DIPERIKSA · مراجعة الإعراب",
		step5Title: (wordAr: string) =>
			`Tinjau rangkaian i'rab Anda untuk ${wordAr}`,
		backButton: "← Kembali",
		editButton: "← Ubah",
		submitButton: "Periksa & Tampilkan I'rab Klasik",
		nextButton: "Soal Berikutnya →",
		exactMatchEyebrow: "TEPAT SEKALI · أحسنت",
		reviewEyebrow: "TINJAUAN · تصويب",
		classicalHeading: (wordAr: string) => `I'rab Klasik untuk ${wordAr}`,
		formulaEditHint: "Ketuk bagian mana pun untuk mengubahnya.",
		incompleteAlert: "Ketuk langkah yang belum lengkap di atas:",
		mutashabih: {
			fieldWording: "Lafaz",
			fieldSurah: "Surah",
			wordingQuestion: "Lafaz mana yang melengkapi ayat ini?",
			wordingHint:
				"Setiap pilihan adalah bacaan ayat yang mirip di posisi ini.",
			noWord: "Tidak ada kata",
			surahQuestion: "Ayat ini ada di surah mana?",
			reviewTitle: "Tinjau jawabanmu",
			submitButton: "Periksa",
			placesHeading: "Letak setiap lafaz",
			thisAyah: "ayat ini",
			dabtHeading: "Kaidah / Rumus Hafalan (Dzabit)",
			tawjihHeading: "Tawjih Balaghah & Perbedaan",
		},
		sarf: {
			rootQuestion: (wordAr: string) =>
				`Apa akar kata (maddah) dari ${wordAr}?`,
			waznQuestion: (wordAr: string) => `Apa wazan sharaf dari ${wordAr}?`,
			verbClassQuestion: (wordAr: string) =>
				`Termasuk bab / wazan fi'il apa ${wordAr}?`,
			nounClassQuestion: (wordAr: string) =>
				`Termasuk jenis isim apa ${wordAr} dari segi derivasinya (isytiqaq)?`,
			verbStructureQuestion: (wordAr: string) =>
				`Bagaimana ${wordAr} digolongkan menurut shahih dan mu'tal akar katanya?`,
			nounStructureQuestion: (wordAr: string) =>
				`Apa struktur bilangan (mufrad, mutsanna, jamak) dari ${wordAr}?`,
			reviewTitle: (wordAr: string) =>
				`Tinjau analisis sharaf Anda untuk ${wordAr}`,
			submitButton: "Periksa & Tampilkan Sharaf Klasik",
			revealHeading: (wordAr: string) => `Sharaf Klasik untuk ${wordAr}`,
			rootInExamples: (root: string) => `Akar kata (${root}) di Contoh ↗`,
		},
	},
	settings: {
		title: "Pengaturan",
		buttonAria: "Pengaturan",
		languageSection: "Bahasa",
		themeSection: "Tampilan",
		themeLight: "Terang",
		themeDark: "Gelap",
		readerSection: "Lapisan pembaca",
		readerSectionHint:
			"Sembunyikan lapisan yang tidak Anda pelajari. Lapisan yang dimatikan hilang dari tampilan ayat dan tidak diunduh sebelum diaktifkan.",
		readerLayers: {
			meaning: "Makna ayat",
			irab: "Sintaksis kalimat (iʿrāb)",
			nahw: "Nahwu & pohon sintaksis",
			mutashabih: "Kesamaan verbal",
			asbab: "Sebab turun",
			qiraat: "Sepuluh qira'at di lembar kata",
			wujuh: "Ragam makna ad-Damaghani di lembar kata",
			khatib: "Referensi tata bahasa & iʿrāb (al-Khatib)",
		},
		sourcesLink: "Sumber Data",
		sourcesDescription: "Jelajahi sumber data korpus dan lisensi",
		installApp: "Pasang Aplikasi",
		closeAria: "Tutup pengaturan",
	},
	verse: {
		meccan: "Makkiyah",
		madinan: "Madaniyah",
		verseMeaningTitle: "Makna Ayat",
		translationBadge: "Terjemahan Makna",
		tafsirBadge: "Tafsir (Al-Mukhtasar)",
		mukhtasarEnTitle: "Al-Mukhtasar",
		mukhtasarEnSub: "Bahasa Inggris · QuranEnc",
		mukhtasarIdTitle: "Al-Mukhtasar",
		mukhtasarIdSub: "Bahasa Indonesia · QuranEnc",
		mukhtasarArTitle: "Al-Mukhtasar",
		mukhtasarArSub: "Bahasa Arab · QuranEnc",
		irabTitle: "I'rab Kalimat",
		clauseCount: (index: number, total: number) =>
			`Klausa ${formatNum(index + 1, "id")} dari ${formatNum(total, "id")}`,
		clausesAria: "Klausa",
		noTreeTitle: "Belum ada pohon ketergantungan untuk ayat ini.",
		classicalIrabShort: "I'rab",
		surahGoalLabel: "Tujuan Surah",
		surahDetails: "Detail surah",
		revelationOrder: (seq: number) => `Urutan Turun #${formatNum(seq, "id")}`,
		asbabBadge: (count: number) => `Sebab Turun (${formatNum(count, "id")})`,
		asbabDrawerTitle: "Sebab-Sebab Turunnya Ayat (Asbabun Nuzul)",
		asbabSectionTitle: "Asbabun Nuzul (Sebab Turunnya Ayat)",
		nahwTabTitle: "Nahwu & Pohon Sintaksis",
		irabViewsAria: "Tampilan i'rab",
		irabDiagram: "Diagram",
		irabClassical: "I'rab klasik",
		treebankNoorBayan: "Treebank Al-Qur'an NoorBayan",
		mutashabihBadge: (count: number) =>
			`Kemiripan Redaksi (${formatNum(count, "id")})`,
		mutashabihSectionTitle: "Al-Mutasyabih al-Lafzhi (Kemiripan Redaksi Ayat)",
		mutashabihCounterpartAyah: "Ayat Pembanding",
		mutashabihCurrentAyah: "Ayat Ini",
		mutashabihMatchScore: (percent: number) =>
			`Tingkat Kemiripan: ${formatNum(percent, "id")}%`,
		mutashabihDabtTitle: "Kaidah Hafalan (Dhabt)",
		mutashabihTawjihTitle: "Tawjih Balaghah & Perbedaan",
		mutashabihJumpToAyah: "Buka Ayat",
		mutashabihCategoryIdentical: "Ayat Serupa Penuh",
		mutashabihCategoryOpening: "Awal Ayat Sama",
		mutashabihCategoryEnding: "Akhir Ayat Sama",
		mutashabihCategoryPhrase: "Frasa Serupa",
		mutashabihCategorySwap: "Perubahan Urutan Kata",
		mutashabihLegendExact: "Sama Persis",
		mutashabihLegendHaraka: "Perbedaan Harakat",
		mutashabihLegendDiff: "Perbedaan Kata",
		mutashabihLegendExtra: "Tambahan / Pengurangan",
		mutashabihSurahDistance: (count: number) =>
			`Jarak: ${formatNum(count, "id")} surah`,
		mutashabihEmptyState:
			"Tidak ada ayat mutasyabih lafzhi yang tercatat untuk ayat ini.",
		mutashabihReturnToAyah: (coord: string) => `Kembali ke ${coord}`,
		irabModel: "I'rab Teladan (Ya'qub)",
		irabModelTitle: "I'rab Teladan Rinci",
		irabModelSource: "Lampiran Al-Mu'jam al-Mufassal · Dr. Émile Badīʿ Yaʿqūb",
		irabCitationTitle: "Rujukan I'rab (al-Khatib)",
		irabCitationBadge: (count: number) => `${formatNum(count, "id")} entri`,
		irabCitationSource:
			"Al-Mu'jam al-Mufassal fi al-I'rab · Tahir Yusuf al-Khatib",
		irabCitationIntro: (verseRef: string) =>
			`Ayat ini (${verseRef}) dijadikan dalil tata bahasa pada entri-entri berikut:`,
	},
	sheet: {
		analysisAria: (wordNumber: number) =>
			`Analisis kata ${formatNum(wordNumber, "id")}`,
		closeAria: "Tutup analisis",
		expandAria: "Perluas analisis",
		collapseAria: "Kecilkan analisis",
		classicalIrab: "I'rab klasik",
		sarf: "Sharaf",
		irabReferenceTitle: "Referensi Tata Bahasa (al-Khatib)",
		irabReferenceSource: (page: number) =>
			`Al-Mu'jam al-Mufassal fi al-I'rab · hlm. ${formatNum(page, "id")}`,
		irabReferenceBab: (bab: string) => bab,
		irabReferenceCitations: (count: number) =>
			`${formatNum(count, "id")} rujukan Al-Qur'an`,
		wordMeaning: "Arti kata",
		searchThisRoot: "Cari akar kata ini",
		searchThisWord: "Cari kata ini",
		inQuran: "Dalam Al-Qur'an",
		occurrences: (count: number, verses: number, surahs: number) =>
			`${formatNum(count, "id")} kali dalam ${formatNum(verses, "id")} ayat di ${formatNum(surahs, "id")} surah`,
		wordGlossSource: "Bahasa Inggris · Quranic Arabic Corpus",
		dictionaries: "Kamus",
		maqayisTitle: "Maqayis al-Lughah · Ibnu Faris",
		mufradatTitle: "Al-Mufradat · Ar-Raghib al-Ashfahani",
		laneTitle: "Kamus Arab–Inggris Lane",
		laneThisWord: "Kata ini",
		laneOtherEntries: (count: number) =>
			`${formatNum(count, "id")} entri lain untuk akar kata ini`,
		lanePage: (page: number) => `hlm. ${formatNum(page, "id")}`,
		tabsAria: "Analisis kata",
		tabHere: "Dalam ayat ini",
		tabAcross: "Di seluruh Al-Qur'an",
		wujuhTitle: "Ragam makna dalam Al-Qur'an · ad-Damaghani",
		wujuhSeparator: " · ",
		wujuhInThisVerse: "Dalam ayat ini",
		wujuhSenseOf: (sense: number, total: number) =>
			`makna ke-${formatNum(sense, "id")} dari ${formatNum(total, "id")}`,
		wujuhNotCited: (total: number) =>
			`${formatNum(total, "id")} makna. Ayat ini tidak termasuk contoh yang disebut ad-Damaghani.`,
		wujuhThisVerse: "ayat ini",
		wujuhUnnamedSense: (sense: number) => `Makna ke-${formatNum(sense, "id")}`,
		wujuhNoVerses: "Ayat contoh untuk makna ini belum dapat dipetakan.",
		qiraatTitle: "Sepuluh Qira'at Mutawatirah",
		qiraatIsolation: "Saat Berhenti (Waqaf)",
		qiraatWasl: "Saat Bersambung (Washal)",
		qiraatSemanticNote: "Tafsir Makna & Kebahasaan",
	},
	surahs: {
		countEyebrow: (count: number) => `${formatNum(count, "id")} surah`,
		pageTitle: "Jelajahi Al-Qur'an",
	},
	examples: {
		rootPlaceholder: "علم atau Elm",
		lemmaPlaceholder: "hal",
		pageTitle: "Temukan pola",
		lead: "Cari dalam korpus berdasarkan akar kata, bentuk dasar, jenis kata, wazan verba, atau relasi sintaksis.",
		presetHal: "Pertanyaan hal",
		presetAfala: "Af'ala dari n-z-l",
		presetFaala: "Fa''ala dari 'a-l-m",
		presetFail: "Pelaku (Fa'il)",
		presetHalState: "Kondisi (Hal)",
		filterRoot: "Akar kata",
		filterLemma: "Bentuk dasar",
		filterPos: "Jenis kata",
		filterForm: "Wazan verba",
		filterRelation: "Relasi",
		anyOption: "Semua",
		noOptionMatch: "Tidak ada yang cocok",
		clearFilter: (label: string) => `Hapus ${label}`,
		wordsFound: (count: number, limit: number) =>
			`${formatNum(count, "id")} kata${count > limit ? ` · menampilkan ${formatNum(limit, "id")}` : ""}`,
		noWordsMatch: "Tidak ada kata yang cocok dengan kombinasi ini.",
		showMore: "Tampilkan lebih banyak",
		chooseCriteriaHint:
			"Pilih akar kata, bentuk dasar, jenis kata, wazan, atau relasi.",
		moreFilters: "Filter lainnya",
		fewerFilters: "Lebih sedikit filter",
	},
	sources: {
		pageTitle: "Sumber edisi ini dibangun",
		intro:
			"Lenses adalah pembaca untuk analisis yang dipublikasikan secara terbuka. Teks Al-Qur'an bahasa Arab disimpan tanpa perubahan. Lapisan tata bahasa diatribusikan ke sumber aslinya.",
		coverageHeading: "Cakupan Korpus & Lapisan Analisis",
		coverageBody: (stats) =>
			`Morfologi serta i'rab klasik, sharaf, dan makna kata dari Markaz Tafsir mencakup seluruh ${formatNum(stats.words, "id")} kata di 114 surah (${formatNum(stats.syntaxVerses, "id")} ayat), bersama maqashid surah dan tafsir Al-Mukhtashar dalam bahasa Arab, Inggris, dan Indonesia. Pohon sintaksis NoorBayan mencakup seluruh ${formatNum(stats.syntaxVerses, "id")} ayat (${formatNum(stats.syntaxGraphs, "id")} pohon klausa), Qira'at Asyrah mencakup ${formatNum(stats.qiraatWords ?? 0, "id")} kata pada ${formatNum(stats.qiraatVerses ?? 0, "id")} ayat, mutasyabih lafzhi menghubungkan ${formatNum(stats.mutashabihPairs ?? 0, "id")} pasangan pada ${formatNum(stats.mutashabihVerses ?? 0, "id")} ayat, dan asbabun nuzul terverifikasi mencakup ${formatNum(stats.asbabVerses ?? 0, "id")} ayat. Wujuh ad-Damaghani mencatat ragam makna ${formatNum(stats.wujuhRoots ?? 0, "id")} akar kata.`,
		licenseLabel: "Lisensi:",
		kinds: {
			morphology: "Morfologi",
			syntax: "Pohon Sintaksis",
			text: "Teks Al-Qur'an",
			"classical-irab": "I'rab & Sharaf Klasik",
			tafsir: "Tafsir",
			translation: "Terjemahan",
			asbab: "Asbabun Nuzul",
			qiraat: "Qira'at Asyrah",
			mutashabih: "Kesamaan Verbal",
			"word-translation": "Terjemahan Per Kata",
			dictionary: "Kamus",
		},
		items: {
			"khatib-irab": {
				title: "Al-Mu'jam al-Mufassal fi al-I'rab (al-Khatib)",
				attribution:
					"Tahir Yusuf al-Khatib, ditinjau dan diberi pengantar oleh Dr. Émile Badīʿ Yaʿqūb (Dar al-Kutub al-Ilmiyyah, Beirut)",
				description:
					"Kamus referensi alfabetis partikel tata bahasa Arab, kata fungsional, dan kaidah i'rab dengan dalil ayat Al-Qur'an serta i'rab teladan.",
				license: "Penggunaan edukasi publik; edisi digital via thahabi.org",
			},
			"openiti-wujuh": {
				title: "Ishlah al-Wujuh wa an-Nazha'ir (ad-Damaghani)",
				attribution:
					"Al-Husain bin Muhammad ad-Damaghani (w. 478 H); teks digital dari korpus OpenITI (tahqiq 'Abd al-'Aziz Sayyid al-Ahl)",
				description:
					"Ragam makna setiap kata Al-Qur'an beserta ayat contohnya, dipetakan ke posisi kata.",
				license: "CC BY-NC-SA 4.0 (rilis korpus OpenITI)",
			},
			"qac-word-by-word": {
				title: "Terjemahan per kata bahasa Inggris Quranic Arabic Corpus",
				attribution:
					"Kais Dukes dan Quranic Arabic Corpus, dari karya Shehnaz Shaikh dan Kausar Khatri",
				description:
					"Terjemahan bahasa Inggris untuk setiap kata Al-Qur'an, ditampilkan apa adanya di kartu kata.",
				license:
					"GPL, dengan ketentuan korpus: salinan apa adanya dan korpus disebutkan sebagai sumber.",
			},
			"lane-lexicon": {
				title: "Kamus Arab–Inggris Lane",
				attribution:
					"Edward William Lane (1863-1893). Text provided by Perseus Digital Library, with funding from The U.S. Department of Education and The Max Planck Society.",
				description:
					"Entri kamus Lane untuk setiap akar kata Al-Qur'an, dengan transliterasi Perseus diubah ke huruf Arab.",
				license:
					"Ketentuan Perseus: bebas disebarkan dengan menyebut Perseus, mempertahankan pernyataan ketersediaan, dan menawarkan perubahan kepada Perseus.",
			},
			"openiti-maqayis": {
				title: "Mu'jam Maqayis al-Lughah (Ibnu Faris)",
				attribution:
					"Ibnu Faris (w. 395 H); teks digital dari korpus OpenITI (tahqiq 'Abd al-Salam Harun, 1979)",
				description: "Makna pokok setiap akar kata, hanya teks utama.",
				license: "CC BY-NC-SA 4.0 (rilis korpus OpenITI)",
			},
			"openiti-mufradat": {
				title: "Al-Mufradat fi Gharib al-Qur'an (Ar-Raghib al-Ashfahani)",
				attribution:
					"Ar-Raghib al-Ashfahani (w. 502 H); teks digital dari korpus OpenITI (tahqiq Shafwan al-Dawudi)",
				description: "Makna Qur'ani setiap akar kata, hanya teks utama.",
				license: "CC BY-NC-SA 4.0 (rilis korpus OpenITI)",
			},
			"qac-morphology": {
				title: "Morfologi Quranic Arabic Corpus 0.4",
				attribution: "Kais Dukes dan Quranic Arabic Corpus",
				description:
					"Segmentasi morfologis, akar kata, bentuk dasar (lemma), dan fitur tata bahasa untuk seluruh kata.",
				license:
					"GPL, dengan izin penggunaan dalam aplikasi selama korpus diatribusikan.",
			},
			"noorbayan-syntax": {
				title: "Pohon Sintaksis Quran Lengkap (NoorBayan)",
				attribution:
					"NoorBayan, berbasis Quranic Arabic Corpus Dr. Kais Dukes (rahimahullah), diverifikasi oleh Quranpedia",
				description:
					"Pohon ketergantungan sintaksis dan frasa konstituen lengkap untuk seluruh 6.236 ayat Al-Qur'an dalam 114 surah, yang juga menjadi dasar pencarian relasi dan kuis i'rab.",
				license: "Lisensi MIT.",
			},
			"asbab-muharrar": {
				title: "Al-Muharrar fi Asbab Nuzulil Qur'an",
				attribution:
					"Dr. Khalid bin Sulaiman Al-Muzaini (Markaz Tafsir / Dar Ibnul Jauzi)",
				description:
					"Kajian kritis sanad dan derajat hadis asbabun nuzul dari sembilan kitab induk hadis.",
				license: "Lisensi CC BY 4.0.",
			},
			"canonical-qiraat": {
				title: "Variasi Sepuluh Qira'at Mutawatirah & Maknanya",
				attribution:
					"Pusat Studi Al-Qur'an Tafsir Center, berbasis kitab An-Nasyr karya Ibnul Jazari",
				description:
					"Variasi bacaan 10 Qira'at mutawatir per kata beserta kaidah fonetis dan penjelasan maknanya.",
				license: "Lisensi CC BY 4.0.",
			},
			tanzil: {
				title: "Teks Al-Qur'an Rasm Utsmani Tanzil",
				attribution: "Proyek Tanzil (Tanzil.net)",
				description:
					"Teks Arab Al-Qur'an rasm Utsmani yang diverifikasi ketat dari Proyek Tanzil, tanpa perubahan.",
				license: "Creative Commons BY-ND 3.0.",
			},
			"english-mokhtasar": {
				title: "Al-Mukhtashar fi Tafsir Al-Qur'an (Bahasa Inggris)",
				attribution: "Markaz Tafsir, teks bahasa Inggris via QuranEnc.com",
				description:
					"Terjemahan tafsir ringkas Al-Mukhtashar dalam bahasa Inggris via QuranEnc.com.",
				license:
					"Ketentuan publikasi ulang QuranEnc: teks utuh dan mencantumkan sumber.",
			},
			"tafsir-center": {
				title: "Analisis Linguistik Markaz Tafsir (I'rab & Sharaf)",
				attribution: "Pusat Studi Al-Qur'an Tafsir Center (Markaz Tafsir)",
				description:
					"Deskripsi morfologi klasik (sharaf), i'rab kata per kata, dan makna kata dari basis data Markaz Tafsir, beserta sintaksis kalimat ayat dan maqashid surah.",
				license: "Creative Commons Attribution 4.0 International (CC BY 4.0).",
			},
			"indonesian-mokhtasar": {
				title: "Al-Mukhtashar fi Tafsir Al-Qur'an (Bahasa Indonesia)",
				attribution: "Markaz Tafsir, teks bahasa Indonesia via QuranEnc.com",
				description:
					"Terjemahan tafsir ringkas Al-Mukhtashar dalam bahasa Indonesia via QuranEnc.com, edisi V1.0.0 (23 Januari 2017).",
				license:
					"Ketentuan publikasi ulang QuranEnc: teks utuh, mencantumkan penerbit dan QuranEnc.com, serta menyebutkan edisi V1.0.0.",
			},
			"arabic-mokhtasar": {
				title: "Al-Mukhtashar fi Tafsir Al-Qur'an (Bahasa Arab)",
				attribution:
					"Markaz Tafsir للدراسات القرآنية, teks bahasa Arab via QuranEnc.com",
				description:
					"Teks tafsir ringkas terpercaya berbahasa Arab via QuranEnc.com.",
				license:
					"Ketentuan publikasi ulang QuranEnc: teks asli utuh dan mencantumkan sumber.",
			},
			"saheeh-international": {
				title: "Terjemahan Bahasa Inggris Saheeh International",
				attribution:
					"Saheeh International (Emily Assami, Mary Kennedy, Amatullah Bantley), via QuranEnc.com",
				description:
					"Terjemahan harfiah bahasa Inggris yang selaras dengan sintaksis Arab, ditampilkan pada lapisan makna ayat di samping teks Arab.",
				license:
					"Domain publik / Distribusi pendidikan terbuka dengan atribusi kepada Saheeh International.",
			},
			"indonesian-sabiq": {
				title: "Terjemahan Al-Qur'an Bahasa Indonesia (PT. Sabiq)",
				attribution:
					"PT. Sabiq (di bawah pengawasan Pusat Penerjemahan Rowwad), via QuranEnc.com",
				description:
					"Terjemahan makna Al-Qur'an bahasa Indonesia yang ringkas dan lugas, ditelaah secara berkala.",
				license: "Distribusi terbuka / Ketentuan publikasi ulang QuranEnc.",
			},
			"waqar-mutashabihat": {
				title: "Dataset Mutasyabihat Al-Qur'an (Pasangan Ayat Huffazh)",
				attribution: "Waqar144 (Quran_Mutashabihat_Data)",
				description:
					"Pasangan ayat dengan kemiripan redaksi terkurasi di seluruh 30 juz untuk menjaga ketepatan hafalan Al-Qur'an.",
				license: "CC0 1.0 Universal (Domain Publik).",
			},
			"quranpedia-mutashabihat": {
				title: "Kesamaan Verbal & Kaidah Hafalan Quranpedia",
				attribution: "Quranpedia.net (الموسوعة القرآنية)",
				description:
					"Kaidah hafalan klasik (dhabt) dan penjelasan perbedaan redaksi serta balaghah (tawjih) antarayat yang mirip.",
				license:
					"Bebas digunakan dalam aplikasi dan perangkat riset dengan mencantumkan atribusi.",
			},
		},
	},
};
