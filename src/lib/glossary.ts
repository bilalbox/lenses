import type { Locale } from "./i18n/types";

export interface Gloss {
	name: string;
	about: string;
}

interface RawGloss {
	name: string;
	about: Record<Locale, string>;
}

export const POS: Record<string, RawGloss> = {
	N: {
		name: "اسم",
		about: {
			en: "A name of a person, thing, or idea. Nouns take case and can be definite or indefinite.",
			ar: "اسم يدل على ذات أو معنى مجرد، يقبل علامات الإعراب والتنوين وأل.",
			id: "Kata benda (isim) yang merujuk pada nama, benda, atau konsep abstrak.",
		},
	},
	PN: {
		name: "اسم علم",
		about: {
			en: "A specific name, such as Ādam. Many proper nouns do not take tanwīn.",
			ar: "اسم يعين مسماه تعييناً مطلقاً مثل آدم، وكثير منها ممنوع من الصرف.",
			id: "Nama diri khusus (isim 'alam) seperti Adam.",
		},
	},
	PRON: {
		name: "ضمير",
		about: {
			en: "A word that stands in for a noun: an attached suffix, an independent pronoun, or an implied one.",
			ar: "ما دل على متكلم أو مخاطب أو غائب: متصلاً كان أو منفصلاً أو مستتراً.",
			id: "Kata ganti (dhamir) baik bersambung, terpisah, maupun tersirat.",
		},
	},
	DEM: {
		name: "اسم إشارة",
		about: {
			en: "A pointing word such as hādhā or hāʾulāʾi, ‘this’ or ‘these’.",
			ar: "اسم يدل على معين بواسطة إشارة حسية أو معنوية مثل هذا وهؤلاء.",
			id: "Kata tunjuk (isim isyarah) seperti hadza (ini) atau ha'ula'i (mereka ini).",
		},
	},
	REL: {
		name: "اسم موصول",
		about: {
			en: "A word such as alladhī that introduces a clause describing a noun.",
			ar: "اسم يفتقر إلى صلة وعائد لتتم دلالته مثل الذي والتي.",
			id: "Kata sambung relatif (isim maushul) seperti alladzi (yang).",
		},
	},
	ADJ: {
		name: "صفة",
		about: {
			en: "Adjective: a describing word that follows the noun and matches it in case, gender, number, and definiteness.",
			ar: "تابع يوضح متبوعه أو يخصصه ويطابقه في الإعراب والنوع والعدد والتعريف.",
			id: "Kata sifat (na'at/shifah) yang menerangkan kata benda sebelumnya.",
		},
	},
	V: {
		name: "فعل",
		about: {
			en: "Verb: an action or state, conjugated for person, gender, and number.",
			ar: "كلمة دلت على حدث مقترن بزمن محدد: ماضٍ أو مضارع أو أمر.",
			id: "Kata kerja (fi'il) yang terikat waktu dan pelaku.",
		},
	},
	P: {
		name: "حرف جر",
		about: {
			en: "Preposition: a particle such as bi-, fī, or ʿalā that puts the following noun in the genitive.",
			ar: "حرف يربط بين الكلمات ويجر الاسم الذي يليه مثل في وعلى والباء.",
			id: "Kata depan (huruf jar) seperti fi, 'ala, atau bi yang memajrurkan isim sesudahnya.",
		},
	},
	INTG: {
		name: "استفهام",
		about: {
			en: "A question word, such as hal, mā, or the interrogative alif.",
			ar: "أداة تدل على طلب الفهم والاستعلام مثل هل والهمزة.",
			id: "Partikel tanya (istifham) seperti hal atau alif istifham.",
		},
	},
	VOC: {
		name: "نداء",
		about: {
			en: "A particle used to call someone, typically yā.",
			ar: "حرف يطلب به إقبال المنادى مثل يا وأي.",
			id: "Partikel seruan atau panggilan (nida') seperti ya.",
		},
	},
	NEG: {
		name: "نفي",
		about: {
			en: "A particle that denies, such as lā, mā, lam, or lan.",
			ar: "حرف يفيد إنكار وقوع الشيء مثل لا وما ولم ولن.",
			id: "Partikel penafian atau penolakan (nafi) seperti la, ma, lam, atau lan.",
		},
	},
	EMPH: {
		name: "توكيد",
		about: {
			en: "A particle or ending that strengthens the statement, including the emphatic nūn and la-.",
			ar: "حرف يؤكد الحكم ويثبته مثل لام التوكيد ونون التوكيد الثقيلة والخفيفة.",
			id: "Partikel penegas atau penguat makna (taukid) seperti lam taukid.",
		},
	},
	PRP: {
		name: "تعليل",
		about: {
			en: "A particle introducing a purpose, often li- meaning ‘in order to’.",
			ar: "حرف يفيد بيان السبب أو الغاية مثل لام التعليل.",
			id: "Partikel alasan atau tujuan (ta'lil) seperti lam ta'lil (agar/untuk).",
		},
	},
	IMPV: {
		name: "لام الأمر",
		about: {
			en: "The lām that turns an imperfect verb into a command, the lām of command.",
			ar: "لام تجزم الفعل المضارع وتفيد طلب الفعل.",
			id: "Lam amr yang mengubah kata kerja mudhari' menjadi perintah.",
		},
	},
	FUT: {
		name: "استقبال",
		about: {
			en: "The prefix sa- or the particle sawfa, marking the future.",
			ar: "حرف يخصص المضارع للزمن المستقبل مثل السين وسوف.",
			id: "Partikel masa depan (istiqbal) seperti sa- atau saufa (akan).",
		},
	},
	CONJ: {
		name: "عطف",
		about: {
			en: "A joining word, most often wa- or fa-, linking words or clauses.",
			ar: "حرف يربط بين كلمتين أو جملتين مثل الواو والفاء وثم.",
			id: "Kata hubung (athaf) seperti wa (dan) atau fa (lalu).",
		},
	},
	DET: {
		name: "تعريف",
		about: {
			en: "The definite article al-. It defines the noun.",
			ar: "أداة التعريف (أل) التي تفيد تعيين الاسم.",
			id: "Kata sandang definit alif-lam (al-).",
		},
	},
	INL: {
		name: "حروف مقطعة",
		about: {
			en: "Disconnected letters at the start of some surahs, such as alif lām mīm.",
			ar: "الحروف المقطعة في فواتح السور مثل ألم وطه وحم.",
			id: "Huruf muqatha'ah di pembuka surah seperti alif lam mim.",
		},
	},
	T: {
		name: "ظرف زمان",
		about: {
			en: "A noun of time used adverbially, such as yawma in ‘the day when’.",
			ar: "اسم منصوب يبين زمان وقوع الفعل.",
			id: "Keterangan waktu (zharaf zaman) seperti yauma (pada hari).",
		},
	},
	LOC: {
		name: "ظرف مكان",
		about: {
			en: "A noun of place used adverbially.",
			ar: "اسم منصوب يبين مكان وقوع الفعل.",
			id: "Keterangan tempat (zharaf makan).",
		},
	},
	ACC: {
		name: "حرف نصب",
		about: {
			en: "A particle that puts the following noun in the accusative, such as inna or anna.",
			ar: "حرف يدخل على المبتدأ فينصبه مثل إن وأخواتها.",
			id: "Partikel penashab (seperti inna dan saudarinya).",
		},
	},
	COND: {
		name: "شرط",
		about: {
			en: "A particle that sets a condition, such as in or idhā.",
			ar: "أداة تربط بين جملتي الشرط والجواب مثل إن وإذا.",
			id: "Partikel syarat (seperti in atau idza).",
		},
	},
	SUB: {
		name: "مصدري",
		about: {
			en: "A particle that starts a subordinate clause, such as an or alladhī.",
			ar: "حرف يؤول مع ما بعده بمصدر صريح مثل أنْ وأنَّ.",
			id: "Partikel pembentuk masdar (harf mashdari) seperti an.",
		},
	},
	RES: {
		name: "حصر",
		about: {
			en: "A particle of restriction or exception, classically ḥaṣr, often illā.",
			ar: "أداة تفيد قصر الحكم وحصره مثل إلا وإنما.",
			id: "Partikel pembatas (hashr/qashr) seperti illa atau innama.",
		},
	},
	EXP: {
		name: "استثناء",
		about: {
			en: "A particle of exception.",
			ar: "أداة تفيد إخراج ما بعدها من حكم ما قبلها مثل إلا وغير.",
			id: "Partikel pengecualian (istitsna') seperti illa.",
		},
	},
	AVR: {
		name: "ردع",
		about: {
			en: "A particle that turns the listener away from something, such as kallā.",
			ar: "حرف يفيد الزجر والردع مثل كلا.",
			id: "Partikel celaan atau peringatan keras (rad'un) seperti kalla.",
		},
	},
	CERT: {
		name: "تحقيق",
		about: {
			en: "A particle that presents the statement as certain, such as qad before a perfect verb.",
			ar: "حرف يفيد التوكيد وتحقق الوقوع مثل قد مع الفعل الماضي.",
			id: "Partikel kepastian (tahqiq) seperti qad sebelum fi'il madhi.",
		},
	},
	RET: {
		name: "إضراب",
		about: {
			en: "A particle that breaks off and corrects, the iḍrāb of bal.",
			ar: "حرف يفيد العدول عما قبله والإضراب عنه مثل بل.",
			id: "Partikel ralat atau peralihan (idhrab) seperti bal (bahkan).",
		},
	},
	PREV: {
		name: "كافة",
		about: {
			en: "The preventive particle, classically kāffa, which stops the word before it from governing.",
			ar: "ما الكافة التي تكف ما قبلها عن العمل مثل إنما.",
			id: "Partikel pencegah amal (kaffah) seperti ma pada innama.",
		},
	},
	ANS: {
		name: "جواب",
		about: {
			en: "A particle that answers a question or a condition.",
			ar: "حرف يقع جواباً لسؤال أو تصديقاً لكلام مثل نعم وبلى.",
			id: "Partikel jawaban (jawab) seperti na'am atau bala.",
		},
	},
	INC: {
		name: "ابتداء",
		about: {
			en: "A particle that opens a new statement.",
			ar: "حرف يدخل في أول الكلام للتوكيد والابتداء.",
			id: "Partikel permulaan kalimat (ibtida').",
		},
	},
	SUR: {
		name: "مفاجأة",
		about: {
			en: "A particle of suddenness, such as idhā in the sense of ‘lo’.",
			ar: "أداة تدل على وقوع الأمر فجأة ودون ترقب مثل إذا الفجائية.",
			id: "Partikel kejutan tak terduga (mufaja'ah) seperti idza al-fuja'iyyah.",
		},
	},
	SUP: {
		name: "زيادة",
		about: {
			en: "A particle that adds a further, loosely attached phrase.",
			ar: "صلة وزيادة في المبنى لإفادة التوكيد في المعنى.",
			id: "Huruf tambahan penguat makna (ziyadah).",
		},
	},
	EXH: {
		name: "تحضيض",
		about: {
			en: "A particle that urges, such as lawlā in the sense of ‘why not’.",
			ar: "حرف يفيد الحث والطلب بإلحاح مثل لولا ولوما.",
			id: "Partikel anjuran kuat (tahdhidh) seperti laula.",
		},
	},
	IMPN: {
		name: "اسم فعل",
		about: {
			en: "A noun with the force of a command.",
			ar: "كلمة تدل على معنى الفعل وتعمل عمله ولا تقبل علاماته مثل هيهات وصه.",
			id: "Isim fi'il (kata benda dengan makna kata kerja).",
		},
	},
	EXL: {
		name: "تفسير",
		about: {
			en: "A particle that explains what came before.",
			ar: "حرف يفيد إيضاح ما قبله وتفسيره مثل أيْ وأنْ التفسيرية.",
			id: "Partikel penjelas (tafsir) seperti ay.",
		},
	},
	EQ: {
		name: "تسوية",
		about: {
			en: "A particle that presents two options as equal, the hamza of taswiyah.",
			ar: "همزة التسوية الواقعة بعد سواء.",
			id: "Hamzah taswiyah (menunjukkan kesetaraan pilihan).",
		},
	},
	REM: {
		name: "استئناف",
		about: {
			en: "Wa- or fa- that starts a new sentence rather than joining inside one.",
			ar: "واو أو فاء تبدأ كلاماً جديداً منقطعاً عما قبله إعراباً.",
			id: "Wawu atau fa' isti'naf (memulai kalimat baru secara gramatikal).",
		},
	},
	CAUS: {
		name: "سببية",
		about: {
			en: "A particle that gives a reason.",
			ar: "فاء أو حرف يدل على أن ما بعده مسبب عما قبله.",
			id: "Partikel kausalitas/sebab (sababiyyah).",
		},
	},
	AMD: {
		name: "استدراك",
		about: {
			en: "A particle that amends or restarts the sentence.",
			ar: "حرف يفيد رفع ما يتوهم ثبوته مثل لكنَّ.",
			id: "Partikel sanggahan atau perbaikan (istidrak) seperti lakinna.",
		},
	},
	PRO: {
		name: "نهي",
		about: {
			en: "The negative command, lā with a jussive verb.",
			ar: "لا الناهية الجازمة التي تفيد طلب الكف عن الفعل.",
			id: "Partikel larangan (nahi) seperti la nahi.",
		},
	},
	CIRC: {
		name: "حال",
		about: {
			en: "Wa- introducing a ḥāl, describing circumstance.",
			ar: "واو الحال التي تدخل على جملة تبين هيئة صاحبها.",
			id: "Wawu haliyyah (menerangkan kondisi/keadaan saat perbuatan terjadi).",
		},
	},
	RSLT: {
		name: "نتيجة",
		about: {
			en: "A particle that introduces the result.",
			ar: "فاء الجزاء الرابطة لجواب الشرط.",
			id: "Partikel akibat atau balasan (natijah/jaza').",
		},
	},
	INT: {
		name: "تفسير",
		about: {
			en: "A particle of interpretation explaining an earlier word.",
			ar: "حرف يفسر ما قبله.",
			id: "Partikel penafsir makna kata sebelumnya.",
		},
	},
	COM: {
		name: "معية",
		about: {
			en: "Wa- meaning ‘along with’.",
			ar: "واو المعية التي تدل على المصاحبة.",
			id: "Wawu ma'iyyah (bermakna 'bersama dengan').",
		},
	},
};

