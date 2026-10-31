#!/usr/bin/env python3
"""Compile the full NoorBayan Quranic treebank into lazy-loaded per-surah JSON chunks.

Downloads (cached in data/cache/):
  - Quranpedia syntax dump (MIT, NoorBayan / Quranpedia):
    https://quranpedia.net/dumps/syntax.json.gz

Compiles:
  - public/data/quran/syntax/001.json .. 114.json (100% full-Quran dependency & constituent trees)

Coverage stats, the source entry, and the notice are written by build_data.py, which
also reads this dump for each word's relations.
"""

from __future__ import annotations

from typing import Any

from pipeline import load_noorbayan, surah_path, write_json

TOTAL_QURAN_SURAHS = 114


def transform_token(raw_token: dict[str, Any]) -> dict[str, Any]:
    """Transform a raw NoorBayan token into the clean Lenses syntax token format."""
    tok_obj: dict[str, Any] = {
        "tok": raw_token["number"],
        "text": raw_token["text"],
        "pos": raw_token["pos"],
        "rel": raw_token["rel"],
    }

    rel_ar = raw_token.get("rel_ar")
    if rel_ar:
        tok_obj["rel_ar"] = rel_ar

    head = raw_token.get("head")
    if head is not None:
        tok_obj["head"] = [head["surah"], head["ayah"], head["word"], head["token"]]
    else:
        tok_obj["head"] = None

    constituent = raw_token.get("constituent")
    if constituent is not None:
        from_coord = constituent["from"]
        to_coord = constituent["to"]
        tok_obj["const"] = {
            "label": constituent["label"],
            "from": [from_coord["word"], from_coord["token"]],
            "to": [to_coord["word"], to_coord["token"]],
        }

    return tok_obj


def transform_word(raw_word: dict[str, Any]) -> dict[str, Any]:
    """Transform a raw NoorBayan word into the clean Lenses syntax word format."""
    tokens = [transform_token(t) for t in raw_word.get("tokens", [])]
    return {
        "w": raw_word["number"],
        "text": raw_word["text"],
        "tokens": tokens,
    }


def transform_sentence(raw_sentence: dict[str, Any]) -> dict[str, Any]:
    """Transform a raw NoorBayan sentence into the clean Lenses syntax sentence format."""
    words = [transform_word(w) for w in raw_sentence.get("words", [])]
    sent_obj: dict[str, Any] = {
        "id": raw_sentence.get("number", 1),
        "words": words,
    }

    carried = raw_sentence.get("carried")
    if carried:
        sent_obj["carried"] = [
            {
                "s": c["surah"],
                "v": c["ayah"],
                "w": c["word"],
                "text": c["text"],
            }
            for c in carried
        ]

    return sent_obj


def transform_verse(raw_row: dict[str, Any]) -> dict[str, Any]:
    """Transform a raw NoorBayan ayah row into the clean verse syntax object."""
    syntax = raw_row.get("syntax", {})
    sentences = [transform_sentence(s) for s in syntax.get("sentences", [])]
    return {
        "v": raw_row["ayah"],
        "sentences": sentences,
    }


def compile_surah_syntax_files(raw_rows: list[dict[str, Any]]) -> tuple[int, int]:
    """Compile NoorBayan dump rows into 114 lazy-loaded surah syntax files."""
    surah_map: dict[int, list[dict[str, Any]]] = {s: [] for s in range(1, TOTAL_QURAN_SURAHS + 1)}
    total_sentences = 0
    for row in raw_rows:
        verse_obj = transform_verse(row)
        total_sentences += len(verse_obj["sentences"])
        surah_map[row["surah"]].append(verse_obj)

    for sura_num, verses in surah_map.items():
        verses.sort(key=lambda x: x["v"])
        write_json(surah_path("syntax", sura_num), {"surah": sura_num, "verses": verses})

    print(
        f"Wrote {TOTAL_QURAN_SURAHS} syntax files "
        f"({len(raw_rows)} verses, {total_sentences} sentences)."
    )
    return len(raw_rows), total_sentences


def main() -> None:
    compile_surah_syntax_files(load_noorbayan())
    print("NoorBayan syntax compilation complete!")


if __name__ == "__main__":
    main()
