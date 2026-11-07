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
    # Secondary canonical shawahid for dual Usuli classifications in golden verses
    {
        "id": "2-43-2-4-mujmal-mubayyan",
        "verseKey": "2:43",
        "ayahNumber": 43,
        "wordStart": 2,
        "wordEnd": 4,
        "shahidPhraseAr": "الصَّلَاةَ وَآتُوا الزَّكَاةَ",
        "taxonomyId": "MUJMAL_MUBAYYAN",
        "categoryGroup": "WAADIH_MUBHAM",
        "linguisticTriggerAr": "لفظ مجمل افتقر إلى بيان السنة المطهرة",
        "defaultDalalahAr": "المجمل المفتقر للبيان",
        "actualDalalahAr": "المبيَّن بالسنة العملية والقولية",
        "hasQarinahSarifah": False,
        "qarinahTextAr": None,
        "qarinahVerseKey": None,
        "wajhAlDilalahAr": (
            "لفظ (الصلاة والزكاة) ورد مجملاً في أصل الوضع الشرعي، وبيّنت السنة النبوية "
            "القولية والفعلية أركانهما ومقاديرهما وشروطهما."
        ),
        "derivedFiqhRulingAr": "وجوب امتثال الصلاة والزكاة وفق البيان النبوي الشريف",
        "khilafUsuliAr": "تأخير البيان عن وقت الخطاب جائز إلى وقت الحاجة عند الجمهور",
        "classicalSources": ["المستصفى للغزالي", "أحكام القرآن للجصاص"],
        "extractionStage": "GOLDEN_SEED",
        "isCanonicalShahid": True,
    },
    {
        "id": "2-187-33-37-mafhum-ghayah",
        "verseKey": "2:187",
        "ayahNumber": 187,
        "wordStart": 33,
        "wordEnd": 37,
        "shahidPhraseAr": "حَتَّىٰ يَتَبَيَّنَ لَكُمُ الْخَيْطُ الْأَبْيَضُ",
        "taxonomyId": "MAFHUM_MUKHALAFAH_GHAYAH",
        "categoryGroup": "MANTOOQ_MAFHUM",
        "linguisticTriggerAr": "حرف الغاية (حتى)",
        "defaultDalalahAr": "انتهاء الحكم المغيّا",
        "actualDalalahAr": "مفهوم المخالفة للغاية المفيد للتحريم بعد طلوع الفجر",
        "hasQarinahSarifah": False,
        "qarinahTextAr": None,
        "qarinahVerseKey": None,
        "wajhAlDilalahAr": (
            "دلالة الغاية بـ(حتى) تدل بمنطوقها على إباحة الأكل إلى الفجر، "
            "وبمفهوم المخالفة على حرمة الأكل والشرب بمجرد تبين طلوع الفجر الصادق."
        ),
        "derivedFiqhRulingAr": "تحريم المفطرات ووجوب الإمساك بطلوع الفجر الصادق",
        "khilafUsuliAr": "مفهوم الغاية حجة متفق عليها عند القائلين بالمفاهيم",
        "classicalSources": ["المستصفى للغزالي", "الإحكام للآمدي"],
        "extractionStage": "GOLDEN_SEED",
        "isCanonicalShahid": True,
    },
    {
        "id": "2-196-49-50-mutlaq-baqi",
        "verseKey": "2:196",
        "ayahNumber": 196,
        "wordStart": 49,
        "wordEnd": 50,
        "shahidPhraseAr": "ثَلَاثَةِ أَيَّامٍ",
        "taxonomyId": "MUTLAQ_BAQI",
        "categoryGroup": "MUTLAQ_MUQAYYAD",
        "linguisticTriggerAr": "اسم جنس مجرد عن القيد اللفظي",
        "defaultDalalahAr": "المطلق الجاري على إطلاقه في الشياع",
        "actualDalalahAr": "المطلق الباقي على إطلاقه",
        "hasQarinahSarifah": False,
        "qarinahTextAr": None,
        "qarinahVerseKey": None,
        "wajhAlDilalahAr": (
            "لفظ (ثلاثة أيام) مطلق لم يقيد بالتتابع في نص التنزيل، فيبقى على إطلاقه "
            "ويجوز تفريق الصيام."
        ),
        "derivedFiqhRulingAr": "جواز صيام أيام التمتع الثلاثة متفرقة أو متتابعة لفاقد الهدي",
        "khilafUsuliAr": (
            "الحنفية قيّدوا المطلق بقراءة ابن مسعود (متتابعات)، والجمهور لا يقيّدون "
            "المطلق القرآني بقراءة الآحاد"
        ),
        "classicalSources": ["المستصفى للغزالي", "أحكام القرآن للجصاص"],
        "extractionStage": "GOLDEN_SEED",
        "isCanonicalShahid": True,
    },
    {
        "id": "2-221-3-3-amm-makhsus",
        "verseKey": "2:221",
        "ayahNumber": 221,
        "wordStart": 3,
        "wordEnd": 3,
        "shahidPhraseAr": "الْمُشْرِكَاتِ",
        "taxonomyId": "AMM_MAKHSUS_MUNFASIL",
        "categoryGroup": "AMM_KHASS",
        "linguisticTriggerAr": "جمع محلى بأل الاستغراقية مخصص بدليل منفصل",
        "defaultDalalahAr": "العموم الشامل لكل مشركة وكتابية",
        "actualDalalahAr": "العام المخصوص بنساء أهل الكتاب",
        "hasQarinahSarifah": True,
        "qarinahTextAr": "وَالْمُحْصَنَاتُ مِنَ الَّذِينَ أُوتُوا الْكِتَابَ",
        "qarinahVerseKey": "5:5",
        "wajhAlDilalahAr": (
            "لفظ (المشركات) عام في جميع الكافرات، خُص منه نساء أهل الكتاب بآية المائدة "
            "﴿وَالْمُحْصَنَاتُ مِنَ الَّذِينَ أُوتُوا الْكِتَابَ﴾ بمخصص منفصل."
        ),
        "derivedFiqhRulingAr": "جواز نكاح الكتابيات العفائف وتحريم نكاح الوثنيات والمشركات",
        "khilafUsuliAr": "تخصيص القرآن بالقرآن متفق على جوازه ودلالة العام بعد التخصيص ظنية عند الجمهور",
        "classicalSources": ["أحكام القرآن للجصاص", "الإحكام للآمدي", "المستصفى للغزالي"],
        "extractionStage": "GOLDEN_SEED",
        "isCanonicalShahid": True,
    },
    {
        "id": "2-228-5-5-mushtarak-lafzi",
        "verseKey": "2:228",
        "ayahNumber": 228,
        "wordStart": 5,
        "wordEnd": 5,
        "shahidPhraseAr": "قُرُوءٍ",
        "taxonomyId": "MUSHTARAK_LAFZI",
        "categoryGroup": "WAADIH_MUBHAM",
        "linguisticTriggerAr": "اسم مشترك لغوي بين معنيين متضادين",
        "defaultDalalahAr": "التردد بين الحيض والطهر",
        "actualDalalahAr": "المشترك المحمول على أحد معنييه بمرجح شرعي",
        "hasQarinahSarifah": True,
        "qarinahTextAr": "فَطَلِّقُوهُنَّ لِعِدَّتِهِنَّ",
        "qarinahVerseKey": "65:1",
        "wajhAlDilalahAr": (
            "لفظ (القرء) مشترك لغوي بين الطهر والحيض، حمله الشافعية والمالكية على الأطهار "
            "لقرينة التأنيث في العدد، وحمله الحنفية والحنابلة على الحيض لقرائن أخرى."
        ),
        "derivedFiqhRulingAr": "خلاف الفقهاء في انقضاء عدة المطلقة بالأطهار أو بالحيض",
        "khilafUsuliAr": "هل يجوز استعمال المشترك في كلا معنييه في سياق واحد؟",
        "classicalSources": ["المستصفى للغزالي", "أحكام القرآن للجصاص", "الإحكام للآمدي"],
        "extractionStage": "GOLDEN_SEED",
        "isCanonicalShahid": True,
    },
    {
        "id": "2-275-23-23-amm-makhsus",
        "verseKey": "2:275",
        "ayahNumber": 275,
        "wordStart": 23,
        "wordEnd": 23,
        "shahidPhraseAr": "الْبَيْعَ",
        "taxonomyId": "AMM_MAKHSUS_MUNFASIL",
        "categoryGroup": "AMM_KHASS",
        "linguisticTriggerAr": "مفرد محلى بأل الجنسية المفيدة للاستغراق والعموم",
        "defaultDalalahAr": "العموم الشامل لكل عقود البيع والمعاوضات",
        "actualDalalahAr": "العام المخصوص بالسنة النبوية",
        "hasQarinahSarifah": True,
        "qarinahTextAr": "نهى النبي ﷺ عن بيع الغرر",
        "qarinahVerseKey": None,
        "wajhAlDilalahAr": (
            "لفظ (البيع) مفرد معرف بأل الاستغراقية فيفيد عموم حل كل بيع، "
            "وخُص منه بالسنة النبوية بيوع الغرر والربا والمجهول والمعدوم."
        ),
        "derivedFiqhRulingAr": "أصل الإباحة والصحة في جميع العقود والمعاملات إلا ما خصه الدليل",
        "khilafUsuliAr": "تخصيص عموم الكتاب بالسنة الآحادية جائز عند الجمهور دون الحنفية",
        "classicalSources": ["أحكام القرآن للجصاص", "المستصفى للغزالي", "الإحكام للآمدي"],
        "extractionStage": "GOLDEN_SEED",
        "isCanonicalShahid": True,
    },
]