export const RELATIONS: Record<string, RawGloss> = {
	subj: {
		name: "فاعل",
		about: {
			en: "Subject: the doer of the verb, the fāʿil. Usually nominative.",
			ar: "اسم مرفوع يدل على من قام بالفعل أو اتصف به.",
			id: "Pelaku perbuatan (fa'il), berkedudukan marfu'.",
		},
	},
	obj: {
		name: "مفعول به",
		about: {
			en: "Object: the thing the verb acts on, the mafʿūl bihi, usually accusative.",
			ar: "اسم منصوب يدل على ما وقع عليه فعل الفاعل.",
			id: "Objek penderita (maf'ul bih), berkedudukan manshub.",
		},
	},
	pass: {
		name: "نائب فاعل",
		about: {
			en: "Promoted to subject when the verb is passive. The nāʾib fāʿil.",
			ar: "اسم مرفوع يحل محل الفاعل بعد حذفه وبناء الفعل للمجهول.",
			id: "Pengganti pelaku dalam kalimat pasif (na'ibul fa'il), marfu'.",
		},
	},
	pred: {
		name: "خبر",
		about: {
			en: "Predicate: what is said about the subject, the khabar.",
			ar: "الجزء المتمم لمعنى المبتدأ في الجملة الاسمية.",
			id: "Predikat kalimat nominal (khabar).",
		},
	},
	subjx: {
		name: "مبتدأ",
		about: {
			en: "The subject of a nominal sentence or of inna and its sisters.",
			ar: "الاسم المجرد عن العوامل اللفظية للإسناد، أو اسم إن وأخواتها.",
			id: "Subjek kalimat nominal (mubtada') atau isim inna.",
		},
	},
	predx: {
		name: "خبر",
		about: {
			en: "The predicate of a nominal sentence or of kāna and its sisters.",
			ar: "خبر المبتدأ أو خبر كان وأخواتها المنصوب.",
			id: "Predikat kalimat nominal atau khabar kana.",
		},
	},
	gen: {
		name: "مجرور",
		about: {
			en: "The noun governed by a preposition, in the genitive case.",
			ar: "اسم يقع بعد حرف الجر ويحمل علامة الجر.",
			id: "Isim majrur setelah huruf jar.",
		},
	},
	poss: {
		name: "مضاف إليه",
		about: {
			en: "The second noun of an iḍāfa, the possessed or specifying noun.",
			ar: "اسم مجرور ينسب إليه اسم سابق لتعريفه أو تخصيصه.",
			id: "Kata kedua dalam frasa kepemilikan/idhafah (mudhaf ilaih).",
		},
	},
	adj: {
		name: "نعت",
		about: {
			en: "A follower that describes the head, the naʿt or ṣifa.",
			ar: "تابع يوضح متبوعه أو يخصصه ويطابقه إعراباً.",
			id: "Kata sifat (na'at) yang menerangkan kata benda sebelumnya.",
		},
	},
	app: {
		name: "بدل",
		about: {
			en: "A noun that clarifies or replaces another, the badal.",
			ar: "تابع ممهد له بذكر اسم قبله يصح أن يحل محله.",
			id: "Badal (kata pengganti/penjelas yang mengikuti kata sebelumnya).",
		},
	},
	emph: {
		name: "توكيد",
		about: {
			en: "A follower that reinforces the head, such as kull or nafs.",
			ar: "تابع يرفع احتمال السهو أو التجوز عن متبوعه.",
			id: "Penguat (taukid) seperti kulla atau nafs.",
		},
	},
	conj: {
		name: "معطوف",
		about: {
			en: "A word or clause joined to a previous one by wa- or fa-.",
			ar: "تابع يربط بينه وبين متبوعه أحد حروف العطف.",
			id: "Kata atau klausa yang disambungkan oleh huruf athaf (ma'thuf).",
		},
	},
	link: {
		name: "متعلق",
		about: {
			en: "Where a prepositional phrase belongs, linked to a verb or participle.",
			ar: "تعلق الجار والمجرور أو الظرف بالفعل أو شبه الفعل لتتم الفائدة.",
			id: "Keterikatan frasa preposisi (muta'alliq) dengan kata kerja atau semisalnya.",
		},
	},
	sub: {
		name: "صلة",
		about: {
			en: "A clause that depends on a head, often the ṣila of a relative pronoun.",
			ar: "جملة تذكر بعد الاسم الموصول لتتم دلالته لا محل لها من الإعراب.",
			id: "Klausa penjelas isim maushul (shilat al-maushul).",
		},
	},
	circ: {
		name: "حال",
		about: {
			en: "A word or clause describing the circumstance of the action.",
			ar: "وصف فضلة منصوب يبين هيئة صاحبه عند صدور الفعل.",
			id: "Hal (keterangan kondisi atau keadaan pelaku/objek saat kejadian).",
		},
	},
	spec: {
		name: "تمييز",
		about: {
			en: "A noun that clarifies an ambiguous idea, usually accusative.",
			ar: "اسم منصوب يفسر ما انبهم من الذوات أو النسب.",
			id: "Tamyiz (penjelas kata yang masih samar atau ambigu).",
		},
	},
	cog: {
		name: "مفعول مطلق",
		about: {
			en: "A verbal noun from the same root that emphasizes the verb.",
			ar: "مصدر منصوب يذكر لتأكيد عامله أو بيان نوعه أو عدده.",
			id: "Maf'ul muthlaq (masdar penegas atau penjelas kata kerja).",
		},
	},
	prp: {
		name: "مفعول له",
		about: {
			en: "The reason for the action, the mafʿūl li-ajlih.",
			ar: "مصدر قلبي منصوب يذكر لبيان علة وقوع الفعل وسببه.",
			id: "Maf'ul li-ajlih (alasan atau motif dilakukannya perbuatan).",
		},
	},
	com: {
		name: "مفعول معه",
		about: {
			en: "Something the action is done along with, following wāw al-maʿiyyah.",
			ar: "اسم منصوب يذكر بعد واو المعية لبيان ما فُعل الفعل بمصاحبته.",
			id: "Maf'ul ma'ah (sesuatu yang menyertai perbuatan, setelah wawu ma'iyyah).",
		},
	},
	voc: {
		name: "منادى",
		about: {
			en: "The person or thing being called, the munādā.",
			ar: "اسم يقع بعد حرف النداء طلباً لإقباله.",
			id: "Munada (pihak yang dipanggil atau diseru).",
		},
	},
	exp: {
		name: "مستثنى",
		about: {
			en: "The thing excepted, the mustathnā.",
			ar: "اسم يذكر بعد أداة الاستثناء مخالفاً لما قبلها في الحكم.",
			id: "Mustatsna (hal yang dikecualikan setelah huruf istitsna').",
		},
	},
	cond: {
		name: "شرط",
		about: {
			en: "The protasis, the clause setting the condition.",
			ar: "جملة فعل الشرط التي يعلق عليها حدوث الجواب.",
			id: "Klausa syarat (syarth).",
		},
	},
	rslt: {
		name: "جواب",
		about: {
			en: "The apodosis, the clause resulting from the condition.",
			ar: "جملة جواب الشرط والجزاء.",
			id: "Klausa jawaban atau konsekuensi syarat (jawab/jaza').",
		},
	},
	imrs: {
		name: "جواب الطلب",
		about: {
			en: "A clause that answers an imperative.",
			ar: "فعل مضارع مجزوم يقع في جواب أمر أو نهي.",
			id: "Jawaban dari kalimat perintah/larangan (jawabuth thalab).",
		},
	},
	neg: {
		name: "نفي",
		about: {
			en: "The negative particle governing this word or clause.",
			ar: "أداة النفي الداخلة على هذه الكلمة أو الجملة.",
			id: "Partikel penafi yang mengatur kata/klausa ini.",
		},
	},
	intg: {
		name: "استفهام",
		about: {
			en: "The question particle governing this clause.",
			ar: "أداة الاستفهام المتصدرة للجملة.",
			id: "Partikel tanya yang mengepalai klausa ini.",
		},
	},
	fut: {
		name: "استقبال",
		about: {
			en: "The future particle attached to this verb.",
			ar: "حرف استقبال (السين أو سوف).",
			id: "Partikel masa depan yang melekat pada kata kerja ini.",
		},
	},
	cert: {
		name: "تحقيق",
		about: {
			en: "A particle of certainty governing this verb.",
			ar: "حرف تحقيق (قد) الدال على ثبوت الفعل.",
			id: "Partikel kepastian (qad) penegas fi'il.",
		},
	},
	pro: {
		name: "نهي",
		about: {
			en: "The prohibitive particle governing this verb.",
			ar: "لا الناهية الجازمة للفعل.",
			id: "Partikel larangan yang menjazmkan fi'il.",
		},
	},
	impv: {
		name: "أمر",
		about: {
			en: "The command particle governing this verb.",
			ar: "لام الأمر الجازمة للمضارع.",
			id: "Partikel perintah yang menjazmkan mudhari'.",
		},
	},
	res: {
		name: "حصر",
		about: {
			en: "A particle that restricts the statement, often illā.",
			ar: "أداة حصر وقصر المعنى.",
			id: "Partikel pembatas arti (hashr).",
		},
	},
	sur: {
		name: "مفاجأة",
		about: {
			en: "A particle of suddenness governing this clause.",
			ar: "إذا الفجائية الدالة على المباغتة.",
			id: "Partikel penunjuk peristiwa mendadak.",
		},
	},
	ret: {
		name: "إضراب",
		about: {
			en: "A particle that breaks off from the previous statement.",
			ar: "حرف إضراب (بل) الدال على العدول.",
			id: "Partikel ralat atau peralihan pembicaraan.",
		},
	},
	exl: {
		name: "تفسير",
		about: {
			en: "A phrase that explains the head.",
			ar: "جملة تفسيرية توضح ما قبلها.",
			id: "Frasa penjelas yang menguraikan maksud sebelumnya.",
		},
	},
	prev: {
		name: "كافة",
		about: {
			en: "A particle that stops the previous word from governing.",
			ar: "ما الكافة المانعة للعمل.",
			id: "Partikel pencegah pengamalan i'rab.",
		},
	},
	avr: {
		name: "ردع",
		about: {
			en: "A particle that wards off what was just said.",
			ar: "حرف زجر وردع.",
			id: "Partikel celaan dan peringatan keras.",
		},
	},
	inc: {
		name: "ابتداء",
		about: {
			en: "A particle that opens this statement.",
			ar: "حرف ابتداء وتوكيد.",
			id: "Partikel permulaan penegas.",
		},
	},
	exh: {
		name: "تحضيض",
		about: {
			en: "A particle that urges this action.",
			ar: "حرف حث وتحضيض.",
			id: "Partikel ajakan bersemangat.",
		},
	},
	eq: {
		name: "تسوية",
		about: {
			en: "A particle that sets two options side by side.",
			ar: "همزة التسوية الدالة على استواء الأمرين.",
			id: "Hamzah taswiyah.",
		},
	},
	caus: {
		name: "سببية",
		about: {
			en: "A clause or phrase that gives the reason.",
			ar: "فاء السببية أو حرف دال على العلة.",
			id: "Frasa atau klausa penjelas sebab-akibat.",
		},
	},
	amd: {
		name: "استدراك",
		about: {
			en: "A phrase that amends the previous one.",
			ar: "حرف أو جملة استدراك ترفع التوهم.",
			id: "Frasa perbaikan/sanggahan.",
		},
	},
	sup: {
		name: "زيادة",
		about: {
			en: "An added phrase, loosely attached to the head.",
			ar: "صلة وزيادة لفظية لإفادة التوكيد.",
			id: "Frasa tambahan untuk penguatan makna.",
		},
	},
	int: {
		name: "تفسير",
		about: {
			en: "A phrase that interprets the head.",
			ar: "تفسير وتوضيح للكلمة السابقة.",
			id: "Frasa penafsir makna sebelumnya.",
		},
	},
	cpnd: {
		name: "مركب",
		about: {
			en: "Two words treated as one compound.",
			ar: "تركيب كلمتين بمثابة كلمة واحدة.",
			id: "Dua kata yang tersusun menjadi satu kata majemuk.",
		},
	},
	ans: {
		name: "جواب",
		about: {
			en: "The answer to a question or a condition.",
			ar: "حرف أو جملة واقعة جواباً.",
			id: "Jawaban atas pertanyaan atau syarat.",
		},
	},
};

