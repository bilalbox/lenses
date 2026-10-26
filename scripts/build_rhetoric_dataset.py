#!/usr/bin/env python3
"""Build public/data/quran/rhetoric.json by merging rhetorical catalog,
Uthmani verse text from public/data/quran/surah/*.json, and translations
from QuranEnc (english_saheeh and indonesian_sabiq).
"""

import json
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SURAH_DIR = ROOT / "public" / "data" / "quran" / "surah"
MANIFEST_FILE = ROOT / "public" / "data" / "quran" / "manifest.json"
CACHE_DIR = ROOT / "data" / "cache" / "quranenc_translations"
CACHE_DIR.mkdir(parents=True, exist_ok=True)
OUT_FILE = ROOT / "public" / "data" / "quran" / "rhetoric.json"

# Load surah metadata
manifest = json.loads(MANIFEST_FILE.read_text(encoding="utf-8"))
unit_map = {u["n"]: u for u in manifest["units"]}

# Cache surah files
surah_files = {}

def get_arabic_ayah(sura: int, verse: int) -> str:
    if sura not in surah_files:
        p = SURAH_DIR / f"{sura:03d}.json"
        surah_files[sura] = json.loads(p.read_text(encoding="utf-8"))
    for v in surah_files[sura]["verses"]:
        if v["v"] == verse:
            return v["ar"]
    raise ValueError(f"Verse {sura}:{verse} not found in surah file")

def fetch_quranenc_translation(key: str, sura: int, verse: int) -> str:
    cache_path = CACHE_DIR / f"{key}_{sura:03d}_{verse:03d}.json"
    if cache_path.exists():
        d = json.loads(cache_path.read_text(encoding="utf-8"))
        return d["result"]["translation"]
    
    url = f"https://quranenc.com/api/v1/translation/aya/{key}/{sura}/{verse}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    print(f"Fetching {key} for {sura}:{verse}...")
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                cache_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
                time.sleep(0.1)
                return data["result"]["translation"]
        except Exception as e:
            print(f"  Attempt {attempt + 1} failed: {e}")
            time.sleep(1)
    raise RuntimeError(f"Could not fetch {key} for {sura}:{verse}")

