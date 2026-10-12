export interface Gloss {
  name: string;
  about: string;
}

export const POS: Record<string, Gloss> = {
  N: { name: "اسم", about: "A name of a person, thing, or idea. Nouns take case and can be definite or indefinite." },
  PN: { name: "اسم علم", about: "A specific name, such as Ādam. Many proper nouns do not take tanwīn." },
  PRON: { name: "ضمير", about: "A word that stands in for a noun: an attached suffix, an independent pronoun, or an implied one." },
  DEM: { name: "اسم إشارة", about: "A pointing word such as hādhā or hāʾulāʾi, ‘this’ or ‘these’." },
  REL: { name: "اسم موصول", about: "A word such as alladhī that introduces a clause describing a noun." },
  ADJ: { name: "صفة", about: "A describing word that follows the noun and matches it in case, gender, number, and definiteness." },
  V: { name: "فعل", about: "An action or state, conjugated for person, gender, and number." },
  P: { name: "حرف جر", about: "A particle such as bi-, fī, or ʿalā that puts the following noun in the genitive." },
  INTG: { name: "استفهام", about: "A question word, such as hal, mā, or the interrogative alif." },
  VOC: { name: "نداء", about: "A particle used to call someone, typically yā." },
  NEG: { name: "نفي", about: "A particle that denies, such as lā, mā, lam, or lan." },
  EMPH: { name: "توكيد", about: "A particle or ending that strengthens the statement, including the emphatic nūn and la-." },
  PRP: { name: "تعليل", about: "A particle introducing a purpose, often li- meaning ‘in order to’." },
  IMPV: { name: "لام الأمر", about: "The lām that turns an imperfect verb into a command, the lām of command." },
  FUT: { name: "استقبال", about: "The prefix sa- or the particle sawfa, marking the future." },
  CONJ: { name: "عطف", about: "A joining word, most often wa- or fa-, linking words or clauses." },
  DET: { name: "تعريف", about: "The definite article al-. It defines the noun and does not take its own syntactic node in the treebank." },
  INL: { name: "حروف مقطعة", about: "Disconnected letters at the start of some surahs, such as alif lām mīm. Their meaning is not parsed as ordinary grammar." },
  T: { name: "ظرف زمان", about: "A noun of time used adverbially, such as yawma in ‘the day when’." },
  LOC: { name: "ظرف مكان", about: "A noun of place used adverbially." },
  ACC: { name: "حرف نصب", about: "A particle that puts the following noun in the accusative, such as inna or anna." },
  COND: { name: "شرط", about: "A particle that sets a condition, such as in or idhā." },
  SUB: { name: "مصدري", about: "A particle that starts a subordinate clause, such as an or alladhī in some analyses." },
  RES: { name: "حصر", about: "A particle of restriction or exception, classically ḥaṣr, often illā." },
  EXP: { name: "استثناء", about: "A particle of exception." },
  AVR: { name: "ردع", about: "A particle that turns the listener away from something, such as balā in some uses, or kallā." },
  CERT: { name: "تحقيق", about: "A particle that presents the statement as certain, such as qad before a perfect verb." },
  RET: { name: "إضراب", about: "A particle that breaks off and corrects, the iḍrāb of bal." },
  PREV: { name: "كافة", about: "The preventive particle, classically kāffa, which stops the word before it from governing." },
  ANS: { name: "جواب", about: "A particle that answers a question or a condition." },
  INC: { name: "ابتداء", about: "A particle that opens a new statement." },
  SUR: { name: "مفاجأة", about: "A particle of suddenness, such as idhā in the sense of ‘lo’." },
  SUP: { name: "زيادة", about: "A particle that adds a further, loosely attached phrase." },
  EXH: { name: "تحضيض", about: "A particle that urges, such as lawlā in the sense of ‘why not’." },
  IMPN: { name: "اسم فعل", about: "A noun with the force of a command." },
  EXL: { name: "تفسير", about: "A particle that explains what came before." },
  EQ: { name: "تسوية", about: "A particle that presents two options as equal, the hamza of taswiyah." },
  REM: { name: "استئناف", about: "Wa- or fa- that starts a new sentence rather than joining inside one." },
  CAUS: { name: "سببية", about: "A particle that gives a reason." },
  AMD: { name: "استدراك", about: "A particle that amends or restarts the sentence." },
  PRO: { name: "نهي", about: "The negative command, lā with a jussive verb." },
  CIRC: { name: "حال", about: "Wa- introducing a ḥāl, a clause that describes the circumstance of the action." },
  RSLT: { name: "نتيجة", about: "A particle that introduces the result of what came before." },
  INT: { name: "تفسير", about: "A particle of interpretation, tafsīr, explaining an earlier word." },
  COM: { name: "معية", about: "Wa- meaning ‘along with’, the wāw of maʿiyyah." },
};