export const PHRASES: Record<string, RawGloss> = {
	S: {
		name: "جملة",
		about: {
			en: "A complete sentence span.",
			ar: "جملة تامة المعنى.",
			id: "Kalimat sempurna.",
		},
	},
	NS: {
		name: "جملة اسمية",
		about: {
			en: "A sentence that begins with a noun, having a subject and predicate.",
			ar: "جملة تبدأ باسم وتتألف من مبتدأ وخبر.",
			id: "Kalimat nominal (jumlah ismiyyah) yang tersusun dari mubtada' dan khabar.",
		},
	},
	VS: {
		name: "جملة فعلية",
		about: {
			en: "A sentence built around a verb and its subject.",
			ar: "جملة تبدأ بفعل وتتألف من فعل وفاعل.",
			id: "Kalimat verbal (jumlah fi'liyyah) yang dibangun dari fi'il dan fa'il.",
		},
	},
	CS: {
		name: "جملة شرطية",
		about: {
			en: "A condition together with its result.",
			ar: "جملة تتألف من أداة شرط وفعل شرط وجواب شرط.",
			id: "Kalimat kondisional (jumlah syarthiyyah) beserta jawabannya.",
		},
	},
	PP: {
		name: "جار ومجرور",
		about: {
			en: "A preposition and the noun it governs.",
			ar: "شبه جملة من حرف جر واسم مجرور.",
			id: "Frasa preposisi (jar wa majrur).",
		},
	},
	SC: {
		name: "صلة",
		about: {
			en: "A clause that depends on something outside itself.",
			ar: "صلة موصول توضح الاسم الموصول.",
			id: "Klausa anak penjelas isim maushul.",
		},
	},
};