# Raw definitions for Tashbih (Simile), Hadhf (Ellipsis), and Classical Balaghah
TASHBIH_RAW = [
    {
        "sura": 59, "verse": 21,
        "highlight": "لَوْ أَنزَلْنَا هَٰذَا ٱلْقُرْءَانَ عَلَىٰ جَبَلٍ لَّرَأَيْتَهُۥ خَٰشِعًا مُّتَصَدِّعًا",
        "subtypes": ["تشبيه تمثيلي", "مرسل", "مجمل"],
        "tashbih": {
            "tamthili": True,
            "adat": "لو (في سياق الفرض والتمثيل)",
            "adatType": "mursal",
            "mushabbah": "قُلُوبُ النَّاسِ حَالَ سَمَاعِ الْقُرْآنِ وَتَدَبُّرِهِ",
            "mushabbahBihi": "جَبَلٌ عَظِيمٌ صَلْدٌ خَاشِعٌ مُتَصَدِّعٌ مِنْ خَشْيَةِ اللَّهِ",
            "wajh": "شِدَّةُ التَّأَثُّرِ وَالْخُشُوعِ لِعَظَمَةِ كَلَامِ اللَّهِ وَقُوَّةِ سُلْطَانِهِ",
            "wajhType": "mujmal",
            "baligh": False,
            "classificationAr": "تمثيلي مرسل مجمل",
            "classificationEn": "Compound Analogy (Mursal Mujmal)"
        },
        "note": {
            "source": "تفسير أبي السعود والسمين الحلبي (الدر المصون)",
            "text": "تمثيل وتصوير لعظمة القرآن وقوة تأثيره في القلوب، وتوبيخ للإنسان على قسوة قلبه وعدم تخشعه."
        }
    },
    {
        "sura": 2, "verse": 17,
        "highlight": "مَثَلُهُمْ كَمَثَلِ ٱلَّذِى ٱسْتَوْقَدَ نَارًا",
        "subtypes": ["تشبيه تمثيلي", "مرسل", "مجمل"],
        "tashbih": {
            "tamthili": True,
            "adat": "كَمَثَلِ",
            "adatType": "mursal",
            "mushabbah": "حَالُ الْمُنَافِقِينَ فِي كُفْرِهِمْ ثُمَّ رُؤْيَتِهِمْ بَصِيصَ الْحَقِّ ثُمَّ انْطِفَائِهِ",
            "mushabbahBihi": "الَّذِي اسْتَوْقَدَ نَارًا فَلَمَّا أَضَاءَتْ حَوْلَهُ ذَهَبَ اللَّهُ بِنُورِهِمْ",
            "wajh": "ذَهَابُ النُّورِ وَالْبَقَاءُ فِي الْحَيْرَةِ وَالظُّلْمَةِ بَعْدَ الْأَمْنِ",
            "wajhType": "mujmal",
            "baligh": False,
            "classificationAr": "تمثيلي مرسل مجمل",
            "classificationEn": "Compound Analogy (Mursal Mujmal)"
        },
        "note": {
            "source": "تفسير الزمخشري (الكشاف) وأبو السعود",
            "text": "تشبيه تمثيلي مركب؛ شُبّهت حال المنافقين بحال مستوقد نار في ليلة مظلمة انطفأت ناره فبقي متحيراً."
        }
    },
    {
        "sura": 2, "verse": 19,
        "highlight": "أَوْ كَصَيِّبٍ مِّنَ ٱلسَّمَآءِ فِيهِ ظُلُمَٰتٌ وَرَعْدٌ وَبَرْقٌ",
        "subtypes": ["تشبيه تمثيلي", "مرسل", "مجمل"],
        "tashbih": {
            "tamthili": True,
            "adat": "أَوْ كَصَيِّبٍ (الكاف)",
            "adatType": "mursal",
            "mushabbah": "حَالُ الْمُنَافِقِينَ مَعَ مَا فِي الْقُرْآنِ مِنْ زَوَاجِرَ وَوَعِيدٍ وَتَكَالِيفَ",
            "mushabbahBihi": "أَصْحَابُ صَيِّبٍ فِيهِ ظُلُمَاتٌ وَرَعْدٌ وَبَرْقٌ يَجْعَلُونَ أَصَابِعَهُمْ فِي آذَانِهِمْ حَذَرَ الْمَوْتِ",
            "wajh": "شِدَّةُ الْفَزَعِ وَالْحَيْرَةِ وَمُحَاوَلَةُ الِاتِّقَاءِ مِمَّا لَا يُنْجِي",
            "wajhType": "mujmal",
            "baligh": False,
            "classificationAr": "تمثيلي مرسل مجمل",
            "classificationEn": "Compound Analogy (Mursal Mujmal)"
        },
        "note": {
            "source": "تفسير البيضاوي وابن عاشور",
            "text": "المثل المائي للمنافقين وهو أبلغ في تصوير الاضطراب والهلع الحسي والنفسي."
        }
    },
    {
        "sura": 2, "verse": 74,
        "highlight": "ثُمَّ قَسَتْ قُلُوبُكُم مِّنۢ بَعْدِ ذَٰلِكَ فَهِىَ كَٱلْحِجَارَةِ أَوْ أَشَدُّ قَسْوَةً",
        "subtypes": ["تشبيه مفرد", "مرسل", "مجمل"],
        "tashbih": {
            "tamthili": False,
            "adat": "كَـ (كَالْحِجَارَةِ)",
            "adatType": "mursal",
            "mushabbah": "قُلُوبُ بَنِي إِسْرَائِيلَ بَعْدَ مُعَايَنَةِ الْمُعْجِزَاتِ",
            "mushabbahBihi": "الْحِجَارَةُ الصَّلْدَةُ",
            "wajh": "الْقَسْوَةُ وَعَدَمُ اللِّينِ وَعَدَمُ التَّأَثُّرِ بِالْمَوَاعِظِ",
            "wajhType": "mujmal",
            "baligh": False,
            "classificationAr": "مفرد مرسل مجمل",
            "classificationEn": "Single-Element Analogy (Mursal Mujmal)"
        },
        "note": {
            "source": "تفسير النسفي وأبو السعود",
            "text": "تشبيه مفرد صريح، وتفضيل الحجارة عليها ببيان أن من الحجارة ما يتفجر منه الأنهار."
        }
    },
    {
        "sura": 2, "verse": 171,
        "highlight": "وَمَثَلُ ٱلَّذِينَ كَفَرُوا۟ كَمَثَلِ ٱلَّذِى يَنْعِقُ بِمَا لَا يَسْمَعُ إِلَّا دُعَآءً وَنِدَآءً",
        "subtypes": ["تشبيه تمثيلي", "مرسل", "مجمل"],
        "tashbih": {
            "tamthili": True,
            "adat": "كَمَثَلِ",
            "adatType": "mursal",
            "mushabbah": "دَاعِي الْكُفَّارِ إِلَى الْهُدَى مَعَ عَدَمِ فَهْمِهِمْ",
            "mushabbahBihi": "الرَّاعِي الَّذِي يَنْعِقُ بِالْبَهَائِمِ فَلَا تَفْقَهُ إِلَّا مُجَرَّدَ الصَّوْتِ",
            "wajh": "سَمَاعُ الصَّوْتِ الْمُجَرَّدِ دُونَ إِدْرَاكِ الْمَعْنَى وَالِانْتِفَاعِ بِهِ",
            "wajhType": "mujmal",
            "baligh": False,
            "classificationAr": "تمثيلي مرسل مجمل",
            "classificationEn": "Compound Analogy (Mursal Mujmal)"
        },
        "note": {
            "source": "تفسير الطبري وابن عطية",
            "text": "تمثيل شاع في البلاغة؛ شُبّه الكفار في عدم فقههم بالدواب التي تسمع جرس الصوت ولا تعقل معناه."
        }
    },
    {
        "sura": 2, "verse": 261,
        "highlight": "مَّثَلُ ٱلَّذِينَ يُنفِقُونَ أَمْوَٰلَهُمْ فِى سَبِيلِ ٱللَّهِ كَمَثَلِ حَبَّةٍ أَنۢبَتَتْ سَبْعَ سَنَابِلَ",
        "subtypes": ["تشبيه تمثيلي", "مرسل", "مجمل"],
        "tashbih": {
            "tamthili": True,
            "adat": "كَمَثَلِ",
            "adatType": "mursal",
            "mushabbah": "نَفَقَةُ الْمُتَصَدِّقِ فِي سَبِيلِ اللَّهِ وَمُضَاعَفَةُ أَجْرِهَا",
            "mushabbahBihi": "حَبَّةٍ أَنْبَتَتْ سَبْعَ سَنَابِلَ فِي كُلِّ سُنْبُلَةٍ مِائَةُ حَبَّةٍ",
            "wajh": "مُضَاعَفَةُ النَّمَاءِ وَالْبَرَكَةِ وَعِظَمُ الْأَجْرِ مِنْ قَلِيلٍ",
            "wajhType": "mujmal",
            "baligh": False,
            "classificationAr": "تمثيلي مرسل مجمل",
            "classificationEn": "Compound Analogy (Mursal Mujmal)"
        },
        "note": {
            "source": "تفسير القرطبي وابن كثير",
            "text": "تمثيل بديع لحسن عاقبة الصدقة وإرباء الأجر الإلهي لأعمال البر."
        }
    },
    {
        "sura": 2, "verse": 264,
        "highlight": "فَمَثَلُهُۥ كَمَثَلِ صَفْوَانٍ عَلَيْهِ تُرَابٌ فَأَصَابَهُۥ وَابِلٌ فَتَرَكَهُۥ صَلْدًا",
        "subtypes": ["تشبيه تمثيلي", "مرسل", "مجمل"],
        "tashbih": {
            "tamthili": True,
            "adat": "كَمَثَلِ",
            "adatType": "mursal",
            "mushabbah": "الْمُنْفِقُ رِئَاءَ النَّاسِ الْمُتْبِعُ نَفَقَتَهُ بِالْمَنِّ وَالْأَذَى",
            "mushabbahBihi": "صَفْوَانٍ عَلَيْهِ تُرَابٌ فَأَصَابَهُ وَابِلٌ فَتَرَكَهُ صَلْدًا",
            "wajh": "زَوَالُ الْأَثَرِ وَذَهَابُ الْعَمَلِ هَبَاءً دُونَ بَقَاءِ نَفْعٍ",
            "wajhType": "mujmal",
            "baligh": False,
            "classificationAr": "تمثيلي مرسل مجمل",
            "classificationEn": "Compound Analogy (Mursal Mujmal)"
        },
        "note": {
            "source": "تفسير الزمخشري والبغوي",
            "text": "تصوير حسي بليغ لإحباط العمل بالرياء والأذى كالحجر الأملس الذي يجرفه المطر."
        }
    },
    {
        "sura": 2, "verse": 265,
        "highlight": "وَمَثَلُ ٱلَّذِينَ يُنفِقُونَ أَمْوَٰلَهُمُ ٱبْتِغَآءَ مَرْضَاتِ ٱللَّهِ وَتَثْبِيتًا مِّنْ أَنفُسِهِمْ كَمَثَلِ جَنَّةٍۭ بِرَبْوَةٍ",
        "subtypes": ["تشبيه تمثيلي", "مرسل", "مجمل"],
        "tashbih": {
            "tamthili": True,
            "adat": "كَمَثَلِ",
            "adatType": "mursal",
            "mushabbah": "نَفَقَةُ الْمُؤْمِنِينَ الْمُخْلِصِينَ وَنَمَاؤُهَا عِنْدَ اللَّهِ",
            "mushabbahBihi": "جَنَّةٍ بِرَبْوَةٍ أَصَابَهَا وَابِلٌ فَآتَتْ أُكُلَهَا ضِعْفَيْنِ",
            "wajh": "الرَّيْعُ وَالْبَرَكَةُ وَالنَّجَاحُ فِي جَمِيعِ الْأَحْوَالِ غَزِيرِهَا وَطَلِّهَا",
            "wajhType": "mujmal",
            "baligh": False,
            "classificationAr": "تمثيلي مرسل مجمل",
            "classificationEn": "Compound Analogy (Mursal Mujmal)"
        },
        "note": {
            "source": "تفسير ابن عاشور وأبو السعود",
            "text": "مقابلة تمثيلية دقيقة مع مثل المرائي؛ فالأولى حجر صلد أملس، وهذه بستان خصب على مرتفع ناضر."
        }
    },
    {
        "sura": 3, "verse": 117,
        "highlight": "مَثَلُ مَا يُنفِقُونَ فِى هَٰذِهِ ٱلْحَيَوٰةِ ٱلدُّنْيَا كَمَثَلِ رِيحٍ فِيهَا صِرٌّ",
        "subtypes": ["تشبيه تمثيلي", "مرسل", "مجمل"],
        "tashbih": {
            "tamthili": True,
            "adat": "كَمَثَلِ",
            "adatType": "mursal",
            "mushabbah": "مَا يُنْفِقُهُ الْكُفَّارُ فِي الدُّنْيَا يَبْتَغُونَ بِهِ الْفَخْرَ وَالثَّوَابَ",
            "mushabbahBihi": "رِيحٍ فِيهَا صِرٌّ أَصَابَتْ حَرْثَ قَوْمٍ ظَلَمُوا أَنْفُسَهُمْ فَأَهْلَكَتْهُ",
            "wajh": "هَلَاكُ الْعَمَلِ وَخَيْبَةُ الرَّجَاءِ عِنْدَ أَمَسِّ الْحَاجَةِ إِلَيْهِ",
            "wajhType": "mujmal",
            "baligh": False,
            "classificationAr": "تمثيلي مرسل مجمل",
            "classificationEn": "Compound Analogy (Mursal Mujmal)"
        },
        "note": {
            "source": "تفسير السعدي والدر المصون",
            "text": "الصِرّ هو البرد الشديد؛ والتمثيل يصوّر كيف يحرق الصقيع الزرع فكذلك الكفر يحرق الأعمال."
        }
    },
    {
        "sura": 7, "verse": 176,
        "highlight": "فَمَثَلُهُۥ كَمَثَلِ ٱلْكَلْبِ إِن تَحْمِلْ عَلَيْهِ يَلْهَثْ أَوْ تَتْرُكْهُ يَلْهَث",
        "subtypes": ["تشبيه تمثيلي", "مرسل", "مجمل"],
        "tashbih": {
            "tamthili": True,
            "adat": "كَمَثَلِ",
            "adatType": "mursal",
            "mushabbah": "مَنِ انْسَلَخَ مِنْ آيَاتِ اللَّهِ وَاتَّبَعَ هَوَاهُ فِي دَوَامِ ضَلَالِهِ",
            "mushabbahBihi": "الْكَلْبِ إِنْ تَحْمِلْ عَلَيْهِ يَلْهَثْ أَوْ تَتْرُكْهُ يَلْهَثْ",
            "wajh": "دَوَامُ اللَّهَفِ وَالْحِرْصِ وَانْقِطَاعُ الرَّجَاءِ فِي جَمِيعِ الْأَحْوَالِ",
            "wajhType": "mujmal",
            "baligh": False,
            "classificationAr": "تمثيلي مرسل مجمل",
            "classificationEn": "Compound Analogy (Mursal Mujmal)"
        },
        "note": {
            "source": "تفسير الزمخشري وابن القيم (أمثال القرآن)",
            "text": "أبلغ ما ضُرب مثلاً لمن آثر الهوى على الهدى؛ فإنه في لهث دائم لا ينفك عنه."
        }
    },
    {
        "sura": 10, "verse": 24,
        "highlight": "إِنَّمَا مَثَلُ ٱلْحَيَوٰةِ ٱلدُّنْيَا كَمَآءٍ أَنزَلْنَٰهُ مِنَ ٱلسَّمَآءِ",
        "subtypes": ["تشبيه تمثيلي", "مرسل", "مجمل"],
        "tashbih": {
            "tamthili": True,
            "adat": "كَمَاءِ (الكاف)",
            "adatType": "mursal",
            "mushabbah": "زِينَةُ الْحَيَاةِ الدُّنْيَا وَسُرْعَةُ زَوَالِهَا بَعْدَ بَهْجَتِهَا",
            "mushabbahBihi": "مَاءٍ أَنْزَلْنَاهُ فَاخْتَلَطَ بِهِ نَبَاتُ الْأَرْضِ حَتَّى إِذَا أَخَذَتْ زُخْرُفَهَا أَتَاهَا أَمْرُنَا فَنَسَفَهَا",
            "wajh": "الْغُرُورُ بِالْإِقْبَالِ ثُمَّ الْمُفَاجَأَةُ بِالِانْصِرَامِ وَالْفَنَاءِ",
            "wajhType": "mujmal",
            "baligh": False,
            "classificationAr": "تمثيلي مرسل مجمل",
            "classificationEn": "Compound Analogy (Mursal Mujmal)"
        },
        "note": {
            "source": "تفسير الطبري وأبو السعود",
            "text": "مثل بديع يجمع أطوار الدنيا من النشأة والنماء والازدهار والغرور إلى الهلاك المباغت."
        }
    },
    {
        "sura": 11, "verse": 24,
        "highlight": "مَثَلُ ٱلْفَرِيقَيْنِ كَٱلْأَعْمَىٰ وَٱلْأَصَمِّ وَٱلْبَصِيرِ وَٱلسَّمِيعِ",
        "subtypes": ["تشبيه مركب", "مرسل", "مجمل"],
        "tashbih": {
            "tamthili": False,
            "adat": "كَـ (كَالْأَعْمَىٰ)",
            "adatType": "mursal",
            "mushabbah": "فَرِيقُ الْكُفَّارِ وَفَرِيقُ الْمُؤْمِنِينَ",
            "mushabbahBihi": "الْأَعْمَى وَالْأَصَمِّ مُقَابِلَ الْبَصِيرِ وَالسَّمِيعِ",
            "wajh": "عَدَمُ انْتِفَاعِ الْأَوَّلِ بِأَدَوَاتِ الْإِدْرَاكِ وَانْتِفَاعُ الثَّانِي بِهَا",
            "wajhType": "mujmal",
            "baligh": False,
            "classificationAr": "مركب مرسل مجمل",
            "classificationEn": "Compound Contrast Analogy"
        },
        "note": {
            "source": "تفسير ابن عاشور والرازي",
            "text": "لف ونشر مرتب وتشبيه بديع يجمع الحواس الظاهرة والباطنة."
        }
    },
    {
        "sura": 13, "verse": 14,
        "highlight": "إِلَّا كَبَٰسِطِ كَفَّيْهِ إِلَى ٱلْمَآءِ لِيَبْلُغَ فَاهُ وَمَا هُوَ بِبَٰلِغِهِ",
        "subtypes": ["تشبيه تمثيلي", "مرسل", "مجمل"],
        "tashbih": {
            "tamthili": True,
            "adat": "إِلَّا كَبَاسِطِ (الكاف)",
            "adatType": "mursal",
            "mushabbah": "دُعَاءُ الْكُفَّارِ لِأَصْنَامِهِمْ وَطَلَبُ الشَّفَاعَةِ مِنْهَا",
            "mushabbahBihi": "بَاسِطِ كَفَّيْهِ إِلَى الْمَاءِ مِنْ بَعِيدٍ لِيَبْلُغَ فَاهُ",
            "wajh": "اسْتِحَالَةُ نَيْلِ الْمَطْلُوبِ مَعَ اسْتِفْرَاغِ الْوُسْعِ فِيمَا لَا يُجْدِي",
            "wajhType": "mujmal",
            "baligh": False,
            "classificationAr": "تمثيلي مرسل مجمل",
            "classificationEn": "Compound Analogy (Mursal Mujmal)"
        },
        "note": {
            "source": "تفسير الزمخشري والقرطبي",
            "text": "تصوير للحرمان المطلق؛ فالباسط كفيه لا يقبض ماءً، والماء لا يصعد لفمه بنفسه."
        }
    },
    {
        "sura": 14, "verse": 18,
        "highlight": "مَّثَلُ ٱلَّذِينَ كَفَرُوا۟ بِرَبِّهِمْ ۖ أَعْمَٰلُهُمْ كَرَمَادٍ ٱشْتَدَّتْ بِهِ ٱلرِّيحُ",
        "subtypes": ["تشبيه تمثيلي", "مرسل", "مجمل"],
        "tashbih": {
            "tamthili": True,
            "adat": "كَـ (كَرَمَادٍ)",
            "adatType": "mursal",
            "mushabbah": "أَعْمَالُ الَّذِينَ كَفَرُوا يَوْمَ الْقِيَامَةِ فِي بَطَلَانِهَا",
            "mushabbahBihi": "رَمَادٍ اشْتَدَّتْ بِهِ الرِّيحُ فِي يَوْمٍ عَاصِفٍ فَلَمْ يَبْقَ مِنْهُ شَيْءٌ",
            "wajh": "تَفَرُّقُ الْأَجْزَاءِ وَتَلَاشِيهَا وَالْعَجْزُ عَنِ اسْتِرْدَادِ أَيِّ شَيْءٍ مِنْهَا",
            "wajhType": "mujmal",
            "baligh": False,
            "classificationAr": "تمثيلي مرسل مجمل",
            "classificationEn": "Compound Analogy (Mursal Mujmal)"
        },
        "note": {
            "source": "تفسير ابن كثير والدر المصون",
            "text": "تمثيل بليغ لبطلان أعمال الكفار الحسنة التي ظنوها تنفعهم فصارت رماداً في مهب الريح العاصف."
        }
    },
    {
        "sura": 16, "verse": 75,
        "highlight": "ضَرَبَ ٱللَّهُ مَثَلًا عَبْدًا مَّمْلُوكًا لَّا يَقْدِرُ عَلَىٰ شَىْءٍ",
        "subtypes": ["تشبيه تمثيلي", "مرسل", "مجمل"],
        "tashbih": {
            "tamthili": True,
            "adat": "ضَرَبَ مَثَلًا",
            "adatType": "mursal",
            "mushabbah": "الْأَصْنَامُ الْعَاجِزَةُ وَاللَّهُ الْخَالِقُ الرَّازِقُ",
            "mushabbahBihi": "عَبْدٌ مَمْلُوكٌ عَاجِزٌ وَرَجُلٌ حُرٌّ غَنِيٌّ يُنْفِقُ كَرَمًا",
            "wajh": "التَّفَاوُتُ الْبَيِّنُ بَيْنَ الْعَجْزِ الْمُطْلَقِ وَالْقُدْرَةِ التَّامَّةِ",
            "wajhType": "mujmal",
            "baligh": False,
            "classificationAr": "تمثيلي مرسل مجمل",
            "classificationEn": "Compound Analogy (Mursal Mujmal)"
        },
        "note": {
            "source": "تفسير الطبري وابن عطية",
            "text": "برهان عقلي تمثيلي يدحض عبادة الجماد العاجز بتسليط الضوء على الفارق الجوهري."
        }
    },
    {
        "sura": 16, "verse": 76,
        "highlight": "وَضَرَبَ ٱللَّهُ مَثَلًا رَّجُلَيْنِ أَحَدُهُمَآ أَبْكَمُ لَا يَقْدِرُ عَلَىٰ شَىْءٍ",
        "subtypes": ["تشبيه تمثيلي", "مرسل", "مجمل"],
        "tashbih": {
            "tamthili": True,
            "adat": "ضَرَبَ اللَّهُ مَثَلًا",
            "adatType": "mursal",
            "mushabbah": "الصَّنَمُ الْبَاطِلُ وَالرَّبُّ الْحَقُّ الْآمِرُ بِالْعَدْلِ",
            "mushabbahBihi": "رَجُلٌ أَبْكَمُ عَالَةٌ عَلَى مَوْلَاهُ وَرَجُلٌ نَاطِقٌ بِالْحَقِّ رَاشِدٌ",
            "wajh": "عَدَمُ الصَّلَاحِيَّةِ لِلنَّفْعِ فِي مُقَابِلِ كَمَالِ الْإِرْشَادِ وَالْهُدَى",
            "wajhType": "mujmal",
            "baligh": False,
            "classificationAr": "تمثيلي مرسل مجمل",
            "classificationEn": "Compound Analogy (Mursal Mujmal)"
        },
        "note": {
            "source": "تفسير البيضاوي وابن عاشور",
            "text": "تمثيل متمم للمثل السابق يضيف قيد البكم والعجز عن الإفهام والتوجيه."
        }
    },
    {
        "sura": 18, "verse": 45,
        "highlight": "وَٱضْرِبْ لَهُم مَّثَلَ ٱلْحَيَوٰةِ ٱلدُّنْيَا كَمَآءٍ أَنزَلْنَٰهُ مِنَ ٱلسَّمَآءِ",
        "subtypes": ["تشبيه تمثيلي", "مرسل", "مجمل"],
        "tashbih": {
            "tamthili": True,
            "adat": "كَمَاءِ (الكاف)",
            "adatType": "mursal",
            "mushabbah": "زِينَةُ الْحَيَاةِ الدُّنْيَا فِي نَضَارَتِهَا ثُمَّ هَلَاكِهَا",
            "mushabbahBihi": "مَاءٍ نَزَلَ فَاخْتَلَطَ بِهِ نَبَاتُ الْأَرْضِ فَأَصْبَحَ هَشِيمًا تَذْرُوهُ الرِّيَاحُ",
            "wajh": "سُرْعَةُ الزَّوَالِ وَالتَّحَوُّلِ مِنَ الْقُوَّةِ وَالْبَهْجَةِ إِلَى الْفَنَاءِ",
            "wajhType": "mujmal",
            "baligh": False,
            "classificationAr": "تمثيلي مرسل مجمل",
            "classificationEn": "Compound Analogy (Mursal Mujmal)"
        },
        "note": {
            "source": "تفسير النسفي والبغوي",
            "text": "تشبيه دقيق لأطوار العمر البشري والمتاع الدنيوي بالزرع الهشيم."
        }
    },
    {
        "sura": 22, "verse": 31,
        "highlight": "وَمَن يُشْرِكْ بِٱللَّهِ فَكَأَنَّمَا خَرَّ مِنَ ٱلسَّمَآءِ فَتَخْطَفُهُ ٱلطَّيْرُ",
        "subtypes": ["تشبيه تمثيلي", "مرسل", "مجمل"],
        "tashbih": {
            "tamthili": True,
            "adat": "فَكَأَنَّمَا",
            "adatType": "mursal",
            "mushabbah": "مَنْ يُشْرِكْ بِاللَّهِ وَيَهْبِطُ عَنْ دَرَجَةِ التَّوْحِيدِ",
            "mushabbahBihi": "السَّاقِطُ مِنَ السَّمَاءِ فَتَخْطَفُهُ الطَّيْرُ أَوْ تَهْوِي بِهِ الرِّيحُ فِي مَكَانٍ سَحِيقٍ",
            "wajh": "السُّقُوطُ مِنَ الْعُلُوِّ إِلَى الْهَلَاكِ الْمُحَقَّقِ وَتَمَزُّقُ الْإِرَادَةِ",
            "wajhType": "mujmal",
            "baligh": False,
            "classificationAr": "تمثيلي مرسل مجمل",
            "classificationEn": "Compound Analogy (Mursal Mujmal)"
        },
        "note": {
            "source": "تفسير الكشاف والرازي",
            "text": "تصوير هائل للحرمان؛ فالإيمان سماء رفيعة، والشرك سقوط وتمزق في مخالب الأهواء والشياطين."
        }
    },
    {
        "sura": 24, "verse": 35,
        "highlight": "مَثَلُ نُورِهِۦ كَمِشْكَوٰةٍ فِيهَا مِصْبَاحٌ",
        "subtypes": ["تشبيه تمثيلي", "مرسل", "مجمل"],
        "tashbih": {
            "tamthili": True,
            "adat": "كَمِشْكَاةٍ (الكاف)",
            "adatType": "mursal",
            "mushabbah": "نُورُ اللَّهِ فِي قَلْبِ الْمُؤْمِنِ (أَوْ هُدَى الْقُرْآنِ)",
            "mushabbahBihi": "مِشْكَاةٌ فِيهَا مِصْبَاحٌ فِي زُجَاجَةٍ تُوقَدُ مِنْ شَجَرَةٍ مُبَارَكَةٍ زَيْتُونَةٍ",
            "wajh": "صَفَاءُ النُّورِ وَشِدَّةُ إِشْرَاقِهِ وَتَضَاعُفُ ضِيَائِهِ بِتَظَاهُرِ الْمَوَادِّ النَّقِيَّةِ",
            "wajhType": "mujmal",
            "baligh": False,
            "classificationAr": "تمثيلي مرسل مجمل",
            "classificationEn": "Compound Analogy (Mursal Mujmal)"
        },
        "note": {
            "source": "تفسير ابن عباس وأبي السعود",
            "text": "آية النور؛ غاية في الإشراق والبيان، شُبّه نور الهدى في الصدر الزكي بالمصباح الوهاج."
        }
    },
    {
        "sura": 24, "verse": 39,
        "highlight": "وَٱلَّذِينَ كَفَرُوٓا۟ أَعْمَٰلُهُمْ كَسَرَابٍۭ بِقِيعَةٍ يَحْسَبُهُ ٱلظَّمْـَٔانُ مَآءً",
        "subtypes": ["تشبيه تمثيلي", "مرسل", "مجمل"],
        "tashbih": {
            "tamthili": True,
            "adat": "كَـ (كَسَرَابٍ)",
            "adatType": "mursal",
            "mushabbah": "أَعْمَالُ الْكُفَّارِ الَّتِي يَحْسَبُونَهَا نَافِعَةً يَوْمَ الْقِيَامَةِ",
            "mushabbahBihi": "سَرَابٍ بِقِيعَةٍ يَحْسَبُهُ الظَّمْآنُ مَاءً حَتَّى إِذَا جَاءَهُ لَمْ يَجِدْهُ شَيْئًا",
            "wajh": "خَيْبَةُ الرَّجَاءِ وَانْكِشَافُ الْوَهْمِ حِينَ لَا يُغْنِي شَيْئًا",
            "wajhType": "mujmal",
            "baligh": False,
            "classificationAr": "تمثيلي مرسل مجمل",
            "classificationEn": "Compound Analogy (Mursal Mujmal)"
        },
        "note": {
            "source": "تفسير القرطبي وابن كثير",
            "text": "المثل الأول لأعمال الكفار؛ يمثل الوهم والخيبة التامة عند الحساب."
        }
    },
    {
        "sura": 24, "verse": 40,
        "highlight": "أَوْ كَظُلُمَٰتٍ فِى بَحْرٍ لُّجِّىٍّ يَغْشَىٰهُ مَوْجٌ مِّن فَوْقِهِۦ مَوْجٌ",
        "subtypes": ["تشبيه تمثيلي", "مرسل", "مجمل"],
        "tashbih": {
            "tamthili": True,
            "adat": "أَوْ كَظُلُمَاتٍ (الكاف)",
            "adatType": "mursal",
            "mushabbah": "ظُلُمَاتُ الْكُفْرِ وَالضَّلَالِ الْمُتَرَاكِمَةُ عَلَى الْقَلْبِ",
            "mushabbahBihi": "ظُلُمَاتٍ فِي بَحْرٍ لُجِّيٍّ يَغْشَاهُ مَوْجٌ مِنْ فَوْقِهِ مَوْجٌ مِنْ فَوْقِهِ سَحَابٌ",
            "wajh": "شِدَّةُ انْغِلَاقِ الرُّؤْيَةِ وَتَرَاكُمُ الْحُجُبِ الْمَانِعَةِ لِأَدْنَى نُورٍ",
            "wajhType": "mujmal",
            "baligh": False,
            "classificationAr": "تمثيلي مرسل مجمل",
            "classificationEn": "Compound Analogy (Mursal Mujmal)"
        },
        "note": {
            "source": "تفسير الطبري والزمخشري",
            "text": "المثل الثاني للكفار؛ تصوير للظلمات المعنوية المركبة من الجهل والتقليد والضلال."
        }
    },
    {
        "sura": 29, "verse": 41,
        "highlight": "مَثَلُ ٱلَّذِينَ ٱتَّخَذُوا۟ مِن دُونِ ٱللَّهِ أَوْلِيَآءَ كَمَثَلِ ٱلْعَنكَبُوتِ ٱتَّخَذَتْ بَيْتًا",
        "subtypes": ["تشبيه تمثيلي", "مرسل", "مجمل"],
        "tashbih": {
            "tamthili": True,
            "adat": "كَمَثَلِ",
            "adatType": "mursal",
            "mushabbah": "الَّذِينَ اتَّخَذُوا مِنْ دُونِ اللَّهِ أَوْلِيَاءَ يَرْجُونَ نَصْرَهُمْ",
            "mushabbahBihi": "الْعَنكَبُوتِ اتَّخَذَتْ بَيْتًا وَإِنَّ أَوْهَنَ الْبُيُوتِ لَبَيْتُ الْعَنكَبُوتِ",
            "wajh": "الِاعْتِمَادُ عَلَى مَا لَا يَدْفَعُ ضَرًّا وَلَا يَجْلِبُ أَمْنًا لِغَايَةِ ضَعْفِهِ",
            "wajhType": "mujmal",
            "baligh": False,
            "classificationAr": "تمثيلي مرسل مجمل",
            "classificationEn": "Compound Analogy (Mursal Mujmal)"
        },
        "note": {
            "source": "تفسير البيضاوي وابن عاشور",
            "text": "تصوير لشدة عجز المعبودات الباطلة؛ شُبّه التمسك بها ببيت العنكبوت لا يقي حراً ولا قراً."
        }
    },
    {
        "sura": 39, "verse": 29,
        "highlight": "ضَرَبَ ٱللَّهُ مَثَلًا رَّجُلًا فِيهِ شُرَكَآءُ مُتَشَٰكِسُونَ وَرَجُلًا سَلَمًا لِّرَجُلٍ",
        "subtypes": ["تشبيه تمثيلي", "مرسل", "مجمل"],
        "tashbih": {
            "tamthili": True,
            "adat": "ضَرَبَ اللَّهُ مَثَلًا",
            "adatType": "mursal",
            "mushabbah": "الْمُشْرِكُ الْمُشَتَّتُ بَيْنَ آلِهَةٍ وَالْمُوَحِّدُ الْمُخْلِصُ لِرَبٍّ وَاحِدٍ",
            "mushabbahBihi": "عَبْدٌ يَمْلِكُهُ شُرَكَاءُ مُتَنَازِعُونَ وَعَبْدٌ خَالِصٌ لِسَيِّدٍ وَاحِدٍ",
            "wajh": "شَتَاتُ الْأَمْرِ وَالْحَيْرَةُ فِي مُقَابِلِ الطُّمَأْنِينَةِ وَوُضُوحِ الْقَصْدِ",
            "wajhType": "mujmal",
            "baligh": False,
            "classificationAr": "تمثيلي مرسل مجمل",
            "classificationEn": "Compound Analogy (Mursal Mujmal)"
        },
        "note": {
            "source": "تفسير السعدي والزمخشري",
            "text": "تمثيل نفسي واجتماعي باهر لقلق الشرك وراحة التوحيد."
        }
    },
    {
        "sura": 48, "verse": 29,
        "highlight": "وَمَثَلُهُمْ فِى ٱلْإِنجِيلِ كَزَرْعٍ أَخْرَجَ شَطْـَٔهُۥ فَـَٔازَرَهُۥ فَٱسْتَغْلَظَ فَٱسْتَوَىٰ عَلَىٰ سُوقِهِۦ",
        "subtypes": ["تشبيه تمثيلي", "مرسل", "مجمل"],
        "tashbih": {
            "tamthili": True,
            "adat": "كَـ (كَزَرْعٍ)",
            "adatType": "mursal",
            "mushabbah": "أَصْحَابُ رَسُولِ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ فِي نَمَائِهِمْ وَقُوَّتِهِمْ",
            "mushabbahBihi": "زَرْعٍ أَخْرَجَ فِرَاخَهُ فَآزَرَهُ وَقَوَّاهُ حَتَّى اسْتَقَامَ صَلْبًا مَهِيبًا",
            "wajh": "التَّعَاضُدُ وَالتَّمَاسُكُ وَالنُّمُوُّ السَّرِيعُ مِنْ بَدْءٍ يَسِيرٍ إِلَى عِزَّةٍ بَاهِرَةٍ",
            "wajhType": "mujmal",
            "baligh": False,
            "classificationAr": "تمثيلي مرسل مجمل",
            "classificationEn": "Compound Analogy (Mursal Mujmal)"
        },
        "note": {
            "source": "تفسير الطبري وابن كثير",
            "text": "تمثيل بديع لنمو الجماعة المؤمنة وتآزرها كالفروع التي تسند الساق الأصلية."
        }
    },
    {
        "sura": 57, "verse": 20,
        "highlight": "كَمَثَلِ غَيْثٍ أَعْجَبَ ٱلْكُفَّارَ نَبَاتُهُۥ ثُمَّ يَهِيجُ فَتَرَىٰهُ مُصْفَرًّا ثُمَّ يَكُونُ حُطَٰمًا",
        "subtypes": ["تشبيه تمثيلي", "مرسل", "مجمل"],
        "tashbih": {
            "tamthili": True,
            "adat": "كَمَثَلِ",
            "adatType": "mursal",
            "mushabbah": "الْحَيَاةُ الدُّنْيَا فِي فِتْنَتِهَا وَتَزَيُّنِهَا ثُمَّ خَرَابِهَا",
            "mushabbahBihi": "غَيْثٍ أَعْجَبَ الزُّرَّاعَ نَبَاتُهُ ثُمَّ جَفَّ فَاصْفَرَّ فَتَحَطَّمَ",
            "wajh": "سُرْعَةُ التَّحَوُّلِ مِنَ الْغَضَارَةِ وَالْبَهْجَةِ إِلَى الْجَفَافِ وَالْفَنَاءِ",
            "wajhType": "mujmal",
            "baligh": False,
            "classificationAr": "تمثيلي مرسل مجمل",
            "classificationEn": "Compound Analogy (Mursal Mujmal)"
        },
        "note": {
            "source": "تفسير القرطبي والدر المصون",
            "text": "الكفار هنا هم الزراع لأنهم يكفرون الحبة في الأرض أي يسترونها؛ والتشبيه تمثيلي لأطوار الفناء."
        }
    },
    {
        "sura": 62, "verse": 5,
        "highlight": "مَثَلُ ٱلَّذِينَ حُمِّلُوا۟ ٱلتَّوْرَىٰةَ ثُمَّ لَمْ يَحْمِلُوهَا كَمَثَلِ ٱلْحِمَارِ يَحْمِلُ أَسْفَارًۢا",
        "subtypes": ["تشبيه تمثيلي", "مرسل", "مجمل"],
        "tashbih": {
            "tamthili": True,
            "adat": "كَمَثَلِ",
            "adatType": "mursal",
            "mushabbah": "الْيَهُودُ الَّذِينَ حَمَلُوا التَّوْرَاةَ وَلَمْ يَعْمَلُوا بِهَا",
            "mushabbahBihi": "الْحِمَارِ يَحْمِلُ كُتُبَ الْعِلْمِ النَّافِعَةَ دُونَ عِلْمٍ بِمَا فِيهَا",
            "wajh": "عَدَمُ الِانْتِفَاعِ بِالْمَحْمُولِ النَّافِعِ مَعَ تَحَمُّلِ الْمَشَقَّةِ",
            "wajhType": "mujmal",
            "baligh": False,
            "classificationAr": "تمثيلي مرسل مجمل",
            "classificationEn": "Compound Analogy (Mursal Mujmal)"
        },
        "note": {
            "source": "تفسير ابن جرير والزمخشري",
            "text": "تمثيل لاذع لمن حمل العلم النافع ولم يعمل بمقتضاه، كالدابة التي لا ينالها من الكتب إلا ثقلها."
        }
    },
    {
        "sura": 74, "verse": 50,
        "highlight": "كَأَنَّهُمْ حُمُرٌ مُّسْتَنفِرَةٌ * فَرَّتْ مِن قَسْوَرَةٍۭ",
        "subtypes": ["تشبيه تمثيلي", "مرسل", "مجمل"],
        "tashbih": {
            "tamthili": True,
            "adat": "كَأَنَّهُمْ",
            "adatType": "mursal",
            "mushabbah": "الْمُشْرِكُونَ عِنْدَ سَمَاعِ التَّذْكِرَةِ وَإِعْرَاضِهِمْ عَنْهَا",
            "mushabbahBihi": "حُمُرٌ وَحْشِيَّةٌ مُسْتَنْفِرَةٌ نَفَرَتْ فِي رُعْبٍ مِنْ أَسَدٍ أَوْ صَيَّادٍ",
            "wajh": "شِدَّةُ النُّفُورِ وَالْفَزَعِ الطَّائِشِ دُونَ رَوِيَّةٍ أَوْ تَعَقُّلٍ",
            "wajhType": "mujmal",
            "baligh": False,
            "classificationAr": "تمثيلي مرسل مجمل",
            "classificationEn": "Compound Analogy (Mursal Mujmal)"
        },
        "note": {
            "source": "تفسير ابن عاشور وأبو السعود",
            "text": "قسورة: الأسد أو جماعة الرماة؛ وتصوير الهرب الأرعن من النور والقرآن."
        }
    },
    {
        "sura": 101, "verse": 4,
        "highlight": "يَوْمَ يَكُونُ ٱلنَّاسُ كَٱلْفَرَاشِ ٱلْمَبْثُوثِ",
        "subtypes": ["تشبيه مفرد", "مرسل", "مجمل"],
        "tashbih": {
            "tamthili": False,
            "adat": "كَـ (كَالْفَرَاشِ)",
            "adatType": "mursal",
            "mushabbah": "النَّاسُ يَوْمَ الْقِيَامَةِ فِي بَعْثِهِمْ وَحَيْرَتِهِمْ",
            "mushabbahBihi": "الْفَرَاشِ الْمَبْثُوثِ الْمُتَطَايِرِ فِي كُلِّ اتِّجَاهٍ",
            "wajh": "الْكَثْرَةُ وَالِانْتِشَارُ وَالِاضْطِرَابُ وَالْحَيْرَةُ دُونَ قَصْدٍ مُوَحَّدٍ",
            "wajhType": "mujmal",
            "baligh": False,
            "classificationAr": "مفرد مرسل مجمل",
            "classificationEn": "Single-Element Analogy (Mursal Mujmal)"
        },
        "note": {
            "source": "تفسير الرازي والقرطبي",
            "text": "تشبيه مفرد؛ الفراش يتهافت على النار بحيرة، وكذلك الناس من هول المطلع."
        }
    },
    {
        "sura": 101, "verse": 5,
        "highlight": "وَتَكُونُ ٱلْجِبَالُ كَٱلْعِهْنِ ٱلْمَنفُوشِ",
        "subtypes": ["تشبيه مفرد", "مرسل", "مجمل"],
        "tashbih": {
            "tamthili": False,
            "adat": "كَـ (كَالْعِهْنِ)",
            "adatType": "mursal",
            "mushabbah": "الْجِبَالُ الرَّاسِيَاتُ يَوْمَ الْقِيَامَةِ بَعْدَ تَفْتِيتِهَا",
            "mushabbahBihi": "الْعِهْنِ الْمَنفُوشِ (الصُّوفِ الْمَصْبُوغِ الْمُنْتَفِشِ)",
            "wajh": "الْخِفَّةُ وَالتَّفَرُّقُ وَتَطَايُرُ الْأَجْزَاءِ بَعْدَ الصَّلَابَةِ وَالثِّقَلِ",
            "wajhType": "mujmal",
            "baligh": False,
            "classificationAr": "مفرد مرسل مجمل",
            "classificationEn": "Single-Element Analogy (Mursal Mujmal)"
        },
        "note": {
            "source": "تفسير ابن جرير والنسفي",
            "text": "العهن هو الصوف ذو الألوان؛ والجبال مختلفة الألوان فتصير كالصوف المنفوش خفة وتطايراً."
        }
    }
]

