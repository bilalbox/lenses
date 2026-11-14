"""Per-root dictionary files: Lane transliteration, OpenITI parsing, root matching."""

from __future__ import annotations

import pytest
from build_lexicon import (
    lane_arabic,
    lane_root_key,
    letter_variants,
    lexicon_slug,
    match_headings,
    names_root,
    openiti_lines,
    parse_maqayis,
    parse_mufradat,
    repair_openings,
    root_letters,
)


@pytest.mark.parametrize(
    ("perseus", "arabic"),
    [
        ("naAsa", "نَاسَ"),
        ("yanuwsu", "يَنُوسُ"),
        ("A^anaAsa", "أَنَاسَ"),  # hamza above its seat: A^ → أ
        ("A_inosaAnN", "إِنْسَانٌ"),  # hamza below: A_ → إ
        ("A@l", "ٱل"),  # alif wasla
        ("tnw~s", "تنوّس"),
    ],
)
def test_lane_arabic_follows_the_perseus_conventions(perseus: str, arabic: str) -> None:
    assert lane_arabic(perseus) == arabic


@pytest.mark.parametrize(
    ("lane", "corpus"),
    [("nws", "nws"), ("Ab", "Abb"), ("AbY", "Aby"), ("kA^b", "kAb"), ("mrA'", "mrA")],
)
def test_lane_root_key_matches_corpus_spelling(lane: str, corpus: str) -> None:
    assert lane_root_key(lane) == corpus


def test_lexicon_slug_keeps_case_twins_apart_on_any_filesystem() -> None:
    roots = ["nws", "nwS", "Hmd", "hmd", "$Er", "E*b", "SrT", "srT"]
    slugs = [lexicon_slug(root) for root in roots]
    assert slugs[:2] == ["nws", "nws2"]
    assert len({slug.lower() for slug in slugs}) == len(roots)
    assert all(slug.isalnum() for slug in slugs)


def test_root_letters_writes_every_hamza_as_alif() -> None:
    assert root_letters("سأل") == "سال"
    assert root_letters("أُمّ") == "ام"
    assert root_letters("صلى") == "صلي"


def test_letter_variants_cover_weak_and_doubled_spellings() -> None:
    assert {"دعو", "دعي"} <= letter_variants("دعا")
    assert "خيب" in letter_variants("خاب")
    assert {"ربب", "ربو"} <= letter_variants("رب")


def test_letter_variants_never_swap_a_medial_waw_or_a_hamza() -> None:
    assert "عوق" not in letter_variants("عيق")
    assert "قيض" not in letter_variants("قوض")
    assert "طفا" not in letter_variants("طفأ")
    assert letter_variants("جير") == set()


def test_names_root_wants_an_opening_word_of_the_root() -> None:
    assert names_root("دعو", ["الدعاء كالنداء"])
    assert names_root("ربب", ["الرب في الأصل: التربية"])
    assert names_root("جوس", ["قال تعالى: فجاسوا خلال الديار"])
    assert not names_root("بلو", ["بل كلمة للتدارك"])
    assert not names_root("بول", ["بلد، أي: العراء"])
    assert not names_root("شقو", ["ق/ 1] ، وانشق القمر"])


def test_repair_openings_drops_the_tail_of_the_entry_before() -> None:
    found = {
        "Hmd": ["/ 15] ، إلا حميما وغساقا [عم/ 25] .", "الحمد لله تعالى: الثناء عليه."],
        "Drb": ["[النمل/ 62] ، فهو عام في كل ذلك، والضروري يقال على ثلاثة أوجه."],
    }
    review = repair_openings(found, {"Hmd": "حمد", "Drb": "ضرب"})
    assert found == {"Hmd": ["الحمد لله تعالى: الثناء عليه."]}
    assert review == {"trimmed": ["Hmd"], "dropped": ["Drb"]}


def test_match_headings_takes_a_variant_only_when_one_root_fits() -> None:
    by_letters = {"دعو": ["dEw"], "ربب": ["rbb"], "ربو": ["rbw"], "صلو": ["Slw"]}
    entries = {"دعا": ["الدعاء"], "صلي": ["الصاد واللام"], "رب": ["الرب"], "بر": ["البر"]}
    matched, unmatched = match_headings(entries, by_letters)
    assert matched == {"dEw": ["الدعاء"], "Slw": ["الصاد واللام"], "rbb": ["الرب"]}
    assert unmatched == ["بر"]


def _openiti(body: str) -> list[str]:
    return openiti_lines(f"######OpenITI#\n#META#Header#End#\n{body}")


def test_parse_maqayis_joins_a_word_split_by_a_stray_heading() -> None:
    lines = _openiti(
        "### | [باب اللام والطاء وما يثلثهما]\n"
        "### | (لطف) \n"
        "# اللام وا\n"
        "### | لطا\n"
        "# ء والفاء أصل يدل على رفق. PageV05P250\n"
        "~~فاللطف: الرفق.\n"
        "### | (أب) \n"
        "# للهمزة والباء في المضاعف أصلان.\n"
    )
    assert parse_maqayis(lines) == {
        "لطف": ["اللام والطاء والفاء أصل يدل على رفق. فاللطف: الرفق."],
        "أبب": ["للهمزة والباء في المضاعف أصلان."],
    }


def test_parse_mufradat_keeps_the_main_text_and_repairs_tag_slips() -> None:
    lines = _openiti(
        "### | مقدمة المحقق\n"
        "# كلام المحقق.\n"
        "### | كتاب الألف ms027\n"
        "### | طرف\n"
        "# طرف الشيء: جانبه، والطريف: ما يتناوله، ومنه قيل: مال\n"
        "### | طري\n"
        "# ف، ورجل طريف «1» .\n"
        "### | علم\n"
        "# العليقات.\n"
        "# علم\n"
        "# العلم: إدراك الشيء بحقيقته.\n"
        "### | مقدمة للفهارس الفنية\n"
        "# فهرس.\n"
    )
    assert parse_mufradat(lines) == {
        "طرف": [
            "طرف الشيء: جانبه، والطريف: ما يتناوله، ومنه قيل: مال طريف، ورجل طريف .",
            "العليقات.",
        ],
        "علم": ["العلم: إدراك الشيء بحقيقته."],
    }