export const RELATIONS: Record<string, Gloss> = {
  subj: { name: "فاعل", about: "The doer of the verb, the fāʿil. It may be a noun, an attached pronoun, or an implied pronoun." },
  obj: { name: "مفعول به", about: "The thing the verb acts on, the mafʿūl bihi, usually accusative." },
  pass: { name: "نائب فاعل", about: "The noun that would have been the object, promoted when the verb is passive. The nāʾib fāʿil." },
  pred: { name: "خبر", about: "What is said about the subject, the khabar." },
  subjx: { name: "مبتدأ", about: "The subject of a nominal sentence or of inna and its sisters, the mubtadaʾ or ism." },
  predx: { name: "خبر", about: "The predicate of a nominal sentence or of kāna and its sisters." },
  gen: { name: "مجرور", about: "The noun governed by a preposition, in the genitive case." },
  poss: { name: "مضاف إليه", about: "The second noun of an iḍāfa, the muḍāf ilayh, possessed by the noun before it." },
  adj: { name: "نعت", about: "A follower that describes the head, the naʿt or ṣifa." },
  app: { name: "بدل", about: "A noun that clarifies or replaces another, the badal." },
  emph: { name: "توكيد", about: "A follower that reinforces the head, the tawḳīd, such as kull or nafs." },
  conj: { name: "معطوف", about: "A word or clause joined to a previous one by wa- or fa-, the maʿṭūf." },
  link: { name: "متعلق", about: "Where a prepositional phrase belongs. The phrase is mutaʿalliq, linked to a verb, participle, or elided word." },
  sub: { name: "صلة", about: "A clause that depends on a head, often the ṣila of a relative." },
  circ: { name: "حال", about: "A ḥāl: a word or clause describing the circumstance of the action." },
  spec: { name: "تمييز", about: "A tamyīz, a noun that clarifies an ambiguous idea, usually accusative." },
  cog: { name: "مفعول مطلق", about: "The mafʿūl muṭlaq, a verbal noun from the same root that emphasizes the verb." },
  prp: { name: "مفعول له", about: "The reason for the action, the mafʿūl li-ajlih." },
  com: { name: "مفعول معه", about: "The mafʿūl maʿah, something the action is done along with." },
  voc: { name: "منادى", about: "The person or thing being called, the munādā." },
  exp: { name: "مستثنى", about: "The thing excepted, the mustathnā." },
  cond: { name: "شرط", about: "The protasis, the clause that sets the condition." },
  rslt: { name: "جواب", about: "The apodosis, the clause that follows if the condition holds." },
  imrs: { name: "جواب الطلب", about: "A clause that answers an imperative." },
  neg: { name: "نفي", about: "The negative particle governing this word or clause." },
  intg: { name: "استفهام", about: "The question particle or question word governing this clause." },
  fut: { name: "استقبال", about: "The future particle attached to this verb." },
  cert: { name: "تحقيق", about: "A particle of certainty governing this verb." },
  pro: { name: "نهي", about: "The prohibitive particle governing this verb." },
  impv: { name: "أمر", about: "The command particle governing this verb." },
  res: { name: "حصر", about: "A particle that restricts the statement, often illā." },
  sur: { name: "مفاجأة", about: "A particle of suddenness governing this clause." },
  ret: { name: "إضراب", about: "A particle that breaks off from the previous statement." },
  exl: { name: "تفسير", about: "A phrase that explains the head." },
  prev: { name: "كافة", about: "A particle that stops the previous word from governing." },
  avr: { name: "ردع", about: "A particle that wards off what was just said." },
  inc: { name: "ابتداء", about: "A particle that opens this statement." },
  exh: { name: "تحضيض", about: "A particle that urges this action." },
  eq: { name: "تسوية", about: "A particle that sets two options side by side." },
  caus: { name: "سببية", about: "A clause or phrase that gives the reason." },
  amd: { name: "استدراك", about: "A phrase that amends the previous one." },
  sup: { name: "زيادة", about: "An added phrase, loosely attached to the head." },
  int: { name: "تفسير", about: "A phrase that interprets the head." },
  cpnd: { name: "مركب", about: "Two words treated as one compound." },
  ans: { name: "جواب", about: "The answer to a question or a condition." },
};

