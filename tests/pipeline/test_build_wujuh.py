"""al-Damaghani's al-Wujuh: entries, senses, sense names, surah names, excerpts."""

from __future__ import annotations

from build_wujuh import (
    excerpt,
    find_word,
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
