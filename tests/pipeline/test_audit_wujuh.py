"""Tests for audit_wujuh: quality checks, lints, and verdict validation."""

from __future__ import annotations

from audit_wujuh import (
    content,
    label_conflicts,
    label_lints,
    share,
    stem,
    verdict_error,
)


def test_stem_and_content_extraction() -> None:
    assert stem("والحكمه") == "حكم"
    assert stem("المؤمنون") == "مؤمن"
    assert "نصح" in content("النصح والإرشاد", "علم")
    # Headword forms should be excluded from content stems
    assert "حكم" not in content("الحكمة: حسن التصرف", "حكم")


def test_share_matches_similar_stems() -> None:
    assert share({"حكم"}, {"حكم"})
    assert share({"تصرف"}, {"تصرفات"})
    assert not share({"سماء"}, {"أرض"})


def test_label_lints() -> None:
    assert label_lints("", "ق", "حكم") == ["label-empty"]
    assert "label-quote" in label_lints("قوله تعالى", "قوله تعالى في سورة", "قول")
    assert "label-cut" in label_lints("واحد اثنان ثلاثة أربعة خمسة ستة", "ق", "عد")


def test_verdict_error_validates_structure() -> None:
    item = {"label": "القرآن", "sense": 1}
    # Valid agree / viewpoint / label / move / drop
    assert (
        verdict_error({"v": "viewpoint", "l": "القرآن", "note": "tafsir difference"}, item, 5)
        is None
    )
    assert (
        verdict_error(
            {"v": "label", "l": "القرآن", "label": "الكتاب", "note": "clearer label"},
            item,
            5,
        )
        is None
    )
    assert (
        verdict_error(
            {"v": "move", "l": "القرآن", "to": 2, "note": "fits sense 2"},
            item,
            5,
        )
        is None
    )

    # Missing or bad fields
    assert verdict_error(None, None, 5) == "no such citation"
    assert verdict_error({"v": "invalid", "l": "القرآن", "note": "x"}, item, 5) is not None
    assert verdict_error({"v": "viewpoint", "l": "خطأ", "note": "x"}, item, 5) is not None
    assert (
        verdict_error({"v": "viewpoint", "l": "القرآن", "note": ""}, item, 5) == "note is required"
    )
    assert verdict_error({"v": "label", "l": "القرآن", "note": "x"}, item, 5) is not None
    assert verdict_error({"v": "move", "l": "القرآن", "to": 1, "note": "x"}, item, 5) is not None
    assert verdict_error({"v": "move", "l": "القرآن", "to": 9, "note": "x"}, item, 5) is not None


def test_label_conflicts_flags_differing_labels_for_same_sense() -> None:
    items = [
        {"key": "1:1:1:حكم", "sense": 1},
        {"key": "1:2:1:حكم", "sense": 1},
    ]
    verdicts = {
        "1:1:1:حكم": {"v": "label", "label": "القرآن"},
        "1:2:1:حكم": {"v": "label", "label": "الكتاب"},
    }
    conflicts = label_conflicts(items, verdicts)
    assert len(conflicts) == 1
    assert "حكم sense 1" in conflicts[0]