export const FORMS: Record<string, RawGloss> = {
	I: {
		name: "فَعَلَ",
		about: {
			en: "The base verb pattern, faʿala.",
			ar: "الفعل الثلاثي المجرد.",
			id: "Bentuk dasar kata kerja triliteral (fa'ala).",
		},
	},
	II: {
		name: "فَعَّلَ",
		about: {
			en: "Faʿʿala. Often intensive or causative.",
			ar: "مزيد بحرف مضعف العين، يفيد التكثير أو التعدية.",
			id: "Bentuk II (fa''ala), sering bermakna intensif atau transitif.",
		},
	},
	III: {
		name: "فَاعَلَ",
		about: {
			en: "Fāʿala. Often mutual action or toward someone.",
			ar: "مزيد بألف بعد الفاء، يفيد المشاركة.",
			id: "Bentuk III (fa'ala), sering bermakna saling/resiprokal.",
		},
	},
	IV: {
		name: "أَفْعَلَ",
		about: {
			en: "Afʿala. Often causative with prefixed hamza.",
			ar: "مزيد بهمز في أوله، يفيد التعدية غالباً.",
			id: "Bentuk IV (af'ala), sering bermakna kausatif/transitif.",
		},
	},
	V: {
		name: "تَفَعَّلَ",
		about: {
			en: "Tafaʿʿala. Often reflexive of form II.",
			ar: "مزيد بالتاء والتضعيف، يفيد التكلف والمطاوعة.",
			id: "Bentuk V (tafa''ala), bentuk refleksif dari pola II.",
		},
	},
	VI: {
		name: "تَفَاعَلَ",
		about: {
			en: "Tafāʿala. Often mutual or reflexive of form III.",
			ar: "مزيد بالتاء والألف، يفيد التشارك والتظاهر.",
			id: "Bentuk VI (tafa'ala), saling atau pura-pura.",
		},
	},
	VII: {
		name: "انْفَعَلَ",
		about: {
			en: "Infaʿala. Often passive or intransitive.",
			ar: "مزيد بالألف والنون، يفيد مطاوعة الثلاثي المتعدي.",
			id: "Bentuk VII (infa'ala), sering bermakna pasif atau intransitif.",
		},
	},
	VIII: {
		name: "افْتَعَلَ",
		about: {
			en: "Iftaʿala. Middle or reflexive with infixed tāʾ.",
			ar: "مزيد بالألف والتاء، يفيد الاكتساب والاجتهاد.",
			id: "Bentuk VIII (ifta'ala), sering bermakna refleksif atau usaha sungguh-sungguh.",
		},
	},
	IX: {
		name: "افْعَلَّ",
		about: {
			en: "Ifʿalla. Mostly colors and physical defects.",
			ar: "مزيد بالألف وتضعيف اللام، في الألوان والعيوب.",
			id: "Bentuk IX (if'alla), umumnya untuk warna dan sifat fisik.",
		},
	},
	X: {
		name: "اسْتَفْعَلَ",
		about: {
			en: "Istafʿala. Often seeking or requesting.",
			ar: "مزيد بالسين والتاء، يفيد طلب الفعل أو الصيرورة.",
			id: "Bentuk X (istaf'ala), sering bermakna memohon/mencari atau menganggap.",
		},
	},
	XI: {
		name: "افْعَالَّ",
		about: {
			en: "Ifʿālla. Rare intensive states.",
			ar: "مزيد للمبالغة في الألوان والعيوب.",
			id: "Bentuk XI (if'alla), intensitas tinggi (jarang).",
		},
	},
	XII: {
		name: "افْعَوْعَلَ",
		about: {
			en: "Ifʿawʿala. Rare.",
			ar: "مزيد للمبالغة الشديدة.",
			id: "Bentuk XII (if'au'ala), pola jarang untuk penegasan ekstrem.",
		},
	},
};

