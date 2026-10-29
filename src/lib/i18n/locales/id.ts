import { formatNum } from "../format";
import type { Translations } from "../types";

export const id: Translations = {
	common: {
		appNameAr: "عدسات",
		appNameEn: "Lenses",
		searchPlaceholder: "Surah:ayat, atau kata",
		searchAria: "Cari ayat",
		versesCount: (count: number) => `${formatNum(count, "id")} ayat`,
		noVersesMatch: "Tidak ada ayat yang cocok.",
		surahsNav: "Surah",
		examplesNav: "Contoh",
		quizNav: "Kuis",
		rhetoricNav: "Balaghah",
		previous: "Sebelumnya",
		next: "Berikutnya",
		search: "Cari",
		offlineReady: "Tersedia offline",
		savingOffline: (done: number, total: number) =>
			`Menyimpan Al-Qur'an secara offline, ${formatNum(Math.max(done, 1), "id")} dari ${formatNum(total, "id")}.`,
		chapterAndVerse: "Surah dan ayat",
		open: "Buka",
		verse: "Ayat",
		tanzilSource: "Tanzil",
		tafsirCenterSource: "Markaz Tafsir untuk Studi Al-Qur'an",
		corpusSource: "Quranic Arabic Corpus",
	},
	quiz: {
		streakLabel: "beruntun",
		skipButton: "↻ Lewati",
		openReader: (sura: number, verse: number) =>
			`Pembaca ${formatNum(sura, "id")}:${formatNum(verse, "id")} ↗`,
		stepRoleCrumb: "Kedudukan",
		stepCaseCrumb: "I'rab",
		stepSignCrumb: "Tanda",
		stepCheckCrumb: "Periksa",
		targetBadge: "Target",
		headBadge: "Pengampu",
		legendTarget: (wordAr: string) => `Target · ${wordAr}`,
		legendHead: (roleLabel: string, wordAr: string) =>
			`${roleLabel} · ${wordAr}`,
		pickGovernorHint: "Ketuk kata pada ayat untuk memilih pengampu",
		step1Eyebrow: "LANGKAH 1 DARI 4 · KEDUDUKAN SINTAKSIS",
		step1Question: (wordAr: string) =>
			`Apa kedudukan i'rab (موقع إعرابي) dari kata ${wordAr}?`,
		step2Eyebrow: (govLabel: string) =>
			`LANGKAH 2 DARI 4 · PILIH ${govLabel.toUpperCase()}`,
		step2Question: (govAr: string, wordAr: string) =>
			`Kata mana pada ayat ini yang menjadi ${govAr} bagi ${wordAr}?`,
		step2Hint: "Pilih kata di bawah atau ketuk langsung pada teks ayat di atas",
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
		revealButton: "Lihat Kunci",
		submitButton: "Periksa & Tampilkan I'rab Klasik",
		nextButton: "Soal Berikutnya →",
		exactMatchEyebrow: "TEPAT SEKALI · أحسنت",
		reviewEyebrow: "TINJAUAN I'RAB · التصويب",
		classicalHeading: (wordAr: string) => `I'rab Klasik untuk ${wordAr}`,
		notSet: "Belum dipilih",
		incompleteAlert: "Ketuk langkah yang belum lengkap di atas:",
	},
	settings: {
		title: "Pengaturan",
		buttonAria: "Pengaturan",
		languageSection: "Bahasa",
		themeSection: "Tampilan",
		themeLight: "Terang",
		themeDark: "Gelap",
		quizSection: "Kuis",
		quizDiacriticsLabel: "Sembunyikan harakat di kuis",
		quizDiacriticsDescription:
			"Tampilkan ayat Al-Qur'an tanpa harakat untuk tantangan yang lebih sulit.",
		sourcesLink: "Sumber Data",
		sourcesDescription: "Jelajahi sumber data korpus dan lisensi",
		installApp: "Pasang Aplikasi",
		closeAria: "Tutup pengaturan",
	},
	verse: {
		meccan: "Makkiyah",
		madinan: "Madaniyah",
		verseMeaningTitle: "Makna Ayat",
		verseMeaningSub: "Terjemahan Sabiq & Al-Mukhtasar · QuranEnc",
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
		firstClause: "Sudah di klausa pertama.",
		lastClause: "Sudah di klausa terakhir.",
		clauseNoteContinues: "Klausa ini bersambung ke ayat berikutnya.",
		noTreeTitle: "Belum ada pohon ketergantungan untuk ayat ini.",
		classicalIrabShort: "I'rab",
		surahGoalLabel: "Tujuan Surah",
		revelationOrder: (seq: number) => `Urutan Turun #${formatNum(seq, "id")}`,
		asbabBadge: (count: number) => `Sebab Turun (${formatNum(count, "id")})`,
		asbabDrawerTitle: "Sebab-Sebab Turunnya Ayat (Asbabun Nuzul)",
		nahwTabTitle: "Nahwu & Pohon Sintaksis",
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
		structureBadge: (count: number) =>
			`Struktur Surah (${formatNum(count, "id")})`,
		structureSectionTitle: "Munasabat & Struktur Surah",
		structureEmptyState:
			"Tidak ada struktur komposisi cincin yang tercatat untuk surah ini.",
		structurePivotLabel: "Poros / sumbu tengah",
		structureOpeningHemisphere: "Hemisfer pembuka",
		structureClosingHemisphere: "Hemisfer penutup",
		structureJumpToBlock: "Lompat ke blok ini",
		structureVerseRange: (start: number, end: number) =>
			start === end
				? `ay. ${formatNum(start, "id")}`
				: `ay. ${formatNum(start, "id")}–${formatNum(end, "id")}`,
		structurePairHint:
			"Fokuskan atau arahkan kursor ke panel untuk menyorot pasangan simetrisnya di lipatan.",
		munasabatCardTitle: "Munasabat · مناسبة السور",
		munasabatBridgeBadge: "Jembatan tematik",
		munasabatSuyutiLabel: "al-Suyūṭī",
		munasabatSuyutiWork: "Tanāsuq al-Durar",
		munasabatBiqaiLabel: "al-Biqāʿī",
		munasabatBiqaiWork: "Naẓm al-Durar",
		munasabatJumpNext: (name: string, number: string) =>
			`Lompat ke ${name} (${number}) ↗`,
	},
	sheet: {
		analysisAria: (wordNumber: number) =>
			`Analisis kata ${formatNum(wordNumber, "id")}`,
		closeAria: "Tutup analisis",
		expandAria: "Perluas analisis",
		collapseAria: "Kecilkan analisis",
		corpusMorphology: "Morfologi korpus",
		classicalIrab: "I'rab klasik",
		sarf: "Sharaf",
		wordMeaning: "Arti kata",
		partOfSpeech: "Jenis kata",
		root: "Akar kata",
		lemma: "Bentuk dasar",
		searchThisRoot: "Cari akar kata ini",
		searchThisLemma: "Cari bentuk dasar ini",
		basePatternHint: "Pola dasar فَعَلَ biasanya tidak ditandai.",
		impliedEstimated: "Tersirat (Muqaddar)",
		qiraatTitle: "Sepuluh Qira'at Mutawatirah",
		qiraatIsolation: "Saat Berhenti (Waqaf)",
		qiraatWasl: "Saat Bersambung (Washal)",
		qiraatSemanticNote: "Tafsir Makna & Kebahasaan",
	},
	surahs: {
		countEyebrow: (count: number) => `${formatNum(count, "id")} surah`,
		pageTitle: "Jelajahi Al-Qur'an",
		metaLinksLabel: "Lapisan surah",
		structureLink: "Struktur",
		balaghaLink: "Balaghah",
		balaghaLinkTitle: (count: number) =>
			`${formatNum(count, "id")} analisis retorika di Studio Balaghah`,
	},
	examples: {
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
		wordsFound: (count: number, limit: number) =>
			`${formatNum(count, "id")} kata${count > limit ? ` · menampilkan ${formatNum(limit, "id")}` : ""}`,
		noWordsMatch: "Tidak ada kata yang cocok dengan kombinasi ini.",
		showMore: "Tampilkan lebih banyak",
		chooseCriteriaHint:
			"Pilih akar kata, bentuk dasar, jenis kata, wazan, atau relasi.",
	},
	sources: {
		pageTitle: "Sumber edisi ini dibangun",
		intro:
			"Lenses adalah pembaca untuk analisis yang dipublikasikan secara terbuka. Teks Al-Qur'an bahasa Arab disimpan tanpa perubahan. Lapisan tata bahasa diatribusikan ke sumber aslinya.",
		coverageHeading: "Cakupan Sintaksis",
		coverageBody: (
			words: number,
			syntaxVerses: number,
			partialText: string,
			chStart: number,
			chEnd: number,
		) =>
			chStart && chEnd
				? `Morfologi mencakup seluruh ${formatNum(words, "id")} kata. Pohon sintaksis mencakup ${formatNum(syntaxVerses, "id")} ayat${partialText}. Surah ${formatNum(chStart, "id")}–${formatNum(chEnd, "id")} belum memiliki sintaksis korpus. I'rab dan sharaf klasik dari Markaz Tafsir disertakan untuk setiap kata.`
				: `Morfologi mencakup seluruh ${formatNum(words, "id")} kata. Pohon sintaksis lengkap NoorBayan mencakup seluruh 114 surah (${formatNum(syntaxVerses, "id")} ayat) dengan analisis relasi dependensi dan frasa konstituen lengkap. I'rab dan sharaf klasik dari Markaz Tafsir disertakan untuk setiap kata.`,
		rhetoricCoverageHeading: "Cakupan Studio Retorika (Balaghah)",
		rhetoricCoverageBody: (versesCount: number, surasCount: number) =>
			`Studio Anatomi Retorika mencakup ${formatNum(versesCount, "id")} ayat teranalisis di ${formatNum(surasCount, "id")} surah, meliputi dekonstruksi formula 4 rukun tamsil perumpamaan (Nashir dkk. 2026), elipsis sintaksis dengan taqdir teruji (EEF 2025), serta karya retorika klasik dalam ilmu Ma'ani, Bayan, dan Badi'.`,
		partialSnippet: (syntax: number, total: number, surah: number) =>
			`, termasuk ${formatNum(syntax, "id")} dari ${formatNum(total, "id")} ayat di surah ${formatNum(surah, "id")}`,
		licenseLabel: "Lisensi:",
		kinds: {
			morphology: "Morfologi",
			syntax: "Pohon Sintaksis",
			text: "Teks Al-Qur'an",
			"classical-irab": "I'rab Klasik",
			tafsir: "Tafsir",
			translation: "Terjemahan",
			rhetoric: "Retorika (Balaghah)",
			asbab: "Asbabun Nuzul",
			qiraat: "Qira'at Asyrah",
		},
		items: {
			"qac-morphology": {
				title: "Morfologi Quranic Arabic Corpus 0.4",
				attribution: "Kais Dukes dan Quranic Arabic Corpus",
				description:
					"Segmentasi morfologis, akar kata, bentuk dasar (lemma), dan fitur tata bahasa untuk seluruh kata.",
				license:
					"GPL, dengan izin penggunaan dalam aplikasi selama korpus diatribusikan.",
			},
			"qac-syntax": {
				title: "Graf Dependensi Sintaksis Quranic Arabic Corpus",
				attribution:
					"Kais Dukes, Quranic Arabic Corpus (kaisdukes/quranic-corpus-api)",
				description:
					"Graf dependensi sintaksis dari Quranic Arabic Dependency Treebank.",
				license:
					"Didistribusikan sesuai ketentuan korpus: mencantumkan atribusi ke corpus.quran.com.",
			},
			"noorbayan-syntax": {
				title: "Pohon Sintaksis Quran Lengkap (NoorBayan)",
				attribution:
					"NoorBayan, berbasis Quranic Arabic Corpus Dr. Kais Dukes (rahimahullah), diverifikasi oleh Quranpedia",
				description:
					"Pohon ketergantungan sintaksis dan frasa konstituen lengkap untuk seluruh 6.236 ayat Al-Qur'an dalam 114 surah.",
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
					"Deskripsi morfologi klasik (sharaf) dari basis data Markaz Tafsir, beserta i'rab kata per kata dan sintaksis kalimat ayat.",
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
					"Saheeh International (Emily Assami, Mary Kennedy, Amatullah Bantley), via Tanzil.net dan QuranEnc.com",
				description:
					"Terjemahan harfiah bahasa Inggris yang selaras dengan sintaksis Arab untuk analisis struktural dan retorika.",
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
			"rhetoric-tashbih": {
				title: "Dataset Tamsil & Perumpamaan Al-Qur'an (Tashbih)",
				attribution:
					"Nashir dkk. (2026), 'Arabic Simile Dataset: A Fine-Grained Quranic Metaphor and Simile Corpus' (arXiv:2601.19972)",
				description:
					"Anotasi pakar dekonstruksi formula 4 rukun perumpamaan klasik (musyabbah, adat, musyabbah bihi, wajh syabah) dan tamsil majemuk.",
				license: "Akses Terbuka Akademik (arXiv:2601.19972).",
			},
			"rhetoric-hadhf": {
				title: "Dataset Retorika Elipsis & Peringkasan (Hadhf & I'jaz)",
				attribution:
					"Hishomudin Ahmad & Norfarhana Ahmad Ghafar (2026) / Elliptical Eloquence Framework (EEF 2025), bersumber dari Dalail al-I'jaz (Al-Jurjani) dan kitab-kitab i'rab klasik",
				description:
					"Katalog elipsis sintaksis dan penghilangan struktur (maf'ul, mudhaf, jawab syarat law, ujaran) beserta rekonstruksi taqdir ilmiah.",
				license: "Distribusi Pendidikan & Riset Terbuka.",
			},
			"classical-balagha": {
				title: "Mahakarya Balaghah Klasik Al-Qur'an",
				attribution:
					"Kitab Rujukan Klasik: Al-Jurjani (Dalail al-I'jaz), Az-Zamakhsyari (Al-Kashshaf), As-Sakkaki (Miftah al-'Ulum), As-Suyuthi (Al-Itqan)",
				description:
					"Bedah anatomi perangkat retorika utama Al-Qur'an dalam tiga cabang ilmu: Ilmu Ma'ani (iltifat, qashr), Ilmu Bayan (isti'arah, kinayah), dan Ilmu Badi' (jinas, thibaq, muqabalah).",
				license: "Domain Publik / Warisan Khazanah Klasik.",
			},
		},
	},
};