USULI_EXTRACTION_PROMPT: str = (
    "أنت خبير في أصول الفقه ودلالات الألفاظ وتفسير آيات الأحكام "
    "(كأحكام القرآن للجصاص وابن العربي والكيا الهراسي، والمستصفى للغزالي، "
    "والإحكام للآمدي، وإرشاد الفحول للشوكاني). حلل الآية والمواضع الصرفية المرشحة "
    "من سورة البقرة، واستخرج الشواهد الأصولية ودلالات الألفاظ مع تحرير (وجه الدلالة) "
    "و(القرينة الصارفة إن وجدت) و(الخلاف الأصولي) وفق المخطط المحدد."
)

STAGE2_ENRICHED_SHAWAHID: list[dict[str, Any]] = [
    {
        "id": "2-183-4-6-khabar-amr",
        "verseKey": "2:183",
        "ayahNumber": 183,
        "wordStart": 4,
        "wordEnd": 6,
        "shahidPhraseAr": "كُتِبَ عَلَيْكُمُ ٱلصِّيَامُ",
        "taxonomyId": "KHABAR_BIMAANA_AMR",
        "categoryGroup": "AMR_NAHY",
        "linguisticTriggerAr": "الإخبار بلفظ الفرض والكتب (كتب)",
        "defaultDalalahAr": "الخبر المحض",
        "actualDalalahAr": "الوجوب الحتمي المؤكد",
        "hasQarinahSarifah": True,
        "qarinahTextAr": "سياق التشريع والخطاب التكليفي",
        "qarinahVerseKey": "2:183",
        "wajhAlDilalahAr": (
            "لفظ (كُتِبَ) جملة خبرية لفظاً مراد بها الإنشاء والطلب الجازم، وصدرت بصيغة "
            "الإخبار للإشعار بأن الصيام فريضة متأصلة مقررة لا تقبل التردد."
        ),
        "derivedFiqhRulingAr": "وجوب صيام شهر رمضان فرض عين على المكلفين",
        "khilafUsuliAr": "دلالة مادة (كتب) وفرض على الوجوب قطعية كصيغة الأمر عند عامة الأصوليين",
        "classicalSources": ["أحكام القرآن للجصاص", "المستصفى للغزالي"],
        "extractionStage": "STAGE2_LLM_VERIFIED",
        "isCanonicalShahid": False,
    },
    {
        "id": "2-185-13-17-amr-wujub",
        "verseKey": "2:185",
        "ayahNumber": 185,
        "wordStart": 13,
        "wordEnd": 17,
        "shahidPhraseAr": "فَمَن شَهِدَ مِنكُمُ ٱلشَّهْرَ فَلْيَصُمْهُ",
        "taxonomyId": "AMR_WUJUB",
        "categoryGroup": "AMR_NAHY",
        "linguisticTriggerAr": "اسم شرط عام (من) مقترن بجوابه المتضمن للام الأمر (فليصمه)",
        "defaultDalalahAr": "الوجوب المطلق",
        "actualDalalahAr": "الوجوب العيني المنسوخ به التخيير المتقدم",
        "hasQarinahSarifah": True,
        "qarinahTextAr": "وَعَلَى الَّذِينَ يُطِيقُونَهُ فِدْيَةٌ طَعَامُ مِسْكِينٍ",
        "qarinahVerseKey": "2:184",
        "wajhAlDilalahAr": (
            "صيغة أمر بلام الأمر (فليصمه) بعد شرط عام (فمن شهد)، نسخت التخيير المتقدم في "
            "آية الفدية (2:184) وأوجبت الصيام عيناً على كل قادر غير مسافر."
        ),
        "derivedFiqhRulingAr": "فرضيّة الصوم العينية على من شهد الشهر صحيحاً مقيماً",
        "khilafUsuliAr": "نسخ القرآن بالقرآن ونسخ التخيير بالتعيين مجمع عليه عند الأصوليين",
        "classicalSources": ["أحكام القرآن للجصاص", "المستصفى للغزالي", "الإحكام للآمدي"],
        "extractionStage": "STAGE2_LLM_VERIFIED",
        "isCanonicalShahid": False,
    },
    {
        "id": "2-238-1-5-amm-makhsus",
        "verseKey": "2:238",
        "ayahNumber": 238,
        "wordStart": 1,
        "wordEnd": 5,
        "shahidPhraseAr": "حَٰفِظُوا۟ عَلَى ٱلصَّلَوَٰتِ وَٱلصَّلَوٰةِ ٱلْوُسْطَىٰ",
        "taxonomyId": "AMM_MAKHSUS_MUTTASIL",
        "categoryGroup": "AMM_KHASS",
        "linguisticTriggerAr": "عطف الخاص (الصلاة الوسطى) على العام (الصلوات)",
        "defaultDalalahAr": "دخول الخاص في عموم الصلوات",
        "actualDalalahAr": "العام المعطوف عليه خاص لمزيد العناية والفضل دون خروج من الوجوب",
        "hasQarinahSarifah": False,
        "qarinahTextAr": None,
        "qarinahVerseKey": None,
        "wajhAlDilalahAr": (
            "لفظ (الصلوات) جمع محلى بأل يفيد استغراق الفرائض كلها، وعطف (الصلاة الوسطى) "
            "عليها عطف خاص على عام للتنويه بشأنها ومزيد التأكيد على المحافظة عليها."
        ),
        "derivedFiqhRulingAr": "وجوب المحافظة على الصلوات الخمس والتأكيد على صلاة العصر",
        "khilafUsuliAr": "عطف الخاص على العام لا يخرجه من حكم العام عند جماهير الأصوليين",
        "classicalSources": ["أحكام القرآن لابن العربي", "المستصفى للغزالي"],
        "extractionStage": "STAGE2_LLM_VERIFIED",
        "isCanonicalShahid": False,
    },
    {
        "id": "2-278-6-10-amr-wujub",
        "verseKey": "2:278",
        "ayahNumber": 278,
        "wordStart": 6,
        "wordEnd": 10,
        "shahidPhraseAr": "وَذَرُوا۟ مَا بَقِىَ مِنَ ٱلرِّبَوٰٓا۟",
        "taxonomyId": "AMR_WUJUB",
        "categoryGroup": "AMR_NAHY",
        "linguisticTriggerAr": "فعل أمر صريح دال على الترك (ذروا)",
        "defaultDalalahAr": "الوجوب",
        "actualDalalahAr": "الوجوب القطعي لترك بقايا الربا وبطلانها",
        "hasQarinahSarifah": False,
        "qarinahTextAr": None,
        "qarinahVerseKey": None,
        "wajhAlDilalahAr": (
            "صيغة الأمر (ذروا) تقتضي وجوب الكف فوراً وبطلان استيفاء أي ربا مشروط "
            "في المعاملات الجارية قبل ورود النهي."
        ),
        "derivedFiqhRulingAr": "تحريم استيفاء أي زيادة ربوية وبطلان ترتبها في الذمة شرعاً",
        "khilafUsuliAr": "الأمر بالترك يقتضي النهي عن الفعل والنهي يقتضي الفساد والبطلان",
        "classicalSources": ["أحكام القرآن للجصاص", "الإحكام للآمدي"],
        "extractionStage": "STAGE2_LLM_VERIFIED",
        "isCanonicalShahid": False,
    },
    {
        "id": "2-283-14-17-amr-wujub",
        "verseKey": "2:283",
        "ayahNumber": 283,
        "wordStart": 14,
        "wordEnd": 17,
        "shahidPhraseAr": "فَلْيُؤَدِّ ٱلَّذِى ٱؤْتُمِنَ أَمَٰنَتَهُۥ",
        "taxonomyId": "AMR_WUJUB",
        "categoryGroup": "AMR_NAHY",
        "linguisticTriggerAr": "لام الأمر المقترنة بالفعل المضارع المجزوم (فليؤد)",
        "defaultDalalahAr": "الوجوب",
        "actualDalalahAr": "الوجوب العيني للأداء وهو القرينة الصارفة لأمر الكتابة في 2:282",
        "hasQarinahSarifah": False,
        "qarinahTextAr": None,
        "qarinahVerseKey": "2:282",
        "wajhAlDilalahAr": (
            "صيغة أمر بلام الأمر تفيد وجوب أداء الأمانة والوفاء بالدين عند الائتمان، "
            "وهي القرينة الصارفة لأمر الكتابة في الآية السابقة (2:282 فاكتبوه) إلى الندب والإرشاد."
        ),
        "derivedFiqhRulingAr": "وجوب أداء الأمانات والديون عند الائتمان وسقوط شرط الكتابة",
        "khilafUsuliAr": "الجمهور استدلوا بهذه الآية على صرف الأمر في آية المداينة من الوجوب للندب",
        "classicalSources": ["أحكام القرآن للجصاص", "المستصفى للغزالي", "إرشاد الفحول للشوكاني"],
        "extractionStage": "STAGE2_LLM_VERIFIED",
        "isCanonicalShahid": False,
    },
]


