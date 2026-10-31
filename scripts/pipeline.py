"""Shared filesystem anchors and IO for the data pipeline scripts.

Every script writes through these helpers so that output paths, JSON format,
the manifest, and NOTICES.txt stay consistent whichever order scripts run in.
"""

from __future__ import annotations

import gzip
import json
import re
import urllib.request
from collections.abc import Callable
from functools import cache
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "data" / "cache"
OUT = ROOT / "public" / "data" / "quran"
MANIFEST = OUT / "manifest.json"
NOTICES = OUT.parent / "NOTICES.txt"

NOORBAYAN_URL = "https://quranpedia.net/dumps/syntax.json.gz"
TOTAL_VERSES = 6236

RULE = "-" * 60
NOTICES_HEADER = (
    "Lenses data notices\n==================\n\nThis file must stay with the derived data."
)

TASHKEEL = re.compile(r"[ً-ْٰٓ-ٟۖ-ۭ]")


def fetch_cached(
    url: str,
    dest: Path,
    *,
    user_agent: str = "lenses-data-build",
    timeout: int = 180,
    min_size: int = 1,
) -> Path:
    """Download `url` to `dest` once; later runs reuse the cached file."""
    if dest.exists() and dest.stat().st_size >= min_size:
        print(f"cache {dest.name}")
        return dest
    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"get {url}")
    req = urllib.request.Request(url, headers={"User-Agent": user_agent})
    with urllib.request.urlopen(req, timeout=timeout) as resp, dest.open("wb") as out:
        while chunk := resp.read(1 << 20):
            out.write(chunk)
    return dest


def strip_tashkeel(text: str) -> str:
    """Remove vowel and Quranic marks, keeping letter forms."""
    return TASHKEEL.sub("", text)


def surah_path(kind: str, sura: int) -> Path:
    """`public/data/quran/{kind}/{nnn}.json`, the per-surah layout the client loads."""
    return OUT / kind / f"{sura:03d}.json"


def write_json(path: Path, data: Any, *, pretty: bool = False) -> None:
    """Data files are compact; only the hand-read manifest is indented."""
    path.parent.mkdir(parents=True, exist_ok=True)
    if pretty:
        text = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    else:
        text = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    path.write_text(text, encoding="utf-8")


def edit_manifest(edit: Callable[[dict[str, Any]], None], path: Path = MANIFEST) -> None:
    """Read the manifest, let `edit` change only the keys its script owns, write it back."""
    manifest = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
    edit(manifest)
    write_json(path, manifest, pretty=True)


def upsert_source(manifest: dict[str, Any], source: dict[str, Any]) -> None:
    """Replace the source with the same id, or append it."""
    sources: list[dict[str, Any]] = manifest.setdefault("sources", [])
    for index, existing in enumerate(sources):
        if existing.get("id") == source["id"]:
            sources[index] = source
            return
    sources.append(source)


def drop_source(manifest: dict[str, Any], source_id: str) -> None:
    manifest["sources"] = [s for s in manifest.get("sources", []) if s.get("id") != source_id]


def _notice_sections(path: Path) -> list[str]:
    if not path.exists():
        return []
    chunks = re.split(rf"^\s*{RULE}\s*$", path.read_text(encoding="utf-8"), flags=re.M)
    # The first chunk is the file header, rewritten on every save; anything
    # after the header in it is kept as a section of its own.
    head = chunks[0].strip()
    lead = head.removeprefix(NOTICES_HEADER).strip()
    return [chunk.strip() for chunk in [lead, *chunks[1:]] if chunk.strip()]


def _write_notices(sections: list[str], path: Path) -> None:
    body = "".join(f"\n{RULE}\n{section}\n" for section in sections)
    path.write_text(f"{NOTICES_HEADER}\n{body}", encoding="utf-8")


def add_notice(title: str, body: str, path: Path = NOTICES) -> None:
    """Add or replace the NOTICES.txt section whose first line is `title`."""
    section = f"{title}\n{body.strip()}"
    sections = _notice_sections(path)
    for index, existing in enumerate(sections):
        if existing.splitlines()[0] == title:
            sections[index] = section
            break
    else:
        sections.append(section)
    _write_notices(sections, path)


def remove_notice(title: str, path: Path = NOTICES) -> None:
    sections = [s for s in _notice_sections(path) if s.splitlines()[0] != title]
    _write_notices(sections, path)


@cache
def load_noorbayan() -> list[dict[str, Any]]:
    """The NoorBayan treebank dump: one row per ayah, all 6,236 of them."""
    dump = fetch_cached(
        NOORBAYAN_URL,
        CACHE / "syntax.json.gz",
        user_agent="Mozilla/5.0 (compatible; LensesQuran/1.0; +https://github.com/bilalbox/lenses)",
        min_size=1_000_000,
    )
    with gzip.open(dump, "rt", encoding="utf-8") as f:
        rows: list[dict[str, Any]] = json.load(f).get("data", [])
    if len(rows) != TOTAL_VERSES:
        raise ValueError(f"Expected {TOTAL_VERSES} verses in NoorBayan dump, found {len(rows)}")
    return rows


def noorbayan_relation(raw: str) -> str | None:
    """NoorBayan relation onto the corpus codes the client searches and glosses.

    `Subj` → `subj`, `subj<<in>>` / `subj <<kan>>` → `subjx`, `pred<<in>>` → `predx`.
    Tokens outside the dependency structure (`root`, `NonRel`) have no relation.
    """
    rel = raw.lower().replace(" ", "")
    if rel in ("root", "nonrel", ""):
        return None
    if rel.startswith("subj<<"):
        return "subjx"
    if rel.startswith("pred<<"):
        return "predx"
    return rel


def word_relations(rows: list[dict[str, Any]]) -> dict[tuple[int, int, int], list[str]]:
    """(sura, ayah, word) → its tokens' relations, in first-seen order."""
    relations: dict[tuple[int, int, int], list[str]] = {}
    for row in rows:
        for sentence in row.get("syntax", {}).get("sentences", []):
            for word in sentence.get("words", []):
                key = (row["surah"], row["ayah"], word["number"])
                found = relations.setdefault(key, [])
                for token in word.get("tokens", []):
                    rel = noorbayan_relation(token.get("rel", ""))
                    if rel and rel not in found:
                        found.append(rel)
    return relations
