#!/usr/bin/env python3
"""Build Surah Al-Baqarah Usul al-Fiqh & Dalalat al-Alfaz dataset.

Merges canonical Golden Seed proof texts with Stage 1 deterministic syntactic
candidates from Surah 2 morphology, emitting public/data/quran/usul/002.json.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
SURAH_002_PATH = ROOT / "public" / "data" / "quran" / "surah" / "002.json"
OUT_USUL_DIR = ROOT / "public" / "data" / "quran" / "usul"
OUT_USUL_002 = OUT_USUL_DIR / "002.json"

GOLDEN_SEED: list[dict[str, Any]] = [
    {
        "id": "2-43-1-4-amr-wujub",
        "verseKey": "2:43",
        "ayahNumber": 43,
        "wordStart": 1,
        "wordEnd": 4,
        "shahidPhraseAr": "وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ",
        "taxonomyId": "AMR_WUJUB",
        "categoryGroup": "AMR_NAHY",
        "linguisticTriggerAr": "صيغة أمر مطلقة",
        "defaultDalalahAr": "الوجوب",
        "actualDalalahAr": "الوجوب",
        "hasQarinahSarifah": False,
        "qarinahTextAr": None,
        "qarinahVerseKey": None,
        "wajhAlDilalahAr": (
            "صيغة أمر مطلقة عريت عن القرينة الصارفة فتفيد الوجوب، "
            "ولفظ (الصلاة والزكاة) مجمل في هيئته ومقداره بيّنته السنة."
        ),
        "derivedFiqhRulingAr": "وجوب إقام الصلاة وإيتاء الزكاة فرض عين",
        "khilafUsuliAr": None,
        "classicalSources": ["المستصفى للغزالي", "أحكام القرآن للجصاص"],
        "extractionStage": "GOLDEN_SEED",
        "isCanonicalShahid": True,
    },
    {
        "id": "2-187-31-37-amr-ibahah",
        "verseKey": "2:187",
        "ayahNumber": 187,
        "wordStart": 31,
        "wordEnd": 37,
        "shahidPhraseAr": "وَكُلُوا وَاشْرَبُوا حَتَّىٰ يَتَبَيَّنَ لَكُمُ الْخَيْطُ الْأَبْيَضُ",
        "taxonomyId": "AMR_IBAHAH",
        "categoryGroup": "AMR_NAHY",
        "linguisticTriggerAr": "أمر بعد الحظر مع غاية",
        "defaultDalalahAr": "الوجوب",
        "actualDalalahAr": "الإباحة",
        "hasQarinahSarifah": True,
        "qarinahTextAr": "أُحِلَّ لَكُمْ لَيْلَةَ الصِّيَامِ الرَّفَثُ إِلَىٰ نِسَائِكُمْ",
        "qarinahVerseKey": "2:187",
        "wajhAlDilalahAr": (
            "الأمر في (كلوا واشربوا) ورد بعد الحظر فيفيد الإباحة، "
            "وقوله (حتى يتبين) غاية تفيد بمفهوم المخالفة تحريم الأكل والشرب عند طلوع الفجر."
        ),
        "derivedFiqhRulingAr": "إباحة الأكل والشرب والمباشرة ليلة الصيام إلى طلوع الفجر الصادق",
        "khilafUsuliAr": (
            "مذهب الجمهور أن الأمر بعد الحظر للإباحة، "
            "وقال بعض الحنابلة يعود إلى ما كان عليه قبل الحظر"
        ),
        "classicalSources": [
            "أحكام القرآن لابن العربي",
            "المستصفى للغزالي",
            "الإحكام للآمدي",
        ],
        "extractionStage": "GOLDEN_SEED",
        "isCanonicalShahid": True,
    },
    {
        "id": "2-196-45-50-dalalat-iqtida",
        "verseKey": "2:196",
        "ayahNumber": 196,
        "wordStart": 45,
        "wordEnd": 50,
        "shahidPhraseAr": "فَمَن لَّمْ يَجِدْ فَصِيَامُ ثَلَاثَةِ أَيَّامٍ",
        "taxonomyId": "DALALAT_IQTIDA",
        "categoryGroup": "MANTOOQ_MAFHUM",
        "linguisticTriggerAr": "تقدير محذوف (فعليه صيام)",
        "defaultDalalahAr": "الظاهر المتبادر",
        "actualDalalahAr": "دلالة الاقتضاء",
        "hasQarinahSarifah": False,
        "qarinahTextAr": None,
        "qarinahVerseKey": None,
        "wajhAlDilalahAr": (
            "دلالة اقتضاء بتقدير واجب محذوف (فعليه صيام) لتصحيح الكلام شرعاً، "
            "ولفظ (ثلاثة أيام) مطلق عن قيد التتابع عند الجمهور."
        ),
        "derivedFiqhRulingAr": "وجوب صيام ثلاثة أيام في الحج لفاقد الهدي ويجوز تفريقها",
        "khilafUsuliAr": (
            "قراءة ابن مسعود (متتابعات) هل يقيد بها المطلق؟ "
            "مذهب الحنفية التقييد بقراءة الآحاد خلافاً للشافعية والجمهور"
        ),
        "classicalSources": [
            "المستصفى للغزالي",
            "أحكام القرآن للجصاص",
            "إرشاد الفحول للشوكاني",
        ],
        "extractionStage": "GOLDEN_SEED",
        "isCanonicalShahid": True,
    },
    {
        "id": "2-221-1-5-nahy-tahrim",
        "verseKey": "2:221",
        "ayahNumber": 221,
        "wordStart": 1,
        "wordEnd": 5,
        "shahidPhraseAr": "وَلَا تَنكِحُوا الْمُشْرِكَاتِ حَتَّىٰ يُؤْمِنَّ",
        "taxonomyId": "NAHY_TAHRIM",
        "categoryGroup": "AMR_NAHY",
        "linguisticTriggerAr": "لا الناهية مع الفعل المضارع المجزوم",
        "defaultDalalahAr": "التحريم والفساد",
        "actualDalalahAr": "التحريم والفساد",
        "hasQarinahSarifah": False,
        "qarinahTextAr": None,
        "qarinahVerseKey": None,
        "wajhAlDilalahAr": (
            "نهي مطلق يفيد التحريم وفساد العقد، ولفظ (المشركات) جمع محلى بأل يفيد العموم، "
            "خُص منه نساء أهل الكتاب بآية المائدة (5:5)."
        ),
        "derivedFiqhRulingAr": "بطلان وتحريم نكاح المشركات واستثناء الكتابيات بدليل منفصل",
        "khilafUsuliAr": (
            "تخصيص القرآن بالقرآن متفق على جوازه، واختلف في نسخ العام بالمخصص المتراخي"
        ),
        "classicalSources": ["أحكام القرآن للجصاص", "الإحكام للآمدي"],
        "extractionStage": "GOLDEN_SEED",
        "isCanonicalShahid": True,
    },
    {
        "id": "2-228-2-5-khabar-bimaana-amr",
        "verseKey": "2:228",
        "ayahNumber": 228,
        "wordStart": 2,
        "wordEnd": 5,
        "shahidPhraseAr": "يَتَرَبَّصْنَ بِأَنفُسِهِنَّ ثَلَاثَةَ قُرُوءٍ",
        "taxonomyId": "KHABAR_BIMAANA_AMR",
        "categoryGroup": "AMR_NAHY",
        "linguisticTriggerAr": "جملة خبرية لفظاً إنشائية معنى",
        "defaultDalalahAr": "الإخبار",
        "actualDalalahAr": "الوجوب الجازم",
        "hasQarinahSarifah": True,
        "qarinahTextAr": "سياق الأحكام والحدود الشرعية",
        "qarinahVerseKey": "2:228",
        "wajhAlDilalahAr": (
            "(يتربصن) جملة خبرية يراد بها الإنشاء (الأمر بالوجوب)، "
            "ولفظ (قروء) مشترك لفظي متردد بين الطهر والحيض."
        ),
        "derivedFiqhRulingAr": "وجوب عدة المطلقة ثلاثة قروء",
        "khilafUsuliAr": (
            "الاشتراك اللفظي في (القرء) حمل عند الشافعية والمالكية على الطهر "
            "بقرينة التأنيث في العدد (ثلاثة)، وعند الحنفية والحنابلة على الحيض"
        ),
        "classicalSources": [
            "أحكام القرآن للجصاص",
            "المستصفى للغزالي",
            "المحصول للرازي",
        ],
        "extractionStage": "GOLDEN_SEED",
        "isCanonicalShahid": True,
    },
    {
        "id": "2-233-11-15-isharat-nass",
        "verseKey": "2:233",
        "ayahNumber": 233,
        "wordStart": 11,
        "wordEnd": 15,
        "shahidPhraseAr": "وَعَلَى الْمَوْلُودِ لَهُ رِزْقُهُنَّ وَكِسْوَتُهُنَّ",
        "taxonomyId": "ISHARAT_NASS",
        "categoryGroup": "MANTOOQ_MAFHUM",
        "linguisticTriggerAr": "لام الاختصاص والإضافة في قوله (له)",
        "defaultDalalahAr": "عبارة النص في وجوب النفقة",
        "actualDalalahAr": "إشارة النص في ثبوت النسب",
        "hasQarinahSarifah": False,
        "qarinahTextAr": None,
        "qarinahVerseKey": None,
        "wajhAlDilalahAr": (
            "سيقت الآية لبيان وجوب النفقة على الأب (عبارة النص)، "
            "ودلت بإشارة النص (بلام الاختصاص في: له) على أن النسب للأب وأنه لا يشاركه فيه أحد."
        ),
        "derivedFiqhRulingAr": (
            "اختصاص الأب بوجوب نفقة الرضاع وثبوت النسب له وانفراده بتحمل أعبائه"
        ),
        "khilafUsuliAr": (
            "دلالة إشارة النص قطعية عند الجمهور والحنفية كالعبارة ما لم تعارضها عبارة أقوى"
        ),
        "classicalSources": [
            "أصول السرخسي",
            "كشف الأسرار للبزدوي",
            "المستصفى للغزالي",
        ],
        "extractionStage": "GOLDEN_SEED",
        "isCanonicalShahid": True,
    },
    {
        "id": "2-275-21-25-ibarat-nass",
        "verseKey": "2:275",
        "ayahNumber": 275,
        "wordStart": 21,
        "wordEnd": 25,
        "shahidPhraseAr": "وَأَحَلَّ اللَّهُ الْبَيْعَ وَحَرَّمَ الرِّبَا",
        "taxonomyId": "IBARAT_NASS",
        "categoryGroup": "MANTOOQ_MAFHUM",
        "linguisticTriggerAr": "جملة اسمية مؤكدة بالصريح",
        "defaultDalalahAr": "نفي المماثلة بين البيع والربا",
        "actualDalalahAr": "حل البيع وتحريم الربا",
        "hasQarinahSarifah": False,
        "qarinahTextAr": None,
        "qarinahVerseKey": None,
        "wajhAlDilalahAr": (
            "دلت بعبارة النص على التفرقة بين البيع والربا رداً على الكفار، "
            "وبإشارة النص على حل البيع وتحريم الربا، "
            "و(البيع) مفرد محلى بأل يفيد العموم وخُصت منه البيوع المنهي عنها."
        ),
        "derivedFiqhRulingAr": (
            "أصل إباحة عقود المعاوضات وتحريم الربا تحريماً قطعياً وتخصيصه ببيوع الغرر والربا بالسنة"
        ),
        "khilafUsuliAr": (
            "الحنفية يرون دلالة العام قطعية كالنص الخاص فلا يخصص بأخبار الآحاد إلا إذا "
            "كان العام مخصوصاً بقطعي، والجمهور يرون العام ظنياً فيخصص بالآحاد والقياس ابتداء"
        ),
        "classicalSources": [
            "أحكام القرآن للجصاص",
            "المستصفى للغزالي",
            "الإحكام للآمدي",
        ],
        "extractionStage": "GOLDEN_SEED",
        "isCanonicalShahid": True,
    },
    {
        "id": "2-282-4-10-amr-nadb",
        "verseKey": "2:282",
        "ayahNumber": 282,
        "wordStart": 4,
        "wordEnd": 10,
        "shahidPhraseAr": "إِذَا تَدَايَنتُم بِدَيْنٍ إِلَىٰ أَجَلٍ مُّسَمًّى فَاكْتُبُوهُ",
        "taxonomyId": "AMR_NADB",
        "categoryGroup": "AMR_NAHY",
        "linguisticTriggerAr": "صيغة الأمر (فعل أمر مقترن بفاء الجزاء)",
        "defaultDalalahAr": "الوجوب",
        "actualDalalahAr": "الندب والإرشاد",
        "hasQarinahSarifah": True,
        "qarinahTextAr": "فَإِنْ أَمِنَ بَعْضُكُم بَعْضًا فَلْيُؤَدِّ الَّذِي اؤْتُمِنَ أَمَانَتَهُ",
        "qarinahVerseKey": "2:283",
        "wajhAlDilalahAr": (
            "صيغة الأمر (فاكتبوه) مصروفة عن الوجوب إلى الندب والإرشاد بقرينة الآية التالية (2:283): "
            "﴿فَإِنْ أَمِنَ بَعْضُكُم بَعْضًا فَلْيُؤَدِّ الَّذِي اؤْتُمِنَ أَمَانَتَهُ﴾."
        ),
        "derivedFiqhRulingAr": ("استحباب كتابة الديون والإشهاد عليها ورفع الحرج عند الائتمان"),
        "khilafUsuliAr": (
            "ذهب داود الظاهري وابن حزم إلى وجوب كتابة الدين ظاهراً للآية، "
            "وذهب الأئمة الأربعة وجمهور الأصوليين إلى الندب للقرينة الصارفة"
        ),
        "classicalSources": [
            "أحكام القرآن للجصاص",
            "المستصفى للغزالي",
            "الإحكام للآمدي",
            "إرشاد الفحول للشوكاني",
        ],
        "extractionStage": "GOLDEN_SEED",
        "isCanonicalShahid": True,
    },
]


def scan_stage1_candidates(verse: dict[str, Any]) -> list[dict[str, Any]]:
    """Deterministic candidate scanner over verse morphology."""
    v_num = verse["v"]
    words: list[dict[str, Any]] = verse["w"]
    candidates: list[dict[str, Any]] = []

    for idx, word in enumerate(words):
        w_num = word["n"]
        segments: list[dict[str, Any]] = word.get("s", [])

        # Check for Imperative (CAND_AMR)
        has_imp = False
        has_lam_amr = False
        for s in segments:
            if s.get("p") == "V" and s.get("f", {}).get("mood") == "IMP":
                has_imp = True
            if s.get("a") in ("فَلْ", "وَلْ", "لِ"):
                has_lam_amr = True

        if has_imp or (has_lam_amr and any(s.get("p") == "V" for s in segments)):
            # Check if adjacent to vocative ربنا
            is_dua = False
            surrounding = [words[i]["a"] for i in range(max(0, idx - 2), min(len(words), idx + 3))]
            if any("رَبَّ" in t or "رَبِّ" in t for t in surrounding):
                is_dua = True

            if not is_dua:
                candidates.append(
                    {
                        "id": f"2-{v_num}-{w_num}-{w_num}-cand-amr",
                        "verseKey": f"2:{v_num}",
                        "ayahNumber": v_num,
                        "wordStart": w_num,
                        "wordEnd": w_num,
                        "shahidPhraseAr": word["a"],
                        "taxonomyId": "AMR_WUJUB",
                        "categoryGroup": "AMR_NAHY",
                        "linguisticTriggerAr": "صيغة أمر صريح",
                        "defaultDalalahAr": "الوجوب",
                        "actualDalalahAr": "الوجوب",
                        "hasQarinahSarifah": False,
                        "qarinahTextAr": None,
                        "qarinahVerseKey": None,
                        "wajhAlDilalahAr": "صيغة أمر تدل بأصل وضعها اللغوي والشرعي على الوجوب",
                        "derivedFiqhRulingAr": "طلب الفعل طلباً جازماً يقتضي الامتثال",
                        "khilafUsuliAr": None,
                        "classicalSources": ["المستصفى للغزالي"],
                        "extractionStage": "STAGE1_RULE_ONLY",
                        "isCanonicalShahid": False,
                    }
                )

        # Check for Prohibitive (CAND_NAHY: لا الناهية + فعل مضارع مجزوم)
        if word["a"] in ("لَا", "وَلَا", "فَلَا") and idx + 1 < len(words):
            next_word = words[idx + 1]
            next_segs = next_word.get("s", [])
            is_jus_verb = any(
                s.get("p") == "V" and s.get("f", {}).get("mood") in ("JUS", "SUBJ", "IND")
                for s in next_segs
            )
            if is_jus_verb:
                phrase = f"{word['a']} {next_word['a']}"
                candidates.append(
                    {
                        "id": f"2-{v_num}-{w_num}-{next_word['n']}-cand-nahy",
                        "verseKey": f"2:{v_num}",
                        "ayahNumber": v_num,
                        "wordStart": w_num,
                        "wordEnd": next_word["n"],
                        "shahidPhraseAr": phrase,
                        "taxonomyId": "NAHY_TAHRIM",
                        "categoryGroup": "AMR_NAHY",
                        "linguisticTriggerAr": "لا الناهية المقترنة بالمضارع المجزوم",
                        "defaultDalalahAr": "التحريم والفساد",
                        "actualDalalahAr": "التحريم والفساد",
                        "hasQarinahSarifah": False,
                        "qarinahTextAr": None,
                        "qarinahVerseKey": None,
                        "wajhAlDilalahAr": (
                            "صيغة نهي صريحة تقتضي التحريم وفساد المنهي عنه عند الإطلاق"
                        ),
                        "derivedFiqhRulingAr": "تحريم الفعل المنهي عنه وبطلان ترتبه شرعاً",
                        "khilafUsuliAr": None,
                        "classicalSources": ["الإحكام للآمدي"],
                        "extractionStage": "STAGE1_RULE_ONLY",
                        "isCanonicalShahid": False,
                    }
                )

    return candidates


def build_usul_spike_dataset() -> dict[str, Any]:
    """Generates the full Surah 2 Usul dataset."""
    with open(SURAH_002_PATH, encoding="utf-8") as f:
        surah_data = json.load(f)

    all_shawahid: list[dict[str, Any]] = list(GOLDEN_SEED)
    golden_verse_keys = {g["verseKey"] for g in GOLDEN_SEED}

    for verse in surah_data.get("verses", []):
        v_key = f"2:{verse['v']}"
        # For non-golden verses, scan Stage 1 syntactic candidates
        if v_key not in golden_verse_keys:
            cands = scan_stage1_candidates(verse)
            all_shawahid.extend(cands)

    all_shawahid.sort(key=lambda s: (s["ayahNumber"], s["wordStart"]))

    return {
        "surah": 2,
        "shawahid": all_shawahid,
    }


def main() -> None:
    OUT_USUL_DIR.mkdir(parents=True, exist_ok=True)
    dataset = build_usul_spike_dataset()
    with open(OUT_USUL_002, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)
    print(f"Emitted {len(dataset['shawahid'])} Usuli shawahid to {OUT_USUL_002}")


if __name__ == "__main__":
    main()