const ASPECT: Record<string, RawGloss> = {
	PERF: {
		name: "ماض",
		about: {
			en: "The māḍī. Action presented as completed.",
			ar: "فعل ماضٍ يدل على حدث تم وانقضى قبل زمن التكلم.",
			id: "Fi'il madhi (kata kerja lampau/selesai).",
		},
	},
	IMPF: {
		name: "مضارع",
		about: {
			en: "The muḍāriʿ. Action ongoing, present, or future.",
			ar: "فعل مضارع يدل على حدث يقع في الحال أو الاستقبال.",
			id: "Fi'il mudhari' (kata kerja sekarang atau masa depan).",
		},
	},
	IMPV: {
		name: "أمر",
		about: {
			en: "The amr. A direct command.",
			ar: "فعل أمر يدل على طلب حدوث الفعل في المستقبل.",
			id: "Fi'il amr (kata kerja perintah).",
		},
	},
};

const VOICE: Record<string, RawGloss> = {
	ACT: {
		name: "معلوم",
		about: {
			en: "Active voice: the doer is the grammatical subject.",
			ar: "مبني للمعلوم، فاعله مذكور في الكلام.",
			id: "Bentuk aktif (ma'lum): pelaku disebutkan sebagai subjek.",
		},
	},
	PASS: {
		name: "مجهول",
		about: {
			en: "Passive voice: the old object is promoted to subject.",
			ar: "مبني للمجهول (لما لم يسم فاعله)، ونائب الفاعل يحل محله.",
			id: "Bentuk pasif (majhul): objek dipromosikan menjadi na'ibul fa'il.",
		},
	},
};