export const PHRASES: Record<string, Gloss> = {
  S: { name: "جملة", about: "A complete sentence span." },
  NS: { name: "جملة اسمية", about: "A jumla ismiyya: a sentence that begins with a noun, with a subject and a predicate." },
  VS: { name: "جملة فعلية", about: "A jumla fiʿliyya: a sentence built around a verb." },
  CS: { name: "جملة شرطية", about: "A condition together with its result." },
  PP: { name: "جار ومجرور", about: "A preposition and the noun it governs." },
  SC: { name: "صلة", about: "A clause that depends on something outside itself." },
};

export const FORMS: Record<string, Gloss> = {
  I: { name: "فَعَلَ", about: "The base verb, faʿala. It is often left unmarked in the corpus." },
  II: { name: "فَعَّلَ", about: "Faʿʿala. Often intensive or causative, with a doubled middle letter." },
  III: { name: "فَاعَلَ", about: "Fāʿala. Often doing the action with or toward someone." },
  IV: { name: "أَفْعَلَ", about: "Afʿala. Often causative or transitive, with a prefixed hamza." },
  V: { name: "تَفَعَّلَ", about: "Tafaʿʿala. Often reflexive of form II." },
  VI: { name: "تَفَاعَلَ", about: "Tafāʿala. Often mutual or reflexive of form III." },
  VII: { name: "انْفَعَلَ", about: "Infaʿala. Often passive or intransitive, with a prefixed nūn." },
  VIII: { name: "افْتَعَلَ", about: "Iftaʿala. A reflexive or middle pattern with an infixed tāʾ." },
  IX: { name: "افْعَلَّ", about: "Ifʿalla. Mostly colors and defects." },
  X: { name: "اسْتَفْعَلَ", about: "Istafʿala. Often seeking or considering something to be a certain way." },
  XI: { name: "افْعَالَّ", about: "Ifʿālla. Rare, mostly colors and intensive states." },
  XII: { name: "افْعَوْعَلَ", about: "Ifʿawʿala. Rare." },
};

const ASPECT: Record<string, Gloss> = {
  PERF: { name: "ماض", about: "The māḍī. The action is presented as complete, usually in the past." },
  IMPF: { name: "مضارع", about: "The muḍāriʿ. The action is incomplete, present, or future, and it can take a mood." },
  IMPV: { name: "أمر", about: "The amr. A direct command, built from the jussive." },
};

const VOICE: Record<string, Gloss> = {
  ACT: { name: "معلوم", about: "The doer is the grammatical subject." },
  PASS: { name: "مجهول", about: "The verb is majhūl. The subject is not named, and the old object becomes the subject." },
};

const MOOD: Record<string, Gloss> = {
  IND: { name: "مرفوع", about: "The ordinary mood of the imperfect, marfūʿ." },
  SUBJ: { name: "منصوب", about: "The manṣūb imperfect, used after particles such as an and lan." },
  JUS: { name: "مجزوم", about: "The majzūm imperfect, used in commands, prohibitions, and conditions." },
};

const CASE: Record<string, Gloss> = {
  NOM: { name: "مرفوع", about: "Rafʿ. The case of subjects and nominal predicates, usually marked by ḍamma." },
  ACC: { name: "منصوب", about: "Naṣb. The case of objects and several adverbial nouns, usually marked by fatḥa." },
  GEN: { name: "مجرور", about: "Jarr. The case after a preposition or in an iḍāfa, usually marked by kasra." },
};

const STATE: Record<string, Gloss> = {
  DEF: { name: "معرفة", about: "The noun is definite by the article, by a name, or by a following pronoun." },
  INDEF: { name: "نكرة", about: "The noun is indefinite, often marked with tanwīn." },
};