def make_candidate(
    *,
    id_: str,
    verse_key: str,
    ayah_number: int,
    word_start: int,
    word_end: int,
    shahid_phrase_ar: str,
    taxonomy_id: str,
    category_group: str,
    linguistic_trigger_ar: str,
    default_dalalah_ar: str,
    actual_dalalah_ar: str,
    has_qarinah_sarifah: bool = False,
    qarinah_text_ar: str | None = None,
    qarinah_verse_key: str | None = None,
    wajh_al_dilalah_ar: str,
    derived_fiqh_ruling_ar: str,
    khilaf_usuli_ar: str | None = None,
    classical_sources: list[str] | None = None,
    extraction_stage: str = "STAGE1_RULE_ONLY",
    is_canonical_shahid: bool = False,
) -> dict[str, Any]:
    """Factory helper to eliminate candidate structure duplication."""
    return {
        "id": id_,
        "verseKey": verse_key,
        "ayahNumber": ayah_number,
        "wordStart": word_start,
        "wordEnd": word_end,
        "shahidPhraseAr": shahid_phrase_ar,
        "taxonomyId": taxonomy_id,
        "categoryGroup": category_group,
        "linguisticTriggerAr": linguistic_trigger_ar,
        "defaultDalalahAr": default_dalalah_ar,
        "actualDalalahAr": actual_dalalah_ar,
        "hasQarinahSarifah": has_qarinah_sarifah,
        "qarinahTextAr": qarinah_text_ar,
        "qarinahVerseKey": qarinah_verse_key,
        "wajhAlDilalahAr": wajh_al_dilalah_ar,
        "derivedFiqhRulingAr": derived_fiqh_ruling_ar,
        "khilafUsuliAr": khilaf_usuli_ar,
        "classicalSources": classical_sources or ["المستصفى للغزالي"],
        "extractionStage": extraction_stage,
        "isCanonicalShahid": is_canonical_shahid,
    }