HADHF_RAW = [
    {
        "sura": 59, "verse": 18,
        "highlight": "وَلْتَنظُرْ نَفْسٌ مَّا قَدَّمَتْ لِغَدٍ",
        "subtypes": ["حذف المفعول به", "إيجاز بالحذف", "عموم واستغراق"],
        "hadhf": {
            "category": "ism",
            "categoryAr": "حذف اسم / مفعول به",
            "slotAr": "حذف المفعول به لـ «قَدَّمَتْ»",
            "slotEn": "Omission of Direct Object (Mafʿūl Bih)",
            "taqdirAr": "[مَا قَدَّمَتْهُ مِنْ عَمَلٍ صَالِحٍ أَوْ طَالِحٍ]",
            "taqdirEn": "[Whatever deeds she put forward, good or evil]",
            "omissionMarker": "وَلْتَنظُرْ نَفْسٌ مَّا قَدَّمَتْ [ ... ] لِغَدٍ",
            "purposeAr": "للتعميم والشمول واستيعاب سائر الأعمال دون حصر",
            "purposeEn": "Universal generalization to encompass all deeds without limitation"
        },
        "note": {
            "source": "تفسير السمين الحلبي وأبو السعود",
            "text": "حُذف عائد الموصول والمفعول به لقصد الإبهام والتعميم؛ ليتناول كل ما يقع عليه اسم عمل."
        }
    },
    {
        "sura": 12, "verse": 82,
        "highlight": "وَسْـَٔلِ ٱلْقَرْيَةَ ٱلَّتِى كُنَّا فِيهَا وَٱلْعِيرَ ٱلَّتِىٓ أَقْبَلْنَا فِيهَا",
        "subtypes": ["حذف المضاف", "إيجاز بالحذف", "مجاز مرسل"],
        "hadhf": {
            "category": "ism",
            "categoryAr": "حذف اسم / مضاف",
            "slotAr": "حذف المضاف وإقامة المضاف إليه مقامه",
            "slotEn": "Omission of Genitive Head (Muḍāf)",
            "taqdirAr": "[وَاسْأَلْ أَهْلَ الْقَرْيَةِ وَأَصْحَابَ الْعِيرِ]",
            "taqdirEn": "[Ask the inhabitants of the city and the people of the caravan]",
            "omissionMarker": "وَسْـَٔلِ [ ... ] ٱلْقَرْيَةَ ٱلَّتِى كُنَّا فِيهَا وَ[ ... ] ٱلْعِيرَ",
            "purposeAr": "للدلالة على انتشار الخبر وشياعه حتى صار كأن الجماد ينطق به",
            "purposeEn": "Intimating that the matter is so widespread that even the stones of the city bear witness"
        },
        "note": {
            "source": "دلائل الإعجاز للجرجاني والكشاف",
            "text": "من أشهر شواهد حذف المضاف في العربية ومجاز المشارطة؛ حُذف الأهل استخفافاً باللفظ لظهوره."
        }
    },
    {
        "sura": 13, "verse": 31,
        "highlight": "وَلَوْ أَنَّ قُرْءَانًا سُيِّرَتْ بِهِ ٱلْجِبَالُ أَوْ قُطِّعَتْ بِهِ ٱلْأَرْضُ أَوْ كُلِّمَ بِهِ ٱلْمَوْتَىٰ",
        "subtypes": ["حذف جواب الشرط", "إيجاز بالحذف", "تهويل وتفخيم"],
        "hadhf": {
            "category": "jumlah",
            "categoryAr": "حذف جملة / جواب لو",
            "slotAr": "حذف جواب «لَوْ» الامتناعية",
            "slotEn": "Omission of Apodosis / Conditional Response",
            "taqdirAr": "[لَكَانَ هَٰذَا الْقُرْآنَ / لَمَا آمَنُوا لِعُتُوِّهِمْ]",
            "taqdirEn": "[It would surely have been this Quran / yet they still would not believe]",
            "omissionMarker": "وَلَوْ أَنَّ قُرْءَانًا سُيِّرَتْ بِهِ ٱلْجِبَالُ ... [ ... ]",
            "purposeAr": "لتهويل الأمر وإطلاق خيال السامع في تعظيم شأن القرآن الكريم",
            "purposeEn": "Grandeur and unconstrained awe, leaving the mind to contemplate the majestic power of the Quran"
        },
        "note": {
            "source": "تفسير الزمخشري وأبو السعود",
            "text": "حذف الجواب هنا من أفخم أساليب الحذف؛ لأن تركه محذوفاً أبلغ في تصوير كمال شأن القرآن."
        }
    },
    {
        "sura": 2, "verse": 186,
        "highlight": "وَإِذَا سَأَلَكَ عِبَادِى عَنِّى فَإِنِّى قَرِيبٌ",
        "subtypes": ["حذف مقول القول", "إيجاز بالحذف", "مقام القرب"],
        "hadhf": {
            "category": "fil",
            "categoryAr": "حذف فعل / مقول القول",
            "slotAr": "حذف فعل الأمر «فَقُلْ»",
            "slotEn": "Omission of Directive Speech Verb ('Say')",
            "taqdirAr": "[فَقُلْ لَهُمْ: إِنِّي قَرِيبٌ]",
            "taqdirEn": "[Then say to them: I am near]",
            "omissionMarker": "وَإِذَا سَأَلَكَ عِبَادِى عَنِّى [ ... ] فَإِنِّى قَرِيبٌ",
            "purposeAr": "لتولّي الحق سبحانه الإجابة بنفسه دون واسطة إشعاراً بكمال القرب",
            "purposeEn": "Direct Divine response without intermediaries, reinforcing intimate spiritual proximity"
        },
        "note": {
            "source": "تفسير ابن عاشور والآلوسي",
            "text": "لم يقل 'فقل إني قريب' كباقي الأسئلة في القرآن، بل تولى الإجابة بنفسه للدلالة على شدة القرب وسرعة الإجابة."
        }
    },
    {
        "sura": 108, "verse": 2,
        "highlight": "فَصَلِّ لِرَبِّكَ وَٱنْحَرْ",
        "subtypes": ["حذف المفعول به", "إيجاز بالحذف", "إخلاص"],
        "hadhf": {
            "category": "harf",
            "categoryAr": "حذف معمول / جار ومجرور",
            "slotAr": "حذف المعمول والجار والمجرور لـ «وَانْحَرْ»",
            "slotEn": "Omission of Prepositional Object / Target",
            "taqdirAr": "[وَانْحَرْ لِرَبِّكَ وَحْدَهُ / انْحَرِ الْبُدْنَ لَهُ]",
            "taqdirEn": "[And sacrifice exclusively for Him / slaughter your offerings]",
            "omissionMarker": "فَصَلِّ لِرَبِّكَ وَٱنْحَرْ [ ... ]",
            "purposeAr": "لإفادة الإخلاص المطلق والعموم في النحر لله وحده دون الأصنام",
            "purposeEn": "Absolute sincere devotion and universal scope of ritual offering to Allah alone"
        },
        "note": {
            "source": "تفسير البيضاوي وابن كثير",
            "text": "حُذف المعمول ليعم كل ذبيحة يتقرب بها العبد لله رداً على نحر المشركين لأوثانهم."
        }
    },
    {
        "sura": 2, "verse": 60,
        "highlight": "فَقُلْنَا ٱضْرِب بِّعَصَاكَ ٱلْحَجَرَ ۖ فَٱنفَجَرَتْ مِنْهُ ٱثْنَتَا عَشْرَةَ عَيْنًا",
        "subtypes": ["حذف المعطوف", "إيجاز بالحذف", "سرعة الامتثال"],
        "hadhf": {
            "category": "fil",
            "categoryAr": "حذف جملة / فعل معطوف",
            "slotAr": "حذف جملة الامتثال المعطوفة",
            "slotEn": "Omission of Immediate Consequential Action",
            "taqdirAr": "[فَضَرَبَ بِعَصَاهُ الْحَجَرَ فَانْفَجَرَتْ]",
            "taqdirEn": "[So he struck the stone with his staff, and it gushed forth]",
            "omissionMarker": "فَقُلْنَا ٱضْرِب بِّعَصَاكَ ٱلْحَجَرَ ۖ [ ... ] فَٱنفَجَرَتْ",
            "purposeAr": "للإيجاز والإشعار بسرعة الامتثال الخارق للعادة دون تراخٍ",
            "purposeEn": "Dynamic conciseness highlighting instantaneous compliance and immediate miraculous result"
        },
        "note": {
            "source": "تفسير الزمخشري وأبو السعود",
            "text": "طُويت جملة الضرب ودل عليها الفاء التعقيبية مع انفجرت، للدلالة على سرعة وقوع المعجزة."
        }
    },
    {
        "sura": 2, "verse": 67,
        "highlight": "قَالُوٓا۟ أَتَتَّخِذُنَا هُزُوًا",
        "subtypes": ["حذف المضاف", "إيجاز بالحذف", "مبالغة"],
        "hadhf": {
            "category": "ism",
            "categoryAr": "حذف اسم / مضاف",
            "slotAr": "حذف المضاف أو الموصوف",
            "slotEn": "Omission of Genitive Head or Qualified Noun",
            "taqdirAr": "[أَتَتَّخِذُنَا أَهْلَ هُزُوٍ / مَوْضِعَ سُخْرِيَةٍ]",
            "taqdirEn": "[Do you take us as objects of ridicule / jest?]",
            "omissionMarker": "قَالُوٓا۟ أَتَتَّخِذُنَا [ ... ] هُزُوًا",
            "purposeAr": "للمبالغة بجعلهم نفس الهزء كأن الهزء تجسد فيهم",
            "purposeEn": "Hyperbolic identification of them as the very essence of mockery"
        },
        "note": {
            "source": "الدر المصون والكشاف",
            "text": "الهزو مصدر؛ وتقديره إما أصحاب هزو أو جعلهم نفس الهزء مبالغة."
        }
    },
    {
        "sura": 12, "verse": 9,
        "highlight": "ٱقْتُلُوا۟ يُوسُفَ أَوِ ٱطْرَحُوهُ أَرْضًا يَخْلُ لَكُمْ وَجْهُ أَبِيكُمْ",
        "subtypes": ["حذف جواب الشرط", "إيجاز بالحذف"],
        "hadhf": {
            "category": "jumlah",
            "categoryAr": "حذف جملة / شرط مقدر",
            "slotAr": "حذف جملة الشرط المترتبة على الطلب",
            "slotEn": "Omission of Implied Conditional Clause",
            "taqdirAr": "[إِنْ تَفْعَلُوا ذَلِكَ يَخْلُ لَكُمْ]",
            "taqdirEn": "[If you execute this deed, your father's face will be purely yours]",
            "omissionMarker": "ٱقْتُلُوا۟ يُوسُفَ أَوِ ٱطْرَحُوهُ أَرْضًا [ ... ] يَخْلُ لَكُمْ وَجْهُ أَبِيكُمْ",
            "purposeAr": "لإبراز النتيجة المرجوة في نفوسهم كأنها حتمية الحصول بمجرد وقوع الفعل",
            "purposeEn": "Emphasizing the longed-for consequence as an immediate certainty upon execution"
        },
        "note": {
            "source": "إعراب القرآن للنحاس وابن الأنباري",
            "text": "جزم 'يخل' في جواب الطلب؛ وهو دال على شرط مقدر محذوف إيجازاً."
        }
    },
    {
        "sura": 20, "verse": 77,
        "highlight": "فَٱضْرِبْ لَهُمْ طَرِيقًا فِى ٱلْبَحْرِ يَبَسًا لَّا تَخَٰفُ دَرَكًا وَلَا تَخْشَىٰ",
        "subtypes": ["حذف المضاف إليه", "إيجاز بالحذف", "أمن وتطمين"],
        "hadhf": {
            "category": "ism",
            "categoryAr": "حذف اسم / مضاف إليه",
            "slotAr": "حذف المضاف إليه لاسم المصدر «دَرَكًا»",
            "slotEn": "Omission of Genitive Post-Modifier",
            "taqdirAr": "[لَا تَخَافُ دَرَكَ فِرْعَوْنَ وَجُنْدِهِ]",
            "taqdirEn": "[Fearing not being overtaken by Pharaoh and his army]",
            "omissionMarker": "طَرِيقًا فِى ٱلْبَحْرِ يَبَسًا لَّا تَخَٰفُ دَرَكًا [ ... ]",
            "purposeAr": "للتعميم في نفي الخوف من كل مكروه يلحقهم في اليم",
            "purposeEn": "Total negation of fear regarding any pursuer or catastrophe in the seabed"
        },
        "note": {
            "source": "تفسير القرطبي وأبو السعود",
            "text": "حُذف المعمول ليعم نفي لحوق فرعون ونفي غرق البحر معاً."
        }
    },
    {
        "sura": 21, "verse": 87,
        "highlight": "فَنَادَىٰ فِى ٱلظُّلُمَٰتِ أَن لَّآ إِلَٰهَ إِلَّآ أَنتَ سُبْحَٰنَكَ",
        "subtypes": ["حذف المضاف إليه", "إيجاز بالحذف", "تهويل وتراكم"],
        "hadhf": {
            "category": "ism",
            "categoryAr": "حذف اسم / مضاف إليه وتنوين العوض",
            "slotAr": "حذف متعلقات الظلمات وإجمالها بالجمع",
            "slotEn": "Omission of Specific Genitives Compounded",
            "taqdirAr": "[فِي ظُلُمَاتِ اللَّيْلِ وَظُلْمَةِ الْبَحْرِ وَظُلْمَةِ بَطْنِ الْحُوتِ]",
            "taqdirEn": "[In the darknesses of the night, the sea, and the belly of the whale]",
            "omissionMarker": "فَنَادَىٰ فِى ٱلظُّلُمَٰتِ [ ... ] أَن لَّآ إِلَٰهَ إِلَّآ أَنتَ",
            "purposeAr": "لتهويل الظلمات المركبة واستحضار كرب الموقف وضيق المحبس",
            "purposeEn": "Compounding the profound claustrophobia and layered darkness of his confinement"
        },
        "note": {
            "source": "تفسير الطبري وابن كثير",
            "text": "جمع الظلمات للدلالة على ظلمة الليل وظلمة البحر وظلمة الحوت؛ وحُذفت إيجازاً لظهورها."
        }
    },
    {
        "sura": 26, "verse": 63,
        "highlight": "فَأَوْحَيْنَآ إِلَىٰ مُوسَىٰٓ أَنِ ٱضْرِب بِّعَصَاكَ ٱلْبَحْرَ ۖ فَٱنفَلَقَ",
        "subtypes": ["حذف الفعل المعطوف", "إيجاز بالحذف", "قدرة إلهية"],
        "hadhf": {
            "category": "fil",
            "categoryAr": "حذف جملة / فعل معطوف",
            "slotAr": "حذف جملة الضرب المعطوفة",
            "slotEn": "Omission of Consequential Strike Verb",
            "taqdirAr": "[فَضَرَبَهُ بِعَصَاهُ فَانْفَلَقَ]",
            "taqdirEn": "[So he struck it with his staff, and it parted]",
            "omissionMarker": "أَنِ ٱضْرِب بِّعَصَاكَ ٱلْبَحْرَ ۖ [ ... ] فَٱنفَلَقَ",
            "purposeAr": "لبيان عظمة القدرة الإلهية وسرعة انفلاق البحر من غير مهلة",
            "purposeEn": "Instantaneous manifestation of Divine will where the sea splits with zero delay"
        },
        "note": {
            "source": "تفسير النسفي والدر المصون",
            "text": "حذف المسبب لدلالة الفاء السببية وانفلق عليه، إيذاناً بعظيم القدرة الإلهية."
        }
    },
    {
        "sura": 38, "verse": 33,
        "highlight": "رُدُّوهَا عَلَىَّ ۖ فَطَفِقَ مَسْحًۢا بِٱلسُّوقِ وَٱلْأَعْنَاقِ",
        "subtypes": ["حذف الفعل", "إيجاز بالحذف"],
        "hadhf": {
            "category": "fil",
            "categoryAr": "حذف فعل / ناصب المصدر",
            "slotAr": "حذف الفعل الناصب للمصدر «مَسْحًا»",
            "slotEn": "Omission of Finite Verb Governing Cognate Accusative",
            "taqdirAr": "[فَطَفِقَ يَمْسَحُ مَسْحًا بِالسُّوقِ]",
            "taqdirEn": "[He began stroking them with hands on legs and necks]",
            "omissionMarker": "رُدُّوهَا عَلَىَّ ۖ فَطَفِقَ [ ... ] مَسْحًۢا بِٱلسُّوقِ وَٱلْأَعْنَاقِ",
            "purposeAr": "لتركيز الذهن على هيئة المسح المتتابع وشرف الخيل",
            "purposeEn": "Highlighting the continuous physical care and majestic stature of the steeds"
        },
        "note": {
            "source": "تفسير الزمخشري وأبو السعود",
            "text": "مسحاً مفعول مطلق لفعل محذوف، وأقيم المصدر مقامه تأكيداً للفعل وهيئته."
        }
    },
    {
        "sura": 75, "verse": 1,
        "highlight": "لَآ أُقْسِمُ بِيَوْمِ ٱلْقِيَٰمَةِ",
        "subtypes": ["حذف المقسم عليه", "إيجاز بالحذف", "تفخيم"],
        "hadhf": {
            "category": "jumlah",
            "categoryAr": "حذف جملة / جواب القسم",
            "slotAr": "حذف المقسم عليه وجواب القسم",
            "slotEn": "Omission of the Sworn Proposition (Jawab al-Qasam)",
            "taqdirAr": "[لَتُبْعَثُنَّ وَلَتُحَاسَبُنَّ عَلَى أَعْمَالِكُمْ]",
            "taqdirEn": "[You will surely be resurrected and held to account]",
            "omissionMarker": "لَآ أُقْسِمُ بِيَوْمِ ٱلْقِيَٰمَةِ * وَلَآ أُقْسِمُ بِٱلنَّفْسِ ٱللَّوَّامَةِ [ ... ]",
            "purposeAr": "لتفخيم الأمر وعظم شأن البعث حتى إنه لغنى عن ذكره لوضوحه وظهوره",
            "purposeEn": "Supreme solemnity making the certainty of resurrection so manifest it needs no explicit verbal clause"
        },
        "note": {
            "source": "تفسير البيضاوي وابن عاشور",
            "text": "حُذف جواب القسم لأن ما بعده من التوبيخ والإنكار يدل عليه دلالة واضحة."
        }
    },
    {
        "sura": 89, "verse": 1,
        "highlight": "وَٱلْفَجْرِ * وَلَيَالٍ عَشْرٍ",
        "subtypes": ["حذف جواب القسم", "إيجاز بالحذف", "تهويل"],
        "hadhf": {
            "category": "jumlah",
            "categoryAr": "حذف جملة / جواب القسم",
            "slotAr": "حذف جواب القسم لإثارة الترقب",
            "slotEn": "Omission of Oath Resolution",
            "taqdirAr": "[لَنُعَذِّبَنَّ الْكَافِرِينَ / لَتُجْزَوُنَّ بِأَعْمَالِكُمْ]",
            "taqdirEn": "[We will surely punish the transgressors / you will surely be repaid]",
            "omissionMarker": "وَٱلْفَجْرِ * وَلَيَالٍ عَشْرٍ ... [ ... ]",
            "purposeAr": "لإثارة الرهبة في قلوب الجاحدين وإشعارهم بسطوة الانتقام الإلهي",
            "purposeEn": "Awakening dread and acute anticipation of the inescapable divine reckoning"
        },
        "note": {
            "source": "تفسير الزمخشري والقرطبي",
            "text": "حذف جواب القسم في أوائل السور أسلوب بلاغي قرآني شهير لإطلاق الفكر في المقسم لأجله."
        }
    }
]

