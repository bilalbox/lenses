#!/usr/bin/env python3
"""Compile the full NoorBayan Quranic treebank into lazy-loaded per-surah JSON chunks.

Downloads (cached in data/cache/):
  - Quranpedia syntax dump (MIT, NoorBayan / Quranpedia):
    https://quranpedia.net/dumps/syntax.json.gz

Compiles:
  - public/data/quran/syntax/001.json .. 114.json (100% full-Quran dependency & constituent trees)
  - Updates public/data/quran/manifest.json coverage stats and source attribution
"""

from __future__ import annotations

import argparse
import gzip
import json
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CACHE_DIR = ROOT / "data" / "cache"
DEFAULT_OUT_DIR = ROOT / "public" / "data" / "quran" / "syntax"
DEFAULT_MANIFEST_PATH = ROOT / "public" / "data" / "quran" / "manifest.json"
DEFAULT_NOTICES_PATH = ROOT / "public" / "data" / "NOTICES.txt"

SYNTAX_DUMP_URL = "https://quranpedia.net/dumps/syntax.json.gz"
TOTAL_QURAN_VERSES = 6236
TOTAL_QURAN_SURAHS = 114


def ensure_dump_file(cache_dir: Path) -> Path:
    """Ensure the NoorBayan syntax.json.gz dump is present in the cache directory."""
    cache_dir.mkdir(parents=True, exist_ok=True)
    dump_path = cache_dir / "syntax.json.gz"
    if dump_path.exists() and dump_path.stat().st_size > 1_000_000:
        return dump_path

    print(f"Downloading NoorBayan syntax dump from {SYNTAX_DUMP_URL}...")
    req = urllib.request.Request(
        SYNTAX_DUMP_URL,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; LensesQuran/1.0; +https://github.com/bilalbox/lenses)"
        },
    )
    with urllib.request.urlopen(req) as resp, dump_path.open("wb") as out_f:
        while chunk := resp.read(65536):
            out_f.write(chunk)

    print(f"Downloaded syntax dump to {dump_path} ({dump_path.stat().st_size} bytes).")
    return dump_path


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


def compile_surah_syntax_files(
    dump_path: Path,
    out_dir: Path,
) -> tuple[int, int]:
    """Compile NoorBayan dump into 114 lazy-loaded surah syntax files."""
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"Loading {dump_path}...")
    with gzip.open(dump_path, "rt", encoding="utf-8") as f:
        dump_data = json.load(f)

    raw_rows: list[dict[str, Any]] = dump_data.get("data", [])
    if len(raw_rows) != TOTAL_QURAN_VERSES:
        msg = f"Expected {TOTAL_QURAN_VERSES} verses in dump, found {len(raw_rows)}"
        raise ValueError(msg)

    # Group verses by surah
    surah_map: dict[int, list[dict[str, Any]]] = {s: [] for s in range(1, TOTAL_QURAN_SURAHS + 1)}
    total_sentences = 0

    for row in raw_rows:
        sura_num = row["surah"]
        verse_obj = transform_verse(row)
        total_sentences += len(verse_obj["sentences"])
        surah_map[sura_num].append(verse_obj)

    # Emit each surah file
    for sura_num in range(1, TOTAL_QURAN_SURAHS + 1):
        verses = surah_map[sura_num]
        verses.sort(key=lambda x: x["v"])
        payload = {
            "surah": sura_num,
            "verses": verses,
        }

        out_file = out_dir / f"{sura_num:03d}.json"
        out_file.write_text(
            json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )

    print(
        f"Wrote {TOTAL_QURAN_SURAHS} syntax files to {out_dir} "
        f"({len(raw_rows)} verses, {total_sentences} sentences)."
    )
    return len(raw_rows), total_sentences


def update_manifest(manifest_path: Path, total_verses: int, total_graphs: int) -> None:
    """Update manifest.json with 100% syntax coverage stats and NoorBayan source attribution."""
    if not manifest_path.exists():
        print(f"Warning: Manifest not found at {manifest_path}, skipping update.")
        return

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    # Update units syntax coverage to match verse count
    for unit in manifest.get("units", []):
        unit["syntax"] = unit["verses"]

    # Update stats
    stats = manifest.setdefault("stats", {})
    stats["syntaxVerses"] = total_verses
    stats["syntaxGraphs"] = total_graphs
    stats["partialChapters"] = []
    stats["chaptersWithoutSyntax"] = []

    # Update sources: replace qac-syntax with NoorBayan full-Quran treebank
    sources: list[dict[str, Any]] = manifest.get("sources", [])
    noorbayan_entry = {
        "id": "noorbayan-syntax",
        "title": "The Quranic Treebank (NoorBayan)",
        "kind": "syntax",
        "attribution": (
            "NoorBayan, building on the Quranic Arabic Corpus of Dr. Kais Dukes "
            "(may Allah have mercy on him), verified by Quranpedia"
        ),
        "description": "Full-Quran dependency and constituency treebank covering all 6,236 verses across 114 surahs.",
        "license": "MIT",
        "url": "https://github.com/NoorBayan/Quranic",
    }

    replaced = False
    for i, s in enumerate(sources):
        if s.get("id") in ("qac-syntax", "noorbayan-syntax") or s.get("kind") == "syntax":
            sources[i] = noorbayan_entry
            replaced = True
            break

    if not replaced:
        sources.append(noorbayan_entry)

    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"Updated manifest at {manifest_path} (syntaxVerses: {total_verses}, syntaxGraphs: {total_graphs})."
    )


def update_notices(notices_path: Path) -> None:
    """Append NoorBayan treebank attribution notice to NOTICES.txt if not present."""
    if not notices_path.exists():
        return

    content = notices_path.read_text(encoding="utf-8")
    if "The Quranic Treebank (NoorBayan)" in content:
        return

    notice_block = (
        "\n------------------------------------------------------------\n"
        "The Quranic Treebank (NoorBayan)\n"
        "Project: The Quranic Treebank\n"
        "Authors: NoorBayan, building on the Quranic Arabic Corpus of Dr. Kais Dukes (may Allah have mercy on him)\n"
        "URL: https://github.com/NoorBayan/Quranic\n"
        "Verification & Clean Export: Quranpedia.net (https://quranpedia.net/dumps/syntax.json.gz)\n"
        "License: MIT License\n"
        "Used in Lenses for full-Quran dependency tree graphs and constituent phrase analysis.\n"
    )

    notices_path.write_text(content.rstrip() + "\n" + notice_block, encoding="utf-8")
    print(f"Appended NoorBayan attribution notice to {notices_path}.")


def main() -> None:
    """Main compilation entry point."""
    parser = argparse.ArgumentParser(
        description="Compile NoorBayan Quranic syntax into per-surah JSON chunks."
    )
    parser.add_argument("--cache-dir", type=Path, default=DEFAULT_CACHE_DIR, help="Cache directory")
    parser.add_argument(
        "--out-dir", type=Path, default=DEFAULT_OUT_DIR, help="Output syntax directory"
    )
    parser.add_argument(
        "--manifest", type=Path, default=DEFAULT_MANIFEST_PATH, help="Path to manifest.json"
    )
    parser.add_argument(
        "--notices", type=Path, default=DEFAULT_NOTICES_PATH, help="Path to NOTICES.txt"
    )
    args = parser.parse_args()

    dump_path = ensure_dump_file(args.cache_dir)
    total_verses, total_graphs = compile_surah_syntax_files(dump_path, args.out_dir)
    update_manifest(args.manifest, total_verses, total_graphs)
    update_notices(args.notices)
    print("NoorBayan syntax compilation complete!")


if __name__ == "__main__":
    main()