const MOOD: Record<string, RawGloss> = {
	IND: {
		name: "مرفوع",
		about: {
			en: "Indicative mood of the imperfect (marfūʿ).",
			ar: "المضارع المرفوع لتجرده عن الناصب والجازم.",
			id: "Modus indikatif marfu' (tanpa penashab atau penjazm).",
		},
	},
	SUBJ: {
		name: "منصوب",
		about: {
			en: "Subjunctive mood, used after particles such as an and lan.",
			ar: "المضارع المنصوب بعد حروف النصب مثل أن ولن وكي.",
			id: "Modus subjungtif manshub (setelah partikel penashab seperti an atau lan).",
		},
	},
	JUS: {
		name: "مجزوم",
		about: {
			en: "Jussive mood, used in commands, prohibitions, and conditions.",
			ar: "المضارع المجزوم بعد حروف الجزم وفي جواب الطلب والشرط.",
			id: "Modus jusif majzum (setelah huruf jazm atau dalam kalimat syarat/perintah).",
		},
	},
};

const CASE: Record<string, RawGloss> = {
	NOM: {
		name: "مرفوع",
		about: {
			en: "Nominative case (rafʿ), typically marked by ḍamma.",
			ar: "حالة الرفع، علامتها الأصلية الضمة، تلحق الفاعل والمبتدأ والخبر.",
			id: "Marfu' (kasus nominatif), tanda aslinya dhammah.",
		},
	},
	ACC: {
		name: "منصوب",
		about: {
			en: "Accusative case (naṣb), typically marked by fatḥa.",
			ar: "حالة النصب، علامتها الأصلية الفتحة، تلحق المفاعيل والأحوال.",
			id: "Manshub (kasus akusatif), tanda aslinya fathah.",
		},
	},
	GEN: {
		name: "مجرور",
		about: {
			en: "Genitive case (jarr), typically marked by kasra.",
			ar: "حالة الجر، علامتها الأصلية الكسرة، تلحق المجرور بحرف أو إضافة.",
			id: "Majrur (kasus genitif), tanda aslinya kasrah.",
		},
	},
};