def is_dua_context(words: list[dict[str, Any]], idx: int) -> bool:
    """Detects vocative context to exclude supplications from legal commands/prohibitions."""
    for i in range(max(0, idx - 3), min(len(words), idx + 4)):
        w = words[i]
        text = w.get("a", "")
        if "رَبَّ" in text or "رَبِّ" in text or "اللَّهُمَّ" in text:
            return True
        if any(s.get("p") == "VOC" for s in w.get("s", [])):
            return True
    return False


def scan_stage1_candidates(verse: dict[str, Any]) -> list[dict[str, Any]]:
    """Deterministic candidate scanner over verse morphology."""
    v_num = verse["v"]
    words: list[dict[str, Any]] = verse["w"]
    candidates: list[dict[str, Any]] = []

    for idx, word in enumerate(words):
        w_num = word["n"]
        segments: list[dict[str, Any]] = word.get("s", [])

        # 1. Check for Imperative (CAND_AMR: POS=V with MOOD=IMP or POS=V with MOOD=JUS + prefix IMPV)
        has_imp = False
        has_lam_amr = False
        for s in segments:
            if s.get("p") == "V" and s.get("f", {}).get("mood") == "IMP":
                has_imp = True
            if s.get("p") == "IMPV" and any(
                v.get("p") == "V" and v.get("f", {}).get("mood") == "JUS" for v in segments
            ):
                has_lam_amr = True

        if (has_imp or has_lam_amr) and not is_dua_context(words, idx):
            candidates.append(
                make_candidate(
                    id_=f"2-{v_num}-{w_num}-{w_num}-cand-amr",
                    verse_key=f"2:{v_num}",
                    ayah_number=v_num,
                    word_start=w_num,
                    word_end=w_num,
                    shahid_phrase_ar=word["a"],
                    taxonomy_id="AMR_WUJUB",
                    category_group="AMR_NAHY",
                    linguistic_trigger_ar="صيغة أمر صريح",
                    default_dalalah_ar="الوجوب",
                    actual_dalalah_ar="الوجوب",
                    wajh_al_dilalah_ar="صيغة أمر تدل بأصل وضعها اللغوي والشرعي على الوجوب",
                    derived_fiqh_ruling_ar="طلب الفعل طلباً جازماً يقتضي الامتثال",
                )
            )

        # 2. Check for Prohibitive (CAND_NAHY: POS=PRO لا الناهية + POS=V with MOOD=JUS)
        has_pro = any(s.get("p") == "PRO" for s in segments)
        if has_pro and idx + 1 < len(words) and not is_dua_context(words, idx):
            next_word = words[idx + 1]
            next_segs = next_word.get("s", [])
            is_jus_verb = any(
                s.get("p") == "V" and s.get("f", {}).get("mood") == "JUS" for s in next_segs
            )
            if is_jus_verb:
                phrase = f"{word['a']} {next_word['a']}"
                candidates.append(
                    make_candidate(
                        id_=f"2-{v_num}-{w_num}-{next_word['n']}-cand-nahy",
                        verse_key=f"2:{v_num}",
                        ayah_number=v_num,
                        word_start=w_num,
                        word_end=next_word["n"],
                        shahid_phrase_ar=phrase,
                        taxonomy_id="NAHY_TAHRIM",
                        category_group="AMR_NAHY",
                        linguistic_trigger_ar="لا الناهية المقترنة بالمضارع المجزوم",
                        default_dalalah_ar="التحريم والفساد",
                        actual_dalalah_ar="التحريم والفساد",
                        wajh_al_dilalah_ar="صيغة نهي صريحة تقتضي التحريم وفساد المنهي عنه عند الإطلاق",
                        derived_fiqh_ruling_ar="تحريم الفعل المنهي عنه وبطلان ترتبه شرعاً",
                        classical_sources=["الإحكام للآمدي"],
                    )
                )

        # 3. Check for Exception Particle (CAND_TAKHSIS_MUTTASIL: POS=EXP إلا)
        has_exp = any(s.get("p") == "EXP" for s in segments)
        if has_exp and idx + 1 < len(words):
            next_word = words[idx + 1]
            candidates.append(
                make_candidate(
                    id_=f"2-{v_num}-{w_num}-{next_word['n']}-cand-istithna",
                    verse_key=f"2:{v_num}",
                    ayah_number=v_num,
                    word_start=w_num,
                    word_end=next_word["n"],
                    shahid_phrase_ar=f"{word['a']} {next_word['a']}",
                    taxonomy_id="AMM_MAKHSUS_MUTTASIL",
                    category_group="AMM_KHASS",
                    linguistic_trigger_ar="أداة الاستثناء المتصل (إلا)",
                    default_dalalah_ar="إخراج ما لولاه لدخل في الخطاب",
                    actual_dalalah_ar="العام المخصوص بالاستثناء المتصل",
                    wajh_al_dilalah_ar="الاستثناء معيار العموم ومخرج لبعض أفراد العام المتصل به",
                    derived_fiqh_ruling_ar="قصر الحكم العام على غير المستثنى وحكم المستثنى على النقيض",
                    classical_sources=["المستصفى للغزالي"],
                )
            )

        # 4. Check for Indefinite Noun in Negative/Condition Context (CAND_AMM_NAKIRA_SIYAQ)
        has_neg_or_cond = any(s.get("p") in ("NEG", "COND") for s in segments)
        if has_neg_or_cond:
            for j in range(idx + 1, min(len(words), idx + 4)):
                cand_w = words[j]
                cand_segs = cand_w.get("s", [])
                is_indef_noun = any(
                    s.get("p") == "N" and s.get("f", {}).get("state") == "INDEF" for s in cand_segs
                )
                if is_indef_noun:
                    candidates.append(
                        make_candidate(
                            id_=f"2-{v_num}-{w_num}-{cand_w['n']}-cand-nakira-siyaq",
                            verse_key=f"2:{v_num}",
                            ayah_number=v_num,
                            word_start=w_num,
                            word_end=cand_w["n"],
                            shahid_phrase_ar=" ".join(words[k]["a"] for k in range(idx, j + 1)),
                            taxonomy_id="AMM_BAQI",
                            category_group="AMM_KHASS",
                            linguistic_trigger_ar="النكرة في سياق النفي أو الشرط",
                            default_dalalah_ar="العموم الشمولي الاستغراقي",
                            actual_dalalah_ar="العام الباقي على عمومه",
                            wajh_al_dilalah_ar="النكرة إذا وردت في سياق النفي أو الشرط دلت على العموم قطعا أو ظاهرا",
                            derived_fiqh_ruling_ar="شمول نفي أو تعليق الحكم لجميع أفراد الجنس",
                            classical_sources=["المستصفى للغزالي", "إرشاد الفحول للشوكاني"],
                        )
                    )
                    break

        # 5. Check for General Pronouns / Particles and Plural with DET (CAND_AMM_SHART_MAWSUL)
        has_shart_or_mawsul = word["a"] in ("مَن", "مَا", "كُلّ", "جَمِيع", "ٱلَّذِينَ") or any(
            s.get("p") == "REL" for s in segments
        )
        is_plural_with_det = any(
            s.get("p") == "N" and s.get("f", {}).get("num") == "P" for s in segments
        ) and any(s.get("p") == "DET" for s in segments)
        if (has_shart_or_mawsul or is_plural_with_det) and not is_dua_context(words, idx):
            candidates.append(
                make_candidate(
                    id_=f"2-{v_num}-{w_num}-{w_num}-cand-amm-mawsul",
                    verse_key=f"2:{v_num}",
                    ayah_number=v_num,
                    word_start=w_num,
                    word_end=w_num,
                    shahid_phrase_ar=word["a"],
                    taxonomy_id="AMM_BAQI",
                    category_group="AMM_KHASS",
                    linguistic_trigger_ar="الأسماء الموصولة وصيغ العموم الشمولية",
                    default_dalalah_ar="استغراق جميع الأفراد الصالحة للفظ",
                    actual_dalalah_ar="العام الباقي على عمومه",
                    wajh_al_dilalah_ar="الاسم الموصول أو المعرف بأل الاستغراقية يفيد العموم لجميع ما يصدق عليه",
                    derived_fiqh_ruling_ar="شمول الحكم العام لكل فرد يدخل تحت اللفظ",
                    classical_sources=["المستصفى للغزالي"],
                )
            )

    return candidates


def build_usul_spike_dataset() -> dict[str, Any]:
    """Generates the full Surah 2 Usul dataset."""
    with open(SURAH_002_PATH, encoding="utf-8") as f:
        surah_data = json.load(f)

    all_shawahid: list[dict[str, Any]] = list(GOLDEN_SEED) + list(STAGE2_ENRICHED_SHAWAHID)
    reserved_verse_keys = {g["verseKey"] for g in all_shawahid}

    for verse in surah_data.get("verses", []):
        v_key = f"2:{verse['v']}"
        # For non-golden/non-enriched verses, scan Stage 1 syntactic candidates
        if v_key not in reserved_verse_keys:
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
