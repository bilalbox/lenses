"""Shared pipeline helpers: relation mapping, notices, manifest edits, JSON output."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from pipeline import (
    NOTICES_HEADER,
    RULE,
    add_notice,
    drop_source,
    edit_manifest,
    fetch_cached,
    noorbayan_relation,
    remove_notice,
    strip_tashkeel,
    surah_path,
    upsert_source,
    word_relations,
    write_json,
)


@pytest.mark.parametrize(
    ("raw", "code"),
    [
        ("Subj", "subj"),
        ("Obj", "obj"),
        ("Poss", "poss"),
        ("gen", "gen"),
        ("subj<<in>>", "subjx"),
        ("subj <<kan>>", "subjx"),
        ("pred<<an>>", "predx"),
        ("pred <<lel>>", "predx"),
        ("Pro", "pro"),
        ("root", None),
        ("NonRel", None),
        ("", None),
    ],
)
def test_noorbayan_relation_maps_onto_corpus_codes(raw: str, code: str | None) -> None:
    assert noorbayan_relation(raw) == code


def test_word_relations_collects_each_words_tokens_once_in_order() -> None:
    rows = [
        {
            "surah": 2,
            "ayah": 31,
            "syntax": {
                "sentences": [
                    {
                        "words": [
                            {"number": 1, "tokens": [{"rel": "NonRel"}, {"rel": "root"}]},
                            {"number": 2, "tokens": [{"rel": "Obj"}]},
                            {
                                "number": 3,
                                "tokens": [{"rel": "Obj"}, {"rel": "Poss"}, {"rel": "obj"}],
                            },
                        ]
                    }
                ]
            },
        }
    ]
    assert word_relations(rows) == {
        (2, 31, 1): [],
        (2, 31, 2): ["obj"],
        (2, 31, 3): ["obj", "poss"],
    }


def test_strip_tashkeel_keeps_letters() -> None:
    assert strip_tashkeel("بِسْمِ ٱللَّهِ") == "بسم ٱلله"


def test_surah_path_is_zero_padded() -> None:
    assert surah_path("syntax", 2).parts[-2:] == ("syntax", "002.json")


def test_write_json_is_compact_unless_pretty(tmp_path: Path) -> None:
    data = {"a": [1, "ب"]}
    write_json(tmp_path / "x" / "data.json", data)
    assert (tmp_path / "x" / "data.json").read_text(encoding="utf-8") == '{"a":[1,"ب"]}'
    write_json(tmp_path / "pretty.json", data, pretty=True)
    assert (tmp_path / "pretty.json").read_text(encoding="utf-8").startswith('{\n  "a"')


def test_edit_manifest_keeps_other_scripts_keys(tmp_path: Path) -> None:
    path = tmp_path / "manifest.json"
    path.write_text(json.dumps({"stats": {"structureBlocks": 9}, "sources": [{"id": "a"}]}))

    def edit(manifest: dict) -> None:
        manifest["stats"]["words"] = 3
        upsert_source(manifest, {"id": "a", "title": "new"})
        upsert_source(manifest, {"id": "b"})

    edit_manifest(edit, path)
    manifest = json.loads(path.read_text())
    assert manifest["stats"] == {"structureBlocks": 9, "words": 3}
    assert manifest["sources"] == [{"id": "a", "title": "new"}, {"id": "b"}]

    edit_manifest(lambda m: drop_source(m, "a"), path)
    assert json.loads(path.read_text())["sources"] == [{"id": "b"}]


def test_add_notice_is_idempotent_and_replaces_by_title(tmp_path: Path) -> None:
    path = tmp_path / "NOTICES.txt"
    add_notice("Source A", "line 1", path)
    add_notice("Source B", "line 2", path)
    add_notice("Source A", "line 1", path)
    once = path.read_text(encoding="utf-8")
    assert once.startswith(NOTICES_HEADER)
    assert once.count("Source A") == 1

    add_notice("Source A", "updated", path)
    text = path.read_text(encoding="utf-8")
    assert "line 1" not in text
    assert text.index("updated") < text.index("Source B")

    remove_notice("Source B", path)
    assert "Source B" not in path.read_text(encoding="utf-8")


def test_add_notice_keeps_text_written_before_the_first_rule(tmp_path: Path) -> None:
    path = tmp_path / "NOTICES.txt"
    path.write_text(f"{NOTICES_HEADER}\n\n# VERBATIM BLOCK\n#  keep me\n\n{RULE}\nOld\nbody\n")
    add_notice("New", "body", path)
    text = path.read_text(encoding="utf-8")
    assert "#  keep me" in text
    assert text.index("# VERBATIM BLOCK") < text.index("Old") < text.index("New")


def test_fetch_cached_reuses_a_cached_file(tmp_path: Path) -> None:
    cached = tmp_path / "file.txt"
    cached.write_text("already here")
    # An unroutable URL proves no request is made.
    assert fetch_cached("http://0.0.0.0:9/never", cached) == cached
