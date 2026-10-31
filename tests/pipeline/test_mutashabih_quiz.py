"""Mutashabih quiz bank: blanks sit on real divergences and every option is real wording."""

from __future__ import annotations

from build_mutashabih_quiz import Corpus, SlotDiff, build_questions, slot_diffs

A = ["واذ", "نجينكم", "من", "ءال", "فرعون", "يسومونكم", "سوء", "العذاب", "يذبحون", "ابناءكم"]
B = ["واذ", "انجينكم", "من", "ءال", "فرعون", "يسومونكم", "سوء", "العذاب", "يقتلون", "ابناءكم"]


def test_slot_diffs_needs_shared_wording_on_both_sides() -> None:
    # word 1 differs too, but only one word leads into it
    assert slot_diffs(A, B) == [SlotDiff(8, 9, 8, 9)]


def test_slot_diffs_reports_an_omission_as_an_empty_side() -> None:
    a = ["ان", "الله", "ربي", "وربكم", "فاعبدوه"]
    b = ["ان", "الله", "هو", "ربي", "وربكم", "فاعبدوه"]
    assert slot_diffs(a, b) == [SlotDiff(2, 2, 2, 3)]


def test_slot_diffs_skips_long_rewrites() -> None:
    a = ["قال", "رب", "اني", "وهن", "العظم", "مني"]
    b = ["قال", "رب", "كيف", "يكون", "لي", "غلم", "مني"]
    assert slot_diffs(a, b) == []


def corpus(texts: dict[tuple[int, int], str], pairs: list[tuple[tuple[int, int], ...]]) -> Corpus:
    rasm = {k: t.split() for k, t in texts.items()}
    partners: dict[tuple[int, int], set[tuple[int, int]]] = {k: set() for k in texts}
    for a, b in pairs:
        partners[a].add(b)
        partners[b].add(a)
    return Corpus(rasm, dict(rasm), partners)


def test_questions_offer_the_partner_wording_and_surahs() -> None:
    texts = {(2, 49): " ".join(A), (7, 141): " ".join(B)}
    questions = build_questions(corpus(texts, [((2, 49), (7, 141))]))
    first = next(q for q in questions if q["s"] == 2)
    assert first["at"] == 8 and first["len"] == 1
    assert first["opts"][first["ans"]] == {"a": "يذبحون", "refs": [[2, 49]]}
    assert {o["a"] for o in first["opts"]} == {"يذبحون", "يقتلون"}
    assert sorted(first["surahs"]) == [2, 7]


def test_neighbouring_ayahs_are_not_paired() -> None:
    texts = {(2, 49): " ".join(A), (2, 51): " ".join(B)}
    assert build_questions(corpus(texts, [((2, 49), (2, 51))])) == []


def test_a_surah_holding_the_same_ayah_is_not_a_wrong_option() -> None:
    texts = {(2, 49): " ".join(A), (7, 141): " ".join(B), (7, 200): " ".join(A)}
    questions = build_questions(corpus(texts, [((2, 49), (7, 141))]))
    # 2:49 is word for word 7:200, so surah 7 cannot be wrong and no question is left
    assert [q["id"] for q in questions if q["s"] == 2] == []


def test_a_wording_that_makes_the_partner_ayah_is_not_a_wrong_option() -> None:
    # 2:147 and 3:60 differ only at the blank, so either wording is a real ayah
    texts = {
        (2, 147): "الحق من ربك فلا تكونن من الممترين",
        (3, 60): "الحق من ربك فلا تكن من الممترين",
    }
    assert build_questions(corpus(texts, [((2, 147), (3, 60))])) == []