CLASSICAL_RAW = [
    {
        "sura": 1, "verse": 5,
        "highlight": "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
        "branch": "maani",
        "branchAr": "علم المعاني",
        "branchEn": "‘Ilm al-Maʿānī (Discourse Syntax)",
        "deviceAr": "التفات",
        "deviceEn": "Iltifāt (Grammatical Shift)",
        "subtypes": ["التفات من الغيبة إلى الخطاب", "تقديم المفعول للحصر"],
        "note": {
            "source": "دلائل الإعجاز للجرجاني ومفتاح العلوم للسكاكي",
            "text": "انتقال بديع من أسلوب الغيبة (الحمد لله رب العالمين) إلى كاف الخطاب المباشر (إياك نعبد)، لما حمد العبد ربه قَرُب فخاطبه خطاب المشاهد الحاضر."
        }
    },
    {
        "sura": 19, "verse": 4,
        "highlight": "وَٱشْتَعَلَ ٱلرَّأْسُ شَيْبًا",
        "branch": "bayan",
        "branchAr": "علم البيان",
        "branchEn": "‘Ilm al-Bayān (Figurative Expression)",
        "deviceAr": "استعارة مكنية",
        "deviceEn": "Istiʿārah Makniyyah (Implicit Metaphor)",
        "subtypes": ["استعارة مكنية", "مجاز لغوي", "استيعاب وشمول"],
        "note": {
            "source": "الكشاف للزمخشري والإيضاح للقزويني",
            "text": "شُبّه الشيب في انتشاره السريع في شعر الرأس بنار اشتعلت في هشيم الحطب، ثم حُذف المشبه به ورُمز له بلازمه (اشتعل)."
        }
    },
    {
        "sura": 30, "verse": 55,
        "highlight": "وَيَوْمَ تَقُومُ ٱلسَّاعَةُ يُقْسِمُ ٱلْمُجْرِمُونَ مَا لَبِثُوا۟ غَيْرَ سَاعَةٍ",
        "branch": "badi",
        "branchAr": "علم البديع",
        "branchEn": "‘Ilm al-Badīʿ (Rhetorical Embellishment)",
        "deviceAr": "جناس تام",
        "deviceEn": "Jinās Tāmm (Complete Paronomasia)",
        "subtypes": ["جناس تام مماثل", "محسن لفظي", "إيجاز إعجازي"],
        "note": {
            "source": "كتاب البديع لابن المعتز والمطول للتفتازاني",
            "text": "اتفق اللفظان في نوع الحروف وحركاتها وترتيبها وعددها، واختلف المعنى؛ فالأولى يوم القيامة، والثانية ساعة الزمان القليلة."
        }
    },
    {
        "sura": 2, "verse": 187,
        "highlight": "هُنَّ لِبَاسٌ لَّكُمْ وَأَنتُمْ لِبَاسٌ لَّهُنَّ",
        "branch": "bayan",
        "branchAr": "علم البيان",
        "branchEn": "‘Ilm al-Bayān (Figurative Expression)",
        "deviceAr": "استعارة بليغة / كناية",
        "deviceEn": "Baligh Metaphor & Kināyah",
        "subtypes": ["تشبيه بليغ", "كناية عن الستر والملازمة", "مطابقة معنوية"],
        "note": {
            "source": "تفسير الكشاف والرازي",
            "text": "جعل كل منهما لباساً للآخر لفرط الستر والوقاية والالتصاق؛ وهو من أرق وأبلغ الكنايات في التعبير عن المودة والسكينة الزوجية."
        }
    },
    {
        "sura": 2, "verse": 257,
        "highlight": "ٱللَّهُ وَلِىُّ ٱلَّذِينَ ءَامَنُوا۟ يُخْرِجُهُم مِّنَ ٱلظُّلُمَٰتِ إِلَى ٱلنُّورِ",
        "branch": "badi",
        "branchAr": "علم البديع",
        "branchEn": "‘Ilm al-Badīʿ (Rhetorical Embellishment)",
        "deviceAr": "مقابلة",
        "deviceEn": "Muqābalah (Symmetrical Multi-Term Antithesis)",
        "subtypes": ["مقابلة بديعية", "استعارة تصريحية", "توحيد النور وجمع الظلمات"],
        "note": {
            "source": "تفسير أبي السعود والسكاكي",
            "text": "مقابلة تامة بين إخراج المؤمنين من الظلمات إلى النور وإخراج الكافرين من النور إلى الظلمات، مع جمع الظلمات لتعدد سبل الضلال وتوحيد النور لوحدة الحق."
        }
    },
    {
        "sura": 21, "verse": 18,
        "highlight": "بَلْ نَقْذِفُ بِٱلْحَقِّ عَلَى ٱلْبَٰطِلِ فَيَدْمَغُهُۥ فَإِذَا هُوَ زَاهِقٌ",
        "branch": "bayan",
        "branchAr": "علم البيان",
        "branchEn": "‘Ilm al-Bayān (Figurative Expression)",
        "deviceAr": "استعارة تمثيلية / تصريحية",
        "deviceEn": "Dramatic Dynamic Metaphor",
        "subtypes": ["استعارة تصريحية", "تجسيم المعاني", "مشهد حركي"],
        "note": {
            "source": "دلائل الإعجاز ومفتاح العلوم",
            "text": "تصوير الحق والباطل في صورة حية متحركة؛ شُبّه الحق بقذيفة صلبة تصيب أم رأس الباطل فتكسر دماغه فيهلك حالاً."
        }
    },
    {
        "sura": 53, "verse": 43,
        "highlight": "وَأَنَّهُۥ هُوَ أَضْحَكَ وَأَبْكَىٰ * وَأَنَّهُۥ هُوَ أَمَاتَ وَأَحْيَا",
        "branch": "badi",
        "branchAr": "علم البديع",
        "branchEn": "‘Ilm al-Badīʿ (Rhetorical Embellishment)",
        "deviceAr": "طباق",
        "deviceEn": "Ṭibāq (Antithesis)",
        "subtypes": ["طباق إيجاب مزدوج", "محسن معنوي", "انفراد بالقدرة"],
        "note": {
            "source": "بديع القرآن لابن أبي الإصبع",
            "text": "طباق ثنائي رائع جمع بين أضحك وأبكى وأمات وأحيا؛ دلالة على انفراد الرب تعالى بمتناقضات التصرف في النفوس والأجساد."
        }
    },
    {
        "sura": 54, "verse": 45,
        "highlight": "سَيُهْزَمُ ٱلْجَمْعُ وَيُوَلُّونَ ٱلدُّبُرَ",
        "branch": "bayan",
        "branchAr": "علم البيان",
        "branchEn": "‘Ilm al-Bayān (Figurative Expression)",
        "deviceAr": "كناية عن موصوف وصفة",
        "deviceEn": "Kināyah (Metonymy of Flight)",
        "subtypes": ["كناية عن صفة الانهزام", "إعجاز غيبي", "إيجاز"],
        "note": {
            "source": "تفسير ابن كثير والبغوي",
            "text": "تولية الدبر كناية عن الفرار والخذلان المطبق؛ وقد وقعت هذه النبوءة يوم بدر عياناً."
        }
    },
    {
        "sura": 55, "verse": 60,
        "highlight": "هَلْ جَزَآءُ ٱلْإِحْسَٰنِ إِلَّا ٱلْإِحْسَٰنُ",
        "branch": "badi",
        "branchAr": "علم البديع",
        "branchEn": "‘Ilm al-Badīʿ (Rhetorical Embellishment)",
        "deviceAr": "أسلوب الحكيم / رد العجز على الصدر",
        "deviceEn": "Rad al-ʿAjuz ʿalā al-Ṣadr & Inverted Inscription",
        "subtypes": ["استفهام تقريري إنكاري", "رد العجز على الصدر", "قصر وحصر"],
        "note": {
            "source": "شروح التلخيص والتفسير الكبير للرازي",
            "text": "تكرير الإحسان مع اختلاف الفاعل والمقام؛ الأول إحسان العبد بالعمل، والثاني إحسان الرب بالثواب والنعيم الأبدي."
        }
    },
    {
        "sura": 77, "verse": 1,
        "highlight": "وَٱلْمُرْسَلَٰتِ عُرْفًا * فَٱلْعَٰصِفَٰتِ عَصْفًا * وَٱلنَّٰشِرَٰتِ نَشْرًا",
        "branch": "badi",
        "branchAr": "علم البديع",
        "branchEn": "‘Ilm al-Badīʿ (Rhetorical Embellishment)",
        "deviceAr": "سجع متوازي وموازنة صوتية",
        "deviceEn": "Sajaʿ Mutawāzī & Acoustic Cadence",
        "subtypes": ["سجع متوازي", "فواصل مقفاة", "إيقاع حركي مهيب"],
        "note": {
            "source": "الإتقان للسيوطي ومفتاح العلوم",
            "text": "اتفاق أواخر الفواصل في الوزن والروي مع مناسبة صوتية فريدة لحركات الرياح والملائكة في المشهد المهيب."
        }
    }
]

