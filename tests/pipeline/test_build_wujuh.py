"""al-Damaghani's al-Wujuh: entries, senses, sense names, surah names, excerpts."""

from __future__ import annotations

from build_wujuh import (
    Cite,
    Parsed,
    Sense,
    VerseMatch,
    apply_verdicts,
    excerpt,
    find_word,
    headword,
    is_headword,
    resolve_surah,
    root_keys,
    sense_label,
    split_entries,
    split_senses,
    squash,
)

ENTRY_TEXT = (
    "أم ة على ثلاثة أوجه عصبة . ملة . سنين "
    'فوجه منها : امة مسلمة لك يعني عصبة . قوله تعالى في سورة البقرة " ومن ذريتنا امة مسلمة لك " '
    'الثاني : امة يعني ملة . قوله تعالى في سورة البقرة " كان الناس امة واحدة " '
    'الثالث امة يعني سنين معدودة . قوله تعالى في سورة هود " إلى امة معدودة " '
    "ب ح ر على وجهين فوجه منهما البحر بمعنى الماء المالح"
)


def test_split_entries_reads_the_spaced_headword_and_the_declared_count() -> None:
    entries = split_entries(ENTRY_TEXT)
    assert [(e.heading, e.declared) for e in entries] == [("أمة", 3), ("بحر", 2)]


def test_split_senses_follows_the_ordinals_with_or_without_a_colon() -> None:
    senses = split_senses(split_entries(ENTRY_TEXT)[0].body)
    assert len(senses) == 3
    assert senses[1].startswith("امة يعني ملة")
    assert senses[2].startswith("امة يعني سنين")


def test_split_senses_stops_where_another_entry_starts() -> None:
    body = 'فوجه منها : الأول يعني كذا الثاني : يعني كذا " نص " فوجه منها : شيء آخر'
    assert split_senses(body)[-1].endswith('" نص "')


def test_sense_label_names_the_sense_in_his_spelling() -> None:
    assert sense_label('امة يعني ملة . قوله تعالى في سورة البقرة " كان "') == "ملة"
    assert sense_label("الأثقال بمعنى الأوزار كقوله تعالى") == "الأوزار"
    assert sense_label("امة محمد صلى الله عليه وسلم خاصة . قوله") == ("امة محمد صلى الله عليه وسلم")


def test_resolve_surah_knows_the_old_names() -> None:
    names = {"البقره": 2, "الملائكه": 35, "حم السجده": 41, "حم": 40}
    assert resolve_surah("البقرة", names) == 2
    assert resolve_surah("حم السجدة", names) == 41


def test_squash_lets_uthmani_and_plain_spelling_agree() -> None:
    assert squash("وَٰحِدَةً") == squash("واحدة")
    assert squash("ٱلصَّلَوٰةَ") != ""


def test_root_keys_reads_a_headword_as_its_root() -> None:
    by_letters = {"امم": ["Amm"], "بحر": ["bHr"], "رجو": ["rjw"]}
    assert root_keys("أمة", by_letters) == {"Amm"}
    assert root_keys("بحر", by_letters) == {"bHr"}
    assert root_keys("رجا", by_letters) == {"rjw"}


def test_find_word_prefers_the_root_word_inside_the_quote() -> None:
    roots = ["kwn", "nws", "Amm", "wHd", "Amm"]
    assert find_word(roots, {"Amm"}, start=1, length=3) == 3
    assert find_word(roots, {"xyz"}, start=0, length=2) is None


def test_excerpt_keeps_three_words_either_side() -> None:
    words = ["كَانَ", "ٱلنَّاسُ", "أُمَّةً", "وَٰحِدَةً", "فَبَعَثَ", "ٱللَّهُ", "ٱلنَّبِيِّـۧنَ", "مُبَشِّرِينَ"]
    assert excerpt(words, 3) == ["كَانَ ٱلنَّاسُ", "أُمَّةً", "وَٰحِدَةً فَبَعَثَ ٱللَّهُ"]


def test_sense_label_strips_leading_headword_and_dangling_words() -> None:
    assert sense_label("الحكمة القرآن قوله تعالى في سورة النحل", "حكم") == "القرآن"
    assert sense_label("خفافا يعني شبانا ويقال : خفافا من المال", "خفف") == "شبانا"
    assert sense_label("الإثم يعني المعصية فذلك قوله تعالى", "أثم") == "المعصية"
    assert is_headword("الحكمة", "حكم")
    assert is_headword("التأويل", "أول")


def test_headword_drops_noise_prefix() -> None:
    by_letters = {"بطل": ["bTl"], "امم": ["Amm"]}
    assert headword(["قوة", "ب", "ط", "ل"], by_letters) == ("بطل", {"bTl"})
    assert headword(["أم", "ة"], by_letters) == ("أمة", {"Amm"})


def test_apply_verdicts_modifies_entries() -> None:
    match = VerseMatch(verse=1, start=0, score=1.0, margin=1.0)
    c1 = Cite(1, 1, 1, "ق1", match, "")
    c2 = Cite(1, 2, 1, "ق2", match, "")
    c3 = Cite(1, 3, 1, "ق3", match, "")
    s1 = Sense("s1", "قديم", [c1, c2])
    s2 = Sense("s2", "آخر", [c3])
    parsed = [Parsed("هد", {"hd"}, [s1, s2])]

    verdicts = {
        "1:1:1:هد": {"v": "label", "l": "قديم", "label": "جديد", "note": "ok"},
        "1:2:1:هد": {"v": "move", "l": "قديم", "to": 2, "note": "belongs to sense 2"},
        "1:3:1:هد": {"v": "drop", "l": "آخر", "note": "wrong word"},
    }
    applied = apply_verdicts(parsed, verdicts)
    assert applied == 3
    assert parsed[0].senses[0].label == "جديد"
    assert [c.verse for c in parsed[0].senses[0].cites] == [1]
    assert [c.verse for c in parsed[0].senses[1].cites] == [2]