const STATE: Record<string, RawGloss> = {
	DEF: {
		name: "معرفة",
		about: {
			en: "Definite noun, by the article al-, a proper name, or annexation.",
			ar: "الاسم المعرف بأل أو بالإضافة أو العلمية.",
			id: "Isim ma'rifah (definit) dengan al-, idhafah, atau nama.",
		},
	},
	INDEF: {
		name: "نكرة",
		about: {
			en: "Indefinite noun, typically taking tanwīn.",
			ar: "اسم يدل على غير معين ويقبل التنوين.",
			id: "Isim nakirah (indefinit), umumnya bertanwin.",
		},
	},
};

const NUMBER: Record<string, RawGloss> = {
	S: {
		name: "مفرد",
		about: {
			en: "Singular (one).",
			ar: "ما دل على واحد أو واحدة.",
			id: "Mufrad (tunggal).",
		},
	},
	D: {
		name: "مثنى",
		about: {
			en: "Dual (two), with distinctive endings -āni or -ayni.",
			ar: "ما دل على اثنين أو اثنتين بزيادة ألف ونون أو ياء ونون.",
			id: "Mutsanna (dua).",
		},
	},
	P: {
		name: "جمع",
		about: {
			en: "Plural (three or more).",
			ar: "ما دل على أكثر من اثنين.",
			id: "Jamak (tiga atau lebih).",
		},
	},
};

const GENDER: Record<string, RawGloss> = {
	M: {
		name: "مذكر",
		about: {
			en: "Grammatically masculine.",
			ar: "مذكر في اللفظ أو المعنى.",
			id: "Mudzakkar (maskulin).",
		},
	},
	F: {
		name: "مؤنث",
		about: {
			en: "Grammatically feminine.",
			ar: "مؤنث في اللفظ أو المعنى.",
			id: "Mu'annats (feminin).",
		},
	},
};

const PERSON: Record<string, RawGloss> = {
	"1": {
		name: "متكلم",
		about: {
			en: "First person: speaker (I or we).",
			ar: "ضمير المتكلم: أنا أو نحن.",
			id: "Orang pertama (aku atau kami/kita).",
		},
	},
	"2": {
		name: "مخاطب",
		about: {
			en: "Second person: addressed (you).",
			ar: "ضمير المخاطب: أنتَ، أنتِ، أنتما، أنتم، أنتن.",
			id: "Orang kedua (kamu/kalian).",
		},
	},
	"3": {
		name: "غائب",
		about: {
			en: "Third person: spoken about (he, she, they).",
			ar: "ضمير الغائب: هو، هي، هما، هم، هن.",
			id: "Orang ketiga (dia atau mereka).",
		},
	},
};

const DERIV: Record<string, RawGloss> = {
	"ACT-PCPL": {
		name: "اسم فاعل",
		about: {
			en: "The ism fāʿil, the doer of the action.",
			ar: "اسم مشتق يدل على من وقع منه الفعل مثل صادق وعالم.",
			id: "Isim fa'il (partisipel aktif: pelaku perbuatan).",
		},
	},
	"PASS-PCPL": {
		name: "اسم مفعول",
		about: {
			en: "The ism mafʿūl, the one the action is done to.",
			ar: "اسم مشتق يدل على من وقع عليه الفعل مثل منصور ومعلوم.",
			id: "Isim maf'ul (partisipel pasif: yang dikenai perbuatan).",
		},
	},
	VN: {
		name: "مصدر",
		about: {
			en: "The maṣdar, verbal noun naming the action itself.",
			ar: "اسم يدل على الحدث مجرداً عن الزمان.",
			id: "Masdar (nomina verbal: nama perbuatan tanpa terikat waktu).",
		},
	},
};