const NUMBER: Record<string, Gloss> = {
  S: { name: "مفرد", about: "One." },
  D: { name: "مثنى", about: "Two. Dual endings are distinctive: -āni, -ayni." },
  P: { name: "جمع", about: "Three or more, either a sound plural or a broken plural." },
};

const GENDER: Record<string, Gloss> = {
  M: { name: "مذكر", about: "Grammatically masculine." },
  F: { name: "مؤنث", about: "Grammatically feminine. Many feminine nouns end in ṭāʾ marbūṭa." },
};

const PERSON: Record<string, Gloss> = {
  "1": { name: "متكلم", about: "The speaker: I or we." },
  "2": { name: "مخاطب", about: "The person addressed: you." },
  "3": { name: "غائب", about: "Someone spoken about: he, she, or they." },
};

const DERIV: Record<string, Gloss> = {
  "ACT-PCPL": { name: "اسم فاعل", about: "The ism fāʿil, the doer of the action, such as ṣādiq from ṣadaqa." },
  "PASS-PCPL": { name: "اسم مفعول", about: "The ism mafʿūl, the one the action is done to." },
  VN: { name: "مصدر", about: "The maṣdar, the noun that names the action itself." },
};

const SPECIAL: Record<string, Gloss> = {
  kaAn: { name: "كان وأخواتها", about: "A verb that takes a subject and a predicate, and puts the predicate in the accusative." },
  "<in~": { name: "إن وأخواتها", about: "A particle that takes a subject in the accusative and a predicate in the nominative." },
  kaAd: { name: "كاد وأخواتها", about: "A verb of nearness or beginning, followed by a verb." },
};

const KIND: Record<string, Gloss> = {
  p: { name: "سابقة", about: "A letter or short word attached at the front, such as wa-, bi-, or al-." },
  m: { name: "أصل", about: "The core of the word, the part that carries the root and the main part of speech." },
  s: { name: "لاحقة", about: "An ending attached after the stem, often a pronoun or an emphatic nūn." },
};

export function posGloss(code: string): Gloss {
  return POS[code] ?? { name: code, about: "A grammatical tag from the Quranic Arabic Corpus." };
}

export function relationGloss(code: string): Gloss {
  return RELATIONS[code] ?? { name: code, about: "A syntactic relation in the Quranic Arabic Corpus treebank." };
}

export function phraseGloss(code: string): Gloss {
  return PHRASES[code] ?? { name: code, about: "A phrase span in the treebank." };
}

export function kindGloss(kind: string): Gloss {
  return KIND[kind] ?? { name: kind, about: "" };
}

export function relationFamily(code: string): string {
  if (["subj", "obj", "pass", "pred", "subjx", "predx"].includes(code)) return "core";
  if (["gen", "poss", "adj", "app", "emph", "spec", "cog", "prp", "com", "voc", "exp"].includes(code)) return "nom";
  if (["conj", "link", "sub", "circ", "cond", "rslt", "imrs", "ans", "cpnd"].includes(code)) return "clause";
  return "particle";
}

export interface FeatureLine {
  key: string;
  label: string;
  name: string;
  about: string;
}

export function featureLines(features: {
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
}): FeatureLine[] {
  const lines: FeatureLine[] = [];
  const push = (key: string, label: string, gloss: Gloss | undefined) => {
    if (!gloss) return;
    lines.push({ key, label, name: gloss.name, about: gloss.about });
  };
  if (features.deriv) push("deriv", "الاشتقاق", DERIV[features.deriv]);
  if (features.asp) push("asp", "الزمن", ASPECT[features.asp]);
  if (features.form) push("form", "الوزن", FORMS[features.form]);
  if (features.voice) push("voice", "البناء", VOICE[features.voice]);
  if (features.mood) push("mood", "الحالة", MOOD[features.mood]);
  if (features.per) push("per", "الشخص", PERSON[String(features.per)]);
  if (features.gen) push("gen", "الجنس", GENDER[features.gen]);
  if (features.num) push("num", "العدد", NUMBER[features.num]);
  if (features.case) push("case", "الإعراب", CASE[features.case]);
  if (features.state) push("state", "التعريف", STATE[features.state]);
  if (features.sp) push("sp", "الباب", SPECIAL[features.sp] ?? { name: features.sp, about: "A closed class marked in the corpus." });
  return lines;
}
