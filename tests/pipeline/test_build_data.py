"""Word counts and the corpus word-by-word gloss."""

from __future__ import annotations

from pathlib import Path

import pytest
from build_data import load_word_by_word, word_stats

ROOTS = [{"b": "nws", "a": "نوس"}, {"b": "", "a": ""}, {"b": "nwS", "a": "نوص"}]
LEMMAS = [{"b": "n~aAs", "a": "نَّاس"}, {"b": "min", "a": "مِن"}, {"b": "manaAS", "a": "مَنَاص"}]
ROWS = [
    [2, 8, 2, "ٱلنَّاسِ", 0, 0],
    [2, 8, 9, "ٱلنَّاسِ", 0, 0],
    [114, 1, 3, "ٱلنَّاسِ", 0, 0],
    [2, 8, 1, "وَمِنَ", 1, 1],
    [38, 3, 7, "مَنَاصٍ", 2, 2],
]


def test_word_stats_counts_occurrences_verses_and_surahs() -> None:
    stats = word_stats(ROWS, ROOTS, LEMMAS)
    assert stats["roots"] == {"nws": [3, 2, 2], "nwS": [1, 1, 1]}
    assert stats["lemmas"] == {"n~aAs": [3, 2, 2], "min": [1, 1, 1], "manaAS": [1, 1, 1]}


def test_load_word_by_word_keeps_each_line_verbatim(tmp_path: Path) -> None:
    path = tmp_path / "wbw.txt"
    path.write_text("In (the) name\n(of) Allah,\n the Most Gracious, \n", encoding="utf-8")
    assert load_word_by_word(path, 3) == ["In (the) name", "(of) Allah,", " the Most Gracious, "]


def test_load_word_by_word_rejects_a_misaligned_file(tmp_path: Path) -> None:
    path = tmp_path / "wbw.txt"
    path.write_text("one\ntwo\n", encoding="utf-8")
    with pytest.raises(SystemExit, match="word-by-word has 2 lines"):
        load_word_by_word(path, 3)