const SPECIAL: Record<string, RawGloss> = {
	kaAn: {
		name: "كان وأخواتها",
		about: {
			en: "Verbs that take a subject in nominative and predicate in accusative.",
			ar: "أفعال ناسخة ترفع المبتدأ وتنصب الخبر.",
			id: "Kana dan saudarinya (fi'il nasikh).",
		},
	},
	"<in~": {
		name: "إن وأخواتها",
		about: {
			en: "Particles that take a subject in accusative and predicate in nominative.",
			ar: "حروف ناسخة تنصب المبتدأ وترفع الخبر.",
			id: "Inna dan saudarinya (harf nasikh).",
		},
	},
	kaAd: {
		name: "كاد وأخواتها",
		about: {
			en: "Verbs of nearness or beginning.",
			ar: "أفعال المقاربة والرجاء والشروع.",
			id: "Kada dan saudarinya (af'alul muqarabah war raja' wasy syuru').",
		},
	},
};

const KIND: Record<string, RawGloss> = {
	p: {
		name: "سابقة",
		about: {
			en: "A letter or short word attached at the front, such as wa-, bi-, or al-.",
			ar: "حرف أو أداة متصلة بأول الكلمة، مثل الواو والباء وأل التعريف.",
			id: "Huruf atau awalan yang melekat di depan kata, seperti wa-, bi-, atau al-.",
		},
	},
	m: {
		name: "أصل",
		about: {
			en: "The core of the word, the part that carries the root and the main part of speech.",
			ar: "الجذع الأساسي للكلمة الذي يحمل مادتها ومعناها الرئيس.",
			id: "Inti kata yang memuat akar kata dan jenis kata utamanya.",
		},
	},
	s: {
		name: "لاحقة",
		about: {
			en: "An ending attached after the stem, often a pronoun or an emphatic nūn.",
			ar: "ضمير أو حرف متصل بآخر الكلمة.",
			id: "Akhiran yang melekat di ujung kata, sering kali berupa kata ganti.",
		},
	},
};

function resolveGloss(
	raw: RawGloss | undefined,
	fallbackCode: string,
	locale: Locale,
): Gloss {
	if (!raw) return { name: fallbackCode, about: "" };
	return {
		name: raw.name,
		about: raw.about[locale] || raw.about.en,
	};
}

export function posGloss(code: string, locale: Locale = "en"): Gloss {
	return resolveGloss(POS[code], code, locale);
}

export function relationGloss(code: string, locale: Locale = "en"): Gloss {
	return resolveGloss(RELATIONS[code], code, locale);
}

export function formGloss(code: string, locale: Locale = "en"): Gloss {
	return resolveGloss(FORMS[code], code, locale);
}

export function phraseGloss(code: string, locale: Locale = "en"): Gloss {
	return resolveGloss(PHRASES[code], code, locale);
}

export function kindGloss(kind: string, locale: Locale = "en"): Gloss {
	return resolveGloss(KIND[kind], kind, locale);
}

export function relationFamily(code: string): string {
	if (["subj", "obj", "pass", "pred", "subjx", "predx"].includes(code))
		return "core";
	if (
		[
			"gen",
			"poss",
			"adj",
			"app",
			"emph",
			"spec",
			"cog",
			"prp",
			"com",
			"voc",
			"exp",
		].includes(code)
	)
		return "nom";
	if (
		[
			"conj",
			"link",
			"sub",
			"circ",
			"cond",
			"rslt",
			"imrs",
			"ans",
			"cpnd",
		].includes(code)
	)
		return "clause";
	return "particle";
}

export interface FeatureLine {
	key: string;
	label: string;
	name: string;
	about: string;
}

const FEATURE_LABELS: Record<string, Record<Locale, string>> = {
	deriv: { en: "Derivation", ar: "الاشتقاق", id: "Derivasi" },
	asp: { en: "Tense/Aspect", ar: "الزمن", id: "Waktu/Kala" },
	form: { en: "Verb form", ar: "الوزن", id: "Wazan verba" },
	voice: { en: "Voice", ar: "البناء", id: "Bentuk verba" },
	mood: { en: "Mood", ar: "الحالة", id: "Modus" },
	per: { en: "Person", ar: "الشخص", id: "Pronomina" },
	gen: { en: "Gender", ar: "الجنس", id: "Gender" },
	num: { en: "Number", ar: "العدد", id: "Jumlah" },
	case: { en: "Case", ar: "الإعراب", id: "I'rab" },
	state: { en: "Definiteness", ar: "التعريف", id: "Definit" },
	sp: { en: "Special class", ar: "الباب", id: "Kelompok khusus" },
};

export function featureLines(
	features: {
		form?: string;
		asp?: string;
		voice?: string;
		mood?: string;
		per?: number;
		gen?: string;
		num?: string;
		case?: string;
		state?: string;
		deriv?: string;
		sp?: string;
	},
	locale: Locale = "en",
): FeatureLine[] {
	const lines: FeatureLine[] = [];
	const push = (key: string, raw: RawGloss | undefined) => {
		if (!raw) return;
		const gloss = resolveGloss(raw, key, locale);
		const label =
			FEATURE_LABELS[key]?.[locale] || FEATURE_LABELS[key]?.en || key;
		lines.push({ key, label, name: gloss.name, about: gloss.about });
	};
	if (features.deriv) push("deriv", DERIV[features.deriv]);
	if (features.asp) push("asp", ASPECT[features.asp]);
	if (features.form) push("form", FORMS[features.form]);
	if (features.voice) push("voice", VOICE[features.voice]);
	if (features.mood) push("mood", MOOD[features.mood]);
	if (features.per) push("per", PERSON[String(features.per)]);
	if (features.gen) push("gen", GENDER[features.gen]);
	if (features.num) push("num", NUMBER[features.num]);
	if (features.case) push("case", CASE[features.case]);
	if (features.state) push("state", STATE[features.state]);
	if (features.sp)
		push(
			"sp",
			SPECIAL[features.sp] ?? {
				name: features.sp,
				about: {
					en: "A closed class marked in the corpus.",
					ar: "باب نحوي خاص.",
					id: "Kelompok tata bahasa khusus.",
				},
			},
		);
	return lines;
}