def build():
    entries = []

    # 1. Tashbih
    for item in TASHBIH_RAW:
        s = item["sura"]
        v = item["verse"]
        u = unit_map[s]
        ar = get_arabic_ayah(s, v)
        en = fetch_quranenc_translation("english_saheeh", s, v)
        id_tr = fetch_quranenc_translation("indonesian_sabiq", s, v)
        entries.append({
            "id": f"tashbih-{s}-{v}",
            "sura": s,
            "verse": v,
            "surahNameAr": u["name"],
            "surahNameEn": u["phonetic"],
            "dataset": "dataset-a-tashbih",
            "datasetBadge": "Dataset A: تشبيه / تمثيل",
            "branch": "bayan",
            "branchAr": "علم البيان",
            "branchEn": "‘Ilm al-Bayān (Figurative Expression)",
            "deviceAr": "تشبيه",
            "deviceEn": "Tashbīh (Simile / Parable)",
            "subtypes": item["subtypes"],
            "arabicAyah": ar,
            "englishAyah": en,
            "indonesianAyah": id_tr,
            "highlightArabic": item["highlight"],
            "tashbih": item["tashbih"],
            "scholarlyNote": item["note"]
        })

    # 2. Hadhf
    for item in HADHF_RAW:
        s = item["sura"]
        v = item["verse"]
        u = unit_map[s]
        ar = get_arabic_ayah(s, v)
        en = fetch_quranenc_translation("english_saheeh", s, v)
        id_tr = fetch_quranenc_translation("indonesian_sabiq", s, v)
        entries.append({
            "id": f"hadhf-{s}-{v}",
            "sura": s,
            "verse": v,
            "surahNameAr": u["name"],
            "surahNameEn": u["phonetic"],
            "dataset": "dataset-b-hadhf",
            "datasetBadge": "Dataset B: حذف / إيجاز",
            "branch": "maani",
            "branchAr": "علم المعاني",
            "branchEn": "‘Ilm al-Maʿānī (Discourse Syntax)",
            "deviceAr": "حذف",
            "deviceEn": "Ḥadhf (Ellipsis / Omission)",
            "subtypes": item["subtypes"],
            "arabicAyah": ar,
            "englishAyah": en,
            "indonesianAyah": id_tr,
            "highlightArabic": item["highlight"],
            "hadhf": item["hadhf"],
            "scholarlyNote": item["note"]
        })

    # 3. Classical Balaghah
    for item in CLASSICAL_RAW:
        s = item["sura"]
        v = item["verse"]
        u = unit_map[s]
        ar = get_arabic_ayah(s, v)
        en = fetch_quranenc_translation("english_saheeh", s, v)
        id_tr = fetch_quranenc_translation("indonesian_sabiq", s, v)
        entries.append({
            "id": f"classical-{s}-{v}",
            "sura": s,
            "verse": v,
            "surahNameAr": u["name"],
            "surahNameEn": u["phonetic"],
            "dataset": "classical-balagha",
            "datasetBadge": "Classical Balāghah: شواهد كبرى",
            "branch": item["branch"],
            "branchAr": item["branchAr"],
            "branchEn": item["branchEn"],
            "deviceAr": item["deviceAr"],
            "deviceEn": item["deviceEn"],
            "subtypes": item["subtypes"],
            "arabicAyah": ar,
            "englishAyah": en,
            "indonesianAyah": id_tr,
            "highlightArabic": item["highlight"],
            "scholarlyNote": item["note"]
        })

    OUT_FILE.write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Successfully generated {OUT_FILE} with {len(entries)} entries ({OUT_FILE.stat().st_size} bytes)")

if __name__ == "__main__":
    build()
